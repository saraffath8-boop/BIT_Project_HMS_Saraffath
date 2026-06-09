import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { createStaffUser, getUsers } from '../../services/userService';
import { staffRoles, staffUserSchema, genderOptions } from '../../schemas/userSchema';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const formatRole = (role = '') => role.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const defaults = { firstName: '', lastName: '', email: '', phone: '', nic: '', dob: '', gender: 'Other', password: '', role: 'doctor', isActive: true };

export default function UsersPage() {
    const { token } = useAuth();
    const [staffUsers, setStaffUsers] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(staffUserSchema), defaultValues: defaults });

    const loadStaffUsers = useCallback(async () => {
        if (!token) return;
        setLoadingUsers(true); setLoadError('');
        try {
            const response = await getUsers({ token, filters: {} });
            setStaffUsers((response.users || []).filter((user) => staffRoles.includes(user.role)));
        } catch (err) { setLoadError(err.message || 'Unable to load staff users'); }
        finally { setLoadingUsers(false); }
    }, [token]);

    useEffect(() => { loadStaffUsers(); }, [loadStaffUsers]);

    const submit = async (formData) => {
        setSubmitError(''); setSuccess('');
        try {
            await createStaffUser(formData, token);
            setSuccess('Staff user created successfully.');
            reset(defaults);
            await loadStaffUsers();
        } catch (err) { setSubmitError(err.message || 'Unable to create staff user'); }
    };

    return <main className="space-y-6">
        <section><p className="page-kicker">Staff User Management</p><h1 className="page-title">Staff Accounts</h1><p className="page-description">Create role-based accounts and review registered hospital staff.</p></section>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <Card><CardHeader><CardTitle>Create Staff User</CardTitle><CardDescription>Common identity details are stored securely on the user account.</CardDescription></CardHeader><CardContent>
                {success && <Alert className="mb-4">{success}</Alert>}{submitError && <Alert variant="destructive" className="mb-4">{submitError}</Alert>}
                <form onSubmit={handleSubmit(submit)} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First Name" error={errors.firstName?.message}><Input {...register('firstName')} /></Field>
                    <Field label="Last Name" error={errors.lastName?.message}><Input {...register('lastName')} /></Field>
                    <Field label="Email Address" error={errors.email?.message}><Input {...register('email')} type="email" /></Field>
                    <Field label="Phone Number" error={errors.phone?.message}><Input {...register('phone')} type="text" inputMode="numeric" maxLength={10} /></Field>
                    <Field label="NIC" error={errors.nic?.message}><Input {...register('nic')} type="text" maxLength={12} /></Field>
                    <Field label="Date of Birth" error={errors.dob?.message}><Input {...register('dob')} type="date" /></Field>
                    <Field label="Gender" error={errors.gender?.message}><Select {...register('gender')}>{genderOptions.map((gender) => <option key={gender} value={gender}>{gender}</option>)}</Select></Field>
                    <Field label="Role" error={errors.role?.message}><Select {...register('role')}>{staffRoles.map((role) => <option key={role} value={role}>{formatRole(role)}</option>)}</Select></Field>
                    <Field label="Password" error={errors.password?.message}><Input {...register('password')} type="password" /></Field>
                    <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700"><input {...register('isActive')} type="checkbox" className="size-4 accent-cyan-700" />Active Account</label>
                </div><Button type="submit" disabled={isSubmitting}><UserPlus className="size-4" />{isSubmitting ? 'Creating user...' : 'Create staff user'}</Button></form>
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Staff List</CardTitle><CardDescription>Registered staff and administrative accounts.</CardDescription></CardHeader><CardContent>
                {loadingUsers && <p className="text-sm text-slate-500">Loading staff users...</p>}
                {loadError && <Alert variant="destructive">{loadError}</Alert>}
                {!loadingUsers && !loadError && staffUsers.length === 0 && <p className="text-sm text-slate-500">No staff users found.</p>}
                {!loadingUsers && !loadError && staffUsers.length > 0 && <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone Number</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
                    {staffUsers.map((staffUser) => <TableRow key={staffUser.id || staffUser.email}><TableCell className="font-medium">{staffUser.name || `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim()}</TableCell><TableCell>{staffUser.email}</TableCell><TableCell>{staffUser.phone || 'Not recorded'}</TableCell><TableCell>{formatRole(staffUser.role)}</TableCell><TableCell><Badge variant={staffUser.isActive ? 'success' : 'secondary'}>{staffUser.isActive ? 'Active' : 'Inactive'}</Badge></TableCell></TableRow>)}
                </TableBody></Table>}
            </CardContent></Card>
        </div>
    </main>;
}

const Select = forwardRef(function Select(props, ref) {
    return <select ref={ref} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" {...props} />;
});
const Field = ({ label, error, children }) => <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-xs font-medium text-red-600">{error}</p>}</div>;
