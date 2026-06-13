// This file contains the radiology request routes API routes.

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

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'radiologist'), getRadiologyRequests)
    .post(authorizeRoles('admin'), createRadiologyRequest);

// Connect this API URL to its request handler.
router.get('/my', authorizeRoles('patient'), getMyRadiologyRequests);

// Connect this API URL to its request handler.
router.patch('/:id/mark-paid', authorizeRoles('admin', 'radiologist'), markRadiologyRequestPaid);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'radiologist'), getRadiologyRequestById)
    .patch(authorizeRoles('admin', 'radiologist'), updateRadiologyRequest)
    .delete(authorizeRoles('admin'), deleteRadiologyRequest);

export default router;
