// This file contains the patient create page interface.

import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    bloodGroupOptions,
    patientGenderOptions,
    patientSchema,
    patientStatusOptions,
} from '../../schemas/patientSchema';
import { createPatient } from '../../services/patientService';

// Handle defaults.
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

export default function PatientCreatePage() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(patientSchema), defaultValues: defaults });

    // Handle submit.
    const submit = async (formData) => {
        setError('');
        try {
            const payload =
                user?.role === 'receptionist'
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
            const response = await createPatient(payload, token);
            navigate(`/patients/${response.patient.id}`, { replace: true });
        } catch (err) {
            setError(err.message || 'Unable to create patient');
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Patient Management</p>
                    <h1 style={styles.title}>Add Patient</h1>
                    <p style={styles.subtitle}>
                        Create a new patient record with an automatically generated patient ID.
                    </p>
                </div>
                <Link style={styles.secondaryLink} to="/patients">
                    Back to Patients
                </Link>
            </section>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit(submit)} style={styles.formCard}>
                <div style={styles.grid}>
                    <Field label="Full Name" error={errors.fullName?.message}>
                        <input style={styles.input} {...register('fullName')} />
                    </Field>
                    <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                        <input style={styles.input} type="date" {...register('dateOfBirth')} />
                    </Field>
                    <Field label="Gender" error={errors.gender?.message}>
                        <Select {...register('gender')}>
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
                    {user?.role !== 'receptionist' && (
                        <Field label="Blood Group" error={errors.bloodGroup?.message}>
                            <Select {...register('bloodGroup')}>
                                {bloodGroupOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    )}
                    {user?.role !== 'receptionist' && (
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
                {user?.role !== 'receptionist' && (
                    <Field label="Allergies" error={errors.allergies?.message}>
                        <textarea style={styles.textarea} {...register('allergies')} />
                    </Field>
                )}
                {user?.role !== 'receptionist' && (
                    <Field label="Medical Notes" error={errors.medicalNotes?.message}>
                        <textarea style={styles.textarea} {...register('medicalNotes')} />
                    </Field>
                )}
                <button style={styles.submitButton} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Create Patient'}
                </button>
            </form>
        </main>
    );
}

// Handle select.
const Select = forwardRef(function Select(props, ref) {
    return <select ref={ref} style={styles.input} {...props} />;
});
// Show the field interface.
const Field = ({ label, error, children }) => (
    <label style={styles.label}>
        {label}
        {children}
        {error && <span style={styles.fieldError}>{error}</span>}
    </label>
);
// Handle styles.
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
