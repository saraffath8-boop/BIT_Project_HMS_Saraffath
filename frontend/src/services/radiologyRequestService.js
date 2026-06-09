import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const RADIOLOGY_REQUESTS_URL = `${API_BASE_URL}/radiology-requests`;

export const getRadiologyRequests = async ({ token, filters = {} }) => {
    return apiGet(RADIOLOGY_REQUESTS_URL, token, filters, 'Unable to load radiology requests');
};

export const getRadiologyRequestById = async (id, token) => {
    return apiGet(`${RADIOLOGY_REQUESTS_URL}/${id}`, token, {}, 'Unable to load radiology request');
};

export const getMyRadiologyRequests = async (token) => {
    return apiGet(`${RADIOLOGY_REQUESTS_URL}/my`, token, {}, 'Unable to load your radiology reports');
};

export const createRadiologyRequest = async (radiologyRequestData, token) => {
    return apiPost(RADIOLOGY_REQUESTS_URL, radiologyRequestData, token, 'Unable to create radiology request');
};

export const updateRadiologyRequest = async (id, radiologyRequestData, token) => {
    return apiPatch(`${RADIOLOGY_REQUESTS_URL}/${id}`, radiologyRequestData, token, 'Unable to update radiology request');
};

export const deleteRadiologyRequest = async (id, token) => {
    return apiDelete(`${RADIOLOGY_REQUESTS_URL}/${id}`, token, 'Unable to delete radiology request');
};
