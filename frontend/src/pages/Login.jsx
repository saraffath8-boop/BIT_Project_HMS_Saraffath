import { useEffect, useState } from 'react';
import { HeartPulse, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { getDashboardPath, useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { isAuthenticated, loading, login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && isAuthenticated && user) navigate(location.state?.from?.pathname || getDashboardPath(user.role), { replace: true });
    }, [isAuthenticated, loading, location.state, navigate, user]);

    const handleSubmit = async (event) => {
        event.preventDefault(); setError(''); setSubmitting(true);
        try {
            const loggedInUser = await login({ email, password });
            const requestedPath = location.state?.from?.pathname;
            navigate(requestedPath && requestedPath !== '/login' ? requestedPath : getDashboardPath(loggedInUser.role), { replace: true });
        } catch (err) { setError(err.message || 'Login failed. Please try again.'); }
        finally { setSubmitting(false); }
    };

    return (
        <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
            <section className="hidden bg-cyan-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <Brand />
                <div className="max-w-lg"><p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-300">Connected care</p><h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight">A calmer workspace for better patient care.</h1><p className="mt-5 leading-7 text-cyan-100/80">Secure access to clinical workflows, hospital operations, and patient services.</p></div>
                <p className="text-xs text-cyan-200/70">Authorized hospital personnel and patients only</p>
            </section>
            <section className="grid place-items-center p-5 sm:p-10"><Card className="w-full max-w-md shadow-lg shadow-slate-200/60">
                <CardHeader><div className="mb-3 lg:hidden"><Brand dark /></div><CardTitle className="text-2xl">Welcome back</CardTitle><CardDescription>Sign in to your secure hospital workspace.</CardDescription></CardHeader>
                <CardContent>{location.state?.message && <Alert className="mb-5">{location.state.message}</Alert>}{error && <Alert variant="destructive" className="mb-5">{error}</Alert>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field icon={Mail} label="Email address"><Input id="email" className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@hospital.com" autoComplete="email" required /></Field>
                        <Field icon={LockKeyhole} label="Password"><Input id="password" className="pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></Field>
                        <Button className="w-full" size="lg" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-slate-500">New patient? <Link className="font-semibold text-cyan-700 hover:underline" to="/signup">Create an account</Link></p>
                </CardContent>
            </Card></section>
        </main>
    );
}

const Brand = ({ dark = false }) => <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-cyan-700 text-white"><HeartPulse /></span><div><p className={dark ? 'font-bold text-slate-950' : 'font-bold'}>MediCore</p><p className={dark ? 'text-xs text-slate-500' : 'text-xs text-cyan-200'}>Hospital Management</p></div></div>;
const Field = ({ icon: Icon, label, children }) => <div className="space-y-2"><Label htmlFor={children.props.id}>{label}</Label><div className="relative"><Icon className="absolute left-3 top-3 size-4 text-slate-400" />{children}</div></div>;
