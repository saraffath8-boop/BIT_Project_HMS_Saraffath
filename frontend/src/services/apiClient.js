import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authHeaders = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || error.message || fallbackMessage;
};

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

export const apiPost = async (url, data, token, fallbackMessage = 'Unable to create record') => {
    try {
        const response = await axios.post(url, data, authHeaders(token));
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};

export const apiPatch = async (url, data, token, fallbackMessage = 'Unable to update record') => {
    try {
        const response = await axios.patch(url, data, authHeaders(token));
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};

export const apiDelete = async (url, token, fallbackMessage = 'Unable to delete record') => {
    try {
        const response = await axios.delete(url, authHeaders(token));
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallbackMessage), { cause: error });
    }
};
