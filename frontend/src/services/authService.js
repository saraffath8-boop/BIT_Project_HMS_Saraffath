import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_URL = `${API_BASE_URL}/users`;

const getErrorMessage = (error, fallbackMessage) => {
    return error.response?.data?.message || error.message || fallbackMessage;
};

export const signupUser = async (formData) => {
    try {
        const response = await axios.post(`${AUTH_URL}/signup`, formData);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Signup failed'), { cause: error });
    }
};

export const loginUser = async (formData) => {
    try {
        const response = await axios.post(`${AUTH_URL}/login`, formData);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Login failed'), { cause: error });
    }
};

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
