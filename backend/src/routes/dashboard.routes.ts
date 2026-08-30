import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/dashboard/client
 * @desc    Get client dashboard
 * @access  Private (Client only)
 */
router.get('/client', authenticate, authorize('CLIENT'), dashboardController.getClientDashboard.bind(dashboardController));

/**
 * @route   GET /api/dashboard/barber
 * @desc    Get barber dashboard
 * @access  Private (Barber only)
 */
router.get('/barber', authenticate, authorize('BARBER'), dashboardController.getBarberDashboard.bind(dashboardController));

/**
 * @route   GET /api/dashboard/salon
 * @desc    Get salon dashboard
 * @access  Private (Salon/Salon Chain only)
 */
router.get('/salon', authenticate, authorize('SALON', 'SALON_CHAIN'), dashboardController.getSalonDashboard.bind(dashboardController));

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard
 * @access  Private (Super Admin only)
 */
router.get('/admin', authenticate, authorize('SUPER_ADMIN'), dashboardController.getAdminDashboard.bind(dashboardController));

/**
 * @route   GET /api/dashboard/revenue
 * @desc    Get revenue statistics
 * @access  Private (Admin/Salon Owner)
 */
router.get('/revenue', authenticate, authorize('SUPER_ADMIN', 'SALON', 'SALON_CHAIN'), dashboardController.getRevenueStats.bind(dashboardController));

/**
 * @route   GET /api/dashboard/bookings
 * @desc    Get booking statistics
 * @access  Private (Admin/Salon Owner/Barber)
 */
router.get('/bookings', authenticate, authorize('SUPER_ADMIN', 'SALON', 'SALON_CHAIN', 'BARBER'), dashboardController.getBookingStats.bind(dashboardController));

export default router;
