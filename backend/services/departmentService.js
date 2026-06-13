import departmentDao from '../dao/departmentDao.js';

const DEFAULT_DEPARTMENTS = [
    { name: 'Cardiology', description: 'Heart and cardiovascular care.' },
    { name: 'General Medicine', description: 'General adult medical care.' },
    { name: 'Neurology', description: 'Brain and nervous system care.' },
    { name: 'Orthopedics', description: 'Bone, joint, and musculoskeletal care.' },
    { name: 'Pediatrics', description: 'Medical care for children.' },
];

const sanitizeDepartment = (department) => ({
    id: department._id.toString(),
    name: department.name,
    description: department.description,
    status: department.status,
});

const getActiveDepartments = async () => {
    const departments = await departmentDao.getActiveDepartments();
    return departments.map(sanitizeDepartment);
};

const ensureDefaultDepartments = async () => departmentDao.ensureDepartments(DEFAULT_DEPARTMENTS);

export default { getActiveDepartments, ensureDefaultDepartments };
