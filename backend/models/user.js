// This file contains the user database model.

import mongoose from 'mongoose';
import { ALL_USER_ROLES, USER_ROLES as USER_ROLE_VALUES } from '../types/userRoles.js';
import {
    calculateAge,
    normalizeNic,
    PERSON_NAME_REGEX,
    SRI_LANKAN_NIC_REGEX,
    SRI_LANKAN_PHONE_REGEX,
} from '../utils/userValidation.js';

// Store the user roles setting used by this file.
export const USER_ROLES = ALL_USER_ROLES;

// Define the user schema database fields and rules.
const userSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: [80, 'Name cannot exceed 80 characters'] },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters long'],
            match: [PERSON_NAME_REGEX, 'First name contains invalid characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters long'],
            match: [PERSON_NAME_REGEX, 'Last name contains invalid characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            sparse: true,
            trim: true,
            match: [
                SRI_LANKAN_PHONE_REGEX,
                'Phone number must be a valid Sri Lankan 10-digit number starting with 0',
            ],
        },
        nic: {
            type: String,
            required: [true, 'NIC is required'],
            unique: true,
            sparse: true,
            trim: true,
            set: normalizeNic,
            match: [SRI_LANKAN_NIC_REGEX, 'NIC must be 12 digits or 9 digits followed by V/X'],
        },
        dob: {
            type: Date,
            required: [true, 'Date of birth is required'],
            validate: {
                validator(value) {
                    return (
                        value <= new Date() &&
                        (this.role === USER_ROLE_VALUES.PATIENT || calculateAge(value) >= 18)
                    );
                },
                message:
                    'Date of birth must not be in the future and staff users must be at least 18 years old',
            },
        },
        gender: {
            type: String,
            required: [true, 'Gender is required'],
            enum: ['Male', 'Female', 'Other'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false,
        },
        role: {
            type: String,
            enum: ALL_USER_ROLES,
            default: USER_ROLE_VALUES.PATIENT,
            required: true,
        },
        isActive: { type: Boolean, default: true },
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
        specialization: { type: String, trim: true, maxlength: 160, default: '' },
        consultationFee: { type: Number, min: 0, default: 0 },
        roomNumber: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            match: [/^[1-9][0-9]$/, 'Room number must be a two-digit number'],
        },
        availableDays: { type: [Number], default: [1, 2, 3, 4, 5] },
        availableTimeSlots: {
            type: [String],
            default: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        },
        avatar: {
            public_id: { type: String, default: null },
            url: {
                type: String,
                default: 'https://ui-avatars.com/api/?name=User&background=0e7490&color=fff',
            },
        },
        lastLogin: { type: Date, default: null },
        passwordChangedAt: { type: Date, default: null },
        passwordResetOtpHash: { type: String, select: false, default: null },
        passwordResetOtpExpiresAt: { type: Date, select: false, default: null },
        passwordResetOtpLastSentAt: { type: Date, select: false, default: null },
        passwordResetOtpAttempts: { type: Number, select: false, default: 0 },
    },
    { timestamps: true },
);

userSchema.pre('validate', function setLegacyName() {
    if (this.firstName && this.lastName) {
        this.name = `${this.firstName} ${this.lastName}`.trim();
    }
});

// Handle user.
const User = mongoose.model('User', userSchema);
export default User;
