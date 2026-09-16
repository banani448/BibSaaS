import axios from 'axios';
import { PaymentStatus } from '@prisma/client';

interface FlutterwavePaymentPayload {
  amount: number;
  currency: string;
  email: string;
  phoneNumber?: string;
  customerName?: string;
  txRef: string;
  redirectUrl?: string;
}

class FlutterwaveService {
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || '';

    this.baseUrl =
      process.env.FLUTTERWAVE_BASE_URL ||
      'https://api.flutterwave.com/v3';
  }

  /**
   * ==================================================
   * CREATE PAYMENT LINK
   * ==================================================
   */
  async createPayment(
    payload: FlutterwavePaymentPayload,
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref: payload.txRef,
          amount: payload.amount,
          currency: payload.currency,

          redirect_url:
            payload.redirectUrl ||
            process.env.PAYMENT_SUCCESS_URL,

          customer: {
            email: payload.email,
            phonenumber: payload.phoneNumber,
            name: payload.customerName,
          },

          customizations: {
            title: 'BibSaaS Premium',
            description:
              'Subscription Payment',
            logo: process.env.APP_LOGO_URL,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error(
        'Flutterwave create payment error',
        error.response?.data || error.message,
      );

      throw error;
    }
  }

  /**
   * ==================================================
   * VERIFY PAYMENT
   * ==================================================
   */
  async verifyPayment(
    transactionId: string,
  ) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error(
        'Flutterwave verify payment error',
        error.response?.data || error.message,
      );

      throw error;
    }
  }

  /**
   * ==================================================
   * CHECK PAYMENT STATUS
   * ==================================================
   */
  async getPaymentStatus(
    transactionId: string,
  ): Promise<PaymentStatus> {
    const payment =
      await this.verifyPayment(transactionId);

    const status =
      payment?.data?.status?.toLowerCase();

    switch (status) {
      case 'successful':
        return PaymentStatus.SUCCESS;

      case 'failed':
        return PaymentStatus.FAILED;

      case 'cancelled':
        return PaymentStatus.CANCELLED;

      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * ==================================================
   * REFUND PAYMENT
   * ==================================================
   */
  async refundPayment(
    transactionId: string,
    amount?: number,
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transactions/${transactionId}/refund`,
        {
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error(
        'Flutterwave refund error',
        error.response?.data || error.message,
      );

      throw error;
    }
  }

  /**
   * ==================================================
   * MOBILE MONEY
   * ==================================================
   */
  async mobileMoneyPayment(
    amount: number,
    phoneNumber: string,
    email: string,
    txRef: string,
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/charges?type=mobile_money_franco`,
        {
          tx_ref: txRef,
          amount,
          currency: 'XAF',

          email,
          phone_number: phoneNumber,

          fullname: 'BibSaaS User',
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error(
        error.response?.data || error.message,
      );

      throw error;
    }
  }

  /**
   * ==================================================
   * WEBHOOK SIGNATURE
   * ==================================================
   */
  verifyWebhookSignature(
    signature?: string,
  ): boolean {
    if (!signature) {
      return false;
    }

    return (
      signature ===
      process.env.FLUTTERWAVE_WEBHOOK_HASH
    );
  }
}

export const flutterwaveService =
  new FlutterwaveService();

export default flutterwaveService;