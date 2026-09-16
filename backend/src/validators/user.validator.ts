
// src/validators/user.validator.ts

/**
 * ============================================================
 * BibSaaS — User Validators
 * ============================================================
 *
 * Validation centralisée des utilisateurs.
 *
 * Responsabilités :
 * - Création utilisateur
 * - Mise à jour profil
 * - Modification email
 * - Modification téléphone
 * - Modification mot de passe
 * - Gestion du rôle
 * - Activation / désactivation
 * - Pagination
 * - Recherche
 * - Filtres admin
 * - Préférences utilisateur
 * - Adresse utilisateur
 *
 * IMPORTANT :
 * Ce fichier valide uniquement les données entrantes.
 * Les règles métier, permissions et accès tenant doivent
 * rester dans les controllers/services/middlewares.
 *
 * Stack :
 * - TypeScript
 * - Zod
 * - Express
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

const MAX_STRING_LENGTH = 500;
const MAX_BIO_LENGTH = 2000;
const MAX_METADATA_KEYS = 50;
const MAX_PAGE_SIZE = 100;

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
 * Email.
 */
export const emailSchema =
  z
    .string()
    .trim()
    .toLowerCase()
    .email(
      "Adresse email invalide.",
    )
    .max(
      254,
      "Adresse email trop longue.",
    );

/**
 * Téléphone international.
 */
export const phoneSchema =
  z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Numéro de téléphone invalide.",
    )
    .max(
      20,
      "Numéro de téléphone trop long.",
    );

/**
 * Nom / prénom.
 */
export const nameSchema =
  z
    .string()
    .trim()
    .min(
      2,
      "Le nom doit contenir au moins 2 caractères.",
    )
    .max(
      100,
      "Le nom est trop long.",
    )
    .regex(
      /^[\p{L}\p{M}0-9'’ .-]+$/u,
      "Le nom contient des caractères invalides.",
    );

/**
 * Mot de passe.
 *
 * Politique :
 * - 8 caractères minimum
 * - 128 maximum
 * - au moins une minuscule
 * - au moins une majuscule
 * - au moins un chiffre
 *
 * Les règles de complexité peuvent être renforcées
 * dans auth.validator.ts si nécessaire.
 */
export const passwordSchema =
  z
    .string()
    .min(
      8,
      "Le mot de passe doit contenir au moins 8 caractères.",
    )
    .max(
      128,
      "Le mot de passe est trop long.",
    )
    .regex(
      /[a-z]/,
      "Le mot de passe doit contenir une lettre minuscule.",
    )
    .regex(
      /[A-Z]/,
      "Le mot de passe doit contenir une lettre majuscule.",
    )
    .regex(
      /\d/,
      "Le mot de passe doit contenir un chiffre.",
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
 * USER ROLES
 * ============================================================
 *
 * Adapter les valeurs si elles sont différentes dans
 * ton schema.prisma.
 * ============================================================
 */

export const userRoleSchema =
  z.enum([
    "CLIENT",
    "BARBER",
    "SALON_OWNER",
    "SALON_MANAGER",
    "SALON_STAFF",
    "ADMIN",
    "SUPER_ADMIN",
  ]);

/**
 * ============================================================
 * USER STATUS
 * ============================================================
 */

export const userStatusSchema =
  z.enum([
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "PENDING",
    "BLOCKED",
    "DELETED",
  ]);

/**
 * ============================================================
 * GENDER
 * ============================================================
 */

export const genderSchema =
  z.enum([
    "MALE",
    "FEMALE",
    "OTHER",
    "PREFER_NOT_TO_SAY",
  ]);

/**
 * ============================================================
 * LANGUAGE
 * ============================================================
 */

export const languageSchema =
  z.enum([
    "FR",
    "EN",
  ]);

/**
 * ============================================================
 * CURRENCY
 * ============================================================
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
 * ============================================================
 * USER ID PARAM
 * ============================================================
 */

export const userIdParamSchema =
  z.object({
    userId:
      uuidSchema,
  });

/**
 * ============================================================
 * CREATE USER
 * ============================================================
 */

export const createUserSchema =
  z
    .object({
      firstName:
        nameSchema,

      lastName:
        nameSchema,

      email:
        emailSchema,

      phone:
        phoneSchema
          .optional(),

      password:
        passwordSchema,

      role:
        userRoleSchema
          .default(
            "CLIENT",
          ),

      gender:
        genderSchema
          .optional(),

      dateOfBirth:
        z
          .coerce
          .date()
          .optional(),

      avatarUrl:
        z
          .string()
          .url(
            "URL d'avatar invalide.",
          )
          .max(
            2048,
          )
          .optional(),

      bio:
        z
          .string()
          .trim()
          .max(
            MAX_BIO_LENGTH,
          )
          .optional(),

      language:
        languageSchema
          .default(
            "FR",
          ),

      currency:
        currencySchema
          .default(
            "XAF",
          ),

      status:
        userStatusSchema
          .default(
            "ACTIVE",
          ),

      emailVerified:
        z
          .boolean()
          .default(
            false,
          ),

      phoneVerified:
        z
          .boolean()
          .default(
            false,
          ),

      metadata:
        metadataSchema,
    })
    .superRefine(
      (data, ctx) => {
        /**
         * Un utilisateur ne devrait pas pouvoir
         * avoir une date de naissance future.
         */
        if (
          data.dateOfBirth &&
          data.dateOfBirth >
            new Date()
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "dateOfBirth",
            ],

            message:
              "La date de naissance ne peut pas être dans le futur.",
          });
        }

        /**
         * Les comptes ADMIN/SUPER_ADMIN ne doivent
         * normalement pas être créés librement par
         * l'API publique.
         */
        if (
          [
            "ADMIN",
            "SUPER_ADMIN",
          ].includes(
            data.role,
          )
        ) {
          /**
           * Le controller/service doit vérifier
           * l'autorisation de l'appelant.
           *
           * On ne bloque volontairement pas ici
           * afin de permettre aux routes admin de
           * réutiliser le schema.
           */
        }
      },
    );

/**
 * ============================================================
 * UPDATE USER PROFILE
 * ============================================================
 */

export const updateUserSchema =
  z
    .object({
      firstName:
        nameSchema
          .optional(),

      lastName:
        nameSchema
          .optional(),

      phone:
        phoneSchema
          .nullable()
          .optional(),

      gender:
        genderSchema
          .nullable()
          .optional(),

      dateOfBirth:
        z
          .coerce
          .date()
          .nullable()
          .optional(),

      avatarUrl:
        z
          .string()
          .url(
            "URL d'avatar invalide.",
          )
          .max(
            2048,
          )
          .nullable()
          .optional(),

      bio:
        z
          .string()
          .trim()
          .max(
            MAX_BIO_LENGTH,
          )
          .nullable()
          .optional(),

      language:
        languageSchema
          .optional(),

      currency:
        currencySchema
          .optional(),

      metadata:
        metadataSchema,
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.dateOfBirth &&
          data.dateOfBirth >
            new Date()
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "dateOfBirth",
            ],

            message:
              "La date de naissance ne peut pas être dans le futur.",
          });
        }

        if (
          Object.keys(
            data,
          ).length === 0
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "root",
            ],

            message:
              "Au moins un champ doit être fourni.",
          });
        }
      },
    );

/**
 * ============================================================
 * UPDATE EMAIL
 * ============================================================
 */

export const updateEmailSchema =
  z.object({
    email:
      emailSchema,

    currentPassword:
      z
        .string()
        .min(
          1,
          "Le mot de passe actuel est obligatoire.",
        ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * UPDATE PHONE
 * ============================================================
 */

export const updatePhoneSchema =
  z.object({
    phone:
      phoneSchema,

    currentPassword:
      z
        .string()
        .min(
          1,
          "Le mot de passe actuel est obligatoire.",
        ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * CHANGE PASSWORD
 * ============================================================
 */

export const changePasswordSchema =
  z
    .object({
      currentPassword:
        z
          .string()
          .min(
            1,
            "Le mot de passe actuel est obligatoire.",
          ),

      newPassword:
        passwordSchema,

      confirmPassword:
        z
          .string()
          .min(
            1,
            "La confirmation du mot de passe est obligatoire.",
          ),

      metadata:
        metadataSchema,
    })
    .refine(
      (data) =>
        data.newPassword ===
        data.confirmPassword,
      {
        path: [
          "confirmPassword",
        ],

        message:
          "Les mots de passe ne correspondent pas.",
      },
    )
    .refine(
      (data) =>
        data.currentPassword !==
        data.newPassword,
      {
        path: [
          "newPassword",
        ],

        message:
          "Le nouveau mot de passe doit être différent de l'ancien.",
      },
    );

/**
 * ============================================================
 * ADMIN UPDATE USER
 * ============================================================
 */

export const adminUpdateUserSchema =
  z
    .object({
      firstName:
        nameSchema
          .optional(),

      lastName:
        nameSchema
          .optional(),

      email:
        emailSchema
          .optional(),

      phone:
        phoneSchema
          .nullable()
          .optional(),

      role:
        userRoleSchema
          .optional(),

      status:
        userStatusSchema
          .optional(),

      gender:
        genderSchema
          .nullable()
          .optional(),

      dateOfBirth:
        z
          .coerce
          .date()
          .nullable()
          .optional(),

      avatarUrl:
        z
          .string()
          .url()
          .max(
            2048,
          )
          .nullable()
          .optional(),

      bio:
        z
          .string()
          .trim()
          .max(
            MAX_BIO_LENGTH,
          )
          .nullable()
          .optional(),

      language:
        languageSchema
          .optional(),

      currency:
        currencySchema
          .optional(),

      emailVerified:
        z
          .boolean()
          .optional(),

      phoneVerified:
        z
          .boolean()
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
 * CHANGE ROLE
 * ============================================================
 */

export const changeUserRoleSchema =
  z.object({
    role:
      userRoleSchema,

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
        ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * CHANGE STATUS
 * ============================================================
 */

export const changeUserStatusSchema =
  z.object({
    status:
      userStatusSchema,

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
        ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * SUSPEND USER
 * ============================================================
 */

export const suspendUserSchema =
  z.object({
    reason:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          MAX_STRING_LENGTH,
        ),

    until:
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
        data.until &&
        data.until <=
          new Date()
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode
              .custom,

          path: [
            "until",
          ],

          message:
            "La date de fin de suspension doit être dans le futur.",
        });
      }
    },
  );

/**
 * ============================================================
 * DELETE USER
 * ============================================================
 */

export const deleteUserSchema =
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
        ),

    confirmation:
      z.literal(
        "DELETE",
        {
          message:
            "Confirmation invalide. Utilisez DELETE.",
        },
      ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * RESTORE USER
 * ============================================================
 */

export const restoreUserSchema =
  z.object({
    reason:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          MAX_STRING_LENGTH,
        ),

    metadata:
      metadataSchema,
  });

/**
 * ============================================================
 * USER FILTERS
 * ============================================================
 */

export const userFiltersSchema =
  z
    .object({
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
            150,
          )
          .optional(),

      role:
        userRoleSchema
          .optional(),

      status:
        userStatusSchema
          .optional(),

      gender:
        genderSchema
          .optional(),

      language:
        languageSchema
          .optional(),

      currency:
        currencySchema
          .optional(),

      emailVerified:
        z
          .string()
          .transform(
            (value) =>
              value ===
              "true",
          )
          .optional(),

      phoneVerified:
        z
          .string()
          .transform(
            (value) =>
              value ===
              "true",
          )
          .optional(),

      createdFrom:
        z
          .coerce
          .date()
          .optional(),

      createdTo:
        z
          .coerce
          .date()
          .optional(),

      sortBy:
        z
          .enum([
            "createdAt",
            "updatedAt",
            "firstName",
            "lastName",
            "email",
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
    })
    .superRefine(
      (data, ctx) => {
        if (
          data.createdFrom &&
          data.createdTo &&
          data.createdFrom >
            data.createdTo
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "createdTo",
            ],

            message:
              "createdTo doit être postérieure ou égale à createdFrom.",
          });
        }
      },
    );

/**
 * ============================================================
 * USER PREFERENCES
 * ============================================================
 */

export const updateUserPreferencesSchema =
  z.object({
    language:
      languageSchema
        .optional(),

    currency:
      currencySchema
        .optional(),

    emailNotifications:
      z
        .boolean()
        .optional(),

    pushNotifications:
      z
        .boolean()
        .optional(),

    smsNotifications:
      z
        .boolean()
        .optional(),

    marketingEmails:
      z
        .boolean()
        .optional(),

    bookingReminders:
      z
        .boolean()
        .optional(),

    paymentNotifications:
      z
        .boolean()
        .optional(),

    subscriptionNotifications:
      z
        .boolean()
        .optional(),
  })
  .refine(
    (data) =>
      Object.keys(
        data,
      ).length > 0,
    {
      message:
        "Au moins une préférence doit être fournie.",
    },
  );

/**
 * ============================================================
 * ADDRESS
 * ============================================================
 */

export const userAddressSchema =
  z.object({
    addressLine1:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          255,
        ),

    addressLine2:
      z
        .string()
        .trim()
        .max(
          255,
        )
        .optional(),

    city:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          100,
        ),

    state:
      z
        .string()
        .trim()
        .max(
          100,
        )
        .optional(),

    postalCode:
      z
        .string()
        .trim()
        .max(
          30,
        )
        .optional(),

    country:
      z
        .string()
        .trim()
        .min(
          2,
        )
        .max(
          100,
        ),

    latitude:
      z
        .coerce
        .number()
        .min(
          -90,
        )
        .max(
          90,
        )
        .optional(),

    longitude:
      z
        .coerce
        .number()
        .min(
          -180,
        )
        .max(
          180,
        )
        .optional(),

    isDefault:
      z
        .boolean()
        .default(
          false,
        ),
  });

/**
 * ============================================================
 * UPDATE ADDRESS
 * ============================================================
 */

export const updateUserAddressSchema =
  userAddressSchema
    .partial()
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
 * USER SEARCH
 * ============================================================
 */

export const userSearchSchema =
  z
    .object({
      q:
        z
          .string()
          .trim()
          .min(
            1,
            "Le terme de recherche est obligatoire.",
          )
          .max(
            150,
          ),

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
    });

/**
 * ============================================================
 * USER STATS
 * ============================================================
 */

export const userStatsSchema =
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

      role:
        userRoleSchema
          .optional(),

      status:
        userStatusSchema
          .optional(),

      gender:
        genderSchema
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
 * VERIFY EMAIL
 * ============================================================
 */

export const verifyEmailSchema =
  z.object({
    token:
      z
        .string()
        .trim()
        .min(
          10,
          "Token de vérification invalide.",
        )
        .max(
          2048,
        ),
  });

/**
 * ============================================================
 * VERIFY PHONE
 * ============================================================
 */

export const verifyPhoneSchema =
  z.object({
    phone:
      phoneSchema,

    code:
      z
        .string()
        .trim()
        .regex(
          /^\d{4,8}$/,
          "Code de vérification invalide.",
        ),
  });

/**
 * ============================================================
 * RESEND VERIFICATION
 * ============================================================
 */

export const resendVerificationSchema =
  z.object({
    type:
      z.enum([
        "EMAIL",
        "PHONE",
      ]),

    email:
      emailSchema
        .optional(),

    phone:
      phoneSchema
        .optional(),
  })
  .superRefine(
    (data, ctx) => {
      if (
        data.type ===
          "EMAIL" &&
        !data.email
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode
              .custom,

          path: [
            "email",
          ],

          message:
            "L'adresse email est obligatoire.",
        });
      }

      if (
        data.type ===
          "PHONE" &&
        !data.phone
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode
              .custom,

          path: [
            "phone",
          ],

          message:
            "Le numéro de téléphone est obligatoire.",
        });
      }
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
            "Données utilisateur invalides.",

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
            "Paramètres utilisateur invalides.",

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
            "Paramètres utilisateur invalides.",

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

export type CreateUserInput =
  z.infer<
    typeof createUserSchema
  >;

export type UpdateUserInput =
  z.infer<
    typeof updateUserSchema
  >;

export type UpdateEmailInput =
  z.infer<
    typeof updateEmailSchema
  >;

export type UpdatePhoneInput =
  z.infer<
    typeof updatePhoneSchema
  >;

export type ChangePasswordInput =
  z.infer<
    typeof changePasswordSchema
  >;

export type AdminUpdateUserInput =
  z.infer<
    typeof adminUpdateUserSchema
  >;

export type ChangeUserRoleInput =
  z.infer<
    typeof changeUserRoleSchema
  >;

export type ChangeUserStatusInput =
  z.infer<
    typeof changeUserStatusSchema
  >;

export type SuspendUserInput =
  z.infer<
    typeof suspendUserSchema
  >;

export type DeleteUserInput =
  z.infer<
    typeof deleteUserSchema
  >;

export type RestoreUserInput =
  z.infer<
    typeof restoreUserSchema
  >;

export type UserFilters =
  z.infer<
    typeof userFiltersSchema
  >;

export type UpdateUserPreferencesInput =
  z.infer<
    typeof updateUserPreferencesSchema
  >;

export type UserAddressInput =
  z.infer<
    typeof userAddressSchema
  >;

export type UpdateUserAddressInput =
  z.infer<
    typeof updateUserAddressSchema
  >;

export type UserSearchInput =
  z.infer<
    typeof userSearchSchema
  >;

export type UserStatsInput =
  z.infer<
    typeof userStatsSchema
  >;

export type VerifyEmailInput =
  z.infer<
    typeof verifyEmailSchema
  >;

export type VerifyPhoneInput =
  z.infer<
    typeof verifyPhoneSchema
  >;

export type ResendVerificationInput =
  z.infer<
    typeof resendVerificationSchema
  >;

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  uuidSchema,

  emailSchema,

  phoneSchema,

  nameSchema,

  passwordSchema,

  metadataSchema,

  userRoleSchema,

  userStatusSchema,

  genderSchema,

  languageSchema,

  currencySchema,

  userIdParamSchema,

  createUserSchema,

  updateUserSchema,

  updateEmailSchema,

  updatePhoneSchema,

  changePasswordSchema,

  adminUpdateUserSchema,

  changeUserRoleSchema,

  changeUserStatusSchema,

  suspendUserSchema,

  deleteUserSchema,

  restoreUserSchema,

  userFiltersSchema,

  updateUserPreferencesSchema,

  userAddressSchema,

  updateUserAddressSchema,

  userSearchSchema,

  userStatsSchema,

  verifyEmailSchema,

  verifyPhoneSchema,

  resendVerificationSchema,
};
