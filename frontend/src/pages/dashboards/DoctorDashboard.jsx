import DashboardLayout from './DashboardLayout';

const cards = [
    { title: 'Appointments', description: 'View assigned appointment schedules and clinical visit flow.', to: '/appointments' },
    { title: 'Patients', description: 'View patient profiles and clinical history.', to: '/patients' },
    { title: 'Medical Records', description: 'Review and manage consultation notes and diagnoses.', to: '/medical-records' },
    { title: 'Prescriptions', description: 'Create and review patient prescriptions.', to: '/prescriptions' },
    { title: 'Laboratory Requests', description: 'Request and review laboratory tests.', to: '/laboratory' },
    { title: 'Radiology Requests', description: 'Request and review scan reports.', to: '/radiology' },
    { title: 'Medicine Reference', description: 'View available medicine stock while prescribing.', to: '/pharmacy' },
    { title: 'Notifications', description: 'View clinical and system notifications.', to: '/notifications' },
];

const DoctorDashboard = () => (
    <DashboardLayout
        kicker="Doctor Dashboard"
        description="Access patient care workflows, appointments, records, prescriptions, lab requests, and radiology requests."
        cards={cards}
    />
);

export default DoctorDashboard;
