import { Request, Response, NextFunction } from 'express';

/**
 * Middleware xác thực token Cloudflare Turnstile
 * Token có thể được truyền trong req.body.turnstileToken hoặc header 'cf-turnstile-token'
 */
export async function verifyTurnstile(req: Request, res: Response, next: NextFunction) {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // Nếu chưa cấu hình secret key (ví dụ: môi trường dev local không set), bỏ qua để không chặn phát triển
  if (!secretKey) {
    return next();
  }

  const token = req.body?.turnstileToken || req.headers['cf-turnstile-token'];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng xác thực mã bảo vệ (Cloudflare Turnstile).'
    });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', String(token));

    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp) {
      formData.append('remoteip', String(clientIp).split(',')[0].trim());
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    });

    const outcome = (await response.json()) as { success: boolean; 'error-codes'?: string[] };

    if (outcome.success) {
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Xác thực bảo vệ thất bại hoặc token đã hết hạn. Vui lòng thử lại.',
        errors: outcome['error-codes']
      });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra bảo mật từ máy chủ.'
    });
  }
}
