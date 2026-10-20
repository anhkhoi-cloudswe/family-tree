import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập để truy cập tài nguyên.' });
  }

  const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
  jwt.verify(token, secret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên đăng nhập hết hạn hoặc không hợp lệ.' });
    }
    req.user = decoded;
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Quyền truy cập bị từ chối: Yêu cầu quyền Quản Trị Viên (Admin).' });
  }
  next();
};
