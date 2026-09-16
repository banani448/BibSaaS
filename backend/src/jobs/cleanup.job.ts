
/**
 * ============================================================
 * BibSaaS — Cleanup Job
 * ============================================================
 *
 * File:
 * src/jobs/cleanup.job.ts
 *
 * Description:
 * Tâche planifiée de maintenance.
 *
 * Nettoyage actuellement pris en charge :
 * - Paiements PENDING / PROCESSING trop anciens
 * - Abonnements ACTIVE arrivés à expiration
 *
 * IMPORTANT :
 * Le schéma Prisma actuel de BibSaaS ne contient pas, dans la
 * structure utilisée ici, les modèles :
 *
 * - Session
 * - RefreshToken
 * - EmailVerificationToken
 * - PasswordResetToken
 * - OTP
 * - IdempotencyKey
 *
 * Ces nettoyages ne sont donc PAS exécutés dans ce fichier.
 *
 * De même, les réservations ne sont pas modifiées ici tant que
 * leurs champs exacts dans le schéma Prisma ne sont pas confirmés.
 *
 * ============================================================
 */

import cron, {
  ScheduledTask,
} from "node-cron";

import { PrismaClient } from "@prisma/client";

import logger from "../config/logger";

/**
 * ============================================================
 * PRISMA CLIENT
 * ============================================================
 *
 * Instance Prisma utilisée par le job de nettoyage.
 *
 * IMPORTANT :
 * Si ton projet possède déjà un singleton Prisma dans
 * `src/config/database.ts` ou `src/config/prisma.ts`,
 * il est préférable d'importer ce singleton au lieu de créer
 * une nouvelle instance ici.
 *
 * Pour l'instant, cette déclaration corrige l'erreur :
 *
 * Cannot find name 'prisma'
 *
 * ============================================================
 */

const prisma = new PrismaClient();

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface CleanupResult {
  task: string;

  success: boolean;

  affected: number;

  durationMs: number;

  error?: string;
}

interface CleanupSummary {
  startedAt: Date;

  finishedAt: Date;

  durationMs: number;

  success: boolean;

  totalAffected: number;

  results: CleanupResult[];
}

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const CLEANUP_CONFIG = {
  /**
   * Paiements PENDING / PROCESSING considérés comme expirés
   * après cette durée.
   */
  paymentRetentionDays: Number(
    process.env.CLEANUP_PAYMENT_RETENTION_DAYS ?? 90,
  ),

  /**
   * Active/désactive le job.
   */
  enabled:
    process.env.CLEANUP_JOB_ENABLED !== "false",

  /**
   * Tous les jours à 03:00 par défaut.
   */
  schedule:
    process.env.CLEANUP_JOB_SCHEDULE ??
    "0 3 * * *",

  /**
   * Fuseau horaire de l'application.
   */
  timezone:
    process.env.APP_TIMEZONE ??
    "Africa/Brazzaville",
};

/**
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

function getDateDaysAgo(
  days: number,
): Date {
  const date = new Date();

  date.setUTCDate(
    date.getUTCDate() - days,
  );

  return date;
}

function getDurationMs(
  startTime: number,
): number {
  return Date.now() - startTime;
}

/**
 * ============================================================
 * LOGGER HELPERS
 * ============================================================
 */

function logCleanupStart(
  task: string,
): void {
  logger.info(
    `[CLEANUP] Starting task: ${task}`,
  );
}

function logCleanupSuccess(
  task: string,
  affected: number,
  durationMs: number,
): void {
  logger.info(
    `[CLEANUP] Completed task=${task} affected=${affected} duration=${durationMs}ms`,
  );
}

function logCleanupError(
  task: string,
  error: unknown,
): void {
  logger.error(
    `[CLEANUP] Failed task=${task}`,
    error,
  );
}

/**
 * ============================================================
 * GENERIC TASK RUNNER
 * ============================================================
 */

async function executeCleanupTask(
  task: string,
  operation: () => Promise<number>,
): Promise<CleanupResult> {
  const startTime = Date.now();

  logCleanupStart(task);

  try {
    const affected =
      await operation();

    const durationMs =
      getDurationMs(startTime);

    logCleanupSuccess(
      task,
      affected,
      durationMs,
    );

    return {
      task,
      success: true,
      affected,
      durationMs,
    };
  } catch (error: unknown) {
    const durationMs =
      getDurationMs(startTime);

    logCleanupError(
      task,
      error,
    );

    return {
      task,
      success: false,
      affected: 0,
      durationMs,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

/**
 * ============================================================
 * CLEAN EXPIRED PAYMENTS
 * ============================================================
 *
 * Aucun paiement n'est supprimé.
 *
 * Les paiements PENDING / PROCESSING qui sont trop anciens
 * sont marqués FAILED.
 *
 * Les paiements SUCCESS restent toujours conservés.
 *
 * Le modèle Payment actuel comprend notamment :
 * - status
 * - createdAt
 * - failureCode
 * - failureMessage
 *
 * ============================================================
 */

async function cleanupExpiredPayments(): Promise<number> {
  const cutoff =
    getDateDaysAgo(
      CLEANUP_CONFIG.paymentRetentionDays,
    );

  const result =
    await prisma.payment.updateMany({
      where: {
        status: {
          in: [
            "PENDING",
            "PROCESSING",
          ],
        },

        createdAt: {
          lt: cutoff,
        },
      },

      data: {
        status: "FAILED",

        failureCode:
          "PAYMENT_TIMEOUT",

        failureMessage:
          "Payment automatically expired by cleanup job.",
      },
    });

  return result.count;
}

/**
 * ============================================================
 * CLEAN EXPIRED SUBSCRIPTIONS
 * ============================================================
 *
 * Les abonnements ACTIVE dont la date de fin est dépassée
 * sont marqués EXPIRED.
 *
 * ============================================================
 */

async function cleanupExpiredSubscriptions(): Promise<number> {
  const now = new Date();

  const result =
    await prisma.subscription.updateMany({
      where: {
        status: "ACTIVE",

        endDate: {
          lt: now,
        },
      },

      data: {
        status: "EXPIRED",
      },
    });

  return result.count;
}

/**
 * ============================================================
 * RUN ALL CLEANUP TASKS
 * ============================================================
 */

export async function runCleanupJob(): Promise<CleanupSummary> {
  const startedAt =
    new Date();

  const results: CleanupResult[] = [];

  /**
   * Paiements expirés.
   */
  results.push(
    await executeCleanupTask(
      "expired-payments",
      cleanupExpiredPayments,
    ),
  );

  /**
   * Abonnements expirés.
   */
  results.push(
    await executeCleanupTask(
      "expired-subscriptions",
      cleanupExpiredSubscriptions,
    ),
  );

  const finishedAt =
    new Date();

  const durationMs =
    finishedAt.getTime() -
    startedAt.getTime();

  const totalAffected =
    results.reduce(
      (
        total,
        result,
      ) =>
        total + result.affected,
      0,
    );

  const success =
    results.every(
      (result) =>
        result.success,
    );

  const summary: CleanupSummary = {
    startedAt,

    finishedAt,

    durationMs,

    success,

    totalAffected,

    results,
  };

  logger.info(
    `[CLEANUP] Job completed success=${success} totalAffected=${totalAffected} duration=${durationMs}ms`,
  );

  return summary;
}

/**
 * ============================================================
 * CRON SCHEDULER
 * ============================================================
 */

let cleanupTask:
  | ScheduledTask
  | null = null;

/**
 * Démarre le scheduler.
 */
export function startCleanupJob():
  | ScheduledTask
  | null {
  /**
   * Job désactivé.
   */
  if (!CLEANUP_CONFIG.enabled) {
    logger.warn(
      "[CLEANUP] Cleanup job disabled",
    );

    return null;
  }

  /**
   * Job déjà démarré.
   */
  if (cleanupTask) {
    logger.warn(
      "[CLEANUP] Cleanup job already running",
    );

    return cleanupTask;
  }

  /**
   * Vérification de l'expression CRON.
   */
  if (
    !cron.validate(
      CLEANUP_CONFIG.schedule,
    )
  ) {
    throw new Error(
      `[CLEANUP] Invalid cron expression: ${CLEANUP_CONFIG.schedule}`,
    );
  }

  cleanupTask =
    cron.schedule(
      CLEANUP_CONFIG.schedule,
      async () => {
        try {
          await runCleanupJob();
        } catch (error: unknown) {
          logger.error(
            "[CLEANUP] Unexpected cleanup job error",
            error,
          );
        }
      },
      {
        timezone:
          CLEANUP_CONFIG.timezone,
      },
    );

  logger.info(
    `[CLEANUP] Job scheduled: ${CLEANUP_CONFIG.schedule} timezone=${CLEANUP_CONFIG.timezone}`,
  );

  return cleanupTask;
}

/**
 * ============================================================
 * STOP SCHEDULER
 * ============================================================
 */

export function stopCleanupJob(): void {
  if (!cleanupTask) {
    return;
  }

  cleanupTask.stop();

  cleanupTask = null;

  logger.info(
    "[CLEANUP] Cleanup job stopped",
  );
}

/**
 * ============================================================
 * JOB STATUS
 * ============================================================
 */

export function isCleanupJobRunning(): boolean {
  return cleanupTask !== null;
}

/**
 * ============================================================
 * MANUAL EXECUTION
 * ============================================================
 */

export async function executeCleanupManually(): Promise<CleanupSummary> {
  logger.info(
    "[CLEANUP] Manual cleanup execution requested",
  );

  return runCleanupJob();
}

/**
 * ============================================================
 * SHUTDOWN
 * ============================================================
 */

export async function shutdownCleanupJob(): Promise<void> {
  stopCleanupJob();

  await prisma.$disconnect();

  logger.info(
    "[CLEANUP] Cleanup resources released",
  );
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  start:
    startCleanupJob,

  stop:
    stopCleanupJob,

  run:
    runCleanupJob,

  executeManually:
    executeCleanupManually,

  isRunning:
    isCleanupJobRunning,

  shutdown:
    shutdownCleanupJob,
};

