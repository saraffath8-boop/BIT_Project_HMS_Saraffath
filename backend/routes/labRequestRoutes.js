// This file contains the lab request routes API routes.

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

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'lab_technician'), getLabRequests)
    .post(authorizeRoles('admin'), createLabRequest);

// Connect this API URL to its request handler.
router.get('/my', authorizeRoles('patient'), getMyLabRequests);

// Connect this API URL to its request handler.
router.patch('/:id/mark-paid', authorizeRoles('admin', 'lab_technician'), markLabRequestPaid);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'lab_technician'), getLabRequestById)
    .patch(authorizeRoles('admin', 'lab_technician'), updateLabRequest)
    .delete(authorizeRoles('admin'), deleteLabRequest);

export default router;
