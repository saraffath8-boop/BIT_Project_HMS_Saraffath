import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const PRESCRIPTIONS_URL = `${API_BASE_URL}/prescriptions`;

export const getPrescriptions = async ({ token, filters = {} }) => {
    return apiGet(PRESCRIPTIONS_URL, token, filters, 'Unable to load prescriptions');
};

export const getPrescriptionById = async (id, token) => {
    return apiGet(`${PRESCRIPTIONS_URL}/${id}`, token, {}, 'Unable to load prescription');
};

export const getMyPrescriptions = async (token) => {
    return apiGet(`${PRESCRIPTIONS_URL}/my`, token, {}, 'Unable to load your prescriptions');
};

export const createPrescription = async (prescriptionData, token) => {
    return apiPost(PRESCRIPTIONS_URL, prescriptionData, token, 'Unable to create prescription');
};

export const updatePrescription = async (id, prescriptionData, token) => {
    return apiPatch(`${PRESCRIPTIONS_URL}/${id}`, prescriptionData, token, 'Unable to update prescription');
};

export const deletePrescription = async (id, token) => {
    return apiDelete(`${PRESCRIPTIONS_URL}/${id}`, token, 'Unable to delete prescription');
};
