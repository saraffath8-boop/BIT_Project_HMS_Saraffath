// This file contains the medical record dao database queries.

import MedicalRecord from '../models/medicalRecord.js';

// Group the medical record dao database queries.
class MedicalRecordDao {
    // Create medical record.
    async createMedicalRecord(recordData) {
        const record = new MedicalRecord(recordData);
        return record.save();
    }

    // Load medical records.
    async getMedicalRecords(query = {}) {
        return MedicalRecord.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Load medical record by id.
    async getMedicalRecordById(id) {
        return MedicalRecord.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Load medical record by appointment.
    async getMedicalRecordByAppointment(appointmentId) {
        return MedicalRecord.findOne({ appointment: appointmentId }).exec();
    }

    // Load appointment ids with records.
    async getAppointmentIdsWithRecords() {
        return MedicalRecord.distinct('appointment', { appointment: { $ne: null } }).exec();
    }

    // Update medical record.
    async updateMedicalRecord(id, updateData) {
        return MedicalRecord.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Remove medical record.
    async deleteMedicalRecord(id) {
        return MedicalRecord.findByIdAndDelete(id).exec();
    }

    // Handle count medical records.
    async countMedicalRecords(query = {}) {
        return MedicalRecord.countDocuments(query).exec();
    }
}

export default new MedicalRecordDao();
