
// server/src/services/providers/simulated.provider.js

const crypto = require("crypto");

class SimulatedProvider {
  async initiatePayment({
    payment,
  }) {
    return {
      status: "PROCESSING",

      providerPaymentId:
        `sim_${payment.id}`,

      providerTransactionId:
        `sim_tx_${crypto.randomUUID()}`,

      providerStatus:
        "SIMULATED_PENDING",

      instructions:
        "Paiement simulé. Utilisez /api/payments/simulated pour confirmer le paiement.",
    };
  }

  async verifyPayment(payment) {
    return {
      status: payment.status,

      providerStatus:
        payment.providerStatus,
    };
  }

  async handleWebhook({
    body,
  }) {
    return {
      providerTransactionId:
        body.providerTransactionId,

      providerEventId:
        body.eventId,

      transactionReference:
        body.transactionReference,

      status:
        body.status,

      amount:
        body.amount,

      currency:
        body.currency,

      providerStatus:
        body.providerStatus,

      payload:
        body,
    };
  }

  async simulate({
    payment,
    success,
  }) {
    return {
      status:
        success
          ? "SUCCESS"
          : "FAILED",

      providerTransactionId:
        payment.providerTransactionId,

      providerStatus:
        success
          ? "SIMULATED_SUCCESS"
          : "SIMULATED_FAILED",

      payload: {
        simulated: true,

        paymentId:
          payment.id,

        transactionReference:
          payment.transactionReference,
      },
    };
  }
}

module.exports = SimulatedProvider;

