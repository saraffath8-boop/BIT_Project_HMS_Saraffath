import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getMedicalRecords } from '../../services/medicalRecordService';

const MedicalRecordsPage = () => (
    <ModuleListPage
        title="Medical Records"
        kicker="Clinical Documentation"
        description="Review patient consultation notes, diagnoses, vital signs, and follow-up status."
        loadData={getMedicalRecords}
        itemsKey="medicalRecords"
        createAction={{ to: '/medical-records/new', label: 'Add Medical Record', allowedRoles: ['admin', 'doctor'] }}
        emptyMessage="No medical records are currently available."
        columns={[
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
            { label: 'Diagnosis', key: 'diagnosis' },
            { label: 'Status', key: 'status' },
            { label: 'Follow Up', render: (item) => formatDateTime(item.followUpDate) },
        ]}
    />
);

export default MedicalRecordsPage;
