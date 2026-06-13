// This file contains the patient decision billing page interface.

import { CreditCard, FlaskConical, Pill, ScanLine } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getPendingPatientDecisions, processPatientDecisions } from '../../services/billService';

// Handle type details.
const typeDetails = {
    prescription: { label: 'Prescription', icon: Pill },
    laboratory: { label: 'Laboratory', icon: FlaskConical },
    radiology: { label: 'Radiology', icon: ScanLine },
};

export default function PatientDecisionBillingPage() {
    const { token, user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [decisions, setDecisions] = useState({});
    const [payment, setPayment] = useState({ method: 'cash', reference: '' });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load load.
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getPendingPatientDecisions(token);
            setRequests(response.requests || []);
            setDecisions(
                Object.fromEntries(
                    (response.requests || []).map((request) => [
                        request.id,
                        { selected: false, unitPrice: '' },
                    ]),
                ),
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Run this work when the listed values change.
    useEffect(() => {
        load();
    }, [load]);

    const groups = useMemo(
        () =>
            Object.values(
                requests.reduce((result, request) => {
                    const key = request.appointmentId || request.id;
                    if (!result[key])
                        result[key] = {
                            appointmentId: request.appointmentId,
                            patient: request.patient,
                            doctor: request.doctor,
                            requests: [],
                        };
                    result[key].requests.push(request);
                    return result;
                }, {}),
            ),
        [requests],
    );

    // Handle toggle.
    const toggle = (id, selected) =>
        setDecisions((current) => ({ ...current, [id]: { ...current[id], selected } }));
    // Update price.
    const setPrice = (id, unitPrice) =>
        setDecisions((current) => ({ ...current, [id]: { ...current[id], unitPrice } }));

    // Handle total for.
    const totalFor = (group) =>
        group.requests.reduce(
            (total, request) =>
                decisions[request.id]?.selected
                    ? total + Number(decisions[request.id]?.unitPrice || 0)
                    : total,
            0,
        );

    // Handle submit.
    const submit = async (group) => {
        setProcessing(group.appointmentId);
        setError('');
        setSuccess('');
        try {
            const response = await processPatientDecisions(
                {
                    decisions: group.requests.map((request) => ({
                        type: request.type,
                        id: request.id,
                        selected: Boolean(decisions[request.id]?.selected),
                        unitPrice: decisions[request.id]?.unitPrice,
                    })),
                    paymentMethod: payment.method,
                    paymentReference: payment.reference,
                },
                token,
            );
            setSuccess(
                response.bill
                    ? `${response.message}. Bill ${response.bill.billNumber} paid: LKR ${Number(response.bill.totalAmount).toLocaleString()}.`
                    : response.message,
            );
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing('');
        }
    };

    return (
        <main className="space-y-6">
            <section>
                <p className="page-kicker">
                    {user?.role === 'admin' ? 'Administration Billing' : 'Department Billing'}
                </p>
                <h1 className="page-title">Patient Request Decisions</h1>
                <p className="page-description">
                    Record what the patient accepts, bill selected requests only, and route paid
                    work to the correct department.
                </p>
            </section>
            {error && <Alert variant="destructive">{error}</Alert>}
            {success && <Alert>{success}</Alert>}
            {loading && (
                <Card className="p-6 text-sm text-slate-500">
                    Loading pending patient decisions...
                </Card>
            )}
            {!loading && groups.length === 0 && (
                <Card className="p-8 text-center text-sm text-slate-500">
                    No doctor-created requests are awaiting patient decisions.
                </Card>
            )}

            {!loading &&
                groups.map((group) => {
                    const selectedCount = group.requests.filter(
                        (request) => decisions[request.id]?.selected,
                    ).length;
                    const hasInvalidPrice = group.requests.some(
                        (request) =>
                            decisions[request.id]?.selected &&
                            !(Number(decisions[request.id]?.unitPrice) > 0),
                    );
                    return (
                        <Card key={group.appointmentId || group.requests[0].id}>
                            <CardHeader>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <CardTitle>
                                            {group.patient?.fullName || 'Patient'}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Doctor: {group.doctor?.name || 'Not recorded'} ·{' '}
                                            {group.requests.length} request(s)
                                        </CardDescription>
                                    </div>
                                    <Badge variant="warning">Pending Patient Decision</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-3">
                                    {group.requests.map((request) => {
                                        const details = typeDetails[request.type];
                                        const Icon = details.icon;
                                        const selected = Boolean(decisions[request.id]?.selected);
                                        return (
                                            <div
                                                key={request.id}
                                                className={`grid gap-4 rounded-xl border p-4 md:grid-cols-[auto_minmax(0,1fr)_180px] ${selected ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`}
                                            >
                                                <label className="flex cursor-pointer items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={(event) =>
                                                            toggle(request.id, event.target.checked)
                                                        }
                                                        className="size-5 accent-cyan-700"
                                                    />
                                                    <span className="grid size-10 place-items-center rounded-lg bg-white text-cyan-700">
                                                        <Icon className="size-5" />
                                                    </span>
                                                </label>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {details.label}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-600">
                                                        {request.description}
                                                    </p>
                                                    <Badge
                                                        className="mt-2"
                                                        variant={
                                                            selected ? 'success' : 'destructive'
                                                        }
                                                    >
                                                        {selected
                                                            ? 'Selected For Payment'
                                                            : 'Rejected By Patient'}
                                                    </Badge>
                                                </div>
                                                <label className="space-y-2">
                                                    <Label>Price (LKR)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        disabled={!selected}
                                                        value={
                                                            decisions[request.id]?.unitPrice || ''
                                                        }
                                                        onChange={(event) =>
                                                            setPrice(request.id, event.target.value)
                                                        }
                                                        placeholder={
                                                            selected ? 'Enter price' : 'Not billed'
                                                        }
                                                    />
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
                                    <label className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <select
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                            value={payment.method}
                                            onChange={(event) =>
                                                setPayment({
                                                    ...payment,
                                                    method: event.target.value,
                                                })
                                            }
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="insurance">Insurance</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </label>
                                    <label className="space-y-2">
                                        <Label>Reference</Label>
                                        <Input
                                            value={payment.reference}
                                            onChange={(event) =>
                                                setPayment({
                                                    ...payment,
                                                    reference: event.target.value,
                                                })
                                            }
                                            placeholder="Optional reference"
                                        />
                                    </label>
                                    <div className="flex flex-col justify-end">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Selected Total
                                        </p>
                                        <p className="mt-1 text-xl font-bold text-slate-950">
                                            LKR {totalFor(group).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => submit(group)}
                                    disabled={processing === group.appointmentId || hasInvalidPrice}
                                >
                                    <CreditCard className="size-4" />
                                    {processing === group.appointmentId
                                        ? 'Processing decisions...'
                                        : selectedCount
                                          ? 'Create Paid Bill and Route Requests'
                                          : 'Confirm All Requests Rejected'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
        </main>
    );
}
