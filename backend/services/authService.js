import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import userDao from '../dao/userDao.js';
import { USER_ROLES } from '../models/user.js';
import { normalizeNic, validateUserCreateInput } from '../utils/userValidation.js';

const SALT_ROUNDS = 12;
const PUBLIC_SIGNUP_ROLE = 'patient';

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
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

const signupUser = async ({ firstName, lastName, email, phone, nic, dob, gender, password }) => {
    const validationError = validateUserCreateInput({ firstName, lastName, email, phone, nic, dob, gender, password, role: PUBLIC_SIGNUP_ROLE });
    if (validationError) throw new Error(validationError);
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

    return user;
};

const authService = {
    signupUser,
    loginUser,
    getCurrentUser,
    verifyTokenAndGetUser,
};

export default authService;
