// This file contains the patient routes API routes.

import express from 'express';

import {
    createPatient,
    deletePatient,
    getPatientById,
    getMyPatientProfile,
    getPatients,
    linkPatientUser,
    updatePatient,
} from '../controllers/patientController.js';

import { protect } from '../middleware/authMiddleware.js';

import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.use(protect);

// Connect this API URL to its request handler.
router

    .route('/')

    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getPatients)

    .post(authorizeRoles('admin', 'receptionist'), createPatient);

// Connect this API URL to its request handler.
router.get('/me', authorizeRoles('patient'), getMyPatientProfile);

// Connect this API URL to its request handler.
router.patch('/:id/link-user', authorizeRoles('admin'), linkPatientUser);

// Connect this API URL to its request handler.
router

    .route('/:id')

    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getPatientById)

    .patch(authorizeRoles('admin', 'nurse', 'receptionist'), updatePatient)

    .delete(authorizeRoles('admin'), deletePatient);

export default router;
