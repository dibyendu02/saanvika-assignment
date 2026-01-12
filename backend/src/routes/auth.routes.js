/**
 * Auth Routes
 * Authentication endpoints
 */
import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  verifyEmployeeSchema,
  validate,
} from '../validators/auth.validator.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);

router.post(
  '/verify/:externalEmployeeId',
  protect,
  authorize('internal', 'admin', 'super_admin'),
  validate(verifyEmployeeSchema, 'params'),
  authController.verifyEmployee
);

export default router;
