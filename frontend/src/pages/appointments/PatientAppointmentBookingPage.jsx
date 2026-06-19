// This file contains the patient appointment booking page interface.

import { ArrowLeft, CalendarDays, Clock, HeartPulse, Stethoscope } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../context/AuthContext';
import {
    getDepartments,
    getDoctorAvailability,
    getDoctorsByDepartment,
    requestAppointment,
} from '../../services/bookingService';
import { getAppointmentDateOptions } from './appointmentBookingDates';

// Prepare fee.
const formatFee = (fee) =>
    fee ? `LKR ${Number(fee).toLocaleString()}` : 'Fee confirmed by receptionist';
export default function PatientAppointmentBookingPage() {
    const { token, user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [department, setDepartment] = useState('');
    const [doctor, setDoctor] = useState(null);
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [reason, setReason] = useState('');
    const [patientDetails, setPatientDetails] = useState({
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
    });
    const [loading, setLoading] = useState(true);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const dateSectionRef = useRef(null);
    const isPatient =
        typeof user?.role === 'string' && user.role.trim().toLowerCase() === 'patient';
    const appointmentDates = getAppointmentDateOptions();

    // Run this work when the listed values change.
    useEffect(() => {
        getDepartments()
            .then((response) => setDepartments(response.departments || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Handle select department.
    const selectDepartment = async (event) => {
        const departmentId = event.target.value;
        setDepartment(departmentId);
        setDoctor(null);
        setDate('');
        setSlots([]);
        setTimeSlot('');
        setError('');
        setSuccess('');
        if (!departmentId) {
            setDoctors([]);
            return;
        }
        setLoadingDoctors(true);
        try {
            const response = await getDoctorsByDepartment(departmentId);
            setDoctors(response.doctors || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDoctors(false);
        }
    };

    // Handle select doctor.
    const selectDoctor = (selectedDoctor) => {
        setDoctor(selectedDoctor);
        setDate('');
        setSlots([]);
        setTimeSlot('');
        setError('');
        setSuccess('');
        setTimeout(
            () => dateSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
            0,
        );
    };

    // Handle select date.
    const selectDate = async (event) => {
        const selectedDate = event.target.value;
        setDate(selectedDate);
        setSlots([]);
        setTimeSlot('');
        setError('');
        setSuccess('');
        if (!doctor || !selectedDate) return;
        setLoadingSlots(true);
        try {
            const response = await getDoctorAvailability(doctor.id, selectedDate);
            setSlots(response.slots || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSlots(false);
        }
    };

    // Handle submit.
    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const response = await requestAppointment(
                {
                    doctor: doctor?.id,
                    department,
                    appointmentDate: date,
                    timeSlot,
                    reason,
                    ...(!isPatient && { patient: patientDetails }),
                },
                isPatient ? token : undefined,
            );
            setSuccess(
                response.message ||
                    'Appointment request submitted successfully. Please meet the receptionist for confirmation and payment.',
            );
            setTimeSlot('');
            setReason('');
            const refreshed = await getDoctorAvailability(doctor.id, date);
            setSlots(refreshed.slots || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
                    <Link to={token ? '/dashboard' : '/'} className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-cyan-700 text-white">
                            <HeartPulse className="size-6" />
                        </span>
                        <div>
                            <p className="font-bold text-slate-950">Digital Hospital</p>
                            <p className="text-xs text-slate-500">Patient appointment booking</p>
                        </div>
                    </Link>
                    <Button asChild variant="outline">
                        <Link to={token ? '/dashboard' : '/'}>
                            <ArrowLeft className="size-4" />
                            {token ? 'Dashboard' : 'Home'}
                        </Link>
                    </Button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8">
                <section>
                    <p className="page-kicker">Patient Services</p>
                    <h1 className="page-title">Book an Appointment</h1>
                    <p className="page-description">
                        Choose a department, doctor, and an available slot for today or tomorrow. A
                        receptionist will confirm your request and payment.
                    </p>
                </section>
                {!isPatient && (
                    <Alert>
                        No patient account is required. Enter your details and submit the request;
                        it will appear in the receptionist&apos;s pending appointments.
                    </Alert>
                )}
                {error && <Alert variant="destructive">{error}</Alert>}
                {success && <Alert>{success}</Alert>}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Select Department</CardTitle>
                                <CardDescription>
                                    Only active hospital departments are shown.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Label htmlFor="department">Department</Label>
                                <select
                                    id="department"
                                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                    value={department}
                                    onChange={selectDepartment}
                                    disabled={loading}
                                >
                                    <option value="">
                                        {loading ? 'Loading departments...' : 'Select a department'}
                                    </option>
                                    {departments.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </CardContent>
                        </Card>

                        {department && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>2. Select Doctor</CardTitle>
                                    <CardDescription>
                                        Doctors assigned to your selected department.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingDoctors && (
                                        <p className="text-sm text-slate-500">Loading doctors...</p>
                                    )}
                                    {!loadingDoctors && doctors.length === 0 && (
                                        <p className="text-sm text-slate-500">
                                            No active doctors are currently assigned to this
                                            department.
                                        </p>
                                    )}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {doctors.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => selectDoctor(item)}
                                                className={`rounded-xl border p-4 text-left transition ${doctor?.id === item.id ? 'border-cyan-700 bg-cyan-50 ring-1 ring-cyan-700' : 'border-slate-200 bg-white hover:border-cyan-300'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="grid size-10 place-items-center rounded-lg bg-cyan-100 text-cyan-800">
                                                        <Stethoscope className="size-5" />
                                                    </span>
                                                    {doctor?.id === item.id && (
                                                        <Badge>Selected</Badge>
                                                    )}
                                                </div>
                                                <p className="mt-4 font-semibold text-slate-950">
                                                    {item.fullName}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {item.department?.name ||
                                                        'Department not recorded'}{' '}
                                                    ·{' '}
                                                    {item.specialization || 'General consultation'}
                                                </p>
                                                <p className="mt-3 text-xs font-semibold text-slate-600">
                                                    {formatFee(item.consultationFee)}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {doctor && (
                            <div ref={dateSectionRef}>
                                <Card className="ring-1 ring-cyan-100">
                                    <CardHeader>
                                        <CardTitle>3. Select Date and Time</CardTitle>
                                        <CardDescription>
                                            Choose today or tomorrow to load the receptionist-managed
                                            time slots.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div>
                                            <Label htmlFor="appointmentDate">
                                                Appointment Date
                                            </Label>
                                            <select
                                                id="appointmentDate"
                                                value={date}
                                                onChange={selectDate}
                                                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm sm:max-w-xs"
                                            >
                                                <option value="">Select today or tomorrow</option>
                                                {appointmentDates.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {loadingSlots && (
                                            <p className="text-sm text-slate-500">
                                                Checking available time slots...
                                            </p>
                                        )}
                                        {!loadingSlots && date && slots.length === 0 && (
                                            <p className="text-sm text-slate-500">
                                                This doctor has no available slots on the selected
                                                date.
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {slots.map((slot) => (
                                                <Button
                                                    key={slot.timeSlot}
                                                    type="button"
                                                    variant={
                                                        timeSlot === slot.timeSlot
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    onClick={() => setTimeSlot(slot.timeSlot)}
                                                >
                                                    <Clock className="size-4" />
                                                    {slot.timeSlot}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    <Card className="lg:sticky lg:top-6">
                        <CardHeader>
                            <CardTitle>Appointment Request</CardTitle>
                            <CardDescription>
                                Review your selection before submitting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                                    <p>
                                        <span className="text-slate-500">Doctor:</span>{' '}
                                        <strong>{doctor?.fullName || 'Not selected'}</strong>
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Date:</span>{' '}
                                        <strong>{date || 'Not selected'}</strong>
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Time:</span>{' '}
                                        <strong>{timeSlot || 'Not selected'}</strong>
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Payment:</span>{' '}
                                        <strong>
                                            {timeSlot
                                                ? 'Pay at reception after confirmation'
                                                : 'Available after selecting a slot'}
                                        </strong>
                                    </p>
                                </div>
                                {!isPatient && (
                                    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                                        <div>
                                            <p className="font-semibold text-slate-950">
                                                Patient Details
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                These details identify the appointment request for
                                                the receptionist.
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                required
                                                maxLength={120}
                                                value={patientDetails.fullName}
                                                onChange={(event) =>
                                                    setPatientDetails({
                                                        ...patientDetails,
                                                        fullName: event.target.value,
                                                    })
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                required
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="07XXXXXXXX"
                                                value={patientDetails.phone}
                                                onChange={(event) =>
                                                    setPatientDetails({
                                                        ...patientDetails,
                                                        phone: event.target.value,
                                                    })
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                            <Input
                                                id="dateOfBirth"
                                                required
                                                type="date"
                                                max={new Date().toISOString().slice(0, 10)}
                                                value={patientDetails.dateOfBirth}
                                                onChange={(event) =>
                                                    setPatientDetails({
                                                        ...patientDetails,
                                                        dateOfBirth: event.target.value,
                                                    })
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="gender">Gender</Label>
                                            <select
                                                id="gender"
                                                required
                                                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                                value={patientDetails.gender}
                                                onChange={(event) =>
                                                    setPatientDetails({
                                                        ...patientDetails,
                                                        gender: event.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="address">Address</Label>
                                            <Input
                                                id="address"
                                                required
                                                maxLength={300}
                                                value={patientDetails.address}
                                                onChange={(event) =>
                                                    setPatientDetails({
                                                        ...patientDetails,
                                                        address: event.target.value,
                                                    })
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="emergencyContactName">
                                                Emergency Contact Name
                                            </Label>
                                            <Input
                                                id="emergencyContactName"
                                                required
                                                maxLength={120}
                                                value={patientDetails.emergencyContactName}
                                                onChange={(event) =>
                                                    setPatientDetails({
                                                        ...patientDetails,
                                                        emergencyContactName: event.target.value,
                                                    })
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="emergencyContactPhone">
                                                Emergency Contact Phone
                                            </Label>
                                            <Input
                                                id="emergencyContactPhone"
                                                required
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="07XXXXXXXX"
                                                value={patientDetails.emergencyContactPhone}
                                                onChange={(event) =>
                                                    setPatientDetails({
                                                        ...patientDetails,
                                                        emergencyContactPhone: event.target.value,
                                                    })
                                                }
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="reason">Reason for Visit</Label>
                                    <textarea
                                        id="reason"
                                        maxLength={500}
                                        rows={5}
                                        value={reason}
                                        onChange={(event) => setReason(event.target.value)}
                                        disabled={!timeSlot}
                                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                                        placeholder={
                                            timeSlot
                                                ? 'Briefly describe the reason for your visit'
                                                : 'Select a date and time slot first'
                                        }
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    type="submit"
                                    disabled={!doctor || !date || !timeSlot || submitting}
                                >
                                    <CalendarDays className="size-4" />
                                    {submitting ? 'Submitting request...' : 'Book Appointment'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
