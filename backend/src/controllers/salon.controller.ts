
import {
  Request,
  Response,
  NextFunction,
} from "express";

import salonService from "../services/salon.service";

/**
 * ============================================================
 * BibSaaS — Salon Controller
 * ============================================================
 *
 * Gestion :
 * - Création d'un salon
 * - Consultation du salon courant
 * - Consultation d'un salon
 * - Mise à jour
 * - Suppression
 * - Liste des salons
 * - Statistiques
 * - Gestion des barbiers
 * - Activation / désactivation
 *
 * Auth :
 * req.user?.id
 *
 * ============================================================
 */

class SalonController {
  /**
   * ==========================================================
   * POST /api/salons
   * Create a new salon
   * ==========================================================
   */
  async createSalon(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const {
        name,
        address,
        city,
        country,
        phone,
        email,
        description,
        latitude,
        longitude,
      } = req.body;

      if (
        !name ||
        !address ||
        !city ||
        !country ||
        !phone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "name, address, city, country, and phone are required",
          code: "MISSING_FIELDS",
        });
      }

      const salon =
        await salonService.createSalon({
          userId,
          name,
          address,
          cityId: city,
          countryId: country,
          phone,
          email,
          description,
          latitude,
          longitude,
        });

      return res.status(201).json({
        success: true,
        message:
          "Salon created successfully",
        data: salon,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/salons/me
   * Get current user's salon
   * ==========================================================
   */
  async getMySalon(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const salon =
        await salonService.getSalonByUserId(
          userId,
        );

      return res.json({
        success: true,
        data: salon,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/salons/:id
   * Get salon by ID
   * ==========================================================
   */
  async getSalonById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is required",
          code: "SALON_ID_REQUIRED",
        });
      }

      const salon =
        await salonService.getSalonById(id);

      return res.json({
        success: true,
        data: salon,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * PUT /api/salons/me
   * Update current user's salon
   * ==========================================================
   */
  async updateMySalon(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const salon =
        await salonService.getSalonByUserId(
          userId,
        );

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found",
          code: "SALON_NOT_FOUND",
        });
      }

      const {
        name,
        address,
        city,
        country,
        phone,
        email,
        description,
        latitude,
        longitude,
        isActive,
      } = req.body;

      const updatedSalon =
        await salonService.updateSalon(
          salon.id,
          {
            name,
            address,
            cityId: city,
            countryId: country,
            phone,
            email,
            description,
            latitude,
            longitude,
            status:
              isActive === undefined
                ? undefined
                : isActive
                  ? "ACTIVE"
                  : "SUSPENDED",
          },
        );

      return res.json({
        success: true,
        message:
          "Salon updated successfully",
        data: updatedSalon,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * PUT /api/salons/:id
   * Update salon (admin)
   * ==========================================================
   */
  async updateSalon(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is required",
          code: "SALON_ID_REQUIRED",
        });
      }

      const {
        name,
        address,
        city,
        country,
        phone,
        email,
        description,
        latitude,
        longitude,
        isActive,
      } = req.body;

      const updatedSalon =
        await salonService.updateSalon(
          id,
          {
            name,
            address,
            cityId: city,
            countryId: country,
            phone,
            email,
            description,
            latitude,
            longitude,
            status:
              isActive === undefined
                ? undefined
                : isActive
                  ? "ACTIVE"
                  : "SUSPENDED",
          },
        );

      return res.json({
        success: true,
        message:
          "Salon updated successfully",
        data: updatedSalon,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * DELETE /api/salons/me
   * Delete current user's salon
   * ==========================================================
   */
  async deleteMySalon(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const salon =
        await salonService.getSalonByUserId(
          userId,
        );

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found",
          code: "SALON_NOT_FOUND",
        });
      }

      const result =
        await salonService.deleteSalon(
          salon.id,
        );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * DELETE /api/salons/:id
   * Delete salon (admin)
   * ==========================================================
   */
  async deleteSalon(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is required",
          code: "SALON_ID_REQUIRED",
        });
      }

      const result =
        await salonService.deleteSalon(id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/salons
   * List salons with filters
   * ==========================================================
   */
  async listSalons(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        page = "1",
        limit = "20",
        city,
        country,
        isActive,
        search,
      } = req.query;

      const parsedPage =
        Number(page);

      const parsedLimit =
        Number(limit);

      if (
        !Number.isInteger(parsedPage) ||
        parsedPage < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "page must be a positive integer",
          code: "INVALID_PAGE",
        });
      }

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "limit must be between 1 and 100",
          code: "INVALID_LIMIT",
        });
      }

      const result =
        await salonService.listSalons({
          page: parsedPage,
          limit: parsedLimit,

          cityId:
            typeof city === "string"
              ? city
              : undefined,

          countryId:
            typeof country === "string"
              ? country
              : undefined,

          status:
            isActive === "true"
              ? "ACTIVE"
              : isActive === "false"
                ? "SUSPENDED"
                : undefined,

          search:
            typeof search === "string"
              ? search
              : undefined,
        });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/salons/:id/stats
   * Get salon statistics
   * ==========================================================
   */
  async getSalonStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is required",
          code: "SALON_ID_REQUIRED",
        });
      }

      const stats =
        await salonService.getSalonStats(id);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/salons/me/stats
   * Get current salon statistics
   * ==========================================================
   */
  async getMySalonStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const salon =
        await salonService.getSalonByUserId(
          userId,
        );

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found",
          code: "SALON_NOT_FOUND",
        });
      }

      const stats =
        await salonService.getSalonStats(
          salon.id,
        );

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * POST /api/salons/:id/barbers
   * Add barber to salon
   * ==========================================================
   */
  async addBarber(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { barberId } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is required",
          code: "SALON_ID_REQUIRED",
        });
      }

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message: "barberId is required",
          code: "BARBER_ID_REQUIRED",
        });
      }

      const updatedBarber =
        await salonService.addBarberToSalon(
          id,
          barberId,
        );

      return res.json({
        success: true,
        message:
          "Barber added to salon successfully",
        data: updatedBarber,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * DELETE /api/salons/:id/barbers/:barberId
   * Remove barber from salon
   * ==========================================================
   */
  async removeBarber(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        id,
        barberId,
      } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is required",
          code: "SALON_ID_REQUIRED",
        });
      }

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message:
            "Barber ID is required",
          code: "BARBER_ID_REQUIRED",
        });
      }

      const updatedBarber =
        await salonService.removeBarberFromSalon(
          id,
          barberId,
        );

      return res.json({
        success: true,
        message:
          "Barber removed from salon successfully",
        data: updatedBarber,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * PATCH /api/salons/me/active
   * Toggle current salon active status
   * ==========================================================
   */
  async toggleMyActiveStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const salon =
        await salonService.getSalonByUserId(
          userId,
        );

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found",
          code: "SALON_NOT_FOUND",
        });
      }

      const updatedSalon =
        await salonService.toggleActiveStatus(
          salon.id,
        );

      return res.json({
        success: true,
        message:
          "Salon status updated successfully",
        data: updatedSalon,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * PATCH /api/salons/:id/active
   * Toggle salon active status (admin)
   * ==========================================================
   */
  async toggleActiveStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Salon ID is required",
          code: "SALON_ID_REQUIRED",
        });
      }

      const updatedSalon =
        await salonService.toggleActiveStatus(
          id,
        );

      return res.json({
        success: true,
        message:
          "Salon status updated successfully",
        data: updatedSalon,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new SalonController();

