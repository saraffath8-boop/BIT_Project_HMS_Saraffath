// This file contains the prescription routes API routes.

import express from 'express';
import {
    createPrescription,
    deletePrescription,
    getMyPrescriptions,
    getPrescriptionById,
    getPrescriptions,
    markPrescriptionPaid,
    updatePrescription,
} from '../controllers/prescriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getPrescriptions)
    .post(authorizeRoles('admin'), createPrescription);

// Connect this API URL to its request handler.
router.get('/my', authorizeRoles('patient'), getMyPrescriptions);

// Connect this API URL to its request handler.
router.patch('/:id/mark-paid', authorizeRoles('admin', 'pharmacist'), markPrescriptionPaid);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getPrescriptionById)
    .patch(authorizeRoles('admin', 'doctor', 'pharmacist'), updatePrescription)
    .delete(authorizeRoles('admin'), deletePrescription);

export default router;
