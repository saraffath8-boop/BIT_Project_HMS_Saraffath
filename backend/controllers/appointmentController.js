// This file contains the appointment controller HTTP request handlers.

import appointmentService from '../services/appointmentService.js';

// Create the send error.
const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,
        message,
    });

// Load status code.
const getStatusCode = (error) => {
    if (error.statusCode) return error.statusCode;
    if (error.code === 11000) return 409;
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (
        error.message.includes('Invalid') ||
        error.message.includes('required') ||
        error.message.includes('No appointment')
    )
        return 400;
    return 500;
};

// Handle request appointment.
export const requestAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.requestAppointment(req.body, req.user);
        return res.status(201).json({
            success: true,
            message:
                'Appointment request submitted successfully. Please meet the receptionist for confirmation and payment.',
            appointment,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Handle request public appointment.
export const requestPublicAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.requestPublicAppointment(req.body);
        return res.status(201).json({
            success: true,
            message:
                'Appointment request submitted successfully. The receptionist will confirm your request and payment.',
            appointment,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Create consultation.
export const createConsultation = async (req, res) => {
    try {
        const consultation = await appointmentService.createConsultation(
            req.params.id,
            req.body,
            req.user,
        );
        return res
            .status(201)
            .json({ success: true, message: 'Consultation completed successfully', consultation });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Create appointment.
export const createAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.createAppointment(req.body, req.user);
        return res
            .status(201)
            .json({ success: true, message: 'Appointment created successfully', appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load appointments.
export const getAppointments = async (req, res) => {
    try {
        const appointments = await appointmentService.getAppointments(req.query, req.user);
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load receptionist pending appointments.
export const getReceptionistPendingAppointments = async (req, res) => {
    try {
        const appointments = await appointmentService.getReceptionistPendingAppointments();
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load receptionist confirmed queue.
export const getReceptionistConfirmedQueue = async (req, res) => {
    try {
        const appointments = await appointmentService.getReceptionistConfirmedQueue(req.user);
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update appointment.
export const confirmAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.confirmAppointment(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            message: 'Appointment confirmed successfully. Payment remains unpaid until collected.',
            appointment,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update appointment paid.
export const markAppointmentPaid = async (req, res) => {
    try {
        const result = await appointmentService.markAppointmentPaid(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            message: 'Appointment marked as paid successfully.',
            ...result,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update appointment checked.
export const markAppointmentChecked = async (req, res) => {
    try {
        const appointment = await appointmentService.markAppointmentChecked(
            req.params.id,
            req.user,
        );
        return res.status(200).json({
            success: true,
            message: 'Patient marked as checked',
            appointment,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load my appointments.
export const getMyAppointments = async (req, res) => {
    try {
        const appointments = await appointmentService.getMyAppointments(req.user.id);
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load appointment by id.
export const getAppointmentById = async (req, res) => {
    try {
        const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
        return res.status(200).json({ success: true, appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update appointment.
export const updateAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.updateAppointment(
            req.params.id,
            req.body,
            req.user,
        );
        return res
            .status(200)
            .json({ success: true, message: 'Appointment updated successfully', appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Remove appointment.
export const deleteAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.deleteAppointment(req.params.id);
        return res
            .status(200)
            .json({ success: true, message: 'Appointment deleted successfully', appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
