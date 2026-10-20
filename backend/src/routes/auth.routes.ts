import { Router } from 'express';
import { register, login, getMe, magicLogin, checkEmail, forgotPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/check-email', checkEmail);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/magic-login', authRateLimiter, magicLogin);
router.get('/me', authenticateToken, getMe);

export default router;
