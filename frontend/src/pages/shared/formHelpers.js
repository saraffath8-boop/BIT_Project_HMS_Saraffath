export const getPatientId = (patient) => patient.id || patient._id || '';

export const getPatientLabel = (patient) => {
    const patientId = patient.patientId ? ` (${patient.patientId})` : '';
    return `${patient.fullName || patient.name || 'Unnamed Patient'}${patientId}`;
};

export const getOptionalValue = (value) => {
    const cleanValue = typeof value === 'string' ? value.trim() : value;
    return cleanValue || undefined;
};

export const getNumberValue = (value) => Number(value || 0);
