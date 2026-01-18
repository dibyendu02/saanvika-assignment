/**
 * User Routes
 * User management endpoints with role-based access control
 */
import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdminOrSuperAdmin } from '../middlewares/officeAccess.middleware.js';
import { uploadSingleFile, handleUploadError } from '../middlewares/upload.middleware.js';
import {
  getProfile,
  getAllUsers,
  getUserById,
  getEmployeesByOffice,
  updateProfile,
  bulkUploadEmployees,
  downloadTemplate,
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes (all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Bulk upload routes (admin and super_admin only)
router.post('/bulk-upload', requireAdminOrSuperAdmin, uploadSingleFile, handleUploadError, bulkUploadEmployees);
router.get('/template', requireAdminOrSuperAdmin, downloadTemplate);

// User listing routes (access controlled in service layer)
router.get('/', getAllUsers);
router.get('/office/:officeId', getEmployeesByOffice);
router.get('/:id', getUserById);

export default router;
