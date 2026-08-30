import bcrypt from 'bcrypt';
import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';
import { AccountStatus, UserRole } from '@prisma/client';

interface UpdateProfileParams {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

interface ChangeEmailParams {
  newEmail: string;
  password: string;
}

const userPublicSelect = {
  id: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: true,
  updatedAt: true,
  profile: true,
  preferences: true,
} as const;

class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userPublicSelect,
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Get user profile (with subscription info)
   */
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userPublicSelect,
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      ...user,
      activeSubscription: user.subscriptions[0] || null,
      subscriptions: undefined,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileParams) {
    const { firstName, lastName, phone, avatar, preferences } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(phone !== undefined && { phone }),
        ...(preferences && {
          preferences: {
            upsert: {
              create: {
                ...(preferences.language && { language: String(preferences.language) }),
                ...(preferences.currency && { currency: String(preferences.currency) }),
              },
              update: {
                ...(preferences.language && { language: String(preferences.language) }),
                ...(preferences.currency && { currency: String(preferences.currency) }),
              },
            },
          },
        }),
        profile: {
          update: {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(avatar !== undefined && { avatarUrl: avatar }),
          },
        },
      },
      select: userPublicSelect,
    });

    return updatedUser;
  }

  /**
   * Change user email
   */
  async changeEmail(userId: string, { newEmail, password }: ChangeEmailParams) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401, 'INVALID_PASSWORD');
    }

    // Check if new email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 400, 'EMAIL_ALREADY_EXISTS');
    }

    // Update email
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: false },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        profile: true,
      },
    });

    // TODO: Send email verification

    return updatedUser;
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prevent deletion of admin accounts
    if (user.role === 'SUPER_ADMIN') {
      throw new AppError('Cannot delete super admin account', 403, 'FORBIDDEN');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401, 'INVALID_PASSWORD');
    }

    // Soft delete - mark as deleted
    await prisma.user.update({
      where: { id: userId },
      data: { status: AccountStatus.DELETED },
    });

    return { message: 'Account deleted successfully' };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const stats: any = {
      totalBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalPayments: 0,
      successfulPayments: 0,
      activeSubscription: false,
    };

    if (user.role === UserRole.CLIENT) {
      const bookings = await prisma.booking.groupBy({
        by: ['status'],
        where: { clientId: userId },
        _count: true,
      });

      bookings.forEach((b) => {
        stats.totalBookings += b._count;
        if (b.status === 'COMPLETED') stats.completedBookings += b._count;
        if (b.status === 'CANCELLED') stats.cancelledBookings += b._count;
      });

      const payments = await prisma.payment.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      });

      payments.forEach((p) => {
        stats.totalPayments += p._count;
        if (p.status === 'SUCCESS') stats.successfulPayments += p._count;
      });

      const activeSub = await prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
      });

      stats.activeSubscription = !!activeSub;
    }

    if (user.role === UserRole.BARBER) {
      const barber = await prisma.barber.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (barber) {
        const bookings = await prisma.booking.groupBy({
          by: ['status'],
          where: { barberId: barber.id },
          _count: true,
        });

        bookings.forEach((b) => {
          stats.totalBookings += b._count;
          if (b.status === 'COMPLETED') stats.completedBookings += b._count;
          if (b.status === 'CANCELLED') stats.cancelledBookings += b._count;
        });
      }
    }

    if (user.role === UserRole.SALON || user.role === UserRole.SALON_CHAIN) {
      const salon = await prisma.salon.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      });

      if (salon) {
        const bookings = await prisma.booking.groupBy({
          by: ['status'],
          where: { salonId: salon.id },
          _count: true,
        });

        bookings.forEach((b) => {
          stats.totalBookings += b._count;
          if (b.status === 'COMPLETED') stats.completedBookings += b._count;
          if (b.status === 'CANCELLED') stats.cancelledBookings += b._count;
        });
      }
    }

    return stats;
  }

  /**
   * List all users (admin only)
   */
  async listUsers(params: { page?: number; limit?: number; role?: string; status?: string; search?: string }) {
    const { page = 1, limit = 20, role, status, search } = params;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userPublicSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, status: string) {
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED', 'PENDING'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new AppError('Cannot modify super admin status', 403, 'FORBIDDEN');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: status as AccountStatus },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: true,
      },
    });

    return updatedUser;
  }
}

export default new UserService();
