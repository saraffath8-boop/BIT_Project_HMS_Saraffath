import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const MEDICAL_RECORDS_URL = `${API_BASE_URL}/medical-records`;

export const getMedicalRecords = async ({ token, filters = {} }) => {
    return apiGet(MEDICAL_RECORDS_URL, token, filters, 'Unable to load medical records');
};

export const getMedicalRecordById = async (id, token) => {
    return apiGet(`${MEDICAL_RECORDS_URL}/${id}`, token, {}, 'Unable to load medical record');
};

export const createMedicalRecord = async (recordData, token) => {
    return apiPost(MEDICAL_RECORDS_URL, recordData, token, 'Unable to create medical record');
};

export const updateMedicalRecord = async (id, recordData, token) => {
    return apiPatch(`${MEDICAL_RECORDS_URL}/${id}`, recordData, token, 'Unable to update medical record');
};

export const deleteMedicalRecord = async (id, token) => {
    return apiDelete(`${MEDICAL_RECORDS_URL}/${id}`, token, 'Unable to delete medical record');
};
