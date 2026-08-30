import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscription.service';
import { AppError } from '../middlewares/error.middleware';

/**
 * Get all subscription plans
 */
export const getPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currency = req.query.currency as string;
    const plans = await subscriptionService.getPlans(currency);

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single subscription plan by slug
 */
export const getPlanBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const currency = req.query.currency as string;
    const plan = await subscriptionService.getPlanBySlug(slug, currency);

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's active subscription
 */
export const getUserSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const subscription = await subscriptionService.getUserSubscription(userId);

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user subscriptions
 */
export const getUserSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const subscriptions = await subscriptionService.getUserSubscriptions(userId);

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new subscription
 */
export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { planId, currency } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!planId) {
      throw new AppError('Plan ID is required', 400, 'PLAN_ID_REQUIRED');
    }

    const result = await subscriptionService.createSubscription(userId, planId, currency);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate subscription (after payment)
 */
export const activateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionId, paymentId } = req.body;

    if (!subscriptionId || !paymentId) {
      throw new AppError('Subscription ID and Payment ID are required', 400, 'MISSING_IDS');
    }

    const subscription = await subscriptionService.activateSubscription(subscriptionId, paymentId);

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { subscriptionId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const subscription = await subscriptionService.cancelSubscription(userId, subscriptionId);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      throw new AppError('Subscription ID is required', 400, 'SUBSCRIPTION_ID_REQUIRED');
    }

    const subscription = await subscriptionService.renewSubscription(subscriptionId);

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update auto-renew setting
 */
export const updateAutoRenew = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { subscriptionId } = req.params;
    const { autoRenew } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (typeof autoRenew !== 'boolean') {
      throw new AppError('autoRenew must be a boolean', 400, 'INVALID_AUTO_RENEW');
    }

    const subscription = await subscriptionService.updateAutoRenew(userId, subscriptionId, autoRenew);

    res.json({
      success: true,
      message: 'Auto-renew setting updated',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription usage statistics
 */
export const getUsageStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const stats = await subscriptionService.getUsageStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
