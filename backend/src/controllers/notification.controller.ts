import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';

class NotificationController {
  /**
   * GET /api/notifications/me
   * Get current user's notifications
   */
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const { page = 1, limit = 20, isRead, type } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        page: Number(page),
        limit: Number(limit),
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        type: type as string,
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
   * GET /api/notifications/unread-count
   * Get unread notifications count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const result = await notificationService.getUnreadCount(userId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/:id
   * Get notification by ID
   */
  async getNotificationById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const notification = await notificationService.getNotificationById(id);

      return res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const updatedNotification = await notificationService.markAsRead(id);

      return res.json({
        success: true,
        message: 'Notification marked as read',
        data: updatedNotification,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read

   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const result = await notificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await notificationService.deleteNotification(id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/notifications
   * Create notification (admin)
   */
  async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, type, title, message, data } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'userId, type, title, and message are required',
          code: 'MISSING_FIELDS',
        });
      }

      const notification = await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        data,
      });

      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/notifications
   * List all notifications (admin)
   */
  async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, userId, type, isRead } = req.query;

      const result = await notificationService.listNotifications({
        page: Number(page),
        limit: Number(limit),
        userId: userId as string,
        type: type as string,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new NotificationController();