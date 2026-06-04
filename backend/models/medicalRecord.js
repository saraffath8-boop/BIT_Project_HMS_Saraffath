import mongoose from 'mongoose';

const vitalSignsSchema = new mongoose.Schema(
    {
        temperature: String,
        bloodPressure: String,
        pulse: String,
        respiratoryRate: String,
        oxygenSaturation: String,
        weight: String,
    },
    { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
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
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },
        chiefComplaint: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        diagnosis: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: '',
        },
        consultationNotes: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: '',
        },
        vitalSigns: {
            type: vitalSignsSchema,
            default: {},
        },
        followUpDate: Date,
        status: {
            type: String,
            enum: ['open', 'completed', 'archived'],
            default: 'open',
        },
		doctorComment: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: '',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ doctor: 1, createdAt: -1 });
medicalRecordSchema.index({ appointment: 1 });

const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
