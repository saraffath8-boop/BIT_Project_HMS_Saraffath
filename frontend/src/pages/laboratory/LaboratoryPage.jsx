import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getLabRequests } from '../../services/labRequestService';

const LaboratoryPage = () => (
    <ModuleListPage
        title="Laboratory Requests"
        kicker="Laboratory Management"
        description="View lab test requests, assigned technicians, priorities, and result completion status."
        loadData={getLabRequests}
        itemsKey="labRequests"
        createAction={{ to: '/laboratory/new', label: 'Add Lab Request', allowedRoles: ['admin', 'doctor'] }}
        emptyMessage="No laboratory requests are currently available."
        columns={[
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
            { label: 'Tests', render: (item) => `${item.tests?.length || 0} test(s)` },
            { label: 'Priority', key: 'priority' },
            { label: 'Status', key: 'status' },
            { label: 'Completed', render: (item) => formatDateTime(item.completedAt) },
        ]}
    />
);

export default LaboratoryPage;
