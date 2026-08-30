import { Request, Response, NextFunction } from 'express';
import salonService from '../services/salon.service';

class SalonController {
  /**
   * POST /api/salons
   * Create a new salon
   */
  async createSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const { name, address, city, country, phone, email, description, logo, images, workingHours, amenities, latitude, longitude } = req.body;

      if (!name || !address || !city || !country || !phone) {
        return res.status(400).json({
          success: false,
          message: 'name, address, city, country, and phone are required',
          code: 'MISSING_FIELDS',
        });
      }

      const salon = await salonService.createSalon({
        userId,
        name,
        address,
        city,
        country,
        phone,
        email,
        description,
        logo,
        images,
        workingHours,
        amenities,
        latitude,
        longitude,
      });

      return res.status(201).json({
        success: true,
        message: 'Salon created successfully',
        data: salon,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/salons/me
   * Get current user's salon
   */
  async getMySalon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const salon = await salonService.getSalonByUserId(userId);

      return res.json({
        success: true,
        data: salon,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/salons/:id
   * Get salon by ID
   */
  async getSalonById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const salon = await salonService.getSalonById(id);

      return res.json({
        success: true,
        data: salon,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/salons/me
   * Update current user's salon
   */
  async updateMySalon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const salon = await salonService.getSalonByUserId(userId);

      const { name, address, city, country, phone, email, description, logo, images, workingHours, amenities, latitude, longitude, isActive } = req.body;

      const updatedSalon = await salonService.updateSalon(salon.id, {
        name,
        address,
        city,
        country,
        phone,
        email,
        description,
        logo,
        images,
        workingHours,
        amenities,
        latitude,
        longitude,
        isActive,
      });

      return res.json({
        success: true,
        message: 'Salon updated successfully',
        data: updatedSalon,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/salons/:id
   * Update salon (admin)
   */
  async updateSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { name, address, city, country, phone, email, description, logo, images, workingHours, amenities, latitude, longitude, isActive } = req.body;

      const updatedSalon = await salonService.updateSalon(id, {
        name,
        address,
        city,
        country,
        phone,
        email,
        description,
        logo,
        images,
        workingHours,
        amenities,
        latitude,
        longitude,
        isActive,
      });

      return res.json({
        success: true,
        message: 'Salon updated successfully',
        data: updatedSalon,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/salons/me
   * Delete current user's salon
   */
  async deleteMySalon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const salon = await salonService.getSalonByUserId(userId);

      const result = await salonService.deleteSalon(salon.id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/salons/:id
   * Delete salon (admin)
   */
  async deleteSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await salonService.deleteSalon(id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/salons
   * List salons with filters
   */
  async listSalons(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, city, country, isActive, search } = req.query;

      const result = await salonService.listSalons({
        page: Number(page),
        limit: Number(limit),
        city: city as string,
        country: country as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
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
   * GET /api/salons/:id/stats
   * Get salon statistics
   */
  async getSalonStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const stats = await salonService.getSalonStats(id);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/salons/me/stats
   * Get current salon's statistics
   */
  async getMySalonStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const salon = await salonService.getSalonByUserId(userId);

      const stats = await salonService.getSalonStats(salon.id);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/salons/:id/barbers
   * Add barber to salon
   */
  async addBarber(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { barberId } = req.body;

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message: 'barberId is required',
          code: 'BARBER_ID_REQUIRED',
        });
      }

      const updatedBarber = await salonService.addBarberToSalon(id, barberId);

      return res.json({
        success: true,
        message: 'Barber added to salon successfully',
        data: updatedBarber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/salons/:id/barbers/:barberId
   * Remove barber from salon
   */
  async removeBarber(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, barberId } = req.params;

      const updatedBarber = await salonService.removeBarberFromSalon(id, barberId);

      return res.json({
        success: true,
        message: 'Barber removed from salon successfully',
        data: updatedBarber,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/salons/me/active
   * Toggle current salon's active status
   */
  async toggleMyActiveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const salon = await salonService.getSalonByUserId(userId);

      const updatedSalon = await salonService.toggleActiveStatus(salon.id);

      return res.json({
        success: true,
        message: 'Salon status updated successfully',
        data: updatedSalon,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/salons/:id/active
   * Toggle salon active status (admin)
   */
  async toggleActiveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const updatedSalon = await salonService.toggleActiveStatus(id);

      return res.json({
        success: true,
        message: 'Salon status updated successfully',
        data: updatedSalon,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new SalonController();
