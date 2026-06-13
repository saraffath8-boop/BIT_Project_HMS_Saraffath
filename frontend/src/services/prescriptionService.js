// This file contains the prescription service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the prescriptions url setting used by this file.
const PRESCRIPTIONS_URL = `${API_BASE_URL}/prescriptions`;

// Load prescriptions.
export const getPrescriptions = async ({ token, filters = {} }) => {
    return apiGet(PRESCRIPTIONS_URL, token, filters, 'Unable to load prescriptions');
};

// Load prescription by id.
export const getPrescriptionById = async (id, token) => {
    return apiGet(`${PRESCRIPTIONS_URL}/${id}`, token, {}, 'Unable to load prescription');
};

// Load my prescriptions.
export const getMyPrescriptions = async (token) => {
    return apiGet(`${PRESCRIPTIONS_URL}/my`, token, {}, 'Unable to load your prescriptions');
};

// Create prescription.
export const createPrescription = async (prescriptionData, token) => {
    return apiPost(PRESCRIPTIONS_URL, prescriptionData, token, 'Unable to create prescription');
};

// Update prescription.
export const updatePrescription = async (id, prescriptionData, token) => {
    return apiPatch(
        `${PRESCRIPTIONS_URL}/${id}`,
        prescriptionData,
        token,
        'Unable to update prescription',
    );
};

// Update prescription paid.
export const markPrescriptionPaid = async (id, pricingItems, token) => {
    return apiPatch(
        `${PRESCRIPTIONS_URL}/${id}/mark-paid`,
        { pricingItems },
        token,
        'Unable to mark prescription as paid',
    );
};

// Remove prescription.
export const deletePrescription = async (id, token) => {
    return apiDelete(`${PRESCRIPTIONS_URL}/${id}`, token, 'Unable to delete prescription');
};
