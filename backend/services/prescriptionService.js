import mongoose from 'mongoose';
import prescriptionDao from '../dao/prescriptionDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import medicineDao from '../dao/medicineDao.js';
import medicalRecordDao from '../dao/medicalRecordDao.js';
import smsService from './smsService.js';
import clinicalCompletionService from './clinicalCompletionService.js';

const PRESCRIPTION_STATUSES = ['pending', 'partially_issued', 'issued', 'cancelled'];

const sanitizePrescription = (prescription) => ({
    id: prescription._id.toString(),
    patient: prescription.patient,
    doctor: prescription.doctor,
    medicalRecord: prescription.medicalRecord,
    items: prescription.items,
    notes: prescription.notes,
    status: prescription.status,
    patientDecisionStatus: prescription.patientDecisionStatus,
    issuedBy: prescription.issuedBy,
    issuedAt: prescription.issuedAt,
    createdAt: prescription.createdAt,
    updatedAt: prescription.updatedAt,
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

const validateMedicineExists = async (medicineId) => {
    if (!medicineId) {
        return;
    }

    requireObjectId(medicineId, 'medicine id');
    const medicine = await medicineDao.getMedicineById(medicineId);

    if (!medicine) {
        throw new Error('Medicine not found');
    }
};

const buildPrescriptionQuery = (queryParams, user) => {
    const query = {};

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.doctor) {
        requireObjectId(queryParams.doctor, 'doctor id');
        query.doctor = queryParams.doctor;
    }

    if (queryParams.status) {
        if (!PRESCRIPTION_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid prescription status');
        }
        query.status = queryParams.status;
    }

    if (user.role === 'doctor') {
        query.doctor = user.id;
    }

    if (user.role === 'pharmacist') {
        query.patientDecisionStatus = 'paid';
    }

    return query;
};

const buildPrescriptionItems = async (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('At least one medicine is required');
    }

    const prescriptionItems = [];

    for (const item of items) {
        const medicine = toCleanString(item.medicine) || null;
        const medicineName = toCleanString(item.medicineName);
        const dosage = toCleanString(item.dosage);
        const frequency = toCleanString(item.frequency);
        const duration = toCleanString(item.duration);

        if (!medicineName || !dosage || !frequency || !duration) {
            throw new Error('medicineName, dosage, frequency, and duration are required for each prescription item');
        }

        await validateMedicineExists(medicine);

        prescriptionItems.push({
            medicine,
            medicineName,
            dosage,
            frequency,
            duration,
            instructions: toCleanString(item.instructions) || '',
        });
    }

    return prescriptionItems;
};

const getMedicineSummary = (items = []) => {
    const names = items
        .map((item) => item.medicineName)
        .filter(Boolean)
        .slice(0, 3);

    if (names.length === 0) {
        return 'your prescribed medicines';
    }

    return names.join(', ');
};

const sendPrescriptionIssuedSms = async (prescription) => {
    if (!prescription?.patient?.phone) {
        return;
    }

    const patientName = prescription.patient.fullName || 'Patient';
    const medicineSummary = getMedicineSummary(prescription.items);

    await smsService.sendSms({
        to: prescription.patient.phone,
        message: `Hello ${patientName}, your prescription is ready for pickup. Medicines: ${medicineSummary}.`,
    });
};

const createPrescription = async (data, user) => {
    const patient = toCleanString(data.patient);
    const doctor = user.role === 'doctor' ? user.id : toCleanString(data.doctor);
    const medicalRecord = toCleanString(data.medicalRecord) || null;

    if (!patient || !doctor) {
        throw new Error('patient and doctor are required');
    }

    await validatePatientExists(patient);
    await validateDoctorExists(doctor);
    await validateMedicalRecordExists(medicalRecord);

    const prescription = await prescriptionDao.createPrescription({
        patient,
        doctor,
        medicalRecord,
        items: await buildPrescriptionItems(data.items),
        notes: toCleanString(data.notes) || '',
        status: 'pending',
        patientDecisionStatus: data.patientDecisionStatus || 'not_required',
    });

    const populatedPrescription = await prescriptionDao.getPrescriptionById(prescription._id);
    return sanitizePrescription(populatedPrescription);
};

const getPrescriptions = async (queryParams, user) => {
    const query = buildPrescriptionQuery(queryParams, user);
    const prescriptions = await prescriptionDao.getPrescriptions(query);
    return prescriptions.map(sanitizePrescription);
};

const getMyPrescriptions = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);

    if (!patient) {
        throw new Error('No patient profile is linked to this account');
    }

    const prescriptions = await prescriptionDao.getPrescriptions({ patient: patient._id });
    return prescriptions.map(sanitizePrescription);
};

const getPrescriptionById = async (id, user) => {
    requireObjectId(id, 'prescription id');
    const prescription = await prescriptionDao.getPrescriptionById(id);

    if (!prescription) {
        throw new Error('Prescription not found');
    }

    if (user.role === 'doctor' && prescription.doctor._id.toString() !== user.id) {
        throw new Error('Prescription not found');
    }
    if (user.role === 'pharmacist' && prescription.patientDecisionStatus !== 'paid') {
        throw new Error('Prescription not found');
    }

    return sanitizePrescription(prescription);
};

const updatePrescription = async (id, data, user) => {
    const existingPrescription = await getPrescriptionById(id, user);

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

    if ((user.role === 'admin' || user.role === 'doctor') && Object.prototype.hasOwnProperty.call(data, 'items')) {
        updateData.items = await buildPrescriptionItems(data.items);
    }

    if ((user.role === 'admin' || user.role === 'doctor') && Object.prototype.hasOwnProperty.call(data, 'notes')) {
        updateData.notes = toCleanString(data.notes) || '';
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!PRESCRIPTION_STATUSES.includes(status)) {
            throw new Error('Invalid prescription status');
        }
        updateData.status = status;

        if (status === 'issued' || status === 'partially_issued') {
            updateData.issuedBy = user.id;
            updateData.issuedAt = new Date();
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No prescription fields provided for update');
    }

    const prescription = await prescriptionDao.updatePrescription(id, updateData);

    if (updateData.status === 'issued' && existingPrescription.status !== 'issued') {
        await sendPrescriptionIssuedSms(prescription);
        await clinicalCompletionService.notifyClinicalCompletion({
            request: prescription,
            title: 'Prescription issued',
            message: `Prescription for ${prescription.patient.fullName} has been issued by pharmacy.`,
            type: 'pharmacy',
        });
    }

    return sanitizePrescription(prescription);
};

const deletePrescription = async (id) => {
    const prescription = await getPrescriptionById(id, { role: 'admin' });
    await prescriptionDao.deletePrescription(id);
    return prescription;
};

const prescriptionService = {
    createPrescription,
    getPrescriptions,
    getMyPrescriptions,
    getPrescriptionById,
    updatePrescription,
    deletePrescription,
};

export default prescriptionService;
