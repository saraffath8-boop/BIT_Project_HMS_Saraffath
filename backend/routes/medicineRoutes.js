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

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getMedicines)
    .post(authorizeRoles('admin', 'pharmacist'), createMedicine);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'pharmacist'), getMedicineById)
    .patch(authorizeRoles('admin', 'pharmacist'), updateMedicine)
    .delete(authorizeRoles('admin'), deleteMedicine);

export default router;
