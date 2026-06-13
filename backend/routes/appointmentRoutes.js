import express from 'express';
import {
    createAppointment,
    createConsultation,
    confirmAppointment,
    deleteAppointment,
    getAppointmentById,
    getAppointments,
    getReceptionistPendingAppointments,
    getReceptionistConfirmedQueue,
    getMyAppointments,
    markAppointmentPaid,
    markAppointmentChecked,
    updateAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointments)
    .post(authorizeRoles('receptionist'), createAppointment);

router
    .get('/my', authorizeRoles('patient'), getMyAppointments);

router.get('/receptionist/pending', authorizeRoles('receptionist'), getReceptionistPendingAppointments);
router.get('/receptionist/confirmed-queue', authorizeRoles('receptionist', 'doctor'), getReceptionistConfirmedQueue);
router.patch('/:id/confirm', authorizeRoles('receptionist'), confirmAppointment);
router.patch('/:id/mark-paid', authorizeRoles('receptionist'), markAppointmentPaid);
router.patch('/:id/mark-checked', authorizeRoles('doctor'), markAppointmentChecked);
router.post('/:id/consultation', authorizeRoles('doctor'), createConsultation);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointmentById)
    .patch(authorizeRoles('admin', 'receptionist'), updateAppointment)
    .delete(authorizeRoles('admin'), deleteAppointment);

export default router;
