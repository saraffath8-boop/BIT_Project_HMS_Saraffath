// This file contains the department database model.

import mongoose from 'mongoose';

// Define the department schema database fields and rules.
const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 500, default: '' },
        status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    },
    { timestamps: true },
);

// Handle department.
const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;
