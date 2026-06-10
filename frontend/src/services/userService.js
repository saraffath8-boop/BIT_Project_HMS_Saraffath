import { API_BASE_URL, apiGet, apiPatch, apiPost } from './apiClient.js';

const USERS_URL = `${API_BASE_URL}/users`;

export const getUsers = async ({ token, role = '', filters = {} }) => {
    return apiGet(USERS_URL, token, { role, ...filters }, 'Unable to load users');
};

export const createStaffUser = async (userData, token) => {
    return apiPost(`${USERS_URL}/admin/create-user`, userData, token, 'Unable to create staff user');
};

export const updateDoctorBookingProfile = async (doctorId, profileData, token) => {
    return apiPatch(`${USERS_URL}/admin/doctors/${doctorId}/booking-profile`, profileData, token, 'Unable to update doctor booking profile');
};
