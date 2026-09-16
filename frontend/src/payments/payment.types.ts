import { PaymentProvider, PaymentStatus, Currency } from '../types/api';

export type { PaymentProvider };

export interface PaymentFormData {
  amount: number;
  currency: Currency;
  description?: string;
  subscriptionId?: string;
  invoiceId?: string;
  bookingId?: string;
  paymentMethod: PaymentMethod;
  phone?: string;
}

export type PaymentMethod = 
  | 'CARD'
  | 'MTN_MOBILE_MONEY'
  | 'AIRTEL_MONEY'
  | 'ORANGE_MONEY'
  | 'MOOV_MONEY'
  | 'CINETPAY'
  | 'STRIPE'
  | 'PAYPAL'
  | 'MANUAL';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface CinetPayConfig {
  amount: number;
  currency: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
}

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  displayName: string;
  icon: string;
  supportedMethods: PaymentMethod[];
  requiresPhone: boolean;
  requiresEmail: boolean;
}
