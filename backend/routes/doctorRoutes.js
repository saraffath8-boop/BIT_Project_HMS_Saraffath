// This file contains the doctor routes API routes.

import express from 'express';
import {
    getDoctorAvailability,
    getDoctors,
    replaceDoctorAvailability,
} from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.get('/', getDoctors);
// Connect this API URL to its request handler.
router.get('/:doctorId/availability', getDoctorAvailability);
router.put(
    '/:doctorId/availability',
    protect,
    authorizeRoles('receptionist'),
    replaceDoctorAvailability,
);

export default router;
