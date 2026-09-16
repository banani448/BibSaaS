
// src/validators/auth.validator.ts

/**
 * ============================================================
 * BibSaaS — Authentication Validators
 * ============================================================
 *
 * Validation centralisée des entrées liées à l'authentification.
 *
 * Stack :
 * - TypeScript
 * - Zod
 * - Express
 *
 * Principes :
 * - Validation stricte
 * - Sanitization des données
 * - Messages d'erreur cohérents
 * - Protection contre les entrées invalides
 * - Types automatiquement inférés
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

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;

const PHONE_MIN_LENGTH = 8;
const PHONE_MAX_LENGTH = 20;

const OTP_LENGTH = 6;

const DEVICE_ID_MAX_LENGTH = 255;
const DEVICE_NAME_MAX_LENGTH = 100;

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Nettoyage simple d'une chaîne.
 */
const cleanString = (
  value: string,
): string =>
  value
    .trim()
    .replace(/\s+/g, " ");

/**
 * Email normalisé.
 */
const emailSchema = z
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
 * Nom/prénom.
 */
const nameSchema = z
  .string()
  .trim()
  .min(
    NAME_MIN_LENGTH,
    `Le nom doit contenir au moins ${NAME_MIN_LENGTH} caractères.`,
  )
  .max(
    NAME_MAX_LENGTH,
    `Le nom ne peut pas dépasser ${NAME_MAX_LENGTH} caractères.`,
  )
  .regex(
    /^[\p{L}\p{M}' -]+$/u,
    "Le nom contient des caractères invalides.",
  )
  .transform(cleanString);

/**
 * Mot de passe.
 */
const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
  )
  .refine(
    (password) =>
      /[a-z]/.test(
        password,
      ),
    {
      message:
        "Le mot de passe doit contenir au moins une lettre minuscule.",
    },
  )
  .refine(
    (password) =>
      /[A-Z]/.test(
        password,
      ),
    {
      message:
        "Le mot de passe doit contenir au moins une lettre majuscule.",
    },
  )
  .refine(
    (password) =>
      /\d/.test(
        password,
      ),
    {
      message:
        "Le mot de passe doit contenir au moins un chiffre.",
    },
  )
  .refine(
    (password) =>
      /[^A-Za-z0-9]/.test(
        password,
      ),
    {
      message:
        "Le mot de passe doit contenir au moins un caractère spécial.",
    },
  );

/**
 * Numéro de téléphone international.
 *
 * Exemples :
 * +242064487803
 * +33612345678
 */
const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[1-9]\d{7,14}$/,
    "Numéro de téléphone invalide.",
  )
  .min(
    PHONE_MIN_LENGTH,
  )
  .max(
    PHONE_MAX_LENGTH,
  );

/**
 * UUID.
 */
const uuidSchema =
  z.string().uuid(
    "Identifiant UUID invalide.",
  );

/**
 * ============================================================
 * ENUMS
 * ============================================================
 */

export const userRoleSchema =
  z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "BARBER",
    "SALON",
    "SALON_MANAGER",
    "RECEPTIONIST",
    "STAFF",
  ]);

export const languageSchema =
  z.enum([
    "fr",
    "en",
  ]);

export const authProviderSchema =
  z.enum([
    "LOCAL",
    "GOOGLE",
    "APPLE",
    "FACEBOOK",
    "MICROSOFT",
  ]);

export const mfaMethodSchema =
  z.enum([
    "TOTP",
    "SMS",
    "EMAIL",
  ]);

/**
 * ============================================================
 * REGISTER
 * ============================================================
 */

export const registerSchema =
  z
    .object({
      email:
        emailSchema,

      password:
        passwordSchema,

      firstName:
        nameSchema,

      lastName:
        nameSchema,

      phoneNumber:
        phoneSchema
          .optional(),

      role:
        userRoleSchema
          .optional()
          .default(
            "CLIENT",
          ),

      tenantId:
        uuidSchema
          .nullable()
          .optional(),

      salonId:
        uuidSchema
          .nullable()
          .optional(),

      acceptTerms:
        z
          .boolean()
          .refine(
            (value) =>
              value === true,
            {
              message:
                "Vous devez accepter les conditions d'utilisation.",
            },
          ),

      marketingConsent:
        z
          .boolean()
          .optional()
          .default(
            false,
          ),

      language:
        languageSchema
          .optional()
          .default(
            "fr",
          ),
    })
    .superRefine(
      (data, ctx) => {
        /**
         * Le SUPER_ADMIN ne doit pas pouvoir être
         * créé librement via l'inscription publique.
         */
        if (
          data.role ===
          "SUPER_ADMIN"
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "role",
            ],

            message:
              "Le rôle SUPER_ADMIN ne peut pas être attribué via l'inscription publique.",
          });
        }

        /**
         * Les rôles professionnels nécessitent
         * généralement un tenant.
         */
        const professionalRoles =
          [
            "BARBER",
            "SALON",
            "SALON_MANAGER",
            "RECEPTIONIST",
            "STAFF",
          ];

        if (
          professionalRoles.includes(
            data.role,
          ) &&
          !data.tenantId
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "tenantId",
            ],

            message:
              "Un tenantId est requis pour ce rôle.",
          });
        }
      },
    );

/**
 * ============================================================
 * LOGIN
 * ============================================================
 */

export const loginSchema =
  z.object({
    email:
      emailSchema,

    password:
      z
        .string()
        .min(
          1,
          "Le mot de passe est obligatoire.",
        )
        .max(
          PASSWORD_MAX_LENGTH,
        ),

    rememberMe:
      z
        .boolean()
        .optional()
        .default(
          false,
        ),

    deviceId:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .max(
          DEVICE_ID_MAX_LENGTH,
        )
        .optional(),

    deviceName:
      z
        .string()
        .trim()
        .min(
          1,
        )
        .max(
          DEVICE_NAME_MAX_LENGTH,
        )
        .optional(),
  });

/**
 * ============================================================
 * REFRESH TOKEN
 * ============================================================
 */

export const refreshTokenSchema =
  z.object({
    refreshToken:
      z
        .string()
        .trim()
        .min(
          20,
          "Refresh token invalide.",
        )
        .max(
          4096,
          "Refresh token trop long.",
        ),

    deviceId:
      z
        .string()
        .trim()
        .max(
          DEVICE_ID_MAX_LENGTH,
        )
        .optional(),
  });

/**
 * ============================================================
 * LOGOUT
 * ============================================================
 */

export const logoutSchema =
  z
    .object({
      sessionId:
        uuidSchema
          .optional(),

      refreshToken:
        z
          .string()
          .min(
            20,
          )
          .max(
            4096,
          )
          .optional(),

      logoutAllDevices:
        z
          .boolean()
          .optional()
          .default(
            false,
          ),
    })
    .refine(
      (data) =>
        Boolean(
          data.sessionId ||
            data.refreshToken ||
            data.logoutAllDevices,
        ),
      {
        message:
          "sessionId, refreshToken ou logoutAllDevices est requis.",
      },
    );

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

      logoutOtherSessions:
        z
          .boolean()
          .optional()
          .default(
            true,
          ),
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
 * FORGOT PASSWORD
 * ============================================================
 */

export const forgotPasswordSchema =
  z.object({
    email:
      emailSchema,
  });

/**
 * ============================================================
 * RESET PASSWORD
 * ============================================================
 */

export const resetPasswordSchema =
  z
    .object({
      token:
        z
          .string()
          .trim()
          .min(
            20,
            "Token de réinitialisation invalide.",
          )
          .max(
            4096,
          ),

      newPassword:
        passwordSchema,

      confirmPassword:
        z
          .string()
          .min(
            1,
            "La confirmation est obligatoire.",
          ),
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
    );

/**
 * ============================================================
 * EMAIL VERIFICATION
 * ============================================================
 */

export const verifyEmailSchema =
  z.object({
    token:
      z
        .string()
        .trim()
        .min(
          20,
          "Token de vérification invalide.",
        )
        .max(
          4096,
        ),
  });

export const resendVerificationEmailSchema =
  z.object({
    email:
      emailSchema,
  });

/**
 * ============================================================
 * PHONE VERIFICATION
 * ============================================================
 */

export const sendPhoneVerificationSchema =
  z.object({
    phoneNumber:
      phoneSchema,
  });

export const verifyPhoneSchema =
  z.object({
    code:
      z
        .string()
        .trim()
        .regex(
          new RegExp(
            `^\\d{${OTP_LENGTH}}$`,
          ),
          `Le code doit contenir exactement ${OTP_LENGTH} chiffres.`,
        ),

    phoneNumber:
      phoneSchema
        .optional(),
  });

/**
 * ============================================================
 * MFA
 * ============================================================
 */

export const enableMfaSchema =
  z.object({
    method:
      mfaMethodSchema,

    code:
      z
        .string()
        .trim()
        .regex(
          new RegExp(
            `^\\d{${OTP_LENGTH}}$`,
          ),
          `Le code MFA doit contenir ${OTP_LENGTH} chiffres.`,
        ),
  });

export const verifyMfaSchema =
  z.object({
    code:
      z
        .string()
        .trim()
        .regex(
          new RegExp(
            `^\\d{${OTP_LENGTH}}$`,
          ),
          `Le code MFA doit contenir ${OTP_LENGTH} chiffres.`,
        ),

    method:
      mfaMethodSchema
        .optional(),

    sessionId:
      uuidSchema
        .optional(),
  });

/**
 * ============================================================
 * DISABLE MFA
 * ============================================================
 */

export const disableMfaSchema =
  z.object({
    password:
      z
        .string()
        .min(
          1,
          "Le mot de passe est obligatoire.",
        ),

    code:
      z
        .string()
        .trim()
        .regex(
          new RegExp(
            `^\\d{${OTP_LENGTH}}$`,
          ),
          `Le code MFA doit contenir ${OTP_LENGTH} chiffres.`,
        ),
  });

/**
 * ============================================================
 * BACKUP CODE
 * ============================================================
 */

export const verifyBackupCodeSchema =
  z.object({
    code:
      z
        .string()
        .trim()
        .min(
          6,
          "Code de récupération invalide.",
        )
        .max(
          64,
        ),
  });

/**
 * ============================================================
 * OAUTH
 * ============================================================
 */

export const oauthLoginSchema =
  z
    .object({
      provider:
        authProviderSchema
          .refine(
            (provider) =>
              provider !==
              "LOCAL",
            {
              message:
                "LOCAL ne peut pas être utilisé pour OAuth.",
            },
          ),

      code:
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

      accessToken:
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

      redirectUri:
        z
          .string()
          .url(
            "redirectUri invalide.",
          )
          .max(
            2048,
          )
          .optional(),

      state:
        z
          .string()
          .trim()
          .max(
            2048,
          )
          .optional(),
    })
    .refine(
      (data) =>
        Boolean(
          data.code ||
            data.accessToken,
        ),
      {
        message:
          "code ou accessToken est requis.",
      },
    );

/**
 * ============================================================
 * SESSION ID
 * ============================================================
 */

export const sessionIdSchema =
  z.object({
    sessionId:
      uuidSchema,
  });

/**
 * ============================================================
 * USER ID
 * ============================================================
 */

export const userIdSchema =
  z.object({
    userId:
      uuidSchema,
  });

/**
 * ============================================================
 * TENANT AUTHORIZATION
 * ============================================================
 */

export const tenantContextSchema =
  z.object({
    tenantId:
      uuidSchema,

    salonId:
      uuidSchema
        .optional(),
  });

/**
 * ============================================================
 * PASSWORD POLICY
 * ============================================================
 */

export const passwordPolicySchema =
  z.object({
    minLength:
      z
        .number()
        .int()
        .min(
          8,
        )
        .max(
          128,
        ),

    maxLength:
      z
        .number()
        .int()
        .min(
          8,
        )
        .max(
          256,
        ),

    requireUppercase:
      z.boolean(),

    requireLowercase:
      z.boolean(),

    requireNumber:
      z.boolean(),

    requireSpecialCharacter:
      z.boolean(),

    preventCommonPasswords:
      z.boolean(),

    preventUserInfo:
      z.boolean(),
  })
  .refine(
    (data) =>
      data.maxLength >=
      data.minLength,
    {
      path: [
        "maxLength",
      ],

      message:
        "maxLength doit être supérieur ou égal à minLength.",
    },
  );

/**
 * ============================================================
 * AUTHENTICATION SETTINGS
 * ============================================================
 */

export const authSecuritySettingsSchema =
  z.object({
    accessTokenExpiration:
      z
        .string()
        .min(
          1,
        )
        .max(
          50,
        ),

    refreshTokenExpiration:
      z
        .string()
        .min(
          1,
        )
        .max(
          50,
        ),

    maxActiveSessions:
      z
        .number()
        .int()
        .min(
          1,
        )
        .max(
          100,
        ),

    maxLoginAttempts:
      z
        .number()
        .int()
        .min(
          1,
        )
        .max(
          20,
        ),

    accountLockDurationMinutes:
      z
        .number()
        .int()
        .min(
          1,
        )
        .max(
          1440,
        ),

    requireEmailVerification:
      z.boolean(),

    requirePhoneVerification:
      z.boolean(),

    requireMfaForAdmin:
      z.boolean(),

    passwordPolicy:
      passwordPolicySchema,
  });

/**
 * ============================================================
 * VALIDATION RESULT
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
 * EXPRESS VALIDATION MIDDLEWARE FACTORY
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
            "Données invalides.",

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

    /**
     * Remplace le body par la version
     * validée et transformée.
     */
    req.body =
      result.data;

    next();
  };
}

/**
 * ============================================================
 * EXPRESS QUERY VALIDATION
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
            "Paramètres de requête invalides.",

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

    req.query =
      result.data;

    next();
  };
}

/**
 * ============================================================
 * EXPRESS PARAMS VALIDATION
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
            "Paramètres de route invalides.",

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

    next();
  };
}

/**
 * ============================================================
 * INFERRED TYPES
 * ============================================================
 */

export type RegisterInput =
  z.infer<
    typeof registerSchema
  >;

export type LoginInput =
  z.infer<
    typeof loginSchema
  >;

export type RefreshTokenInput =
  z.infer<
    typeof refreshTokenSchema
  >;

export type LogoutInput =
  z.infer<
    typeof logoutSchema
  >;

export type ChangePasswordInput =
  z.infer<
    typeof changePasswordSchema
  >;

export type ForgotPasswordInput =
  z.infer<
    typeof forgotPasswordSchema
  >;

export type ResetPasswordInput =
  z.infer<
    typeof resetPasswordSchema
  >;

export type VerifyEmailInput =
  z.infer<
    typeof verifyEmailSchema
  >;

export type ResendVerificationEmailInput =
  z.infer<
    typeof resendVerificationEmailSchema
  >;

export type SendPhoneVerificationInput =
  z.infer<
    typeof sendPhoneVerificationSchema
  >;

export type VerifyPhoneInput =
  z.infer<
    typeof verifyPhoneSchema
  >;

export type EnableMfaInput =
  z.infer<
    typeof enableMfaSchema
  >;

export type VerifyMfaInput =
  z.infer<
    typeof verifyMfaSchema
  >;

export type DisableMfaInput =
  z.infer<
    typeof disableMfaSchema
  >;

export type VerifyBackupCodeInput =
  z.infer<
    typeof verifyBackupCodeSchema
  >;

export type OAuthLoginInput =
  z.infer<
    typeof oauthLoginSchema
  >;

export type TenantContextInput =
  z.infer<
    typeof tenantContextSchema
  >;

export type PasswordPolicyInput =
  z.infer<
    typeof passwordPolicySchema
  >;

export type AuthSecuritySettingsInput =
  z.infer<
    typeof authSecuritySettingsSchema
  >;

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export {
  emailSchema,
  passwordSchema,
  phoneSchema,
  uuidSchema,
  nameSchema,
};

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  sendPhoneVerificationSchema,
  verifyPhoneSchema,
  enableMfaSchema,
  verifyMfaSchema,
  disableMfaSchema,
  verifyBackupCodeSchema,
  oauthLoginSchema,
  sessionIdSchema,
  userIdSchema,
  tenantContextSchema,
  passwordPolicySchema,
  authSecuritySettingsSchema,
};
