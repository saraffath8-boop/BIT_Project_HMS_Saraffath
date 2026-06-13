// This file contains the lab request service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the lab requests url setting used by this file.
const LAB_REQUESTS_URL = `${API_BASE_URL}/lab-requests`;

// Load lab requests.
export const getLabRequests = async ({ token, filters = {} }) => {
    return apiGet(LAB_REQUESTS_URL, token, filters, 'Unable to load lab requests');
};

// Load lab request by id.
export const getLabRequestById = async (id, token) => {
    return apiGet(`${LAB_REQUESTS_URL}/${id}`, token, {}, 'Unable to load lab request');
};

// Load my lab requests.
export const getMyLabRequests = async (token) => {
    return apiGet(`${LAB_REQUESTS_URL}/my`, token, {}, 'Unable to load your lab reports');
};

// Create lab request.
export const createLabRequest = async (labRequestData, token) => {
    return apiPost(LAB_REQUESTS_URL, labRequestData, token, 'Unable to create lab request');
};

// Update lab request.
export const updateLabRequest = async (id, labRequestData, token) => {
    return apiPatch(
        `${LAB_REQUESTS_URL}/${id}`,
        labRequestData,
        token,
        'Unable to update lab request',
    );
};

// Update lab request paid.
export const markLabRequestPaid = async (id, amount, token) => {
    return apiPatch(
        `${LAB_REQUESTS_URL}/${id}/mark-paid`,
        { amount },
        token,
        'Unable to mark lab request as paid',
    );
};

// Remove lab request.
export const deleteLabRequest = async (id, token) => {
    return apiDelete(`${LAB_REQUESTS_URL}/${id}`, token, 'Unable to delete lab request');
};
