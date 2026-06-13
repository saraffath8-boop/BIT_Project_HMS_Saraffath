import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { getLabRequestById, updateLabRequest } from '../../services/labRequestService';

export default function LabRequestProcessingPage() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const [request, setRequest] = useState(null);
    const [status, setStatus] = useState('requested');
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const canProcess = ['admin', 'lab_technician'].includes(user?.role);

    useEffect(() => {
        getLabRequestById(id, token).then(({ labRequest }) => {
            setRequest(labRequest); setStatus(labRequest.status); setTests(labRequest.tests || []);
        }).catch((err) => setError(err.message)).finally(() => setLoading(false));
    }, [id, token]);

    const updateTest = (index, field, value) => setTests((items) => items.map((test, testIndex) => testIndex === index ? { ...test, [field]: value } : test));
    const save = async (event) => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        try {
            const response = await updateLabRequest(id, { status, tests }, token);
            setRequest(response.labRequest); setSuccess(status === 'completed' ? 'Laboratory report completed. Patient and doctor were notified.' : 'Laboratory request updated successfully.');
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <main><Card className="p-6 text-sm text-slate-500">Loading laboratory request...</Card></main>;
    return <main className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4"><div><p className="page-kicker">Laboratory Processing</p><h1 className="page-title">{request?.patient?.fullName || 'Laboratory Request'}</h1><p className="page-description">Results remain linked to the patient and consultation medical record.</p></div><Button asChild variant="outline"><Link to="/laboratory">Laboratory Requests</Link></Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}{success && <Alert>{success}</Alert>}
        {request && <form onSubmit={save} className="space-y-6">
            <Card><CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle>Request Summary</CardTitle><CardDescription>Doctor: {request.doctor?.name || 'Not recorded'} | Priority: {request.priority}</CardDescription></div><Badge variant="success">Payment: {request.paymentStatus || 'unpaid'}</Badge></div></CardHeader><CardContent><Label>Status</Label><select disabled={!canProcess} className="mt-2 h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="requested">Requested</option><option value="sample_collected">Sample Collected</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></CardContent></Card>
            <Card><CardHeader><CardTitle>Test Results</CardTitle><CardDescription>Add result values, reference ranges, and remarks before completion.</CardDescription></CardHeader><CardContent className="space-y-4">{tests.map((test, index) => <div key={test._id || index} className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2"><Field label="Test Name"><Input disabled value={test.testName} /></Field><Field label="Result"><Input disabled={!canProcess} value={test.result || ''} onChange={(event) => updateTest(index, 'result', event.target.value)} /></Field><Field label="Reference Range"><Input disabled={!canProcess} value={test.referenceRange || ''} onChange={(event) => updateTest(index, 'referenceRange', event.target.value)} /></Field><Field label="Remarks"><Input disabled={!canProcess} value={test.remarks || ''} onChange={(event) => updateTest(index, 'remarks', event.target.value)} /></Field></div>)}</CardContent></Card>
            {canProcess && <Button type="submit" disabled={saving}>{saving ? 'Saving results...' : 'Save Laboratory Results'}</Button>}
        </form>}
    </main>;
}

const Field = ({ label, children }) => <label className="space-y-2"><Label>{label}</Label>{children}</label>;
