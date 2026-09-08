import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';

class PaymentController {
  /**
   * POST /api/payments
   * Create a new payment for a subscription plan
   */
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const { planId, subscriptionId, paymentMethod, phone, currency, country, metadata } = req.body;

      if (!planId || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'planId and paymentMethod are required',
          code: 'MISSING_FIELDS',
        });
      }

      const payment = await paymentService.createPayment({
        userId,
        planId,
        subscriptionId,
        paymentMethod,
        phone,
        currency,
        country,
        metadata,
      });

      return res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/:id
   * Get payment by ID
   */
  async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const payment = await paymentService.getPayment(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND',
        });
      }

      if (payment.userId !== userId && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to access this payment',
          code: 'FORBIDDEN',
        });
      }

      return res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/:id/verify
   * Verify payment status with the provider
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const payment = await paymentService.verifyPayment(id);

      return res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/simulated
   * Simulate a payment (non-production environments only)
   */
  async simulatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId, success = true } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'paymentId is required',
          code: 'PAYMENT_ID_REQUIRED',
        });
      }

      const payment = await paymentService.simulatePayment(paymentId, Boolean(success));

      return res.json({
        success: true,
        message: 'Simulated payment processed',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/webhooks/mtn
   */
  async mtnWebhook(req: Request, res: Response, next: NextFunction) {
    return this.handleProviderWebhook('MTN_MONEY', req, res, next);
  }

  /**
   * POST /api/payments/webhooks/airtel
   */
  async airtelWebhook(req: Request, res: Response, next: NextFunction) {
    return this.handleProviderWebhook('AIRTEL_MONEY', req, res, next);
  }

  /**
   * POST /api/payments/webhooks/stripe
   */
  async stripeWebhook(req: Request, res: Response, next: NextFunction) {
    return this.handleProviderWebhook('STRIPE', req, res, next);
  }

  private async handleProviderWebhook(
    providerName: string,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      }

      const result = await paymentService.handleWebhook({
        providerName,
        headers,
        body: req.body,
        rawBody: Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)),
      });

      return res.json({
        success: true,
        duplicate: result.duplicate,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
