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

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getNotifications)
    .post(authorizeRoles('admin'), createNotification);

router
    .route('/:id')
    .get(getNotificationById)
    .patch(updateNotification)
    .delete(authorizeRoles('admin'), deleteNotification);

export default router;
