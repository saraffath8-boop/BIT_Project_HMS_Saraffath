// This file contains the patient controller HTTP request handlers.

import patientService from '../services/patientService.js';

// Create the send error.
const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,

        message,
    });

// Load error status code.
const getErrorStatusCode = (error) => {
    if (error.message === 'No patient profile is linked to this account') return 404;

    if (error.message.includes('not found')) return 404;

    if (
        error.name === 'ValidationError' ||
        error.message.includes('Invalid') ||
        error.message.includes('invalid') ||
        error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('contains') ||
        error.message.includes('No allowed') ||
        error.message.includes('must have patient role') ||
        error.message.includes('already linked')
    )
        return 400;

    return 500;
};

// Create patient.
export const createPatient = async (req, res) => {
    try {
        const patient = await patientService.createPatient(req.body, req.user.id, req.user.role);

        return res.status(201).json({
            success: true,

            message: 'Patient created successfully',

            patient,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

// Load patients.
export const getPatients = async (req, res) => {
    try {
        const result = await patientService.getPatients(req.query, req.user.role);

        return res.status(200).json({
            success: true,

            ...result,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

// Load patient by id.
export const getPatientById = async (req, res) => {
    try {
        const patient = await patientService.getPatientById(req.params.id, req.user.role);

        return res.status(200).json({
            success: true,

            patient,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

// Load my patient profile.
export const getMyPatientProfile = async (req, res) => {
    try {
        const patient = await patientService.getMyPatientProfile(req.user.id);

        return res.status(200).json({
            success: true,

            patient,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

// Update patient.
export const updatePatient = async (req, res) => {
    try {
        const patient = await patientService.updatePatient(req.params.id, req.body, req.user.role);

        return res.status(200).json({
            success: true,

            message: 'Patient updated successfully',

            patient,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

// Handle link patient user.
export const linkPatientUser = async (req, res) => {
    try {
        const patient = await patientService.linkPatientUser(req.params.id, req.body.userId);

        return res.status(200).json({
            success: true,

            message: 'Patient user account linked successfully',

            patient,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

// Remove patient.
export const deletePatient = async (req, res) => {
    try {
        const patient = await patientService.deletePatient(req.params.id);

        return res.status(200).json({
            success: true,

            message: 'Patient deleted successfully',

            patient,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};
