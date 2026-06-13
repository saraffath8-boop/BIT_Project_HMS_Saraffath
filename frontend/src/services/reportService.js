import { API_BASE_URL, apiGet } from './apiClient.js';

const REPORTS_URL = `${API_BASE_URL}/reports`;

export const getDashboardReport = async (token) => {
    return apiGet(`${REPORTS_URL}/dashboard`, token, {}, 'Unable to load dashboard report');
};

export const getRevenueReport = async ({ token, filters = {} }) => {
    return apiGet(`${REPORTS_URL}/revenue`, token, filters, 'Unable to load revenue report');
};
