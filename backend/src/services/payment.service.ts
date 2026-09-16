import crypto from "crypto";

import prisma from "../config/prisma";
import config from "../config/env";

import StripeProvider from "./providers/stripe.provider";
import OpenPayProvider from "./providers/openpay.provider";
import SimulatedProvider from "./providers/simulated.provider";

import {
  Currency,
  PaymentEnvironment,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  PaymentEventType,
} from "@prisma/client";

interface CreatePaymentParams {
  userId: string;

  subscriptionId?: string;

  invoiceId?: string;

  bookingId?: string;

  amount?: number;

  planId?: string;

  paymentMethod: string;

  phone?: string;

  currency?: string;

  country?: string;

  description?: string;

  metadata?: Record<string, any>;
}

interface WebhookParams {
  providerName: string;

  headers?: Record<string, string>;

  body: any;

  rawBody: Buffer;
}

interface ProviderPaymentResult {
  status: string;

  providerPaymentId?: string;

  providerTransactionId?: string;

  providerStatus?: string;

  clientSecret?: string;

  instructions?: string;
}

interface ProviderWebhookResult {
  providerTransactionId?: string;

  providerEventId?: string;

  transactionReference?: string;

  status?: string;

  amount?: number;

  currency?: string;

  providerStatus?: string;

  payload?: any;

  signatureVerified?: boolean;
}

class PaymentService {
  private providers: Record<
    string,
    any
  >;

  constructor() {
    this.providers = {
      SIMULATED:
        new SimulatedProvider(),

      STRIPE:
        new StripeProvider(),

      OPENPAY:
        new OpenPayProvider(),
    };
  }

  // ============================================================
  // PROVIDER
  // ============================================================

  private getProvider(
    provider: PaymentProvider | string
  ): any {
    const instance =
      this.providers[
        String(provider)
      ];

    if (!instance) {
      throw new Error(
        `Unsupported payment provider: ${provider}`
      );
    }

    return instance;
  }

  // ============================================================
  // TRANSACTION REFERENCE
  // ============================================================

  private generateTransactionReference(): string {
    const date =
      new Date();

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    const random =
      crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();

    return `BIB-${year}${month}${day}-${random}`;
  }

  // ============================================================
  // IDEMPOTENCY
  // ============================================================

  private generateIdempotencyKey(): string {
    return `idem_${crypto.randomUUID()}`;
  }

  // ============================================================
  // PAYMENT METHOD NORMALIZATION
  // ============================================================

  private normalizePaymentMethod(
    paymentMethod: string
  ): PaymentMethod {
    const value =
      String(paymentMethod || "")
        .trim()
        .toUpperCase();

    switch (value) {
      case "SIMULATED":
        return PaymentMethod.SIMULATED;

      case "CARD":
        return PaymentMethod.CARD;

      case "VISA":
        return PaymentMethod.VISA;

      case "MASTERCARD":
        return PaymentMethod.MASTERCARD;

      case "AMERICAN_EXPRESS":
        return PaymentMethod.AMERICAN_EXPRESS;

      case "DISCOVER":
        return PaymentMethod.DISCOVER;

      case "MOBILE_MONEY":
      case "MTN_MOBILE_MONEY":
      case "AIRTEL_MONEY":
        return PaymentMethod.MOBILE_MONEY;

      case "BANK_TRANSFER":
        return PaymentMethod.BANK_TRANSFER;

      case "CASH":
        return PaymentMethod.CASH;

      case "WALLET":
        return PaymentMethod.WALLET;

      case "OTHER":
        return PaymentMethod.OTHER;

      default:
        throw new Error(
          `Unsupported payment method: ${paymentMethod}`
        );
    }
  }

  // ============================================================
  // PROVIDER RESOLUTION
  // ============================================================

  private resolveProvider(
    paymentMethod: string
  ): PaymentProvider {
    const value =
      String(paymentMethod || "")
        .trim()
        .toUpperCase();

    switch (value) {
      case "SIMULATED":
        return PaymentProvider.SIMULATED;

      case "MOBILE_MONEY":
      case "MTN_MOBILE_MONEY":
      case "AIRTEL_MONEY":
        return PaymentProvider.OPENPAY;

      case "CARD":
      case "VISA":
      case "MASTERCARD":
      case "AMERICAN_EXPRESS":
      case "DISCOVER":
        return PaymentProvider.STRIPE;

      default:
        throw new Error(
          `Unsupported payment method: ${paymentMethod}`
        );
    }
  }

  // ============================================================
  // CREATE PAYMENT
  // ============================================================

  async createPayment({
    userId,
    subscriptionId,
    invoiceId,
    bookingId,
    amount,
    planId,
    paymentMethod,
    phone,
    currency,
    country,
    description,
    metadata = {},
  }: CreatePaymentParams) {
    if (!userId) {
      throw new Error(
        "userId is required"
      );
    }

    if (!paymentMethod) {
      throw new Error(
        "paymentMethod is required"
      );
    }

    const normalizedMethod =
      this.normalizePaymentMethod(
        paymentMethod
      );

    const providerName =
      this.resolveProvider(
        paymentMethod
      );

    /*
     * Compatibilité avec les anciennes
     * valeurs envoyées par le frontend.
     */
    const legacyMethod =
      String(paymentMethod)
        .trim()
        .toUpperCase();

    const finalMetadata: Record<
      string,
      any
    > = {
      ...metadata,

      ...(bookingId
        ? { bookingId }
        : {}),
    };

    /*
     * Si le frontend utilise encore
     * MTN_MOBILE_MONEY / AIRTEL_MONEY,
     * on peut déterminer automatiquement
     * l'opérateur OpenPay.
     */
    if (
      providerName ===
      PaymentProvider.OPENPAY
    ) {
      if (
        !finalMetadata.operator &&
        !finalMetadata.provider &&
        !finalMetadata.mobileOperator
      ) {
        if (
          legacyMethod ===
          "MTN_MOBILE_MONEY"
        ) {
          finalMetadata.operator =
            "MTN";
        }

        if (
          legacyMethod ===
          "AIRTEL_MONEY"
        ) {
          finalMetadata.operator =
            "AIRTEL";
        }
      }
    }

    // ----------------------------------------------------------
    // PLAN / MONTANT
    // ----------------------------------------------------------

    let resolvedAmount =
      amount !== undefined
        ? Number(amount)
        : undefined;

    let planName =
      "BibSaaS Premium";

    if (planId) {
      const plan =
        await prisma.subscriptionPlan.findUnique(
          {
            where: {
              id: planId,
            },
          }
        );

      if (!plan) {
        throw new Error(
          "Subscription plan not found"
        );
      }

      if (!plan.isActive) {
        throw new Error(
          "Subscription plan is not active"
        );
      }

      planName =
        plan.name;

      if (
        resolvedAmount === undefined
      ) {
        resolvedAmount =
          Number(plan.price);
      }
    }

    /*
     * Si aucun montant n'est envoyé,
     * on tente de récupérer le plan
     * associé à l'abonnement.
     */
    if (
      resolvedAmount === undefined &&
      subscriptionId
    ) {
      const subscription =
        await prisma.subscription.findUnique(
          {
            where: {
              id: subscriptionId,
            },

            include: {
              plan: true,
            },
          }
        );

      if (!subscription) {
        throw new Error(
          "Subscription not found"
        );
      }

      planName =
        subscription.plan.name;

      resolvedAmount =
        Number(
          subscription.plan.price
        );
    }

    if (
      resolvedAmount === undefined
    ) {
      throw new Error(
        "amount or planId/subscriptionId is required"
      );
    }

    if (
      !Number.isFinite(
        resolvedAmount
      ) ||
      resolvedAmount <= 0
    ) {
      throw new Error(
        "Payment amount must be greater than zero"
      );
    }

    if (
      !Number.isInteger(
        resolvedAmount
      )
    ) {
      throw new Error(
        "Payment amount must be an integer"
      );
    }

    // ----------------------------------------------------------
    // CURRENCY
    // ----------------------------------------------------------

    const paymentCurrency =
      String(
        currency || "XAF"
      ).toUpperCase();

    if (
      !Object.values(
        Currency
      ).includes(
        paymentCurrency as Currency
      )
    ) {
      throw new Error(
        `Unsupported currency: ${paymentCurrency}`
      );
    }

    // ----------------------------------------------------------
    // PROVIDER
    // ----------------------------------------------------------

    const provider =
      this.getProvider(
        providerName
      );

    if (
      providerName ===
        PaymentProvider.SIMULATED &&
      config.NODE_ENV ===
        "production"
    ) {
      throw new Error(
        "Simulated payments are disabled in production"
      );
    }

    if (
      providerName ===
        PaymentProvider.OPENPAY &&
      paymentCurrency !== "XAF"
    ) {
      throw new Error(
        "OpenPay payments must use XAF"
      );
    }

    if (
      providerName ===
        PaymentProvider.OPENPAY &&
      resolvedAmount % 5 !== 0
    ) {
      throw new Error(
        "Les paiements OpenPay doivent être des multiples de 5 XAF."
      );
    }

    // ----------------------------------------------------------
    // ENVIRONMENT
    // ----------------------------------------------------------
     
    
    const environment: PaymentEnvironment =
  config.NODE_ENV === "production"
    ? PaymentEnvironment.PRODUCTION
    : providerName === PaymentProvider.OPENPAY
      ? PaymentEnvironment.SANDBOX
      : PaymentEnvironment.TEST;

    // ----------------------------------------------------------
    // REFERENCES
    // ----------------------------------------------------------

    const transactionReference =
      this.generateTransactionReference();

    const idempotencyKey =
      this.generateIdempotencyKey();

    // ----------------------------------------------------------
    // PAYMENT
    // ----------------------------------------------------------

    const payment =
      await prisma.payment.create({
        data: {
          userId,

          subscriptionId:
            subscriptionId || null,

          invoiceId:
            invoiceId || null,

          amount:
            resolvedAmount,

          currency:
            paymentCurrency as Currency,

          provider:
            providerName,

          paymentMethod:
            normalizedMethod,

          environment,

          transactionReference,

          idempotencyKey,

          phone:
            phone || null,

          country:
            country || "CG",

          status:
            PaymentStatus.PENDING,

          description:
            description ||
            finalMetadata.description ||
            `${planName} - BibSaaS`,
        },
      });

    // ----------------------------------------------------------
    // EVENT INITIATED
    // ----------------------------------------------------------

    await prisma.paymentEvent.create({
      data: {
        paymentId:
          payment.id,

        type:
          "INITIATED",

        provider:
          providerName,

        statusBefore:
          null,

        statusAfter:
          PaymentStatus.PENDING,

        amount:
          resolvedAmount,

        currency:
          paymentCurrency as Currency,

        payload:
          finalMetadata,

        processed:
          true,

        processedAt:
          new Date(),
      },
    });

    // ----------------------------------------------------------
    // PROVIDER INITIATION
    // ----------------------------------------------------------

    try {
      const result: ProviderPaymentResult =
        await provider.initiatePayment({
          payment,

          amount:
            resolvedAmount,

          currency:
            paymentCurrency,

          phone,

          idempotencyKey,

          metadata:
            finalMetadata,
        });

      const finalStatus =
        (result.status ||
          PaymentStatus.PROCESSING) as PaymentStatus;

      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          providerPaymentId:
            result.providerPaymentId ||
            null,

          providerTransactionId:
            result.providerTransactionId ||
            null,

          providerStatus:
            result.providerStatus ||
            null,

          status:
            finalStatus,
        },
      });

      return {
        paymentId:
          payment.id,

        transactionReference,

        provider:
          providerName,

        paymentMethod:
          normalizedMethod,

        amount:
          resolvedAmount,

        currency:
          paymentCurrency,

        status:
          finalStatus,

        clientSecret:
          result.clientSecret ||
          null,

        instructions:
          result.instructions ||
          null,
      };
    } catch (error: any) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status:
            PaymentStatus.FAILED,
        },
      });

      await prisma.paymentEvent.create({
        data: {
          paymentId:
            payment.id,

          type:
            "FAILED",

          provider:
            providerName,

          statusBefore:
            PaymentStatus.PENDING,

          statusAfter:
            PaymentStatus.FAILED,

          amount:
            resolvedAmount,

          currency:
            paymentCurrency as Currency,

          errorMessage:
            error?.message ||
            "Payment provider error",

          processed:
            true,

          processedAt:
            new Date(),
        },
      });

      throw error;
    }
  }

  // ============================================================
  // GET PAYMENT
  // ============================================================

  async getPayment(
    paymentId: string,
    userId?: string
  ) {
    if (!paymentId) {
      throw new Error(
        "Payment ID is required"
      );
    }

    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },

        include: {
          events: {
            orderBy: {
              createdAt:
                "desc",
            },
          },

          subscription: true,

          invoice: true,
        },
      });

    if (!payment) {
      throw new Error(
        "Payment not found"
      );
    }

    if (
      userId &&
      payment.userId !== userId
    ) {
      throw new Error(
        "Payment not found"
      );
    }

    return payment;
  }

  // ============================================================
  // MY PAYMENTS
  // ============================================================

  async getMyPayments(
    userId: string,
    page = 1,
    limit = 20
  ) {
    const safePage =
      Math.max(
        1,
        Number(page) || 1
      );

    const safeLimit =
      Math.min(
        100,
        Math.max(
          1,
          Number(limit) || 20
        )
      );

    const skip =
      (safePage - 1) *
      safeLimit;

    const [
      payments,
      total,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          userId,
        },

        orderBy: {
          createdAt:
            "desc",
        },

        skip,

        take:
          safeLimit,

        include: {
          subscription: true,
          invoice: true,
        },
      }),

      prisma.payment.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      payments,

      pagination: {
        page:
          safePage,

        limit:
          safeLimit,

        total,

        totalPages:
          Math.ceil(
            total /
              safeLimit
          ),
      },
    };
  }

  // ============================================================
  // VERIFY PAYMENT
  // ============================================================

  async verifyPayment(
    paymentId: string
  ) {
    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
      });

    if (!payment) {
      throw new Error(
        "Payment not found"
      );
    }

    const provider =
      this.getProvider(
        payment.provider
      );

    const result: ProviderPaymentResult =
      await provider.verifyPayment(
        payment
      );

    if (
      result.status &&
      result.status !==
        payment.status
    ) {
      await this.applyPaymentStatus(
        payment,
        result.status,
        {
          providerTransactionId:
            result.providerTransactionId,

          providerStatus:
            result.providerStatus,

          signatureVerified:
            false,
        }
      );
    }

    return this.getPayment(
      paymentId
    );
  }

  // ============================================================
  // STRIPE WEBHOOK
  // ============================================================

  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string
  ) {
    const provider =
      this.getProvider(
        PaymentProvider.STRIPE
      );

    const result =
      await provider.handleWebhook({
        body: null,

        rawBody,

        headers: {
          "stripe-signature":
            signature,
        },
      });

    if (!result) {
      return {
        ignored: true,
      };
    }

    return this.processWebhookResult(
      PaymentProvider.STRIPE,
      result
    );
  }

  // ============================================================
  // OPENPAY WEBHOOK
  // ============================================================

  async handleOpenPayWebhook(
    body: any
  ) {
    const provider =
      this.getProvider(
        PaymentProvider.OPENPAY
      );

    const result =
      await provider.handleWebhook({
        body,

        rawBody:
          Buffer.from(
            JSON.stringify(
              body || {}
            )
          ),

        headers: {},
      });

    if (!result) {
      throw new Error(
        "Invalid OpenPay webhook"
      );
    }

    return this.processWebhookResult(
      PaymentProvider.OPENPAY,
      result
    );
  }

  // ============================================================
  // GENERIC WEBHOOK
  // ============================================================

  async handleWebhook({
    providerName,
    headers,
    body,
    rawBody,
  }: WebhookParams) {
    const provider =
      this.getProvider(
        providerName
      );

    const result =
      await provider.handleWebhook({
        headers,
        body,
        rawBody,
      });

    if (!result) {
      throw new Error(
        "Invalid webhook"
      );
    }

    return this.processWebhookResult(
      providerName as PaymentProvider,
      result
    );
  }

  // ============================================================
  // PROCESS WEBHOOK
  // ============================================================

  private async processWebhookResult(
    providerName: PaymentProvider,
    webhook: ProviderWebhookResult
  ) {
    const {
      providerTransactionId,
      providerEventId,
      transactionReference,
      status,
      amount,
      currency,
      providerStatus,
      payload,
      signatureVerified,
    } = webhook;

    if (
      !providerTransactionId &&
      !transactionReference
    ) {
      throw new Error(
        "Webhook payment reference is missing"
      );
    }

    let payment: any =
      null;

    if (
      providerTransactionId
    ) {
      payment =
        await prisma.payment.findFirst({
          where: {
            providerTransactionId,
          },
        });
    }

    if (
      !payment &&
      transactionReference
    ) {
      payment =
        await prisma.payment.findFirst({
          where: {
            transactionReference,
          },
        });
    }

    /*
     * OpenPay envoie également notre
     * transactionReference dans metadata.
     */
    if (
      !payment &&
      payload?.metadata?.transactionReference
    ) {
      payment =
        await prisma.payment.findFirst({
          where: {
            transactionReference:
              String(
                payload.metadata
                  .transactionReference
              ),
          },
        });
    }

    if (!payment) {
      throw new Error(
        "Payment associated with webhook not found"
      );
    }

    // ----------------------------------------------------------
    // IDEMPOTENCE
    // ----------------------------------------------------------

    if (providerEventId) {
      const existingEvent =
        await prisma.paymentEvent.findFirst({
          where: {
            providerEventId,
          },
        });

      if (existingEvent) {
        return {
          duplicate: true,

          payment:
            await this.getPayment(
              payment.id
            ),
        };
      }
    }

    // ----------------------------------------------------------
    // AMOUNT VERIFICATION
    // ----------------------------------------------------------

    if (
      amount !== undefined &&
      Number(amount) !==
        Number(payment.amount)
    ) {
      await prisma.paymentEvent.create({
        data: {
          paymentId:
            payment.id,

          type:
            "WEBHOOK_REJECTED",

          provider:
            providerName,

          providerEventId:
            providerEventId ||
            null,

          statusBefore:
            payment.status,

          statusAfter:
            payment.status,

          amount:
            Number(amount),

          currency:
            (currency as Currency) ||
            payment.currency,

          payload:
            payload || {},

          signatureVerified:
            Boolean(
              signatureVerified
            ),

          processed:
            false,

          errorCode:
            "AMOUNT_MISMATCH",

          errorMessage:
            "Webhook amount does not match payment amount",
        },
      });

      throw new Error(
        "Payment amount mismatch"
      );
    }

    // ----------------------------------------------------------
    // SUCCESS ALREADY APPLIED
    // ----------------------------------------------------------

    if (
      payment.status ===
        PaymentStatus.SUCCESS &&
      status ===
        PaymentStatus.SUCCESS
    ) {
      return {
        duplicate: true,

        payment:
          await this.getPayment(
            payment.id
          ),
      };
    }

    // ----------------------------------------------------------
    // APPLY STATUS
    // ----------------------------------------------------------

    await this.applyPaymentStatus(
      payment,
      status ||
        PaymentStatus.PROCESSING,
      {
        providerTransactionId,

        providerEventId,

        providerStatus,

        amount,

        currency,

        payload,

        signatureVerified,
      }
    );

    return {
      duplicate: false,

      payment:
        await this.getPayment(
          payment.id
        ),
    };
  }

  // ============================================================
  // APPLY PAYMENT STATUS
  // ============================================================

  private async applyPaymentStatus(
    payment: any,
    status: string,
    data: any = {}
  ) {
    const normalizedStatus =
      String(status)
        .toUpperCase();

    const validStatuses =
      Object.values(
        PaymentStatus
      );

    if (
      !validStatuses.includes(
        normalizedStatus as PaymentStatus
      )
    ) {
      throw new Error(
        `Invalid payment status: ${status}`
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const current =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },
          });

        if (!current) {
          throw new Error(
            "Payment not found"
          );
        }

        if (
          current.status ===
          PaymentStatus.REFUNDED
        ) {
          return current;
        }

        const finalStatus =
          normalizedStatus as PaymentStatus;

        const updateData: any = {
          status:
            finalStatus,

          providerStatus:
            data.providerStatus ||
            current.providerStatus,

          providerTransactionId:
            data.providerTransactionId ||
            current.providerTransactionId,
        };

        if (
          data.providerEventId
        ) {
          updateData.webhookReceivedAt =
            new Date();

          updateData.webhookProcessedAt =
            new Date();
        }

        if (
          finalStatus ===
          PaymentStatus.SUCCESS
        ) {
          updateData.confirmedAt =
            new Date();
        }

        const updatedPayment =
          await tx.payment.update({
            where: {
              id: current.id,
            },

            data: updateData,
          });

        let eventType: PaymentEventType =
  PaymentEventType.PROCESSING;

if (
  finalStatus ===
  PaymentStatus.SUCCESS
) {
  eventType =
    PaymentEventType.SUCCESS;
}
else if (
  finalStatus ===
  PaymentStatus.FAILED
) {
  eventType =
    PaymentEventType.FAILED;
}
else if (
  finalStatus ===
  PaymentStatus.CANCELLED
) {
  eventType =
    PaymentEventType.CANCELLED;
}
else if (
  finalStatus ===
  PaymentStatus.REFUNDED
) {
  eventType =
    PaymentEventType.REFUNDED;
}
        await tx.paymentEvent.create({
          data: {
            paymentId:
              current.id,

            type:
              eventType,

            provider:
              current.provider,

            providerEventId:
              data.providerEventId ||
              null,

            statusBefore:
              current.status,

            statusAfter:
              finalStatus,

            amount:
              current.amount,

            currency:
              current.currency,

            payload:
              data.payload ||
              {},

            signatureVerified:
              Boolean(
                data.signatureVerified
              ),

            processed:
              true,

            processedAt:
              new Date(),
          },
        });

        // ------------------------------------------------------
        // ACTIVATE SUBSCRIPTION
        // ------------------------------------------------------

        if (
          finalStatus ===
            PaymentStatus.SUCCESS &&
          current.subscriptionId
        ) {
          const subscription =
            await tx.subscription.findUnique({
              where: {
                id:
                  current.subscriptionId,
              },

              include: {
                plan: true,
              },
            });

          if (subscription) {
            const startDate =
              new Date();

            const endDate =
              new Date(
                startDate
              );

            const duration =
              subscription.plan
                .durationDays || 30;

            endDate.setDate(
              endDate.getDate() +
                duration
            );

            await tx.subscription.update({
              where: {
                id:
                  subscription.id,
              },

              data: {
                status:
                  "ACTIVE",

                startDate,

                endDate,
              },
            });
          }
        }

        return updatedPayment;
      }
    );
  }

  // ============================================================
  // CANCEL PAYMENT
  // ============================================================

  async cancelPayment(
    paymentId: string,
    userId: string
  ) {
    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
      });

    if (!payment) {
      throw new Error(
        "Payment not found"
      );
    }

    if (
      payment.userId !== userId
    ) {
      throw new Error(
        "Payment not found"
      );
    }

    if (
      payment.status !==
        PaymentStatus.PENDING &&
      payment.status !==
        PaymentStatus.PROCESSING
    ) {
      throw new Error(
        "Only pending or processing payments can be cancelled"
      );
    }

    return this.applyPaymentStatus(
      payment,
      PaymentStatus.CANCELLED,
      {
        providerStatus:
          "CANCELLED_BY_USER",
      }
    );
  }

  // ============================================================
  // SIMULATE PAYMENT
  // ============================================================

  async simulatePayment(
    paymentId: string,
    success = true
  ) {
    if (
      config.NODE_ENV ===
      "production"
    ) {
      throw new Error(
        "Simulation is disabled in production"
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
        "Payment not found"
      );
    }

    if (
      payment.provider !==
      PaymentProvider.SIMULATED
    ) {
      throw new Error(
        "Payment is not a simulated payment"
      );
    }

    const provider =
      this.getProvider(
        PaymentProvider.SIMULATED
      ) as SimulatedProvider;

    const result: any =
      await provider.simulate({
        payment,
        success,
      });

    await this.applyPaymentStatus(
      payment,
      result.status,
      {
        providerTransactionId:
          result.providerTransactionId,

        providerStatus:
          result.providerStatus,

        payload:
          result.payload,

        signatureVerified:
          true,
      }
    );

    return this.getPayment(
      paymentId
    );
  }

  // ============================================================
  // ADMIN - ALL PAYMENTS
  // ============================================================

  async getAllPayments({
    page = 1,
    limit = 20,
    status,
    provider,
    userId,
    search,
  }: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    provider?: PaymentProvider;
    userId?: string;
    search?: string;
  }) {
    const safePage =
      Math.max(
        1,
        Number(page) || 1
      );

    const safeLimit =
      Math.min(
        100,
        Math.max(
          1,
          Number(limit) || 20
        )
      );

    const skip =
      (safePage - 1) *
      safeLimit;

    const where: any = {};

    if (status) {
      where.status =
        status;
    }

    if (provider) {
      where.provider =
        provider;
    }

    if (userId) {
      where.userId =
        userId;
    }

    if (search) {
      where.OR = [
        {
          transactionReference: {
            contains:
              search,
            mode:
              "insensitive",
          },
        },

        {
          providerTransactionId: {
            contains:
              search,
            mode:
              "insensitive",
          },
        },

        {
          phone: {
            contains:
              search,
            mode:
              "insensitive",
          },
        },

        {
          description: {
            contains:
              search,
            mode:
              "insensitive",
          },
        },
      ];
    }

    const [
      payments,
      total,
    ] = await Promise.all([
      prisma.payment.findMany({
        where,

        orderBy: {
          createdAt:
            "desc",
        },

        skip,

        take:
          safeLimit,

        include: {
          subscription: true,
          invoice: true,
        },
      }),

      prisma.payment.count({
        where,
      }),
    ]);

    return {
      payments,

      pagination: {
        page:
          safePage,

        limit:
          safeLimit,

        total,

        totalPages:
          Math.ceil(
            total /
              safeLimit
          ),
      },
    };
  }

  // ============================================================
  // ADMIN - PAYMENT STATS
  // ============================================================

  async getPaymentStats() {
    const [
      total,
      successful,
      pending,
      processing,
      failed,
      cancelled,
      refunded,
      amount,
    ] = await Promise.all([
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
            PaymentStatus.PROCESSING,
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

      prisma.payment.count({
        where: {
          status:
            PaymentStatus.REFUNDED,
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

    return {
      total,

      successful,

      pending,

      processing,

      failed,

      cancelled,

      refunded,

      totalSuccessfulAmount:
        amount._sum.amount ||
        0,
    };
  }
}

export default new PaymentService();