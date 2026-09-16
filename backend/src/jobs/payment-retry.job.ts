
/**
 * ============================================================
 * BibSaaS — Payment Retry / Recovery Job
 * ============================================================
 *
 * File:
 * jobs/payment-retry.job.ts
 *
 * Description:
 * Job automatique permettant de vérifier et récupérer les
 * paiements Stripe restés dans un état PENDING / PROCESSING.
 *
 * IMPORTANT :
 * - Ce job ne crée PAS un nouveau débit Stripe.
 * - Il vérifie d'abord l'état du paiement auprès de Stripe.
 * - Le webhook Stripe reste la source de vérité.
 * - Le schema.prisma n'est pas modifié.
 *
 * Providers traités :
 * - STRIPE
 * - SIMULATED
 *
 * Les anciens providers (CinetPay, MTN, Airtel, etc.) ne sont
 * volontairement plus traités par ce job.
 *
 * ============================================================
 */

import cron, { ScheduledTask } from "node-cron";
import {
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
} from "@prisma/client";

import logger from "../config/logger";
import paymentService from "../services/payment.service";

/**
 * ============================================================
 * PRISMA
 * ============================================================
 */

const prisma = new PrismaClient();

/**
 * ============================================================
 * PAYMENT SERVICE ADAPTER
 * ============================================================
 *
 * On ne dépend que de verifyPayment().
 * Cela évite de coupler le job à toute l'implémentation
 * interne de PaymentService.
 */

interface PaymentServiceAdapter {
  verifyPayment(paymentId: string): Promise<unknown>;
}

const paymentProcessor =
  paymentService as unknown as PaymentServiceAdapter;

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const RETRY_CONFIG = {
  enabled:
    process.env.PAYMENT_RETRY_JOB_ENABLED !== "false",

  schedule:
    process.env.PAYMENT_RETRY_JOB_SCHEDULE ??
    "*/5 * * * *",

  batchSize: Math.max(
    1,
    Number(
      process.env.PAYMENT_RETRY_BATCH_SIZE ?? 50,
    ),
  ),

  /**
   * Nombre maximum de vérifications automatiques
   * avant expiration du paiement.
   *
   * Comme le schema ne contient pas retryCount,
   * nous utilisons l'âge du paiement et updatedAt.
   */
  maxAgeMinutes: Math.max(
    1,
    Number(
      process.env.PAYMENT_RETRY_MAX_AGE_MINUTES ?? 120,
    ),
  ),

  /**
   * Un paiement ne sera pas revérifié plus souvent
   * que cette fréquence.
   *
   * Exemple :
   * 5 minutes => une vérification maximum toutes
   * les 5 minutes.
   */
  minVerificationIntervalMinutes: Math.max(
    1,
    Number(
      process.env.PAYMENT_RETRY_INTERVAL_MINUTES ?? 5,
    ),
  ),

  /**
   * PROCESSING considéré comme bloqué après ce délai.
   */
  staleProcessingMinutes: Math.max(
    1,
    Number(
      process.env.PAYMENT_RETRY_STALE_MINUTES ?? 15,
    ),
  ),
};

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface RetryablePayment {
  id: string;

  transactionReference: string;

  providerTransactionId: string | null;

  providerPaymentId: string | null;

  provider: PaymentProvider;

  status: PaymentStatus;

  amount: number;

  currency: string;

  createdAt: Date;

  updatedAt: Date;
}

interface RetryTaskResult {
  task: string;

  success: boolean;

  processed: number;

  retried: number;

  succeeded: number;

  failed: number;

  expired: number;

  skipped: number;

  durationMs: number;

  errors: string[];
}

interface PaymentRetrySummary {
  success: boolean;

  startedAt: Date;

  finishedAt: Date;

  durationMs: number;

  processed: number;

  retried: number;

  succeeded: number;

  failed: number;

  expired: number;

  skipped: number;

  tasks: RetryTaskResult[];
}

/**
 * ============================================================
 * UTILS
 * ============================================================
 */

function getDurationMs(start: number): number {
  return Date.now() - start;
}

function getDateMinutesAgo(minutes: number): Date {
  return new Date(
    Date.now() - minutes * 60 * 1000,
  );
}

/**
 * ============================================================
 * CHECK RETRYABLE STATUS
 * ============================================================
 */

function isRetryableStatus(
  status: PaymentStatus,
): boolean {
  return (
    status === PaymentStatus.PENDING ||
    status === PaymentStatus.PROCESSING
  );
}

/**
 * ============================================================
 * CHECK MAX AGE
 * ============================================================
 */

function hasExceededMaxAge(
  payment: RetryablePayment,
): boolean {
  const maxAgeMs =
    RETRY_CONFIG.maxAgeMinutes *
    60 *
    1000;

  return (
    Date.now() - payment.createdAt.getTime() >
    maxAgeMs
  );
}

/**
 * ============================================================
 * CHECK VERIFICATION INTERVAL
 * ============================================================
 *
 * Le schema ne possède pas nextRetryAt.
 *
 * Nous utilisons donc updatedAt comme horodatage de la
 * dernière modification / vérification du paiement.
 */

function isReadyForVerification(
  payment: RetryablePayment,
): boolean {
  const intervalMs =
    RETRY_CONFIG.minVerificationIntervalMinutes *
    60 *
    1000;

  return (
    Date.now() - payment.updatedAt.getTime() >=
    intervalMs
  );
}

/**
 * ============================================================
 * FIND RETRYABLE PAYMENTS
 * ============================================================
 *
 * IMPORTANT :
 * On filtre explicitement les providers que ce job sait gérer.
 *
 * Cela évite qu'un ancien paiement CinetPay ou Mobile Money
 * soit envoyé par erreur dans le flux Stripe.
 */

async function findRetryablePayments(): Promise<
  RetryablePayment[]
> {
  const cutoff =
    getDateMinutesAgo(
      RETRY_CONFIG.maxAgeMinutes,
    );

  const payments =
    await prisma.payment.findMany({
      where: {
        provider: {
          in: [
            PaymentProvider.STRIPE,
            PaymentProvider.SIMULATED,
          ],
        },

        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.PROCESSING,
          ],
        },

        createdAt: {
          gte: cutoff,
        },
      },

      orderBy: {
        createdAt: "asc",
      },

      take: RETRY_CONFIG.batchSize,
    });

  return payments;
}

/**
 * ============================================================
 * VERIFY CURRENT PAYMENT
 * ============================================================
 *
 * Avant toute tentative de récupération, on demande au
 * PaymentService de vérifier le paiement auprès du provider.
 *
 * C'est particulièrement important avec Stripe :
 *
 * - le paiement peut être réussi ;
 * - le serveur peut avoir raté le webhook ;
 * - le client peut avoir fermé son navigateur ;
 * - le paiement peut donc être finalisé côté Stripe alors
 *   que BibSaaS le voit encore PENDING.
 */

async function verifyCurrentPayment(
  payment: RetryablePayment,
): Promise<{
  completed: boolean;

  status?: PaymentStatus;

  raw?: unknown;
}> {
  try {
    const result =
      await paymentProcessor.verifyPayment(
        payment.id,
      );

    if (
      result &&
      typeof result === "object"
    ) {
      const normalized =
        result as {
          status?: string;

          verified?: boolean;

          success?: boolean;

          payment?: {
            status?: string;
          };

          data?: {
            status?: string;
          };
        };

      const status =
        normalized.status ??
        normalized.payment?.status ??
        normalized.data?.status;

      /**
       * Paiement réussi.
       */
      if (
        status === PaymentStatus.SUCCESS ||
        normalized.verified === true ||
        normalized.success === true
      ) {
        return {
          completed: true,

          status:
            PaymentStatus.SUCCESS,

          raw: result,
        };
      }

      /**
       * Paiement définitivement échoué.
       */
      if (
        status === PaymentStatus.FAILED ||
        status === PaymentStatus.CANCELLED
      ) {
        return {
          completed: true,

          status:
            status as PaymentStatus,

          raw: result,
        };
      }

      /**
       * Paiement encore en attente.
       */
      if (
        status === PaymentStatus.PENDING ||
        status === PaymentStatus.PROCESSING
      ) {
        return {
          completed: false,

          status:
            status as PaymentStatus,

          raw: result,
        };
      }
    }

    return {
      completed: false,

      raw: result,
    };
  } catch (error) {
    logger.warn(
      `[PAYMENT-RETRY] Stripe verification failed payment=${payment.id}`,
      error,
    );

    return {
      completed: false,
    };
  }
}

/**
 * ============================================================
 * MARK PAYMENT CHECKED
 * ============================================================
 *
 * Comme le schema ne possède pas de retryCount / nextRetryAt,
 * updatedAt sert de mécanisme simple de throttling.
 *
 * On ne modifie pas le statut ici.
 */

async function markPaymentChecked(
  paymentId: string,
): Promise<void> {
  await prisma.payment.updateMany({
    where: {
      id: paymentId,

      status: {
        in: [
          PaymentStatus.PENDING,
          PaymentStatus.PROCESSING,
        ],
      },
    },

    data: {
      updatedAt: new Date(),
    },
  });
}

/**
 * ============================================================
 * EXPIRE PAYMENT
 * ============================================================
 *
 * Un paiement qui dépasse la durée maximale est marqué FAILED.
 *
 * Nous ne supprimons jamais le paiement.
 */

async function expirePayment(
  paymentId: string,
): Promise<void> {
  const updated =
    await prisma.payment.updateMany({
      where: {
        id: paymentId,

        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.PROCESSING,
          ],
        },
      },

      data: {
        status: PaymentStatus.FAILED,

        failureCode: "PAYMENT_TIMEOUT",

        failureMessage:
          "Paiement expiré après la durée maximale de traitement.",

        updatedAt: new Date(),
      },
    });

  if (updated.count > 0) {
    logger.warn(
      `[PAYMENT-RETRY] Payment expired payment=${paymentId}`,
    );
  }
}

/**
 * ============================================================
 * APPLY VERIFIED STATUS
 * ============================================================
 *
 * Cette fonction est volontairement prudente.
 *
 * Le PaymentService / webhook reste responsable de la logique
 * métier complète (invoice, subscription, PaymentEvent, etc.).
 *
 * Le job ne tente pas de reproduire cette logique.
 */

async function applyVerifiedStatus(
  payment: RetryablePayment,
  status: PaymentStatus,
): Promise<void> {
  if (
    status !== PaymentStatus.FAILED &&
    status !== PaymentStatus.CANCELLED
  ) {
    return;
  }

  await prisma.payment.updateMany({
    where: {
      id: payment.id,

      status: {
        in: [
          PaymentStatus.PENDING,
          PaymentStatus.PROCESSING,
        ],
      },
    },

    data: {
      status,

      updatedAt: new Date(),
    },
  });
}

/**
 * ============================================================
 * RETRY ONE PAYMENT
 * ============================================================
 *
 * ATTENTION :
 *
 * "Retry" signifie ici :
 *
 * 1. vérifier l'état réel du paiement ;
 * 2. récupérer le résultat si nécessaire ;
 * 3. laisser Stripe/webhook finaliser la transaction.
 *
 * Nous ne recréons jamais automatiquement un Payment Link
 * et nous ne lançons jamais un nouveau débit.
 */

async function retryPayment(
  payment: RetryablePayment,
): Promise<{
  status:
    | "RETRIED"
    | "SUCCEEDED"
    | "FAILED"
    | "EXPIRED"
    | "SKIPPED";
}> {
  /**
   * Protection 1 :
   * provider.
   */

  if (
    payment.provider !== PaymentProvider.STRIPE &&
    payment.provider !== PaymentProvider.SIMULATED
  ) {
    return {
      status: "SKIPPED",
    };
  }

  /**
   * Protection 2 :
   * statut.
   */

  if (
    !isRetryableStatus(
      payment.status,
    )
  ) {
    return {
      status: "SKIPPED",
    };
  }

  /**
   * Protection 3 :
   * âge maximal.
   */

  if (
    hasExceededMaxAge(
      payment,
    )
  ) {
    await expirePayment(
      payment.id,
    );

    return {
      status: "EXPIRED",
    };
  }

  /**
   * Protection 4 :
   * fréquence de vérification.
   */

  if (
    !isReadyForVerification(
      payment,
    )
  ) {
    return {
      status: "SKIPPED",
    };
  }

  /**
   * Pour Stripe, une vérification est beaucoup plus sûre
   * qu'une nouvelle tentative de paiement.
   */

  const verification =
    await verifyCurrentPayment(
      payment,
    );

  /**
   * Paiement finalisé.
   */

  if (
    verification.completed &&
    verification.status
  ) {
    /**
     * Le PaymentService est normalement responsable de
     * finaliser la logique métier lorsqu'il détecte SUCCESS.
     *
     * Pour FAILED/CANCELLED, on peut mettre à jour le statut
     * directement ici.
     */

    if (
      verification.status ===
        PaymentStatus.FAILED ||
      verification.status ===
        PaymentStatus.CANCELLED
    ) {
      await applyVerifiedStatus(
        payment,
        verification.status,
      );

      return {
        status: "FAILED",
      };
    }

    /**
     * Pour SUCCESS, on ne réécrit pas directement toute la
     * logique métier ici.
     *
     * verifyPayment() de PaymentService doit avoir effectué
     * la synchronisation nécessaire.
     */

    if (
      verification.status ===
      PaymentStatus.SUCCESS
    ) {
      return {
        status: "SUCCEEDED",
      };
    }
  }

  /**
   * Paiement toujours en attente.
   *
   * On actualise updatedAt afin d'éviter de lancer plusieurs
   * vérifications simultanément.
   */

  await markPaymentChecked(
    payment.id,
  );

  logger.info(
    `[PAYMENT-RETRY] Payment checked and still pending payment=${payment.id} reference=${payment.transactionReference}`,
  );

  return {
    status: "RETRIED",
  };
}

/**
 * ============================================================
 * PROCESS RETRYABLE PAYMENTS
 * ============================================================
 */

async function processRetryablePayments(): Promise<RetryTaskResult> {
  const startedAt =
    Date.now();

  const result: RetryTaskResult = {
    task:
      "process-stripe-retryable-payments",

    success: true,

    processed: 0,

    retried: 0,

    succeeded: 0,

    failed: 0,

    expired: 0,

    skipped: 0,

    durationMs: 0,

    errors: [],
  };

  try {
    const payments =
      await findRetryablePayments();

    result.processed =
      payments.length;

    /**
     * Traitement séquentiel volontaire.
     *
     * Cela limite la charge sur Stripe et évite les traitements
     * concurrents inutiles.
     */

    for (const payment of payments) {
      try {
        const retryResult =
          await retryPayment(
            payment,
          );

        switch (
          retryResult.status
        ) {
          case "RETRIED":
            result.retried++;
            break;

          case "SUCCEEDED":
            result.succeeded++;
            break;

          case "FAILED":
            result.failed++;
            break;

          case "EXPIRED":
            result.expired++;
            break;

          case "SKIPPED":
            result.skipped++;
            break;
        }
      } catch (error) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Payment ${payment.id}: ${message}`,
        );

        logger.error(
          `[PAYMENT-RETRY] Failed payment=${payment.id}`,
          error,
        );
      }
    }
  } catch (error) {
    result.success = false;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.errors.push(
      message,
    );

    logger.error(
      "[PAYMENT-RETRY] Failed to retrieve retryable payments",
      error,
    );
  }

  result.durationMs =
    getDurationMs(
      startedAt,
    );

  return result;
}

/**
 * ============================================================
 * RECOVER STALE PROCESSING PAYMENTS
 * ============================================================
 *
 * Un paiement PROCESSING peut rester bloqué après :
 *
 * - timeout réseau ;
 * - crash du serveur ;
 * - webhook retardé ;
 * - problème temporaire Stripe.
 *
 * On vérifie d'abord Stripe.
 */

async function recoverStaleProcessingPayments(): Promise<RetryTaskResult> {
  const startedAt =
    Date.now();

  const result: RetryTaskResult = {
    task:
      "recover-stale-stripe-processing-payments",

    success: true,

    processed: 0,

    retried: 0,

    succeeded: 0,

    failed: 0,

    expired: 0,

    skipped: 0,

    durationMs: 0,

    errors: [],
  };

  try {
    const staleThreshold =
      getDateMinutesAgo(
        RETRY_CONFIG.staleProcessingMinutes,
      );

    const payments =
      await prisma.payment.findMany({
        where: {
          provider: {
            in: [
              PaymentProvider.STRIPE,
              PaymentProvider.SIMULATED,
            ],
          },

          status:
            PaymentStatus.PROCESSING,

          updatedAt: {
            lt: staleThreshold,
          },

          createdAt: {
            gte:
              getDateMinutesAgo(
                RETRY_CONFIG.maxAgeMinutes,
              ),
          },
        },

        orderBy: {
          updatedAt: "asc",
        },

        take:
          RETRY_CONFIG.batchSize,
      });

    result.processed =
      payments.length;

    for (
      const payment of payments
    ) {
      try {
        const retryResult =
          await retryPayment(
            payment,
          );

        switch (
          retryResult.status
        ) {
          case "SUCCEEDED":
            result.succeeded++;
            break;

          case "FAILED":
            result.failed++;
            break;

          case "EXPIRED":
            result.expired++;
            break;

          case "RETRIED":
            result.retried++;
            break;

          case "SKIPPED":
            result.skipped++;
            break;
        }
      } catch (error) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Payment ${payment.id}: ${message}`,
        );

        logger.error(
          `[PAYMENT-RETRY] Failed stale payment=${payment.id}`,
          error,
        );
      }
    }
  } catch (error) {
    result.success = false;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.errors.push(
      message,
    );

    logger.error(
      "[PAYMENT-RETRY] Failed to recover stale processing payments",
      error,
    );
  }

  result.durationMs =
    getDurationMs(
      startedAt,
    );

  return result;
}

/**
 * ============================================================
 * EXPIRE OLD PAYMENTS
 * ============================================================
 */

async function expireOldPayments(): Promise<RetryTaskResult> {
  const startedAt =
    Date.now();

  const result: RetryTaskResult = {
    task:
      "expire-old-stripe-payments",

    success: true,

    processed: 0,

    retried: 0,

    succeeded: 0,

    failed: 0,

    expired: 0,

    skipped: 0,

    durationMs: 0,

    errors: [],
  };

  try {
    const cutoff =
      getDateMinutesAgo(
        RETRY_CONFIG.maxAgeMinutes,
      );

    const payments =
      await prisma.payment.findMany({
        where: {
          provider: {
            in: [
              PaymentProvider.STRIPE,
              PaymentProvider.SIMULATED,
            ],
          },

          status: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.PROCESSING,
            ],
          },

          createdAt: {
            lt: cutoff,
          },
        },

        orderBy: {
          createdAt: "asc",
        },

        take:
          RETRY_CONFIG.batchSize,
      });

    result.processed =
      payments.length;

    for (
      const payment of payments
    ) {
      try {
        /**
         * Dernière vérification avant expiration.
         *
         * Cela évite de déclarer FAILED un paiement qui aurait
         * finalement été accepté par Stripe juste avant
         * l'exécution du job.
         */

        const verification =
          await verifyCurrentPayment(
            payment,
          );

        if (
          verification.completed &&
          verification.status ===
            PaymentStatus.SUCCESS
        ) {
          result.succeeded++;
          continue;
        }

        if (
          verification.completed &&
          verification.status
        ) {
          await applyVerifiedStatus(
            payment,
            verification.status,
          );

          result.failed++;
          continue;
        }

        await expirePayment(
          payment.id,
        );

        result.expired++;
      } catch (error) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Payment ${payment.id}: ${message}`,
        );

        logger.error(
          `[PAYMENT-RETRY] Failed to expire payment=${payment.id}`,
          error,
        );
      }
    }
  } catch (error) {
    result.success = false;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.errors.push(
      message,
    );

    logger.error(
      "[PAYMENT-RETRY] Failed to expire old payments",
      error,
    );
  }

  result.durationMs =
    getDurationMs(
      startedAt,
    );

  return result;
}

/**
 * ============================================================
 * RUN JOB
 * ============================================================
 */

export async function runPaymentRetryJob(): Promise<PaymentRetrySummary> {
  const startedAt =
    new Date();

  const startTimestamp =
    Date.now();

  const tasks: RetryTaskResult[] = [];

  logger.info(
    "[PAYMENT-RETRY] Job started",
  );

  /**
   * 1. Récupération des paiements PROCESSING bloqués.
   */
  tasks.push(
    await recoverStaleProcessingPayments(),
  );

  /**
   * 2. Vérification des paiements PENDING / PROCESSING.
   */
  tasks.push(
    await processRetryablePayments(),
  );

  /**
   * 3. Expiration des paiements trop anciens.
   */
  tasks.push(
    await expireOldPayments(),
  );

  const finishedAt =
    new Date();

  const durationMs =
    getDurationMs(
      startTimestamp,
    );

  const processed =
    tasks.reduce(
      (total, task) =>
        total + task.processed,
      0,
    );

  const retried =
    tasks.reduce(
      (total, task) =>
        total + task.retried,
      0,
    );

  const succeeded =
    tasks.reduce(
      (total, task) =>
        total + task.succeeded,
      0,
    );

  const failed =
    tasks.reduce(
      (total, task) =>
        total + task.failed,
      0,
    );

  const expired =
    tasks.reduce(
      (total, task) =>
        total + task.expired,
      0,
    );

  const skipped =
    tasks.reduce(
      (total, task) =>
        total + task.skipped,
      0,
    );

  const success =
    tasks.every(
      (task) =>
        task.success,
    );

  const summary: PaymentRetrySummary = {
    success,

    startedAt,

    finishedAt,

    durationMs,

    processed,

    retried,

    succeeded,

    failed,

    expired,

    skipped,

    tasks,
  };

  logger.info(
    `[PAYMENT-RETRY] Job completed success=${success} processed=${processed} retried=${retried} succeeded=${succeeded} failed=${failed} expired=${expired} skipped=${skipped} duration=${durationMs}ms`,
  );

  return summary;
}

/**
 * ============================================================
 * CRON SCHEDULER
 * ============================================================
 */

let paymentRetryTask:
  | ScheduledTask
  | null = null;

/**
 * ============================================================
 * START JOB
 * ============================================================
 */

export function startPaymentRetryJob():
  | ScheduledTask
  | null {
  if (!RETRY_CONFIG.enabled) {
    logger.warn(
      "[PAYMENT-RETRY] Job disabled",
    );

    return null;
  }

  if (paymentRetryTask) {
    logger.warn(
      "[PAYMENT-RETRY] Job already running",
    );

    return paymentRetryTask;
  }

  if (
    !cron.validate(
      RETRY_CONFIG.schedule,
    )
  ) {
    throw new Error(
      `[PAYMENT-RETRY] Invalid cron expression: ${RETRY_CONFIG.schedule}`,
    );
  }

  paymentRetryTask =
    cron.schedule(
      RETRY_CONFIG.schedule,
      async () => {
        try {
          await runPaymentRetryJob();
        } catch (error) {
          logger.error(
            "[PAYMENT-RETRY] Unexpected job error",
            error,
          );
        }
      },
      {
        timezone:
          process.env.APP_TIMEZONE ??
          "Africa/Brazzaville",
      },
    );

  logger.info(
    `[PAYMENT-RETRY] Job scheduled: ${RETRY_CONFIG.schedule}`,
  );

  return paymentRetryTask;
}

/**
 * ============================================================
 * STOP JOB
 * ============================================================
 */

export function stopPaymentRetryJob(): void {
  if (!paymentRetryTask) {
    return;
  }

  paymentRetryTask.stop();

  paymentRetryTask = null;

  logger.info(
    "[PAYMENT-RETRY] Job stopped",
  );
}

/**
 * ============================================================
 * JOB STATUS
 * ============================================================
 */

export function isPaymentRetryJobRunning(): boolean {
  return paymentRetryTask !== null;
}

/**
 * ============================================================
 * MANUAL EXECUTION
 * ============================================================
 */

export async function executePaymentRetryJobManually(): Promise<PaymentRetrySummary> {
  logger.info(
    "[PAYMENT-RETRY] Manual execution requested",
  );

  return runPaymentRetryJob();
}

/**
 * ============================================================
 * SHUTDOWN
 * ============================================================
 */

export async function shutdownPaymentRetryJob(): Promise<void> {
  stopPaymentRetryJob();

  await prisma.$disconnect();

  logger.info(
    "[PAYMENT-RETRY] Resources released",
  );
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  start:
    startPaymentRetryJob,

  stop:
    stopPaymentRetryJob,

  run:
    runPaymentRetryJob,

  executeManually:
    executePaymentRetryJobManually,

  isRunning:
    isPaymentRetryJobRunning,

  shutdown:
    shutdownPaymentRetryJob,
};

