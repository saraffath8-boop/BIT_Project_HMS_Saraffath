import express from 'express';
import {
    createBill,
    deleteBill,
    getBillById,
    getBills,
    getMyBills,
    updateBill,
} from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorizeRoles('admin'), getBills)
    .post(authorizeRoles('admin'), createBill);

router
    .get('/my', authorizeRoles('patient'), getMyBills);

router
    .route('/:id')
    .get(authorizeRoles('admin'), getBillById)
    .patch(authorizeRoles('admin'), updateBill)
    .delete(authorizeRoles('admin'), deleteBill);

export default router;
