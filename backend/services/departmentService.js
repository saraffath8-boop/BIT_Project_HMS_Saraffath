// This file contains the department service business workflow.

import departmentDao from '../dao/departmentDao.js';

// Store the default departments setting used by this file.
const DEFAULT_DEPARTMENTS = [
    { name: 'Cardiology', description: 'Heart and cardiovascular care.' },
    { name: 'General Medicine', description: 'General adult medical care.' },
    { name: 'Neurology', description: 'Brain and nervous system care.' },
    { name: 'Orthopedics', description: 'Bone, joint, and musculoskeletal care.' },
    { name: 'Pediatrics', description: 'Medical care for children.' },
];

// Prepare department.
const sanitizeDepartment = (department) => ({
    id: department._id.toString(),
    name: department.name,
    description: department.description,
    status: department.status,
});

// Load active departments.
const getActiveDepartments = async () => {
    const departments = await departmentDao.getActiveDepartments();
    return departments.map(sanitizeDepartment);
};

// Validate default departments.
const ensureDefaultDepartments = async () => departmentDao.ensureDepartments(DEFAULT_DEPARTMENTS);

export default { getActiveDepartments, ensureDefaultDepartments };
