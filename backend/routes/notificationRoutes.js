// This file contains the notification routes API routes.

import express from 'express';
import {
    createNotification,
    deleteNotification,
    getNotificationById,
    getNotifications,
    updateNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(getNotifications)
    .post(authorizeRoles('admin', 'receptionist'), createNotification);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(getNotificationById)
    .patch(updateNotification)
    .delete(authorizeRoles('admin'), deleteNotification);

export default router;
