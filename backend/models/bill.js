import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 250,
        },
        category: {
            type: String,
            enum: ['consultation', 'medicine', 'laboratory', 'radiology', 'ward', 'procedure', 'other'],
            default: 'other',
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: true }
);

const paymentSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        method: {
            type: String,
            enum: ['cash', 'card', 'bank_transfer', 'insurance', 'other'],
            default: 'cash',
        },
        reference: {
            type: String,
            trim: true,
            default: '',
        },
        paidAt: {
            type: Date,
            default: Date.now,
        },
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { _id: true }
);

const billSchema = new mongoose.Schema(
    {
        billNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },
        items: {
            type: [billItemSchema],
            validate: [(items) => items.length > 0, 'At least one bill item is required'],
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        discount: {
            type: Number,
            min: 0,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paidAmount: {
            type: Number,
            min: 0,
            default: 0,
        },
        status: {
            type: String,
            enum: ['unpaid', 'partially_paid', 'paid', 'cancelled'],
            default: 'unpaid',
        },
        payments: {
            type: [paymentSchema],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

billSchema.index({ patient: 1, createdAt: -1 });
billSchema.index({ status: 1 });

const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);

export default Bill;
