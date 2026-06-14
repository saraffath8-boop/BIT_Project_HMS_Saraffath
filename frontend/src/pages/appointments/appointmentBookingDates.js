const HOSPITAL_TIME_ZONE = 'Asia/Colombo';

const formatHospitalDate = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: HOSPITAL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};

export const getAppointmentDateOptions = () => {
    const todayValue = formatHospitalDate(new Date());
    const tomorrow = new Date(`${todayValue}T00:00:00+05:30`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    return [
        { value: todayValue, label: 'Today' },
        { value: formatHospitalDate(tomorrow), label: 'Tomorrow' },
    ];
};
