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

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getQueueEntries)
    .post(authorizeRoles('admin', 'nurse', 'receptionist'), createQueueEntry);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getQueueEntryById)
    .patch(authorizeRoles('admin', 'nurse', 'receptionist'), updateQueueEntry)
    .delete(authorizeRoles('admin'), deleteQueueEntry);

export default router;
