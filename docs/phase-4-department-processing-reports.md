# Phase 4: Department Processing and Reports

## Workflow

1. Pharmacists, lab technicians, and radiologists only see paid requests.
2. Departments update paid work through processing statuses.
3. Laboratory technicians add structured test results, ranges, and remarks.
4. Radiologists add report text and an optional scan/image URL.
5. Completing work notifies the linked doctor, linked patient account, and active receptionists.
6. Results remain linked to the patient, medical record, and consultation appointment.

## Business Rules

- Unpaid and rejected requests are hidden and inaccessible to operational departments.
- Direct request access is also protected, not only list screens.
- Patient and doctor reports reuse the existing request records.
- Future printable reports must be generated as PDF files only.
