import inventoryService from '../services/inventoryService.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getStatusCode = (error) => {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('already exists') || error.message.includes('cannot be empty') || error.message.includes('greater than') || error.message.includes('No inventory')) return 400;
    return 500;
};

export const createInventoryItem = async (req, res) => {
    try {
        const inventoryItem = await inventoryService.createInventoryItem(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Inventory item created successfully',
            inventoryItem,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getInventoryItems = async (req, res) => {
    try {
        const inventoryItems = await inventoryService.getInventoryItems(req.query);

        return res.status(200).json({
            success: true,
            inventoryItems,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const getInventoryItemById = async (req, res) => {
    try {
        const inventoryItem = await inventoryService.getInventoryItemById(req.params.id);

        return res.status(200).json({
            success: true,
            inventoryItem,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const updateInventoryItem = async (req, res) => {
    try {
        const inventoryItem = await inventoryService.updateInventoryItem(req.params.id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Inventory item updated successfully',
            inventoryItem,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};

export const deleteInventoryItem = async (req, res) => {
    try {
        const inventoryItem = await inventoryService.deleteInventoryItem(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully',
            inventoryItem,
        });
    } catch (error) {
        return sendError(res, getStatusCode(error), error.message);
    }
};
