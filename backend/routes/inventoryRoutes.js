// This file contains the inventory routes API routes.

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

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);
// Connect this API URL to its request handler.
router.use(authorizeRoles('admin'));

// Connect this API URL to its request handler.
router.route('/').get(getInventoryItems).post(createInventoryItem);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(getInventoryItemById)
    .patch(updateInventoryItem)
    .delete(deleteInventoryItem);

export default router;
