// This file contains the bill routes API routes.

import express from 'express';
import {
    createBill,
    deleteBill,
    getBillById,
    getBills,
    getMyBills,
    updateBill,
} from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(
        authorizeRoles('admin', 'receptionist', 'pharmacist', 'lab_technician', 'radiologist'),
        getBills,
    )
    .post(authorizeRoles('admin'), createBill);

// Connect this API URL to its request handler.
router.get('/my', authorizeRoles('patient'), getMyBills);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin'), getBillById)
    .patch(authorizeRoles('admin'), updateBill)
    .delete(authorizeRoles('admin'), deleteBill);

export default router;
