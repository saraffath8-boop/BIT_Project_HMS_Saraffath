import { Clock, Stethoscope, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    replaceDoctorAvailability,
} from '../../services/bookingService';
import { getAppointmentDateOptions } from './appointmentBookingDates';

export default function DoctorAvailabilityPage() {
    const { token } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [department, setDepartment] = useState('');
    const [doctor, setDoctor] = useState(null);
    const [date, setDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const appointmentDates = getAppointmentDateOptions();

    useEffect(() => {
        getDepartments()
            .then((response) => setDepartments(response.departments || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const selectDepartment = async (event) => {
        const departmentId = event.target.value;
        setDepartment(departmentId);
        setDoctor(null);
        setDate('');
        setSlots([]);
        setDoctors([]);
        setError('');
        setSuccess('');
        if (!departmentId) return;

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

    const selectDoctor = (selectedDoctor) => {
        setDoctor(selectedDoctor);
        setDate('');
        setSlots([]);
        setTime('');
        setError('');
        setSuccess('');
    };

    const selectDate = async (event) => {
        const selectedDate = event.target.value;
        setDate(selectedDate);
        setSlots([]);
        setTime('');
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

    const saveSlots = async (timeSlots, message) => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await replaceDoctorAvailability(doctor.id, date, timeSlots, token);
            setSlots(response.slots || []);
            setTime('');
            setSuccess(message);
        } catch (err) {
            setError(err.message || 'Unable to update doctor availability');
        } finally {
            setSaving(false);
        }
    };

    const addSlot = () => {
        if (!time) return;
        if (slots.some((slot) => slot.timeSlot === time)) {
            setError('This time slot already exists');
            return;
        }
        saveSlots([...slots.map((slot) => slot.timeSlot), time], 'Time slot added successfully');
    };

    const removeSlot = (timeSlot) =>
        saveSlots(
            slots.map((slot) => slot.timeSlot).filter((slot) => slot !== timeSlot),
            'Time slot removed successfully',
        );

    return (
        <main className="space-y-6">
            <section>
                <p className="page-kicker">Receptionist Scheduling</p>
                <h1 className="page-title">Doctor Availability</h1>
                <p className="page-description">
                    Create and remove doctor time slots for today or tomorrow. These slots appear in
                    every appointment booking form.
                </p>
            </section>

            {error && <Alert variant="destructive">{error}</Alert>}
            {success && <Alert>{success}</Alert>}

            <div className="grid items-start gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Doctor</CardTitle>
                        <CardDescription>Choose a department, then select its doctor.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <Label htmlFor="availability-department">Department</Label>
                            <select
                                id="availability-department"
                                value={department}
                                onChange={selectDepartment}
                                disabled={loading}
                                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
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
                        </div>
                        {loadingDoctors && <p className="text-sm text-slate-500">Loading doctors...</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {doctors.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectDoctor(item)}
                                    className={`rounded-xl border p-4 text-left ${doctor?.id === item.id ? 'border-cyan-700 bg-cyan-50 ring-1 ring-cyan-700' : 'border-slate-200 hover:border-cyan-300'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <Stethoscope className="size-5 text-cyan-700" />
                                        {doctor?.id === item.id && <Badge>Selected</Badge>}
                                    </div>
                                    <p className="mt-3 font-semibold">{item.fullName}</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {item.specialization || 'General consultation'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Manage Time Slots</CardTitle>
                        <CardDescription>
                            Type a time for the selected doctor and date. Remove slots when the
                            schedule changes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <Label htmlFor="availability-date">Date</Label>
                            <select
                                id="availability-date"
                                value={date}
                                onChange={selectDate}
                                disabled={!doctor}
                                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="">Select today or tomorrow</option>
                                {appointmentDates.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="availability-time">Time</Label>
                            <div className="mt-2 flex gap-2">
                                <Input
                                    id="availability-time"
                                    type="time"
                                    value={time}
                                    onChange={(event) => setTime(event.target.value)}
                                    disabled={!date || saving}
                                />
                                <Button type="button" onClick={addSlot} disabled={!time || saving}>
                                    {saving ? 'Saving...' : 'Add Time'}
                                </Button>
                            </div>
                        </div>
                        {loadingSlots && <p className="text-sm text-slate-500">Loading time slots...</p>}
                        {!loadingSlots && date && slots.length === 0 && (
                            <p className="text-sm text-slate-500">
                                No time slots created for this doctor on the selected date.
                            </p>
                        )}
                        <div className="space-y-2">
                            {slots.map((slot) => (
                                <div
                                    key={slot.timeSlot}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                                >
                                    <span className="flex items-center gap-2 font-semibold">
                                        <Clock className="size-4 text-cyan-700" />
                                        {slot.timeSlot}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSlot(slot.timeSlot)}
                                        disabled={saving}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="size-4" />
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
