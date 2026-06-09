import mongoose from 'mongoose';
import appointmentDao from '../dao/appointmentDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';

const APPOINTMENT_STATUSES = ['scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'];

const sanitizeAppointment = (appointment) => ({
    id: appointment._id.toString(),
    patient: appointment.patient,
    doctor: appointment.doctor,
    department: appointment.department,
    appointmentDate: appointment.appointmentDate,
    reason: appointment.reason,
    status: appointment.status,
    createdBy: appointment.createdBy,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
});

const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const validateAppointmentDate = (appointmentDate) => {
    const date = new Date(appointmentDate);
    if (Number.isNaN(date.getTime())) {
        throw new Error('appointmentDate must be a valid date');
    }
    return date;
};

const validatePatientExists = async (patientId) => {
    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);
    if (!patient) {
        throw new Error('Patient not found');
    }
};

const validateDoctorExists = async (doctorId) => {
    requireObjectId(doctorId, 'doctor id');
    const doctor = await userDao.getUserById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
    }
};

const buildAppointmentQuery = (queryParams, user) => {
    const query = {};

    if (queryParams.patient) {
        requireObjectId(queryParams.patient, 'patient id');
        query.patient = queryParams.patient;
    }

    if (queryParams.doctor) {
        requireObjectId(queryParams.doctor, 'doctor id');
        query.doctor = queryParams.doctor;
    }

    if (queryParams.status) {
        if (!APPOINTMENT_STATUSES.includes(queryParams.status)) {
            throw new Error('Invalid appointment status');
        }
        query.status = queryParams.status;
    }

    if (queryParams.department) {
        query.department = queryParams.department.trim();
    }

    if (queryParams.from || queryParams.to) {
        query.appointmentDate = {};

        if (queryParams.from) {
            query.appointmentDate.$gte = validateAppointmentDate(queryParams.from);
        }

        if (queryParams.to) {
            query.appointmentDate.$lte = validateAppointmentDate(queryParams.to);
        }
    }

    if (user.role === 'doctor') {
        query.doctor = user.id;
    }

    return query;
};

const createAppointment = async (data, user) => {
    const { patient, department, appointmentDate } = data;
    const doctor = user.role === 'doctor' ? user.id : data.doctor;

    if (!patient || !doctor || !department || !appointmentDate) {
        throw new Error('patient, doctor, department, and appointmentDate are required');
    }

    await validatePatientExists(patient);
    await validateDoctorExists(doctor);

    if (data.status && !APPOINTMENT_STATUSES.includes(data.status)) {
        throw new Error('Invalid appointment status');
    }

    const appointment = await appointmentDao.createAppointment({
        patient,
        doctor,
        department: department.trim(),
        appointmentDate: validateAppointmentDate(appointmentDate),
        reason: data.reason?.trim() || '',
        status: data.status || 'scheduled',
        createdBy: user.id,
    });

    const populatedAppointment = await appointmentDao.getAppointmentById(appointment._id);
    return sanitizeAppointment(populatedAppointment);
};

const getAppointments = async (queryParams, user) => {
    const query = buildAppointmentQuery(queryParams, user);
    const appointments = await appointmentDao.getAppointments(query);
    return appointments.map(sanitizeAppointment);
};

const getMyAppointments = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);

    if (!patient) {
        throw new Error('No patient profile is linked to this account');
    }

    const appointments = await appointmentDao.getAppointments({ patient: patient._id });
    return appointments.map(sanitizeAppointment);
};

const getAppointmentById = async (id, user) => {
    requireObjectId(id, 'appointment id');
    const appointment = await appointmentDao.getAppointmentById(id);

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (user.role === 'doctor' && appointment.doctor._id.toString() !== user.id) {
        throw new Error('Appointment not found');
    }

    return sanitizeAppointment(appointment);
};

const updateAppointment = async (id, data, user) => {
    await getAppointmentById(id, user);

    const updateData = {};
    const allowedFields = ['department', 'appointmentDate', 'reason', 'status'];

    if (user.role === 'admin' && data.doctor) {
        await validateDoctorExists(data.doctor);
        updateData.doctor = data.doctor;
    }

    if (user.role === 'admin' && data.patient) {
        await validatePatientExists(data.patient);
        updateData.patient = data.patient;
    }

    allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
        }
    });

    if (updateData.appointmentDate) {
        updateData.appointmentDate = validateAppointmentDate(updateData.appointmentDate);
    }

    if (updateData.status && !APPOINTMENT_STATUSES.includes(updateData.status)) {
        throw new Error('Invalid appointment status');
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No appointment fields provided for update');
    }

    const appointment = await appointmentDao.updateAppointment(id, updateData);
    return sanitizeAppointment(appointment);
};

const deleteAppointment = async (id) => {
    requireObjectId(id, 'appointment id');
    const appointment = await appointmentDao.getAppointmentById(id);

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    await appointmentDao.deleteAppointment(id);
    return sanitizeAppointment(appointment);
};

const appointmentService = {
    createAppointment,
    getAppointments,
    getMyAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
};

export default appointmentService;
