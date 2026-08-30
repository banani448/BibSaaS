import { Router } from 'express';
import salonController from '../controllers/salon.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/salons
 * @desc    Create a new salon
 * @access  Private (Salon/Salon Chain only)
 */
router.post('/', authenticate, authorize('SALON', 'SALON_CHAIN'), salonController.createSalon.bind(salonController));

/**
 * @route   GET /api/salons/me
 * @desc    Get current user's salon
 * @access  Private (Salon/Salon Chain only)
 */
router.get('/me', authenticate, authorize('SALON', 'SALON_CHAIN'), salonController.getMySalon.bind(salonController));

/**
 * @route   PUT /api/salons/me
 * @desc    Update current user's salon
 * @access  Private (Salon/Salon Chain only)
 */
router.put('/me', authenticate, authorize('SALON', 'SALON_CHAIN'), salonController.updateMySalon.bind(salonController));

/**
 * @route   DELETE /api/salons/me
 * @desc    Delete current user's salon
 * @access  Private (Salon/Salon Chain only)
 */
router.delete('/me', authenticate, authorize('SALON', 'SALON_CHAIN'), salonController.deleteMySalon.bind(salonController));

/**
 * @route   GET /api/salons/me/stats
 * @desc    Get current salon's statistics
 * @access  Private (Salon/Salon Chain only)
 */
router.get('/me/stats', authenticate, authorize('SALON', 'SALON_CHAIN'), salonController.getMySalonStats.bind(salonController));

/**
 * @route   PATCH /api/salons/me/active
 * @desc    Toggle current salon's active status
 * @access  Private (Salon/Salon Chain only)
 */
router.patch('/me/active', authenticate, authorize('SALON', 'SALON_CHAIN'), salonController.toggleMyActiveStatus.bind(salonController));

/**
 * @route   GET /api/salons
 * @desc    List salons with filters
 * @access  Public
 */
router.get('/', salonController.listSalons.bind(salonController));

/**
 * @route   GET /api/salons/:id
 * @desc    Get salon by ID
 * @access  Public
 */
router.get('/:id', salonController.getSalonById.bind(salonController));

/**
 * @route   GET /api/salons/:id/stats
 * @desc    Get salon statistics
 * @access  Public
 */
router.get('/:id/stats', salonController.getSalonStats.bind(salonController));

/**
 * @route   PUT /api/salons/:id
 * @desc    Update salon
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), salonController.updateSalon.bind(salonController));

/**
 * @route   DELETE /api/salons/:id
 * @desc    Delete salon
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), salonController.deleteSalon.bind(salonController));

/**
 * @route   POST /api/salons/:id/barbers
 * @desc    Add barber to salon
 * @access  Private (Salon Owner/Admin)
 */
router.post('/:id/barbers', authenticate, authorize('SALON', 'SALON_CHAIN', 'SUPER_ADMIN'), salonController.addBarber.bind(salonController));

/**
 * @route   DELETE /api/salons/:id/barbers/:barberId
 * @desc    Remove barber from salon
 * @access  Private (Salon Owner/Admin)
 */
router.delete('/:id/barbers/:barberId', authenticate, authorize('SALON', 'SALON_CHAIN', 'SUPER_ADMIN'), salonController.removeBarber.bind(salonController));

/**
 * @route   PATCH /api/salons/:id/active
 * @desc    Toggle salon active status
 * @access  Private (Admin only)
 */
router.patch('/:id/active', authenticate, authorize('SUPER_ADMIN'), salonController.toggleActiveStatus.bind(salonController));

export default router;
