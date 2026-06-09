import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createInventoryItem } from '../../services/inventoryService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getNumberValue, getOptionalValue } from '../shared/formHelpers';

const InventoryCreatePage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', itemCode: '', category: 'other', unit: '', stockQuantity: '0', reorderLevel: '10', supplier: '', location: '', status: 'active' });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleSubmit = async (event) => { event.preventDefault(); setSubmitting(true); setSuccess(''); setError(''); try { await createInventoryItem({ name: formData.name, itemCode: formData.itemCode, category: formData.category, unit: formData.unit, stockQuantity: getNumberValue(formData.stockQuantity), reorderLevel: getNumberValue(formData.reorderLevel), supplier: getOptionalValue(formData.supplier), location: getOptionalValue(formData.location), status: formData.status }, token); setSuccess('Inventory item created successfully.'); navigate('/inventory'); } catch (err) { setError(err.message || 'Unable to create inventory item'); } finally { setSubmitting(false); } };
    return (
        <main style={styles.page}>
            <section style={styles.header}><div><p style={styles.kicker}>Inventory Management</p><h1 style={styles.title}>Create Inventory Item</h1><p style={styles.subtitle}>Add a hospital supply or equipment item with stock and location details.</p></div><div style={styles.actions}><Link style={styles.secondaryLink} to="/inventory">Inventory</Link><Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link></div></section>
            {success && <div style={styles.success}>{success}</div>}{error && <div style={styles.error}>{error}</div>}
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <label style={styles.label}>Item Name<input style={styles.input} name="name" value={formData.name} onChange={handleChange} required /></label>
                    <label style={styles.label}>Item Code<input style={styles.input} name="itemCode" value={formData.itemCode} onChange={handleChange} required /></label>
                    <label style={styles.label}>Category<select style={styles.input} name="category" value={formData.category} onChange={handleChange}><option value="medical_supply">Medical Supply</option><option value="equipment">Equipment</option><option value="laboratory">Laboratory</option><option value="radiology">Radiology</option><option value="office">Office</option><option value="other">Other</option></select></label>
                    <label style={styles.label}>Unit<input style={styles.input} name="unit" value={formData.unit} onChange={handleChange} required /></label>
                    <label style={styles.label}>Stock Quantity<input style={styles.input} type="number" min="0" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required /></label>
                    <label style={styles.label}>Reorder Level<input style={styles.input} type="number" min="0" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required /></label>
                    <label style={styles.label}>Supplier<input style={styles.input} name="supplier" value={formData.supplier} onChange={handleChange} /></label>
                    <label style={styles.label}>Location<input style={styles.input} name="location" value={formData.location} onChange={handleChange} /></label>
                    <label style={styles.label}>Status<select style={styles.input} name="status" value={formData.status} onChange={handleChange}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                </div>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Inventory Item...' : 'Create Inventory Item'}</button>
            </form>
        </main>
    );
};
export default InventoryCreatePage;
