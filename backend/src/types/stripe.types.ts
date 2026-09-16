
import type Stripe from "stripe";

/**
 * ============================================================
 * STRIPE TYPES - BibSaaS
 * ============================================================
 *
 * Types centralisés utilisés par les services, contrôleurs
 * et routes Stripe.
 *
 * IMPORTANT:
 * - Ne pas modifier schema.prisma pour ces types.
 * - Les IDs BibSaaS sont des strings (CUID).
 * - Les montants sont exprimés en XAF côté application.
 * ============================================================
 */

/**
 * Stripe environment
 */
export type StripeEnvironment = "test" | "live";

/**
 * Supported BibSaaS payment methods through Stripe
 */
export type StripePaymentMethod =
  | "CARD"
  | "VISA"
  | "MASTERCARD"
  | "AMERICAN_EXPRESS"
  | "DISCOVER";

/**
 * Stripe payment status used by the application.
 */
export type StripePaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

/**
 * ============================================================
 * CREATE PAYMENT
 * ============================================================
 */

export interface CreateStripePaymentParams {
  userId: string;

  amount: number;

  currency?: string;

  description?: string;

  subscriptionId?: string;

  invoiceId?: string;

  bookingId?: string;

  paymentMethod?: StripePaymentMethod;

  transactionReference?: string;

  idempotencyKey?: string;

  customerEmail?: string;

  customerName?: string;

  phone?: string;

  country?: string;
}

/**
 * ============================================================
 * STRIPE CHECKOUT
 * ============================================================
 */

export interface StripeCheckoutParams {
  amount: number;

  currency: string;

  transactionReference: string;

  customerEmail?: string;

  customerName?: string;

  description?: string;

  successUrl?: string;

  cancelUrl?: string;

  paymentMethod?: StripePaymentMethod;

  metadata?: Record<string, string>;
}

export interface StripeCheckoutResult {
  checkoutUrl: string;

  transactionReference: string;

  providerPaymentId?: string;

  providerCheckoutId?: string;

  providerTransactionId?: string;

  status?: StripePaymentStatus;

  sessionId?: string;
}

/**
 * ============================================================
 * STRIPE PAYMENT LINK
 * ============================================================
 */

export interface StripePaymentLinkConfig {
  weeklyTestUrl?: string;

  monthlyTestUrl?: string;

  weeklyLiveUrl?: string;

  monthlyLiveUrl?: string;
}

/**
 * ============================================================
 * STRIPE WEBHOOK
 * ============================================================
 */

/**
 * Raw Stripe webhook request.
 *
 * Express must keep the request body as Buffer for signature
 * verification.
 */
export interface StripeWebhookRequest {
  rawBody: Buffer;

  signature: string;
}

/**
 * Result returned after processing a Stripe webhook.
 */
export interface StripeWebhookResult {
  received: boolean;

  processed: boolean;

  duplicate?: boolean;

  eventId: string;

  eventType: string;

  paymentId?: string;

  transactionReference?: string;

  status?: StripePaymentStatus;

  message?: string;
}

/**
 * ============================================================
 * STRIPE EVENT
 * ============================================================
 */

export interface StripeEventMetadata {
  paymentId?: string;

  userId?: string;

  subscriptionId?: string;

  invoiceId?: string;

  bookingId?: string;

  transactionReference?: string;

  [key: string]: string | undefined;
}

/**
 * Useful strongly-typed Stripe event aliases.
 */
export type StripeCheckoutSession = Stripe.Checkout.Session;

export type StripePaymentIntent = Stripe.PaymentIntent;

export type StripeCharge = Stripe.Charge;

export type StripeRefund = Stripe.Refund;

export type StripeEvent = Stripe.Event;

/**
 * ============================================================
 * PAYMENT VERIFICATION
 * ============================================================
 */

export interface VerifyStripePaymentParams {
  paymentId: string;

  transactionReference?: string;

  sessionId?: string;

  paymentIntentId?: string;
}

export interface VerifyStripePaymentResult {
  paymentId: string;

  transactionReference: string;

  status: StripePaymentStatus;

  amount: number;

  currency: string;

  providerPaymentId?: string;

  providerTransactionId?: string;

  verified: boolean;

  message?: string;
}

/**
 * ============================================================
 * REFUND
 * ============================================================
 */

export interface StripeRefundParams {
  paymentId: string;

  amount?: number;

  reason?: Stripe.RefundCreateParams.Reason;
}

export interface StripeRefundResult {
  paymentId: string;

  refundId: string;

  amount: number;

  currency: string;

  status: string | null;

  success: boolean;
}

/**
 * ============================================================
 * STRIPE CUSTOMER
 * ============================================================
 */

export interface StripeCustomerParams {
  email?: string;

  name?: string;

  phone?: string;

  metadata?: Record<string, string>;
}

/**
 * ============================================================
 * STRIPE ERROR
 * ============================================================
 */

export interface StripeErrorDetails {
  type?: string;

  code?: string;

  message: string;

  param?: string;

  requestId?: string;

  statusCode?: number;
}

/**
 * Generic helper for safely reading Stripe errors.
 */
export function getStripeErrorDetails(error: unknown): StripeErrorDetails {
  if (error instanceof Error) {
    const stripeError = error as Error & {
      type?: string;
      code?: string;
      param?: string;
      requestId?: string;
      statusCode?: number;
    };

    return {
      type: stripeError.type,
      code: stripeError.code,
      message: stripeError.message,
      param: stripeError.param,
      requestId: stripeError.requestId,
      statusCode: stripeError.statusCode,
    };
  }

  return {
    message: "Unknown Stripe error",
  };
}

/**
 * ============================================================
 * TYPE GUARDS
 * ============================================================
 */

/**
 * Check whether an unknown value is a Stripe event.
 */
export function isStripeEvent(value: unknown): value is Stripe.Event {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<Stripe.Event>;

  return (
    typeof event.id === "string" &&
    typeof event.type === "string" &&
    typeof event.object === "string" &&
    event.object === "event"
  );
}

/**
 * Check whether an event is a Checkout Session event.
 */
export function isStripeCheckoutEvent(
  event: Stripe.Event,
): boolean {
  return (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  );
}

/**
 * Check whether an event is a PaymentIntent event.
 */
export function isStripePaymentIntentEvent(
  event: Stripe.Event,
): boolean {
  return (
    event.type === "payment_intent.succeeded" ||
    event.type === "payment_intent.payment_failed" ||
    event.type === "payment_intent.canceled" ||
    event.type === "payment_intent.processing"
  );
}

/**
 * ============================================================
 * STRIPE EVENT TYPES
 * ============================================================
 */

export type StripeCheckoutEventType =
  | "checkout.session.completed"
  | "checkout.session.async_payment_succeeded"
  | "checkout.session.async_payment_failed"
  | "checkout.session.expired";

export type StripePaymentIntentEventType =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.canceled"
  | "payment_intent.processing";

export type StripeSupportedEventType =
  | StripeCheckoutEventType
  | StripePaymentIntentEventType
  | "charge.refunded"
  | "charge.refund.updated"
  | "refund.created"
  | "refund.updated";
