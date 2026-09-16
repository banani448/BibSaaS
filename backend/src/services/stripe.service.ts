import Stripe from "stripe";
import {
  getStripe,
  getStripeWebhookSecret,
  stripeConfig,
} from "../config/stripe";

// ============================================================
// TYPES
// ============================================================

export interface StripePaymentLink {
  id: string;
  url: string;
  active: boolean;
  livemode: boolean;
}

export interface StripeWebhookResult {
  eventId: string;
  eventType: string;
  status:
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "PROCESSING"
    | "IGNORED";

  providerTransactionId?: string;
  providerPaymentId?: string;

  transactionReference?: string;

  amount?: number;
  currency?: string;

  customerId?: string;
  customerEmail?: string;

  subscriptionId?: string;

  paymentLinkId?: string;

  metadata?: Record<string, string>;

  payload: Stripe.Event;
}

// ============================================================
// SERVICE
// ============================================================

class StripeService {
  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  ensureConfigured(): void {
    if (!stripeConfig.enabled) {
      throw new Error("Stripe est désactivé.");
    }

    getStripe();
  }

  // ==========================================================
  // PAYMENT LINK
  // ==========================================================

  async retrievePaymentLink(
    paymentLinkId: string
  ): Promise<StripePaymentLink> {
    this.ensureConfigured();

    if (!paymentLinkId?.trim()) {
      throw new Error("paymentLinkId est obligatoire.");
    }

    const stripe = getStripe();

    const paymentLink = await stripe.paymentLinks.retrieve(
      paymentLinkId
    );

    return {
      id: paymentLink.id,
      url: paymentLink.url,
      active: paymentLink.active,
      livemode: paymentLink.livemode,
    };
  }

  // ==========================================================
  // PAYMENT INTENT
  // ==========================================================

  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    this.ensureConfigured();

    if (!paymentIntentId?.trim()) {
      throw new Error("paymentIntentId est obligatoire.");
    }

    const stripe = getStripe();

    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  // ==========================================================
  // CHECKOUT SESSION
  // ==========================================================

  async retrieveCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session> {
    this.ensureConfigured();

    if (!sessionId?.trim()) {
      throw new Error("sessionId est obligatoire.");
    }

    const stripe = getStripe();

    return stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "subscription"],
    });
  }

  // ==========================================================
  // WEBHOOK
  // ==========================================================

  constructWebhookEvent(
    rawBody: Buffer | string,
    signature: string
  ): Stripe.Event {
    this.ensureConfigured();

    if (!signature?.trim()) {
      throw new Error("Signature Stripe manquante.");
    }

    const stripe = getStripe();

    const webhookSecret = getStripeWebhookSecret();

    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  }

  // ==========================================================
  // NORMALISATION WEBHOOK
  // ==========================================================

  handleWebhookEvent(
    event: Stripe.Event
  ): StripeWebhookResult {
    const object = event.data.object as Record<string, any>;

    const metadata = this.normalizeMetadata(object.metadata);

    // --------------------------------------------------------
    // CHECKOUT SESSION COMPLETED
    // --------------------------------------------------------

    if (event.type === "checkout.session.completed") {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const paymentStatus = session.payment_status;

      let status:
        | "SUCCESS"
        | "PROCESSING"
        | "FAILED" = "PROCESSING";

      if (paymentStatus === "paid") {
        status = "SUCCESS";
      }

      if (paymentStatus === "unpaid") {
        status = "PROCESSING";
      }

      const paymentIntentId =
        this.extractPaymentIntentId(
          session.payment_intent
        );

      const subscriptionId =
        this.extractSubscriptionId(
          session.subscription
        );

      return {
        eventId: event.id,
        eventType: event.type,
        status,

        providerTransactionId:
          paymentIntentId || session.id,

        providerPaymentId: session.id,

        transactionReference:
          metadata.transactionReference,

        amount: session.amount_total ?? undefined,

        currency: session.currency
          ? session.currency.toUpperCase()
          : undefined,

        customerId: this.extractCustomerId(
          session.customer
        ),

        customerEmail:
          session.customer_details?.email ||
          undefined,

        subscriptionId,

        paymentLinkId:
          this.extractPaymentLinkId(
            session.payment_link
          ),

        metadata,

        payload: event,
      };
    }

    // --------------------------------------------------------
    // PAYMENT INTENT SUCCEEDED
    // --------------------------------------------------------

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      return {
        eventId: event.id,
        eventType: event.type,
        status: "SUCCESS",

        providerTransactionId:
          paymentIntent.id,

        providerPaymentId:
          paymentIntent.id,

        transactionReference:
          metadata.transactionReference,

        amount: paymentIntent.amount,

        currency:
          paymentIntent.currency.toUpperCase(),

        customerId: this.extractCustomerId(
          paymentIntent.customer
        ),

        metadata,

        payload: event,
      };
    }

    // --------------------------------------------------------
    // PAYMENT INTENT FAILED
    // --------------------------------------------------------

    if (
      event.type ===
      "payment_intent.payment_failed"
    ) {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      return {
        eventId: event.id,
        eventType: event.type,
        status: "FAILED",

        providerTransactionId:
          paymentIntent.id,

        providerPaymentId:
          paymentIntent.id,

        transactionReference:
          metadata.transactionReference,

        amount: paymentIntent.amount,

        currency:
          paymentIntent.currency.toUpperCase(),

        customerId: this.extractCustomerId(
          paymentIntent.customer
        ),

        metadata,

        payload: event,
      };
    }

    // --------------------------------------------------------
    // PAYMENT INTENT CANCELED
    // --------------------------------------------------------

    if (
      event.type ===
      "payment_intent.canceled"
    ) {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      return {
        eventId: event.id,
        eventType: event.type,
        status: "CANCELLED",

        providerTransactionId:
          paymentIntent.id,

        providerPaymentId:
          paymentIntent.id,

        transactionReference:
          metadata.transactionReference,

        amount: paymentIntent.amount,

        currency:
          paymentIntent.currency.toUpperCase(),

        customerId: this.extractCustomerId(
          paymentIntent.customer
        ),

        metadata,

        payload: event,
      };
    }

    // --------------------------------------------------------
    // ASYNCHRONOUS PAYMENT SUCCESS
    // --------------------------------------------------------

    if (
      event.type ===
      "checkout.session.async_payment_succeeded"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const paymentIntentId =
        this.extractPaymentIntentId(
          session.payment_intent
        );

      return {
        eventId: event.id,
        eventType: event.type,
        status: "SUCCESS",

        providerTransactionId:
          paymentIntentId || session.id,

        providerPaymentId: session.id,

        transactionReference:
          metadata.transactionReference,

        amount: session.amount_total ?? undefined,

        currency: session.currency
          ? session.currency.toUpperCase()
          : undefined,

        customerId: this.extractCustomerId(
          session.customer
        ),

        customerEmail:
          session.customer_details?.email ||
          undefined,

        subscriptionId:
          this.extractSubscriptionId(
            session.subscription
          ),

        paymentLinkId:
          this.extractPaymentLinkId(
            session.payment_link
          ),

        metadata,

        payload: event,
      };
    }

    // --------------------------------------------------------
    // ASYNCHRONOUS PAYMENT FAILED
    // --------------------------------------------------------

    if (
      event.type ===
      "checkout.session.async_payment_failed"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      return {
        eventId: event.id,
        eventType: event.type,
        status: "FAILED",

        providerTransactionId:
          this.extractPaymentIntentId(
            session.payment_intent
          ) || session.id,

        providerPaymentId: session.id,

        transactionReference:
          metadata.transactionReference,

        amount: session.amount_total ?? undefined,

        currency: session.currency
          ? session.currency.toUpperCase()
          : undefined,

        customerId: this.extractCustomerId(
          session.customer
        ),

        customerEmail:
          session.customer_details?.email ||
          undefined,

        subscriptionId:
          this.extractSubscriptionId(
            session.subscription
          ),

        paymentLinkId:
          this.extractPaymentLinkId(
            session.payment_link
          ),

        metadata,

        payload: event,
      };
    }

    // --------------------------------------------------------
    // OTHER EVENTS
    // --------------------------------------------------------

    return {
      eventId: event.id,
      eventType: event.type,
      status: "IGNORED",
      metadata,
      payload: event,
    };
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  private normalizeMetadata(
    metadata:
      | Stripe.Metadata
      | null
      | undefined
  ): Record<string, string> {
    if (!metadata) {
      return {};
    }

    const result: Record<string, string> = {};

    Object.entries(metadata).forEach(
      ([key, value]) => {
        if (typeof value === "string") {
          result[key] = value;
        }
      }
    );

    return result;
  }

  // ==========================================================
  // PAYMENT INTENT ID
  // ==========================================================

  private extractPaymentIntentId(
    value:
      | string
      | Stripe.PaymentIntent
      | null
      | undefined
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === "string") {
      return value;
    }

    return value.id;
  }

  // ==========================================================
  // SUBSCRIPTION ID
  // ==========================================================

  private extractSubscriptionId(
    value:
      | string
      | Stripe.Subscription
      | null
      | undefined
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === "string") {
      return value;
    }

    return value.id;
  }

  // ==========================================================
  // CUSTOMER ID
  // ==========================================================

  private extractCustomerId(
    value:
      | string
      | Stripe.Customer
      | Stripe.DeletedCustomer
      | null
      | undefined
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === "string") {
      return value;
    }

    return value.id;
  }

  // ==========================================================
  // PAYMENT LINK ID
  // ==========================================================

  private extractPaymentLinkId(
    value:
      | string
      | Stripe.PaymentLink
      | null
      | undefined
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === "string") {
      return value;
    }

    return value.id;
  }
}

// ============================================================
// INSTANCE
// ============================================================

const stripeService = new StripeService();

export default stripeService;