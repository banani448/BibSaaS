import { randomUUID } from 'crypto';

interface Payment {
  id: string;
  status: string;
  providerStatus: string;
  providerTransactionId: string;
  transactionReference: string;
}

interface WebhookBody {
  providerTransactionId: string;
  eventId: string;
  transactionReference: string;
  status: string;
  amount: number;
  currency: string;
  providerStatus: string;
}

class SimulatedProvider {
  async initiatePayment({ payment }: { payment: Payment }) {
    return {
      status: 'PROCESSING',
      providerPaymentId: `sim_${payment.id}`,
      providerTransactionId: `sim_tx_${randomUUID()}`,
      providerStatus: 'SIMULATED_PENDING',
      instructions: 'Paiement simulé. Utilisez /api/payments/simulated pour confirmer le paiement.',
    };
  }

  async verifyPayment(payment: Payment) {
    return {
      status: payment.status,
      providerStatus: payment.providerStatus,
    };
  }

  async handleWebhook({ body }: { body: WebhookBody }) {
    return {
      providerTransactionId: body.providerTransactionId,
      providerEventId: body.eventId,
      transactionReference: body.transactionReference,
      status: body.status,
      amount: body.amount,
      currency: body.currency,
      providerStatus: body.providerStatus,
      payload: body,
    };
  }

  async simulate({ payment, success }: { payment: Payment; success: boolean }) {
    return {
      status: success ? 'SUCCESS' : 'FAILED',
      providerTransactionId: payment.providerTransactionId,
      providerStatus: success ? 'SIMULATED_SUCCESS' : 'SIMULATED_FAILED',
      payload: {
        simulated: true,
        paymentId: payment.id,
        transactionReference: payment.transactionReference,
      },
    };
  }
}

export default SimulatedProvider;
