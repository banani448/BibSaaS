import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';
import { NotificationChannel, NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, channel, data } = params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as NotificationType,
        channel: channel ?? NotificationChannel.IN_APP,
        title,
        message,
        data: data || {},
        isRead: false,
      },
    });

    return notification;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return updatedNotification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Get user's notifications with filters
   */
  async getUserNotifications(userId: string, params: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }) {
    const { page = 1, limit = 20, isRead, type } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: { select: { name: true } },
        barber: {
          include: {
            user: { select: { profile: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    const barberName = booking.barber?.user?.profile
      ? `${booking.barber.user.profile.firstName || ''} ${booking.barber.user.profile.lastName || ''}`.trim()
      : 'Your barber';

    const notification = await this.createNotification({
      userId,
      type: 'BOOKING',
      title: 'Booking Confirmed',
      message: `Your appointment at ${booking.salon?.name || 'the salon'} with ${barberName} has been confirmed.`,
      data: { bookingId },
    });

    return notification;
  }

  /**
   * Send booking reminder notification
   */
  async sendBookingReminder(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: { select: { name: true, address: true } },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    const notification = await this.createNotification({
      userId,
      type: 'REMINDER',
      title: 'Upcoming Appointment',
      message: `Reminder: You have an appointment at ${booking.salon?.name || 'the salon'} (${booking.salon?.address || ''}) tomorrow.`,
      data: { bookingId },
    });

    return notification;
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true, currency: true, status: true },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    const notification = await this.createNotification({
      userId,
      type: 'PAYMENT',
      title: 'Payment Successful',
      message: `Your payment of ${payment.amount} ${payment.currency} has been processed successfully.`,
      data: { paymentId },
    });

    return notification;
  }

  /**
   * Send subscription expiry notification
   */
  async sendSubscriptionExpiryReminder(subscriptionId: string, userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: { select: { name: true } },
      },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    const notification = await this.createNotification({
      userId,
      type: 'SUBSCRIPTION',
      title: 'Subscription Expiring Soon',
      message: `Your ${subscription.plan.name} subscription will expire on ${subscription.endDate.toDateString()}.`,
      data: { subscriptionId },
    });

    return notification;
  }

  /**
   * List all notifications (admin)
   */
  async listNotifications(params: {
    page?: number;
    limit?: number;
    userId?: string;
    type?: string;
    isRead?: boolean;
  }) {
    const { page = 1, limit = 20, userId, type, isRead } = params;

    const where: any = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new NotificationService();
