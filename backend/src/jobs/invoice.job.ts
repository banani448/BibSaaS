
/**
 * ============================================================
 * BibSaaS — Invoice Job
 * ============================================================
 *
 * File:
 * src/jobs/invoice.job.ts
 *
 * Description:
 * Job automatique de gestion des factures.
 *
 * Responsabilités :
 * - Détecter les paiements réussis sans facture
 * - Générer automatiquement les factures
 * - Générer les numéros de facture
 * - Synchroniser les factures avec les paiements
 * - Éviter les doublons
 * - Marquer les factures comme payées
 * - Marquer les factures en retard
 * - Annuler les factures trop anciennes
 * - Journalisation
 *
 * IMPORTANT :
 *
 * Dans le Prisma Client utilisé ici,
 * la relation Invoice -> Payment s'appelle :
 *
 *     payments
 *
 * et non :
 *
 *     payment
 *
 * ============================================================
 */

import cron, {
  ScheduledTask,
} from "node-cron";

import {
  PrismaClient,
} from "@prisma/client";

import logger from "../config/logger";

/**
 * ============================================================
 * PRISMA
 * ============================================================
 */

const prisma =
  new PrismaClient();

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const INVOICE_CONFIG = {
  enabled:
    process.env.INVOICE_JOB_ENABLED !==
    "false",

  schedule:
    process.env.INVOICE_JOB_SCHEDULE ??
    "*/10 * * * *",

  batchSize: Math.max(
    1,
    Number(
      process.env.INVOICE_JOB_BATCH_SIZE ??
        100,
    ),
  ),

  invoicePrefix:
    process.env.INVOICE_PREFIX ??
    "BIB",

  defaultCurrency:
    process.env.DEFAULT_CURRENCY ??
    "XAF",

  paymentGraceDays: Math.max(
    1,
    Number(
      process.env.INVOICE_PAYMENT_GRACE_DAYS ??
        30,
    ),
  ),
};

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface InvoiceJobResult {
  task: string;
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  durationMs: number;
  errors: string[];
}

interface InvoiceJobSummary {
  success: boolean;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  totalProcessed: number;
  totalCreated: number;
  totalUpdated: number;
  totalFailed: number;
  tasks: InvoiceJobResult[];
}

interface PaymentForInvoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  subscriptionId?: string | null;
  createdAt: Date;
}

/**
 * ============================================================
 * UTILS
 * ============================================================
 */

function getDurationMs(
  startedAt: number,
): number {
  return Date.now() - startedAt;
}

function getDateDaysAgo(
  days: number,
): Date {
  const date = new Date();

  date.setUTCDate(
    date.getUTCDate() - days,
  );

  return date;
}

function getDateDaysFromNow(
  days: number,
): Date {
  const date = new Date();

  date.setUTCDate(
    date.getUTCDate() + days,
  );

  return date;
}

/**
 * ============================================================
 * LOGGER
 * ============================================================
 */

function logInvoiceStart(
  task: string,
): void {
  logger.info(
    `[INVOICE] Starting task: ${task}`,
  );
}

function logInvoiceSuccess(
  task: string,
  processed: number,
  durationMs: number,
): void {
  logger.info(
    `[INVOICE] Completed task=${task} processed=${processed} duration=${durationMs}ms`,
  );
}

function logInvoiceError(
  task: string,
  error: unknown,
): void {
  logger.error(
    `[INVOICE] Failed task=${task}`,
    error,
  );
}

/**
 * ============================================================
 * INVOICE NUMBER
 * ============================================================
 */

async function generateInvoiceNumber(): Promise<string> {
  const year =
    new Date().getUTCFullYear();

  const prefix =
    `${INVOICE_CONFIG.invoicePrefix}-${year}`;

  const timestamp =
    Date.now()
      .toString()
      .slice(-8);

  const random =
    Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0");

  return `${prefix}-${timestamp}-${random}`;
}

/**
 * ============================================================
 * FIND PAYMENTS WITHOUT INVOICE
 * ============================================================
 */

async function findPaymentsWithoutInvoice(): Promise<
  PaymentForInvoice[]
> {
  const payments =
    await prisma.payment.findMany({
      where: {
        status: "SUCCESS",
      },

      orderBy: {
        createdAt: "asc",
      },

      take:
        INVOICE_CONFIG.batchSize,

      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        subscriptionId: true,
        createdAt: true,
      },
    });

  if (payments.length === 0) {
    return [];
  }

  /**
   * IMPORTANT :
   *
   * Invoice -> Payment = `payments`
   *
   * `payments` est une relation multiple.
   * On utilise donc `some` et non `is`.
   */
  const invoices =
    await prisma.invoice.findMany({
      where: {
        payments: {
          some: {
            id: {
              in: payments.map(
                (payment) =>
                  payment.id,
              ),
            },
          },
        },
      },

      select: {
        payments: {
          select: {
            id: true,
          },
        },
      },
    });

  const invoicedPaymentIds =
    new Set(
      invoices
        .map(
          (invoice) =>
            invoice.payments[0]?.id,
        )
        .filter(
          (
            id,
          ): id is string =>
            Boolean(id),
        ),
    );

  return payments.filter(
    (payment) =>
      !invoicedPaymentIds.has(
        payment.id,
      ),
  );
}

/**
 * ============================================================
 * CREATE INVOICE FROM PAYMENT
 * ============================================================
 */

async function createInvoiceFromPayment(
  payment: PaymentForInvoice,
): Promise<boolean> {
  /**
   * Vérification avant transaction.
   */
  const existing =
    await prisma.invoice.findFirst({
      where: {
        payments: {
          some: {
            id: payment.id,
          },
        },
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    return false;
  }

  const invoiceNumber =
    await generateInvoiceNumber();

  const amount =
    Number(payment.amount);

  const currency =
    payment.currency ||
    INVOICE_CONFIG.defaultCurrency;

  const issueDate =
    payment.createdAt;

  const dueDate =
    getDateDaysFromNow(
      INVOICE_CONFIG.paymentGraceDays,
    );

  /**
   * ==========================================================
   * TRANSACTION ATOMIQUE
   * ==========================================================
   */

  let created = false;

  await prisma.$transaction(
    async (tx) => {
      /**
       * Double vérification contre
       * les conditions de concurrence.
       */
      const alreadyExists =
        await tx.invoice.findFirst({
          where: {
            payments: {
              some: {
                id: payment.id,
              },
            },
          },

          select: {
            id: true,
          },
        });

      if (alreadyExists) {
        return;
      }

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,

          userId: payment.userId,

          subscriptionId: payment.subscriptionId || null,

          subtotal: payment.amount,
          totalAmount: payment.amount,

          currency,

          status: "PAID",

          issueDate: new Date(),

          dueDate,

          paidAt:
            payment.createdAt,
        },
      });

      // Link payment to invoice
      await tx.payment.update({
        where: { id: payment.id },
        data: { invoiceId: invoice.id },
      });

      created = true;
    },
  );

  return created;
}

/**
 * ============================================================
 * PROCESS MISSING INVOICES
 * ============================================================
 */

async function processMissingInvoices(): Promise<InvoiceJobResult> {
  const startedAt =
    Date.now();

  const result: InvoiceJobResult = {
    task:
      "generate-missing-invoices",

    success: true,
    processed: 0,
    created: 0,
    updated: 0,
    failed: 0,
    durationMs: 0,
    errors: [],
  };

  logInvoiceStart(
    result.task,
  );

  try {
    const payments =
      await findPaymentsWithoutInvoice();

    result.processed =
      payments.length;

    for (
      const payment of payments
    ) {
      try {
        const created =
          await createInvoiceFromPayment(
            payment,
          );

        if (created) {
          result.created++;
        }
      } catch (error: unknown) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Payment ${payment.id}: ${message}`,
        );

        logger.error(
          `[INVOICE] Failed to create invoice for payment ${payment.id}`,
          error,
        );
      }
    }
  } catch (error: unknown) {
    result.success = false;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.errors.push(
      message,
    );

    logInvoiceError(
      result.task,
      error,
    );
  }

  result.durationMs =
    getDurationMs(
      startedAt,
    );

  logInvoiceSuccess(
    result.task,
    result.processed,
    result.durationMs,
  );

  return result;
}

/**
 * ============================================================
 * SYNC PAID INVOICES
 * ============================================================
 */

async function syncPaidInvoices(): Promise<InvoiceJobResult> {
  const startedAt =
    Date.now();

  const result: InvoiceJobResult = {
    task:
      "sync-paid-invoices",

    success: true,
    processed: 0,
    created: 0,
    updated: 0,
    failed: 0,
    durationMs: 0,
    errors: [],
  };

  logInvoiceStart(
    result.task,
  );

  try {
    const invoices =
      await prisma.invoice.findMany({
        where: {
          status: {
            not: "PAID",
          },

          /**
           * Invoice -> Payment = payments
           */
          payments: {
            some: {
              status: "SUCCESS",
            },
          },
        },

        include: {
          payments: true,
        },

        take:
          INVOICE_CONFIG.batchSize,
      });

    result.processed =
      invoices.length;

    for (
      const invoice of invoices
    ) {
      try {
        /**
         * Payment possède updatedAt.
         */
        const paidAt =
          invoice.payments[0]?.updatedAt ??
          new Date();

        await prisma.invoice.update({
          where: {
            id: invoice.id,
          },

          data: {
            status: "PAID",
            paidAt,
          },
        });

        result.updated++;
      } catch (error: unknown) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Invoice ${invoice.id}: ${message}`,
        );

        logger.error(
          `[INVOICE] Failed to synchronize invoice ${invoice.id}`,
          error,
        );
      }
    }
  } catch (error: unknown) {
    result.success = false;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.errors.push(
      message,
    );

    logInvoiceError(
      result.task,
      error,
    );
  }

  result.durationMs =
    getDurationMs(
      startedAt,
    );

  logInvoiceSuccess(
    result.task,
    result.processed,
    result.durationMs,
  );

  return result;
}

/**
 * ============================================================
 * UPDATE OVERDUE INVOICES
 * ============================================================
 */

async function updateOverdueInvoices(): Promise<InvoiceJobResult> {
  const startedAt =
    Date.now();

  const result: InvoiceJobResult = {
    task:
      "update-overdue-invoices",

    success: true,
    processed: 0,
    created: 0,
    updated: 0,
    failed: 0,
    durationMs: 0,
    errors: [],
  };

  logInvoiceStart(
    result.task,
  );

  try {
    const now =
      new Date();

    const invoices =
      await prisma.invoice.findMany({
        where: {
          status: {
            notIn: [
              "PAID",
              "CANCELLED",
            ],
          },

          dueDate: {
            lt: now,
          },
        },

        take:
          INVOICE_CONFIG.batchSize,

        select: {
          id: true,
          dueDate: true,
          status: true,
        },
      });

    result.processed =
      invoices.length;

    for (
      const invoice of invoices
    ) {
      try {
        await prisma.invoice.update({
          where: {
            id: invoice.id,
          },

          data: {
            status: "OVERDUE",
          },
        });

        result.updated++;
      } catch (error: unknown) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Invoice ${invoice.id}: ${message}`,
        );

        logger.error(
          `[INVOICE] Failed to mark invoice ${invoice.id} as overdue`,
          error,
        );
      }
    }
  } catch (error: unknown) {
    result.success = false;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.errors.push(
      message,
    );

    logInvoiceError(
      result.task,
      error,
    );
  }

  result.durationMs =
    getDurationMs(
      startedAt,
    );

  logInvoiceSuccess(
    result.task,
    result.processed,
    result.durationMs,
  );

  return result;
}

/**
 * ============================================================
 * CANCEL OLD INVOICES
 * ============================================================
 */

async function cancelOldInvoices(): Promise<InvoiceJobResult> {
  const startedAt =
    Date.now();

  const result: InvoiceJobResult = {
    task:
      "cancel-old-invoices",

    success: true,
    processed: 0,
    created: 0,
    updated: 0,
    failed: 0,
    durationMs: 0,
    errors: [],
  };

  logInvoiceStart(
    result.task,
  );

  try {
    const expirationDate =
      getDateDaysAgo(
        INVOICE_CONFIG.paymentGraceDays,
      );

    const invoices =
      await prisma.invoice.findMany({
        where: {
          status: {
            notIn: [
              "PAID",
              "CANCELLED",
            ],
          },

          issueDate: {
            lt: expirationDate,
          },
        },

        take:
          INVOICE_CONFIG.batchSize,

        select: {
          id: true,
        },
      });

    result.processed =
      invoices.length;

    for (
      const invoice of invoices
    ) {
      try {
        await prisma.invoice.update({
          where: {
            id: invoice.id,
          },

          data: {
            status: "CANCELLED",
          },
        });

        result.updated++;
      } catch (error: unknown) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Invoice ${invoice.id}: ${message}`,
        );

        logger.error(
          `[INVOICE] Failed to cancel invoice ${invoice.id}`,
          error,
        );
      }
    }
  } catch (error: unknown) {
    result.success = false;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.errors.push(
      message,
    );

    logInvoiceError(
      result.task,
      error,
    );
  }

  result.durationMs =
    getDurationMs(
      startedAt,
    );

  logInvoiceSuccess(
    result.task,
    result.processed,
    result.durationMs,
  );

  return result;
}

/**
 * ============================================================
 * RUN ALL INVOICE TASKS
 * ============================================================
 */

export async function runInvoiceJob(): Promise<InvoiceJobSummary> {
  const startedAt =
    new Date();

  const tasks: InvoiceJobResult[] = [];

  const missingInvoices =
    await processMissingInvoices();

  tasks.push(
    missingInvoices,
  );

  const paidInvoices =
    await syncPaidInvoices();

  tasks.push(
    paidInvoices,
  );

  const overdueInvoices =
    await updateOverdueInvoices();

  tasks.push(
    overdueInvoices,
  );

  const cancelledInvoices =
    await cancelOldInvoices();

  tasks.push(
    cancelledInvoices,
  );

  const finishedAt =
    new Date();

  const totalProcessed =
    tasks.reduce(
      (
        total,
        task,
      ) =>
        total +
        task.processed,
      0,
    );

  const totalCreated =
    tasks.reduce(
      (
        total,
        task,
      ) =>
        total +
        task.created,
      0,
    );

  const totalUpdated =
    tasks.reduce(
      (
        total,
        task,
      ) =>
        total +
        task.updated,
      0,
    );

  const totalFailed =
    tasks.reduce(
      (
        total,
        task,
      ) =>
        total +
        task.failed,
      0,
    );

  const success =
    tasks.every(
      (task) =>
        task.success,
    );

  return {
    success,

    startedAt,

    finishedAt,

    durationMs:
      finishedAt.getTime() -
      startedAt.getTime(),

    totalProcessed,

    totalCreated,

    totalUpdated,

    totalFailed,

    tasks,
  };
}

/**
 * ============================================================
 * CRON TASK
 * ============================================================
 */

let invoiceTask:
  ScheduledTask | null = null;

/**
 * Démarre le job automatique.
 */
export function startInvoiceJob(): ScheduledTask | null {
  if (
    !INVOICE_CONFIG.enabled
  ) {
    logger.info(
      "[INVOICE] Invoice job disabled.",
    );

    return null;
  }

  if (
    invoiceTask
  ) {
    logger.warn(
      "[INVOICE] Invoice job already running.",
    );

    return invoiceTask;
  }

  invoiceTask =
    cron.schedule(
      INVOICE_CONFIG.schedule,
      async () => {
        try {
          const summary =
            await runInvoiceJob();

          logger.info(
            `[INVOICE] Job completed successfully. processed=${summary.totalProcessed} created=${summary.totalCreated} updated=${summary.totalUpdated} failed=${summary.totalFailed}`,
          );
        } catch (error: unknown) {
          logInvoiceError(
            "invoice-job",
            error,
          );
        }
      },
    );

  logger.info(
    `[INVOICE] Invoice job started with schedule: ${INVOICE_CONFIG.schedule}`,
  );

  return invoiceTask;
}

/**
 * ============================================================
 * STOP CRON TASK
 * ============================================================
 */

export function stopInvoiceJob(): void {
  if (
    !invoiceTask
  ) {
    return;
  }

  invoiceTask.stop();

  invoiceTask =
    null;

  logger.info(
    "[INVOICE] Invoice job stopped.",
  );
}

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

export {
  INVOICE_CONFIG,
  processMissingInvoices,
  syncPaidInvoices,
  updateOverdueInvoices,
  cancelOldInvoices,
};

export default {
  startInvoiceJob,
  stopInvoiceJob,
  runInvoiceJob,
};

