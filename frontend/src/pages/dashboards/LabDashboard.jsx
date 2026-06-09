import DashboardLayout from './DashboardLayout';

const cards = [
    { title: 'Laboratory Requests', description: 'View, process, and update laboratory requests and results.', to: '/laboratory' },
    { title: 'Notifications', description: 'View laboratory and system notifications.', to: '/notifications' },
];

const LabDashboard = () => (
    <DashboardLayout
        kicker="Laboratory Dashboard"
        description="Process laboratory requests, update test progress, and complete lab results."
        cards={cards}
    />
);

export default LabDashboard;
