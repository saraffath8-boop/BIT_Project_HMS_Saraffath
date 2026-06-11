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

const AppointmentsPage = () => {
    const { user } = useAuth();
    if (user?.role === 'receptionist') return <ReceptionistPendingAppointments />;

    return <ModuleListPage
        title="Appointments"
        kicker="Appointment Management"
        description="View scheduled visits, assigned clinicians, departments, and appointment status."
        loadData={getAppointments}
        itemsKey="appointments"
        createAction={{ to: '/appointments/new', label: 'Add Appointment', allowedRoles: ['admin'] }}
        emptyMessage="No appointments are currently available."
        columns={[
            { label: 'Date and Time', render: (item) => formatDateTime(item.appointmentDate) },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Doctor', render: (item) => getPersonName(item.doctor) },
            { label: 'Department', key: 'department' },
            { label: 'Status', key: 'status' },
            { label: 'Payment', key: 'paymentStatus' },
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
        {!loading && <AppointmentSection title="Paid Appointments" appointments={paidAppointments} emptyMessage="No paid appointments." />}
    </main>;
};

const AppointmentSection = ({ title, appointments, emptyMessage, action }) => <section className="space-y-3">
    <h2 className="text-lg font-semibold text-slate-900">{title} <span className="text-sm font-normal text-slate-500">({appointments.length})</span></h2>
    {appointments.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">{emptyMessage}</Card> : <Card className="overflow-hidden"><Table>
        <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Phone</TableHead><TableHead>Doctor</TableHead><TableHead>Department</TableHead><TableHead>Date and Time</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead>Fee</TableHead>{action && <TableHead>Action</TableHead>}</TableRow></TableHeader>
        <TableBody>{appointments.map((appointment) => <TableRow key={appointment.id}>
            <TableCell>{getPersonName(appointment.patient)}</TableCell><TableCell>{appointment.patient?.phone || 'Not recorded'}</TableCell><TableCell>{getPersonName(appointment.doctor)}</TableCell><TableCell>{appointment.department}</TableCell><TableCell>{formatDateTime(appointment.appointmentDate)}</TableCell><TableCell className="max-w-64 whitespace-normal">{appointment.reason || 'Not provided'}</TableCell><TableCell><Badge variant={appointment.status === 'confirmed' ? 'success' : 'warning'}>{appointment.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell><Badge variant={appointment.paymentStatus === 'paid' ? 'success' : 'destructive'}>{appointment.paymentStatus}</Badge></TableCell><TableCell>{formatFee(appointment.consultationFee)}</TableCell>{action && <TableCell>{action(appointment)}</TableCell>}
        </TableRow>)}</TableBody>
    </Table></Card>}
</section>;

const formatFee = (fee) => `LKR ${Number(fee || 0).toLocaleString()}`;

export default AppointmentsPage;
