export const formatDateTime = (value) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';
    return date.toLocaleString();
};

export const getPersonName = (person) => person?.fullName || person?.name || 'Not assigned';
