import ModuleListPage from '../shared/ModuleListPage';
import { getInventoryItems } from '../../services/inventoryService';

const InventoryPage = () => (
    <ModuleListPage
        title="Inventory and Supplies"
        kicker="Inventory Management"
        description="Monitor hospital supplies, equipment, stock levels, locations, and reorder thresholds."
        loadData={getInventoryItems}
        itemsKey="inventoryItems"
        createAction={{ to: '/inventory/new', label: 'Add Inventory Item', allowedRoles: ['admin'] }}
        emptyMessage="No inventory items are currently recorded."
        columns={[
            { label: 'Item', key: 'name' },
            { label: 'Item Code', key: 'itemCode' },
            { label: 'Category', key: 'category' },
            { label: 'Stock', key: 'stockQuantity' },
            { label: 'Reorder Level', key: 'reorderLevel' },
            { label: 'Location', key: 'location' },
        ]}
    />
);

export default InventoryPage;
