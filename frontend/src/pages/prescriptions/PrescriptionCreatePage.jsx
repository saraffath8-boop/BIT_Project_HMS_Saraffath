import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatients } from '../../services/patientService';
import { createPrescription } from '../../services/prescriptionService';
import { getUsers } from '../../services/userService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const emptyItem = { medicine: '', medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' };
const getUserLabel = (user) => `${user.name || 'Unnamed User'} (${user.email})`;

const PrescriptionCreatePage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({ patient: '', doctor: '', medicalRecord: '', notes: '' });
    const [items, setItems] = useState([{ ...emptyItem }]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const loadPatients = useCallback(async () => {
        setLoadingPatients(true);
        try {
            const requests = [getPatients({ token, limit: 100 })];
            if (user?.role !== 'doctor') requests.push(getUsers({ token, role: 'doctor' }));

            const [patientResponse, doctorResponse] = await Promise.all(requests);
            setPatients(patientResponse.patients || []);
            setDoctors(doctorResponse?.users || []);
        } catch (err) {
            setError(err.message || 'Unable to load patients');
        } finally {
            setLoadingPatients(false);
        }
    }, [token, user?.role]);

    useEffect(() => { loadPatients(); }, [loadPatients]);

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleItemChange = (index, event) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, [event.target.name]: event.target.value } : item));
    const addItem = () => setItems([...items, { ...emptyItem }]);
    const removeItem = (index) => setItems(items.filter((item, itemIndex) => itemIndex !== index));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setError('');

        const payload = {
            patient: formData.patient,
            medicalRecord: getOptionalValue(formData.medicalRecord),
            notes: getOptionalValue(formData.notes),
            items: items.map((item) => ({ ...item, medicine: getOptionalValue(item.medicine) })),
        };
        if (user?.role !== 'doctor') payload.doctor = formData.doctor;

        try {
            await createPrescription(payload, token);
            setSuccess('Prescription created successfully.');
            navigate('/prescriptions');
        } catch (err) {
            setError(err.message || 'Unable to create prescription');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Prescription Management</p>
                    <h1 style={styles.title}>Create Prescription</h1>
                    <p style={styles.subtitle}>Create a prescription with one or more medicines for a selected patient.</p>
                </div>
                <div style={styles.actions}>
                    <Link style={styles.secondaryLink} to="/prescriptions">Prescriptions</Link>
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
                    {user?.role !== 'doctor' && <label style={styles.label}>Doctor<select style={styles.input} name="doctor" value={formData.doctor} onChange={handleChange} required><option value="">Select doctor</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{getUserLabel(doctor)}</option>)}</select></label>}
                    <label style={styles.label}>Related Medical Record<input style={styles.input} name="medicalRecord" value={formData.medicalRecord} onChange={handleChange} placeholder="Optional linked medical record reference" /></label>
                </div>
                <label style={styles.label}>Notes<textarea style={styles.textarea} name="notes" value={formData.notes} onChange={handleChange} /></label>
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Prescription Items</h2>
                    {items.map((item, index) => (
                        <div key={index} style={styles.row}>
                            <input style={styles.input} name="medicine" value={item.medicine} onChange={(event) => handleItemChange(index, event)} placeholder="Optional inventory medicine reference" />
                            <input style={styles.input} name="medicineName" value={item.medicineName} onChange={(event) => handleItemChange(index, event)} placeholder="Medicine name" required />
                            <input style={styles.input} name="dosage" value={item.dosage} onChange={(event) => handleItemChange(index, event)} placeholder="Dosage" required />
                            <input style={styles.input} name="frequency" value={item.frequency} onChange={(event) => handleItemChange(index, event)} placeholder="Frequency" required />
                            <input style={styles.input} name="duration" value={item.duration} onChange={(event) => handleItemChange(index, event)} placeholder="Duration" required />
                            <input style={styles.input} name="instructions" value={item.instructions} onChange={(event) => handleItemChange(index, event)} placeholder="Instructions" />
                            {items.length > 1 && <button style={styles.secondaryButton} type="button" onClick={() => removeItem(index)}>Remove</button>}
                        </div>
                    ))}
                    <button style={styles.secondaryButton} type="button" onClick={addItem}>Add Medicine Row</button>
                </section>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Prescription...' : 'Create Prescription'}</button>
            </form>
        </main>
    );
};

export default PrescriptionCreatePage;
