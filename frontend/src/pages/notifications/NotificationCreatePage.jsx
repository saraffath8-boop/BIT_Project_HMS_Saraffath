import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createNotification } from '../../services/notificationService';
import { getPatients } from '../../services/patientService';
import { getUsers } from '../../services/userService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const getUserLabel = (user) => `${user.name || 'Unnamed User'} (${user.email}) - ${user.role}`;

const NotificationCreatePage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ recipient: '', title: '', message: '', type: 'system', relatedPatient: '' });
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const loadPatients = useCallback(async () => { setLoadingPatients(true); try { const [patientResponse, userResponse] = await Promise.all([getPatients({ token, limit: 100 }), getUsers({ token })]); setPatients(patientResponse.patients || []); setUsers(userResponse.users || []); } catch (err) { setError(err.message || 'Unable to load patients'); } finally { setLoadingPatients(false); } }, [token]);
    useEffect(() => { loadPatients(); }, [loadPatients]);
    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleSubmit = async (event) => { event.preventDefault(); setSubmitting(true); setSuccess(''); setError(''); try { await createNotification({ recipient: formData.recipient, title: formData.title, message: formData.message, type: formData.type, relatedPatient: getOptionalValue(formData.relatedPatient) }, token); setSuccess('Notification created successfully.'); navigate('/notifications'); } catch (err) { setError(err.message || 'Unable to create notification'); } finally { setSubmitting(false); } };
    return (
        <main style={styles.page}>
            <section style={styles.header}><div><p style={styles.kicker}>Notifications</p><h1 style={styles.title}>Create Notification</h1><p style={styles.subtitle}>Send a notification to an existing user account.</p></div><div style={styles.actions}><Link style={styles.secondaryLink} to="/notifications">Notifications</Link><Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link></div></section>
            {loadingPatients && <div style={styles.notice}>Loading patients.</div>}{success && <div style={styles.success}>{success}</div>}{error && <div style={styles.error}>{error}</div>}
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <label style={styles.label}>Recipient User<select style={styles.input} name="recipient" value={formData.recipient} onChange={handleChange} required><option value="">Select user</option>{users.map((recipient) => <option key={recipient.id} value={recipient.id}>{getUserLabel(recipient)}</option>)}</select></label>
                    <label style={styles.label}>Type<select style={styles.input} name="type" value={formData.type} onChange={handleChange}><option value="appointment">Appointment</option><option value="billing">Billing</option><option value="laboratory">Laboratory</option><option value="radiology">Radiology</option><option value="pharmacy">Pharmacy</option><option value="system">System</option></select></label>
                    <label style={styles.label}>Related Patient<select style={styles.input} name="relatedPatient" value={formData.relatedPatient} onChange={handleChange}><option value="">No related patient</option>{patients.map((patient) => <option key={getPatientId(patient)} value={getPatientId(patient)}>{getPatientLabel(patient)}</option>)}</select></label>
                    <label style={styles.label}>Title<input style={styles.input} name="title" value={formData.title} onChange={handleChange} required /></label>
                </div>
                <label style={styles.label}>Message<textarea style={styles.textarea} name="message" value={formData.message} onChange={handleChange} required /></label>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Notification...' : 'Create Notification'}</button>
            </form>
        </main>
    );
};
export default NotificationCreatePage;
