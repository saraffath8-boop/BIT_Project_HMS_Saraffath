import Feedback from '../models/feedback.js';

class FeedbackDao {
    async createFeedback(feedbackData) {
        const feedback = new Feedback(feedbackData);
        return feedback.save();
    }

    async getFeedbackEntries(query = {}) {
        return Feedback.find(query)
            .populate('submittedBy', 'name email role')
            .populate('patient', 'patientId fullName phone')
            .populate('respondedBy', 'name email role')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getFeedbackById(id) {
        return Feedback.findById(id)
            .populate('submittedBy', 'name email role')
            .populate('patient', 'patientId fullName phone')
            .populate('respondedBy', 'name email role')
            .exec();
    }

    async updateFeedback(id, updateData) {
        return Feedback.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('submittedBy', 'name email role')
            .populate('patient', 'patientId fullName phone')
            .populate('respondedBy', 'name email role')
            .exec();
    }

    async deleteFeedback(id) {
        return Feedback.findByIdAndDelete(id).exec();
    }

    async countFeedback(query = {}) {
        return Feedback.countDocuments(query).exec();
    }
}

export default new FeedbackDao();
