
/**
 * ============================================================
 * BibSaaS — Authentication Types
 * ============================================================
 *
 * Centralisation de tous les types liés à :
 * - Authentification
 * - JWT Access / Refresh
 * - Sessions
 * - Login / Register
 * - Password reset
 * - Email / Phone verification
 * - MFA
 * - OAuth
 * - Roles & permissions
 * - Authorization
 * - Tenant context
 * - Security / audit
 *
 * Architecture :
 * - common.types.ts → types génériques
 * - auth.types.ts   → types d'authentification
 * - express.d.ts   → extension Express.Request
 *
 * ============================================================
 */

import type {
  UserRole,
  Permission,
  ID,
  ISODateString,
  TokenPair,
  TenantContext,
} from "./common.types";

/* ============================================================
 * AUTH PROVIDERS
 * ============================================================
 */

export type AuthProvider =
  | "LOCAL"
  | "GOOGLE"
  | "APPLE"
  | "FACEBOOK"
  | "MICROSOFT";

export type TokenType =
  | "ACCESS"
  | "REFRESH"
  | "EMAIL_VERIFICATION"
  | "PASSWORD_RESET"
  | "MFA";

/* ============================================================
 * JWT PAYLOADS
 * ============================================================
 */

/**
 * Payload du Access Token JWT.
 */
export interface AccessTokenPayload {
  /**
   * Standard JWT subject.
   */
  sub: ID;

  /**
   * Identifiant utilisateur.
   */
  userId: ID;

  email: string;

  role: UserRole;

  /**
   * Plusieurs rôles si le système RBAC le permet.
   */
  roles?: UserRole[];

  /**
   * Permissions calculées pour l'utilisateur.
   */
  permissions?: Permission[];

  /**
   * Contexte multi-tenant.
   */
  tenantId?: ID | null;

  /**
   * Salon actuellement sélectionné.
   */
  salonId?: ID | null;

  /**
   * Profil barber associé.
   */
  barberId?: ID | null;

  /**
   * Session d'authentification.
   */
  sessionId?: ID;

  /**
   * Type du token.
   */
  tokenType: "ACCESS";

  /**
   * JWT ID.
   */
  jti?: string;

  /**
   * Issued at.
   */
  iat?: number;

  /**
   * Expiration.
   */
  exp?: number;
}

/**
 * Payload du Refresh Token JWT.
 */
export interface RefreshTokenPayload {
  sub: ID;

  userId: ID;

  sessionId: ID;

  tokenType: "REFRESH";

  jti?: string;

  iat?: number;

  exp?: number;
}

/**
 * Union de tous les JWT applicatifs.
 */
export type JwtPayload =
  | AccessTokenPayload
  | RefreshTokenPayload;

/* ============================================================
 * AUTH USER
 * ============================================================
 */

/**
 * Utilisateur authentifié exposé à l'application.
 *
 * IMPORTANT :
 * L'identifiant canonique est `id`.
 *
 * Ne pas ajouter `userId` ici :
 * `userId` appartient principalement au contexte JWT.
 */
export interface AuthUser {
  id: ID;

  email: string;

  firstName?: string | null;

  lastName?: string | null;

  fullName?: string;

  phoneNumber?: string | null;

  avatarUrl?: string | null;

  role: UserRole;

  roles?: UserRole[];

  permissions?: Permission[];

  provider?: AuthProvider;

  emailVerified: boolean;

  phoneVerified?: boolean;

  isActive: boolean;

  isBlocked?: boolean;

  tenantId?: ID | null;

  salonId?: ID | null;

  barberId?: ID | null;

  lastLoginAt?: ISODateString | null;

  createdAt?: ISODateString;

  updatedAt?: ISODateString;
}

/* ============================================================
 * AUTH SESSION
 * ============================================================
 */

/**
 * Session persistée en base de données.
 *
 * Une session peut représenter :
 * - navigateur
 * - smartphone
 * - tablette
 * - application mobile
 * - autre device
 */
export interface AuthSession {
  id: ID;

  userId: ID;

  deviceId?: string | null;

  deviceName?: string | null;

  userAgent?: string | null;

  ipAddress?: string | null;

  country?: string | null;

  city?: string | null;

  /**
   * Hash du refresh token.
   *
   * Le refresh token brut ne doit jamais être stocké.
   */
  refreshTokenHash?: string;

  expiresAt: ISODateString;

  createdAt: ISODateString;

  lastActivityAt?: ISODateString;

  revokedAt?: ISODateString | null;

  isRevoked: boolean;
}

/* ============================================================
 * REGISTER
 * ============================================================
 */

export interface RegisterInput {
  email: string;

  password: string;

  firstName?: string;

  lastName?: string;

  phoneNumber?: string;

  role?: UserRole;

  provider?: AuthProvider;

  acceptTerms: boolean;

  acceptPrivacyPolicy?: boolean;

  referralCode?: string;

  tenantId?: ID;

  salonId?: ID;
}

export interface RegisterResult {
  user: AuthUser;

  tokens?: TokenPair;

  requiresEmailVerification?: boolean;

  requiresPhoneVerification?: boolean;

  message?: string;
}

/* ============================================================
 * LOGIN
 * ============================================================
 */

export interface LoginInput {
  email: string;

  password?: string;

  rememberMe?: boolean;

  deviceId?: string;

  deviceName?: string;

  userAgent?: string;

  ipAddress?: string;

  mfaCode?: string;

  provider?: AuthProvider;
}

export interface LoginResult {
  user: AuthUser;

  tokens: TokenPair;

  session?: AuthSession;

  requiresMfa?: boolean;

  requiresEmailVerification?: boolean;

  requiresPhoneVerification?: boolean;

  message?: string;
}

/* ============================================================
 * SESSION CREATION
 * ============================================================
 */

export interface CreateSessionInput {
  userId: ID;

  refreshTokenHash?: string;

  deviceId?: string;

  deviceName?: string;

  userAgent?: string;

  ipAddress?: string;

  country?: string;

  city?: string;

  expiresAt: ISODateString;
}

/* ============================================================
 * REFRESH TOKEN
 * ============================================================
 */

export interface RefreshTokenInput {
  refreshToken: string;

  deviceId?: string;
}

export interface RefreshTokenResult {
  tokens: TokenPair;

  session?: AuthSession;

  user?: AuthUser;
}

/* ============================================================
 * LOGOUT
 * ============================================================
 */

export interface LogoutInput {
  refreshToken?: string;

  sessionId?: ID;

  allDevices?: boolean;
}

export interface LogoutResult {
  success: boolean;

  revokedSessions?: number;

  message?: string;
}

/* ============================================================
 * PASSWORD
 * ============================================================
 */

export interface ChangePasswordInput {
  userId: ID;

  currentPassword: string;

  newPassword: string;

  revokeOtherSessions?: boolean;
}

export interface ResetPasswordRequestInput {
  email: string;
}

export interface ResetPasswordConfirmInput {
  token: string;

  newPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;

  message?: string;
}

/* ============================================================
 * EMAIL VERIFICATION
 * ============================================================
 */

export interface VerifyEmailInput {
  token: string;
}

export interface ResendEmailVerificationInput {
  email: string;
}

export interface EmailVerificationResult {
  success: boolean;

  verified?: boolean;

  message?: string;
}

/* ============================================================
 * PHONE VERIFICATION
 * ============================================================
 */

export interface VerifyPhoneInput {
  userId: ID;

  code: string;
}

export interface SendPhoneVerificationInput {
  userId: ID;

  phoneNumber?: string;
}

export interface PhoneVerificationResult {
  success: boolean;

  verified?: boolean;

  message?: string;
}

/* ============================================================
 * MFA
 * ============================================================
 */

export type MfaMethod =
  | "TOTP"
  | "SMS"
  | "EMAIL"
  | "BACKUP_CODE";

export interface EnableMfaInput {
  userId: ID;

  method: MfaMethod;
}

export interface VerifyMfaInput {
  userId: ID;

  code: string;

  method?: MfaMethod;
}

export interface DisableMfaInput {
  userId: ID;

  password: string;

  code?: string;
}

export interface MfaSetupResult {
  enabled: boolean;

  method: MfaMethod;

  secret?: string;

  otpauthUrl?: string;

  qrCodeUrl?: string;

  backupCodes?: string[];
}

export interface MfaVerificationResult {
  success: boolean;

  verified: boolean;

  method?: MfaMethod;

  message?: string;
}

/* ============================================================
 * BACKUP CODES
 * ============================================================
 */

export interface BackupCode {
  id: ID;

  userId: ID;

  codeHash: string;

  used: boolean;

  usedAt?: ISODateString | null;

  createdAt: ISODateString;
}

export interface GenerateBackupCodesResult {
  codes: string[];

  generatedAt: ISODateString;
}

export interface UseBackupCodeInput {
  userId: ID;

  code: string;
}

/* ============================================================
 * ROLES
 * ============================================================
 */

export interface RoleDefinition {
  role: UserRole;

  name: string;

  description?: string;

  permissions: Permission[];

  isSystemRole?: boolean;

  isAssignable?: boolean;
}

/* ============================================================
 * AUTHORIZATION
 * ============================================================
 */

export interface AuthorizationContext {
  userId: ID;

  role: UserRole;

  roles?: UserRole[];

  permissions?: Permission[];

  tenantId?: ID | null;

  salonId?: ID | null;

  barberId?: ID | null;

  resourceOwnerId?: ID | null;

  resourceTenantId?: ID | null;

  resourceSalonId?: ID | null;
}

export interface PermissionCheck {
  permission: Permission;

  context: AuthorizationContext;
}

export interface RoleCheck {
  role: UserRole;

  context: AuthorizationContext;
}

export interface AuthorizationResult {
  allowed: boolean;

  reason?: string;

  missingPermissions?: Permission[];

  missingRoles?: UserRole[];
}

/* ============================================================
 * TENANT AUTHORIZATION
 * ============================================================
 */

export interface TenantAuthContext extends TenantContext {
  userId: ID;

  role: UserRole;

  roles?: UserRole[];

  permissions?: Permission[];
}

/* ============================================================
 * OAUTH
 * ============================================================
 */

export interface OAuthProfile {
  provider: AuthProvider;

  providerId: string;

  email?: string;

  firstName?: string;

  lastName?: string;

  avatarUrl?: string;

  accessToken?: string;

  refreshToken?: string;

  expiresAt?: number;
}

export interface OAuthLoginInput {
  provider: AuthProvider;

  accessToken?: string;

  authorizationCode?: string;

  redirectUri?: string;

  deviceId?: string;

  deviceName?: string;
}

export interface OAuthLoginResult {
  user: AuthUser;

  tokens: TokenPair;

  isNewUser?: boolean;

  provider: AuthProvider;
}

/* ============================================================
 * AUTH AUDIT
 * ============================================================
 */

export type AuthAuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "LOGOUT_ALL"
  | "REGISTER"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "EMAIL_VERIFIED"
  | "PHONE_VERIFIED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "MFA_FAILED"
  | "TOKEN_REFRESHED"
  | "TOKEN_REVOKED"
  | "SESSION_CREATED"
  | "SESSION_REVOKED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "OAUTH_LOGIN";

export interface AuthAuditEvent {
  action: AuthAuditAction;

  userId?: ID;

  sessionId?: ID;

  email?: string;

  ipAddress?: string;

  userAgent?: string;

  deviceId?: string;

  provider?: AuthProvider;

  success: boolean;

  reason?: string;

  metadata?: Record<string, unknown>;

  createdAt?: ISODateString;
}

/* ============================================================
 * SECURITY
 * ============================================================
 */

export interface SecurityState {
  userId: ID;

  failedLoginAttempts: number;

  lastFailedLoginAt?: ISODateString | null;

  lockedUntil?: ISODateString | null;

  passwordChangedAt?: ISODateString | null;

  lastLoginAt?: ISODateString | null;

  lastLoginIp?: string | null;

  mfaEnabled: boolean;

  emailVerified: boolean;

  phoneVerified: boolean;
}

export interface LoginRateLimitState {
  key: string;

  attempts: number;

  maxAttempts: number;

  windowSeconds: number;

  blockedUntil?: ISODateString | null;
}

export interface AuthSecurityEvent {
  userId?: ID;

  type:
    | "BRUTE_FORCE"
    | "SUSPICIOUS_LOGIN"
    | "TOKEN_REUSE"
    | "INVALID_TOKEN"
    | "ACCOUNT_LOCKED"
    | "MFA_ATTACK"
    | "SESSION_ANOMALY";

  ipAddress?: string;

  userAgent?: string;

  metadata?: Record<string, unknown>;

  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  createdAt?: ISODateString;
}

/* ============================================================
 * AUTH ERRORS
 * ============================================================
 */

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_BLOCKED"
  | "ACCOUNT_LOCKED"
  | "EMAIL_NOT_VERIFIED"
  | "PHONE_NOT_VERIFIED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED"
  | "INVALID_REFRESH_TOKEN"
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "PASSWORD_TOO_WEAK"
  | "PASSWORD_MISMATCH"
  | "MFA_REQUIRED"
  | "INVALID_MFA_CODE"
  | "MFA_NOT_ENABLED"
  | "INSUFFICIENT_PERMISSIONS"
  | "INSUFFICIENT_ROLE"
  | "RATE_LIMITED"
  | "OAUTH_ERROR"
  | "VALIDATION_ERROR";

export interface AuthErrorDetails {
  code: AuthErrorCode;

  message: string;

  field?: string;

  statusCode?: number;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * AUTH CONTEXT
 * ============================================================
 */

/**
 * Contexte complet de l'utilisateur authentifié.
 */
export interface AuthContext {
  user: AuthUser;

  token?: AccessTokenPayload;

  session?: AuthSession;

  tenant?: TenantAuthContext;

  isAuthenticated: boolean;
}

/* ============================================================
 * SERVICE RESULTS
 * ============================================================
 */

export interface AuthServiceResult<T> {
  success: boolean;

  data?: T;

  message?: string;

  error?: AuthErrorDetails;
}

/* ============================================================
 * PASSWORD POLICY
 * ============================================================
 */

export interface PasswordPolicy {
  minLength: number;

  maxLength: number;

  requireUppercase: boolean;

  requireLowercase: boolean;

  requireNumber: boolean;

  requireSpecialCharacter: boolean;

  preventCommonPasswords: boolean;

  preventPasswordReuse?: boolean;

  passwordHistorySize?: number;
}

/* ============================================================
 * AUTH VALIDATION
 * ============================================================
 */

export interface PasswordValidationResult {
  valid: boolean;

  score: number;

  errors: string[];

  warnings?: string[];
}

export interface EmailValidationResult {
  valid: boolean;

  normalizedEmail?: string;

  reason?: string;
}

export interface PhoneValidationResult {
  valid: boolean;

  normalizedPhone?: string;

  countryCode?: string;

  reason?: string;
}

/* ============================================================
 * AUTH SETTINGS
 * ============================================================
 */

export interface AuthSettings {
  accessTokenExpiresIn: string;

  refreshTokenExpiresIn: string;

  sessionMaxAgeDays: number;

  maxSessionsPerUser: number;

  enableEmailVerification: boolean;

  enablePhoneVerification: boolean;

  enableMfa: boolean;

  enableOAuth: boolean;

  passwordPolicy: PasswordPolicy;

  maxLoginAttempts: number;

  lockoutDurationMinutes: number;

  refreshTokenRotation: boolean;

  revokeSessionsOnPasswordChange: boolean;
}

/* ============================================================
 * TYPE GUARDS
 * ============================================================
 */

/**
 * Vérifie si un JWT est un Access Token.
 */
export function isAccessTokenPayload(
  payload: JwtPayload,
): payload is AccessTokenPayload {
  return payload.tokenType === "ACCESS";
}

/**
 * Vérifie si un JWT est un Refresh Token.
 */
export function isRefreshTokenPayload(
  payload: JwtPayload,
): payload is RefreshTokenPayload {
  return payload.tokenType === "REFRESH";
}

/**
 * Vérifie si un rôle est un rôle administrateur.
 */
export function isAdminRole(role: UserRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
}

/**
 * Vérifie si un rôle correspond au personnel.
 */
export function isStaffRole(role: UserRole): boolean {
  return (
    role === "BARBER" ||
    role === "SALON" ||
    role === "SALON_MANAGER" ||
    role === "RECEPTIONIST" ||
    role === "STAFF"
  );
}

/**
 * Vérifie si l'utilisateur possède une permission.
 */
export function hasPermission(
  user: Pick<AuthUser, "permissions">,
  permission: Permission,
): boolean {
  return Boolean(
    user.permissions?.includes(permission),
  );
}

/**
 * Vérifie si l'utilisateur possède au moins un rôle demandé.
 */
export function hasRole(
  user: Pick<AuthUser, "role" | "roles">,
  role: UserRole,
): boolean {
  if (user.role === role) {
    return true;
  }

  return Boolean(
    user.roles?.includes(role),
  );
}

/**
 * Vérifie une autorisation complète.
 */
export function canAccess(
  context: AuthorizationContext,
  options: {
    roles?: UserRole[];

    permissions?: Permission[];

    requireAllPermissions?: boolean;
  },
): boolean {
  const {
    roles = [],
    permissions = [],
    requireAllPermissions = true,
  } = options;

  /**
   * Vérification des rôles.
   */
  if (roles.length > 0) {
    const hasRequiredRole =
      roles.includes(context.role) ||
      Boolean(
        context.roles?.some((role) =>
          roles.includes(role),
        ),
      );

    if (!hasRequiredRole) {
      return false;
    }
  }

  /**
   * Vérification des permissions.
   */
  if (permissions.length > 0) {
    const userPermissions =
      context.permissions ?? [];

    if (requireAllPermissions) {
      return permissions.every((permission) =>
        userPermissions.includes(permission),
      );
    }

    return permissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }

  return true;
}

/* ============================================================
 * DEFAULT EXPORT
 * ============================================================
 *
 * Le fichier est principalement utilisé avec des imports
 * nommés. Le default export vide permet toutefois de conserver
 * une compatibilité avec certains imports existants.
 * ============================================================
 */

export default {};

