import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { broadcastTreeUpdate } from '../services/websocket.service';

/**
 * Kiểm tra xem một cây gia phả có bị khóa đối với người dùng không (vượt quá 5 nhánh miễn phí)
 */
async function checkIsTreeLockedForUser(treeId: string, userId: string, isSuperAdmin: boolean): Promise<boolean> {
  if (isSuperAdmin) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });
  if (!user) return false;

  const now = new Date();
  const isPro = user.subscriptionTier === 'PRO' && (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) >= now);
  if (isPro) return false;

  // Lấy tất cả các cây mà user có quyền truy cập, sắp xếp theo createdAt tăng dần (5 cây đầu là miễn phí)
  const allTrees = await prisma.familyTree.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { collaborators: { some: { userId } } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const unlockedTreeIds = allTrees.slice(0, 5).map((t) => t.id);
  return !unlockedTreeIds.includes(treeId);
}

export const getTrees = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';

    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionExpiresAt: true },
    });

    const now = new Date();
    const isPro = isSuperAdmin || (user?.subscriptionTier === 'PRO' && (!user?.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) >= now));

    const trees = await prisma.familyTree.findMany({
      where: isSuperAdmin
        ? {}
        : {
            OR: [
              { ownerId: userId },
              { collaborators: { some: { userId } } },
            ],
          },
      include: {
        owner: {
          select: { id: true, fullName: true, phone: true },
        },
        _count: {
          select: { members: true },
        },
        collaborators: {
          where: userId ? { userId } : undefined,
          select: { role: true, personId: true },
        },
      },
      orderBy: { createdAt: 'asc' }, // Sắp xếp theo thứ tự tạo để 5 cây đầu tiên luôn là 5 cây miễn phí
    });

    const formatted = trees.map((t, index) => {
      let userRole = 'VIEWER';
      let linkedPersonId: string | null = null;
      if (t.ownerId === userId || isSuperAdmin) {
        userRole = 'OWNER';
      } else if (t.collaborators && t.collaborators.length > 0) {
        userRole = t.collaborators[0].role;
        linkedPersonId = t.collaborators[0].personId;
      }

      // 5 cây đầu tiên (index < 5) luôn mở khóa miễn phí. Từ cây thứ 6 trở đi sẽ bị khóa nếu không có PRO
      const isLocked = !isPro && index >= 5;

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        branchName: t.branchName,
        ownerId: t.ownerId,
        owner: t.owner,
        membersCount: t._count?.members || 0,
        userRole,
        linkedPersonId,
        isLocked,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    // Trả về danh sách cây (đảo ngược lại để cây mới nhất lên trên nhưng vẫn giữ cờ isLocked chuẩn)
    return res.json(formatted.reverse());
  } catch (error: any) {
    console.error('Lỗi lấy danh sách cây gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

export const getTreeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';

    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const tree = await prisma.familyTree.findUnique({
      where: { id },
      include: {
        members: true,
        relationships: true,
        collaborators: {
          where: userId ? { userId } : undefined,
          select: { role: true, personId: true },
        },
      },
    });

    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });
    }

    let userRole = 'VIEWER';
    let linkedPersonId: string | null = null;
    if (tree.ownerId === userId || isSuperAdmin) {
      userRole = 'OWNER';
    } else if (tree.collaborators && tree.collaborators.length > 0) {
      userRole = tree.collaborators[0].role;
      linkedPersonId = tree.collaborators[0].personId;
    } else {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập cây gia phả này.' });
    }

    // Kiểm tra nếu cây đang bị khóa đối với người dùng này (vượt quá 5 nhánh miễn phí)
    const isLocked = await checkIsTreeLockedForUser(id, userId, isSuperAdmin);
    if (isLocked) {
      return res.status(403).json({
        error: 'Nhánh cây này đang bị tạm khóa do tài khoản của bạn ở gói Miễn Phí và vượt quá 5 nhánh. Vui lòng nâng cấp gói PRO để mở khóa!',
        isLocked: true,
        tree: {
          id: tree.id,
          name: tree.name,
          isLocked: true,
        },
      });
    }

    // Tự động kiểm tra và đồng bộ liên kết PARENT_CHILD còn thiếu giữa các anh chị em ruột
    if (tree.relationships && tree.relationships.length > 0) {
      const siblingRels = tree.relationships.filter((r) => r.type === 'SIBLING');
      const parentChildRels = tree.relationships.filter((r) => r.type === 'PARENT_CHILD');

      for (const sib of siblingRels) {
        const id1 = sib.spouse1Id;
        const id2 = sib.spouse2Id;
        if (!id1 || !id2) continue;

        const parents1 = parentChildRels
          .filter((r) => r.childId === id1 && r.parentId)
          .map((r) => r.parentId as string);
        const parents2 = parentChildRels
          .filter((r) => r.childId === id2 && r.parentId)
          .map((r) => r.parentId as string);

        for (const p of parents1) {
          if (!parents2.includes(p)) {
            try {
              const created = await prisma.relationship.create({
                data: {
                  treeId: tree.id,
                  type: 'PARENT_CHILD',
                  parentId: p,
                  childId: id2,
                },
              });
              tree.relationships.push(created);
            } catch (syncErr) {
              // Bỏ qua lỗi trùng lặp quan hệ
            }
          }
        }

        for (const p of parents2) {
          if (!parents1.includes(p)) {
            try {
              const created = await prisma.relationship.create({
                data: {
                  treeId: tree.id,
                  type: 'PARENT_CHILD',
                  parentId: p,
                  childId: id1,
                },
              });
              tree.relationships.push(created);
            } catch (syncErr) {
              // Bỏ qua lỗi trùng lặp quan hệ
            }
          }
        }
      }
    }

    // Sắp xếp các thành viên theo thế hệ (từ nhỏ đến lớn: 1 -> 2 -> 3)
    if (tree.members && tree.members.length > 0) {
      tree.members.sort((a, b) => {
        if (a.generation !== b.generation) return a.generation - b.generation;
        if (a.birthDate && b.birthDate) {
          return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
        }
        return 0;
      });
    }

    return res.json({
      ...tree,
      userRole,
      linkedPersonId,
      isLocked: false,
    });
  } catch (error: any) {
    console.error('Lỗi chi tiết cây gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

export const createTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';

    if (!userId) return res.status(401).json({ error: 'Chưa xác thực.' });

    const { name, description, branchName, ancestorInfo } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên gia phả.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true, subscriptionTier: true, subscriptionExpiresAt: true },
    });

    // Kiểm tra giới hạn 5 nhánh cho người dùng gói FREE
    const now = new Date();
    const isPro = isSuperAdmin || (user?.subscriptionTier === 'PRO' && (!user?.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) >= now));

    if (!isPro) {
      const ownedCount = await prisma.familyTree.count({ where: { ownerId: userId } });
      const joinedCount = await prisma.treeCollaborator.count({ where: { userId } });
      if (ownedCount + joinedCount >= 5) {
        return res.status(403).json({
          error: 'Bạn đã đạt giới hạn tối đa 5 nhánh cây gia phả của gói Miễn Phí. Vui lòng nâng cấp lên gói PRO để tạo thêm không giới hạn!',
          code: 'FREE_LIMIT_REACHED',
        });
      }
    }

    const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'Tôi';

    const tree = await prisma.familyTree.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        branchName: branchName ? branchName.trim() : null,
        ancestorInfo: ancestorInfo ? ancestorInfo.trim() : null,
        ownerId: userId,
      },
    });

    const rootMember = await prisma.person.create({
      data: {
        treeId: tree.id,
        fullName: userDisplayName,
        nickname: 'Tôi',
        gender: 'MALE',
        generation: 1,
        biography: 'Thành viên đầu tiên (Tôi) khởi tạo cây gia phả số.',
      },
    });

    broadcastTreeUpdate(tree.id, { action: 'TREE_CREATED', treeId: tree.id });

    return res.status(201).json({
      ...tree,
      members: [rootMember],
    });
  } catch (error) {
    console.error('Lỗi tạo cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};

export const updateTree = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';

    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const tree = await prisma.familyTree.findUnique({
      where: { id },
      include: {
        collaborators: {
          where: { userId, role: 'OWNER' },
        },
      },
    });

    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });
    }

    const isOwner = tree.ownerId === userId || tree.collaborators.length > 0 || isSuperAdmin;
    if (!isOwner) {
      return res.status(403).json({ error: 'Chỉ Chủ nhánh mới có quyền đổi tên hoặc cập nhật thông tin nhánh cây.' });
    }

    const { name, description, branchName, ancestorInfo } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên cây gia phả không được để trống.' });
    }

    const updated = await prisma.familyTree.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        branchName: branchName !== undefined ? (branchName ? branchName.trim() : null) : undefined,
        ancestorInfo: ancestorInfo !== undefined ? ancestorInfo : undefined,
      },
    });

    broadcastTreeUpdate(id, { action: 'TREE_UPDATED', name: updated.name });

    return res.json(updated);
  } catch (error: any) {
    console.error('Lỗi cập nhật cây gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

export const deleteTree = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';

    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const tree = await prisma.familyTree.findUnique({ where: { id } });
    if (!tree) return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });

    const isOwner = tree.ownerId === userId || isSuperAdmin;
    if (!isOwner) {
      return res.status(403).json({ error: 'Chỉ Chủ sáng lập mới có quyền xóa nhánh cây này.' });
    }

    await prisma.familyTree.delete({ where: { id } });
    broadcastTreeUpdate(id, { action: 'TREE_DELETED' });

    return res.json({ message: 'Đã xóa cây gia phả thành công.' });
  } catch (error: any) {
    console.error('Lỗi xóa cây gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};
