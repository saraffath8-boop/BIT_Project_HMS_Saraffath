import Appointment from '../models/appointment.js';

class AppointmentDao {
    async createAppointment(appointmentData) {
        const appointment = new Appointment(appointmentData);
        return appointment.save();
    }

    async getAppointments(query = {}) {
        return Appointment.find(query)
            .populate('patient', 'patientId fullName phone gender')
            .populate('doctor', 'name email role')
            .populate('createdBy', 'name email role')
            .sort({ appointmentDate: 1 })
            .exec();
    }

    async getAppointmentById(id) {
        return Appointment.findById(id)
            .populate('patient', 'patientId fullName phone gender')
            .populate('doctor', 'name email role')
            .populate('createdBy', 'name email role')
            .exec();
    }

    async updateAppointment(id, updateData) {
        return Appointment.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone gender')
            .populate('doctor', 'name email role')
            .populate('createdBy', 'name email role')
            .exec();
    }

    async deleteAppointment(id) {
        return Appointment.findByIdAndDelete(id).exec();
    }

    async countAppointments(query = {}) {
        return Appointment.countDocuments(query).exec();
    }
}

export default new AppointmentDao();
