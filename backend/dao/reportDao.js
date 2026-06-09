import Appointment from '../models/appointment.js';
import Bill from '../models/bill.js';
import Feedback from '../models/feedback.js';
import InventoryItem from '../models/inventoryItem.js';
import LabRequest from '../models/labRequest.js';
import Medicine from '../models/medicine.js';
import Patient from '../models/patient.js';
import Prescription from '../models/prescription.js';
import QueueEntry from '../models/queueEntry.js';
import RadiologyRequest from '../models/radiologyRequest.js';
import User from '../models/user.js';

class ReportDao {
    async getDashboardCounts() {
        const [
            totalPatients,
            totalStaff,
            totalAppointments,
            waitingQueueEntries,
            pendingPrescriptions,
            pendingLabRequests,
            pendingRadiologyRequests,
            unpaidBills,
            lowStockMedicines,
            lowStockInventoryItems,
            openFeedback,
        ] = await Promise.all([
            Patient.countDocuments().exec(),
            User.countDocuments({ role: { $ne: 'patient' } }).exec(),
            Appointment.countDocuments().exec(),
            QueueEntry.countDocuments({ status: 'waiting' }).exec(),
            Prescription.countDocuments({ status: { $in: ['pending', 'partially_issued'] } }).exec(),
            LabRequest.countDocuments({ status: { $ne: 'completed' } }).exec(),
            RadiologyRequest.countDocuments({ status: { $ne: 'completed' } }).exec(),
            Bill.countDocuments({ status: { $in: ['unpaid', 'partially_paid'] } }).exec(),
            Medicine.countDocuments({ $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }, status: 'active' }).exec(),
            InventoryItem.countDocuments({ $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }, status: 'active' }).exec(),
            Feedback.countDocuments({ status: { $in: ['open', 'in_review'] } }).exec(),
        ]);

        return {
            totalPatients,
            totalStaff,
            totalAppointments,
            waitingQueueEntries,
            pendingPrescriptions,
            pendingLabRequests,
            pendingRadiologyRequests,
            unpaidBills,
            lowStockMedicines,
            lowStockInventoryItems,
            openFeedback,
        };
    }

    async getRevenueSummary(match = {}) {
        const result = await Bill.aggregate([
            { $match: match },
            { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, paidAmount: { $sum: '$paidAmount' } } },
        ]);

        return result[0] || { totalAmount: 0, paidAmount: 0 };
    }
}

export default new ReportDao();
