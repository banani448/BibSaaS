import {
  Request,
  Response,
} from "express";

import stripeService from "../services/stripe.service";

class StripeController {
  // ==========================================================
  // HEALTH / CONFIGURATION
  // ==========================================================

  async status(
    _req: Request,
    res: Response
  ) {
    try {
      return res.status(200).json({
        success: true,
        provider: "STRIPE",
        environment:
          process.env.STRIPE_ENVIRONMENT ||
          "test",

        enabled:
          process.env.STRIPE_ENABLED ===
          "true",

        secretKeyConfigured:
          Boolean(
            process.env.STRIPE_SECRET_KEY
          ),

        webhookConfigured:
          Boolean(
            process.env.STRIPE_WEBHOOK_SECRET
          ),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur Stripe.",
      });
    }
  }

  // ==========================================================
  // PAYMENT LINK
  // ==========================================================

  async getPaymentLink(
    req: Request,
    res: Response
  ) {
    try {
      const paymentLinkId =
        String(
          req.params.id || ""
        );

      if (!paymentLinkId) {
        return res.status(400).json({
          success: false,
          message:
            "paymentLinkId est obligatoire.",
        });
      }

      const paymentLink =
        await stripeService.retrievePaymentLink(
          paymentLinkId
        );

      return res.status(200).json({
        success: true,
        data: paymentLink,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de récupérer le Payment Link Stripe."
      );
    }
  }

  // ==========================================================
  // CHECKOUT SESSION
  // ==========================================================

  async getCheckoutSession(
    req: Request,
    res: Response
  ) {
    try {
      const sessionId =
        String(
          req.params.id || ""
        );

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "sessionId est obligatoire.",
        });
      }

      const session =
        await stripeService.retrieveCheckoutSession(
          sessionId
        );

      return res.status(200).json({
        success: true,
        data: {
          id: session.id,

          paymentStatus:
            session.payment_status,

          status:
            session.status,

          amountTotal:
            session.amount_total,

          currency:
            session.currency,

          customerEmail:
            session.customer_details
              ?.email || null,

          paymentIntent:
            typeof session.payment_intent ===
            "string"
              ? session.payment_intent
              : session.payment_intent?.id ||
                null,

          subscription:
            typeof session.subscription ===
            "string"
              ? session.subscription
              : session.subscription?.id ||
                null,

          paymentLink:
            session.payment_link ||
            null,
        },
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de récupérer la session Stripe."
      );
    }
  }

  // ==========================================================
  // WEBHOOK
  // ==========================================================

  async webhook(
    req: Request,
    res: Response
  ) {
    try {
      const signature =
        req.headers[
          "stripe-signature"
        ];

      if (!signature) {
        return res.status(400).json({
          success: false,
          message:
            "Signature Stripe manquante.",
        });
      }

      const rawBody =
        req.body as Buffer;

      if (!Buffer.isBuffer(rawBody)) {
        return res.status(400).json({
          success: false,
          message:
            "Le webhook Stripe doit recevoir le corps brut de la requête.",
        });
      }

      const event =
        stripeService.constructWebhookEvent(
          rawBody,
          Array.isArray(signature)
            ? signature[0]
            : signature
        );

      const result =
        stripeService.handleWebhookEvent(
          event
        );

      console.log(
        `[STRIPE WEBHOOK] ${event.type} - ${event.id} - ${result.status}`
      );

      /**
       * IMPORTANT :
       *
       * Pour l'instant ce contrôleur valide
       * et normalise le webhook.
       *
       * La mise à jour Prisma :
       *
       * Payment -> SUCCESS
       * Subscription -> ACTIVE
       * Invoice -> PAID
       *
       * sera branchée dans payment.service.ts
       * après vérification de ton modèle Prisma
       * actuel.
       */

      return res.status(200).json({
        success: true,
        received: true,
        data: {
          eventId:
            result.eventId,

          eventType:
            result.eventType,

          status:
            result.status,

          providerPaymentId:
            result.providerPaymentId,

          providerTransactionId:
            result.providerTransactionId,

          transactionReference:
            result.transactionReference,
        },
      });
    } catch (error) {
      console.error(
        "[STRIPE WEBHOOK ERROR]",
        error
      );

      return res.status(400).json({
        success: false,
        received: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors du traitement du webhook Stripe.",
      });
    }
  }

  // ==========================================================
  // ERROR HANDLER
  // ==========================================================

  private sendError(
    res: Response,
    error: unknown,
    defaultMessage: string
  ) {
    const message =
      error instanceof Error &&
      error.message
        ? error.message
        : defaultMessage;

    const normalized =
      message.toLowerCase();

    let status = 400;

    if (
      normalized.includes(
        "introuvable"
      ) ||
      normalized.includes(
        "not found"
      )
    ) {
      status = 404;
    }

    if (
      normalized.includes(
        "désactivé"
      ) ||
      normalized.includes(
        "non configuré"
      )
    ) {
      status = 503;
    }

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

const stripeController =
  new StripeController();

export default stripeController;