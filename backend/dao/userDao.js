// This file contains the user dao database queries.

import User from '../models/user.js';

// Group the user dao database queries.
class UserDao {
    // Create user.
    async createUser(userData) {
        const user = new User(userData);
        return user.save();
    }

    // Load users.
    async getUsers(query = {}) {
        return User.find(query)
            .select(
                'name firstName lastName email phone nic dob gender role isActive avatar lastLogin department specialization consultationFee roomNumber',
            )
            .populate('department', 'name description status')
            .sort({ name: 1 })
            .exec();
    }

    // Load user by email.
    async getUserByEmail(email, includePassword = false) {
        const query = User.findOne({ email: email.toLowerCase().trim() });
        if (includePassword) {
            query.select('+password');
        }
        return query.exec();
    }

    // Load user by id.
    async getUserById(userId) {
        return User.findById(userId).populate('department', 'name description status').exec();
    }

    // Load active doctors by department.
    async getActiveDoctorsByDepartment(departmentId) {
        return User.find({ role: 'doctor', isActive: true, department: departmentId })
            .select(
                'name firstName lastName department specialization consultationFee',
            )
            .populate('department', 'name description status')
            .sort({ name: 1 })
            .exec();
    }

    // Handle count users by role.
    async countUsersByRole(role) {
        return User.countDocuments({ role }).exec();
    }

    // Load user by phone.
    async getUserByPhone(phone) {
        return User.findOne({ phone }).exec();
    }

    // Load user by phone for password reset.
    async getUserByPhoneForPasswordReset(phone) {
        return User.findOne({ phone })
            .select(
                '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpLastSentAt +passwordResetOtpAttempts',
            )
            .exec();
    }

    // Load user by nic.
    async getUserByNic(nic) {
        return User.findOne({ nic }).exec();
    }

    // Load user by room number.
    async getUserByRoomNumber(roomNumber) {
        return User.findOne({ roomNumber }).exec();
    }

    // Update user.
    async updateUser(userId, updateData) {
        return User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
            context: 'query',
        }).exec();
    }

    // Remove user.
    async deleteUser(userId) {
        return User.findByIdAndDelete(userId).exec();
    }
}

export default new UserDao();
