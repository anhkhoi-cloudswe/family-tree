import { Router } from 'express';
import {
  register,
  verifyRegistration,
  login,
  getMe,
  magicLogin,
  checkEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/check-email', checkEmail);
router.post('/register', authRateLimiter, register);
router.post('/verify-registration', authRateLimiter, verifyRegistration);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/login', authRateLimiter, login);
router.post('/magic-login', authRateLimiter, magicLogin);
router.get('/me', authenticateToken, getMe);

export default router;
