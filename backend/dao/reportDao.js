// This file contains the report dao database queries.

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

// Group the report dao database queries.
class ReportDao {
    // Load dashboard counts.
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
            Prescription.countDocuments({
                status: { $in: ['pending', 'partially_issued'] },
            }).exec(),
            LabRequest.countDocuments({ status: { $ne: 'completed' } }).exec(),
            RadiologyRequest.countDocuments({ status: { $ne: 'completed' } }).exec(),
            Bill.countDocuments({ status: { $in: ['unpaid', 'partially_paid'] } }).exec(),
            Medicine.countDocuments({
                $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
                status: 'active',
            }).exec(),
            InventoryItem.countDocuments({
                $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
                status: 'active',
            }).exec(),
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

    // Load revenue summary.
    async getRevenueSummary(match = {}) {
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

    // Load bills for detailed reports.
    async getBillsForReport(match = {}) {
        return Bill.find(match)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('createdBy', 'name email role')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    // Load appointments for detailed reports.
    async getAppointmentsForReport(match = {}) {
        return Appointment.find(match)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role specialization')
            .populate('departmentRef', 'name')
            .sort({ appointmentDate: -1 })
            .lean()
            .exec();
    }

    // Load prescriptions for detailed reports.
    async getPrescriptionsForReport(match = {}) {
        return Prescription.find(match)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('paidBy', 'name email role')
            .populate('issuedBy', 'name email role')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    // Load medicines for inventory summary.
    async getMedicinesForReport(match = {}) {
        return Medicine.find(match).sort({ name: 1 }).lean().exec();
    }

    // Load lab requests for detailed reports.
    async getLabRequestsForReport(match = {}) {
        return LabRequest.find(match)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('technician', 'name email role')
            .populate('paidBy', 'name email role')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    // Load radiology requests for detailed reports.
    async getRadiologyRequestsForReport(match = {}) {
        return RadiologyRequest.find(match)
            .populate('patient', 'patientId fullName phone')
            .populate('doctor', 'name email role')
            .populate('radiologist', 'name email role')
            .populate('paidBy', 'name email role')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    // Load patients for registration trend reports.
    async getPatientsForReport(match = {}) {
        return Patient.find(match).sort({ createdAt: -1 }).lean().exec();
    }
}

export default new ReportDao();
