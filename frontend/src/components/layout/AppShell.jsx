import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell({ children }) {
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} role={user?.role} />
            <div className="lg:pl-72">
                <TopBar onMenu={() => setMobileOpen(true)} />
                <div className="app-content p-4 sm:p-6 lg:p-8">{children}</div>
            </div>
        </div>
    );
}
