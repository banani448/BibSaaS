import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private
 */
router.post('/', authenticate, paymentController.createPayment.bind(paymentController));

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/:id', authenticate, paymentController.getPayment.bind(paymentController));

/**
 * @route   GET /api/payments/:id/verify
 * @desc    Verify payment status
 * @access  Private
 */
router.get('/:id/verify', authenticate, paymentController.verifyPayment.bind(paymentController));

/**
 * @route   POST /api/payments/simulated
 * @desc    Simulate payment (development only)
 * @access  Private
 */
router.post('/simulated', authenticate, paymentController.simulatePayment.bind(paymentController));

/**
 * @route   POST /api/payments/webhooks/mtn
 * @desc    MTN Mobile Money webhook
 * @access  Public
 */
router.post('/webhooks/mtn', paymentController.mtnWebhook.bind(paymentController));

/**
 * @route   POST /api/payments/webhooks/airtel
 * @desc    Airtel Money webhook
 * @access  Public
 */
router.post('/webhooks/airtel', paymentController.airtelWebhook.bind(paymentController));

/**
 * @route   POST /api/payments/webhooks/stripe
 * @desc    Stripe webhook
 * @access  Public
 */
router.post('/webhooks/stripe', paymentController.stripeWebhook.bind(paymentController));

export default router;

