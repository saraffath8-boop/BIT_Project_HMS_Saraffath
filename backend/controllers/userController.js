import userService, { ADMIN_CREATABLE_ROLES } from '../services/userService.js';
import { validateUserCreateInput } from '../utils/userValidation.js';

const sendError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message,
});

const getErrorStatusCode = (error) => {
    if (error.code === 11000 || error.message.includes('already exists')) return 409;
    if (error.name === 'ValidationError' || /required|must|valid|invalid|characters/i.test(error.message)) return 400;
    return 500;
};

export const createUserByAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, nic, dob, gender, password, role, isActive, avatar } = req.body;
        const validationError = validateUserCreateInput({ firstName, lastName, email, phone, nic, dob, gender, password, role });

        if (validationError) {
            return sendError(res, 400, validationError);
        }

        if (!role) {
            return sendError(res, 400, 'Role is required');
        }

        if (!ADMIN_CREATABLE_ROLES.includes(role)) {
            return sendError(res, 400, `Invalid staff role. Admin can create: ${ADMIN_CREATABLE_ROLES.join(', ')}`);
        }

        const user = await userService.createUserByAdmin({ firstName, lastName, email, phone, nic, dob, gender, password, role, isActive, avatar });

        return res.status(201).json({
            success: true,
            message: 'User created successfully by admin',
            user,
        });
    } catch (error) {
        return sendError(res, getErrorStatusCode(error), error.message);
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await userService.getUsers(req.query);

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        const statusCode = error.message.includes('Invalid') ? 400 : 500;
        return sendError(res, statusCode, error.message);
    }
};
