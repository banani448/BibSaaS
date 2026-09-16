import prisma from '../config/prisma';
import config from '../config/env';
import { AppError } from '../middlewares/error.middleware';

interface SubscriptionPlanData {
  name: string;
  slug: string;
  type: string;
  description?: string;
  durationDays: number;
  maxBookings?: number;
  maxBarbers?: number;
  maxSalons?: number;
  aiRecommendations?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  price: number;
  currency: string;
  features?: {
    key: string;
    value?: string;
  }[];
}

export class SubscriptionService {
  /**
   * Get all subscription plans
   */
  async getPlans(currency?: string) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      include: {
        features: true,
      },
      orderBy: [
        { isPopular: 'desc' },
        { price: 'asc' },
      ],
    });

    return plans;
  }

  /**
   * Get a single subscription plan by slug
   */
  async getPlanBySlug(slug: string, _currency?: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { slug },
      include: {
        features: true,
      },
    });

    if (!plan) {
      throw new AppError('Subscription plan not found', 404, 'PLAN_NOT_FOUND');
    }

    return plan;
  }

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: {
          include: {
            features: true,
          },
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    return subscription;
  }

  /**
   * Get all user subscriptions (including inactive)
   */
  async getUserSubscriptions(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions;
  }

  /**
   * Create a new subscription
   */
  async createSubscription(userId: string, planId: string, _currency?: string) {
    // Get plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        features: true,
      },
    });

    if (!plan) {
      throw new AppError('Subscription plan not found', 404, 'PLAN_NOT_FOUND');
    }

    if (!plan.isActive) {
      throw new AppError('Subscription plan is not active', 400, 'PLAN_INACTIVE');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.getUserSubscription(userId);
    if (existingSubscription) {
      throw new AppError('User already has an active subscription', 400, 'ACTIVE_SUBSCRIPTION_EXISTS');
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'PENDING',
        startDate,
        endDate,
        autoRenew: false,
      },
      include: {
        plan: true,
      },
    });

    return {
      subscription,
      amount: plan.price,
      currency: plan.currency,
    };
  }

  /**
   * Activate subscription after successful payment
   */
  async activateSubscription(subscriptionId: string, paymentId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    // Update subscription
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        oldStatus: 'PENDING',
        newStatus: 'ACTIVE',
        reason: 'Payment successful',
      },
    });

    return updated;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, subscriptionId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new AppError('Subscription is not active', 400, 'SUBSCRIPTION_NOT_ACTIVE');
    }

    // Update subscription
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        oldStatus: 'ACTIVE',
        newStatus: 'CANCELLED',
        reason: 'User requested cancellation',
      },
    });

    return updated;
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new AppError('Cannot renew inactive subscription', 400, 'CANNOT_RENEW');
    }

    // Calculate new end date
    const currentEndDate = new Date(subscription.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + subscription.plan.durationDays);

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        endDate: newEndDate,
        lastRenewedAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        oldStatus: 'ACTIVE',
        newStatus: 'ACTIVE',
        reason: 'Subscription renewed',
      },
    });

    return updated;
  }

  /**
   * Update auto-renew setting
   */
  async updateAutoRenew(userId: string, subscriptionId: string, autoRenew: boolean) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { autoRenew },
    });

    return updated;
  }

  /**
   * Get subscription usage statistics
   */
  async getUsageStats(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        stats: null,
      };
    }

    const bookingsCount = await prisma.booking.count({
      where: { clientId: userId },
    });

    const maxBookings = subscription.plan.maxBookings;
    const remainingBookings = maxBookings ? Math.max(0, maxBookings - bookingsCount) : null;

    return {
      hasActiveSubscription: true,
      stats: {
        planName: subscription.plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
        bookingsUsed: bookingsCount,
        bookingsRemaining: remainingBookings,
        maxBookings,
      },
    };
  }
}

export default new SubscriptionService();
