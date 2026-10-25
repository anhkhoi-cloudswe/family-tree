import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { broadcastUserUpdate } from '../services/websocket.service';

/**
 * Kiểm tra trạng thái gói hội viên của người dùng hiện tại
 */
export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

    const now = new Date();
    const isExpired = Boolean(
      user.subscriptionTier === 'PRO' &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) < now
    );

    const activeTier = isExpired ? 'FREE' : user.subscriptionTier || 'FREE';

    // Đếm tổng số nhánh: tự tạo + được mời tham gia
    const ownedCount = await prisma.familyTree.count({ where: { ownerId: userId } });
    const joinedCount = await prisma.treeCollaborator.count({ where: { userId } });
    const totalBranches = ownedCount + joinedCount;

    const maxFreeBranches = 5;
    const isLimitReached = activeTier !== 'PRO' && totalBranches >= maxFreeBranches;
    const lockedBranchesCount = activeTier !== 'PRO' ? Math.max(0, totalBranches - maxFreeBranches) : 0;

    return res.json({
      tier: activeTier,
      rawTier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt,
      isExpired,
      totalBranches,
      ownedCount,
      joinedCount,
      maxFreeBranches,
      isLimitReached,
      canCreateMore: activeTier === 'PRO' || totalBranches < maxFreeBranches,
      lockedBranchesCount,
    });
  } catch (error: any) {
    console.error('Lỗi lấy trạng thái subscription:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Nâng cấp gói PRO (hoặc mô phỏng thanh toán / dùng thử)
 */
export const upgradeSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const { durationDays = 30 } = req.body;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(durationDays));

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'PRO',
        subscriptionExpiresAt: expiresAt,
      },
      select: {
        id: true,
        fullName: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    broadcastUserUpdate(userId, { action: 'SUBSCRIPTION_UPDATED', tier: 'PRO' });

    return res.json({
      message: `Chúc mừng bạn đã nâng cấp thành công gói PRO VIP (${durationDays} ngày)!`,
      subscription: updated,
    });
  } catch (error: any) {
    console.error('Lỗi nâng cấp subscription:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Mô phỏng hết hạn gói PRO để kiểm thử tính năng khóa nhánh thứ 6 trở đi
 */
export const simulateExpiry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Đã hết hạn ngày hôm qua

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: pastDate,
      },
      select: {
        id: true,
        fullName: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    broadcastUserUpdate(userId, { action: 'SUBSCRIPTION_EXPIRED' });

    return res.json({
      message: 'Đã chuyển tài khoản về gói Miễn Phí (hết hạn PRO) để kiểm thử khóa nhánh.',
      subscription: updated,
    });
  } catch (error: any) {
    console.error('Lỗi simulateExpiry:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};
