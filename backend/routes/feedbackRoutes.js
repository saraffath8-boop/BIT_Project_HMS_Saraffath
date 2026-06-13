// This file contains the feedback routes API routes.

import express from 'express';
import {
    createFeedback,
    deleteFeedback,
    getFeedbackById,
    getFeedbackEntries,
    updateFeedback,
} from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'patient'), getFeedbackEntries)
    .post(authorizeRoles('patient'), createFeedback);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'patient'), getFeedbackById)
    .patch(authorizeRoles('admin'), updateFeedback)
    .delete(authorizeRoles('admin'), deleteFeedback);

export default router;
