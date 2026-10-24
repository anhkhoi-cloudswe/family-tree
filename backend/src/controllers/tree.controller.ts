import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTrees = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';

    const trees = await prisma.familyTree.findMany({
      where: isSuperAdmin ? {} : { ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        branchName: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(trees);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách cây gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

export const getTreeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tree = await prisma.familyTree.findUnique({
      where: { id },
      include: {
        members: true,
        relationships: true,
      },
    });

    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });
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
                data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: p, childId: id2 },
              });
              tree.relationships.push(created);
              parentChildRels.push(created);
            } catch (e) {
              // Ignore if already created concurrently
            }
          }
        }

        for (const p of parents2) {
          if (!parents1.includes(p)) {
            try {
              const created = await prisma.relationship.create({
                data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: p, childId: id1 },
              });
              tree.relationships.push(created);
              parentChildRels.push(created);
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    }

    // Sắp xếp các thành viên theo thế hệ và ngày sinh trực tiếp trong bộ nhớ
    if (tree.members && tree.members.length > 0) {
      tree.members.sort((a, b) => {
        if (a.generation !== b.generation) return a.generation - b.generation;
        if (a.birthDate && b.birthDate) {
          return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
        }
        return 0;
      });
    }

    return res.json(tree);
  } catch (error: any) {
    console.error('Lỗi chi tiết cây gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

export const createTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Chưa xác thực.' });

    const { name, description, branchName, ancestorInfo } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên gia phả.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userDisplayName = user?.fullName || user?.email?.split('@')[0] || 'Tôi';

    const tree = await prisma.familyTree.create({
      data: {
        name,
        description,
        branchName,
        ancestorInfo,
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
    const { name, description, branchName, ancestorInfo } = req.body;

    const updated = await prisma.familyTree.update({
      where: { id },
      data: {
        name,
        description,
        branchName,
        ancestorInfo,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Lỗi cập nhật cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};

export const deleteTree = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.familyTree.delete({ where: { id } });
    return res.json({ message: 'Đã xóa cây gia phả thành công.' });
  } catch (error) {
    console.error('Lỗi xóa cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};
