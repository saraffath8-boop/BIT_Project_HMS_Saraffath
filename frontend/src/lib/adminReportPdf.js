// This file contains admin report PDF generation helpers.

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 42;
const LINE_HEIGHT = 16;

const escapePdfText = (value = '') =>
    String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const formatMoney = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

const formatValue = (value) => {
    if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : formatMoney(value);
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value).replaceAll('_', ' ');
};

const isMoneyLabel = (label = '') =>
    /amount|paid|outstanding|revenue|consultation|pharmacy|laboratory|radiology/i.test(label);

const formatCellValue = (label, value) => {
    if (typeof value === 'number' && isMoneyLabel(label)) return formatMoney(value);
    return formatValue(value);
};

const splitText = (value, maxLength = 68) => {
    const text = formatValue(value);
    if (text.length <= maxLength) return [text];
    const chunks = [];
    for (let index = 0; index < text.length; index += maxLength) {
        chunks.push(text.slice(index, index + maxLength));
    }
    return chunks;
};

const drawText = (commands, text, x, y, size = 10, font = 'F1') => {
    commands.push(`0.05 0.09 0.16 rg BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
};

const drawLine = (commands, x1, y1, x2, y2) => {
    commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
};

const drawRect = (commands, x, y, width, height, color = '0.95 0.98 1') => {
    commands.push(`${color} rg ${x} ${y} ${width} ${height} re f 0 0 0 RG`);
};

const createWriter = (title, filters) => {
    const pages = [];
    let commands = [];
    let y = PAGE_HEIGHT - MARGIN;

    const addHeader = () => {
        drawRect(commands, 0, PAGE_HEIGHT - 86, PAGE_WIDTH, 86, '0.93 0.98 1');
        drawText(commands, 'Digital Hospital Management', MARGIN, PAGE_HEIGHT - 42, 11, 'F2');
        drawText(commands, title, MARGIN, PAGE_HEIGHT - 62, 18, 'F2');
        drawText(
            commands,
            `Period: ${filters.from || 'All time'} to ${filters.to || 'All time'} | Generated: ${new Date(
                filters.generatedAt || Date.now(),
            ).toLocaleString()}`,
            MARGIN,
            PAGE_HEIGHT - 80,
            8,
        );
        y = PAGE_HEIGHT - 112;
    };

    const addPage = () => {
        if (commands.length) pages.push(commands);
        commands = [];
        addHeader();
    };

    const ensure = (height = LINE_HEIGHT) => {
        if (y - height < MARGIN) addPage();
    };

    addHeader();

    const section = (heading) => {
        ensure(36);
        y -= 12;
        drawText(commands, heading, MARGIN, y, 13, 'F2');
        y -= 10;
        drawLine(commands, MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y -= 18;
    };

    const kvGrid = (items) => {
        const columns = 3;
        const width = (PAGE_WIDTH - MARGIN * 2 - 16) / columns;
        items.forEach((item, index) => {
            if (index % columns === 0) ensure(58);
            const column = index % columns;
            const x = MARGIN + column * (width + 8);
            const boxY = y - 42;
            drawRect(commands, x, boxY, width, 42, '0.98 0.99 1');
            drawText(commands, item.label, x + 8, boxY + 25, 7);
            drawText(commands, formatCellValue(item.label, item.value), x + 8, boxY + 10, 11, 'F2');
            if (column === columns - 1 || index === items.length - 1) y -= 52;
        });
    };

    const table = (columns, rows, limit = 35) => {
        const visibleRows = rows.slice(0, limit);
        const colWidth = (PAGE_WIDTH - MARGIN * 2) / columns.length;
        ensure(28);
        drawRect(commands, MARGIN, y - 18, PAGE_WIDTH - MARGIN * 2, 22, '0.91 0.96 1');
        columns.forEach((column, index) =>
            drawText(commands, column.label, MARGIN + index * colWidth + 4, y - 10, 7, 'F2'),
        );
        y -= 28;
        visibleRows.forEach((row) => {
            const lineCount = Math.max(
                ...columns.map(
                    (column) =>
                        splitText(
                            formatCellValue(column.label, row[column.key]),
                            column.maxLength || 24,
                        ).length,
                ),
            );
            const rowHeight = lineCount * 12 + 14;
            ensure(rowHeight);
            columns.forEach((column, columnIndex) => {
                splitText(
                    formatCellValue(column.label, row[column.key]),
                    column.maxLength || 24,
                ).forEach((line, lineIndex) =>
                    drawText(
                        commands,
                        line,
                        MARGIN + columnIndex * colWidth + 4,
                        y - lineIndex * 12,
                        7,
                    ),
                );
            });
            y -= rowHeight;
            drawLine(commands, MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8);
        });
        if (rows.length > limit) {
            ensure(18);
            drawText(commands, `Showing ${limit} of ${rows.length} rows. Use the screen preview for the full list.`, MARGIN, y, 8);
            y -= 20;
        }
    };

    return {
        section,
        kvGrid,
        table,
        finish() {
            pages.push(commands);
            return pages;
        },
    };
};

const buildPdf = (title, filters, buildContent) => {
    const writer = createWriter(title, filters);
    buildContent(writer);
    const pageCommands = writer.finish();
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${pageCommands.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pageCommands.length} >>`,
    ];

    pageCommands.forEach((commands, index) => {
        const pageObjectNumber = 3 + index * 2;
        const contentObjectNumber = pageObjectNumber + 1;
        const stream = commands.join('\n');
        objects.push(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectNumber} 0 R >>`,
            `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
        );
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
};

const downloadPdf = (filename, pdf) => {
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const totalsToCards = (totals = {}) =>
    Object.entries(totals).map(([label, value]) => ({ label: label.replace(/([A-Z])/g, ' $1'), value }));

export const downloadAdminReportPdf = ({ key, report, filters }) => {
    const pdf = buildPdf(report.title, filters, (writer) => {
        writer.section('Summary');
        writer.kvGrid(totalsToCards(report.totals));

        if (key === 'dailyAppointmentCounts') {
            writer.section('Daily Counts by Department and Doctor');
            writer.table(
                [
                    { label: 'Date', key: 'date' },
                    { label: 'Department', key: 'department' },
                    { label: 'Doctor', key: 'doctor' },
                    { label: 'Appointments', key: 'appointmentCount' },
                    { label: 'Completed', key: 'completedCount' },
                ],
                report.groupedRows || [],
                80,
            );
            writer.section('Appointment Details');
            writer.table(
                [
                    { label: 'Date', key: 'date' },
                    { label: 'Patient', key: 'patient' },
                    { label: 'Doctor', key: 'doctor' },
                    { label: 'Department', key: 'department' },
                    { label: 'Status', key: 'status' },
                ],
                report.details || [],
                60,
            );
        }

        if (key === 'monthlyRevenueSummary') {
            writer.section('Monthly Revenue by Bill Type');
            writer.table(
                [
                    { label: 'Month', key: 'month' },
                    { label: 'Consultation', key: 'consultation' },
                    { label: 'Pharmacy', key: 'pharmacy' },
                    { label: 'Laboratory', key: 'laboratory' },
                    { label: 'Radiology', key: 'radiology' },
                    { label: 'Total', key: 'totalRevenue' },
                ],
                report.monthlyRows || [],
                80,
            );
            writer.section('Bill Details');
            writer.table(
                [
                    { label: 'Bill', key: 'billNumber' },
                    { label: 'Date', key: 'date' },
                    { label: 'Patient', key: 'patient' },
                    { label: 'Type', key: 'billType' },
                    { label: 'Paid', key: 'paidAmount' },
                    { label: 'Status', key: 'status' },
                ],
                report.details || [],
                60,
            );
        }

        if (key === 'doctorWorkloadSummary') {
            writer.section('Doctor Workload');
            writer.table(
                [
                    { label: 'Doctor', key: 'doctor' },
                    { label: 'Department', key: 'department' },
                    { label: 'Appointments', key: 'appointmentCount' },
                    { label: 'Completed', key: 'completedConsultations' },
                    { label: 'Cancelled', key: 'cancelledCount' },
                ],
                report.doctorRows || [],
                60,
            );
        }

        if (key === 'pendingRequestSummary') {
            writer.section('Pending Requests by Service');
            writer.table(
                [
                    { label: 'Service', key: 'service' },
                    { label: 'Pending', key: 'pendingRequests' },
                    { label: 'Unpaid', key: 'unpaidRequests' },
                    { label: 'Paid', key: 'paidRequests' },
                    { label: 'Completed', key: 'completedRequests' },
                ],
                report.pendingRows || [],
            );
        }

        if (key === 'patientRegistrationTrend') {
            writer.section('Monthly Patient Registrations');
            writer.table(
                [
                    { label: 'Month', key: 'month' },
                    { label: 'Registrations', key: 'registrations' },
                    { label: 'Active Patients', key: 'activePatients' },
                ],
                report.monthlyRows || [],
                80,
            );
        }

        if (key === 'revenueSummary') {
            writer.section('Revenue by Bill Type');
            writer.table(
                [
                    { label: 'Bill Type', key: 'billType' },
                    { label: 'Bills', key: 'bills' },
                    { label: 'Total', key: 'totalAmount' },
                    { label: 'Paid', key: 'paidAmount' },
                    { label: 'Outstanding', key: 'outstandingAmount' },
                ],
                report.byType || [],
                80,
            );
            writer.section('Revenue by Status');
            writer.table(
                [
                    { label: 'Status', key: 'status' },
                    { label: 'Bills', key: 'bills' },
                ],
                report.byStatus || [],
            );
            writer.section('Payment Methods');
            writer.table(
                [
                    { label: 'Method', key: 'method' },
                    { label: 'Amount', key: 'amount' },
                ],
                report.paymentMethods || [],
            );
            writer.section('Bill Details');
            writer.table(
                [
                    { label: 'Bill', key: 'billNumber' },
                    { label: 'Date', key: 'date' },
                    { label: 'Patient', key: 'patient' },
                    { label: 'Type', key: 'type' },
                    { label: 'Paid', key: 'paidAmount' },
                    { label: 'Outstanding', key: 'outstandingAmount' },
                ],
                report.details || [],
                60,
            );
        }

        if (key === 'appointmentPerformance') {
            writer.section('Appointments by Status');
            writer.table(
                [
                    { label: 'Status', key: 'status' },
                    { label: 'Appointments', key: 'appointments' },
                ],
                report.byStatus || [],
            );
            writer.section('Appointments by Payment Status');
            writer.table(
                [
                    { label: 'Payment Status', key: 'paymentStatus' },
                    { label: 'Appointments', key: 'appointments' },
                ],
                report.byPaymentStatus || [],
            );
            writer.section('Appointments by Department');
            writer.table(
                [
                    { label: 'Department', key: 'department' },
                    { label: 'Appointments', key: 'appointments' },
                ],
                report.byDepartment || [],
            );
            writer.section('Appointment Details');
            writer.table(
                [
                    { label: 'Date', key: 'date' },
                    { label: 'Patient', key: 'patient' },
                    { label: 'Doctor', key: 'doctor' },
                    { label: 'Department', key: 'department' },
                    { label: 'Status', key: 'status' },
                ],
                report.details || [],
                60,
            );
        }

        if (key === 'doctorDepartmentPerformance') {
            writer.section('Doctor Performance');
            writer.table(
                [
                    { label: 'Doctor', key: 'doctor' },
                    { label: 'Appointments', key: 'appointments' },
                    { label: 'Completed', key: 'completed' },
                    { label: 'Cancelled', key: 'cancelled' },
                    { label: 'Revenue', key: 'revenue' },
                ],
                report.doctors || [],
                80,
            );
            writer.section('Department Performance');
            writer.table(
                [
                    { label: 'Department', key: 'department' },
                    { label: 'Appointments', key: 'appointments' },
                    { label: 'Completed', key: 'completed' },
                    { label: 'Cancelled', key: 'cancelled' },
                    { label: 'Revenue', key: 'revenue' },
                ],
                report.departments || [],
                80,
            );
        }

        if (key === 'pharmacySummary') {
            writer.section('Prescription Status');
            writer.table(
                [
                    { label: 'Status', key: 'status' },
                    { label: 'Prescriptions', key: 'prescriptions' },
                ],
                report.byPrescriptionStatus || [],
            );
            writer.section('Top Medicine Sales');
            writer.table(
                [
                    { label: 'Medicine', key: 'medicine' },
                    { label: 'Quantity', key: 'quantity' },
                    { label: 'Revenue', key: 'revenue' },
                ],
                report.topMedicineSales || [],
                80,
            );
            writer.section('Low Stock Medicines');
            writer.table(
                [
                    { label: 'Name', key: 'name' },
                    { label: 'SKU', key: 'sku' },
                    { label: 'Stock', key: 'stockQuantity' },
                    { label: 'Reorder Level', key: 'reorderLevel' },
                ],
                report.lowStock || [],
                80,
            );
            writer.section('Prescription Details');
            writer.table(
                [
                    { label: 'Date', key: 'date' },
                    { label: 'Patient', key: 'patient' },
                    { label: 'Doctor', key: 'doctor' },
                    { label: 'Status', key: 'status' },
                    { label: 'Payment', key: 'paymentStatus' },
                ],
                report.details || [],
                60,
            );
        }

        if (key === 'labRadiologyPerformance') {
            writer.section('Lab Requests by Status');
            writer.table(
                [
                    { label: 'Status', key: 'status' },
                    { label: 'Requests', key: 'requests' },
                ],
                report.labByStatus || [],
            );
            writer.section('Lab Requests by Payment');
            writer.table(
                [
                    { label: 'Payment Status', key: 'paymentStatus' },
                    { label: 'Requests', key: 'requests' },
                ],
                report.labByPayment || [],
            );
            writer.section('Radiology Requests by Status');
            writer.table(
                [
                    { label: 'Status', key: 'status' },
                    { label: 'Requests', key: 'requests' },
                ],
                report.radiologyByStatus || [],
            );
            writer.section('Radiology Requests by Payment');
            writer.table(
                [
                    { label: 'Payment Status', key: 'paymentStatus' },
                    { label: 'Requests', key: 'requests' },
                ],
                report.radiologyByPayment || [],
            );
        }
    });

    downloadPdf(`${key}-${new Date().toISOString().slice(0, 10)}.pdf`, pdf);
};
