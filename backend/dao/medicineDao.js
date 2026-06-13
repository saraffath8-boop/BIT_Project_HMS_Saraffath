// This file contains the medicine dao database queries.

import Medicine from '../models/medicine.js';

// Group the medicine dao database queries.
class MedicineDao {
    // Create medicine.
    async createMedicine(medicineData) {
        const medicine = new Medicine(medicineData);
        return medicine.save();
    }

    // Load medicines.
    async getMedicines(query = {}) {
        return Medicine.find(query)
            .populate('createdBy', 'name email role')
            .sort({ name: 1 })
            .exec();
    }

    // Load medicine by id.
    async getMedicineById(id) {
        return Medicine.findById(id).populate('createdBy', 'name email role').exec();
    }

    // Load medicine by sku.
    async getMedicineBySku(sku) {
        return Medicine.findOne({ sku: sku.trim().toUpperCase() })
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Update medicine.
    async updateMedicine(id, updateData) {
        return Medicine.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Remove medicine.
    async deleteMedicine(id) {
        return Medicine.findByIdAndDelete(id).exec();
    }

    // Handle count medicines.
    async countMedicines(query = {}) {
        return Medicine.countDocuments(query).exec();
    }

    // Handle count low stock medicines.
    async countLowStockMedicines() {
        return Medicine.countDocuments({
            $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
            status: 'active',
        }).exec();
    }
}

export default new MedicineDao();
