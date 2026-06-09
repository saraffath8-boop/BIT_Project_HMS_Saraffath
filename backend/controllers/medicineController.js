import medicineService from '../services/medicineService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('already exists') || error.message.includes('cannot be empty') || error.message.includes('greater than') || error.message.includes('valid date') || error.message.includes('No medicine')) return 400;
    return 500;
};

export const createMedicine = async (req, res) => {
    try {
        const medicine = await medicineService.createMedicine(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Medicine created successfully',
            medicine,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMedicines = async (req, res) => {
    try {
        const medicines = await medicineService.getMedicines(req.query);

        return res.status(200).json({
            success: true,
            medicines,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMedicineById = async (req, res) => {
    try {
        const medicine = await medicineService.getMedicineById(req.params.id);

        return res.status(200).json({
            success: true,
            medicine,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateMedicine = async (req, res) => {
    try {
        const medicine = await medicineService.updateMedicine(req.params.id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Medicine updated successfully',
            medicine,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteMedicine = async (req, res) => {
    try {
        const medicine = await medicineService.deleteMedicine(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Medicine deleted successfully',
            medicine,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
