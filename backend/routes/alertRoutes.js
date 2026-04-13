import express from 'express';
import { getAlerts, createAlert, deleteAlert, markAlertTriggered } from '../controllers/alertController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAlerts);
router.post('/', createAlert);
router.delete('/:id', deleteAlert);
router.patch('/:id/trigger', markAlertTriggered);

export default router;
