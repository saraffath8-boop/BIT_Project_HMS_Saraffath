import { useCallback, useEffect, useState } from 'react';
import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getQueueEntries } from '../../services/queueService';
import { getReceptionistConfirmedQueue } from '../../services/appointmentService';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const QueuePage = () => {
    const { user } = useAuth();
    if (['receptionist', 'doctor'].includes(user?.role)) return <ConfirmedAppointmentQueue />;

    return <ModuleListPage
        title="Patient Queue"
        kicker="Queue Management"
        description="Monitor waiting patients, queue priority, department flow, and current service status."
        loadData={getQueueEntries}
        itemsKey="queueEntries"
        createAction={{ to: '/queue/new', label: 'Add Queue Entry', allowedRoles: ['admin', 'nurse', 'receptionist'] }}
        emptyMessage="No queue entries are currently waiting."
        columns={[
            { label: 'Queue Number', key: 'queueNumber' },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Department', key: 'department' },
            { label: 'Priority', key: 'priority' },
            { label: 'Status', key: 'status' },
            { label: 'Created', render: (item) => formatDateTime(item.createdAt) },
            { label: 'Actions', allowedRoles: ['admin', 'nurse', 'receptionist'], render: (item) => <Link className="font-semibold text-cyan-700" to={`/queue/${item.id}/edit`}>Edit</Link> },
        ]}
    />;
};

const ConfirmedAppointmentQueue = () => {
    const { token, user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadQueue = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const response = await getReceptionistConfirmedQueue({ token });
            setAppointments(response.appointments || []);
        } catch (err) { setError(err.message || 'Unable to load confirmed appointment queue'); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => { const id = setTimeout(loadQueue, 0); return () => clearTimeout(id); }, [loadQueue]);

    const isDoctor = user?.role === 'doctor';

    return <main className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="page-kicker">{isDoctor ? 'Doctor Queue' : 'Receptionist Queue'}</p><h1 className="page-title">Confirmed Appointment Queue</h1><p className="page-description">{isDoctor ? 'Your confirmed and paid appointments are queued by scheduled appointment time.' : 'Confirmed and paid appointments are queued by scheduled appointment time.'} Earlier appointments receive earlier serial numbers.</p></div>
            <Button variant="outline" onClick={loadQueue} disabled={loading}>Refresh</Button>
        </section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading confirmed appointment queue...</Card>}
        {!loading && appointments.length === 0 && <Card className="p-10 text-center text-sm text-slate-500">No confirmed or paid appointments are in the queue.</Card>}
        {!loading && appointments.length > 0 && <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-semibold text-slate-800">{appointments.length} queued appointment{appointments.length === 1 ? '' : 's'}</p><p className="text-xs text-slate-500">Confirmed and paid appointments ordered by scheduled appointment time</p></div>
            <Table><TableHeader><TableRow><TableHead>Serial No.</TableHead><TableHead>Patient</TableHead><TableHead>Phone</TableHead><TableHead>Doctor</TableHead><TableHead>Department</TableHead><TableHead>Appointment Time</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead></TableRow></TableHeader>
                <TableBody>{appointments.map((appointment) => <TableRow key={appointment.id}>
                    <TableCell className="font-semibold text-cyan-800">{appointment.queueNumber}</TableCell>
                    <TableCell>{getPersonName(appointment.patient)}</TableCell>
                    <TableCell>{appointment.patient?.phone || 'Not recorded'}</TableCell>
                    <TableCell>{getPersonName(appointment.doctor)}</TableCell>
                    <TableCell>{appointment.department}</TableCell>
                    <TableCell>{formatDateTime(appointment.appointmentDate)}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal">{appointment.reason || 'Not provided'}</TableCell>
                    <TableCell><Badge variant="success">{appointment.status}</Badge></TableCell>
                    <TableCell><Badge variant={appointment.paymentStatus === 'paid' ? 'success' : 'destructive'}>{appointment.paymentStatus}</Badge></TableCell>
                </TableRow>)}</TableBody>
            </Table>
        </Card>}
    </main>;
};

export default QueuePage;
