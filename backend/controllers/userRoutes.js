// This file contains the user routes HTTP request handlers.

import express from 'express';
import { createUserByAdmin, getUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.get(
    '/',
    protect,
    authorizeRoles('admin', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist'),
    getUsers,
);
// Connect this API URL to its request handler.
router.post('/admin/create-user', protect, authorizeRoles('admin'), createUserByAdmin);

export default router;
