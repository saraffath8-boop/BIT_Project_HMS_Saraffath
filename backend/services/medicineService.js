// This file contains the medicine service business workflow.

import mongoose from 'mongoose';
import medicineDao from '../dao/medicineDao.js';

// Store the medicine statuses setting used by this file.
const MEDICINE_STATUSES = ['active', 'inactive'];

// Prepare medicine.
const sanitizeMedicine = (medicine) => ({
    id: medicine._id.toString(),
    name: medicine.name,
    sku: medicine.sku,
    category: medicine.category,
    manufacturer: medicine.manufacturer,
    unitPrice: medicine.unitPrice,
    stockQuantity: medicine.stockQuantity,
    reorderLevel: medicine.reorderLevel,
    expiryDate: medicine.expiryDate,
    status: medicine.status,
    createdBy: medicine.createdBy,
    createdAt: medicine.createdAt,
    updatedAt: medicine.updatedAt,
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

// Handle to optional date.
const toOptionalDate = (value, fieldName) => {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} must be a valid date`);
    }

    return date;
};

// Prepare medicine query.
const buildMedicineQuery = (queryParams) => {
    const query = {};

    if (queryParams.status) {
        if (!MEDICINE_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid medicine status');
        }
        query.status = queryParams.status;
    }

    if (queryParams.category) {
        query.category = toCleanString(queryParams.category);
    }

    if (queryParams.search) {
        const search = toCleanString(queryParams.search);
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
        ];
    }

    if (queryParams.lowStock === 'true') {
        query.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
        query.status = 'active';
    }

    return query;
};

// Load medicine or throw.
const getMedicineOrThrow = async (id) => {
    requireObjectId(id, 'medicine id');
    const medicine = await medicineDao.getMedicineById(id);

    if (!medicine) {
        throw new Error('Medicine not found');
    }

    return medicine;
};

// Create medicine.
const createMedicine = async (data, user) => {
    const name = toCleanString(data.name);
    const sku = toCleanString(data.sku)?.toUpperCase();

    if (!name || !sku || data.unitPrice === undefined) {
        throw new Error('name, sku, and unitPrice are required');
    }

    const existingMedicine = await medicineDao.getMedicineBySku(sku);
    if (existingMedicine) {
        throw new Error('Medicine SKU already exists');
    }

    const medicine = await medicineDao.createMedicine({
        name,
        sku,
        category: toCleanString(data.category) || '',
        manufacturer: toCleanString(data.manufacturer) || '',
        unitPrice: toNumber(data.unitPrice, 'unitPrice'),
        stockQuantity:
            data.stockQuantity === undefined ? 0 : toNumber(data.stockQuantity, 'stockQuantity'),
        reorderLevel:
            data.reorderLevel === undefined ? 10 : toNumber(data.reorderLevel, 'reorderLevel'),
        expiryDate: toOptionalDate(data.expiryDate, 'expiryDate'),
        status: data.status || 'active',
        createdBy: user.id,
    });

    const populatedMedicine = await medicineDao.getMedicineById(medicine._id);
    return sanitizeMedicine(populatedMedicine);
};

// Load medicines.
const getMedicines = async (queryParams) => {
    const query = buildMedicineQuery(queryParams);
    const medicines = await medicineDao.getMedicines(query);
    return medicines.map(sanitizeMedicine);
};

// Load medicine by id.
const getMedicineById = async (id) => {
    const medicine = await getMedicineOrThrow(id);
    return sanitizeMedicine(medicine);
};

// Update medicine.
const updateMedicine = async (id, data) => {
    await getMedicineOrThrow(id);

    const updateData = {};
    const stringFields = ['name', 'category', 'manufacturer'];

    stringFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = toCleanString(data[field]) || '';
        }
    });

    if (Object.prototype.hasOwnProperty.call(data, 'sku')) {
        const sku = toCleanString(data.sku)?.toUpperCase();
        if (!sku) {
            throw new Error('sku cannot be empty');
        }

        const existingMedicine = await medicineDao.getMedicineBySku(sku);
        if (existingMedicine && existingMedicine._id.toString() !== id) {
            throw new Error('Medicine SKU already exists');
        }

        updateData.sku = sku;
    }

    ['unitPrice', 'stockQuantity', 'reorderLevel'].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = toNumber(data[field], field);
        }
    });

    if (Object.prototype.hasOwnProperty.call(data, 'expiryDate')) {
        updateData.expiryDate = toOptionalDate(data.expiryDate, 'expiryDate');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!MEDICINE_STATUSES.includes(status)) {
            throw new Error('Invalid medicine status');
        }
        updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No medicine fields provided for update');
    }

    const medicine = await medicineDao.updateMedicine(id, updateData);
    return sanitizeMedicine(medicine);
};

// Remove medicine.
const deleteMedicine = async (id) => {
    const medicine = await getMedicineOrThrow(id);
    await medicineDao.deleteMedicine(id);
    return sanitizeMedicine(medicine);
};

// Handle medicine service.
const medicineService = {
    createMedicine,
    getMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
};

export default medicineService;
