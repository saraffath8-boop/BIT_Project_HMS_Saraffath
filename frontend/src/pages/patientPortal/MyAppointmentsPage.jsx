import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyAppointments } from '../../services/appointmentService';

const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleString();
};

const formatDoctor = (doctor) => {
    if (!doctor) return 'N/A';
    return doctor.name || doctor.email || 'N/A';
};

const formatStatus = (status) => status
    ? status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'N/A';

const MyAppointmentsPage = () => {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadAppointments = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await getMyAppointments(token);
                setAppointments(response.appointments || []);
            } catch (err) {
                setError(err.message || 'Unable to load your appointments');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadAppointments();
        }
    }, [token]);

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Patient Portal</p>
                    <h1 style={styles.title}>My Appointments</h1>
                    <p style={styles.subtitle}>View appointments linked to your patient profile.</p>
                </div>
                <Link style={styles.dashboardButton} to="/dashboard">Dashboard</Link>
            </section>

            {loading && <div style={styles.notice}>Loading appointments...</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && appointments.length === 0 && (
                <div style={styles.notice}>No appointments are currently available for your profile.</div>
            )}

            {!loading && !error && appointments.length > 0 && (
                <section style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date and Time</th>
                                <th style={styles.th}>Doctor</th>
                                <th style={styles.th}>Department</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((appointment) => (
                                <tr key={appointment.id}>
                                    <td style={styles.td}>{formatDateTime(appointment.appointmentDate)}</td>
                                    <td style={styles.td}>{formatDoctor(appointment.doctor)}</td>
                                    <td style={styles.td}>{appointment.department || 'N/A'}</td>
                                    <td style={styles.td}>{formatStatus(appointment.status)}</td>
                                    <td style={styles.td}>{appointment.reason || 'N/A'}</td>
                                </tr>
                            ))}
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

export default MyAppointmentsPage;
