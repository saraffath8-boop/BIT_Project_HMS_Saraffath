import { useCallback, useEffect, useState } from 'react';
import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { confirmAppointment, getAppointments, getReceptionistPendingAppointments, markAppointmentPaid } from '../../services/appointmentService';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { CollapsibleSection } from '../../components/ui/collapsible-section';

const AppointmentsPage = () => {
    const { user } = useAuth();
    if (user?.role === 'receptionist') return <ReceptionistPendingAppointments />;

    return <ModuleListPage
        title="Appointments"
        kicker="Appointment Management"
        description="View scheduled visits, assigned clinicians, departments, and appointment status."
        loadData={getAppointments}
        itemsKey="appointments"
        emptyMessage="No appointments are currently available."
        columns={[
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Appointment', render: (item) => `${getPersonName(item.doctor)} | ${formatDateTime(item.appointmentDate)}` },
            { label: 'Status', key: 'status' },
            { label: 'Actions', allowedRoles: ['admin'], render: (item) => <Link className="font-semibold text-cyan-700" to={`/appointments/${item.id}/edit`}>Edit</Link> },
        ]}
    />;
};

const ReceptionistPendingAppointments = () => {
    const { token } = useAuth();
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [confirmedAppointments, setConfirmedAppointments] = useState([]);
    const [paidAppointments, setPaidAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState('');
    const [payingId, setPayingId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadAppointments = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [pendingResponse, confirmedResponse, legacyPaidResponse] = await Promise.all([
                getReceptionistPendingAppointments({ token }),
                getAppointments({ token, filters: { status: 'confirmed' } }),
                getAppointments({ token, filters: { status: 'paid' } }),
            ]);
            setPendingAppointments(pendingResponse.appointments || []);
            const confirmed = confirmedResponse.appointments || [];
            setConfirmedAppointments(confirmed.filter((appointment) => appointment.paymentStatus !== 'paid'));
            setPaidAppointments([
                ...confirmed.filter((appointment) => appointment.paymentStatus === 'paid'),
                ...(legacyPaidResponse.appointments || []),
            ].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)));
        } catch (err) { setError(err.message || 'Unable to load receptionist appointments'); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => { const id = setTimeout(loadAppointments, 0); return () => clearTimeout(id); }, [loadAppointments]);

    const confirm = async (appointment) => {
        setConfirmingId(appointment.id); setError(''); setSuccess('');
        try {
            const response = await confirmAppointment(appointment.id, token);
            setSuccess(response.message);
            setPendingAppointments((current) => current.filter((item) => item.id !== appointment.id));
            setConfirmedAppointments((current) => [...current, response.appointment].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)));
        } catch (err) { setError(err.message || 'Unable to confirm appointment'); }
        finally { setConfirmingId(''); }
    };

    const markPaid = async (appointment) => {
        setPayingId(appointment.id); setError(''); setSuccess('');
        try {
            const response = await markAppointmentPaid(appointment.id, token);
            setSuccess(response.message);
            setConfirmedAppointments((current) => current.filter((item) => item.id !== appointment.id));
            setPaidAppointments((current) => [...current, response.appointment].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)));
        } catch (err) { setError(err.message || 'Unable to mark appointment as paid'); }
        finally { setPayingId(''); }
    };

    return <main className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="page-kicker">Receptionist Appointments</p><h1 className="page-title">Appointment Requests and Confirmations</h1><p className="page-description">Review patient requests and confirmed appointments. Payment remains unpaid until collected.</p></div>
            <div className="flex gap-2"><Button variant="outline" onClick={loadAppointments} disabled={loading}>Refresh</Button><Button asChild><Link to="/appointments/new">Add Appointment</Link></Button></div>
        </section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading pending appointment requests...</Card>}
        {!loading && <AppointmentSection title="Pending Appointments" appointments={pendingAppointments} emptyMessage="No pending appointment requests." action={(appointment) => <Button size="sm" onClick={() => confirm(appointment)} disabled={confirmingId === appointment.id}>{confirmingId === appointment.id ? 'Confirming...' : 'Confirm Appointment'}</Button>} />}
        {!loading && <AppointmentSection title="Confirmed Appointments" appointments={confirmedAppointments} emptyMessage="No confirmed appointments." action={(appointment) => <Button size="sm" onClick={() => markPaid(appointment)} disabled={payingId === appointment.id}>{payingId === appointment.id ? 'Updating...' : 'Mark as Paid'}</Button>} />}
        {!loading && <AppointmentSection title="Paid Appointments" appointments={paidAppointments} emptyMessage="No paid appointments." showPaymentStatus />}
    </main>;
};

const AppointmentSection = ({ title, appointments, emptyMessage, action, showPaymentStatus = false }) => <CollapsibleSection title={title} count={appointments.length}>
    {appointments.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">{emptyMessage}</Card> : <Card className="overflow-hidden"><Table>
        <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Appointment</TableHead><TableHead>{action ? 'Fee' : showPaymentStatus ? 'Payment' : 'Status'}</TableHead>{action && <TableHead>Action</TableHead>}</TableRow></TableHeader>
        <TableBody>{appointments.map((appointment) => <TableRow key={appointment.id}>
            <TableCell><CompactDetail title={getPersonName(appointment.patient)} subtitle={appointment.patient?.phone || 'Phone not recorded'} /></TableCell><TableCell><CompactDetail title={getPersonName(appointment.doctor)} subtitle={formatDateTime(appointment.appointmentDate)} /></TableCell><TableCell>{action ? formatFee(appointment.consultationFee) : showPaymentStatus ? <Badge variant="success">Confirmed and Paid</Badge> : <Badge variant={appointment.status === 'confirmed' ? 'success' : 'warning'}>{appointment.status.replaceAll('_', ' ')}</Badge>}</TableCell>{action && <TableCell>{action(appointment)}</TableCell>}
        </TableRow>)}</TableBody>
    </Table></Card>}
</CollapsibleSection>;

const formatFee = (fee) => `LKR ${Number(fee || 0).toLocaleString()}`;
const CompactDetail = ({ title, subtitle }) => <div className="min-w-44"><p className="font-medium text-slate-900">{title}</p><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>;

export default AppointmentsPage;
