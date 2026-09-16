import {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";

import express from "express";

import stripeController from "../controllers/stripe.controller";

const router =
  Router();

// ============================================================
// STATUS
// ============================================================

router.get(
  "/status",
  (
    req: Request,
    res: Response
  ) =>
    stripeController.status(
      req,
      res
    )
);

// ============================================================
// PAYMENT LINK
// ============================================================

router.get(
  "/payment-links/:id",
  (
    req: Request,
    res: Response
  ) =>
    stripeController.getPaymentLink(
      req,
      res
    )
);

// ============================================================
// CHECKOUT SESSION
// ============================================================

router.get(
  "/checkout-session/:id",
  (
    req: Request,
    res: Response
  ) =>
    stripeController.getCheckoutSession(
      req,
      res
    )
);

// ============================================================
// STRIPE WEBHOOK
// ============================================================
//
// ATTENTION :
// Cette route doit utiliser express.raw()
// AVANT express.json().
//
// Elle sera montée dans app.ts avant
// le middleware global express.json().
//

router.post(
  "/webhook",

  express.raw({
    type: "application/json",
  }),

  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    void next;

    return stripeController.webhook(
      req,
      res
    );
  }
);

export default router;