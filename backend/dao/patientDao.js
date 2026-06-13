import Patient, { Counter } from '../models/patient.js';

class PatientDao {
    async getNextPatientId() {
        const counter = await Counter.findByIdAndUpdate(
            'patientId',
            { $inc: { sequenceValue: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).exec();

        return `PAT-${String(counter.sequenceValue).padStart(6, '0')}`;
    }

    async createPatient(patientData) {
        const patient = new Patient(patientData);
        return patient.save();
    }

    async getPatients({ search = '', page = 1, limit = 20 } = {}) {
        const query = search
            ? {
                  $or: [
                      { fullName: { $regex: search, $options: 'i' } },
                      { patientId: { $regex: search, $options: 'i' } },
                      { phone: { $regex: search, $options: 'i' } },
                  ],
              }
            : {};

        const skip = (page - 1) * limit;

        const [patients, total] = await Promise.all([
            Patient.find(query)
                .populate('createdBy', 'name email role')
                .populate('userAccount', 'name email role isActive')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            Patient.countDocuments(query).exec(),
        ]);

        return { patients, total, page, limit };
    }

    async getPatientByMongoId(id) {
        return Patient.findById(id)
            .populate('createdBy', 'name email role')
            .populate('userAccount', 'name email role isActive')
            .exec();
    }

    async getPatientByPatientId(patientId) {
        return Patient.findOne({ patientId })
            .populate('createdBy', 'name email role')
            .populate('userAccount', 'name email role isActive')
            .exec();
    }

    async updatePatient(id, updateData) {
        return Patient.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
            context: 'query',
        })
            .populate('createdBy', 'name email role')
            .populate('userAccount', 'name email role isActive')
            .exec();
    }

    async getPatientByUserAccount(userId) {
        return Patient.findOne({ userAccount: userId })
            .populate('createdBy', 'name email role')
            .populate('userAccount', 'name email role isActive')
            .exec();
    }

    async getPatientByUserAccountId(userId) {
        return Patient.findOne({ userAccount: userId })
            .populate('createdBy', 'name email role')
            .populate('userAccount', 'name email role isActive')
            .exec();
    }

    async getUnlinkedPatientByPhone(phone) {
        return Patient.findOne({ phone, userAccount: null }).exec();
    }

    async getPatientByPhone(phone) {
        return Patient.findOne({ phone }).exec();
    }

    async deletePatient(id) {
        return Patient.findByIdAndDelete(id).exec();
    }
}

export default new PatientDao();
