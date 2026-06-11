const ascii = (value) => String(value ?? '').replace(/[^\x20-\x7E]/g, '');
const escapePdfText = (value) => ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const money = (value) => `LKR ${Number(value || 0).toLocaleString()}`;
const dateTime = (value) => value ? new Date(value).toLocaleString() : 'Not recorded';

const textCommand = (text, x, y, size = 10, bold = false) => `BT /F${bold ? 2 : 1} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;

const buildPdf = (bill) => {
    const patient = bill.patient || {};
    const doctor = bill.doctor || {};
    const appointment = bill.appointment || {};
    const payment = bill.payments?.[0] || {};
    const lines = [
        textCommand('MEDICORE HOSPITAL', 210, 750, 18, true),
        textCommand('Official Consultation Payment Receipt', 210, 730, 11),
        '50 715 m 562 715 l S',
        textCommand(`Serial Number: ${bill.billNumber}`, 55, 690, 10, true),
        textCommand(`Issued: ${dateTime(bill.createdAt)}`, 330, 690, 10),
        textCommand(`Patient: ${patient.fullName || 'Not recorded'}`, 55, 665, 10),
        textCommand(`Patient ID: ${patient.patientId || 'Not recorded'}`, 330, 665, 10),
        textCommand(`Phone: ${patient.phone || 'Not recorded'}`, 55, 645, 10),
        textCommand(`Doctor: ${doctor.name || 'Not recorded'}`, 55, 610, 11, true),
        textCommand(`Room Number: ${bill.roomNumber || doctor.roomNumber || 'Not recorded'}`, 330, 610, 11, true),
        textCommand(`Appointment: ${dateTime(appointment.appointmentDate)}`, 55, 585, 10),
        textCommand(`Time Slot: ${appointment.timeSlot || 'Not recorded'}`, 330, 585, 10),
        '50 555 m 562 555 l S',
        textCommand('Description', 55, 535, 10, true),
        textCommand('Amount', 450, 535, 10, true),
        '50 525 m 562 525 l S',
        textCommand(bill.items?.[0]?.description || 'Doctor consultation fee', 55, 500, 10),
        textCommand(money(bill.totalAmount), 450, 500, 10),
        '50 475 m 562 475 l S',
        textCommand(`Paid Amount: ${money(bill.paidAmount)}`, 330, 445, 13, true),
        textCommand(`Payment Method: ${String(payment.method || 'cash').replaceAll('_', ' ')}`, 55, 420, 10),
        textCommand(`Payment Status: ${bill.status || 'paid'}`, 330, 420, 10),
        textCommand('Received by:', 55, 365, 10),
        textCommand(payment.receivedBy?.name || bill.createdBy?.name || 'Receptionist', 55, 345, 10, true),
        textCommand('Authorized Signature', 400, 345, 10),
        '390 335 m 540 335 l S',
        textCommand('Thank you for choosing MediCore Hospital.', 190, 275, 10),
        textCommand('This computer-generated receipt is NOT valid without a stamp.', 160, 255, 9),
    ];
    const stream = lines.join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
};

export const downloadHospitalBillPdf = (bill) => {
    const blob = new Blob([buildPdf(bill)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${bill.billNumber || 'hospital-bill'}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
};
