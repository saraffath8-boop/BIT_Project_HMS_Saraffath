import { Activity, Bell, CalendarDays, ClipboardList, CreditCard, FileChartColumn, FlaskConical, HeartPulse, LayoutDashboard, Menu, MessageSquare, Package, Pill, ScanLine, Stethoscope, Users, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { getDashboardPath } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician', 'radiologist'] },
    { label: 'Patients', to: '/patients', icon: Users, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { label: 'Appointments', to: '/appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { label: 'Queue', to: '/queue', icon: ClipboardList, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { label: 'Medical Records', to: '/medical-records', icon: Stethoscope, roles: ['admin', 'doctor', 'nurse'] },
    { label: 'Prescriptions', to: '/prescriptions', icon: Pill, roles: ['admin', 'doctor', 'pharmacist'] },
    { label: 'Pharmacy', to: '/pharmacy', icon: Activity, roles: ['admin', 'doctor', 'pharmacist'] },
    { label: 'Laboratory', to: '/laboratory', icon: FlaskConical, roles: ['admin', 'doctor', 'nurse', 'lab_technician'] },
    { label: 'Radiology', to: '/radiology', icon: ScanLine, roles: ['admin', 'doctor', 'nurse', 'radiologist'] },
    { label: 'Billing', to: '/billing', icon: CreditCard, roles: ['admin', 'receptionist', 'pharmacist', 'lab_technician', 'radiologist'] },
    { label: 'Inventory', to: '/inventory', icon: Package, roles: ['admin'] },
    { label: 'Feedback', to: '/feedback', icon: MessageSquare, roles: ['admin', 'patient'] },
    { label: 'Notifications', to: '/notifications', icon: Bell, roles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician', 'radiologist'] },
    { label: 'My Appointments', to: '/my/appointments', icon: CalendarDays, roles: ['patient'] },
    { label: 'My Prescriptions', to: '/my/prescriptions', icon: Pill, roles: ['patient'] },
    { label: 'My Reports', to: '/my/reports', icon: FileChartColumn, roles: ['patient'] },
    { label: 'My Bills', to: '/my/bills', icon: CreditCard, roles: ['patient'] },
    { label: 'Reports', to: '/reports', icon: FileChartColumn, roles: ['admin'] },
    { label: 'Staff Users', to: '/users', icon: Users, roles: ['admin'] },
];

export default function Sidebar({ open, onClose, role, unreadCount = 0 }) {
    const dashboardPath = getDashboardPath(role);

    return (
        <>
            {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={onClose} />}
            <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0', open && 'translate-x-0')}>
                <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
                    <Link to={dashboardPath} onClick={onClose} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700" title="Go to my dashboard">
                        <div className="grid size-10 place-items-center rounded-xl bg-cyan-700 text-white"><HeartPulse className="size-6" /></div>
                        <div><p className="font-bold text-slate-950">MediCore</p><p className="text-xs text-slate-500">Hospital Management</p></div>
                    </Link>
                    <button className="ml-auto text-slate-500 lg:hidden" onClick={onClose}><X className="size-5" /></button>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
                    {navItems.filter((item) => item.roles.includes(role)).map(({ label, to, icon: Icon }) => (
                        <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950', isActive && 'bg-cyan-50 text-cyan-800')}>
                            <Icon className="size-4" /><span className="flex-1">{label}</span>
                            {label === 'Notifications' && unreadCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white" aria-label={`${unreadCount} unread notifications`}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
                        </NavLink>
                    ))}
                </nav>
                <div className="border-t border-slate-100 p-4 text-xs leading-5 text-slate-500">Secure clinical workspace<br />Role: <span className="font-semibold capitalize text-slate-700">{role?.replace('_', ' ')}</span></div>
            </aside>
        </>
    );
}

export { Menu };
