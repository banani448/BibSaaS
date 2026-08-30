import { Router } from 'express';
import bookingController from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Client only)
 */
router.post('/', authenticate, authorize('CLIENT'), bookingController.createBooking.bind(bookingController));

/**
 * @route   GET /api/bookings/me
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get('/me', authenticate, bookingController.getMyBookings.bind(bookingController));

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, bookingController.getBookingById.bind(bookingController));

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking
 * @access  Private
 */
router.put('/:id', authenticate, bookingController.updateBooking.bind(bookingController));

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel booking
 * @access  Private
 */
router.delete('/:id', authenticate, bookingController.cancelBooking.bind(bookingController));

/**
 * @route   PATCH /api/bookings/:id/confirm
 * @desc    Confirm booking
 * @access  Private (Barber/Salon only)
 */
router.patch('/:id/confirm', authenticate, authorize('BARBER', 'SALON', 'SALON_CHAIN'), bookingController.confirmBooking.bind(bookingController));

/**
 * @route   PATCH /api/bookings/:id/complete
 * @desc    Complete booking
 * @access  Private (Barber/Salon only)
 */
router.patch('/:id/complete', authenticate, authorize('BARBER', 'SALON', 'SALON_CHAIN'), bookingController.completeBooking.bind(bookingController));

/**
 * @route   GET /api/bookings
 * @desc    List all bookings
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('SUPER_ADMIN'), bookingController.listBookings.bind(bookingController));

/**
 * @route   GET /api/bookings/barber/:barberId
 * @desc    Get barber's bookings
 * @access  Private (Barber/Salon Owner/Admin)
 */
router.get('/barber/:barberId', authenticate, authorize('BARBER', 'SALON', 'SALON_CHAIN', 'SUPER_ADMIN'), bookingController.getBarberBookings.bind(bookingController));

/**
 * @route   GET /api/bookings/salon/:salonId
 * @desc    Get salon's bookings
 * @access  Private (Salon Owner/Admin)
 */
router.get('/salon/:salonId', authenticate, authorize('SALON', 'SALON_CHAIN', 'SUPER_ADMIN'), bookingController.getSalonBookings.bind(bookingController));

export default router;
