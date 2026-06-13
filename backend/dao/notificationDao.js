// This file contains the notification dao database queries.

import Notification from '../models/notification.js';

// Group the notification dao database queries.
class NotificationDao {
    // Create notification.
    async createNotification(notificationData) {
        const notification = new Notification(notificationData);
        return notification.save();
    }

    // Load notifications.
    async getNotifications(query = {}) {
        return Notification.find(query)
            .populate('recipient', 'name email role')
            .populate('relatedPatient', 'patientId fullName phone')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Load notification by id.
    async getNotificationById(id) {
        return Notification.findById(id)
            .populate('recipient', 'name email role')
            .populate('relatedPatient', 'patientId fullName phone')
            .exec();
    }

    // Update notification.
    async updateNotification(id, updateData) {
        return Notification.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('recipient', 'name email role')
            .populate('relatedPatient', 'patientId fullName phone')
            .exec();
    }

    // Remove notification.
    async deleteNotification(id) {
        return Notification.findByIdAndDelete(id).exec();
    }

    // Handle count notifications.
    async countNotifications(query = {}) {
        return Notification.countDocuments(query).exec();
    }
}

export default new NotificationDao();
