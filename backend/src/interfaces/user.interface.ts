
/**
 * ============================================================
 * BibSaaS — User Interfaces
 * ============================================================
 *
 * File:
 * interfaces/user.interface.ts
 *
 * Description:
 * Contrats TypeScript centralisés pour la gestion des
 * utilisateurs BibSaaS.
 *
 * Fonctionnalités :
 * - User CRUD
 * - Profiles
 * - Roles & permissions
 * - Account status
 * - Preferences
 * - Security
 * - Avatar
 * - Multi-tenant / Salon
 * - Pagination
 * - Search & filters
 * - Statistics
 * - Audit
 *
 * ============================================================
 */

/**
 * ============================================================
 * ROLES
 * ============================================================
 */

export type UserRole =
  | "CLIENT"
  | "BARBER"
  | "SALON"
  | "SALON_MANAGER"
  | "SALON_CHAIN"
  | "ADMIN"
  | "SUPER_ADMIN";

/**
 * ============================================================
 * ACCOUNT STATUS
 * ============================================================
 */

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "SUSPENDED"
  | "BANNED"
  | "DELETED";

/**
 * ============================================================
 * GENDER
 * ============================================================
 *
 * Optionnel : utilisé uniquement si ton application
 * collecte cette information.
 */

export type UserGender =
  | "MALE"
  | "FEMALE"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";

/**
 * ============================================================
 * LANGUAGE
 * ============================================================
 */

export type UserLanguage =
  | "fr"
  | "en";

/**
 * ============================================================
 * CURRENCY
 * ============================================================
 */

export type UserCurrency =
  | "XAF"
  | "EUR"
  | "USD"
  | "GBP"
  | "CAD";

/**
 * ============================================================
 * NOTIFICATION PREFERENCES
 * ============================================================
 */

export interface UserNotificationPreferences {
  email: boolean;

  sms: boolean;

  push: boolean;

  whatsapp?: boolean;

  bookingReminders: boolean;

  bookingUpdates: boolean;

  paymentUpdates: boolean;

  subscriptionUpdates: boolean;

  marketing: boolean;

  securityAlerts: boolean;
}

/**
 * ============================================================
 * PRIVACY PREFERENCES
 * ============================================================
 */

export interface UserPrivacyPreferences {
  profileVisible: boolean;

  showPhone: boolean;

  showEmail: boolean;

  allowAnalytics: boolean;

  allowPersonalizedRecommendations: boolean;

  allowAiAnalysis: boolean;

  allowMarketing: boolean;
}

/**
 * ============================================================
 * USER PREFERENCES
 * ============================================================
 */

export interface UserPreferences {
  language: UserLanguage;

  currency: UserCurrency;

  timezone: string;

  notifications: UserNotificationPreferences;

  privacy: UserPrivacyPreferences;

  theme?: "LIGHT" | "DARK" | "SYSTEM";
}

/**
 * ============================================================
 * USER ADDRESS
 * ============================================================
 */

export interface UserAddress {
  id?: string;

  addressLine1: string;

  addressLine2?: string | null;

  city: string;

  state?: string | null;

  postalCode?: string | null;

  country: string;

  latitude?: number | null;

  longitude?: number | null;

  isDefault?: boolean;
}

/**
 * ============================================================
 * USER PROFILE
 * ============================================================
 */

export interface UserProfile {
  firstName: string;

  lastName: string;

  displayName?: string;

  bio?: string | null;

  avatarUrl?: string | null;

  dateOfBirth?: Date | string | null;

  gender?: UserGender | null;

  phone?: string | null;

  phoneVerified?: boolean;

  email?: string;

  emailVerified?: boolean;

  address?: UserAddress | null;
}

/**
 * ============================================================
 * USER
 * ============================================================
 */

export interface User {
  id: string;

  email: string;

  phone?: string | null;

  firstName: string;

  lastName: string;

  displayName?: string | null;

  avatarUrl?: string | null;

  role: UserRole;

  status: UserStatus;

  gender?: UserGender | null;

  dateOfBirth?: Date | string | null;

  emailVerified: boolean;

  phoneVerified: boolean;

  mfaEnabled: boolean;

  preferences?: UserPreferences;

  address?: UserAddress | null;

  salonId?: string | null;

  createdAt: Date | string;

  updatedAt: Date | string;

  lastLoginAt?: Date | string | null;

  deletedAt?: Date | string | null;
}

/**
 * ============================================================
 * SAFE USER
 * ============================================================
 *
 * Version pouvant être renvoyée au frontend.
 * Aucun mot de passe ou secret sensible.
 */

export interface SafeUser {
  id: string;

  email: string;

  phone?: string | null;

  firstName: string;

  lastName: string;

  displayName?: string | null;

  avatarUrl?: string | null;

  role: UserRole;

  status: UserStatus;

  emailVerified: boolean;

  phoneVerified: boolean;

  mfaEnabled: boolean;

  preferences?: UserPreferences;

  salonId?: string | null;

  createdAt: Date | string;

  updatedAt: Date | string;

  lastLoginAt?: Date | string | null;
}

/**
 * ============================================================
 * CREATE USER
 * ============================================================
 */

export interface CreateUserRequest {
  email: string;

  password: string;

  firstName: string;

  lastName: string;

  phone?: string;

  role?: UserRole;

  gender?: UserGender;

  dateOfBirth?: Date | string;

  salonId?: string;

  language?: UserLanguage;

  currency?: UserCurrency;

  timezone?: string;
}

/**
 * ============================================================
 * NORMALIZED CREATE USER
 * ============================================================
 */

export interface CreateUserPayload {
  email: string;

  passwordHash: string;

  firstName: string;

  lastName: string;

  phone?: string;

  role: UserRole;

  gender?: UserGender;

  dateOfBirth?: Date;

  salonId?: string;

  preferences?: UserPreferences;
}

/**
 * ============================================================
 * UPDATE USER
 * ============================================================
 */

export interface UpdateUserRequest {
  firstName?: string;

  lastName?: string;

  displayName?: string;

  phone?: string | null;

  avatarUrl?: string | null;

  gender?: UserGender | null;

  dateOfBirth?: Date | string | null;

  status?: UserStatus;

  role?: UserRole;

  salonId?: string | null;
}

/**
 * ============================================================
 * NORMALIZED UPDATE
 * ============================================================
 */

export interface UpdateUserPayload {
  firstName?: string;

  lastName?: string;

  displayName?: string;

  phone?: string | null;

  avatarUrl?: string | null;

  gender?: UserGender | null;

  dateOfBirth?: Date | null;

  status?: UserStatus;

  role?: UserRole;

  salonId?: string | null;
}

/**
 * ============================================================
 * PROFILE UPDATE
 * ============================================================
 */

export interface UpdateUserProfileRequest {
  firstName?: string;

  lastName?: string;

  displayName?: string;

  phone?: string;

  avatarUrl?: string;

  gender?: UserGender;

  dateOfBirth?: Date | string;

  address?: UserAddress;
}

/**
 * ============================================================
 * PREFERENCES UPDATE
 * ============================================================
 */

export interface UpdateUserPreferencesRequest {
  language?: UserLanguage;

  currency?: UserCurrency;

  timezone?: string;

  notifications?: Partial<
    UserNotificationPreferences
  >;

  privacy?: Partial<
    UserPrivacyPreferences
  >;

  theme?: "LIGHT" | "DARK" | "SYSTEM";
}

/**
 * ============================================================
 * ROLE MANAGEMENT
 * ============================================================
 */

export interface UpdateUserRoleRequest {
  userId: string;

  role: UserRole;

  reason?: string;
}

/**
 * ============================================================
 * STATUS MANAGEMENT
 * ============================================================
 */

export interface UpdateUserStatusRequest {
  userId: string;

  status: UserStatus;

  reason?: string;
}

/**
 * ============================================================
 * USER FILTERS
 * ============================================================
 */

export interface UserFilters {
  role?: UserRole | UserRole[];

  status?: UserStatus | UserStatus[];

  emailVerified?: boolean;

  phoneVerified?: boolean;

  mfaEnabled?: boolean;

  salonId?: string;

  city?: string;

  country?: string;

  search?: string;

  createdAfter?: Date | string;

  createdBefore?: Date | string;

  lastLoginAfter?: Date | string;

  lastLoginBefore?: Date | string;
}

/**
 * ============================================================
 * SORTING
 * ============================================================
 */

export type UserSortField =
  | "createdAt"
  | "updatedAt"
  | "firstName"
  | "lastName"
  | "email"
  | "lastLoginAt";

export type UserSortOrder =
  | "asc"
  | "desc";

export interface UserSort {
  field: UserSortField;

  order: UserSortOrder;
}

/**
 * ============================================================
 * PAGINATION
 * ============================================================
 */

export interface UserPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

/**
 * ============================================================
 * USER QUERY
 * ============================================================
 */

export interface UserQuery {
  page?: number;

  limit?: number;

  filters?: UserFilters;

  sort?: UserSort;
}

/**
 * ============================================================
 * USER LIST RESPONSE
 * ============================================================
 */

export interface UserListResponseData {
  users: SafeUser[];

  pagination: UserPagination;
}

/**
 * ============================================================
 * USER RESPONSE
 * ============================================================
 */

export interface UserResponseData {
  user: SafeUser;

  message?: string;
}

/**
 * ============================================================
 * PERMISSIONS
 * ============================================================
 */

export type UserPermission =
  | "USER_READ"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "USER_SUSPEND"
  | "USER_BAN"
  | "USER_RESTORE"
  | "USER_MANAGE_ROLES"
  | "USER_MANAGE_PERMISSIONS";

/**
 * ============================================================
 * USER AUTHORIZATION
 * ============================================================
 */

export interface UserAuthorizationContext {
  userId: string;

  role: UserRole;

  permissions: UserPermission[];

  targetUserId?: string;

  salonId?: string;

  canManageAllUsers?: boolean;
}

/**
 * ============================================================
 * USER SECURITY
 * ============================================================
 */

export interface UserSecurityInfo {
  emailVerified: boolean;

  phoneVerified: boolean;

  mfaEnabled: boolean;

  failedLoginAttempts: number;

  lockedUntil?: Date | string | null;

  passwordChangedAt?: Date | string | null;

  lastPasswordResetAt?: Date | string | null;

  lastLoginAt?: Date | string | null;

  lastLoginIp?: string | null;
}

/**
 * ============================================================
 * USER SESSION
 * ============================================================
 */

export interface UserSession {
  id: string;

  userId: string;

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

  isCurrent?: boolean;

  isActive: boolean;
}

/**
 * ============================================================
 * USER STATISTICS
 * ============================================================
 */

export interface UserStatistics {
  total: number;

  active: number;

  inactive: number;

  pending: number;

  suspended: number;

  banned: number;

  clients: number;

  barbers: number;

  salons: number;

  salonManagers: number;

  salonChains: number;

  admins: number;

  superAdmins: number;

  verifiedEmails: number;

  verifiedPhones: number;

  mfaEnabled: number;

  newUsersToday: number;

  newUsersThisMonth: number;
}

/**
 * ============================================================
 * USER ACTIVITY
 * ============================================================
 */

export type UserActivityAction =
  | "PROFILE_UPDATED"
  | "EMAIL_CHANGED"
  | "PHONE_CHANGED"
  | "PASSWORD_CHANGED"
  | "ROLE_CHANGED"
  | "STATUS_CHANGED"
  | "AVATAR_UPDATED"
  | "PREFERENCES_UPDATED"
  | "SESSION_CREATED"
  | "SESSION_REVOKED";

export interface UserActivity {
  id?: string;

  userId: string;

  action: UserActivityAction;

  actorId?: string;

  metadata?: Record<
    string,
    unknown
  >;

  ipAddress?: string;

  userAgent?: string;

  createdAt?: Date | string;
}

/**
 * ============================================================
 * USER AUDIT
 * ============================================================
 */

export interface UserAuditLog {
  id?: string;

  userId: string;

  action: UserActivityAction;

  actorId?: string;

  previousValue?: unknown;

  newValue?: unknown;

  reason?: string;

  metadata?: Record<
    string,
    unknown
  >;

  createdAt?: Date | string;
}

/**
 * ============================================================
 * USER ERROR CODES
 * ============================================================
 */

export type UserErrorCode =
  | "USER_NOT_FOUND"
  | "USER_ALREADY_EXISTS"
  | "EMAIL_ALREADY_EXISTS"
  | "PHONE_ALREADY_EXISTS"
  | "INVALID_USER"
  | "INVALID_ROLE"
  | "INVALID_STATUS"
  | "ACCOUNT_NOT_ACTIVE"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "USER_ALREADY_DELETED"
  | "CANNOT_DELETE_SELF"
  | "CANNOT_CHANGE_OWN_ROLE"
  | "INSUFFICIENT_PERMISSION"
  | "FORBIDDEN";

/**
 * ============================================================
 * USER ERROR
 * ============================================================
 */

export interface UserError {
  code: UserErrorCode;

  message: string;

  statusCode: number;

  details?: unknown;

  requestId?: string;
}

/**
 * ============================================================
 * API RESPONSE
 * ============================================================
 */

export interface UserApiResponse<T = unknown> {
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
 * USER SERVICE CONTRACT
 * ============================================================
 */

export interface UserServiceContract {
  createUser(
    payload: CreateUserPayload,
  ): Promise<SafeUser>;

  getUserById(
    userId: string,
    requesterId?: string,
  ): Promise<SafeUser>;

  getUserByEmail(
    email: string,
  ): Promise<SafeUser | null>;

  updateUser(
    userId: string,
    payload: UpdateUserPayload,
    requesterId: string,
  ): Promise<SafeUser>;

  updateProfile(
    userId: string,
    payload: UpdateUserProfileRequest,
  ): Promise<SafeUser>;

  updatePreferences(
    userId: string,
    payload: UpdateUserPreferencesRequest,
  ): Promise<SafeUser>;

  updateRole(
    payload: UpdateUserRoleRequest,
    actorId: string,
  ): Promise<SafeUser>;

  updateStatus(
    payload: UpdateUserStatusRequest,
    actorId: string,
  ): Promise<SafeUser>;

  listUsers(
    query: UserQuery,
    requesterId?: string,
  ): Promise<UserListResponseData>;

  deleteUser(
    userId: string,
    actorId: string,
  ): Promise<{
    success: boolean;
  }>;
}

/**
 * ============================================================
 * USER REPOSITORY CONTRACT
 * ============================================================
 */

export interface UserRepositoryContract {
  create(
    payload: CreateUserPayload,
  ): Promise<User>;

  findById(
    userId: string,
  ): Promise<User | null>;

  findByEmail(
    email: string,
  ): Promise<User | null>;

  findByPhone(
    phone: string,
  ): Promise<User | null>;

  update(
    userId: string,
    payload: UpdateUserPayload,
  ): Promise<User>;

  delete(
    userId: string,
  ): Promise<void>;

  list(
    query: UserQuery,
  ): Promise<{
    users: User[];

    total: number;
  }>;
}

/**
 * ============================================================
 * USER OPERATION RESULT
 * ============================================================
 */

export interface UserOperationResult {
  success: boolean;

  user?: SafeUser;

  message: string;

  error?: UserError;

  requestId?: string;
}

/**
 * ============================================================
 * DEFAULT ROLE PERMISSIONS
 * ============================================================
 */

export interface UserRolePermissions {
  role: UserRole;

  permissions: UserPermission[];
}

/**
 * ============================================================
 * MULTI-TENANT CONTEXT
 * ============================================================
 */

export interface UserTenantContext {
  userId: string;

  role: UserRole;

  salonId?: string | null;

  salonChainId?: string | null;

  tenantId?: string | null;

  isGlobalAdmin: boolean;
}

/**
 * ============================================================
 * EXPORT NOTE
 * ============================================================
 *
 * Toutes les interfaces sont exportées individuellement afin
 * de permettre :
 *
 * import {
 *   User,
 *   SafeUser,
 *   CreateUserRequest,
 *   UpdateUserRequest,
 *   UserQuery
 * } from "../interfaces/user.interface";
 *
 * ============================================================
 */
