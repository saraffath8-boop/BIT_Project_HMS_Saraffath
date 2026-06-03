import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createBill } from '../../services/billService';
import { getPatients } from '../../services/patientService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getNumberValue, getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const emptyItem = { description: '', category: 'other', quantity: '1', unitPrice: '0' };
const categories = ['consultation', 'medicine', 'laboratory', 'radiology', 'ward', 'procedure', 'other'];

const BillCreatePage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({ patient: '', appointment: '', discount: '0' });
    const [items, setItems] = useState([{ ...emptyItem }]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const loadPatients = useCallback(async () => { setLoadingPatients(true); try { const response = await getPatients({ token, limit: 100 }); setPatients(response.patients || []); } catch (err) { setError(err.message || 'Unable to load patients'); } finally { setLoadingPatients(false); } }, [token]);
    useEffect(() => { loadPatients(); }, [loadPatients]);
    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleItemChange = (index, event) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, [event.target.name]: event.target.value } : item));
    const addItem = () => setItems([...items, { ...emptyItem }]);
    const removeItem = (index) => setItems(items.filter((item, itemIndex) => itemIndex !== index));
    const handleSubmit = async (event) => { event.preventDefault(); setSubmitting(true); setSuccess(''); setError(''); try { await createBill({ patient: formData.patient, appointment: getOptionalValue(formData.appointment), discount: getNumberValue(formData.discount), items: items.map((item) => ({ ...item, quantity: getNumberValue(item.quantity), unitPrice: getNumberValue(item.unitPrice) })) }, token); setSuccess('Bill created successfully.'); navigate('/billing'); } catch (err) { setError(err.message || 'Unable to create bill'); } finally { setSubmitting(false); } };
    return (
        <main style={styles.page}>
            <section style={styles.header}><div><p style={styles.kicker}>Billing Management</p><h1 style={styles.title}>Create Bill</h1><p style={styles.subtitle}>Create a patient bill with service items and discount details.</p></div><div style={styles.actions}><Link style={styles.secondaryLink} to="/billing">Billing</Link><Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link></div></section>
            {loadingPatients && <div style={styles.notice}>Loading patients.</div>}{success && <div style={styles.success}>{success}</div>}{error && <div style={styles.error}>{error}</div>}
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <label style={styles.label}>Patient<select style={styles.input} name="patient" value={formData.patient} onChange={handleChange} required><option value="">Select patient</option>{patients.map((patient) => <option key={getPatientId(patient)} value={getPatientId(patient)}>{getPatientLabel(patient)}</option>)}</select></label>
                    <label style={styles.label}>Related Appointment<input style={styles.input} name="appointment" value={formData.appointment} onChange={handleChange} placeholder="Optional linked appointment reference" /></label>
                    <label style={styles.label}>Discount<input style={styles.input} type="number" min="0" step="0.01" name="discount" value={formData.discount} onChange={handleChange} /></label>
                </div>
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Bill Items</h2>
                    {items.map((item, index) => (
                        <div key={index} style={styles.row}>
                            <input style={styles.input} name="description" value={item.description} onChange={(event) => handleItemChange(index, event)} placeholder="Description" required />
                            <select style={styles.input} name="category" value={item.category} onChange={(event) => handleItemChange(index, event)}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                            <input style={styles.input} type="number" min="1" name="quantity" value={item.quantity} onChange={(event) => handleItemChange(index, event)} placeholder="Quantity" required />
                            <input style={styles.input} type="number" min="0" step="0.01" name="unitPrice" value={item.unitPrice} onChange={(event) => handleItemChange(index, event)} placeholder="Unit price" required />
                            {items.length > 1 && <button style={styles.secondaryButton} type="button" onClick={() => removeItem(index)}>Remove</button>}
                        </div>
                    ))}
                    <button style={styles.secondaryButton} type="button" onClick={addItem}>Add Bill Item</button>
                </section>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Bill...' : 'Create Bill'}</button>
            </form>
        </main>
    );
};
export default BillCreatePage;
