import { Request, Response, NextFunction } from 'express';

interface LoginAttemptRecord {
  count: number;
  resetTime: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now > record.resetTime) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limiter middleware for sensitive endpoints like /api/auth/login
 * Limits requests to 15 attempts per 15 minutes per IP address
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
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
      error: `Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút để đảm bảo an toàn.`,
    });
  }

  current.count += 1;
  next();
};
