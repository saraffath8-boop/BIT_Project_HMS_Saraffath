import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const cards = [
    { title: 'Patients', description: 'View patients and update permitted clinical notes.', to: '/patients' },
    { title: 'Queue', description: 'Manage patient queue entries and workflow status.', to: '/queue' },
    { title: 'Appointments', description: 'View appointment flow for patient coordination.', to: '/appointments' },
    { title: 'Medical Records', description: 'Review patient records for care support.', to: '/medical-records' },
    { title: 'Laboratory', description: 'View laboratory request status for patient support.', to: '/laboratory' },
    { title: 'Radiology', description: 'View radiology request status for patient support.', to: '/radiology' },
    { title: 'Notifications', description: 'View internal care coordination notifications.', to: '/notifications' },
    { title: 'Billing', description: 'View patient payment status and outstanding balances.', to: '/billing' },
    { title: 'Patient Decisions', description: 'Select patient-approved requests, collect payment, and route paid work.', to: '/billing/patient-decisions' },
];

const receptionistCards = cards.filter((card) => ['Patients', 'Queue', 'Appointments', 'Notifications', 'Billing', 'Patient Decisions'].includes(card.title));

const NurseDashboard = () => {
    const { user } = useAuth();
    const isReceptionist = user?.role === 'receptionist';
    return <DashboardLayout
        kicker={isReceptionist ? 'Receptionist Dashboard' : 'Nurse Dashboard'}
        description={isReceptionist ? 'Coordinate patient arrivals, appointments, queues, and front-desk communication.' : 'Support patient care with queue management, patient records, appointment visibility, and basic workflow updates.'}
        cards={isReceptionist ? receptionistCards : cards}
    />;
};

export default NurseDashboard;
