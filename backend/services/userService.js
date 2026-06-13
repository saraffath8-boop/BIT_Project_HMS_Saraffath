import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import userDao from '../dao/userDao.js';
import departmentDao from '../dao/departmentDao.js';
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
    department: user.department,
    specialization: user.specialization,
    consultationFee: user.consultationFee,
    availableDays: user.availableDays,
    availableTimeSlots: user.availableTimeSlots,
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
    department: user.department,
    specialization: user.specialization,
    consultationFee: user.consultationFee,
    availableDays: user.availableDays,
    availableTimeSlots: user.availableTimeSlots,
});

const createUserWithRole = async ({ firstName, lastName, email, phone, nic, dob, gender, password, role, isActive = true, avatar, department, specialization, consultationFee, availableDays, availableTimeSlots }) => {
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

    if (role === USER_ROLES.DOCTOR) {
        if (!department) throw new Error('Department is required for doctors');
        const doctorDepartment = await departmentDao.getDepartmentById(department);
        if (!doctorDepartment || doctorDepartment.status !== 'active') throw new Error('Invalid doctor department');
    }

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
        ...(role === USER_ROLES.DOCTOR ? {
            department,
            specialization: specialization?.trim() || '',
            consultationFee: Number(consultationFee) || 0,
            availableDays: Array.isArray(availableDays) && availableDays.length ? availableDays.map(Number) : [1, 2, 3, 4, 5],
            availableTimeSlots: Array.isArray(availableTimeSlots) && availableTimeSlots.length ? availableTimeSlots : ['09:00', '10:00', '11:00', '14:00', '15:00'],
        } : {}),
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

const updateDoctorBookingProfile = async (doctorId, data) => {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) throw new Error('Invalid doctor id');
    if (!mongoose.Types.ObjectId.isValid(data.department)) throw new Error('Invalid doctor department');

    const [doctor, department] = await Promise.all([
        userDao.getUserById(doctorId),
        departmentDao.getDepartmentById(data.department),
    ]);
    if (!doctor || doctor.role !== USER_ROLES.DOCTOR) throw new Error('Doctor not found');
    if (!department || department.status !== 'active') throw new Error('Invalid doctor department');

    const updatedDoctor = await userDao.updateUser(doctorId, {
        department: department._id,
        specialization: data.specialization?.trim() || '',
        consultationFee: Number(data.consultationFee) || 0,
    });
    return sanitizeUser(updatedDoctor);
};

const sanitizeLookupUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    role: user.role,
});

const getUsers = async (queryParams = {}, requestingUser = {}) => {
    const query = {};

    if (requestingUser.role === USER_ROLES.RECEPTIONIST) {
        const requestedRole = queryParams.role || USER_ROLES.PATIENT;
        if (![USER_ROLES.DOCTOR, USER_ROLES.PATIENT].includes(requestedRole)) {
            throw new Error('Invalid user role filter');
        }
        query.role = requestedRole;
        query.isActive = true;
        const users = await userDao.getUsers(query);
        return users.map(sanitizeLookupUser);
    }

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
    updateDoctorBookingProfile,
    getUsers,
    ensureDefaultAdmin,
};

export default userService;

export { ADMIN_CREATABLE_ROLES };
