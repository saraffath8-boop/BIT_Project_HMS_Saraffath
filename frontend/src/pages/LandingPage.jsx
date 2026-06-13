// This file contains the landing page interface.

import { ArrowRight, CalendarCheck, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

// Handle features.
const features = [
    {
        icon: Stethoscope,
        title: 'Clinical workflows',
        text: 'Patient records, prescriptions, laboratory, and radiology in one workspace.',
    },
    {
        icon: CalendarCheck,
        title: 'Coordinated operations',
        text: 'Appointments, queues, billing, inventory, and staff operations stay connected.',
    },
    {
        icon: ShieldCheck,
        title: 'Role-based access',
        text: 'Secure dashboards tailored to each hospital team and patient.',
    },
];

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-slate-50">
            <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-cyan-700 text-white">
                        <HeartPulse />
                    </span>
                    <div>
                        <p className="font-bold text-slate-950">MediCore</p>
                        <p className="text-xs text-slate-500">Hospital Management</p>
                    </div>
                </div>
                <Button asChild>
                    <Link to="/login">
                        Sign in <ArrowRight className="size-4" />
                    </Link>
                </Button>
            </header>
            <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
                <div className="max-w-3xl">
                    <p className="page-kicker">Connected hospital care</p>
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                        One clear workspace for every part of patient care.
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                        A secure, role-based hospital portal that helps clinical and operational
                        teams work together with less friction.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link to="/login">Open hospital portal</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link to="/signup">Patient registration</Link>
                        </Button>
                    </div>
                </div>
                <div className="mt-16 grid gap-4 md:grid-cols-3">
                    {features.map(({ icon: Icon, title, text }) => (
                        <article
                            key={title}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <span className="grid size-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                                <Icon className="size-5" />
                            </span>
                            <h2 className="mt-5 font-semibold text-slate-900">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
