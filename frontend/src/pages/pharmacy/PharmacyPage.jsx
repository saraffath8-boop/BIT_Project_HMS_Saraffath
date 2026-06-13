import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime } from '../shared/modulePageUtils';
import { getMedicines } from '../../services/medicineService';

const PharmacyPage = () => (
    <ModuleListPage
        title="Medicine Inventory"
        kicker="Pharmacy Management"
        description="Review medicine availability, pricing, reorder levels, expiry dates, and stock status."
        loadData={getMedicines}
        itemsKey="medicines"
        createAction={{ to: '/pharmacy/new', label: 'Add Medicine', allowedRoles: ['admin', 'pharmacist'] }}
        emptyMessage="No medicines are currently recorded."
        columns={[
            { label: 'Medicine', key: 'name' },
            { label: 'SKU', key: 'sku' },
            { label: 'Stock', key: 'stockQuantity' },
            { label: 'Reorder Level', key: 'reorderLevel' },
            { label: 'Unit Price', render: (item) => String(item.unitPrice ?? 'Not recorded') },
            { label: 'Expiry Date', render: (item) => formatDateTime(item.expiryDate) },
        ]}
    />
);

export default PharmacyPage;
