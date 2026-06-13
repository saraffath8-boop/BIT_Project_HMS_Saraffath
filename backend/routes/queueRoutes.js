// This file contains the queue routes API routes.

import express from 'express';
import {
    createQueueEntry,
    deleteQueueEntry,
    getQueueEntries,
    getQueueEntryById,
    updateQueueEntry,
} from '../controllers/queueController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getQueueEntries)
    .post(authorizeRoles('admin', 'nurse', 'receptionist'), createQueueEntry);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getQueueEntryById)
    .patch(authorizeRoles('admin', 'nurse', 'receptionist'), updateQueueEntry)
    .delete(authorizeRoles('admin'), deleteQueueEntry);

export default router;
