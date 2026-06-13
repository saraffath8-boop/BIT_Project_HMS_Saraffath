// This file contains the inventory service business workflow.

import mongoose from 'mongoose';
import inventoryDao from '../dao/inventoryDao.js';

// Store the inventory categories setting used by this file.
const INVENTORY_CATEGORIES = [
    'medical_supply',
    'equipment',
    'laboratory',
    'radiology',
    'office',
    'other',
];
// Store the inventory statuses setting used by this file.
const INVENTORY_STATUSES = ['active', 'inactive'];

// Prepare inventory item.
const sanitizeInventoryItem = (item) => ({
    id: item._id.toString(),
    name: item.name,
    itemCode: item.itemCode,
    category: item.category,
    unit: item.unit,
    stockQuantity: item.stockQuantity,
    reorderLevel: item.reorderLevel,
    supplier: item.supplier,
    location: item.location,
    status: item.status,
    createdBy: item.createdBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
});

// Validate object id.
const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

// Handle to clean string.
const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);

// Handle to number.
const toNumber = (value, fieldName) => {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue) || numberValue < 0) {
        throw new Error(`${fieldName} must be a number greater than or equal to zero`);
    }

    return numberValue;
};

// Prepare inventory query.
const buildInventoryQuery = (queryParams) => {
    const query = {};

    if (queryParams.category) {
        if (!INVENTORY_CATEGORIES.includes(queryParams.category)) {
            throw new Error('Invalid inventory category');
        }
        query.category = queryParams.category;
    }

    if (queryParams.status) {
        if (!INVENTORY_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid inventory status');
        }
        query.status = queryParams.status;
    }

    if (queryParams.search) {
        const search = toCleanString(queryParams.search);
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { itemCode: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
        ];
    }

    if (queryParams.lowStock === 'true') {
        query.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
        query.status = 'active';
    }

    return query;
};

// Load inventory item or throw.
const getInventoryItemOrThrow = async (id) => {
    requireObjectId(id, 'inventory item id');
    const item = await inventoryDao.getInventoryItemById(id);

    if (!item) {
        throw new Error('Inventory item not found');
    }

    return item;
};

// Create inventory item.
const createInventoryItem = async (data, user) => {
    const name = toCleanString(data.name);
    const itemCode = toCleanString(data.itemCode)?.toUpperCase();
    const unit = toCleanString(data.unit);
    const category = toCleanString(data.category) || 'other';

    if (!name || !itemCode || !unit) {
        throw new Error('name, itemCode, and unit are required');
    }

    if (!INVENTORY_CATEGORIES.includes(category)) {
        throw new Error('Invalid inventory category');
    }

    const existingItem = await inventoryDao.getInventoryItemByCode(itemCode);
    if (existingItem) {
        throw new Error('Inventory item code already exists');
    }

    const item = await inventoryDao.createInventoryItem({
        name,
        itemCode,
        category,
        unit,
        stockQuantity:
            data.stockQuantity === undefined ? 0 : toNumber(data.stockQuantity, 'stockQuantity'),
        reorderLevel:
            data.reorderLevel === undefined ? 10 : toNumber(data.reorderLevel, 'reorderLevel'),
        supplier: toCleanString(data.supplier) || '',
        location: toCleanString(data.location) || '',
        status: data.status || 'active',
        createdBy: user.id,
    });

    const populatedItem = await inventoryDao.getInventoryItemById(item._id);
    return sanitizeInventoryItem(populatedItem);
};

// Load inventory items.
const getInventoryItems = async (queryParams) => {
    const query = buildInventoryQuery(queryParams);
    const items = await inventoryDao.getInventoryItems(query);
    return items.map(sanitizeInventoryItem);
};

// Load inventory item by id.
const getInventoryItemById = async (id) => {
    const item = await getInventoryItemOrThrow(id);
    return sanitizeInventoryItem(item);
};

// Update inventory item.
const updateInventoryItem = async (id, data) => {
    await getInventoryItemOrThrow(id);

    const updateData = {};
    const stringFields = ['name', 'unit', 'supplier', 'location'];

    stringFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = toCleanString(data[field]) || '';
        }
    });

    if (Object.prototype.hasOwnProperty.call(data, 'itemCode')) {
        const itemCode = toCleanString(data.itemCode)?.toUpperCase();
        if (!itemCode) {
            throw new Error('itemCode cannot be empty');
        }

        const existingItem = await inventoryDao.getInventoryItemByCode(itemCode);
        if (existingItem && existingItem._id.toString() !== id) {
            throw new Error('Inventory item code already exists');
        }

        updateData.itemCode = itemCode;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'category')) {
        const category = toCleanString(data.category);
        if (!INVENTORY_CATEGORIES.includes(category)) {
            throw new Error('Invalid inventory category');
        }
        updateData.category = category;
    }

    ['stockQuantity', 'reorderLevel'].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = toNumber(data[field], field);
        }
    });

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!INVENTORY_STATUSES.includes(status)) {
            throw new Error('Invalid inventory status');
        }
        updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No inventory fields provided for update');
    }

    const item = await inventoryDao.updateInventoryItem(id, updateData);
    return sanitizeInventoryItem(item);
};

// Remove inventory item.
const deleteInventoryItem = async (id) => {
    const item = await getInventoryItemOrThrow(id);
    await inventoryDao.deleteInventoryItem(id);
    return sanitizeInventoryItem(item);
};

// Handle inventory service.
const inventoryService = {
    createInventoryItem,
    getInventoryItems,
    getInventoryItemById,
    updateInventoryItem,
    deleteInventoryItem,
};

export default inventoryService;
