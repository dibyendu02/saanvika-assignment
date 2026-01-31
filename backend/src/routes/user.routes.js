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
  suspendUser,
  unsuspendUser,
  deleteUser,
  updateEmployeeById,
} from '../controllers/user.controller.js';
import { updateFCMToken, removeFCMToken, getUserDevices } from '../controllers/fcm.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes (all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// FCM token routes (all authenticated users)
router.post('/fcm-token', updateFCMToken);
router.delete('/fcm-token', removeFCMToken);
router.get('/fcm-devices', getUserDevices);

// Bulk upload routes (admin and super_admin only)
router.post('/bulk-upload', requireAdminOrSuperAdmin, uploadSingleFile, handleUploadError, bulkUploadEmployees);
router.get('/template', requireAdminOrSuperAdmin, downloadTemplate);

// User listing routes (access controlled in service layer)
router.get('/', getAllUsers);
router.get('/office/:officeId', getEmployeesByOffice);
router.get('/:id', getUserById);

// User management routes (hierarchy-based access control)
router.patch('/:id/suspend', suspendUser);
router.patch('/:id/unsuspend', unsuspendUser);
router.patch('/:id', requireAdminOrSuperAdmin, updateEmployeeById);
router.delete('/:id', requireAdminOrSuperAdmin, deleteUser);

export default router;
