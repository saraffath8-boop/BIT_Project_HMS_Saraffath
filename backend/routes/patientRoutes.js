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

const router = express.Router();

router.use(protect);

router

    .route('/')

    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getPatients)

    .post(authorizeRoles('admin', 'receptionist'), createPatient);

router.get('/me', authorizeRoles('patient'), getMyPatientProfile);

router.patch('/:id/link-user', authorizeRoles('admin'), linkPatientUser);

router

    .route('/:id')

    .get(authorizeRoles('admin', 'doctor', 'nurse', 'receptionist'), getPatientById)

    .patch(authorizeRoles('admin', 'nurse', 'receptionist'), updatePatient)

    .delete(authorizeRoles('admin'), deletePatient);

export default router;
