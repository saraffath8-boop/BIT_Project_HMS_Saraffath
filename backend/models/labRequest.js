import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema(
    {
        testName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        result: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: '',
        },
        referenceRange: {
            type: String,
            trim: true,
            maxlength: 300,
            default: '',
        },
        remarks: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
    },
    { _id: true }
);

const labRequestSchema = new mongoose.Schema(
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
        tests: {
            type: [labTestSchema],
            validate: [(tests) => tests.length > 0, 'At least one lab test is required'],
        },
        priority: {
            type: String,
            enum: ['routine', 'urgent'],
            default: 'routine',
        },
        status: {
            type: String,
            enum: ['requested', 'sample_collected', 'in_progress', 'completed', 'cancelled'],
            default: 'requested',
        },
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        completedAt: Date,
    },
    { timestamps: true }
);

labRequestSchema.index({ patient: 1, createdAt: -1 });
labRequestSchema.index({ doctor: 1, createdAt: -1 });
labRequestSchema.index({ status: 1 });

const LabRequest = mongoose.models.LabRequest || mongoose.model('LabRequest', labRequestSchema);

export default LabRequest;
