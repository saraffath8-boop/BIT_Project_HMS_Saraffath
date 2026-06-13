import axios from 'axios';



const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PATIENTS_URL = `${API_BASE_URL}/patients`;



const authHeaders = (token) => ({

    headers: {

        Authorization: `Bearer ${token}`,

    },

});



const getErrorMessage = (error, fallbackMessage) => {

    return error.response?.data?.message || error.message || fallbackMessage;

};



export const getPatients = async ({ token, search = '', page = 1, limit = 20 }) => {

    try {

        const response = await axios.get(PATIENTS_URL, {

            ...authHeaders(token),

            params: { search, page, limit },

        });

        return response.data;

    } catch (error) {

        throw new Error(getErrorMessage(error, 'Unable to load patients'), { cause: error });

    }

};



export const getPatientById = async (id, token) => {

    try {

        const response = await axios.get(`${PATIENTS_URL}/${id}`, authHeaders(token));

        return response.data;

    } catch (error) {

        throw new Error(getErrorMessage(error, 'Unable to load patient'), { cause: error });

    }

};



export const getMyPatientProfile = async (token) => {

    try {

        const response = await axios.get(`${PATIENTS_URL}/me`, authHeaders(token));

        return response.data;

    } catch (error) {

        throw new Error(getErrorMessage(error, 'Unable to load your patient profile'), { cause: error });

    }

};



export const createPatient = async (patientData, token) => {

    try {

        const response = await axios.post(PATIENTS_URL, patientData, authHeaders(token));

        return response.data;

    } catch (error) {

        throw new Error(getErrorMessage(error, 'Unable to create patient'), { cause: error });

    }

};



export const updatePatient = async (id, patientData, token) => {

    try {

        const response = await axios.patch(`${PATIENTS_URL}/${id}`, patientData, authHeaders(token));

        return response.data;

    } catch (error) {

        throw new Error(getErrorMessage(error, 'Unable to update patient'), { cause: error });

    }

};



export const linkPatientUser = async (id, userId, token) => {

    try {

        const response = await axios.patch(`${PATIENTS_URL}/${id}/link-user`, { userId }, authHeaders(token));

        return response.data;

    } catch (error) {

        throw new Error(getErrorMessage(error, 'Unable to link patient user account'), { cause: error });

    }

};



export const deletePatient = async (id, token) => {

    try {

        const response = await axios.delete(`${PATIENTS_URL}/${id}`, authHeaders(token));

        return response.data;

    } catch (error) {

        throw new Error(getErrorMessage(error, 'Unable to delete patient'), { cause: error });

    }

};
