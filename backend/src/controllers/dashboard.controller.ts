import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';

class DashboardController {
  /**
   * GET /api/dashboard/client
   * Get client dashboard
   */
  async getClientDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const data = await dashboardService.getClientDashboard(userId);

      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/barber
   * Get barber dashboard
   */
  async getBarberDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const data = await dashboardService.getBarberDashboard(userId);

      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/salon
   * Get salon dashboard
   */
  async getSalonDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const data = await dashboardService.getSalonDashboard(userId);

      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/admin
   * Get admin dashboard
   */
  async getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getAdminDashboard();

      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/revenue
   * Get revenue statistics
   */
  async getRevenueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, salonId } = req.query;

      const stats = await dashboardService.getRevenueStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        salonId: salonId as string,
      });

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/bookings
   * Get booking statistics
   */
  async getBookingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, salonId, barberId } = req.query;

      const stats = await dashboardService.getBookingStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        salonId: salonId as string,
        barberId: barberId as string,
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

export default new DashboardController();