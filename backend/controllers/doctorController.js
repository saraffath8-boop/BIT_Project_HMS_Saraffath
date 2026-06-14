// This file contains the doctor controller HTTP request handlers.

import doctorService from '../services/doctorService.js';

// Create the send error.
const sendError = (res, error) =>
    res.status(error.statusCode || 500).json({ success: false, message: error.message });

// Load doctors.
export const getDoctors = async (req, res) => {
    try {
        const doctors = await doctorService.getDoctors(req.query.departmentId);
        return res.status(200).json({ success: true, doctors });
    } catch (error) {
        return sendError(res, error);
    }
};

// Load doctor availability.
export const getDoctorAvailability = async (req, res) => {
    try {
        const availability = await doctorService.getDoctorAvailability(
            req.params.doctorId,
            req.query.date,
        );
        return res.status(200).json({ success: true, ...availability });
    } catch (error) {
        return sendError(res, error);
    }
};

// Replace a doctor's date-specific availability.
export const replaceDoctorAvailability = async (req, res) => {
    try {
        const availability = await doctorService.replaceDoctorAvailability(
            req.params.doctorId,
            req.body.date,
            req.body.timeSlots,
            req.user,
        );
        return res.status(200).json({
            success: true,
            message: 'Doctor time slots updated successfully',
            ...availability,
        });
    } catch (error) {
        return sendError(res, error);
    }
};
