import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';

interface CreateBarberParams {
  userId: string;
  salonId?: string;
  professionalName?: string;
  biography?: string;
  yearsExperience?: number;
}

interface UpdateBarberParams {
  salonId?: string;
  professionalName?: string;
  biography?: string;
  yearsExperience?: number;
  isAvailable?: boolean;
}

class BarberService {
  /**
   * Create a new barber profile
   */
  async createBarber(data: CreateBarberParams) {
    const { userId, salonId, professionalName, biography, yearsExperience } = data;

    // Check if user exists and has BARBER role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.role !== 'BARBER') {
      throw new AppError('User must have BARBER role', 400, 'INVALID_ROLE');
    }

    // Check if barber profile already exists
    const existingBarber = await prisma.barber.findUnique({
      where: { userId },
    });

    if (existingBarber) {
      throw new AppError('Barber profile already exists', 400, 'BARBER_EXISTS');
    }

    // If salonId is provided, verify salon exists
    if (salonId) {
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
      });

      if (!salon) {
        throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
      }
    }

    const barber = await prisma.barber.create({
      data: {
        userId,
        salonId,
        professionalName,
        biography,
        yearsExperience: yearsExperience || 0,
        isAvailable: true,
      },
    });

    return barber;
  }

  /**
   * Get barber by ID
   */
  async getBarberById(barberId: string) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!barber) {
      throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
    }

    return barber;
  }

  /**
   * Get barber profile by user ID
   */
  async getBarberByUserId(userId: string) {
    const barber = await prisma.barber.findUnique({
      where: { userId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!barber) {
      throw new AppError('Barber profile not found', 404, 'BARBER_NOT_FOUND');
    }

    return barber;
  }

  /**
   * Update barber profile
   */
  async updateBarber(barberId: string, data: UpdateBarberParams) {
    const { salonId, professionalName, biography, yearsExperience, isAvailable } = data;

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
    }

    // If salonId is being changed, verify new salon exists
    if (salonId && salonId !== barber.salonId) {
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
      });

      if (!salon) {
        throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
      }
    }

    const updatedBarber = await prisma.barber.update({
      where: { id: barberId },
      data: {
        ...(salonId !== undefined && { salonId }),
        ...(professionalName !== undefined && { professionalName }),
        ...(biography !== undefined && { biography }),
        ...(yearsExperience !== undefined && { yearsExperience }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    return updatedBarber;
  }

  /**
   * Delete barber profile
   */
  async deleteBarber(barberId: string) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true },
    });

    if (!barber) {
      throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
    }

    await prisma.barber.delete({
      where: { id: barberId },
    });

    return { message: 'Barber profile deleted successfully' };
  }

  /**
   * List barbers with filters
   */
  async listBarbers(params: {
    page?: number;
    limit?: number;
    salonId?: string;
    isAvailable?: boolean;
    search?: string;
  }) {
    const { page = 1, limit = 20, salonId, isAvailable, search } = params;

    const where: any = {};

    if (salonId) {
      where.salonId = salonId;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (search) {
      where.OR = [
        { professionalName: { contains: search, mode: 'insensitive' } },
        { biography: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [barbers, total] = await Promise.all([
      prisma.barber.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          salon: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.barber.count({ where }),
    ]);

    return {
      barbers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get barber statistics
   */
  async getBarberStats(barberId: string) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true },
    });

    if (!barber) {
      throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
    }

    const [totalBookings, completedBookings, cancelledBookings, upcomingBookings] = await Promise.all([
      prisma.booking.count({ where: { barberId } }),
      prisma.booking.count({ where: { barberId, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { barberId, status: 'CANCELLED' } }),
      prisma.booking.count({ where: { barberId, status: 'CONFIRMED' } }),
    ]);

    const reviews = await prisma.review.findMany({
      where: { barberId },
      select: { rating: true },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      upcomingBookings,
      averageRating,
      totalReviews: reviews.length,
    };
  }
}

export default new BarberService();
