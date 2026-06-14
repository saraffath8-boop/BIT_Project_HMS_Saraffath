// This file contains the doctor service business workflow.

import mongoose from 'mongoose';
import departmentDao from '../dao/departmentDao.js';
import doctorScheduleDao from '../dao/doctorScheduleDao.js';
import userDao from '../dao/userDao.js';

// Store the date pattern setting used by this file.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const HOSPITAL_TIME_ZONE = 'Asia/Colombo';
const HOSPITAL_UTC_OFFSET = '+05:30';

// Create the service error.
const serviceError = (message, statusCode = 400) =>
    Object.assign(new Error(message), { statusCode });

// Validate object id.
const requireObjectId = (id, label) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw serviceError(`Invalid ${label}`);
};

export const formatHospitalDate = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: HOSPITAL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};

// Validate an appointment date value.
export const getAppointmentDate = (dateValue) => {
    if (!DATE_PATTERN.test(dateValue || '')) throw serviceError('date must use YYYY-MM-DD format');
    const selectedDate = new Date(`${dateValue}T00:00:00${HOSPITAL_UTC_OFFSET}`);
    if (Number.isNaN(selectedDate.getTime())) throw serviceError('date must be a valid date');
    if (formatHospitalDate(selectedDate) !== dateValue) {
        throw serviceError('date must be a valid date');
    }
    return selectedDate;
};

// Prepare appointment date.
export const buildAppointmentDate = (dateValue, timeSlot) => {
    getAppointmentDate(dateValue);
    if (!TIME_PATTERN.test(timeSlot || '')) throw serviceError('A valid time slot is required');
    const appointmentDate = new Date(`${dateValue}T${timeSlot}:00${HOSPITAL_UTC_OFFSET}`);
    if (Number.isNaN(appointmentDate.getTime()))
        throw serviceError('Selected time slot is invalid');
    return appointmentDate;
};

// Load doctor or throw.
export const getDoctorOrThrow = async (doctorId) => {
    requireObjectId(doctorId, 'doctor id');
    const doctor = await userDao.getUserById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isActive)
        throw serviceError('Doctor not found', 404);
    return doctor;
};

// Prepare doctor.
const sanitizeDoctor = (doctor) => ({
    id: doctor._id.toString(),
    fullName: doctor.name,
    department: doctor.department
        ? { id: doctor.department._id.toString(), name: doctor.department.name }
        : null,
    specialization: doctor.specialization || '',
    consultationFee: doctor.consultationFee || 0,
});

// Load doctors.
const getDoctors = async (departmentId) => {
    requireObjectId(departmentId, 'department id');
    const department = await departmentDao.getDepartmentById(departmentId);
    if (!department || department.status !== 'active')
        throw serviceError('Department not found', 404);
    const doctors = await userDao.getActiveDoctorsByDepartment(departmentId);
    return doctors.map(sanitizeDoctor);
};

// Load doctor availability.
export const getDoctorAvailability = async (doctorId, dateValue) => {
    getAppointmentDate(dateValue);
    const doctor = await getDoctorOrThrow(doctorId);
    const schedule = await doctorScheduleDao.getSchedule(doctorId, dateValue);
    const scheduledSlots = schedule?.timeSlots || [];

    const slotChecks = scheduledSlots.map((timeSlot) => ({ timeSlot, available: true }));

    return { doctor: sanitizeDoctor(doctor), date: dateValue, slots: slotChecks };
};

const replaceDoctorAvailability = async (doctorId, dateValue, timeSlots, user) => {
    getAppointmentDate(dateValue);
    await getDoctorOrThrow(doctorId);
    if (!Array.isArray(timeSlots)) throw serviceError('timeSlots must be an array');

    const normalizedSlots = [...new Set(timeSlots.map((slot) => String(slot).trim()))].sort();
    if (normalizedSlots.some((slot) => !TIME_PATTERN.test(slot))) {
        throw serviceError('Every time slot must use HH:MM 24-hour format');
    }

    await doctorScheduleDao.replaceSchedule(doctorId, dateValue, normalizedSlots, user.id);
    return getDoctorAvailability(doctorId, dateValue);
};

export default { getDoctors, getDoctorAvailability, replaceDoctorAvailability };
