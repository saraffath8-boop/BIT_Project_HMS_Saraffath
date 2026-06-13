import express from 'express';
import {
    getCurrentUser,
    loginUser,
    requestPatientPasswordReset,
    resetPatientPassword,
    signupUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPatientPasswordReset);
router.post('/reset-password', resetPatientPassword);
router.get('/me', protect, getCurrentUser);

export default router;
