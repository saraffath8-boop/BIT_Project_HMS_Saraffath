import DashboardLayout from './DashboardLayout';

const cards = [
    {
        title: 'Laboratory Requests',
        description: 'View, process, and update laboratory requests and results.',
        to: '/laboratory',
    },
    {
        title: 'Billing',
        description: 'Collect laboratory payments and review paid laboratory bills.',
        to: '/billing',
    },
    {
        title: 'Patient Decisions',
        description: 'Process patient decisions for laboratory requests.',
        to: '/billing/patient-decisions',
    },
    {
        title: 'Notifications',
        description: 'View laboratory and system notifications.',
        to: '/notifications',
    },
];

const LabDashboard = () => (
    <DashboardLayout
        kicker="Laboratory Dashboard"
        description="Process laboratory requests, update test progress, and complete lab results."
        cards={cards}
    />
);

export default LabDashboard;
