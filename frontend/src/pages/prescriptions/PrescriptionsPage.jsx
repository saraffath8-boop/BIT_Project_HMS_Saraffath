import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPrescriptions, updatePrescription } from '../../services/prescriptionService';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';

const statusLabels = {
    pending: 'Pending',
    partially_issued: 'Partially Issued',
    issued: 'Issued',
    cancelled: 'Cancelled',
};

const PrescriptionsPage = () => {
    const { token, user } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadPrescriptions = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getPrescriptions({ token });
            setPrescriptions(response.prescriptions || []);
        } catch (err) {
            setError(err.message || 'Unable to load prescriptions');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadPrescriptions(); }, [loadPrescriptions]);

    const handleStatusUpdate = async (prescription, status) => {
        setUpdatingId(prescription.id);
        setSuccess('');
        setError('');

        try {
            const response = await updatePrescription(prescription.id, { status }, token);
            const updatedPrescription = response.prescription;
            setPrescriptions((items) => items.map((item) => (item.id === updatedPrescription.id ? updatedPrescription : item)));
            setSuccess('Prescription status updated successfully.');
        } catch (err) {
            setError(err.message || 'Unable to update prescription status');
        } finally {
            setUpdatingId('');
        }
    };

    const canIssue = ['admin', 'pharmacist'].includes(user?.role);
    const canCreate = ['admin', 'doctor'].includes(user?.role);

    const renderActions = (prescription) => {
        if (!canIssue) return 'No actions available';
        if (prescription.status === 'cancelled') return 'Cancelled';

        const isUpdating = updatingId === prescription.id;

        if (prescription.status === 'issued') {
            return (
                <button
                    type="button"
                    style={styles.secondaryButton}
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate(prescription, 'pending')}
                >
                    Unmark Issued
                </button>
            );
        }

        return (
            <div style={styles.rowActions}>
                {prescription.status !== 'partially_issued' && (
                    <button
                        type="button"
                        style={styles.secondaryButton}
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(prescription, 'partially_issued')}
                    >
                        Mark Partial
                    </button>
                )}
                <button
                    type="button"
                    style={styles.primaryButton}
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate(prescription, 'issued')}
                >
                    Mark Issued
                </button>
                <button
                    type="button"
                    style={styles.dangerButton}
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate(prescription, 'cancelled')}
                >
                    Cancel
                </button>
            </div>
        );
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Prescription Management</p>
                    <h1 style={styles.title}>Prescriptions</h1>
                    <p style={styles.subtitle}>Track prescribed medicines, prescribing doctors, patient details, and issuing status.</p>
                </div>
                <div style={styles.actions}>
                    <button type="button" onClick={loadPrescriptions} style={styles.secondaryButton}>Refresh</button>
                    <Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link>
                    {canCreate && <Link style={styles.primaryLink} to="/prescriptions/new">Add Prescription</Link>}
                </div>
            </section>

            {loading && <div style={styles.notice}>Loading prescriptions.</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && success && <div style={styles.success}>{success}</div>}
            {!loading && !error && prescriptions.length === 0 && <div style={styles.notice}>No prescriptions are currently available.</div>}

            {!loading && !error && prescriptions.length > 0 && (
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Patient</th>
                                <th style={styles.th}>Doctor</th>
                                <th style={styles.th}>Medicines</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Patient Decision</th>
                                <th style={styles.th}>Created</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.map((prescription) => (
                                <tr key={prescription.id}>
                                    <td style={styles.td}>{getPersonName(prescription.patient)}</td>
                                    <td style={styles.td}>{getPersonName(prescription.doctor)}</td>
                                    <td style={styles.td}>{prescription.items?.length || 0} item(s)</td>
                                    <td style={styles.td}>{statusLabels[prescription.status] || prescription.status}</td>
                                    <td style={styles.td}>{prescription.patientDecisionStatus?.replaceAll('_', ' ') || 'Not required'}</td>
                                    <td style={styles.td}>{formatDateTime(prescription.createdAt)}</td>
                                    <td style={styles.td}>{renderActions(prescription)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
    rowActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    secondaryLink: { textDecoration: 'none', border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff', padding: '10px 14px', borderRadius: '10px', fontWeight: 700 },
    primaryLink: { textDecoration: 'none', border: '1px solid #2563eb', color: '#ffffff', background: '#2563eb', padding: '10px 14px', borderRadius: '10px', fontWeight: 700 },
    secondaryButton: { border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff', padding: '10px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' },
    primaryButton: { border: '1px solid #2563eb', color: '#ffffff', background: '#2563eb', padding: '10px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' },
    dangerButton: { border: '1px solid #dc2626', color: '#ffffff', background: '#dc2626', padding: '10px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' },
    notice: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', color: '#475569' },
    success: { background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px', color: '#166534', marginBottom: '16px' },
    error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '18px', color: '#991b1b' },
    tableWrap: { overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '14px', background: '#f1f5f9', fontSize: '13px', color: '#334155' },
    td: { padding: '14px', borderTop: '1px solid #e2e8f0', color: '#334155', verticalAlign: 'top' },
};

export default PrescriptionsPage;
