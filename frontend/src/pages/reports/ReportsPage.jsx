import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardReport } from '../../services/reportService';

const reportLabels = {
    totalPatients: 'Total Patients',
    totalStaff: 'Total Staff',
    totalAppointments: 'Total Appointments',
    waitingQueueEntries: 'Waiting Queue Entries',
    pendingPrescriptions: 'Pending Prescriptions',
    pendingLabRequests: 'Pending Lab Requests',
    pendingRadiologyRequests: 'Pending Radiology Requests',
    unpaidBills: 'Unpaid Bills',
    lowStockMedicines: 'Low Stock Medicines',
    lowStockInventoryItems: 'Low Stock Inventory Items',
    openFeedback: 'Open Feedback',
};

const ReportsPage = () => {
    const { token } = useAuth();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReport = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getDashboardReport(token);
            setReport(response.report || null);
        } catch (err) {
            setError(err.message || 'Unable to load reports');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadReport();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [loadReport]);

    const counts = report?.counts || {};
    const revenue = report?.revenue || null;

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Reports and Analytics</p>
                    <h1 style={styles.title}>Operational Reports</h1>
                    <p style={styles.subtitle}>Review live hospital counts and revenue totals from database records.</p>
                </div>
                <div style={styles.actions}>
                    <button type="button" onClick={loadReport} style={styles.secondaryButton}>Refresh</button>
                    <Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link>
                </div>
            </section>

            {loading && <div style={styles.notice}>Loading reports.</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && !report && <div style={styles.notice}>No report data is currently available.</div>}

            {!loading && !error && report && (
                <>
                    <section style={styles.grid}>
                        {Object.entries(reportLabels).map(([key, label]) => (
                            <article key={key} style={styles.card}>
                                <p style={styles.cardLabel}>{label}</p>
                                <h2 style={styles.cardValue}>{counts[key] ?? 0}</h2>
                            </article>
                        ))}
                    </section>

                    {revenue && (
                        <section style={styles.revenueCard}>
                            <h2 style={styles.sectionTitle}>Revenue Summary</h2>
                            <div style={styles.revenueGrid}>
                                <p>Total Amount: {revenue.totalAmount}</p>
                                <p>Paid Amount: {revenue.paidAmount}</p>
                                <p>Outstanding Amount: {revenue.outstandingAmount}</p>
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '32px', color: '#0f172a' },
    header: { display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' },
    kicker: { margin: 0, color: '#2563eb', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '12px' },
    title: { margin: '8px 0', fontSize: '32px', fontWeight: 800 },
    subtitle: { margin: 0, color: '#475569', maxWidth: '680px' },
    actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    secondaryLink: { textDecoration: 'none', border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff', padding: '10px 14px', borderRadius: '10px', fontWeight: 700 },
    secondaryButton: { border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff', padding: '10px 14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' },
    notice: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', color: '#475569' },
    error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '18px', color: '#991b1b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
    card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' },
    cardLabel: { margin: 0, color: '#64748b', fontWeight: 700 },
    cardValue: { margin: '10px 0 0', fontSize: '30px' },
    revenueCard: { marginTop: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' },
    sectionTitle: { margin: '0 0 12px', fontSize: '22px' },
    revenueGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', color: '#334155', fontWeight: 700 },
};

export default ReportsPage;
