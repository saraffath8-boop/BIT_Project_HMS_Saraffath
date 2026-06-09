import InventoryItem from '../models/inventoryItem.js';

class InventoryDao {
    async createInventoryItem(itemData) {
        const item = new InventoryItem(itemData);
        return item.save();
    }

    async getInventoryItems(query = {}) {
        return InventoryItem.find(query)
            .populate('createdBy', 'name email role')
            .sort({ name: 1 })
            .exec();
    }

    async getInventoryItemById(id) {
        return InventoryItem.findById(id).populate('createdBy', 'name email role').exec();
    }

    async getInventoryItemByCode(itemCode) {
        return InventoryItem.findOne({ itemCode: itemCode.trim().toUpperCase() }).populate('createdBy', 'name email role').exec();
    }

    async updateInventoryItem(id, updateData) {
        return InventoryItem.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('createdBy', 'name email role')
            .exec();
    }

    async deleteInventoryItem(id) {
        return InventoryItem.findByIdAndDelete(id).exec();
    }

    async countInventoryItems(query = {}) {
        return InventoryItem.countDocuments(query).exec();
    }

    async countLowStockItems() {
        return InventoryItem.countDocuments({ $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }, status: 'active' }).exec();
    }
}

export default new InventoryDao();
