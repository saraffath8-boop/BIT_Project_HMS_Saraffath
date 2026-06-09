import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getQueueEntries } from '../../services/queueService';

const QueuePage = () => (
    <ModuleListPage
        title="Patient Queue"
        kicker="Queue Management"
        description="Monitor waiting patients, queue priority, department flow, and current service status."
        loadData={getQueueEntries}
        itemsKey="queueEntries"
        createAction={{ to: '/queue/new', label: 'Add Queue Entry', allowedRoles: ['admin', 'nurse'] }}
        emptyMessage="No queue entries are currently waiting."
        columns={[
            { label: 'Queue Number', key: 'queueNumber' },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Department', key: 'department' },
            { label: 'Priority', key: 'priority' },
            { label: 'Status', key: 'status' },
            { label: 'Created', render: (item) => formatDateTime(item.createdAt) },
        ]}
    />
);

export default QueuePage;
