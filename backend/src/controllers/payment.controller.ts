import {
  Request,
  Response,
} from "express";

import {
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";

import paymentService from "../services/payment.service";

type AuthenticatedRequest =
  Request;

class PaymentController {
  // ============================================================
  // UTILITAIRES
  // ============================================================

  private getUserId(
    req: AuthenticatedRequest
  ): string {
    const userId =
      req.user?.id;

    if (!userId) {
      throw new Error(
        "Utilisateur non authentifié."
      );
    }

    return userId;
  }

  private isAdmin(
    req: AuthenticatedRequest
  ): boolean {
    return (
      req.user?.role ===
        "ADMIN" ||
      req.user?.role ===
        "SUPER_ADMIN"
    );
  }

  private sendError(
    res: Response,
    error: unknown,
    defaultMessage =
      "Une erreur est survenue."
  ) {
    const message =
      error instanceof Error &&
      error.message
        ? error.message
        : defaultMessage;

    const normalizedMessage =
      message.toLowerCase();

    const status =
      normalizedMessage.includes(
        "non autorisé"
      ) ||
      normalizedMessage.includes(
        "unauthorized"
      )
        ? 403
        : normalizedMessage.includes(
            "not found"
          ) ||
          normalizedMessage.includes(
            "introuvable"
          )
          ? 404
          : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }

  // ============================================================
  // CREATE PAYMENT
  // ============================================================

  async createPayment(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId =
        this.getUserId(req);

      const {
        subscriptionId,
        invoiceId,
        bookingId,
        amount,
        planId,
        currency,
        paymentMethod,
        phone,
        country,
        description,
        metadata,
      } = req.body;

      const result =
        await paymentService.createPayment({
          userId,

          subscriptionId:
            subscriptionId ||
            undefined,

          invoiceId:
            invoiceId ||
            undefined,

          bookingId:
            bookingId ||
            undefined,

          amount:
            amount !== undefined
              ? Number(amount)
              : undefined,

          planId:
            planId ||
            undefined,

          currency,

          paymentMethod,

          phone,

          country,

          description,

          metadata:
            metadata || {},
        });

      return res.status(201).json({
        success: true,

        message:
          "Paiement initialisé avec succès.",

        data: result,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible d'initialiser le paiement."
      );
    }
  }

  // ============================================================
  // GET PAYMENT
  // ============================================================

  async getPayment(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId =
        this.getUserId(req);

      const paymentId =
        req.params.id;

      const payment =
        await paymentService.getPayment(
          paymentId,
          userId
        );

      return res.status(200).json({
        success: true,

        data: payment,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de récupérer le paiement."
      );
    }
  }

  // ============================================================
  // MY PAYMENTS
  // ============================================================

  async getMyPayments(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId =
        this.getUserId(req);

      const page =
        Math.max(
          1,
          Number(
            req.query.page
          ) || 1
        );

      const limit =
        Math.min(
          100,
          Math.max(
            1,
            Number(
              req.query.limit
            ) || 20
          )
        );

      const result =
        await paymentService.getMyPayments(
          userId,
          page,
          limit
        );

      return res.status(200).json({
        success: true,

        data: result,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de récupérer vos paiements."
      );
    }
  }

  // ============================================================
  // VERIFY PAYMENT
  // ============================================================

  async verifyPayment(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId =
        this.getUserId(req);

      const paymentId =
        req.params.id;

      /*
       * Vérifie que le paiement
       * appartient bien à l'utilisateur.
       */
      await paymentService.getPayment(
        paymentId,
        userId
      );

      const payment =
        await paymentService.verifyPayment(
          paymentId
        );

      return res.status(200).json({
        success: true,

        message:
          "Paiement vérifié avec succès.",

        data: payment,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de vérifier le paiement."
      );
    }
  }

  // ============================================================
  // STRIPE WEBHOOK
  // ============================================================

  async stripeWebhook(
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

          received: false,

          message:
            "Signature Stripe manquante.",
        });
      }

      const rawBody =
        Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from(
              JSON.stringify(
                req.body || {}
              )
            );

      const stripeSignature =
        Array.isArray(signature)
          ? signature[0]
          : signature;

      const result =
        await paymentService.handleStripeWebhook(
          rawBody,
          stripeSignature
        );

      return res.status(200).json({
        success: true,

        received: true,

        data: result,
      });
    } catch (error) {
      console.error(
        "[STRIPE WEBHOOK ERROR]",
        error
      );

      return res.status(500).json({
        success: false,

        received: false,

        message:
          error instanceof Error
            ? error.message
            : "Erreur lors du traitement du webhook Stripe.",
      });
    }
  }

  // ============================================================
  // OPENPAY WEBHOOK
  // ============================================================

  async openPayWebhook(
    req: Request,
    res: Response
  ) {
    /*
     * IMPORTANT :
     * OpenPay demande un HTTP 200
     * pour confirmer la réception du
     * callback. Un code différent
     * déclenche une nouvelle tentative.
     */

    try {
      const body =
        req.body || {};

      const result =
        await paymentService.handleOpenPayWebhook(
          body
        );

      console.log(
        "[OPENPAY WEBHOOK]",
        {
          reference:
            body.reference,

          status:
            body.status,

          result,
        }
      );

      return res.status(200).json({
        success: true,

        received: true,

        data: result,
      });
    } catch (error) {
      console.error(
        "[OPENPAY WEBHOOK ERROR]",
        error
      );

      /*
       * OpenPay documente que le callback
       * doit recevoir HTTP 200.
       *
       * L'erreur est donc journalisée
       * côté backend.
       */
      return res.status(200).json({
        success: true,

        received: true,

        processed: false,

        message:
          "Notification OpenPay reçue.",
      });
    }
  }

  // ============================================================
  // STRIPE RETURN
  // ============================================================

  async stripeReturn(
    req: Request,
    res: Response
  ) {
    const sessionId =
      String(
        req.query.session_id ||
          req.query.checkout_session_id ||
          ""
      );

    const paymentId =
      String(
        req.query.payment_id ||
          ""
      );

    const frontendUrl =
      process.env
        .STRIPE_SUCCESS_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    try {
      const url =
        new URL(
          frontendUrl
        );

      if (sessionId) {
        url.searchParams.set(
          "session_id",
          sessionId
        );
      }

      if (paymentId) {
        url.searchParams.set(
          "payment_id",
          paymentId
        );
      }

      url.searchParams.set(
        "provider",
        "stripe"
      );

      return res.redirect(
        url.toString()
      );
    } catch {
      return res.status(200).json({
        success: true,

        provider: "stripe",

        sessionId:
          sessionId || null,

        paymentId:
          paymentId || null,
      });
    }
  }

  // ============================================================
  // STRIPE CANCEL
  // ============================================================

  async stripeCancel(
    req: Request,
    res: Response
  ) {
    const sessionId =
      String(
        req.query.session_id ||
          req.query.checkout_session_id ||
          ""
      );

    const paymentId =
      String(
        req.query.payment_id ||
          ""
      );

    const frontendUrl =
      process.env
        .STRIPE_CANCEL_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    try {
      const url =
        new URL(
          frontendUrl
        );

      if (sessionId) {
        url.searchParams.set(
          "session_id",
          sessionId
        );
      }

      if (paymentId) {
        url.searchParams.set(
          "payment_id",
          paymentId
        );
      }

      url.searchParams.set(
        "provider",
        "stripe"
      );

      return res.redirect(
        url.toString()
      );
    } catch {
      return res.status(200).json({
        success: true,

        provider: "stripe",

        sessionId:
          sessionId || null,

        paymentId:
          paymentId || null,
      });
    }
  }

  // ============================================================
  // CANCEL PAYMENT
  // ============================================================

  async cancelPayment(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId =
        this.getUserId(req);

      const paymentId =
        req.params.id;

      const payment =
        await paymentService.cancelPayment(
          paymentId,
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Paiement annulé.",

        data: payment,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible d'annuler le paiement."
      );
    }
  }

  // ============================================================
  // SIMULATE PAYMENT
  // ============================================================

  async simulatePayment(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      this.getUserId(req);

      const paymentId =
        req.params.id ||
        req.body?.paymentId;

      if (!paymentId) {
        return res.status(400).json({
          success: false,

          message:
            "paymentId est obligatoire.",
        });
      }

      const success =
        req.body?.success !==
        undefined
          ? Boolean(
              req.body.success
            )
          : true;

      const payment =
        await paymentService.simulatePayment(
          paymentId,
          success
        );

      return res.status(200).json({
        success: true,

        message:
          "Paiement simulé avec succès.",

        data: payment,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de simuler le paiement."
      );
    }
  }

  // ============================================================
  // ADMIN - ALL PAYMENTS
  // ============================================================

  async getAllPayments(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      if (!this.isAdmin(req)) {
        return res.status(403).json({
          success: false,

          message:
            "Accès administrateur requis.",
        });
      }

      const page =
        Math.max(
          1,
          Number(
            req.query.page
          ) || 1
        );

      const limit =
        Math.min(
          100,
          Math.max(
            1,
            Number(
              req.query.limit
            ) || 20
          )
        );

      const status =
        req.query.status
          ? (String(
              req.query.status
            ) as PaymentStatus)
          : undefined;

      const provider =
        req.query.provider
          ? (String(
              req.query.provider
            ) as PaymentProvider)
          : undefined;

      const userId =
        req.query.userId
          ? String(
              req.query.userId
            )
          : undefined;

      const search =
        req.query.search
          ? String(
              req.query.search
            )
          : undefined;

      const result =
        await paymentService.getAllPayments({
          page,

          limit,

          status,

          provider,

          userId,

          search,
        });

      return res.status(200).json({
        success: true,

        data: result,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de récupérer les paiements."
      );
    }
  }

  // ============================================================
  // ADMIN - PAYMENT STATS
  // ============================================================

  async getPaymentStats(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      if (!this.isAdmin(req)) {
        return res.status(403).json({
          success: false,

          message:
            "Accès administrateur requis.",
        });
      }

      const stats =
        await paymentService.getPaymentStats();

      return res.status(200).json({
        success: true,

        data: stats,
      });
    } catch (error) {
      return this.sendError(
        res,
        error,
        "Impossible de récupérer les statistiques."
      );
    }
  }
}

const paymentController =
  new PaymentController();

export default paymentController;