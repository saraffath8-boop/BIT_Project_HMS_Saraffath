// This file contains the bill service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the bills url setting used by this file.
const BILLS_URL = `${API_BASE_URL}/bills`;

// Load bills.
export const getBills = async ({ token, filters = {} }) => {
    return apiGet(BILLS_URL, token, filters, 'Unable to load bills');
};

// Load bill by id.
export const getBillById = async (id, token) => {
    return apiGet(`${BILLS_URL}/${id}`, token, {}, 'Unable to load bill');
};

// Load my bills.
export const getMyBills = async (token) => {
    return apiGet(`${BILLS_URL}/my`, token, {}, 'Unable to load your bills');
};

// Create bill.
export const createBill = async (billData, token) => {
    return apiPost(BILLS_URL, billData, token, 'Unable to create bill');
};

// Update bill.
export const updateBill = async (id, billData, token) => {
    return apiPatch(`${BILLS_URL}/${id}`, billData, token, 'Unable to update bill');
};

// Remove bill.
export const deleteBill = async (id, token) => {
    return apiDelete(`${BILLS_URL}/${id}`, token, 'Unable to delete bill');
};

// Load pending patient decisions.
export const getPendingPatientDecisions = async (token) => {
    return apiGet(
        `${BILLS_URL}/pending-decisions`,
        token,
        {},
        'Unable to load pending patient decisions',
    );
};

// Update patient decisions.
export const processPatientDecisions = async (data, token) => {
    return apiPost(
        `${BILLS_URL}/patient-decisions`,
        data,
        token,
        'Unable to process patient decisions',
    );
};
