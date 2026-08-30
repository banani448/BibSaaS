import { randomUUID } from 'crypto';

interface InitiatePaymentParams {
  payment: any;
}

interface WebhookParams {
  body: any;
}

interface PaymentResult {
  status: string;
  providerPaymentId?: string;
  providerTransactionId?: string;
  providerStatus?: string;
  instructions?: string;
}

interface WebhookResult {
  providerTransactionId?: string;
  providerEventId?: string;
  transactionReference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  providerStatus?: string;
  payload?: any;
}

class SimulatedProvider {
  async initiatePayment({ payment }: InitiatePaymentParams): Promise<PaymentResult> {
    return {
      status: 'PROCESSING',
      providerPaymentId: `sim_${payment.id}`,
      providerTransactionId: `sim_tx_${randomUUID()}`,
      providerStatus: 'SIMULATED_PENDING',
      instructions: 'Paiement simulé. Utilisez /api/payments/simulated pour confirmer le paiement.',
    };
  }

  async verifyPayment(payment: any): Promise<PaymentResult> {
    return {
      status: payment.status,
      providerStatus: payment.providerStatus,
    };
  }

  async handleWebhook({ body }: WebhookParams): Promise<WebhookResult> {
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

  async simulate({ payment, success }: { payment: any; success: boolean }): Promise<WebhookResult> {
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
