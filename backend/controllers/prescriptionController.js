import prescriptionService from '../services/prescriptionService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('At least one') || error.message.includes('No prescription')) return 400;
    return 500;
};

export const createPrescription = async (req, res) => {
    try {
        const prescription = await prescriptionService.createPrescription(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            prescription,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getPrescriptions = async (req, res) => {
    try {
        const prescriptions = await prescriptionService.getPrescriptions(req.query, req.user);

        return res.status(200).json({
            success: true,
            prescriptions,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMyPrescriptions = async (req, res) => {
    try {
        const prescriptions = await prescriptionService.getMyPrescriptions(req.user.id);

        return res.status(200).json({
            success: true,
            prescriptions,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await prescriptionService.getPrescriptionById(req.params.id, req.user);

        return res.status(200).json({
            success: true,
            prescription,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updatePrescription = async (req, res) => {
    try {
        const prescription = await prescriptionService.updatePrescription(req.params.id, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Prescription updated successfully',
            prescription,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deletePrescription = async (req, res) => {
    try {
        const prescription = await prescriptionService.deletePrescription(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Prescription deleted successfully',
            prescription,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
