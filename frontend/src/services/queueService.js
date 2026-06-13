// This file contains the queue service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the queue url setting used by this file.
const QUEUE_URL = `${API_BASE_URL}/queue`;

// Load queue entries.
export const getQueueEntries = async ({ token, filters = {} }) => {
    return apiGet(QUEUE_URL, token, filters, 'Unable to load queue entries');
};

// Load queue entry by id.
export const getQueueEntryById = async (id, token) => {
    return apiGet(`${QUEUE_URL}/${id}`, token, {}, 'Unable to load queue entry');
};

// Create queue entry.
export const createQueueEntry = async (queueData, token) => {
    return apiPost(QUEUE_URL, queueData, token, 'Unable to create queue entry');
};

// Update queue entry.
export const updateQueueEntry = async (id, queueData, token) => {
    return apiPatch(`${QUEUE_URL}/${id}`, queueData, token, 'Unable to update queue entry');
};

// Remove queue entry.
export const deleteQueueEntry = async (id, token) => {
    return apiDelete(`${QUEUE_URL}/${id}`, token, 'Unable to delete queue entry');
};
