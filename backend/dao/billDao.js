import Bill from '../models/bill.js';
import { Counter } from '../models/patient.js';

class BillDao {
    async getNextBillNumber() {
        const counter = await Counter.findByIdAndUpdate(
            'billNumber',
            { $inc: { sequenceValue: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).exec();

        return `BILL-${String(counter.sequenceValue).padStart(6, '0')}`;
    }

    async createBill(billData) {
        const bill = new Bill(billData);
        return bill.save();
    }

    async getBills(query = {}) {
        return Bill.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getBillById(id) {
        return Bill.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .exec();
    }

    async updateBill(id, updateData) {
        return Bill.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate status')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .exec();
    }

    async deleteBill(id) {
        return Bill.findByIdAndDelete(id).exec();
    }

    async countBills(query = {}) {
        return Bill.countDocuments(query).exec();
    }

    async sumBillTotals(match = {}) {
        const result = await Bill.aggregate([
            { $match: match },
            { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, paidAmount: { $sum: '$paidAmount' } } },
        ]);

        return result[0] || { totalAmount: 0, paidAmount: 0 };
    }
}

export default new BillDao();
