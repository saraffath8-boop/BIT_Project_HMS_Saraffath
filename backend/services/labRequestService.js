import mongoose from 'mongoose';
import labRequestDao from '../dao/labRequestDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import medicalRecordDao from '../dao/medicalRecordDao.js';

const LAB_PRIORITIES = ['routine', 'urgent'];
const LAB_STATUSES = ['requested', 'sample_collected', 'in_progress', 'completed', 'cancelled'];

const sanitizeLabRequest = (labRequest) => ({
    id: labRequest._id.toString(),
    patient: labRequest.patient,
    doctor: labRequest.doctor,
    medicalRecord: labRequest.medicalRecord,
    tests: labRequest.tests,
    priority: labRequest.priority,
    status: labRequest.status,
    technician: labRequest.technician,
    completedAt: labRequest.completedAt,
    createdAt: labRequest.createdAt,
    updatedAt: labRequest.updatedAt,
});

const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);

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

const validateTechnicianExists = async (technicianId) => {
    if (!technicianId) {
        return;
    }

    requireObjectId(technicianId, 'technician id');
    const technician = await userDao.getUserById(technicianId);

    if (!technician || technician.role !== 'lab_technician') {
        throw new Error('Lab technician not found');
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

const buildLabRequestQuery = (queryParams, user) => {
    const query = {};

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.doctor) {
        requireObjectId(queryParams.doctor, 'doctor id');
        query.doctor = queryParams.doctor;
    }

    if (queryParams.technician) {
        requireObjectId(queryParams.technician, 'technician id');
        query.technician = queryParams.technician;
    }

    if (queryParams.status) {
        if (!LAB_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid lab request status');
        }
        query.status = queryParams.status;
    }

    if (queryParams.priority) {
        if (!LAB_PRIORITIES.includes(queryParams.priority)) {
            throw new Error('Invalid lab request priority');
        }
        query.priority = queryParams.priority;
    }

    if (user.role === 'doctor') {
        query.doctor = user.id;
    }

    if (user.role === 'lab_technician') {
        query.$or = [{ technician: user.id }, { technician: null }];
    }

    return query;
};

const buildTests = (tests) => {
    if (!Array.isArray(tests) || tests.length === 0) {
        throw new Error('At least one lab test is required');
    }

    return tests.map((test) => {
        const testName = toCleanString(test.testName);

        if (!testName) {
            throw new Error('testName is required for each lab test');
        }

        return {
            testName,
            result: toCleanString(test.result) || '',
            referenceRange: toCleanString(test.referenceRange) || '',
            remarks: toCleanString(test.remarks) || '',
        };
    });
};

const createLabRequest = async (data, user) => {
    const patient = toCleanString(data.patient);
    const doctor = user.role === 'doctor' ? user.id : toCleanString(data.doctor);
    const medicalRecord = toCleanString(data.medicalRecord) || null;
    const priority = toCleanString(data.priority) || 'routine';

    if (!patient || !doctor) {
        throw new Error('patient and doctor are required');
    }

    if (!LAB_PRIORITIES.includes(priority)) {
        throw new Error('Invalid lab request priority');
    }

    await validatePatientExists(patient);
    await validateDoctorExists(doctor);
    await validateMedicalRecordExists(medicalRecord);

    const labRequest = await labRequestDao.createLabRequest({
        patient,
        doctor,
        medicalRecord,
        tests: buildTests(data.tests),
        priority,
        status: 'requested',
        technician: null,
    });

    const populatedLabRequest = await labRequestDao.getLabRequestById(labRequest._id);
    return sanitizeLabRequest(populatedLabRequest);
};

const getLabRequests = async (queryParams, user) => {
    const query = buildLabRequestQuery(queryParams, user);
    const labRequests = await labRequestDao.getLabRequests(query);
    return labRequests.map(sanitizeLabRequest);
};

const getMyLabRequests = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);

    if (!patient) {
        throw new Error('No patient profile is linked to this account');
    }

    const labRequests = await labRequestDao.getLabRequests({ patient: patient._id });
    return labRequests.map(sanitizeLabRequest);
};

const getLabRequestById = async (id, user) => {
    requireObjectId(id, 'lab request id');
    const labRequest = await labRequestDao.getLabRequestById(id);

    if (!labRequest) {
        throw new Error('Lab request not found');
    }

    if (user.role === 'doctor' && labRequest.doctor._id.toString() !== user.id) {
        throw new Error('Lab request not found');
    }

    if (
        user.role === 'lab_technician'
        && labRequest.technician
        && labRequest.technician._id.toString() !== user.id
    ) {
        throw new Error('Lab request not found');
    }

    return sanitizeLabRequest(labRequest);
};

const updateLabRequest = async (id, data, user) => {
    await getLabRequestById(id, user);

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

    if ((user.role === 'admin' || user.role === 'doctor') && Object.prototype.hasOwnProperty.call(data, 'priority')) {
        const priority = toCleanString(data.priority);
        if (!LAB_PRIORITIES.includes(priority)) {
            throw new Error('Invalid lab request priority');
        }
        updateData.priority = priority;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'tests')) {
        updateData.tests = buildTests(data.tests);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'technician')) {
        const technician = user.role === 'lab_technician' ? user.id : toCleanString(data.technician) || null;
        await validateTechnicianExists(technician);
        updateData.technician = technician;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!LAB_STATUSES.includes(status)) {
            throw new Error('Invalid lab request status');
        }
        updateData.status = status;

        if (status === 'completed') {
            updateData.completedAt = new Date();
            if (!updateData.technician && user.role === 'lab_technician') {
                updateData.technician = user.id;
            }
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No lab request fields provided for update');
    }

    const labRequest = await labRequestDao.updateLabRequest(id, updateData);
    return sanitizeLabRequest(labRequest);
};

const deleteLabRequest = async (id) => {
    const labRequest = await getLabRequestById(id, { role: 'admin' });
    await labRequestDao.deleteLabRequest(id);
    return labRequest;
};

const labRequestService = {
    createLabRequest,
    getLabRequests,
    getMyLabRequests,
    getLabRequestById,
    updateLabRequest,
    deleteLabRequest,
};

export default labRequestService;
