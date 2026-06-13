// This file contains the my bills page interface.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { downloadHospitalBillPdf } from '../../lib/hospitalBillPdf';
import { getMyBills } from '../../services/billService';
import { CollapsibleSection } from '../../components/ui/collapsible-section';

// Prepare money.
const formatMoney = (value) => {
    const numberValue = Number(value || 0);
    return `LKR ${numberValue.toLocaleString()}`;
};

// Prepare status.
const formatStatus = (status) =>
    status
        ? status
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
        : 'N/A';

// Show the my bills page interface.
const MyBillsPage = () => {
    const { token } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Run this work when the listed values change.
    useEffect(() => {
        // Load bills.
        const loadBills = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await getMyBills(token);
                setBills(response.bills || []);
            } catch (err) {
                setError(err.message || 'Unable to load your bills');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadBills();
        }
    }, [token]);

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Patient Portal</p>
                    <h1 style={styles.title}>My Bills</h1>
                    <p style={styles.subtitle}>View bills linked to your patient profile.</p>
                </div>
                <Link style={styles.dashboardButton} to="/dashboard">
                    Dashboard
                </Link>
            </section>

            {loading && <div style={styles.notice}>Loading bills...</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && bills.length === 0 && (
                <div style={styles.notice}>No bills are currently available for your profile.</div>
            )}

            {!loading && !error && bills.length > 0 && (
                <CollapsibleSection title="My Bills" count={bills.length}>
                    <section style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Service</th>
                                    <th style={styles.th}>Paid Amount</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Bill</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td style={styles.td}>
                                            {formatStatus(bill.billType || 'consultation')}
                                        </td>
                                        <td style={styles.td}>{formatMoney(bill.paidAmount)}</td>
                                        <td style={styles.td}>{formatStatus(bill.status)}</td>
                                        <td style={styles.td}>
                                            <button
                                                type="button"
                                                style={styles.downloadButton}
                                                onClick={() => downloadHospitalBillPdf(bill)}
                                            >
                                                Download PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </CollapsibleSection>
            )}
        </main>
    );
};

// Handle styles.
const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '32px', color: '#0f172a' },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        alignItems: 'flex-start',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '24px',
    },
    kicker: {
        margin: 0,
        color: '#2563eb',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '12px',
    },
    title: { margin: '8px 0', fontSize: '34px', fontWeight: 900 },
    subtitle: { margin: 0, color: '#475569', maxWidth: '720px', lineHeight: 1.6 },
    dashboardButton: {
        background: '#2563eb',
        color: '#ffffff',
        textDecoration: 'none',
        padding: '12px 16px',
        borderRadius: '12px',
        fontWeight: 800,
    },
    notice: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        borderRadius: '16px',
        padding: '16px',
        fontWeight: 700,
    },
    error: {
        background: '#fee2e2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        borderRadius: '16px',
        padding: '16px',
        fontWeight: 700,
    },
    tableWrap: {
        overflowX: 'auto',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        background: '#eff6ff',
        color: '#1e3a8a',
        padding: '14px',
        borderBottom: '1px solid #bfdbfe',
        fontSize: '14px',
    },
    td: {
        padding: '14px',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        verticalAlign: 'top',
    },
    downloadButton: {
        border: 0,
        borderRadius: '10px',
        background: '#2563eb',
        color: '#ffffff',
        cursor: 'pointer',
        padding: '9px 12px',
        fontWeight: 800,
        whiteSpace: 'nowrap',
    },
};

export default MyBillsPage;
