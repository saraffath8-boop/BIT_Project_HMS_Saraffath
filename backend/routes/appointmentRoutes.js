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
    requestPublicAppointment,
    requestAppointment,
    updateAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/request/public', requestPublicAppointment);

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointments)
    .post(authorizeRoles('admin', 'doctor', 'receptionist'), createAppointment);

router
    .get('/my', authorizeRoles('patient'), getMyAppointments);

router.post('/request', authorizeRoles('patient'), requestAppointment);
router.get('/receptionist/pending', authorizeRoles('receptionist'), getReceptionistPendingAppointments);
router.get('/receptionist/confirmed-queue', authorizeRoles('receptionist', 'doctor'), getReceptionistConfirmedQueue);
router.patch('/:id/confirm', authorizeRoles('receptionist'), confirmAppointment);
router.patch('/:id/mark-paid', authorizeRoles('receptionist'), markAppointmentPaid);
router.post('/:id/consultation', authorizeRoles('doctor'), createConsultation);

router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointmentById)
    .patch(authorizeRoles('admin', 'doctor', 'receptionist'), updateAppointment)
    .delete(authorizeRoles('admin'), deleteAppointment);

export default router;
