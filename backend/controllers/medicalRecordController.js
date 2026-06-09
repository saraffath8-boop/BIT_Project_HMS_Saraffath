import medicalRecordService from '../services/medicalRecordService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('valid date') || error.message.includes('No medical record')) return 400;
    return 500;
};

export const createMedicalRecord = async (req, res) => {
    try {
        const medicalRecord = await medicalRecordService.createMedicalRecord(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Medical record created successfully',
            medicalRecord,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMedicalRecords = async (req, res) => {
    try {
        const medicalRecords = await medicalRecordService.getMedicalRecords(req.query, req.user);

        return res.status(200).json({
            success: true,
            medicalRecords,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getMedicalRecordById = async (req, res) => {
    try {
        const medicalRecord = await medicalRecordService.getMedicalRecordById(req.params.id, req.user);

        return res.status(200).json({
            success: true,
            medicalRecord,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateMedicalRecord = async (req, res) => {
    try {
        const medicalRecord = await medicalRecordService.updateMedicalRecord(req.params.id, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Medical record updated successfully',
            medicalRecord,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteMedicalRecord = async (req, res) => {
    try {
        const medicalRecord = await medicalRecordService.deleteMedicalRecord(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Medical record deleted successfully',
            medicalRecord,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
