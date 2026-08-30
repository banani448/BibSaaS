import { Request, Response, NextFunction } from 'express';
import barberService from '../services/barber.service';

class BarberController {
  /**
   * POST /api/barbers
   * Create a new barber profile
   */
  async createBarber(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const { salonId, firstName, lastName, phone, specializations, bio, experience, workingHours, avatar } = req.body;

      if (!firstName || !lastName || !phone) {
        return res.status(400).json({
          success: false,
          message: 'firstName, lastName, and phone are required',
          code: 'MISSING_FIELDS',
        });
      }

      const barber = await barberService.createBarber({
        userId,
        salonId,
        firstName,
        lastName,
        phone,
        specializations,
        bio,
        experience,
        workingHours,
        avatar,
      });

      return res.status(201).json({
        success: true,
        message: 'Barber profile created successfully',
        data: barber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/barbers/me
   * Get current user's barber profile
   */
  async getMyBarberProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const barber = await barberService.getBarberByUserId(userId);

      return res.json({
        success: true,
        data: barber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/barbers/:id
   * Get barber by ID
   */
  async getBarberById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const barber = await barberService.getBarberById(id);

      return res.json({
        success: true,
        data: barber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/barbers/me
   * Update current user's barber profile
   */
  async updateMyBarberProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const barber = await barberService.getBarberByUserId(userId);

      const { salonId, firstName, lastName, phone, specializations, bio, experience, workingHours, avatar, isAvailable } = req.body;

      const updatedBarber = await barberService.updateBarber(barber.id, {
        salonId,
        firstName,
        lastName,
        phone,
        specializations,
        bio,
        experience,
        workingHours,
        avatar,
        isAvailable,
      });

      return res.json({
        success: true,
        message: 'Barber profile updated successfully',
        data: updatedBarber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/barbers/:id
   * Update barber profile (admin/salon owner)
   */
  async updateBarber(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { salonId, firstName, lastName, phone, specializations, bio, experience, workingHours, avatar, isAvailable } = req.body;

      const updatedBarber = await barberService.updateBarber(id, {
        salonId,
        firstName,
        lastName,
        phone,
        specializations,
        bio,
        experience,
        workingHours,
        avatar,
        isAvailable,
      });

      return res.json({
        success: true,
        message: 'Barber profile updated successfully',
        data: updatedBarber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/barbers/me
   * Delete current user's barber profile
   */
  async deleteMyBarberProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const barber = await barberService.getBarberByUserId(userId);

      const result = await barberService.deleteBarber(barber.id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/barbers/:id
   * Delete barber profile (admin)
   */
  async deleteBarber(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await barberService.deleteBarber(id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/barbers
   * List barbers with filters
   */
  async listBarbers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, salonId, isAvailable, search } = req.query;

      const result = await barberService.listBarbers({
        page: Number(page),
        limit: Number(limit),
        salonId: salonId as string,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
        search: search as string,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/barbers/:id/stats
   * Get barber statistics
   */
  async getBarberStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const stats = await barberService.getBarberStats(id);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/barbers/me/stats
   * Get current barber's statistics
   */
  async getMyBarberStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const barber = await barberService.getBarberByUserId(userId);

      const stats = await barberService.getBarberStats(barber.id);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/barbers/me/availability
   * Toggle current barber's availability
   */
  async toggleMyAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const barber = await barberService.getBarberByUserId(userId);

      const updatedBarber = await barberService.toggleAvailability(barber.id);

      return res.json({
        success: true,
        message: 'Availability updated successfully',
        data: updatedBarber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/barbers/:id/availability
   * Toggle barber availability (admin/salon owner)
   */
  async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const updatedBarber = await barberService.toggleAvailability(id);

      return res.json({
        success: true,
        message: 'Availability updated successfully',
        data: updatedBarber,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new BarberController();
