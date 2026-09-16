
/**
 * ============================================================
 * BibSaaS — JWT Configuration & Service
 * ============================================================
 *
 * File:
 * config/jwt.ts
 *
 * Responsabilités :
 * - Configuration centralisée JWT
 * - Génération Access Token
 * - Génération Refresh Token
 * - Vérification JWT
 * - Décodage sécurisé
 * - Typage des payloads
 * - Gestion des rôles
 * - Support multi-tenant
 * - Protection contre une mauvaise configuration
 *
 * ============================================================
 */

import jwt, {
  JwtPayload as JsonWebTokenPayload,
  SignOptions,
} from "jsonwebtoken";

/**
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

function getRequiredEnv(
  primaryName: string,
  fallbackName?: string,
): string {
  const value =
    process.env[primaryName] ??
    (fallbackName
      ? process.env[fallbackName]
      : undefined);

  if (
    !value ||
    value.trim().length === 0
  ) {
    throw new Error(
      `[JWT] Missing required environment variable: ${primaryName}${fallbackName ? ` or ${fallbackName}` : ""}`,
    );
  }

  return value.trim();
}

function getNumberEnv(
  name: string,
  fallback: number,
): number {
  const value =
    process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `[JWT] Invalid numeric environment variable: ${name}`,
    );
  }

  return parsed;
}

/**
 * ============================================================
 * JWT CONFIGURATION
 * ============================================================
 */

export const JWT_CONFIG = {
  /**
   * Secret utilisé pour Access Token.
   *
   * En production, utiliser un secret long,
   * aléatoire et impossible à deviner.
   */
  accessSecret:
    getRequiredEnv(
      "JWT_ACCESS_SECRET",
      "JWT_SECRET",
    ),

  /**
   * Secret distinct pour Refresh Token.
   */
  refreshSecret:
    getRequiredEnv(
      "JWT_REFRESH_SECRET",
    ),

  /**
   * Expiration Access Token.
   *
   * Exemple :
   *
   * 15m
   * 30m
   * 1h
   */
  accessExpiresIn:
    process.env.JWT_ACCESS_EXPIRES_IN ??
    process.env.JWT_EXPIRES_IN ??
    "15m",

  /**
   * Expiration Refresh Token.
   *
   * Exemple :
   *
   * 7d
   * 30d
   */
  refreshExpiresIn:
    process.env.JWT_REFRESH_EXPIRES_IN ??
    "30d",

  /**
   * Issuer.
   */
  issuer:
    process.env.JWT_ISSUER ??
    "BibSaaS",

  /**
   * Audience.
   */
  audience:
    process.env.JWT_AUDIENCE ??
    "BibSaaS-API",

  /**
   * Algorithme.
   */
  algorithm:
    "HS256" as const,

  /**
   * Taille minimale recommandée des secrets.
   */
  minimumSecretLength: 32,

  /**
   * Rotation recommandée des refresh tokens.
   */
  refreshTokenRotation:
    process.env.JWT_REFRESH_ROTATION !==
    "false",
} as const;

/**
 * ============================================================
 * SECURITY VALIDATION
 * ============================================================
 */

function validateSecret(
  secret: string,
  name: string,
): void {
  if (
    secret.length <
    JWT_CONFIG.minimumSecretLength
  ) {
    throw new Error(
      `[JWT] ${name} must contain at least ${JWT_CONFIG.minimumSecretLength} characters`,
    );
  }

  /**
   * Évite les secrets trop évidents.
   */
  const weakSecrets = [
    "secret",
    "password",
    "jwt-secret",
    "changeme",
    "123456",
    "bibsaas",
  ];

  if (
    weakSecrets.some(
      (weak) =>
        secret.toLowerCase() ===
        weak,
    )
  ) {
    throw new Error(
      `[JWT] ${name} is too weak`,
    );
  }
}

validateSecret(
  JWT_CONFIG.accessSecret,
  "JWT_ACCESS_SECRET",
);

validateSecret(
  JWT_CONFIG.refreshSecret,
  "JWT_REFRESH_SECRET",
);

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type UserRole =
  | "CLIENT"
  | "BARBER"
  | "SALON"
  | "SALON_CHAIN"
  | "ADMIN"
  | "SUPER_ADMIN";

export interface JwtUserPayload {
  /**
   * Identifiant utilisateur.
   */
  sub: string;

  /**
   * Identifiant utilisateur compatibilité legacy.
   */
  userId: string;

  /**
   * Email.
   */
  email?: string;

  /**
   * Rôle.
   */
  role: UserRole;

  /**
   * Tenant / organisation.
   */
  tenantId?: string;

  /**
   * Salon actif.
   */
  salonId?: string;

  /**
   * Identifiant de session.
   */
  sessionId?: string;

  /**
   * Type du token.
   */
  tokenType:
    | "access"
    | "refresh";

  /**
   * Timestamp d'émission.
   */
  iat?: number;

  /**
   * Timestamp d'expiration.
   */
  exp?: number;

  /**
   * Issuer.
   */
  iss?: string;

  /**
   * Audience.
   */
  aud?: string;
}

/**
 * ============================================================
 * TOKEN TYPES
 * ============================================================
 */

export type AccessTokenPayload =
  Omit<
    JwtUserPayload,
    "tokenType"
  > & {
    tokenType: "access";
  };

export type RefreshTokenPayload =
  Omit<
    JwtUserPayload,
    "tokenType"
  > & {
    tokenType: "refresh";
  };

export type JwtPayload =
  | AccessTokenPayload
  | RefreshTokenPayload;

/**
 * ============================================================
 * SIGN OPTIONS
 * ============================================================
 */

const ACCESS_SIGN_OPTIONS: SignOptions =
  {
    algorithm:
      JWT_CONFIG.algorithm,

    expiresIn:
      JWT_CONFIG.accessExpiresIn as SignOptions["expiresIn"],

    issuer:
      JWT_CONFIG.issuer,

    audience:
      JWT_CONFIG.audience,
  };

const REFRESH_SIGN_OPTIONS: SignOptions =
  {
    algorithm:
      JWT_CONFIG.algorithm,

    expiresIn:
      JWT_CONFIG.refreshExpiresIn as SignOptions["expiresIn"],

    issuer:
      JWT_CONFIG.issuer,

    audience:
      JWT_CONFIG.audience,
  };

/**
 * ============================================================
 * GENERATE ACCESS TOKEN
 * ============================================================
 */

export function generateAccessToken(
  payload: Omit<
    AccessTokenPayload,
    "iat" | "exp" | "iss" | "aud"
  >,
): string {
  return jwt.sign(
    payload,
    JWT_CONFIG.accessSecret,
    ACCESS_SIGN_OPTIONS,
  );
}

/**
 * ============================================================
 * GENERATE REFRESH TOKEN
 * ============================================================
 */

export function generateRefreshToken(
  payload: Omit<
    RefreshTokenPayload,
    "iat" | "exp" | "iss" | "aud"
  >,
): string {
  return jwt.sign(
    payload,
    JWT_CONFIG.refreshSecret,
    REFRESH_SIGN_OPTIONS,
  );
}

/**
 * ============================================================
 * GENERATE TOKEN PAIR
 * ============================================================
 */

export function generateTokenPair(
  user: {
    id: string;

    email?: string;

    role: UserRole;

    tenantId?: string;

    salonId?: string;

    sessionId?: string;
  },
): {
  accessToken: string;

  refreshToken: string;
} {
  const basePayload = {
    sub: user.id,
    userId: user.id,

    email: user.email,

    role: user.role,

    tenantId:
      user.tenantId,

    salonId:
      user.salonId,

    sessionId:
      user.sessionId,
  };

  const accessToken =
    generateAccessToken({
      ...basePayload,

      tokenType:
        "access",
    });

  const refreshToken =
    generateRefreshToken({
      ...basePayload,

      tokenType:
        "refresh",
    });

  return {
    accessToken,

    refreshToken,
  };
}

/**
 * ============================================================
 * VERIFY ACCESS TOKEN
 * ============================================================
 */

export function verifyAccessToken(
  token: string,
): AccessTokenPayload {
  const decoded =
    jwt.verify(
      token,
      JWT_CONFIG.accessSecret,
      {
        algorithms: [
          JWT_CONFIG.algorithm,
        ],

        issuer:
          JWT_CONFIG.issuer,

        audience:
          JWT_CONFIG.audience,
      },
    );

  if (
    typeof decoded ===
    "string"
  ) {
    throw new Error(
      "Invalid JWT payload",
    );
  }

  const payload =
    decoded as JsonWebTokenPayload &
      Partial<AccessTokenPayload>;

  if (
    payload.tokenType !==
    "access"
  ) {
    throw new Error(
      "Invalid token type",
    );
  }

  if (
    !payload.sub ||
    !payload.userId ||
    !payload.role
  ) {
    throw new Error(
      "Invalid access token payload",
    );
  }

  return {
    ...payload,
    userId: payload.userId ?? payload.sub,
  } as AccessTokenPayload;
}

/**
 * ============================================================
 * VERIFY REFRESH TOKEN
 * ============================================================
 */

export function verifyRefreshToken(
  token: string,
): RefreshTokenPayload {
  const decoded =
    jwt.verify(
      token,
      JWT_CONFIG.refreshSecret,
      {
        algorithms: [
          JWT_CONFIG.algorithm,
        ],

        issuer:
          JWT_CONFIG.issuer,

        audience:
          JWT_CONFIG.audience,
      },
    );

  if (
    typeof decoded ===
    "string"
  ) {
    throw new Error(
      "Invalid JWT payload",
    );
  }

  const payload =
    decoded as JsonWebTokenPayload &
      Partial<RefreshTokenPayload>;

  if (
    payload.tokenType !==
    "refresh"
  ) {
    throw new Error(
      "Invalid refresh token type",
    );
  }

  if (
    !payload.sub ||
    !payload.userId ||
    !payload.role
  ) {
    throw new Error(
      "Invalid refresh token payload",
    );
  }

  return {
    ...payload,
    userId: payload.userId ?? payload.sub,
  } as RefreshTokenPayload;
}

/**
 * ============================================================
 * DECODE TOKEN
 * ============================================================
 *
 * ATTENTION :
 *
 * decode() ne vérifie PAS la signature.
 *
 * Cette fonction sert uniquement à lire le contenu
 * d'un token avant traitement.
 *
 * Ne jamais utiliser decode() seul pour authentifier
 * un utilisateur.
 * ============================================================
 */

export function decodeToken(
  token: string,
): JsonWebTokenPayload | null {
  const decoded =
    jwt.decode(token);

  if (
    !decoded ||
    typeof decoded ===
      "string"
  ) {
    return null;
  }

  return decoded as JsonWebTokenPayload;
}

/**
 * ============================================================
 * GET TOKEN EXPIRATION
 * ============================================================
 */

export function getTokenExpiration(
  token: string,
): Date | null {
  const decoded =
    decodeToken(token);

  if (
    !decoded?.exp
  ) {
    return null;
  }

  return new Date(
    decoded.exp * 1000,
  );
}

/**
 * ============================================================
 * IS TOKEN EXPIRED
 * ============================================================
 */

export function isTokenExpired(
  token: string,
): boolean {
  const expiration =
    getTokenExpiration(
      token,
    );

  if (!expiration) {
    return true;
  }

  return (
    expiration.getTime() <=
    Date.now()
  );
}

/**
 * ============================================================
 * GET TOKEN REMAINING TIME
 * ============================================================
 */

export function getTokenRemainingSeconds(
  token: string,
): number {
  const expiration =
    getTokenExpiration(
      token,
    );

  if (!expiration) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (expiration.getTime() -
        Date.now()) /
        1000,
    ),
  );
}

/**
 * ============================================================
 * EXTRACT BEARER TOKEN
 * ============================================================
 */

export function extractBearerToken(
  authorization?: string,
): string | null {
  if (
    !authorization
  ) {
    return null;
  }

  const [
    scheme,
    token,
  ] =
    authorization
      .trim()
      .split(/\s+/);

  if (
    scheme?.toLowerCase() !==
      "bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

/**
 * ============================================================
 * CREATE TOKEN COOKIE OPTIONS
 * ============================================================
 */

export function getRefreshCookieOptions() {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,

    secure: isProduction,

    sameSite:
      "lax" as const,

    path:
      process.env.JWT_COOKIE_PATH ??
      "/api/auth",

    maxAge:
      parseExpirationToMs(
        JWT_CONFIG.refreshExpiresIn,
      ),
  };
}

/**
 * ============================================================
 * PARSE JWT EXPIRATION
 * ============================================================
 *
 * Convertit :
 *
 * 15m → millisecondes
 * 1h  → millisecondes
 * 7d  → millisecondes
 *
 * ============================================================
 */

export function parseExpirationToMs(
  value: string,
): number {
  const match =
    value
      .trim()
      .match(
        /^(\d+(?:\.\d+)?)(s|m|h|d|w)$/,
      );

  if (!match) {
    throw new Error(
      `[JWT] Invalid expiration format: ${value}`,
    );
  }

  const amount =
    Number(match[1]);

  const unit =
    match[2];

  const multipliers = {
    s: 1000,

    m: 60 * 1000,

    h: 60 * 60 * 1000,

    d: 24 * 60 * 60 * 1000,

    w: 7 * 24 * 60 * 60 * 1000,
  };

  return (
    amount *
    multipliers[
      unit as keyof typeof multipliers
    ]
  );
}

/**
 * ============================================================
 * JWT HEALTH CHECK
 * ============================================================
 */

export function validateJwtConfiguration(): {
  valid: boolean;

  issuer: string;

  audience: string;

  algorithm: string;

  accessExpiresIn: string;

  refreshExpiresIn: string;
} {
  return {
    valid: true,

    issuer:
      JWT_CONFIG.issuer,

    audience:
      JWT_CONFIG.audience,

    algorithm:
      JWT_CONFIG.algorithm,

    accessExpiresIn:
      JWT_CONFIG.accessExpiresIn,

    refreshExpiresIn:
      JWT_CONFIG.refreshExpiresIn,
  };
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {
  config:
    JWT_CONFIG,

  generateAccessToken,

  generateRefreshToken,

  generateTokenPair,

  verifyAccessToken,

  verifyRefreshToken,

  decodeToken,

  getTokenExpiration,

  isTokenExpired,

  getTokenRemainingSeconds,

  extractBearerToken,

  getRefreshCookieOptions,

  parseExpirationToMs,

  validateJwtConfiguration,
};
