import mongoose from 'mongoose';
import appointmentDao from '../dao/appointmentDao.js';
import departmentDao from '../dao/departmentDao.js';
import userDao from '../dao/userDao.js';

const DEFAULT_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const serviceError = (message, statusCode = 400) =>
    Object.assign(new Error(message), { statusCode });

const requireObjectId = (id, label) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw serviceError(`Invalid ${label}`);
};

export const getFutureDate = (dateValue) => {
    if (!DATE_PATTERN.test(dateValue || '')) throw serviceError('date must use YYYY-MM-DD format');
    const selectedDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) throw serviceError('date must be a valid date');
    const [year, month, day] = dateValue.split('-').map(Number);
    if (
        selectedDate.getFullYear() !== year ||
        selectedDate.getMonth() + 1 !== month ||
        selectedDate.getDate() !== day
    ) {
        throw serviceError('date must be a valid date');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) throw serviceError('Appointment date must be in the future');
    return selectedDate;
};

export const buildAppointmentDate = (dateValue, timeSlot) => {
    getFutureDate(dateValue);
    if (!/^\d{2}:\d{2}$/.test(timeSlot || '')) throw serviceError('A valid time slot is required');
    const appointmentDate = new Date(`${dateValue}T${timeSlot}:00`);
    if (Number.isNaN(appointmentDate.getTime()))
        throw serviceError('Selected time slot is invalid');
    return appointmentDate;
};

export const getDoctorOrThrow = async (doctorId) => {
    requireObjectId(doctorId, 'doctor id');
    const doctor = await userDao.getUserById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isActive)
        throw serviceError('Doctor not found', 404);
    return doctor;
};

const sanitizeDoctor = (doctor) => ({
    id: doctor._id.toString(),
    fullName: doctor.name,
    department: doctor.department
        ? { id: doctor.department._id.toString(), name: doctor.department.name }
        : null,
    specialization: doctor.specialization || '',
    consultationFee: doctor.consultationFee || 0,
    availableDays: doctor.availableDays?.length ? doctor.availableDays : DEFAULT_DAYS,
    availableTimeSlots: doctor.availableTimeSlots?.length
        ? doctor.availableTimeSlots
        : DEFAULT_SLOTS,
});

const getDoctors = async (departmentId) => {
    requireObjectId(departmentId, 'department id');
    const department = await departmentDao.getDepartmentById(departmentId);
    if (!department || department.status !== 'active')
        throw serviceError('Department not found', 404);
    const doctors = await userDao.getActiveDoctorsByDepartment(departmentId);
    return doctors.map(sanitizeDoctor);
};

const getDoctorAvailability = async (doctorId, dateValue) => {
    const selectedDate = getFutureDate(dateValue);
    const doctor = await getDoctorOrThrow(doctorId);
    const availableDays = doctor.availableDays?.length ? doctor.availableDays : DEFAULT_DAYS;
    const scheduledSlots = doctor.availableTimeSlots?.length
        ? doctor.availableTimeSlots
        : DEFAULT_SLOTS;

    if (!availableDays.includes(selectedDate.getDay())) {
        return { doctor: sanitizeDoctor(doctor), date: dateValue, slots: [] };
    }

    const slotChecks = await Promise.all(
        scheduledSlots.map(async (timeSlot) => {
            const appointmentDate = buildAppointmentDate(dateValue, timeSlot);
            const conflict = await appointmentDao.findDoctorSlotConflict(doctorId, appointmentDate);
            return { timeSlot, available: !conflict };
        }),
    );

    return { doctor: sanitizeDoctor(doctor), date: dateValue, slots: slotChecks };
};

export default { getDoctors, getDoctorAvailability };
