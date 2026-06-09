import express from 'express';
import {
    createAppointment,
    deleteAppointment,
    getAppointmentById,
    getAppointments,
    getMyAppointments,
    updateAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointments)
    .post(authorizeRoles('admin', 'doctor'), createAppointment);

router
    .get('/my', authorizeRoles('patient'), getMyAppointments);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointmentById)
    .patch(authorizeRoles('admin', 'doctor'), updateAppointment)
    .delete(authorizeRoles('admin'), deleteAppointment);

export default router;
