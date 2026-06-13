// This file contains the radiology dashboard interface.

import DashboardLayout from './DashboardLayout';

// Handle cards.
const cards = [
    {
        title: 'Radiology Requests',
        description: 'View, schedule, update, and complete scan reports.',
        to: '/radiology',
    },
    {
        title: 'Billing',
        description: 'Collect radiology payments and review paid radiology bills.',
        to: '/billing',
    },
    {
        title: 'Patient Decisions',
        description: 'Process patient decisions for radiology requests.',
        to: '/billing/patient-decisions',
    },
    {
        title: 'Notifications',
        description: 'View radiology and system notifications.',
        to: '/notifications',
    },
];

// Show the radiology dashboard interface.
const RadiologyDashboard = () => (
    <DashboardLayout
        kicker="Radiology Dashboard"
        description="Manage scan requests, scan scheduling, imaging status, and radiology reports."
        cards={cards}
    />
);

export default RadiologyDashboard;
