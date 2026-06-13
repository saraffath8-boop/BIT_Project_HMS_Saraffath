// This file contains the radiology request service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the radiology requests url setting used by this file.
const RADIOLOGY_REQUESTS_URL = `${API_BASE_URL}/radiology-requests`;

// Load radiology requests.
export const getRadiologyRequests = async ({ token, filters = {} }) => {
    return apiGet(RADIOLOGY_REQUESTS_URL, token, filters, 'Unable to load radiology requests');
};

// Load radiology request by id.
export const getRadiologyRequestById = async (id, token) => {
    return apiGet(`${RADIOLOGY_REQUESTS_URL}/${id}`, token, {}, 'Unable to load radiology request');
};

// Load my radiology requests.
export const getMyRadiologyRequests = async (token) => {
    return apiGet(
        `${RADIOLOGY_REQUESTS_URL}/my`,
        token,
        {},
        'Unable to load your radiology reports',
    );
};

// Create radiology request.
export const createRadiologyRequest = async (radiologyRequestData, token) => {
    return apiPost(
        RADIOLOGY_REQUESTS_URL,
        radiologyRequestData,
        token,
        'Unable to create radiology request',
    );
};

// Update radiology request.
export const updateRadiologyRequest = async (id, radiologyRequestData, token) => {
    return apiPatch(
        `${RADIOLOGY_REQUESTS_URL}/${id}`,
        radiologyRequestData,
        token,
        'Unable to update radiology request',
    );
};

// Update radiology request paid.
export const markRadiologyRequestPaid = async (id, amount, token) => {
    return apiPatch(
        `${RADIOLOGY_REQUESTS_URL}/${id}/mark-paid`,
        { amount },
        token,
        'Unable to mark radiology request as paid',
    );
};

// Remove radiology request.
export const deleteRadiologyRequest = async (id, token) => {
    return apiDelete(
        `${RADIOLOGY_REQUESTS_URL}/${id}`,
        token,
        'Unable to delete radiology request',
    );
};
