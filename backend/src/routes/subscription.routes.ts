import { Router } from 'express';
import {
  getPlans,
  getPlanBySlug,
  getUserSubscription,
  getUserSubscriptions,
  createSubscription,
  activateSubscription,
  cancelSubscription,
  renewSubscription,
  updateAutoRenew,
  getUsageStats,
} from '../controllers/subscription.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all subscription plans
 * @access  Public
 */
router.get('/plans', getPlans);

/**
 * @route   GET /api/subscriptions/plans/:slug
 * @desc    Get a single subscription plan by slug
 * @access  Public
 */
router.get('/plans/:slug', getPlanBySlug);

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get user's active subscription
 * @access  Private
 */
router.get('/current', authenticate, getUserSubscription);

/**
 * @route   GET /api/subscriptions/history
 * @desc    Get all user subscriptions
 * @access  Private
 */
router.get('/history', authenticate, getUserSubscriptions);

/**
 * @route   POST /api/subscriptions
 * @desc    Create a new subscription
 * @access  Private
 */
router.post('/', authenticate, createSubscription);

/**
 * @route   POST /api/subscriptions/activate
 * @desc    Activate subscription after payment
 * @access  Private
 */
router.post('/activate', authenticate, activateSubscription);

/**
 * @route   POST /api/subscriptions/:subscriptionId/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/:subscriptionId/cancel', authenticate, cancelSubscription);

/**
 * @route   POST /api/subscriptions/:subscriptionId/renew
 * @desc    Renew subscription
 * @access  Private
 */
router.post('/:subscriptionId/renew', authenticate, renewSubscription);

/**
 * @route   PUT /api/subscriptions/:subscriptionId/auto-renew
 * @desc    Update auto-renew setting
 * @access  Private
 */
router.put('/:subscriptionId/auto-renew', authenticate, updateAutoRenew);

/**
 * @route   GET /api/subscriptions/usage
 * @desc    Get subscription usage statistics
 * @access  Private
 */
router.get('/usage', authenticate, getUsageStats);

export default router;
