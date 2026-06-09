import User from '../models/user.js';

class UserDao {
    async createUser(userData) {
        const user = new User(userData);
        return user.save();
    }

    async getUsers(query = {}) {
        return User.find(query)
            .select('name firstName lastName email phone nic dob gender role isActive avatar lastLogin')
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
        return User.findById(userId).exec();
    }

    async countUsersByRole(role) {
        return User.countDocuments({ role }).exec();
    }

    async getUserByPhone(phone) {
        return User.findOne({ phone }).exec();
    }

    async getUserByNic(nic) {
        return User.findOne({ nic }).exec();
    }

    async updateUser(userId, updateData) {
        return User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true, context: 'query' }).exec();
    }
}

export default new UserDao();
