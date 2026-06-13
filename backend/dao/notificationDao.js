import Notification from '../models/notification.js';

class NotificationDao {
    async createNotification(notificationData) {
        const notification = new Notification(notificationData);
        return notification.save();
    }

    async getNotifications(query = {}) {
        return Notification.find(query)
            .populate('recipient', 'name email role')
            .populate('relatedPatient', 'patientId fullName phone')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getNotificationById(id) {
        return Notification.findById(id)
            .populate('recipient', 'name email role')
            .populate('relatedPatient', 'patientId fullName phone')
            .exec();
    }

    async updateNotification(id, updateData) {
        return Notification.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('recipient', 'name email role')
            .populate('relatedPatient', 'patientId fullName phone')
            .exec();
    }

    async deleteNotification(id) {
        return Notification.findByIdAndDelete(id).exec();
    }

    async countNotifications(query = {}) {
        return Notification.countDocuments(query).exec();
    }
}

export default new NotificationDao();
