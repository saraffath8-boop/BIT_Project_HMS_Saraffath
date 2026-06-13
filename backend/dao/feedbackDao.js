// This file contains the feedback dao database queries.

import Feedback from '../models/feedback.js';

// Group the feedback dao database queries.
class FeedbackDao {
    // Create feedback.
    async createFeedback(feedbackData) {
        const feedback = new Feedback(feedbackData);
        return feedback.save();
    }

    // Load feedback entries.
    async getFeedbackEntries(query = {}) {
        return Feedback.find(query)
            .populate('submittedBy', 'name email role')
            .populate('patient', 'patientId fullName phone')
            .populate('respondedBy', 'name email role')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Load feedback by id.
    async getFeedbackById(id) {
        return Feedback.findById(id)
            .populate('submittedBy', 'name email role')
            .populate('patient', 'patientId fullName phone')
            .populate('respondedBy', 'name email role')
            .exec();
    }

    // Update feedback.
    async updateFeedback(id, updateData) {
        return Feedback.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('submittedBy', 'name email role')
            .populate('patient', 'patientId fullName phone')
            .populate('respondedBy', 'name email role')
            .exec();
    }

    // Remove feedback.
    async deleteFeedback(id) {
        return Feedback.findByIdAndDelete(id).exec();
    }

    // Handle count feedback.
    async countFeedback(query = {}) {
        return Feedback.countDocuments(query).exec();
    }
}

export default new FeedbackDao();
