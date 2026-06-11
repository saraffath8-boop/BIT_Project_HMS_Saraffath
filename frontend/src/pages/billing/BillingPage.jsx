import { useCallback, useEffect, useState } from 'react';
import ModuleListPage from '../shared/ModuleListPage';
import { formatDateTime, getPersonName } from '../shared/modulePageUtils';
import { getBills } from '../../services/billService';
import { useAuth } from '../../context/AuthContext';
import { downloadHospitalBillPdf } from '../../lib/hospitalBillPdf';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getPrescriptions, markPrescriptionPaid } from '../../services/prescriptionService';
import { Input } from '../../components/ui/input';
import { getLabRequests, markLabRequestPaid } from '../../services/labRequestService';
import { getRadiologyRequests, markRadiologyRequestPaid } from '../../services/radiologyRequestService';

const BillingPage = () => {
    const { user } = useAuth();
    if (user?.role === 'receptionist') return <ReceptionistBillingPage />;
    return <ModuleListPage
        title="Billing Records"
        kicker="Billing Management"
        description="Review patient bills, service totals, payment status, and outstanding balances."
        loadData={getBills}
        itemsKey="bills"
        createAction={{ to: '/billing/new', label: 'Add Bill', allowedRoles: ['admin'] }}
        emptyMessage="No billing records are currently available."
        columns={[
            { label: 'Bill Number', key: 'billNumber' },
            { label: 'Patient', render: (item) => getPersonName(item.patient) },
            { label: 'Total Amount', render: (item) => String(item.totalAmount ?? 'Not recorded') },
            { label: 'Paid Amount', render: (item) => String(item.paidAmount ?? 'Not recorded') },
            { label: 'Status', key: 'status' },
        ]}
    />;
};

const ReceptionistBillingPage = () => {
    const { token } = useAuth();
    const [bills, setBills] = useState([]);
    const [pharmacyBills, setPharmacyBills] = useState([]);
    const [laboratoryBills, setLaboratoryBills] = useState([]);
    const [radiologyBills, setRadiologyBills] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labRequests, setLabRequests] = useState([]);
    const [radiologyRequests, setRadiologyRequests] = useState([]);
    const [prescriptionAmounts, setPrescriptionAmounts] = useState({});
    const [serviceAmounts, setServiceAmounts] = useState({});
    const [payingId, setPayingId] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const loadBills = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [response, prescriptionResponse, labResponse, radiologyResponse] = await Promise.all([
                getBills({ token }),
                getPrescriptions({ token, filters: { paymentStatus: 'unpaid' } }),
                getLabRequests({ token, filters: { paymentStatus: 'unpaid' } }),
                getRadiologyRequests({ token, filters: { paymentStatus: 'unpaid' } }),
            ]);
            setBills((response.bills || []).filter((bill) => bill.billType === 'consultation'));
            setPharmacyBills((response.bills || []).filter((bill) => bill.billType === 'pharmacy'));
            setLaboratoryBills((response.bills || []).filter((bill) => bill.billType === 'laboratory'));
            setRadiologyBills((response.bills || []).filter((bill) => bill.billType === 'radiology'));
            setPrescriptions(prescriptionResponse.prescriptions || []);
            setLabRequests(labResponse.labRequests || []);
            setRadiologyRequests(radiologyResponse.radiologyRequests || []);
        } catch (err) { setError(err.message || 'Unable to load consultation bills'); }
        finally { setLoading(false); }
    }, [token]);
    useEffect(() => { const id = setTimeout(loadBills, 0); return () => clearTimeout(id); }, [loadBills]);
    const markPaid = async (prescription) => {
        setPayingId(prescription.id); setError(''); setSuccess('');
        try {
            const amount = Number(prescriptionAmounts[prescription.id]);
            if (!(amount > 0)) throw new Error('Enter a valid prescription amount before marking it paid');
            const response = await markPrescriptionPaid(prescription.id, amount, token);
            setPrescriptions((items) => items.filter((item) => item.id !== prescription.id));
            setPharmacyBills((items) => [response.bill, ...items]);
            setSuccess(response.message);
        } catch (err) { setError(err.message || 'Unable to mark prescription as paid'); }
        finally { setPayingId(''); }
    };
    const markServicePaid = async (request, type) => {
        const key = `${type}:${request.id}`;
        setPayingId(key); setError(''); setSuccess('');
        try {
            const amount = Number(serviceAmounts[key]);
            if (!(amount > 0)) throw new Error('Enter a valid amount before marking the request paid');
            const response = type === 'laboratory'
                ? await markLabRequestPaid(request.id, amount, token)
                : await markRadiologyRequestPaid(request.id, amount, token);
            if (type === 'laboratory') {
                setLabRequests((items) => items.filter((item) => item.id !== request.id));
                setLaboratoryBills((items) => [response.bill, ...items]);
            } else {
                setRadiologyRequests((items) => items.filter((item) => item.id !== request.id));
                setRadiologyBills((items) => [response.bill, ...items]);
            }
            setSuccess(response.message);
        } catch (err) { setError(err.message || 'Unable to mark request as paid'); }
        finally { setPayingId(''); }
    };

    return <main className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="page-kicker">Cashier</p><h1 className="page-title">Prescription Queue and Consultation Bills</h1><p className="page-description">Mark prescriptions as paid to send them to pharmacy, and download paid consultation bills.</p></div><Button variant="outline" onClick={loadBills} disabled={loading}>Refresh</Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading consultation bills...</Card>}
        {!loading && <section className="space-y-3"><h2 className="text-lg font-semibold text-slate-900">Prescription Cashier Queue <span className="text-sm font-normal text-slate-500">({prescriptions.length})</span></h2>
            {prescriptions.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">No unpaid prescriptions are waiting.</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Phone</TableHead><TableHead>Doctor</TableHead><TableHead>Medicines</TableHead><TableHead>Amount (LKR)</TableHead><TableHead>Created</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{prescriptions.map((prescription) => <TableRow key={prescription.id}><TableCell>{getPersonName(prescription.patient)}</TableCell><TableCell>{prescription.patient?.phone || 'Not recorded'}</TableCell><TableCell>{getPersonName(prescription.doctor)}</TableCell><TableCell>{prescription.items?.map((item) => item.medicineName).join(', ')}</TableCell><TableCell><Input className="min-w-28" type="number" min="0.01" step="0.01" value={prescriptionAmounts[prescription.id] || ''} onChange={(event) => setPrescriptionAmounts((amounts) => ({ ...amounts, [prescription.id]: event.target.value }))} placeholder="Enter amount" /></TableCell><TableCell>{formatDateTime(prescription.createdAt)}</TableCell><TableCell><Button size="sm" disabled={payingId === prescription.id || !(Number(prescriptionAmounts[prescription.id]) > 0)} onClick={() => markPaid(prescription)}>{payingId === prescription.id ? 'Updating...' : 'Mark Prescription Paid'}</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
        </section>}
        {!loading && <ClinicalPaymentQueue title="Laboratory Cashier Queue" requests={labRequests} type="laboratory" amounts={serviceAmounts} setAmounts={setServiceAmounts} payingId={payingId} onPay={markServicePaid} description={(request) => request.tests?.map((test) => test.testName).join(', ') || 'Laboratory tests'} />}
        {!loading && <ClinicalPaymentQueue title="Radiology Cashier Queue" requests={radiologyRequests} type="radiology" amounts={serviceAmounts} setAmounts={setServiceAmounts} payingId={payingId} onPay={markServicePaid} description={(request) => `${request.scanType}${request.bodyPart ? ` - ${request.bodyPart}` : ''}`} />}
        {!loading && (
        <h2 className="text-lg font-semibold text-slate-900">
        Paid Consultation Bills <span className="text-sm font-normal text-slate-500">({bills.length})</span>
        </h2>
        )}
        {!loading && bills.length === 0 && <Card className="p-10 text-center text-sm text-slate-500">No paid consultation bills are available.</Card>}
        {!loading && bills.length > 0 && <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Serial Number</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Room</TableHead><TableHead>Appointment</TableHead><TableHead>Paid Amount</TableHead><TableHead>Status</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{bills.map((bill) => <TableRow key={bill.id}><TableCell className="font-semibold">{bill.billNumber}</TableCell><TableCell>{getPersonName(bill.patient)}</TableCell><TableCell>{getPersonName(bill.doctor)}</TableCell><TableCell>{bill.roomNumber || bill.doctor?.roomNumber || 'Not recorded'}</TableCell><TableCell>{formatDateTime(bill.appointment?.appointmentDate)}</TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Badge variant="success">{bill.status}</Badge></TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
        {!loading && <h2 className="text-lg font-semibold text-slate-900">Paid Pharmacy Bills <span className="text-sm font-normal text-slate-500">({pharmacyBills.length})</span></h2>}
        {!loading && pharmacyBills.length === 0 && <Card className="p-10 text-center text-sm text-slate-500">No paid pharmacy bills are available.</Card>}
        {!loading && pharmacyBills.length > 0 && <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Serial Number</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Medicines</TableHead><TableHead>Paid Amount</TableHead><TableHead>Status</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{pharmacyBills.map((bill) => <TableRow key={bill.id}><TableCell className="font-semibold">{bill.billNumber}</TableCell><TableCell>{getPersonName(bill.patient)}</TableCell><TableCell>{getPersonName(bill.doctor)}</TableCell><TableCell className="max-w-72 whitespace-normal">{bill.items?.map((item) => item.description).join(', ') || 'Prescription medicines'}</TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Badge variant="success">{bill.status}</Badge></TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
        {!loading && <PaidServiceBills title="Paid Laboratory Bills" bills={laboratoryBills} emptyMessage="No paid laboratory bills are available." />}
        {!loading && <PaidServiceBills title="Paid Radiology Bills" bills={radiologyBills} emptyMessage="No paid radiology bills are available." />}
    </main>;
};

const ClinicalPaymentQueue = ({ title, requests, type, amounts, setAmounts, payingId, onPay, description }) => <section className="space-y-3">
    <h2 className="text-lg font-semibold text-slate-900">{title} <span className="text-sm font-normal text-slate-500">({requests.length})</span></h2>
    {requests.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">No unpaid requests are waiting.</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Phone</TableHead><TableHead>Doctor</TableHead><TableHead>Request</TableHead><TableHead>Amount (LKR)</TableHead><TableHead>Created</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{requests.map((request) => {
        const key = `${type}:${request.id}`;
        return <TableRow key={request.id}><TableCell>{getPersonName(request.patient)}</TableCell><TableCell>{request.patient?.phone || 'Not recorded'}</TableCell><TableCell>{getPersonName(request.doctor)}</TableCell><TableCell>{description(request)}</TableCell><TableCell><Input className="min-w-28" type="number" min="0.01" step="0.01" value={amounts[key] || ''} onChange={(event) => setAmounts((current) => ({ ...current, [key]: event.target.value }))} placeholder="Enter amount" /></TableCell><TableCell>{formatDateTime(request.createdAt)}</TableCell><TableCell><Button size="sm" disabled={payingId === key || !(Number(amounts[key]) > 0)} onClick={() => onPay(request, type)}>{payingId === key ? 'Updating...' : 'Mark Paid'}</Button></TableCell></TableRow>;
    })}</TableBody></Table></Card>}
</section>;

const PaidServiceBills = ({ title, bills, emptyMessage }) => <><h2 className="text-lg font-semibold text-slate-900">{title} <span className="text-sm font-normal text-slate-500">({bills.length})</span></h2>
    {bills.length === 0 ? <Card className="p-10 text-center text-sm text-slate-500">{emptyMessage}</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Serial Number</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Service</TableHead><TableHead>Paid Amount</TableHead><TableHead>Status</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{bills.map((bill) => <TableRow key={bill.id}><TableCell className="font-semibold">{bill.billNumber}</TableCell><TableCell>{getPersonName(bill.patient)}</TableCell><TableCell>{getPersonName(bill.doctor)}</TableCell><TableCell className="max-w-72 whitespace-normal">{bill.items?.map((item) => item.description).join(', ')}</TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Badge variant="success">{bill.status}</Badge></TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
</>;

export default BillingPage;
