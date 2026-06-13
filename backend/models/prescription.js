// This file contains the prescription database model.

import mongoose from 'mongoose';

// Define the prescription item schema database fields and rules.
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
    { _id: true },
);

// Define the prescription schema database fields and rules.
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
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid'],
            default: 'unpaid',
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        paidAt: Date,
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        issuedAt: Date,
    },
    { timestamps: true },
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1 });

// Handle prescription.
const Prescription =
    mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
