import authService from '../services/authService.js';
import { validateUserCreateInput } from '../utils/userValidation.js';

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const isValidMobile = (phone) => /^07[0-9]{8}$/.test(String(phone || '').trim());

const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,
        message,
    });

const getErrorStatusCode = (error) => {
    if (error.code === 11000 || error.message.includes('already exists')) return 409;
    if (
        error.name === 'ValidationError' ||
        /required|must|valid|invalid|characters/i.test(error.message)
    )
        return 400;
    return 500;
};

export const signupUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            nic,
            dob,
            gender,
            password,
            address,
            emergencyContactName,
            emergencyContactPhone,
        } = req.body;
        const validationError = validateUserCreateInput({
            firstName,
            lastName,
            email,
            phone,
            nic,
            dob,
            gender,
            password,
            role: 'patient',
        });

        if (validationError) {
            return sendError(res, 400, validationError);
        }

        const result = await authService.signupUser({
            firstName,
            lastName,
            email,
            phone,
            nic,
            dob,
            gender,
            password,
            address,
            emergencyContactName,
            emergencyContactPhone,
        });

        return res.status(201).json({
            success: true,
            message: 'Patient signup successful',
            token: result.token,
            user: result.user,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, 'Email and password are required');
        }

        if (!isValidEmail(email)) {
            return sendError(res, 400, 'Please provide a valid email address');
        }

        const result = await authService.loginUser({ email, password });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token: result.token,
            user: result.user,
        });
    } catch (error) {
        const statusCode = error.message.includes('Invalid email or password') ? 401 : 500;
        return sendError(res, statusCode, error.message);
    }
};

export const requestPatientPasswordReset = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!isValidMobile(phone))
            return sendError(
                res,
                400,
                'Enter a valid Sri Lankan 10-digit mobile number starting with 07',
            );

        const result = await authService.requestPatientPasswordReset({ phone });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
};

export const resetPatientPassword = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;
        if (!isValidMobile(phone))
            return sendError(
                res,
                400,
                'Enter a valid Sri Lankan 10-digit mobile number starting with 07',
            );
        if (!/^[0-9]{6}$/.test(String(otp || '')))
            return sendError(res, 400, 'OTP must contain exactly 6 digits');
        if (typeof newPassword !== 'string' || newPassword.length < 8)
            return sendError(res, 400, 'Password must be at least 8 characters long');

        const result = await authService.resetPatientPassword({ phone, otp, newPassword });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await authService.getCurrentUser(req.user.id);

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        return sendError(res, 404, error.message);
    }
};
