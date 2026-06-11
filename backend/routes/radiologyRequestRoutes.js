import express from 'express';
import {
    createRadiologyRequest,
    deleteRadiologyRequest,
    getMyRadiologyRequests,
    getRadiologyRequestById,
    getRadiologyRequests,
    markRadiologyRequestPaid,
    updateRadiologyRequest,
} from '../controllers/radiologyRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'radiologist', 'receptionist'), getRadiologyRequests)
    .post(authorizeRoles('admin'), createRadiologyRequest);

router
    .get('/my', authorizeRoles('patient'), getMyRadiologyRequests);

router.patch('/:id/mark-paid', authorizeRoles('admin', 'receptionist'), markRadiologyRequestPaid);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'radiologist', 'receptionist'), getRadiologyRequestById)
    .patch(authorizeRoles('admin', 'radiologist'), updateRadiologyRequest)
    .delete(authorizeRoles('admin'), deleteRadiologyRequest);

export default router;
