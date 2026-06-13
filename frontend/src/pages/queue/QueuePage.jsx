import { useCallback, useEffect, useState } from 'react';
import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getQueueEntries } from '../../services/queueService';
import {
    getReceptionistConfirmedQueue,
    markAppointmentChecked,
} from '../../services/appointmentService';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { CollapsibleSection } from '../../components/ui/collapsible-section';

const QueuePage = () => {
    const { user } = useAuth();
    if (['receptionist', 'doctor'].includes(user?.role)) return <ConfirmedAppointmentQueue />;

    return (
        <ModuleListPage
            title="Patient Queue"
            kicker="Queue Management"
            description="Monitor waiting patients, queue priority, department flow, and current service status."
            loadData={getQueueEntries}
            itemsKey="queueEntries"
            createAction={{
                to: '/queue/new',
                label: 'Add Queue Entry',
                allowedRoles: ['admin', 'nurse', 'receptionist'],
            }}
            emptyMessage="No queue entries are currently waiting."
            columns={[
                { label: 'Queue Number', key: 'queueNumber' },
                { label: 'Patient', render: (item) => getPersonName(item.patient) },
                { label: 'Status', key: 'status' },
                {
                    label: 'Actions',
                    allowedRoles: ['admin', 'nurse', 'receptionist'],
                    render: (item) => (
                        <Link className="font-semibold text-cyan-700" to={`/queue/${item.id}/edit`}>
                            Edit
                        </Link>
                    ),
                },
            ]}
        />
    );
};

const ConfirmedAppointmentQueue = () => {
    const { token, user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState('');
    const [error, setError] = useState('');

    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getReceptionistConfirmedQueue({ token });
            setAppointments(response.appointments || []);
        } catch (err) {
            setError(err.message || 'Unable to load confirmed appointment queue');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const id = setTimeout(loadQueue, 0);
        return () => clearTimeout(id);
    }, [loadQueue]);

    const isDoctor = user?.role === 'doctor';
    const confirmedAppointments = appointments.filter((appointment) =>
        ['confirmed', 'paid'].includes(appointment.status),
    );
    const checkedAppointments = appointments.filter(
        (appointment) => appointment.status === 'in_consultation',
    );
    const markChecked = async (appointment) => {
        setUpdatingId(appointment.id);
        setError('');
        try {
            const response = await markAppointmentChecked(appointment.id, token);
            setAppointments((items) =>
                items.map((item) =>
                    item.id === appointment.id
                        ? { ...response.appointment, queueNumber: item.queueNumber }
                        : item,
                ),
            );
        } catch (err) {
            setError(err.message || 'Unable to mark patient as checked');
        } finally {
            setUpdatingId('');
        }
    };

    return (
        <main className="space-y-6">
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="page-kicker">
                        {isDoctor ? 'Doctor Queue' : 'Receptionist Queue'}
                    </p>
                    <h1 className="page-title">Confirmed Appointment Queue</h1>
                    <p className="page-description">
                        {isDoctor
                            ? 'Only confirmed appointments can enter the checked and diagnosis-report flow.'
                            : 'Confirmed appointments are queued by scheduled appointment time.'}{' '}
                        Earlier appointments receive earlier serial numbers.
                    </p>
                </div>
                <Button variant="outline" onClick={loadQueue} disabled={loading}>
                    Refresh
                </Button>
            </section>
            {error && <Alert variant="destructive">{error}</Alert>}
            {loading && (
                <Card className="p-6 text-sm text-slate-500">
                    Loading confirmed appointment queue...
                </Card>
            )}
            {!loading && isDoctor && (
                <QueueSection
                    title="Confirmed Patients"
                    appointments={confirmedAppointments}
                    emptyMessage="No confirmed appointments are ready."
                    action={(appointment) => (
                        <Button
                            size="sm"
                            disabled={updatingId === appointment.id}
                            onClick={() => markChecked(appointment)}
                        >
                            {updatingId === appointment.id ? 'Updating...' : 'Mark Checked'}
                        </Button>
                    )}
                />
            )}
            {!loading && isDoctor && (
                <QueueSection
                    title="Checked Patients"
                    appointments={checkedAppointments}
                    emptyMessage="No checked patients are awaiting diagnosis reports."
                    action={(appointment) => (
                        <Button asChild size="sm">
                            <Link to={`/queue/${appointment.id}/diagnosis-report`}>
                                Diagnosis Report and Prescriptions
                            </Link>
                        </Button>
                    )}
                />
            )}
            {!loading && !isDoctor && (
                <QueueSection
                    title="Confirmed Patients"
                    appointments={confirmedAppointments}
                    emptyMessage="No confirmed appointments are in the queue."
                />
            )}
        </main>
    );
};

const QueueSection = ({ title, appointments, emptyMessage, action }) => (
    <CollapsibleSection title={title} count={appointments.length}>
        {appointments.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">{emptyMessage}</Card>
        ) : (
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Serial No.</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Appointment</TableHead>
                            <TableHead>{action ? 'Action' : 'Status'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.map((appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell className="font-semibold text-cyan-800">
                                    {appointment.queueNumber}
                                </TableCell>
                                <TableCell>
                                    <CompactDetail
                                        title={getPersonName(appointment.patient)}
                                        subtitle={
                                            appointment.patient?.phone || 'Phone not recorded'
                                        }
                                    />
                                </TableCell>
                                <TableCell>
                                    <CompactDetail
                                        title={getPersonName(appointment.doctor)}
                                        subtitle={formatDateTime(appointment.appointmentDate)}
                                    />
                                </TableCell>
                                <TableCell>
                                    {action ? (
                                        action(appointment)
                                    ) : (
                                        <Badge variant="success">
                                            {appointment.status === 'paid'
                                                ? 'confirmed'
                                                : appointment.status.replaceAll('_', ' ')}
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        )}
    </CollapsibleSection>
);

const CompactDetail = ({ title, subtitle }) => (
    <div className="min-w-44">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
);

export default QueuePage;
