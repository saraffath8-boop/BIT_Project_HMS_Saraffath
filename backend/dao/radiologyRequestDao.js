// This file contains the radiology request dao database queries.

import RadiologyRequest from '../models/radiologyRequest.js';

// Group the radiology request dao database queries.
class RadiologyRequestDao {
    // Create radiology request.
    async createRadiologyRequest(requestData) {
        const request = new RadiologyRequest(requestData);
        return request.save();
    }

    // Load radiology requests.
    async getRadiologyRequests(query = {}) {
        return RadiologyRequest.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('radiologist', 'name email role')
            .populate('paidBy', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Load radiology request by id.
    async getRadiologyRequestById(id) {
        return RadiologyRequest.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('radiologist', 'name email role')
            .populate('paidBy', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .exec();
    }

    // Update radiology request.
    async updateRadiologyRequest(id, updateData) {
        return RadiologyRequest.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('radiologist', 'name email role')
            .populate('paidBy', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt appointment')
            .exec();
    }

    // Remove radiology request.
    async deleteRadiologyRequest(id) {
        return RadiologyRequest.findByIdAndDelete(id).exec();
    }

    // Handle count radiology requests.
    async countRadiologyRequests(query = {}) {
        return RadiologyRequest.countDocuments(query).exec();
    }
}

export default new RadiologyRequestDao();
