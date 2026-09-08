import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import userService from '../services/user.service';
import salonService from '../services/salon.service';
import barberService from '../services/barber.service';
import dashboardService from '../services/dashboard.service';

class AdminController {
  /**
   * GET /api/admin/overview
   * Get system overview
   */
  async getSystemOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await dashboardService.getAdminDashboard();

      return res.json({
        success: true,
        data: overview,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users
   * List all users
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, role, status, search } = req.query;

      const result = await userService.listUsers({
        page: Number(page),
        limit: Number(limit),
        role: role as string,
        status: status as string,
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
   * PATCH /api/admin/users/:id/status
   * Update user status
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
          code: 'STATUS_REQUIRED',
        });
      }

      const updatedUser = await userService.updateUserStatus(id, status);

      return res.json({
        success: true,
        message: 'User status updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/admin/salons
   * List all salons
   */
  async getSalons(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, cityId, countryId, status, search } = req.query;

      const result = await salonService.listSalons({
        page: Number(page),
        limit: Number(limit),
        cityId: cityId as string,
        countryId: countryId as string,
        status: status as string,
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
   * PATCH /api/admin/salons/:id/active
   * Toggle salon active status
   */
  async toggleSalonStatus(req: Request, res: Response, next: NextFunction) {
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

  /**
   * GET /api/admin/barbers
   * List all barbers
   */
  async getBarbers(req: Request, res: Response, next: NextFunction) {
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
   * GET /api/admin/statistics
   * Get platform statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const [totalUsers, activeUsers, totalBarbers, totalSalons, activeSalons, totalBookings, activeSubscriptions] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.barber.count(),
        prisma.salon.count(),
        prisma.salon.count({ where: { status: 'ACTIVE' } }),
        prisma.booking.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: new Date() } } }),
      ]);

      return res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalBarbers,
          totalSalons,
          activeSalons,
          totalBookings,
          activeSubscriptions,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/admin/revenue
   * Get revenue statistics
   */
  async getRevenueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await dashboardService.getRevenueStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new AdminController();