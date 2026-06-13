import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAppointmentById, updateAppointment } from '../../services/appointmentService';
import { createPageStyles as styles } from '../shared/createPageStyles';

const toDateTimeInput = (value) => value ? new Date(value).toISOString().slice(0, 16) : '';

const AppointmentEditPage = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ department: '', appointmentDate: '', reason: '', status: 'scheduled' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadAppointment = async () => {
            try {
                const { appointment } = await getAppointmentById(id, token);
                setFormData({
                    department: appointment.department || '',
                    appointmentDate: toDateTimeInput(appointment.appointmentDate),
                    reason: appointment.reason || '',
                    status: appointment.status || 'scheduled',
                });
            } catch (err) {
                setError(err.message || 'Unable to load appointment');
            } finally {
                setLoading(false);
            }
        };
        loadAppointment();
    }, [id, token]);

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await updateAppointment(id, formData, token);
            navigate('/appointments');
        } catch (err) {
            setError(err.message || 'Unable to update appointment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <main style={styles.page}><div style={styles.notice}>Loading appointment.</div></main>;

    return <main style={styles.page}>
        <section style={styles.header}><div><p style={styles.kicker}>Appointment Management</p><h1 style={styles.title}>Update Appointment</h1><p style={styles.subtitle}>Reschedule, update, or cancel this appointment.</p></div><Link style={styles.secondaryLink} to="/appointments">Appointments</Link></section>
        {error && <div style={styles.error}>{error}</div>}
        <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.grid}>
                <label style={styles.label}>Department<input style={styles.input} name="department" value={formData.department} onChange={handleChange} required /></label>
                <label style={styles.label}>Appointment Date and Time<input style={styles.input} type="datetime-local" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required /></label>
                <label style={styles.label}>Status<select style={styles.input} name="status" value={formData.status} onChange={handleChange}><option value="requested">Requested</option><option value="pending_confirmation">Pending Confirmation</option><option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option><option value="paid">Paid</option><option value="checked_in">Checked In</option><option value="in_consultation">In Consultation</option><option value="pending_patient_decision">Pending Patient Decision</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option></select></label>
            </div>
            <label style={styles.label}>Reason<textarea style={styles.textarea} name="reason" value={formData.reason} onChange={handleChange} /></label>
            <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Appointment'}</button>
        </form>
    </main>;
};

export default AppointmentEditPage;
