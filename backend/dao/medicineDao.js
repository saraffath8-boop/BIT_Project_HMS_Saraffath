import Medicine from '../models/medicine.js';

class MedicineDao {
    async createMedicine(medicineData) {
        const medicine = new Medicine(medicineData);
        return medicine.save();
    }

    async getMedicines(query = {}) {
        return Medicine.find(query)
            .populate('createdBy', 'name email role')
            .sort({ name: 1 })
            .exec();
    }

    async getMedicineById(id) {
        return Medicine.findById(id).populate('createdBy', 'name email role').exec();
    }

    async getMedicineBySku(sku) {
        return Medicine.findOne({ sku: sku.trim().toUpperCase() }).populate('createdBy', 'name email role').exec();
    }

    async updateMedicine(id, updateData) {
        return Medicine.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('createdBy', 'name email role')
            .exec();
    }

    async deleteMedicine(id) {
        return Medicine.findByIdAndDelete(id).exec();
    }

    async countMedicines(query = {}) {
        return Medicine.countDocuments(query).exec();
    }

    async countLowStockMedicines() {
        return Medicine.countDocuments({ $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }, status: 'active' }).exec();
    }
}

export default new MedicineDao();
