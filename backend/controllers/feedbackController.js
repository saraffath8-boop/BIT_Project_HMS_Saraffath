import feedbackService from '../services/feedbackService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('No feedback')) return 400;
    return 500;
};

export const createFeedback = async (req, res) => {
    try {
        const feedback = await feedbackService.createFeedback(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getFeedbackEntries = async (req, res) => {
    try {
        const feedbackEntries = await feedbackService.getFeedbackEntries(req.query, req.user);

        return res.status(200).json({
            success: true,
            feedbackEntries,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getFeedbackById = async (req, res) => {
    try {
        const feedback = await feedbackService.getFeedbackById(req.params.id, req.user);

        return res.status(200).json({
            success: true,
            feedback,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateFeedback = async (req, res) => {
    try {
        const feedback = await feedbackService.updateFeedback(req.params.id, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Feedback updated successfully',
            feedback,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteFeedback = async (req, res) => {
    try {
        const feedback = await feedbackService.deleteFeedback(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully',
            feedback,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
