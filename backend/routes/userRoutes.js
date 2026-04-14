import express from 'express';
import { getCurrentUser, getLeaderboard } from '../controllers/userController.js';

const router = express.Router();

router.get('/current', getCurrentUser);
router.get('/leaderboard', getLeaderboard);

export default router;
