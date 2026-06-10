import appointmentService from '../services/appointmentService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.statusCode) return error.statusCode;
    if (error.code === 11000) return 409;
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('No appointment')) return 400;
    return 500;
};

export const requestAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.requestAppointment(req.body, req.user);
        return res.status(201).json({
            success: true,
            message: 'Appointment request submitted successfully. Please meet the receptionist for confirmation and payment.',
            appointment,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const createConsultation = async (req, res) => {
    try {
        const consultation = await appointmentService.createConsultation(req.params.id, req.body, req.user);
        return res.status(201).json({ success: true, message: 'Consultation completed successfully', consultation });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const createAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.createAppointment(req.body, req.user);
        return res.status(201).json({ success: true, message: 'Appointment created successfully', appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getAppointments = async (req, res) => {
    try {
        const appointments = await appointmentService.getAppointments(req.query, req.user);
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMyAppointments = async (req, res) => {
    try {
        const appointments = await appointmentService.getMyAppointments(req.user.id);
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getAppointmentById = async (req, res) => {
    try {
        const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
        return res.status(200).json({ success: true, appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.updateAppointment(req.params.id, req.body, req.user);
        return res.status(200).json({ success: true, message: 'Appointment updated successfully', appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteAppointment = async (req, res) => {
    try {
        const appointment = await appointmentService.deleteAppointment(req.params.id);
        return res.status(200).json({ success: true, message: 'Appointment deleted successfully', appointment });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
