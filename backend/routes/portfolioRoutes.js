import express from 'express';
import { getPortfolio, getSummary } from '../controllers/portfolioController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getPortfolio);
router.get('/summary', getSummary);

export default router;
