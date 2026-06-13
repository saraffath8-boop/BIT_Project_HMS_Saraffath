// This file contains the medicine service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the medicines url setting used by this file.
const MEDICINES_URL = `${API_BASE_URL}/medicines`;

// Load medicines.
export const getMedicines = async ({ token, filters = {} }) => {
    return apiGet(MEDICINES_URL, token, filters, 'Unable to load medicines');
};

// Load medicine by id.
export const getMedicineById = async (id, token) => {
    return apiGet(`${MEDICINES_URL}/${id}`, token, {}, 'Unable to load medicine');
};

// Create medicine.
export const createMedicine = async (medicineData, token) => {
    return apiPost(MEDICINES_URL, medicineData, token, 'Unable to create medicine');
};

// Update medicine.
export const updateMedicine = async (id, medicineData, token) => {
    return apiPatch(`${MEDICINES_URL}/${id}`, medicineData, token, 'Unable to update medicine');
};

// Remove medicine.
export const deleteMedicine = async (id, token) => {
    return apiDelete(`${MEDICINES_URL}/${id}`, token, 'Unable to delete medicine');
};
