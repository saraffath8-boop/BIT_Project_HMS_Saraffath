import departmentService from '../services/departmentService.js';

export const getDepartments = async (_req, res) => {
    try {
        const departments = await departmentService.getActiveDepartments();
        return res.status(200).json({ success: true, departments });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
