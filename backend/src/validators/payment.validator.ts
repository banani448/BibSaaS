
// src/validators/payment.validator.ts

/**
 * ============================================================
 * BibSaaS — Payment Validators
 * ============================================================
 *
 * Validation centralisée des paiements.
 *
 * Providers supportés :
 * - Stripe
 * - SIMULATED
 *
 * Méthodes supportées :
 * - CARD
 * - SIMULATED
 * - CASH
 * - BANK_TRANSFER
 * - WALLET
 * - OTHER
 *
 * IMPORTANT :
 * - CinetPay supprimé
 * - Flutterwave supprimé
 * - MTN supprimé
 * - Airtel supprimé
 * - Orange supprimé
 * - M-Pesa supprimé
 *
 * IMPORTANT :
 * schema.prisma NE DOIT PAS être modifié.
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
const MAX_STRING_LENGTH = 500;
const MAX_REFERENCE_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_AMOUNT = 100_000_000_000;

/**
 * ============================================================
 * IDENTIFIANTS
 * ============================================================
 *
 * Le schema Prisma BibSaaS utilise :
 *
 * String @id @default(cuid())
 *
 * Les identifiants ne sont donc PAS nécessairement des UUID.
 *
 * On utilise volontairement une validation générique de String
 * compatible avec les CUID Prisma et les autres identifiants
 * String utilisés par l'API.
 * ============================================================
 */

const idSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "Identifiant invalide.",
    )
    .max(
      255,
      "Identifiant trop long.",
    );

/**
 * Alias conservé pour compatibilité avec les anciens imports.
 *
 * IMPORTANT :
 * Ne pas utiliser z.string().uuid() car Prisma utilise cuid().
 */
const uuidSchema = idSchema;

/**
 * ============================================================
 * DEVISE
 * ============================================================
 */

const currencySchema =
  z
    .enum([
      "XAF",
      "EUR",
      "USD",
      "GBP",
      "CAD",
      "XOF",
      "CDF",
    ])
    .default(
      "XAF",
    );

/**
 * ============================================================
 * TÉLÉPHONE
 * ============================================================
 */

const phoneSchema =
  z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Numéro de téléphone invalide.",
    )
    .max(
      MAX_PHONE_LENGTH,
    );

/**
 * ============================================================
 * RÉFÉRENCE
 * ============================================================
 */

const referenceSchema =
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
      "La référence contient des caractères invalides.",
    );

/**
 * ============================================================
 * MONTANT
 * ============================================================
 */

const amountSchema =
  z
    .number()
    .finite()
    .positive(
      "Le montant doit être supérieur à zéro.",
    )
    .max(
      MAX_AMOUNT,
      "Montant trop élevé.",
    );

/**
 * Montant accepté depuis JSON.
 *
 * Exemple accepté :
 * "1000" -> 1000
 */
const amountInputSchema =
  z.coerce
    .number()
    .finite()
    .positive(
      "Le montant doit être supérieur à zéro.",
    )
    .max(
      MAX_AMOUNT,
      "Montant trop élevé.",
    );

/**
 * ============================================================
 * MÉTADONNÉES
 * ============================================================
 */

const metadataSchema =
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
 * PAYMENT PROVIDERS
 * ============================================================
 *
 * Correspond aux providers réellement conservés
 * dans le projet BibSaaS.
 *
 * Prisma :
 *
 * enum PaymentProvider {
 *   SIMULATED
 *   STRIPE
 *   CINETPAY
 *   PAYPAL
 *   MANUAL
 * }
 *
 * L'application actuelle utilise uniquement :
 * - STRIPE
 * - SIMULATED
 *
 * CinetPay n'est plus utilisé.
 * ============================================================
 */

export const paymentProviderSchema =
  z.enum([
    "STRIPE",
    "SIMULATED",
  ]);

/**
 * ============================================================
 * PAYMENT METHODS
 * ============================================================
 *
 * Correspond aux valeurs disponibles dans Prisma.
 *
 * enum PaymentMethod {
 *   SIMULATED
 *   CARD
 *   VISA
 *   MASTERCARD
 *   AMERICAN_EXPRESS
 *   DISCOVER
 *   MOBILE_MONEY
 *   BANK_TRANSFER
 *   CASH
 *   WALLET
 *   OTHER
 * }
 *
 * Pour le flux actuel :
 * - Stripe -> CARD
 * - Simulation -> SIMULATED
 *
 * Les autres méthodes restent acceptées par les validators
 * génériques pour ne pas casser les modules administratifs
 * ou futurs.
 * ============================================================
 */

export const paymentMethodSchema =
  z.enum([
    "SIMULATED",
    "CARD",
    "VISA",
    "MASTERCARD",
    "AMERICAN_EXPRESS",
    "DISCOVER",
    "MOBILE_MONEY",
    "BANK_TRANSFER",
    "CASH",
    "WALLET",
    "OTHER",
  ]);

/**
 * ============================================================
 * PAYMENT STATUS
 * ============================================================
 *
 * Correspond exactement au enum Prisma PaymentStatus.
 *
 * Pas de COMPLETED.
 * Pas de EXPIRED.
 *
 * ============================================================
 */

export const paymentStatusSchema =
  z.enum([
    "PENDING",
    "PROCESSING",
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
  ]);

/**
 * ============================================================
 * PAYMENT TYPE
 * ============================================================
 */

export const paymentTypeSchema =
  z.enum([
    "BOOKING",
    "SUBSCRIPTION",
    "INVOICE",
    "REFUND",
    "OTHER",
  ]);

/**
 * ============================================================
 * PAYMENT CHANNEL
 * ============================================================
 */

export const paymentChannelSchema =
  z.enum([
    "WEB",
    "MOBILE",
    "ADMIN",
    "API",
    "POS",
    "SYSTEM",
  ]);

/**
 * ============================================================
 * CREATE PAYMENT
 * ============================================================
 */

export const createPaymentSchema =
  z
    .object({
      amount:
        amountInputSchema,

      currency:
        currencySchema,

      /**
       * Provider actuel :
       * STRIPE ou SIMULATED.
       */
      provider:
        paymentProviderSchema
          .optional(),

      /**
       * Méthode actuelle :
       * CARD ou SIMULATED.
       *
       * Le service peut également déterminer la méthode
       * depuis le provider si elle n'est pas fournie.
       */
      method:
        paymentMethodSchema
          .optional(),

      type:
        paymentTypeSchema
          .default(
            "OTHER",
          ),

      bookingId:
        idSchema
          .optional(),

      subscriptionId:
        idSchema
          .optional(),

      invoiceId:
        idSchema
          .optional(),

      customerId:
        idSchema
          .optional(),

      /**
       * Compatibilité avec les anciennes requêtes.
       */
      phoneNumber:
        phoneSchema
          .optional(),

      /**
       * Compatibilité avec les anciennes requêtes utilisant
       * simplement "phone".
       */
      phone:
        phoneSchema
          .optional(),

      email:
        z
          .string()
          .trim()
          .email(
            "Adresse email invalide.",
          )
          .max(
            320,
          )
          .optional(),

      description:
        z
          .string()
          .trim()
          .max(
            MAX_STRING_LENGTH,
          )
          .optional(),

      channel:
        paymentChannelSchema
          .default(
            "WEB",
          ),

      metadata:
        metadataSchema,

      callbackUrl:
        z
          .string()
          .url(
            "callbackUrl invalide.",
          )
          .max(
            2048,
          )
          .optional(),

      returnUrl:
        z
          .string()
          .url(
            "returnUrl invalide.",
          )
          .max(
            2048,
          )
          .optional(),

      /**
       * Idempotency-Key éventuellement envoyé dans le body.
       *
       * L'application peut aussi le recevoir dans le header.
       */
      idempotencyKey:
        z
          .string()
          .trim()
          .min(
            1,
          )
          .max(
            255,
          )
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        /**
         * ------------------------------------------------------
         * Provider / method
         * ------------------------------------------------------
         *
         * Si aucun provider n'est fourni, on peut déterminer
         * le provider depuis la méthode.
         *
         * Cela permet notamment de supporter :
         *
         * { method: "SIMULATED" }
         *
         * et :
         *
         * { method: "CARD" }
         */

        if (
          data.provider ===
            "STRIPE" &&
          data.method &&
          ![
            "CARD",
            "VISA",
            "MASTERCARD",
            "AMERICAN_EXPRESS",
            "DISCOVER",
          ].includes(
            data.method,
          )
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "method",
            ],

            message:
              "Un paiement Stripe doit utiliser une méthode carte.",
          });
        }

        /**
         * ------------------------------------------------------
         * SIMULATED
         * ------------------------------------------------------
         */

        if (
          data.provider ===
            "SIMULATED" &&
          data.method &&
          data.method !==
            "SIMULATED"
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "method",
            ],

            message:
              "Un paiement SIMULATED doit utiliser la méthode SIMULATED.",
          });
        }

        /**
         * ------------------------------------------------------
         * CARD
         * ------------------------------------------------------
         *
         * Une méthode carte implique Stripe dans
         * l'architecture actuelle.
         */

        if (
          [
            "CARD",
            "VISA",
            "MASTERCARD",
            "AMERICAN_EXPRESS",
            "DISCOVER",
          ].includes(
            data.method ?? "",
          ) &&
          data.provider &&
          data.provider !==
            "STRIPE"
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "provider",
            ],

            message:
              "Une méthode carte doit utiliser le provider STRIPE.",
          });
        }

        /**
         * ------------------------------------------------------
         * Ressource métier
         * ------------------------------------------------------
         *
         * Un paiement doit normalement être lié à :
         * - une réservation
         * - un abonnement
         * - une facture
         *
         * IMPORTANT :
         * On ne bloque pas les paiements de test génériques
         * afin de permettre les tests d'intégration.
         */

        if (
          !data.bookingId &&
          !data.subscriptionId &&
          !data.invoiceId &&
          data.provider !==
            "SIMULATED"
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "bookingId",
            ],

            message:
              "Le paiement doit être associé à une réservation, un abonnement ou une facture.",
          });
        }
      },
    );

/**
 * ============================================================
 * BOOKING PAYMENT
 * ============================================================
 */

export const bookingPaymentSchema =
  z
    .object({
      bookingId:
        idSchema,

      amount:
        amountInputSchema,

      currency:
        currencySchema,

      provider:
        paymentProviderSchema,

      method:
        paymentMethodSchema
          .optional(),

      phoneNumber:
        phoneSchema
          .optional(),

      description:
        z
          .string()
          .trim()
          .max(
            MAX_STRING_LENGTH,
          )
          .optional(),

      metadata:
        metadataSchema,
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.provider ===
            "STRIPE" &&
          data.method &&
          ![
            "CARD",
            "VISA",
            "MASTERCARD",
            "AMERICAN_EXPRESS",
            "DISCOVER",
          ].includes(
            data.method,
          )
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "method",
            ],

            message:
              "Un paiement Stripe doit utiliser une méthode carte.",
          });
        }

        if (
          data.provider ===
            "SIMULATED" &&
          data.method &&
          data.method !==
            "SIMULATED"
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "method",
            ],

            message:
              "Un paiement simulé doit utiliser la méthode SIMULATED.",
          });
        }
      },
    );

/**
 * ============================================================
 * SUBSCRIPTION PAYMENT
 * ============================================================
 */

export const subscriptionPaymentSchema =
  z
    .object({
      subscriptionId:
        idSchema,

      amount:
        amountInputSchema,

      currency:
        currencySchema,

      provider:
        paymentProviderSchema,

      method:
        paymentMethodSchema
          .optional(),

      phoneNumber:
        phoneSchema
          .optional(),

      description:
        z
          .string()
          .trim()
          .max(
            MAX_STRING_LENGTH,
          )
          .optional(),

      metadata:
        metadataSchema,
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.provider ===
            "STRIPE" &&
          data.method &&
          ![
            "CARD",
            "VISA",
            "MASTERCARD",
            "AMERICAN_EXPRESS",
            "DISCOVER",
          ].includes(
            data.method,
          )
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "method",
            ],

            message:
              "Un paiement Stripe doit utiliser une méthode carte.",
          });
        }

        if (
          data.provider ===
            "SIMULATED" &&
          data.method &&
          data.method !==
            "SIMULATED"
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "method",
            ],

            message:
              "Un paiement simulé doit utiliser la méthode SIMULATED.",
          });
        }
      },
    );

/**
 * ============================================================
 * PAYMENT INTENT
 * ============================================================
 *
 * Utilisé uniquement pour les flux nécessitant un intent.
 *
 * Le flux Payment Link Stripe peut ne pas utiliser directement
 * cet endpoint.
 * ============================================================
 */

export const createPaymentIntentSchema =
  z
    .object({
      amount:
        amountInputSchema,

      currency:
        currencySchema,

      provider:
        z
          .literal(
            "STRIPE",
          ),

      method:
        z
          .enum([
            "CARD",
            "VISA",
            "MASTERCARD",
            "AMERICAN_EXPRESS",
            "DISCOVER",
          ])
          .default(
            "CARD",
          ),

      customerId:
        idSchema
          .optional(),

      bookingId:
        idSchema
          .optional(),

      subscriptionId:
        idSchema
          .optional(),

      invoiceId:
        idSchema
          .optional(),

      email:
        z
          .string()
          .trim()
          .email(
            "Adresse email invalide.",
          )
          .max(
            320,
          )
          .optional(),

      metadata:
        metadataSchema,
    });

/**
 * ============================================================
 * VERIFY PAYMENT
 * ============================================================
 */

export const verifyPaymentSchema =
  z
    .object({
      paymentId:
        idSchema
          .optional(),

      reference:
        referenceSchema
          .optional(),

      transactionReference:
        referenceSchema
          .optional(),

      transactionId:
        referenceSchema
          .optional(),

      provider:
        paymentProviderSchema
          .optional(),
    })
    .refine(
      (data) =>
        Boolean(
          data.paymentId ||
          data.reference ||
          data.transactionReference ||
          data.transactionId,
        ),
      {
        message:
          "paymentId, reference, transactionReference ou transactionId est requis.",
      },
    );

/**
 * ============================================================
 * PAYMENT ID
 * ============================================================
 */

export const paymentIdParamSchema =
  z.object({
    id:
      idSchema,
  });

/**
 * Ancienne variante conservée pour compatibilité.
 */
export const paymentIdLegacyParamSchema =
  z.object({
    paymentId:
      idSchema,
  });

/**
 * ============================================================
 * REFUND
 * ============================================================
 */

export const refundPaymentSchema =
  z.object({
    amount:
      amountInputSchema
        .optional(),

    reason:
      z
        .string()
        .trim()
        .min(
          2,
          "Le motif du remboursement est obligatoire.",
        )
        .max(
          MAX_STRING_LENGTH,
        ),

    reference:
      referenceSchema
        .optional(),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * CANCEL PAYMENT
 * ============================================================
 */

export const cancelPaymentSchema =
  z.object({
    reason:
      z
        .string()
        .trim()
        .min(
          2,
          "Le motif est obligatoire.",
        )
        .max(
          MAX_STRING_LENGTH,
        )
        .optional(),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * PAYMENT CALLBACK
 * ============================================================
 *
 * Callback générique interne.
 *
 * Les webhooks Stripe réels sont traités séparément
 * par StripeService avec vérification de signature.
 * ============================================================
 */

export const paymentCallbackSchema =
  z.object({
    reference:
      referenceSchema,

    transactionReference:
      referenceSchema
        .optional(),

    transactionId:
      referenceSchema
        .optional(),

    status:
      paymentStatusSchema,

    provider:
      paymentProviderSchema,

    amount:
      amountInputSchema
        .optional(),

    currency:
      currencySchema
        .optional(),

    phoneNumber:
      phoneSchema
        .optional(),

    message:
      z
        .string()
        .trim()
        .max(
          MAX_STRING_LENGTH,
        )
        .optional(),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * STRIPE WEBHOOK STRUCTURE
 * ============================================================
 *
 * IMPORTANT :
 *
 * Le vrai webhook Stripe ne doit PAS être validé uniquement
 * avec ce schéma.
 *
 * Le controller/service doit utiliser :
 *
 * stripe.webhooks.constructEvent(...)
 *
 * avec :
 * - raw request body
 * - stripe-signature
 * - STRIPE_WEBHOOK_SECRET
 *
 * Ce schema est uniquement destiné aux structures internes
 * ou tests lorsque cela est nécessaire.
 * ============================================================
 */

export const stripeWebhookSchema =
  z.object({
    id:
      z
        .string()
        .min(
          1,
        ),

    object:
      z
        .literal(
          "event",
        ),

    type:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .max(
          255,
        ),

    data:
      z.object({
        object:
          z
            .record(
              z.string(),
              z.unknown(),
            ),
      }),

    livemode:
      z
        .boolean()
        .optional(),

    created:
      z
        .number()
        .int()
        .nonnegative()
        .optional(),

    api_version:
      z
        .string()
        .optional(),
  });

/**
 * ============================================================
 * GENERIC WEBHOOK
 * ============================================================
 *
 * Conservé pour compatibilité avec d'éventuels imports.
 *
 * Les providers autorisés restent uniquement :
 * - STRIPE
 * - SIMULATED
 * ============================================================
 */

export const paymentWebhookSchema =
  z.object({
    provider:
      paymentProviderSchema,

    event:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .max(
          255,
        ),

    reference:
      referenceSchema
        .optional(),

    transactionReference:
      referenceSchema
        .optional(),

    transactionId:
      referenceSchema
        .optional(),

    status:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .max(
          100,
        ),

    amount:
      amountInputSchema
        .optional(),

    currency:
      currencySchema
        .optional(),

    signature:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .max(
          4096,
        )
        .optional(),

    timestamp:
      z
        .coerce
        .date()
        .optional(),

    data:
      z
        .record(
          z.string(),
          z.unknown(),
        )
        .optional(),
  });

/**
 * ============================================================
 * PROVIDER CALLBACK
 * ============================================================
 */

export const providerCallbackSchema =
  z.object({
    provider:
      paymentProviderSchema,

    transactionId:
      referenceSchema,

    reference:
      referenceSchema
        .optional(),

    transactionReference:
      referenceSchema
        .optional(),

    status:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .max(
          100,
        ),

    amount:
      amountInputSchema
        .optional(),

    currency:
      currencySchema
        .optional(),

    message:
      z
        .string()
        .trim()
        .max(
          MAX_STRING_LENGTH,
        )
        .optional(),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * PAYMENT FILTERS
 * ============================================================
 */

const paymentFiltersBaseSchema =
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
          100,
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
      paymentStatusSchema
        .optional(),

    provider:
      paymentProviderSchema
        .optional(),

    method:
      paymentMethodSchema
        .optional(),

    type:
      paymentTypeSchema
        .optional(),

    currency:
      z
        .enum([
          "XAF",
          "EUR",
          "USD",
          "GBP",
          "CAD",
          "XOF",
          "CDF",
        ])
        .optional(),

    customerId:
      idSchema
        .optional(),

    bookingId:
      idSchema
        .optional(),

    subscriptionId:
      idSchema
        .optional(),

    invoiceId:
      idSchema
        .optional(),

    dateFrom:
      z
        .coerce
        .date()
        .optional(),

    dateTo:
      z
        .coerce
        .date()
        .optional(),

    minAmount:
      amountInputSchema
        .optional(),

    maxAmount:
      amountInputSchema
        .optional(),

    sortBy:
      z
        .enum([
          "createdAt",
          "updatedAt",
          "amount",
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

/**
 * ============================================================
 * FILTER VALIDATION
 * ============================================================
 */

const withPaymentFiltersChecks =
  <
    TSchema extends z.ZodTypeAny,
  >(
    schema: TSchema,
  ) =>
    schema.superRefine(
      (
        data,
        ctx,
      ) => {
        if (
          data.dateFrom &&
          data.dateTo &&
          data.dateFrom >
            data.dateTo
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "dateTo",
            ],

            message:
              "dateTo doit être postérieure ou égale à dateFrom.",
          });
        }

        if (
          data.minAmount !==
            undefined &&
          data.maxAmount !==
            undefined &&
          data.minAmount >
            data.maxAmount
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "maxAmount",
            ],

            message:
              "maxAmount doit être supérieur ou égal à minAmount.",
          });
        }
      },
    );

export const paymentFiltersSchema =
  withPaymentFiltersChecks(
    paymentFiltersBaseSchema,
  );

/**
 * ============================================================
 * CUSTOMER PAYMENT FILTERS
 * ============================================================
 */

export const customerPaymentFiltersSchema =
  withPaymentFiltersChecks(
    paymentFiltersBaseSchema.extend({
      customerId:
        idSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * BOOKING PAYMENT FILTERS
 * ============================================================
 */

export const bookingPaymentFiltersSchema =
  withPaymentFiltersChecks(
    paymentFiltersBaseSchema.extend({
      bookingId:
        idSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * SUBSCRIPTION PAYMENT FILTERS
 * ============================================================
 */

export const subscriptionPaymentFiltersSchema =
  withPaymentFiltersChecks(
    paymentFiltersBaseSchema.extend({
      subscriptionId:
        idSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * ADMIN PAYMENT FILTERS
 * ============================================================
 */

export const adminPaymentFiltersSchema =
  withPaymentFiltersChecks(
    paymentFiltersBaseSchema.extend({
      tenantId:
        idSchema
          .optional(),

      salonId:
        idSchema
          .optional(),

      barberId:
        idSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * PAYMENT STATS
 * ============================================================
 */

export const paymentStatsSchema =
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

      provider:
        paymentProviderSchema
          .optional(),

      currency:
        z
          .enum([
            "XAF",
            "EUR",
            "USD",
            "GBP",
            "CAD",
            "XOF",
            "CDF",
          ])
          .optional(),

      salonId:
        idSchema
          .optional(),

      tenantId:
        idSchema
          .optional(),
    })
    .superRefine(
      (
        data,
        ctx,
      ) => {
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
 * TRANSACTION SEARCH
 * ============================================================
 */

export const transactionSearchSchema =
  z
    .object({
      reference:
        referenceSchema
          .optional(),

      transactionReference:
        referenceSchema
          .optional(),

      transactionId:
        referenceSchema
          .optional(),

      phoneNumber:
        phoneSchema
          .optional(),

      provider:
        paymentProviderSchema
          .optional(),
    })
    .refine(
      (data) =>
        Boolean(
          data.reference ||
          data.transactionReference ||
          data.transactionId ||
          data.phoneNumber,
        ),
      {
        message:
          "Une référence, un transactionReference, un transactionId ou un numéro de téléphone est requis.",
      },
    );

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
            "Données de paiement invalides.",

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
            "Paramètres de paiement invalides.",

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

    /**
     * Certains objets req.query peuvent être en lecture seule
     * selon la configuration Express.
     *
     * On conserve le comportement historique ici.
     */
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
            "Paramètres de paiement invalides.",

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

export type CreatePaymentInput =
  z.infer<
    typeof createPaymentSchema
  >;

export type BookingPaymentInput =
  z.infer<
    typeof bookingPaymentSchema
  >;

export type SubscriptionPaymentInput =
  z.infer<
    typeof subscriptionPaymentSchema
  >;

export type CreatePaymentIntentInput =
  z.infer<
    typeof createPaymentIntentSchema
  >;

export type VerifyPaymentInput =
  z.infer<
    typeof verifyPaymentSchema
  >;

export type RefundPaymentInput =
  z.infer<
    typeof refundPaymentSchema
  >;

export type CancelPaymentInput =
  z.infer<
    typeof cancelPaymentSchema
  >;

export type PaymentCallbackInput =
  z.infer<
    typeof paymentCallbackSchema
  >;

export type PaymentWebhookInput =
  z.infer<
    typeof paymentWebhookSchema
  >;

export type StripeWebhookInput =
  z.infer<
    typeof stripeWebhookSchema
  >;

export type ProviderCallbackInput =
  z.infer<
    typeof providerCallbackSchema
  >;

export type PaymentFilters =
  z.infer<
    typeof paymentFiltersSchema
  >;

export type CustomerPaymentFilters =
  z.infer<
    typeof customerPaymentFiltersSchema
  >;

export type BookingPaymentFilters =
  z.infer<
    typeof bookingPaymentFiltersSchema
  >;

export type SubscriptionPaymentFilters =
  z.infer<
    typeof subscriptionPaymentFiltersSchema
  >;

export type AdminPaymentFilters =
  z.infer<
    typeof adminPaymentFiltersSchema
  >;

export type PaymentStatsInput =
  z.infer<
    typeof paymentStatsSchema
  >;

export type TransactionSearchInput =
  z.infer<
    typeof transactionSearchSchema
  >;

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export {
  idSchema,
  uuidSchema,
  currencySchema,
  phoneSchema,
  referenceSchema,
  amountSchema,
  amountInputSchema,
  metadataSchema,
};

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  paymentProviderSchema,

  paymentMethodSchema,

  paymentStatusSchema,

  paymentTypeSchema,

  paymentChannelSchema,

  createPaymentSchema,

  bookingPaymentSchema,

  subscriptionPaymentSchema,

  createPaymentIntentSchema,

  verifyPaymentSchema,

  paymentIdParamSchema,

  paymentIdLegacyParamSchema,

  refundPaymentSchema,

  cancelPaymentSchema,

  paymentCallbackSchema,

  stripeWebhookSchema,

  paymentWebhookSchema,

  providerCallbackSchema,

  paymentFiltersSchema,

  customerPaymentFiltersSchema,

  bookingPaymentFiltersSchema,

  subscriptionPaymentFiltersSchema,

  adminPaymentFiltersSchema,

  paymentStatsSchema,

  transactionSearchSchema,
};

