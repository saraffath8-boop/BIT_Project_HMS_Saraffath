import billService from '../services/billService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message === 'No patient profile is linked to this account') return 404;
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('At least one') || error.message.includes('greater than') || error.message.includes('cannot be greater')) return 400;
    return 500;
};

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

export const getBills = async (req, res) => {
    try {
        const bills = await billService.getBills(req.query);

        return res.status(200).json({
            success: true,
            bills,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

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
