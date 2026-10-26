import { Request, Response, NextFunction } from 'express';

interface LoginAttemptRecord {
  count: number;
  resetTime: number;
}

interface DailyLimitRecord {
  dateStr: string;
  count: number;
  lastRequestTime: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const signupAttempts = new Map<string, DailyLimitRecord>();
const forgotPasswordAttempts = new Map<string, DailyLimitRecord>();

const getVietnamDateStr = (): string => {
  const now = new Date();
  // Vietnam is UTC+7
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().slice(0, 10);
};

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

// Clean up expired login attempts
function cleanupExpiredLoginAttempts(now: number) {
  if (loginAttempts.size > 500) {
    for (const [ip, record] of loginAttempts.entries()) {
      if (now > record.resetTime) {
        loginAttempts.delete(ip);
      }
    }
  }
}

// Clean up expired daily records for other dates
function cleanupExpiredDailyMap(map: Map<string, DailyLimitRecord>, todayStr: string) {
  if (map.size > 500) {
    for (const [key, record] of map.entries()) {
      if (record.dateStr !== todayStr) {
        map.delete(key);
      }
    }
  }
}

/**
 * Rate limiter chung cho các endpoint nhạy cảm (đăng nhập, nhập mã xác thực,...)
 * Giới hạn 15 lần / 15 phút cho mỗi IP
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = getClientIp(req);
  const now = Date.now();
  cleanupExpiredLoginAttempts(now);
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 15;

  const current = loginAttempts.get(clientIp);

  if (!current || now > current.resetTime) {
    loginAttempts.set(clientIp, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (current.count >= maxAttempts) {
    const minutesLeft = Math.ceil((current.resetTime - now) / 60000);
    return res.status(429).json({
      error: `Bạn đã thử thao tác quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút để đảm bảo an toàn.`,
    });
  }

  current.count += 1;
  next();
};

const MAX_DAILY_EMAIL_ATTEMPTS = 3;
const EMAIL_COOLDOWN_MS = 60 * 1000; // 60 giây cooldown giữa 2 lần bấm gửi liên tiếp

/**
 * Rate limiter ĐỘC LẬP cho Đăng ký tài khoản (Gửi email kích hoạt)
 * - Tối đa 3 lần / ngày cho mỗi IP
 * - Cooldown 60s giữa 2 lần gửi để tránh người dùng click đúp hoặc spam mất oan lượt
 * - Đến lần 4 sẽ chặn và báo lỗi rõ ràng
 */
export const signupRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = getClientIp(req);
  const todayStr = getVietnamDateStr();
  const now = Date.now();

  cleanupExpiredDailyMap(signupAttempts, todayStr);

  const record = signupAttempts.get(clientIp);

  // Nếu chưa có record hoặc đã sang ngày mới -> Khởi tạo lượt đầu tiên (1/3)
  if (!record || record.dateStr !== todayStr) {
    signupAttempts.set(clientIp, {
      dateStr: todayStr,
      count: 1,
      lastRequestTime: now,
    });
    return next();
  }

  // 1. Kiểm tra Cooldown 60 giây (Chống spam liên tục hoặc bấm đúp)
  const timeSinceLast = now - record.lastRequestTime;
  if (timeSinceLast < EMAIL_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((EMAIL_COOLDOWN_MS - timeSinceLast) / 1000);
    return res.status(429).json({
      error: `Email xác thực vừa được gửi đi. Vui lòng kiểm tra hộp thư hoặc chờ ${secondsLeft} giây trước khi gửi lại.`,
    });
  }

  // 2. Kiểm tra nếu đã hết 3 lần trong ngày (Lần thứ 4 sẽ bị chặn)
  if (record.count >= MAX_DAILY_EMAIL_ATTEMPTS) {
    return res.status(429).json({
      error: 'Bạn đã dùng hết 3 lần gửi email đăng ký trong ngày hôm nay. Vui lòng kiểm tra kỹ hộp thư (bao gồm cả mục Thư rác/Spam) hoặc thử lại vào ngày mai.',
    });
  }

  // Hợp lệ: tăng số lần và cập nhật thời gian gửi
  record.count += 1;
  record.lastRequestTime = now;
  next();
};

/**
 * Rate limiter ĐỘC LẬP cho Quên mật khẩu (Gửi email đặt lại mật khẩu)
 * - Tối đa 3 lần / ngày cho mỗi IP
 * - Cooldown 60s giữa 2 lần gửi để tránh người dùng click đúp hoặc spam mất oan lượt
 * - Đến lần 4 sẽ chặn và báo lỗi rõ ràng
 */
export const forgotPasswordRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = getClientIp(req);
  const todayStr = getVietnamDateStr();
  const now = Date.now();

  cleanupExpiredDailyMap(forgotPasswordAttempts, todayStr);

  const record = forgotPasswordAttempts.get(clientIp);

  // Nếu chưa có record hoặc đã sang ngày mới -> Khởi tạo lượt đầu tiên (1/3)
  if (!record || record.dateStr !== todayStr) {
    forgotPasswordAttempts.set(clientIp, {
      dateStr: todayStr,
      count: 1,
      lastRequestTime: now,
    });
    return next();
  }

  // 1. Kiểm tra Cooldown 60 giây (Chống spam liên tục hoặc bấm đúp)
  const timeSinceLast = now - record.lastRequestTime;
  if (timeSinceLast < EMAIL_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((EMAIL_COOLDOWN_MS - timeSinceLast) / 1000);
    return res.status(429).json({
      error: `Yêu cầu đặt lại mật khẩu vừa được gửi đi. Vui lòng kiểm tra hộp thư hoặc chờ ${secondsLeft} giây trước khi gửi lại.`,
    });
  }

  // 2. Kiểm tra nếu đã hết 3 lần trong ngày (Lần thứ 4 sẽ bị chặn)
  if (record.count >= MAX_DAILY_EMAIL_ATTEMPTS) {
    return res.status(429).json({
      error: 'Bạn đã dùng hết 3 lần yêu cầu đặt lại mật khẩu trong ngày hôm nay. Vui lòng kiểm tra kỹ hộp thư (bao gồm cả mục Thư rác/Spam) hoặc thử lại vào ngày mai.',
    });
  }

  // Hợp lệ: tăng số lần và cập nhật thời gian gửi
  record.count += 1;
  record.lastRequestTime = now;
  next();
};
