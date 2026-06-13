import crypto from 'crypto';
import mongoose from 'mongoose';
import billDao from '../dao/billDao.js';
import patientDao from '../dao/patientDao.js';
import appointmentDao from '../dao/appointmentDao.js';
import prescriptionDao from '../dao/prescriptionDao.js';
import labRequestDao from '../dao/labRequestDao.js';
import radiologyRequestDao from '../dao/radiologyRequestDao.js';
import userDao from '../dao/userDao.js';
import notificationService from './notificationService.js';

const BILL_STATUSES = ['unpaid', 'partially_paid', 'paid', 'cancelled'];
const BILL_CATEGORIES = ['consultation', 'medicine', 'laboratory', 'radiology', 'ward', 'procedure', 'other'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'insurance', 'other'];

const sanitizeBill = (bill) => ({
    id: bill._id.toString(),
    billNumber: bill.billNumber,
    patient: bill.patient,
    appointment: bill.appointment,
    billType: bill.billType,
    doctor: bill.doctor,
    roomNumber: bill.roomNumber,
    items: bill.items,
    subtotal: bill.subtotal,
    discount: bill.discount,
    totalAmount: bill.totalAmount,
    paidAmount: bill.paidAmount,
    status: bill.status,
    payments: bill.payments,
    createdBy: bill.createdBy,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
});

const sanitizeBillingStatus = (bill) => ({
    id: bill._id.toString(),
    billNumber: bill.billNumber,
    patient: {
        id: bill.patient._id.toString(),
        patientId: bill.patient.patientId,
        fullName: bill.patient.fullName,
        phone: bill.patient.phone,
    },
    totalAmount: bill.totalAmount,
    paidAmount: bill.paidAmount,
    status: bill.status,
    appointment: bill.appointment,
    billType: bill.billType,
    doctor: bill.doctor,
    roomNumber: bill.roomNumber,
    items: bill.items,
    payments: bill.payments,
    createdAt: bill.createdAt,
});

const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);

const toNumber = (value, fieldName, minimum = 0) => {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue) || numberValue < minimum) {
        throw new Error(`${fieldName} must be a number greater than or equal to ${minimum}`);
    }

    return numberValue;
};

const validatePatientExists = async (patientId) => {
    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);

    if (!patient) {
        throw new Error('Patient not found');
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

const buildBillQuery = (queryParams, user = {}) => {
    const query = {};

    if (user.role === 'pharmacist') {
        query.billType = 'pharmacy';
    }
    if (user.role === 'lab_technician') {
        query.billType = 'laboratory';
    }
    if (user.role === 'radiologist') {
        query.billType = 'radiology';
    }
    if (user.role === 'receptionist') {
        query.billType = 'consultation';
    }

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.appointment) {
        requireObjectId(queryParams.appointment, 'appointment id');
        query.appointment = queryParams.appointment;
    }

    if (queryParams.status) {
        if (!BILL_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid bill status');
        }
        query.status = queryParams.status;
    }

    return query;
};

const buildBillItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('At least one bill item is required');
    }

    return items.map((item) => {
        const description = toCleanString(item.description);
        const category = toCleanString(item.category) || 'other';
        const quantity = toNumber(item.quantity === undefined ? 1 : item.quantity, 'quantity', 1);
        const unitPrice = toNumber(item.unitPrice, 'unitPrice');

        if (!description) {
            throw new Error('description is required for each bill item');
        }

        if (!BILL_CATEGORIES.includes(category)) {
            throw new Error('Invalid bill item category');
        }

        return {
            description,
            category,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
            sourceType: item.sourceType || 'manual',
            sourceId: item.sourceId || null,
        };
    });
};

const REQUEST_CONFIG = {
    prescription: {
        get: (id) => prescriptionDao.getPrescriptionById(id),
        update: (id, data) => prescriptionDao.updatePrescription(id, data),
        category: 'medicine',
        role: 'pharmacist',
        type: 'pharmacy',
        description: (request) => `Prescription: ${request.items.map((item) => item.medicineName).join(', ')}`,
    },
    laboratory: {
        get: (id) => labRequestDao.getLabRequestById(id),
        update: (id, data) => labRequestDao.updateLabRequest(id, data),
        category: 'laboratory',
        role: 'lab_technician',
        type: 'laboratory',
        description: (request) => `Laboratory: ${request.tests.map((test) => test.testName).join(', ')}`,
    },
    radiology: {
        get: (id) => radiologyRequestDao.getRadiologyRequestById(id),
        update: (id, data) => radiologyRequestDao.updateRadiologyRequest(id, data),
        category: 'radiology',
        role: 'radiologist',
        type: 'radiology',
        description: (request) => `Radiology: ${request.scanType}${request.bodyPart ? ` - ${request.bodyPart}` : ''}`,
    },
};

const sanitizePendingRequest = (request, type) => ({
    id: request._id.toString(),
    type,
    patient: request.patient,
    doctor: request.doctor,
    medicalRecord: request.medicalRecord,
    appointmentId: request.medicalRecord?.appointment?.toString() || null,
    description: REQUEST_CONFIG[type].description(request),
    patientDecisionStatus: request.patientDecisionStatus,
    createdAt: request.createdAt,
});

const getAllowedRequestTypes = (user = {}) => {
    if (user.role === 'pharmacist') return ['prescription'];
    if (user.role === 'lab_technician') return ['laboratory'];
    if (user.role === 'radiologist') return ['radiology'];
    return Object.keys(REQUEST_CONFIG);
};

const getPendingPatientDecisions = async (user = {}) => {
    const [prescriptions, laboratory, radiology] = await Promise.all([
        prescriptionDao.getPrescriptions({ patientDecisionStatus: 'pending_patient_decision' }),
        labRequestDao.getLabRequests({ patientDecisionStatus: 'pending_patient_decision' }),
        radiologyRequestDao.getRadiologyRequests({ patientDecisionStatus: 'pending_patient_decision' }),
    ]);
    const allowedTypes = getAllowedRequestTypes(user);
    return [
        ...prescriptions.map((request) => sanitizePendingRequest(request, 'prescription')),
        ...laboratory.map((request) => sanitizePendingRequest(request, 'laboratory')),
        ...radiology.map((request) => sanitizePendingRequest(request, 'radiology')),
    ].filter((request) => allowedTypes.includes(request.type)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

const processPatientDecisions = async (data, user) => {
    if (!Array.isArray(data.decisions) || data.decisions.length === 0) throw new Error('At least one patient decision is required');
    if (new Set(data.decisions.map((decision) => `${decision.type}:${decision.id}`)).size !== data.decisions.length) {
        throw new Error('Duplicate patient decisions are not allowed');
    }
    const allowedTypes = getAllowedRequestTypes(user);
    const loaded = [];
    for (const decision of data.decisions) {
        const config = REQUEST_CONFIG[decision.type];
        if (!config || !allowedTypes.includes(decision.type)) throw new Error('Invalid request type for this role');
        requireObjectId(decision.id, 'request id');
        const request = await config.get(decision.id);
        if (!request) throw new Error('Clinical request not found');
        if (request.patientDecisionStatus !== 'pending_patient_decision') throw new Error('Clinical request is no longer pending patient decision');
        loaded.push({ decision, request, config });
    }

    const patientId = loaded[0].request.patient._id.toString();
    if (loaded.some(({ request }) => request.patient._id.toString() !== patientId)) throw new Error('All decisions must belong to the same patient');
    const appointmentId = loaded[0].request.medicalRecord?.appointment?.toString() || null;
    if (!appointmentId || loaded.some(({ request }) => request.medicalRecord?.appointment?.toString() !== appointmentId)) {
        throw new Error('All decisions must belong to the same consultation appointment');
    }
    const allPending = await getPendingPatientDecisions(user);
    const appointmentPendingIds = allPending.filter((request) => request.appointmentId === appointmentId).map((request) => request.id);
    if (appointmentPendingIds.some((id) => !data.decisions.some((decision) => decision.id === id))) {
        throw new Error('Process every pending request for this consultation together');
    }
    const selected = loaded.filter(({ decision }) => Boolean(decision.selected));
    const items = selected.map(({ decision, request, config }) => ({
        description: config.description(request),
        category: config.category,
        quantity: 1,
        unitPrice: toNumber(decision.unitPrice, 'unitPrice', 0.01),
        sourceType: decision.type,
        sourceId: request._id,
    }));
    const appointment = appointmentId;
    let bill = null;
    if (selected.length) {
        const builtItems = buildBillItems(items);
        const totals = calculateBillTotals(builtItems, 0, []);
        const payment = buildPayment({ amount: totals.totalAmount, method: data.paymentMethod, reference: data.paymentReference }, user);
        const paidTotals = calculateBillTotals(builtItems, 0, [payment]);
        const selectedBillTypes = [...new Set(selected.map(({ config }) => config.type))];
        bill = await billDao.createBill({
            billNumber: await billDao.getNextBillNumber(),
            patient: patientId,
            appointment,
            billType: selectedBillTypes.length === 1 ? selectedBillTypes[0] : 'general',
            items: builtItems,
            ...paidTotals,
            payments: [payment],
            createdBy: user.id,
        });
    }

    await Promise.all(loaded.map(({ decision, request, config }) => config.update(request._id, {
        patientDecisionStatus: decision.selected ? 'paid' : 'rejected_by_patient',
        ...(decision.selected ? { paymentStatus: 'paid', paidBy: user.id, paidAt: new Date() } : { status: 'cancelled' }),
    })));
    const remainingPending = await getPendingPatientDecisions({ role: 'admin' });
    if (!remainingPending.some((request) => request.appointmentId === appointmentId)) {
        await appointmentDao.updateAppointment(appointmentId, { status: 'completed' });
    }

    const selectedTypes = [...new Set(selected.map(({ decision }) => decision.type))];
    await Promise.all(selectedTypes.map(async (type) => {
        const config = REQUEST_CONFIG[type];
        const recipients = await userDao.getUsers({ role: config.role, isActive: true });
        await Promise.all(recipients.map((recipient) => notificationService.createNotification({
            recipient: recipient._id.toString(),
            title: 'Paid patient request ready',
            message: `${loaded[0].request.patient.fullName} paid for a ${type} request. It is ready for processing.`,
            type: config.type,
            relatedPatient: patientId,
            sendSms: false,
        }, {})));
    }));

    return {
        bill: bill ? sanitizeBill(await billDao.getBillById(bill._id)) : null,
        selectedCount: selected.length,
        rejectedCount: loaded.length - selected.length,
    };
};

const calculateBillTotals = (items, discount = 0, payments = []) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const safeDiscount = toNumber(discount, 'discount');

    if (safeDiscount > subtotal) {
        throw new Error('discount cannot be greater than subtotal');
    }

    const totalAmount = subtotal - safeDiscount;
    const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    if (paidAmount > totalAmount) {
        throw new Error('paid amount cannot be greater than total amount');
    }

    let status = 'unpaid';
    if (paidAmount > 0 && paidAmount < totalAmount) {
        status = 'partially_paid';
    }
    if (totalAmount > 0 && paidAmount === totalAmount) {
        status = 'paid';
    }

    return {
        subtotal,
        discount: safeDiscount,
        totalAmount,
        paidAmount,
        status,
    };
};

const buildPayment = (paymentData, user) => {
    const amount = toNumber(paymentData.amount, 'payment amount', 0.01);
    const method = toCleanString(paymentData.method) || 'cash';

    if (!PAYMENT_METHODS.includes(method)) {
        throw new Error('Invalid payment method');
    }

    return {
        amount,
        method,
        reference: toCleanString(paymentData.reference) || '',
        paidAt: paymentData.paidAt ? new Date(paymentData.paidAt) : new Date(),
        receivedBy: user.id,
    };
};

const assignDoctorRoomNumber = async (doctor) => {
    if (doctor.roomNumber) return doctor.roomNumber;

    for (let attempt = 0; attempt < 100; attempt += 1) {
        const roomNumber = String(crypto.randomInt(10, 100));
        if (await userDao.getUserByRoomNumber(roomNumber)) continue;
        try {
            const updatedDoctor = await userDao.updateUser(doctor._id, { roomNumber });
            return updatedDoctor.roomNumber;
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
    }

    throw new Error('No available two-digit doctor room number');
};

const createPaidAppointmentBill = async (appointment, user) => {
    const appointmentId = appointment._id?.toString() || appointment.id;
    const existingBill = await billDao.getConsultationBillByAppointment(appointmentId);
    if (existingBill) return sanitizeBill(existingBill);

    const doctor = appointment.doctor;
    const patient = appointment.patient;
    if (!doctor?._id || !patient?._id) throw new Error('Appointment doctor and patient are required for billing');

    const roomNumber = await assignDoctorRoomNumber(doctor);
    const consultationFee = Number(doctor.consultationFee || 0);
    const payment = {
        amount: consultationFee,
        method: 'cash',
        reference: '',
        paidAt: new Date(),
        receivedBy: user.id,
    };
    const bill = await billDao.createBill({
        billNumber: await billDao.getNextBillNumber(),
        patient: patient._id,
        appointment: appointmentId,
        billType: 'consultation',
        doctor: doctor._id,
        roomNumber,
        items: [{
            description: `Consultation fee - ${doctor.name}`,
            category: 'consultation',
            quantity: 1,
            unitPrice: consultationFee,
            total: consultationFee,
            sourceType: 'manual',
        }],
        subtotal: consultationFee,
        discount: 0,
        totalAmount: consultationFee,
        paidAmount: consultationFee,
        status: 'paid',
        payments: [payment],
        createdBy: user.id,
    });

    return sanitizeBill(await billDao.getBillById(bill._id));
};

const createPaidPrescriptionBill = async (prescription, amount, user) => {
    const prescriptionId = prescription._id?.toString() || prescription.id;
    const existingBill = await billDao.getPharmacyBillByPrescription(prescriptionId);
    if (existingBill) return sanitizeBill(existingBill);

    const totalAmount = toNumber(amount, 'prescription payment amount', 0.01);
    const patientId = prescription.patient?._id?.toString() || prescription.patient?.id || prescription.patient?.toString();
    const doctorId = prescription.doctor?._id?.toString() || prescription.doctor?.id || prescription.doctor?.toString();
    const appointmentId = prescription.medicalRecord?.appointment?._id?.toString()
        || prescription.medicalRecord?.appointment?.toString()
        || null;
    const payment = {
        amount: totalAmount,
        method: 'cash',
        reference: '',
        paidAt: new Date(),
        receivedBy: user.id,
    };
    const medicineNames = prescription.items.map((item) => item.medicineName).join(', ');
    const bill = await billDao.createBill({
        billNumber: await billDao.getNextBillNumber(),
        patient: patientId,
        appointment: appointmentId,
        billType: 'pharmacy',
        doctor: doctorId,
        items: [{
            description: `Prescription medicines: ${medicineNames}`.slice(0, 250),
            category: 'medicine',
            quantity: 1,
            unitPrice: totalAmount,
            total: totalAmount,
            sourceType: 'prescription',
            sourceId: prescriptionId,
        }],
        subtotal: totalAmount,
        discount: 0,
        totalAmount,
        paidAmount: totalAmount,
        status: 'paid',
        payments: [payment],
        createdBy: user.id,
    });
    return sanitizeBill(await billDao.getBillById(bill._id));
};

const createPaidClinicalServiceBill = async ({ request, amount, user, billType, sourceType, description }) => {
    const sourceId = request._id?.toString() || request.id;
    const existingBill = await billDao.getServiceBillBySource(billType, sourceType, sourceId);
    if (existingBill) return sanitizeBill(existingBill);
    const totalAmount = toNumber(amount, `${billType} payment amount`, 0.01);
    const patientId = request.patient?._id?.toString() || request.patient?.id || request.patient?.toString();
    const doctorId = request.doctor?._id?.toString() || request.doctor?.id || request.doctor?.toString();
    const appointmentId = request.medicalRecord?.appointment?._id?.toString() || request.medicalRecord?.appointment?.toString() || null;
    const payment = { amount: totalAmount, method: 'cash', reference: '', paidAt: new Date(), receivedBy: user.id };
    const bill = await billDao.createBill({
        billNumber: await billDao.getNextBillNumber(),
        patient: patientId,
        appointment: appointmentId,
        billType,
        doctor: doctorId,
        items: [{ description: description.slice(0, 250), category: billType, quantity: 1, unitPrice: totalAmount, total: totalAmount, sourceType, sourceId }],
        subtotal: totalAmount,
        discount: 0,
        totalAmount,
        paidAmount: totalAmount,
        status: 'paid',
        payments: [payment],
        createdBy: user.id,
    });
    return sanitizeBill(await billDao.getBillById(bill._id));
};

const ensureDoctorRoomNumbers = async () => {
    const doctors = await userDao.getUsers({ role: 'doctor' });
    let assignedCount = 0;
    for (const doctor of doctors) {
        if (doctor.roomNumber) continue;
        await assignDoctorRoomNumber(doctor);
        assignedCount += 1;
    }
    return assignedCount;
};

const ensurePaidAppointmentBills = async () => {
    const [appointments, receptionists] = await Promise.all([
        appointmentDao.getAppointments({ status: 'paid', paymentStatus: 'paid' }),
        userDao.getUsers({ role: 'receptionist', isActive: true }),
    ]);
    if (!receptionists.length) return 0;

    let createdCount = 0;
    for (const appointment of appointments) {
        if (await billDao.getConsultationBillByAppointment(appointment._id)) continue;
        await createPaidAppointmentBill(appointment, { id: receptionists[0]._id.toString() });
        createdCount += 1;
    }
    return createdCount;
};

const getBillOrThrow = async (id) => {
    requireObjectId(id, 'bill id');
    const bill = await billDao.getBillById(id);

    if (!bill) {
        throw new Error('Bill not found');
    }

    return bill;
};

const createBill = async (data, user) => {
    const patient = toCleanString(data.patient);
    const appointment = toCleanString(data.appointment) || null;

    if (!patient) {
        throw new Error('patient is required');
    }

    await validatePatientExists(patient);
    await validateAppointmentExists(appointment);

    const items = buildBillItems(data.items);
    const totals = calculateBillTotals(items, data.discount || 0, []);
    const billNumber = await billDao.getNextBillNumber();

    const bill = await billDao.createBill({
        billNumber,
        patient,
        appointment,
        items,
        ...totals,
        payments: [],
        createdBy: user.id,
    });

    const populatedBill = await billDao.getBillById(bill._id);
    return sanitizeBill(populatedBill);
};

const getBills = async (queryParams, user = {}) => {
    const query = buildBillQuery(queryParams, user);
    const bills = await billDao.getBills(query);
    return bills.map(user.role === 'receptionist' ? sanitizeBillingStatus : sanitizeBill);
};

const getMyBills = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);

    if (!patient) {
        throw new Error('No patient profile is linked to this account');
    }

    const bills = await billDao.getBills({ patient: patient._id });
    return bills.map(sanitizeBill);
};

const getBillById = async (id) => {
    const bill = await getBillOrThrow(id);
    return sanitizeBill(bill);
};

const updateBill = async (id, data, user) => {
    const existingBill = await getBillOrThrow(id);

    const updateData = {};
    let items = existingBill.items.map((item) => ({
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
    }));
    let discount = existingBill.discount;
    const payments = existingBill.payments.map((payment) => ({
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt,
        receivedBy: payment.receivedBy._id || payment.receivedBy,
    }));

    if (data.patient) {
        await validatePatientExists(data.patient);
        updateData.patient = data.patient;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'appointment')) {
        const appointment = toCleanString(data.appointment) || null;
        await validateAppointmentExists(appointment);
        updateData.appointment = appointment;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'items')) {
        items = buildBillItems(data.items);
        updateData.items = items;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'discount')) {
        discount = data.discount;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'addPayment')) {
        payments.push(buildPayment(data.addPayment, user));
        updateData.payments = payments;
    }

    const totals = calculateBillTotals(items, discount, payments);
    Object.assign(updateData, totals);

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!BILL_STATUSES.includes(status)) {
            throw new Error('Invalid bill status');
        }
        updateData.status = status;
    }

    const bill = await billDao.updateBill(id, updateData);
    return sanitizeBill(bill);
};

const deleteBill = async (id) => {
    const bill = await getBillOrThrow(id);
    await billDao.deleteBill(id);
    return sanitizeBill(bill);
};

const billService = {
    createBill,
    getBills,
    getMyBills,
    getBillById,
    updateBill,
    deleteBill,
    getPendingPatientDecisions,
    processPatientDecisions,
    createPaidAppointmentBill,
    createPaidPrescriptionBill,
    createPaidClinicalServiceBill,
    ensureDoctorRoomNumbers,
    ensurePaidAppointmentBills,
};

export default billService;
