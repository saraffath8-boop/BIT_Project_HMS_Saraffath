import { API_BASE_URL, apiGet, apiPost } from './apiClient.js';

export const getDepartments = async () => apiGet(`${API_BASE_URL}/departments`, undefined, {}, 'Unable to load departments');

export const getDoctorsByDepartment = async (departmentId) => apiGet(
    `${API_BASE_URL}/doctors`,
    undefined,
    { departmentId },
    'Unable to load doctors'
);

export const getDoctorAvailability = async (doctorId, date) => apiGet(
    `${API_BASE_URL}/doctors/${doctorId}/availability`,
    undefined,
    { date },
    'Unable to load available time slots'
);

export const requestAppointment = async (appointmentData, token) => apiPost(
    `${API_BASE_URL}/appointments/request`,
    appointmentData,
    token,
    'Unable to submit appointment request'
);
