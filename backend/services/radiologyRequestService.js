import mongoose from 'mongoose';
import radiologyRequestDao from '../dao/radiologyRequestDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import medicalRecordDao from '../dao/medicalRecordDao.js';

const RADIOLOGY_STATUSES = ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'];

const sanitizeRadiologyRequest = (request) => ({
    id: request._id.toString(),
    patient: request.patient,
    doctor: request.doctor,
    medicalRecord: request.medicalRecord,
    scanType: request.scanType,
    bodyPart: request.bodyPart,
    clinicalReason: request.clinicalReason,
    scheduledAt: request.scheduledAt,
    imageUrl: request.imageUrl,
    report: request.report,
    status: request.status,
    radiologist: request.radiologist,
    completedAt: request.completedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
});

const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);

const validateDate = (value, fieldName) => {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} must be a valid date`);
    }

    return date;
};

const validatePatientExists = async (patientId) => {
    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);

    if (!patient) {
        throw new Error('Patient not found');
    }
};

const validateDoctorExists = async (doctorId) => {
    requireObjectId(doctorId, 'doctor id');
    const doctor = await userDao.getUserById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
    }
};

const validateRadiologistExists = async (radiologistId) => {
    if (!radiologistId) {
        return;
    }

    requireObjectId(radiologistId, 'radiologist id');
    const radiologist = await userDao.getUserById(radiologistId);

    if (!radiologist || radiologist.role !== 'radiologist') {
        throw new Error('Radiologist not found');
    }
};

const validateMedicalRecordExists = async (medicalRecordId) => {
    if (!medicalRecordId) {
        return;
    }

    requireObjectId(medicalRecordId, 'medical record id');
    const medicalRecord = await medicalRecordDao.getMedicalRecordById(medicalRecordId);

    if (!medicalRecord) {
        throw new Error('Medical record not found');
    }
};

const buildRadiologyQuery = (queryParams, user) => {
    const query = {};

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.doctor) {
        requireObjectId(queryParams.doctor, 'doctor id');
        query.doctor = queryParams.doctor;
    }

    if (queryParams.radiologist) {
        requireObjectId(queryParams.radiologist, 'radiologist id');
        query.radiologist = queryParams.radiologist;
    }

    if (queryParams.status) {
        if (!RADIOLOGY_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid radiology request status');
        }
        query.status = queryParams.status;
    }

    if (queryParams.scanType) {
        query.scanType = toCleanString(queryParams.scanType);
    }

    if (user.role === 'doctor') {
        query.doctor = user.id;
    }

    if (user.role === 'radiologist') {
        query.$or = [{ radiologist: user.id }, { radiologist: null }];
    }

    return query;
};

const createRadiologyRequest = async (data, user) => {
    const patient = toCleanString(data.patient);
    const doctor = user.role === 'doctor' ? user.id : toCleanString(data.doctor);
    const medicalRecord = toCleanString(data.medicalRecord) || null;
    const scanType = toCleanString(data.scanType);

    if (!patient || !doctor || !scanType) {
        throw new Error('patient, doctor, and scanType are required');
    }

    await validatePatientExists(patient);
    await validateDoctorExists(doctor);
    await validateMedicalRecordExists(medicalRecord);

    const request = await radiologyRequestDao.createRadiologyRequest({
        patient,
        doctor,
        medicalRecord,
        scanType,
        bodyPart: toCleanString(data.bodyPart) || '',
        clinicalReason: toCleanString(data.clinicalReason) || '',
        scheduledAt: validateDate(data.scheduledAt, 'scheduledAt'),
        imageUrl: '',
        report: '',
        status: data.scheduledAt ? 'scheduled' : 'requested',
        radiologist: null,
    });

    const populatedRequest = await radiologyRequestDao.getRadiologyRequestById(request._id);
    return sanitizeRadiologyRequest(populatedRequest);
};

const getRadiologyRequests = async (queryParams, user) => {
    const query = buildRadiologyQuery(queryParams, user);
    const requests = await radiologyRequestDao.getRadiologyRequests(query);
    return requests.map(sanitizeRadiologyRequest);
};

const getMyRadiologyRequests = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);

    if (!patient) {
        throw new Error('No patient profile is linked to this account');
    }

    const requests = await radiologyRequestDao.getRadiologyRequests({ patient: patient._id });
    return requests.map(sanitizeRadiologyRequest);
};

const getRadiologyRequestById = async (id, user) => {
    requireObjectId(id, 'radiology request id');
    const request = await radiologyRequestDao.getRadiologyRequestById(id);

    if (!request) {
        throw new Error('Radiology request not found');
    }

    if (user.role === 'doctor' && request.doctor._id.toString() !== user.id) {
        throw new Error('Radiology request not found');
    }

    if (
        user.role === 'radiologist'
        && request.radiologist
        && request.radiologist._id.toString() !== user.id
    ) {
        throw new Error('Radiology request not found');
    }

    return sanitizeRadiologyRequest(request);
};

const updateRadiologyRequest = async (id, data, user) => {
    await getRadiologyRequestById(id, user);

    const updateData = {};

    if (user.role === 'admin' && data.patient) {
        await validatePatientExists(data.patient);
        updateData.patient = data.patient;
    }

    if (user.role === 'admin' && data.doctor) {
        await validateDoctorExists(data.doctor);
        updateData.doctor = data.doctor;
    }

    if ((user.role === 'admin' || user.role === 'doctor') && Object.prototype.hasOwnProperty.call(data, 'medicalRecord')) {
        const medicalRecord = toCleanString(data.medicalRecord) || null;
        await validateMedicalRecordExists(medicalRecord);
        updateData.medicalRecord = medicalRecord;
    }

    ['scanType', 'bodyPart', 'clinicalReason', 'imageUrl', 'report'].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = toCleanString(data[field]) || '';
        }
    });

    if (Object.prototype.hasOwnProperty.call(data, 'scheduledAt')) {
        updateData.scheduledAt = validateDate(data.scheduledAt, 'scheduledAt');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'radiologist')) {
        const radiologist = user.role === 'radiologist' ? user.id : toCleanString(data.radiologist) || null;
        await validateRadiologistExists(radiologist);
        updateData.radiologist = radiologist;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!RADIOLOGY_STATUSES.includes(status)) {
            throw new Error('Invalid radiology request status');
        }
        updateData.status = status;

        if (status === 'completed') {
            updateData.completedAt = new Date();
            if (!updateData.radiologist && user.role === 'radiologist') {
                updateData.radiologist = user.id;
            }
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No radiology request fields provided for update');
    }

    const request = await radiologyRequestDao.updateRadiologyRequest(id, updateData);
    return sanitizeRadiologyRequest(request);
};

const deleteRadiologyRequest = async (id) => {
    const request = await getRadiologyRequestById(id, { role: 'admin' });
    await radiologyRequestDao.deleteRadiologyRequest(id);
    return request;
};

const radiologyRequestService = {
    createRadiologyRequest,
    getRadiologyRequests,
    getMyRadiologyRequests,
    getRadiologyRequestById,
    updateRadiologyRequest,
    deleteRadiologyRequest,
};

export default radiologyRequestService;
