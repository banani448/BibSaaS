
import { Request, Response, NextFunction } from 'express';
import bookingService from '../services/booking.service';

class BookingController {
  /**
   * POST /api/bookings
   * Create a new booking
   */
  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const {
        barberId,
        salonId,
        scheduledDate,
        duration,
        notes,
      } = req.body;

      if (!barberId || !salonId || !scheduledDate || duration === undefined) {
        return res.status(400).json({
          success: false,
          message:
            'barberId, salonId, scheduledDate, and duration are required',
          code: 'MISSING_FIELDS',
        });
      }

      const parsedDate = new Date(scheduledDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid scheduledDate',
          code: 'INVALID_DATE',
        });
      }

      const booking = await bookingService.createBooking({
        userId,
        barberId,
        salonId,
        scheduledDate: parsedDate,
        duration,
        notes,
      });

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/me
   * Get current user's bookings
   */
  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const { page = 1, limit = 20, status } = req.query;

      const result = await bookingService.getUserBookings(userId, {
        page: Number(page),
        limit: Number(limit),
        status: typeof status === 'string' ? status : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id
   * Get booking by ID
   */
  async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const clientId =
        req.user?.role === 'CLIENT'
          ? req.user.id
          : undefined;

      const booking = await bookingService.getBookingById(id, clientId);

      return res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/bookings/:id
   * Update booking
   */
  async updateBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const {
        scheduledDate,
        duration,
        notes,
        status,
      } = req.body;

      let parsedDate: Date | undefined;

      if (scheduledDate !== undefined) {
        parsedDate = new Date(scheduledDate);

        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid scheduledDate',
            code: 'INVALID_DATE',
          });
        }
      }

      const clientId =
        req.user?.role === 'CLIENT'
          ? req.user.id
          : undefined;

      const updatedBooking = await bookingService.updateBooking(
        id,
        {
          scheduledDate: parsedDate,
          duration,
          notes,
          status,
        },
        clientId,
      );

      return res.json({
        success: true,
        message: 'Booking updated successfully',
        data: updatedBooking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/bookings/:id
   * Cancel booking
   */
  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const { id } = req.params;

      const updatedBooking = await bookingService.cancelBooking(
        id,
        userId,
      );

      return res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: updatedBooking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/bookings/:id/confirm
   * Confirm booking (barber/salon)
   */
  async confirmBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const updatedBooking = await bookingService.confirmBooking(id);

      return res.json({
        success: true,
        message: 'Booking confirmed successfully',
        data: updatedBooking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/bookings/:id/complete
   * Complete booking (barber/salon)
   */
  async completeBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const updatedBooking = await bookingService.completeBooking(id);

      return res.json({
        success: true,
        message: 'Booking completed successfully',
        data: updatedBooking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings
   * List all bookings (admin)
   */
  async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        userId,
        barberId,
        salonId,
        status,
        fromDate,
        toDate,
      } = req.query;

      const result = await bookingService.listBookings({
        page: Number(page),
        limit: Number(limit),
        clientId: typeof userId === 'string' ? userId : undefined,
        barberId: typeof barberId === 'string' ? barberId : undefined,
        salonId: typeof salonId === 'string' ? salonId : undefined,
        status: typeof status === 'string' ? status : undefined,
        fromDate:
          typeof fromDate === 'string'
            ? new Date(fromDate)
            : undefined,
        toDate:
          typeof toDate === 'string'
            ? new Date(toDate)
            : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/barber/:barberId
   * Get barber's bookings
   */
  async getBarberBookings(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { barberId } = req.params;

      const {
        page = 1,
        limit = 20,
        status,
        fromDate,
        toDate,
      } = req.query;

      const result = await bookingService.getBarberBookings(barberId, {
        page: Number(page),
        limit: Number(limit),
        status: typeof status === 'string' ? status : undefined,
        fromDate:
          typeof fromDate === 'string'
            ? new Date(fromDate)
            : undefined,
        toDate:
          typeof toDate === 'string'
            ? new Date(toDate)
            : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/salon/:salonId
   * Get salon's bookings
   */
  async getSalonBookings(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { salonId } = req.params;

      const {
        page = 1,
        limit = 20,
        status,
        fromDate,
        toDate,
      } = req.query;

      const result = await bookingService.getSalonBookings(salonId, {
        page: Number(page),
        limit: Number(limit),
        status: typeof status === 'string' ? status : undefined,
        fromDate:
          typeof fromDate === 'string'
            ? new Date(fromDate)
            : undefined,
        toDate:
          typeof toDate === 'string'
            ? new Date(toDate)
            : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingController();

