import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatients } from '../../services/patientService';
import { createQueueEntry } from '../../services/queueService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const QueueCreatePage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({ patient: '', appointment: '', department: '', priority: 'normal' });
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const loadPatients = useCallback(async () => {
        setLoadingPatients(true);
        try {
            const response = await getPatients({ token, limit: 100 });
            setPatients(response.patients || []);
        } catch (err) {
            setError(err.message || 'Unable to load patients');
        } finally {
            setLoadingPatients(false);
        }
    }, [token]);

    useEffect(() => { loadPatients(); }, [loadPatients]);

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setError('');

        try {
            await createQueueEntry({
                patient: formData.patient,
                appointment: getOptionalValue(formData.appointment),
                department: formData.department,
                priority: formData.priority,
            }, token);
            setSuccess('Queue entry created successfully.');
            navigate('/queue');
        } catch (err) {
            setError(err.message || 'Unable to create queue entry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Queue Management</p>
                    <h1 style={styles.title}>Create Queue Entry</h1>
                    <p style={styles.subtitle}>Add a patient to the service queue with department and priority details.</p>
                </div>
                <div style={styles.actions}>
                    <Link style={styles.secondaryLink} to="/queue">Queue</Link>
                    <Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link>
                </div>
            </section>

            {loadingPatients && <div style={styles.notice}>Loading patients.</div>}
            {success && <div style={styles.success}>{success}</div>}
            {error && <div style={styles.error}>{error}</div>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <label style={styles.label}>Patient
                        <select style={styles.input} name="patient" value={formData.patient} onChange={handleChange} required>
                            <option value="">Select patient</option>
                            {patients.map((patient) => <option key={getPatientId(patient)} value={getPatientId(patient)}>{getPatientLabel(patient)}</option>)}
                        </select>
                    </label>
                    <label style={styles.label}>Related Appointment
                        <input style={styles.input} name="appointment" value={formData.appointment} onChange={handleChange} placeholder="Optional linked appointment reference" />
                    </label>
                    <label style={styles.label}>Department
                        <input style={styles.input} name="department" value={formData.department} onChange={handleChange} required />
                    </label>
                    <label style={styles.label}>Priority
                        <select style={styles.input} name="priority" value={formData.priority} onChange={handleChange}>
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </label>
                </div>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Queue Entry...' : 'Create Queue Entry'}</button>
            </form>
        </main>
    );
};

export default QueueCreatePage;
