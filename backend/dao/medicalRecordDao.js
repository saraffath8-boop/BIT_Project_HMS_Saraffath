import MedicalRecord from '../models/medicalRecord.js';

class MedicalRecordDao {
    async createMedicalRecord(recordData) {
        const record = new MedicalRecord(recordData);
        return record.save();
    }

    async getMedicalRecords(query = {}) {
        return MedicalRecord.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getMedicalRecordById(id) {
        return MedicalRecord.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    async updateMedicalRecord(id, updateData) {
        return MedicalRecord.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    async deleteMedicalRecord(id) {
        return MedicalRecord.findByIdAndDelete(id).exec();
    }

    async countMedicalRecords(query = {}) {
        return MedicalRecord.countDocuments(query).exec();
    }
}

export default new MedicalRecordDao();
