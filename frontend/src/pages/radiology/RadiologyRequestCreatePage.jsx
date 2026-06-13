import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatients } from '../../services/patientService';
import { createRadiologyRequest } from '../../services/radiologyRequestService';
import { getUsers } from '../../services/userService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const getUserLabel = (user) => `${user.name || 'Unnamed User'} (${user.email})`;

const RadiologyRequestCreatePage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({ patient: '', doctor: '', medicalRecord: '', scanType: '', bodyPart: '', clinicalReason: '', scheduledAt: '' });
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const loadPatients = useCallback(async () => { setLoadingPatients(true); try { const requests = [getPatients({ token, limit: 100 })]; if (user?.role !== 'doctor') requests.push(getUsers({ token, role: 'doctor' })); const [patientResponse, doctorResponse] = await Promise.all(requests); setPatients(patientResponse.patients || []); setDoctors(doctorResponse?.users || []); } catch (err) { setError(err.message || 'Unable to load patients'); } finally { setLoadingPatients(false); } }, [token, user?.role]);
    useEffect(() => { loadPatients(); }, [loadPatients]);
    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleSubmit = async (event) => { event.preventDefault(); setSubmitting(true); setSuccess(''); setError(''); const payload = { patient: formData.patient, medicalRecord: getOptionalValue(formData.medicalRecord), scanType: formData.scanType, bodyPart: getOptionalValue(formData.bodyPart), clinicalReason: getOptionalValue(formData.clinicalReason), scheduledAt: getOptionalValue(formData.scheduledAt) }; if (user?.role !== 'doctor') payload.doctor = formData.doctor; try { await createRadiologyRequest(payload, token); setSuccess('Radiology request created successfully.'); navigate('/radiology'); } catch (err) { setError(err.message || 'Unable to create radiology request'); } finally { setSubmitting(false); } };
    return (
        <main style={styles.page}>
            <section style={styles.header}><div><p style={styles.kicker}>Radiology Management</p><h1 style={styles.title}>Create Radiology Request</h1><p style={styles.subtitle}>Request imaging for a selected patient with scan and scheduling details.</p></div><div style={styles.actions}><Link style={styles.secondaryLink} to="/radiology">Radiology</Link><Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link></div></section>
            {loadingPatients && <div style={styles.notice}>Loading patients.</div>}{success && <div style={styles.success}>{success}</div>}{error && <div style={styles.error}>{error}</div>}
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <label style={styles.label}>Patient<select style={styles.input} name="patient" value={formData.patient} onChange={handleChange} required><option value="">Select patient</option>{patients.map((patient) => <option key={getPatientId(patient)} value={getPatientId(patient)}>{getPatientLabel(patient)}</option>)}</select></label>
                    {user?.role !== 'doctor' && <label style={styles.label}>Doctor<select style={styles.input} name="doctor" value={formData.doctor} onChange={handleChange} required><option value="">Select doctor</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{getUserLabel(doctor)}</option>)}</select></label>}
                    <label style={styles.label}>Related Medical Record<input style={styles.input} name="medicalRecord" value={formData.medicalRecord} onChange={handleChange} placeholder="Optional linked medical record reference" /></label>
                    <label style={styles.label}>Scan Type<input style={styles.input} name="scanType" value={formData.scanType} onChange={handleChange} required /></label>
                    <label style={styles.label}>Body Part<input style={styles.input} name="bodyPart" value={formData.bodyPart} onChange={handleChange} /></label>
                    <label style={styles.label}>Scheduled Date and Time<input style={styles.input} type="datetime-local" name="scheduledAt" value={formData.scheduledAt} onChange={handleChange} /></label>
                </div>
                <label style={styles.label}>Clinical Reason<textarea style={styles.textarea} name="clinicalReason" value={formData.clinicalReason} onChange={handleChange} /></label>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Radiology Request...' : 'Create Radiology Request'}</button>
            </form>
        </main>
    );
};
export default RadiologyRequestCreatePage;
