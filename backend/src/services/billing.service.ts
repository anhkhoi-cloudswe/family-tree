import { prisma } from '../prisma';
import { broadcastUserUpdate } from './websocket.service';

export type SubscriptionPlanType = 'free' | 'pro_monthly' | 'pro_yearly';
export type SubscriptionStatusType = 'active' | 'expired' | 'cancelled';

export interface UserSubscriptionState {
  userId: string;
  current_plan: SubscriptionPlanType;
  status: SubscriptionStatusType;
  expires_at: Date | null;
  daysRemaining: number;
  isProActive: boolean;
  canUpgradeToYearly: boolean;
}

export interface CheckoutValidationResult {
  allowed: boolean;
  message?: string;
  isCycleConversion?: boolean;
  remainingDays?: number;
  currentPlan?: SubscriptionPlanType;
}

export interface SubscriptionTransaction {
  id: string;
  orderCode: number;
  orderNumber: string; // e.g. "PRO #1"
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  plan: 'MONTHLY' | 'YEARLY';
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'EXPIRED';
  gateway: string;
  createdAt: string;
  paidAt?: string;
}

// In-memory persistent transaction storage synced across payment gateways
export const subscriptionOrders: SubscriptionTransaction[] = [];
let orderCounter = 1;

export const getNextOrderCode = (): number => {
  return orderCounter++;
};

/**
 * 1. TRẠNG THÁI GÓI CƯỚC CỦA NGƯỜI DÙNG (User Subscription State)
 * Mỗi user có:
 * - current_plan: 'free' | 'pro_monthly' | 'pro_yearly'
 * - status: 'active' | 'expired' | 'cancelled'
 * - expires_at: Date | null
 */
export const getUserSubscriptionState = async (userId: string): Promise<UserSubscriptionState> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) {
    return {
      userId,
      current_plan: 'free',
      status: 'active',
      expires_at: null,
      daysRemaining: 0,
      isProActive: false,
      canUpgradeToYearly: true,
    };
  }

  const now = new Date();
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const isTierPro = user.subscriptionTier === 'PRO';

  // Nếu không phải PRO hoặc chưa có ngày hết hạn
  if (!isTierPro || !expiresAt) {
    return {
      userId,
      current_plan: 'free',
      status: 'active',
      expires_at: null,
      daysRemaining: 0,
      isProActive: false,
      canUpgradeToYearly: true,
    };
  }

  // Đã hết hạn
  if (expiresAt < now) {
    return {
      userId,
      current_plan: 'free',
      status: 'expired',
      expires_at: expiresAt,
      daysRemaining: 0,
      isProActive: false,
      canUpgradeToYearly: true,
    };
  }

  // Đang là PRO và còn hạn
  const diffTime = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Xác định gói đang chạy (Monthly hay Yearly) dựa theo đơn hàng thành công gần nhất hoặc số ngày còn lại
  const latestOrder = subscriptionOrders
    .filter((o) => o.userId === userId && o.status === 'SUCCESS')
    .sort((a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())[0];

  let currentPlan: SubscriptionPlanType = 'pro_monthly';
  if (latestOrder) {
    currentPlan = latestOrder.plan === 'YEARLY' ? 'pro_yearly' : 'pro_monthly';
  } else if (daysRemaining > 35) {
    // Nếu không có lịch sử đơn hàng mà thời hạn > 35 ngày thì là gói năm
    currentPlan = 'pro_yearly';
  }

  return {
    userId,
    current_plan: currentPlan,
    status: 'active',
    expires_at: expiresAt,
    daysRemaining,
    isProActive: true,
    canUpgradeToYearly: currentPlan === 'pro_monthly',
  };
};

/**
 * 2. KIỂM TRA KHI BẤM NÚT THANH TOÁN (Validation before Checkout)
 * 
 * Quy tắc:
 * - Chống thanh toán trùng lặp (Duplicate Prevention):
 *   + Đang dùng Pro Monthly mà bấm mua tiếp Pro Monthly -> Chặn, thông báo không cho lặp lại.
 *   + Đang dùng Pro Yearly còn hạn -> Chặn mua cả Monthly lẫn Yearly vì đã ở gói cao nhất.
 * - Cho phép chuyển đổi chu kỳ (Monthly -> Yearly):
 *   + Đang dùng Pro Monthly mà muốn chuyển sang Pro Yearly -> Cho phép, bảo lưu và cộng dồn thời hạn.
 */
export const validateSubscriptionCheckout = async (
  userId: string,
  requestedCycle: 'MONTHLY' | 'YEARLY'
): Promise<CheckoutValidationResult> => {
  const state = await getUserSubscriptionState(userId);

  // Người dùng chưa có gói PRO hoặc gói PRO đã hết hạn -> Cho phép thanh toán bình thường
  if (!state.isProActive || state.status !== 'active') {
    return {
      allowed: true,
      currentPlan: state.current_plan,
      isCycleConversion: false,
    };
  }

  const formattedDate = state.expires_at ? state.expires_at.toLocaleDateString('vi-VN') : '';

  // Trường hợp 1: Người dùng đang dùng gói Năm (gói cao nhất) và còn hạn
  if (state.current_plan === 'pro_yearly') {
    return {
      allowed: false,
      currentPlan: state.current_plan,
      message: `Bạn đang sở hữu Gói PRO Theo Năm còn hạn đến ngày ${formattedDate} (còn ${state.daysRemaining} ngày). Gói của bạn đang hoạt động tối đa, không cần thanh toán thêm.`,
    };
  }

  // Trường hợp 2: Người dùng đang dùng gói Tháng và bấm mua tiếp gói Tháng (Trùng lặp!)
  if (state.current_plan === 'pro_monthly' && requestedCycle === 'MONTHLY') {
    return {
      allowed: false,
      currentPlan: state.current_plan,
      message: `Bạn đang sử dụng Gói PRO Theo Tháng (còn hạn đến ${formattedDate}). Hệ thống đã khóa nút thanh toán trùng lặp. Vui lòng chọn gói "Theo Năm (-35%)" để nâng cấp tiết kiệm hơn!`,
    };
  }

  // Trường hợp 3: Người dùng đang dùng gói Tháng và muốn nâng cấp lên gói Năm (Hợp lệ!)
  if (state.current_plan === 'pro_monthly' && requestedCycle === 'YEARLY') {
    return {
      allowed: true,
      currentPlan: state.current_plan,
      isCycleConversion: true,
      remainingDays: state.daysRemaining,
      message: `Chuyển đổi sang Gói PRO Theo Năm thành công. Toàn bộ ${state.daysRemaining} ngày còn lại của gói tháng sẽ được cộng dồn vào chu kỳ năm mới!`,
    };
  }

  return { allowed: true };
};

/**
 * 3. XỬ LÝ SAU KHI THANH TOÁN THÀNH CÔNG (Webhook / Success Handler)
 * 
 * - Cập nhật `current_plan` tương ứng (pro_monthly hoặc pro_yearly).
 * - Cập nhật `expires_at`:
 *   + Nếu chuyển từ Tháng lên Năm: `expires_at = ngày_hết_hạn_hiện_tại + 365 ngày` (cộng dồn bảo toàn số ngày còn lại).
 *   + Nếu mua mới hoặc gia hạn sau hết hạn: `expires_at = Thời gian hiện tại + 1 tháng/năm`.
 * - Ghi lại lịch sử giao dịch (Transaction History) với số tiền tương ứng (49.000đ hoặc 399.000đ).
 */
export const applySuccessfulSubscription = async (params: {
  userId: string;
  plan: 'MONTHLY' | 'YEARLY';
  amount: number;
  gateway: string;
  orderNumber?: string;
  orderCode?: number;
}): Promise<{
  success: boolean;
  newExpiresAt: Date;
  updatedPlan: SubscriptionPlanType;
  message: string;
}> => {
  const { userId, plan, amount, gateway, orderNumber, orderCode } = params;
  const state = await getUserSubscriptionState(userId);

  const now = new Date();
  let newExpiresAt: Date;

  // Nếu đang là PRO Tháng còn hạn và nâng cấp lên Năm -> Cộng dồn thời hạn
  if (state.isProActive && state.current_plan === 'pro_monthly' && plan === 'YEARLY' && state.expires_at) {
    newExpiresAt = new Date(state.expires_at.getTime());
    newExpiresAt.setDate(newExpiresAt.getDate() + 365);
  } else {
    // Mua mới hoặc sau khi đã hết hạn
    const durationDays = plan === 'YEARLY' ? 365 : 30;
    newExpiresAt = new Date(now.getTime());
    newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
  }

  const updatedPlan: SubscriptionPlanType = plan === 'YEARLY' ? 'pro_yearly' : 'pro_monthly';

  // 1. Cập nhật User trong DB
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'PRO',
      subscriptionExpiresAt: newExpiresAt,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  // 2. Ghi lại lịch sử giao dịch (Transaction History)
  const existingOrder = subscriptionOrders.find(
    (o) => (orderCode && o.orderCode === orderCode) || (orderNumber && o.orderNumber === orderNumber)
  );

  if (existingOrder) {
    existingOrder.status = 'SUCCESS';
    existingOrder.paidAt = new Date().toISOString();
    existingOrder.amount = amount;
    existingOrder.plan = plan;
  } else {
    const code = orderCode || getNextOrderCode();
    const finalOrderNumber = orderNumber || `PRO #${code}`;
    subscriptionOrders.push({
      id: `ord_${Date.now()}_${code}`,
      orderCode: code,
      orderNumber: finalOrderNumber,
      userId: updatedUser.id,
      userName: updatedUser.fullName || 'Người dùng',
      userEmail: updatedUser.email,
      userPhone: updatedUser.phone || undefined,
      plan,
      amount,
      status: 'SUCCESS',
      gateway,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    });
  }

  // 3. Thông báo Realtime qua WebSocket tới client
  broadcastUserUpdate(userId, {
    action: 'SUBSCRIPTION_UPDATED',
    tier: 'PRO',
    current_plan: updatedPlan,
    expires_at: newExpiresAt.toISOString(),
  });

  return {
    success: true,
    newExpiresAt,
    updatedPlan,
    message: `Kích hoạt thành công gói PRO (${plan === 'YEARLY' ? 'Theo Năm' : 'Theo Tháng'}) đến ngày ${newExpiresAt.toLocaleDateString('vi-VN')}!`,
  };
};

/**
 * 4. CHÍNH SÁCH KHẤU TRỪ / PRORATION (Mở rộng cho các gói tương lai như VIP, Ultra)
 */
export const calculateProrationCredit = (
  currentPlanDailyRate: number,
  remainingDays: number,
  targetPlanPrice: number
): {
  creditAmount: number;
  finalPriceToPay: number;
} => {
  const creditAmount = Math.max(0, Math.floor(currentPlanDailyRate * remainingDays));
  const finalPriceToPay = Math.max(0, targetPlanPrice - creditAmount);
  return { creditAmount, finalPriceToPay };
};
