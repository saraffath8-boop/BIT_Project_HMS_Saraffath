import mongoose from 'mongoose';
import medicalRecordDao from '../dao/medicalRecordDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import appointmentDao from '../dao/appointmentDao.js';

const RECORD_STATUSES = ['open', 'completed', 'archived'];

const sanitizeMedicalRecord = (record) => ({
    id: record._id.toString(),
    patient: record.patient,
    doctor: record.doctor,
    appointment: record.appointment,
    chiefComplaint: record.chiefComplaint,
    diagnosis: record.diagnosis,
    consultationNotes: record.consultationNotes,
    vitalSigns: record.vitalSigns,
    followUpDate: record.followUpDate,
    doctorComment: record.doctorComment,
    status: record.status,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
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

const validateAppointmentExists = async (appointmentId) => {
    if (!appointmentId) {
        return;
    }

    requireObjectId(appointmentId, 'appointment id');
    const appointment = await appointmentDao.getAppointmentById(appointmentId);

    if (!appointment) {
        throw new Error('Appointment not found');
    }
};

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

const buildMedicalRecordQuery = (queryParams, user) => {
    const query = {};

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.doctor) {
        requireObjectId(queryParams.doctor, 'doctor id');
        query.doctor = queryParams.doctor;
    }

    if (queryParams.appointment) {
        requireObjectId(queryParams.appointment, 'appointment id');
        query.appointment = queryParams.appointment;
    }

    if (queryParams.status) {
        if (!RECORD_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid medical record status');
        }
        query.status = queryParams.status;
    }

    if (user.role === 'doctor') {
        query.doctor = user.id;
    }

    return query;
};

const pickVitalSigns = (vitalSigns = {}) => {
    const allowedFields = ['temperature', 'bloodPressure', 'pulse', 'respiratoryRate', 'oxygenSaturation', 'weight'];
    const cleanVitalSigns = {};

    allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(vitalSigns, field)) {
            cleanVitalSigns[field] = toCleanString(vitalSigns[field]) || '';
        }
    });

    return cleanVitalSigns;
};

const createMedicalRecord = async (data, user) => {
    const patient = toCleanString(data.patient);
    const doctor = user.role === 'doctor' ? user.id : toCleanString(data.doctor);
    const appointment = toCleanString(data.appointment) || null;

    if (!patient || !doctor) {
        throw new Error('patient and doctor are required');
    }

    await validatePatientExists(patient);
    await validateDoctorExists(doctor);
    await validateAppointmentExists(appointment);

    const medicalRecord = await medicalRecordDao.createMedicalRecord({
        patient,
        doctor,
        appointment,
        chiefComplaint: toCleanString(data.chiefComplaint) || '',
        diagnosis: toCleanString(data.diagnosis) || '',
        consultationNotes: toCleanString(data.consultationNotes) || '',
        vitalSigns: pickVitalSigns(data.vitalSigns),
        followUpDate: validateDate(data.followUpDate, 'followUpDate'),
		doctorComment: toCleanString(data.doctorComment) || '',
        status: data.status || 'open',
        createdBy: user.id,
    });

    const populatedRecord = await medicalRecordDao.getMedicalRecordById(medicalRecord._id);
    return sanitizeMedicalRecord(populatedRecord);
};

const getMedicalRecords = async (queryParams, user) => {
    const query = buildMedicalRecordQuery(queryParams, user);
    const records = await medicalRecordDao.getMedicalRecords(query);
    return records.map(sanitizeMedicalRecord);
};

const getMyMedicalRecords = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);
    if (!patient) throw new Error('No patient profile is linked to this account');
    const records = await medicalRecordDao.getMedicalRecords({ patient: patient._id });
    return records.map(sanitizeMedicalRecord);
};

const getMedicalRecordById = async (id, user) => {
    requireObjectId(id, 'medical record id');
    const record = await medicalRecordDao.getMedicalRecordById(id);

    if (!record) {
        throw new Error('Medical record not found');
    }

    if (user.role === 'doctor' && record.doctor._id.toString() !== user.id) {
        throw new Error('Medical record not found');
    }

    return sanitizeMedicalRecord(record);
};

const updateMedicalRecord = async (id, data, user) => {
    await getMedicalRecordById(id, user);

    const updateData = {};
    const allowedFields = ['chiefComplaint', 'diagnosis', 'consultationNotes'];

    allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = toCleanString(data[field]) || '';
        }
    });

    if (Object.prototype.hasOwnProperty.call(data, 'vitalSigns')) {
        updateData.vitalSigns = pickVitalSigns(data.vitalSigns);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'followUpDate')) {
        updateData.followUpDate = validateDate(data.followUpDate, 'followUpDate');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!RECORD_STATUSES.includes(status)) {
            throw new Error('Invalid medical record status');
        }
        updateData.status = status;
    }

    if (user.role === 'admin' && data.doctor) {
        await validateDoctorExists(data.doctor);
        updateData.doctor = data.doctor;
    }

    if (user.role === 'admin' && data.patient) {
        await validatePatientExists(data.patient);
        updateData.patient = data.patient;
    }

    if (user.role === 'admin' && data.appointment) {
        await validateAppointmentExists(data.appointment);
        updateData.appointment = data.appointment;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No medical record fields provided for update');
    }

    const record = await medicalRecordDao.updateMedicalRecord(id, updateData);
    return sanitizeMedicalRecord(record);
};

const deleteMedicalRecord = async (id) => {
    const record = await getMedicalRecordById(id, { role: 'admin' });
    await medicalRecordDao.deleteMedicalRecord(id);
    return record;
};

const medicalRecordService = {
    createMedicalRecord,
    getMedicalRecords,
    getMyMedicalRecords,
    getMedicalRecordById,
    updateMedicalRecord,
    deleteMedicalRecord,
};

export default medicalRecordService;
