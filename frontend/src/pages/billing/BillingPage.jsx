import { useCallback, useEffect, useState } from 'react';
import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getBills } from '../../services/billService';
import { useAuth } from '../../context/AuthContext';
import { downloadHospitalBillPdf } from '../../lib/hospitalBillPdf';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getPrescriptions, markPrescriptionPaid } from '../../services/prescriptionService';
import { Input } from '../../components/ui/input';
import { CollapsibleSection } from '../../components/ui/collapsible-section';
import { getLabRequests, markLabRequestPaid } from '../../services/labRequestService';
import { getRadiologyRequests, markRadiologyRequestPaid } from '../../services/radiologyRequestService';

const BillingPage = () => {
    const { user } = useAuth();
    if (user?.role === 'receptionist') return <ReceptionistBillingPage />;
    if (user?.role === 'pharmacist') return <PharmacistBillingPage />;
    if (user?.role === 'lab_technician') return <ClinicalOperatorBillingPage type="laboratory" />;
    if (user?.role === 'radiologist') return <ClinicalOperatorBillingPage type="radiology" />;
    return <ModuleListPage
        title="Billing Records"
        kicker="Billing Management"
        description="Review patient bills, service totals, payment status, and outstanding balances."
        loadData={getBills}
        itemsKey="bills"
        createAction={{ to: '/billing/new', label: 'Add Bill', allowedRoles: ['admin'] }}
        emptyMessage="No billing records are currently available."
        columns={[
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Service', render: (item) => item.billType?.replaceAll('_', ' ') || 'Consultation' },
            { label: 'Paid Amount', render: (item) => `LKR ${Number(item.paidAmount || 0).toLocaleString()}` },
            { label: 'Bill', render: (item) => <Button size="sm" onClick={() => downloadHospitalBillPdf(item)}>Download PDF</Button> },
        ]}
    />;
};

const ReceptionistBillingPage = () => {
    const { token } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const loadBills = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const response = await getBills({ token });
            setBills((response.bills || []).filter((bill) => bill.billType === 'consultation'));
        } catch (err) { setError(err.message || 'Unable to load consultation bills'); }
        finally { setLoading(false); }
    }, [token]);
    useEffect(() => { const id = setTimeout(loadBills, 0); return () => clearTimeout(id); }, [loadBills]);

    return <main className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="page-kicker">Receptionist Billing</p><h1 className="page-title">Consultation Billing</h1><p className="page-description">Review paid consultation bills.</p></div><Button variant="outline" onClick={loadBills} disabled={loading}>Refresh</Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading consultation bills...</Card>}
        {!loading && <CollapsibleSection title="Paid Consultation Bills" count={bills.length}>
            {bills.length === 0 ? <Card className="p-10 text-center text-sm text-slate-500">No paid consultation bills are available.</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Appointment</TableHead><TableHead>Paid Amount</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{bills.map((bill) => <TableRow key={bill.id}><TableCell><PersonSummary person={bill.patient} /></TableCell><TableCell><DetailSummary title={getPersonName(bill.doctor)} subtitle={formatDateTime(bill.appointment?.appointmentDate)} /></TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
        </CollapsibleSection>}
    </main>;
};

const ClinicalOperatorBillingPage = ({ type }) => {
    const { token } = useAuth();
    const isLaboratory = type === 'laboratory';
    const label = isLaboratory ? 'Laboratory' : 'Radiology';
    const [requests, setRequests] = useState([]);
    const [bills, setBills] = useState([]);
    const [amounts, setAmounts] = useState({});
    const [payingId, setPayingId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const loadBilling = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [requestResponse, billResponse] = await Promise.all([
                isLaboratory ? getLabRequests({ token, filters: { paymentStatus: 'unpaid' } }) : getRadiologyRequests({ token, filters: { paymentStatus: 'unpaid' } }),
                getBills({ token }),
            ]);
            const incomingRequests = isLaboratory ? requestResponse.labRequests || [] : requestResponse.radiologyRequests || [];
            setRequests(incomingRequests.filter((request) => !['completed', 'cancelled'].includes(request.status) && request.patientDecisionStatus !== 'pending_patient_decision'));
            setBills((billResponse.bills || []).filter((bill) => bill.billType === type));
        } catch (err) { setError(err.message || `Unable to load ${type} billing`); }
        finally { setLoading(false); }
    }, [isLaboratory, token, type]);
    useEffect(() => { const id = setTimeout(loadBilling, 0); return () => clearTimeout(id); }, [loadBilling]);
    const markPaid = async (request) => {
        setPayingId(`${type}:${request.id}`); setError(''); setSuccess('');
        try {
            const amount = Number(amounts[request.id]);
            if (!(amount > 0)) throw new Error('Enter a valid amount before marking the request paid');
            const response = isLaboratory
                ? await markLabRequestPaid(request.id, amount, token)
                : await markRadiologyRequestPaid(request.id, amount, token);
            setRequests((items) => items.filter((item) => item.id !== request.id));
            setBills((items) => [response.bill, ...items]);
            setSuccess(response.message);
        } catch (err) { setError(err.message || `Unable to mark ${type} request as paid`); }
        finally { setPayingId(''); }
    };
    const requestDescription = (request) => isLaboratory
        ? request.tests?.map((test) => test.testName).join(', ') || 'Laboratory tests'
        : `${request.scanType}${request.bodyPart ? ` - ${request.bodyPart}` : ''}`;

    return <main className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="page-kicker">{label} Billing</p><h1 className="page-title">{label} Payments and Bills</h1><p className="page-description">Collect request payments before processing.</p></div><Button variant="outline" onClick={loadBilling} disabled={loading}>Refresh</Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading {type} billing...</Card>}
        {!loading && <ClinicalPaymentQueue title={`${label} Payment Queue`} requests={requests} type={type} amounts={amounts} setAmounts={setAmounts} payingId={payingId} onPay={markPaid} description={requestDescription} />}
        {!loading && <PaidServiceBills title={`Paid ${label} Bills`} bills={bills} emptyMessage={`No paid ${type} bills are available.`} />}
    </main>;
};

const PharmacistBillingPage = () => {
    const { token } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [pharmacyBills, setPharmacyBills] = useState([]);
    const [amounts, setAmounts] = useState({});
    const [payingId, setPayingId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadBilling = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [prescriptionResponse, billResponse] = await Promise.all([
                getPrescriptions({ token, filters: { paymentStatus: 'unpaid' } }),
                getBills({ token }),
            ]);
            setPrescriptions(prescriptionResponse.prescriptions || []);
            setPharmacyBills((billResponse.bills || []).filter((bill) => bill.billType === 'pharmacy'));
        } catch (err) { setError(err.message || 'Unable to load pharmacy billing'); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => { const id = setTimeout(loadBilling, 0); return () => clearTimeout(id); }, [loadBilling]);

    const markPaid = async (prescription) => {
        setPayingId(prescription.id); setError(''); setSuccess('');
        try {
            const amount = Number(amounts[prescription.id]);
            if (!(amount > 0)) throw new Error('Enter a valid prescription amount before marking it paid');
            const response = await markPrescriptionPaid(prescription.id, amount, token);
            setPrescriptions((items) => items.filter((item) => item.id !== prescription.id));
            setPharmacyBills((items) => [response.bill, ...items]);
            setSuccess(response.message);
        } catch (err) { setError(err.message || 'Unable to mark prescription as paid'); }
        finally { setPayingId(''); }
    };

    return <main className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="page-kicker">Pharmacist Billing</p><h1 className="page-title">Prescription Payments and Pharmacy Bills</h1><p className="page-description">Collect prescription payments, then distribute paid medicines from the prescriptions section.</p></div><Button variant="outline" onClick={loadBilling} disabled={loading}>Refresh</Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading pharmacy billing...</Card>}
        {!loading && <PrescriptionCashierQueue prescriptions={prescriptions} amounts={amounts} setAmounts={setAmounts} payingId={payingId} onPay={markPaid} />}
        {!loading && <CollapsibleSection title="Paid Pharmacy Bills" count={pharmacyBills.length}>
            {pharmacyBills.length === 0 ? <Card className="p-10 text-center text-sm text-slate-500">No paid pharmacy bills are available.</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Medicines</TableHead><TableHead>Paid Amount</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{pharmacyBills.map((bill) => <TableRow key={bill.id}><TableCell><PersonSummary person={bill.patient} /></TableCell><TableCell className="max-w-72 whitespace-normal">{bill.items?.map((item) => item.description).join(', ') || 'Prescription medicines'}</TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
        </CollapsibleSection>}
    </main>;
};

const ClinicalPaymentQueue = ({ title, requests, type, amounts, setAmounts, payingId, onPay, description }) => <CollapsibleSection title={title} count={requests.length}>
    {requests.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">No unpaid requests are waiting.</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Request</TableHead><TableHead>Amount (LKR)</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{requests.map((request) => {
        const key = `${type}:${request.id}`;
        return <TableRow key={request.id}><TableCell><PersonSummary person={request.patient} /></TableCell><TableCell><DetailSummary title={description(request)} subtitle={`Doctor: ${getPersonName(request.doctor)}`} /></TableCell><TableCell><Input className="min-w-28" type="number" min="0.01" step="0.01" value={amounts[key] || ''} onChange={(event) => setAmounts((current) => ({ ...current, [key]: event.target.value }))} placeholder="Enter amount" /></TableCell><TableCell><Button size="sm" disabled={payingId === key || !(Number(amounts[key]) > 0)} onClick={() => onPay(request, type)}>{payingId === key ? 'Updating...' : 'Mark Paid'}</Button></TableCell></TableRow>;
    })}</TableBody></Table></Card>}
</CollapsibleSection>;

const PrescriptionCashierQueue = ({ prescriptions, amounts, setAmounts, payingId, onPay }) => <CollapsibleSection title="Prescription Cashier Queue" count={prescriptions.length} >
    {prescriptions.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">No unpaid prescriptions are waiting.</Card> : <div className="grid gap-4">{prescriptions.map((prescription) => {
        const amount = amounts[prescription.id] || '';
        return <Card key={prescription.id} className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <PersonSummary person={prescription.patient} />
                <div className="text-right text-sm"><p className="font-medium text-slate-900">Doctor: {getPersonName(prescription.doctor)}</p><p className="mt-1 text-xs text-slate-500">Prescribed {formatDateTime(prescription.createdAt)}</p></div>
            </div>
            <div className="space-y-4 p-5">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 bg-cyan-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-cyan-900"><span>#</span><span>Prescribed medicines</span></div>
                    {(prescription.items || []).map((item, index) => <div key={item._id || `${prescription.id}-${index}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 border-t border-slate-100 px-4 py-3">
                        <span className="grid size-6 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800">{index + 1}</span>
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-950">{item.medicineName}</p>{item.medicine?.unitPrice != null && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Reference unit price: LKR {Number(item.medicine.unitPrice).toLocaleString()}</span>}</div>
                            <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3"><p><span className="font-semibold text-slate-800">Dosage:</span> {item.dosage}</p><p><span className="font-semibold text-slate-800">Frequency:</span> {item.frequency}</p><p><span className="font-semibold text-slate-800">Duration:</span> {item.duration}</p></div>
                            {item.instructions && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><span className="font-semibold">Instructions:</span> {item.instructions}</p>}
                        </div>
                    </div>)}
                </div>
                {prescription.notes && <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="font-semibold">Doctor&apos;s prescription notes:</span> {prescription.notes}</p>}
                <div className="flex flex-col gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:flex-row sm:items-end sm:justify-end">
                    <div className="w-full sm:max-w-56"><label className="text-sm font-semibold text-slate-900" htmlFor={`prescription-amount-${prescription.id}`}>Final amount to collect (LKR)</label><Input id={`prescription-amount-${prescription.id}`} className="mt-2 bg-white" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmounts((current) => ({ ...current, [prescription.id]: event.target.value }))} placeholder="Enter total amount" /></div>
                    <Button type="button" size="lg" disabled={payingId === prescription.id || !(Number(amount) > 0)} onClick={() => onPay(prescription)}>{payingId === prescription.id ? 'Updating...' : 'Mark Prescription Paid'}</Button>
                </div>
            </div>
        </Card>;
    })}</div>}
</CollapsibleSection>;

const PaidServiceBills = ({ title, bills, emptyMessage }) => <CollapsibleSection title={title} count={bills.length}>
    {bills.length === 0 ? <Card className="p-10 text-center text-sm text-slate-500">{emptyMessage}</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Service</TableHead><TableHead>Paid Amount</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{bills.map((bill) => <TableRow key={bill.id}><TableCell><PersonSummary person={bill.patient} /></TableCell><TableCell className="max-w-72 whitespace-normal">{bill.items?.map((item) => item.description).join(', ') || 'Clinical service'}</TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
</CollapsibleSection>;

const PersonSummary = ({ person }) => <DetailSummary title={getPersonName(person)} subtitle={person?.phone || 'Phone not recorded'} />;
const DetailSummary = ({ title, subtitle }) => <div className="min-w-40"><p className="font-medium text-slate-900">{title}</p><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>;

export default BillingPage;
