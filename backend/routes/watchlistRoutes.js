import express from 'express';
import { getWatchlist, addCoin, removeCoin } from '../controllers/watchlistController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getWatchlist);
router.post('/add', addCoin);
router.delete('/:symbol', removeCoin);

export default router;
