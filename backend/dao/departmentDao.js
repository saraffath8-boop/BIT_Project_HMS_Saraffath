import Department from '../models/department.js';

class DepartmentDao {
    async getActiveDepartments() {
        return Department.find({ status: 'active' }).sort({ name: 1 }).exec();
    }

    async getDepartmentById(id) {
        return Department.findById(id).exec();
    }

    async ensureDepartments(departments) {
        return Promise.all(departments.map((department) => Department.updateOne(
            { name: department.name },
            { $setOnInsert: department },
            { upsert: true }
        ).exec()));
    }
}

export default new DepartmentDao();
