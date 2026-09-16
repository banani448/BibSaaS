import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';

interface CreateSalonParams {
  userId: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  countryId?: string;
  cityId?: string;
  districtId?: string;
  latitude?: number;
  longitude?: number;
}

interface UpdateSalonParams {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  countryId?: string;
  cityId?: string;
  districtId?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

class SalonService {
  /**
   * Create a new salon
   */
  async createSalon(data: CreateSalonParams) {
    const { userId, name, description, phone, email, address, countryId, cityId, districtId, latitude, longitude } = data;

    // Check if user exists and has appropriate role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.role !== 'SALON' && user.role !== 'SALON_CHAIN') {
      throw new AppError('User must have SALON or SALON_CHAIN role', 400, 'INVALID_ROLE');
    }

    // Check if salon already exists for this user
    const existingSalon = await prisma.salon.findFirst({
      where: { ownerId: userId },
    });

    if (existingSalon) {
      throw new AppError('Salon already exists for this user', 400, 'SALON_EXISTS');
    }

    const salon = await prisma.salon.create({
      data: {
        ownerId: userId,
        name,
        slug: this.slugify(name),
        description,
        phone,
        email,
        address,
        countryId,
        cityId,
        districtId,
        latitude,
        longitude,
        status: 'PENDING',
      },
    });

    return salon;
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }

  /**
   * Get salon by ID
   */
  async getSalonById(salonId: string) {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        barbers: {
          where: { isAvailable: true },
          include: {
            user: {
              select: {
                id: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    return salon;
  }

  /**
   * Get salon by user ID (owner)
   */
  async getSalonByUserId(userId: string) {
    const salon = await prisma.salon.findFirst({
      where: { ownerId: userId },
      include: {
        barbers: true,
      },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    return salon;
  }

  /**
   * Update salon
   */
  async updateSalon(salonId: string, data: UpdateSalonParams) {
    const { name, description, phone, email, address, countryId, cityId, districtId, latitude, longitude, status } = data;

    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    const updatedSalon = await prisma.salon.update({
      where: { id: salonId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(countryId !== undefined && { countryId }),
        ...(cityId !== undefined && { cityId }),
        ...(districtId !== undefined && { districtId }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(status !== undefined && { status: status as any }),
      },
    });

    return updatedSalon;
  }

  /**
   * Delete salon
   */
  async deleteSalon(salonId: string) {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    await prisma.salon.delete({
      where: { id: salonId },
    });

    return { message: 'Salon deleted successfully' };
  }

  /**
   * List salons with filters
   */
  async listSalons(params: {
    page?: number;
    limit?: number;
    cityId?: string;
    countryId?: string;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, cityId, countryId, status, search } = params;

    const where: any = {};

    if (cityId) {
      where.cityId = cityId;
    }

    if (countryId) {
      where.countryId = countryId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [salons, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: {
              barbers: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salon.count({ where }),
    ]);

    return {
      salons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get salon statistics
   */
  async getSalonStats(salonId: string) {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    const [totalBookings, completedBookings, cancelledBookings, upcomingBookings, totalBarbers, activeBarbers] = await Promise.all([
      prisma.booking.count({ where: { salonId } }),
      prisma.booking.count({ where: { salonId, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { salonId, status: 'CANCELLED' } }),
      prisma.booking.count({ where: { salonId, status: 'CONFIRMED' } }),
      prisma.barber.count({ where: { salonId } }),
      prisma.barber.count({ where: { salonId, isAvailable: true } }),
    ]);

    const reviews = await prisma.review.findMany({
      where: { salonId },
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
      totalBarbers,
      activeBarbers,
      averageRating,
      totalReviews: reviews.length,
    };
  }

  /**
   * Toggle salon active status
   */
  async toggleActiveStatus(salonId: string) {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true, status: true },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    const newStatus = salon.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    const updatedSalon = await prisma.salon.update({
      where: { id: salonId },
      data: { status: newStatus },
    });

    return updatedSalon;
  }

  async addBarberToSalon(salonId: string, barberId: string) {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true },
    });
    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true },
    });
    if (!barber) {
      throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
    }

    return prisma.barber.update({
      where: { id: barberId },
      data: { salonId },
    });
  }

  async removeBarberFromSalon(salonId: string, barberId: string) {
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, salonId },
      select: { id: true },
    });
    if (!barber) {
      throw new AppError('Barber not found in salon', 404, 'BARBER_NOT_FOUND');
    }

    return prisma.barber.update({
      where: { id: barberId },
      data: { salonId: null },
    });
  }
}

export default new SalonService();
