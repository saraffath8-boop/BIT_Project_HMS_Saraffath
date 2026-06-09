import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const MEDICINES_URL = `${API_BASE_URL}/medicines`;

export const getMedicines = async ({ token, filters = {} }) => {
    return apiGet(MEDICINES_URL, token, filters, 'Unable to load medicines');
};

export const getMedicineById = async (id, token) => {
    return apiGet(`${MEDICINES_URL}/${id}`, token, {}, 'Unable to load medicine');
};

export const createMedicine = async (medicineData, token) => {
    return apiPost(MEDICINES_URL, medicineData, token, 'Unable to create medicine');
};

export const updateMedicine = async (id, medicineData, token) => {
    return apiPatch(`${MEDICINES_URL}/${id}`, medicineData, token, 'Unable to update medicine');
};

export const deleteMedicine = async (id, token) => {
    return apiDelete(`${MEDICINES_URL}/${id}`, token, 'Unable to delete medicine');
};
