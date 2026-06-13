import { CalendarDays, Clock, Stethoscope } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import {
    getDepartments,
    getDoctorAvailability,
    getDoctorsByDepartment,
} from '../../services/bookingService';
import { createAppointment } from '../../services/appointmentService';
import { getPatients } from '../../services/patientService';
import { getUsers } from '../../services/userService';
import { getOptionalValue, getPatientId, getPatientLabel } from '../shared/formHelpers';
import { createPageStyles as styles } from '../shared/createPageStyles';

const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatFee = (fee) => `LKR ${Number(fee || 0).toLocaleString()}`;

export default function AppointmentCreatePage() {
    const { user } = useAuth();
    return user?.role === 'receptionist' ? (
        <ReceptionistAppointmentRequestPage />
    ) : (
        <LegacyAppointmentCreatePage />
    );
}

const ReceptionistAppointmentRequestPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [patientMode, setPatientMode] = useState('existing');
    const [patient, setPatient] = useState('');
    const [patientDetails, setPatientDetails] = useState({
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
    });
    const [department, setDepartment] = useState('');
    const [doctor, setDoctor] = useState(null);
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([getPatients({ token, limit: 100 }), getDepartments()])
            .then(([patientResponse, departmentResponse]) => {
                setPatients(patientResponse.patients || []);
                setDepartments(departmentResponse.departments || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [token]);

    const selectDepartment = async (event) => {
        const id = event.target.value;
        setDepartment(id);
        setDoctor(null);
        setDoctors([]);
        setDate('');
        setSlots([]);
        setTimeSlot('');
        setError('');
        if (!id) return;
        setLoadingDoctors(true);
        try {
            const response = await getDoctorsByDepartment(id);
            setDoctors(response.doctors || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const selectDate = async (event) => {
        const selectedDate = event.target.value;
        setDate(selectedDate);
        setSlots([]);
        setTimeSlot('');
        setError('');
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

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await createAppointment(
                {
                    patient: patientMode === 'existing' ? patient : patientDetails,
                    doctor: doctor.id,
                    department,
                    appointmentDate: date,
                    timeSlot,
                    reason,
                },
                token,
            );
            navigate('/appointments', { replace: true });
        } catch (err) {
            setError(err.message || 'Unable to create appointment request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="space-y-6">
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="page-kicker">Receptionist Appointment Booking</p>
                    <h1 className="page-title">Create Appointment Request</h1>
                    <p className="page-description">
                        Book for an existing patient or register a new no-account patient, then
                        select an available doctor time slot.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link to="/appointments">Back to Appointments</Link>
                </Button>
            </section>
            {error && <Alert variant="destructive">{error}</Alert>}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Select Patient</CardTitle>
                            <CardDescription>
                                Choose an existing patient or enter details for a new patient who
                                does not need an account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                                <Button
                                    type="button"
                                    variant={patientMode === 'existing' ? 'default' : 'ghost'}
                                    onClick={() => setPatientMode('existing')}
                                >
                                    Existing Patient
                                </Button>
                                <Button
                                    type="button"
                                    variant={patientMode === 'new' ? 'default' : 'ghost'}
                                    onClick={() => setPatientMode('new')}
                                >
                                    New Patient
                                </Button>
                            </div>
                            {patientMode === 'existing' ? (
                                <div>
                                    <Label htmlFor="patient">Patient</Label>
                                    <select
                                        id="patient"
                                        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                        value={patient}
                                        onChange={(event) => setPatient(event.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">
                                            {loading ? 'Loading patients...' : 'Select patient'}
                                        </option>
                                        {patients.map((item) => (
                                            <option
                                                key={getPatientId(item)}
                                                value={getPatientId(item)}
                                            >
                                                {getPatientLabel(item)} - {item.phone}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <NewPatientFields
                                    details={patientDetails}
                                    setDetails={setPatientDetails}
                                />
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Select Department</CardTitle>
                            <CardDescription>Only active departments are shown.</CardDescription>
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
                                    {loading ? 'Loading departments...' : 'Select department'}
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
                                <CardTitle>3. Select Doctor</CardTitle>
                                <CardDescription>
                                    Choose a doctor assigned to the selected department.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingDoctors && (
                                    <p className="text-sm text-slate-500">Loading doctors...</p>
                                )}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {doctors.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                setDoctor(item);
                                                setDate('');
                                                setSlots([]);
                                                setTimeSlot('');
                                            }}
                                            className={`rounded-xl border p-4 text-left ${doctor?.id === item.id ? 'border-cyan-700 bg-cyan-50 ring-1 ring-cyan-700' : 'border-slate-200 hover:border-cyan-300'}`}
                                        >
                                            <div className="flex justify-between">
                                                <Stethoscope className="size-5 text-cyan-700" />
                                                {doctor?.id === item.id && <Badge>Selected</Badge>}
                                            </div>
                                            <p className="mt-3 font-semibold">{item.fullName}</p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {item.specialization || 'General consultation'}
                                            </p>
                                            <p className="mt-2 text-xs font-semibold">
                                                {formatFee(item.consultationFee)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                {!loadingDoctors && doctors.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        No active doctors are assigned to this department.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    {doctor && (
                        <Card>
                            <CardHeader>
                                <CardTitle>4. Select Date and Available Time</CardTitle>
                                <CardDescription>
                                    Only available future slots can be selected.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <Label htmlFor="date">Appointment Date</Label>
                                    <input
                                        id="date"
                                        type="date"
                                        min={tomorrow()}
                                        value={date}
                                        onChange={selectDate}
                                        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm sm:max-w-xs"
                                    />
                                </div>
                                {loadingSlots && (
                                    <p className="text-sm text-slate-500">
                                        Checking available time slots...
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {slots.map((slot) => (
                                        <Button
                                            key={slot.timeSlot}
                                            type="button"
                                            variant={
                                                timeSlot === slot.timeSlot ? 'default' : 'outline'
                                            }
                                            disabled={!slot.available}
                                            onClick={() => setTimeSlot(slot.timeSlot)}
                                        >
                                            <Clock className="size-4" />
                                            {slot.timeSlot}
                                        </Button>
                                    ))}
                                </div>
                                {!loadingSlots && date && slots.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        No available slots for this date.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
                <Card className="lg:sticky lg:top-6">
                    <CardHeader>
                        <CardTitle>Appointment Request</CardTitle>
                        <CardDescription>
                            This booking will begin as requested and unpaid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                                <p>
                                    Patient:{' '}
                                    <strong>
                                        {patientMode === 'existing'
                                            ? patients.find(
                                                  (item) => getPatientId(item) === patient,
                                              )?.fullName || 'Not selected'
                                            : patientDetails.fullName || 'Not entered'}
                                    </strong>
                                </p>
                                <p>
                                    Patient type:{' '}
                                    <strong>
                                        {patientMode === 'existing'
                                            ? 'Existing patient'
                                            : 'New no-account patient'}
                                    </strong>
                                </p>
                                <p>
                                    Doctor: <strong>{doctor?.fullName || 'Not selected'}</strong>
                                </p>
                                <p>
                                    Date: <strong>{date || 'Not selected'}</strong>
                                </p>
                                <p>
                                    Time: <strong>{timeSlot || 'Not selected'}</strong>
                                </p>
                                <p>
                                    Status: <strong>Requested / Unpaid</strong>
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="reason">Reason or Notes</Label>
                                <textarea
                                    id="reason"
                                    maxLength={500}
                                    rows={5}
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    disabled={!timeSlot}
                                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm disabled:bg-slate-100"
                                />
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                type="submit"
                                disabled={
                                    !isPatientReady(patientMode, patient, patientDetails) ||
                                    !doctor ||
                                    !date ||
                                    !timeSlot ||
                                    submitting
                                }
                            >
                                <CalendarDays className="size-4" />
                                {submitting ? 'Creating request...' : 'Create Appointment Request'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
};

const requiredNewPatientFields = [
    'fullName',
    'phone',
    'dateOfBirth',
    'gender',
    'address',
    'emergencyContactName',
    'emergencyContactPhone',
];
const isPatientReady = (mode, patient, details) =>
    mode === 'existing'
        ? Boolean(patient)
        : requiredNewPatientFields.every((field) => details[field]?.trim());
const NewPatientFields = ({ details, setDetails }) => {
    const update = (field) => (event) => setDetails({ ...details, [field]: event.target.value });
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div>
                <Label htmlFor="new-full-name">Full Name</Label>
                <Input
                    id="new-full-name"
                    required
                    maxLength={120}
                    value={details.fullName}
                    onChange={update('fullName')}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="new-phone">Phone Number</Label>
                <Input
                    id="new-phone"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="07XXXXXXXX"
                    value={details.phone}
                    onChange={update('phone')}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="new-date-of-birth">Date of Birth</Label>
                <Input
                    id="new-date-of-birth"
                    required
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={details.dateOfBirth}
                    onChange={update('dateOfBirth')}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="new-gender">Gender</Label>
                <select
                    id="new-gender"
                    required
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    value={details.gender}
                    onChange={update('gender')}
                >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div className="sm:col-span-2">
                <Label htmlFor="new-address">Address</Label>
                <Input
                    id="new-address"
                    required
                    maxLength={300}
                    value={details.address}
                    onChange={update('address')}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="new-emergency-name">Emergency Contact Name</Label>
                <Input
                    id="new-emergency-name"
                    required
                    maxLength={120}
                    value={details.emergencyContactName}
                    onChange={update('emergencyContactName')}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="new-emergency-phone">Emergency Contact Phone</Label>
                <Input
                    id="new-emergency-phone"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="07XXXXXXXX"
                    value={details.emergencyContactPhone}
                    onChange={update('emergencyContactPhone')}
                    className="mt-2"
                />
            </div>
        </div>
    );
};

const LegacyAppointmentCreatePage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({
        patient: '',
        doctor: '',
        department: '',
        appointmentDate: '',
        reason: '',
        status: 'scheduled',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const loadOptions = useCallback(async () => {
        try {
            const [patientResponse, doctorResponse] = await Promise.all([
                getPatients({ token, limit: 100 }),
                getUsers({ token, role: 'doctor' }),
            ]);
            setPatients(patientResponse.patients || []);
            setDoctors(doctorResponse.users || []);
        } catch (err) {
            setError(err.message);
        }
    }, [token]);
    useEffect(() => {
        loadOptions();
    }, [loadOptions]);
    const change = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await createAppointment(
                { ...formData, reason: getOptionalValue(formData.reason) },
                token,
            );
            navigate('/appointments');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Appointment Management</p>
                    <h1 style={styles.title}>Create Appointment</h1>
                    <p style={styles.subtitle}>Create a scheduled patient visit.</p>
                </div>
                <Link style={styles.secondaryLink} to="/appointments">
                    Appointments
                </Link>
            </section>
            {error && <div style={styles.error}>{error}</div>}
            <form style={styles.form} onSubmit={submit}>
                <div style={styles.grid}>
                    <label style={styles.label}>
                        Patient
                        <select
                            style={styles.input}
                            name="patient"
                            value={formData.patient}
                            onChange={change}
                            required
                        >
                            <option value="">Select patient</option>
                            {patients.map((item) => (
                                <option key={getPatientId(item)} value={getPatientId(item)}>
                                    {getPatientLabel(item)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label style={styles.label}>
                        Doctor
                        <select
                            style={styles.input}
                            name="doctor"
                            value={formData.doctor}
                            onChange={change}
                            required
                        >
                            <option value="">Select doctor</option>
                            {doctors.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label style={styles.label}>
                        Department
                        <input
                            style={styles.input}
                            name="department"
                            value={formData.department}
                            onChange={change}
                            required
                        />
                    </label>
                    <label style={styles.label}>
                        Appointment Date and Time
                        <input
                            style={styles.input}
                            type="datetime-local"
                            name="appointmentDate"
                            value={formData.appointmentDate}
                            onChange={change}
                            required
                        />
                    </label>
                </div>
                <label style={styles.label}>
                    Reason
                    <textarea
                        style={styles.textarea}
                        name="reason"
                        value={formData.reason}
                        onChange={change}
                    />
                </label>
                <button style={styles.primaryButton} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Appointment'}
                </button>
            </form>
        </main>
    );
};
