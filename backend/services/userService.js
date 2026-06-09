import bcrypt from 'bcrypt';
import userDao from '../dao/userDao.js';
import { ADMIN_CREATABLE_ROLES, ALL_USER_ROLES, USER_ROLES } from '../types/userRoles.js';
import { normalizeNic, validateUserCreateInput } from '../utils/userValidation.js';

const SALT_ROUNDS = 12;

const LISTABLE_ROLES = [
    USER_ROLES.ADMIN,
    USER_ROLES.DOCTOR,
    USER_ROLES.NURSE,
    USER_ROLES.PHARMACIST,
    USER_ROLES.RECEPTIONIST,
    USER_ROLES.LAB_TECHNICIAN,
    USER_ROLES.RADIOLOGIST,
    USER_ROLES.PATIENT,
];

const normalizeEmail = (email) => email.toLowerCase().trim();

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const sanitizeUser = (user) => ({
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const sanitizeListedUser = (user) => ({
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
});

const createUserWithRole = async ({ firstName, lastName, email, phone, nic, dob, gender, password, role, isActive = true, avatar }) => {
    const validationError = validateUserCreateInput({ firstName, lastName, email, phone, nic, dob, gender, password, role });
    if (validationError) throw new Error(validationError);
    const normalizedEmail = normalizeEmail(email);
    const normalizedNic = normalizeNic(nic);

    if (!ALL_USER_ROLES.includes(role)) {
        throw new Error(`Invalid role. Allowed roles: ${ALL_USER_ROLES.join(', ')}`);
    }

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
        role,
        isActive,
        ...(avatar ? { avatar } : {}),
    });

    return user;
};

const createUserByAdmin = async (userData) => {
    const { role } = userData;
    if (!ADMIN_CREATABLE_ROLES.includes(role)) {
        throw new Error(`Invalid staff role. Admin can create: ${ADMIN_CREATABLE_ROLES.join(', ')}`);
    }

    const user = await createUserWithRole(userData);

    return sanitizeUser(user);
};

const getUsers = async (queryParams = {}) => {
    const query = {};

    if (queryParams.role) {
        if (!LISTABLE_ROLES.includes(queryParams.role)) {
            throw new Error('Invalid user role filter');
        }
        query.role = queryParams.role;
    }

    const users = await userDao.getUsers(query);
    return users.map(sanitizeListedUser);
};

const ensureDefaultAdmin = async () => {
    const adminCount = await userDao.countUsersByRole(USER_ROLES.ADMIN);
    if (adminCount > 0) {
        return null;
    }

    const nameParts = (process.env.DEFAULT_ADMIN_NAME || 'Master Admin').trim().split(/\s+/);
    const firstName = process.env.DEFAULT_ADMIN_FIRST_NAME || nameParts[0] || 'Master';
    const lastName = process.env.DEFAULT_ADMIN_LAST_NAME || nameParts.slice(1).join(' ') || 'Admin';
    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const password = process.env.DEFAULT_ADMIN_PASSWORD;

    if (!email || !password) {
        console.log('Default admin was not created because DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD is missing');
        return null;
    }

    if (password.length < 8) {
        throw new Error('DEFAULT_ADMIN_PASSWORD must be at least 8 characters long');
    }

    const admin = await createUserWithRole({
        firstName,
        lastName,
        email,
        phone: process.env.DEFAULT_ADMIN_PHONE || '0110000000',
        nic: process.env.DEFAULT_ADMIN_NIC || '000000000V',
        dob: process.env.DEFAULT_ADMIN_DOB || '1970-01-01',
        gender: process.env.DEFAULT_ADMIN_GENDER || 'Other',
        password,
        role: USER_ROLES.ADMIN,
    });

    console.log(`Default admin created: ${admin.email}`);
    return sanitizeUser(admin);
};

const userService = {
    createUserByAdmin,
    getUsers,
    ensureDefaultAdmin,
};

export default userService;

export { ADMIN_CREATABLE_ROLES };
