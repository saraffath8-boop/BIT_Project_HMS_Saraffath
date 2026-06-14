import mongoose from 'mongoose';

const doctorScheduleSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Schedule date must use YYYY-MM-DD format'],
        },
        timeSlots: {
            type: [String],
            default: [],
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true },
);

doctorScheduleSchema.index({ doctor: 1, date: 1 }, { unique: true });

const DoctorSchedule =
    mongoose.models.DoctorSchedule || mongoose.model('DoctorSchedule', doctorScheduleSchema);

export default DoctorSchedule;
