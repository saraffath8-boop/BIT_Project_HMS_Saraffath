// This file contains the lab request dao database queries.

import LabRequest from '../models/labRequest.js';

// Group the lab request dao database queries.
class LabRequestDao {
    // Create lab request.
    async createLabRequest(labRequestData) {
        const labRequest = new LabRequest(labRequestData);
        return labRequest.save();
    }

    // Load lab requests.
    async getLabRequests(query = {}) {
        return LabRequest.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('technician', 'name email role')
            .populate('paidBy', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Load lab request by id.
    async getLabRequestById(id) {
        return LabRequest.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('technician', 'name email role')
            .populate('paidBy', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .exec();
    }

    // Update lab request.
    async updateLabRequest(id, updateData) {
        return LabRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('technician', 'name email role')
            .populate('paidBy', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .exec();
    }

    // Remove lab request.
    async deleteLabRequest(id) {
        return LabRequest.findByIdAndDelete(id).exec();
    }

    // Handle count lab requests.
    async countLabRequests(query = {}) {
        return LabRequest.countDocuments(query).exec();
    }
}

export default new LabRequestDao();
