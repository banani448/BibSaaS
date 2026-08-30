import crypto from 'crypto';
import prisma from '../config/prisma';
import config from '../config/env';
import StripeProvider from './providers/stripe.provider';
import MtnProvider from './providers/mtn.provider';
import AirtelProvider from './providers/airtel.provider';
import SimulatedProvider from './providers/simulated.provider';
import { PaymentProvider, PaymentMethod, PaymentStatus, PaymentEnvironment, Currency } from '@prisma/client';

interface CreatePaymentParams {
  userId: string;
  subscriptionId?: string;
  planId: string;
  paymentMethod: string;
  phone?: string;
  currency?: string;
  country?: string;
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

class PaymentService {
  private providers: Record<string, any>;

  constructor() {
    this.providers = {
      SIMULATED: new SimulatedProvider(),
      STRIPE: new StripeProvider(),
      MTN_MONEY: new MtnProvider(),
      AIRTEL_MONEY: new AirtelProvider(),
    };
  }

  private getProvider(provider: string): any {
    const instance = this.providers[provider];

    if (!instance) {
      throw new Error(`Unsupported payment provider: ${provider}`);
    }

    return instance;
  }

  private generateTransactionReference(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `BIB-${year}${month}${day}-${random}`;
  }

  private generateIdempotencyKey(): string {
    return `idem_${crypto.randomUUID()}`;
  }

  private resolveProvider(paymentMethod: string): PaymentProvider {
    switch (paymentMethod) {
      case 'SIMULATED':
        return PaymentProvider.SIMULATED;
      case 'MTN_MOBILE_MONEY':
        return PaymentProvider.MTN_MOBILE_MONEY;
      case 'AIRTEL_MONEY':
        return PaymentProvider.AIRTEL_MONEY;
      case 'CARD':
      case 'VISA':
      case 'MASTERCARD':
      case 'AMERICAN_EXPRESS':
      case 'DISCOVER':
        return PaymentProvider.STRIPE;
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }

  async createPayment({
    userId,
    subscriptionId,
    planId,
    paymentMethod,
    phone,
    currency,
    country,
    metadata = {},
  }: CreatePaymentParams) {
    if (!userId) throw new Error('userId is required');
    if (!planId) throw new Error('planId is required');
    if (!paymentMethod) throw new Error('paymentMethod is required');

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Subscription plan not found');
    if (!plan.isActive) throw new Error('Subscription plan is not active');

    const amount = Number(plan.price);
    const providerName = this.resolveProvider(paymentMethod);
    const provider = this.getProvider(providerName);
    const paymentCurrency = currency || 'XAF';

    if (providerName === PaymentProvider.SIMULATED && config.NODE_ENV === 'production') {
      throw new Error('Simulated payments are disabled in production');
    }

    const transactionReference = this.generateTransactionReference();
    const idempotencyKey = this.generateIdempotencyKey();

    const payment = await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscriptionId || null,
        amount,
        currency: paymentCurrency as Currency,
        provider: providerName,
        paymentMethod: paymentMethod as PaymentMethod,
        environment:
          config.NODE_ENV === 'production'
            ? PaymentEnvironment.PRODUCTION
            : providerName === PaymentProvider.MTN_MOBILE_MONEY || providerName === PaymentProvider.AIRTEL_MONEY
              ? PaymentEnvironment.SANDBOX
              : PaymentEnvironment.TEST,
        transactionReference,
        idempotencyKey,
        phone: phone || null,
        country: country || 'CG',
        status: PaymentStatus.PENDING,
        description: metadata.description || `BibSaaS subscription - ${plan.name}`,
      },
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: 'INITIATED',
        provider: providerName,
        statusBefore: null,
        statusAfter: PaymentStatus.PENDING,
        amount,
        currency: paymentCurrency as Currency,
        payload: metadata,
        processed: true,
        processedAt: new Date(),
      },
    });

    try {
      const result: ProviderPaymentResult = await provider.initiatePayment({
        payment,
        amount,
        currency: paymentCurrency,
        phone,
        idempotencyKey,
        metadata,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId: result.providerPaymentId || null,
          providerTransactionId: result.providerTransactionId || null,
          providerStatus: result.providerStatus || null,
          status: (result.status as PaymentStatus) || PaymentStatus.PROCESSING,
        },
      });

      return {
        paymentId: payment.id,
        transactionReference,
        provider: providerName,
        paymentMethod,
        amount,
        currency: paymentCurrency,
        status: result.status || PaymentStatus.PROCESSING,
        clientSecret: result.clientSecret || null,
        instructions: result.instructions || null,
      };
    } catch (error: any) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'FAILED',
          provider: providerName,
          statusBefore: PaymentStatus.PENDING,
          statusAfter: PaymentStatus.FAILED,
          amount,
          currency: paymentCurrency as Currency,
          errorMessage: error.message,
          processed: true,
          processedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async getPayment(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        events: { orderBy: { createdAt: 'desc' } },
        subscription: true,
      },
    });
  }

  async verifyPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');

    const provider = this.getProvider(payment.provider);
    const result: ProviderPaymentResult = await provider.verifyPayment(payment);

    if (result.status && result.status !== payment.status) {
      await this.applyPaymentStatus(payment, result.status, result);
    }

    return this.getPayment(paymentId);
  }

  async handleWebhook({ providerName, headers, body, rawBody }: WebhookParams) {
    const provider = this.getProvider(providerName);
    const webhook = await provider.handleWebhook({ headers, body, rawBody });

    if (!webhook) throw new Error('Invalid webhook');

    const {
      providerTransactionId,
      providerEventId,
      transactionReference,
      status,
      amount,
      currency,
      providerStatus,
      payload,
    } = webhook;

    if (!providerTransactionId && !transactionReference) {
      throw new Error('Webhook payment reference is missing');
    }

    let payment = null;
    if (providerTransactionId) {
      payment = await prisma.payment.findUnique({ where: { providerTransactionId } });
    }
    if (!payment && transactionReference) {
      payment = await prisma.payment.findUnique({ where: { transactionReference } });
    }

    if (!payment) throw new Error('Payment associated with webhook not found');

    // Idempotence
    if (providerEventId) {
      const existingEvent = await prisma.paymentEvent.findFirst({
        where: { providerEventId },
      });
      if (existingEvent) {
        return { duplicate: true, payment: await this.getPayment(payment.id) };
      }
    }

    // Amount verification
    if (amount !== undefined && Number(amount) !== Number(payment.amount)) {
      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'WEBHOOK_REJECTED',
          provider: providerName as PaymentProvider,
          providerEventId: providerEventId || null,
          statusBefore: payment.status,
          statusAfter: payment.status,
          amount: Number(amount),
          currency: (currency as Currency) || payment.currency,
          payload,
          signatureVerified: true,
          processed: false,
          errorCode: 'AMOUNT_MISMATCH',
          errorMessage: 'Webhook amount does not match payment amount',
        },
      });
      throw new Error('Payment amount mismatch');
    }

    if (payment.status === 'SUCCESS' && status === 'SUCCESS') {
      return { duplicate: true, payment: await this.getPayment(payment.id) };
    }

    await this.applyPaymentStatus(payment, status, {
      providerTransactionId,
      providerEventId,
      providerStatus,
      amount,
      currency,
      payload,
    });

    return { duplicate: false, payment: await this.getPayment(payment.id) };
  }

  private async applyPaymentStatus(payment: any, status: string, data: any = {}) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { id: payment.id } });
      if (!current) throw new Error('Payment not found');
      if (current.status === PaymentStatus.REFUNDED) return current;

      const updateData: any = {
        status: status as PaymentStatus,
        providerStatus: data.providerStatus || current.providerStatus,
        providerTransactionId: data.providerTransactionId || current.providerTransactionId,
        webhookReceivedAt: data.providerEventId ? new Date() : current.webhookReceivedAt,
        webhookProcessedAt: data.providerEventId ? new Date() : current.webhookProcessedAt,
      };

      if (status === 'SUCCESS') {
        updateData.confirmedAt = new Date();
      }

      const updatedPayment = await tx.payment.update({
        where: { id: current.id },
        data: updateData,
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: current.id,
          type:
            status === 'SUCCESS'
              ? 'SUCCESS'
              : status === 'FAILED'
                ? 'FAILED'
                : status === 'CANCELLED'
                  ? 'CANCELLED'
                  : 'PROCESSING',
          provider: current.provider,
          providerEventId: data.providerEventId || null,
          statusBefore: current.status,
          statusAfter: status as PaymentStatus,
          amount: current.amount,
          currency: current.currency,
          payload: data.payload || null,
          signatureVerified: Boolean(data.signatureVerified),
          processed: true,
          processedAt: new Date(),
        },
      });

      // Activate subscription on SUCCESS
      if (status === 'SUCCESS' && current.subscriptionId) {
        const subscription = await tx.subscription.findUnique({
          where: { id: current.subscriptionId },
          include: { plan: true },
        });
        if (subscription) {
          const startDate = new Date();
          const endDate = new Date(startDate);
          const duration = subscription.plan.durationDays || 30;
          endDate.setDate(endDate.getDate() + duration);
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              startDate,
              endDate,
            },
          });
        }
      }

      return updatedPayment;
    });
  }

  async simulatePayment(paymentId: string, success = true) {
    if (config.NODE_ENV === 'production') {
      throw new Error('Simulation is disabled in production');
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.provider !== 'SIMULATED') throw new Error('Payment is not a simulated payment');

    const provider = this.getProvider('SIMULATED') as SimulatedProvider;
    const result: any = await provider.simulate({ payment, success });

    await this.applyPaymentStatus(payment, result.status, {
      providerTransactionId: result.providerTransactionId,
      providerStatus: result.providerStatus,
      payload: result.payload,
      signatureVerified: true,
    });

    return this.getPayment(paymentId);
  }
}

export default new PaymentService();
