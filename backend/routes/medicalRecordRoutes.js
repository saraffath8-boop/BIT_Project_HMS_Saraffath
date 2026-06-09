import express from 'express';
import {
    createMedicalRecord,
    deleteMedicalRecord,
    getMedicalRecordById,
    getMedicalRecords,
    updateMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse'), getMedicalRecords)
    .post(authorizeRoles('admin', 'doctor'), createMedicalRecord);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse'), getMedicalRecordById)
    .patch(authorizeRoles('admin', 'doctor'), updateMedicalRecord)
    .delete(authorizeRoles('admin'), deleteMedicalRecord);

export default router;
