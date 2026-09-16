
import {
  Request,
  Response,
  NextFunction,
} from "express";

import subscriptionService from "../services/subscription.service";
import { AppError } from "../middlewares/error.middleware";

/**
 * ============================================================
 * BibSaaS — Subscription Controller
 * ============================================================
 *
 * Gestion :
 * - Subscription plans
 * - Active subscription
 * - Subscription history
 * - Creation
 * - Activation after payment
 * - Cancellation
 * - Renewal
 * - Auto-renew
 * - Usage statistics
 *
 * Authenticated user :
 * req.user?.id
 *
 * ============================================================
 */

/**
 * ============================================================
 * GET PLANS
 * ============================================================
 */

/**
 * Get all subscription plans
 */
export const getPlans = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currency =
      typeof req.query.currency === "string"
        ? req.query.currency
        : undefined;

    const plans =
      await subscriptionService.getPlans(
        currency,
      );

    return res.json({
      success: true,
      data: plans,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * GET PLAN BY SLUG
 * ============================================================
 */

/**
 * Get a single subscription plan by slug
 */
export const getPlanBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      throw new AppError(
        "Plan slug is required",
        400,
        "PLAN_SLUG_REQUIRED",
      );
    }

    const currency =
      typeof req.query.currency === "string"
        ? req.query.currency
        : undefined;

    const plan =
      await subscriptionService.getPlanBySlug(
        slug,
        currency,
      );

    return res.json({
      success: true,
      data: plan,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * GET USER SUBSCRIPTION
 * ============================================================
 */

/**
 * Get user's active subscription
 */
export const getUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    const subscription =
      await subscriptionService.getUserSubscription(
        userId,
      );

    return res.json({
      success: true,
      data: subscription,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * GET USER SUBSCRIPTIONS
 * ============================================================
 */

/**
 * Get all user subscriptions
 */
export const getUserSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    const subscriptions =
      await subscriptionService.getUserSubscriptions(
        userId,
      );

    return res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * CREATE SUBSCRIPTION
 * ============================================================
 */

/**
 * Create a new subscription
 */
export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    const {
      planId,
      currency,
    } = req.body;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    if (!planId) {
      throw new AppError(
        "Plan ID is required",
        400,
        "PLAN_ID_REQUIRED",
      );
    }

    const result =
      await subscriptionService.createSubscription(
        userId,
        planId,
        currency,
      );

    return res.status(201).json({
      success: true,
      message:
        "Subscription created successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * ACTIVATE SUBSCRIPTION
 * ============================================================
 */

/**
 * Activate subscription after payment
 */
export const activateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      subscriptionId,
      paymentId,
    } = req.body;

    if (!subscriptionId || !paymentId) {
      throw new AppError(
        "Subscription ID and Payment ID are required",
        400,
        "MISSING_IDS",
      );
    }

    const subscription =
      await subscriptionService.activateSubscription(
        subscriptionId,
        paymentId,
      );

    return res.json({
      success: true,
      message:
        "Subscription activated successfully",
      data: subscription,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * CANCEL SUBSCRIPTION
 * ============================================================
 */

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    const {
      subscriptionId,
    } = req.params;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    if (!subscriptionId) {
      throw new AppError(
        "Subscription ID is required",
        400,
        "SUBSCRIPTION_ID_REQUIRED",
      );
    }

    const subscription =
      await subscriptionService.cancelSubscription(
        userId,
        subscriptionId,
      );

    return res.json({
      success: true,
      message:
        "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * RENEW SUBSCRIPTION
 * ============================================================
 */

/**
 * Renew subscription
 */
export const renewSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      subscriptionId,
    } = req.params;

    if (!subscriptionId) {
      throw new AppError(
        "Subscription ID is required",
        400,
        "SUBSCRIPTION_ID_REQUIRED",
      );
    }

    const subscription =
      await subscriptionService.renewSubscription(
        subscriptionId,
      );

    return res.json({
      success: true,
      message:
        "Subscription renewed successfully",
      data: subscription,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * AUTO RENEW
 * ============================================================
 */

/**
 * Update auto-renew setting
 */
export const updateAutoRenew = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    const {
      subscriptionId,
    } = req.params;

    const {
      autoRenew,
    } = req.body;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    if (!subscriptionId) {
      throw new AppError(
        "Subscription ID is required",
        400,
        "SUBSCRIPTION_ID_REQUIRED",
      );
    }

    if (
      typeof autoRenew !==
      "boolean"
    ) {
      throw new AppError(
        "autoRenew must be a boolean",
        400,
        "INVALID_AUTO_RENEW",
      );
    }

    const subscription =
      await subscriptionService.updateAutoRenew(
        userId,
        subscriptionId,
        autoRenew,
      );

    return res.json({
      success: true,
      message:
        "Auto-renew setting updated",
      data: subscription,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * USAGE STATISTICS
 * ============================================================
 */

/**
 * Get subscription usage statistics
 */
export const getUsageStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    const stats =
      await subscriptionService.getUsageStats(
        userId,
      );

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    next(error);
  }
};

