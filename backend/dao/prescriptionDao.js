// This file contains the prescription dao database queries.

import Prescription from '../models/prescription.js';

// Group the prescription dao database queries.
class PrescriptionDao {
    // Create prescription.
    async createPrescription(prescriptionData) {
        const prescription = new Prescription(prescriptionData);
        return prescription.save();
    }

    // Load prescriptions.
    async getPrescriptions(query = {}) {
        return Prescription.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .populate('paidBy', 'name email role')
            .populate('issuedBy', 'name email role')
            .populate('items.medicine', 'name sku unitPrice stockQuantity')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Load prescription by id.
    async getPrescriptionById(id) {
        return Prescription.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .populate('paidBy', 'name email role')
            .populate('issuedBy', 'name email role')
            .populate('items.medicine', 'name sku unitPrice stockQuantity')
            .exec();
    }

    // Update prescription.
    async updatePrescription(id, updateData) {
        return Prescription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .populate('paidBy', 'name email role')
            .populate('issuedBy', 'name email role')
            .populate('items.medicine', 'name sku unitPrice stockQuantity')
            .exec();
    }

    // Remove prescription.
    async deletePrescription(id) {
        return Prescription.findByIdAndDelete(id).exec();
    }

    // Handle count prescriptions.
    async countPrescriptions(query = {}) {
        return Prescription.countDocuments(query).exec();
    }
}

export default new PrescriptionDao();
