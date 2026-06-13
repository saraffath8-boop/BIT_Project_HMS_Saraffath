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

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getPrescriptions)
    .post(authorizeRoles('admin'), createPrescription);

router.get('/my', authorizeRoles('patient'), getMyPrescriptions);

router.patch('/:id/mark-paid', authorizeRoles('admin', 'pharmacist'), markPrescriptionPaid);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getPrescriptionById)
    .patch(authorizeRoles('admin', 'doctor', 'pharmacist'), updatePrescription)
    .delete(authorizeRoles('admin'), deletePrescription);

export default router;
