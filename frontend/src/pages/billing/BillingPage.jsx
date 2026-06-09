import ModuleListPage from '../shared/ModuleListPage';
import { getPersonName } from '../shared/modulePageUtils';
import { getBills } from '../../services/billService';

const BillingPage = () => (
    <ModuleListPage
        title="Billing Records"
        kicker="Billing Management"
        description="Review patient bills, service totals, payment status, and outstanding balances."
        loadData={getBills}
        itemsKey="bills"
        createAction={{ to: '/billing/new', label: 'Add Bill', allowedRoles: ['admin'] }}
        emptyMessage="No billing records are currently available."
        columns={[
            { label: 'Bill Number', key: 'billNumber' },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Total Amount', render: (item) => String(item.totalAmount ?? 'Not recorded') },
            { label: 'Paid Amount', render: (item) => String(item.paidAmount ?? 'Not recorded') },
            { label: 'Status', key: 'status' },
        ]}
    />
);

export default BillingPage;
