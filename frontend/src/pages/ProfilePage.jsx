// This file contains the profile page interface.

import { ArrowLeft, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { getDashboardPath, useAuth } from '../context/AuthContext';

// Prepare role.
const formatRole = (role = '') =>
    role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

// Prepare date.
const formatDate = (value) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

// Show the detail interface.
const Detail = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 font-medium text-slate-900">{value || 'Not recorded'}</p>
    </div>
);

export default function ProfilePage() {
    const { user } = useAuth();
    const dashboardPath = getDashboardPath(user?.role);
    const initials =
        user?.name
            ?.split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'HM';

    return (
        <main className="mx-auto max-w-4xl space-y-6">
            <section className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="page-kicker">Account</p>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-description">Your signed-in account and role information.</p>
                </div>
                <Link
                    to={dashboardPath}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    <ArrowLeft className="size-4" />
                    Dashboard
                </Link>
            </section>

            <Card>
                <CardHeader className="flex-row items-center gap-4">
                    <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-cyan-700 text-xl font-bold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="truncate">{user?.name || 'User'}</CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge>{formatRole(user?.role)}</Badge>
                            {user?.isActive !== false && <Badge variant="success">Active</Badge>}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Detail label="First Name" value={user?.firstName} />
                        <Detail label="Last Name" value={user?.lastName} />
                        <Detail label="Email Address" value={user?.email} />
                        <Detail label="Phone Number" value={user?.phone} />
                        <Detail label="NIC" value={user?.nic} />
                        <Detail label="Date of Birth" value={formatDate(user?.dob)} />
                        <Detail label="Gender" value={user?.gender} />
                        <Detail label="Role" value={formatRole(user?.role)} />
                    </div>
                    <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                            <UserRound className="size-4 text-cyan-700" />
                            Personal account
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            Secure role-based access
                        </span>
                        {user?.email && (
                            <span className="inline-flex items-center gap-2">
                                <Mail className="size-4 text-cyan-700" />
                                {user.email}
                            </span>
                        )}
                        {user?.phone && (
                            <span className="inline-flex items-center gap-2">
                                <Phone className="size-4 text-cyan-700" />
                                {user.phone}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
