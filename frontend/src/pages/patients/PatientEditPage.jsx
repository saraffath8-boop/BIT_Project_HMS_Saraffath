import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    bloodGroupOptions,
    normalizePatientFormData,
    patientGenderOptions,
    patientSchema,
    patientStatusOptions,
} from '../../schemas/patientSchema';
import { getPatientById, updatePatient } from '../../services/patientService';

const toDateInputValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const defaults = {
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: 'unknown',
    allergies: '',
    medicalNotes: '',
    status: 'active',
};

export default function PatientEditPage() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const isNurse = user?.role === 'nurse';
    const isReceptionist = user?.role === 'receptionist';
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(patientSchema), defaultValues: defaults });

    useEffect(() => {
        const loadPatient = async () => {
            try {
                const { patient } = await getPatientById(id, token);
                reset({
                    ...defaults,
                    ...normalizePatientFormData(patient),
                    dateOfBirth: toDateInputValue(patient.dateOfBirth),
                });
            } catch (err) {
                setError(err.message || 'Unable to load patient');
            } finally {
                setLoading(false);
            }
        };
        loadPatient();
    }, [id, reset, token]);

    const submit = async (formData) => {
        setError('');
        try {
            const payload = isNurse
                ? {
                      phone: formData.phone,
                      address: formData.address,
                      emergencyContactName: formData.emergencyContactName,
                      emergencyContactPhone: formData.emergencyContactPhone,
                      allergies: formData.allergies,
                      medicalNotes: formData.medicalNotes,
                      status: formData.status,
                  }
                : isReceptionist
                  ? {
                        fullName: formData.fullName,
                        dateOfBirth: formData.dateOfBirth,
                        gender: formData.gender,
                        phone: formData.phone,
                        address: formData.address,
                        emergencyContactName: formData.emergencyContactName,
                        emergencyContactPhone: formData.emergencyContactPhone,
                    }
                  : formData;
            const response = await updatePatient(id, payload, token);
            navigate(`/patients/${response.patient.id}`, { replace: true });
        } catch (err) {
            setError(err.message || 'Unable to update patient');
        }
    };

    if (loading)
        return (
            <main style={styles.page}>
                <div style={styles.card}>Loading patient...</div>
            </main>
        );
    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Patient Management</p>
                    <h1 style={styles.title}>Edit Patient</h1>
                    <p style={styles.subtitle}>
                        {isNurse
                            ? 'Nurses can update contact, status, allergies, and notes.'
                            : isReceptionist
                              ? 'Update basic patient and emergency contact details.'
                              : 'Update patient demographic and clinical summary fields.'}
                    </p>
                </div>
                <Link style={styles.secondaryLink} to={`/patients/${id}`}>
                    Back to Profile
                </Link>
            </section>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit(submit)} style={styles.formCard}>
                <div style={styles.grid}>
                    <Field label="Full Name" error={errors.fullName?.message}>
                        <input style={styles.input} readOnly={isNurse} {...register('fullName')} />
                    </Field>
                    <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                        <input
                            style={styles.input}
                            type="date"
                            readOnly={isNurse}
                            {...register('dateOfBirth')}
                        />
                    </Field>
                    <Field label="Gender" error={errors.gender?.message}>
                        <Select
                            aria-disabled={isNurse}
                            style={{ ...styles.input, pointerEvents: isNurse ? 'none' : 'auto' }}
                            {...register('gender')}
                        >
                            {patientGenderOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Phone Number" error={errors.phone?.message}>
                        <input
                            style={styles.input}
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            {...register('phone')}
                        />
                    </Field>
                    <Field
                        label="Emergency Contact Name"
                        error={errors.emergencyContactName?.message}
                    >
                        <input style={styles.input} {...register('emergencyContactName')} />
                    </Field>
                    <Field
                        label="Emergency Contact Phone"
                        error={errors.emergencyContactPhone?.message}
                    >
                        <input
                            style={styles.input}
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            {...register('emergencyContactPhone')}
                        />
                    </Field>
                    {!isReceptionist && (
                        <Field label="Blood Group" error={errors.bloodGroup?.message}>
                            <Select
                                aria-disabled={isNurse}
                                style={{
                                    ...styles.input,
                                    pointerEvents: isNurse ? 'none' : 'auto',
                                }}
                                {...register('bloodGroup')}
                            >
                                {bloodGroupOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    )}
                    {!isReceptionist && (
                        <Field label="Status" error={errors.status?.message}>
                            <Select {...register('status')}>
                                {patientStatusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    )}
                </div>
                <Field label="Address" error={errors.address?.message}>
                    <textarea style={styles.textarea} {...register('address')} />
                </Field>
                {!isReceptionist && (
                    <Field label="Allergies" error={errors.allergies?.message}>
                        <textarea style={styles.textarea} {...register('allergies')} />
                    </Field>
                )}
                {!isReceptionist && (
                    <Field label="Medical Notes" error={errors.medicalNotes?.message}>
                        <textarea style={styles.textarea} {...register('medicalNotes')} />
                    </Field>
                )}
                <button style={styles.submitButton} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </main>
    );
}

const Select = forwardRef(function Select(props, ref) {
    return <select ref={ref} style={styles.input} {...props} />;
});
const Field = ({ label, error, children }) => (
    <label style={styles.label}>
        {label}
        {children}
        {error && <span style={styles.fieldError}>{error}</span>}
    </label>
);
const styles = {
    page: { color: '#0f172a' },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '18px',
        background: '#0f172a',
        color: '#fff',
        padding: '28px',
        borderRadius: '24px',
        marginBottom: '20px',
    },
    kicker: { margin: 0, color: '#0e7490', fontWeight: 800, textTransform: 'uppercase' },
    title: { margin: '8px 0', fontSize: '34px' },
    subtitle: { margin: 0, color: '#64748b' },
    secondaryLink: {
        background: '#e2e8f0',
        color: '#0f172a',
        textDecoration: 'none',
        padding: '12px 16px',
        borderRadius: '12px',
        fontWeight: 800,
    },
    card: { background: '#fff', borderRadius: '18px', padding: '24px' },
    formCard: {
        background: '#fff',
        borderRadius: '22px',
        padding: '26px',
        boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
    },
    label: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        color: '#334155',
        fontWeight: 800,
    },
    input: {
        padding: '12px 14px',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        fontSize: '15px',
        background: '#fff',
    },
    textarea: {
        minHeight: '90px',
        padding: '12px 14px',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        fontSize: '15px',
        resize: 'vertical',
    },
    submitButton: {
        border: 'none',
        background: '#2563eb',
        color: '#fff',
        padding: '14px 18px',
        borderRadius: '12px',
        fontWeight: 800,
        cursor: 'pointer',
    },
    error: {
        background: '#fee2e2',
        color: '#991b1b',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '16px',
        fontWeight: 700,
    },
    fieldError: { color: '#dc2626', fontSize: '12px', fontWeight: 600 },
};
