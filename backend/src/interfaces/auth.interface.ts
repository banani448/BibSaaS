
/**
 * ============================================================
 * BibSaaS — Authentication Interfaces
 * ============================================================
 *
 * File:
 * interfaces/auth.interface.ts
 *
 * Description:
 * Contrats TypeScript centralisés pour :
 * - Register
 * - Login
 * - Logout
 * - Refresh token
 * - JWT
 * - Sessions
 * - Password reset
 * - Email verification
 * - MFA
 * - OAuth
 * - Permissions
 * - Authenticated requests
 * - API responses
 *
 * Compatible avec :
 * - Node.js
 * - Express
 * - JWT
 * - Prisma
 * - PostgreSQL
 * - Supabase
 * ============================================================
 */

/**
 * ============================================================
 * ENUMS / UNION TYPES
 * ============================================================
 */

/**
 * Rôles principaux BibSaaS.
 *
 * Les valeurs doivent rester synchronisées
 * avec ton Prisma schema.
 */
export type AuthRole =
  | "CLIENT"
  | "BARBER"
  | "SALON"
  | "SALON_MANAGER"
  | "SALON_CHAIN"
  | "ADMIN"
  | "SUPER_ADMIN";

/**
 * État du compte utilisateur.
 */
export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "SUSPENDED"
  | "BANNED"
  | "DELETED";

/**
 * Type de token.
 */
export type TokenType =
  | "ACCESS"
  | "REFRESH"
  | "RESET_PASSWORD"
  | "EMAIL_VERIFICATION"
  | "MFA";

/**
 * Provider OAuth.
 */
export type OAuthProvider =
  | "GOOGLE"
  | "APPLE"
  | "FACEBOOK"
  | "GITHUB";

/**
 * Type de connexion.
 */
export type LoginMethod =
  | "PASSWORD"
  | "GOOGLE"
  | "APPLE"
  | "FACEBOOK"
  | "GITHUB"
  | "OTP";

/**
 * Permission système.
 */
export type Permission =
  | "USER_READ"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"

  | "BOOKING_READ"
  | "BOOKING_CREATE"
  | "BOOKING_UPDATE"
  | "BOOKING_CANCEL"

  | "PAYMENT_READ"
  | "PAYMENT_CREATE"
  | "PAYMENT_REFUND"

  | "SUBSCRIPTION_READ"
  | "SUBSCRIPTION_CREATE"
  | "SUBSCRIPTION_UPDATE"
  | "SUBSCRIPTION_CANCEL"

  | "SALON_READ"
  | "SALON_CREATE"
  | "SALON_UPDATE"
  | "SALON_DELETE"

  | "BARBER_READ"
  | "BARBER_CREATE"
  | "BARBER_UPDATE"
  | "BARBER_DELETE"

  | "FACE_ANALYSIS"
  | "HAIRSTYLE_READ"
  | "RECOMMENDATION_READ"

  | "NOTIFICATION_READ"
  | "NOTIFICATION_SEND"

  | "AUDIT_READ"

  | "ADMIN_READ"
  | "ADMIN_WRITE";

/**
 * ============================================================
 * USER
 * ============================================================
 */

export interface AuthUser {
  id: string;

  email: string;

  phone?: string | null;

  firstName?: string | null;

  lastName?: string | null;

  avatarUrl?: string | null;

  role: AuthRole;

  status: AccountStatus;

  emailVerified: boolean;

  phoneVerified?: boolean;

  mfaEnabled?: boolean;

  permissions?: Permission[];

  createdAt?: Date | string;

  updatedAt?: Date | string;

  lastLoginAt?: Date | string | null;
}

/**
 * Version minimale de l'utilisateur
 * utilisée dans les tokens.
 */
export interface AuthUserPayload {
  id: string;

  email: string;

  role: AuthRole;

  status?: AccountStatus;
}

/**
 * ============================================================
 * REGISTER
 * ============================================================
 */

export interface RegisterRequest {
  email: string;

  password: string;

  firstName: string;

  lastName: string;

  phone?: string;

  role?: AuthRole;

  acceptTerms: boolean;

  acceptPrivacyPolicy?: boolean;

  referralCode?: string;
}

/**
 * Données nettoyées après validation.
 */
export interface RegisterPayload {
  email: string;

  password: string;

  firstName: string;

  lastName: string;

  phone?: string;

  role: AuthRole;

  acceptTerms: true;

  acceptPrivacyPolicy?: boolean;

  referralCode?: string;
}

/**
 * ============================================================
 * LOGIN
 * ============================================================
 */

export interface LoginRequest {
  email?: string;

  phone?: string;

  password?: string;

  otp?: string;

  method?: LoginMethod;

  rememberMe?: boolean;
}

export interface LoginPayload {
  identifier: string;

  password?: string;

  otp?: string;

  method: LoginMethod;

  rememberMe: boolean;
}

/**
 * ============================================================
 * JWT
 * ============================================================
 */

export interface JwtAccessTokenPayload {
  sub: string;

  id: string;

  email: string;

  role: AuthRole;

  status: AccountStatus;

  permissions?: Permission[];

  type: "ACCESS";

  iat?: number;

  exp?: number;

  iss?: string;

  aud?: string;
}

export interface JwtRefreshTokenPayload {
  sub: string;

  id: string;

  tokenId: string;

  type: "REFRESH";

  iat?: number;

  exp?: number;

  iss?: string;

  aud?: string;
}

/**
 * Payload générique.
 */
export interface JwtPayloadBase {
  sub: string;

  type: TokenType;

  iat?: number;

  exp?: number;

  iss?: string;

  aud?: string;
}

/**
 * ============================================================
 * TOKENS
 * ============================================================
 */

export interface AuthTokens {
  accessToken: string;

  refreshToken: string;

  tokenType: "Bearer";

  expiresIn: number;

  refreshExpiresIn?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;

  refreshToken?: string;

  tokenType: "Bearer";

  expiresIn: number;
}

/**
 * ============================================================
 * SESSION
 * ============================================================
 */

export interface AuthSession {
  id: string;

  userId: string;

  refreshTokenId?: string;

  deviceId?: string | null;

  deviceName?: string | null;

  userAgent?: string | null;

  ipAddress?: string | null;

  country?: string | null;

  city?: string | null;

  createdAt: Date | string;

  lastActivityAt?: Date | string;

  expiresAt: Date | string;

  revokedAt?: Date | string | null;

  isActive: boolean;
}

/**
 * ============================================================
 * LOGIN RESULT
 * ============================================================
 */

export interface LoginResult {
  user: AuthUser;

  tokens: AuthTokens;

  session?: AuthSession;

  requiresMfa?: boolean;

  requiresEmailVerification?: boolean;
}

/**
 * ============================================================
 * LOGOUT
 * ============================================================
 */

export interface LogoutRequest {
  refreshToken?: string;

  sessionId?: string;

  allSessions?: boolean;
}

export interface LogoutResult {
  success: boolean;

  sessionsRevoked: number;
}

/**
 * ============================================================
 * PASSWORD
 * ============================================================
 */

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResult {
  success: boolean;

  message: string;
}

export interface ResetPasswordRequest {
  token: string;

  password: string;

  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;

  newPassword: string;

  confirmPassword: string;

  revokeOtherSessions?: boolean;
}

/**
 * ============================================================
 * EMAIL VERIFICATION
 * ============================================================
 */

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

/**
 * ============================================================
 * PHONE VERIFICATION
 * ============================================================
 */

export interface VerifyPhoneRequest {
  phone: string;

  otp: string;
}

export interface SendPhoneOtpRequest {
  phone: string;
}

/**
 * ============================================================
 * MFA / 2FA
 * ============================================================
 */

export type MfaMethod =
  | "TOTP"
  | "SMS"
  | "EMAIL";

export interface MfaSetupRequest {
  method: MfaMethod;
}

export interface MfaSetupResult {
  enabled: boolean;

  method: MfaMethod;

  secret?: string;

  qrCodeUrl?: string;

  backupCodes?: string[];
}

export interface MfaVerifyRequest {
  code: string;

  method?: MfaMethod;
}

export interface MfaDisableRequest {
  password: string;

  code?: string;
}

/**
 * ============================================================
 * OAUTH
 * ============================================================
 */

export interface OAuthLoginRequest {
  provider: OAuthProvider;

  accessToken?: string;

  authorizationCode?: string;

  redirectUri?: string;
}

export interface OAuthProfile {
  provider: OAuthProvider;

  providerId: string;

  email?: string;

  firstName?: string;

  lastName?: string;

  avatarUrl?: string | null;

  emailVerified?: boolean;
}

/**
 * ============================================================
 * AUTHORIZATION
 * ============================================================
 */

export interface AuthorizationContext {
  userId: string;

  role: AuthRole;

  permissions: Permission[];

  resourceOwnerId?: string;

  resourceType?: string;
}

export interface RolePermissions {
  role: AuthRole;

  permissions: Permission[];
}

/**
 * ============================================================
 * EXPRESS AUTHENTICATED REQUEST
 * ============================================================
 */

export interface AuthenticatedRequest {
  user?: AuthUser;

  auth?: {
    userId: string;

    role: AuthRole;

    permissions: Permission[];

    tokenType: "ACCESS";

    sessionId?: string;
  };
}

/**
 * ============================================================
 * API RESPONSE
 * ============================================================
 */

export interface AuthApiResponse<T = unknown> {
  success: boolean;

  message: string;

  data?: T;

  error?: {
    code: string;

    details?: unknown;
  };

  requestId?: string;

  timestamp?: string;
}

/**
 * ============================================================
 * AUTH RESPONSE DATA
 * ============================================================
 */

export interface LoginResponseData {
  user: AuthUser;

  tokens: AuthTokens;

  session?: AuthSession;

  requiresMfa?: boolean;

  requiresEmailVerification?: boolean;
}

export interface RegisterResponseData {
  user: AuthUser;

  requiresEmailVerification?: boolean;

  verificationSent?: boolean;
}

/**
 * ============================================================
 * AUTH ERROR
 * ============================================================
 */

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "USER_ALREADY_EXISTS"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "EMAIL_NOT_VERIFIED"
  | "PHONE_NOT_VERIFIED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED"
  | "INVALID_REFRESH_TOKEN"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "INVALID_OTP"
  | "OTP_EXPIRED"
  | "MFA_REQUIRED"
  | "MFA_INVALID"
  | "MFA_ALREADY_ENABLED"
  | "PASSWORD_TOO_WEAK"
  | "PASSWORD_MISMATCH"
  | "INVALID_RESET_TOKEN"
  | "RESET_TOKEN_EXPIRED"
  | "OAUTH_ERROR"
  | "OAUTH_PROVIDER_NOT_SUPPORTED"
  | "INSUFFICIENT_PERMISSIONS"
  | "FORBIDDEN";

/**
 * ============================================================
 * AUTH ERROR INTERFACE
 * ============================================================
 */

export interface AuthError {
  code: AuthErrorCode;

  message: string;

  statusCode: number;

  details?: unknown;

  requestId?: string;
}

/**
 * ============================================================
 * SECURITY / LOGIN METADATA
 * ============================================================
 */

export interface LoginMetadata {
  ipAddress?: string;

  userAgent?: string;

  deviceId?: string;

  deviceName?: string;

  country?: string;

  city?: string;
}

/**
 * ============================================================
 * LOGIN AUDIT
 * ============================================================
 */

export type AuthAuditAction =
  | "REGISTER"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET"
  | "EMAIL_VERIFIED"
  | "PHONE_VERIFIED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "TOKEN_REFRESHED"
  | "SESSION_REVOKED";

export interface AuthAuditLog {
  action: AuthAuditAction;

  userId?: string;

  success: boolean;

  ipAddress?: string;

  userAgent?: string;

  metadata?: Record<
    string,
    unknown
  >;

  createdAt?: Date | string;
}

/**
 * ============================================================
 * RATE LIMITING
 * ============================================================
 */

export interface AuthRateLimitInfo {
  allowed: boolean;

  limit: number;

  remaining: number;

  resetAt: Date | string;

  retryAfterSeconds?: number;
}

/**
 * ============================================================
 * SECURITY CHECK
 * ============================================================
 */

export interface AuthenticationSecurityContext {
  ipAddress?: string;

  userAgent?: string;

  deviceId?: string;

  isTrustedDevice?: boolean;

  riskScore?: number;

  requiresAdditionalVerification?: boolean;

  rateLimit?: AuthRateLimitInfo;
}

/**
 * ============================================================
 * COMPLETE AUTH CONTEXT
 * ============================================================
 */

export interface AuthContext {
  user: AuthUser;

  tokens?: AuthTokens;

  session?: AuthSession;

  security?: AuthenticationSecurityContext;

  authorization?: AuthorizationContext;
}

/**
 * ============================================================
 * SERVICE CONTRACT
 * ============================================================
 */

export interface AuthServiceContract {
  register(
    payload: RegisterPayload,
  ): Promise<
    RegisterResponseData
  >;

  login(
    payload: LoginPayload,
    metadata?: LoginMetadata,
  ): Promise<LoginResult>;

  refreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenResponse>;

  logout(
    request: LogoutRequest,
  ): Promise<LogoutResult>;

  forgotPassword(
    payload: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResult>;

  resetPassword(
    payload: ResetPasswordRequest,
  ): Promise<{
    success: boolean;
  }>;

  changePassword(
    userId: string,
    payload: ChangePasswordRequest,
  ): Promise<{
    success: boolean;
  }>;

  verifyEmail(
    payload: VerifyEmailRequest,
  ): Promise<{
    success: boolean;
  }>;

  resendVerification(
    payload: ResendVerificationRequest,
  ): Promise<{
    success: boolean;
  }>;
}

/**
 * ============================================================
 * JWT SERVICE CONTRACT
 * ============================================================
 */

export interface JwtServiceContract {
  generateAccessToken(
    payload: JwtAccessTokenPayload,
  ): string;

  generateRefreshToken(
    payload: JwtRefreshTokenPayload,
  ): string;

  verifyAccessToken(
    token: string,
  ): JwtAccessTokenPayload;

  verifyRefreshToken(
    token: string,
  ): JwtRefreshTokenPayload;

  revokeToken?(
    tokenId: string,
  ): Promise<void>;
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 *
 * Les interfaces TypeScript n'ont pas besoin
 * d'être exportées via un objet runtime.
 *
 * Le fichier utilise donc uniquement des
 * exports nommés.
 * ============================================================
 */

