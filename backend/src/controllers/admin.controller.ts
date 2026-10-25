import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { broadcastUserUpdate } from '../services/websocket.service';

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalAdmins, totalMembers, totalTrees, totalPersons, totalLiving, totalDeceased, totalRelationships, totalProUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.familyTree.count(),
      prisma.person.count(),
      prisma.person.count({ where: { isDeceased: false } }),
      prisma.person.count({ where: { isDeceased: true } }),
      prisma.relationship.count(),
      prisma.user.count({ where: { subscriptionTier: 'PRO' } }),
    ]);

    return res.json({
      totalUsers,
      totalAdmins,
      totalMembers,
      totalTrees,
      totalPersons,
      totalLiving,
      totalDeceased,
      totalRelationships,
      totalProUsers,
    });
  } catch (error: any) {
    console.error('Lỗi lấy thống kê admin:', error);
    return res.status(500).json({ error: 'Không thể tải số liệu thống kê hệ thống.' });
  }
};

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        _count: {
          select: { trees: true, collaborations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách user admin:', error);
    return res.status(500).json({ error: 'Không thể tải danh sách người dùng.' });
  }
};

export const updateAdminUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ (phải là ADMIN hoặc MEMBER).' });
    }

    // Nếu hạ quyền từ ADMIN xuống MEMBER, kiểm tra xem có phải admin duy nhất không
    if (role === 'MEMBER') {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (targetUser?.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return res.status(400).json({
            error: 'Hệ thống chỉ còn một Quản trị viên (ADMIN) duy nhất. Không được phép hạ quyền tài khoản này!',
          });
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true },
    });

    return res.json({ message: 'Cập nhật phân quyền thành công!', user: updated });
  } catch (error: any) {
    console.error('Lỗi cập nhật role user:', error);
    return res.status(500).json({ error: 'Không thể cập nhật quyền người dùng.' });
  }
};

import bcrypt from 'bcryptjs';

export const createAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
    const userDisplayName = (fullName && fullName.trim()) ? fullName.trim() : email.split('@')[0];

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: userDisplayName,
        role: userRole,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // Tạo sẵn một Cây gia phả mặc định cho người dùng mới
    await prisma.familyTree.create({
      data: {
        name: `Gia phả Dòng họ ${userDisplayName}`,
        description: `Cây gia phả khởi tạo bởi Quản trị viên cho ${userDisplayName}`,
        branchName: 'Chi Trưởng',
        ownerId: newUser.id,
      },
    });

    return res.status(201).json({ message: 'Tạo tài khoản người dùng thành công!', user: newUser });
  } catch (error: any) {
    console.error('Lỗi tạo người dùng admin:', error);
    return res.status(500).json({ error: 'Không thể tạo tài khoản người dùng.' });
  }
};

export const updateAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, role, password } = req.body;

    const dataToUpdate: any = {};
    if (fullName !== undefined) dataToUpdate.fullName = fullName.trim();
    if (role && ['ADMIN', 'MEMBER'].includes(role)) dataToUpdate.role = role;
    if (password && password.trim().length >= 6) {
      dataToUpdate.passwordHash = bcrypt.hashSync(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json({ message: 'Cập nhật thông tin tài khoản thành công!', user: updated });
  } catch (error: any) {
    console.error('Lỗi cập nhật người dùng:', error);
    return res.status(500).json({ error: 'Không thể cập nhật thông tin người dùng.' });
  }
};

export const deleteAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.user?.userId;

    if (currentAdminId === id) {
      return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của chính mình!' });
    }

    // Kiểm tra nếu tài khoản bị xóa là ADMIN, hệ thống phải còn ít nhất một admin khác
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Hệ thống chỉ còn một Quản trị viên (ADMIN) duy nhất. Không được phép xóa tài khoản này để đảm bảo an toàn vận hành!',
        });
      }
    }

    // Xóa cascade: Xóa các relationships, persons, trees thuộc sở hữu của user trước
    const userTrees = await prisma.familyTree.findMany({ where: { ownerId: id }, select: { id: true } });
    const treeIds = userTrees.map(t => t.id);

    if (treeIds.length > 0) {
      await prisma.relationship.deleteMany({ where: { treeId: { in: treeIds } } });
      await prisma.person.deleteMany({ where: { treeId: { in: treeIds } } });
      await prisma.familyTree.deleteMany({ where: { id: { in: treeIds } } });
    }

    await prisma.user.delete({ where: { id } });

    return res.json({ message: 'Đã xóa tài khoản người dùng thành công!' });
  } catch (error: any) {
    console.error('Lỗi xóa người dùng:', error);
    return res.status(500).json({ error: 'Không thể xóa tài khoản người dùng.' });
  }
};

export const getAdminTrees = async (req: AuthRequest, res: Response) => {
  try {
    const trees = await prisma.familyTree.findMany({
      include: {
        owner: {
          select: { id: true, email: true, fullName: true },
        },
        _count: {
          select: { members: true, relationships: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(trees);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách cây gia phả admin:', error);
    return res.status(500).json({ error: 'Không thể tải danh sách gia phả.' });
  }
};

/**
 * Quản trị viên cập nhật gói hội viên (PRO / FREE) và hạn dùng cho bất kỳ người dùng nào
 */
export const updateAdminUserSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tier, durationDays, expiresAt } = req.body;

    if (!['FREE', 'PRO'].includes(tier)) {
      return res.status(400).json({ error: 'Gói không hợp lệ (phải là FREE hoặc PRO).' });
    }

    let calculatedExpiresAt: Date | null = null;
    if (tier === 'PRO') {
      if (expiresAt) {
        calculatedExpiresAt = new Date(expiresAt);
      } else if (durationDays) {
        calculatedExpiresAt = new Date();
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + Number(durationDays));
      } else {
        // Mặc định 30 ngày nếu không chỉ định
        calculatedExpiresAt = new Date();
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + 30);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt: calculatedExpiresAt,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    broadcastUserUpdate(id, { action: 'SUBSCRIPTION_UPDATED', tier });

    return res.json({
      message:
        tier === 'PRO'
          ? `Đã kích hoạt gói PRO cho tài khoản ${updated.fullName || updated.email} thành công!`
          : `Đã chuyển tài khoản ${updated.fullName || updated.email} về gói FREE thành công!`,
      user: updated,
    });
  } catch (error: any) {
    console.error('Lỗi cập nhật subscription admin:', error);
    return res.status(500).json({ error: error?.message || 'Không thể cập nhật gói hội viên.' });
  }
};
