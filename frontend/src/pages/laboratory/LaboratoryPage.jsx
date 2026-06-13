import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getLabRequests } from '../../services/labRequestService';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LaboratoryPage = () => {
    const { user } = useAuth();
    return <ModuleListPage
        title="Laboratory Requests"
        kicker="Laboratory Management"
        description="View lab test requests, assigned technicians, priorities, and result completion status."
        loadData={getLabRequests}
        itemsKey="labRequests"
        createAction={{ to: '/laboratory/new', label: 'Add Lab Request', allowedRoles: ['admin'] }}
        emptyMessage="No laboratory requests are currently available."
        columns={[
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
            { label: 'Tests', render: (item) => item.tests?.map((test) => test.testName).join(', ') || 'No tests' },
            { label: 'Priority', key: 'priority' },
            { label: 'Status', key: 'status' },
            { label: 'Payment', render: (item) => item.paymentStatus || 'unpaid' },
            { label: 'Completed', render: (item) => formatDateTime(item.completedAt) },
            { label: 'Report', allowedRoles: ['admin', 'doctor', 'lab_technician'], render: (item) => user?.role === 'lab_technician' && item.paymentStatus !== 'paid' && item.status !== 'completed' ? 'Awaiting Payment' : <Link className="font-semibold text-cyan-700" to={`/laboratory/${item.id}/process`}>{item.status === 'completed' ? 'View Results' : 'Process'}</Link> },
        ]}
    />
};

export default LaboratoryPage;
