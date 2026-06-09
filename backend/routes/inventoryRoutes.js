import express from 'express';
import {
    createInventoryItem,
    deleteInventoryItem,
    getInventoryItemById,
    getInventoryItems,
    updateInventoryItem,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router
    .route('/')
    .get(getInventoryItems)
    .post(createInventoryItem);

router
    .route('/:id')
    .get(getInventoryItemById)
    .patch(updateInventoryItem)
    .delete(deleteInventoryItem);

export default router;
