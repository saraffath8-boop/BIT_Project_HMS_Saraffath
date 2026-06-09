import DashboardLayout from './DashboardLayout';

const cards = [
    { title: 'Radiology Requests', description: 'View, schedule, update, and complete scan reports.', to: '/radiology' },
    { title: 'Notifications', description: 'View radiology and system notifications.', to: '/notifications' },
];

const RadiologyDashboard = () => (
    <DashboardLayout
        kicker="Radiology Dashboard"
        description="Manage scan requests, scan scheduling, imaging status, and radiology reports."
        cards={cards}
    />
);

export default RadiologyDashboard;
