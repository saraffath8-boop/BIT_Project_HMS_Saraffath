// This file contains the report service business workflow.

import { API_BASE_URL, apiGet } from './apiClient.js';

// Store the reports url setting used by this file.
const REPORTS_URL = `${API_BASE_URL}/reports`;

// Load dashboard report.
export const getDashboardReport = async (token) => {
    return apiGet(`${REPORTS_URL}/dashboard`, token, {}, 'Unable to load dashboard report');
};

// Load revenue report.
export const getRevenueReport = async ({ token, filters = {} }) => {
    return apiGet(`${REPORTS_URL}/revenue`, token, filters, 'Unable to load revenue report');
};

// Load comprehensive reports.
export const getComprehensiveReports = async ({ token, filters = {} }) => {
    return apiGet(
        `${REPORTS_URL}/comprehensive`,
        token,
        filters,
        'Unable to load comprehensive reports',
    );
};
