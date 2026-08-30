import dotenv from 'dotenv';

dotenv.config();

interface Config {
  // Application
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;
  APP_URL: string;
  CLIENT_URL: string;
  API_URL: string;

  // Database
  DATABASE_URL: string;
  DIRECT_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;

  // Super Admin
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  SUPER_ADMIN_NAME: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // AI
  AI_ENABLED: boolean;
  OPENAI_API_KEY: string;
  AI_MODEL: string;

  // Payment
  PAYMENT_ENABLED: boolean;
  PAYMENT_DEFAULT_PROVIDER: string;
  SUPPORTED_CURRENCIES: string[];
  BASE_CURRENCY: string;
  MULTI_CURRENCY_ENABLED: boolean;

  // Stripe
  STRIPE_ENABLED: boolean;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // MTN
  MTN_ENABLED: boolean;
  MTN_BASE_URL: string;
  MTN_API_KEY: string;
  MTN_API_SECRET: string;

  // Airtel
  AIRTEL_ENABLED: boolean;
  AIRTEL_BASE_URL: string;
  AIRTEL_CLIENT_ID: string;
  AIRTEL_CLIENT_SECRET: string;

  // Security
  BCRYPT_SALT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CORS_ORIGIN: string;

  // SMTP
  SMTP_ENABLED: boolean;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;

  // Development
  SIMULATED_PAYMENTS_ENABLED: boolean;
}

const config: Config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  APP_NAME: process.env.APP_NAME || 'BibSaaS',
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:5000/api',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-in-production',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'BibSaaS',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'BibSaaS-Users',

  // Super Admin
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'admin@bibsaas.com',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeNow123!',
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME || 'BibSaaS Super Admin',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // AI
  AI_ENABLED: process.env.AI_ENABLED === 'true',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4',

  // Payment
  PAYMENT_ENABLED: process.env.PAYMENT_ENABLED === 'true',
  PAYMENT_DEFAULT_PROVIDER: process.env.PAYMENT_DEFAULT_PROVIDER || 'SIMULATED',
  SUPPORTED_CURRENCIES: (process.env.SUPPORTED_CURRENCIES || 'XAF,EUR,USD').split(','),
  BASE_CURRENCY: process.env.BASE_CURRENCY || 'XAF',
  MULTI_CURRENCY_ENABLED: process.env.MULTI_CURRENCY_ENABLED === 'true',

  // Stripe
  STRIPE_ENABLED: process.env.STRIPE_ENABLED === 'true',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // MTN
  MTN_ENABLED: process.env.MTN_ENABLED === 'true',
  MTN_BASE_URL: process.env.MTN_BASE_URL || '',
  MTN_API_KEY: process.env.MTN_API_KEY || '',
  MTN_API_SECRET: process.env.MTN_API_SECRET || '',

  // Airtel
  AIRTEL_ENABLED: process.env.AIRTEL_ENABLED === 'true',
  AIRTEL_BASE_URL: process.env.AIRTEL_BASE_URL || '',
  AIRTEL_CLIENT_ID: process.env.AIRTEL_CLIENT_ID || '',
  AIRTEL_CLIENT_SECRET: process.env.AIRTEL_CLIENT_SECRET || '',

  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // SMTP
  SMTP_ENABLED: process.env.SMTP_ENABLED === 'true',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || 'BibSaaS <noreply@bibsaas.com>',

  // Development
  SIMULATED_PAYMENTS_ENABLED: process.env.SIMULATED_PAYMENTS_ENABLED === 'true',
};

// Validate required environment variables in production
if (config.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !config[key as keyof Config]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default config;
