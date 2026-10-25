import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Gửi lời mời chia sẻ cây gia phả qua Số Điện Thoại
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

    const cleanPhone = phone.trim();

    // 1. Kiểm tra quyền sở hữu cây của người gửi (chỉ OWNER mới được mời)
    const tree = await prisma.familyTree.findFirst({
      where: { id: treeId, ownerId: userId },
    });

    if (!tree && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ chủ sở hữu cây gia phả mới có quyền mời người khác.' });
    }

    // 2. Tìm người dùng nhận theo Số Điện Thoại
    const receiver = await prisma.user.findFirst({
      where: { phone: cleanPhone },
      select: { id: true, fullName: true, phone: true, email: true },
    });

    if (!receiver) {
      return res.status(404).json({
        error: `Không tìm thấy tài khoản nào với số điện thoại ${cleanPhone}. Hãy nhắc người thân đăng ký tài khoản Famlykin trước nhé.`,
      });
    }

    // 3. Không thể tự mời chính mình
    if (receiver.id === userId) {
      return res.status(400).json({ error: 'Bạn không thể tự gửi lời mời cho chính mình.' });
    }

    // 4. Kiểm tra xem người này đã là cộng tác viên chưa
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

    // 5. Kiểm tra lời mời PENDING hiện có
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
          role: role === 'EDITOR' ? 'EDITOR' : 'VIEWER',
          message: message ? message.trim() : existingPending.message,
        },
      });
      return res.json({
        message: `Đã cập nhật lời mời gửi tới ${receiver.fullName}.`,
        invitation: updated,
      });
    }

    // 6. Tạo mới lời mời
    const invitation = await prisma.treeInvitation.create({
      data: {
        treeId,
        inviterId: userId,
        receiverId: receiver.id,
        role: role === 'EDITOR' ? 'EDITOR' : 'VIEWER',
        status: 'PENDING',
        message: message ? message.trim() : null,
      },
      include: {
        receiver: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });

    return res.status(201).json({
      message: `Đã gửi lời mời tham gia cây gia phả đến ${receiver.fullName} thành công!`,
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

    return res.json(collaborators);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách thành viên chia sẻ:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Thu hồi quyền chia sẻ của một thành viên (Chỉ chủ cây mới có quyền)
 */
export const removeCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { treeId, collaboratorUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const tree = await prisma.familyTree.findFirst({
      where: { id: treeId, ownerId: userId },
    });

    if (!tree && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ chủ sở hữu cây mới có quyền hủy quyền truy cập.' });
    }

    await prisma.treeCollaborator.deleteMany({
      where: {
        treeId,
        userId: collaboratorUserId,
      },
    });

    return res.json({ message: 'Đã thu hồi quyền chia sẻ thành công.' });
  } catch (error: any) {
    console.error('Lỗi thu hồi quyền chia sẻ:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};
