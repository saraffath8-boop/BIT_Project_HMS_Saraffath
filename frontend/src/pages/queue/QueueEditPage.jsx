import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getQueueEntryById, updateQueueEntry } from '../../services/queueService';
import { createPageStyles as styles } from '../shared/createPageStyles';

const QueueEditPage = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ department: '', priority: 'normal', status: 'waiting' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadQueueEntry = async () => {
            try {
                const { queueEntry } = await getQueueEntryById(id, token);
                setFormData({
                    department: queueEntry.department || '',
                    priority: queueEntry.priority || 'normal',
                    status: queueEntry.status || 'waiting',
                });
            } catch (err) {
                setError(err.message || 'Unable to load queue entry');
            } finally {
                setLoading(false);
            }
        };
        loadQueueEntry();
    }, [id, token]);

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await updateQueueEntry(id, formData, token);
            navigate('/queue');
        } catch (err) {
            setError(err.message || 'Unable to update queue entry');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <main style={styles.page}><div style={styles.notice}>Loading queue entry.</div></main>;

    return <main style={styles.page}>
        <section style={styles.header}><div><p style={styles.kicker}>Queue Management</p><h1 style={styles.title}>Update Queue Entry</h1><p style={styles.subtitle}>Manage department, priority, and service status.</p></div><Link style={styles.secondaryLink} to="/queue">Queue</Link></section>
        {error && <div style={styles.error}>{error}</div>}
        <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.grid}>
                <label style={styles.label}>Department<input style={styles.input} name="department" value={formData.department} onChange={handleChange} required /></label>
                <label style={styles.label}>Priority<select style={styles.input} name="priority" value={formData.priority} onChange={handleChange}><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option></select></label>
                <label style={styles.label}>Status<select style={styles.input} name="status" value={formData.status} onChange={handleChange}><option value="waiting">Waiting</option><option value="called">Called</option><option value="in_service">In Service</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
            </div>
            <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Queue Entry'}</button>
        </form>
    </main>;
};

export default QueueEditPage;
