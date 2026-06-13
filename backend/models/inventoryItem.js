import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        itemCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            maxlength: 80,
        },
        category: {
            type: String,
            enum: ['medical_supply', 'equipment', 'laboratory', 'radiology', 'office', 'other'],
            default: 'other',
        },
        unit: {
            type: String,
            required: true,
            trim: true,
            maxlength: 40,
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
        supplier: {
            type: String,
            trim: true,
            maxlength: 160,
            default: '',
        },
        location: {
            type: String,
            trim: true,
            maxlength: 160,
            default: '',
        },
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

inventoryItemSchema.index({ name: 'text', itemCode: 'text', category: 'text' });
inventoryItemSchema.index({ stockQuantity: 1, reorderLevel: 1 });

const InventoryItem = mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema);

export default InventoryItem;
