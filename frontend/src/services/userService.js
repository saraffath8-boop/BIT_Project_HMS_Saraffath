// This file contains the user service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the users url setting used by this file.
const USERS_URL = `${API_BASE_URL}/users`;

// Load users.
export const getUsers = async ({ token, role = '', filters = {} }) => {
    return apiGet(USERS_URL, token, { role, ...filters }, 'Unable to load users');
};

// Create staff user.
export const createStaffUser = async (userData, token) => {
    return apiPost(
        `${USERS_URL}/admin/create-user`,
        userData,
        token,
        'Unable to create staff user',
    );
};

// Update doctor booking profile.
export const updateDoctorBookingProfile = async (doctorId, profileData, token) => {
    return apiPatch(
        `${USERS_URL}/admin/doctors/${doctorId}/booking-profile`,
        profileData,
        token,
        'Unable to update doctor booking profile',
    );
};

export const updateStaffUser = async (staffId, userData, token) =>
    apiPatch(`${USERS_URL}/admin/staff/${staffId}`, userData, token, 'Unable to update staff user');

export const deleteStaffUser = async (staffId, token) =>
    apiDelete(`${USERS_URL}/admin/staff/${staffId}`, token, 'Unable to remove staff user');
