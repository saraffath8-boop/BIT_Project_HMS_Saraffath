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
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="page-kicker">Receptionist Billing</p><h1 className="page-title">Consultation Payment Bills</h1><p className="page-description">Download official bills created when confirmed appointments are marked as paid.</p></div><Button variant="outline" onClick={loadBills} disabled={loading}>Refresh</Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading consultation bills...</Card>}
        {!loading && bills.length === 0 && <Card className="p-10 text-center text-sm text-slate-500">No paid consultation bills are available.</Card>}
        {!loading && bills.length > 0 && <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Serial Number</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Room</TableHead><TableHead>Appointment</TableHead><TableHead>Paid Amount</TableHead><TableHead>Status</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{bills.map((bill) => <TableRow key={bill.id}><TableCell className="font-semibold">{bill.billNumber}</TableCell><TableCell>{getPersonName(bill.patient)}</TableCell><TableCell>{getPersonName(bill.doctor)}</TableCell><TableCell>{bill.roomNumber || bill.doctor?.roomNumber || 'Not recorded'}</TableCell><TableCell>{formatDateTime(bill.appointment?.appointmentDate)}</TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Badge variant="success">{bill.status}</Badge></TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
    </main>;
};

export default BillingPage;
