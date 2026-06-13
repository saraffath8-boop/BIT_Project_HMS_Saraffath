import User from '../models/user.js';

class UserDao {
    async createUser(userData) {
        const user = new User(userData);
        return user.save();
    }

    async getUsers(query = {}) {
        return User.find(query)
            .select(
                'name firstName lastName email phone nic dob gender role isActive avatar lastLogin department specialization consultationFee roomNumber availableDays availableTimeSlots',
            )
            .populate('department', 'name description status')
            .sort({ name: 1 })
            .exec();
    }

    async getUserByEmail(email, includePassword = false) {
        const query = User.findOne({ email: email.toLowerCase().trim() });
        if (includePassword) {
            query.select('+password');
        }
        return query.exec();
    }

    async getUserById(userId) {
        return User.findById(userId).populate('department', 'name description status').exec();
    }

    async getActiveDoctorsByDepartment(departmentId) {
        return User.find({ role: 'doctor', isActive: true, department: departmentId })
            .select(
                'name firstName lastName department specialization consultationFee availableDays availableTimeSlots',
            )
            .populate('department', 'name description status')
            .sort({ name: 1 })
            .exec();
    }

    async countUsersByRole(role) {
        return User.countDocuments({ role }).exec();
    }

    async getUserByPhone(phone) {
        return User.findOne({ phone }).exec();
    }

    async getUserByPhoneForPasswordReset(phone) {
        return User.findOne({ phone })
            .select(
                '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpLastSentAt +passwordResetOtpAttempts',
            )
            .exec();
    }

    async getUserByNic(nic) {
        return User.findOne({ nic }).exec();
    }

    async getUserByRoomNumber(roomNumber) {
        return User.findOne({ roomNumber }).exec();
    }

    async updateUser(userId, updateData) {
        return User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
            context: 'query',
        }).exec();
    }

    async deleteUser(userId) {
        return User.findByIdAndDelete(userId).exec();
    }
}

export default new UserDao();
