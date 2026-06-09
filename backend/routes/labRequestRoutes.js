import express from 'express';
import {
    createLabRequest,
    deleteLabRequest,
    getLabRequestById,
    getLabRequests,
    getMyLabRequests,
    updateLabRequest,
} from '../controllers/labRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'lab_technician'), getLabRequests)
    .post(authorizeRoles('admin', 'doctor'), createLabRequest);

router
    .get('/my', authorizeRoles('patient'), getMyLabRequests);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'lab_technician'), getLabRequestById)
    .patch(authorizeRoles('admin', 'doctor', 'lab_technician'), updateLabRequest)
    .delete(authorizeRoles('admin'), deleteLabRequest);

export default router;
