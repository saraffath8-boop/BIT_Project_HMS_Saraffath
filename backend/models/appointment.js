// This file contains the appointment database model.

import mongoose from 'mongoose';

// Define the appointment schema database fields and rules.
const appointmentSchema = new mongoose.Schema(
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
        department: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        departmentRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            default: null,
        },
        appointmentDate: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
        status: {
            type: String,
            enum: [
                'requested',
                'pending_confirmation',
                'scheduled',
                'confirmed',
                'paid',
                'checked_in',
                'in_consultation',
                'completed',
                'cancelled',
                'no_show',
            ],
            default: 'scheduled',
        },
        timeSlot: { type: String, trim: true, default: '' },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'pending', 'paid', 'refunded'],
            default: 'unpaid',
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true },
);

appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ status: 1 });

// Handle appointment.
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

export default Appointment;
