import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';

class DashboardService {
  /**
   * Get client dashboard statistics
   */
  async getClientDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const [totalBookings, completedBookings, upcomingBookings, cancelledBookings, activeSubscription] = await Promise.all([
      prisma.booking.count({ where: { clientId: userId } }),
      prisma.booking.count({ where: { clientId: userId, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { clientId: userId, status: 'CONFIRMED', scheduledAt: { gte: new Date() } } }),
      prisma.booking.count({ where: { clientId: userId, status: 'CANCELLED' } }),
      prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE', endDate: { gte: new Date() } },
        include: { plan: true },
      }),
    ]);

    const recentBookings = await prisma.booking.findMany({
      where: { clientId: userId },
      include: {
        salon: { select: { name: true, address: true } },
        barber: {
          include: {
            user: { select: { profile: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 5,
    });

    return {
      stats: {
        totalBookings,
        completedBookings,
        upcomingBookings,
        cancelledBookings,
        hasActiveSubscription: !!activeSubscription,
        subscription: activeSubscription,
      },
      recentBookings,
    };
  }

  /**
   * Get barber dashboard statistics
   */
  async getBarberDashboard(userId: string) {
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new AppError('Barber profile not found', 404, 'BARBER_NOT_FOUND');
    }

    const [totalBookings, completedBookings, upcomingBookings, cancelledBookings, totalEarnings, averageRating] = await Promise.all([
      prisma.booking.count({ where: { barberId: barber.id } }),
      prisma.booking.count({ where: { barberId: barber.id, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { barberId: barber.id, status: 'CONFIRMED', scheduledAt: { gte: new Date() } } }),
      prisma.booking.count({ where: { barberId: barber.id, status: 'CANCELLED' } }),
      prisma.booking.aggregate({
        where: { barberId: barber.id, status: 'COMPLETED' },
        _sum: { price: true },
      }),
      prisma.review.aggregate({
        where: { barberId: barber.id },
        _avg: { rating: true },
      }),
    ]);

    const upcomingAppointments = await prisma.booking.findMany({
      where: {
        barberId: barber.id,
        status: 'CONFIRMED',
        scheduledAt: { gte: new Date() },
      },
      include: {
        client: {
          select: { email: true, phone: true, profile: true },
        },
        salon: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    return {
      stats: {
        totalBookings,
        completedBookings,
        upcomingBookings,
        cancelledBookings,
        totalEarnings: totalEarnings._sum.price || 0,
        averageRating: averageRating._avg.rating || 0,
      },
      upcomingAppointments,
    };
  }

  /**
   * Get salon dashboard statistics
   */
  async getSalonDashboard(userId: string) {
    const salon = await prisma.salon.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    const [totalBookings, completedBookings, upcomingBookings, cancelledBookings, totalBarbers, activeBarbers, totalRevenue, averageRating] = await Promise.all([
      prisma.booking.count({ where: { salonId: salon.id } }),
      prisma.booking.count({ where: { salonId: salon.id, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { salonId: salon.id, status: 'CONFIRMED', scheduledAt: { gte: new Date() } } }),
      prisma.booking.count({ where: { salonId: salon.id, status: 'CANCELLED' } }),
      prisma.barber.count({ where: { salonId: salon.id } }),
      prisma.barber.count({ where: { salonId: salon.id, isAvailable: true } }),
      prisma.booking.aggregate({
        where: { salonId: salon.id, status: 'COMPLETED' },
        _sum: { price: true },
      }),
      prisma.review.aggregate({
        where: { salonId: salon.id },
        _avg: { rating: true },
      }),
    ]);

    const upcomingAppointments = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
        status: 'CONFIRMED',
        scheduledAt: { gte: new Date() },
      },
      include: {
        client: {
          select: { email: true, phone: true, profile: true },
        },
        barber: {
          include: {
            user: { select: { profile: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    return {
      stats: {
        totalBookings,
        completedBookings,
        upcomingBookings,
        cancelledBookings,
        totalBarbers,
        activeBarbers,
        totalRevenue: totalRevenue._sum.price || 0,
        averageRating: averageRating._avg.rating || 0,
      },
      upcomingAppointments,
    };
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminDashboard() {
    const [
      totalUsers,
      activeUsers,
      totalBarbers,
      activeBarbers,
      totalSalons,
      activeSalons,
      totalBookings,
      completedBookings,
      upcomingBookings,
      totalRevenue,
      activeSubscriptions,
      totalRevenueThisMonth,
      totalBookingsThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.barber.count(),
      prisma.barber.count({ where: { isAvailable: true } }),
      prisma.salon.count(),
      prisma.salon.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED', scheduledAt: { gte: new Date() } } }),
      prisma.booking.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { price: true },
      }),
      prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: new Date() } } }),
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
        _sum: { price: true },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
    ]);

    // Get user distribution by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    // Get booking trends for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const bookingsLast7Days = await prisma.booking.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    });

    return {
      stats: {
        totalUsers,
        activeUsers,
        totalBarbers,
        activeBarbers,
        totalSalons,
        activeSalons,
        totalBookings,
        completedBookings,
        upcomingBookings,
        totalRevenue: totalRevenue._sum.price || 0,
        activeSubscriptions,
        totalRevenueThisMonth: totalRevenueThisMonth._sum.price || 0,
        totalBookingsThisMonth,
      },
      usersByRole,
      bookingsLast7Days,
    };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(params: { startDate?: Date; endDate?: Date; salonId?: string }) {
    const { startDate, endDate, salonId } = params;

    const where: any = { status: 'COMPLETED' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (salonId) {
      where.salonId = salonId;
    }

    const [totalRevenue, totalBookings, averageBookingValue] = await Promise.all([
      prisma.booking.aggregate({
        where,
        _sum: { price: true },
      }),
      prisma.booking.count({ where }),
      prisma.booking.aggregate({
        where,
        _avg: { price: true },
      }),
    ]);

    // Revenue by payment method
    const revenueByMethod = await prisma.booking.groupBy({
      by: ['status'],
      where,
      _sum: { price: true },
    });

    return {
      totalRevenue: totalRevenue._sum.price || 0,
      totalBookings,
      averageBookingValue: averageBookingValue._avg.price || 0,
      revenueByMethod,
    };
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(params: { startDate?: Date; endDate?: Date; salonId?: string; barberId?: string }) {
    const { startDate, endDate, salonId, barberId } = params;

    const where: any = {};

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = startDate;
      if (endDate) where.scheduledAt.lte = endDate;
    }

    if (salonId) where.salonId = salonId;
    if (barberId) where.barberId = barberId;

    const [totalBookings, pendingBookings, confirmedBookings, completedBookings, cancelledBookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
      prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
    };
  }
}

export default new DashboardService();
