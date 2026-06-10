import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getQueueEntries } from '../../services/queueService';
import { Link } from 'react-router-dom';

const QueuePage = () => (
    <ModuleListPage
        title="Patient Queue"
        kicker="Queue Management"
        description="Monitor waiting patients, queue priority, department flow, and current service status."
        loadData={getQueueEntries}
        itemsKey="queueEntries"
        createAction={{ to: '/queue/new', label: 'Add Queue Entry', allowedRoles: ['admin', 'nurse', 'receptionist'] }}
        emptyMessage="No queue entries are currently waiting."
        columns={[
            { label: 'Queue Number', key: 'queueNumber' },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Department', key: 'department' },
            { label: 'Priority', key: 'priority' },
            { label: 'Status', key: 'status' },
            { label: 'Created', render: (item) => formatDateTime(item.createdAt) },
            { label: 'Actions', allowedRoles: ['admin', 'nurse', 'receptionist'], render: (item) => <Link className="font-semibold text-cyan-700" to={`/queue/${item.id}/edit`}>Edit</Link> },
        ]}
    />
);

export default QueuePage;
