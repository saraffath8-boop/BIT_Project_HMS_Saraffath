import radiologyRequestService from '../services/radiologyRequestService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('valid date') || error.message.includes('No radiology request')) return 400;
    return 500;
};

export const createRadiologyRequest = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.createRadiologyRequest(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Radiology request created successfully',
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getRadiologyRequests = async (req, res) => {
    try {
        const radiologyRequests = await radiologyRequestService.getRadiologyRequests(req.query, req.user);

        return res.status(200).json({
            success: true,
            radiologyRequests,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMyRadiologyRequests = async (req, res) => {
    try {
        const radiologyRequests = await radiologyRequestService.getMyRadiologyRequests(req.user.id);

        return res.status(200).json({
            success: true,
            radiologyRequests,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getRadiologyRequestById = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.getRadiologyRequestById(req.params.id, req.user);

        return res.status(200).json({
            success: true,
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateRadiologyRequest = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.updateRadiologyRequest(req.params.id, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Radiology request updated successfully',
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteRadiologyRequest = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.deleteRadiologyRequest(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Radiology request deleted successfully',
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
