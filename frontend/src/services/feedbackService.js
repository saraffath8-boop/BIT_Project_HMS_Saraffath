import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const FEEDBACK_URL = `${API_BASE_URL}/feedback`;

export const getFeedbackEntries = async ({ token, filters = {} }) => {
    return apiGet(FEEDBACK_URL, token, filters, 'Unable to load feedback entries');
};

export const getFeedbackById = async (id, token) => {
    return apiGet(`${FEEDBACK_URL}/${id}`, token, {}, 'Unable to load feedback');
};

export const createFeedback = async (feedbackData, token) => {
    return apiPost(FEEDBACK_URL, feedbackData, token, 'Unable to submit feedback');
};

export const updateFeedback = async (id, feedbackData, token) => {
    return apiPatch(`${FEEDBACK_URL}/${id}`, feedbackData, token, 'Unable to update feedback');
};

export const deleteFeedback = async (id, token) => {
    return apiDelete(`${FEEDBACK_URL}/${id}`, token, 'Unable to delete feedback');
};
