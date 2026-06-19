// This file contains the report service business workflow.

import reportDao from '../dao/reportDao.js';

// Store labels used by report calculations.
const BILL_TYPE_LABELS = {
    general: 'General',
    consultation: 'Consultation',
    pharmacy: 'Pharmacy',
    laboratory: 'Laboratory',
    radiology: 'Radiology',
};

const REVENUE_BILL_TYPES = ['consultation', 'pharmacy', 'laboratory', 'radiology'];

// Prepare date match.
const buildDateMatch = (queryParams) => {
    const match = {};

    if (queryParams.from || queryParams.to) {
        match.createdAt = {};

        if (queryParams.from) {
            const from = new Date(queryParams.from);
            if (Number.isNaN(from.getTime())) {
                throw new Error('from must be a valid date');
            }
            match.createdAt.$gte = from;
        }

        if (queryParams.to) {
            const to = new Date(queryParams.to);
            if (Number.isNaN(to.getTime())) {
                throw new Error('to must be a valid date');
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(queryParams.to)) {
                to.setHours(23, 59, 59, 999);
            }
            match.createdAt.$lte = to;
        }
    }

    return match;
};

// Prepare date range filters.
const buildDateRange = (queryParams, fieldName = 'createdAt') => {
    const match = buildDateMatch(queryParams);
    if (!match.createdAt || fieldName === 'createdAt') return match;
    match[fieldName] = match.createdAt;
    delete match.createdAt;
    return match;
};

// Prepare person name.
const getPersonName = (person) =>
    person?.fullName || person?.name || person?.email || person?.patientId || 'N/A';

// Prepare date string.
const formatDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : 'N/A');

// Prepare month string.
const formatMonth = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Group array values.
const countBy = (items, getKey) =>
    items.reduce((summary, item) => {
        const key = getKey(item) || 'N/A';
        summary[key] = (summary[key] || 0) + 1;
        return summary;
    }, {});

// Sum array values.
const sumBy = (items, getValue) =>
    items.reduce((total, item) => total + Number(getValue(item) || 0), 0);

// Convert summary object to rows.
const summaryRows = (summary, labelKey = 'label', valueKey = 'count') =>
    Object.entries(summary).map(([label, value]) => ({ [labelKey]: label, [valueKey]: value }));

// Prepare money.
const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

// Prepare report filters.
const buildFilters = (queryParams) => ({
    from: queryParams.from || null,
    to: queryParams.to || null,
    generatedAt: new Date().toISOString(),
});

// Load dashboard report.
const getDashboardReport = async () => {
    const counts = await reportDao.getDashboardCounts();
    const revenue = await reportDao.getRevenueSummary();

    return {
        counts,
        revenue: {
            totalAmount: revenue.totalAmount,
            paidAmount: revenue.paidAmount,
            outstandingAmount: revenue.totalAmount - revenue.paidAmount,
        },
    };
};

// Load revenue report.
const getRevenueReport = async (queryParams) => {
    const match = buildDateMatch(queryParams);
    const revenue = await reportDao.getRevenueSummary(match);

    return {
        filters: {
            from: queryParams.from || null,
            to: queryParams.to || null,
        },
        totalAmount: revenue.totalAmount,
        paidAmount: revenue.paidAmount,
        outstandingAmount: revenue.totalAmount - revenue.paidAmount,
    };
};

// Load comprehensive reports.
const getComprehensiveReports = async (queryParams) => {
    const billMatch = buildDateRange(queryParams);
    const appointmentMatch = buildDateRange(queryParams, 'appointmentDate');
    const createdMatch = buildDateRange(queryParams);
    const [
        bills,
        appointments,
        prescriptions,
        labRequests,
        radiologyRequests,
        patients,
    ] = await Promise.all([
        reportDao.getBillsForReport(billMatch),
        reportDao.getAppointmentsForReport(appointmentMatch),
        reportDao.getPrescriptionsForReport(createdMatch),
        reportDao.getLabRequestsForReport(createdMatch),
        reportDao.getRadiologyRequestsForReport(createdMatch),
        reportDao.getPatientsForReport(createdMatch),
    ]);

    return {
        filters: buildFilters(queryParams),
        reports: {
            dailyAppointmentCounts: buildDailyAppointmentCounts(appointments),
            monthlyRevenueSummary: buildMonthlyRevenueSummary(bills),
            doctorWorkloadSummary: buildDoctorWorkloadSummary(appointments),
            pendingRequestSummary: buildPendingRequestSummary(
                prescriptions,
                labRequests,
                radiologyRequests,
            ),
            patientRegistrationTrend: buildPatientRegistrationTrend(patients),
        },
    };
};

// Build daily appointment count report grouped by date, department, and doctor.
const buildDailyAppointmentCounts = (appointments) => {
    const grouped = {};
    appointments.forEach((appointment) => {
        const date = formatDate(appointment.appointmentDate);
        const department = appointment.departmentRef?.name || appointment.department || 'N/A';
        const doctor = getPersonName(appointment.doctor);
        const key = `${date}|${department}|${doctor}`;
        grouped[key] ||= {
            date,
            department,
            doctor,
            appointmentCount: 0,
            completedCount: 0,
            paidCount: 0,
            cancelledCount: 0,
        };
        grouped[key].appointmentCount += 1;
        if (appointment.status === 'completed') grouped[key].completedCount += 1;
        if (appointment.paymentStatus === 'paid') grouped[key].paidCount += 1;
        if (appointment.status === 'cancelled') grouped[key].cancelledCount += 1;
    });

    const groupedRows = Object.values(grouped).sort(
        (a, b) =>
            b.date.localeCompare(a.date) ||
            a.department.localeCompare(b.department) ||
            a.doctor.localeCompare(b.doctor),
    );

    return {
        title: 'Daily Appointment Count by Department and Doctor',
        totals: {
            appointments: appointments.length,
            departments: new Set(appointments.map((item) => item.departmentRef?.name || item.department)).size,
            doctors: new Set(appointments.map((item) => getPersonName(item.doctor))).size,
            completedAppointments: appointments.filter((item) => item.status === 'completed').length,
        },
        groupedRows,
        details: appointments.map((appointment) => ({
            date: formatDate(appointment.appointmentDate),
            timeSlot: appointment.timeSlot || 'N/A',
            patient: getPersonName(appointment.patient),
            doctor: getPersonName(appointment.doctor),
            department: appointment.departmentRef?.name || appointment.department || 'N/A',
            status: appointment.status,
            paymentStatus: appointment.paymentStatus,
        })),
    };
};

// Build monthly revenue summary grouped by bill type.
const buildMonthlyRevenueSummary = (bills) => {
    const grouped = {};
    bills.forEach((bill) => {
        const month = formatMonth(bill.createdAt);
        grouped[month] ||= {
            month,
            consultation: 0,
            pharmacy: 0,
            laboratory: 0,
            radiology: 0,
            totalRevenue: 0,
            billCount: 0,
        };
        if (REVENUE_BILL_TYPES.includes(bill.billType)) {
            grouped[month][bill.billType] += Number(bill.paidAmount || 0);
        }
        grouped[month].totalRevenue += Number(bill.paidAmount || 0);
        grouped[month].billCount += 1;
    });

    const monthlyRows = Object.values(grouped)
        .sort((a, b) => b.month.localeCompare(a.month))
        .map(roundMoneyFields);

    return {
        title: 'Monthly Revenue Summary by Bill Type',
        totals: {
            bills: bills.length,
            consultationRevenue: money(
                sumBy(
                    bills.filter((bill) => bill.billType === 'consultation'),
                    (bill) => bill.paidAmount,
                ),
            ),
            pharmacyRevenue: money(
                sumBy(
                    bills.filter((bill) => bill.billType === 'pharmacy'),
                    (bill) => bill.paidAmount,
                ),
            ),
            laboratoryRevenue: money(
                sumBy(
                    bills.filter((bill) => bill.billType === 'laboratory'),
                    (bill) => bill.paidAmount,
                ),
            ),
            radiologyRevenue: money(
                sumBy(
                    bills.filter((bill) => bill.billType === 'radiology'),
                    (bill) => bill.paidAmount,
                ),
            ),
            totalRevenue: money(sumBy(bills, (bill) => bill.paidAmount)),
        },
        monthlyRows,
        details: bills.map((bill) => ({
            billNumber: bill.billNumber,
            month: formatMonth(bill.createdAt),
            date: formatDate(bill.createdAt),
            patient: getPersonName(bill.patient),
            billType: BILL_TYPE_LABELS[bill.billType] || bill.billType || 'General',
            paidAmount: money(bill.paidAmount),
            status: bill.status,
        })),
    };
};

// Build doctor workload report.
const buildDoctorWorkloadSummary = (appointments) => {
    const grouped = {};
    appointments.forEach((appointment) => {
        const doctor = getPersonName(appointment.doctor);
        const department = appointment.departmentRef?.name || appointment.department || 'N/A';
        grouped[doctor] ||= {
            doctor,
            department,
            appointmentCount: 0,
            completedConsultations: 0,
            checkedInCount: 0,
            cancelledCount: 0,
            noShowCount: 0,
        };
        grouped[doctor].appointmentCount += 1;
        if (appointment.status === 'completed') grouped[doctor].completedConsultations += 1;
        if (appointment.status === 'checked_in') grouped[doctor].checkedInCount += 1;
        if (appointment.status === 'cancelled') grouped[doctor].cancelledCount += 1;
        if (appointment.status === 'no_show') grouped[doctor].noShowCount += 1;
    });

    const doctorRows = Object.values(grouped).sort(
        (a, b) => b.appointmentCount - a.appointmentCount || a.doctor.localeCompare(b.doctor),
    );

    return {
        title: 'Doctor Workload Summary',
        totals: {
            doctors: doctorRows.length,
            appointments: appointments.length,
            completedConsultations: sumBy(doctorRows, (row) => row.completedConsultations),
            cancelledAppointments: sumBy(doctorRows, (row) => row.cancelledCount),
        },
        doctorRows,
    };
};

// Build pending request summary.
const buildPendingRequestSummary = (prescriptions, labRequests, radiologyRequests) => {
    const pendingPrescriptions = prescriptions.filter((item) =>
        ['pending', 'partially_issued'].includes(item.status),
    );
    const pendingLabRequests = labRequests.filter((item) =>
        ['requested', 'sample_collected', 'in_progress'].includes(item.status),
    );
    const pendingRadiologyRequests = radiologyRequests.filter((item) =>
        ['requested', 'scheduled', 'in_progress'].includes(item.status),
    );

    const pendingRows = [
        {
            service: 'Pharmacy',
            pendingRequests: pendingPrescriptions.length,
            unpaidRequests: prescriptions.filter((item) => item.paymentStatus === 'unpaid').length,
            paidRequests: prescriptions.filter((item) => item.paymentStatus === 'paid').length,
            completedRequests: prescriptions.filter((item) => item.status === 'issued').length,
        },
        {
            service: 'Laboratory',
            pendingRequests: pendingLabRequests.length,
            unpaidRequests: labRequests.filter((item) => item.paymentStatus === 'unpaid').length,
            paidRequests: labRequests.filter((item) => item.paymentStatus === 'paid').length,
            completedRequests: labRequests.filter((item) => item.status === 'completed').length,
        },
        {
            service: 'Radiology',
            pendingRequests: pendingRadiologyRequests.length,
            unpaidRequests: radiologyRequests.filter((item) => item.paymentStatus === 'unpaid').length,
            paidRequests: radiologyRequests.filter((item) => item.paymentStatus === 'paid').length,
            completedRequests: radiologyRequests.filter((item) => item.status === 'completed').length,
        },
    ];

    return {
        title: 'Pending Request Summary',
        totals: {
            pendingPharmacy: pendingRows[0].pendingRequests,
            pendingLaboratory: pendingRows[1].pendingRequests,
            pendingRadiology: pendingRows[2].pendingRequests,
            totalPending: sumBy(pendingRows, (row) => row.pendingRequests),
        },
        pendingRows,
    };
};

// Build patient registration trend by month.
const buildPatientRegistrationTrend = (patients) => {
    const grouped = {};
    patients.forEach((patient) => {
        const month = formatMonth(patient.createdAt);
        grouped[month] ||= { month, registrations: 0, activePatients: 0 };
        grouped[month].registrations += 1;
        if (patient.status === 'active') grouped[month].activePatients += 1;
    });

    const monthlyRows = Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));

    return {
        title: 'Patient Registration Trend by Month',
        totals: {
            registeredPatients: patients.length,
            activePatients: patients.filter((patient) => patient.status === 'active').length,
            months: monthlyRows.length,
        },
        monthlyRows,
    };
};

// Build revenue summary report.
const buildRevenueSummary = (bills) => {
    const byType = {};
    const byStatus = {};
    const paymentMethods = {};

    bills.forEach((bill) => {
        const type = bill.billType || 'general';
        byType[type] ||= { billType: BILL_TYPE_LABELS[type] || type, bills: 0, totalAmount: 0, paidAmount: 0, outstandingAmount: 0 };
        byType[type].bills += 1;
        byType[type].totalAmount += Number(bill.totalAmount || 0);
        byType[type].paidAmount += Number(bill.paidAmount || 0);
        byType[type].outstandingAmount += Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0);
        byStatus[bill.status || 'unknown'] = (byStatus[bill.status || 'unknown'] || 0) + 1;
        (bill.payments || []).forEach((payment) => {
            paymentMethods[payment.method || 'cash'] =
                (paymentMethods[payment.method || 'cash'] || 0) + Number(payment.amount || 0);
        });
    });

    return {
        title: 'Revenue Summary',
        totals: {
            bills: bills.length,
            totalAmount: money(sumBy(bills, (bill) => bill.totalAmount)),
            paidAmount: money(sumBy(bills, (bill) => bill.paidAmount)),
            outstandingAmount: money(sumBy(bills, (bill) => Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0))),
        },
        byType: Object.values(byType).map(roundMoneyFields),
        byStatus: summaryRows(byStatus, 'status', 'bills'),
        paymentMethods: summaryRows(paymentMethods, 'method', 'amount').map(roundMoneyFields),
        details: bills.map((bill) => ({
            billNumber: bill.billNumber,
            date: formatDate(bill.createdAt),
            patient: getPersonName(bill.patient),
            type: BILL_TYPE_LABELS[bill.billType] || bill.billType || 'General',
            status: bill.status,
            totalAmount: money(bill.totalAmount),
            paidAmount: money(bill.paidAmount),
            outstandingAmount: money(Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0)),
        })),
    };
};

// Build appointment performance report.
const buildAppointmentPerformance = (appointments) => ({
    title: 'Appointment Performance',
    totals: {
        appointments: appointments.length,
        completed: appointments.filter((item) => item.status === 'completed').length,
        paid: appointments.filter((item) => item.paymentStatus === 'paid').length,
        cancelled: appointments.filter((item) => item.status === 'cancelled').length,
        noShow: appointments.filter((item) => item.status === 'no_show').length,
    },
    byStatus: summaryRows(countBy(appointments, (item) => item.status), 'status', 'appointments'),
    byPaymentStatus: summaryRows(
        countBy(appointments, (item) => item.paymentStatus),
        'paymentStatus',
        'appointments',
    ),
    byDepartment: summaryRows(
        countBy(appointments, (item) => item.departmentRef?.name || item.department),
        'department',
        'appointments',
    ),
    details: appointments.map((appointment) => ({
        date: formatDate(appointment.appointmentDate),
        timeSlot: appointment.timeSlot || 'N/A',
        patient: getPersonName(appointment.patient),
        doctor: getPersonName(appointment.doctor),
        department: appointment.departmentRef?.name || appointment.department || 'N/A',
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
    })),
});

// Build doctor and department performance report.
const buildDoctorDepartmentPerformance = (appointments, bills) => {
    const consultationBills = bills.filter((bill) => bill.billType === 'consultation');
    const doctorMap = {};
    const departmentMap = {};

    appointments.forEach((appointment) => {
        const doctor = getPersonName(appointment.doctor);
        doctorMap[doctor] ||= {
            doctor,
            appointments: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
            revenue: 0,
        };
        doctorMap[doctor].appointments += 1;
        if (appointment.status === 'completed') doctorMap[doctor].completed += 1;
        if (appointment.status === 'cancelled') doctorMap[doctor].cancelled += 1;
        if (appointment.status === 'no_show') doctorMap[doctor].noShow += 1;

        const department = appointment.departmentRef?.name || appointment.department || 'N/A';
        departmentMap[department] ||= {
            department,
            appointments: 0,
            completed: 0,
            cancelled: 0,
            revenue: 0,
        };
        departmentMap[department].appointments += 1;
        if (appointment.status === 'completed') departmentMap[department].completed += 1;
        if (appointment.status === 'cancelled') departmentMap[department].cancelled += 1;
    });

    consultationBills.forEach((bill) => {
        const doctor = getPersonName(bill.doctor);
        doctorMap[doctor] ||= { doctor, appointments: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0 };
        doctorMap[doctor].revenue += Number(bill.paidAmount || 0);
    });

    return {
        title: 'Doctor/Department Performance',
        totals: {
            doctors: Object.keys(doctorMap).length,
            departments: Object.keys(departmentMap).length,
            appointments: appointments.length,
            consultationRevenue: money(sumBy(consultationBills, (bill) => bill.paidAmount)),
        },
        doctors: Object.values(doctorMap).map(roundMoneyFields),
        departments: Object.values(departmentMap).map(roundMoneyFields),
    };
};

// Build pharmacy summary report.
const buildPharmacySummary = (prescriptions, bills, medicines) => {
    const pharmacyBills = bills.filter((bill) => bill.billType === 'pharmacy');
    const medicineSales = {};
    pharmacyBills.forEach((bill) => {
        (bill.items || []).forEach((item) => {
            const name = item.description || 'Medicine';
            medicineSales[name] ||= { medicine: name, quantity: 0, revenue: 0 };
            medicineSales[name].quantity += Number(item.quantity || 0);
            medicineSales[name].revenue += Number(item.total || 0);
        });
    });

    return {
        title: 'Pharmacy Summary',
        totals: {
            prescriptions: prescriptions.length,
            paidPrescriptions: prescriptions.filter((item) => item.paymentStatus === 'paid').length,
            issuedPrescriptions: prescriptions.filter((item) => item.status === 'issued').length,
            pharmacyBills: pharmacyBills.length,
            pharmacyRevenue: money(sumBy(pharmacyBills, (bill) => bill.paidAmount)),
            lowStockMedicines: medicines.filter((medicine) => medicine.stockQuantity <= medicine.reorderLevel).length,
        },
        byPrescriptionStatus: summaryRows(countBy(prescriptions, (item) => item.status), 'status', 'prescriptions'),
        topMedicineSales: Object.values(medicineSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 25)
            .map(roundMoneyFields),
        lowStock: medicines
            .filter((medicine) => medicine.stockQuantity <= medicine.reorderLevel)
            .map((medicine) => ({
                name: medicine.name,
                sku: medicine.sku,
                stockQuantity: medicine.stockQuantity,
                reorderLevel: medicine.reorderLevel,
            })),
        details: prescriptions.map((prescription) => ({
            date: formatDate(prescription.createdAt),
            patient: getPersonName(prescription.patient),
            doctor: getPersonName(prescription.doctor),
            medicines: (prescription.items || []).map((item) => item.medicineName).join(', '),
            status: prescription.status,
            paymentStatus: prescription.paymentStatus,
        })),
    };
};

// Build lab/radiology performance report.
const buildLabRadiologyPerformance = (labRequests, radiologyRequests, bills) => {
    const labBills = bills.filter((bill) => bill.billType === 'laboratory');
    const radiologyBills = bills.filter((bill) => bill.billType === 'radiology');

    return {
        title: 'Lab/Radiology Performance',
        totals: {
            labRequests: labRequests.length,
            completedLabRequests: labRequests.filter((item) => item.status === 'completed').length,
            radiologyRequests: radiologyRequests.length,
            completedRadiologyRequests: radiologyRequests.filter((item) => item.status === 'completed').length,
            labRevenue: money(sumBy(labBills, (bill) => bill.paidAmount)),
            radiologyRevenue: money(sumBy(radiologyBills, (bill) => bill.paidAmount)),
        },
        labByStatus: summaryRows(countBy(labRequests, (item) => item.status), 'status', 'requests'),
        labByPayment: summaryRows(countBy(labRequests, (item) => item.paymentStatus), 'paymentStatus', 'requests'),
        radiologyByStatus: summaryRows(countBy(radiologyRequests, (item) => item.status), 'status', 'requests'),
        radiologyByPayment: summaryRows(
            countBy(radiologyRequests, (item) => item.paymentStatus),
            'paymentStatus',
            'requests',
        ),
        labDetails: labRequests.map((request) => ({
            date: formatDate(request.createdAt),
            patient: getPersonName(request.patient),
            doctor: getPersonName(request.doctor),
            tests: (request.tests || []).map((test) => test.testName).join(', '),
            status: request.status,
            paymentStatus: request.paymentStatus,
            technician: getPersonName(request.technician),
        })),
        radiologyDetails: radiologyRequests.map((request) => ({
            date: formatDate(request.createdAt),
            patient: getPersonName(request.patient),
            doctor: getPersonName(request.doctor),
            scanType: request.scanType,
            bodyPart: request.bodyPart || 'N/A',
            status: request.status,
            paymentStatus: request.paymentStatus,
            radiologist: getPersonName(request.radiologist),
        })),
    };
};

// Round monetary fields in a row.
const roundMoneyFields = (row) => {
    const next = { ...row };
    [
        'totalAmount',
        'paidAmount',
        'outstandingAmount',
        'amount',
        'revenue',
        'consultation',
        'pharmacy',
        'laboratory',
        'radiology',
        'totalRevenue',
    ].forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(next, field)) next[field] = money(next[field]);
    });
    return next;
};

// Handle report service.
const reportService = {
    getDashboardReport,
    getRevenueReport,
    getComprehensiveReports,
};

export default reportService;
