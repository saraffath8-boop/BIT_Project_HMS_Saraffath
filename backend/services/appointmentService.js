// This file contains the appointment service business workflow.

import mongoose from 'mongoose';
import appointmentDao from '../dao/appointmentDao.js';
import departmentDao from '../dao/departmentDao.js';
import medicalRecordDao from '../dao/medicalRecordDao.js';
import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import {
    buildAppointmentDate,
    formatHospitalDate,
    getAppointmentDate,
    getDoctorAvailability,
    getDoctorOrThrow,
} from './doctorService.js';
import medicalRecordService from './medicalRecordService.js';
import prescriptionService from './prescriptionService.js';
import labRequestService from './labRequestService.js';
import radiologyRequestService from './radiologyRequestService.js';
import billService from './billService.js';
import { PATIENT_NAME_REGEX, SRI_LANKAN_PHONE_REGEX } from '../utils/userValidation.js';

// Store the appointment statuses setting used by this file.
const APPOINTMENT_STATUSES = [
    'requested',
    'pending_confirmation',
    'scheduled',
    'confirmed',
    'paid',
    'checked_in',
    'in_consultation',
    'completed',
    'cancelled',
    'no_show',
];

// Prepare appointment.
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
    consultationFee: appointment.doctor?.consultationFee || 0,
    confirmedAt: appointment.confirmedAt,
    createdBy: appointment.createdBy,
    requestedBy: appointment.requestedBy,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
});

// Validate object id.
const requireObjectId = (id, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

// Validate appointment date.
const validateAppointmentDate = (appointmentDate) => {
    const date = new Date(appointmentDate);
    if (Number.isNaN(date.getTime())) {
        throw new Error('appointmentDate must be a valid date');
    }
    getAppointmentDate(formatHospitalDate(date));
    return date;
};

// Validate patient exists.
const validatePatientExists = async (patientId) => {
    requireObjectId(patientId, 'patient id');
    const patient = await patientDao.getPatientByMongoId(patientId);
    if (!patient) {
        throw new Error('Patient not found');
    }
};

// Validate doctor exists.
const validateDoctorExists = async (doctorId) => {
    requireObjectId(doctorId, 'doctor id');
    const doctor = await userDao.getUserById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
        throw new Error('Doctor not found');
    }
};

// Create the service error.
const serviceError = (message, statusCode = 400) =>
    Object.assign(new Error(message), { statusCode });

// Prepare appointment query.
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

// Create appointment.
const createAppointment = async (data, user) => {
    if (user.role === 'receptionist') {
        return createReceptionistAppointmentRequest(data, user);
    }

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

// Create requested appointment.
const createRequestedAppointment = async ({
    patient,
    doctor,
    department,
    appointmentDate,
    timeSlot,
    reason,
    user = null,
}) => {
    if (patient.status === 'inactive')
        throw serviceError('Inactive patient cannot book an appointment', 403);
    if (!department || department.status !== 'active')
        throw serviceError('Department not found', 404);
    if (!doctor.department || doctor.department._id.toString() !== department._id.toString()) {
        throw serviceError('Selected doctor does not belong to the selected department');
    }

    const selectedDateTime = buildAppointmentDate(appointmentDate, timeSlot);
    const availability = await getDoctorAvailability(doctor._id.toString(), appointmentDate);
    const selectedSlot = availability.slots.find((slot) => slot.timeSlot === timeSlot);
    if (!selectedSlot?.available) {
        throw serviceError('Doctor is not available for this time slot', 409);
    }

    try {
        const appointment = await appointmentDao.createAppointment({
            patient: patient._id,
            doctor: doctor._id,
            department: department.name,
            departmentRef: department._id,
            appointmentDate: selectedDateTime,
            timeSlot,
            reason: reason?.trim() || '',
            status: 'requested',
            paymentStatus: 'unpaid',
            createdBy: user?.id || null,
            requestedBy: user?.id || null,
        });
        return sanitizeAppointment(await appointmentDao.getAppointmentById(appointment._id));
    } catch (error) {
        throw error;
    }
};

// Load or create no account patient.
const getOrCreateNoAccountPatient = async (details = {}, user = null) => {
    const fullName = details.fullName?.trim();
    const phone = details.phone?.trim();
    const dateOfBirth = details.dateOfBirth;
    const gender = details.gender?.trim().toLowerCase();
    const address = details.address?.trim();
    const emergencyContactName = details.emergencyContactName?.trim();
    const emergencyContactPhone = details.emergencyContactPhone?.trim();

    if (
        !fullName ||
        !phone ||
        !dateOfBirth ||
        !gender ||
        !address ||
        !emergencyContactName ||
        !emergencyContactPhone
    ) {
        throw serviceError(
            'Full name, phone, date of birth, gender, address, and emergency contact details are required',
        );
    }
    if (!PATIENT_NAME_REGEX.test(fullName) || !PATIENT_NAME_REGEX.test(emergencyContactName)) {
        throw serviceError('Patient and emergency contact names contain invalid characters');
    }
    if (
        !SRI_LANKAN_PHONE_REGEX.test(phone) ||
        !SRI_LANKAN_PHONE_REGEX.test(emergencyContactPhone)
    ) {
        throw serviceError(
            'Phone numbers must be valid Sri Lankan 10-digit numbers starting with 0',
        );
    }
    if (!['male', 'female', 'other'].includes(gender)) throw serviceError('Invalid gender');

    const birthDate = validateAppointmentDate(dateOfBirth);
    if (birthDate > new Date()) throw serviceError('Date of birth cannot be in the future');

    const existingPatient = await patientDao.getPatientByPhone(phone);
    if (existingPatient) return existingPatient;

    return patientDao.createPatient({
        patientId: await patientDao.getNextPatientId(),
        fullName,
        phone,
        dateOfBirth: birthDate,
        gender,
        address,
        emergencyContactName,
        emergencyContactPhone,
        createdBy: user?.id || null,
        userAccount: null,
        medicalNotes:
            user?.role === 'receptionist'
                ? 'Patient profile created by receptionist during appointment booking.'
                : 'Patient profile created from public appointment booking.',
    });
};

// Handle request public appointment.
const requestPublicAppointment = async (data) => {
    const { doctor: doctorId, department: departmentId, appointmentDate, timeSlot } = data;
    if (!doctorId || !departmentId || !appointmentDate || !timeSlot) {
        throw serviceError('doctor, department, appointmentDate, and timeSlot are required');
    }
    if (!mongoose.Types.ObjectId.isValid(departmentId)) throw serviceError('Invalid department id');

    const [patient, doctor, department] = await Promise.all([
        getOrCreateNoAccountPatient(data.patient),
        getDoctorOrThrow(doctorId),
        departmentDao.getDepartmentById(departmentId),
    ]);

    return createRequestedAppointment({
        patient,
        doctor,
        department,
        appointmentDate,
        timeSlot,
        reason: data.reason || data.notes,
    });
};

// Create receptionist appointment request.
const createReceptionistAppointmentRequest = async (data, user) => {
    const {
        patient: patientInput,
        doctor: doctorId,
        department: departmentId,
        appointmentDate,
        timeSlot,
    } = data;
    if (!patientInput || !doctorId || !departmentId || !appointmentDate || !timeSlot) {
        throw serviceError(
            'patient, doctor, department, appointmentDate, and timeSlot are required',
        );
    }
    if (!mongoose.Types.ObjectId.isValid(departmentId)) throw serviceError('Invalid department id');
    if (typeof patientInput === 'string') requireObjectId(patientInput, 'patient id');

    const [patient, doctor, department] = await Promise.all([
        typeof patientInput === 'string'
            ? patientDao.getPatientByMongoId(patientInput)
            : getOrCreateNoAccountPatient(patientInput, user),
        getDoctorOrThrow(doctorId),
        departmentDao.getDepartmentById(departmentId),
    ]);
    if (!patient) throw serviceError('Patient not found', 404);

    return createRequestedAppointment({
        patient,
        doctor,
        department,
        appointmentDate,
        timeSlot,
        reason: data.reason || data.notes,
        user,
    });
};

// Handle request appointment.
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
    return createRequestedAppointment({
        patient,
        doctor,
        department,
        appointmentDate,
        timeSlot,
        reason: data.reason || data.notes,
        user,
    });
};

// Create consultation.
const createConsultation = async (appointmentId, data, user) => {
    const appointment = await getAppointmentById(appointmentId, user);
    if (appointment.status !== 'in_consultation') {
        throw serviceError(
            'Patient must be marked as checked before creating the diagnosis report',
        );
    }
    const existingRecord = await medicalRecordDao.getMedicalRecordByAppointment(appointmentId);
    if (existingRecord)
        throw serviceError('A medical record already exists for this appointment', 409);
    const patientId = appointment.patient?._id?.toString() || appointment.patient?.id;
    if (!patientId) throw serviceError('Appointment patient not found', 404);
    if (!data.medicalRecord?.diagnosis?.trim())
        throw serviceError('Medical record diagnosis is required');
    if (
        data.prescription?.items?.some(
            (item) =>
                !item.medicineName?.trim() ||
                !item.dosage?.trim() ||
                !item.frequency?.trim() ||
                !item.duration?.trim(),
        )
    ) {
        throw serviceError(
            'Every prescription item requires medicine name, dosage, frequency, and duration',
        );
    }
    if (data.labRequest?.tests?.some((test) => !test.testName?.trim())) {
        throw serviceError('Every lab request requires a test name');
    }

    const medicalRecord = await medicalRecordService.createMedicalRecord(
        {
            ...data.medicalRecord,
            patient: patientId,
            appointment: appointmentId,
            status: 'completed',
        },
        user,
    );

    const requests = {};
    if (data.prescription?.items?.length) {
        requests.prescription = await prescriptionService.createPrescription(
            {
                ...data.prescription,
                patient: patientId,
                medicalRecord: medicalRecord.id,
            },
            user,
        );
    }
    if (data.labRequest?.tests?.length) {
        requests.labRequest = await labRequestService.createLabRequest(
            {
                ...data.labRequest,
                patient: patientId,
                medicalRecord: medicalRecord.id,
            },
            user,
        );
    }
    if (data.radiologyRequest?.scanType?.trim()) {
        requests.radiologyRequest = await radiologyRequestService.createRadiologyRequest(
            {
                ...data.radiologyRequest,
                patient: patientId,
                medicalRecord: medicalRecord.id,
            },
            user,
        );
    }

    const updatedAppointment = sanitizeAppointment(
        await appointmentDao.updateAppointment(appointmentId, { status: 'completed' }),
    );
    return { appointment: updatedAppointment, medicalRecord, requests };
};

// Load appointments.
const getAppointments = async (queryParams, user) => {
    const query = buildAppointmentQuery(queryParams, user);
    const appointments = await appointmentDao.getAppointments(query);
    return appointments.map(sanitizeAppointment);
};

// Load receptionist pending appointments.
const getReceptionistPendingAppointments = async () => {
    const appointments = await appointmentDao.getAppointments({
        status: { $in: ['requested', 'pending_confirmation'] },
    });
    return appointments.map(sanitizeAppointment);
};

// Load receptionist confirmed queue.
const getReceptionistConfirmedQueue = async (user = {}) => {
    // Older paid appointments used "paid" as the clinical status. Keep them
    // visible until they move into consultation, while new payments remain confirmed.
    const statuses =
        user.role === 'doctor' ? ['confirmed', 'paid', 'in_consultation'] : ['confirmed', 'paid'];
    const [appointments, reportedAppointmentIds] = await Promise.all([
        appointmentDao.getAppointments({ status: { $in: statuses } }),
        medicalRecordDao.getAppointmentIdsWithRecords(),
    ]);
    // Handle reported ids.
    const reportedIds = new Set(reportedAppointmentIds.map((id) => id.toString()));
    const eligibleAppointments = appointments.filter(
        (appointment) => !reportedIds.has(appointment._id.toString()),
    );
    const roleAppointments =
        user.role === 'doctor'
            ? eligibleAppointments.filter(
                  (appointment) => appointment.doctor?._id.toString() === user.id,
              )
            : eligibleAppointments;
    return roleAppointments
        .sort((first, second) => new Date(first.appointmentDate) - new Date(second.appointmentDate))
        .map((appointment, index) => ({
            ...sanitizeAppointment(appointment),
            queueNumber: index + 1,
        }));
};

// Update appointment checked.
const markAppointmentChecked = async (id, user) => {
    const appointment = await getAppointmentById(id, user);
    if (!['confirmed', 'paid'].includes(appointment.status)) {
        throw serviceError('Only confirmed appointments can be marked as checked', 409);
    }
    return sanitizeAppointment(
        await appointmentDao.updateAppointment(id, { status: 'in_consultation' }),
    );
};

// Update appointment.
const confirmAppointment = async (id, user) => {
    const appointment = await getAppointmentById(id, user);
    if (!['requested', 'pending_confirmation'].includes(appointment.status)) {
        throw serviceError('Only pending appointment requests can be confirmed', 409);
    }

    const confirmedAppointment = await appointmentDao.updateAppointment(id, {
        status: 'confirmed',
        confirmedAt: new Date(),
    });
    return sanitizeAppointment(confirmedAppointment);
};

// Update appointment paid.
const markAppointmentPaid = async (id, user) => {
    const appointment = await appointmentDao.getAppointmentById(id);
    if (!appointment) throw serviceError('Appointment not found', 404);
    if (appointment.status !== 'confirmed' || appointment.paymentStatus === 'paid') {
        throw serviceError('Only confirmed unpaid appointments can be marked as paid', 409);
    }

    const bill = await billService.createPaidAppointmentBill(appointment, user);
    const paidAppointment = await appointmentDao.updateAppointment(id, {
        status: 'confirmed',
        paymentStatus: 'paid',
        confirmedAt: appointment.confirmedAt || appointment.updatedAt || appointment.createdAt,
    });
    return { appointment: sanitizeAppointment(paidAppointment), bill };
};

// Load my appointments.
const getMyAppointments = async (userId) => {
    const patient = await patientDao.getPatientByUserAccount(userId);

    if (!patient) {
        throw new Error('No patient profile is linked to this account');
    }

    const appointments = await appointmentDao.getAppointments({ patient: patient._id });
    return appointments.map(sanitizeAppointment);
};

// Load appointment by id.
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

// Update appointment.
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

// Remove appointment.
const deleteAppointment = async (id) => {
    requireObjectId(id, 'appointment id');
    const appointment = await appointmentDao.getAppointmentById(id);

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    await appointmentDao.deleteAppointment(id);
    return sanitizeAppointment(appointment);
};

// Handle appointment service.
const appointmentService = {
    createAppointment,
    requestAppointment,
    requestPublicAppointment,
    createConsultation,
    getAppointments,
    getReceptionistPendingAppointments,
    getReceptionistConfirmedQueue,
    markAppointmentChecked,
    confirmAppointment,
    markAppointmentPaid,
    getMyAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
};

export default appointmentService;
