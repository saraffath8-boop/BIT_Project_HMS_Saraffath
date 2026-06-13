// This file contains the patient profile page interface.

import { useCallback, useEffect, useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import { deletePatient, getPatientById, linkPatientUser } from '../../services/patientService';

import { getUsers } from '../../services/userService';

// Prepare date.
const formatDate = (dateValue) => (dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A');

// Show the patient profile page interface.
const PatientProfilePage = () => {
    const { id } = useParams();

    const { token, user } = useAuth();

    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [patientUsers, setPatientUsers] = useState([]);

    const [selectedUserId, setSelectedUserId] = useState('');

    const [loadingUsers, setLoadingUsers] = useState(false);

    const [linking, setLinking] = useState(false);

    const [linkError, setLinkError] = useState('');

    const [linkSuccess, setLinkSuccess] = useState('');

    // Load patient profile.
    const loadPatientProfile = useCallback(async () => {
        const response = await getPatientById(id, token);

        setPatient(response.patient);

        setSelectedUserId(response.patient?.userAccount?.id || '');
    }, [id, token]);

    // Run this work when the listed values change.
    useEffect(() => {
        // Load current patient.
        const loadCurrentPatient = async () => {
            try {
                await loadPatientProfile();
            } catch (err) {
                setError(err.message || 'Unable to load patient');
            } finally {
                setLoading(false);
            }
        };

        loadCurrentPatient();
    }, [loadPatientProfile]);

    // Run this work when the listed values change.
    useEffect(() => {
        if (user?.role !== 'admin') return;

        // Load patient users.
        const loadPatientUsers = async () => {
            setLoadingUsers(true);

            setLinkError('');

            try {
                const response = await getUsers({ token, filters: { role: 'patient' } });

                setPatientUsers(response.users || []);
            } catch (err) {
                setLinkError(err.message || 'Unable to load patient user accounts');
            } finally {
                setLoadingUsers(false);
            }
        };

        loadPatientUsers();
    }, [token, user?.role]);

    // Handle handle delete.
    const handleDelete = async () => {
        const confirmed = window.confirm(
            'Delete this patient record? This action cannot be undone.',
        );

        if (!confirmed) return;

        try {
            await deletePatient(id, token);

            navigate('/patients', { replace: true });
        } catch (err) {
            setError(err.message || 'Unable to delete patient');
        }
    };

    // Handle handle link account.
    const handleLinkAccount = async () => {
        if (!selectedUserId) {
            setLinkError('Select a patient user account');

            setLinkSuccess('');

            return;
        }

        setLinking(true);

        setLinkError('');

        setLinkSuccess('');

        try {
            await linkPatientUser(id, selectedUserId, token);

            await loadPatientProfile();

            setLinkSuccess('Patient login account linked successfully.');
        } catch (err) {
            setLinkError(err.message || 'Unable to link patient user account');
        } finally {
            setLinking(false);
        }
    };

    if (loading)
        return (
            <main style={styles.page}>
                <div style={styles.card}>Loading patient...</div>
            </main>
        );

    if (error)
        return (
            <main style={styles.page}>
                <div style={styles.error}>{error}</div>
                <Link style={styles.secondaryLink} to="/patients">
                    Back
                </Link>
            </main>
        );

    if (!patient)
        return (
            <main style={styles.page}>
                <div style={styles.card}>Patient not found.</div>
            </main>
        );

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>{patient.patientId}</p>

                    <h1 style={styles.title}>{patient.fullName}</h1>

                    <p style={styles.subtitle}>Patient profile and emergency information.</p>
                </div>

                <div style={styles.actions}>
                    <Link style={styles.secondaryLink} to="/patients">
                        Back
                    </Link>

                    {(user?.role === 'admin' ||
                        user?.role === 'nurse' ||
                        user?.role === 'receptionist') && (
                        <Link style={styles.primaryLink} to={`/patients/${patient.id}/edit`}>
                            Edit
                        </Link>
                    )}

                    {user?.role === 'admin' && (
                        <button style={styles.deleteButton} onClick={handleDelete}>
                            Delete
                        </button>
                    )}
                </div>
            </section>

            <section style={styles.grid}>
                <Info label="Patient ID" value={patient.patientId} />

                <Info label="Date of Birth" value={formatDate(patient.dateOfBirth)} />

                <Info label="Gender" value={patient.gender} />

                <Info label="Phone" value={patient.phone} />

                {user?.role !== 'receptionist' && (
                    <Info label="Blood Group" value={patient.bloodGroup} />
                )}

                <Info label="Status" value={patient.status} />

                <Info label="Emergency Contact" value={patient.emergencyContactName} />

                <Info label="Emergency Phone" value={patient.emergencyContactPhone} />
            </section>

            <section style={styles.card}>
                <h2>Address</h2>
                <p>{patient.address}</p>
            </section>

            {user?.role === 'admin' && (
                <section style={styles.card}>
                    <h2>Link Patient Login Account</h2>

                    {patient.userAccount && (
                        <p style={styles.linkedAccount}>
                            Linked to {patient.userAccount.name} ({patient.userAccount.email})
                        </p>
                    )}

                    {linkSuccess && <div style={styles.success}>{linkSuccess}</div>}

                    {linkError && <div style={styles.error}>{linkError}</div>}

                    {loadingUsers ? (
                        <p>Loading patient user accounts...</p>
                    ) : (
                        <div style={styles.linkForm}>
                            <select
                                value={selectedUserId}
                                onChange={(event) => setSelectedUserId(event.target.value)}
                                style={styles.input}
                            >
                                <option value="">Select patient user account</option>

                                {patientUsers.map((patientUser) => (
                                    <option key={patientUser.id} value={patientUser.id}>
                                        {patientUser.name} ({patientUser.email})
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleLinkAccount}
                                disabled={linking}
                                style={styles.primaryButton}
                            >
                                {linking ? 'Linking Account' : 'Link Account'}
                            </button>
                        </div>
                    )}
                </section>
            )}

            {user?.role !== 'receptionist' && (
                <section style={styles.card}>
                    <h2>Allergies</h2>
                    <p>{patient.allergies || 'None recorded'}</p>
                </section>
            )}

            {user?.role !== 'receptionist' && (
                <section style={styles.card}>
                    <h2>Medical Notes</h2>
                    <p>{patient.medicalNotes || 'No notes recorded'}</p>
                </section>
            )}
        </main>
    );
};

// Show the info interface.
const Info = ({ label, value }) => (
    <article style={styles.infoCard}>
        <span style={styles.infoLabel}>{label}</span>

        <strong style={styles.infoValue}>{value || 'N/A'}</strong>
    </article>
);

// Handle styles.
const styles = {
    page: { color: '#0f172a' },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '18px',
        background: '#0f172a',
        color: '#fff',
        padding: '28px',
        borderRadius: '24px',
        marginBottom: '20px',
    },

    kicker: { margin: 0, color: '#0e7490', fontWeight: 800, textTransform: 'uppercase' },

    title: { margin: '8px 0', fontSize: '34px' },

    subtitle: { margin: 0, color: '#64748b' },

    actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },

    primaryLink: {
        background: '#2563eb',
        color: '#fff',
        textDecoration: 'none',
        padding: '12px 16px',
        borderRadius: '12px',
        fontWeight: 800,
    },

    secondaryLink: {
        background: '#e2e8f0',
        color: '#0f172a',
        textDecoration: 'none',
        padding: '12px 16px',
        borderRadius: '12px',
        fontWeight: 800,
        display: 'inline-block',
    },

    deleteButton: {
        border: 'none',
        background: '#ef4444',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '12px',
        fontWeight: 800,
        cursor: 'pointer',
    },

    primaryButton: {
        border: 'none',
        background: '#2563eb',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '12px',
        fontWeight: 800,
        cursor: 'pointer',
    },

    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '18px',
    },

    infoCard: {
        background: '#fff',
        borderRadius: '16px',
        padding: '18px',
        boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },

    infoLabel: { color: '#64748b', fontWeight: 700 },

    infoValue: { color: '#0f172a', fontSize: '18px' },

    card: {
        background: '#fff',
        borderRadius: '18px',
        padding: '22px',
        boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
        marginBottom: '18px',
        color: '#334155',
    },

    error: {
        background: '#fee2e2',
        color: '#991b1b',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '16px',
        fontWeight: 700,
    },

    success: {
        background: '#dcfce7',
        color: '#166534',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '16px',
        fontWeight: 700,
    },

    linkedAccount: {
        background: '#eff6ff',
        color: '#1e40af',
        borderRadius: '12px',
        padding: '12px',
        fontWeight: 700,
    },

    linkForm: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },

    input: {
        minWidth: '280px',
        flex: '1 1 280px',
        padding: '12px',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
    },
};

export default PatientProfilePage;
