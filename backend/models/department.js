import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 500, default: '' },
        status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    },
    { timestamps: true },
);

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department;
