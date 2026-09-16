
/**
 * ============================================================
 * BibSaaS — Premium Logger
 * ============================================================
 *
 * File:
 * src/config/logger.ts
 *
 * Stack:
 * - Node.js
 * - TypeScript
 * - Winston
 * - Express
 *
 * Features:
 * - Structured logging
 * - Console logging
 * - File logging
 * - Error logs
 * - Daily rotation
 * - Request ID / correlation ID
 * - Environment aware
 * - Exception handling
 * - Rejection handling
 * - Sensitive data protection
 * - Production ready
 *
 * ============================================================
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/**
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const NODE_ENV =
  process.env.NODE_ENV ??
  "development";

const isProduction =
  NODE_ENV === "production";

const LOG_LEVEL =
  process.env.LOG_LEVEL ??
  (isProduction
    ? "info"
    : "debug");

const LOG_DIR =
  process.env.LOG_DIR ??
  "logs";

/**
 * ============================================================
 * CUSTOM LEVELS
 * ============================================================
 */

const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  http: 4,
  verbose: 5,
  debug: 6,
  silly: 7,
};

/**
 * ============================================================
 * COLORS
 * ============================================================
 */

winston.addColors({
  fatal: "red bold",
  error: "red",
  warn: "yellow",
  info: "green",
  http: "cyan",
  verbose: "blue",
  debug: "magenta",
  silly: "grey",
});

/**
 * ============================================================
 * SAFE SERIALIZATION
 * ============================================================
 */

const SENSITIVE_KEYS = [
  "password",
  "passwd",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "set-cookie",
  "apiKey",
  "api_key",
  "privateKey",
  "private_key",
  "serviceRoleKey",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "creditCard",
  "cardNumber",
  "cvv",
  "cvc",
  "pin",
  "otp",
];

/**
 * Masque les informations sensibles dans les objets.
 */
function sanitizeValue(
  value: unknown,
  depth = 0,
): unknown {
  /**
   * Protection contre les structures récursives.
   */
  if (depth > 10) {
    return "[MaxDepth]";
  }

  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    value instanceof Error
  ) {
    const errorWithCause =
      value as Error & {
        cause?: unknown;
      };

    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause:
        errorWithCause.cause
          ? sanitizeValue(
              errorWithCause.cause,
              depth + 1,
            )
          : undefined,
    };
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      (item) =>
        sanitizeValue(
          item,
          depth + 1,
        ),
    );
  }

  if (
    typeof value === "object"
  ) {
    const source =
      value as Record<
        string,
        unknown
      >;

    const result: Record<
      string,
      unknown
    > = {};

    for (
      const [
        key,
        item,
      ] of Object.entries(
        source,
      )
    ) {
      if (
        SENSITIVE_KEYS.some(
          (sensitiveKey) =>
            key.toLowerCase() ===
            sensitiveKey.toLowerCase(),
        )
      ) {
        result[key] =
          "[REDACTED]";

        continue;
      }

      result[key] =
        sanitizeValue(
          item,
          depth + 1,
        );
    }

    return result;
  }

  return String(value);
}

/**
 ============================================================
 * FORMAT
 * ============================================================
 */

const jsonFormat =
  winston.format.combine(
    winston.format.timestamp({
      format:
        "YYYY-MM-DDTHH:mm:ss.SSSZ",
    }),

    winston.format.errors({
      stack: true,
    }),

    winston.format.metadata({
      fillExcept: [
        "message",
        "level",
        "timestamp",
      ],
    }),

    winston.format.json(),
  );

/**
 * ============================================================
 * CONSOLE FORMAT
 * ============================================================
 */

const consoleFormat =
  winston.format.combine(
    winston.format.colorize(),

    winston.format.timestamp({
      format:
        "HH:mm:ss",
    }),

    winston.format.errors({
      stack: true,
    }),

    winston.format.printf(
      ({
        timestamp,
        level,
        message,
        stack,
        requestId,
        service,
        ...meta
      }) => {
        const requestPart =
          requestId
            ? ` [requestId=${requestId}]`
            : "";

        const servicePart =
          service
            ? ` [service=${service}]`
            : "";

        const metadata =
          Object.keys(
            meta,
          ).length > 0
            ? ` ${JSON.stringify(
                sanitizeValue(
                  meta,
                ),
              )}`
            : "";

        return `${timestamp} ${level}${servicePart}${requestPart}: ${
          stack ??
          message
        }${metadata}`;
      },
    ),
  );

/**
 * ============================================================
 * TRANSPORTS
 * ============================================================
 */

const transports: winston.transport[] =
  [];

/**
 * Console.
 */
transports.push(
  new winston.transports.Console({
    level:
      LOG_LEVEL,

    format:
      consoleFormat,
  }),
);

/**
 * ============================================================
 * ROTATING COMBINED LOG
 * ============================================================
 */

transports.push(
  new DailyRotateFile({
    filename:
      `${LOG_DIR}/bibsaas-%DATE%.log`,

    datePattern:
      "YYYY-MM-DD",

    zippedArchive:
      true,

    maxSize:
      process.env.LOG_MAX_SIZE ??
      "20m",

    maxFiles:
      process.env.LOG_MAX_FILES ??
      "14d",

    level:
      LOG_LEVEL,

    format:
      jsonFormat,
  }),
);

/**
 * ============================================================
 * ROTATING ERROR LOG
 * ============================================================
 */

transports.push(
  new DailyRotateFile({
    filename:
      `${LOG_DIR}/error-%DATE%.log`,

    datePattern:
      "YYYY-MM-DD",

    zippedArchive:
      true,

    maxSize:
      process.env.LOG_ERROR_MAX_SIZE ??
      "20m",

    maxFiles:
      process.env.LOG_ERROR_MAX_FILES ??
      "30d",

    level:
      "error",

    format:
      jsonFormat,
  }),
);

/**
 * ============================================================
 * LOGGER
 * ============================================================
 */

const logger =
  winston.createLogger({
    levels,

    level:
      LOG_LEVEL,

    defaultMeta: {
      service:
        process.env.APP_NAME ??
        "bibsaas-api",

      environment:
        NODE_ENV,
    },

    format:
      jsonFormat,

    transports,

    exitOnError:
      false,
  });

/**
 * ============================================================
 * EXCEPTIONS
 * ============================================================
 *
 * Capture les exceptions non gérées.
 * ============================================================
 */

logger.exceptions.handle(
  new DailyRotateFile({
    filename:
      `${LOG_DIR}/exceptions-%DATE%.log`,

    datePattern:
      "YYYY-MM-DD",

    zippedArchive:
      true,

    maxSize:
      "20m",

    maxFiles:
      "30d",

    format:
      jsonFormat,
  }),
);

/**
 * ============================================================
 * PROMISE REJECTIONS
 * ============================================================
 */

logger.rejections.handle(
  new DailyRotateFile({
    filename:
      `${LOG_DIR}/rejections-%DATE%.log`,

    datePattern:
      "YYYY-MM-DD",

    zippedArchive:
      true,

    maxSize:
      "20m",

    maxFiles:
      "30d",

    format:
      jsonFormat,
  }),
);

/**
 * ============================================================
 * REQUEST LOGGER
 * ============================================================
 */

export interface RequestLogContext {
  requestId?: string;

  method?: string;

  path?: string;

  statusCode?: number;

  durationMs?: number;

  userId?: string;

  ip?: string;

  userAgent?: string;
}

/**
 * Log HTTP request.
 */
export function logRequest(
  context: RequestLogContext,
): void {
  logger.http(
    "HTTP request",
    sanitizeValue(
      context,
    ) as Record<
      string,
      unknown
    >,
  );
}

/**
 * Log HTTP response.
 */
export function logResponse(
  context: RequestLogContext,
): void {
  logger.http(
    "HTTP response",
    sanitizeValue(
      context,
    ) as Record<
      string,
      unknown
    >,
  );
}

/**
 * ============================================================
 * SERVICE LOGGER
 * ============================================================
 */

export function createServiceLogger(
  serviceName: string,
) {
  return {
    fatal: (
      message: string,
      meta?: unknown,
    ) =>
      logger.log({
        level:
          "fatal",
        message,
        service:
          serviceName,
        metadata:
          sanitizeValue(
            meta,
          ),
      }),

    error: (
      message: string,
      meta?: unknown,
    ) =>
      logger.error(
        message,
        {
          service:
            serviceName,

          metadata:
            sanitizeValue(
              meta,
            ),
        },
      ),

    warn: (
      message: string,
      meta?: unknown,
    ) =>
      logger.warn(
        message,
        {
          service:
            serviceName,

          metadata:
            sanitizeValue(
              meta,
            ),
        },
      ),

    info: (
      message: string,
      meta?: unknown,
    ) =>
      logger.info(
        message,
        {
          service:
            serviceName,

          metadata:
            sanitizeValue(
              meta,
            ),
        },
      ),

    http: (
      message: string,
      meta?: unknown,
    ) =>
      logger.http(
        message,
        {
          service:
            serviceName,

          metadata:
            sanitizeValue(
              meta,
            ),
        },
      ),

    debug: (
      message: string,
      meta?: unknown,
    ) =>
      logger.debug(
        message,
        {
          service:
            serviceName,

          metadata:
            sanitizeValue(
              meta,
            ),
        },
      ),
  };
}

/**
 * ============================================================
 * REQUEST ID LOGGER
 * ============================================================
 */

export function logWithRequestId(
  level:
    | "fatal"
    | "error"
    | "warn"
    | "info"
    | "http"
    | "verbose"
    | "debug"
    | "silly",
  message: string,
  requestId?: string,
  metadata?: unknown,
): void {
  logger.log({
    level,

    message,

    requestId,

    metadata:
      sanitizeValue(
        metadata,
      ),
  });
}

/**
 * ============================================================
 * ERROR HELPER
 * ============================================================
 */

export function logError(
  error: unknown,
  context?: Record<
    string,
    unknown
  >,
): void {
  if (
    error instanceof Error
  ) {
    logger.error(
      error.message,
      {
        errorName:
          error.name,

        stack:
          error.stack,

        ...(sanitizeValue(context) as Record<string, unknown>),
      },
    );

    return;
  }

  logger.error(
    "Unknown error",
    {
      error:
        sanitizeValue(
          error,
        ),

      ...(sanitizeValue(context) as Record<string, unknown>),
    },
  );
}

/**
 * ============================================================
 * AUDIT LOG HELPER
 * ============================================================
 *
 * Utilisable pour :
 * - connexion
 * - modification profil
 * - paiement
 * - abonnement
 * - changement de rôle
 * - administration
 * ============================================================
 */

export interface AuditLogContext {
  action: string;

  userId?: string;

  targetId?: string;

  resource?: string;

  success?: boolean;

  requestId?: string;

  ip?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

export function logAudit(
  context: AuditLogContext,
): void {
  logger.info(
    "AUDIT_EVENT",
    {
      audit: true,

      ...(sanitizeValue(context) as Record<string, unknown>),
    },
  );
}

/**
 * ============================================================
 * PAYMENT LOG HELPER
 * ============================================================
 *
 * Ne jamais logger :
 * - numéro de carte
 * - CVV
 * - PIN
 * - OTP
 * - token complet
 * - service role key
 *
 * ============================================================
 */

export function logPaymentEvent(
  context: {
    paymentId?: string;

    transactionId?: string;

    provider?: string;

    amount?: number;

    currency?: string;

    status?: string;

    userId?: string;

    requestId?: string;

    metadata?: Record<
      string,
      unknown
    >;
  },
): void {
  logger.info(
    "PAYMENT_EVENT",
    {
      payment: true,

      ...(sanitizeValue(context) as Record<string, unknown>),
    },
  );
}

/**
 * ============================================================
 * SECURITY EVENT
 * ============================================================
 */

export function logSecurityEvent(
  context: {
    event: string;

    userId?: string;

    ip?: string;

    requestId?: string;

    severity?:
      | "low"
      | "medium"
      | "high"
      | "critical";

    metadata?: Record<
      string,
      unknown
    >;
  },
): void {
  logger.warn(
    "SECURITY_EVENT",
    {
      security: true,

      ...(sanitizeValue(context) as Record<string, unknown>),
    },
  );
}

/**
 * ============================================================
 * LOGGER STREAM
 * ============================================================
 *
 * Compatible avec Morgan.
 *
 * Exemple :
 *
 * app.use(
 *   morgan("combined", {
 *     stream: loggerStream,
 *   }),
 * );
 * ============================================================
 */

export const loggerStream = {
  write(
    message: string,
  ): void {
    logger.http(
      message.trim(),
    );
  },
};

/**
 * ============================================================
 * CHANGE LOG LEVEL
 * ============================================================
 */

export function setLogLevel(
  level:
    | "fatal"
    | "error"
    | "warn"
    | "info"
    | "http"
    | "verbose"
    | "debug"
    | "silly",
): void {
  logger.level =
    level;

  logger.info(
    `[LOGGER] Log level changed to ${level}.`,
  );
}

/**
 * ============================================================
 * GET LOGGER STATUS
 * ============================================================
 */

export function getLoggerStatus() {
  return {
    level:
      logger.level,

    environment:
      NODE_ENV,

    production:
      isProduction,

    directory:
      LOG_DIR,

    timestamp:
      new Date().toISOString(),
  };
}

/**
 * ============================================================
 * FLUSH
 * ============================================================
 */

export async function flushLogs(): Promise<void> {
  await new Promise<void>(
    (resolve) => {
      let pending =
        logger.transports.length;

      if (
        pending === 0
      ) {
        resolve();

        return;
      }

      logger.transports.forEach(
        (transport) => {
          transport.once(
            "finish",
            () => {
              pending--;

              if (
                pending === 0
              ) {
                resolve();
              }
            },
          );
        },
      );

      logger.end();
    },
  );
}

/**
 * ============================================================
 * STARTUP LOG
 * ============================================================
 */

logger.info(
  "BibSaaS logger initialized.",
  {
    environment:
      NODE_ENV,

    level:
      LOG_LEVEL,

    production:
      isProduction,
  },
);

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default logger;
