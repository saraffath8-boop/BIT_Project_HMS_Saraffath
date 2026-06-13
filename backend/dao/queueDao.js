// This file contains the queue dao database queries.

import QueueEntry, { QueueCounter } from '../models/queueEntry.js';

// Group the queue dao database queries.
class QueueDao {
    // Load next queue number.
    async getNextQueueNumber() {
        const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
        const counterId = `queue-${datePart}`;
        const counter = await QueueCounter.findByIdAndUpdate(
            counterId,
            { $inc: { sequenceValue: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).exec();

        return `Q-${datePart}-${String(counter.sequenceValue).padStart(3, '0')}`;
    }

    // Create queue entry.
    async createQueueEntry(queueData) {
        const queueEntry = new QueueEntry(queueData);
        return queueEntry.save();
    }

    // Load queue entries.
    async getQueueEntries(query = {}) {
        return QueueEntry.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: 1 })
            .exec();
    }

    // Load queue entry by id.
    async getQueueEntryById(id) {
        return QueueEntry.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Update queue entry.
    async updateQueueEntry(id, updateData) {
        return QueueEntry.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .exec();
    }

    // Remove queue entry.
    async deleteQueueEntry(id) {
        return QueueEntry.findByIdAndDelete(id).exec();
    }

    // Handle count queue entries.
    async countQueueEntries(query = {}) {
        return QueueEntry.countDocuments(query).exec();
    }
}

export default new QueueDao();
