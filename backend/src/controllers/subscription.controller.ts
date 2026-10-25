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
      message: `Chúc mừng bạn đã nâng cấp thành công gói PRO (${durationDays} ngày)!`,
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

// ================= PAYOS INTEGRATION =================
import { getPayOS, isPayOSConfigured } from '../services/payos.service';

interface PendingPayOSOrder {
  orderCode: number;
  userId: string;
  plan: 'MONTHLY' | 'YEARLY';
  durationDays: number;
  amount: number;
  createdAt: number;
  isPaid?: boolean;
}

const pendingPayOSOrders = new Map<number, PendingPayOSOrder>();

export const getPayOSConfigStatus = async (req: AuthRequest, res: Response) => {
  return res.json({
    isConfigured: isPayOSConfigured(),
  });
};

export const createPayOSPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập.' });

    const { plan = 'YEARLY' } = req.body;
    const isYearly = plan === 'YEARLY';
    const amount = isYearly ? 399000 : 49000;
    const durationDays = isYearly ? 365 : 30;

    const payOS = getPayOS();
    if (!payOS || !isPayOSConfigured()) {
      return res.status(400).json({
        isConfigured: false,
        error:
          'Chưa cấu hình API PayOS trong file .env (Cần PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY). Bạn có thể kích hoạt thử nghiệm bên dưới.',
      });
    }

    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 899 + 100));
    const description = `PRO ${isYearly ? '1 NAM' : '1 THANG'}`;

    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const returnUrl = `${clientUrl}/?payment=success&orderCode=${orderCode}`;
    const cancelUrl = `${clientUrl}/?payment=cancel`;

    const paymentLinkRes = await payOS.paymentRequests.create({
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
    });

    pendingPayOSOrders.set(orderCode, {
      orderCode,
      userId,
      plan: isYearly ? 'YEARLY' : 'MONTHLY',
      durationDays,
      amount,
      createdAt: Date.now(),
      isPaid: false,
    });

    return res.json({
      isConfigured: true,
      checkoutUrl: paymentLinkRes.checkoutUrl,
      orderCode,
      amount,
    });
  } catch (err: any) {
    console.error('Lỗi tạo link thanh toán PayOS:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi tạo liên kết thanh toán PayOS.' });
  }
};

export const handlePayOSWebhook = async (req: any, res: Response) => {
  try {
    const payOS = getPayOS();
    if (!payOS) {
      return res.status(400).json({ error: 'PayOS chưa được cấu hình.' });
    }

    const webhookData = await payOS.webhooks.verify(req.body);
    if (!webhookData) {
      return res.status(400).json({ error: 'Chữ ký webhook không hợp lệ.' });
    }

    const { orderCode, code } = webhookData;
    if (code === '00') {
      const order = pendingPayOSOrders.get(Number(orderCode));
      if (order && !order.isPaid) {
        order.isPaid = true;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + order.durationDays);

        await prisma.user.update({
          where: { id: order.userId },
          data: {
            subscriptionTier: 'PRO',
            subscriptionExpiresAt: expiresAt,
          },
        });

        broadcastUserUpdate(order.userId, { action: 'SUBSCRIPTION_UPDATED', tier: 'PRO' });
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Lỗi xử lý webhook PayOS:', err);
    return res.status(500).json({ error: err.message || 'Lỗi xử lý webhook.' });
  }
};

export const checkPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderCode } = req.params;
    const order = pendingPayOSOrders.get(Number(orderCode));
    return res.json({
      isPaid: Boolean(order?.isPaid),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Lỗi máy chủ.' });
  }
};
