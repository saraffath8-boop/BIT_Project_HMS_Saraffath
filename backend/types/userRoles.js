// This file contains the user roles shared application logic.

export const USER_ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    PATIENT: 'patient',
    PHARMACIST: 'pharmacist',
    RECEPTIONIST: 'receptionist',
    LAB_TECHNICIAN: 'lab_technician',
    RADIOLOGIST: 'radiologist',
};

// Store the all user roles setting used by this file.
export const ALL_USER_ROLES = Object.values(USER_ROLES);

// Store the admin creatable roles setting used by this file.
export const ADMIN_CREATABLE_ROLES = [
    USER_ROLES.ADMIN,
    USER_ROLES.DOCTOR,
    USER_ROLES.NURSE,
    USER_ROLES.PHARMACIST,
    USER_ROLES.RECEPTIONIST,
    USER_ROLES.LAB_TECHNICIAN,
    USER_ROLES.RADIOLOGIST,
];
