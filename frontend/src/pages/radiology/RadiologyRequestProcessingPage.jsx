import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { getRadiologyRequestById, updateRadiologyRequest } from '../../services/radiologyRequestService';

export default function RadiologyRequestProcessingPage() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const [request, setRequest] = useState(null);
    const [form, setForm] = useState({ status: 'requested', scheduledAt: '', imageUrl: '', report: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const canProcess = ['admin', 'radiologist'].includes(user?.role);

    useEffect(() => {
        getRadiologyRequestById(id, token).then(({ radiologyRequest }) => {
            setRequest(radiologyRequest);
            setForm({ status: radiologyRequest.status, scheduledAt: radiologyRequest.scheduledAt ? new Date(radiologyRequest.scheduledAt).toISOString().slice(0, 16) : '', imageUrl: radiologyRequest.imageUrl || '', report: radiologyRequest.report || '' });
        }).catch((err) => setError(err.message)).finally(() => setLoading(false));
    }, [id, token]);

    const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
    const save = async (event) => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        try {
            const response = await updateRadiologyRequest(id, form, token);
            setRequest(response.radiologyRequest); setSuccess(form.status === 'completed' ? 'Radiology report completed. Patient, doctor, and receptionist were notified.' : 'Radiology request updated successfully.');
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <main><Card className="p-6 text-sm text-slate-500">Loading radiology request...</Card></main>;
    return <main className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4"><div><p className="page-kicker">Radiology Processing</p><h1 className="page-title">{request?.patient?.fullName || 'Radiology Request'}</h1><p className="page-description">{request?.scanType} · {request?.bodyPart || 'Body part not recorded'}</p></div><Button asChild variant="outline"><Link to="/radiology">Radiology Requests</Link></Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}{success && <Alert>{success}</Alert>}
        {request && <form onSubmit={save} className="space-y-6"><Card><CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle>Scan Report</CardTitle><CardDescription>Clinical reason: {request.clinicalReason || 'Not recorded'}</CardDescription></div><Badge variant="success">{request.patientDecisionStatus?.replaceAll('_', ' ')}</Badge></div></CardHeader><CardContent className="space-y-4">
            <Field label="Status"><select disabled={!canProcess} name="status" value={form.status} onChange={change} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="requested">Requested</option><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></Field>
            <Field label="Scheduled Date and Time"><Input disabled={!canProcess} type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={change} /></Field>
            <Field label="Scan/Image URL"><Input disabled={!canProcess} name="imageUrl" value={form.imageUrl} onChange={change} placeholder="Secure uploaded scan URL" /></Field>
            <Field label="Radiology Report"><textarea disabled={!canProcess} name="report" value={form.report} onChange={change} rows={8} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm disabled:bg-slate-100" /></Field>
        </CardContent></Card>{canProcess && <Button type="submit" disabled={saving}>{saving ? 'Saving report...' : 'Save Radiology Report'}</Button>}</form>}
    </main>;
}

const Field = ({ label, children }) => <label className="block space-y-2"><Label>{label}</Label>{children}</label>;
