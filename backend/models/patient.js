import mongoose from 'mongoose';
import { PATIENT_NAME_REGEX, SRI_LANKAN_PHONE_REGEX } from '../utils/userValidation.js';



const counterSchema = new mongoose.Schema(

    {

        _id: { type: String, required: true },

        sequenceValue: { type: Number, default: 0 },

    },

    { versionKey: false }

);



export const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);



const patientSchema = new mongoose.Schema(

    {

        patientId: {

            type: String,

            required: true,

            unique: true,

            trim: true,

        },

        fullName: {

            type: String,

            required: [true, 'Full name is required'],

            trim: true,

            minlength: [2, 'Full name must be at least 2 characters long'],

            maxlength: [120, 'Full name cannot exceed 120 characters'],
            match: [PATIENT_NAME_REGEX, 'Full name contains invalid characters'],

        },

        dateOfBirth: {

            type: Date,

            required: [true, 'Date of birth is required'],

        },

        gender: {

            type: String,

            required: [true, 'Gender is required'],

            enum: ['male', 'female', 'other'],
            set: (value) => typeof value === 'string' ? value.toLowerCase() : value,

        },

        phone: {

            type: String,

            required: [true, 'Phone number is required'],

            trim: true,

            match: [SRI_LANKAN_PHONE_REGEX, 'Phone number must be a valid Sri Lankan 10-digit number starting with 0'],

        },

        address: {

            type: String,

            required: [true, 'Address is required'],

            trim: true,

            maxlength: [300, 'Address cannot exceed 300 characters'],

        },

        emergencyContactName: {

            type: String,

            required: [true, 'Emergency contact name is required'],

            trim: true,

            maxlength: [120, 'Emergency contact name cannot exceed 120 characters'],
            match: [PATIENT_NAME_REGEX, 'Emergency contact name contains invalid characters'],

        },

        emergencyContactPhone: {

            type: String,

            required: [true, 'Emergency contact phone is required'],

            trim: true,

            match: [SRI_LANKAN_PHONE_REGEX, 'Emergency contact phone must be a valid Sri Lankan 10-digit number starting with 0'],

        },

        bloodGroup: {

            type: String,

            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],

            default: 'unknown',
            set: (value) => typeof value === 'string' && value.toLowerCase() === 'unknown' ? 'unknown' : value,

        },

        allergies: {

            type: String,

            trim: true,

            default: '',

            maxlength: [1000, 'Allergies cannot exceed 1000 characters'],

        },

        medicalNotes: {

            type: String,

            trim: true,

            default: '',

            maxlength: [3000, 'Medical notes cannot exceed 3000 characters'],

        },

        status: {

            type: String,

            enum: ['active', 'admitted', 'discharged', 'inactive'],

            default: 'active',
            set: (value) => typeof value === 'string' ? value.toLowerCase() : value,

        },

        createdBy: {

            type: mongoose.Schema.Types.ObjectId,

            ref: 'User',

            default: null,

        },

        userAccount: {

            type: mongoose.Schema.Types.ObjectId,

            ref: 'User',

            default: null,

            index: true,

        },

    },

    { timestamps: true }

);



patientSchema.index({ fullName: 'text', phone: 'text' });

patientSchema.index({ createdBy: 1 });



const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);



export default Patient;
