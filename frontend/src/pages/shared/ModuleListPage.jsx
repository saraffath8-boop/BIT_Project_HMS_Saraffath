// This file contains the module list page interface.

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Plus, RefreshCw, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { CollapsibleSection } from '../../components/ui/collapsible-section';

// Load nested value.
const getNestedValue = (item, path) =>
    path?.split('.').reduce((value, key) => value?.[key], item) ?? '';
// Store the empty filters setting used by this file.
const EMPTY_FILTERS = {};
// Handle status words.
const statusWords = [
    'active',
    'scheduled',
    'completed',
    'paid',
    'available',
    'approved',
    'waiting',
    'pending',
    'cancelled',
    'inactive',
    'unpaid',
];

// Show the cell value interface.
const CellValue = ({ value }) => {
    const clean = value || 'Not recorded';
    const text = typeof clean === 'string' ? clean.replaceAll('_', ' ') : clean;
    const isStatus = typeof clean === 'string' && statusWords.includes(clean.toLowerCase());
    return isStatus ? (
        <Badge
            variant={
                ['completed', 'paid', 'active', 'available', 'approved'].includes(
                    clean.toLowerCase(),
                )
                    ? 'success'
                    : ['cancelled', 'inactive', 'unpaid'].includes(clean.toLowerCase())
                      ? 'destructive'
                      : 'warning'
            }
        >
            {text}
        </Badge>
    ) : (
        text
    );
};

// Handle module list page.
const ModuleListPage = ({
    title,
    kicker,
    description,
    loadData,
    itemsKey,
    columns,
    emptyMessage,
    filters = EMPTY_FILTERS,
    createAction = null,
}) => {
    const { token, user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load items.
    const loadItems = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await loadData({ token, filters });
            setItems(response[itemsKey] || []);
        } catch (err) {
            setError(err.message || 'Unable to load records');
        } finally {
            setLoading(false);
        }
    }, [filters, itemsKey, loadData, token]);

    // Run this work when the listed values change.
    useEffect(() => {
        const id = setTimeout(loadItems, 0);
        return () => clearTimeout(id);
    }, [loadItems]);
    const canCreate = createAction?.allowedRoles?.includes(user?.role);
    const visibleColumns = columns.filter(
        (column) => !column.allowedRoles || column.allowedRoles.includes(user?.role),
    );

    return (
        <main className="space-y-6">
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="page-kicker">{kicker}</p>
                    <h1 className="page-title">{title}</h1>
                    <p className="page-description">{description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={loadItems} disabled={loading}>
                        <RefreshCw className="size-4" />
                        Refresh
                    </Button>
                    {canCreate && (
                        <Button asChild>
                            <Link to={createAction.to}>
                                <Plus className="size-4" />
                                {createAction.label}
                            </Link>
                        </Button>
                    )}
                </div>
            </section>

            {error && <Alert variant="destructive">{error}</Alert>}
            {loading && (
                <Card className="space-y-3 p-5">
                    {[1, 2, 3, 4].map((item) => (
                        <Skeleton key={item} className="h-11 w-full" />
                    ))}
                </Card>
            )}
            {!loading && !error && items.length === 0 && (
                <Card className="grid place-items-center px-6 py-16 text-center">
                    <SearchX className="mb-3 size-9 text-slate-400" />
                    <h2 className="font-semibold text-slate-800">No records found</h2>
                    <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
                </Card>
            )}
            {!loading && !error && items.length > 0 && (
                <CollapsibleSection title={title} count={items.length}>
                    <Card className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {visibleColumns.map((column) => (
                                        <TableHead key={column.label}>{column.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id || item._id}>
                                        {visibleColumns.map((column) => (
                                            <TableCell
                                                key={`${item.id || item._id}-${column.label}`}
                                            >
                                                <CellValue
                                                    value={
                                                        column.render
                                                            ? column.render(item)
                                                            : getNestedValue(item, column.key)
                                                    }
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-end gap-1 border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-500">
                            End of records <ArrowRight className="size-3" />
                        </div>
                    </Card>
                </CollapsibleSection>
            )}
        </main>
    );
};

export default ModuleListPage;
