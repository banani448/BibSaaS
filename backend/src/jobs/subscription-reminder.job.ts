
/**
 * ============================================================
 * BibSaaS — Subscription Reminder Job
 * ============================================================
 *
 * File:
 * jobs/subscription-reminder.job.ts
 *
 * Description:
 * Job automatique de rappel des abonnements.
 *
 * Fonctionnalités :
 * - Rappel avant expiration
 * - Rappel le jour de l'expiration
 * - Rappel après expiration
 * - Évite les notifications en double
 * - Support Client / Barber / Salon / Salon Chain
 * - Préparation au multilingue FR / EN
 * - Journalisation
 * - Cron
 * - Exécution manuelle
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

import notificationService from "../services/notification.service";

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

const REMINDER_CONFIG = {
  enabled:
    process.env.SUBSCRIPTION_REMINDER_JOB_ENABLED !==
    "false",

  /**
   * Toutes les heures.
   */
  schedule:
    process.env.SUBSCRIPTION_REMINDER_JOB_SCHEDULE ??
    "0 * * * *",

  batchSize: Number(
    process.env.SUBSCRIPTION_REMINDER_BATCH_SIZE ??
      100,
  ),

  /**
   * Rappel 3 jours avant expiration.
   */
  firstReminderDays: Number(
    process.env.SUBSCRIPTION_FIRST_REMINDER_DAYS ??
      3,
  ),

  /**
   * Dernier rappel 1 jour avant expiration.
   */
  secondReminderDays: Number(
    process.env.SUBSCRIPTION_SECOND_REMINDER_DAYS ??
      1,
  ),

  /**
   * Rappel le jour de l'expiration.
   */
  expirationReminder:
    process.env.SUBSCRIPTION_EXPIRATION_REMINDER !==
    "false",

  /**
   * Rappel après expiration.
   */
  expiredReminder:
    process.env.SUBSCRIPTION_EXPIRED_REMINDER !==
    "false",

  /**
   * Nombre de jours après expiration
   * pour envoyer le rappel.
   */
  expiredReminderDays: Number(
    process.env.SUBSCRIPTION_EXPIRED_REMINDER_DAYS ??
      1,
  ),
};

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type ReminderType =
  | "EXPIRING_3_DAYS"
  | "EXPIRING_1_DAY"
  | "EXPIRED";

interface SubscriptionRecord {
  id: string;

  userId: string;

  status: string;

  startDate: Date;

  endDate: Date;

  planId?: string | null;

  user?: {
    id: string;

    email?: string | null;

    firstName?: string | null;

    lastName?: string | null;

    language?: string | null;
  } | null;

  plan?: {
    name?: string | null;
  } | null;
}

interface ReminderResult {
  type: ReminderType;

  processed: number;

  sent: number;

  skipped: number;

  failed: number;

  errors: string[];

  durationMs: number;
}

interface ReminderSummary {
  success: boolean;

  startedAt: Date;

  finishedAt: Date;

  durationMs: number;

  processed: number;

  sent: number;

  skipped: number;

  failed: number;

  tasks: ReminderResult[];
}

/**
 * ============================================================
 * UTILS
 * ============================================================
 */

function getDurationMs(
  start: number,
): number {
  return Date.now() - start;
}

/**
 * Retourne une date située à N jours du jour actuel.
 */
function getDateDaysFromNow(
  days: number,
): Date {
  return new Date(
    Date.now() +
      days *
        24 *
        60 *
        60 *
        1000,
  );
}

/**
 * Retourne une fenêtre de dates.
 *
 * Exemple :
 *
 * 3 jours ± 1 heure
 */
function getReminderWindow(
  days: number,
): {
  start: Date;

  end: Date;
} {
  const target =
    getDateDaysFromNow(days);

  const start =
    new Date(
      target.getTime() -
        60 * 60 * 1000,
    );

  const end =
    new Date(
      target.getTime() +
        60 * 60 * 1000,
    );

  return {
    start,
    end,
  };
}

/**
 * ============================================================
 * LANGUAGE
 * ============================================================
 */

function normalizeLanguage(
  language?: string | null,
): "fr" | "en" {
  if (
    language?.toLowerCase() ===
    "en"
  ) {
    return "en";
  }

  return "fr";
}

/**
 * ============================================================
 * USER DISPLAY NAME
 * ============================================================
 */

function getUserName(
  subscription: SubscriptionRecord,
): string {
  const firstName =
    subscription.user
      ?.firstName ??
    "";

  const lastName =
    subscription.user
      ?.lastName ??
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    "Client BibSaaS"
  );
}

/**
 * ============================================================
 * NOTIFICATION KEY
 * ============================================================
 *
 * Permet d'éviter l'envoi de plusieurs rappels
 * pour le même abonnement.
 *
 * Exemple :
 *
 * subscription-reminder:
 * SUB123:
 * EXPIRING_3_DAYS
 *
 * ============================================================
 */

function getReminderKey(
  subscriptionId: string,
  type: ReminderType,
): string {
  return `subscription-reminder:${subscriptionId}:${type}`;
}

/**
 * ============================================================
 * CHECK DUPLICATE NOTIFICATION
 * ============================================================
 */

async function hasReminderAlreadyBeenSent(
  subscriptionId: string,
  type: ReminderType,
): Promise<boolean> {
  const key =
    getReminderKey(
      subscriptionId,
      type,
    );

  /**
   * Cette implémentation suppose que Notification
   * possède un champ metadata JSON.
   *
   * Si ton schema utilise un champ `data`,
   * adapte la requête.
   */

  const existing =
    await prisma.notification.findFirst({
      where: {
        data: {
          path: [
            "reminderKey",
          ],

          equals: key,
        },
      },
    });

  return Boolean(existing);
}

/**
 * ============================================================
 * CREATE NOTIFICATION
 * ============================================================
 */

async function createReminderNotification(
  subscription: SubscriptionRecord,
  type: ReminderType,
): Promise<void> {
  const language =
    normalizeLanguage(
      subscription.user
        ?.language,
    );

  const name =
    getUserName(
      subscription,
    );

  const planName =
    subscription.plan
      ?.name ??
    "Premium";

  let title: string;

  let message: string;

  switch (type) {
    case "EXPIRING_3_DAYS":
      if (language === "en") {
        title =
          "Your BibSaaS subscription expires soon";

        message =
          `Hello ${name}, your ${planName} subscription expires in 3 days. Renew now to continue enjoying BibSaaS without interruption.`;
      } else {
        title =
          "Votre abonnement BibSaaS expire bientôt";

        message =
          `Bonjour ${name}, votre abonnement ${planName} expire dans 3 jours. Renouvelez maintenant pour continuer à profiter de BibSaaS sans interruption.`;
      }

      break;

    case "EXPIRING_1_DAY":
      if (language === "en") {
        title =
          "Your BibSaaS subscription expires tomorrow";

        message =
          `Hello ${name}, your ${planName} subscription expires tomorrow. Renew your subscription to keep access to your BibSaaS features.`;
      } else {
        title =
          "Votre abonnement BibSaaS expire demain";

        message =
          `Bonjour ${name}, votre abonnement ${planName} expire demain. Renouvelez votre abonnement pour conserver l'accès à vos fonctionnalités BibSaaS.`;
      }

      break;

    case "EXPIRED":
      if (language === "en") {
        title =
          "Your BibSaaS subscription has expired";

        message =
          `Hello ${name}, your ${planName} subscription has expired. Renew now to restore access to your BibSaaS services.`;
      } else {
        title =
          "Votre abonnement BibSaaS a expiré";

        message =
          `Bonjour ${name}, votre abonnement ${planName} a expiré. Renouvelez maintenant pour réactiver vos services BibSaaS.`;
      }

      break;
  }

  const key =
    getReminderKey(
      subscription.id,
      type,
    );

  /**
   * Création directe de la notification.
   *
   * Le service de notification peut ensuite distribuer
   * cette notification vers :
   *
   * - in-app
   * - email
   * - push
   * - SMS
   */

  await prisma.notification.create({
    data: {
      userId:
        subscription.userId,

      type: "SUBSCRIPTION",

      channel: "IN_APP",

      title,

      message,

      data: {
        reminderKey:
          key,

        reminderType:
          type,

        subscriptionId:
          subscription.id,

        planId:
          subscription.planId ??
          null,

        expirationDate:
          subscription.endDate.toISOString(),

        generatedBy:
          "subscription-reminder.job",
      },
    },
  });
}

/**
 * ============================================================
 * DISPATCH NOTIFICATION
 * ============================================================
 */

async function dispatchNotification(
  subscription: SubscriptionRecord,
  type: ReminderType,
): Promise<void> {
  /**
   * Création de la notification en base.
   */
  await createReminderNotification(
    subscription,
    type,
  );

  /**
   * Si ton notificationService possède une méthode
   * de dispatch, elle peut être activée ici.
   *
   * Exemple :
   *
   * await notificationService.sendToUser(...)
   *
   * Pour éviter une dépendance stricte à la signature
   * actuelle du service, la notification est d'abord
   * persistée en DB.
   */

  void notificationService;
}

/**
 * ============================================================
 * FETCH ACTIVE SUBSCRIPTIONS
 * ============================================================
 */

async function findActiveSubscriptions(
  start: Date,
  end: Date,
): Promise<SubscriptionRecord[]> {
  const subscriptions =
    await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",

        endDate: {
          gte: start,

          lte: end,
        },
      },

      include: {
        user: true,

        plan: true,
      },

      orderBy: {
        endDate: "asc",
      },

      take:
        REMINDER_CONFIG.batchSize,
    });

  return subscriptions as unknown as SubscriptionRecord[];
}

/**
 * ============================================================
 * SEND EXPIRING REMINDERS
 * ============================================================
 */

async function processExpiringReminders(
  type:
    | "EXPIRING_3_DAYS"
    | "EXPIRING_1_DAY",
  days: number,
): Promise<ReminderResult> {
  const startedAt =
    Date.now();

  const result: ReminderResult = {
    type,

    processed: 0,

    sent: 0,

    skipped: 0,

    failed: 0,

    errors: [],

    durationMs: 0,
  };

  try {
    const window =
      getReminderWindow(days);

    const subscriptions =
      await findActiveSubscriptions(
        window.start,
        window.end,
      );

    result.processed =
      subscriptions.length;

    for (
      const subscription of subscriptions
    ) {
      try {
        const alreadySent =
          await hasReminderAlreadyBeenSent(
            subscription.id,
            type,
          );

        if (alreadySent) {
          result.skipped++;

          continue;
        }

        await dispatchNotification(
          subscription,
          type,
        );

        result.sent++;
      } catch (error) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Subscription ${subscription.id}: ${message}`,
        );

        logger.error(
          `[SUBSCRIPTION-REMINDER] Failed reminder subscription=${subscription.id}`,
          error,
        );
      }
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.failed++;

    result.errors.push(
      message,
    );

    logger.error(
      `[SUBSCRIPTION-REMINDER] Failed task=${type}`,
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
 * FIND EXPIRED SUBSCRIPTIONS
 * ============================================================
 */

async function findExpiredSubscriptions(): Promise<
  SubscriptionRecord[]
> {
  const targetStart =
    getDateDaysFromNow(
      -REMINDER_CONFIG.expiredReminderDays,
    );

  const targetEnd =
    new Date(
      targetStart.getTime() +
        24 *
          60 *
          60 *
          1000,
    );

  const subscriptions =
    await prisma.subscription.findMany({
      where: {
        endDate: {
          gte: targetStart,

          lt: targetEnd,
        },

        status: {
          in: [
            "ACTIVE",
            "EXPIRED",
          ],
        },
      },

      include: {
        user: true,

        plan: true,
      },

      orderBy: {
        endDate: "asc",
      },

      take:
        REMINDER_CONFIG.batchSize,
    });

  return subscriptions as unknown as SubscriptionRecord[];
}

/**
 * ============================================================
 * PROCESS EXPIRED REMINDERS
 * ============================================================
 */

async function processExpiredReminders(): Promise<ReminderResult> {
  const startedAt =
    Date.now();

  const result: ReminderResult = {
    type: "EXPIRED",

    processed: 0,

    sent: 0,

    skipped: 0,

    failed: 0,

    errors: [],

    durationMs: 0,
  };

  if (
    !REMINDER_CONFIG.expiredReminder
  ) {
    return result;
  }

  try {
    const subscriptions =
      await findExpiredSubscriptions();

    result.processed =
      subscriptions.length;

    for (
      const subscription of subscriptions
    ) {
      try {
        const alreadySent =
          await hasReminderAlreadyBeenSent(
            subscription.id,
            "EXPIRED",
          );

        if (alreadySent) {
          result.skipped++;

          continue;
        }

        /**
         * Si l'abonnement est encore ACTIVE alors que
         * endDate est dépassée, on le marque EXPIRED.
         */

        if (
          subscription.status ===
          "ACTIVE"
        ) {
          await prisma.subscription.update({
            where: {
              id: subscription.id,
            },

            data: {
              status: "EXPIRED",
            },
          });
        }

        await dispatchNotification(
          subscription,
          "EXPIRED",
        );

        result.sent++;
      } catch (error) {
        result.failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        result.errors.push(
          `Subscription ${subscription.id}: ${message}`,
        );

        logger.error(
          `[SUBSCRIPTION-REMINDER] Failed expired reminder subscription=${subscription.id}`,
          error,
        );
      }
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    result.failed++;

    result.errors.push(
      message,
    );

    logger.error(
      "[SUBSCRIPTION-REMINDER] Failed expired subscriptions task",
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

export async function runSubscriptionReminderJob(): Promise<ReminderSummary> {
  const startedAt =
    new Date();

  const startTimestamp =
    Date.now();

  const tasks:
    ReminderResult[] = [];

  logger.info(
    "[SUBSCRIPTION-REMINDER] Job started",
  );

  /**
   * Rappel 3 jours avant.
   */
  if (
    REMINDER_CONFIG.firstReminderDays >
    0
  ) {
    tasks.push(
      await processExpiringReminders(
        "EXPIRING_3_DAYS",
        REMINDER_CONFIG.firstReminderDays,
      ),
    );
  }

  /**
   * Rappel 1 jour avant.
   */
  if (
    REMINDER_CONFIG.secondReminderDays >
    0
  ) {
    tasks.push(
      await processExpiringReminders(
        "EXPIRING_1_DAY",
        REMINDER_CONFIG.secondReminderDays,
      ),
    );
  }

  /**
   * Rappel après expiration.
   */
  if (
    REMINDER_CONFIG.expirationReminder ||
    REMINDER_CONFIG.expiredReminder
  ) {
    tasks.push(
      await processExpiredReminders(),
    );
  }

  const finishedAt =
    new Date();

  const durationMs =
    getDurationMs(
      startTimestamp,
    );

  const processed =
    tasks.reduce(
      (
        total,
        task,
      ) =>
        total +
        task.processed,
      0,
    );

  const sent =
    tasks.reduce(
      (
        total,
        task,
      ) =>
        total +
        task.sent,
      0,
    );

  const skipped =
    tasks.reduce(
      (
        total,
        task,
      ) =>
        total +
        task.skipped,
      0,
    );

  const failed =
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
      (
        task,
      ) =>
        task.failed === 0,
    );

  const summary: ReminderSummary =
    {
      success,

      startedAt,

      finishedAt,

      durationMs,

      processed,

      sent,

      skipped,

      failed,

      tasks,
    };

  logger.info(
    `[SUBSCRIPTION-REMINDER] Job completed success=${success} processed=${processed} sent=${sent} skipped=${skipped} failed=${failed} duration=${durationMs}ms`,
  );

  return summary;
}

/**
 * ============================================================
 * CRON
 * ============================================================
 */

let subscriptionReminderTask:
  | ScheduledTask
  | null = null;

/**
 * ============================================================
 * START
 * ============================================================
 */

export function startSubscriptionReminderJob(): ScheduledTask | null {
  if (
    !REMINDER_CONFIG.enabled
  ) {
    logger.warn(
      "[SUBSCRIPTION-REMINDER] Job disabled",
    );

    return null;
  }

  if (
    subscriptionReminderTask
  ) {
    logger.warn(
      "[SUBSCRIPTION-REMINDER] Job already running",
    );

    return subscriptionReminderTask;
  }

  if (
    !cron.validate(
      REMINDER_CONFIG.schedule,
    )
  ) {
    throw new Error(
      `[SUBSCRIPTION-REMINDER] Invalid cron expression: ${REMINDER_CONFIG.schedule}`,
    );
  }

  subscriptionReminderTask =
    cron.schedule(
      REMINDER_CONFIG.schedule,
      async () => {
        try {
          await runSubscriptionReminderJob();
        } catch (error) {
          logger.error(
            "[SUBSCRIPTION-REMINDER] Unexpected job error",
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
    `[SUBSCRIPTION-REMINDER] Job scheduled: ${REMINDER_CONFIG.schedule}`,
  );

  return subscriptionReminderTask;
}

/**
 * ============================================================
 * STOP
 * ============================================================
 */

export function stopSubscriptionReminderJob(): void {
  if (
    !subscriptionReminderTask
  ) {
    return;
  }

  subscriptionReminderTask.stop();

  subscriptionReminderTask = null;

  logger.info(
    "[SUBSCRIPTION-REMINDER] Job stopped",
  );
}

/**
 * ============================================================
 * STATUS
 * ============================================================
 */

export function isSubscriptionReminderJobRunning(): boolean {
  return (
    subscriptionReminderTask !==
    null
  );
}

/**
 * ============================================================
 * MANUAL EXECUTION
 * ============================================================
 */

export async function executeSubscriptionReminderJobManually(): Promise<ReminderSummary> {
  logger.info(
    "[SUBSCRIPTION-REMINDER] Manual execution requested",
  );

  return runSubscriptionReminderJob();
}

/**
 * ============================================================
 * SHUTDOWN
 * ============================================================
 */

export async function shutdownSubscriptionReminderJob(): Promise<void> {
  stopSubscriptionReminderJob();

  await prisma.$disconnect();

  logger.info(
    "[SUBSCRIPTION-REMINDER] Resources released",
  );
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  start:
    startSubscriptionReminderJob,

  stop:
    stopSubscriptionReminderJob,

  run:
    runSubscriptionReminderJob,

  executeManually:
    executeSubscriptionReminderJobManually,

  isRunning:
    isSubscriptionReminderJobRunning,

  shutdown:
    shutdownSubscriptionReminderJob,
};
