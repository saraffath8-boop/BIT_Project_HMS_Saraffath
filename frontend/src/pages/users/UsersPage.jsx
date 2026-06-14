// This file contains the users page interface.

import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Trash2, UserPlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import {
    createStaffUser,
    deleteStaffUser,
    getUsers,
    updateStaffUser,
} from '../../services/userService';
import { getDepartments } from '../../services/bookingService';
import { staffRoles, staffUserSchema, genderOptions } from '../../schemas/userSchema';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';

// Prepare role.
const formatRole = (role = '') =>
    role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
// Handle defaults.
const defaults = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nic: '',
    dob: '',
    gender: 'Other',
    password: '',
    role: 'doctor',
    isActive: true,
    department: '',
    specialization: '',
    consultationFee: 0,
};

export default function UsersPage() {
    const { token, user } = useAuth();
    const [staffUsers, setStaffUsers] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [actionError, setActionError] = useState('');
    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(staffUserSchema), defaultValues: defaults });
    const selectedRole = watch('role');

    // Load staff users.
    const loadStaffUsers = useCallback(async () => {
        if (!token) return;
        setLoadingUsers(true);
        setLoadError('');
        try {
            const [response, departmentResponse] = await Promise.all([
                getUsers({ token, filters: {} }),
                getDepartments(),
            ]);
            setStaffUsers((response.users || []).filter((user) => staffRoles.includes(user.role)));
            setDepartments(departmentResponse.departments || []);
        } catch (err) {
            setLoadError(err.message || 'Unable to load staff users');
        } finally {
            setLoadingUsers(false);
        }
    }, [token]);

    // Run this work when the listed values change.
    useEffect(() => {
        loadStaffUsers();
    }, [loadStaffUsers]);

    // Handle submit.
    const submit = async (formData) => {
        setSubmitError('');
        setSuccess('');
        try {
            await createStaffUser(formData, token);
            setSuccess('Staff user created successfully.');
            reset(defaults);
            await loadStaffUsers();
        } catch (err) {
            setSubmitError(err.message || 'Unable to create staff user');
        }
    };

    const removeStaff = async (staffUser) => {
        const confirmed = window.confirm(
            `Permanently remove ${staffUser.name || staffUser.email}? This cannot be undone.`,
        );
        if (!confirmed) return;
        setActionError('');
        setSuccess('');
        try {
            const response = await deleteStaffUser(staffUser.id, token);
            setSuccess(response.message);
            if (editingUser?.id === staffUser.id) setEditingUser(null);
            await loadStaffUsers();
        } catch (err) {
            setActionError(err.message || 'Unable to remove staff user');
        }
    };

    return (
        <main className="space-y-6">
            <section>
                <p className="page-kicker">Staff User Management</p>
                <h1 className="page-title">Staff Accounts</h1>
                <p className="page-description">
                    Create role-based accounts and review registered hospital staff.
                </p>
            </section>
            {actionError && <Alert variant="destructive">{actionError}</Alert>}
            {editingUser && (
                <EditStaffPanel
                    staffUser={editingUser}
                    departments={departments}
                    token={token}
                    onCancel={() => setEditingUser(null)}
                    onSaved={async (message) => {
                        setSuccess(message);
                        setEditingUser(null);
                        await loadStaffUsers();
                    }}
                />
            )}
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Staff User</CardTitle>
                        <CardDescription>
                            Common identity details are stored securely on the user account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success && <Alert className="mb-4">{success}</Alert>}
                        {submitError && (
                            <Alert variant="destructive" className="mb-4">
                                {submitError}
                            </Alert>
                        )}
                        <form onSubmit={handleSubmit(submit)} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="First Name" error={errors.firstName?.message}>
                                    <Input {...register('firstName')} />
                                </Field>
                                <Field label="Last Name" error={errors.lastName?.message}>
                                    <Input {...register('lastName')} />
                                </Field>
                                <Field label="Email Address" error={errors.email?.message}>
                                    <Input {...register('email')} type="email" />
                                </Field>
                                <Field label="Phone Number" error={errors.phone?.message}>
                                    <Input
                                        {...register('phone')}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={10}
                                    />
                                </Field>
                                <Field label="NIC" error={errors.nic?.message}>
                                    <Input {...register('nic')} type="text" maxLength={12} />
                                </Field>
                                <Field label="Date of Birth" error={errors.dob?.message}>
                                    <Input {...register('dob')} type="date" />
                                </Field>
                                <Field label="Gender" error={errors.gender?.message}>
                                    <Select {...register('gender')}>
                                        {genderOptions.map((gender) => (
                                            <option key={gender} value={gender}>
                                                {gender}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                                <Field label="Role" error={errors.role?.message}>
                                    <Select {...register('role')}>
                                        {staffRoles.map((role) => (
                                            <option key={role} value={role}>
                                                {formatRole(role)}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                                {selectedRole === 'doctor' && (
                                    <Field label="Department" error={errors.department?.message}>
                                        <Select {...register('department')}>
                                            <option value="">Select department</option>
                                            {departments.map((department) => (
                                                <option key={department.id} value={department.id}>
                                                    {department.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </Field>
                                )}
                                {selectedRole === 'doctor' && (
                                    <Field
                                        label="Specialization"
                                        error={errors.specialization?.message}
                                    >
                                        <Input
                                            {...register('specialization')}
                                            placeholder="e.g. Cardiology"
                                        />
                                    </Field>
                                )}
                                {selectedRole === 'doctor' && (
                                    <Field
                                        label="Consultation Fee"
                                        error={errors.consultationFee?.message}
                                    >
                                        <Input
                                            {...register('consultationFee')}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                        />
                                    </Field>
                                )}
                                <Field label="Password" error={errors.password?.message}>
                                    <div className="relative">
                                        <Controller
                                            name="password"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    id="staff-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    autoComplete="new-password"
                                                    className="pr-10"
                                                />
                                            )}
                                        />
                                        <button
                                            type="button"
                                            aria-label={
                                                showPassword ? 'Hide password' : 'Show password'
                                            }
                                            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-slate-800"
                                            onClick={() => setShowPassword((visible) => !visible)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </Field>
                                <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700">
                                    <input
                                        {...register('isActive')}
                                        type="checkbox"
                                        className="size-4 accent-cyan-700"
                                    />
                                    Active Account
                                </label>
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                <UserPlus className="size-4" />
                                {isSubmitting ? 'Creating user...' : 'Create staff user'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Staff List</CardTitle>
                        <CardDescription>
                            Registered staff and administrative accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingUsers && (
                            <p className="text-sm text-slate-500">Loading staff users...</p>
                        )}
                        {loadError && <Alert variant="destructive">{loadError}</Alert>}
                        {!loadingUsers && !loadError && staffUsers.length === 0 && (
                            <p className="text-sm text-slate-500">No staff users found.</p>
                        )}
                        {!loadingUsers && !loadError && staffUsers.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Booking Details</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffUsers.map((staffUser) => (
                                        <TableRow key={staffUser.id || staffUser.email}>
                                            <TableCell className="font-medium">
                                                {staffUser.name ||
                                                    `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim()}
                                            </TableCell>
                                            <TableCell>{staffUser.email}</TableCell>
                                            <TableCell>{formatRole(staffUser.role)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        staffUser.isActive ? 'success' : 'secondary'
                                                    }
                                                >
                                                    {staffUser.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {staffUser.role === 'doctor' ? (
                                                    <div className="min-w-48 space-y-1 text-sm">
                                                        <p>
                                                            Department:{' '}
                                                            {staffUser.department?.name ||
                                                                'Not assigned'}
                                                        </p>
                                                        <p>
                                                            Specialization:{' '}
                                                            {staffUser.specialization ||
                                                                'Not recorded'}
                                                        </p>
                                                        <p>
                                                            Fee: LKR{' '}
                                                            {Number(
                                                                staffUser.consultationFee || 0,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    'Not applicable'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setActionError('');
                                                            setEditingUser(staffUser);
                                                        }}
                                                    >
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600"
                                                        disabled={staffUser.id === user?.id}
                                                        onClick={() => removeStaff(staffUser)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

// Handle select.
const Select = forwardRef(function Select(props, ref) {
    return (
        <select
            ref={ref}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            {...props}
        />
    );
});
// Show the field interface.
const Field = ({ label, error, children }) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        {children}
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
);

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const EditStaffPanel = ({ staffUser, departments, token, onCancel, onSaved }) => {
    const [formData, setFormData] = useState({
        firstName: staffUser.firstName || '',
        lastName: staffUser.lastName || '',
        email: staffUser.email || '',
        phone: staffUser.phone || '',
        nic: staffUser.nic || '',
        dob: toDateInput(staffUser.dob),
        gender: staffUser.gender || 'Other',
        role: staffUser.role,
        isActive: staffUser.isActive,
        password: '',
        department: staffUser.department?._id || staffUser.department?.id || '',
        specialization: staffUser.specialization || '',
        consultationFee: staffUser.consultationFee || 0,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const update = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            const response = await updateStaffUser(staffUser.id, formData, token);
            await onSaved(response.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Staff User</CardTitle>
                <CardDescription>
                    Update identity, account access, role, and doctor booking details.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {error && <Alert variant="destructive">{error}</Alert>}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Field label="First Name">
                        <Input
                            value={formData.firstName}
                            onChange={(event) => update('firstName', event.target.value)}
                        />
                    </Field>
                    <Field label="Last Name">
                        <Input
                            value={formData.lastName}
                            onChange={(event) => update('lastName', event.target.value)}
                        />
                    </Field>
                    <Field label="Email">
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(event) => update('email', event.target.value)}
                        />
                    </Field>
                    <Field label="Phone">
                        <Input
                            value={formData.phone}
                            maxLength={10}
                            onChange={(event) => update('phone', event.target.value)}
                        />
                    </Field>
                    <Field label="NIC">
                        <Input
                            value={formData.nic}
                            maxLength={12}
                            onChange={(event) => update('nic', event.target.value)}
                        />
                    </Field>
                    <Field label="Date of Birth">
                        <Input
                            type="date"
                            value={formData.dob}
                            onChange={(event) => update('dob', event.target.value)}
                        />
                    </Field>
                    <Field label="Gender">
                        <Select
                            value={formData.gender}
                            onChange={(event) => update('gender', event.target.value)}
                        >
                            {genderOptions.map((gender) => (
                                <option key={gender}>{gender}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Role">
                        <Select
                            value={formData.role}
                            onChange={(event) => update('role', event.target.value)}
                        >
                            {staffRoles.map((role) => (
                                <option key={role} value={role}>
                                    {formatRole(role)}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="New Password (optional)">
                        <Input
                            type="password"
                            value={formData.password}
                            placeholder="Leave blank to keep current"
                            onChange={(event) => update('password', event.target.value)}
                        />
                    </Field>
                    {formData.role === 'doctor' && (
                        <>
                            <Field label="Department">
                                <Select
                                    value={formData.department}
                                    onChange={(event) => update('department', event.target.value)}
                                >
                                    <option value="">Select department</option>
                                    {departments.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field label="Specialization">
                                <Input
                                    value={formData.specialization}
                                    onChange={(event) =>
                                        update('specialization', event.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Consultation Fee">
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.consultationFee}
                                    onChange={(event) =>
                                        update('consultationFee', event.target.value)
                                    }
                                />
                            </Field>
                        </>
                    )}
                    <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(event) => update('isActive', event.target.checked)}
                            className="size-4 accent-cyan-700"
                        />
                        Active Account
                    </label>
                </div>
                <div className="flex gap-2">
                    <Button type="button" onClick={save} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
