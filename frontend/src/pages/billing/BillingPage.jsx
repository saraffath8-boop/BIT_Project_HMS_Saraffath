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

const getNumericMultiplier = (value) =>
    Number(String(value || '').match(/\d+(?:\.\d+)?/)?.[0] || 0);

const getPrescriptionItemId = (item, index) => String(item._id || item.id || index);

const calculateMedicineTotal = (item, pricing = {}) => {
    const unitPrice = Number(pricing.unitPrice || 0);
    const duration = Number(pricing.duration || 0);
    return (
        Math.round(
            (unitPrice *
                duration *
                getNumericMultiplier(item.dosage) *
                getNumericMultiplier(item.frequency) +
                Number.EPSILON) *
                100,
        ) / 100
    );
};

const calculatePrescriptionTotal = (prescription, pricing = {}) =>
    (prescription.items || []).reduce(
        (total, item, index) =>
            total + calculateMedicineTotal(item, pricing[getPrescriptionItemId(item, index)]),
        0,
    );

const BillingPage = () => {
    const { user } = useAuth();
    if (user?.role === 'receptionist') return <ReceptionistBillingPage />;
    if (user?.role === 'pharmacist') return <PharmacistBillingPage />;
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
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="page-kicker">Receptionist Billing</p><h1 className="page-title">Paid Consultation Bookings</h1><p className="page-description">Read-only history of appointment consultation payments.</p></div><Button variant="outline" onClick={loadBills} disabled={loading}>Refresh</Button></section>
        {error && <Alert variant="destructive">{error}</Alert>}
        {loading && <Card className="p-6 text-sm text-slate-500">Loading consultation bills...</Card>}
        {!loading && <CollapsibleSection title="Paid Consultation Bills" count={bills.length}>
            {bills.length === 0 ? <Card className="p-10 text-center text-sm text-slate-500">No paid consultation bills are available.</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Appointment</TableHead><TableHead>Paid Amount</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{bills.map((bill) => <TableRow key={bill.id}><TableCell><PersonSummary person={bill.patient} /></TableCell><TableCell><DetailSummary title={getPersonName(bill.doctor)} subtitle={formatDateTime(bill.appointment?.appointmentDate)} /></TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
        </CollapsibleSection>}
    </main>;
};

const PharmacistBillingPage = () => {
    const { token } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [pharmacyBills, setPharmacyBills] = useState([]);
    const [pricing, setPricing] = useState({});
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
            const prescriptionPricing = pricing[prescription.id] || {};
            const pricingItems = (prescription.items || []).map((item, index) => {
                const itemId = getPrescriptionItemId(item, index);
                return {
                    itemId,
                    unitPrice: prescriptionPricing[itemId]?.unitPrice,
                    duration: prescriptionPricing[itemId]?.duration,
                };
            });
            if (
                pricingItems.some(
                    (item) => !(Number(item.unitPrice) > 0) || !(Number(item.duration) > 0),
                )
            ) {
                throw new Error('Enter a valid unit price and duration for every medicine');
            }
            const response = await markPrescriptionPaid(prescription.id, pricingItems, token);
            setPrescriptions((items) => items.filter((item) => item.id !== prescription.id));
            setPricing((current) => {
                const next = { ...current };
                delete next[prescription.id];
                return next;
            });
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
        {!loading && <PrescriptionCashierQueue prescriptions={prescriptions} pricing={pricing} setPricing={setPricing} payingId={payingId} onPay={markPaid} />}
        {!loading && <CollapsibleSection title="Paid Pharmacy Bills" count={pharmacyBills.length}>
            {pharmacyBills.length === 0 ? <Card className="p-10 text-center text-sm text-slate-500">No paid pharmacy bills are available.</Card> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Medicines</TableHead><TableHead>Paid Amount</TableHead><TableHead>Bill</TableHead></TableRow></TableHeader><TableBody>{pharmacyBills.map((bill) => <TableRow key={bill.id}><TableCell><PersonSummary person={bill.patient} /></TableCell><TableCell className="max-w-72 whitespace-normal">{bill.items?.map((item) => item.description).join(', ') || 'Prescription medicines'}</TableCell><TableCell>LKR {Number(bill.paidAmount || 0).toLocaleString()}</TableCell><TableCell><Button size="sm" onClick={() => downloadHospitalBillPdf(bill)}>Download PDF</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
        </CollapsibleSection>}
    </main>;
};

const PrescriptionCashierQueue = ({ prescriptions, pricing, setPricing, payingId, onPay }) => (
    <CollapsibleSection title="Prescription Cashier Queue" count={prescriptions.length}>
        {prescriptions.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
                No unpaid prescriptions are waiting.
            </Card>
        ) : (
            <div className="grid gap-4">
                {prescriptions.map((prescription) => {
                    const prescriptionPricing = pricing[prescription.id] || {};
                    const totalAmount = calculatePrescriptionTotal(
                        prescription,
                        prescriptionPricing,
                    );
                    const pricingComplete = (prescription.items || []).every((item, index) => {
                        const itemPricing =
                            prescriptionPricing[getPrescriptionItemId(item, index)];
                        return (
                            Number(itemPricing?.unitPrice) > 0 &&
                            Number(itemPricing?.duration) > 0
                        );
                    });
                    const updatePricing = (itemId, field, value) =>
                        setPricing((current) => ({
                            ...current,
                            [prescription.id]: {
                                ...(current[prescription.id] || {}),
                                [itemId]: {
                                    ...(current[prescription.id]?.[itemId] || {}),
                                    [field]: value,
                                },
                            },
                        }));

                    return (
                        <Card key={prescription.id} className="overflow-hidden">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
                                <PersonSummary person={prescription.patient} />
                                <div className="text-right text-sm">
                                    <p className="font-medium text-slate-900">
                                        Doctor: {getPersonName(prescription.doctor)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Prescribed {formatDateTime(prescription.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 p-5">
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 bg-cyan-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-cyan-900">
                                        <span>#</span>
                                        <span>Prescribed medicines</span>
                                    </div>
                                    {(prescription.items || []).map((item, index) => {
                                        const itemId = getPrescriptionItemId(item, index);
                                        const itemPricing = prescriptionPricing[itemId] || {};
                                        const lineTotal = calculateMedicineTotal(item, itemPricing);

                                        return (
                                            <div
                                                key={itemId}
                                                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 border-t border-slate-100 px-4 py-3"
                                            >
                                                <span className="grid size-6 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800">
                                                    {index + 1}
                                                </span>
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="font-semibold text-slate-950">
                                                            {item.medicineName}
                                                        </p>
                                                        {item.medicine?.unitPrice != null && (
                                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                                Reference unit price: LKR{' '}
                                                                {Number(
                                                                    item.medicine.unitPrice,
                                                                ).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                                        <p>
                                                            <span className="font-semibold text-slate-800">
                                                                Dosage:
                                                            </span>{' '}
                                                            {item.dosage}
                                                        </p>
                                                        <p>
                                                            <span className="font-semibold text-slate-800">
                                                                Frequency:
                                                            </span>{' '}
                                                            {item.frequency}
                                                        </p>
                                                        <p>
                                                            <span className="font-semibold text-slate-800">
                                                                Doctor&apos;s duration:
                                                            </span>{' '}
                                                            {item.duration}
                                                        </p>
                                                    </div>
                                                    <div className="grid gap-3 rounded-lg border border-cyan-100 bg-cyan-50 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                                                        <label className="text-xs font-semibold text-slate-800">
                                                            Unit Price (LKR)
                                                            <Input
                                                                className="mt-1 bg-white"
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={itemPricing.unitPrice || ''}
                                                                onChange={(event) =>
                                                                    updatePricing(
                                                                        itemId,
                                                                        'unitPrice',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="Enter unit price"
                                                            />
                                                        </label>
                                                        <label className="text-xs font-semibold text-slate-800">
                                                            Billing Duration
                                                            <Input
                                                                className="mt-1 bg-white"
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={itemPricing.duration || ''}
                                                                onChange={(event) =>
                                                                    updatePricing(
                                                                        itemId,
                                                                        'duration',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="Enter duration"
                                                            />
                                                        </label>
                                                        <div className="min-w-36 rounded-lg bg-white px-3 py-2 text-right">
                                                            <p className="text-xs font-semibold text-slate-500">
                                                                Medicine Total
                                                            </p>
                                                            <p className="font-bold text-slate-950">
                                                                LKR {lineTotal.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        Total uses the doctor-prescribed dosage and
                                                        frequency.
                                                    </p>
                                                    {item.instructions && (
                                                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                                            <span className="font-semibold">
                                                                Instructions:
                                                            </span>{' '}
                                                            {item.instructions}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {prescription.notes && (
                                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                        <span className="font-semibold">
                                            Doctor&apos;s prescription notes:
                                        </span>{' '}
                                        {prescription.notes}
                                    </p>
                                )}
                                <div className="flex flex-col gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:flex-row sm:items-end sm:justify-end">
                                    <div className="w-full sm:max-w-56">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Calculated final amount (LKR)
                                        </p>
                                        <p className="mt-2 rounded-lg border border-cyan-300 bg-white px-3 py-2 text-xl font-bold text-slate-950">
                                            LKR {totalAmount.toLocaleString()}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="lg"
                                        disabled={
                                            payingId === prescription.id ||
                                            !pricingComplete ||
                                            !(totalAmount > 0)
                                        }
                                        onClick={() => onPay(prescription)}
                                    >
                                        {payingId === prescription.id
                                            ? 'Updating...'
                                            : 'Mark Prescription Paid'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        )}
    </CollapsibleSection>
);

const PersonSummary = ({ person }) => <DetailSummary title={getPersonName(person)} subtitle={person?.phone || 'Phone not recorded'} />;
const DetailSummary = ({ title, subtitle }) => <div className="min-w-40"><p className="font-medium text-slate-900">{title}</p><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>;

export default BillingPage;
