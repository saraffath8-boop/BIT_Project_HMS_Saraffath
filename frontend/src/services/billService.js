import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const BILLS_URL = `${API_BASE_URL}/bills`;

export const getBills = async ({ token, filters = {} }) => {
    return apiGet(BILLS_URL, token, filters, 'Unable to load bills');
};

export const getBillById = async (id, token) => {
    return apiGet(`${BILLS_URL}/${id}`, token, {}, 'Unable to load bill');
};

export const getMyBills = async (token) => {
    return apiGet(`${BILLS_URL}/my`, token, {}, 'Unable to load your bills');
};

export const createBill = async (billData, token) => {
    return apiPost(BILLS_URL, billData, token, 'Unable to create bill');
};

export const updateBill = async (id, billData, token) => {
    return apiPatch(`${BILLS_URL}/${id}`, billData, token, 'Unable to update bill');
};

export const deleteBill = async (id, token) => {
    return apiDelete(`${BILLS_URL}/${id}`, token, 'Unable to delete bill');
};
