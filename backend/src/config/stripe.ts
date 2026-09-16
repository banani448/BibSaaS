import Stripe from "stripe";

/**
 * Configuration Stripe de BibSaaS
 *
 * IMPORTANT :
 * - Utilise sk_test_... en développement
 * - Utilise sk_live_... en production
 * - Ne jamais exposer STRIPE_SECRET_KEY au frontend
 */

const stripeEnabled =
  process.env.STRIPE_ENABLED === "true";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY?.trim() || "";

const stripeEnvironment =
  (process.env.STRIPE_ENVIRONMENT || "test")
    .trim()
    .toLowerCase();

const stripeApiVersion =
  process.env.STRIPE_API_VERSION?.trim() ||
  "2025-06-30.basil";

const stripe =
  stripeEnabled && stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        apiVersion: stripeApiVersion as Stripe.LatestApiVersion,
      })
    : null;

export const stripeConfig = {
  enabled: stripeEnabled,

  environment:
    stripeEnvironment === "production"
      ? "production"
      : "test",

  secretKeyConfigured:
    Boolean(stripeSecretKey),

  webhookSecretConfigured:
    Boolean(
      process.env.STRIPE_WEBHOOK_SECRET?.trim()
    ),

  clientUrl:
    process.env.CLIENT_URL ||
    "http://localhost:5173",

  successUrl:
    process.env.STRIPE_SUCCESS_URL ||
    "http://localhost:5173/payment/success",

  cancelUrl:
    process.env.STRIPE_CANCEL_URL ||
    "http://localhost:5173/payment/cancel",

  weeklyTestUrl:
    process.env.VITE_STRIPE_WEEKLY_TEST_URL ||
    "",

  weeklyLiveUrl:
    process.env.VITE_STRIPE_WEEKLY_LIVE_URL ||
    "",

  monthlyTestUrl:
    process.env.VITE_STRIPE_MONTHLY_TEST_URL ||
    "",

  monthlyLiveUrl:
    process.env.VITE_STRIPE_MONTHLY_LIVE_URL ||
    "",
};

export function getStripe(): Stripe {
  if (!stripeConfig.enabled) {
    throw new Error("Stripe est désactivé.");
  }

  if (!stripe) {
    throw new Error(
      "Stripe n'est pas configuré. Vérifie STRIPE_SECRET_KEY."
    );
  }

  return stripe;
}

export function getStripeWebhookSecret(): string {
  const secret =
    process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET est manquant."
    );
  }

  return secret;
}

export function isStripeConfigured(): boolean {
  return (
    stripeConfig.enabled &&
    stripeConfig.secretKeyConfigured
  );
}

export default stripe;