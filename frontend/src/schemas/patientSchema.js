// This file contains the patient schema shared application logic.

import { z } from 'zod';
import { patientNameRegex, sriLankanPhoneRegex } from './userSchema.js';

// Handle patient gender options.
export const patientGenderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
];
// Handle patient status options.
export const patientStatusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Admitted', value: 'admitted' },
    { label: 'Discharged', value: 'discharged' },
    { label: 'Inactive', value: 'inactive' },
];
// Handle blood group options.
export const bloodGroupOptions = ['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
    (value) => ({ label: value === 'unknown' ? 'Unknown' : value, value }),
);

// Handle phone message.
const phoneMessage = 'Phone number must be a valid Sri Lankan 10-digit number starting with 0.';
// Prepare normalized option.
const normalizedOption = (values, message, normalize = (value) => value) =>
    z.preprocess(
        (value) => (typeof value === 'string' ? normalize(value.trim()) : value),
        z.string().refine((value) => values.includes(value), message),
    );

// Prepare patient form data.
export const normalizePatientFormData = (patient = {}) => ({
    ...patient,
    gender: typeof patient.gender === 'string' ? patient.gender.toLowerCase() : '',
    status: typeof patient.status === 'string' ? patient.status.toLowerCase() : '',
    bloodGroup:
        typeof patient.bloodGroup === 'string' && patient.bloodGroup.toLowerCase() === 'unknown'
            ? 'unknown'
            : patient.bloodGroup,
});

// Define the patient schema database fields and rules.
export const patientSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, 'Full name must be at least 2 characters')
        .regex(patientNameRegex, 'Full name contains invalid characters'),
    dateOfBirth: z
        .string()
        .min(1, 'Date of birth is required')
        .refine((value) => {
            const date = new Date(value);
            return !Number.isNaN(date.getTime()) && date <= new Date();
        }, 'Enter a valid date of birth that is not in the future'),
    gender: normalizedOption(
        patientGenderOptions.map(({ value }) => value),
        'Please select a valid gender.',
        (value) => value.toLowerCase(),
    ),
    phone: z.string().trim().regex(sriLankanPhoneRegex, phoneMessage),
    address: z.string().trim().min(1, 'Address is required'),
    emergencyContactName: z
        .string()
        .trim()
        .min(2, 'Emergency contact name is required')
        .regex(patientNameRegex, 'Emergency contact name contains invalid characters'),
    emergencyContactPhone: z
        .string()
        .trim()
        .regex(sriLankanPhoneRegex, `Emergency contact ${phoneMessage.toLowerCase()}`),
    bloodGroup: normalizedOption(
        bloodGroupOptions.map(({ value }) => value),
        'Please select a valid blood group.',
        (value) => (value.toLowerCase() === 'unknown' ? 'unknown' : value),
    ),
    allergies: z.string(),
    medicalNotes: z.string(),
    status: normalizedOption(
        patientStatusOptions.map(({ value }) => value),
        'Please select a valid status.',
        (value) => value.toLowerCase(),
    ),
});
