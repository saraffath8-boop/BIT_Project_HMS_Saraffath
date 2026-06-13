// This file contains the module page utils interface.

export const formatDateTime = (value) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';
    return date.toLocaleString();
};

// Load person name.
export const getPersonName = (person) => person?.fullName || person?.name || 'Not assigned';
