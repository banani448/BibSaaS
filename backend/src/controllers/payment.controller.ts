import { Request, Response } from "express";
import { PaymentProvider, PaymentStatus } from "@prisma/client";

import prisma from "../config/prisma";
import {
  createStripeCheckout,
  createCinetPayCheckout,
  verifyCinetPayPayment,
  refundStripePayment,
} from "../services/payment.service";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

const isAdmin = (req: AuthenticatedRequest): boolean => {
  return (
    req.user?.role === "ADMIN" ||
    req.user?.role === "SUPER_ADMIN"
  );
};

const generatePaymentReference = (): string => {
  const timestamp = Date.now();
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `BIB-${timestamp}-${random}`;
};

/**
 * ============================================================
 * CREATE PAYMENT
 * POST /api/payments
 * ============================================================
 *
 * Body:
 * {
 *   amount: 2000,
 *   currency: "XAF",
 *   provider: "STRIPE" | "CINETPAY",
 *   subscriptionId?: "...",
 *   bookingId?: "...",
 *   description?: "..."
 * }
 *
 * Retourne une URL de paiement au frontend.
 */
export const createPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    const {
      amount,
      currency = "XAF",
      provider,
      subscriptionId,
      bookingId,
      description,
    } = req.body;

    /**
     * --------------------------------------------------------
     * VALIDATION
     * --------------------------------------------------------
     */

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être supérieur à zéro.",
      });
    }

    if (!provider) {
      return res.status(400).json({
        success: false,
        message:
          "Le fournisseur de paiement est obligatoire.",
      });
    }

    if (
      provider !== PaymentProvider.STRIPE &&
      provider !== PaymentProvider.CINETPAY
    ) {
      return res.status(400).json({
        success: false,
        message: "Fournisseur de paiement non supporté.",
        supportedProviders: [
          PaymentProvider.STRIPE,
          PaymentProvider.CINETPAY,
        ],
      });
    }

    /**
     * --------------------------------------------------------
     * VALIDATION ABONNEMENT
     * --------------------------------------------------------
     */

    if (subscriptionId) {
      const subscription =
        await prisma.subscription.findUnique({
          where: {
            id: subscriptionId,
          },
        });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Abonnement introuvable.",
        });
      }

      if (subscription.userId !== userId) {
        return res.status(403).json({
          success: false,
          message:
            "Cet abonnement ne vous appartient pas.",
        });
      }
    }

    /**
     * --------------------------------------------------------
     * VALIDATION RÉSERVATION
     * --------------------------------------------------------
     */

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Réservation introuvable.",
        });
      }

      if (booking.userId !== userId) {
        return res.status(403).json({
          success: false,
          message:
            "Cette réservation ne vous appartient pas.",
        });
      }
    }

    /**
     * --------------------------------------------------------
     * RÉFÉRENCE UNIQUE
     * --------------------------------------------------------
     */

    const reference = generatePaymentReference();

    /**
     * --------------------------------------------------------
     * CRÉATION DU PAYMENT EN BASE
     * --------------------------------------------------------
     */

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: Number(amount),
        currency,
        provider,
        status: PaymentStatus.PENDING,
        transactionId: reference,
        subscriptionId: subscriptionId || null,
        bookingId: bookingId || null,
        description:
          description ||
          `Paiement BibSaaS - ${reference}`,
      },
    });

    /**
     * --------------------------------------------------------
     * STRIPE
     * --------------------------------------------------------
     */

    if (provider === PaymentProvider.STRIPE) {
      try {
        const stripeCheckout =
          await createStripeCheckout({
            paymentId: payment.id,
            reference,
            amount: Number(amount),
            currency,
            userId,
            description:
              description ||
              "Abonnement / réservation BibSaaS",
          });

        await prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            transactionId:
              stripeCheckout.transactionId ||
              reference,
          },
        });

        return res.status(201).json({
          success: true,
          message:
            "Session de paiement Stripe créée.",
          provider: "STRIPE",
          data: {
            paymentId: payment.id,
            reference,
            checkoutUrl:
              stripeCheckout.checkoutUrl,
            status: PaymentStatus.PENDING,
          },
        });
      } catch (error) {
        await prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.FAILED,
          },
        });

        throw error;
      }
    }

    /**
     * --------------------------------------------------------
     * CINETPAY
     * --------------------------------------------------------
     */

    if (provider === PaymentProvider.CINETPAY) {
      try {
        const cinetPayCheckout =
          await createCinetPayCheckout({
            paymentId: payment.id,
            reference,
            amount: Number(amount),
            currency,
            userId,
            description:
              description ||
              "Abonnement / réservation BibSaaS",
          });

        await prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            transactionId:
              cinetPayCheckout.transactionId ||
              reference,
          },
        });

        return res.status(201).json({
          success: true,
          message:
            "Paiement CinetPay créé.",
          provider: "CINETPAY",
          data: {
            paymentId: payment.id,
            reference,
            paymentUrl:
              cinetPayCheckout.paymentUrl,
            status: PaymentStatus.PENDING,
          },
        });
      } catch (error) {
        await prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.FAILED,
          },
        });

        throw error;
      }
    }

    return res.status(400).json({
      success: false,
      message: "Fournisseur de paiement invalide.",
    });
  } catch (error) {
    console.error(
      "❌ createPayment:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la création du paiement.",
    });
  }
};

/**
 * ============================================================
 * GET PAYMENT
 * GET /api/payments/:paymentId
 * ============================================================
 */

export const getPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          subscription: true,
          booking: true,
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable.",
      });
    }

    if (
      payment.userId !== userId &&
      !isAdmin(req)
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé.",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error(
      "❌ getPayment:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération du paiement.",
    });
  }
};

/**
 * ============================================================
 * GET MY PAYMENTS
 * GET /api/payments/my
 * ============================================================
 */

export const getMyPayments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const [payments, total] =
      await prisma.$transaction([
        prisma.payment.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
          include: {
            subscription: true,
            booking: true,
          },
        }),

        prisma.payment.count({
          where: {
            userId,
          },
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "❌ getMyPayments:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération des paiements.",
    });
  }
};

/**
 * ============================================================
 * PAYMENT STATUS
 * GET /api/payments/:paymentId/status
 * ============================================================
 */

export const getPaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
        select: {
          id: true,
          userId: true,
          transactionId: true,
          amount: true,
          currency: true,
          provider: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable.",
      });
    }

    if (
      payment.userId !== userId &&
      !isAdmin(req)
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        reference:
          payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        provider: payment.provider,
        status: payment.status,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "❌ getPaymentStatus:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la vérification du paiement.",
    });
  }
};

/**
 * ============================================================
 * CINETPAY CALLBACK / RETURN
 * GET /api/payments/cinetpay/return
 * ============================================================
 *
 * Cette route reçoit le retour de l'utilisateur
 * après son paiement CinetPay.
 *
 * IMPORTANT :
 * Le retour utilisateur n'est PAS considéré comme
 * une confirmation définitive.
 *
 * La confirmation doit être faite côté serveur
 * via vérification CinetPay / notification.
 */

export const cinetPayReturn = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const transactionId =
      String(
        req.query.transaction_id ||
          req.query.cpm_trans_id ||
          ""
      );

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de transaction manquant.",
      });
    }

    const payment =
      await prisma.payment.findFirst({
        where: {
          transactionId,
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction BibSaaS introuvable.",
      });
    }

    /**
     * Vérification serveur auprès de CinetPay.
     */
    const verification =
      await verifyCinetPayPayment(
        transactionId
      );

    if (verification.success) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Paiement confirmé.",
        paymentId: payment.id,
        status: PaymentStatus.SUCCESS,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Paiement reçu mais encore en attente de confirmation.",
      paymentId: payment.id,
      status: payment.status,
    });
  } catch (error) {
    console.error(
      "❌ cinetPayReturn:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors du traitement du retour CinetPay.",
    });
  }
};

/**
 * ============================================================
 * CINETPAY WEBHOOK
 * POST /api/payments/webhooks/cinetpay
 * ============================================================
 */

export const cinetPayWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      cpm_trans_id,
      transaction_id,
      status,
    } = req.body;

    const transactionId =
      transaction_id || cpm_trans_id;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction ID manquant.",
      });
    }

    const payment =
      await prisma.payment.findFirst({
        where: {
          transactionId,
          provider:
            PaymentProvider.CINETPAY,
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Paiement CinetPay introuvable.",
      });
    }

    /**
     * Protection contre les doubles notifications.
     */
    if (
      payment.status ===
      PaymentStatus.SUCCESS
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Paiement déjà confirmé.",
      });
    }

    /**
     * Vérification serveur obligatoire.
     */
    const verification =
      await verifyCinetPayPayment(
        transactionId
      );

    if (!verification.success) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Transaction CinetPay non confirmée.",
      });
    }

    /**
     * Transaction atomique :
     * paiement + abonnement/réservation.
     */
    await prisma.$transaction(
      async (tx) => {
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
          },
        });

        if (payment.subscriptionId) {
          await tx.subscription.update({
            where: {
              id: payment.subscriptionId,
            },
            data: {
              status: "ACTIVE",
            },
          });
        }

        if (payment.bookingId) {
          await tx.booking.update({
            where: {
              id: payment.bookingId,
            },
            data: {
              status: "CONFIRMED",
            },
          });
        }
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Webhook CinetPay traité avec succès.",
    });
  } catch (error) {
    console.error(
      "❌ cinetPayWebhook:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors du traitement du webhook CinetPay.",
    });
  }
};

/**
 * ============================================================
 * STRIPE SUCCESS
 * GET /api/payments/stripe/success
 * ============================================================
 */

export const stripeSuccess = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const sessionId =
      String(
        req.query.session_id || ""
      );

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message:
          "Session Stripe manquante.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Paiement Stripe reçu.",
      sessionId,
    });
  } catch (error) {
    console.error(
      "❌ stripeSuccess:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors du retour Stripe.",
    });
  }
};

/**
 * ============================================================
 * STRIPE CANCEL
 * GET /api/payments/stripe/cancel
 * ============================================================
 */

export const stripeCancel = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.status(200).json({
    success: false,
    cancelled: true,
    message:
      "Le paiement Stripe a été annulé.",
  });
};

/**
 * ============================================================
 * STRIPE WEBHOOK
 * POST /api/payments/webhooks/stripe
 * ============================================================
 *
 * IMPORTANT :
 * Cette route doit recevoir le BODY RAW Stripe.
 *
 * La vérification de signature Stripe doit être
 * effectuée dans le webhook/service Stripe.
 */

export const stripeWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    /**
     * Le service Stripe doit vérifier :
     *
     * - stripe-signature
     * - webhook secret
     * - event type
     */

    const event = req.body;

    if (!event || !event.type) {
      return res.status(400).json({
        success: false,
        message:
          "Événement Stripe invalide.",
      });
    }

    /**
     * --------------------------------------------------------
     * CHECKOUT SESSION COMPLETED
     * --------------------------------------------------------
     */

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data?.object;

      const paymentId =
        session?.metadata?.paymentId;

      if (!paymentId) {
        return res.status(200).json({
          success: true,
          message:
            "Événement Stripe sans paymentId.",
        });
      }

      const payment =
        await prisma.payment.findUnique({
          where: {
            id: paymentId,
          },
        });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Paiement BibSaaS introuvable.",
        });
      }

      if (
        payment.status ===
        PaymentStatus.SUCCESS
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Paiement déjà confirmé.",
        });
      }

      await prisma.$transaction(
        async (tx) => {
          await tx.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status:
                PaymentStatus.SUCCESS,
              paidAt: new Date(),
              transactionId:
                session.payment_intent ||
                payment.transactionId,
            },
          });

          if (payment.subscriptionId) {
            await tx.subscription.update({
              where: {
                id:
                  payment.subscriptionId,
              },
              data: {
                status: "ACTIVE",
              },
            });
          }

          if (payment.bookingId) {
            await tx.booking.update({
              where: {
                id: payment.bookingId,
              },
              data: {
                status: "CONFIRMED",
              },
            });
          }
        }
      );
    }

    /**
     * --------------------------------------------------------
     * PAYMENT FAILED
     * --------------------------------------------------------
     */

    if (
      event.type ===
        "payment_intent.payment_failed" ||
      event.type ===
        "checkout.session.async_payment_failed"
    ) {
      const object =
        event.data?.object;

      const paymentId =
        object?.metadata?.paymentId;

      if (paymentId) {
        await prisma.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status:
              PaymentStatus.FAILED,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error(
      "❌ stripeWebhook:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors du traitement du webhook Stripe.",
    });
  }
};

/**
 * ============================================================
 * CANCEL PAYMENT
 * PATCH /api/payments/:paymentId/cancel
 * ============================================================
 */

export const cancelPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Utilisateur non authentifié.",
      });
    }

    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable.",
      });
    }

    if (
      payment.userId !== userId &&
      !isAdmin(req)
    ) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé.",
      });
    }

    if (
      payment.status !==
      PaymentStatus.PENDING
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Seuls les paiements en attente peuvent être annulés.",
      });
    }

    const updated =
      await prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status:
            PaymentStatus.CANCELLED,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Paiement annulé.",
      data: updated,
    });
  } catch (error) {
    console.error(
      "❌ cancelPayment:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de l'annulation.",
    });
  }
};

/**
 * ============================================================
 * ADMIN - ALL PAYMENTS
 * GET /api/payments/admin/all
 * ============================================================
 */

export const getAllPayments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Accès réservé aux administrateurs.",
      });
    }

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 50,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const status =
      req.query.status as
        | PaymentStatus
        | undefined;

    const provider =
      req.query.provider as
        | PaymentProvider
        | undefined;

    const where: {
      status?: PaymentStatus;
      provider?: PaymentProvider;
    } = {};

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    const [payments, total] =
      await prisma.$transaction([
        prisma.payment.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            subscription: true,
            booking: true,
          },
        }),

        prisma.payment.count({
          where,
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "❌ getAllPayments:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération des paiements.",
    });
  }
};

/**
 * ============================================================
 * ADMIN - PAYMENT STATISTICS
 * GET /api/payments/admin/stats
 * ============================================================
 */

export const getPaymentStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Accès réservé aux administrateurs.",
      });
    }

    const [
      total,
      successful,
      pending,
      failed,
      cancelled,
      revenue,
    ] = await prisma.$transaction([
      prisma.payment.count(),

      prisma.payment.count({
        where: {
          status:
            PaymentStatus.SUCCESS,
        },
      }),

      prisma.payment.count({
        where: {
          status:
            PaymentStatus.PENDING,
        },
      }),

      prisma.payment.count({
        where: {
          status:
            PaymentStatus.FAILED,
        },
      }),

      prisma.payment.count({
        where: {
          status:
            PaymentStatus.CANCELLED,
        },
      }),

      prisma.payment.aggregate({
        where: {
          status:
            PaymentStatus.SUCCESS,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalPayments: total,
        successfulPayments:
          successful,
        pendingPayments:
          pending,
        failedPayments: failed,
        cancelledPayments:
          cancelled,
        totalRevenue:
          revenue._sum.amount || 0,
        currency: "XAF",
      },
    });
  } catch (error) {
    console.error(
      "❌ getPaymentStats:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors du calcul des statistiques.",
    });
  }
};

/**
 * ============================================================
 * ADMIN - REFUND STRIPE PAYMENT
 * POST /api/payments/:paymentId/refund
 * ============================================================
 */

export const refundPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Accès réservé aux administrateurs.",
      });
    }

    const { paymentId } = req.params;

    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable.",
      });
    }

    if (
      payment.provider !==
      PaymentProvider.STRIPE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le remboursement automatique est disponible ici uniquement pour Stripe.",
      });
    }

    if (
      payment.status !==
      PaymentStatus.SUCCESS
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Seul un paiement confirmé peut être remboursé.",
      });
    }

    await refundStripePayment({
      paymentId: payment.id,
      transactionId:
        payment.transactionId,
      amount: Number(payment.amount),
    });

    const refunded =
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status:
            PaymentStatus.REFUNDED,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Paiement Stripe remboursé avec succès.",
      data: refunded,
    });
  } catch (error) {
    console.error(
      "❌ refundPayment:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors du remboursement.",
    });
  }
};