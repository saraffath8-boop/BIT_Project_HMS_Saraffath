import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createLabRequest } from '../../services/labRequestService';
import { getPatients } from '../../services/patientService';
import { getUsers } from '../../services/userService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const getUserLabel = (user) => `${user.name || 'Unnamed User'} (${user.email})`;

const LabRequestCreatePage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({ patient: '', doctor: '', medicalRecord: '', testName: '', priority: 'routine' });
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
        }
        catch (err) { setError(err.message || 'Unable to load patients'); }
        finally { setLoadingPatients(false); }
    }, [token, user?.role]);
    useEffect(() => { loadPatients(); }, [loadPatients]);
    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleSubmit = async (event) => {
        event.preventDefault(); setSubmitting(true); setSuccess(''); setError('');
        const payload = { patient: formData.patient, medicalRecord: getOptionalValue(formData.medicalRecord), tests: [{ testName: formData.testName }], priority: formData.priority };
        if (user?.role !== 'doctor') payload.doctor = formData.doctor;
        try { await createLabRequest(payload, token); setSuccess('Lab request created successfully.'); navigate('/laboratory'); }
        catch (err) { setError(err.message || 'Unable to create lab request'); }
        finally { setSubmitting(false); }
    };
    return (
        <main style={styles.page}>
            <section style={styles.header}><div><p style={styles.kicker}>Laboratory Management</p><h1 style={styles.title}>Create Lab Request</h1><p style={styles.subtitle}>Request a laboratory test for a selected patient.</p></div><div style={styles.actions}><Link style={styles.secondaryLink} to="/laboratory">Laboratory</Link><Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link></div></section>
            {loadingPatients && <div style={styles.notice}>Loading patients.</div>}{success && <div style={styles.success}>{success}</div>}{error && <div style={styles.error}>{error}</div>}
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.grid}>
                    <label style={styles.label}>Patient<select style={styles.input} name="patient" value={formData.patient} onChange={handleChange} required><option value="">Select patient</option>{patients.map((patient) => <option key={getPatientId(patient)} value={getPatientId(patient)}>{getPatientLabel(patient)}</option>)}</select></label>
                    {user?.role !== 'doctor' && <label style={styles.label}>Doctor<select style={styles.input} name="doctor" value={formData.doctor} onChange={handleChange} required><option value="">Select doctor</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{getUserLabel(doctor)}</option>)}</select></label>}
                    <label style={styles.label}>Related Medical Record<input style={styles.input} name="medicalRecord" value={formData.medicalRecord} onChange={handleChange} placeholder="Optional linked medical record reference" /></label>
                    <label style={styles.label}>Test Name<input style={styles.input} name="testName" value={formData.testName} onChange={handleChange} required /></label>
                    <label style={styles.label}>Priority<select style={styles.input} name="priority" value={formData.priority} onChange={handleChange}><option value="routine">Routine</option><option value="urgent">Urgent</option></select></label>
                </div>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Lab Request...' : 'Create Lab Request'}</button>
            </form>
        </main>
    );
};
export default LabRequestCreatePage;
