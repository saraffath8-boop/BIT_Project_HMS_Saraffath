// This file contains the auth service business workflow.

import axios from 'axios';

// Store the api base url setting used by this file.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Store the auth url setting used by this file.
const AUTH_URL = `${API_BASE_URL}/users`;

// Load error message.
const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || error.message || fallbackMessage;
};

// Create user.
export const signupUser = async (formData) => {
    try {
        const response = await axios.post(`${AUTH_URL}/signup`, formData);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Signup failed'), { cause: error });
    }
};

// Handle login user.
export const loginUser = async (formData) => {
    try {
        const response = await axios.post(`${AUTH_URL}/login`, formData);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Login failed'), { cause: error });
    }
};

// Handle request patient password reset.
export const requestPatientPasswordReset = async (phone) => {
    try {
        const response = await axios.post(`${AUTH_URL}/forgot-password`, { phone });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Unable to request password reset'), {
            cause: error,
        });
    }
};

// Handle reset patient password.
export const resetPatientPassword = async (formData) => {
    try {
        const response = await axios.post(`${AUTH_URL}/reset-password`, formData);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Unable to reset password'), { cause: error });
    }
};

// Load current user.
export const getCurrentUser = async (token) => {
    try {
        const response = await axios.get(`${AUTH_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Unable to load current user'), { cause: error });
    }
};

// Create user by admin.
export const createUserByAdmin = async (formData, token) => {
    try {
        const response = await axios.post(`${AUTH_URL}/admin/create-user`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Unable to create user'), { cause: error });
    }
};
