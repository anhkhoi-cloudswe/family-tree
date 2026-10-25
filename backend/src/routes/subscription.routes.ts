import { Router } from 'express';
import {
  getSubscriptionStatus,
  upgradeSubscription,
  simulateExpiry,
} from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/status', getSubscriptionStatus);
router.post('/upgrade', upgradeSubscription);
router.post('/simulate-expiry', simulateExpiry);

export default router;
