import mongoose from 'mongoose';
import feedbackDao from '../dao/feedbackDao.js';
import patientDao from '../dao/patientDao.js';

const FEEDBACK_CATEGORIES = ['feedback', 'complaint', 'service_request'];
const FEEDBACK_STATUSES = ['open', 'in_review', 'resolved', 'closed'];

const sanitizeFeedback = (feedback) => ({
    id: feedback._id.toString(),
    submittedBy: feedback.submittedBy,
    patient: feedback.patient,
    category: feedback.category,
    subject: feedback.subject,
    message: feedback.message,
    status: feedback.status,
    response: feedback.response,
    respondedBy: feedback.respondedBy,
    respondedAt: feedback.respondedAt,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
});

const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);

const validatePatientExists = async (patientId) => {
    if (!patientId) {
        return;
    }

    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);

    if (!patient) {
        throw new Error('Patient not found');
    }
};

const buildFeedbackQuery = (queryParams, user) => {
    const query = {};

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.submittedBy) {
        requireObjectId(queryParams.submittedBy, 'submittedBy user id');
        query.submittedBy = queryParams.submittedBy;
    }

    if (queryParams.category) {
        if (!FEEDBACK_CATEGORIES.includes(queryParams.category)) {
            throw new Error('Invalid feedback category');
        }
        query.category = queryParams.category;
    }

    if (queryParams.status) {
        if (!FEEDBACK_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid feedback status');
        }
        query.status = queryParams.status;
    }

    if (user.role === 'patient') {
        query.submittedBy = user.id;
    }

    return query;
};

const createFeedback = async (data, user) => {
    const category = toCleanString(data.category) || 'feedback';
    const subject = toCleanString(data.subject);
    const message = toCleanString(data.message);
    const patient = toCleanString(data.patient) || null;

    if (!subject || !message) {
        throw new Error('subject and message are required');
    }

    if (!FEEDBACK_CATEGORIES.includes(category)) {
        throw new Error('Invalid feedback category');
    }

    await validatePatientExists(patient);

    const feedback = await feedbackDao.createFeedback({
        submittedBy: user.id,
        patient,
        category,
        subject,
        message,
        status: 'open',
        response: '',
    });

    const populatedFeedback = await feedbackDao.getFeedbackById(feedback._id);
    return sanitizeFeedback(populatedFeedback);
};

const getFeedbackEntries = async (queryParams, user) => {
    const query = buildFeedbackQuery(queryParams, user);
    const feedbackEntries = await feedbackDao.getFeedbackEntries(query);
    return feedbackEntries.map(sanitizeFeedback);
};

const getFeedbackById = async (id, user) => {
    requireObjectId(id, 'feedback id');
    const feedback = await feedbackDao.getFeedbackById(id);

    if (!feedback) {
        throw new Error('Feedback not found');
    }

    if (user.role === 'patient' && feedback.submittedBy._id.toString() !== user.id) {
        throw new Error('Feedback not found');
    }

    return sanitizeFeedback(feedback);
};

const updateFeedback = async (id, data, user) => {
    await getFeedbackById(id, { role: 'admin' });

    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(data, 'category')) {
        const category = toCleanString(data.category);
        if (!FEEDBACK_CATEGORIES.includes(category)) {
            throw new Error('Invalid feedback category');
        }
        updateData.category = category;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const status = toCleanString(data.status);
        if (!FEEDBACK_STATUSES.includes(status)) {
            throw new Error('Invalid feedback status');
        }
        updateData.status = status;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'response')) {
        updateData.response = toCleanString(data.response) || '';
        updateData.respondedBy = user.id;
        updateData.respondedAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No feedback fields provided for update');
    }

    const feedback = await feedbackDao.updateFeedback(id, updateData);
    return sanitizeFeedback(feedback);
};

const deleteFeedback = async (id) => {
    const feedback = await getFeedbackById(id, { role: 'admin' });
    await feedbackDao.deleteFeedback(id);
    return feedback;
};

const feedbackService = {
    createFeedback,
    getFeedbackEntries,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
};

export default feedbackService;
