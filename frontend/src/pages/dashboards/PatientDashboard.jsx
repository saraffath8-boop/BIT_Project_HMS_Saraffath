import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyPatientProfile } from '../../services/patientService';

const linkedCards = [
    { title: 'Feedback', description: 'Submit feedback, complaints, and service requests.', to: '/feedback' },
    { title: 'Notifications', description: 'View hospital notifications assigned to your account.', to: '/notifications' },
    { title: 'Appointments', description: 'View appointments linked to your patient profile.', to: '/my/appointments' },
    { title: 'Prescriptions', description: 'View prescriptions linked to your patient profile.', to: '/my/prescriptions' },
    { title: 'Reports', description: 'View lab and radiology reports linked to your patient profile.', to: '/my/reports' },
    { title: 'Bills', description: 'View bills linked to your patient profile.', to: '/my/bills' },
];

const unlinkedCards = [
    { title: 'Feedback', description: 'Submit feedback, complaints, and service requests.', to: '/feedback' },
    { title: 'Notifications', description: 'View hospital notifications assigned to your account.', to: '/notifications' },
];

const PatientDashboard = () => {
    const { token, user } = useAuth();
    const [patientProfile, setPatientProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await getMyPatientProfile(token);
                setPatientProfile(response.patient);
            } catch (err) {
                setPatientProfile(null);
                setError(err.message || 'Unable to load your patient profile');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadProfile();
        }
    }, [token]);

    const isUnlinked = error === 'No patient profile is linked to this account';
    const cards = patientProfile ? linkedCards : unlinkedCards;

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Patient Dashboard</p>
                    <h1 style={styles.title}>{patientProfile?.fullName || user?.name || 'Patient'}</h1>
                    <p style={styles.subtitle}>
                        {patientProfile
                            ? `Patient ID: ${patientProfile.patientId}`
                            : 'Access available patient portal features.'}
                    </p>
                </div>
            </section>

            {loading && <section style={styles.notice}>Loading your patient profile...</section>}

            {!loading && isUnlinked && (
                <section style={styles.warning}>
                    Your patient profile is not linked yet. Please contact hospital staff.
                </section>
            )}

            {!loading && error && !isUnlinked && <section style={styles.error}>{error}</section>}

            {!loading && patientProfile && (
                <section style={styles.profileCard}>
                    <div>
                        <span style={styles.profileLabel}>Patient Name</span>
                        <strong style={styles.profileValue}>{patientProfile.fullName}</strong>
                    </div>
                    <div>
                        <span style={styles.profileLabel}>Patient ID</span>
                        <strong style={styles.profileValue}>{patientProfile.patientId}</strong>
                    </div>
                    <div>
                        <span style={styles.profileLabel}>Status</span>
                        <strong style={styles.profileValue}>{patientProfile.status}</strong>
                    </div>
                </section>
            )}

            <section style={styles.grid}>
                {cards.map((card) => {
                    const isDisabled = !card.to;
                    const content = (
                        <article style={{ ...styles.card, ...(isDisabled ? styles.disabledCard : {}) }}>
                            <h2 style={styles.cardTitle}>{card.title}</h2>
                            <p style={styles.cardText}>{card.description}</p>
                            <span style={styles.cardAction}>{isDisabled ? 'Unavailable' : 'Open module'}</span>
                        </article>
                    );

                    if (isDisabled) {
                        return <div key={card.title}>{content}</div>;
                    }

                    return (
                        <Link key={card.title} to={card.to} style={styles.cardLink}>
                            {content}
                        </Link>
                    );
                })}
            </section>
        </main>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '32px', color: '#0f172a' },
    header: { display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', marginBottom: '24px' },
    kicker: { margin: 0, color: '#2563eb', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '12px' },
    title: { margin: '8px 0', fontSize: '34px', fontWeight: 900 },
    subtitle: { margin: 0, color: '#475569', maxWidth: '760px', lineHeight: 1.6 },
    logoutButton: { border: 'none', background: '#0f172a', color: '#ffffff', borderRadius: '12px', padding: '12px 18px', fontWeight: 800, cursor: 'pointer' },
    notice: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: '16px', padding: '16px', marginBottom: '18px', fontWeight: 700 },
    warning: { background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: '16px', padding: '16px', marginBottom: '18px', fontWeight: 700 },
    error: { background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '16px', padding: '16px', marginBottom: '18px', fontWeight: 700 },
    profileCard: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px', marginBottom: '18px' },
    profileLabel: { display: 'block', color: '#64748b', fontWeight: 700, marginBottom: '6px' },
    profileValue: { color: '#0f172a', fontSize: '18px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' },
    cardLink: { textDecoration: 'none', color: 'inherit' },
    card: { minHeight: '150px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' },
    disabledCard: { opacity: 0.72 },
    cardTitle: { margin: '0 0 10px', fontSize: '20px' },
    cardText: { margin: 0, color: '#475569', lineHeight: 1.5 },
    cardAction: { display: 'inline-block', marginTop: '18px', color: '#2563eb', fontWeight: 800 },
};

export default PatientDashboard;
