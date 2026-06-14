import DoctorSchedule from '../models/doctorSchedule.js';

class DoctorScheduleDao {
    async getSchedule(doctorId, date) {
        return DoctorSchedule.findOne({ doctor: doctorId, date }).exec();
    }

    async replaceSchedule(doctorId, date, timeSlots, updatedBy) {
        return DoctorSchedule.findOneAndUpdate(
            { doctor: doctorId, date },
            { doctor: doctorId, date, timeSlots, updatedBy },
            { new: true, upsert: true, runValidators: true },
        ).exec();
    }
}

export default new DoctorScheduleDao();
