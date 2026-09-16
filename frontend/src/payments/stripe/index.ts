import { paymentService } from '../../services/payment.service';
import { PaymentFormData, PaymentResult } from '../payment.types';

/**
 * Stripe payment integration via backend
 * 
 * IMPORTANT: Stripe secret keys are NEVER exposed to the frontend.
 * All Stripe operations go through the backend API.
 */

export async function createStripePayment(data: PaymentFormData): Promise<PaymentResult> {
  try {
    const result = await paymentService.createPayment({
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      subscriptionId: data.subscriptionId,
      invoiceId: data.invoiceId,
      bookingId: data.bookingId,
      paymentMethod: 'CARD',
    });

    if (result.paymentUrl || result.checkoutUrl) {
      return {
        success: true,
        paymentId: result.payment.id,
        paymentUrl: result.paymentUrl || result.checkoutUrl,
      };
    }

    return {
      success: false,
      error: 'No payment URL returned from server',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Stripe payment',
    };
  }
}

export async function verifyStripePayment(paymentId: string): Promise<PaymentResult> {
  try {
    const payment = await paymentService.verifyPayment(paymentId);
    
    return {
      success: payment.status === 'SUCCESS',
      paymentId: payment.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify Stripe payment',
    };
  }
}
