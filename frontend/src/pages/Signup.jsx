import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { HeartPulse, UserRoundPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { getDashboardPath, useAuth } from '../context/AuthContext';
import { genderOptions, signupSchema } from '../schemas/userSchema';

export default function Signup() {
    const [error, setError] = useState('');
    const { isAuthenticated, loading, signup, user } = useAuth();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            nic: '',
            dob: '',
            gender: 'Other',
            password: '',
            address: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
        },
    });

    useEffect(() => {
        if (!loading && isAuthenticated && user)
            navigate(getDashboardPath(user.role), { replace: true });
    }, [isAuthenticated, loading, navigate, user]);

    const submit = async (formData) => {
        setError('');
        try {
            const signedUpUser = await signup(formData);
            navigate(getDashboardPath(signedUpUser.role), { replace: true });
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        }
    };

    return (
        <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
            <Card className="w-full max-w-2xl shadow-lg shadow-slate-200/60">
                <CardHeader>
                    <div className="mb-3 flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-xl bg-cyan-700 text-white">
                            <HeartPulse />
                        </span>
                        <span className="font-bold text-slate-900">MediCore</span>
                    </div>
                    <CardTitle className="text-2xl">Create patient account</CardTitle>
                    <CardDescription>
                        Register for secure access to your appointments, prescriptions, reports, and
                        bills.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-5">
                            {error}
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit(submit)} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="First Name" error={errors.firstName?.message}>
                                <Input {...register('firstName')} autoComplete="given-name" />
                            </Field>
                            <Field label="Last Name" error={errors.lastName?.message}>
                                <Input {...register('lastName')} autoComplete="family-name" />
                            </Field>
                            <Field label="Email Address" error={errors.email?.message}>
                                <Input {...register('email')} type="email" autoComplete="email" />
                            </Field>
                            <Field label="Phone Number" error={errors.phone?.message}>
                                <Input
                                    {...register('phone')}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    autoComplete="tel"
                                />
                            </Field>
                            <Field label="NIC" error={errors.nic?.message}>
                                <Input {...register('nic')} type="text" maxLength={12} />
                            </Field>
                            <Field label="Date of Birth" error={errors.dob?.message}>
                                <Input {...register('dob')} type="date" />
                            </Field>
                            <Field label="Gender" error={errors.gender?.message}>
                                <select
                                    {...register('gender')}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                >
                                    {genderOptions.map((gender) => (
                                        <option key={gender} value={gender}>
                                            {gender}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Password" error={errors.password?.message}>
                                <Input
                                    {...register('password')}
                                    type="password"
                                    autoComplete="new-password"
                                />
                            </Field>
                            <Field
                                label="Emergency Contact Name"
                                error={errors.emergencyContactName?.message}
                            >
                                <Input {...register('emergencyContactName')} autoComplete="name" />
                            </Field>
                            <Field
                                label="Emergency Contact Phone"
                                error={errors.emergencyContactPhone?.message}
                            >
                                <Input
                                    {...register('emergencyContactPhone')}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    autoComplete="tel"
                                />
                            </Field>
                        </div>
                        <Field label="Address" error={errors.address?.message}>
                            <textarea
                                {...register('address')}
                                className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                autoComplete="street-address"
                            />
                        </Field>
                        <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3 text-sm text-cyan-800">
                            <strong>Account type:</strong> Patient
                        </div>
                        <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                            <UserRoundPlus className="size-4" />
                            {isSubmitting ? 'Creating account...' : 'Create patient account'}
                        </Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already registered?{' '}
                        <Link className="font-semibold text-cyan-700 hover:underline" to="/login">
                            Sign in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}

const Field = ({ label, error, children }) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        {children}
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
);
