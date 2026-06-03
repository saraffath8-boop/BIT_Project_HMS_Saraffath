import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardReport } from '../../services/reportService';

const summaryCards = [
    { label: 'Total Patients', key: 'totalPatients' },
    { label: 'Total Staff', key: 'totalStaff' },
    { label: 'Total Appointments', key: 'totalAppointments' },
    { label: 'Waiting Queue Entries', key: 'waitingQueueEntries' },
    { label: 'Pending Prescriptions', key: 'pendingPrescriptions' },
    { label: 'Pending Lab Requests', key: 'pendingLabRequests' },
    { label: 'Pending Radiology Requests', key: 'pendingRadiologyRequests' },
    { label: 'Unpaid Bills', key: 'unpaidBills' },
    { label: 'Low Stock Medicines', key: 'lowStockMedicines' },
    { label: 'Low Stock Inventory Items', key: 'lowStockInventoryItems' },
    { label: 'Open Feedback', key: 'openFeedback' },
];

const revenueCards = [
    { label: 'Total Amount', key: 'totalAmount' },
    { label: 'Paid Amount', key: 'paidAmount' },
    { label: 'Outstanding Amount', key: 'outstandingAmount' },
];

const quickActions = [
    { label: 'Add Patient Record', to: '/patients/new' },
    { label: 'Create Staff User', to: '/users' },
    { label: 'View Patients', to: '/patients' },
    { label: 'View Appointments', to: '/appointments' },
    { label: 'View Queue', to: '/queue' },
    { label: 'View Reports', to: '/reports' },
];

const managementSections = [
    { title: 'Patient Management', to: '/patients', description: 'Review patient profiles and hospital registration records.' },
    { title: 'Staff User Management', to: '/users', description: 'Manage staff accounts for hospital departments and roles.' },
    { title: 'Appointment Management', to: '/appointments', description: 'Review scheduled visits and appointment status.' },
    { title: 'Queue Management', to: '/queue', description: 'Monitor waiting entries and patient service flow.' },
    { title: 'Medical Records', to: '/medical-records', description: 'Open clinical documentation and patient history records.' },
    { title: 'Prescriptions', to: '/prescriptions', description: 'Review prescription records and issuing status.' },
    { title: 'Pharmacy Management', to: '/pharmacy', description: 'Manage medicine stock and pharmacy records.' },
    { title: 'Laboratory Management', to: '/laboratory', description: 'Track laboratory requests, test results, and completion status.' },
    { title: 'Radiology Management', to: '/radiology', description: 'Track radiology requests, schedules, images, and reports.' },
    { title: 'Billing Management', to: '/billing', description: 'Review bills, payments, and outstanding balances.' },
    { title: 'Inventory Management', to: '/inventory', description: 'Manage hospital supplies and equipment stock levels.' },
    { title: 'Feedback and Complaints', to: '/feedback', description: 'Review patient feedback and complaint status.' },
    { title: 'Notifications', to: '/notifications', description: 'Review system notifications for hospital activity.' },
    { title: 'Reports and Analytics', to: '/reports', description: 'Open operational counts and revenue reports.' },
];

const getNumber = (value) => Number(value || 0);

const formatCount = (value) => getNumber(value).toLocaleString();

const formatAmount = (value) => getNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const AdminDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReport = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getDashboardReport(token);
            setReport(response.report || { counts: {}, revenue: {} });
        } catch (err) {
            setReport({ counts: {}, revenue: {} });
            setError(err.message || 'Unable to load dashboard report');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const counts = report?.counts || {};
    const revenue = report?.revenue || {};

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Admin Dashboard</p>
                    <h1 style={styles.title}>{user?.name || 'Admin'} Control Center</h1>
                    <p style={styles.subtitle}>Monitor live hospital activity, revenue totals, and management areas from one admin workspace.</p>
                </div>
                <button type="button" style={styles.logoutButton} onClick={handleLogout}>Sign out</button>
            </section>

            {loading && <div style={styles.notice}>Loading admin dashboard report...</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}

            {!loading && (
                <>
                    <section style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>Hospital Summary</h2>
                            <button type="button" style={styles.refreshButton} onClick={loadReport}>Refresh Report</button>
                        </div>
                        <div style={styles.summaryGrid}>
                            {summaryCards.map((card) => (
                                <article key={card.key} style={styles.summaryCard}>
                                    <p style={styles.cardLabel}>{card.label}</p>
                                    <p style={styles.cardValue}>{formatCount(counts[card.key])}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Revenue Summary</h2>
                        <div style={styles.revenueGrid}>
                            {revenueCards.map((card) => (
                                <article key={card.key} style={styles.revenueCard}>
                                    <p style={styles.cardLabel}>{card.label}</p>
                                    <p style={styles.cardValue}>{formatAmount(revenue[card.key])}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Quick Actions</h2>
                        <div style={styles.actionGrid}>
                            {quickActions.map((action) => (
                                <Link key={action.label} to={action.to} style={styles.actionLink}>{action.label}</Link>
                            ))}
                        </div>
                    </section>

                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Management Sections</h2>
                        <div style={styles.managementGrid}>
                            {managementSections.map((section) => (
                                <Link key={section.title} to={section.to} style={styles.managementLink}>
                                    <article style={styles.managementCard}>
                                        <h3 style={styles.managementTitle}>{section.title}</h3>
                                        <p style={styles.managementText}>{section.description}</p>
                                        <span style={styles.managementAction}>Open Section</span>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </main>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '32px',
        color: '#0f172a',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        alignItems: 'flex-start',
        background: '#ffffff',
        border: '1px solid #dbeafe',
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 16px 40px rgba(37, 99, 235, 0.08)',
    },
    kicker: {
        margin: 0,
        color: '#2563eb',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '12px',
    },
    title: {
        margin: '8px 0',
        fontSize: '34px',
        fontWeight: 900,
    },
    subtitle: {
        margin: 0,
        color: '#475569',
        maxWidth: '780px',
        lineHeight: 1.6,
    },
    logoutButton: {
        border: 'none',
        background: '#0f172a',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '12px 18px',
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    notice: {
        background: '#ffffff',
        border: '1px solid #dbeafe',
        borderRadius: '16px',
        padding: '18px',
        color: '#1e40af',
        fontWeight: 700,
    },
    error: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '16px',
        padding: '18px',
        color: '#991b1b',
        fontWeight: 700,
        marginBottom: '20px',
    },
    section: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '22px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        alignItems: 'center',
        marginBottom: '16px',
    },
    sectionTitle: {
        margin: '0 0 16px',
        fontSize: '24px',
        color: '#0f172a',
    },
    refreshButton: {
        border: '1px solid #2563eb',
        background: '#ffffff',
        color: '#2563eb',
        borderRadius: '12px',
        padding: '10px 14px',
        fontWeight: 800,
        cursor: 'pointer',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
    },
    summaryCard: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '16px',
        padding: '18px',
    },
    revenueGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
    },
    revenueCard: {
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderLeft: '6px solid #2563eb',
        borderRadius: '16px',
        padding: '18px',
    },
    cardLabel: {
        margin: 0,
        color: '#475569',
        fontWeight: 800,
        lineHeight: 1.4,
    },
    cardValue: {
        margin: '10px 0 0',
        color: '#0f172a',
        fontSize: '30px',
        fontWeight: 900,
    },
    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '12px',
    },
    actionLink: {
        display: 'block',
        textDecoration: 'none',
        textAlign: 'center',
        background: '#2563eb',
        color: '#ffffff',
        borderRadius: '14px',
        padding: '14px 16px',
        fontWeight: 800,
    },
    managementGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
    },
    managementLink: {
        textDecoration: 'none',
        color: 'inherit',
    },
    managementCard: {
        minHeight: '150px',
        background: '#ffffff',
        border: '1px solid #dbeafe',
        borderRadius: '18px',
        padding: '20px',
        boxShadow: '0 10px 24px rgba(37, 99, 235, 0.07)',
    },
    managementTitle: {
        margin: '0 0 10px',
        color: '#0f172a',
        fontSize: '19px',
    },
    managementText: {
        margin: 0,
        color: '#475569',
        lineHeight: 1.5,
    },
    managementAction: {
        display: 'inline-block',
        marginTop: '18px',
        color: '#2563eb',
        fontWeight: 800,
    },
};

export default AdminDashboard;
