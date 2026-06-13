// This file contains the inventory dao database queries.

import InventoryItem from '../models/inventoryItem.js';

// Group the inventory dao database queries.
class InventoryDao {
    // Create inventory item.
    async createInventoryItem(itemData) {
        const item = new InventoryItem(itemData);
        return item.save();
    }

    // Load inventory items.
    async getInventoryItems(query = {}) {
        return InventoryItem.find(query)
            .populate('createdBy', 'name email role')
            .sort({ name: 1 })
            .exec();
    }

    // Load inventory item by id.
    async getInventoryItemById(id) {
        return InventoryItem.findById(id).populate('createdBy', 'name email role').exec();
    }

    // Load inventory item by code.
    async getInventoryItemByCode(itemCode) {
        return InventoryItem.findOne({ itemCode: itemCode.trim().toUpperCase() })
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Update inventory item.
    async updateInventoryItem(id, updateData) {
        return InventoryItem.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Remove inventory item.
    async deleteInventoryItem(id) {
        return InventoryItem.findByIdAndDelete(id).exec();
    }

    // Handle count inventory items.
    async countInventoryItems(query = {}) {
        return InventoryItem.countDocuments(query).exec();
    }

    // Handle count low stock items.
    async countLowStockItems() {
        return InventoryItem.countDocuments({
            $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
            status: 'active',
        }).exec();
    }
}

export default new InventoryDao();
