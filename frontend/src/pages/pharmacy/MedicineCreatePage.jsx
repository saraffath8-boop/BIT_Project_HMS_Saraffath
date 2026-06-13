import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createMedicine } from '../../services/medicineService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getNumberValue, getOptionalValue } from '../shared/formHelpers';

const MedicineCreatePage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', sku: '', category: '', manufacturer: '', unitPrice: '', stockQuantity: '0', reorderLevel: '10', expiryDate: '', status: 'active' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setError('');
        try {
            await createMedicine({
                name: formData.name,
                sku: formData.sku,
                category: getOptionalValue(formData.category),
                manufacturer: getOptionalValue(formData.manufacturer),
                unitPrice: getNumberValue(formData.unitPrice),
                stockQuantity: getNumberValue(formData.stockQuantity),
                reorderLevel: getNumberValue(formData.reorderLevel),
                expiryDate: getOptionalValue(formData.expiryDate),
                status: formData.status,
            }, token);
            setSuccess('Medicine created successfully.');
            navigate('/pharmacy');
        } catch (err) {
            setError(err.message || 'Unable to create medicine');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div><p style={styles.kicker}>Pharmacy Management</p><h1 style={styles.title}>Create Medicine</h1><p style={styles.subtitle}>Add a medicine record with SKU, pricing, stock, and reorder details.</p></div>
                <div style={styles.actions}><Link style={styles.secondaryLink} to="/pharmacy">Pharmacy</Link><Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link></div>
            </section>
            {success && <div style={styles.success}>{success}</div>}
            {error && <div style={styles.error}>{error}</div>}
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <label style={styles.label}>Medicine Name<input style={styles.input} name="name" value={formData.name} onChange={handleChange} required /></label>
                    <label style={styles.label}>SKU<input style={styles.input} name="sku" value={formData.sku} onChange={handleChange} required /></label>
                    <label style={styles.label}>Category<input style={styles.input} name="category" value={formData.category} onChange={handleChange} /></label>
                    <label style={styles.label}>Manufacturer<input style={styles.input} name="manufacturer" value={formData.manufacturer} onChange={handleChange} /></label>
                    <label style={styles.label}>Unit Price<input style={styles.input} type="number" min="0" step="0.01" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required /></label>
                    <label style={styles.label}>Stock Quantity<input style={styles.input} type="number" min="0" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required /></label>
                    <label style={styles.label}>Reorder Level<input style={styles.input} type="number" min="0" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required /></label>
                    <label style={styles.label}>Expiry Date<input style={styles.input} type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} /></label>
                    <label style={styles.label}>Status<select style={styles.input} name="status" value={formData.status} onChange={handleChange}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                </div>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Medicine...' : 'Create Medicine'}</button>
            </form>
        </main>
    );
};

export default MedicineCreatePage;
