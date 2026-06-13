// This file contains the radiology request controller HTTP request handlers.

import radiologyRequestService from '../services/radiologyRequestService.js';

// Create the send error.
const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,
        message,
    });

// Load status code.
const getStatusCode = (error) => {
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('already paid') || error.message.includes('cannot be paid'))
        return 409;
    if (
        error.message.includes('Invalid') ||
        error.message.includes('required') ||
        error.message.includes('valid date') ||
        error.message.includes('No radiology request') ||
        error.message.includes('greater than')
    )
        return 400;
    return 500;
};

// Create radiology request.
export const createRadiologyRequest = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.createRadiologyRequest(
            req.body,
            req.user,
        );

        return res.status(201).json({
            success: true,
            message: 'Radiology request created successfully',
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load radiology requests.
export const getRadiologyRequests = async (req, res) => {
    try {
        const radiologyRequests = await radiologyRequestService.getRadiologyRequests(
            req.query,
            req.user,
        );

        return res.status(200).json({
            success: true,
            radiologyRequests,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load my radiology requests.
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

// Load radiology request by id.
export const getRadiologyRequestById = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.getRadiologyRequestById(
            req.params.id,
            req.user,
        );

        return res.status(200).json({
            success: true,
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update radiology request.
export const updateRadiologyRequest = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.updateRadiologyRequest(
            req.params.id,
            req.body,
            req.user,
        );

        return res.status(200).json({
            success: true,
            message: 'Radiology request updated successfully',
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update radiology request paid.
export const markRadiologyRequestPaid = async (req, res) => {
    try {
        const result = await radiologyRequestService.markRadiologyRequestPaid(
            req.params.id,
            req.body,
            req.user,
        );
        return res.status(200).json({
            success: true,
            message: 'Radiology request marked paid, bill created, and sent to radiology',
            ...result,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Remove radiology request.
export const deleteRadiologyRequest = async (req, res) => {
    try {
        const radiologyRequest = await radiologyRequestService.deleteRadiologyRequest(
            req.params.id,
        );

        return res.status(200).json({
            success: true,
            message: 'Radiology request deleted successfully',
            radiologyRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
