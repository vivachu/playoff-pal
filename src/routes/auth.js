import { Router } from 'express';
import { otpRateLimiter } from '../middleware/rateLimiter.js';
import {
  showLogin,
  submitPhone,
  showRegister,
  submitRegister,
  showVerify,
  submitVerify,
  logout,
} from '../controllers/authController.js';

const router = Router();

router.get('/login',    showLogin);
router.post('/login',   otpRateLimiter, submitPhone);
router.get('/register', showRegister);
router.post('/register', otpRateLimiter, submitRegister);
router.get('/verify',   showVerify);
router.post('/verify',  submitVerify);
router.post('/logout',  logout);

export default router;
