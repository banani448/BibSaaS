import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/admin/overview
 * @desc    Get system overview
 * @access  Private (Super Admin only)
 */
router.get('/overview', authenticate, authorize('SUPER_ADMIN'), adminController.getSystemOverview.bind(adminController));

/**
 * @route   GET /api/admin/users
 * @desc    List all users
 * @access  Private (Super Admin only)
 */
router.get('/users', authenticate, authorize('SUPER_ADMIN'), adminController.getUsers.bind(adminController));

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Update user status
 * @access  Private (Super Admin only)
 */
router.patch('/users/:id/status', authenticate, authorize('SUPER_ADMIN'), adminController.updateUserStatus.bind(adminController));

/**
 * @route   GET /api/admin/salons
 * @desc    List all salons
 * @access  Private (Super Admin only)
 */
router.get('/salons', authenticate, authorize('SUPER_ADMIN'), adminController.getSalons.bind(adminController));

/**
 * @route   PATCH /api/admin/salons/:id/active
 * @desc    Toggle salon active status
 * @access  Private (Super Admin only)
 */
router.patch('/salons/:id/active', authenticate, authorize('SUPER_ADMIN'), adminController.toggleSalonStatus.bind(adminController));

/**
 * @route   GET /api/admin/barbers
 * @desc    List all barbers
 * @access  Private (Super Admin only)
 */
router.get('/barbers', authenticate, authorize('SUPER_ADMIN'), adminController.getBarbers.bind(adminController));

/**
 * @route   GET /api/admin/statistics
 * @desc    Get platform statistics
 * @access  Private (Super Admin only)
 */
router.get('/statistics', authenticate, authorize('SUPER_ADMIN'), adminController.getStatistics.bind(adminController));

/**
 * @route   GET /api/admin/revenue
 * @desc    Get revenue statistics
 * @access  Private (Super Admin only)
 */
router.get('/revenue', authenticate, authorize('SUPER_ADMIN'), adminController.getRevenueStats.bind(adminController));

export default router;
