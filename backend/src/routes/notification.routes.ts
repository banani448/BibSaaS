import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/notifications/me
 * @desc    Get current user's notifications
 * @access  Private
 */
router.get('/me', authenticate, notificationController.getMyNotifications.bind(notificationController));

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount.bind(notificationController));

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', authenticate, notificationController.markAllAsRead.bind(notificationController));

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', authenticate, notificationController.getNotificationById.bind(notificationController));

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead.bind(notificationController));

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authenticate, notificationController.deleteNotification.bind(notificationController));

/**
 * @route   POST /api/notifications
 * @desc    Create notification
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize('SUPER_ADMIN'), notificationController.createNotification.bind(notificationController));

/**
 * @route   GET /api/notifications
 * @desc    List all notifications
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('SUPER_ADMIN'), notificationController.listNotifications.bind(notificationController));

export default router;
