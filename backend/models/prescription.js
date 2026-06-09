import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema(
    {
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            default: null,
        },
        medicineName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        dosage: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        frequency: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        duration: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        instructions: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
    },
    { _id: true }
);

const prescriptionSchema = new mongoose.Schema(
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
        items: {
            type: [prescriptionItemSchema],
            validate: [(items) => items.length > 0, 'At least one medicine is required'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'partially_issued', 'issued', 'cancelled'],
            default: 'pending',
        },
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        issuedAt: Date,
    },
    { timestamps: true }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1 });

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
