// This file contains the medical record routes API routes.

import express from 'express';
import {
    createMedicalRecord,
    deleteMedicalRecord,
    getMedicalRecordById,
    getMedicalRecords,
    getMyMedicalRecords,
    updateMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router.get('/my', authorizeRoles('patient'), getMyMedicalRecords);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse'), getMedicalRecords)
    .post(authorizeRoles('admin', 'doctor'), createMedicalRecord);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse'), getMedicalRecordById)
    .patch(authorizeRoles('admin', 'doctor'), updateMedicalRecord)
    .delete(authorizeRoles('admin'), deleteMedicalRecord);

export default router;
