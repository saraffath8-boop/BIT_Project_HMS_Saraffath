// This file contains the user route API routes.

import express from 'express';
import { getCurrentUser, loginUser, signupUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.post('/signup', signupUser);
// Connect this API URL to its request handler.
router.post('/login', loginUser);
// Connect this API URL to its request handler.
router.get('/me', protect, getCurrentUser);

export default router;
