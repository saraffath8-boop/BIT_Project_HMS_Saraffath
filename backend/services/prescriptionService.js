// This file contains the prescription service business workflow.

import mongoose from 'mongoose';
import prescriptionDao from '../dao/prescriptionDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import medicineDao from '../dao/medicineDao.js';
import medicalRecordDao from '../dao/medicalRecordDao.js';
import smsService from './smsService.js';
import clinicalCompletionService from './clinicalCompletionService.js';
import notificationService from './notificationService.js';
import billService from './billService.js';

// Store the prescription statuses setting used by this file.
const PRESCRIPTION_STATUSES = ['pending', 'partially_issued', 'issued', 'cancelled'];

// Prepare prescription.
const sanitizePrescription = (prescription) => ({
    id: prescription._id.toString(),
    patient: prescription.patient,
    doctor: prescription.doctor,
    medicalRecord: prescription.medicalRecord,
    items: prescription.items,
    notes: prescription.notes,
    status: prescription.status,
    patientDecisionStatus: prescription.patientDecisionStatus,
    paymentStatus: prescription.paymentStatus,
    paidBy: prescription.paidBy,
    paidAt: prescription.paidAt,
    issuedBy: prescription.issuedBy,
    issuedAt: prescription.issuedAt,
    createdAt: prescription.createdAt,
    updatedAt: prescription.updatedAt,
});

// Validate object id.
const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

// Handle to clean string.
const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);
// Load positive number.
const getPositiveNumber = (value, fieldName) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0)
        throw new Error(`${fieldName} must be greater than zero`);
    return number;
};
// Load prescribed multiplier.
const getPrescribedMultiplier = (value, fieldName) => {
    const match = String(value || '').match(/\d+(?:\.\d+)?/);
    if (!match) throw new Error(`${fieldName} must contain a numeric value`);
    return getPositiveNumber(match[0], fieldName);
};
// Handle round currency.
const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Prepare prescription pricing.
const calculatePrescriptionPricing = (prescription, pricingItems) => {
    if (!Array.isArray(pricingItems) || pricingItems.length !== prescription.items.length) {
        throw new Error('Pricing is required for every prescribed medicine');
    }

    // Handle pricing by item.
    const pricingByItem = new Map(pricingItems.map((item) => [String(item.itemId), item]));
    // Handle bill items.
    const billItems = prescription.items.map((item) => {
        const pricing = pricingByItem.get(item._id.toString());
        if (!pricing) throw new Error(`Pricing is required for ${item.medicineName}`);

        const unitPrice = getPositiveNumber(pricing.unitPrice, `${item.medicineName} unit price`);
        const duration = getPositiveNumber(pricing.duration, `${item.medicineName} duration`);
        const dosage = getPrescribedMultiplier(item.dosage, `${item.medicineName} dosage`);
        const frequency = getPrescribedMultiplier(item.frequency, `${item.medicineName} frequency`);
        const quantity = dosage * frequency * duration;

        return {
            description: `${item.medicineName}: ${dosage} dosage x ${frequency} frequency x ${duration} duration`,
            quantity,
            unitPrice,
            total: roundCurrency(unitPrice * quantity),
            sourceId: prescription._id,
        };
    });

    return {
        billItems,
        totalAmount: roundCurrency(billItems.reduce((total, item) => total + item.total, 0)),
    };
};

// Validate patient exists.
const validatePatientExists = async (patientId) => {
    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);

    if (!patient) {
        throw new Error('Patient not found');
    }
};

// Validate doctor exists.
const validateDoctorExists = async (doctorId) => {
    requireObjectId(doctorId, 'doctor id');
    const doctor = await userDao.getUserById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
    }
};

// Validate medical record exists.
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

// Validate medicine exists.
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

// Prepare prescription query.
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

    if (queryParams.paymentStatus) {
        if (!['unpaid', 'paid'].includes(queryParams.paymentStatus)) {
            throw new Error('Invalid prescription payment status');
        }
        query.paymentStatus = queryParams.paymentStatus;
    }

    if (user.role === 'doctor') {
        query.doctor = user.id;
    }

    return query;
};

// Prepare prescription items.
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
            throw new Error(
                'medicineName, dosage, frequency, and duration are required for each prescription item',
            );
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

// Load medicine summary.
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

// Send prescription issued sms.
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

// Create prescription.
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
        paymentStatus: 'unpaid',
    });

    const populatedPrescription = await prescriptionDao.getPrescriptionById(prescription._id);
    const [pharmacists, linkedPatient] = await Promise.all([
        userDao.getUsers({ role: 'pharmacist', isActive: true }),
        patientDao.getPatientByMongoId(patient),
    ]);
    const recipients = [
        ...pharmacists.map((pharmacist) => pharmacist._id.toString()),
        linkedPatient?.userAccount?._id?.toString(),
    ].filter(Boolean);
    await Promise.all(
        [...new Set(recipients)].map((recipient) =>
            notificationService.createNotification(
                {
                    recipient,
                    title: 'New prescription created',
                    message: `A prescription for ${populatedPrescription.patient.fullName} is awaiting payment.`,
                    type: 'pharmacy',
                    relatedPatient: populatedPrescription.patient._id.toString(),
                    sendSms: false,
                },
                {},
            ),
        ),
    );
    return sanitizePrescription(populatedPrescription);
};

// Load prescriptions.
const getPrescriptions = async (queryParams, user) => {
    const query = buildPrescriptionQuery(queryParams, user);
    const prescriptions = await prescriptionDao.getPrescriptions(query);
    return prescriptions.map(sanitizePrescription);
};

// Load my prescriptions.
const getMyPrescriptions = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);

    if (!patient) {
        throw new Error('No patient profile is linked to this account');
    }

    const prescriptions = await prescriptionDao.getPrescriptions({ patient: patient._id });
    return prescriptions.map(sanitizePrescription);
};

// Load prescription by id.
const getPrescriptionById = async (id, user) => {
    requireObjectId(id, 'prescription id');
    const prescription = await prescriptionDao.getPrescriptionById(id);

    if (!prescription) {
        throw new Error('Prescription not found');
    }

    if (user.role === 'doctor' && prescription.doctor._id.toString() !== user.id) {
        throw new Error('Prescription not found');
    }
    return sanitizePrescription(prescription);
};

// Update prescription.
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

    if (
        (user.role === 'admin' || user.role === 'doctor') &&
        Object.prototype.hasOwnProperty.call(data, 'medicalRecord')
    ) {
        const medicalRecord = toCleanString(data.medicalRecord) || null;
        await validateMedicalRecordExists(medicalRecord);
        updateData.medicalRecord = medicalRecord;
    }

    if (
        (user.role === 'admin' || user.role === 'doctor') &&
        Object.prototype.hasOwnProperty.call(data, 'items')
    ) {
        updateData.items = await buildPrescriptionItems(data.items);
    }

    if (
        (user.role === 'admin' || user.role === 'doctor') &&
        Object.prototype.hasOwnProperty.call(data, 'notes')
    ) {
        updateData.notes = toCleanString(data.notes) || '';
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        if (!['admin', 'pharmacist'].includes(user.role)) {
            throw new Error('Only pharmacy staff can update prescription distribution status');
        }
        const status = toCleanString(data.status);
        if (!PRESCRIPTION_STATUSES.includes(status)) {
            throw new Error('Invalid prescription status');
        }
        if (user.role === 'pharmacist' && status !== 'issued') {
            throw new Error('Pharmacists can only mark prescriptions as distributed');
        }
        if (
            (status === 'issued' || status === 'partially_issued') &&
            existingPrescription.paymentStatus !== 'paid'
        ) {
            throw new Error('Prescription must be paid before it can be distributed');
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

// Update prescription paid.
const markPrescriptionPaid = async (id, data, user) => {
    requireObjectId(id, 'prescription id');
    const prescription = await prescriptionDao.getPrescriptionById(id);
    if (!prescription) throw new Error('Prescription not found');
    if (prescription.paymentStatus === 'paid') throw new Error('Prescription is already paid');
    if (prescription.status === 'cancelled')
        throw new Error('Cancelled prescription cannot be paid');

    const pricing = calculatePrescriptionPricing(prescription, data.pricingItems);
    const bill = await billService.createPaidPrescriptionBill(prescription, pricing, user);
    const updatedPrescription = await prescriptionDao.updatePrescription(id, {
        paymentStatus: 'paid',
        patientDecisionStatus: 'paid',
        paidBy: user.id,
        paidAt: new Date(),
    });
    const pharmacists = await userDao.getUsers({ role: 'pharmacist', isActive: true });
    await Promise.all(
        pharmacists.map((pharmacist) =>
            notificationService.createNotification(
                {
                    recipient: pharmacist._id.toString(),
                    title: 'Paid prescription ready',
                    message: `${updatedPrescription.patient.fullName}'s prescription is paid and ready for distribution.`,
                    type: 'pharmacy',
                    relatedPatient: updatedPrescription.patient._id.toString(),
                    sendSms: false,
                },
                {},
            ),
        ),
    );
    return { prescription: sanitizePrescription(updatedPrescription), bill };
};

// Remove prescription.
const deletePrescription = async (id) => {
    const prescription = await getPrescriptionById(id, { role: 'admin' });
    await prescriptionDao.deletePrescription(id);
    return prescription;
};

// Handle prescription service.
const prescriptionService = {
    createPrescription,
    getPrescriptions,
    getMyPrescriptions,
    getPrescriptionById,
    updatePrescription,
    markPrescriptionPaid,
    deletePrescription,
};

export default prescriptionService;
