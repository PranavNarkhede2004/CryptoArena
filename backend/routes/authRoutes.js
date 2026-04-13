import express from 'express';
import { registerUser, loginUser, refresh, logoutUser } from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/refresh', refresh);
router.post('/logout', logoutUser);

export default router;
