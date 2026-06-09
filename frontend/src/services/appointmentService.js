import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const APPOINTMENTS_URL = `${API_BASE_URL}/appointments`;

export const getAppointments = async ({ token, filters = {} }) => {
    return apiGet(APPOINTMENTS_URL, token, filters, 'Unable to load appointments');
};

export const getAppointmentById = async (id, token) => {
    return apiGet(`${APPOINTMENTS_URL}/${id}`, token, {}, 'Unable to load appointment');
};

export const getMyAppointments = async (token) => {
    return apiGet(`${APPOINTMENTS_URL}/my`, token, {}, 'Unable to load your appointments');
};

export const createAppointment = async (appointmentData, token) => {
    return apiPost(APPOINTMENTS_URL, appointmentData, token, 'Unable to create appointment');
};

export const updateAppointment = async (id, appointmentData, token) => {
    return apiPatch(`${APPOINTMENTS_URL}/${id}`, appointmentData, token, 'Unable to update appointment');
};

export const deleteAppointment = async (id, token) => {
    return apiDelete(`${APPOINTMENTS_URL}/${id}`, token, 'Unable to delete appointment');
};
