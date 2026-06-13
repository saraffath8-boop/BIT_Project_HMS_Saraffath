// This file contains the form helpers interface.

export const getPatientId = (patient) => patient.id || patient._id || '';

// Load patient label.
export const getPatientLabel = (patient) => {
    const patientId = patient.patientId ? ` (${patient.patientId})` : '';
    return `${patient.fullName || patient.name || 'Unnamed Patient'}${patientId}`;
};

// Load optional value.
export const getOptionalValue = (value) => {
    const cleanValue = typeof value === 'string' ? value.trim() : value;
    return cleanValue || undefined;
};

// Load number value.
export const getNumberValue = (value) => Number(value || 0);
