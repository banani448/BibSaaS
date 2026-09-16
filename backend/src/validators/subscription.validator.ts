
// src/validators/subscription.validator.ts

/**
 * ============================================================
 * BibSaaS — Subscription Validators
 * ============================================================
 *
 * Validation centralisée des abonnements.
 *
 * Fonctionnalités :
 * - Création d'abonnement
 * - Changement de plan
 * - Renouvellement
 * - Annulation
 * - Réactivation
 * - Vérification d'abonnement
 * - Checkout
 * - Pagination
 * - Filtres admin
 * - Statistiques
 *
 * Stack :
 * - TypeScript
 * - Zod
 * - Express
 *
 * ============================================================
 */

import {
  z,
  type ZodType,
} from "zod";

/**
 * ============================================================
 * CONSTANTES
 * ============================================================
 */

const MAX_METADATA_KEYS = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_REASON_LENGTH = 1000;
const MAX_REFERENCE_LENGTH = 255;
const MAX_PAGE_SIZE = 100;
const MAX_AMOUNT = 100_000_000_000;

/**
 * ============================================================
 * COMMON SCHEMAS
 * ============================================================
 */

/**
 * UUID.
 */
export const uuidSchema =
  z.string().uuid(
    "Identifiant UUID invalide.",
  );

/**
 * Devise supportée par BibSaaS.
 */
export const currencySchema =
  z.enum([
    "XAF",
    "EUR",
    "USD",
    "GBP",
    "CAD",
    "XOF",
    "CDF",
  ]);

/**
 * Montant.
 */
export const amountSchema =
  z.coerce
    .number()
    .finite()
    .nonnegative()
    .max(
      MAX_AMOUNT,
      "Montant trop élevé.",
    );

/**
 * Référence.
 */
export const referenceSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "La référence est obligatoire.",
    )
    .max(
      MAX_REFERENCE_LENGTH,
    )
    .regex(
      /^[a-zA-Z0-9._:/-]+$/,
      "Référence contenant des caractères invalides.",
    );

/**
 * Métadonnées.
 */
export const metadataSchema =
  z
    .record(
      z.string(),
      z.unknown(),
    )
    .optional()
    .refine(
      (metadata) =>
        !metadata ||
        Object.keys(
          metadata,
        ).length <=
          MAX_METADATA_KEYS,
      {
        message:
          `Les métadonnées ne peuvent pas contenir plus de ${MAX_METADATA_KEYS} propriétés.`,
      },
    );

/**
 * ============================================================
 * SUBSCRIPTION ENUMS
 * ============================================================
 */

/**
 * Statut d'abonnement.
 */
export const subscriptionStatusSchema =
  z.enum([
    "PENDING",
    "ACTIVE",
    "TRIALING",
    "PAST_DUE",
    "PAUSED",
    "CANCELLED",
    "EXPIRED",
    "SUSPENDED",
  ]);

/**
 * Type de période.
 */
export const subscriptionIntervalSchema =
  z.enum([
    "DAILY",
    "WEEKLY",
    "BIWEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "YEARLY",
  ]);

/**
 * Type de plan.
 *
 * À adapter si ton Prisma utilise
 * d'autres valeurs.
 */
export const subscriptionPlanTypeSchema =
  z.enum([
    "CLIENT",
    "BARBER",
    "SALON",
    "SALON_CHAIN",
    "ADMIN",
    "PREMIUM",
  ]);

/**
 * Source de souscription.
 */
export const subscriptionSourceSchema =
  z.enum([
    "WEB",
    "MOBILE",
    "ADMIN",
    "API",
    "PROMOTION",
    "SYSTEM",
  ]);

/**
 * ============================================================
 * PLAN ID
 * ============================================================
 */

export const planIdParamSchema =
  z.object({
    planId:
      uuidSchema,
  });

/**
 * ============================================================
 * SUBSCRIPTION ID
 * ============================================================
 */

export const subscriptionIdParamSchema =
  z.object({
    subscriptionId:
      uuidSchema,
  });

/**
 * ============================================================
 * CREATE SUBSCRIPTION
 * ============================================================
 */

export const createSubscriptionSchema =
  z
    .object({
      userId:
        uuidSchema
          .optional(),

      planId:
        uuidSchema,

      currency:
        currencySchema
          .default(
            "XAF",
          ),

      startDate:
        z
          .coerce
          .date()
          .optional(),

      autoRenew:
        z
          .boolean()
          .default(
            true,
          ),

      source:
        subscriptionSourceSchema
          .default(
            "WEB",
          ),

      paymentId:
        uuidSchema
          .optional(),

      metadata:
        metadataSchema,

      couponCode:
        z
          .string()
          .trim()
          .min(
            2,
          )
          .max(
            100,
          )
          .regex(
            /^[A-Za-z0-9_-]+$/,
            "Code promotionnel invalide.",
          )
          .optional(),
    });

/**
 * ============================================================
 * CREATE CHECKOUT
 * ============================================================
 */

export const subscriptionCheckoutSchema =
  z.object({
    planId:
      uuidSchema,

    currency:
      currencySchema
        .default(
          "XAF",
        ),

    provider:
      z.enum([
        "MTN",
        "AIRTEL",
        "ORANGE",
        "MPESA",
        "CINETPAY",
        "FLUTTERWAVE",
        "STRIPE",
        "SIMULATED",
      ]),

    phoneNumber:
      z
        .string()
        .trim()
        .regex(
          /^\+?[1-9]\d{7,14}$/,
          "Numéro de téléphone invalide.",
        )
        .optional(),

    autoRenew:
      z
        .boolean()
        .default(
          true,
        ),

    couponCode:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          100,
        )
        .optional(),

    metadata:
      metadataSchema,
  })
  .superRefine(
    (data, ctx) => {
      const mobileMoneyProviders =
        [
          "MTN",
          "AIRTEL",
          "ORANGE",
          "MPESA",
        ];

      if (
        mobileMoneyProviders.includes(
          data.provider,
        ) &&
        !data.phoneNumber
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode
              .custom,

          path: [
            "phoneNumber",
          ],

          message:
            "Le numéro de téléphone est obligatoire pour un paiement Mobile Money.",
        });
      }
    },
  );

/**
 * ============================================================
 * CHANGE PLAN
 * ============================================================
 */

export const changeSubscriptionPlanSchema =
  z.object({
    planId:
      uuidSchema,

    currency:
      currencySchema
        .optional(),

    effectiveAt:
      z
        .coerce
        .date()
        .optional(),

    prorate:
      z
        .boolean()
        .default(
          true,
        ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * RENEW SUBSCRIPTION
 * ============================================================
 */

export const renewSubscriptionSchema =
  z.object({
    currency:
      currencySchema
        .optional(),

    paymentId:
      uuidSchema
        .optional(),

    provider:
      z.enum([
        "MTN",
        "AIRTEL",
        "ORANGE",
        "MPESA",
        "CINETPAY",
        "FLUTTERWAVE",
        "STRIPE",
        "SIMULATED",
      ])
        .optional(),

    phoneNumber:
      z
        .string()
        .trim()
        .regex(
          /^\+?[1-9]\d{7,14}$/,
          "Numéro de téléphone invalide.",
        )
        .optional(),

    autoRenew:
      z
        .boolean()
        .optional(),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * CANCEL SUBSCRIPTION
 * ============================================================
 */

export const cancelSubscriptionSchema =
  z.object({
    reason:
      z
        .string()
        .trim()
        .min(
          2,
          "Le motif d'annulation est obligatoire.",
        )
        .max(
          MAX_REASON_LENGTH,
        ),

    immediate:
      z
        .boolean()
        .default(
          false,
        ),

    refund:
      z
        .boolean()
        .default(
          false,
        ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * PAUSE SUBSCRIPTION
 * ============================================================
 */

export const pauseSubscriptionSchema =
  z.object({
    reason:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          MAX_REASON_LENGTH,
        )
        .optional(),

    resumeAt:
      z
        .coerce
        .date()
        .optional(),

    metadata:
      metadataSchema,
  })
  .superRefine(
    (data, ctx) => {
      if (
        data.resumeAt &&
        data.resumeAt <=
          new Date()
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode
              .custom,

          path: [
            "resumeAt",
          ],

          message:
            "La date de reprise doit être dans le futur.",
        });
      }
    },
  );

/**
 * ============================================================
 * RESUME SUBSCRIPTION
 * ============================================================
 */

export const resumeSubscriptionSchema =
  z.object({
    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * UPDATE AUTO RENEW
 * ============================================================
 */

export const updateAutoRenewSchema =
  z.object({
    autoRenew:
      z.boolean(),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * VERIFY SUBSCRIPTION
 * ============================================================
 */

export const verifySubscriptionSchema =
  z.object({
    subscriptionId:
      uuidSchema
        .optional(),

    reference:
      referenceSchema
        .optional(),

    userId:
      uuidSchema
        .optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.subscriptionId ||
          data.reference ||
          data.userId,
      ),
    {
      message:
        "subscriptionId, reference ou userId est requis.",
    },
  );

/**
 * ============================================================
 * SUBSCRIPTION QUERY
 * ============================================================
 */

const subscriptionFiltersBaseSchema = z.object({
  page:
    z
      .coerce
      .number()
      .int()
      .min(
        1,
      )
      .default(
        1,
      ),

  limit:
    z
      .coerce
      .number()
      .int()
      .min(
        1,
      )
      .max(
        MAX_PAGE_SIZE,
      )
      .default(
        20,
      ),

  search:
    z
      .string()
      .trim()
      .max(
        100,
      )
      .optional(),

  status:
    subscriptionStatusSchema
      .optional(),

  planId:
    uuidSchema
      .optional(),

  userId:
    uuidSchema
      .optional(),

  currency:
    currencySchema
      .optional(),

  autoRenew:
    z
      .string()
      .transform(
        (value) =>
          value ===
          "true",
      )
      .optional(),

  startFrom:
    z
      .coerce
      .date()
      .optional(),

  startTo:
    z
      .coerce
      .date()
      .optional(),

  endFrom:
    z
      .coerce
      .date()
      .optional(),

  endTo:
    z
      .coerce
      .date()
      .optional(),

  sortBy:
    z
      .enum([
        "createdAt",
        "startDate",
        "endDate",
        "status",
      ])
      .default(
        "createdAt",
      ),

  sortOrder:
    z
      .enum([
        "asc",
        "desc",
      ])
      .default(
        "desc",
      ),
});

const withSubscriptionFiltersChecks = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  schema.superRefine((data, ctx) => {
    if (
      data.startFrom &&
      data.startTo &&
      data.startFrom >
        data.startTo
    ) {
      ctx.addIssue({
        code:
          z.ZodIssueCode
            .custom,

        path: [
          "startTo",
        ],

        message:
          "startTo doit être postérieure ou égale à startFrom.",
      });
    }

    if (
      data.endFrom &&
      data.endTo &&
      data.endFrom >
        data.endTo
    ) {
      ctx.addIssue({
        code:
          z.ZodIssueCode
            .custom,

        path: [
          "endTo",
        ],

        message:
          "endTo doit être postérieure ou égale à endFrom.",
      });
    }
  });

export const subscriptionFiltersSchema = withSubscriptionFiltersChecks(subscriptionFiltersBaseSchema);

/**
 * ============================================================
 * USER SUBSCRIPTIONS
 * ============================================================
 */

export const userSubscriptionFiltersSchema =
  withSubscriptionFiltersChecks(
    subscriptionFiltersBaseSchema.extend({
      userId:
        uuidSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * PLAN FILTERS
 * ============================================================
 */

export const subscriptionPlanFiltersSchema =
  z.object({
    page:
      z
        .coerce
        .number()
        .int()
        .min(
          1,
        )
        .default(
          1,
        ),

    limit:
      z
        .coerce
        .number()
        .int()
        .min(
          1,
        )
        .max(
          MAX_PAGE_SIZE,
        )
        .default(
          20,
        ),

    type:
      subscriptionPlanTypeSchema
        .optional(),

    interval:
      subscriptionIntervalSchema
        .optional(),

    currency:
      currencySchema
        .optional(),

    active:
      z
        .string()
        .transform(
          (value) =>
            value ===
            "true",
        )
        .optional(),

    search:
      z
        .string()
        .trim()
        .max(
          100,
        )
        .optional(),

    sortBy:
      z
        .enum([
          "name",
          "price",
          "createdAt",
        ])
        .default(
          "createdAt",
        ),

    sortOrder:
      z
        .enum([
          "asc",
          "desc",
        ])
        .default(
          "desc",
        ),
  });

/**
 * ============================================================
 * CREATE PLAN
 * ============================================================
 */

export const createSubscriptionPlanSchema =
  z
    .object({
      name:
        z
          .string()
          .trim()
          .min(
            2,
            "Le nom du plan est obligatoire.",
          )
          .max(
            150,
          ),

      slug:
        z
          .string()
          .trim()
          .min(
            2,
          )
          .max(
            150,
          )
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug invalide.",
          ),

      description:
        z
          .string()
          .trim()
          .max(
            MAX_DESCRIPTION_LENGTH,
          )
          .optional(),

      type:
        subscriptionPlanTypeSchema,

      interval:
        subscriptionIntervalSchema,

      intervalCount:
        z
          .number()
          .int()
          .min(
            1,
          )
          .max(
            365,
          )
          .default(
            1,
          ),

      priceXaf:
        amountSchema
          .optional(),

      priceEur:
        amountSchema
          .optional(),

      priceUsd:
        amountSchema
          .optional(),

      priceGbp:
        amountSchema
          .optional(),

      priceCad:
        amountSchema
          .optional(),

      isActive:
        z
          .boolean()
          .default(
            true,
          ),

      isPopular:
        z
          .boolean()
          .default(
            false,
          ),

      trialDays:
        z
          .number()
          .int()
          .min(
            0,
          )
          .max(
            365,
          )
          .default(
            0,
          ),

      features:
        z
          .array(
            z
              .string()
              .trim()
              .min(
                1,
              )
              .max(
                200,
              ),
          )
          .max(
            100,
          )
          .default(
            [],
          ),

      metadata:
        metadataSchema,
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.interval ===
            "DAILY" &&
          data.intervalCount >
            365
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "intervalCount",
            ],

            message:
              "Interval quotidien trop élevé.",
          });
        }

        /**
         * Au moins un prix doit être défini.
         */
        if (
          data.priceXaf ===
            undefined &&
          data.priceEur ===
            undefined &&
          data.priceUsd ===
            undefined &&
          data.priceGbp ===
            undefined &&
          data.priceCad ===
            undefined
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "priceXaf",
            ],

            message:
              "Au moins un prix doit être défini.",
          });
        }
      },
    );

/**
 * ============================================================
 * UPDATE PLAN
 * ============================================================
 */

export const updateSubscriptionPlanSchema =
  z
    .object({
      name:
        z
          .string()
          .trim()
          .min(
            2,
          )
          .max(
            150,
          )
          .optional(),

      slug:
        z
          .string()
          .trim()
          .min(
            2,
          )
          .max(
            150,
          )
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug invalide.",
          )
          .optional(),

      description:
        z
          .string()
          .trim()
          .max(
            MAX_DESCRIPTION_LENGTH,
          )
          .nullable()
          .optional(),

      interval:
        subscriptionIntervalSchema
          .optional(),

      intervalCount:
        z
          .number()
          .int()
          .min(
            1,
          )
          .max(
            365,
          )
          .optional(),

      priceXaf:
        amountSchema
          .optional(),

      priceEur:
        amountSchema
          .optional(),

      priceUsd:
        amountSchema
          .optional(),

      priceGbp:
        amountSchema
          .optional(),

      priceCad:
        amountSchema
          .optional(),

      isActive:
        z
          .boolean()
          .optional(),

      isPopular:
        z
          .boolean()
          .optional(),

      trialDays:
        z
          .number()
          .int()
          .min(
            0,
          )
          .max(
            365,
          )
          .optional(),

      features:
        z
          .array(
            z
              .string()
              .trim()
              .min(
                1,
              )
              .max(
                200,
              ),
          )
          .max(
            100,
          )
          .optional(),

      metadata:
        metadataSchema,
    })
    .refine(
      (data) =>
        Object.keys(
          data,
        ).length > 0,
      {
        message:
          "Au moins un champ doit être fourni.",
      },
    );

/**
 * ============================================================
 * SUBSCRIPTION STATS
 * ============================================================
 */

export const subscriptionStatsSchema =
  z
    .object({
      from:
        z
          .coerce
          .date()
          .optional(),

      to:
        z
          .coerce
          .date()
          .optional(),

      planId:
        uuidSchema
          .optional(),

      type:
        subscriptionPlanTypeSchema
          .optional(),

      currency:
        currencySchema
          .optional(),

      status:
        subscriptionStatusSchema
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.from &&
          data.to &&
          data.from >
            data.to
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "to",
            ],

            message:
              "La date de fin doit être postérieure ou égale à la date de début.",
          });
        }
      },
    );

/**
 * ============================================================
 * EXPIRING SUBSCRIPTIONS
 * ============================================================
 */

export const expiringSubscriptionsSchema =
  z.object({
    days:
      z
        .coerce
        .number()
        .int()
        .min(
          1,
        )
        .max(
          365,
        )
        .default(
          7,
        ),

    planId:
      uuidSchema
        .optional(),

    limit:
      z
        .coerce
        .number()
        .int()
        .min(
          1,
        )
        .max(
          MAX_PAGE_SIZE,
        )
        .default(
          50,
        ),
  });

/**
 * ============================================================
 * ACTIVE SUBSCRIPTION CHECK
 * ============================================================
 */

export const activeSubscriptionCheckSchema =
  z.object({
    userId:
      uuidSchema,

    planId:
      uuidSchema
        .optional(),

    includeExpired:
      z
        .boolean()
        .default(
          false,
        ),
  });

/**
 * ============================================================
 * GENERIC VALIDATION RESULT
 * ============================================================
 */

export interface ValidationErrorItem {
  field: string;

  message: string;

  code?: string;
}

export interface ValidationResult<T> {
  success: boolean;

  data?: T;

  errors?: ValidationErrorItem[];
}

/**
 * ============================================================
 * GENERIC VALIDATOR
 * ============================================================
 */

export function validate<
  T,
>(
  schema: ZodType<T>,
  data: unknown,
): ValidationResult<T> {
  const result =
    schema.safeParse(
      data,
    );

  if (
    result.success
  ) {
    return {
      success:
        true,

      data:
        result.data,
    };
  }

  return {
    success:
      false,

    errors:
      result.error.issues.map(
        (issue) => ({
          field:
            issue.path.join(
              ".",
            ) || "root",

          message:
            issue.message,

          code:
            issue.code,
        }),
      ),
  };
}

/**
 * ============================================================
 * EXPRESS BODY VALIDATOR
 * ============================================================
 */

export function validateBody<
  T,
>(
  schema: ZodType<T>,
) {
  return (
    req: any,
    res: any,
    next: any,
  ) => {
    const result =
      schema.safeParse(
        req.body,
      );

    if (
      !result.success
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Données d'abonnement invalides.",

          error: {
            code:
              "VALIDATION_ERROR",

            fields:
              result.error.issues.reduce(
                (
                  errors: Record<
                    string,
                    string[]
                  >,
                  issue,
                ) => {
                  const field =
                    issue.path.join(
                      ".",
                    ) ||
                    "root";

                  if (
                    !errors[
                      field
                    ]
                  ) {
                    errors[
                      field
                    ] = [];
                  }

                  errors[
                    field
                  ].push(
                    issue.message,
                  );

                  return errors;
                },
                {},
              ),
          },

          timestamp:
            new Date().toISOString(),
        });
    }

    req.body =
      result.data;

    return next();
  };
}

/**
 * ============================================================
 * EXPRESS QUERY VALIDATOR
 * ============================================================
 */

export function validateQuery<
  T,
>(
  schema: ZodType<T>,
) {
  return (
    req: any,
    res: any,
    next: any,
  ) => {
    const result =
      schema.safeParse(
        req.query,
      );

    if (
      !result.success
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Paramètres d'abonnement invalides.",

          error: {
            code:
              "VALIDATION_ERROR",

            fields:
              result.error.issues.map(
                (issue) => ({
                  field:
                    issue.path.join(
                      ".",
                    ),

                  message:
                    issue.message,
                }),
              ),
          },

          timestamp:
            new Date().toISOString(),
        });
    }

    Object.assign(
      req.query,
      result.data,
    );

    return next();
  };
}

/**
 * ============================================================
 * EXPRESS PARAM VALIDATOR
 * ============================================================
 */

export function validateParams<
  T,
>(
  schema: ZodType<T>,
) {
  return (
    req: any,
    res: any,
    next: any,
  ) => {
    const result =
      schema.safeParse(
        req.params,
      );

    if (
      !result.success
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            "Paramètres d'abonnement invalides.",

          error: {
            code:
              "VALIDATION_ERROR",

            fields:
              result.error.issues.map(
                (issue) => ({
                  field:
                    issue.path.join(
                      ".",
                    ),

                  message:
                    issue.message,
                }),
              ),
          },

          timestamp:
            new Date().toISOString(),
        });
    }

    req.params =
      result.data;

    return next();
  };
}

/**
 * ============================================================
 * INFERRED TYPES
 * ============================================================
 */

export type CreateSubscriptionInput =
  z.infer<
    typeof createSubscriptionSchema
  >;

export type SubscriptionCheckoutInput =
  z.infer<
    typeof subscriptionCheckoutSchema
  >;

export type ChangeSubscriptionPlanInput =
  z.infer<
    typeof changeSubscriptionPlanSchema
  >;

export type RenewSubscriptionInput =
  z.infer<
    typeof renewSubscriptionSchema
  >;

export type CancelSubscriptionInput =
  z.infer<
    typeof cancelSubscriptionSchema
  >;

export type PauseSubscriptionInput =
  z.infer<
    typeof pauseSubscriptionSchema
  >;

export type ResumeSubscriptionInput =
  z.infer<
    typeof resumeSubscriptionSchema
  >;

export type UpdateAutoRenewInput =
  z.infer<
    typeof updateAutoRenewSchema
  >;

export type VerifySubscriptionInput =
  z.infer<
    typeof verifySubscriptionSchema
  >;

export type SubscriptionFilters =
  z.infer<
    typeof subscriptionFiltersSchema
  >;

export type UserSubscriptionFilters =
  z.infer<
    typeof userSubscriptionFiltersSchema
  >;

export type SubscriptionPlanFilters =
  z.infer<
    typeof subscriptionPlanFiltersSchema
  >;

export type CreateSubscriptionPlanInput =
  z.infer<
    typeof createSubscriptionPlanSchema
  >;

export type UpdateSubscriptionPlanInput =
  z.infer<
    typeof updateSubscriptionPlanSchema
  >;

export type SubscriptionStatsInput =
  z.infer<
    typeof subscriptionStatsSchema
  >;

export type ExpiringSubscriptionsInput =
  z.infer<
    typeof expiringSubscriptionsSchema
  >;

export type ActiveSubscriptionCheckInput =
  z.infer<
    typeof activeSubscriptionCheckSchema
  >;

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  uuidSchema,

  currencySchema,

  amountSchema,

  referenceSchema,

  metadataSchema,

  subscriptionStatusSchema,

  subscriptionIntervalSchema,

  subscriptionPlanTypeSchema,

  subscriptionSourceSchema,

  planIdParamSchema,

  subscriptionIdParamSchema,

  createSubscriptionSchema,

  subscriptionCheckoutSchema,

  changeSubscriptionPlanSchema,

  renewSubscriptionSchema,

  cancelSubscriptionSchema,

  pauseSubscriptionSchema,

  resumeSubscriptionSchema,

  updateAutoRenewSchema,

  verifySubscriptionSchema,

  subscriptionFiltersSchema,

  userSubscriptionFiltersSchema,

  subscriptionPlanFiltersSchema,

  createSubscriptionPlanSchema,

  updateSubscriptionPlanSchema,

  subscriptionStatsSchema,

  expiringSubscriptionsSchema,

  activeSubscriptionCheckSchema,
};
