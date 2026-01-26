/**
 * Notification Routes
 */
import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
export default router;
