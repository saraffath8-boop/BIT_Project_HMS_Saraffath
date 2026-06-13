// This file contains the lab request controller HTTP request handlers.

import labRequestService from '../services/labRequestService.js';

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
        error.message.includes('At least one') ||
        error.message.includes('No lab request') ||
        error.message.includes('cannot change') ||
        error.message.includes('greater than')
    )
        return 400;
    return 500;
};

// Create lab request.
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

// Load lab requests.
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

// Load my lab requests.
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

// Load lab request by id.
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

// Update lab request.
export const updateLabRequest = async (req, res) => {
    try {
        const labRequest = await labRequestService.updateLabRequest(
            req.params.id,
            req.body,
            req.user,
        );

        return res.status(200).json({
            success: true,
            message: 'Lab request updated successfully',
            labRequest,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update lab request paid.
export const markLabRequestPaid = async (req, res) => {
    try {
        const result = await labRequestService.markLabRequestPaid(
            req.params.id,
            req.body,
            req.user,
        );
        return res.status(200).json({
            success: true,
            message: 'Laboratory request marked paid, bill created, and sent to laboratory',
            ...result,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Remove lab request.
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
