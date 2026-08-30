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

class AirtelProvider {
  private enabled: boolean;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.enabled = config.AIRTEL_ENABLED !== 'false';
    this.baseUrl = config.AIRTEL_BASE_URL;
    this.clientId = config.AIRTEL_CLIENT_ID;
    this.clientSecret = config.AIRTEL_CLIENT_SECRET;
  }

  private ensureConfigured() {
    if (!this.enabled) {
      throw new Error('Airtel Money is disabled');
    }

    if (!this.baseUrl) {
      throw new Error('AIRTEL_BASE_URL is not configured');
    }

    if (!this.clientId) {
      throw new Error('AIRTEL_CLIENT_ID is not configured');
    }

    if (!this.clientSecret) {
      throw new Error('AIRTEL_CLIENT_SECRET is not configured');
    }
  }

  private async getAccessToken(): Promise<string> {
    this.ensureConfigured();

    const response = await axios.post(
      `${this.baseUrl}/auth/oauth2/token`,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      },
      {
        timeout: 30000,
      }
    );

    return response.data.access_token;
  }

  async initiatePayment({
    payment,
    amount,
    phone,
    currency,
    idempotencyKey,
  }: InitiatePaymentParams): Promise<PaymentResult> {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.baseUrl}/merchant/v1/payments/`,
      {
        reference: payment.transactionReference,
        subscriber: {
          country: payment.country || 'CG',
          currency,
          msisdn: phone,
        },
        transaction: {
          amount,
          country: payment.country || 'CG',
          currency,
          id: payment.transactionReference,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        timeout: 60000,
      }
    );

    return {
      status: 'PROCESSING',
      providerTransactionId:
        response.data?.data?.transaction?.id || payment.transactionReference,
      providerPaymentId: response.data?.data?.transaction?.id,
      providerStatus: response.data?.status || 'PROCESSING',
      instructions: 'Confirmez la demande sur votre téléphone Airtel Money.',
    };
  }

  async verifyPayment(payment: any): Promise<PaymentResult> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `${this.baseUrl}/standard/v1/payments/${payment.providerTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );

    const providerStatus = String(
      response.data?.data?.transaction?.status || response.data?.status || ''
    ).toUpperCase();

    let status = 'PROCESSING';

    if (providerStatus === 'SUCCESS') {
      status = 'SUCCESS';
    }

    if (providerStatus === 'FAILED' || providerStatus === 'CANCELLED') {
      status = providerStatus === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
    }

    return {
      status,
      providerStatus,
      providerTransactionId: payment.providerTransactionId,
    };
  }

  async handleWebhook({ body, headers }: WebhookParams): Promise<WebhookResult> {
    const transaction = body.transaction || body.data?.transaction || {};

    const providerTransactionId = transaction.id || body.transactionId;

    const transactionReference = transaction.reference || body.reference;

    const providerStatus = String(
      transaction.status || body.status || ''
    ).toUpperCase();

    let status = 'PROCESSING';

    if (providerStatus === 'SUCCESS') {
      status = 'SUCCESS';
    }

    if (providerStatus === 'FAILED' || providerStatus === 'CANCELLED') {
      status = providerStatus === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
    }

    return {
      providerTransactionId,
      providerEventId: body.eventId || providerTransactionId,
      transactionReference,
      status,
      amount: transaction.amount ? Number(transaction.amount) : undefined,
      currency: transaction.currency,
      providerStatus,
      payload: body,
      signatureVerified: Boolean(headers?.['x-signature']),
    };
  }
}

export default AirtelProvider;
