// This file contains the user dao HTTP request handlers.

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
        return User.find(query).select('name email role isActive').sort({ name: 1 }).exec();
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
        return User.findById(userId).exec();
    }

    // Handle count users by role.
    async countUsersByRole(role) {
        return User.countDocuments({ role }).exec();
    }
}

export default new UserDao();
