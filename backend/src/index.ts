import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import treeRoutes from './routes/tree.routes';
import personRoutes from './routes/person.routes';
import kinshipRoutes from './routes/kinship.routes';
import exportRoutes from './routes/export.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Bảo mật HTTP Headers chống Clickjacking, XSS, Sniffing MIME types
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cho phép tải avatar/uploads liên domain an toàn
  })
);

// 2. Chống DDoS & Brute-force đánh sập Web (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Tối đa 1000 requests mỗi IP trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã gửi quá nhiều yêu cầu đến máy chủ. Vui lòng thử lại sau vài phút!' },
});
app.use('/api/', limiter);

// 3. Giới hạn chặt hơn cho các cổng nhạy cảm (Đăng nhập / Đăng ký) chống dò pass
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Tối đa 30 lần thử đăng nhập/đăng ký trong 15 phút
  message: { error: 'Thao tác xác thực quá nhiều lần. Vui lòng đợi 15 phút để đảm bảo an toàn!' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 4. CORS an toàn
app.use(
  cors({
    origin: true,
    credentials: true, // Hỗ trợ gửi cookie an toàn qua trình duyệt
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Chống Payload Bomb làm nghẽn RAM server
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Phục vụ ảnh avatar tải lên ở thư mục uploads cục bộ
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

import { prisma } from './prisma';
import { seedDatabase } from './utils/seed';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/kinship', kinshipRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Family Tree Heritage API Server đang hoạt động tốt!',
    timestamp: new Date().toISOString(),
  });
});

// Export app cho Cloudflare Workers / Serverless
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.CLOUDFLARE_WORKER) {
  app.listen(PORT, async () => {
    console.log(`[FamilyTree API] Server is running on http://localhost:${PORT}`);
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('[FamilyTree API] Cơ sở dữ liệu đang trống, tự động nạp dữ liệu mẫu...');
        await seedDatabase();
      }
    } catch (err) {
      console.error('[FamilyTree API] Lỗi khởi tạo/kiểm tra dữ liệu:', err);
    }
  });
}
