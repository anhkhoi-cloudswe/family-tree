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
  completeRegistration,
  updatePhone,
  updateProfile,
  closeAccount,
  restoreAccount,
  getPhoneOtpStatus,
  requestPhoneOtp,
  verifyPhoneOtp,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/check-email', checkEmail);
router.post('/register', authRateLimiter, register);
router.post('/verify-registration', authRateLimiter, verifyRegistration);
router.post('/complete-registration', authRateLimiter, completeRegistration);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/login', authRateLimiter, login);
router.post('/magic-login', authRateLimiter, magicLogin);
router.get('/me', authenticateToken, getMe);
router.put('/phone', authenticateToken, updatePhone);
router.put('/profile', authenticateToken, updateProfile);
router.post('/close-account', authenticateToken, closeAccount);
router.post('/restore-account', authenticateToken, restoreAccount);

// Phone OTP verification & Rate limit routes (max 2 attempts/day)
router.get('/phone-otp/status', authenticateToken, getPhoneOtpStatus);
router.post('/phone-otp/request', authenticateToken, requestPhoneOtp);
router.post('/phone-otp/verify', authenticateToken, verifyPhoneOtp);

export default router;

