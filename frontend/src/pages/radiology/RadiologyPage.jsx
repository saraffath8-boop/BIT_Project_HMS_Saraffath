import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getRadiologyRequests } from '../../services/radiologyRequestService';
import { Link } from 'react-router-dom';

const RadiologyPage = () => (
    <ModuleListPage
        title="Radiology Requests"
        kicker="Radiology Management"
        description="Review scan requests, scheduled imaging, assigned radiologists, reports, and completion status."
        loadData={getRadiologyRequests}
        itemsKey="radiologyRequests"
        createAction={{ to: '/radiology/new', label: 'Add Radiology Request', allowedRoles: ['admin', 'doctor'] }}
        emptyMessage="No radiology requests are currently available."
        columns={[
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
            { label: 'Scan Type', key: 'scanType' },
            { label: 'Body Part', key: 'bodyPart' },
            { label: 'Status', key: 'status' },
            { label: 'Patient Decision', key: 'patientDecisionStatus' },
            { label: 'Scheduled', render: (item) => formatDateTime(item.scheduledAt) },
            { label: 'Report', allowedRoles: ['admin', 'doctor', 'radiologist'], render: (item) => <Link className="font-semibold text-cyan-700" to={`/radiology/${item.id}/process`}>{item.status === 'completed' ? 'View Report' : 'Process'}</Link> },
        ]}
    />
);

export default RadiologyPage;
