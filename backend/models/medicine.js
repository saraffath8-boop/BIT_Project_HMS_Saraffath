import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            maxlength: 80,
        },
        category: {
            type: String,
            trim: true,
            maxlength: 120,
            default: '',
        },
        manufacturer: {
            type: String,
            trim: true,
            maxlength: 160,
            default: '',
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        stockQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        reorderLevel: {
            type: Number,
            min: 0,
            default: 10,
        },
        expiryDate: Date,
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

medicineSchema.index({ name: 'text', sku: 'text', category: 'text' });
medicineSchema.index({ stockQuantity: 1, reorderLevel: 1 });

const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

export default Medicine;
