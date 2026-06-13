// This file contains the appointment dao database queries.

import Appointment from '../models/appointment.js';

// Group the appointment dao database queries.
class AppointmentDao {
    // Create appointment.
    async createAppointment(appointmentData) {
        const appointment = new Appointment(appointmentData);
        return appointment.save();
    }

    // Load appointments.
    async getAppointments(query = {}) {
        return Appointment.find(query)
            .populate('patient', 'patientId fullName phone gender')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('departmentRef', 'name description status')
            .populate('createdBy', 'name email role')
            .populate('requestedBy', 'name email role')
            .sort({ appointmentDate: 1 })
            .exec();
    }

    // Load appointment by id.
    async getAppointmentById(id) {
        return Appointment.findById(id)
            .populate('patient', 'patientId fullName phone gender')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('departmentRef', 'name description status')
            .populate('createdBy', 'name email role')
            .populate('requestedBy', 'name email role')
            .exec();
    }

    // Update appointment.
    async updateAppointment(id, updateData) {
        return Appointment.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone gender')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('departmentRef', 'name description status')
            .populate('createdBy', 'name email role')
            .populate('requestedBy', 'name email role')
            .exec();
    }

    // Load doctor slot conflict.
    async findDoctorSlotConflict(doctorId, appointmentDate) {
        return Appointment.findOne({
            doctor: doctorId,
            appointmentDate,
            status: { $ne: 'cancelled' },
        }).exec();
    }

    // Remove appointment.
    async deleteAppointment(id) {
        return Appointment.findByIdAndDelete(id).exec();
    }

    // Handle count appointments.
    async countAppointments(query = {}) {
        return Appointment.countDocuments(query).exec();
    }
}

export default new AppointmentDao();
