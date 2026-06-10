import mongoose from 'mongoose';
import appointmentDao from '../dao/appointmentDao.js';
import departmentDao from '../dao/departmentDao.js';
import medicalRecordDao from '../dao/medicalRecordDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import { buildAppointmentDate, getDoctorOrThrow } from './doctorService.js';
import medicalRecordService from './medicalRecordService.js';
import prescriptionService from './prescriptionService.js';
import labRequestService from './labRequestService.js';
import radiologyRequestService from './radiologyRequestService.js';
import notificationService from './notificationService.js';

const APPOINTMENT_STATUSES = ['requested', 'pending_confirmation', 'scheduled', 'confirmed', 'paid', 'checked_in', 'in_consultation', 'pending_patient_decision', 'completed', 'cancelled', 'no_show'];

const sanitizeAppointment = (appointment) => ({
    id: appointment._id.toString(),
    patient: appointment.patient,
    doctor: appointment.doctor,
    department: appointment.department,
    departmentRef: appointment.departmentRef,
    appointmentDate: appointment.appointmentDate,
    timeSlot: appointment.timeSlot,
    reason: appointment.reason,
    status: appointment.status,
    paymentStatus: appointment.paymentStatus,
    createdBy: appointment.createdBy,
    requestedBy: appointment.requestedBy,
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

const serviceError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

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
        paymentStatus: data.paymentStatus || 'unpaid',
        createdBy: user.id,
    });

    const populatedAppointment = await appointmentDao.getAppointmentById(appointment._id);
    return sanitizeAppointment(populatedAppointment);
};

const requestAppointment = async (data, user) => {
    const { doctor: doctorId, department: departmentId, appointmentDate, timeSlot } = data;
    if (!doctorId || !departmentId || !appointmentDate || !timeSlot) {
        throw serviceError('doctor, department, appointmentDate, and timeSlot are required');
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) throw serviceError('Invalid department id');
    const [patient, doctor, department] = await Promise.all([
        patientDao.getPatientByUserAccount(user.id),
        getDoctorOrThrow(doctorId),
        departmentDao.getDepartmentById(departmentId),
    ]);

    if (!patient) throw serviceError('No patient profile is linked to this account', 404);
    if (patient.status === 'inactive') throw serviceError('Inactive patient cannot book an appointment', 403);
    if (!department || department.status !== 'active') throw serviceError('Department not found', 404);
    if (!doctor.department || doctor.department._id.toString() !== departmentId) {
        throw serviceError('Selected doctor does not belong to the selected department');
    }

    const availableDays = doctor.availableDays?.length ? doctor.availableDays : [1, 2, 3, 4, 5];
    const availableTimeSlots = doctor.availableTimeSlots?.length ? doctor.availableTimeSlots : ['09:00', '10:00', '11:00', '14:00', '15:00'];
    const selectedDateTime = buildAppointmentDate(appointmentDate, timeSlot);
    if (!availableDays.includes(new Date(`${appointmentDate}T00:00:00`).getDay()) || !availableTimeSlots.includes(timeSlot)) {
        throw serviceError('Doctor is not available for this time slot', 409);
    }

    const conflict = await appointmentDao.findDoctorSlotConflict(doctorId, selectedDateTime);
    if (conflict) throw serviceError('Doctor is not available for this time slot', 409);

    try {
        const appointment = await appointmentDao.createAppointment({
            patient: patient._id,
            doctor: doctorId,
            department: department.name,
            departmentRef: department._id,
            appointmentDate: selectedDateTime,
            timeSlot,
            reason: data.reason?.trim() || data.notes?.trim() || '',
            status: 'requested',
            paymentStatus: 'unpaid',
            createdBy: user.id,
            requestedBy: user.id,
        });
        return sanitizeAppointment(await appointmentDao.getAppointmentById(appointment._id));
    } catch (error) {
        if (error.code === 11000) throw serviceError('Doctor is not available for this time slot', 409);
        throw error;
    }
};

const createConsultation = async (appointmentId, data, user) => {
    const appointment = await getAppointmentById(appointmentId, user);
    if (!['scheduled', 'confirmed', 'paid', 'checked_in', 'in_consultation'].includes(appointment.status)) {
        throw serviceError('Appointment is not ready for consultation');
    }
    const existingRecord = await medicalRecordDao.getMedicalRecordByAppointment(appointmentId);
    if (existingRecord) throw serviceError('A medical record already exists for this appointment', 409);
    const patientId = appointment.patient?._id?.toString() || appointment.patient?.id;
    if (!patientId) throw serviceError('Appointment patient not found', 404);
    if (!data.medicalRecord?.diagnosis?.trim()) throw serviceError('Medical record diagnosis is required');
    if (data.prescription?.items?.some((item) => !item.medicineName?.trim() || !item.dosage?.trim() || !item.frequency?.trim() || !item.duration?.trim())) {
        throw serviceError('Every prescription item requires medicine name, dosage, frequency, and duration');
    }
    if (data.labRequest?.tests?.some((test) => !test.testName?.trim())) {
        throw serviceError('Every lab request requires a test name');
    }

    const medicalRecord = await medicalRecordService.createMedicalRecord({
        ...data.medicalRecord,
        patient: patientId,
        appointment: appointmentId,
        status: 'completed',
    }, user);

    const requests = {};
    if (data.prescription?.items?.length) {
        requests.prescription = await prescriptionService.createPrescription({
            ...data.prescription,
            patient: patientId,
            medicalRecord: medicalRecord.id,
            patientDecisionStatus: 'pending_patient_decision',
        }, user);
    }
    if (data.labRequest?.tests?.length) {
        requests.labRequest = await labRequestService.createLabRequest({
            ...data.labRequest,
            patient: patientId,
            medicalRecord: medicalRecord.id,
            patientDecisionStatus: 'pending_patient_decision',
        }, user);
    }
    if (data.radiologyRequest?.scanType?.trim()) {
        requests.radiologyRequest = await radiologyRequestService.createRadiologyRequest({
            ...data.radiologyRequest,
            patient: patientId,
            medicalRecord: medicalRecord.id,
            patientDecisionStatus: 'pending_patient_decision',
        }, user);
    }

    const requestNames = Object.keys(requests);
    const status = requestNames.length ? 'pending_patient_decision' : 'completed';
    const updatedAppointment = sanitizeAppointment(await appointmentDao.updateAppointment(appointmentId, { status }));

    if (requestNames.length) {
        const receptionists = await userDao.getUsers({ role: 'receptionist', isActive: true });
        await Promise.all(receptionists.map((receptionist) => notificationService.createNotification({
            recipient: receptionist._id.toString(),
            title: 'Patient decision required',
            message: `${appointment.patient.fullName} has ${requestNames.join(', ')} request(s) awaiting a patient decision.`,
            type: 'appointment',
            relatedPatient: patientId,
            sendSms: false,
        }, user)));
    }

    return { appointment: updatedAppointment, medicalRecord, requests };
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
    requestAppointment,
    createConsultation,
    getAppointments,
    getMyAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
};

export default appointmentService;
