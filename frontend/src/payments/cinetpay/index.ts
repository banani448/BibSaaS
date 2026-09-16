import { paymentService } from '../../services/payment.service';
import { CinetPayConfig, PaymentResult } from '../payment.types';

/**
 * CinetPay payment integration via backend
 * 
 * IMPORTANT: CinetPay API keys are NEVER exposed to the frontend.
 * All CinetPay operations go through the backend API.
 */

export async function initializeCinetPayPayment(config: CinetPayConfig): Promise<PaymentResult> {
  try {
    const result = await paymentService.initializeCinetPay({
      amount: config.amount,
      currency: config.currency,
      description: config.description,
      customerName: config.customerName,
      customerEmail: config.customerEmail,
      customerPhoneNumber: config.customerPhoneNumber,
    });

    return {
      success: true,
      paymentUrl: result.paymentUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize CinetPay payment',
    };
  }
}

export async function checkCinetPayPayment(transactionId: string): Promise<PaymentResult> {
  try {
    const response = await paymentService.getPayment(transactionId);
    
    return {
      success: response.status === 'SUCCESS',
      paymentId: response.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check CinetPay payment',
    };
  }
}
