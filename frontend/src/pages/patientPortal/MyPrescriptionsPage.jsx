import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyPrescriptions } from '../../services/prescriptionService';

const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleDateString();
};

const formatDoctor = (doctor) => {
    if (!doctor) return 'N/A';
    return doctor.name || doctor.email || 'N/A';
};

const formatStatus = (status) => status
    ? status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'N/A';

const formatMedicineName = (item) => item.medicineName || item.medicine?.name || 'Medicine';

const MyPrescriptionsPage = () => {
    const { token } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPrescriptions = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await getMyPrescriptions(token);
                setPrescriptions(response.prescriptions || []);
            } catch (err) {
                setError(err.message || 'Unable to load your prescriptions');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadPrescriptions();
        }
    }, [token]);

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Patient Portal</p>
                    <h1 style={styles.title}>My Prescriptions</h1>
                    <p style={styles.subtitle}>View prescriptions linked to your patient profile.</p>
                </div>
                <Link style={styles.dashboardButton} to="/dashboard">Dashboard</Link>
            </section>

            {loading && <div style={styles.notice}>Loading prescriptions...</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && prescriptions.length === 0 && (
                <div style={styles.notice}>No prescriptions are currently available for your profile.</div>
            )}

            {!loading && !error && prescriptions.length > 0 && (
                <section style={styles.list}>
                    {prescriptions.map((prescription) => (
                        <article key={prescription.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <span style={styles.label}>Created Date</span>
                                    <strong style={styles.value}>{formatDate(prescription.createdAt)}</strong>
                                </div>
                                <div>
                                    <span style={styles.label}>Status</span>
                                    <strong style={styles.value}>{formatStatus(prescription.status)}</strong>
                                </div>
                            </div>

                            <div style={styles.detailGrid}>
                                <div>
                                    <span style={styles.label}>Doctor</span>
                                    <strong style={styles.value}>{formatDoctor(prescription.doctor)}</strong>
                                </div>
                                <div>
                                    <span style={styles.label}>Notes</span>
                                    <p style={styles.notes}>{prescription.notes || 'N/A'}</p>
                                </div>
                            </div>

                            <div style={styles.medicineBlock}>
                                <span style={styles.label}>Medicines</span>
                                <div style={styles.medicineList}>
                                    {(prescription.items || []).map((item) => (
                                        <div key={`${prescription.id}-${formatMedicineName(item)}-${item.dosage}-${item.frequency}`} style={styles.medicineItem}>
                                            <strong style={styles.medicineName}>{formatMedicineName(item)}</strong>
                                            <span style={styles.medicineMeta}>Dosage: {item.dosage || 'N/A'}</span>
                                            <span style={styles.medicineMeta}>Frequency: {item.frequency || 'N/A'}</span>
                                            <span style={styles.medicineMeta}>Duration: {item.duration || 'N/A'}</span>
                                        </div>
                                    ))}
                                    {(prescription.items || []).length === 0 && <p style={styles.notes}>No medicines listed.</p>}
                                </div>
                            </div>
                        </article>
                    ))}
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
    list: { display: 'grid', gap: '16px' },
    card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '14px' },
    detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' },
    label: { display: 'block', color: '#64748b', fontWeight: 700, marginBottom: '6px' },
    value: { color: '#0f172a', fontSize: '17px' },
    notes: { margin: 0, color: '#334155', lineHeight: 1.5 },
    medicineBlock: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' },
    medicineList: { display: 'grid', gap: '10px' },
    medicineItem: { background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '12px', padding: '12px', display: 'grid', gap: '5px' },
    medicineName: { color: '#1e3a8a' },
    medicineMeta: { color: '#475569' },
};

export default MyPrescriptionsPage;
