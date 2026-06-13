// This file contains the appointment routes API routes.

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

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router
    .route('/')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointments)
    .post(authorizeRoles('receptionist'), createAppointment);

// Connect this API URL to its request handler.
router.get('/my', authorizeRoles('patient'), getMyAppointments);

// Connect this API URL to its request handler.
router.get(
    '/receptionist/pending',
    authorizeRoles('receptionist'),
    getReceptionistPendingAppointments,
);
// Connect this API URL to its request handler.
router.get(
    '/receptionist/confirmed-queue',
    authorizeRoles('receptionist', 'doctor'),
    getReceptionistConfirmedQueue,
);
// Connect this API URL to its request handler.
router.patch('/:id/confirm', authorizeRoles('receptionist'), confirmAppointment);
// Connect this API URL to its request handler.
router.patch('/:id/mark-paid', authorizeRoles('receptionist'), markAppointmentPaid);
// Connect this API URL to its request handler.
router.patch('/:id/mark-checked', authorizeRoles('doctor'), markAppointmentChecked);
// Connect this API URL to its request handler.
router.post('/:id/consultation', authorizeRoles('doctor'), createConsultation);

// Connect this API URL to its request handler.
router
    .route('/:id')
    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getAppointmentById)
    .patch(authorizeRoles('admin', 'receptionist'), updateAppointment)
    .delete(authorizeRoles('admin'), deleteAppointment);

export default router;
