import dotenv from "dotenv";

dotenv.config();

/**
 * ============================================================
 * BibSaaS Premium
 * Environment Configuration
 * ============================================================
 */

type NodeEnvironment = "development" | "test" | "production";

type PaymentEnvironment = "test" | "sandbox" | "production";

interface Config {
  
  
  /**
   *
   * ----------------------------------------------------------
   * Application
   * ----------------------------------------------------------
   */
  NODE_ENV: NodeEnvironment;
  PORT: number;
  APP_NAME: string;
  APP_URL: string;
  CLIENT_URL: string;
  API_URL: string;

  /**
   * ----------------------------------------------------------
   * Database
   * ----------------------------------------------------------
   */
  DATABASE_URL: string;
  DIRECT_URL: string;

  /**
   * ----------------------------------------------------------
   * JWT
   * ----------------------------------------------------------
   */
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  JWT_ISSUER: string;

  BCRYPT_SALT_ROUNDS: number;

  JWT_AUDIENCE: string;

  /**
   * ----------------------------------------------------------
   * Super Admin
   * ----------------------------------------------------------
   */
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  SUPER_ADMIN_NAME: string;
  SUPER_ADMIN_ROLE: string;

  /**
   * ----------------------------------------------------------
   * Supabase
   * ----------------------------------------------------------
   */
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  /**
   * ----------------------------------------------------------
   * Supabase Storage
   * ----------------------------------------------------------
   */
  SUPABASE_STORAGE_BUCKET_AVATARS: string;
  SUPABASE_STORAGE_BUCKET_HAIRSTYLES: string;
  SUPABASE_STORAGE_BUCKET_SALONS: string;
  SUPABASE_STORAGE_BUCKET_FACE_ANALYSIS: string;
  SUPABASE_STORAGE_BUCKET_INVOICES: string;
  SUPABASE_STORAGE_BUCKET_DOCUMENTS: string;

  /**
   * ----------------------------------------------------------
   * AI
   * ----------------------------------------------------------
   */
  OPENAI_API_KEY: string;
  AI_MODEL: string;
  AI_MAX_TOKENS: number;
  AI_TEMPERATURE: number;
  AI_ENABLED: boolean;
  FACE_ANALYSIS_ENABLED: boolean;
  HAIRSTYLE_RECOMMENDATION_ENABLED: boolean;
  AI_RECOMMENDATION_ENABLED: boolean;

  AI_MAX_REQUESTS_PER_MINUTE: number;
  AI_MAX_IMAGE_SIZE: number;
  AI_TIMEOUT_MS: number;
  AI_RETRY_ATTEMPTS: number;

  /**
   * ----------------------------------------------------------
   * Payment Core
   * ----------------------------------------------------------
   */
  PAYMENT_ENABLED: boolean;
  PAYMENT_DEFAULT_PROVIDER: string;
  PAYMENT_CURRENCY: string;
  DEFAULT_PAYMENT_CURRENCY: string;
  PAYMENT_COUNTRY: string;

  MULTI_CURRENCY_ENABLED: boolean;
  SUPPORTED_CURRENCIES: string[];
  ALLOW_CURRENCY_CONVERSION: boolean;

  /**
   * ----------------------------------------------------------
   * Payment Providers
   * ----------------------------------------------------------
   */
  PAYMENT_PROVIDER_SIMULATED: boolean;
  PAYMENT_PROVIDER_OPENPAY: boolean;
  PAYMENT_PROVIDER_CARD: boolean;

  /**
   * ----------------------------------------------------------
   * Payment Methods
   * ----------------------------------------------------------
   */
  PAYMENT_METHOD_SIMULATED: boolean;
  PAYMENT_METHOD_MOBILE_MONEY: boolean;
  PAYMENT_METHOD_MTN: boolean;
  PAYMENT_METHOD_AIRTEL: boolean;
  PAYMENT_METHOD_CARD: boolean;
  PAYMENT_METHOD_VISA: boolean;
  PAYMENT_METHOD_MASTERCARD: boolean;
  PAYMENT_METHOD_AMERICAN_EXPRESS: boolean;
  PAYMENT_METHOD_DISCOVER: boolean;

  /**
   * ----------------------------------------------------------
   * Simulated Payment
   * ----------------------------------------------------------
   */
  SIMULATED_PAYMENT_ENABLED: boolean;
  SIMULATED_PAYMENT_SUCCESS_RATE: number;
  SIMULATED_PAYMENT_DELAY_MS: number;
  SIMULATED_PAYMENT_PROVIDER: string;

  /**
   * ----------------------------------------------------------
   * Stripe
   * ----------------------------------------------------------
   */
  STRIPE_ENABLED: boolean;
  STRIPE_ENVIRONMENT: PaymentEnvironment;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_API_VERSION: string;
  STRIPE_CURRENCY: string;

  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  STRIPE_WEBHOOK_URL: string;

  CARD_PAYMENT_ENABLED: boolean;
  CARD_VISA_ENABLED: boolean;
  CARD_MASTERCARD_ENABLED: boolean;
  CARD_AMERICAN_EXPRESS_ENABLED: boolean;
  CARD_DISCOVER_ENABLED: boolean;
  CARD_3DS_ENABLED: boolean;
  CARD_SCA_ENABLED: boolean;

  STRIPE_REQUIRE_WEBHOOK_SIGNATURE: boolean;
  STRIPE_REQUIRE_IDEMPOTENCY: boolean;
  STRIPE_VERIFY_PAYMENT_AMOUNT: boolean;
  STRIPE_VERIFY_PAYMENT_CURRENCY: boolean;
  STRIPE_PAYMENT_TIMEOUT_MS: number;

  /**
   * ----------------------------------------------------------
   * OpenPay
   * ----------------------------------------------------------
   *
   * OpenPay handles:
   * - MTN Mobile Money
   * - Airtel Money
   *
   * No separate MTN/Airtel provider is needed anymore.
   */
  OPENPAY_ENABLED: boolean;
  OPENPAY_ENVIRONMENT: PaymentEnvironment;
  OPENPAY_BASE_URL: string;
  OPENPAY_API_KEY: string;

  OPENPAY_CURRENCY: string;
  OPENPAY_COUNTRY: string;

  OPENPAY_CALLBACK_URL: string;
  OPENPAY_RETURN_URL: string;

  OPENPAY_TIMEOUT_MS: number;

  OPENPAY_VERIFY_AMOUNT: boolean;
  OPENPAY_VERIFY_CURRENCY: boolean;

  /**
   * ----------------------------------------------------------
   * Payment Security
   * ----------------------------------------------------------
   */
  PAYMENT_REQUIRE_WEBHOOK_SIGNATURE: boolean;
  PAYMENT_REQUIRE_IDEMPOTENCY: boolean;
  PAYMENT_VERIFY_WEBHOOK: boolean;
  PAYMENT_VERIFY_AMOUNT: boolean;
  PAYMENT_VERIFY_CURRENCY: boolean;

  PAYMENT_TIMEOUT_MS: number;
  PAYMENT_MAX_RETRIES: number;
  PAYMENT_RETRY_DELAY_MS: number;

  /**
   * ----------------------------------------------------------
   * Webhooks
   * ----------------------------------------------------------
   */
  WEBHOOK_ENABLED: boolean;
  WEBHOOK_TIMEOUT_MS: number;
  WEBHOOK_MAX_RETRIES: number;
  WEBHOOK_RETRY_DELAY_MS: number;
  WEBHOOK_LOG_PAYLOAD: boolean;

  /**
   * ----------------------------------------------------------
   * Subscriptions
   * ----------------------------------------------------------
   */
  SUBSCRIPTION_ENABLED: boolean;

  /**
   * ----------------------------------------------------------
   * Invoice
   * ----------------------------------------------------------
   */
  INVOICE_JOB_ENABLED: boolean;
  INVOICE_JOB_SCHEDULE: string;
  INVOICE_JOB_BATCH_SIZE: number;
  INVOICE_PREFIX: string;
  INVOICE_PAYMENT_GRACE_DAYS: number;
}

/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function getString(
  key: string,
  defaultValue = "",
): string {
  return process.env[key]?.trim() || defaultValue;
}

function getRequiredString(
  key: string,
): string {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}`,
    );
  }

  return value;
}

function getNumber(
  key: string,
  defaultValue: number,
): number {
  const value = Number(process.env[key]);

  return Number.isFinite(value)
    ? value
    : defaultValue;
}

function getBoolean(
  key: string,
  defaultValue: boolean,
): boolean {
  const value = process.env[key];

  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
}

function getArray(
  key: string,
  defaultValue: string[],
): string[] {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPaymentEnvironment(
  key: string,
  defaultValue: PaymentEnvironment,
): PaymentEnvironment {
  const value = process.env[key]?.toLowerCase();

  if (
    value === "test" ||
    value === "sandbox" ||
    value === "production"
  ) {
    return value;
  }

  return defaultValue;
}

/**
 * ============================================================
 * Application
 * ============================================================
 */

const NODE_ENV =
  (getString(
    "NODE_ENV",
    "development",
  ) as NodeEnvironment);

const PORT = getNumber("PORT", 5000);

/**
 * ============================================================
 * Config
 * ============================================================
 */

const config: Config = {
  /**
   * ----------------------------------------------------------
   * Application
   * ----------------------------------------------------------
   */

  NODE_ENV,

  PORT,

  APP_NAME: getString(
    "APP_NAME",
    "BibSaaS",
  ),

  APP_URL: getString(
    "APP_URL",
    "http://localhost:5000",
  ),

  CLIENT_URL: getString(
    "CLIENT_URL",
    "http://localhost:5173",
  ),

  API_URL: getString(
    "API_URL",
    "http://localhost:5000/api",
  ),

  /**
   * ----------------------------------------------------------
   * Database
   * ----------------------------------------------------------
   */

  DATABASE_URL: getRequiredString(
    "DATABASE_URL",
  ),

  DIRECT_URL: getRequiredString(
    "DIRECT_URL",
  ),

  /**
   * ----------------------------------------------------------
   * JWT
   * ----------------------------------------------------------
   */

 JWT_SECRET: getRequiredString(
  "JWT_SECRET",
),

JWT_EXPIRES_IN: getString(
  "JWT_EXPIRES_IN",
  "7d",
),

JWT_REFRESH_SECRET: getRequiredString(
  "JWT_REFRESH_SECRET",
),

JWT_REFRESH_EXPIRES_IN: getString(
  "JWT_REFRESH_EXPIRES_IN",
  "30d",
),

BCRYPT_SALT_ROUNDS: getNumber(
  "BCRYPT_SALT_ROUNDS",
  10,
),

JWT_ISSUER: getString(
  "JWT_ISSUER",
  "BibSaaS",
),

JWT_AUDIENCE: getString(
  "JWT_AUDIENCE",
  "BibSaaS-Users",
),

  /**
   * ----------------------------------------------------------
   * Super Admin
   * ----------------------------------------------------------
   */

  SUPER_ADMIN_EMAIL: getString(
    "SUPER_ADMIN_EMAIL",
    "admin@bibsaas.com",
  ),

  SUPER_ADMIN_PASSWORD: getString(
    "SUPER_ADMIN_PASSWORD",
    "",
  ),

  SUPER_ADMIN_NAME: getString(
    "SUPER_ADMIN_NAME",
    "BibSaaS Super Admin",
  ),

  SUPER_ADMIN_ROLE: getString(
    "SUPER_ADMIN_ROLE",
    "SUPER_ADMIN",
  ),

  /**
   * ----------------------------------------------------------
   * Supabase
   * ----------------------------------------------------------
   */

  SUPABASE_URL: getRequiredString(
    "SUPABASE_URL",
  ),

  SUPABASE_ANON_KEY: getRequiredString(
    "SUPABASE_ANON_KEY",
  ),

  SUPABASE_SERVICE_ROLE_KEY: getString(
    "SUPABASE_SERVICE_ROLE_KEY",
    "",
  ),

  /**
   * ----------------------------------------------------------
   * Storage
   * ----------------------------------------------------------
   */

  SUPABASE_STORAGE_BUCKET_AVATARS:
    getString(
      "SUPABASE_STORAGE_BUCKET_AVATARS",
      "avatars",
    ),

  SUPABASE_STORAGE_BUCKET_HAIRSTYLES:
    getString(
      "SUPABASE_STORAGE_BUCKET_HAIRSTYLES",
      "hairstyles",
    ),

  SUPABASE_STORAGE_BUCKET_SALONS:
    getString(
      "SUPABASE_STORAGE_BUCKET_SALONS",
      "salons",
    ),

  SUPABASE_STORAGE_BUCKET_FACE_ANALYSIS:
    getString(
      "SUPABASE_STORAGE_BUCKET_FACE_ANALYSIS",
      "face-analysis",
    ),

  SUPABASE_STORAGE_BUCKET_INVOICES:
    getString(
      "SUPABASE_STORAGE_BUCKET_INVOICES",
      "invoices",
    ),

  SUPABASE_STORAGE_BUCKET_DOCUMENTS:
    getString(
      "SUPABASE_STORAGE_BUCKET_DOCUMENTS",
      "documents",
    ),

  /**
   * ----------------------------------------------------------
   * AI
   * ----------------------------------------------------------
   */

  OPENAI_API_KEY: getString(
    "OPENAI_API_KEY",
    "",
  ),

  AI_MODEL: getString(
    "AI_MODEL",
    "gpt-5",
  ),

  AI_MAX_TOKENS: getNumber(
    "AI_MAX_TOKENS",
    4000,
  ),

  AI_TEMPERATURE: getNumber(
    "AI_TEMPERATURE",
    0.3,
  ),

  AI_ENABLED: getBoolean(
    "AI_ENABLED",
    true,
  ),

  FACE_ANALYSIS_ENABLED:
    getBoolean(
      "FACE_ANALYSIS_ENABLED",
      true,
    ),

  HAIRSTYLE_RECOMMENDATION_ENABLED:
    getBoolean(
      "HAIRSTYLE_RECOMMENDATION_ENABLED",
      true,
    ),

  AI_RECOMMENDATION_ENABLED:
    getBoolean(
      "AI_RECOMMENDATION_ENABLED",
      true,
    ),

  AI_MAX_REQUESTS_PER_MINUTE:
    getNumber(
      "AI_MAX_REQUESTS_PER_MINUTE",
      30,
    ),

  AI_MAX_IMAGE_SIZE:
    getNumber(
      "AI_MAX_IMAGE_SIZE",
      10 * 1024 * 1024,
    ),

  AI_TIMEOUT_MS:
    getNumber(
      "AI_TIMEOUT_MS",
      60000,
    ),

  AI_RETRY_ATTEMPTS:
    getNumber(
      "AI_RETRY_ATTEMPTS",
      3,
    ),

  /**
   * ----------------------------------------------------------
   * Payment Core
   * ----------------------------------------------------------
   */

  PAYMENT_ENABLED:
    getBoolean(
      "PAYMENT_ENABLED",
      true,
    ),

  PAYMENT_DEFAULT_PROVIDER:
    getString(
      "PAYMENT_DEFAULT_PROVIDER",
      "SIMULATED",
    ),

  PAYMENT_CURRENCY:
    getString(
      "PAYMENT_CURRENCY",
      "XAF",
    ),

  DEFAULT_PAYMENT_CURRENCY:
    getString(
      "DEFAULT_PAYMENT_CURRENCY",
      "XAF",
    ),

  PAYMENT_COUNTRY:
    getString(
      "PAYMENT_COUNTRY",
      "CG",
    ),

  MULTI_CURRENCY_ENABLED:
    getBoolean(
      "MULTI_CURRENCY_ENABLED",
      true,
    ),

  SUPPORTED_CURRENCIES:
    getArray(
      "SUPPORTED_CURRENCIES",
      [
        "XAF",
        "EUR",
        "USD",
        "GBP",
        "CAD",
      ],
    ),

  ALLOW_CURRENCY_CONVERSION:
    getBoolean(
      "ALLOW_CURRENCY_CONVERSION",
      true,
    ),

  /**
   * ----------------------------------------------------------
   * Payment Providers
   * ----------------------------------------------------------
   */

  PAYMENT_PROVIDER_SIMULATED:
    getBoolean(
      "PAYMENT_PROVIDER_SIMULATED",
      true,
    ),

  PAYMENT_PROVIDER_OPENPAY:
    getBoolean(
      "PAYMENT_PROVIDER_OPENPAY",
      true,
    ),

  PAYMENT_PROVIDER_CARD:
    getBoolean(
      "PAYMENT_PROVIDER_CARD",
      true,
    ),

  /**
   * ----------------------------------------------------------
   * Payment Methods
   * ----------------------------------------------------------
   */

  PAYMENT_METHOD_SIMULATED:
    getBoolean(
      "PAYMENT_METHOD_SIMULATED",
      true,
    ),

  PAYMENT_METHOD_MOBILE_MONEY:
    getBoolean(
      "PAYMENT_METHOD_MOBILE_MONEY",
      true,
    ),

  PAYMENT_METHOD_MTN:
    getBoolean(
      "PAYMENT_METHOD_MTN",
      true,
    ),

  PAYMENT_METHOD_AIRTEL:
    getBoolean(
      "PAYMENT_METHOD_AIRTEL",
      true,
    ),

  PAYMENT_METHOD_CARD:
    getBoolean(
      "PAYMENT_METHOD_CARD",
      true,
    ),

  PAYMENT_METHOD_VISA:
    getBoolean(
      "PAYMENT_METHOD_VISA",
      true,
    ),

  PAYMENT_METHOD_MASTERCARD:
    getBoolean(
      "PAYMENT_METHOD_MASTERCARD",
      true,
    ),

  PAYMENT_METHOD_AMERICAN_EXPRESS:
    getBoolean(
      "PAYMENT_METHOD_AMERICAN_EXPRESS",
      true,
    ),

  PAYMENT_METHOD_DISCOVER:
    getBoolean(
      "PAYMENT_METHOD_DISCOVER",
      true,
    ),

  /**
   * ----------------------------------------------------------
   * Simulated Payment
   * ----------------------------------------------------------
   */

  SIMULATED_PAYMENT_ENABLED:
    getBoolean(
      "SIMULATED_PAYMENT_ENABLED",
      true,
    ),

  SIMULATED_PAYMENT_SUCCESS_RATE:
    getNumber(
      "SIMULATED_PAYMENT_SUCCESS_RATE",
      100,
    ),

  SIMULATED_PAYMENT_DELAY_MS:
    getNumber(
      "SIMULATED_PAYMENT_DELAY_MS",
      1000,
    ),

  SIMULATED_PAYMENT_PROVIDER:
    getString(
      "SIMULATED_PAYMENT_PROVIDER",
      "SIMULATED",
    ),

  /**
   * ----------------------------------------------------------
   * Stripe
   * ----------------------------------------------------------
   */

  STRIPE_ENABLED:
    getBoolean(
      "STRIPE_ENABLED",
      true,
    ),

  STRIPE_ENVIRONMENT:
    getPaymentEnvironment(
      "STRIPE_ENVIRONMENT",
      "test",
    ),

  STRIPE_SECRET_KEY:
    getString(
      "STRIPE_SECRET_KEY",
      "",
    ),

  STRIPE_PUBLISHABLE_KEY:
    getString(
      "STRIPE_PUBLISHABLE_KEY",
      "",
    ),

  STRIPE_WEBHOOK_SECRET:
    getString(
      "STRIPE_WEBHOOK_SECRET",
      "",
    ),

  STRIPE_API_VERSION:
    getString(
      "STRIPE_API_VERSION",
      "",
    ),

  STRIPE_CURRENCY:
    getString(
      "STRIPE_CURRENCY",
      "XAF",
    ),

  STRIPE_SUCCESS_URL:
    getString(
      "STRIPE_SUCCESS_URL",
      "http://localhost:5173/payment/success",
    ),

  STRIPE_CANCEL_URL:
    getString(
      "STRIPE_CANCEL_URL",
      "http://localhost:5173/payment/cancel",
    ),

  STRIPE_WEBHOOK_URL:
    getString(
      "STRIPE_WEBHOOK_URL",
      "http://localhost:5000/api/payments/webhooks/stripe",
    ),

  CARD_PAYMENT_ENABLED:
    getBoolean(
      "CARD_PAYMENT_ENABLED",
      true,
    ),

  CARD_VISA_ENABLED:
    getBoolean(
      "CARD_VISA_ENABLED",
      true,
    ),

  CARD_MASTERCARD_ENABLED:
    getBoolean(
      "CARD_MASTERCARD_ENABLED",
      true,
    ),

  CARD_AMERICAN_EXPRESS_ENABLED:
    getBoolean(
      "CARD_AMERICAN_EXPRESS_ENABLED",
      true,
    ),

  CARD_DISCOVER_ENABLED:
    getBoolean(
      "CARD_DISCOVER_ENABLED",
      true,
    ),

  CARD_3DS_ENABLED:
    getBoolean(
      "CARD_3DS_ENABLED",
      true,
    ),

  CARD_SCA_ENABLED:
    getBoolean(
      "CARD_SCA_ENABLED",
      true,
    ),

  STRIPE_REQUIRE_WEBHOOK_SIGNATURE:
    getBoolean(
      "STRIPE_REQUIRE_WEBHOOK_SIGNATURE",
      true,
    ),

  STRIPE_REQUIRE_IDEMPOTENCY:
    getBoolean(
      "STRIPE_REQUIRE_IDEMPOTENCY",
      true,
    ),

  STRIPE_VERIFY_PAYMENT_AMOUNT:
    getBoolean(
      "STRIPE_VERIFY_PAYMENT_AMOUNT",
      true,
    ),

  STRIPE_VERIFY_PAYMENT_CURRENCY:
    getBoolean(
      "STRIPE_VERIFY_PAYMENT_CURRENCY",
      true,
    ),

  STRIPE_PAYMENT_TIMEOUT_MS:
    getNumber(
      "STRIPE_PAYMENT_TIMEOUT_MS",
      60000,
    ),

  /**
   * ----------------------------------------------------------
   * OpenPay
   * ----------------------------------------------------------
   *
   * OpenPay replaces:
   *
   * - MTN provider
   * - Airtel provider
   *
   * OpenPay supports MTN and Airtel Money.
   */

  OPENPAY_ENABLED:
    getBoolean(
      "OPENPAY_ENABLED",
      true,
    ),

  OPENPAY_ENVIRONMENT:
    getPaymentEnvironment(
      "OPENPAY_ENVIRONMENT",
      NODE_ENV === "production"
        ? "production"
        : "sandbox",
    ),

  OPENPAY_BASE_URL:
    getString(
      "OPENPAY_BASE_URL",
      "https://api.openpay-cg.com",
    ),

  OPENPAY_API_KEY:
    getString(
      "OPENPAY_API_KEY",
      "",
    ),

  OPENPAY_CURRENCY:
    getString(
      "OPENPAY_CURRENCY",
      "XAF",
    ),

  OPENPAY_COUNTRY:
    getString(
      "OPENPAY_COUNTRY",
      "CG",
    ),

  OPENPAY_CALLBACK_URL:
    getString(
      "OPENPAY_CALLBACK_URL",
      "http://localhost:5000/api/payments/webhooks/openpay",
    ),

  OPENPAY_RETURN_URL:
    getString(
      "OPENPAY_RETURN_URL",
      "http://localhost:5173/payment/success",
    ),

  OPENPAY_TIMEOUT_MS:
    getNumber(
      "OPENPAY_TIMEOUT_MS",
      15000,
    ),

  OPENPAY_VERIFY_AMOUNT:
    getBoolean(
      "OPENPAY_VERIFY_AMOUNT",
      true,
    ),

  OPENPAY_VERIFY_CURRENCY:
    getBoolean(
      "OPENPAY_VERIFY_CURRENCY",
      true,
    ),

  /**
   * ----------------------------------------------------------
   * Payment Security
   * ----------------------------------------------------------
   */

  PAYMENT_REQUIRE_WEBHOOK_SIGNATURE:
    getBoolean(
      "PAYMENT_REQUIRE_WEBHOOK_SIGNATURE",
      true,
    ),

  PAYMENT_REQUIRE_IDEMPOTENCY:
    getBoolean(
      "PAYMENT_REQUIRE_IDEMPOTENCY",
      true,
    ),

  PAYMENT_VERIFY_WEBHOOK:
    getBoolean(
      "PAYMENT_VERIFY_WEBHOOK",
      true,
    ),

  PAYMENT_VERIFY_AMOUNT:
    getBoolean(
      "PAYMENT_VERIFY_AMOUNT",
      true,
    ),

  PAYMENT_VERIFY_CURRENCY:
    getBoolean(
      "PAYMENT_VERIFY_CURRENCY",
      true,
    ),

  PAYMENT_TIMEOUT_MS:
    getNumber(
      "PAYMENT_TIMEOUT_MS",
      60000,
    ),

  PAYMENT_MAX_RETRIES:
    getNumber(
      "PAYMENT_MAX_RETRIES",
      5,
    ),

  PAYMENT_RETRY_DELAY_MS:
    getNumber(
      "PAYMENT_RETRY_DELAY_MS",
      5000,
    ),

  /**
   * ----------------------------------------------------------
   * Webhooks
   * ----------------------------------------------------------
   */

  WEBHOOK_ENABLED:
    getBoolean(
      "WEBHOOK_ENABLED",
      true,
    ),

  WEBHOOK_TIMEOUT_MS:
    getNumber(
      "WEBHOOK_TIMEOUT_MS",
      30000,
    ),

  WEBHOOK_MAX_RETRIES:
    getNumber(
      "WEBHOOK_MAX_RETRIES",
      5,
    ),

  WEBHOOK_RETRY_DELAY_MS:
    getNumber(
      "WEBHOOK_RETRY_DELAY_MS",
      5000,
    ),

  WEBHOOK_LOG_PAYLOAD:
    getBoolean(
      "WEBHOOK_LOG_PAYLOAD",
      false,
    ),

  /**
   * ----------------------------------------------------------
   * Subscriptions
   * ----------------------------------------------------------
   */

  SUBSCRIPTION_ENABLED:
    getBoolean(
      "SUBSCRIPTION_ENABLED",
      true,
    ),

  /**
   * ----------------------------------------------------------
   * Invoice
   * ----------------------------------------------------------
   */

  INVOICE_JOB_ENABLED:
    getBoolean(
      "INVOICE_JOB_ENABLED",
      true,
    ),

  INVOICE_JOB_SCHEDULE:
    getString(
      "INVOICE_JOB_SCHEDULE",
      "*/10 * * * *",
    ),

  INVOICE_JOB_BATCH_SIZE:
    getNumber(
      "INVOICE_JOB_BATCH_SIZE",
      100,
    ),

  INVOICE_PREFIX:
    getString(
      "INVOICE_PREFIX",
      "BIB",
    ),

  INVOICE_PAYMENT_GRACE_DAYS:
    getNumber(
      "INVOICE_PAYMENT_GRACE_DAYS",
      30,
    ),
};

/**
 * ============================================================
 * Development warnings
 * ============================================================
 */

if (
  config.OPENPAY_ENABLED &&
  !config.OPENPAY_API_KEY
) {
  console.warn(
    "[OpenPay] OPENPAY_ENABLED=true mais OPENPAY_API_KEY est vide.",
  );
}

if (
  config.STRIPE_ENABLED &&
  !config.STRIPE_SECRET_KEY
) {
  console.warn(
    "[Stripe] STRIPE_ENABLED=true mais STRIPE_SECRET_KEY est vide.",
  );
}

/**
 * ============================================================
 * Export
 * ============================================================
 */

export default config;