import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
    {
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            default: null,
        },
        category: {
            type: String,
            enum: ['feedback', 'complaint', 'service_request'],
            default: 'feedback',
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 180,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000,
        },
        status: {
            type: String,
            enum: ['open', 'in_review', 'resolved', 'closed'],
            default: 'open',
        },
        response: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: '',
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        respondedAt: Date,
    },
    { timestamps: true }
);

feedbackSchema.index({ submittedBy: 1, createdAt: -1 });
feedbackSchema.index({ patient: 1 });
feedbackSchema.index({ status: 1 });

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

export default Feedback;
