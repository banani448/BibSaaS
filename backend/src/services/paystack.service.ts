import Stripe from "stripe";

import prisma from "../config/prisma";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface CreateStripeCheckoutParams {
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  userId: string;
  description: string;
}

interface CreateCinetPayCheckoutParams {
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  userId: string;
  description: string;
}

interface RefundStripeParams {
  paymentId: string;
  transactionId: string;
  amount: number;
}

/**
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY;

const STRIPE_SUCCESS_URL =
  process.env.STRIPE_SUCCESS_URL ||
  "http://localhost:5173/payment/success";

const STRIPE_CANCEL_URL =
  process.env.STRIPE_CANCEL_URL ||
  "http://localhost:5173/payment/cancel";

const CINETPAY_API_KEY =
  process.env.CINETPAY_API_KEY;

const CINETPAY_SITE_ID =
  process.env.CINETPAY_SITE_ID;

const CINETPAY_INIT_URL =
  process.env.CINETPAY_INIT_URL ||
  "https://api-checkout.cinetpay.com/v2/payment";

const CINETPAY_CHECK_URL =
  process.env.CINETPAY_CHECK_URL ||
  "https://api-checkout.cinetpay.com/v2/payment/check";

const CINETPAY_RETURN_URL =
  process.env.CINETPAY_RETURN_URL ||
  "http://localhost:5000/api/payments/cinetpay/return";

const CINETPAY_NOTIFY_URL =
  process.env.CINETPAY_NOTIFY_URL ||
  "http://localhost:5000/api/payments/webhooks/cinetpay";

/**
 * ============================================================
 * STRIPE CLIENT
 * ============================================================
 */

let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY);
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Stripe utilise généralement les montants
 * dans l'unité mineure.
 *
 * Pour XAF, on garde la valeur telle quelle.
 */
const convertAmountForStripe = (
  amount: number,
  currency: string
): number => {
  const zeroDecimalCurrencies = [
    "XAF",
    "XOF",
    "JPY",
    "KRW",
  ];

  if (
    zeroDecimalCurrencies.includes(
      currency.toUpperCase()
    )
  ) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

/**
 * Normalisation de la devise.
 */
const normalizeCurrency = (
 currency: string
): string => {
  return currency.trim().toUpperCase();
};

/**
 * ============================================================
 * STRIPE
 * CREATE CHECKOUT SESSION
 * ============================================================
 */

export const createStripeCheckout = async ({
  paymentId,
  reference,
  amount,
  currency,
  userId,
  description,
}: CreateStripeCheckoutParams) => {
  try {
    if (!stripe) {
      throw new Error(
        "STRIPE_SECRET_KEY n'est pas configurée."
      );
    }

    const normalizedCurrency =
      normalizeCurrency(currency);

    const stripeAmount =
      convertAmountForStripe(
        amount,
        normalizedCurrency
      );

    /**
     * --------------------------------------------------------
     * Vérification du paiement
     * --------------------------------------------------------
     */

    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
      });

    if (!payment) {
      throw new Error(
        "Paiement BibSaaS introuvable."
      );
    }

    /**
     * --------------------------------------------------------
     * Création Checkout Session
     * --------------------------------------------------------
     */

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: [
          "card",
        ],

        line_items: [
          {
            price_data: {
              currency:
                normalizedCurrency.toLowerCase(),

              product_data: {
                name:
                  "BibSaaS - Paiement",
                description,
              },

              unit_amount:
                stripeAmount,
            },

            quantity: 1,
          },
        ],

        metadata: {
          paymentId,
          userId,
          reference,
        },

        success_url:
          `${STRIPE_SUCCESS_URL}` +
          `?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${STRIPE_CANCEL_URL}` +
          `?payment_id=${paymentId}`,

        client_reference_id:
          reference,

        customer_email:
          undefined,
      });

    /**
     * --------------------------------------------------------
     * Sauvegarde Stripe
     * --------------------------------------------------------
     */

    await prisma.payment.update({
      where: {
        id: paymentId,
      },

      data: {
        transactionId:
          session.payment_intent
            ? String(
                session.payment_intent
              )
            : reference,

        metadata: {
          stripeSessionId:
            session.id,

          stripePaymentIntent:
            session.payment_intent || null,

          reference,
        },
      },
    });

    return {
      checkoutUrl:
        session.url,

      sessionId:
        session.id,

      transactionId:
        session.payment_intent
          ? String(
              session.payment_intent
            )
          : reference,
    };
  } catch (error) {
    console.error(
      "❌ Stripe Checkout Error:",
      error
    );

    throw new Error(
      "Impossible de créer la session Stripe."
    );
  }
};

/**
 * ============================================================
 * STRIPE
 * GET CHECKOUT SESSION
 * ============================================================
 */

export const getStripeCheckoutSession =
  async (
    sessionId: string
  ) => {
    try {
      if (!stripe) {
        throw new Error(
          "STRIPE_SECRET_KEY n'est pas configurée."
        );
      }

      return await stripe.checkout.sessions.retrieve(
        sessionId
      );
    } catch (error) {
      console.error(
        "❌ Stripe Session Error:",
        error
      );

      throw new Error(
        "Impossible de récupérer la session Stripe."
      );
    }
  };

/**
 * ============================================================
 * STRIPE
 * VERIFY PAYMENT
 * ============================================================
 */

export const verifyStripePayment =
  async (
    sessionId: string
  ) => {
    try {
      const session =
        await getStripeCheckoutSession(
          sessionId
        );

      return {
        success:
          session.payment_status ===
          "paid",

        status:
          session.payment_status,

        paymentIntent:
          session.payment_intent,

        metadata:
          session.metadata,
      };
    } catch (error) {
      console.error(
        "❌ Stripe Verification Error:",
        error
      );

      throw new Error(
        "Impossible de vérifier le paiement Stripe."
      );
    }
  };

/**
 * ============================================================
 * STRIPE
 * REFUND
 * ============================================================
 */

export const refundStripePayment =
  async ({
    paymentId,
    transactionId,
    amount,
  }: RefundStripeParams) => {
    try {
      if (!stripe) {
        throw new Error(
          "STRIPE_SECRET_KEY n'est pas configurée."
        );
      }

      const payment =
        await prisma.payment.findUnique({
          where: {
            id: paymentId,
          },
        });

      if (!payment) {
        throw new Error(
          "Paiement introuvable."
        );
      }

      /**
       * Stripe refund nécessite normalement
       * un PaymentIntent.
       */
      let paymentIntentId =
        transactionId;

      /**
       * Si transactionId n'est pas un
       * PaymentIntent, chercher dans metadata.
       */
      const metadata =
        payment.metadata as
          | Record<string, unknown>
          | null;

      if (
        metadata?.stripePaymentIntent &&
        typeof metadata
          .stripePaymentIntent ===
          "string"
      ) {
        paymentIntentId =
          metadata.stripePaymentIntent;
      }

      if (!paymentIntentId) {
        throw new Error(
          "PaymentIntent Stripe introuvable."
        );
      }

      const refund =
        await stripe.refunds.create({
          payment_intent:
            paymentIntentId,

          amount:
            convertAmountForStripe(
              amount,
              payment.currency
            ),

          metadata: {
            paymentId,
          },
        });

      return {
        success: true,

        refundId:
          refund.id,

        status:
          refund.status,
      };
    } catch (error) {
      console.error(
        "❌ Stripe Refund Error:",
        error
      );

      throw new Error(
        "Impossible d'effectuer le remboursement Stripe."
      );
    }
  };

/**
 * ============================================================
 * STRIPE
 * WEBHOOK EVENT
 * ============================================================
 *
 * IMPORTANT :
 * Cette fonction doit recevoir le BODY RAW.
 */

export const constructStripeWebhookEvent =
  (
    payload: Buffer,
    signature: string
  ): Stripe.Event => {
    try {
      if (!stripe) {
        throw new Error(
          "STRIPE_SECRET_KEY n'est pas configurée."
        );
      }

      const webhookSecret =
        process.env
          .STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        throw new Error(
          "STRIPE_WEBHOOK_SECRET n'est pas configurée."
        );
      }

      return stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error(
        "❌ Stripe Webhook Signature Error:",
        error
      );

      throw new Error(
        "Signature Stripe invalide."
      );
    }
  };

/**
 * ============================================================
 * CINETPAY
 * CREATE CHECKOUT
 * ============================================================
 */

export const createCinetPayCheckout =
  async ({
    paymentId,
    reference,
    amount,
    currency,
    userId,
    description,
  }: CreateCinetPayCheckoutParams) => {
    try {
      if (!CINETPAY_API_KEY) {
        throw new Error(
          "CINETPAY_API_KEY n'est pas configurée."
        );
      }

      if (!CINETPAY_SITE_ID) {
        throw new Error(
          "CINETPAY_SITE_ID n'est pas configuré."
        );
      }

      /**
       * ------------------------------------------------------
       * Validation paiement
       * ------------------------------------------------------
       */

      const payment =
        await prisma.payment.findUnique({
          where: {
            id: paymentId,
          },
        });

      if (!payment) {
        throw new Error(
          "Paiement BibSaaS introuvable."
        );
      }

      /**
       * ------------------------------------------------------
       * Requête CinetPay
       * ------------------------------------------------------
       */

      const response =
        await fetch(
          CINETPAY_INIT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              apikey:
                CINETPAY_API_KEY,

              site_id:
                CINETPAY_SITE_ID,

              transaction_id:
                reference,

              amount:
                Math.round(amount),

              currency:
                normalizeCurrency(
                  currency
                ),

              description,

              customer_id:
                userId,

              customer_name:
                "BibSaaS Client",

              customer_email:
                payment.userId,

              notify_url:
                CINETPAY_NOTIFY_URL,

              return_url:
                CINETPAY_RETURN_URL,

              channels:
                "ALL",

              metadata:
                JSON.stringify({
                  paymentId,
                  userId,
                  reference,
                }),
            }),
          }
        );

      if (!response.ok) {
        const text =
          await response.text();

        console.error(
          "CinetPay HTTP Error:",
          response.status,
          text
        );

        throw new Error(
          "Erreur HTTP CinetPay."
        );
      }

      const result =
        await response.json();

      /**
       * ------------------------------------------------------
       * Validation réponse CinetPay
       * ------------------------------------------------------
       */

      if (
        result.code !==
          "201" &&
        result.code !==
          201
      ) {
        console.error(
          "CinetPay API Error:",
          result
        );

        throw new Error(
          result.message ||
            "CinetPay a refusé la création du paiement."
        );
      }

      const paymentData =
        result.data;

      const paymentUrl =
        paymentData?.payment_url ||
        paymentData?.paymentUrl;

      const transactionId =
        paymentData?.payment_token ||
        reference;

      if (!paymentUrl) {
        throw new Error(
          "URL de paiement CinetPay absente."
        );
      }

      /**
       * ------------------------------------------------------
       * Sauvegarde metadata
       * ------------------------------------------------------
       */

      await prisma.payment.update({
        where: {
          id: paymentId,
        },

        data: {
          transactionId,

          metadata: {
            cinetpayTransactionId:
              reference,

            cinetpayPaymentToken:
              paymentData?.payment_token ||
              null,

            reference,

            paymentId,
          },
        },
      });

      return {
        success: true,

        paymentUrl,

        transactionId,

        paymentToken:
          paymentData?.payment_token ||
          null,
      };
    } catch (error) {
      console.error(
        "❌ CinetPay Checkout Error:",
        error
      );

      throw new Error(
        "Impossible de créer le paiement CinetPay."
      );
    }
  };

/**
 * ============================================================
 * CINETPAY
 * VERIFY PAYMENT
 * ============================================================
 */

export const verifyCinetPayPayment =
  async (
    transactionId: string
  ) => {
    try {
      if (!CINETPAY_API_KEY) {
        throw new Error(
          "CINETPAY_API_KEY n'est pas configurée."
        );
      }

      if (!CINETPAY_SITE_ID) {
        throw new Error(
          "CINETPAY_SITE_ID n'est pas configuré."
        );
      }

      const response =
        await fetch(
          CINETPAY_CHECK_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              apikey:
                CINETPAY_API_KEY,

              site_id:
                CINETPAY_SITE_ID,

              transaction_id:
                transactionId,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          `CinetPay HTTP ${response.status}`
        );
      }

      const result =
        await response.json();

      /**
       * CinetPay retourne notamment
       * un statut de transaction.
       *
       * Le statut final doit être vérifié
       * côté serveur.
       */

      const data =
        result.data || {};

      const status =
        String(
          data.status ||
            result.status ||
            ""
        ).toUpperCase();

      const success =
        status === "ACCEPTED" ||
        status === "SUCCESS";

      return {
        success,

        status,

        transactionId,

        data: result,
      };
    } catch (error) {
      console.error(
        "❌ CinetPay Verification Error:",
        error
      );

      throw new Error(
        "Impossible de vérifier le paiement CinetPay."
      );
    }
  };

/**
 * ============================================================
 * CINETPAY
 * PAYMENT STATUS
 * ============================================================
 */

export const getCinetPayPaymentStatus =
  async (
    transactionId: string
  ) => {
    return verifyCinetPayPayment(
      transactionId
    );
  };

/**
 * ============================================================
 * PROCESS SUCCESSFUL PAYMENT
 * ============================================================
 *
 * Fonction centralisée permettant d'éviter
 * de dupliquer la logique dans Stripe/CinetPay.
 */

export const processSuccessfulPayment =
  async (
    paymentId: string,
    transactionId?: string
  ) => {
    return prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.payment.findUnique({
            where: {
              id: paymentId,
            },
          });

        if (!payment) {
          throw new Error(
            "Paiement introuvable."
          );
        }

        /**
         * Idempotence :
         * ne jamais traiter deux fois
         * le même paiement.
         */
        if (
          payment.status ===
          "SUCCESS"
        ) {
          return payment;
        }

        const updatedPayment =
          await tx.payment.update({
            where: {
              id: paymentId,
            },

            data: {
              status: "SUCCESS",

              paidAt:
                new Date(),

              transactionId:
                transactionId ||
                payment.transactionId,
            },
          });

        /**
         * ----------------------------------------------------
         * ACTIVER ABONNEMENT
         * ----------------------------------------------------
         */

        if (
          payment.subscriptionId
        ) {
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

        /**
         * ----------------------------------------------------
         * CONFIRMER RÉSERVATION
         * ----------------------------------------------------
         */

        if (payment.bookingId) {
          await tx.booking.update({
            where: {
              id:
                payment.bookingId,
            },

            data: {
              status: "CONFIRMED",
            },
          });
        }

        return updatedPayment;
      }
    );
  };

/**
 * ============================================================
 * PROCESS FAILED PAYMENT
 * ============================================================
 */

export const processFailedPayment =
  async (
    paymentId: string
  ) => {
    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
      });

    if (!payment) {
      throw new Error(
        "Paiement introuvable."
      );
    }

    if (
      payment.status ===
      "SUCCESS"
    ) {
      return payment;
    }

    return prisma.payment.update({
      where: {
        id: paymentId,
      },

      data: {
        status: "FAILED",
      },
    });
  };

/**
 * ============================================================
 * GET PAYMENT BY REFERENCE
 * ============================================================
 */

export const getPaymentByReference =
  async (
    reference: string
  ) => {
    return prisma.payment.findFirst({
      where: {
        transactionId:
          reference,
      },
    });
  };

/**
 * ============================================================
 * GET PAYMENT STATISTICS
 * ============================================================
 */

export const getPaymentStatistics =
  async () => {
    const [
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      cancelledPayments,
      refundedPayments,
      revenue,
    ] =
      await prisma.$transaction([
        prisma.payment.count(),

        prisma.payment.count({
          where: {
            status: "SUCCESS",
          },
        }),

        prisma.payment.count({
          where: {
            status: "PENDING",
          },
        }),

        prisma.payment.count({
          where: {
            status: "FAILED",
          },
        }),

        prisma.payment.count({
          where: {
            status: "CANCELLED",
          },
        }),

        prisma.payment.count({
          where: {
            status: "REFUNDED",
          },
        }),

        prisma.payment.aggregate({
          where: {
            status: "SUCCESS",
          },

          _sum: {
            amount: true,
          },
        }),
      ]);

    return {
      totalPayments,

      successfulPayments,

      pendingPayments,

      failedPayments,

      cancelledPayments,

      refundedPayments,

      totalRevenue:
        revenue._sum.amount || 0,

      currency: "XAF",
    };
  };