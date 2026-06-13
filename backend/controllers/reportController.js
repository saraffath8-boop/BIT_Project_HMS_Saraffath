// This file contains the report controller HTTP request handlers.

import reportService from '../services/reportService.js';

// Create the send error.
const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,
        message,
    });

// Load status code.
const getStatusCode = (error) => {
    if (error.message.includes('valid date')) return 400;
    return 500;
};

// Load dashboard report.
export const getDashboardReport = async (req, res) => {
    try {
        const report = await reportService.getDashboardReport();

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

// Load revenue report.
export const getRevenueReport = async (req, res) => {
    try {
        const report = await reportService.getRevenueReport(req.query);

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
