// This file contains the department routes API routes.

import express from 'express';
import { getDepartments } from '../controllers/departmentController.js';

// Create the router used by this API module.
const router = express.Router();

// Connect this API URL to its request handler.
router.get('/', getDepartments);

export default router;
