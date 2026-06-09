import mongoose from 'mongoose';
import notificationDao from '../dao/notificationDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import smsService from './smsService.js';

const NOTIFICATION_TYPES = ['appointment', 'billing', 'laboratory', 'radiology', 'pharmacy', 'system'];

const sanitizeNotification = (notification) => ({
    id: notification._id.toString(),
    recipient: notification.recipient,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    relatedPatient: notification.relatedPatient,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
});

const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);

const validateUserExists = async (userId) => {
    requireObjectId(userId, 'recipient user id');
    const user = await userDao.getUserById(userId);

    if (!user) {
        throw new Error('Recipient user not found');
    }

    return user;
};

const validatePatientExists = async (patientId) => {
    if (!patientId) {
        return null;
    }

    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);

    if (!patient) {
        throw new Error('Patient not found');
    }

    return patient;
};

const buildNotificationQuery = (queryParams, user) => {
    const query = {};

    if (user.role === 'admin' && queryParams.recipient) {
        requireObjectId(queryParams.recipient, 'recipient user id');
        query.recipient = queryParams.recipient;
    } else {
        query.recipient = user.id;
    }

    if (queryParams.type) {
        if (!NOTIFICATION_TYPES.includes(queryParams.type)) {
            throw new Error('Invalid notification type');
        }
        query.type = queryParams.type;
    }

    if (queryParams.isRead === 'true') {
        query.isRead = true;
    }

    if (queryParams.isRead === 'false') {
        query.isRead = false;
    }

    return query;
};

const createNotification = async (data) => {
    const recipient = toCleanString(data.recipient);
    const title = toCleanString(data.title);
    const message = toCleanString(data.message);
    const type = toCleanString(data.type) || 'system';
    const relatedPatient = toCleanString(data.relatedPatient) || null;

    if (!recipient || !title || !message) {
        throw new Error('recipient, title, and message are required');
    }

    if (!NOTIFICATION_TYPES.includes(type)) {
        throw new Error('Invalid notification type');
    }

    const recipientUser = await validateUserExists(recipient);
    const selectedPatient = await validatePatientExists(relatedPatient);

    const notification = await notificationDao.createNotification({
        recipient,
        title,
        message,
        type,
        relatedPatient,
        isRead: false,
    });

    const populatedNotification = await notificationDao.getNotificationById(notification._id);
    const patientForSms = selectedPatient || (recipientUser.role === 'patient' ? await patientDao.getPatientByUserAccount(recipient) : null);

    if (patientForSms?.phone) {
        await smsService.sendSms({
            to: patientForSms.phone,
            message: `${title}: ${message}`,
        });
    }

    return sanitizeNotification(populatedNotification);
};

const getNotifications = async (queryParams, user) => {
    const query = buildNotificationQuery(queryParams, user);
    const notifications = await notificationDao.getNotifications(query);
    return notifications.map(sanitizeNotification);
};

const getNotificationById = async (id, user) => {
    requireObjectId(id, 'notification id');
    const notification = await notificationDao.getNotificationById(id);

    if (!notification) {
        throw new Error('Notification not found');
    }

    if (user.role !== 'admin' && notification.recipient._id.toString() !== user.id) {
        throw new Error('Notification not found');
    }

    return sanitizeNotification(notification);
};

const updateNotification = async (id, data, user) => {
    const existingNotification = await getNotificationById(id, user);
    const updateData = {};

    if (user.role === 'admin') {
        if (Object.prototype.hasOwnProperty.call(data, 'title')) {
            const title = toCleanString(data.title);
            if (!title) {
                throw new Error('title cannot be empty');
            }
            updateData.title = title;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'message')) {
            const message = toCleanString(data.message);
            if (!message) {
                throw new Error('message cannot be empty');
            }
            updateData.message = message;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'type')) {
            const type = toCleanString(data.type);
            if (!NOTIFICATION_TYPES.includes(type)) {
                throw new Error('Invalid notification type');
            }
            updateData.type = type;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'relatedPatient')) {
            const relatedPatient = toCleanString(data.relatedPatient) || null;
            await validatePatientExists(relatedPatient);
            updateData.relatedPatient = relatedPatient;
        }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'isRead')) {
        updateData.isRead = Boolean(data.isRead);
        updateData.readAt = updateData.isRead ? new Date() : null;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No notification fields provided for update');
    }

    const notification = await notificationDao.updateNotification(existingNotification.id, updateData);
    return sanitizeNotification(notification);
};

const deleteNotification = async (id) => {
    const notification = await getNotificationById(id, { role: 'admin' });
    await notificationDao.deleteNotification(id);
    return notification;
};

const notificationService = {
    createNotification,
    getNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
};

export default notificationService;
