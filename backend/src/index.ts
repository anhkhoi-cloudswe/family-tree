import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import http from 'http';

import authRoutes from './routes/auth.routes';
import treeRoutes from './routes/tree.routes';
import personRoutes from './routes/person.routes';
import kinshipRoutes from './routes/kinship.routes';
import exportRoutes from './routes/export.routes';
import adminRoutes from './routes/admin.routes';
import invitationRoutes from './routes/invitation.routes';
import { cleanupPendingDeleteAccounts } from './controllers/auth.controller';
import { initWebSocketServer } from './services/websocket.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Bảo mật HTTP Headers chống Clickjacking, XSS, Sniffing MIME types
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cho phép tải avatar/uploads liên domain an toàn
  })
);

// 2. CORS an toàn
app.use(
  cors({
    origin: true,
    credentials: true, // Hỗ trợ gửi cookie an toàn qua trình duyệt
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Chống Payload Bomb làm nghẽn RAM server
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Phục vụ ảnh avatar tải lên ở thư mục uploads cục bộ (khi chạy Node.js truyền thống)
if (typeof __dirname !== 'undefined') {
  const uploadsPath = path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));
}

import { prisma, prismaStorage, createPrismaInstance } from './prisma';
import { seedDatabase } from './utils/seed';

// Middleware thiết lập ngữ cảnh Prisma riêng biệt cho từng request (chống lỗi socket đóng băng trên Cloudflare Workers)
app.use((req, res, next) => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const { prisma: reqPrisma, cleanup } = createPrismaInstance(connectionString);

  res.on('finish', cleanup);
  res.on('close', cleanup);

  prismaStorage.run(reqPrisma, () => {
    next();
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/kinship', kinshipRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invitations', invitationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Family Tree Heritage API Server đang hoạt động tốt!',
    timestamp: new Date().toISOString(),
  });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Express Global Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Đã xảy ra lỗi máy chủ nội bộ.',
  });
});

// Export app cho Cloudflare Workers / Serverless
export default app;

// Chỉ khởi động HTTP server khi chạy trực tiếp trong Node.js (cục bộ / Docker)
const isDirectRun = typeof process !== 'undefined' && 
  Boolean(process.argv && process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js')));

if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.CLOUDFLARE_WORKER) {
  const server = http.createServer(app);
  initWebSocketServer(server);

  server.listen(PORT, async () => {
    console.log(`[FamilyTree API] Server with WebSockets is running on http://localhost:${PORT}`);
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('[FamilyTree API] Cơ sở dữ liệu đang trống, tự động nạp dữ liệu mẫu...');
        await seedDatabase();
      }

      // Khởi chạy tác vụ quét dọn tài khoản chờ xóa quá hạn 30 ngày (Background Worker)
      await cleanupPendingDeleteAccounts();
      setInterval(cleanupPendingDeleteAccounts, 12 * 60 * 60 * 1000);
    } catch (err) {
      console.error('[FamilyTree API] Lỗi khởi tạo/kiểm tra dữ liệu:', err);
    }
  });
}
