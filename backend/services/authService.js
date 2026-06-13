import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import userDao from '../dao/userDao.js';
import { USER_ROLES } from '../models/user.js';
import patientService from './patientService.js';
import smsService from './smsService.js';
import { normalizeNic, validateUserCreateInput } from '../utils/userValidation.js';

const SALT_ROUNDS = 12;
const PUBLIC_SIGNUP_ROLE = 'patient';
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const PASSWORD_RESET_REQUEST_MESSAGE =
    'If an active patient account uses this mobile number, a password reset OTP has been sent.';

const serviceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const shouldShowDevelopmentOtp = () =>
    process.env.NODE_ENV !== 'production' &&
    (process.env.SMS_PROVIDER || 'log').toLowerCase() === 'log' &&
    process.env.SHOW_DEVELOPMENT_OTP === 'true';

const hashOtp = (otp) => {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    return crypto.createHmac('sha256', process.env.JWT_SECRET).update(otp).digest('hex');
};

const otpMatches = (otp, expectedHash) => {
    const actual = Buffer.from(hashOtp(otp), 'hex');
    const expected = Buffer.from(expectedHash || '', 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

export const normalizeEmail = (email) => email.toLowerCase().trim();

export const sanitizeUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    nic: user.nic,
    dob: user.dob,
    gender: user.gender,
    role: user.role,
    isActive: user.isActive,
    avatar: user.avatar,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

export const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    );
};

const signupUser = async ({
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
}) => {
    const validationError = validateUserCreateInput({
        firstName,
        lastName,
        email,
        phone,
        nic,
        dob,
        gender,
        password,
        role: PUBLIC_SIGNUP_ROLE,
    });
    if (validationError) throw new Error(validationError);
    if (!address || !emergencyContactName || !emergencyContactPhone) {
        throw new Error(
            'Address, emergency contact name, and emergency contact phone are required',
        );
    }
    const normalizedEmail = normalizeEmail(email);
    const normalizedNic = normalizeNic(nic);
    const [existingUser, existingPhone, existingNic] = await Promise.all([
        userDao.getUserByEmail(normalizedEmail),
        userDao.getUserByPhone(phone.trim()),
        userDao.getUserByNic(normalizedNic),
    ]);

    if (existingUser) {
        throw new Error('User already exists with this email');
    }
    if (existingPhone) throw new Error('User already exists with this phone number');
    if (existingNic) throw new Error('User already exists with this NIC');

    const user = await userDao.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        nic: normalizedNic,
        dob,
        gender,
        password: await hashPassword(password),
        role: PUBLIC_SIGNUP_ROLE,
    });

    try {
        await patientService.createPatientForUser(user, {
            address,
            emergencyContactName,
            emergencyContactPhone,
        });
    } catch (error) {
        await userDao.deleteUser(user._id);
        throw error;
    }

    return {
        token: generateToken(user),
        user: sanitizeUser(user),
    };
};

const loginUser = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await userDao.getUserByEmail(normalizedEmail, true);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
        throw new Error('This account is inactive. Please contact an administrator.');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new Error('Invalid email or password');
    }

    user.lastLogin = new Date();
    await userDao.updateUser(user._id, { lastLogin: user.lastLogin });

    return {
        token: generateToken(user),
        user: sanitizeUser(user),
    };
};

const requestPatientPasswordReset = async ({ phone }) => {
    const normalizedPhone = String(phone || '').trim();
    const user = await userDao.getUserByPhoneForPasswordReset(normalizedPhone);

    if (!user || user.role !== PUBLIC_SIGNUP_ROLE || !user.isActive) {
        return { message: PASSWORD_RESET_REQUEST_MESSAGE };
    }

    const now = new Date();
    const lastSentAt = user.passwordResetOtpLastSentAt?.getTime() || 0;
    if (now.getTime() - lastSentAt < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
        return { message: PASSWORD_RESET_REQUEST_MESSAGE };
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    await userDao.updateUser(user._id, {
        passwordResetOtpHash: hashOtp(otp),
        passwordResetOtpExpiresAt: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000),
        passwordResetOtpLastSentAt: now,
        passwordResetOtpAttempts: 0,
    });

    const smsResult = await smsService.sendSms({
        to: user.phone,
        message: `Your MediCore patient password reset OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
    });

    if (!smsResult.success) {
        await userDao.updateUser(user._id, {
            $unset: {
                passwordResetOtpHash: 1,
                passwordResetOtpExpiresAt: 1,
                passwordResetOtpLastSentAt: 1,
                passwordResetOtpAttempts: 1,
            },
        });
        throw serviceError('Unable to send the password reset OTP. Please try again later.', 503);
    }

    return {
        message: PASSWORD_RESET_REQUEST_MESSAGE,
        ...(shouldShowDevelopmentOtp() ? { developmentOtp: otp } : {}),
    };
};

const resetPatientPassword = async ({ phone, otp, newPassword }) => {
    const normalizedPhone = String(phone || '').trim();
    const user = await userDao.getUserByPhoneForPasswordReset(normalizedPhone);
    const invalidOtpError = () => serviceError('The OTP is invalid or has expired.', 400);

    if (
        !user ||
        user.role !== PUBLIC_SIGNUP_ROLE ||
        !user.isActive ||
        !user.passwordResetOtpHash ||
        !user.passwordResetOtpExpiresAt
    ) {
        throw invalidOtpError();
    }

    if (user.passwordResetOtpExpiresAt <= new Date()) {
        await userDao.updateUser(user._id, {
            $unset: {
                passwordResetOtpHash: 1,
                passwordResetOtpExpiresAt: 1,
                passwordResetOtpLastSentAt: 1,
                passwordResetOtpAttempts: 1,
            },
        });
        throw invalidOtpError();
    }

    if ((user.passwordResetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
        throw serviceError('Too many invalid OTP attempts. Request a new OTP.', 429);
    }

    if (!otpMatches(String(otp), user.passwordResetOtpHash)) {
        await userDao.updateUser(user._id, {
            passwordResetOtpAttempts: (user.passwordResetOtpAttempts || 0) + 1,
        });
        throw invalidOtpError();
    }

    await userDao.updateUser(user._id, {
        $set: {
            password: await hashPassword(newPassword),
            passwordChangedAt: new Date(),
        },
        $unset: {
            passwordResetOtpHash: 1,
            passwordResetOtpExpiresAt: 1,
            passwordResetOtpLastSentAt: 1,
            passwordResetOtpAttempts: 1,
        },
    });

    return { message: 'Password reset successful. You can now sign in with your new password.' };
};

const getCurrentUser = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user id');
    }

    const user = await userDao.getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    return sanitizeUser(user);
};

const verifyTokenAndGetUser = async (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userDao.getUserById(decoded.id);

    if (!user) {
        throw new Error('User attached to this token no longer exists');
    }

    if (!USER_ROLES.includes(user.role)) {
        throw new Error('Invalid user role');
    }

    if (
        user.passwordChangedAt &&
        decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
        throw new Error('Password changed after this token was issued');
    }

    return user;
};

const authService = {
    signupUser,
    loginUser,
    requestPatientPasswordReset,
    resetPatientPassword,
    getCurrentUser,
    verifyTokenAndGetUser,
};

export default authService;
