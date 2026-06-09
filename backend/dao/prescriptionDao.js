import Prescription from '../models/prescription.js';

class PrescriptionDao {
    async createPrescription(prescriptionData) {
        const prescription = new Prescription(prescriptionData);
        return prescription.save();
    }

    async getPrescriptions(query = {}) {
        return Prescription.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .populate('issuedBy', 'name email role')
            .populate('items.medicine', 'name sku unitPrice stockQuantity')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getPrescriptionById(id) {
        return Prescription.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .populate('issuedBy', 'name email role')
            .populate('items.medicine', 'name sku unitPrice stockQuantity')
            .exec();
    }

    async updatePrescription(id, updateData) {
        return Prescription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .populate('issuedBy', 'name email role')
            .populate('items.medicine', 'name sku unitPrice stockQuantity')
            .exec();
    }

    async deletePrescription(id) {
        return Prescription.findByIdAndDelete(id).exec();
    }

    async countPrescriptions(query = {}) {
        return Prescription.countDocuments(query).exec();
    }
}

export default new PrescriptionDao();
