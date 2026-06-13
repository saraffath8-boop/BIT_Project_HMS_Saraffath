import express from 'express';
import {
    createBill,
    deleteBill,
    getBillById,
    getBills,
    getMyBills,
    getPendingPatientDecisions,
    processPatientDecisions,
    updateBill,
} from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'receptionist', 'pharmacist', 'lab_technician', 'radiologist'), getBills)
    .post(authorizeRoles('admin'), createBill);

router
    .get('/my', authorizeRoles('patient'), getMyBills);

router.get('/pending-decisions', authorizeRoles('admin', 'pharmacist', 'lab_technician', 'radiologist'), getPendingPatientDecisions);
router.post('/patient-decisions', authorizeRoles('admin', 'pharmacist', 'lab_technician', 'radiologist'), processPatientDecisions);

router
    .route('/:id')
    .get(authorizeRoles('admin'), getBillById)
    .patch(authorizeRoles('admin'), updateBill)
    .delete(authorizeRoles('admin'), deleteBill);

export default router;
