import mongoose from 'mongoose';

const queueCounterSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        sequenceValue: { type: Number, default: 0 },
    },
    { versionKey: false }
);

export const QueueCounter = mongoose.models.QueueCounter || mongoose.model('QueueCounter', queueCounterSchema);

const queueEntrySchema = new mongoose.Schema(
    {
        queueNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },
        department: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        priority: {
            type: String,
            enum: ['normal', 'urgent', 'emergency'],
            default: 'normal',
        },
        status: {
            type: String,
            enum: ['waiting', 'called', 'in_service', 'completed', 'cancelled'],
            default: 'waiting',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        calledAt: Date,
        completedAt: Date,
    },
    { timestamps: true }
);

queueEntrySchema.index({ status: 1, createdAt: 1 });
queueEntrySchema.index({ patient: 1 });
queueEntrySchema.index({ appointment: 1 });

const QueueEntry = mongoose.models.QueueEntry || mongoose.model('QueueEntry', queueEntrySchema);

export default QueueEntry;
