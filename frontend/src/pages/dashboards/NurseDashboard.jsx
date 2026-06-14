// This file contains the nurse dashboard interface.

import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/AuthContext';

// Handle cards.
const cards = [
    {
        title: 'Patients',
        description: 'View patients and update permitted clinical notes.',
        to: '/patients',
    },
    {
        title: 'Queue',
        description: 'Manage patient queue entries and workflow status.',
        to: '/queue',
    },
    {
        title: 'Appointments',
        description: 'View appointment flow for patient coordination.',
        to: '/appointments',
    },
    {
        title: 'Doctor Availability',
        description: 'Create and update doctor time slots for today and tomorrow.',
        to: '/doctor-availability',
    },
    {
        title: 'Medical Records',
        description: 'Review patient records for care support.',
        to: '/medical-records',
    },
    {
        title: 'Laboratory',
        description: 'View laboratory request status for patient support.',
        to: '/laboratory',
    },
    {
        title: 'Radiology',
        description: 'View radiology request status for patient support.',
        to: '/radiology',
    },
    {
        title: 'Notifications',
        description: 'View internal care coordination notifications.',
        to: '/notifications',
    },
    {
        title: 'Billing',
        description: 'View patient payment status and outstanding balances.',
        to: '/billing',
    },
];

// Handle receptionist cards.
const receptionistCards = cards.filter((card) =>
    ['Patients', 'Queue', 'Appointments', 'Doctor Availability', 'Notifications', 'Billing'].includes(
        card.title,
    ),
);

// Show the nurse dashboard interface.
const NurseDashboard = () => {
    const { user } = useAuth();
    const isReceptionist = user?.role === 'receptionist';
    return (
        <DashboardLayout
            kicker={isReceptionist ? 'Receptionist Dashboard' : 'Nurse Dashboard'}
            description={
                isReceptionist
                    ? 'Coordinate patient arrivals, appointments, queues, and front-desk communication.'
                    : 'Support patient care with queue management, patient records, appointment visibility, and basic workflow updates.'
            }
            cards={isReceptionist ? receptionistCards : cards}
        />
    );
};

export default NurseDashboard;
