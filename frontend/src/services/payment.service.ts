import { api } from './api';
import { ApiResponse, Payment } from '../types/api';

export interface CreatePaymentPayload {
  subscriptionId?: string;
  invoiceId?: string;
  bookingId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  phone?: string;
  country?: string;
  description?: string;
}

export interface PaymentInitResult {
  payment: Payment;
  paymentUrl?: string;
  checkoutUrl?: string;
}

export const paymentService = {
  async createPayment(payload: CreatePaymentPayload): Promise<PaymentInitResult> {
    const response = await api.post<ApiResponse<PaymentInitResult>>('/payments', payload);
    return response.data.data!;
  },

  async getPayment(id: string): Promise<Payment> {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data.data!;
  },

  async verifyPayment(id: string): Promise<Payment> {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}/verify`);
    return response.data.data!;
  },

  async initializeCinetPay(payload: {
    amount: number;
    currency: string;
    description: string;
    customerName?: string;
    customerEmail?: string;
    customerPhoneNumber?: string;
  }): Promise<{ paymentUrl: string; transactionId: string }> {
    const response = await api.post<ApiResponse<{ paymentUrl: string; transactionId: string }>>(
      '/payments/cinetpay/initialize',
      payload
    );
    return response.data.data!;
  },
};
