// This file contains the queue service business workflow.

import mongoose from 'mongoose';
import queueDao from '../dao/queueDao.js';
import patientDao from '../dao/patientDao.js';
import appointmentDao from '../dao/appointmentDao.js';

// Store the queue statuses setting used by this file.
const QUEUE_STATUSES = ['waiting', 'called', 'in_service', 'completed', 'cancelled'];
// Store the queue priorities setting used by this file.
const QUEUE_PRIORITIES = ['normal', 'urgent', 'emergency'];

// Prepare queue entry.
const sanitizeQueueEntry = (queueEntry) => ({
    id: queueEntry._id.toString(),
    queueNumber: queueEntry.queueNumber,
    patient: queueEntry.patient,
    appointment: queueEntry.appointment,
    department: queueEntry.department,
    priority: queueEntry.priority,
    status: queueEntry.status,
    createdBy: queueEntry.createdBy,
    calledAt: queueEntry.calledAt,
    completedAt: queueEntry.completedAt,
    createdAt: queueEntry.createdAt,
    updatedAt: queueEntry.updatedAt,
});

// Validate object id.
const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

// Handle to clean string.
const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);

// Validate patient exists.
const validatePatientExists = async (patientId) => {
    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);

    if (!patient) {
        throw new Error('Patient not found');
    }
};

// Validate appointment exists.
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

// Prepare queue query.
const buildQueueQuery = (queryParams) => {
    const query = {};

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.appointment) {
        requireObjectId(queryParams.appointment, 'appointment id');
        query.appointment = queryParams.appointment;
    }

    if (queryParams.department) {
        query.department = toCleanString(queryParams.department);
    }

    if (queryParams.status) {
        if (!QUEUE_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid queue status');
        }
        query.status = queryParams.status;
    }

    if (queryParams.priority) {
        if (!QUEUE_PRIORITIES.includes(queryParams.priority)) {
            throw new Error('Invalid queue priority');
        }
        query.priority = queryParams.priority;
    }

    return query;
};

// Prepare status time fields.
const buildStatusTimeFields = (status) => {
    const updateData = {};

    if (status === 'called') {
        updateData.calledAt = new Date();
    }

    if (status === 'completed') {
        updateData.completedAt = new Date();
    }

    return updateData;
};

// Create queue entry.
const createQueueEntry = async (data, user) => {
    const patient = toCleanString(data.patient);
    const appointment = toCleanString(data.appointment) || null;
    const department = toCleanString(data.department);
    const priority = toCleanString(data.priority) || 'normal';

    if (!patient || !department) {
        throw new Error('patient and department are required');
    }

    if (!QUEUE_PRIORITIES.includes(priority)) {
        throw new Error('Invalid queue priority');
    }

    await validatePatientExists(patient);
    await validateAppointmentExists(appointment);

    const queueNumber = await queueDao.getNextQueueNumber();
    const queueEntry = await queueDao.createQueueEntry({
        queueNumber,
        patient,
        appointment,
        department,
        priority,
        status: 'waiting',
        createdBy: user.id,
    });

    const populatedQueueEntry = await queueDao.getQueueEntryById(queueEntry._id);
    return sanitizeQueueEntry(populatedQueueEntry);
};

// Load queue entries.
const getQueueEntries = async (queryParams) => {
    const query = buildQueueQuery(queryParams);
    const queueEntries = await queueDao.getQueueEntries(query);
    return queueEntries.map(sanitizeQueueEntry);
};

// Load queue entry by id.
const getQueueEntryById = async (id) => {
    requireObjectId(id, 'queue entry id');
    const queueEntry = await queueDao.getQueueEntryById(id);

    if (!queueEntry) {
        throw new Error('Queue entry not found');
    }

    return sanitizeQueueEntry(queueEntry);
};

// Update queue entry.
const updateQueueEntry = async (id, data) => {
    await getQueueEntryById(id);

    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(data, 'department')) {
        const department = toCleanString(data.department);
        if (!department) {
            throw new Error('department cannot be empty');
        }
        updateData.department = department;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'priority')) {
        const priority = toCleanString(data.priority);
        if (!QUEUE_PRIORITIES.includes(priority)) {
            throw new Error('Invalid queue priority');
        }
        updateData.priority = priority;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!QUEUE_STATUSES.includes(status)) {
            throw new Error('Invalid queue status');
        }
        updateData.status = status;
        Object.assign(updateData, buildStatusTimeFields(status));
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No queue fields provided for update');
    }

    const queueEntry = await queueDao.updateQueueEntry(id, updateData);
    return sanitizeQueueEntry(queueEntry);
};

// Remove queue entry.
const deleteQueueEntry = async (id) => {
    const queueEntry = await getQueueEntryById(id);
    await queueDao.deleteQueueEntry(id);
    return queueEntry;
};

// Handle queue service.
const queueService = {
    createQueueEntry,
    getQueueEntries,
    getQueueEntryById,
    updateQueueEntry,
    deleteQueueEntry,
};

export default queueService;
