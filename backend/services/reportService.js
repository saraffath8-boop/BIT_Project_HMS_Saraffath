import reportDao from '../dao/reportDao.js';

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
            match.createdAt.$lte = to;
        }
    }

    return match;
};

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

const reportService = {
    getDashboardReport,
    getRevenueReport,
};

export default reportService;
