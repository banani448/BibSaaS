
// src/validators/booking.validator.ts

/**
 * ============================================================
 * BibSaaS — Booking Validators
 * ============================================================
 *
 * Validation centralisée des réservations.
 *
 * Fonctionnalités :
 * - Création d'une réservation
 * - Modification d'une réservation
 * - Confirmation
 * - Annulation
 * - Reprogrammation
 * - Recherche
 * - Pagination
 * - Vérification de disponibilité
 * - Filtres dashboard
 * - Validation des dates / heures
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

const NOTE_MAX_LENGTH = 1000;
const SEARCH_MAX_LENGTH = 100;
const PAGE_MAX = 100;
const SERVICE_NAME_MAX_LENGTH = 150;

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * UUID BibSaaS.
 */
const uuidSchema =
  z.string().uuid(
    "Identifiant UUID invalide.",
  );

/**
 * Date ISO.
 */
const dateSchema =
  z
    .string()
    .datetime({
      offset: true,
    })
    .or(
      z
        .string()
        .date(),
    );

/**
 * Heure HH:mm.
 */
const timeSchema =
  z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "L'heure doit être au format HH:mm.",
    );

/**
 * Note utilisateur.
 */
const noteSchema =
  z
    .string()
    .trim()
    .max(
      NOTE_MAX_LENGTH,
      `La note ne peut pas dépasser ${NOTE_MAX_LENGTH} caractères.`,
    )
    .optional();

/**
 * ============================================================
 * ENUMS
 * ============================================================
 */

/**
 * Statut d'une réservation.
 */
export const bookingStatusSchema =
  z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
    "REJECTED",
  ]);

/**
 * Motif d'annulation.
 */
export const cancellationReasonSchema =
  z.enum([
    "CUSTOMER_REQUEST",
    "BARBER_REQUEST",
    "SALON_REQUEST",
    "SCHEDULE_CONFLICT",
    "PAYMENT_FAILED",
    "NO_AVAILABILITY",
    "SYSTEM",
    "OTHER",
  ]);

/**
 * Mode de réservation.
 */
export const bookingSourceSchema =
  z.enum([
    "WEB",
    "MOBILE",
    "ADMIN",
    "BARBER",
    "SALON",
    "API",
  ]);

/**
 * Ordre de tri.
 */
export const sortOrderSchema =
  z.enum([
    "asc",
    "desc",
  ]);

/**
 * ============================================================
 * BOOKING SERVICE
 * ============================================================
 */

export const bookingServiceSchema =
  z.object({
    serviceId:
      uuidSchema,

    serviceName:
      z
        .string()
        .trim()
        .min(
          1,
          "Le nom du service est obligatoire.",
        )
        .max(
          SERVICE_NAME_MAX_LENGTH,
        )
        .optional(),

    durationMinutes:
      z
        .number()
        .int()
        .min(
          5,
          "La durée minimale est de 5 minutes.",
        )
        .max(
          480,
          "La durée maximale est de 8 heures.",
        )
        .optional(),

    price:
      z
        .number()
        .nonnegative()
        .optional(),

    currency:
      z
        .string()
        .length(
          3,
          "La devise doit contenir 3 caractères.",
        )
        .toUpperCase()
        .optional(),
  });

/**
 * ============================================================
 * CREATE BOOKING
 * ============================================================
 */

export const createBookingSchema =
  z
    .object({
      salonId:
        uuidSchema,

      barberId:
        uuidSchema
          .optional(),

      serviceId:
        uuidSchema,

      date:
        dateSchema,

      startTime:
        timeSchema,

      endTime:
        timeSchema,

      customerId:
        uuidSchema
          .optional(),

      notes:
        noteSchema,

      source:
        bookingSourceSchema
          .optional()
          .default(
            "WEB",
          ),

      paymentId:
        uuidSchema
          .optional(),

      service:
        bookingServiceSchema
          .optional(),

      currency:
        z
          .string()
          .length(
            3,
          )
          .toUpperCase()
          .optional(),

      price:
        z
          .number()
          .nonnegative()
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        /**
         * Vérification de l'ordre horaire.
         */
        const [
          startHour,
          startMinute,
        ] =
          data.startTime
            .split(":")
            .map(Number);

        const [
          endHour,
          endMinute,
        ] =
          data.endTime
            .split(":")
            .map(Number);

        const start =
          startHour *
            60 +
          startMinute;

        const end =
          endHour *
            60 +
          endMinute;

        if (
          end <= start
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "endTime",
            ],

            message:
              "L'heure de fin doit être postérieure à l'heure de début.",
          });
        }

        /**
         * Durée maximale.
         */
        if (
          end - start >
          480
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "endTime",
            ],

            message:
              "Une réservation ne peut pas dépasser 8 heures.",
          });
        }
      },
    );

/**
 * ============================================================
 * UPDATE BOOKING
 * ============================================================
 */

export const updateBookingSchema =
  z
    .object({
      barberId:
        uuidSchema
          .nullable()
          .optional(),

      serviceId:
        uuidSchema
          .optional(),

      date:
        dateSchema
          .optional(),

      startTime:
        timeSchema
          .optional(),

      endTime:
        timeSchema
          .optional(),

      notes:
        noteSchema,

      price:
        z
          .number()
          .nonnegative()
          .optional(),

      currency:
        z
          .string()
          .length(
            3,
          )
          .toUpperCase()
          .optional(),

      status:
        bookingStatusSchema
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        /**
         * Vérifier les horaires uniquement
         * lorsqu'ils sont fournis ensemble.
         */
        if (
          data.startTime &&
          data.endTime
        ) {
          const [
            sh,
            sm,
          ] =
            data.startTime
              .split(":")
              .map(Number);

          const [
            eh,
            em,
          ] =
            data.endTime
              .split(":")
              .map(Number);

          const start =
            sh * 60 + sm;

          const end =
            eh * 60 + em;

          if (
            end <= start
          ) {
            ctx.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "endTime",
              ],

              message:
                "L'heure de fin doit être postérieure à l'heure de début.",
            });
          }
        }
      },
    );

/**
 * ============================================================
 * RESCHEDULE
 * ============================================================
 */

export const rescheduleBookingSchema =
  z
    .object({
      date:
        dateSchema,

      startTime:
        timeSchema,

      endTime:
        timeSchema,

      reason:
        z
          .string()
          .trim()
          .max(
            NOTE_MAX_LENGTH,
          )
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        const [
          sh,
          sm,
        ] =
          data.startTime
            .split(":")
            .map(Number);

        const [
          eh,
          em,
        ] =
          data.endTime
            .split(":")
            .map(Number);

        if (
          eh * 60 +
            em <=
          sh * 60 +
            sm
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "endTime",
            ],

            message:
              "L'heure de fin doit être postérieure à l'heure de début.",
          });
        }
      },
    );

/**
 * ============================================================
 * CANCEL BOOKING
 * ============================================================
 */

export const cancelBookingSchema =
  z.object({
    reason:
      cancellationReasonSchema
        .optional(),

    note:
      z
        .string()
        .trim()
        .max(
          NOTE_MAX_LENGTH,
        )
        .optional(),

    refund:
      z
        .boolean()
        .optional()
        .default(
          false,
        ),
  });

/**
 * ============================================================
 * CONFIRM BOOKING
 * ============================================================
 */

export const confirmBookingSchema =
  z.object({
    paymentId:
      uuidSchema
        .optional(),

    note:
      z
        .string()
        .trim()
        .max(
          NOTE_MAX_LENGTH,
        )
        .optional(),
  });

/**
 * ============================================================
 * REJECT BOOKING
 * ============================================================
 */

export const rejectBookingSchema =
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
          NOTE_MAX_LENGTH,
        ),

    notifyCustomer:
      z
        .boolean()
        .optional()
        .default(
          true,
        ),
  });

/**
 * ============================================================
 * COMPLETE BOOKING
 * ============================================================
 */

export const completeBookingSchema =
  z.object({
    note:
      z
        .string()
        .trim()
        .max(
          NOTE_MAX_LENGTH,
        )
        .optional(),

    finalPrice:
      z
        .number()
        .nonnegative()
        .optional(),

    currency:
      z
        .string()
        .length(
          3,
        )
        .toUpperCase()
        .optional(),
  });

/**
 * ============================================================
 * NO SHOW
 * ============================================================
 */

export const noShowBookingSchema =
  z.object({
    note:
      z
        .string()
        .trim()
        .max(
          NOTE_MAX_LENGTH,
        )
        .optional(),

    notifyCustomer:
      z
        .boolean()
        .optional()
        .default(
          true,
        ),
  });

/**
 * ============================================================
 * START BOOKING
 * ============================================================
 */

export const startBookingSchema =
  z.object({
    startedAt:
      dateSchema
        .optional(),

    note:
      z
        .string()
        .trim()
        .max(
          NOTE_MAX_LENGTH,
        )
        .optional(),
  });

/**
 * ============================================================
 * BOOKING ID PARAM
 * ============================================================
 */

export const bookingIdParamSchema =
  z.object({
    bookingId:
      uuidSchema,
  });

/**
 * ============================================================
 * CUSTOMER BOOKINGS
 * ============================================================
 */

export const customerIdParamSchema =
  z.object({
    customerId:
      uuidSchema,
  });

/**
 * ============================================================
 * BARBER BOOKINGS
 * ============================================================
 */

export const barberIdParamSchema =
  z.object({
    barberId:
      uuidSchema,
  });

/**
 * ============================================================
 * SALON BOOKINGS
 * ============================================================
 */

export const salonIdParamSchema =
  z.object({
    salonId:
      uuidSchema,
  });

/**
 * ============================================================
 * BOOKING FILTERS
 * ============================================================
 */

const bookingFiltersBaseSchema = z.object({
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
        PAGE_MAX,
      )
      .default(
        20,
      ),

  search:
    z
      .string()
      .trim()
      .max(
        SEARCH_MAX_LENGTH,
      )
      .optional(),

  status:
    bookingStatusSchema
      .optional(),

  salonId:
    uuidSchema
      .optional(),

  barberId:
    uuidSchema
      .optional(),

  customerId:
    uuidSchema
      .optional(),

  dateFrom:
    dateSchema
      .optional(),

  dateTo:
    dateSchema
      .optional(),

  sortBy:
    z
      .enum([
        "createdAt",
        "date",
        "startTime",
        "status",
        "price",
      ])
      .default(
        "date",
      ),

  sortOrder:
    sortOrderSchema
      .default(
        "asc",
      ),
});

const withBookingFiltersChecks = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  schema.superRefine((data, ctx) => {
    if (
      data.dateFrom &&
      data.dateTo
    ) {
      const from =
        new Date(
          data.dateFrom,
        );

      const to =
        new Date(
          data.dateTo,
        );

      if (
        from > to
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
    }
  });

export const bookingFiltersSchema = withBookingFiltersChecks(bookingFiltersBaseSchema);

/**
 * ============================================================
 * AVAILABILITY
 * ============================================================
 */

export const availabilitySchema =
  z
    .object({
      salonId:
        uuidSchema,

      barberId:
        uuidSchema
          .optional(),

      serviceId:
        uuidSchema,

      date:
        dateSchema,

      startTime:
        timeSchema
          .optional(),

      endTime:
        timeSchema
          .optional(),

      durationMinutes:
        z
          .coerce
          .number()
          .int()
          .min(
            5,
          )
          .max(
            480,
          )
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.startTime &&
          data.endTime
        ) {
          const [
            sh,
            sm,
          ] =
            data.startTime
              .split(":")
              .map(Number);

          const [
            eh,
            em,
          ] =
            data.endTime
              .split(":")
              .map(Number);

          if (
            eh * 60 +
              em <=
            sh * 60 +
              sm
          ) {
            ctx.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "endTime",
              ],

              message:
                "L'heure de fin doit être postérieure à l'heure de début.",
            });
          }
        }

        /**
         * Il faut soit une durée,
         * soit un créneau complet.
         */
        if (
          !data.durationMinutes &&
          !(
            data.startTime &&
            data.endTime
          )
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "durationMinutes",
            ],

            message:
              "durationMinutes ou startTime/endTime est requis.",
          });
        }
      },
    );

/**
 * ============================================================
 * AVAILABLE SLOTS
 * ============================================================
 */

export const availableSlotsSchema =
  z.object({
    salonId:
      uuidSchema,

    barberId:
      uuidSchema
        .optional(),

    serviceId:
      uuidSchema,

    date:
      dateSchema,

    intervalMinutes:
      z
        .coerce
        .number()
        .int()
        .min(
          5,
        )
        .max(
          120,
        )
        .default(
          15,
        ),
  });

/**
 * ============================================================
 * CALENDAR QUERY
 * ============================================================
 */

export const bookingCalendarSchema =
  z
    .object({
      salonId:
        uuidSchema
          .optional(),

      barberId:
        uuidSchema
          .optional(),

      startDate:
        dateSchema,

      endDate:
        dateSchema,

      status:
        bookingStatusSchema
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        if (
          new Date(
            data.startDate,
          ) >
          new Date(
            data.endDate,
          )
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "endDate",
            ],

            message:
              "endDate doit être postérieure ou égale à startDate.",
          });
        }
      },
    );

/**
 * ============================================================
 * DASHBOARD STATS
 * ============================================================
 */

export const bookingStatsSchema =
  z
    .object({
      salonId:
        uuidSchema
          .optional(),

      barberId:
        uuidSchema
          .optional(),

      from:
        dateSchema
          .optional(),

      to:
        dateSchema
          .optional(),
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.from &&
          data.to &&
          new Date(
            data.from,
          ) >
            new Date(
              data.to,
            )
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "to",
            ],

            message:
              "La date de fin doit être postérieure à la date de début.",
          });
        }
      },
    );

/**
 * ============================================================
 * CUSTOMER BOOKING QUERY
 * ============================================================
 */

export const customerBookingQuerySchema =
  withBookingFiltersChecks(
    bookingFiltersBaseSchema.extend({
      customerId:
        uuidSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * BARBER BOOKING QUERY
 * ============================================================
 */

export const barberBookingQuerySchema =
  withBookingFiltersChecks(
    bookingFiltersBaseSchema.extend({
      barberId:
        uuidSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * SALON BOOKING QUERY
 * ============================================================
 */

export const salonBookingQuerySchema =
  withBookingFiltersChecks(
    bookingFiltersBaseSchema.extend({
      salonId:
        uuidSchema
          .optional(),
    }),
  );

/**
 * ============================================================
 * ADMIN BOOKING QUERY
 * ============================================================
 */

export const adminBookingQuerySchema =
  withBookingFiltersChecks(
    bookingFiltersBaseSchema.extend({
      tenantId:
        uuidSchema
          .optional(),

      salonId:
        uuidSchema
          .optional(),

      barberId:
        uuidSchema
          .optional(),

      customerId:
        uuidSchema
          .optional(),
    }),
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
            "Données de réservation invalides.",

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
            "Paramètres de recherche invalides.",

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
     * Ne pas muter req.query directement
     * avec certains types Express readonly.
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
            "Paramètres de réservation invalides.",

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

export type CreateBookingInput =
  z.infer<
    typeof createBookingSchema
  >;

export type UpdateBookingInput =
  z.infer<
    typeof updateBookingSchema
  >;

export type RescheduleBookingInput =
  z.infer<
    typeof rescheduleBookingSchema
  >;

export type CancelBookingInput =
  z.infer<
    typeof cancelBookingSchema
  >;

export type ConfirmBookingInput =
  z.infer<
    typeof confirmBookingSchema
  >;

export type RejectBookingInput =
  z.infer<
    typeof rejectBookingSchema
  >;

export type CompleteBookingInput =
  z.infer<
    typeof completeBookingSchema
  >;

export type NoShowBookingInput =
  z.infer<
    typeof noShowBookingSchema
  >;

export type StartBookingInput =
  z.infer<
    typeof startBookingSchema
  >;

export type BookingFilters =
  z.infer<
    typeof bookingFiltersSchema
  >;

export type AvailabilityInput =
  z.infer<
    typeof availabilitySchema
  >;

export type AvailableSlotsInput =
  z.infer<
    typeof availableSlotsSchema
  >;

export type BookingCalendarInput =
  z.infer<
    typeof bookingCalendarSchema
  >;

export type BookingStatsInput =
  z.infer<
    typeof bookingStatsSchema
  >;

/**
 * ============================================================
 * EXPORT DEFAULT
 * ============================================================
 */

export default {
  bookingServiceSchema,

  createBookingSchema,

  updateBookingSchema,

  rescheduleBookingSchema,

  cancelBookingSchema,

  confirmBookingSchema,

  rejectBookingSchema,

  completeBookingSchema,

  noShowBookingSchema,

  startBookingSchema,

  bookingIdParamSchema,

  customerIdParamSchema,

  barberIdParamSchema,

  salonIdParamSchema,

  bookingFiltersSchema,

  availabilitySchema,

  availableSlotsSchema,

  bookingCalendarSchema,

  bookingStatsSchema,

  customerBookingQuerySchema,

  barberBookingQuerySchema,

  salonBookingQuerySchema,

  adminBookingQuerySchema,
};

