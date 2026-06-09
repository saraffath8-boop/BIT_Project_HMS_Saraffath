import RadiologyRequest from '../models/radiologyRequest.js';

class RadiologyRequestDao {
    async createRadiologyRequest(requestData) {
        const request = new RadiologyRequest(requestData);
        return request.save();
    }

    async getRadiologyRequests(query = {}) {
        return RadiologyRequest.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('radiologist', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getRadiologyRequestById(id) {
        return RadiologyRequest.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('radiologist', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .exec();
    }

    async updateRadiologyRequest(id, updateData) {
        return RadiologyRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('radiologist', 'name email role')
            .populate('medicalRecord', 'diagnosis createdAt')
            .exec();
    }

    async deleteRadiologyRequest(id) {
        return RadiologyRequest.findByIdAndDelete(id).exec();
    }

    async countRadiologyRequests(query = {}) {
        return RadiologyRequest.countDocuments(query).exec();
    }
}

export default new RadiologyRequestDao();
