import express from 'express';
import {
    createRadiologyRequest,
    deleteRadiologyRequest,
    getMyRadiologyRequests,
    getRadiologyRequestById,
    getRadiologyRequests,
    updateRadiologyRequest,
} from '../controllers/radiologyRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'radiologist'), getRadiologyRequests)
    .post(authorizeRoles('admin', 'doctor'), createRadiologyRequest);

router
    .get('/my', authorizeRoles('patient'), getMyRadiologyRequests);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'radiologist'), getRadiologyRequestById)
    .patch(authorizeRoles('admin', 'doctor', 'radiologist'), updateRadiologyRequest)
    .delete(authorizeRoles('admin'), deleteRadiologyRequest);

export default router;
