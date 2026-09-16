
/**
 * ============================================================
 * BibSaaS — Database Configuration
 * ============================================================
 *
 * File:
 * config/database.ts
 *
 * Stack:
 * - Node.js
 * - TypeScript
 * - Prisma
 * - PostgreSQL
 * - Supabase PostgreSQL
 *
 * Responsabilités :
 * - Initialisation PrismaClient
 * - Singleton DB
 * - Connexion PostgreSQL
 * - Health check
 * - Gestion des erreurs
 * - Graceful shutdown
 * - Logs
 * - Protection contre les connexions multiples
 *
 * ============================================================
 */

import {
  PrismaClient,
  Prisma,
} from "@prisma/client";

/**
 * Si ton projet possède déjà un logger personnalisé,
 * adapte simplement cet import.
 */
import logger from "./logger";

/**
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const NODE_ENV =
  process.env.NODE_ENV ??
  "development";

const isProduction =
  NODE_ENV ===
  "production";

/**
 * ============================================================
 * DATABASE URL VALIDATION
 * ============================================================
 */

function validateDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (
    !databaseUrl ||
    databaseUrl.trim() === ""
  ) {
    throw new Error(
      "[DATABASE] DATABASE_URL is not configured.",
    );
  }

  if (
    !databaseUrl.startsWith(
      "postgresql://",
    ) &&
    !databaseUrl.startsWith(
      "postgres://",
    )
  ) {
    throw new Error(
      "[DATABASE] DATABASE_URL must be a PostgreSQL connection string.",
    );
  }

  return databaseUrl;
}

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

export const DATABASE_CONFIG = {
  url:
    validateDatabaseUrl(),

  environment:
    NODE_ENV,

  /**
   * Active les logs Prisma détaillés uniquement
   * lorsque nécessaire.
   */
  logQueries:
    process.env.DATABASE_LOG_QUERIES ===
    "true",

  logErrors:
    process.env.DATABASE_LOG_ERRORS !==
    "false",

  logWarnings:
    process.env.DATABASE_LOG_WARNINGS !==
    "false",

  /**
   * Timeout du health check.
   */
  healthCheckTimeoutMs:
    Number(
      process.env.DATABASE_HEALTHCHECK_TIMEOUT_MS ??
        5000,
    ),

  /**
   * Nombre de tentatives de connexion au démarrage.
   */
  connectionRetries:
    Number(
      process.env.DATABASE_CONNECTION_RETRIES ??
        5,
    ),

  /**
   * Délai entre les tentatives.
   */
  retryDelayMs:
    Number(
      process.env.DATABASE_RETRY_DELAY_MS ??
        3000,
    ),
} as const;

/**
 * ============================================================
 * PRISMA LOG CONFIGURATION
 * ============================================================
 */

type PrismaLogDefinition =
  | "query"
  | "info"
  | "warn"
  | "error";

function buildPrismaLogConfig(): PrismaLogDefinition[] {
  const logs: PrismaLogDefinition[] = [
    "error",
  ];

  if (
    DATABASE_CONFIG.logWarnings
  ) {
    logs.push(
      "warn",
    );
  }

  /**
   * Les requêtes SQL peuvent contenir des informations
   * sensibles.
   *
   * On recommande donc de les désactiver en production
   * sauf besoin de debugging contrôlé.
   */
  if (
    DATABASE_CONFIG.logQueries &&
    !isProduction
  ) {
    logs.push(
      "query",
    );
  }

  return logs;
}

/**
 * ============================================================
 * PRISMA SINGLETON
 * ============================================================
 *
 * En développement, les hot reloads peuvent créer plusieurs
 * PrismaClient.
 *
 * On conserve donc une instance globale.
 * ============================================================
 */

const globalForPrisma =
  globalThis as unknown as {
    prisma?: PrismaClient;
  };

/**
 * ============================================================
 * CREATE PRISMA CLIENT
 * ============================================================
 */

function createPrismaClient(): PrismaClient {
  const client =
    new PrismaClient({
      log:
        buildPrismaLogConfig(),
    });

  /**
   * Prisma error events.
   */
  client.$on(
    "error",
    (event: Prisma.LogEvent) => {
      logger.error(
        `[DATABASE] Prisma error: ${event.message}`,
      );
    },
  );

  /**
   * Prisma warning events.
   */
  client.$on(
    "warn",
    (event: Prisma.LogEvent) => {
      logger.warn(
        `[DATABASE] Prisma warning: ${event.message}`,
      );
    },
  );

  /**
   * Prisma informational events.
   */
  client.$on(
    "info",
    (event: Prisma.LogEvent) => {
      if (
        !isProduction
      ) {
        logger.info(
          `[DATABASE] Prisma info: ${event.message}`,
        );
      }
    },
  );

  /**
   * SQL query logging.
   *
   * Activé uniquement en développement et si explicitement
   * demandé.
   */
  if (
    DATABASE_CONFIG.logQueries &&
    !isProduction
  ) {
    client.$on(
      "query",
    (event: Prisma.QueryEvent) => {
        logger.debug(
          `[DATABASE] Query ${event.duration}ms: ${event.query}`,
        );
      },
    );
  }

  return client;
}

/**
 * ============================================================
 * DATABASE CLIENT
 * ============================================================
 */

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

/**
 * En développement, conserver l'instance globalement.
 */
if (!isProduction) {
  globalForPrisma.prisma =
    prisma;
}

/**
 * ============================================================
 * CONNECT
 * ============================================================
 */

export async function connectDatabase(): Promise<void> {
  let lastError:
    | unknown
    | null = null;

  const maxRetries =
    Math.max(
      1,
      DATABASE_CONFIG.connectionRetries,
    );

  for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      logger.info(
        `[DATABASE] Connecting to PostgreSQL... attempt=${attempt}/${maxRetries}`,
      );

      await prisma.$connect();

      /**
       * Vérification réelle de la connexion.
       */
      await prisma.$queryRaw<
        Array<{
          result: number;
        }>
      >`SELECT 1 AS result`;

      logger.info(
        "[DATABASE] PostgreSQL connection established successfully.",
      );

      return;
    } catch (error) {
      lastError =
        error;

      logger.error(
        `[DATABASE] Connection attempt ${attempt}/${maxRetries} failed.`,
        error,
      );

      if (
        attempt <
        maxRetries
      ) {
        await sleep(
          DATABASE_CONFIG.retryDelayMs,
        );
      }
    }
  }

  logger.error(
    "[DATABASE] Unable to establish database connection.",
  );

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Database connection failed.",
      );
}

/**
 * ============================================================
 * DISCONNECT
 * ============================================================
 */

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();

    logger.info(
      "[DATABASE] PostgreSQL connection closed.",
    );
  } catch (error) {
    logger.error(
      "[DATABASE] Error while disconnecting Prisma.",
      error,
    );

    throw error;
  }
}

/**
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;

  latencyMs: number;

  timestamp: string;

  error?: string;
}> {
  const startedAt =
    Date.now();

  try {
    await prisma.$queryRaw<
      Array<{
        result: number;
      }>
    >`SELECT 1 AS result`;

    return {
      healthy: true,

      latencyMs:
        Date.now() -
        startedAt,

      timestamp:
        new Date().toISOString(),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return {
      healthy: false,

      latencyMs:
        Date.now() -
        startedAt,

      timestamp:
        new Date().toISOString(),

      error: message,
    };
  }
}

/**
 * Lightweight boolean check used during HTTP server startup.
 */
export async function testDatabaseConnection(): Promise<boolean> {
  const health = await checkDatabaseHealth();
  return health.healthy;
}

/**
 * ============================================================
 * DATABASE STATUS
 * ============================================================
 */

export async function getDatabaseStatus(): Promise<{
  connected: boolean;

  latencyMs: number;

  environment: string;

  timestamp: string;

  error?: string;
}> {
  const health =
    await checkDatabaseHealth();

  return {
    connected:
      health.healthy,

    latencyMs:
      health.latencyMs,

    environment:
      DATABASE_CONFIG.environment,

    timestamp:
      health.timestamp,

    ...(health.error
      ? {
          error:
            health.error,
        }
      : {}),
  };
}

/**
 * ============================================================
 * TRANSACTION HELPER
 * ============================================================
 *
 * Exemple :
 *
 * await withTransaction(async (tx) => {
 *   await tx.user.create(...)
 *   await tx.subscription.create(...)
 * })
 *
 * ============================================================
 */

export async function withTransaction<
  T,
>(
  callback: (
    transaction: Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (transaction) => {
      return callback(
        transaction,
      );
    },
  );
}

/**
 * ============================================================
 * DATABASE RETRY HELPER
 * ============================================================
 *
 * Utile pour les opérations temporaires :
 *
 * - réseau
 * - Supabase
 * - PostgreSQL
 * - pool saturé
 *
 * ============================================================
 */

export async function withDatabaseRetry<
  T,
>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;

    delayMs?: number;

    factor?: number;
  },
): Promise<T> {
  const retries =
    Math.max(
      1,
      options?.retries ??
        3,
    );

  const initialDelay =
    Math.max(
      0,
      options?.delayMs ??
        1000,
    );

  const factor =
    Math.max(
      1,
      options?.factor ??
        2,
    );

  let lastError:
    | unknown
    | null = null;

  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError =
        error;

      logger.warn(
        `[DATABASE] Operation failed. attempt=${attempt}/${retries}`,
      );

      if (
        attempt <
        retries
      ) {
        const delay =
          initialDelay *
          Math.pow(
            factor,
            attempt - 1,
          );

        await sleep(
          delay,
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Database operation failed after retries.",
      );
}

/**
 * ============================================================
 * DATABASE TRANSACTION WITH RETRY
 * ============================================================
 */

export async function transactionWithRetry<
  T,
>(
  callback: (
    transaction: Prisma.TransactionClient,
  ) => Promise<T>,
  options?: {
    retries?: number;

    delayMs?: number;

    factor?: number;
  },
): Promise<T> {
  return withDatabaseRetry<T>(
    () =>
      withTransaction(
        callback,
      ),
    options,
  );
}

/**
 * ============================================================
 * SLEEP
 * ============================================================
 */

function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

/**
 * ============================================================
 * GRACEFUL SHUTDOWN
 * ============================================================
 */

let shutdownRegistered =
  false;

export function registerDatabaseShutdown(): void {
  if (
    shutdownRegistered
  ) {
    return;
  }

  shutdownRegistered =
    true;

  const shutdown =
    async (
      signal: string,
    ) => {
      logger.info(
        `[DATABASE] Received ${signal}. Closing database connection...`,
      );

      try {
        await disconnectDatabase();

        logger.info(
          "[DATABASE] Shutdown completed.",
        );
      } catch (error) {
        logger.error(
          "[DATABASE] Shutdown failed.",
          error,
        );
      }
    };

  process.once(
    "SIGINT",
    () =>
      void shutdown(
        "SIGINT",
      ),
  );

  process.once(
    "SIGTERM",
    () =>
      void shutdown(
        "SIGTERM",
      ),
  );
}

/**
 * ============================================================
 * DATABASE CONFIGURATION VALIDATION
 * ============================================================
 */

export function validateDatabaseConfiguration(): {
  valid: boolean;

  environment: string;

  hasDatabaseUrl: boolean;

  retries: number;

  healthCheckTimeoutMs: number;
} {
  return {
    valid:
      Boolean(
        DATABASE_CONFIG.url,
      ),

    environment:
      DATABASE_CONFIG.environment,

    hasDatabaseUrl:
      Boolean(
        DATABASE_CONFIG.url,
      ),

    retries:
      DATABASE_CONFIG.connectionRetries,

    healthCheckTimeoutMs:
      DATABASE_CONFIG.healthCheckTimeoutMs,
  };
}

/**
 * ============================================================
 * INITIALIZE DATABASE
 * ============================================================
 *
 * Fonction pratique pour server.ts / app.ts.
 * ============================================================
 */

export async function initializeDatabase(): Promise<void> {
  registerDatabaseShutdown();

  await connectDatabase();
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default prisma;
