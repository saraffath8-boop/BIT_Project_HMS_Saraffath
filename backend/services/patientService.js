import mongoose from 'mongoose';

import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import { PATIENT_NAME_REGEX, SRI_LANKAN_PHONE_REGEX } from '../utils/userValidation.js';



const ADMIN_UPDATE_FIELDS = [

    'fullName',

    'dateOfBirth',

    'gender',

    'phone',

    'address',

    'emergencyContactName',

    'emergencyContactPhone',

    'bloodGroup',

    'allergies',

    'medicalNotes',

    'status',

];



const NURSE_UPDATE_FIELDS = ['phone', 'address', 'emergencyContactName', 'emergencyContactPhone', 'allergies', 'medicalNotes', 'status'];



const sanitizePatient = (patient) => ({

    id: patient._id.toString(),

    patientId: patient.patientId,

    fullName: patient.fullName,

    dateOfBirth: patient.dateOfBirth,

    gender: patient.gender,

    phone: patient.phone,

    address: patient.address,

    emergencyContactName: patient.emergencyContactName,

    emergencyContactPhone: patient.emergencyContactPhone,

    bloodGroup: patient.bloodGroup,

    allergies: patient.allergies,

    medicalNotes: patient.medicalNotes,

    status: patient.status,

    createdBy: patient.createdBy,

    userAccount: patient.userAccount
        ? {
              id: patient.userAccount._id.toString(),
              name: patient.userAccount.name,
              email: patient.userAccount.email,
              role: patient.userAccount.role,
              isActive: patient.userAccount.isActive,
          }
        : null,

    createdAt: patient.createdAt,

    updatedAt: patient.updatedAt,

});



const toCleanString = (value) => (typeof value === 'string' ? value.trim() : value);



const buildPatientPayload = (data) => ({

    fullName: toCleanString(data.fullName),

    dateOfBirth: data.dateOfBirth,

    gender: toCleanString(data.gender)?.toLowerCase(),

    phone: toCleanString(data.phone),

    address: toCleanString(data.address),

    emergencyContactName: toCleanString(data.emergencyContactName),

    emergencyContactPhone: toCleanString(data.emergencyContactPhone),

    bloodGroup: toCleanString(data.bloodGroup)?.toLowerCase() === 'unknown' ? 'unknown' : data.bloodGroup,

    allergies: toCleanString(data.allergies) || '',

    medicalNotes: toCleanString(data.medicalNotes) || '',

    status: toCleanString(data.status)?.toLowerCase() || 'active',

});



const validateRequiredPatientFields = (payload) => {

    const requiredFields = [

        'fullName',

        'dateOfBirth',

        'gender',

        'phone',

        'address',

        'emergencyContactName',

        'emergencyContactPhone',

    ];



    const missingField = requiredFields.find((field) => !payload[field]);

    if (missingField) {

        throw new Error(`${missingField} is required`);

    }



    const dateOfBirth = new Date(payload.dateOfBirth);

    if (Number.isNaN(dateOfBirth.getTime())) {

        throw new Error('dateOfBirth must be a valid date');

    }



    if (dateOfBirth > new Date()) {

        throw new Error('dateOfBirth cannot be in the future');

    }

    if (!PATIENT_NAME_REGEX.test(payload.fullName)) {
        throw new Error('Full name contains invalid characters');
    }

    if (!PATIENT_NAME_REGEX.test(payload.emergencyContactName)) {
        throw new Error('Emergency contact name contains invalid characters');
    }

    if (!SRI_LANKAN_PHONE_REGEX.test(payload.phone)) {
        throw new Error('Phone number must be a valid Sri Lankan 10-digit number starting with 0');
    }

    if (!SRI_LANKAN_PHONE_REGEX.test(payload.emergencyContactPhone)) {
        throw new Error('Emergency contact phone must be a valid Sri Lankan 10-digit number starting with 0');
    }

};



const pickAllowedFields = (data, allowedFields) => {

    const updateData = {};



    allowedFields.forEach((field) => {

        if (Object.prototype.hasOwnProperty.call(data, field)) {

            const value = toCleanString(data[field]);
            updateData[field] = ['gender', 'status'].includes(field)
                ? value?.toLowerCase()
                : field === 'bloodGroup' && value?.toLowerCase() === 'unknown'
                    ? 'unknown'
                    : value;

        }

    });



    return updateData;

};



const getPatientOrThrow = async (id) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {

        throw new Error('Invalid patient id');

    }



    const patient = await patientDao.getPatientByMongoId(id);

    if (!patient) {

        throw new Error('Patient not found');

    }



    return patient;

};



const createPatient = async (patientData, createdByUserId) => {

    const payload = buildPatientPayload(patientData);

    validateRequiredPatientFields(payload);



    const patientId = await patientDao.getNextPatientId();

    const patient = await patientDao.createPatient({

        ...payload,

        patientId,

        createdBy: createdByUserId,

    });



    return sanitizePatient(patient);

};



const getPatients = async ({ search, page, limit }) => {

    const safePage = Math.max(Number(page) || 1, 1);

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);



    const result = await patientDao.getPatients({

        search: toCleanString(search) || '',

        page: safePage,

        limit: safeLimit,

    });



    return {

        ...result,

        patients: result.patients.map(sanitizePatient),

    };

};



const getPatientById = async (id) => {

    const patient = await getPatientOrThrow(id);

    return sanitizePatient(patient);

};



const getMyPatientProfile = async (userId) => {

    const patient = await patientDao.getPatientByUserAccountId(userId);

    if (!patient) {

        throw new Error('No patient profile is linked to this account');

    }

    return sanitizePatient(patient);

};



const updatePatient = async (id, updateData, userRole) => {

    await getPatientOrThrow(id);



    const allowedFields = userRole === 'nurse' ? NURSE_UPDATE_FIELDS : ADMIN_UPDATE_FIELDS;

    const payload = pickAllowedFields(updateData, allowedFields);



    if (Object.keys(payload).length === 0) {

        throw new Error('No allowed patient fields provided for update');

    }



    if (payload.dateOfBirth) {

        const dateOfBirth = new Date(payload.dateOfBirth);

        if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > new Date()) {

            throw new Error('dateOfBirth must be a valid date and cannot be in the future');

        }

    }

    if (payload.fullName && !PATIENT_NAME_REGEX.test(payload.fullName)) {
        throw new Error('Full name contains invalid characters');
    }

    if (payload.emergencyContactName && !PATIENT_NAME_REGEX.test(payload.emergencyContactName)) {
        throw new Error('Emergency contact name contains invalid characters');
    }

    if (payload.phone && !SRI_LANKAN_PHONE_REGEX.test(payload.phone)) {
        throw new Error('Phone number must be a valid Sri Lankan 10-digit number starting with 0');
    }

    if (payload.emergencyContactPhone && !SRI_LANKAN_PHONE_REGEX.test(payload.emergencyContactPhone)) {
        throw new Error('Emergency contact phone must be a valid Sri Lankan 10-digit number starting with 0');
    }



    const patient = await patientDao.updatePatient(id, payload);

    return sanitizePatient(patient);

};



const linkPatientUser = async (id, userId) => {

    const patient = await getPatientOrThrow(id);

    if (!mongoose.Types.ObjectId.isValid(userId)) {

        throw new Error('Invalid user id');

    }

    const user = await userDao.getUserById(userId);

    if (!user) {

        throw new Error('User not found');

    }

    if (user.role !== 'patient') {

        throw new Error('User account must have patient role');

    }

    const linkedPatient = await patientDao.getPatientByUserAccount(userId);

    if (linkedPatient && linkedPatient._id.toString() !== patient._id.toString()) {

        throw new Error('Patient user account is already linked to another patient record');

    }

    const updatedPatient = await patientDao.updatePatient(patient._id, { userAccount: userId });

    return sanitizePatient(updatedPatient);

};



const deletePatient = async (id) => {

    const patient = await getPatientOrThrow(id);

    await patientDao.deletePatient(patient._id);



    return sanitizePatient(patient);

};



const patientService = {

    createPatient,

    getPatients,

    getPatientById,

    getMyPatientProfile,

    updatePatient,

    linkPatientUser,

    deletePatient,

};



export default patientService;
