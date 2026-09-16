import { Router } from "express";
import paymentController from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * ============================================================
 * PAYMENT ROUTES
 * ============================================================
 *
 * Base route:
 * /api/payments
 *
 * Providers:
 * - SIMULATED
 * - STRIPE
 * - OPENPAY
 * ============================================================
 */

/**
 * ============================================================
 * CREATE PAYMENT
 * ============================================================
 *
 * POST /api/payments
 *
 * Authentication required.
 */
router.post(
  "/",
  authenticate,
  paymentController.createPayment.bind(paymentController),
);

/**
 * ============================================================
 * MY PAYMENTS
 * ============================================================
 *
 * GET /api/payments
 *
 * Authentication required.
 */
router.get(
  "/",
  authenticate,
  paymentController.getMyPayments.bind(paymentController),
);

/**
 * ============================================================
 * OPENPAY WEBHOOK
 * ============================================================
 *
 * POST /api/payments/webhooks/openpay
 *
 * IMPORTANT:
 * No JWT authentication here.
 *
 * OpenPay must be able to call this endpoint directly.
 */
router.post(
  "/webhooks/openpay",
  paymentController.openPayWebhook.bind(paymentController),
);

/**
 * ============================================================
 * STRIPE WEBHOOK
 * ============================================================
 *
 * POST /api/payments/webhooks/stripe
 *
 * IMPORTANT:
 * The Stripe webhook requires the RAW request body
 * for signature verification.
 *
 * The raw body parser must therefore be configured at
 * application/server level before this route if required
 * by your StripeProvider.
 */
router.post(
  "/webhooks/stripe",
  paymentController.stripeWebhook.bind(paymentController),
);

/**
 * ============================================================
 * SIMULATED PAYMENT
 * ============================================================
 *
 * POST /api/payments/simulated
 *
 * Only available outside production.
 */
if (process.env.NODE_ENV !== "production") {
  router.post(
    "/simulated",
    authenticate,
    paymentController.simulatePayment.bind(paymentController),
  );
}

/**
 * ============================================================
 * PAYMENT VERIFICATION
 * ============================================================
 *
 * GET /api/payments/:id/verify
 */
router.get(
  "/:id/verify",
  authenticate,
  paymentController.verifyPayment.bind(paymentController),
);

/**
 * ============================================================
 * CANCEL PAYMENT
 * ============================================================
 *
 * POST /api/payments/:id/cancel
 */
router.post(
  "/:id/cancel",
  authenticate,
  paymentController.cancelPayment.bind(paymentController),
);

/**
 * ============================================================
 * GET PAYMENT
 * ============================================================
 *
 * GET /api/payments/:id
 */
router.get(
  "/:id",
  authenticate,
  paymentController.getPayment.bind(paymentController),
);

export default router;