import { ArrowUpRight, Bell, CalendarDays, ClipboardList, FlaskConical, FolderHeart, Pill, ScanLine, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const icons = { Appointments: CalendarDays, Patients: Users, 'Medical Records': FolderHeart, Prescriptions: Pill, Laboratory: FlaskConical, 'Laboratory Requests': FlaskConical, Radiology: ScanLine, 'Radiology Requests': ScanLine, Notifications: Bell, Queue: ClipboardList };

const DashboardLayout = ({ kicker, title, description, cards }) => {
    const { user } = useAuth();
    return (
        <main className="space-y-7">
            <section className="overflow-hidden rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4"><div className="hidden size-12 place-items-center rounded-xl bg-cyan-50 text-cyan-700 sm:grid"><Stethoscope className="size-6" /></div><div><p className="page-kicker">{kicker}</p><h1 className="page-title">{title || `Welcome, ${user?.name || 'User'}`}</h1><p className="page-description max-w-3xl">{description}</p></div></div>
            </section>
            <section><div className="mb-4"><h2 className="text-lg font-semibold text-slate-900">Clinical workspace</h2><p className="text-sm text-slate-500">Open the modules available for your role.</p></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map((card) => {
                    const Icon = icons[card.title] || ClipboardList;
                    return card.to ? <Link key={card.title} to={card.to} className="group"><Card className="h-full transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"><CardHeader><div className="mb-3 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Icon className="size-5" /></span><ArrowUpRight className="size-4 text-slate-400 transition group-hover:text-cyan-700" /></div><CardTitle>{card.title}</CardTitle><CardDescription>{card.description}</CardDescription></CardHeader></Card></Link> : <Card key={card.title} className="opacity-60"><CardContent className="p-6">{card.title}</CardContent></Card>;
                })}</div>
            </section>
        </main>
    );
};

export default DashboardLayout;
