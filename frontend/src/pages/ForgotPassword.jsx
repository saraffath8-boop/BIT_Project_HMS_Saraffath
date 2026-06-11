import { useState } from 'react';
import { HeartPulse, KeyRound, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { requestPatientPasswordReset, resetPatientPassword } from '../services/authService';

const phonePattern = /^07[0-9]{8}$/;

export default function ForgotPassword() {
    const [step, setStep] = useState('request');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [developmentOtp, setDevelopmentOtp] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const requestOtp = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        if (!phonePattern.test(phone)) {
            setError('Enter a valid Sri Lankan 10-digit mobile number starting with 07.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await requestPatientPasswordReset(phone);
            setMessage(result.message);
            setDevelopmentOtp(result.developmentOtp || '');
            setStep('reset');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetPassword = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        if (!/^[0-9]{6}$/.test(otp)) {
            setError('OTP must contain exactly 6 digits.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await resetPatientPassword({ phone, otp, newPassword });
            setMessage(result.message);
            setStep('complete');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resendOtp = async () => {
        setError('');
        setMessage('');
        setSubmitting(true);
        try {
            const result = await requestPatientPasswordReset(phone);
            setMessage(result.message);
            if (result.developmentOtp) setDevelopmentOtp(result.developmentOtp);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
            <Card className="w-full max-w-md shadow-lg shadow-slate-200/60">
                <CardHeader>
                    <div className="mb-3 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-cyan-700 text-white"><HeartPulse /></span><span className="font-bold text-slate-900">MediCore</span></div>
                    <CardTitle className="text-2xl">Patient password recovery</CardTitle>
                    <CardDescription>Recovery option using their registered mobile number.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <Alert variant="destructive" className="mb-5">{error}</Alert>}
                    {message && <Alert className="mb-5">{message}</Alert>}
                    {step === 'reset' && developmentOtp && <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                        <p className="font-semibold">Development OTP Preview</p>
                        <p className="mt-1">Your offline demonstration OTP is <strong className="font-mono text-lg">{developmentOtp}</strong>.</p>
                        <p className="mt-1 text-xs text-amber-800">This preview is available only when explicitly enabled outside production.</p>
                        <Button className="mt-3" size="sm" type="button" variant="outline" onClick={() => setOtp(developmentOtp)}>Auto-fill OTP</Button>
                    </div>}

                    {step === 'request' && <form onSubmit={requestOtp} className="space-y-4">
                        <Field icon={Phone} label="Registered mobile number"><Input id="phone" className="pl-9" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel" placeholder="07XXXXXXXX" required /></Field>
                        <Button className="w-full" size="lg" type="submit" disabled={submitting}>{submitting ? 'Sending OTP...' : 'Send OTP'}</Button>
                    </form>}

                    {step === 'reset' && <form onSubmit={resetPassword} className="space-y-4">
                        <Field icon={KeyRound} label="6-digit OTP"><Input id="otp" className="pl-9" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter OTP" required /></Field>
                        <Field icon={KeyRound} label="New password"><Input id="new-password" className="pl-9" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required /></Field>
                        <Field icon={KeyRound} label="Confirm new password"><Input id="confirm-password" className="pl-9" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /></Field>
                        <Button className="w-full" size="lg" type="submit" disabled={submitting}>{submitting ? 'Resetting password...' : 'Set new password'}</Button>
                        <button className="w-full text-sm font-semibold text-cyan-700 hover:underline disabled:opacity-50" type="button" onClick={resendOtp} disabled={submitting}>Resend OTP</button>
                    </form>}

                    {step === 'complete' && <Button asChild className="w-full" size="lg"><Link to="/login">Return to sign in</Link></Button>}
                    {step !== 'complete' && <p className="mt-6 text-center text-sm text-slate-500"><Link className="font-semibold text-cyan-700 hover:underline" to="/login">Back to sign in</Link></p>}
                </CardContent>
            </Card>
        </main>
    );
}

const Field = ({ icon: Icon, label, children }) => <div className="space-y-2"><Label htmlFor={children.props.id}>{label}</Label><div className="relative"><Icon className="absolute left-3 top-3 size-4 text-slate-400" />{children}</div></div>;
