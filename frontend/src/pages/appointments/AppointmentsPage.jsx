import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getAppointments } from '../../services/appointmentService';

const AppointmentsPage = () => (
    <ModuleListPage
        title="Appointments"
        kicker="Appointment Management"
        description="View scheduled visits, assigned clinicians, departments, and appointment status."
        loadData={getAppointments}
        itemsKey="appointments"
        createAction={{ to: '/appointments/new', label: 'Add Appointment', allowedRoles: ['admin'] }}
        emptyMessage="No appointments are currently available."
        columns={[
            { label: 'Date and Time', render: (item) => formatDateTime(item.appointmentDate) },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
            { label: 'Department', key: 'department' },
            { label: 'Status', key: 'status' },
        ]}
    />
);

export default AppointmentsPage;
