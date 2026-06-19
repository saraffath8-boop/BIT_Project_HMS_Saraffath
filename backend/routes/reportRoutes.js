// This file contains the report routes API routes.

import express from 'express';
import {
    getComprehensiveReports,
    getDashboardReport,
    getRevenueReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);
// Connect this API URL to its request handler.
router.use(authorizeRoles('admin'));

// Connect this API URL to its request handler.
router.get('/dashboard', getDashboardReport);
// Connect this API URL to its request handler.
router.get('/revenue', getRevenueReport);
// Connect this API URL to its request handler.
router.get('/comprehensive', getComprehensiveReports);

export default router;
