import express from 'express';
import { createUserByAdmin, getUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('admin', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist'), getUsers);
router.post('/admin/create-user', protect, authorizeRoles('admin'), createUserByAdmin);

export default router;
