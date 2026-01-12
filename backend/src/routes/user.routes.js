/**
 * User Routes
 * User management endpoints with role-based access control
 */
import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getProfile,
  getAllUsers,
  getUserById,
  getEmployeesByOffice,
  updateProfile,
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes (all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// User listing routes (access controlled in service layer)
router.get('/', getAllUsers);
router.get('/office/:officeId', getEmployeesByOffice);
router.get('/:id', getUserById);

export default router;
