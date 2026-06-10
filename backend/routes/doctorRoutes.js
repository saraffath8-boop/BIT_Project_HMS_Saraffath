import express from 'express';
import { getDoctorAvailability, getDoctors } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/', getDoctors);
router.get('/:doctorId/availability', getDoctorAvailability);

export default router;
