import express from 'express';
import {
    createAppointment,
    createConsultation,
    deleteAppointment,
    getAppointmentById,
    getAppointments,
    getMyAppointments,
    requestAppointment,
    updateAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointments)
    .post(authorizeRoles('admin', 'doctor', 'receptionist'), createAppointment);

router
    .get('/my', authorizeRoles('patient'), getMyAppointments);

router.post('/request', authorizeRoles('patient'), requestAppointment);
router.post('/:id/consultation', authorizeRoles('doctor'), createConsultation);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointmentById)
    .patch(authorizeRoles('admin', 'doctor', 'receptionist'), updateAppointment)
    .delete(authorizeRoles('admin'), deleteAppointment);

export default router;
