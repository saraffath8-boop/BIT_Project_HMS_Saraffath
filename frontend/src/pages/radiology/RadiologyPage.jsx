import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getRadiologyRequests } from '../../services/radiologyRequestService';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RadiologyPage = () => {
    const { user } = useAuth();
    return (
        <ModuleListPage
            title="Radiology Requests"
            kicker="Radiology Management"
            description="Review scan requests, scheduled imaging, assigned radiologists, reports, and completion status."
            loadData={getRadiologyRequests}
            itemsKey="radiologyRequests"
            createAction={{
                to: '/radiology/new',
                label: 'Add Radiology Request',
                allowedRoles: ['admin'],
            }}
            emptyMessage="No radiology requests are currently available."
            columns={[
                { label: 'Patient', render: (item) => getPersonName(item.patient) },
                { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
                { label: 'Scan Type', key: 'scanType' },
                { label: 'Body Part', key: 'bodyPart' },
                { label: 'Status', key: 'status' },
                { label: 'Payment', render: (item) => item.paymentStatus || 'unpaid' },
                { label: 'Scheduled', render: (item) => formatDateTime(item.scheduledAt) },
                {
                    label: 'Report',
                    allowedRoles: ['admin', 'doctor', 'radiologist'],
                    render: (item) =>
                        user?.role === 'radiologist' &&
                        item.paymentStatus !== 'paid' &&
                        item.status !== 'completed' ? (
                            'Awaiting Payment'
                        ) : (
                            <Link
                                className="font-semibold text-cyan-700"
                                to={`/radiology/${item.id}/process`}
                            >
                                {item.status === 'completed' ? 'View Report' : 'Process'}
                            </Link>
                        ),
                },
            ]}
        />
    );
};

export default RadiologyPage;
