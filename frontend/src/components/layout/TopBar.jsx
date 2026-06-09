import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

const titles = {
    patients: 'Patient Management', appointments: 'Appointments', queue: 'Patient Queue',
    'medical-records': 'Medical Records', prescriptions: 'Prescriptions', pharmacy: 'Pharmacy',
    laboratory: 'Laboratory', radiology: 'Radiology', billing: 'Billing', inventory: 'Inventory',
    feedback: 'Feedback', notifications: 'Notifications', reports: 'Reports', users: 'Staff Users',
};

export default function TopBar({ onMenu }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const segment = location.pathname.split('/').filter(Boolean)[0];
    const title = segment === 'dashboard' ? 'Dashboard' : (titles[segment] || 'Hospital Workspace');
    const initials = user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'HM';

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}><Menu className="size-5" /></Button>
            <div className="min-w-0 flex-1"><p className="truncate text-lg font-semibold text-slate-950">{title}</p><p className="hidden text-xs text-slate-500 sm:block">Clinical operations and patient care workspace</p></div>
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><ShieldCheck className="size-4" /> Secure session</div>
            <div className="grid size-9 place-items-center rounded-full bg-cyan-700 text-xs font-bold text-white">{initials}</div>
            <div className="hidden sm:block"><p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p><p className="text-xs capitalize text-slate-500">{user?.role?.replace('_', ' ')}</p></div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out"><LogOut className="size-4" /></Button>
        </header>
    );
}
