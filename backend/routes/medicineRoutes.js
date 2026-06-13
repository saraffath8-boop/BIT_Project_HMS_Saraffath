// This file contains the medicine routes API routes.

import express from 'express';
import {
    createMedicine,
    deleteMedicine,
    getMedicineById,
    getMedicines,
    updateMedicine,
} from '../controllers/medicineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getMedicines)
    .post(authorizeRoles('admin', 'pharmacist'), createMedicine);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getMedicineById)
    .patch(authorizeRoles('admin', 'pharmacist'), updateMedicine)
    .delete(authorizeRoles('admin'), deleteMedicine);

export default router;
