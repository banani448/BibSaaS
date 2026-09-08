import Stripe from 'stripe';
import { Payment } from '@prisma/client';
import config from '../../config/env';

interface InitiatePaymentParams {
  payment: Payment;
  amount: number;
  currency: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

interface WebhookParams {
  body: any;
  rawBody: Buffer;
  headers?: Record<string, string>;
}

interface PaymentResult {
  status: string;
  providerPaymentId?: string;
  providerTransactionId?: string;
  providerStatus?: string;
  clientSecret?: string;
}

interface WebhookResult {
  providerTransactionId?: string;
  providerEventId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  providerStatus?: string;
  transactionReference?: string;
  payload?: any;
  signatureVerified?: boolean;
}

class StripeProvider {
  private enabled: boolean;
  private stripe: Stripe | null;

  constructor() {
    this.enabled = config.STRIPE_ENABLED;

    this.stripe =
      this.enabled && config.STRIPE_SECRET_KEY
        ? new Stripe(config.STRIPE_SECRET_KEY)
        : null;
  }

  private ensureConfigured() {
    if (!this.enabled) {
      throw new Error('Stripe payments are disabled');
    }

    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
  }

  async initiatePayment({
    payment,
    amount,
    currency,
    idempotencyKey,
    metadata = {},
  }: InitiatePaymentParams): Promise<PaymentResult> {
    this.ensureConfigured();

    const amountForStripe = Number(amount);

    const intent = await this.stripe!.paymentIntents.create(
      {
        amount: amountForStripe,
        currency: String(currency).toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bibsaasPaymentId: payment.id,
          transactionReference: payment.transactionReference,
          ...metadata,
        },
        description: payment.description || 'BibSaaS Premium',
      },
      {
        idempotencyKey,
      }
    );

    return {
      status: intent.status === 'succeeded' ? 'SUCCESS' : 'PROCESSING',
      providerPaymentId: intent.id,
      providerTransactionId: intent.id,
      providerStatus: intent.status,
      clientSecret: intent.client_secret ?? undefined,
    };
  }

  async verifyPayment(payment: Payment): Promise<PaymentResult> {
    this.ensureConfigured();

    if (!payment.providerPaymentId) {
      throw new Error('Stripe payment intent is missing');
    }

    const intent = await this.stripe!.paymentIntents.retrieve(payment.providerPaymentId);

    let status = 'PROCESSING';

    if (intent.status === 'succeeded') {
      status = 'SUCCESS';
    }

    if (intent.status === 'requires_payment_method' || intent.status === 'canceled') {
      status = intent.status === 'canceled' ? 'CANCELLED' : 'FAILED';
    }

    return {
      status,
      providerStatus: intent.status,
      providerTransactionId: intent.id,
    };
  }

  async handleWebhook({ body, rawBody, headers }: WebhookParams): Promise<WebhookResult | null> {
    this.ensureConfigured();

    const signature = headers?.['stripe-signature'];

    if (!signature) {
      throw new Error('Stripe webhook signature missing');
    }

    if (!config.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const event = this.stripe!.webhooks.constructEvent(
      rawBody,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const object = event.data.object;

      return {
        providerTransactionId: object.id,
        providerEventId: event.id,
        status: 'SUCCESS',
        amount: object.amount,
        currency: String(object.currency).toUpperCase(),
        providerStatus: object.status,
        transactionReference: object.metadata?.transactionReference,
        payload: event,
        signatureVerified: true,
      };
    }

    if (event.type === 'payment_intent.payment_failed') {
      const object = event.data.object;

      return {
        providerTransactionId: object.id,
        providerEventId: event.id,
        status: 'FAILED',
        amount: object.amount,
        currency: String(object.currency).toUpperCase(),
        providerStatus: object.status,
        transactionReference: object.metadata?.transactionReference,
        payload: event,
        signatureVerified: true,
      };
    }

    if (event.type === 'payment_intent.canceled') {
      const object = event.data.object;

      return {
        providerTransactionId: object.id,
        providerEventId: event.id,
        status: 'CANCELLED',
        amount: object.amount,
        currency: String(object.currency).toUpperCase(),
        providerStatus: object.status,
        transactionReference: object.metadata?.transactionReference,
        payload: event,
        signatureVerified: true,
      };
    }

    return null;
  }
}

export default StripeProvider;
