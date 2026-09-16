
/**
 * ============================================================
 * BibSaaS — Prisma Configuration
 * ============================================================
 *
 * File:
 * config/prisma.ts
 *
 * Stack:
 * - Node.js
 * - TypeScript
 * - Prisma
 * - PostgreSQL
 * - Supabase
 *
 * Responsabilités :
 * - Singleton PrismaClient
 * - Configuration des logs
 * - Connexion Prisma
 * - Déconnexion propre
 * - Health check
 * - Transactions
 * - Retry des opérations DB
 * - Graceful shutdown
 *
 * IMPORTANT :
 * Ce fichier centralise Prisma pour éviter la création
 * de plusieurs instances PrismaClient.
 *
 * ============================================================
 */

import {
  PrismaClient,
  Prisma,
} from "@prisma/client";

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
  NODE_ENV === "production";

/**
 * ============================================================
 * GLOBAL PRISMA INSTANCE
 * ============================================================
 *
 * En développement, les reloads peuvent créer plusieurs
 * instances Prisma.
 *
 * On conserve donc l'instance dans globalThis.
 * ============================================================
 */

const globalForPrisma =
  globalThis as unknown as {
    prisma?: PrismaClient;
  };

/**
 * ============================================================
 * PRISMA LOG CONFIGURATION
 * ============================================================
 */

function getPrismaLogs():
  | (
      | "query"
      | "info"
      | "warn"
      | "error"
    )[] {
  const logs: (
    | "query"
    | "info"
    | "warn"
    | "error"
  )[] = [
    "error",
  ];

  /**
   * Warnings Prisma.
   */
  if (
    process.env.PRISMA_LOG_WARNINGS !==
    "false"
  ) {
    logs.push(
      "warn",
    );
  }

  /**
   * Infos Prisma.
   */
  if (
    process.env.PRISMA_LOG_INFO ===
    "true"
  ) {
    logs.push(
      "info",
    );
  }

  /**
   * SQL queries.
   *
   * Désactivé par défaut et toujours désactivé
   * en production sauf modification volontaire.
   */
  if (
    process.env.PRISMA_LOG_QUERIES ===
      "true" &&
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
 * CREATE PRISMA CLIENT
 * ============================================================
 */

function createPrismaClient(): PrismaClient {
  const client =
    new PrismaClient({
      log:
        getPrismaLogs(),
    });

  /**
   * ========================================================
   * PRISMA ERROR EVENTS
   * ========================================================
   */

  client.$on(
    "error",
    (event: Prisma.LogEvent) => {
      logger.error(
        `[PRISMA] ${event.message}`,
      );
    },
  );

  /**
   * ========================================================
   * PRISMA WARNING EVENTS
   * ========================================================
   */

  client.$on(
    "warn",
    (event: Prisma.LogEvent) => {
      logger.warn(
        `[PRISMA] ${event.message}`,
      );
    },
  );

  /**
   * ========================================================
   * PRISMA INFO EVENTS
   * ========================================================
   */

  client.$on(
    "info",
    (event: Prisma.LogEvent) => {
      if (
        !isProduction
      ) {
        logger.info(
          `[PRISMA] ${event.message}`,
        );
      }
    },
  );

  /**
   * ========================================================
   * PRISMA QUERY EVENTS
   * ========================================================
   */

  if (
    process.env.PRISMA_LOG_QUERIES ===
      "true" &&
    !isProduction
  ) {
    client.$on(
      "query",
    (event: Prisma.QueryEvent) => {
        logger.debug(
          `[PRISMA] Query (${event.duration}ms): ${event.query}`,
        );
      },
    );
  }

  return client;
}

/**
 * ============================================================
 * SINGLETON
 * ============================================================
 */

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

/**
 * Conserver l'instance en développement.
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

export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();

    await prisma.$queryRaw`
      SELECT 1
    `;

    logger.info(
      "[PRISMA] Database connection established.",
    );
  } catch (error) {
    logger.error(
      "[PRISMA] Database connection failed.",
      error,
    );

    throw error;
  }
}

/**
 * ============================================================
 * DISCONNECT
 * ============================================================
 */

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();

    logger.info(
      "[PRISMA] Database connection closed.",
    );
  } catch (error) {
    logger.error(
      "[PRISMA] Database disconnection failed.",
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

export async function prismaHealthCheck(): Promise<{
  healthy: boolean;

  latencyMs: number;

  timestamp: string;

  error?: string;
}> {
  const startedAt =
    Date.now();

  try {
    await prisma.$queryRaw`
      SELECT 1
    `;

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

    logger.error(
      "[PRISMA] Health check failed.",
      error,
    );

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
 * ============================================================
 * IS CONNECTED
 * ============================================================
 */

export async function isPrismaConnected(): Promise<boolean> {
  const health =
    await prismaHealthCheck();

  return health.healthy;
}

/**
 * ============================================================
 * TRANSACTION
 * ============================================================
 *
 * Exemple :
 *
 * await prismaTransaction(async (tx) => {
 *   await tx.user.create(...);
 *   await tx.subscription.create(...);
 * });
 *
 * ============================================================
 */

export async function prismaTransaction<
  T,
>(
  callback: (
    tx: Prisma.TransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      return callback(tx);
    },
  );
}

/**
 * ============================================================
 * TRANSACTION OPTIONS
 * ============================================================
 */

export interface PrismaTransactionOptions {
  maxWait?: number;

  timeout?: number;

  isolationLevel?:
    | "ReadUncommitted"
    | "ReadCommitted"
    | "RepeatableRead"
    | "Serializable";
}

/**
 * ============================================================
 * ADVANCED TRANSACTION
 * ============================================================
 */

export async function prismaTransactionAdvanced<
  T,
>(
  callback: (
    tx: Prisma.TransactionClient,
  ) => Promise<T>,
  options?: PrismaTransactionOptions,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      return callback(tx);
    },
    {
      maxWait:
        options?.maxWait ??
        5000,

      timeout:
        options?.timeout ??
        10000,

      ...(options?.isolationLevel
        ? {
            isolationLevel:
              options.isolationLevel as any,
          }
        : {}),
    },
  );
}

/**
 * ============================================================
 * DATABASE OPERATION RETRY
 * ============================================================
 */

export interface PrismaRetryOptions {
  retries?: number;

  delayMs?: number;

  backoffFactor?: number;

  maxDelayMs?: number;
}

/**
 * ============================================================
 * SLEEP
 * ============================================================
 */

function sleep(
  ms: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        ms,
      );
    },
  );
}

/**
 * ============================================================
 * WITH PRISMA RETRY
 * ============================================================
 */

export async function withPrismaRetry<
  T,
>(
  operation: () => Promise<T>,
  options?: PrismaRetryOptions,
): Promise<T> {
  const retries =
    Math.max(
      1,
      options?.retries ??
        3,
    );

  const delayMs =
    Math.max(
      0,
      options?.delayMs ??
        500,
    );

  const backoffFactor =
    Math.max(
      1,
      options?.backoffFactor ??
        2,
    );

  const maxDelayMs =
    Math.max(
      delayMs,
      options?.maxDelayMs ??
        5000,
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
        `[PRISMA] Database operation failed. attempt=${attempt}/${retries}`,
      );

      if (
        attempt >=
        retries
      ) {
        break;
      }

      const delay = Math.min(
        delayMs *
          Math.pow(
            backoffFactor,
            attempt - 1,
          ),
        maxDelayMs,
      );

      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Prisma operation failed after retries.",
      );
}

/**
 * ============================================================
 * TRANSACTION WITH RETRY
 * ============================================================
 */

export async function prismaTransactionWithRetry<
  T,
>(
  callback: (
    tx: Prisma.TransactionClient,
  ) => Promise<T>,
  retryOptions?: PrismaRetryOptions,
  transactionOptions?: PrismaTransactionOptions,
): Promise<T> {
  return withPrismaRetry(
    () =>
      prismaTransactionAdvanced(
        callback,
        transactionOptions,
      ),
    retryOptions,
  );
}

/**
 * ============================================================
 * DATABASE STATS
 * ============================================================
 *
 * Informations simples utiles au dashboard Admin.
 * ============================================================
 */

export async function getPrismaRuntimeInfo(): Promise<{
  environment: string;

  nodeVersion: string;

  connected: boolean;

  timestamp: string;
}> {
  const connected =
    await isPrismaConnected();

  return {
    environment:
      NODE_ENV,

    nodeVersion:
      process.version,

    connected,

    timestamp:
      new Date().toISOString(),
  };
}

/**
 * ============================================================
 * SHUTDOWN HANDLER
 * ============================================================
 */

let shutdownRegistered =
  false;

export function registerPrismaShutdown(): void {
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
        `[PRISMA] Received ${signal}. Closing Prisma...`,
      );

      try {
        await disconnectPrisma();

        logger.info(
          "[PRISMA] Graceful shutdown completed.",
        );
      } catch (error) {
        logger.error(
          "[PRISMA] Graceful shutdown failed.",
          error,
        );
      }
    };

  process.once(
    "SIGINT",
    () => {
      void shutdown(
        "SIGINT",
      );
    },
  );

  process.once(
    "SIGTERM",
    () => {
      void shutdown(
        "SIGTERM",
      );
    },
  );
}

/**
 * ============================================================
 * INITIALIZE PRISMA
 * ============================================================
 */

export async function initializePrisma(): Promise<void> {
  registerPrismaShutdown();

  await connectPrisma();
}

/**
 * ============================================================
 * VALIDATE CONFIGURATION
 * ============================================================
 */

export function validatePrismaConfiguration(): {
  valid: boolean;

  hasDatabaseUrl: boolean;

  environment: string;

  queryLogging: boolean;
} {
  const databaseUrl =
    process.env.DATABASE_URL;

  return {
    valid:
      Boolean(
        databaseUrl,
      ),

    hasDatabaseUrl:
      Boolean(
        databaseUrl,
      ),

    environment:
      NODE_ENV,

    queryLogging:
      process.env.PRISMA_LOG_QUERIES ===
      "true",
  };
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default prisma;
