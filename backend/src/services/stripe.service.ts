
// server/src/services/providers/stripe.provider.js

const Stripe = require("stripe");

class StripeProvider {
  constructor() {
    this.enabled =
      process.env.STRIPE_ENABLED === "true";

    this.stripe =
      this.enabled &&
      process.env.STRIPE_SECRET_KEY
        ? new Stripe(
            process.env.STRIPE_SECRET_KEY
          )
        : null;
  }

  ensureConfigured() {
    if (!this.enabled) {
      throw new Error(
        "Stripe payments are disabled"
      );
    }

    if (!this.stripe) {
      throw new Error(
        "Stripe is not configured"
      );
    }
  }

  async initiatePayment({
    payment,
    amount,
    currency,
    idempotencyKey,
    metadata = {},
  }) {
    this.ensureConfigured();

    /*
     * Stripe utilise généralement la plus petite
     * unité de la devise.
     *
     * Pour XAF, vérifier les règles de devise
     * du compte Stripe avant production.
     */

    const amountForStripe =
      Number(amount);

    const intent =
      await this.stripe.paymentIntents.create(
        {
          amount:
            amountForStripe,

          currency:
            String(currency).toLowerCase(),

          automatic_payment_methods: {
            enabled: true,
          },

          metadata: {
            bibsaasPaymentId:
              payment.id,

            transactionReference:
              payment.transactionReference,

            ...metadata,
          },

          description:
            payment.description ||
            "BibSaaS Premium",
        },
        {
          idempotencyKey,
        }
      );

    return {
      status:
        intent.status ===
        "succeeded"
          ? "SUCCESS"
          : "PROCESSING",

      providerPaymentId:
        intent.id,

      providerTransactionId:
        intent.id,

      providerStatus:
        intent.status,

      clientSecret:
        intent.client_secret,
    };
  }

  async verifyPayment(payment) {
    this.ensureConfigured();

    if (!payment.providerPaymentId) {
      throw new Error(
        "Stripe payment intent is missing"
      );
    }

    const intent =
      await this.stripe.paymentIntents.retrieve(
        payment.providerPaymentId
      );

    let status = "PROCESSING";

    if (
      intent.status === "succeeded"
    ) {
      status = "SUCCESS";
    }

    if (
      intent.status ===
        "requires_payment_method" ||
      intent.status ===
        "canceled"
    ) {
      status =
        intent.status ===
        "canceled"
          ? "CANCELLED"
          : "FAILED";
    }

    return {
      status,

      providerStatus:
        intent.status,

      providerTransactionId:
        intent.id,
    };
  }

  async handleWebhook({
    body,
    rawBody,
  }) {
    this.ensureConfigured();

    const signature =
      arguments[0].headers?.[
        "stripe-signature"
      ];

    if (!signature) {
      throw new Error(
        "Stripe webhook signature missing"
      );
    }

    if (
      !process.env.STRIPE_WEBHOOK_SECRET
    ) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET is not configured"
      );
    }

    const event =
      this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

    const object =
      event.data.object;

    if (
      event.type ===
      "payment_intent.succeeded"
    ) {
      return {
        providerTransactionId:
          object.id,

        providerEventId:
          event.id,

        status: "SUCCESS",

        amount:
          object.amount,

        currency:
          String(
            object.currency
          ).toUpperCase(),

        providerStatus:
          object.status,

        transactionReference:
          object.metadata
            ?.transactionReference,

        payload:
          event,

        signatureVerified:
          true,
      };
    }

    if (
      event.type ===
      "payment_intent.payment_failed"
    ) {
      return {
        providerTransactionId:
          object.id,

        providerEventId:
          event.id,

        status: "FAILED",

        amount:
          object.amount,

        currency:
          String(
            object.currency
          ).toUpperCase(),

        providerStatus:
          object.status,

        transactionReference:
          object.metadata
            ?.transactionReference,

        payload:
          event,

        signatureVerified:
          true,
      };
    }

    if (
      event.type ===
      "payment_intent.canceled"
    ) {
      return {
        providerTransactionId:
          object.id,

        providerEventId:
          event.id,

        status: "CANCELLED",

        amount:
          object.amount,

        currency:
          String(
            object.currency
          ).toUpperCase(),

        providerStatus:
          object.status,

        transactionReference:
          object.metadata
            ?.transactionReference,

        payload:
          event,

        signatureVerified:
          true,
      };
    }

    return null;
  }
}

module.exports = StripeProvider;

