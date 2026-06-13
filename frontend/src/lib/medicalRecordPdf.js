// This file contains the medical record pdf shared application logic.

const ascii = (value) => String(value ?? '').replace(/[^\x20-\x7E]/g, '');
// Handle escape pdf text.
const escapePdfText = (value) =>
    ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
// Handle text.
const text = (value, x, y, size = 10, bold = false) =>
    `BT /F${bold ? 2 : 1} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`;
// Handle person name.
const personName = (person) => person?.fullName || person?.name || 'Not recorded';

// Handle wrap.
const wrap = (value, length = 78) => {
    const words = ascii(value || 'Not recorded').split(/\s+/);
    return words.reduce((lines, word) => {
        const last = lines.at(-1);
        if (!last || `${last} ${word}`.length > length) lines.push(word);
        else lines[lines.length - 1] = `${last} ${word}`;
        return lines;
    }, []);
};

// Prepare pdf.
const buildPdf = (record) => {
    const commands = [
        text('MEDICORE HOSPITAL', 210, 750, 18, true),
        text('Diagnosis Report', 250, 730, 12),
        '50 715 m 562 715 l S',
        text(`Patient: ${personName(record.patient)}`, 55, 690, 11, true),
        text(`Patient ID: ${record.patient?.patientId || 'Not recorded'}`, 330, 690, 10),
        text(`Doctor: ${personName(record.doctor)}`, 55, 665, 10),
        text(
            `Report Date: ${record.createdAt ? new Date(record.createdAt).toLocaleString() : 'Not recorded'}`,
            300,
            665,
            10,
        ),
    ];
    let y = 625;
    [
        ['Chief Complaint', record.chiefComplaint],
        ['Diagnosis', record.diagnosis],
        ['Consultation Notes', record.consultationNotes],
    ].forEach(([label, value]) => {
        commands.push(text(label, 55, y, 11, true));
        y -= 18;
        wrap(value)
            .slice(0, 12)
            .forEach((line) => {
                commands.push(text(line, 65, y));
                y -= 15;
            });
        y -= 12;
    });
    if (record.followUpDate)
        commands.push(
            text(
                `Follow-up Date: ${new Date(record.followUpDate).toLocaleDateString()}`,
                55,
                y,
                10,
                true,
            ),
        );
    const stream = commands.join('\n');
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
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    return `${pdf}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
};

// Handle download medical record pdf.
export const downloadMedicalRecordPdf = (record) => {
    const url = URL.createObjectURL(new Blob([buildPdf(record)], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnosis-report-${record.patient?.patientId || record.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
};
