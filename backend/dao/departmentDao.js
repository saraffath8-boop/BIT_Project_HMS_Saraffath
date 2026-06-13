// This file contains the department dao database queries.

import Department from '../models/department.js';

// Group the department dao database queries.
class DepartmentDao {
    // Load active departments.
    async getActiveDepartments() {
        return Department.find({ status: 'active' }).sort({ name: 1 }).exec();
    }

    // Load department by id.
    async getDepartmentById(id) {
        return Department.findById(id).exec();
    }

    // Validate departments.
    async ensureDepartments(departments) {
        return Promise.all(
            departments.map((department) =>
                Department.updateOne(
                    { name: department.name },
                    { $setOnInsert: department },
                    { upsert: true },
                ).exec(),
            ),
        );
    }
}

export default new DepartmentDao();
