// This file contains the appointments page interface.

import { useCallback, useEffect, useState } from 'react';
import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import {
    confirmAppointment,
    getAppointments,
    getReceptionistPendingAppointments,
    markAppointmentPaid,
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

// Show the correct appointment view for the signed-in user's role.
const AppointmentsPage = () => {
    const { user } = useAuth();

    // Receptionists need the request, confirmation, and payment workflow.
    if (user?.role === 'receptionist') return <ReceptionistPendingAppointments />;

    // Other allowed roles only need the general appointment list.
    return (
        <ModuleListPage
            title="Appointments"
            kicker="Appointment Management"
            description="View scheduled visits, assigned clinicians, departments, and appointment status."
            loadData={getAppointments}
            itemsKey="appointments"
            emptyMessage="No appointments are currently available."
            columns={[
                { label: 'Patient', render: (item) => getPersonName(item.patient) },
                {
                    label: 'Appointment',
                    render: (item) =>
                        `${getPersonName(item.doctor)} | ${formatDateTime(item.appointmentDate)}`,
                },
                { label: 'Status', key: 'status' },
                {
                    label: 'Actions',
                    allowedRoles: ['admin'],
                    render: (item) => (
                        <Link
                            className="font-semibold text-cyan-700"
                            to={`/appointments/${item.id}/edit`}
                        >
                            Edit
                        </Link>
                    ),
                },
            ]}
        />
    );
};

// Manage appointment requests, confirmations, and consultation payments for receptionists.
const ReceptionistPendingAppointments = () => {
    const { token } = useAuth();

    // Keep each appointment stage separate so every table can update independently.
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [confirmedAppointments, setConfirmedAppointments] = useState([]);
    const [paidAppointments, setPaidAppointments] = useState([]);

    // Track loading and the appointment currently being updated.
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState('');
    const [payingId, setPayingId] = useState('');

    // Store messages shown after requests succeed or fail.
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load appointments.
    const loadAppointments = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            // Request all receptionist appointment groups at the same time.
            const [pendingResponse, confirmedResponse, legacyPaidResponse] = await Promise.all([
                getReceptionistPendingAppointments({ token }),
                getAppointments({ token, filters: { status: 'confirmed' } }),
                getAppointments({ token, filters: { status: 'paid' } }),
            ]);

            // Keep unpaid confirmed appointments in the payment queue.
            setPendingAppointments(pendingResponse.appointments || []);
            const confirmed = confirmedResponse.appointments || [];
            setConfirmedAppointments(
                confirmed.filter((appointment) => appointment.paymentStatus !== 'paid'),
            );

            // Combine current and older paid records, then show the earliest appointment first.
            setPaidAppointments(
                [
                    ...confirmed.filter((appointment) => appointment.paymentStatus === 'paid'),
                    ...(legacyPaidResponse.appointments || []),
                ].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)),
            );
        } catch (err) {
            setError(err.message || 'Unable to load receptionist appointments');
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Run this work when the listed values change.
    useEffect(() => {
        const id = setTimeout(loadAppointments, 0);
        return () => clearTimeout(id);
    }, [loadAppointments]);

    // Confirm one pending request and move it into the confirmed payment queue.
    const confirm = async (appointment) => {
        setConfirmingId(appointment.id);
        setError('');
        setSuccess('');

        try {
            const response = await confirmAppointment(appointment.id, token);
            setSuccess(response.message);

            setPendingAppointments((current) =>
                current.filter((item) => item.id !== appointment.id),
            );

            // Add the confirmed appointment while keeping the list ordered by date.
            setConfirmedAppointments((current) =>
                [...current, response.appointment].sort(
                    (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate),
                ),
            );
        } catch (err) {
            setError(err.message || 'Unable to confirm appointment');
        } finally {
            setConfirmingId('');
        }
    };

    // Record consultation payment and move the appointment into the paid list.
    const markPaid = async (appointment) => {
        setPayingId(appointment.id);
        setError('');
        setSuccess('');

        try {
            const response = await markAppointmentPaid(appointment.id, token);
            setSuccess(response.message);

            setConfirmedAppointments((current) =>
                current.filter((item) => item.id !== appointment.id),
            );

            // Add the paid appointment while keeping the list ordered by date.
            setPaidAppointments((current) =>
                [...current, response.appointment].sort(
                    (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate),
                ),
            );
        } catch (err) {
            setError(err.message || 'Unable to mark appointment as paid');
        } finally {
            setPayingId('');
        }
    };

    return (
        <main className="space-y-6">
            {/* Explain the receptionist workflow and provide the main page actions. */}
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="page-kicker">Receptionist Appointments</p>
                    <h1 className="page-title">Appointment Requests and Confirmations</h1>
                    <p className="page-description">
                        Review patient requests and confirmed appointments. Payment remains unpaid
                        until collected.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadAppointments} disabled={loading}>
                        Refresh
                    </Button>
                    <Button asChild>
                        <Link to="/appointments/new">Add Appointment</Link>
                    </Button>
                </div>
            </section>

            {/* Show request results and page loading state. */}
            {error && <Alert variant="destructive">{error}</Alert>}
            {success && <Alert>{success}</Alert>}
            {loading && (
                <Card className="p-6 text-sm text-slate-500">
                    Loading pending appointment requests...
                </Card>
            )}

            {/* Show requests waiting for receptionist confirmation. */}
            {!loading && (
                <AppointmentSection
                    title="Pending Appointments"
                    appointments={pendingAppointments}
                    emptyMessage="No pending appointment requests."
                    action={(appointment) => (
                        <Button
                            size="sm"
                            onClick={() => confirm(appointment)}
                            disabled={confirmingId === appointment.id}
                        >
                            {confirmingId === appointment.id
                                ? 'Confirming...'
                                : 'Confirm Appointment'}
                        </Button>
                    )}
                />
            )}

            {/* Show confirmed appointments waiting for consultation payment. */}
            {!loading && (
                <AppointmentSection
                    title="Confirmed Appointments"
                    appointments={confirmedAppointments}
                    emptyMessage="No confirmed appointments."
                    action={(appointment) => (
                        <Button
                            size="sm"
                            onClick={() => markPaid(appointment)}
                            disabled={payingId === appointment.id}
                        >
                            {payingId === appointment.id ? 'Updating...' : 'Mark as Paid'}
                        </Button>
                    )}
                />
            )}

            {/* Show appointments whose consultation payments are complete. */}
            {!loading && (
                <AppointmentSection
                    title="Paid Appointments"
                    appointments={paidAppointments}
                    emptyMessage="No paid appointments."
                    showPaymentStatus
                />
            )}
        </main>
    );
};

// Render one reusable appointment table for a specific workflow stage.
const AppointmentSection = ({
    title,
    appointments,
    emptyMessage,
    action,
    showPaymentStatus = false,
}) => (
    <CollapsibleSection title={title} count={appointments.length}>
        {/* Show a simple message when this workflow stage has no appointments. */}
        {appointments.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">{emptyMessage}</Card>
        ) : (
            // Show the appointments and any action supplied by the parent page.
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Appointment</TableHead>
                            <TableHead>
                                {action ? 'Fee' : showPaymentStatus ? 'Payment' : 'Status'}
                            </TableHead>
                            {action && <TableHead>Action</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Build one compact row for every appointment in this section. */}
                        {appointments.map((appointment) => (
                            <TableRow key={appointment.id}>
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
                                    {/* Show the correct third-column value for this workflow stage. */}
                                    {action ? (
                                        formatFee(appointment.consultationFee)
                                    ) : showPaymentStatus ? (
                                        <Badge variant="success">Confirmed and Paid</Badge>
                                    ) : (
                                        <Badge
                                            variant={
                                                appointment.status === 'confirmed'
                                                    ? 'success'
                                                    : 'warning'
                                            }
                                        >
                                            {appointment.status.replaceAll('_', ' ')}
                                        </Badge>
                                    )}
                                </TableCell>
                                {action && <TableCell>{action(appointment)}</TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        )}
    </CollapsibleSection>
);

// Format consultation fees consistently throughout the appointment tables.
const formatFee = (fee) => `LKR ${Number(fee || 0).toLocaleString()}`;

// Show a primary value with a smaller supporting value below it.
const CompactDetail = ({ title, subtitle }) => (
    <div className="min-w-44">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
);

export default AppointmentsPage;
