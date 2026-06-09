import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyLabRequests } from '../../services/labRequestService';
import { getMyRadiologyRequests } from '../../services/radiologyRequestService';

const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleDateString();
};

const formatPerson = (person) => {
    if (!person) return 'N/A';
    return person.name || person.email || 'N/A';
};

const formatStatus = (status) => status
    ? status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'N/A';

const summarizeLabResults = (tests = []) => {
    const completedResults = tests
        .filter((test) => test.result || test.remarks)
        .map((test) => `${test.testName}: ${test.result || test.remarks}`);

    return completedResults.length > 0 ? completedResults.join('; ') : 'N/A';
};

const formatTestNames = (tests = []) => {
    if (tests.length === 0) return 'N/A';
    return tests.map((test) => test.testName).filter(Boolean).join(', ') || 'N/A';
};

const MyReportsPage = () => {
    const { token } = useAuth();
    const [labRequests, setLabRequests] = useState([]);
    const [radiologyRequests, setRadiologyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadReports = async () => {
            setLoading(true);
            setError('');

            try {
                const [labResponse, radiologyResponse] = await Promise.all([
                    getMyLabRequests(token),
                    getMyRadiologyRequests(token),
                ]);

                setLabRequests(labResponse.labRequests || []);
                setRadiologyRequests(radiologyResponse.radiologyRequests || []);
            } catch (err) {
                setError(err.message || 'Unable to load your reports');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadReports();
        }
    }, [token]);

    const hasReports = labRequests.length > 0 || radiologyRequests.length > 0;

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Patient Portal</p>
                    <h1 style={styles.title}>My Reports</h1>
                    <p style={styles.subtitle}>View lab and radiology records linked to your patient profile.</p>
                </div>
                <Link style={styles.dashboardButton} to="/dashboard">Dashboard</Link>
            </section>

            {loading && <div style={styles.notice}>Loading reports...</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && !hasReports && (
                <div style={styles.notice}>No lab or radiology reports are currently available for your profile.</div>
            )}

            {!loading && !error && hasReports && (
                <>
                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Lab Reports</h2>
                        {labRequests.length === 0 ? (
                            <p style={styles.emptyText}>No lab reports available.</p>
                        ) : (
                            <div style={styles.tableWrap}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Requested Date</th>
                                            <th style={styles.th}>Doctor</th>
                                            <th style={styles.th}>Tests</th>
                                            <th style={styles.th}>Priority</th>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}>Result Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {labRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td style={styles.td}>{formatDate(request.createdAt)}</td>
                                                <td style={styles.td}>{formatPerson(request.doctor)}</td>
                                                <td style={styles.td}>{formatTestNames(request.tests)}</td>
                                                <td style={styles.td}>{formatStatus(request.priority)}</td>
                                                <td style={styles.td}>{formatStatus(request.status)}</td>
                                                <td style={styles.td}>{summarizeLabResults(request.tests)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Radiology Reports</h2>
                        {radiologyRequests.length === 0 ? (
                            <p style={styles.emptyText}>No radiology reports available.</p>
                        ) : (
                            <div style={styles.tableWrap}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Requested Date</th>
                                            <th style={styles.th}>Doctor</th>
                                            <th style={styles.th}>Scan Type</th>
                                            <th style={styles.th}>Body Part</th>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}>Report Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {radiologyRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td style={styles.td}>{formatDate(request.createdAt)}</td>
                                                <td style={styles.td}>{formatPerson(request.doctor)}</td>
                                                <td style={styles.td}>{request.scanType || 'N/A'}</td>
                                                <td style={styles.td}>{request.bodyPart || 'N/A'}</td>
                                                <td style={styles.td}>{formatStatus(request.status)}</td>
                                                <td style={styles.td}>{request.report || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
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
    section: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px', marginBottom: '18px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' },
    sectionTitle: { margin: '0 0 16px', fontSize: '24px', fontWeight: 900 },
    emptyText: { margin: 0, color: '#475569', fontWeight: 700 },
    tableWrap: { overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', background: '#eff6ff', color: '#1e3a8a', padding: '14px', borderBottom: '1px solid #bfdbfe', fontSize: '14px' },
    td: { padding: '14px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', verticalAlign: 'top' },
};

export default MyReportsPage;
