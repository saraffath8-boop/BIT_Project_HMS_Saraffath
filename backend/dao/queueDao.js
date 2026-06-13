import QueueEntry, { QueueCounter } from '../models/queueEntry.js';

class QueueDao {
    async getNextQueueNumber() {
        const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
        const counterId = `queue-${datePart}`;
        const counter = await QueueCounter.findByIdAndUpdate(
            counterId,
            { $inc: { sequenceValue: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).exec();

        return `Q-${datePart}-${String(counter.sequenceValue).padStart(3, '0')}`;
    }

    async createQueueEntry(queueData) {
        const queueEntry = new QueueEntry(queueData);
        return queueEntry.save();
    }

    async getQueueEntries(query = {}) {
        return QueueEntry.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: 1 })
            .exec();
    }

    async getQueueEntryById(id) {
        return QueueEntry.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    async updateQueueEntry(id, updateData) {
        return QueueEntry.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    async deleteQueueEntry(id) {
        return QueueEntry.findByIdAndDelete(id).exec();
    }

    async countQueueEntries(query = {}) {
        return QueueEntry.countDocuments(query).exec();
    }
}

export default new QueueDao();
