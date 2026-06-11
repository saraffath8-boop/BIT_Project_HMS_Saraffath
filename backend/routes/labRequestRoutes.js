import express from 'express';
import {
    createLabRequest,
    deleteLabRequest,
    getLabRequestById,
    getLabRequests,
    getMyLabRequests,
    markLabRequestPaid,
    updateLabRequest,
} from '../controllers/labRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'lab_technician', 'receptionist'), getLabRequests)
    .post(authorizeRoles('admin'), createLabRequest);

router
    .get('/my', authorizeRoles('patient'), getMyLabRequests);

router.patch('/:id/mark-paid', authorizeRoles('admin', 'receptionist'), markLabRequestPaid);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'lab_technician', 'receptionist'), getLabRequestById)
    .patch(authorizeRoles('admin', 'lab_technician'), updateLabRequest)
    .delete(authorizeRoles('admin'), deleteLabRequest);

export default router;
