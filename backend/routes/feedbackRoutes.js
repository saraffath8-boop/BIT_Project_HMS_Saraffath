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

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'patient'), getFeedbackEntries)
    .post(authorizeRoles('patient'), createFeedback);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'patient'), getFeedbackById)
    .patch(authorizeRoles('admin'), updateFeedback)
    .delete(authorizeRoles('admin'), deleteFeedback);

export default router;
