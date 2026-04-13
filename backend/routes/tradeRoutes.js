import express from 'express';
import { buyCoin, sellCoin, getHistory, getHistoryBySymbol } from '../controllers/tradeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { tradeLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(protect); // Require auth for all trade routes

router.post('/buy', tradeLimiter, buyCoin);
router.post('/sell', tradeLimiter, sellCoin);
router.get('/history', getHistory);
router.get('/history/:symbol', getHistoryBySymbol);

export default router;
