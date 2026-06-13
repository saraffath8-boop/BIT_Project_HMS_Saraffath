// This file contains the bill dao database queries.

import Bill from '../models/bill.js';
import { Counter } from '../models/patient.js';

// Group the bill dao database queries.
class BillDao {
    // Load next bill number.
    async getNextBillNumber() {
        const counter = await Counter.findByIdAndUpdate(
            'billNumber',
            { $inc: { sequenceValue: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).exec();

        return `BILL-${String(counter.sequenceValue).padStart(6, '0')}`;
    }

    // Create bill.
    async createBill(billData) {
        const bill = new Bill(billData);
        return bill.save();
    }

    // Load bills.
    async getBills(query = {}) {
        return Bill.find(query)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate timeSlot status paymentStatus')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Load bill by id.
    async getBillById(id) {
        return Bill.findById(id)
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate timeSlot status paymentStatus')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .exec();
    }

    // Update bill.
    async updateBill(id, updateData) {
        return Bill.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate timeSlot status paymentStatus')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .exec();
    }

    // Remove bill.
    async deleteBill(id) {
        return Bill.findByIdAndDelete(id).exec();
    }

    // Handle count bills.
    async countBills(query = {}) {
        return Bill.countDocuments(query).exec();
    }

    // Load consultation bill by appointment.
    async getConsultationBillByAppointment(appointmentId) {
        return Bill.findOne({ appointment: appointmentId, billType: 'consultation' })
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate timeSlot status paymentStatus')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .exec();
    }

    // Load pharmacy bill by prescription.
    async getPharmacyBillByPrescription(prescriptionId) {
        return Bill.findOne({
            billType: 'pharmacy',
            'items.sourceType': 'prescription',
            'items.sourceId': prescriptionId,
        })
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate timeSlot status paymentStatus')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .exec();
    }

    // Load service bill by source.
    async getServiceBillBySource(billType, sourceType, sourceId) {
        return Bill.findOne({
            billType,
            'items.sourceType': sourceType,
            'items.sourceId': sourceId,
        })
            .populate('patient', 'patientId fullName phone')
            .populate('appointment', 'appointmentDate timeSlot status paymentStatus')
            .populate('doctor', 'name email role consultationFee roomNumber')
            .populate('createdBy', 'name email role')
            .populate('payments.receivedBy', 'name email role')
            .exec();
    }

    // Handle sum bill totals.
    async sumBillTotals(match = {}) {
        const result = await Bill.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    paidAmount: { $sum: '$paidAmount' },
                },
            },
        ]);

        return result[0] || { totalAmount: 0, paidAmount: 0 };
    }
}

export default new BillDao();
