import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createFeedback, getFeedbackEntries } from '../../services/feedbackService';

const FeedbackPage = () => {
    const { token, user } = useAuth();
    const [feedbackEntries, setFeedbackEntries] = useState([]);
    const [formData, setFormData] = useState({ category: 'feedback', subject: '', message: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadFeedback = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getFeedbackEntries({ token });
            setFeedbackEntries(response.feedbackEntries || []);
        } catch (err) {
            setError(err.message || 'Unable to load feedback entries');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadFeedback();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [loadFeedback]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await createFeedback(formData, token);
            setFormData({ category: 'feedback', subject: '', message: '' });
            setSuccess('Feedback submitted successfully.');
            await loadFeedback();
        } catch (err) {
            setError(err.message || 'Unable to submit feedback');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Feedback and Complaints</p>
                    <h1 style={styles.title}>Feedback</h1>
                    <p style={styles.subtitle}>Submit feedback, review complaint status, and track administrative responses.</p>
                </div>
                <Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link>
            </section>

            {user?.role === 'patient' && (
                <form onSubmit={handleSubmit} style={styles.card}>
                    <h2 style={styles.sectionTitle}>Submit Feedback</h2>
                    <label style={styles.label}>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                        <option value="feedback">Feedback</option>
                        <option value="complaint">Complaint</option>
                        <option value="service_request">Service Request</option>
                    </select>
                    <label style={styles.label}>Subject</label>
                    <input name="subject" value={formData.subject} onChange={handleChange} style={styles.input} required />
                    <label style={styles.label}>Message</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} style={styles.textarea} required />
                    <button type="submit" disabled={saving} style={styles.primaryButton}>{saving ? 'Submitting' : 'Submit Feedback'}</button>
                </form>
            )}

            {success && <div style={styles.notice}>{success}</div>}
            {loading && <div style={styles.notice}>Loading feedback entries.</div>}
            {!loading && error && <div style={styles.error}>{error}</div>}
            {!loading && !error && feedbackEntries.length === 0 && <div style={styles.notice}>No feedback entries are currently available.</div>}

            {!loading && !error && feedbackEntries.length > 0 && (
                <div style={styles.list}>
                    {feedbackEntries.map((entry) => (
                        <article key={entry.id} style={styles.card}>
                            <h2 style={styles.sectionTitle}>{entry.subject}</h2>
                            <p style={styles.meta}>{entry.category} · {entry.status}</p>
                            <p style={styles.bodyText}>{entry.message}</p>
                            {entry.response && <p style={styles.response}>Response: {entry.response}</p>}
                        </article>
                    ))}
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
    secondaryLink: { textDecoration: 'none', border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff', padding: '10px 14px', borderRadius: '10px', fontWeight: 700 },
    card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', marginBottom: '16px' },
    sectionTitle: { margin: '0 0 8px', fontSize: '20px' },
    label: { display: 'block', fontWeight: 700, marginTop: '12px', marginBottom: '6px' },
    input: { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px' },
    textarea: { width: '100%', minHeight: '120px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '10px' },
    primaryButton: { marginTop: '14px', border: 'none', background: '#2563eb', color: '#ffffff', padding: '10px 14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' },
    notice: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', color: '#475569', marginBottom: '16px' },
    error: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '18px', color: '#991b1b', marginBottom: '16px' },
    list: { display: 'grid', gap: '12px' },
    meta: { margin: '0 0 10px', color: '#64748b', textTransform: 'capitalize' },
    bodyText: { margin: 0, color: '#334155' },
    response: { margin: '12px 0 0', color: '#166534', fontWeight: 600 },
};

export default FeedbackPage;
