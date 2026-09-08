import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';
import { BookingStatus } from '@prisma/client';

interface CreateBookingParams {
  userId: string;
  barberId: string;
  salonId: string;
  scheduledDate: Date;
  duration: number;
  price?: number;
  notes?: string;
}

interface UpdateBookingParams {
  scheduledDate?: Date;
  duration?: number;
  notes?: string;
  status?: string;
  price?: number;
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingParams) {
    const { userId, barberId, salonId, scheduledDate, duration, price, notes } = data;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('User account is not active', 400, 'USER_INACTIVE');
    }

    // Verify barber exists and is available
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true, isAvailable: true, salonId: true },
    });

    if (!barber) {
      throw new AppError('Barber not found', 404, 'BARBER_NOT_FOUND');
    }

    if (!barber.isAvailable) {
      throw new AppError('Barber is not available', 400, 'BARBER_UNAVAILABLE');
    }

    // Verify salon exists and is active
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true, status: true },
    });

    if (!salon) {
      throw new AppError('Salon not found', 404, 'SALON_NOT_FOUND');
    }

    if (salon.status !== 'ACTIVE') {
      throw new AppError('Salon is not active', 400, 'SALON_INACTIVE');
    }

    // Check if barber belongs to salon
    if (barber.salonId && barber.salonId !== salonId) {
      throw new AppError('Barber does not belong to this salon', 400, 'BARBER_NOT_IN_SALON');
    }

    // Check for conflicting bookings
    const bookingStart = new Date(scheduledDate);
    const bookingEnd = new Date(bookingStart.getTime() + duration * 60 * 1000);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        barberId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: {
          gte: bookingStart,
          lte: bookingEnd,
        },
      },
    });

    if (conflictingBooking) {
      throw new AppError('Barber is already booked at this time', 400, 'BARBER_ALREADY_BOOKED');
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: userId,
        barberId,
        salonId,
        scheduledAt: bookingStart,
        duration,
        price: price ?? null,
        notes,
        status: 'PENDING',
      },
      include: {
        barber: {
          include: {
            user: {
              select: {
                profile: true,
              },
            },
          },
        },
        salon: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
        barber: {
          include: {
            user: {
              select: {
                profile: true,
              },
            },
          },
        },
        salon: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    return booking;
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId: string, data: UpdateBookingParams) {
    const { scheduledDate, duration, notes, status, price } = data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, barberId: true, scheduledAt: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Cannot update completed or cancelled bookings
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new AppError('Cannot update completed or cancelled bookings', 400, 'BOOKING_FINALIZED');
    }

    // If changing date/duration, check for conflicts
    if (scheduledDate || duration) {
      const newStart = scheduledDate ? new Date(scheduledDate) : booking.scheduledAt;
      const newDuration = duration || 60;
      const newEnd = new Date(newStart.getTime() + newDuration * 60 * 1000);

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          barberId: booking.barberId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: bookingId },
          scheduledAt: {
            gte: newStart,
            lte: newEnd,
          },
        },
      });

      if (conflictingBooking) {
        throw new AppError('Barber is already booked at this time', 400, 'BARBER_ALREADY_BOOKED');
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(scheduledDate && { scheduledAt: new Date(scheduledDate) }),
        ...(duration && { duration }),
        ...(notes !== undefined && { notes }),
        ...(status && { status: status as BookingStatus }),
        ...(price !== undefined && { price }),
      },
      include: {
        barber: {
          include: {
            user: {
              select: {
                profile: true,
              },
            },
          },
        },
        salon: {
          select: {
            name: true,
          },
        },
      },
    });

    return updatedBooking;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, clientId: true, status: true, scheduledAt: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Only the user who made the booking can cancel it (or admin)
    if (booking.clientId !== userId) {
      throw new AppError('You can only cancel your own bookings', 403, 'FORBIDDEN');
    }

    // Cannot cancel completed bookings
    if (booking.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed bookings', 400, 'BOOKING_FINALIZED');
    }

    // Check if booking is in the past
    if (new Date(booking.scheduledAt) < new Date()) {
      throw new AppError('Cannot cancel past bookings', 400, 'BOOKING_IN_PAST');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    return updatedBooking;
  }

  /**
   * Confirm booking (barber/salon)
   */
  async confirmBooking(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'PENDING') {
      throw new AppError('Only pending bookings can be confirmed', 400, 'INVALID_STATUS');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    return updatedBooking;
  }

  /**
   * Complete booking (barber/salon)
   */
  async completeBooking(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') {
      throw new AppError('Only confirmed or in-progress bookings can be completed', 400, 'INVALID_STATUS');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    return updatedBooking;
  }

  /**
   * Get user bookings
   */
  async getUserBookings(userId: string, params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;

    const where: any = { clientId: userId };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          salon: { select: { name: true, address: true } },
          barber: {
            include: {
              user: { select: { profile: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List all bookings (admin)
   */
  async listBookings(params: {
    page?: number;
    limit?: number;
    clientId?: string;
    barberId?: string;
    salonId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const { page = 1, limit = 20, clientId, barberId, salonId, status, fromDate, toDate } = params;

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (barberId) where.barberId = barberId;
    if (salonId) where.salonId = salonId;
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.scheduledAt = {};
      if (fromDate) where.scheduledAt.gte = fromDate;
      if (toDate) where.scheduledAt.lte = toDate;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: { select: { email: true, phone: true, profile: true } },
          barber: {
            include: {
              user: { select: { profile: true } },
            },
          },
          salon: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get barber's bookings
   */
  async getBarberBookings(barberId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const { page = 1, limit = 20, status, fromDate, toDate } = params;

    const where: any = { barberId };

    if (status) where.status = status;
    if (fromDate || toDate) {
      where.scheduledAt = {};
      if (fromDate) where.scheduledAt.gte = fromDate;
      if (toDate) where.scheduledAt.lte = toDate;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: { select: { email: true, phone: true, profile: true } },
          salon: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get salon's bookings
   */
  async getSalonBookings(salonId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const { page = 1, limit = 20, status, fromDate, toDate } = params;

    const where: any = { salonId };

    if (status) where.status = status;
    if (fromDate || toDate) {
      where.scheduledAt = {};
      if (fromDate) where.scheduledAt.gte = fromDate;
      if (toDate) where.scheduledAt.lte = toDate;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: { select: { email: true, phone: true, profile: true } },
          barber: {
            include: {
              user: { select: { profile: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new BookingService();
