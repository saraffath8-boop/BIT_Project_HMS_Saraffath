import DashboardLayout from './DashboardLayout';

const cards = [
    {
        title: 'Prescriptions',
        description: 'View and update prescription issuing status.',
        to: '/prescriptions',
    },
    {
        title: 'Billing',
        description: 'Collect prescription payments and review pharmacy bills.',
        to: '/billing',
    },
    {
        title: 'Patient Decisions',
        description: 'Process patient decisions for prescriptions.',
        to: '/billing/patient-decisions',
    },
    {
        title: 'Medicine Inventory',
        description: 'Manage medicine stock, reorder levels, and availability.',
        to: '/pharmacy',
    },
    {
        title: 'Notifications',
        description: 'View pharmacy and system notifications.',
        to: '/notifications',
    },
];

const PharmacistDashboard = () => (
    <DashboardLayout
        kicker="Pharmacist Dashboard"
        description="Manage medicine stock and prescription issuing workflows."
        cards={cards}
    />
);

export default PharmacistDashboard;
