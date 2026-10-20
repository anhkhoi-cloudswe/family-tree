import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import treeRoutes from './routes/tree.routes';
import personRoutes from './routes/person.routes';
import kinshipRoutes from './routes/kinship.routes';
import exportRoutes from './routes/export.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
