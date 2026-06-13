import { FlaskConical, Pill, ScanLine, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { createConsultation, getAppointmentById } from '../../services/appointmentService';

const emptyPrescriptionItem = { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' };
const emptyVitals = { temperature: '', bloodPressure: '', pulse: '', respiratoryRate: '', oxygenSaturation: '', weight: '' };

export default function DoctorConsultationPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [appointment, setAppointment] = useState(null);
    const [medicalRecord, setMedicalRecord] = useState({ chiefComplaint: '', diagnosis: '', consultationNotes: '', followUpDate: '', vitalSigns: emptyVitals });
    const [includePrescription, setIncludePrescription] = useState(false);
    const [prescription, setPrescription] = useState({ items: [{ ...emptyPrescriptionItem }], notes: '' });
    const [includeLab, setIncludeLab] = useState(false);
    const [labRequest, setLabRequest] = useState({ testNames: '', priority: 'routine' });
    const [includeRadiology, setIncludeRadiology] = useState(false);
    const [radiologyRequest, setRadiologyRequest] = useState({ scanType: '', bodyPart: '', clinicalReason: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        getAppointmentById(id, token)
            .then((response) => setAppointment(response.appointment))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id, token]);

    const updateRecord = (event) => setMedicalRecord({ ...medicalRecord, [event.target.name]: event.target.value });
    const updateVital = (event) => setMedicalRecord({ ...medicalRecord, vitalSigns: { ...medicalRecord.vitalSigns, [event.target.name]: event.target.value } });
    const updatePrescriptionItem = (index, event) => setPrescription({ ...prescription, items: prescription.items.map((item, itemIndex) => itemIndex === index ? { ...item, [event.target.name]: event.target.value } : item) });
    const addPrescriptionItem = () => setPrescription({ ...prescription, items: [...prescription.items, { ...emptyPrescriptionItem }] });
    const removePrescriptionItem = (index) => setPrescription({ ...prescription, items: prescription.items.filter((_, itemIndex) => itemIndex !== index) });

    const submit = async (event) => {
        event.preventDefault(); setError(''); setSuccess(''); setSubmitting(true);
        const payload = { medicalRecord };
        if (includePrescription) payload.prescription = prescription;
        if (includeLab) payload.labRequest = { priority: labRequest.priority, tests: labRequest.testNames.split(',').map((testName) => ({ testName: testName.trim() })).filter((test) => test.testName) };
        if (includeRadiology) payload.radiologyRequest = radiologyRequest;

        try {
            const response = await createConsultation(id, payload, token);
            setSuccess(`${response.message}. The diagnosis report was saved and created requests were routed to their relevant sections.`);
            setAppointment(response.consultation?.appointment || appointment);
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    if (loading) return <main><Card className="p-6 text-sm text-slate-500">Loading appointment...</Card></main>;

    return <main className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4"><div><p className="page-kicker">Doctor Queue</p><h1 className="page-title">{appointment?.patient?.fullName || 'Patient Diagnosis Report'}</h1><p className="page-description">{appointment ? `${new Date(appointment.appointmentDate).toLocaleString()} · ${appointment.department} · Status: ${appointment.status.replaceAll('_', ' ')}` : 'Open a checked queue entry and record the diagnosis report.'}</p></div><Button asChild variant="outline"><Link to="/queue">Queue</Link></Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}{success && <Alert>{success}</Alert>}

        <form onSubmit={submit} className="space-y-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="size-5 text-cyan-700" />Medical Record</CardTitle><CardDescription>Required consultation documentation linked to this appointment.</CardDescription></CardHeader><CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2"><Field label="Chief Complaint"><Input name="chiefComplaint" value={medicalRecord.chiefComplaint} onChange={updateRecord} /></Field><Field label="Follow-up Date"><Input type="date" name="followUpDate" value={medicalRecord.followUpDate} onChange={updateRecord} /></Field></div>
                <Field label="Diagnosis"><Textarea name="diagnosis" value={medicalRecord.diagnosis} onChange={updateRecord} required /></Field>
                <Field label="Consultation Notes"><Textarea name="consultationNotes" value={medicalRecord.consultationNotes} onChange={updateRecord} /></Field>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.keys(emptyVitals).map((field) => <Field key={field} label={field.replace(/([A-Z])/g, ' $1')}><Input name={field} value={medicalRecord.vitalSigns[field]} onChange={updateVital} /></Field>)}</div>
            </CardContent></Card>

            <OptionalCard checked={includePrescription} onChange={setIncludePrescription} icon={Pill} title="Prescription" description="The cashier receives this prescription first; payment sends it to the pharmacist.">
                {prescription.items.map((item, index) => <div key={index} className="space-y-4 rounded-xl border border-slate-200 p-4"><div className="grid gap-4 sm:grid-cols-2">{Object.keys(emptyPrescriptionItem).map((field) => <Field key={field} label={field.replace(/([A-Z])/g, ' $1')}><Input name={field} value={item[field]} onChange={(event) => updatePrescriptionItem(index, event)} required={includePrescription && field !== 'instructions'} /></Field>)}</div>{prescription.items.length > 1 && <Button type="button" variant="outline" onClick={() => removePrescriptionItem(index)}>Remove Medicine</Button>}</div>)}
                <Button type="button" variant="outline" onClick={addPrescriptionItem}>Add Medicine</Button>
                <Field label="Prescription Notes"><Textarea value={prescription.notes} onChange={(event) => setPrescription({ ...prescription, notes: event.target.value })} /></Field>
            </OptionalCard>

            <OptionalCard checked={includeLab} onChange={setIncludeLab} icon={FlaskConical} title="Laboratory Request" description="Comma-separated tests awaiting the patient's decision.">
                <Field label="Test Names"><Input value={labRequest.testNames} onChange={(event) => setLabRequest({ ...labRequest, testNames: event.target.value })} placeholder="Full blood count, Blood glucose" required={includeLab} /></Field>
                <Field label="Priority"><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" value={labRequest.priority} onChange={(event) => setLabRequest({ ...labRequest, priority: event.target.value })}><option value="routine">Routine</option><option value="urgent">Urgent</option></select></Field>
            </OptionalCard>

            <OptionalCard checked={includeRadiology} onChange={setIncludeRadiology} icon={ScanLine} title="Radiology Request" description="Imaging request awaiting the patient's decision.">
                <div className="grid gap-4 sm:grid-cols-2"><Field label="Scan Type"><Input value={radiologyRequest.scanType} onChange={(event) => setRadiologyRequest({ ...radiologyRequest, scanType: event.target.value })} required={includeRadiology} /></Field><Field label="Body Part"><Input value={radiologyRequest.bodyPart} onChange={(event) => setRadiologyRequest({ ...radiologyRequest, bodyPart: event.target.value })} /></Field></div>
                <Field label="Clinical Reason"><Textarea value={radiologyRequest.clinicalReason} onChange={(event) => setRadiologyRequest({ ...radiologyRequest, clinicalReason: event.target.value })} /></Field>
            </OptionalCard>

            <Button type="submit" size="lg" disabled={submitting || Boolean(success)}>{submitting ? 'Saving diagnosis report...' : 'Save Diagnosis Report and Requests'}</Button>
        </form>
    </main>;
}

const Field = ({ label, children }) => <label className="block space-y-2"><Label className="capitalize">{label}</Label>{children}</label>;
const Textarea = (props) => <textarea rows={4} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" {...props} />;
const OptionalCard = ({ checked, onChange, icon: Icon, title, description, children }) => <Card><CardHeader><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 accent-cyan-700" /><Icon className="mt-0.5 size-5 text-cyan-700" /><span><CardTitle>{title}</CardTitle><CardDescription className="mt-1">{description}</CardDescription></span></label></CardHeader>{checked && <CardContent className="space-y-4">{children}</CardContent>}</Card>;
