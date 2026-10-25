import { Router } from 'express';
import {
  getSubscriptionStatus,
  upgradeSubscription,
  simulateExpiry,
  getPayOSConfigStatus,
  createPayOSPayment,
  handlePayOSWebhook,
  checkPaymentStatus,
} from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Webhook công khai từ PayOS (Không dùng auth middleware)
router.post('/payos-webhook', handlePayOSWebhook);

// Các endpoint dưới đây yêu cầu đăng nhập
router.use(authenticateToken);

router.get('/status', getSubscriptionStatus);
router.post('/upgrade', upgradeSubscription);
router.post('/simulate-expiry', simulateExpiry);

// PayOS Routes
router.get('/payos-status', getPayOSConfigStatus);
router.post('/payos-create', createPayOSPayment);
router.get('/payos-check/:orderCode', checkPaymentStatus);

export default router;
