import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createMedicalRecord } from '../../services/medicalRecordService';
import { getPatients } from '../../services/patientService';
import { getUsers } from '../../services/userService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const getUserLabel = (user) => `${user.name || 'Unnamed User'} (${user.email})`;

const MedicalRecordCreatePage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({ patient: '', doctor: '', appointment: '', chiefComplaint: '', diagnosis: '', consultationNotes: '', followUpDate: '', status: 'open', temperature: '', bloodPressure: '', pulse: '', respiratoryRate: '', oxygenSaturation: '', weight: '' });
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const loadPatients = useCallback(async () => {
        setLoadingPatients(true);
        try {
            const requests = [getPatients({ token, limit: 100 })];
            if (user?.role === 'admin') requests.push(getUsers({ token, filters: { role: 'doctor' } }));

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

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setError('');

        const payload = {
            patient: formData.patient,
            appointment: getOptionalValue(formData.appointment),
            chiefComplaint: getOptionalValue(formData.chiefComplaint),
            diagnosis: getOptionalValue(formData.diagnosis),
            consultationNotes: getOptionalValue(formData.consultationNotes),
            followUpDate: getOptionalValue(formData.followUpDate),
            status: formData.status,
            vitalSigns: {
                temperature: formData.temperature,
                bloodPressure: formData.bloodPressure,
                pulse: formData.pulse,
                respiratoryRate: formData.respiratoryRate,
                oxygenSaturation: formData.oxygenSaturation,
                weight: formData.weight,
            },
        };

        if (user?.role === 'admin') payload.doctor = formData.doctor;

        try {
            await createMedicalRecord(payload, token);
            setSuccess('Medical record created successfully.');
            navigate('/medical-records');
        } catch (err) {
            setError(err.message || 'Unable to create medical record');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Clinical Documentation</p>
                    <h1 style={styles.title}>Create Medical Record</h1>
                    <p style={styles.subtitle}>Record consultation details, diagnosis, vital signs, and follow-up information.</p>
                </div>
                <div style={styles.actions}>
                    <Link style={styles.secondaryLink} to="/medical-records">Medical Records</Link>
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
                    {user?.role === 'admin' && (
                        <label style={styles.label}>Select Doctor
                            <select style={styles.input} name="doctor" value={formData.doctor} onChange={handleChange} required>
                                <option value="">Select doctor</option>
                                {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{getUserLabel(doctor)}</option>)}
                            </select>
                        </label>
                    )}
                    <label style={styles.label}>Related Appointment
                        <input style={styles.input} name="appointment" value={formData.appointment} onChange={handleChange} placeholder="Optional linked appointment reference" />
                    </label>
                    <label style={styles.label}>Follow Up Date
                        <input style={styles.input} type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
                    </label>
                    <label style={styles.label}>Status
                        <select style={styles.input} name="status" value={formData.status} onChange={handleChange}>
                            <option value="open">Open</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </label>
                </div>
                <label style={styles.label}>Chief Complaint
                    <textarea style={styles.textarea} name="chiefComplaint" value={formData.chiefComplaint} onChange={handleChange} />
                </label>
                <label style={styles.label}>Diagnosis
                    <textarea style={styles.textarea} name="diagnosis" value={formData.diagnosis} onChange={handleChange} />
                </label>
                <label style={styles.label}>Consultation Notes
                    <textarea style={styles.textarea} name="consultationNotes" value={formData.consultationNotes} onChange={handleChange} />
                </label>
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Vital Signs</h2>
                    <div style={styles.grid}>
                        <input style={styles.input} name="temperature" value={formData.temperature} onChange={handleChange} placeholder="Temperature" />
                        <input style={styles.input} name="bloodPressure" value={formData.bloodPressure} onChange={handleChange} placeholder="Blood pressure" />
                        <input style={styles.input} name="pulse" value={formData.pulse} onChange={handleChange} placeholder="Pulse" />
                        <input style={styles.input} name="respiratoryRate" value={formData.respiratoryRate} onChange={handleChange} placeholder="Respiratory rate" />
                        <input style={styles.input} name="oxygenSaturation" value={formData.oxygenSaturation} onChange={handleChange} placeholder="Oxygen saturation" />
                        <input style={styles.input} name="weight" value={formData.weight} onChange={handleChange} placeholder="Weight" />
                    </div>
                </section>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Medical Record...' : 'Create Medical Record'}</button>
            </form>
        </main>
    );
};

export default MedicalRecordCreatePage;
