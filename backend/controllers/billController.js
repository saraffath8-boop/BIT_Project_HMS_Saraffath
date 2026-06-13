// This file contains the bill controller HTTP request handlers.

import billService from '../services/billService.js';

// Create the send error.
const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,
        message,
    });

// Load status code.
const getStatusCode = (error) => {
    if (error.message.includes('no longer pending')) return 409;
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (
        error.message.includes('Invalid') ||
        error.message.includes('required') ||
        error.message.includes('At least one') ||
        error.message.includes('greater than') ||
        error.message.includes('cannot be greater') ||
        error.message.includes('must belong') ||
        error.message.includes('Process every') ||
        error.message.includes('Duplicate')
    )
        return 400;
    return 500;
};

// Load pending patient decisions.
export const getPendingPatientDecisions = async (req, res) => {
    try {
        const requests = await billService.getPendingPatientDecisions(req.user);
        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update patient decisions.
export const processPatientDecisions = async (req, res) => {
    try {
        const result = await billService.processPatientDecisions(req.body, req.user);
        return res.status(201).json({
            success: true,
            message: result.bill
                ? 'Patient decisions processed and paid bill created successfully'
                : 'Patient decisions processed successfully. No bill was required.',
            ...result,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Create bill.
export const createBill = async (req, res) => {
    try {
        const bill = await billService.createBill(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Bill created successfully',
            bill,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load bills.
export const getBills = async (req, res) => {
    try {
        const bills = await billService.getBills(req.query, req.user);

        return res.status(200).json({
            success: true,
            bills,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load my bills.
export const getMyBills = async (req, res) => {
    try {
        const bills = await billService.getMyBills(req.user.id);

        return res.status(200).json({
            success: true,
            bills,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load bill by id.
export const getBillById = async (req, res) => {
    try {
        const bill = await billService.getBillById(req.params.id);

        return res.status(200).json({
            success: true,
            bill,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Update bill.
export const updateBill = async (req, res) => {
    try {
        const bill = await billService.updateBill(req.params.id, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Bill updated successfully',
            bill,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Remove bill.
export const deleteBill = async (req, res) => {
    try {
        const bill = await billService.deleteBill(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Bill deleted successfully',
            bill,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
