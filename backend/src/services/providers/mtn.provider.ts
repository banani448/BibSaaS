import axios from 'axios';
import config from '../../config/env';

interface InitiatePaymentParams {
  payment: any;
  amount: number;
  phone: string;
  currency: string;
  idempotencyKey: string;
}

interface WebhookParams {
  body: any;
  headers?: Record<string, string>;
}

interface PaymentResult {
  status: string;
  providerTransactionId?: string;
  providerStatus?: string;
  providerPaymentId?: string;
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
  signatureVerified?: boolean;
}

class MtnProvider {
  private enabled: boolean;
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.enabled = config.MTN_ENABLED !== 'false';
    this.baseUrl = config.MTN_BASE_URL;
    this.apiKey = config.MTN_API_KEY;
    this.apiSecret = config.MTN_API_SECRET;
  }

  private ensureConfigured() {
    if (!this.enabled) {
      throw new Error('MTN Mobile Money is disabled');
    }

    if (!this.baseUrl) {
      throw new Error('MTN_BASE_URL is not configured');
    }
  }

  async initiatePayment({
    payment,
    amount,
    phone,
    currency,
    idempotencyKey,
  }: InitiatePaymentParams): Promise<PaymentResult> {
    this.ensureConfigured();

    const response = await axios.post(
      `${this.baseUrl}/collection/v1_0/requesttopay`,
      {
        amount: String(amount),
        currency,
        externalId: payment.transactionReference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phone,
        },
        payerMessage: 'BibSaaS Premium',
        payeeNote: 'Subscription payment',
      },
      {
        headers: {
          'X-Reference-Id': payment.transactionReference,
          'X-Target-Environment':
            config.MTN_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          Authorization: `Bearer ${this.apiSecret}`,
        },
        timeout: 60000,
      }
    );

    return {
      status: 'PROCESSING',
      providerTransactionId: payment.transactionReference,
      providerStatus: String(response.status),
      providerPaymentId: payment.transactionReference,
      instructions: 'Confirmez la demande de paiement sur votre téléphone MTN Mobile Money.',
    };
  }

  async verifyPayment(payment: any): Promise<PaymentResult> {
    this.ensureConfigured();

    const response = await axios.get(
      `${this.baseUrl}/collection/v1_0/requesttopay/${payment.providerTransactionId}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          Authorization: `Bearer ${this.apiSecret}`,
        },
        timeout: 30000,
      }
    );

    const status = String(response.data?.status || '').toUpperCase();

    let normalized = 'PROCESSING';

    if (status === 'SUCCESSFUL') {
      normalized = 'SUCCESS';
    }

    if (status === 'FAILED' || status === 'REJECTED') {
      normalized = 'FAILED';
    }

    return {
      status: normalized,
      providerStatus: status,
      providerTransactionId: payment.providerTransactionId,
    };
  }

  async handleWebhook({ body, headers }: WebhookParams): Promise<WebhookResult> {
    const transactionReference =
      body.externalId || body.transactionReference || body.reference;

    const providerTransactionId =
      body.financialTransactionId || body.providerTransactionId || body.referenceId;

    const providerStatus = String(
      body.status || body.transactionStatus || ''
    ).toUpperCase();

    let status = 'PROCESSING';

    if (providerStatus === 'SUCCESSFUL') {
      status = 'SUCCESS';
    }

    if (providerStatus === 'FAILED' || providerStatus === 'REJECTED') {
      status = 'FAILED';
    }

    return {
      providerTransactionId,
      providerEventId: body.eventId || providerTransactionId,
      transactionReference,
      status,
      amount: body.amount ? Number(body.amount) : undefined,
      currency: body.currency,
      providerStatus,
      payload: body,
      signatureVerified: Boolean(headers?.['x-signature']),
    };
  }
}

export default MtnProvider;
