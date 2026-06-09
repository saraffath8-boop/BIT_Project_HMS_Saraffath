import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const LAB_REQUESTS_URL = `${API_BASE_URL}/lab-requests`;

export const getLabRequests = async ({ token, filters = {} }) => {
    return apiGet(LAB_REQUESTS_URL, token, filters, 'Unable to load lab requests');
};

export const getLabRequestById = async (id, token) => {
    return apiGet(`${LAB_REQUESTS_URL}/${id}`, token, {}, 'Unable to load lab request');
};

export const getMyLabRequests = async (token) => {
    return apiGet(`${LAB_REQUESTS_URL}/my`, token, {}, 'Unable to load your lab reports');
};

export const createLabRequest = async (labRequestData, token) => {
    return apiPost(LAB_REQUESTS_URL, labRequestData, token, 'Unable to create lab request');
};

export const updateLabRequest = async (id, labRequestData, token) => {
    return apiPatch(`${LAB_REQUESTS_URL}/${id}`, labRequestData, token, 'Unable to update lab request');
};

export const deleteLabRequest = async (id, token) => {
    return apiDelete(`${LAB_REQUESTS_URL}/${id}`, token, 'Unable to delete lab request');
};
