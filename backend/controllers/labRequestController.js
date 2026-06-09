import labRequestService from '../services/labRequestService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('At least one') || error.message.includes('No lab request')) return 400;
    return 500;
};

export const createLabRequest = async (req, res) => {
    try {
        const labRequest = await labRequestService.createLabRequest(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Lab request created successfully',
            labRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getLabRequests = async (req, res) => {
    try {
        const labRequests = await labRequestService.getLabRequests(req.query, req.user);

        return res.status(200).json({
            success: true,
            labRequests,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMyLabRequests = async (req, res) => {
    try {
        const labRequests = await labRequestService.getMyLabRequests(req.user.id);

        return res.status(200).json({
            success: true,
            labRequests,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getLabRequestById = async (req, res) => {
    try {
        const labRequest = await labRequestService.getLabRequestById(req.params.id, req.user);

        return res.status(200).json({
            success: true,
            labRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateLabRequest = async (req, res) => {
    try {
        const labRequest = await labRequestService.updateLabRequest(req.params.id, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Lab request updated successfully',
            labRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteLabRequest = async (req, res) => {
    try {
        const labRequest = await labRequestService.deleteLabRequest(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Lab request deleted successfully',
            labRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
