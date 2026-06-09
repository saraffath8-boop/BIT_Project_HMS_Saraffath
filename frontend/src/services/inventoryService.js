import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

const INVENTORY_URL = `${API_BASE_URL}/inventory`;

export const getInventoryItems = async ({ token, filters = {} }) => {
    return apiGet(INVENTORY_URL, token, filters, 'Unable to load inventory items');
};

export const getInventoryItemById = async (id, token) => {
    return apiGet(`${INVENTORY_URL}/${id}`, token, {}, 'Unable to load inventory item');
};

export const createInventoryItem = async (inventoryData, token) => {
    return apiPost(INVENTORY_URL, inventoryData, token, 'Unable to create inventory item');
};

export const updateInventoryItem = async (id, inventoryData, token) => {
    return apiPatch(`${INVENTORY_URL}/${id}`, inventoryData, token, 'Unable to update inventory item');
};

export const deleteInventoryItem = async (id, token) => {
    return apiDelete(`${INVENTORY_URL}/${id}`, token, 'Unable to delete inventory item');
};
