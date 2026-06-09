import express from 'express';
import { createUserByAdmin, getUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../types/userRoles.js';

const router = express.Router();

router.get('/', protect, authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE, USER_ROLES.PHARMACIST, USER_ROLES.LAB_TECHNICIAN, USER_ROLES.RADIOLOGIST), getUsers);
router.post('/admin/create-user', protect, authorizeRoles(USER_ROLES.ADMIN), createUserByAdmin);

export default router;
