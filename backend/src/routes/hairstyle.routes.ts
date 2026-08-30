import { Router } from 'express';
import hairstyleController from '../controllers/hairstyle.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/hairstyles
 * @desc    Create a new hairstyle
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize('SUPER_ADMIN'), hairstyleController.createHairstyle.bind(hairstyleController));

/**
 * @route   GET /api/hairstyles
 * @desc    List hairstyles with filters
 * @access  Public
 */
router.get('/', hairstyleController.listHairstyles.bind(hairstyleController));

/**
 * @route   GET /api/hairstyles/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', hairstyleController.getCategories.bind(hairstyleController));

/**
 * @route   GET /api/hairstyles/category/:category
 * @desc    Get hairstyles by category
 * @access  Public
 */
router.get('/category/:category', hairstyleController.getHairstylesByCategory.bind(hairstyleController));

/**
 * @route   GET /api/hairstyles/face-shape/:faceShape
 * @desc    Get hairstyles suitable for face shape
 * @access  Public
 */
router.get('/face-shape/:faceShape', hairstyleController.getHairstylesByFaceShape.bind(hairstyleController));

/**
 * @route   GET /api/hairstyles/:id
 * @desc    Get hairstyle by ID
 * @access  Public
 */
router.get('/:id', hairstyleController.getHairstyleById.bind(hairstyleController));

/**
 * @route   PUT /api/hairstyles/:id
 * @desc    Update hairstyle
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), hairstyleController.updateHairstyle.bind(hairstyleController));

/**
 * @route   DELETE /api/hairstyles/:id
 * @desc    Delete hairstyle
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), hairstyleController.deleteHairstyle.bind(hairstyleController));

export default router;
