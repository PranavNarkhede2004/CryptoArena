import express from 'express';
import { getTickers, getTickerBySymbol, getCandles, getCoins } from '../controllers/marketController.js';
import { publicLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(publicLimiter);

router.get('/tickers', getTickers);
router.get('/ticker/:symbol', getTickerBySymbol);
router.get('/candles/:symbol', getCandles);
router.get('/coins', getCoins);

export default router;
