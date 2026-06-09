import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyBills } from '../../services/billService';

const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleDateString();
};

const formatMoney = (value) => {
    const numberValue = Number(value || 0);
    return numberValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
};

const formatStatus = (status) => status
    ? status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'N/A';

const summarizeItems = (items = []) => {
    if (items.length === 0) return 'No items listed';
    const descriptions = items.map((item) => item.description).filter(Boolean);
    if (descriptions.length === 0) return `${items.length} item${items.length === 1 ? '' : 's'}`;
    return `${items.length} item${items.length === 1 ? '' : 's'}: ${descriptions.slice(0, 3).join(', ')}${descriptions.length > 3 ? '...' : ''}`;
};

const MyBillsPage = () => {
    const { token } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
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
                <Link style={styles.dashboardButton} to="/dashboard">Dashboard</Link>
            </section>

            {loading && <div style={styles.notice}>Loading bills...</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && bills.length === 0 && (
                <div style={styles.notice}>No bills are currently available for your profile.</div>
            )}

            {!loading && !error && bills.length > 0 && (
                <section style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Bill Number</th>
                                <th style={styles.th}>Total Amount</th>
                                <th style={styles.th}>Paid Amount</th>
                                <th style={styles.th}>Outstanding Amount</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Created Date</th>
                                <th style={styles.th}>Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map((bill) => {
                                const outstandingAmount = Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0);

                                return (
                                    <tr key={bill.id}>
                                        <td style={styles.td}>{bill.billNumber}</td>
                                        <td style={styles.td}>{formatMoney(bill.totalAmount)}</td>
                                        <td style={styles.td}>{formatMoney(bill.paidAmount)}</td>
                                        <td style={styles.td}>{formatMoney(outstandingAmount)}</td>
                                        <td style={styles.td}>{formatStatus(bill.status)}</td>
                                        <td style={styles.td}>{formatDate(bill.createdAt)}</td>
                                        <td style={styles.td}>{summarizeItems(bill.items)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            )}
        </main>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '32px', color: '#0f172a' },
    header: { display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', marginBottom: '24px' },
    kicker: { margin: 0, color: '#2563eb', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '12px' },
    title: { margin: '8px 0', fontSize: '34px', fontWeight: 900 },
    subtitle: { margin: 0, color: '#475569', maxWidth: '720px', lineHeight: 1.6 },
    dashboardButton: { background: '#2563eb', color: '#ffffff', textDecoration: 'none', padding: '12px 16px', borderRadius: '12px', fontWeight: 800 },
    notice: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: '16px', padding: '16px', fontWeight: 700 },
    error: { background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '16px', padding: '16px', fontWeight: 700 },
    tableWrap: { overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', background: '#eff6ff', color: '#1e3a8a', padding: '14px', borderBottom: '1px solid #bfdbfe', fontSize: '14px' },
    td: { padding: '14px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', verticalAlign: 'top' },
};

export default MyBillsPage;
