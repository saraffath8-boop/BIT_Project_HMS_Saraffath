// This file contains the lab request database model.

import mongoose from 'mongoose';

// Define the lab test schema database fields and rules.
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
    { _id: true },
);

// Define the lab request schema database fields and rules.
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
        patientDecisionStatus: {
            type: String,
            enum: [
                'not_required',
                'pending_patient_decision',
                'accepted',
                'declined',
                'paid',
                'rejected_by_patient',
            ],
            default: 'not_required',
        },
        paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
        paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        paidAt: Date,
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        completedAt: Date,
    },
    { timestamps: true },
);

labRequestSchema.index({ patient: 1, createdAt: -1 });
labRequestSchema.index({ doctor: 1, createdAt: -1 });
labRequestSchema.index({ status: 1 });

// Handle lab request.
const LabRequest = mongoose.models.LabRequest || mongoose.model('LabRequest', labRequestSchema);

export default LabRequest;
