// This file contains the prescriptions page interface.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPrescriptions, updatePrescription } from '../../services/prescriptionService';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { CollapsibleSection } from '../../components/ui/collapsible-section';

// Handle status labels.
const statusLabels = {
    pending: 'Pending',
    partially_issued: 'Partially Issued',
    issued: 'Distributed',
    cancelled: 'Cancelled',
};

// Show the prescriptions page interface.
const PrescriptionsPage = () => {
    const { token, user } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load prescriptions.
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

    // Run this work when the listed values change.
    useEffect(() => {
        loadPrescriptions();
    }, [loadPrescriptions]);

    // Handle handle status update.
    const handleStatusUpdate = async (prescription, status) => {
        setUpdatingId(prescription.id);
        setSuccess('');
        setError('');

        try {
            const response = await updatePrescription(prescription.id, { status }, token);
            const updatedPrescription = response.prescription;
            setPrescriptions((items) =>
                items.map((item) =>
                    item.id === updatedPrescription.id ? updatedPrescription : item,
                ),
            );
            setSuccess('Prescription status updated successfully.');
        } catch (err) {
            setError(err.message || 'Unable to update prescription status');
        } finally {
            setUpdatingId('');
        }
    };

    const canIssue = user?.role === 'pharmacist';
    const canCreate = user?.role === 'admin';
    const readyPrescriptions = prescriptions.filter(
        (prescription) =>
            prescription.paymentStatus === 'paid' &&
            prescription.status !== 'issued' &&
            prescription.status !== 'cancelled',
    );
    const distributedPrescriptions = prescriptions.filter(
        (prescription) => prescription.status === 'issued',
    );

    // Handle render actions.
    const renderActions = (prescription) => {
        if (!canIssue)
            return prescription.paymentStatus === 'paid'
                ? 'Sent to pharmacy'
                : 'Awaiting cashier payment';
        if (prescription.status === 'cancelled') return 'Cancelled';

        const isUpdating = updatingId === prescription.id;

        if (prescription.status === 'issued') return 'Distributed';

        return (
            <div style={styles.rowActions}>
                <button
                    type="button"
                    style={styles.primaryButton}
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate(prescription, 'issued')}
                >
                    Mark Distributed
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
                    <p style={styles.subtitle}>
                        {user?.role === 'pharmacist'
                            ? 'Paid prescriptions ready for distribution and completed distribution history.'
                            : 'View prescriptions created from diagnosis reports and their payment/distribution progress.'}
                    </p>
                </div>
                <div style={styles.actions}>
                    <button
                        type="button"
                        onClick={loadPrescriptions}
                        style={styles.secondaryButton}
                    >
                        Refresh
                    </button>
                    <Link style={styles.secondaryLink} to="/dashboard">
                        Dashboard
                    </Link>
                    {canCreate && (
                        <Link style={styles.primaryLink} to="/prescriptions/new">
                            Add Prescription
                        </Link>
                    )}
                </div>
            </section>

            {loading && <div style={styles.notice}>Loading prescriptions.</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && success && <div style={styles.success}>{success}</div>}
            {!loading && !error && prescriptions.length === 0 && (
                <div style={styles.notice}>No prescriptions are currently available.</div>
            )}

            {!loading && !error && user?.role === 'pharmacist' && prescriptions.length > 0 && (
                <div style={styles.sections}>
                    <PrescriptionSection
                        title="Ready to Distribute"
                        prescriptions={readyPrescriptions}
                        emptyMessage="No paid prescriptions are waiting for distribution."
                        action={(prescription) => (
                            <button
                                type="button"
                                style={styles.primaryButton}
                                disabled={updatingId === prescription.id}
                                onClick={() => handleStatusUpdate(prescription, 'issued')}
                            >
                                {updatingId === prescription.id
                                    ? 'Updating...'
                                    : 'Mark Distributed'}
                            </button>
                        )}
                    />
                    <PrescriptionSection
                        title="Distribution History"
                        prescriptions={distributedPrescriptions}
                        emptyMessage="No prescriptions have been distributed yet."
                        history
                    />
                </div>
            )}

            {!loading && !error && user?.role !== 'pharmacist' && prescriptions.length > 0 && (
                <CollapsibleSection title="Prescriptions" count={prescriptions.length}>
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Patient</th>
                                    <th style={styles.th}>Doctor</th>
                                    <th style={styles.th}>Medicines</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Payment</th>
                                    <th style={styles.th}>Workflow</th>
                                    <th style={styles.th}>Created</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescriptions.map((prescription) => (
                                    <tr key={prescription.id}>
                                        <td style={styles.td}>
                                            {getPersonName(prescription.patient)}
                                        </td>
                                        <td style={styles.td}>
                                            {getPersonName(prescription.doctor)}
                                        </td>
                                        <td style={styles.td}>
                                            {prescription.items?.length || 0} item(s)
                                        </td>
                                        <td style={styles.td}>
                                            {statusLabels[prescription.status] ||
                                                prescription.status}
                                        </td>
                                        <td style={styles.td}>
                                            {prescription.paymentStatus || 'unpaid'}
                                        </td>
                                        <td style={styles.td}>
                                            {prescription.status === 'issued'
                                                ? 'Distributed'
                                                : prescription.paymentStatus === 'paid'
                                                  ? 'Ready for pharmacist'
                                                  : 'Awaiting cashier payment'}
                                        </td>
                                        <td style={styles.td}>
                                            {formatDateTime(prescription.createdAt)}
                                        </td>
                                        <td style={styles.td}>{renderActions(prescription)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CollapsibleSection>
            )}
        </main>
    );
};

// Show the prescription section interface.
const PrescriptionSection = ({ title, prescriptions, emptyMessage, action, history = false }) => (
    <CollapsibleSection title={title} count={prescriptions.length}>
        {prescriptions.length === 0 && <div style={styles.notice}>{emptyMessage}</div>}
        {prescriptions.map((prescription) => (
            <article key={prescription.id} style={styles.prescriptionCard}>
                <div style={styles.prescriptionHeader}>
                    <div>
                        <span style={styles.label}>Patient</span>
                        <strong>{getPersonName(prescription.patient)}</strong>
                        <p style={styles.meta}>
                            {prescription.patient?.phone || 'Phone not recorded'}
                        </p>
                    </div>
                    <div>
                        <span style={styles.label}>Doctor</span>
                        <strong>{getPersonName(prescription.doctor)}</strong>
                        <p style={styles.meta}>Created {formatDateTime(prescription.createdAt)}</p>
                    </div>
                    {history && (
                        <div>
                            <span style={styles.label}>Distributed</span>
                            <strong>{formatDateTime(prescription.issuedAt)}</strong>
                            <p style={styles.meta}>By {getPersonName(prescription.issuedBy)}</p>
                        </div>
                    )}
                    {!history && action?.(prescription)}
                </div>
                {prescription.notes && (
                    <div style={styles.notes}>
                        <strong>Prescription notes:</strong> {prescription.notes}
                    </div>
                )}
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Medicine</th>
                                <th style={styles.th}>Dosage</th>
                                <th style={styles.th}>Frequency</th>
                                <th style={styles.th}>Duration</th>
                                <th style={styles.th}>Instructions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prescription.items || []).map((item) => (
                                <tr key={item._id || `${prescription.id}-${item.medicineName}`}>
                                    <td style={styles.td}>
                                        <strong>{item.medicineName}</strong>
                                    </td>
                                    <td style={styles.td}>{item.dosage}</td>
                                    <td style={styles.td}>{item.frequency}</td>
                                    <td style={styles.td}>{item.duration}</td>
                                    <td style={styles.td}>
                                        {item.instructions || 'No special instructions'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </article>
        ))}
    </CollapsibleSection>
);

// Handle styles.
const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '32px', color: '#0f172a' },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        alignItems: 'flex-start',
        marginBottom: '24px',
    },
    kicker: {
        margin: 0,
        color: '#2563eb',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '12px',
    },
    title: { margin: '8px 0', fontSize: '32px', fontWeight: 800 },
    subtitle: { margin: 0, color: '#475569', maxWidth: '680px' },
    actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    rowActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    secondaryLink: {
        textDecoration: 'none',
        border: '1px solid #cbd5e1',
        color: '#0f172a',
        background: '#ffffff',
        padding: '10px 14px',
        borderRadius: '10px',
        fontWeight: 700,
    },
    primaryLink: {
        textDecoration: 'none',
        border: '1px solid #2563eb',
        color: '#ffffff',
        background: '#2563eb',
        padding: '10px 14px',
        borderRadius: '10px',
        fontWeight: 700,
    },
    secondaryButton: {
        border: '1px solid #cbd5e1',
        color: '#0f172a',
        background: '#ffffff',
        padding: '10px 12px',
        borderRadius: '10px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    primaryButton: {
        border: '1px solid #2563eb',
        color: '#ffffff',
        background: '#2563eb',
        padding: '10px 12px',
        borderRadius: '10px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    dangerButton: {
        border: '1px solid #dc2626',
        color: '#ffffff',
        background: '#dc2626',
        padding: '10px 12px',
        borderRadius: '10px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    notice: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px',
        color: '#475569',
    },
    success: {
        background: '#ecfdf5',
        border: '1px solid #bbf7d0',
        borderRadius: '14px',
        padding: '18px',
        color: '#166534',
        marginBottom: '16px',
    },
    error: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '14px',
        padding: '18px',
        color: '#991b1b',
    },
    tableWrap: {
        overflowX: 'auto',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        padding: '14px',
        background: '#f1f5f9',
        fontSize: '13px',
        color: '#334155',
    },
    td: { padding: '14px', borderTop: '1px solid #e2e8f0', color: '#334155', verticalAlign: 'top' },
    sections: { display: 'grid', gap: '28px' },
    section: { display: 'grid', gap: '14px' },
    sectionTitle: { margin: 0, fontSize: '20px', fontWeight: 800 },
    count: { color: '#64748b', fontSize: '14px', fontWeight: 500 },
    prescriptionCard: {
        display: 'grid',
        gap: '16px',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#ffffff',
        padding: '18px',
    },
    prescriptionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '18px',
        flexWrap: 'wrap',
    },
    label: {
        display: 'block',
        marginBottom: '4px',
        color: '#64748b',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    meta: { margin: '4px 0 0', color: '#64748b', fontSize: '13px' },
    notes: {
        borderRadius: '10px',
        background: '#f8fafc',
        padding: '12px',
        color: '#334155',
        fontSize: '14px',
    },
};

export default PrescriptionsPage;
