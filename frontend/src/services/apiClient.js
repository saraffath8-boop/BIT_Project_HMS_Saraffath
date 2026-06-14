// This file contains the api client business workflow.

import axios from 'axios';

// Store the api base url setting used by this file.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Handle auth headers.
export const authHeaders = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// Load error message.
export const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || error.message || fallbackMessage;
};

// Handle api get.
export const apiGet = async (url, token, params = {}, fallbackMessage = 'Unable to load data') => {
    try {
        const response = await axios.get(url, {
            ...authHeaders(token),
            params,
        });
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};

// Handle api post.
export const apiPost = async (url, data, token, fallbackMessage = 'Unable to create record') => {
    try {
        const response = await axios.post(url, data, authHeaders(token));
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};

// Handle api patch.
export const apiPatch = async (url, data, token, fallbackMessage = 'Unable to update record') => {
    try {
        const response = await axios.patch(url, data, authHeaders(token));
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};

// Handle api put.
export const apiPut = async (url, data, token, fallbackMessage = 'Unable to update record') => {
    try {
        const response = await axios.put(url, data, authHeaders(token));
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};

// Handle api delete.
export const apiDelete = async (url, token, fallbackMessage = 'Unable to delete record') => {
    try {
        const response = await axios.delete(url, authHeaders(token));
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};
