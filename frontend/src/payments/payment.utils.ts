import { PaymentMethod, PaymentProviderConfig, PaymentProvider, PaymentFormData } from './payment.types';

export const PAYMENT_PROVIDERS: Record<PaymentProvider, PaymentProviderConfig> = {
  CINETPAY: {
    provider: 'CINETPAY',
    displayName: 'CinetPay',
    icon: '🇨🇲',
    supportedMethods: ['CARD', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'ORANGE_MONEY', 'MOOV_MONEY'],
    requiresPhone: true,
    requiresEmail: true,
  },
  STRIPE: {
    provider: 'STRIPE',
    displayName: 'Stripe',
    icon: '💳',
    supportedMethods: ['CARD'],
    requiresPhone: false,
    requiresEmail: true,
  },
  PAYPAL: {
    provider: 'PAYPAL',
    displayName: 'PayPal',
    icon: '🅿️',
    supportedMethods: ['CARD'],
    requiresPhone: false,
    requiresEmail: true,
  },
  SIMULATED: {
    provider: 'SIMULATED',
    displayName: 'Test (Simulated)',
    icon: '🧪',
    supportedMethods: ['CARD'],
    requiresPhone: false,
    requiresEmail: false,
  },
  MANUAL: {
    provider: 'MANUAL',
    displayName: 'Paiement manuel',
    icon: '📝',
    supportedMethods: ['MANUAL'],
    requiresPhone: true,
    requiresEmail: true,
  },
};

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    CARD: 'Carte bancaire',
    MTN_MOBILE_MONEY: 'MTN Mobile Money',
    AIRTEL_MONEY: 'Airtel Money',
    ORANGE_MONEY: 'Orange Money',
    MOOV_MONEY: 'Moov Money',
    CINETPAY: 'CinetPay',
    STRIPE: 'Stripe',
    PAYPAL: 'PayPal',
    MANUAL: 'Paiement manuel',
  };
  return labels[method] || method;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function validatePaymentForm(data: Partial<PaymentFormData>): string | null {
  if (!data.amount || data.amount <= 0) {
    return 'Le montant doit être supérieur à 0';
  }
  if (!data.currency) {
    return 'La devise est requise';
  }
  if (!data.paymentMethod) {
    return 'Le mode de paiement est requis';
  }
  if (['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'ORANGE_MONEY', 'MOOV_MONEY'].includes(data.paymentMethod) && !data.phone) {
    return 'Le numéro de téléphone est requis pour ce mode de paiement';
  }
  return null;
}
