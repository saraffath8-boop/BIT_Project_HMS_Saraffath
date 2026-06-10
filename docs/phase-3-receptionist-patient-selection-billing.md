# Phase 3: Receptionist Patient Selection and Billing

## Workflow

1. Receptionist opens requests awaiting a patient decision.
2. Requests are grouped by consultation appointment.
3. Patient accepts or rejects each doctor-created request.
4. Receptionist enters prices for accepted requests.
5. System creates one paid bill containing accepted requests only.
6. Accepted requests become `paid` and notify the relevant department.
7. Rejected requests become `rejected_by_patient` and are cancelled.
8. Consultation appointment becomes completed after every request decision is processed.

## Routing

- Prescription payment notifies active pharmacists.
- Laboratory payment notifies active lab technicians.
- Radiology payment notifies active radiologists.

## API

- `GET /api/bills/pending-decisions`
- `POST /api/bills/patient-decisions`

Future printable receipts must be generated as PDF files only.
