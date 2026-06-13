import queueService from '../services/queueService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('cannot be empty') || error.message.includes('No queue')) return 400;
    return 500;
};

export const createQueueEntry = async (req, res) => {
    try {
        const queueEntry = await queueService.createQueueEntry(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Queue entry created successfully',
            queueEntry,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getQueueEntries = async (req, res) => {
    try {
        const queueEntries = await queueService.getQueueEntries(req.query);

        return res.status(200).json({
            success: true,
            queueEntries,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getQueueEntryById = async (req, res) => {
    try {
        const queueEntry = await queueService.getQueueEntryById(req.params.id);

        return res.status(200).json({
            success: true,
            queueEntry,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateQueueEntry = async (req, res) => {
    try {
        const queueEntry = await queueService.updateQueueEntry(req.params.id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Queue entry updated successfully',
            queueEntry,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteQueueEntry = async (req, res) => {
    try {
        const queueEntry = await queueService.deleteQueueEntry(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Queue entry deleted successfully',
            queueEntry,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
