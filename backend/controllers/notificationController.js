import notificationService from '../services/notificationService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('cannot be empty') || error.message.includes('No notification')) return 400;
    return 500;
};

export const createNotification = async (req, res) => {
    try {
        const notification = await notificationService.createNotification(req.body);

        return res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            notification,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getNotifications(req.query, req.user);

        return res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getNotificationById = async (req, res) => {
    try {
        const notification = await notificationService.getNotificationById(req.params.id, req.user);

        return res.status(200).json({
            success: true,
            notification,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateNotification = async (req, res) => {
    try {
        const notification = await notificationService.updateNotification(req.params.id, req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Notification updated successfully',
            notification,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const notification = await notificationService.deleteNotification(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
            notification,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
