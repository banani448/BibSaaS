import { Router } from 'express';
import barberController from '../controllers/barber.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/barbers
 * @desc    Create a new barber profile
 * @access  Private (Barber only)
 */
router.post('/', authenticate, authorize('BARBER'), barberController.createBarber.bind(barberController));

/**
 * @route   GET /api/barbers/me
 * @desc    Get current user's barber profile
 * @access  Private (Barber only)
 */
router.get('/me', authenticate, authorize('BARBER'), barberController.getMyBarberProfile.bind(barberController));

/**
 * @route   PUT /api/barbers/me
 * @desc    Update current user's barber profile
 * @access  Private (Barber only)
 */
router.put('/me', authenticate, authorize('BARBER'), barberController.updateMyBarberProfile.bind(barberController));

/**
 * @route   DELETE /api/barbers/me
 * @desc    Delete current user's barber profile
 * @access  Private (Barber only)
 */
router.delete('/me', authenticate, authorize('BARBER'), barberController.deleteMyBarberProfile.bind(barberController));

/**
 * @route   GET /api/barbers/me/stats
 * @desc    Get current barber's statistics
 * @access  Private (Barber only)
 */
router.get('/me/stats', authenticate, authorize('BARBER'), barberController.getMyBarberStats.bind(barberController));

/**
 * @route   PATCH /api/barbers/me/availability
 * @desc    Toggle current barber's availability
 * @access  Private (Barber only)
 */
router.patch('/me/availability', authenticate, authorize('BARBER'), barberController.toggleMyAvailability.bind(barberController));

/**
 * @route   GET /api/barbers
 * @desc    List barbers with filters
 * @access  Public
 */
router.get('/', barberController.listBarbers.bind(barberController));

/**
 * @route   GET /api/barbers/:id
 * @desc    Get barber by ID
 * @access  Public
 */
router.get('/:id', barberController.getBarberById.bind(barberController));

/**
 * @route   GET /api/barbers/:id/stats
 * @desc    Get barber statistics
 * @access  Public
 */
router.get('/:id/stats', barberController.getBarberStats.bind(barberController));

/**
 * @route   PUT /api/barbers/:id
 * @desc    Update barber profile
 * @access  Private (Admin/Salon Owner)
 */
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'SALON', 'SALON_CHAIN'), barberController.updateBarber.bind(barberController));

/**
 * @route   DELETE /api/barbers/:id
 * @desc    Delete barber profile
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), barberController.deleteBarber.bind(barberController));

/**
 * @route   PATCH /api/barbers/:id/availability
 * @desc    Toggle barber availability
 * @access  Private (Admin/Salon Owner)
 */
router.patch('/:id/availability', authenticate, authorize('SUPER_ADMIN', 'SALON', 'SALON_CHAIN'), barberController.toggleAvailability.bind(barberController));

export default router;
