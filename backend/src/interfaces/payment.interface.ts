
/**
 * ============================================================
 * BibSaaS — Payment Interfaces
 * ============================================================
 *
 * File:
 * interfaces/payment.interface.ts
 *
 * Description:
 * Contrats TypeScript centralisés pour le système de paiement.
 *
 * Providers actifs :
 * - Stripe
 * - SIMULATED (développement uniquement)
 *
 * Fonctionnalités :
 * - Payment initiation
 * - Payment verification
 * - Payment status
 * - Stripe webhooks
 * - Refunds
 * - Idempotency
 * - Multi-currency
 * - Transaction references
 * - Payment metadata
 * - Audit
 * ============================================================
 */

/**
 * ============================================================
 * PROVIDERS
 * ============================================================
 */

export type PaymentProvider =
  | "STRIPE"
  | "SIMULATED";

/**
 * ============================================================
 * PAYMENT STATUS
 * ============================================================
 */

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

/**
 * ============================================================
 * PAYMENT TYPE
 * ============================================================
 */

export type PaymentType =
  | "SUBSCRIPTION"
  | "BOOKING"
  | "INVOICE"
  | "ONE_TIME"
  | "REFUND";

/**
 * ============================================================
 * PAYMENT METHOD
 * ============================================================
 */

export type PaymentMethod =
  | "CARD"
  | "STRIPE"
  | "CASH"
  | "SIMULATED";

/**
 * ============================================================
 * CURRENCIES
 * ============================================================
 */

export type PaymentCurrency =
  | "XAF"
  | "EUR"
  | "USD"
  | "GBP"
  | "CAD";

/**
 * ============================================================
 * CUSTOMER
 * ============================================================
 */

export interface PaymentCustomer {
  id?: string;

  email?: string;

  firstName?: string;

  lastName?: string;

  phone?: string;

  country?: string;

  city?: string;
}

/**
 * ============================================================
 * PAYMENT ITEM
 * ============================================================
 */

export interface PaymentItem {
  id?: string;

  name: string;

  description?: string;

  quantity: number;

  unitPrice: number;

  totalPrice: number;

  currency: PaymentCurrency;
}

/**
 * ============================================================
 * PAYMENT AMOUNT
 * ============================================================
 */

export interface PaymentAmount {
  amount: number;

  currency: PaymentCurrency;

  subtotal?: number;

  tax?: number;

  discount?: number;

  fees?: number;

  total: number;
}

/**
 * ============================================================
 * PAYMENT INITIATION
 * ============================================================
 */

export interface CreatePaymentRequest {
  amount: number;

  currency: PaymentCurrency;

  provider: PaymentProvider;

  method?: PaymentMethod;

  type: PaymentType;

  customer?: PaymentCustomer;

  customerId?: string;

  bookingId?: string;

  subscriptionId?: string;

  invoiceId?: string;

  description?: string;

  items?: PaymentItem[];

  returnUrl?: string;

  cancelUrl?: string;

  callbackUrl?: string;

  metadata?: Record<
    string,
    unknown
  >;

  idempotencyKey?: string;
}

/**
 * ============================================================
 * NORMALIZED PAYMENT PAYLOAD
 * ============================================================
 */

export interface CreatePaymentPayload {
  amount: number;

  currency: PaymentCurrency;

  provider: PaymentProvider;

  method: PaymentMethod;

  type: PaymentType;

  customerId?: string;

  bookingId?: string;

  subscriptionId?: string;

  invoiceId?: string;

  description?: string;

  items?: PaymentItem[];

  returnUrl?: string;

  cancelUrl?: string;

  callbackUrl?: string;

  metadata?: Record<
    string,
    unknown
  >;

  idempotencyKey: string;
}

/**
 * ============================================================
 * PAYMENT
 * ============================================================
 */

export interface Payment {
  id: string;

  transactionId?: string;

  reference: string;

  provider: PaymentProvider;

  method: PaymentMethod;

  type: PaymentType;

  status: PaymentStatus;

  amount: number;

  currency: PaymentCurrency;

  customerId?: string | null;

  bookingId?: string | null;

  subscriptionId?: string | null;

  invoiceId?: string | null;

  /**
   * Stripe PaymentIntent ID,
   * Checkout Session ID ou identifiant
   * de transaction fournisseur.
   */
  providerTransactionId?: string | null;

  /**
   * Stripe Payment Link / Checkout reference.
   */
  providerReference?: string | null;

  description?: string | null;

  metadata?: Record<
    string,
    unknown
  >;

  createdAt: Date | string;

  updatedAt: Date | string;

  processedAt?: Date | string | null;

  expiresAt?: Date | string | null;
}

/**
 * ============================================================
 * PAYMENT DETAILS
 * ============================================================
 */

export interface PaymentDetails
  extends Payment {
  customer?: PaymentCustomer;

  items?: PaymentItem[];

  fees?: PaymentFee[];

  refunds?: PaymentRefund[];
}

/**
 * ============================================================
 * FEES
 * ============================================================
 */

export interface PaymentFee {
  id?: string;

  type:
    | "PROCESSING"
    | "PLATFORM"
    | "PROVIDER"
    | "TAX"
    | "OTHER";

  amount: number;

  currency: PaymentCurrency;

  description?: string;
}

/**
 * ============================================================
 * PAYMENT RESPONSE
 * ============================================================
 */

export interface PaymentResponseData {
  payment: PaymentDetails;

  /**
   * Stripe Payment Link ou Stripe Checkout URL.
   */
  checkoutUrl?: string;

  paymentUrl?: string;

  qrCode?: string;

  instructions?: string;

  expiresAt?: Date | string;
}

/**
 * ============================================================
 * PAYMENT VERIFICATION
 * ============================================================
 */

export interface VerifyPaymentRequest {
  paymentId?: string;

  reference?: string;

  transactionId?: string;

  providerTransactionId?: string;

  provider?: PaymentProvider;
}

export interface VerifyPaymentResult {
  verified: boolean;

  payment?: PaymentDetails;

  status: PaymentStatus;

  providerTransactionId?: string;

  message?: string;
}

/**
 * ============================================================
 * PAYMENT STATUS
 * ============================================================
 */

export interface PaymentStatusResponse {
  paymentId: string;

  reference: string;

  status: PaymentStatus;

  provider: PaymentProvider;

  amount: number;

  currency: PaymentCurrency;

  providerTransactionId?: string | null;

  processedAt?: Date | string | null;

  updatedAt: Date | string;
}

/**
 * ============================================================
 * CARD / STRIPE PAYMENT
 * ============================================================
 */

export interface CardPaymentRequest {
  amount: number;

  currency: PaymentCurrency;

  provider:
    | "STRIPE"
    | "SIMULATED";

  customerId?: string;

  email?: string;

  description?: string;

  successUrl?: string;

  cancelUrl?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface CardPaymentResponse {
  success: boolean;

  paymentId?: string;

  checkoutUrl?: string;

  paymentUrl?: string;

  reference?: string;

  status: PaymentStatus;

  message?: string;
}

/**
 * ============================================================
 * STRIPE PAYMENT LINK
 * ============================================================
 */

export interface StripePaymentLinkData {
  paymentLinkId?: string;

  paymentLinkUrl: string;

  clientReferenceId: string;

  transactionReference: string;

  amount?: number;

  currency?: PaymentCurrency;

  mode?: "payment" | "subscription";

  active?: boolean;
}

/**
 * ============================================================
 * STRIPE CHECKOUT SESSION
 * ============================================================
 */

export interface StripeCheckoutSessionData {
  sessionId: string;

  paymentIntentId?: string | null;

  subscriptionId?: string | null;

  paymentLinkId?: string | null;

  clientReferenceId?: string | null;

  paymentStatus:
    | "paid"
    | "unpaid"
    | "no_payment_required";

  status?:
    | "open"
    | "complete"
    | "expired";

  amountTotal?: number | null;

  currency?: PaymentCurrency | null;

  customerEmail?: string | null;
}

/**
 * ============================================================
 * STRIPE WEBHOOK EVENTS
 * ============================================================
 */

export type StripeWebhookEventType =
  | "checkout.session.completed"
  | "checkout.session.async_payment_succeeded"
  | "checkout.session.async_payment_failed"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.canceled"
  | "charge.refunded"
  | "charge.dispute.created";

/**
 * ============================================================
 * GENERIC PAYMENT WEBHOOK EVENT
 * ============================================================
 */

export type PaymentWebhookEvent =
  | "PAYMENT_CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_EXPIRED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED";

/**
 * ============================================================
 * WEBHOOK REQUEST
 * ============================================================
 */

export interface PaymentWebhookRequest {
  provider: PaymentProvider;

  event: PaymentWebhookEvent;

  /**
   * Identifiant de l'événement Stripe.
   */
  eventId?: string;

  signature?: string;

  timestamp?: string;

  reference?: string;

  transactionId?: string;

  providerTransactionId?: string;

  status: PaymentStatus;

  amount?: number;

  currency?: PaymentCurrency;

  payload: Record<
    string,
    unknown
  >;
}

/**
 * ============================================================
 * STRIPE WEBHOOK REQUEST
 * ============================================================
 */

export interface StripeWebhookRequest {
  eventId: string;

  eventType: StripeWebhookEventType;

  signature: string;

  payload: unknown;
}

/**
 * ============================================================
 * WEBHOOK RESULT
 * ============================================================
 */

export interface PaymentWebhookResult {
  success: boolean;

  processed: boolean;

  paymentId?: string;

  status?: PaymentStatus;

  message?: string;
}

/**
 * ============================================================
 * REFUND
 * ============================================================
 */

export interface CreateRefundRequest {
  paymentId: string;

  amount?: number;

  reason?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface PaymentRefund {
  id: string;

  paymentId: string;

  amount: number;

  currency: PaymentCurrency;

  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED";

  reason?: string | null;

  /**
   * Stripe Refund ID.
   */
  providerRefundId?: string | null;

  createdAt: Date | string;

  processedAt?: Date | string | null;
}

export interface RefundResponseData {
  refund: PaymentRefund;

  payment: PaymentStatusResponse;
}

/**
 * ============================================================
 * PAYMENT QUERY
 * ============================================================
 */

export interface PaymentFilters {
  status?:
    | PaymentStatus
    | PaymentStatus[];

  provider?: PaymentProvider;

  method?: PaymentMethod;

  type?: PaymentType;

  currency?: PaymentCurrency;

  customerId?: string;

  bookingId?: string;

  subscriptionId?: string;

  invoiceId?: string;

  reference?: string;

  startDate?: Date | string;

  endDate?: Date | string;
}

/**
 * ============================================================
 * PAGINATION
 * ============================================================
 */

export interface PaymentPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

/**
 * ============================================================
 * SORTING
 * ============================================================
 */

export type PaymentSortField =
  | "createdAt"
  | "updatedAt"
  | "amount"
  | "status"
  | "processedAt";

export type PaymentSortOrder =
  | "asc"
  | "desc";

export interface PaymentSort {
  field: PaymentSortField;

  order: PaymentSortOrder;
}

/**
 * ============================================================
 * PAYMENT QUERY
 * ============================================================
 */

export interface PaymentQuery {
  page?: number;

  limit?: number;

  filters?: PaymentFilters;

  sort?: PaymentSort;
}

/**
 * ============================================================
 * PAYMENT LIST
 * ============================================================
 */

export interface PaymentListResponseData {
  payments: PaymentDetails[];

  pagination: PaymentPagination;
}

/**
 * ============================================================
 * IDEMPOTENCY
 * ============================================================
 */

export interface PaymentIdempotencyRequest {
  idempotencyKey: string;

  userId?: string;

  payloadHash: string;

  paymentId?: string;

  createdAt?: Date | string;

  expiresAt?: Date | string;
}

/**
 * ============================================================
 * PROVIDER RESPONSE
 * ============================================================
 */

export interface PaymentProviderResponse {
  success: boolean;

  provider: PaymentProvider;

  status: PaymentStatus;

  reference?: string;

  transactionId?: string;

  providerTransactionId?: string;

  providerReference?: string;

  checkoutUrl?: string;

  paymentUrl?: string;

  authorizationUrl?: string;

  message?: string;

  rawResponse?: unknown;
}

/**
 * ============================================================
 * PROVIDER CONFIGURATION
 * ============================================================
 */

export interface PaymentProviderConfig {
  provider: PaymentProvider;

  enabled: boolean;

  environment:
    | "sandbox"
    | "production";

  supportedCurrencies: PaymentCurrency[];

  supportedCountries?: string[];

  timeoutMs?: number;

  retryAttempts?: number;
}

/**
 * ============================================================
 * PAYMENT SECURITY
 * ============================================================
 */

export interface PaymentSecurityContext {
  ipAddress?: string;

  userAgent?: string;

  deviceId?: string;

  riskScore?: number;

  isTrustedDevice?: boolean;

  requiresVerification?: boolean;

  idempotencyKey?: string;
}

/**
 * ============================================================
 * PAYMENT ERROR
 * ============================================================
 */

export type PaymentErrorCode =
  | "PAYMENT_NOT_FOUND"
  | "PAYMENT_ALREADY_PROCESSED"
  | "PAYMENT_ALREADY_REFUNDED"
  | "INVALID_PAYMENT"
  | "INVALID_AMOUNT"
  | "INVALID_CURRENCY"
  | "INVALID_PROVIDER"
  | "PROVIDER_NOT_SUPPORTED"
  | "PROVIDER_UNAVAILABLE"
  | "PAYMENT_FAILED"
  | "PAYMENT_EXPIRED"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_TIMEOUT"
  | "PAYMENT_VERIFICATION_FAILED"
  | "WEBHOOK_INVALID"
  | "WEBHOOK_SIGNATURE_INVALID"
  | "WEBHOOK_ALREADY_PROCESSED"
  | "REFUND_FAILED"
  | "REFUND_NOT_ALLOWED"
  | "INSUFFICIENT_FUNDS"
  | "DUPLICATE_PAYMENT"
  | "IDEMPOTENCY_CONFLICT"
  | "FORBIDDEN";

/**
 * ============================================================
 * PAYMENT ERROR
 * ============================================================
 */

export interface PaymentError {
  code: PaymentErrorCode;

  message: string;

  statusCode: number;

  details?: unknown;

  requestId?: string;
}

/**
 * ============================================================
 * PAYMENT AUDIT
 * ============================================================
 */

export type PaymentAuditAction =
  | "CREATED"
  | "INITIATED"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "VERIFIED"
  | "REFUND_REQUESTED"
  | "REFUNDED"
  | "WEBHOOK_RECEIVED";

export interface PaymentAuditLog {
  id?: string;

  paymentId: string;

  action: PaymentAuditAction;

  actorId?: string;

  provider?: PaymentProvider;

  previousStatus?: PaymentStatus;

  newStatus?: PaymentStatus;

  amount?: number;

  currency?: PaymentCurrency;

  metadata?: Record<
    string,
    unknown
  >;

  ipAddress?: string;

  userAgent?: string;

  createdAt?: Date | string;
}

/**
 * ============================================================
 * PAYMENT STATISTICS
 * ============================================================
 */

export interface PaymentStatistics {
  totalTransactions: number;

  successfulTransactions: number;

  pendingTransactions: number;

  failedTransactions: number;

  refundedTransactions: number;

  totalRevenue: number;

  totalRefunded: number;

  successRate: number;

  failureRate: number;

  currency: PaymentCurrency;

  byProvider?: Partial<
    Record<
      PaymentProvider,
      {
        count: number;

        amount: number;

        successRate: number;
      }
    >
  >;
}

/**
 * ============================================================
 * PAYMENT SERVICE CONTRACT
 * ============================================================
 */

export interface PaymentServiceContract {
  createPayment(
    payload: CreatePaymentPayload
  ): Promise<PaymentResponseData>;

  getPaymentById(
    paymentId: string,
    userId?: string
  ): Promise<PaymentDetails>;

  getPaymentByReference(
    reference: string
  ): Promise<PaymentDetails>;

  listPayments(
    query: PaymentQuery,
    userId?: string
  ): Promise<PaymentListResponseData>;

  verifyPayment(
    payload: VerifyPaymentRequest
  ): Promise<VerifyPaymentResult>;

  getPaymentStatus(
    paymentId: string
  ): Promise<PaymentStatusResponse>;

  refundPayment(
    payload: CreateRefundRequest,
    actorId: string
  ): Promise<RefundResponseData>;

  handleWebhook(
    payload: PaymentWebhookRequest
  ): Promise<PaymentWebhookResult>;
}

/**
 * ============================================================
 * PAYMENT PROVIDER SERVICE CONTRACT
 * ============================================================
 */

export interface PaymentProviderService {
  initiatePayment(
    payload: CreatePaymentPayload
  ): Promise<PaymentProviderResponse>;

  verifyPayment(
    payment: Payment
  ): Promise<PaymentProviderResponse>;

  refundPayment?(
    payment: Payment,
    amount?: number
  ): Promise<PaymentProviderResponse>;

  handleWebhook?(
    payload: unknown,
    signature?: string
  ): Promise<PaymentWebhookRequest>;

  validateWebhookSignature?(
    payload: string | Buffer,
    signature: string
  ): boolean;
}

/**
 * ============================================================
 * TRANSACTION CONTEXT
 * ============================================================
 */

export interface PaymentTransactionContext {
  transactionId: string;

  paymentId?: string;

  userId?: string;

  bookingId?: string;

  subscriptionId?: string;

  createdAt: Date | string;
}

/**
 * ============================================================
 * COMPLETE PAYMENT OPERATION
 * ============================================================
 */

export interface PaymentOperationResult {
  success: boolean;

  payment?: PaymentDetails;

  refund?: PaymentRefund;

  message: string;

  error?: PaymentError;

  transactionId?: string;
}

