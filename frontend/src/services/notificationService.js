import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const NOTIFICATIONS_URL = `${API_BASE_URL}/notifications`;

export const getNotifications = async ({ token, filters = {} }) => {
    return apiGet(NOTIFICATIONS_URL, token, filters, 'Unable to load notifications');
};

export const getNotificationById = async (id, token) => {
    return apiGet(`${NOTIFICATIONS_URL}/${id}`, token, {}, 'Unable to load notification');
};

export const createNotification = async (notificationData, token) => {
    return apiPost(NOTIFICATIONS_URL, notificationData, token, 'Unable to create notification');
};

export const updateNotification = async (id, notificationData, token) => {
    return apiPatch(`${NOTIFICATIONS_URL}/${id}`, notificationData, token, 'Unable to update notification');
};

export const markNotificationAsRead = async (id, token) => {
    return apiPatch(`${NOTIFICATIONS_URL}/${id}`, { isRead: true }, token, 'Unable to mark notification as read');
};

export const deleteNotification = async (id, token) => {
    return apiDelete(`${NOTIFICATIONS_URL}/${id}`, token, 'Unable to delete notification');
};
