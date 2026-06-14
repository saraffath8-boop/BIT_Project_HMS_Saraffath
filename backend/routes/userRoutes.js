// This file contains the user routes API routes.

import express from 'express';
import {
    createUserByAdmin,
    deleteStaffByAdmin,
    getUsers,
    updateStaffByAdmin,
    updateDoctorBookingProfile,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../types/userRoles.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.get(
    '/',
    protect,
    authorizeRoles(
        USER_ROLES.ADMIN,
        USER_ROLES.DOCTOR,
        USER_ROLES.NURSE,
        USER_ROLES.PHARMACIST,
        USER_ROLES.RECEPTIONIST,
        USER_ROLES.LAB_TECHNICIAN,
        USER_ROLES.RADIOLOGIST,
    ),
    getUsers,
);
// Connect this API URL to its request handler.
router.post('/admin/create-user', protect, authorizeRoles(USER_ROLES.ADMIN), createUserByAdmin);
router
    .route('/admin/staff/:id')
    .patch(protect, authorizeRoles(USER_ROLES.ADMIN), updateStaffByAdmin)
    .delete(protect, authorizeRoles(USER_ROLES.ADMIN), deleteStaffByAdmin);
// Connect this API URL to its request handler.
router.patch(
    '/admin/doctors/:id/booking-profile',
    protect,
    authorizeRoles(USER_ROLES.ADMIN),
    updateDoctorBookingProfile,
);

export default router;
