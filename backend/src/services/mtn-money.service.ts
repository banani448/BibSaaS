
// server/src/services/providers/mtn.provider.js

const axios = require("axios");

class MtnProvider {
  constructor() {
    this.enabled =
      process.env.MTN_ENABLED !== "false";

    this.baseUrl =
      process.env.MTN_BASE_URL;

    this.apiKey =
      process.env.MTN_API_KEY;

    this.apiSecret =
      process.env.MTN_API_SECRET;
  }

  ensureConfigured() {
    if (!this.enabled) {
      throw new Error(
        "MTN Mobile Money is disabled"
      );
    }

    if (!this.baseUrl) {
      throw new Error(
        "MTN_BASE_URL is not configured"
      );
    }
  }

  async initiatePayment({
    payment,
    amount,
    phone,
    currency,
    idempotencyKey,
  }) {
    this.ensureConfigured();

    /*
     * Adapter cette partie au contrat officiel
     * MTN MoMo utilisé pour le compte BibSaaS.
     */

    const response =
      await axios.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        {
          amount: String(amount),

          currency,

          externalId:
            payment.transactionReference,

          payer: {
            partyIdType:
              "MSISDN",

            partyId:
              phone,
          },

          payerMessage:
            "BibSaaS Premium",

          payeeNote:
            "Subscription payment",
        },
        {
          headers: {
            "X-Reference-Id":
              payment.transactionReference,

            "X-Target-Environment":
              process.env.MTN_ENVIRONMENT ===
              "production"
                ? "production"
                : "sandbox",

            "Ocp-Apim-Subscription-Key":
              this.apiKey,

            "Content-Type":
              "application/json",

            "X-Idempotency-Key":
              idempotencyKey,

            Authorization:
              `Bearer ${this.apiSecret}`,
          },

          timeout: 60000,
        }
      );

    return {
      status: "PROCESSING",

      providerTransactionId:
        payment.transactionReference,

      providerStatus:
        response.status,

      providerPaymentId:
        payment.transactionReference,

      instructions:
        "Confirmez la demande de paiement sur votre téléphone MTN Mobile Money.",
    };
  }

  async verifyPayment(payment) {
    this.ensureConfigured();

    const response =
      await axios.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${payment.providerTransactionId}`,
        {
          headers: {
            "Ocp-Apim-Subscription-Key":
              this.apiKey,

            Authorization:
              `Bearer ${this.apiSecret}`,
          },

          timeout: 30000,
        }
      );

    const status =
      String(
        response.data?.status || ""
      ).toUpperCase();

    let normalized =
      "PROCESSING";

    if (status === "SUCCESSFUL") {
      normalized = "SUCCESS";
    }

    if (
      status === "FAILED" ||
      status === "REJECTED"
    ) {
      normalized = "FAILED";
    }

    return {
      status: normalized,

      providerStatus:
        status,

      providerTransactionId:
        payment.providerTransactionId,
    };
  }

  async handleWebhook({
    body,
    headers,
  }) {
    /*
     * Adapter la vérification de signature
     * au produit MTN réellement utilisé.
     */

    const transactionReference =
      body.externalId ||
      body.transactionReference ||
      body.reference;

    const providerTransactionId =
      body.financialTransactionId ||
      body.providerTransactionId ||
      body.referenceId;

    const providerStatus =
      String(
        body.status ||
        body.transactionStatus ||
        ""
      ).toUpperCase();

    let status =
      "PROCESSING";

    if (
      providerStatus ===
      "SUCCESSFUL"
    ) {
      status = "SUCCESS";
    }

    if (
      providerStatus ===
        "FAILED" ||
      providerStatus ===
        "REJECTED"
    ) {
      status = "FAILED";
    }

    return {
      providerTransactionId,

      providerEventId:
        body.eventId ||
        providerTransactionId,

      transactionReference,

      status,

      amount:
        body.amount
          ? Number(body.amount)
          : undefined,

      currency:
        body.currency,

      providerStatus,

      payload:
        body,

      signatureVerified:
        Boolean(
          headers?.[
            "x-signature"
          ]
        ),
    };
  }
}

module.exports = MtnProvider;
