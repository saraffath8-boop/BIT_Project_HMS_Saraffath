import doctorService from '../services/doctorService.js';

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

export const getDoctors = async (req, res) => {
    try {
        const doctors = await doctorService.getDoctors(req.query.departmentId);
        return res.status(200).json({ success: true, doctors });
    } catch (error) {
        return sendError(res, error);
    }
};

export const getDoctorAvailability = async (req, res) => {
    try {
        const availability = await doctorService.getDoctorAvailability(req.params.doctorId, req.query.date);
        return res.status(200).json({ success: true, ...availability });
    } catch (error) {
        return sendError(res, error);
    }
};
