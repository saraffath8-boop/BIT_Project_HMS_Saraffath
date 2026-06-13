// This file contains the auth routes API routes.

import express from 'express';
import {
    getCurrentUser,
    loginUser,
    requestPatientPasswordReset,
    resetPatientPassword,
    signupUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.post('/signup', signupUser);
// Connect this API URL to its request handler.
router.post('/login', loginUser);
// Connect this API URL to its request handler.
router.post('/forgot-password', requestPatientPasswordReset);
// Connect this API URL to its request handler.
router.post('/reset-password', resetPatientPassword);
// Connect this API URL to its request handler.
router.get('/me', protect, getCurrentUser);

export default router;
