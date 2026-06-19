// This file contains the reports page interface.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCcw } from 'lucide-react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { useAuth } from '../../context/AuthContext';
import { downloadAdminReportPdf } from '../../lib/adminReportPdf';
import { getComprehensiveReports } from '../../services/reportService';

const reportConfig = [
    {
        key: 'dailyAppointmentCounts',
        title: 'Daily Appointment Count',
        description: 'Daily appointment counts grouped by department and doctor.',
        preview: 'groupedRows',
        columns: [
            ['date', 'Date'],
            ['department', 'Department'],
            ['doctor', 'Doctor'],
            ['appointmentCount', 'Appointments'],
            ['completedCount', 'Completed'],
        ],
    },
    {
        key: 'monthlyRevenueSummary',
        title: 'Monthly Revenue Summary',
        description: 'Monthly revenue calculations by bill type: consultation, pharmacy, laboratory, and radiology.',
        preview: 'monthlyRows',
        columns: [
            ['month', 'Month'],
            ['consultation', 'Consultation'],
            ['pharmacy', 'Pharmacy'],
            ['laboratory', 'Laboratory'],
            ['radiology', 'Radiology'],
            ['totalRevenue', 'Total'],
        ],
    },
    {
        key: 'doctorWorkloadSummary',
        title: 'Doctor Workload Summary',
        description: 'Doctor workload by appointment count and completed consultations.',
        preview: 'doctorRows',
        columns: [
            ['doctor', 'Doctor'],
            ['department', 'Department'],
            ['appointmentCount', 'Appointments'],
            ['completedConsultations', 'Completed Consultations'],
            ['cancelledCount', 'Cancelled'],
        ],
    },
    {
        key: 'pendingRequestSummary',
        title: 'Pending Request Summary',
        description: 'Pending request summary for pharmacy, laboratory, and radiology.',
        preview: 'pendingRows',
        columns: [
            ['service', 'Service'],
            ['pendingRequests', 'Pending'],
            ['unpaidRequests', 'Unpaid'],
            ['paidRequests', 'Paid'],
            ['completedRequests', 'Completed'],
        ],
    },
    {
        key: 'patientRegistrationTrend',
        title: 'Patient Registration Trend',
        description: 'Patient registration trend grouped by month.',
        preview: 'monthlyRows',
        columns: [
            ['month', 'Month'],
            ['registrations', 'Registrations'],
            ['activePatients', 'Active Patients'],
        ],
    },
];

const moneyKeys = new Set([
    'totalAmount',
    'paidAmount',
    'outstandingAmount',
    'amount',
    'revenue',
    'pharmacyRevenue',
    'consultationRevenue',
    'labRevenue',
    'radiologyRevenue',
    'laboratoryRevenue',
    'consultation',
    'pharmacy',
    'laboratory',
    'radiology',
    'totalRevenue',
]);

const formatLabel = (value) =>
    value
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase())
        .trim();

const formatValue = (key, value) => {
    if (moneyKeys.has(key)) return `LKR ${Number(value || 0).toLocaleString()}`;
    if (typeof value === 'number') return value.toLocaleString();
    return String(value ?? 'N/A').replaceAll('_', ' ');
};

const getDefaultFilters = () => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    return {
        from: from.toISOString().slice(0, 10),
        to: today.toISOString().slice(0, 10),
    };
};

// Show the reports page interface.
const ReportsPage = () => {
    const { token } = useAuth();
    const [filters, setFilters] = useState(getDefaultFilters);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getComprehensiveReports({ token, filters });
            setReport(response.report || null);
        } catch (err) {
            setError(err.message || 'Unable to load comprehensive reports');
        } finally {
            setLoading(false);
        }
    }, [filters, token]);

    useEffect(() => {
        const timeoutId = setTimeout(loadReports, 0);
        return () => clearTimeout(timeoutId);
    }, [loadReports]);

    const reports = report?.reports || {};
    const reportFilters = report?.filters || filters;
    const hasReports = Object.keys(reports).length > 0;
    const totalCards = useMemo(() => {
        const revenue = reports.monthlyRevenueSummary?.totals || {};
        const appointments = reports.dailyAppointmentCounts?.totals || {};
        const pending = reports.pendingRequestSummary?.totals || {};
        const patients = reports.patientRegistrationTrend?.totals || {};
        return [
            ['Total Revenue', revenue.totalRevenue || 0, 'totalRevenue'],
            ['Appointments', appointments.appointments || 0, 'appointments'],
            ['Pending Requests', pending.totalPending || 0, 'totalPending'],
            ['Registered Patients', patients.registeredPatients || 0, 'registeredPatients'],
            ['Active Patients', patients.activePatients || 0, 'activePatients'],
        ];
    }, [reports]);

    const changeFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));

    return (
        <main className="space-y-6">
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="page-kicker">Reports and Analytics</p>
                    <h1 className="page-title">Admin Report Center</h1>
                    <p className="page-description">
                        Generate comprehensive operational reports with preview tables and polished PDF downloads.
                    </p>
                </div>
                <Button variant="outline" onClick={loadReports} disabled={loading}>
                    <RefreshCcw className="size-4" />
                    Refresh
                </Button>
            </section>

            <Card className="p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <Field label="From">
                        <Input
                            type="date"
                            value={filters.from}
                            onChange={(event) => changeFilter('from', event.target.value)}
                        />
                    </Field>
                    <Field label="To">
                        <Input
                            type="date"
                            value={filters.to}
                            onChange={(event) => changeFilter('to', event.target.value)}
                        />
                    </Field>
                    <Button type="button" onClick={loadReports} disabled={loading}>
                        Apply Filters
                    </Button>
                </div>
            </Card>

            {error && <Alert variant="destructive">{error}</Alert>}
            {loading && <Card className="p-6 text-sm text-slate-500">Loading reports...</Card>}
            {!loading && !error && !hasReports && (
                <Card className="p-6 text-sm text-slate-500">No report data is currently available.</Card>
            )}

            {!loading && !error && hasReports && (
                <>
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {totalCards.map(([label, value, key]) => (
                            <Card key={label} className="p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {label}
                                </p>
                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    {formatValue(key, value)}
                                </p>
                            </Card>
                        ))}
                    </section>

                    <section className="grid gap-5">
                        {reportConfig.map((config) => {
                            const currentReport = reports[config.key];
                            if (!currentReport) return null;
                            return (
                                <ReportPanel
                                    key={config.key}
                                    config={config}
                                    report={currentReport}
                                    filters={reportFilters}
                                />
                            );
                        })}
                    </section>
                </>
            )}
        </main>
    );
};

const ReportPanel = ({ config, report, filters }) => {
    const previewRows = report[config.preview] || [];
    const totalEntries = Object.entries(report.totals || {});

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50 p-5 lg:flex-row lg:items-start">
                <div>
                    <h2 className="text-lg font-bold text-slate-950">{config.title}</h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-600">{config.description}</p>
                </div>
                <Button
                    type="button"
                    onClick={() =>
                        downloadAdminReportPdf({
                            key: config.key,
                            report,
                            filters,
                        })
                    }
                >
                    <Download className="size-4" />
                    Download PDF
                </Button>
            </div>
            <div className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {totalEntries.map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-slate-200 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {formatLabel(key)}
                            </p>
                            <p className="mt-1 text-lg font-bold text-slate-950">
                                {formatValue(key, value)}
                            </p>
                        </div>
                    ))}
                </div>
                <PreviewTable columns={config.columns} rows={previewRows} />
            </div>
        </Card>
    );
};

const PreviewTable = ({ columns, rows }) => (
    <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table>
            <TableHeader>
                <TableRow>
                    {columns.map(([key, label]) => (
                        <TableHead key={key}>{label}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="text-center text-slate-500">
                            No rows available for this period.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.slice(0, 8).map((row, index) => (
                        <TableRow key={`${row.id || row.billNumber || row.patient || 'row'}-${index}`}>
                            {columns.map(([key]) => (
                                <TableCell key={key} className="max-w-72 whitespace-normal">
                                    {formatValue(key, row[key])}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    </div>
);

const Field = ({ label, children }) => (
    <label className="space-y-2">
        <Label>{label}</Label>
        {children}
    </label>
);

export default ReportsPage;
