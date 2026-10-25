import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';
import {
  getAdminStats,
  getAdminUsers,
  updateAdminUserRole,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminTrees,
  updateAdminUserSubscription,
} from '../controllers/admin.controller';

const router = Router();

// Tất cả endpoints admin đều yêu cầu Token hợp lệ VÀ quyền ADMIN
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:id', updateAdminUser);
router.patch('/users/:id/role', updateAdminUserRole);
router.put('/users/:id/subscription', updateAdminUserSubscription);
router.patch('/users/:id/subscription', updateAdminUserSubscription);
router.delete('/users/:id', deleteAdminUser);
router.get('/trees', getAdminTrees);

export default router;
