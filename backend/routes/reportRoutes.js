import express from 'express';
import {
    getDashboardReport,
    getRevenueReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboardReport);
router.get('/revenue', getRevenueReport);

export default router;
