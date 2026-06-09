import LabRequest from '../models/labRequest.js';

class LabRequestDao {
    async createLabRequest(labRequestData) {
        const labRequest = new LabRequest(labRequestData);
        return labRequest.save();
    }

    async getLabRequests(query = {}) {
        return LabRequest.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('technician', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getLabRequestById(id) {
        return LabRequest.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('technician', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .exec();
    }

    async updateLabRequest(id, updateData) {
        return LabRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('technician', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .exec();
    }

    async deleteLabRequest(id) {
        return LabRequest.findByIdAndDelete(id).exec();
    }

    async countLabRequests(query = {}) {
        return LabRequest.countDocuments(query).exec();
    }
}

export default new LabRequestDao();
