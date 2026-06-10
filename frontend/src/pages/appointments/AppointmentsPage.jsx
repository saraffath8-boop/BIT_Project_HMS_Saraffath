import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getAppointments } from '../../services/appointmentService';
import { Link } from 'react-router-dom';

const consultationStatuses = ['scheduled', 'confirmed', 'paid', 'checked_in', 'in_consultation'];

const AppointmentsPage = () => (
    <ModuleListPage
        title="Appointments"
        kicker="Appointment Management"
        description="View scheduled visits, assigned clinicians, departments, and appointment status."
        loadData={getAppointments}
        itemsKey="appointments"
        createAction={{ to: '/appointments/new', label: 'Add Appointment', allowedRoles: ['admin', 'receptionist'] }}
        emptyMessage="No appointments are currently available."
        columns={[
            { label: 'Date and Time', render: (item) => formatDateTime(item.appointmentDate) },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
            { label: 'Department', key: 'department' },
            { label: 'Status', key: 'status' },
            { label: 'Payment', key: 'paymentStatus' },
            { label: 'Consult', allowedRoles: ['doctor'], render: (item) => consultationStatuses.includes(item.status) ? <Link className="font-semibold text-cyan-700" to={`/appointments/${item.id}/consultation`}>Open Consultation</Link> : <span className="text-slate-400">Not ready</span> },
            { label: 'Actions', allowedRoles: ['admin', 'receptionist'], render: (item) => <Link className="font-semibold text-cyan-700" to={`/appointments/${item.id}/edit`}>Edit</Link> },
        ]}
    />
);

export default AppointmentsPage;
