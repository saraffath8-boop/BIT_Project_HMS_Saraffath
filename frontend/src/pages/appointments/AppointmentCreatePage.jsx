import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createAppointment } from '../../services/appointmentService';
import { getPatients } from '../../services/patientService';
import { getUsers } from '../../services/userService';
import { createPageStyles as styles } from '../shared/createPageStyles';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';

const getUserLabel = (user) => `${user.name || 'Unnamed User'} (${user.email})`;

const AppointmentCreatePage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({ patient: '', doctor: '', department: '', appointmentDate: '', reason: '', status: 'scheduled' });
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const loadPatients = useCallback(async () => {
        setLoadingPatients(true);
        try {
            const [patientResponse, doctorResponse] = await Promise.all([
                getPatients({ token, limit: 100 }),
                getUsers({ token, role: 'doctor' }),
            ]);
            setPatients(patientResponse.patients || []);
            setDoctors(doctorResponse.users || []);
        } catch (err) {
            setError(err.message || 'Unable to load patients');
        } finally {
            setLoadingPatients(false);
        }
    }, [token]);

    useEffect(() => { loadPatients(); }, [loadPatients]);

    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess('');
        setError('');

        try {
            await createAppointment({
                patient: formData.patient,
                doctor: formData.doctor,
                department: formData.department,
                appointmentDate: formData.appointmentDate,
                reason: getOptionalValue(formData.reason),
                status: formData.status,
            }, token);
            setSuccess('Appointment created successfully.');
            navigate('/appointments');
        } catch (err) {
            setError(err.message || 'Unable to create appointment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Appointment Management</p>
                    <h1 style={styles.title}>Create Appointment</h1>
                    <p style={styles.subtitle}>Create a scheduled patient visit with a department and assigned doctor.</p>
                </div>
                <div style={styles.actions}>
                    <Link style={styles.secondaryLink} to="/appointments">Appointments</Link>
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
                    <label style={styles.label}>Doctor
                        <select style={styles.input} name="doctor" value={formData.doctor} onChange={handleChange} required>
                            <option value="">Select doctor</option>
                            {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{getUserLabel(doctor)}</option>)}
                        </select>
                    </label>
                    <label style={styles.label}>Department
                        <input style={styles.input} name="department" value={formData.department} onChange={handleChange} required />
                    </label>
                    <label style={styles.label}>Appointment Date and Time
                        <input style={styles.input} type="datetime-local" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required />
                    </label>
                    <label style={styles.label}>Status
                        <select style={styles.input} name="status" value={formData.status} onChange={handleChange}>
                            <option value="scheduled">Scheduled</option>
                            <option value="checked_in">Checked In</option>
                            <option value="in_consultation">In Consultation</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No Show</option>
                        </select>
                    </label>
                </div>
                <label style={styles.label}>Reason
                    <textarea style={styles.textarea} name="reason" value={formData.reason} onChange={handleChange} />
                </label>
                <button style={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? 'Creating Appointment...' : 'Create Appointment'}</button>
            </form>
        </main>
    );
};

export default AppointmentCreatePage;
