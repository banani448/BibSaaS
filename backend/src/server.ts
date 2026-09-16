
/**
 * ============================================================
 * BibSaaS Premium API — HTTP Server
 * ============================================================
 *
 * File:
 * src/server.ts
 *
 * Responsibilities:
 * - Create HTTP server
 * - Start application
 * - Validate database connection
 * - Graceful shutdown
 * - Handle process-level errors
 * - Configure HTTP timeouts
 * - Production-ready lifecycle management
 *
 * ============================================================
 */

import http from "http";

import config from "./config/env";

import logger, {
  logError,
} from "./config/logger";

import createApp from "./app";

import {
  testDatabaseConnection,
  disconnectDatabase,
} from "./config/database";

/**
 * ============================================================
 * APPLICATION
 * ============================================================
 */

const app = createApp();

/**
 * ============================================================
 * HTTP SERVER
 * ============================================================
 */

const server = http.createServer(app);

/**
 * ============================================================
 * SERVER CONFIGURATION
 * ============================================================
 */

const SERVER_TIMEOUT = Number(
  process.env.SERVER_TIMEOUT ??
    120_000,
);

const KEEP_ALIVE_TIMEOUT = Number(
  process.env.KEEP_ALIVE_TIMEOUT ??
    65_000,
);

const HEADERS_TIMEOUT = Number(
  process.env.HEADERS_TIMEOUT ??
    66_000,
);

const SHUTDOWN_TIMEOUT = Number(
  process.env.SHUTDOWN_TIMEOUT ??
    10_000,
);

/**
 * ============================================================
 * HTTP TIMEOUTS
 * ============================================================
 *
 * headersTimeout doit rester supérieur au keepAliveTimeout.
 * ============================================================
 */

server.timeout =
  SERVER_TIMEOUT;

server.keepAliveTimeout =
  KEEP_ALIVE_TIMEOUT;

server.headersTimeout =
  Math.max(
    HEADERS_TIMEOUT,
    KEEP_ALIVE_TIMEOUT + 1_000,
  );

/**
 * ============================================================
 * SERVER STATE
 * ============================================================
 */

let isShuttingDown = false;

let isStarted = false;

/**
 * ============================================================
 * DATABASE STARTUP CHECK
 * ============================================================
 */

const verifyDatabase =
  async (): Promise<boolean> => {
    try {
      logger.info(
        "Checking database connection...",
      );

      const connected =
        await testDatabaseConnection();

      if (!connected) {
        logger.error(
          "Database connection failed.",
        );

        return false;
      }

      logger.info(
        "Database connection established.",
      );

      return true;
    } catch (error) {
      logError(
        error,
        {
          operation:
            "database_startup_check",
        },
      );

      return false;
    }
  };

/**
 * ============================================================
 * GRACEFUL SHUTDOWN
 * ============================================================
 */

const gracefulShutdown =
  async (
    signal: string,
  ): Promise<void> => {
    /**
     * Prevent multiple shutdowns.
     */
    if (isShuttingDown) {
      logger.warn(
        "Shutdown already in progress.",
        {
          signal,
        },
      );

      return;
    }

    isShuttingDown = true;

    logger.warn(
      `${signal} received. Starting graceful shutdown...`,
      {
        signal,
      },
    );

    /**
     * --------------------------------------------------------
     * FORCE EXIT TIMER
     * --------------------------------------------------------
     */

    const forceExitTimer =
      setTimeout(
        () => {
          logger.error(
            "Forced shutdown after timeout.",
            {
              timeout:
                SHUTDOWN_TIMEOUT,
            },
          );

          process.exit(1);
        },
        SHUTDOWN_TIMEOUT,
      );

    /**
     * The timer must not keep the process alive.
     */
    forceExitTimer.unref();

    try {
      /**
       * ------------------------------------------------------
       * STOP ACCEPTING NEW REQUESTS
       * ------------------------------------------------------
       */

      if (isStarted) {
        await new Promise<void>(
          (
            resolve,
            reject,
          ) => {
            server.close(
              (
                error,
              ) => {
                if (error) {
                  /**
                   * If the server is already closed, there is
                   * nothing else to do.
                   */
                  if (
                    (
                      error as NodeJS.ErrnoException
                    ).code ===
                    "ERR_SERVER_NOT_RUNNING"
                  ) {
                    logger.warn(
                      "HTTP server was already stopped.",
                    );

                    resolve();

                    return;
                  }

                  reject(error);

                  return;
                }

                logger.info(
                  "HTTP server closed successfully.",
                );

                isStarted =
                  false;

                resolve();
              },
            );
          },
        );
      } else {
        logger.info(
          "HTTP server was not running.",
        );
      }

      /**
       * ------------------------------------------------------
       * DATABASE DISCONNECT
       * ------------------------------------------------------
       */

      logger.info(
        "Closing database connections...",
      );

      await disconnectDatabase();

      logger.info(
        "Database connections closed.",
      );

      /**
       * ------------------------------------------------------
       * COMPLETE
       * ------------------------------------------------------
       */

      clearTimeout(
        forceExitTimer,
      );

      logger.info(
        "Graceful shutdown completed successfully.",
      );

      process.exit(0);
    } catch (error) {
      clearTimeout(
        forceExitTimer,
      );

      logError(
        error,
        {
          operation:
            "graceful_shutdown",

          signal,
        },
      );

      process.exit(1);
    }
  };

/**
 * ============================================================
 * PROCESS ERROR HANDLERS
 * ============================================================
 *
 * Uncaught exceptions and unhandled rejections are fatal
 * conditions for a production Node.js application.
 *
 * We log them and initiate graceful shutdown.
 * ============================================================
 */

process.on(
  "uncaughtException",
  (
    error: Error,
  ) => {
    logger.error(
      "Uncaught exception detected.",
      {
        name:
          error.name,

        message:
          error.message,

        stack:
          error.stack,
      },
    );

    void gracefulShutdown(
      "UNCAUGHT_EXCEPTION",
    );
  },
);

process.on(
  "unhandledRejection",
  (
    reason: unknown,
  ) => {
    logger.error(
      "Unhandled promise rejection detected.",
      {
        reason:
          reason instanceof Error
            ? {
                name:
                  reason.name,

                message:
                  reason.message,

                stack:
                  reason.stack,
              }
            : String(
                reason,
              ),
      },
    );

    void gracefulShutdown(
      "UNHANDLED_REJECTION",
    );
  },
);

/**
 * ============================================================
 * SIGNAL HANDLERS
 * ============================================================
 */

process.once(
  "SIGTERM",
  () => {
    void gracefulShutdown(
      "SIGTERM",
    );
  },
);

process.once(
  "SIGINT",
  () => {
    void gracefulShutdown(
      "SIGINT",
    );
  },
);

/**
 * ============================================================
 * SERVER ERROR HANDLER
 * ============================================================
 */

server.on(
  "error",
  (
    error: NodeJS.ErrnoException,
  ) => {
    if (
      error.code ===
      "EADDRINUSE"
    ) {
      logger.error(
        `Port ${config.PORT} is already in use.`,
        {
          port:
            config.PORT,

          code:
            error.code,
        },
      );
    } else if (
      error.code ===
      "EACCES"
    ) {
      logger.error(
        `Permission denied while trying to use port ${config.PORT}.`,
        {
          port:
            config.PORT,

          code:
            error.code,
        },
      );
    } else {
      logError(
        error,
        {
          operation:
            "http_server_error",
        },
      );
    }

    /**
     * The server cannot safely continue after a startup
     * error such as EADDRINUSE or EACCES.
     */
    if (
      !isShuttingDown
    ) {
      process.exit(1);
    }
  },
);

/**
 * ============================================================
 * START SERVER
 * ============================================================
 */

const startServer =
  async (): Promise<void> => {
    if (isStarted) {
      logger.warn(
        "Server is already started.",
      );

      return;
    }

    if (isShuttingDown) {
      logger.warn(
        "Server cannot start because shutdown is in progress.",
      );

      return;
    }

    logger.info(
      "Starting BibSaaS Premium API...",
      {
        environment:
          config.NODE_ENV,

        version:
          process.env.APP_VERSION ??
          "1.0.0",
      },
    );

    /**
     * --------------------------------------------------------
     * DATABASE CHECK
     * --------------------------------------------------------
     */

    const databaseReady =
      await verifyDatabase();

    if (!databaseReady) {
      logger.error(
        "Application startup aborted because database is unavailable.",
      );

      process.exit(1);

    }

    /**
     * --------------------------------------------------------
     * START HTTP SERVER
     * --------------------------------------------------------
     *
     * server.on("error") is already registered globally above.
     *
     * We therefore only wait for the listening event here.
     * ========================================================
     */

    await new Promise<void>(
      (
        resolve,
      ) => {
        server.listen(
          config.PORT,
          () => {
            isStarted =
              true;

            resolve();
          },
        );
      },
    );

    /**
     * --------------------------------------------------------
     * STARTUP LOGS
     * --------------------------------------------------------
     *
     * API routes are mounted under /api.
     *
     * Therefore:
     *
     * /api/docs
     * /api/health
     * /api/ready
     * ========================================================
     */

    const apiBaseUrl =
      `${config.API_URL}/api`;

    logger.info(
      "BibSaaS Premium API server started successfully.",
      {
        appName:
          config.APP_NAME,

        port:
          config.PORT,

        environment:
          config.NODE_ENV,

        apiUrl:
          config.API_URL,

        apiBaseUrl,

        documentation:
          `${apiBaseUrl}/docs`,

        openapi:
          `${apiBaseUrl}/docs.json`,

        health:
          `${apiBaseUrl}/health`,

        readiness:
          `${apiBaseUrl}/ready`,

        payments:
          `${apiBaseUrl}/payments`,

        stripeWebhook:
          `${apiBaseUrl}/payments/stripe/webhook`,

        database:
          "connected",

        pid:
          process.pid,

        nodeVersion:
          process.version,

        uptime:
          process.uptime(),
      },
    );
  };

/**
 * ============================================================
 * START ONLY OUTSIDE TEST ENVIRONMENT
 * ============================================================
 */

if (
  config.NODE_ENV !==
  "test"
) {
  void startServer().catch(
    (error) => {
      logError(
        error,
        {
          operation:
            "server_startup",
        },
      );

      process.exit(1);
    },
  );
}

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export {
  app,
  server,
  startServer,
  gracefulShutdown,
};

export default server;

