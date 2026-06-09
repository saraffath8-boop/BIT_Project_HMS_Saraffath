import mongoose from 'mongoose';
import billDao from '../dao/billDao.js';
import patientDao from '../dao/patientDao.js';
import appointmentDao from '../dao/appointmentDao.js';

const BILL_STATUSES = ['unpaid', 'partially_paid', 'paid', 'cancelled'];
const BILL_CATEGORIES = ['consultation', 'medicine', 'laboratory', 'radiology', 'ward', 'procedure', 'other'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'insurance', 'other'];

const sanitizeBill = (bill) => ({
    id: bill._id.toString(),
    billNumber: bill.billNumber,
    patient: bill.patient,
    appointment: bill.appointment,
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

const buildBillQuery = (queryParams) => {
    const query = {};

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
        };
    });
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

const getBills = async (queryParams) => {
    const query = buildBillQuery(queryParams);
    const bills = await billDao.getBills(query);
    return bills.map(sanitizeBill);
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
};

export default billService;
