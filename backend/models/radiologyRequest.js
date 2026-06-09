import mongoose from 'mongoose';

const radiologyRequestSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        medicalRecord: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicalRecord',
            default: null,
        },
        scanType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        bodyPart: {
            type: String,
            trim: true,
            maxlength: 160,
            default: '',
        },
        clinicalReason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        scheduledAt: Date,
        imageUrl: {
            type: String,
            trim: true,
            default: '',
        },
        report: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: '',
        },
        status: {
            type: String,
            enum: ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'],
            default: 'requested',
        },
        radiologist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        completedAt: Date,
    },
    { timestamps: true }
);

radiologyRequestSchema.index({ patient: 1, createdAt: -1 });
radiologyRequestSchema.index({ doctor: 1, createdAt: -1 });
radiologyRequestSchema.index({ status: 1 });

const RadiologyRequest = mongoose.models.RadiologyRequest || mongoose.model('RadiologyRequest', radiologyRequestSchema);

export default RadiologyRequest;
