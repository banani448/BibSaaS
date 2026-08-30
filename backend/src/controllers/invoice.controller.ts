import { Request, Response, NextFunction } from 'express';
import invoiceService from '../services/invoice.service';

class InvoiceController {
  /**
   * POST /api/invoices
   * Create invoice from payment
   */
  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'paymentId is required',
          code: 'PAYMENT_ID_REQUIRED',
        });
      }

      const invoice = await invoiceService.createInvoice(paymentId);

      return res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/invoices/me
   * Get current user's invoices
   */
  async getMyInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const { page = 1, limit = 20, status } = req.query;

      const result = await invoiceService.getUserInvoices(userId, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
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
   * GET /api/invoices/:id
   * Get invoice by ID
   */
  async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const invoice = await invoiceService.getInvoiceById(id);

      return res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/invoices
   * List all invoices (admin)
   */
  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, userId, status, fromDate, toDate } = req.query;

      const result = await invoiceService.listInvoices({
        page: Number(page),
        limit: Number(limit),
        userId: userId as string,
        status: status as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
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
   * PATCH /api/invoices/:id/status
   * Update invoice status (admin)
   */
  async updateInvoiceStatus(req: Request, res: Response, next: NextFunction) {
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

      const updatedInvoice = await invoiceService.updateInvoiceStatus(id, status);

      return res.json({
        success: true,
        message: 'Invoice status updated successfully',
        data: updatedInvoice,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/invoices/:id
   * Delete invoice (admin)
   */
  async deleteInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await invoiceService.deleteInvoice(id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/invoices/stats
   * Get invoice statistics (admin)
   */
  async getInvoiceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await invoiceService.getInvoiceStats({
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

export default new InvoiceController();
