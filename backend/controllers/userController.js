// This file contains the user controller HTTP request handlers.

import userService, { ADMIN_CREATABLE_ROLES } from '../services/userService.js';
import { validateUserCreateInput } from '../utils/userValidation.js';

// Create the send error.
const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,
        message,
    });

// Load error status code.
const getErrorStatusCode = (error) => {
    if (error.code === 11000 || error.message.includes('already exists')) return 409;
    if (
        error.name === 'ValidationError' ||
        /required|must|valid|invalid|characters/i.test(error.message)
    )
        return 400;
    return 500;
};

// Create user by admin.
export const createUserByAdmin = async (req, res) => {
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
            role,
            isActive,
            avatar,
            department,
            specialization,
            consultationFee,
            availableDays,
            availableTimeSlots,
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
            role,
        });

        if (validationError) {
            return sendError(res, 400, validationError);
        }

        if (!role) {
            return sendError(res, 400, 'Role is required');
        }

        if (!ADMIN_CREATABLE_ROLES.includes(role)) {
            return sendError(
                res,
                400,
                `Invalid staff role. Admin can create: ${ADMIN_CREATABLE_ROLES.join(', ')}`,
            );
        }

        const user = await userService.createUserByAdmin({
            firstName,
            lastName,
            email,
            phone,
            nic,
            dob,
            gender,
            password,
            role,
            isActive,
            avatar,
            department,
            specialization,
            consultationFee,
            availableDays,
            availableTimeSlots,
        });

        return res.status(201).json({
            success: true,
            message: 'User created successfully by admin',
            user,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

// Load users.
export const getUsers = async (req, res) => {
    try {
        const users = await userService.getUsers(req.query, req.user);

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        const statusCode = error.message.includes('Invalid') ? 400 : 500;
        return sendError(res, statusCode, error.message);
    }
};

// Update doctor booking profile.
export const updateDoctorBookingProfile = async (req, res) => {
    try {
        const user = await userService.updateDoctorBookingProfile(req.params.id, req.body);
        return res
            .status(200)
            .json({ success: true, message: 'Doctor booking profile updated successfully', user });
    } catch (error) {
        const statusCode = error.message === 'Doctor not found' ? 404 : getErrorStatusCode(error);
        return sendError(res, statusCode, error.message);
    }
};
