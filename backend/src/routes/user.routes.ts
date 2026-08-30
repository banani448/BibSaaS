import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, userController.getProfile.bind(userController));

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', authenticate, userController.updateProfile.bind(userController));

/**
 * @route   POST /api/users/me/change-email
 * @desc    Change user email
 * @access  Private
 */
router.post('/me/change-email', authenticate, userController.changeEmail.bind(userController));

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/me', authenticate, userController.deleteAccount.bind(userController));

/**
 * @route   GET /api/users/me/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/me/stats', authenticate, userController.getStats.bind(userController));

/**
 * @route   GET /api/users
 * @desc    List all users
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('SUPER_ADMIN'), userController.listUsers.bind(userController));

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, authorize('SUPER_ADMIN'), userController.getUserById.bind(userController));

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status
 * @access  Private (Admin only)
 */
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN'), userController.updateUserStatus.bind(userController));

export default router;
