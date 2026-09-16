 /**
 * ============================================================
 * BibSaaS Premium API
 * ============================================================
 *
 * File:
 * src/app.ts
 *
 * Responsibilities:
 * - Express application
 * - Security
 * - CORS
 * - Compression
 * - Cookies
 * - Request parsing
 * - HTTP logging
 * - Rate limiting
 * - Request ID
 * - Health checks
 * - Swagger documentation
 * - API routes
 * - Stripe webhook
 * - OpenPay webhook
 * - 404 handling
 * - Global error handling
 *
 * ============================================================
 */

import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from "express";

import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

import config from "./config/env";

import logger, {
  loggerStream,
  logError,
} from "./config/logger";

import swaggerUi from "swagger-ui-express";

import {
  swaggerSpec,
  swaggerUiOptions,
} from "./config/swagger";

import {
  checkDatabaseHealth,
} from "./config/database";

/**
 * ============================================================
 * ROUTES
 * ============================================================
 */

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import paymentRoutes from "./routes/payment.routes";
import invoiceRoutes from "./routes/invoice.routes";
import bookingRoutes from "./routes/booking.routes";
import barberRoutes from "./routes/barber.routes";
import salonRoutes from "./routes/salon.routes";
import hairstyleRoutes from "./routes/hairstyle.routes";
import faceAnalysisRoutes from "./routes/face-analysis.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import notificationRoutes from "./routes/notification.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminRoutes from "./routes/admin.routes";
import webhookRoutes from "./routes/webhook.routes";

/**
 * ============================================================
 * STRIPE ROUTES
 * ============================================================
 *
 * IMPORTANT:
 *
 * Stripe webhook must be mounted BEFORE express.json().
 *
 * stripe.routes.ts is responsible for applying:
 *
 * express.raw({
 *   type: "application/json"
 * })
 *
 * to the Stripe webhook endpoint.
 *
 * Final endpoint:
 *
 * POST /api/payments/stripe/webhook
 *
 * ============================================================
 */

import stripeRoutes from "./routes/stripe.routes";

/**
 * ============================================================
 * MIDDLEWARE
 * ============================================================
 */

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * ============================================================
 * CREATE APPLICATION
 * ============================================================
 */

const createApp = (): Application => {
  const app: Application = express();

  /**
   * ==========================================================
   * TRUST PROXY
   * ==========================================================
   *
   * Necessary behind:
   * - Nginx
   * - Render
   * - Railway
   * - AWS
   * - Cloudflare
   *
   * Controlled by TRUST_PROXY.
   * ==========================================================
   */

  if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }

  /**
   * ==========================================================
   * DISABLE EXPRESS FINGERPRINT
   * ==========================================================
   */

  app.disable("x-powered-by");

  /**
   * ==========================================================
   * REQUEST ID
   * ==========================================================
   */

  app.use(
    (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const incomingRequestId =
        req.header("X-Request-ID");

      const requestId =
        incomingRequestId &&
        incomingRequestId.length > 0 &&
        incomingRequestId.length <= 128
          ? incomingRequestId
          : crypto.randomUUID();

      req.requestId = requestId;

      res.setHeader(
        "X-Request-ID",
        requestId,
      );

      next();
    },
  );

  /**
   * ==========================================================
   * HELMET
   * ==========================================================
   */

  app.use(
    helmet({
      contentSecurityPolicy:
        config.NODE_ENV === "production"
          ? undefined
          : false,

      crossOriginEmbedderPolicy: false,

      referrerPolicy: {
        policy:
          "strict-origin-when-cross-origin",
      },
    }),
  );

  /**
   * ==========================================================
   * CORS
   * ==========================================================
   *
   * CORS_ORIGIN can contain:
   *
   * CORS_ORIGIN=http://localhost:5173
   *
   * or multiple origins:
   *
   * CORS_ORIGIN=http://localhost:5173,https://bibsaas.com
   * ==========================================================
   */

  const corsOriginValue =
    process.env.CORS_ORIGIN ??
    config.CLIENT_URL ??
    "http://localhost:5173";

  const corsOrigins =
    corsOriginValue
      .split(",")
      .map(
        (origin) => origin.trim(),
      )
      .filter(Boolean);

  app.use(
    cors({
      origin: (
        origin,
        callback,
      ) => {
        /**
         * Requests without Origin:
         *
         * - Postman
         * - curl
         * - server-to-server
         * - OpenPay webhook
         *
         * are allowed.
         */
        if (!origin) {
          return callback(
            null,
            true,
          );
        }

        if (
          corsOrigins.includes("*") ||
          corsOrigins.includes(origin)
        ) {
          return callback(
            null,
            true,
          );
        }

        return callback(
          new Error(
            "CORS origin not allowed",
          ),
        );
      },

      credentials: true,

      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-ID",
        "Accept",
        "Origin",
        "Stripe-Signature",
      ],

      exposedHeaders: [
        "X-Request-ID",
        "Retry-After",
      ],

      optionsSuccessStatus: 204,
    }),
  );

  /**
   * ==========================================================
   * STRIPE WEBHOOK
   * ==========================================================
   *
   * IMPORTANT:
   *
   * This route is registered BEFORE express.json().
   *
   * stripe.routes.ts must use:
   *
   * express.raw({
   *   type: "application/json"
   * })
   *
   * Endpoint:
   *
   * POST /api/payments/stripe/webhook
   *
   * ==========================================================
   */

  app.use(
    "/api/payments/stripe",
    stripeRoutes,
  );

  /**
   * ==========================================================
   * BODY PARSER
   * ==========================================================
   *
   * Stripe has already been handled above.
   *
   * OpenPay uses normal JSON and can therefore be processed
   * by express.json().
   * ==========================================================
   */

  app.use(
    express.json({
      limit:
        process.env.JSON_BODY_LIMIT ??
        "10mb",

      strict: true,
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,

      limit:
        process.env.URLENCODED_BODY_LIMIT ??
        "10mb",
    }),
  );

  /**
   * ==========================================================
   * COOKIE PARSER
   * ==========================================================
   */

  app.use(
    cookieParser(
      process.env.COOKIE_SECRET,
    ),
  );

  /**
   * ==========================================================
   * COMPRESSION
   * ==========================================================
   */

  app.use(
    compression({
      threshold: 1024,
      level: 6,
    }),
  );

  /**
   * ==========================================================
   * MORGAN + WINSTON
   * ==========================================================
   */

  if (
    config.NODE_ENV ===
    "development"
  ) {
    app.use(
      morgan(
        ":method :url :status :response-time ms - :res[content-length] - :req[x-request-id]",
        {
          stream: loggerStream,
        },
      ),
    );
  } else {
    app.use(
      morgan(
        ":remote-addr :method :url :status :response-time ms - :req[x-request-id]",
        {
          stream: loggerStream,
        },
      ),
    );
  }

  /**
   * ==========================================================
   * RATE LIMITING
   * ==========================================================
   */

  const rateLimitWindowMs =
    Number(
      process.env.RATE_LIMIT_WINDOW_MS ??
        15 * 60 * 1000,
    );

  const rateLimitMaxRequests =
    Number(
      process.env.RATE_LIMIT_MAX_REQUESTS ??
        100,
    );

  const limiter =
    rateLimit({
      windowMs:
        Number.isFinite(
          rateLimitWindowMs,
        )
          ? rateLimitWindowMs
          : 15 * 60 * 1000,

      max:
        Number.isFinite(
          rateLimitMaxRequests,
        )
          ? rateLimitMaxRequests
          : 100,

      standardHeaders:
        "draft-7",

      legacyHeaders: false,

      skip: (
        req: Request,
      ) => {
        /**
         * Health checks do not consume quota.
         */

        if (
          req.path ===
            "/health" ||
          req.path ===
            "/ready"
        ) {
          return true;
        }

        /**
         * External payment providers need to be able
         * to retry webhooks without being blocked by
         * the general API rate limiter.
         */

        if (
          req.path.includes(
            "/payments/stripe/webhook",
          ) ||
          req.path.includes(
            "/payments/webhooks/openpay",
          )
        ) {
          return true;
        }

        return false;
      },

      keyGenerator: (
        req: Request,
      ) => {
        return (
          req.ip ??
          "unknown"
        );
      },

      handler: (
        req: Request,
        res: Response,
      ) => {
        logger.warn(
          "Rate limit exceeded",
          {
            requestId:
              req.requestId,

            ip:
              req.ip,

            method:
              req.method,

            path:
              req.originalUrl,
          },
        );

        return res
          .status(429)
          .json({
            success: false,

            message:
              "Too many requests. Please try again later.",

            code:
              "RATE_LIMIT_EXCEEDED",

            requestId:
              req.requestId,

            timestamp:
              new Date().toISOString(),
          });
      },
    });

  /**
   * Apply rate limiting to API routes.
   */

  app.use(
    "/api/",
    limiter,
  );

  /**
   * ==========================================================
   * HEALTH CHECK
   * ==========================================================
   *
   * GET /api/health
   * ==========================================================
   */

  app.get(
    "/api/health",
    async (
      req: Request,
      res: Response,
    ) => {
      const startedAt =
        Date.now();

      try {
        const database =
          await checkDatabaseHealth();

        const healthy =
          database.healthy;

        const statusCode =
          healthy
            ? 200
            : 503;

        return res
          .status(statusCode)
          .json({
            success:
              healthy,

            data: {
              status:
                healthy
                  ? "healthy"
                  : "unhealthy",

              timestamp:
                new Date().toISOString(),

              environment:
                config.NODE_ENV,

              version:
                process.env.APP_VERSION ??
                "1.0.0",

              uptime:
                process.uptime(),

              responseTimeMs:
                Date.now() -
                startedAt,

              services: {
                database:
                  database.healthy
                    ? "connected"
                    : "disconnected",
              },
            },

            requestId:
              req.requestId,
          });
      } catch (error) {
        logError(
          error,
          {
            requestId:
              req.requestId,

            endpoint:
              "/api/health",
          },
        );

        return res
          .status(503)
          .json({
            success: false,

            message:
              "Health check failed.",

            code:
              "HEALTH_CHECK_ERROR",

            requestId:
              req.requestId,

            timestamp:
              new Date().toISOString(),
          });
      }
    },
  );

  /**
   * ==========================================================
   * READINESS CHECK
   * ==========================================================
   *
   * GET /api/ready
   * ==========================================================
   */

  app.get(
    "/api/ready",
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const database =
          await checkDatabaseHealth();

        if (
          !database.healthy
        ) {
          return res
            .status(503)
            .json({
              success: false,

              ready: false,

              code:
                "DATABASE_NOT_READY",

              requestId:
                req.requestId,

              timestamp:
                new Date().toISOString(),
            });
        }

        return res.json({
          success: true,

          ready: true,

          requestId:
            req.requestId,

          timestamp:
            new Date().toISOString(),
        });
      } catch (error) {
        logError(
          error,
          {
            requestId:
              req.requestId,

            endpoint:
              "/api/ready",
          },
        );

        return res
          .status(503)
          .json({
            success: false,

            ready: false,

            code:
              "NOT_READY",

            requestId:
              req.requestId,

            timestamp:
              new Date().toISOString(),
          });
      }
    },
  );

  /**
   * ==========================================================
   * SWAGGER DOCUMENTATION
   * ==========================================================
   */

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(
      swaggerSpec,
      swaggerUiOptions,
    ),
  );

  /**
   * ==========================================================
   * OPENAPI JSON
   * ==========================================================
   */

  app.get(
    "/api/docs.json",
    (
      _req: Request,
      res: Response,
    ) => {
      return res.json(
        swaggerSpec,
      );
    },
  );

  /**
   * ==========================================================
   * API ROUTES
   * ==========================================================
   */

  app.use(
    "/api/auth",
    authRoutes,
  );

  app.use(
    "/api/users",
    userRoutes,
  );

  app.use(
    "/api/subscriptions",
    subscriptionRoutes,
  );

  /**
   * ==========================================================
   * PAYMENT ROUTES
   * ==========================================================
   *
   * Includes:
   *
   * POST /api/payments
   * GET  /api/payments
   * GET  /api/payments/:id
   * GET  /api/payments/:id/verify
   * POST /api/payments/:id/cancel
   *
   * OpenPay:
   *
   * POST /api/payments/webhooks/openpay
   *
   * Stripe webhook has its own raw-body route:
   *
   * POST /api/payments/stripe/webhook
   *
   * ==========================================================
   */

  app.use(
    "/api/payments",
    paymentRoutes,
  );

  app.use(
    "/api/invoices",
    invoiceRoutes,
  );

  app.use(
    "/api/bookings",
    bookingRoutes,
  );

  app.use(
    "/api/barbers",
    barberRoutes,
  );

  app.use(
    "/api/salons",
    salonRoutes,
  );

  app.use(
    "/api/hairstyles",
    hairstyleRoutes,
  );

  app.use(
    "/api/face-analysis",
    faceAnalysisRoutes,
  );

  app.use(
    "/api/recommendations",
    recommendationRoutes,
  );

  app.use(
    "/api/notifications",
    notificationRoutes,
  );

  app.use(
    "/api/dashboard",
    dashboardRoutes,
  );

  app.use(
    "/api/admin",
    adminRoutes,
  );

  /**
   * ==========================================================
   * OTHER WEBHOOKS
   * ==========================================================
   */

  app.use(
    "/api/webhooks",
    webhookRoutes,
  );

  /**
   * ==========================================================
   * API ROOT
   * ==========================================================
   *
   * GET /api
   * ==========================================================
   */

  app.get(
    "/api",
    (
      req: Request,
      res: Response,
    ) => {
      return res.json({
        success: true,

        service:
          "BibSaaS",

        status:
          "ok",

        version:
          process.env.APP_VERSION ??
          "1.0.0",

        environment:
          config.NODE_ENV,

        message:
          "BibSaaS API is running",

        documentation:
          "/api/docs",

        health:
          "/api/health",

        readiness:
          "/api/ready",

        payments:
          "/api/payments",

        openPayWebhook:
          "/api/payments/webhooks/openpay",

        stripeWebhook:
          "/api/payments/stripe/webhook",

        requestId:
          req.requestId,

        timestamp:
          new Date().toISOString(),
      });
    },
  );

  /**
   * ==========================================================
   * ROOT
   * ==========================================================
   */

  app.get(
    "/",
    (
      req: Request,
      res: Response,
    ) => {
      return res.json({
        success: true,

        message:
          "BibSaaS Premium API",

        version:
          process.env.APP_VERSION ??
          "1.0.0",

        environment:
          config.NODE_ENV,

        documentation:
          "/api/docs",

        openapi:
          "/api/docs.json",

        health:
          "/api/health",

        readiness:
          "/api/ready",

        requestId:
          req.requestId,

        timestamp:
          new Date().toISOString(),
      });
    },
  );

  /**
   * ==========================================================
   * JSON PARSING ERROR
   * ==========================================================
   *
   * Intercept invalid JSON payloads.
   * ==========================================================
   */

  app.use(
    (
      error: SyntaxError & {
        status?: number;
        body?: unknown;
      },
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
      ) {
        logger.warn(
          "Invalid JSON payload",
          {
            requestId:
              req.requestId,

            method:
              req.method,

            path:
              req.originalUrl,
          },
        );

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid JSON payload.",

            code:
              "INVALID_JSON",

            requestId:
              req.requestId,

            timestamp:
              new Date().toISOString(),
          });
      }

      return next(error);
    },
  );

  /**
   * ==========================================================
   * 404 HANDLER
   * ==========================================================
   */

  app.use(
    notFoundHandler,
  );

  /**
   * ==========================================================
   * GLOBAL ERROR HANDLER
   * ==========================================================
   */

  app.use(
    errorHandler,
  );

  /**
   * ==========================================================
   * APPLICATION INITIALIZED
   * ==========================================================
   */

  logger.info(
    "BibSaaS Express application initialized",
    {
      environment:
        config.NODE_ENV,

      version:
        process.env.APP_VERSION ??
        "1.0.0",

      documentation:
        "/api/docs",

      payments: {
        stripe:
          config.STRIPE_ENABLED,

        openpay:
          config.OPENPAY_ENABLED,

        simulated:
          config.SIMULATED_PAYMENT_ENABLED,
      },
    },
  );

  return app;
};

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

export default createApp;