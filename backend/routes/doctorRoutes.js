// This file contains the doctor routes API routes.

import express from 'express';
import { getDoctorAvailability, getDoctors } from '../controllers/doctorController.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.get('/', getDoctors);
// Connect this API URL to its request handler.
router.get('/:doctorId/availability', getDoctorAvailability);

export default router;
