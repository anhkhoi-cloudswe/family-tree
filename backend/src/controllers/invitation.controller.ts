import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Kiểm tra xem user có phải là Chủ nhánh (Owner) của cây không
 * Bao gồm:
 * 1. Chủ gốc (tree.ownerId === userId)
 * 2. Đồng chủ nhánh (TreeCollaborator có role === 'OWNER')
 * 3. Quản trị viên hệ thống (role === 'ADMIN')
 */
export const checkIsBranchOwner = async (treeId: string, userId: string, userRole?: string): Promise<boolean> => {
  if (userRole === 'ADMIN') return true;
  const tree = await prisma.familyTree.findUnique({
    where: { id: treeId },
    select: { ownerId: true },
  });
  if (!tree) return false;
  if (tree.ownerId === userId) return true;

  const collab = await prisma.treeCollaborator.findFirst({
    where: { treeId, userId, role: 'OWNER' },
  });
  return Boolean(collab);
};

/**
 * Gửi lời mời chia sẻ cây gia phả qua Số Điện Thoại
 * Hỗ trợ các vai trò: VIEWER (Chỉ xem), EDITOR (Chỉnh sửa), OWNER (Đồng chủ nhánh - Tối đa 2 người)
 */
export const sendInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const { treeId, phone, role = 'VIEWER', message } = req.body;

    if (!treeId || !phone) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã cây gia phả và số điện thoại người nhận.' });
    }

    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, '');

    // 1. Kiểm tra quyền chủ nhánh của người gửi (Chủ gốc hoặc Đồng chủ nhánh)
    const isOwner = await checkIsBranchOwner(treeId, userId, req.user?.role);
    if (!isOwner) {
      return res.status(403).json({ error: 'Chỉ Chủ nhánh mới có quyền mời người thân và phân quyền.' });
    }

    // 2. Nếu mời với quyền OWNER: kiểm tra tối đa 2 chủ nhánh
    if (role === 'OWNER') {
      const coOwnersCount = await prisma.treeCollaborator.count({
        where: { treeId, role: 'OWNER' },
      });
      // 1 chủ gốc + coOwnersCount
      if (1 + coOwnersCount >= 2) {
        return res.status(400).json({
          error: 'Cây gia phả này đã có tối đa 2 người làm Chủ nhánh (1 chủ gốc và 1 đồng chủ nhánh). Bạn cần hạ quyền chủ nhánh hiện tại trước khi phân quyền mới.',
        });
      }
    }

    // 3. Tìm người dùng nhận theo Số Điện Thoại (hỗ trợ cả chuẩn 0xxx và +84xxx)
    const normalizedPhone = cleanPhone.startsWith('+84')
      ? '0' + cleanPhone.slice(3)
      : cleanPhone.startsWith('84') && cleanPhone.length === 11
      ? '0' + cleanPhone.slice(2)
      : cleanPhone;
    const e164Phone = '+84' + normalizedPhone.slice(1);

    const receiver = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: normalizedPhone },
          { phone: e164Phone },
        ],
      },
      select: { id: true, fullName: true, phone: true, email: true },
    });

    if (!receiver) {
      return res.status(404).json({
        error: `Không tìm thấy tài khoản nào với số điện thoại "${cleanPhone}". Người nhận cần tạo tài khoản và cập nhật số điện thoại này trong hồ sơ cá nhân trước.`,
      });
    }

    // 4. Không thể tự mời chính mình
    if (receiver.id === userId) {
      return res.status(400).json({ error: 'Bạn không thể tự gửi lời mời cho chính mình.' });
    }

    // 5. Kiểm tra xem người này đã là cộng tác viên chưa
    const existingCollab = await prisma.treeCollaborator.findUnique({
      where: {
        treeId_userId: { treeId, userId: receiver.id },
      },
    });

    if (existingCollab) {
      return res.status(400).json({
        error: `${receiver.fullName} (${cleanPhone}) đã là thành viên trong cây gia phả này rồi.`,
      });
    }

    const targetRole = role === 'OWNER' ? 'OWNER' : role === 'EDITOR' ? 'EDITOR' : 'VIEWER';

    // 6. Kiểm tra lời mời PENDING hiện có
    const existingPending = await prisma.treeInvitation.findFirst({
      where: {
        treeId,
        receiverId: receiver.id,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      // Cập nhật lại quyền hoặc lời nhắn nếu đã gửi trước đó
      const updated = await prisma.treeInvitation.update({
        where: { id: existingPending.id },
        data: {
          role: targetRole,
          message: message ? message.trim() : existingPending.message,
        },
      });
      return res.json({
        message: `Đã cập nhật lời mời gửi tới ${receiver.fullName}.`,
        invitation: updated,
      });
    }

    // 7. Tạo mới lời mời
    const invitation = await prisma.treeInvitation.create({
      data: {
        treeId,
        inviterId: userId,
        receiverId: receiver.id,
        role: targetRole,
        status: 'PENDING',
        message: message ? message.trim() : null,
      },
      include: {
        receiver: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });

    const roleName = targetRole === 'OWNER' ? 'Đồng chủ nhánh' : targetRole === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem';
    return res.status(201).json({
      message: `Đã gửi lời mời (${roleName}) tới ${receiver.fullName} thành công!`,
      invitation,
    });
  } catch (error: any) {
    console.error('Lỗi gửi lời mời gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Lấy danh sách các lời mời đang chờ (PENDING) của người dùng hiện tại
 */
export const getPendingInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const invitations = await prisma.treeInvitation.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        tree: {
          select: {
            id: true,
            name: true,
            branchName: true,
            description: true,
          },
        },
        inviter: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(invitations);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách lời mời:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Chấp nhận lời mời tham gia cây gia phả
 */
export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { personId } = req.body; // Tùy chọn: Node người thân đại diện cho user

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const invitation = await prisma.treeInvitation.findFirst({
      where: {
        id,
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        tree: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời hoặc lời mời đã hết hạn.' });
    }

    // Tự động tìm node người thân trong cây nếu chưa truyền personId
    let targetPersonId = personId || null;
    if (!targetPersonId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const matched = await prisma.person.findFirst({
          where: {
            treeId: invitation.treeId,
            OR: [
              ...(user.phone ? [{ phone: user.phone }] : []),
              { fullName: { equals: user.fullName, mode: 'insensitive' } },
            ],
          },
        });
        if (matched) {
          targetPersonId = matched.id;
        }
      }
    }

    // Thêm vào bảng TreeCollaborator
    const collaborator = await prisma.treeCollaborator.upsert({
      where: {
        treeId_userId: {
          treeId: invitation.treeId,
          userId,
        },
      },
      update: {
        role: invitation.role,
        personId: targetPersonId,
      },
      create: {
        treeId: invitation.treeId,
        userId,
        role: invitation.role,
        personId: targetPersonId,
      },
    });

    // Cập nhật trạng thái lời mời sang ACCEPTED
    await prisma.treeInvitation.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    return res.json({
      message: `Bạn đã tham gia thành công vào ${invitation.tree.name}!`,
      treeId: invitation.treeId,
      collaborator,
    });
  } catch (error: any) {
    console.error('Lỗi chấp nhận lời mời:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Từ chối lời mời tham gia cây gia phả
 */
export const declineInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const invitation = await prisma.treeInvitation.findFirst({
      where: {
        id,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời.' });
    }

    await prisma.treeInvitation.update({
      where: { id },
      data: { status: 'DECLINED' },
    });

    return res.json({ message: 'Đã từ chối lời mời tham gia cây gia phả.' });
  } catch (error: any) {
    console.error('Lỗi từ chối lời mời:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Lấy danh sách thành viên được chia sẻ của một cây gia phả
 */
export const getTreeCollaborators = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { treeId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const tree = await prisma.familyTree.findUnique({
      where: { id: treeId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });
    }

    const collaborators = await prisma.treeCollaborator.findMany({
      where: { treeId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const pendingInvitations = await prisma.treeInvitation.findMany({
      where: { treeId, status: 'PENDING' },
      include: {
        receiver: {
          select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Tính tổng số chủ nhánh hiện tại (1 chủ gốc + các đồng chủ nhánh)
    const coOwnersCount = collaborators.filter((c) => c.role === 'OWNER').length;
    const totalOwnersCount = 1 + coOwnersCount;

    return res.json({
      treeOwner: tree.owner,
      collaborators,
      pendingInvitations,
      totalOwnersCount,
      maxOwners: 2,
    });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách thành viên chia sẻ:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Cập nhật vai trò thành viên đã chia sẻ (Chỉ xem, Chỉnh sửa, Chủ nhánh)
 * Tối đa 2 người làm Chủ nhánh (1 chủ gốc + 1 đồng chủ nhánh)
 */
export const updateCollaboratorRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { treeId, collaboratorUserId } = req.params;
    const { role } = req.body; // 'VIEWER' | 'EDITOR' | 'OWNER'

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const isOwner = await checkIsBranchOwner(treeId, userId, req.user?.role);
    if (!isOwner) {
      return res.status(403).json({ error: 'Chỉ Chủ nhánh mới có quyền thay đổi vai trò của thành viên.' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });
    }

    if (collaboratorUserId === tree.ownerId) {
      return res.status(400).json({ error: 'Không thể thay đổi vai trò của Chủ nhánh sáng lập.' });
    }

    if (role === 'OWNER') {
      const coOwnersCount = await prisma.treeCollaborator.count({
        where: {
          treeId,
          role: 'OWNER',
          NOT: { userId: collaboratorUserId },
        },
      });
      // 1 chủ gốc + coOwnersCount
      if (1 + coOwnersCount >= 2) {
        return res.status(400).json({
          error: 'Cây gia phả này đã có tối đa 2 người làm Chủ nhánh. Vui lòng hạ quyền chủ nhánh hiện tại trước khi phân quyền.',
        });
      }
    }

    const targetRole = role === 'OWNER' ? 'OWNER' : role === 'EDITOR' ? 'EDITOR' : 'VIEWER';

    const updated = await prisma.treeCollaborator.update({
      where: {
        treeId_userId: { treeId, userId: collaboratorUserId },
      },
      data: {
        role: targetRole,
      },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true },
        },
      },
    });

    const roleLabel = targetRole === 'OWNER' ? 'Chủ nhánh' : targetRole === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem';
    return res.json({
      message: `Đã cập nhật quyền của ${updated.user.fullName} thành "${roleLabel}".`,
      collaborator: updated,
    });
  } catch (error: any) {
    console.error('Lỗi updateCollaboratorRole:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Thu hồi quyền chia sẻ của một thành viên (Đuổi khỏi cây)
 */
export const removeCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { treeId, collaboratorUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const tree = await prisma.familyTree.findUnique({
      where: { id: treeId },
    });

    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });
    }

    if (collaboratorUserId === tree.ownerId) {
      return res.status(400).json({ error: 'Không thể xóa Chủ nhánh sáng lập khỏi cây gia phả.' });
    }

    const isOwner = await checkIsBranchOwner(treeId, userId, req.user?.role);
    if (!isOwner && userId !== collaboratorUserId) {
      return res.status(403).json({ error: 'Chỉ Chủ nhánh mới có quyền xóa thành viên khỏi cây.' });
    }

    await prisma.treeCollaborator.deleteMany({
      where: {
        treeId,
        userId: collaboratorUserId,
      },
    });

    return res.json({ message: 'Đã xóa thành viên khỏi cây gia phả thành công.' });
  } catch (error: any) {
    console.error('Lỗi thu hồi quyền chia sẻ:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Hủy lời mời đang chờ phản hồi
 */
export const cancelInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const invitation = await prisma.treeInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời.' });
    }

    const isOwner = await checkIsBranchOwner(invitation.treeId, userId, req.user?.role);
    if (!isOwner && invitation.inviterId !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy lời mời này.' });
    }

    await prisma.treeInvitation.delete({
      where: { id },
    });

    return res.json({ message: 'Đã hủy lời mời thành công.' });
  } catch (error: any) {
    console.error('Lỗi cancelInvitation:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};
