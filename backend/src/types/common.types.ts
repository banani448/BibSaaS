
/**
 * ============================================================
 * BibSaaS — Common Types
 * ============================================================
 *
 * Types partagés dans toute l'application.
 *
 * Objectifs :
 * - Éviter les `any`
 * - Standardiser les réponses API
 * - Standardiser pagination / filtres
 * - Standardiser les résultats de services
 * - Centraliser les types communs
 * - Faciliter controllers, services et repositories
 *
 * ============================================================
 */

/**
 * ============================================================
 * GENERIC / PRIMITIVE TYPES
 * ============================================================
 */

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ID = string;

export type UUID = string;

export type ISODateString = string;

/**
 * ============================================================
 * CURRENCY
 * ============================================================
 */

export type CurrencyCode =
  | "XAF"
  | "EUR"
  | "USD"
  | "GBP"
  | "CAD"
  | "XOF"
  | "CDF";

/**
 * ============================================================
 * LANGUAGE
 * ============================================================
 */

export type LanguageCode =
  | "fr"
  | "en";

/**
 * ============================================================
 * SORTING
 * ============================================================
 */

export type SortOrder =
  | "asc"
  | "desc";

/**
 * ============================================================
 * API RESPONSE
 * ============================================================
 */

export interface ApiMeta {
  requestId?: string;

  timestamp?: string;

  version?: string;

  durationMs?: number;

  [key: string]: unknown;
}

export interface ApiSuccess<
  T = unknown,
> {
  success: true;

  message?: string;

  data: T;

  meta?: ApiMeta;
}

export interface ApiErrorDetails {
  code?: string;

  field?: string;

  fields?: Record<
    string,
    string[]
  >;

  details?: unknown;
}

export interface ApiError {
  success: false;

  message: string;

  error?: ApiErrorDetails;

  meta?: ApiMeta;
}

export type ApiResponse<
  T = unknown,
> =
  | ApiSuccess<T>
  | ApiError;

/**
 * ============================================================
 * PAGINATION
 * ============================================================
 */

export interface PaginationParams {
  page?: number;

  limit?: number;

  offset?: number;
}

export interface PaginationMeta {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

export interface PaginatedResult<
  T,
> {
  data: T[];

  pagination: PaginationMeta;
}

/**
 * ============================================================
 * SORT PARAMETERS
 * ============================================================
 */

export interface SortParams {
  sortBy?: string;

  sortOrder?: SortOrder;
}

/**
 * ============================================================
 * FILTERING
 * ============================================================
 */

export interface DateRange {
  from?: Date | string;

  to?: Date | string;
}

export interface FilterParams {
  search?: string;

  status?: string;

  dateFrom?: Date | string;

  dateTo?: Date | string;

  createdFrom?: Date | string;

  createdTo?: Date | string;

  [key: string]: unknown;
}

/**
 * ============================================================
 * GENERIC QUERY
 * ============================================================
 */

export interface QueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {}

/**
 * ============================================================
 * SERVICE RESULT
 * ============================================================
 */

export interface ServiceResult<
  T = unknown,
> {
  success: boolean;

  data?: T;

  message?: string;

  error?: {
    code?: string;

    message?: string;

    details?: unknown;
  };
}

/**
 * ============================================================
 * SERVICE PAGINATION RESULT
 * ============================================================
 */

export interface ServicePaginatedResult<
  T,
> {
  success: boolean;

  data: T[];

  pagination: PaginationMeta;

  message?: string;
}

/**
 * ============================================================
 * OPERATION RESULT
 * ============================================================
 */

export interface OperationResult {
  success: boolean;

  message?: string;

  affected?: number;

  id?: ID;
}

/**
 * ============================================================
 * AUTHENTICATION — COMMON
 * ============================================================
 *
 * Les types détaillés d'authentification sont centralisés
 * dans auth.types.ts.
 *
 * Ici nous gardons uniquement les types génériques.
 * ============================================================
 */

export type AuthTokenType =
  | "access"
  | "refresh";

export interface TokenPair {
  accessToken: string;

  refreshToken: string;

  expiresIn?: number;

  tokenType?: "Bearer";
}

/**
 * ============================================================
 * USER ROLES
 * ============================================================
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CLIENT"
  | "BARBER"
  | "SALON"
  | "SALON_MANAGER"
  | "RECEPTIONIST"
  | "STAFF";

/**
 * ============================================================
 * PERMISSIONS
 * ============================================================
 */

export type Permission =
  | "USER_READ"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"

  | "BOOKING_READ"
  | "BOOKING_CREATE"
  | "BOOKING_UPDATE"
  | "BOOKING_DELETE"

  | "PAYMENT_READ"
  | "PAYMENT_CREATE"
  | "PAYMENT_UPDATE"
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

  | "HAIRSTYLE_READ"
  | "HAIRSTYLE_CREATE"
  | "HAIRSTYLE_UPDATE"
  | "HAIRSTYLE_DELETE"

  | "FACE_ANALYSIS_READ"
  | "FACE_ANALYSIS_CREATE"
  | "FACE_ANALYSIS_DELETE"

  | "NOTIFICATION_READ"
  | "NOTIFICATION_SEND"

  | "AUDIT_READ"
  | "DASHBOARD_READ"
  | "ADMIN_ACCESS";

/**
 * ============================================================
 * TENANT
 * ============================================================
 */

export interface TenantContext {
  tenantId: ID;

  tenantName?: string;

  ownerId?: ID;

  salonId?: ID;

  isActive?: boolean;
}

/**
 * ============================================================
 * MONEY
 * ============================================================
 */

export interface Money {
  amount: number;

  currency: CurrencyCode;
}

export interface MoneyRange {
  min?: Money;

  max?: Money;
}

/**
 * ============================================================
 * ADDRESS
 * ============================================================
 */

export interface Address {
  street?: string;

  neighborhood?: string;

  district?: string;

  city?: string;

  state?: string;

  country?: string;

  postalCode?: string;

  latitude?: number;

  longitude?: number;
}

/**
 * ============================================================
 * CONTACT
 * ============================================================
 */

export interface ContactInfo {
  email?: string;

  phoneNumber?: string;

  whatsapp?: string;

  website?: string;
}

/**
 * ============================================================
 * FILE
 * ============================================================
 */

export interface FileMetadata {
  id?: ID;

  fileName: string;

  originalName?: string;

  mimeType: string;

  size: number;

  extension?: string;

  bucket?: string;

  storagePath?: string;

  publicUrl?: string;

  createdAt?: ISODateString;
}

/**
 * ============================================================
 * UPLOAD
 * ============================================================
 */

export interface UploadResult {
  success: boolean;

  path?: string;

  publicUrl?: string;

  signedUrl?: string;

  bucket?: string;

  fileName?: string;

  mimeType?: string;

  size?: number;

  error?: string;
}

/**
 * ============================================================
 * IMAGE
 * ============================================================
 */

export interface ImageMetadata {
  url: string;

  width?: number;

  height?: number;

  size?: number;

  mimeType?: string;

  alt?: string;
}

/**
 * ============================================================
 * AUDIT
 * ============================================================
 */

export type AuditAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  | "PAYMENT"
  | "REFUND"
  | "SUBSCRIPTION"
  | "BOOKING"
  | "UPLOAD"
  | "EXPORT"
  | "ADMIN_ACTION";

export interface AuditContext {
  userId?: ID;

  tenantId?: ID;

  action: AuditAction;

  resource?: string;

  resourceId?: ID;

  ipAddress?: string;

  userAgent?: string;

  requestId?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

/**
 * ============================================================
 * NOTIFICATIONS
 * ============================================================
 */

export type NotificationChannel =
  | "EMAIL"
  | "SMS"
  | "PUSH"
  | "WHATSAPP"
  | "IN_APP";

export type NotificationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

export interface NotificationPayload {
  userId: ID;

  title: string;

  message: string;

  channel?:
    | NotificationChannel
    | NotificationChannel[];

  priority?: NotificationPriority;

  data?: Record<
    string,
    unknown
  >;

  scheduledAt?: Date;
}

/**
 * ============================================================
 * PAYMENT
 * ============================================================
 */

export type PaymentProvider =
  | "MTN"
  | "AIRTEL"
  | "ORANGE"
  | "MPESA"
  | "FLUTTERWAVE"
  | "CINETPAY"
  | "STRIPE"
  | "SIMULATED";

export type PaymentState =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "EXPIRED";

export interface PaymentReference {
  reference: string;

  transactionId?: string;

  provider?: PaymentProvider;
}

/**
 * ============================================================
 * BOOKING
 * ============================================================
 */

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "REJECTED";

export interface TimeSlot {
  start: Date | string;

  end: Date | string;
}

export interface BookingPeriod {
  date: Date | string;

  startTime: string;

  endTime: string;
}

/**
 * ============================================================
 * SUBSCRIPTION
 * ============================================================
 */

export type SubscriptionState =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED"
  | "SUSPENDED";

export type BillingInterval =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface SubscriptionPeriod {
  startDate: Date | string;

  endDate: Date | string;
}

/**
 * ============================================================
 * FACE ANALYSIS
 * ============================================================
 */

export type FaceShape =
  | "OVAL"
  | "ROUND"
  | "SQUARE"
  | "HEART"
  | "DIAMOND"
  | "OBLONG"
  | "TRIANGLE"
  | "UNKNOWN";

export type FaceAnalysisStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface FaceAnalysisResult {
  faceShape: FaceShape;

  confidence: number;

  gender?: string;

  ageRange?: string;

  beard?: boolean;

  glasses?: boolean;

  skinTone?: string;

  hairType?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

/**
 * ============================================================
 * HAIRSTYLE
 * ============================================================
 */

export interface HairstyleRecommendation {
  hairstyleId: ID;

  name: string;

  score: number;

  confidence?: number;

  reason?: string;

  imageUrl?: string;
}

/**
 * ============================================================
 * AI
 * ============================================================
 */

export type AIProvider =
  | "OPENAI"
  | "OLLAMA"
  | "AZURE"
  | "AWS"
  | "CUSTOM"
  | "SIMULATED";

export interface AIRequest {
  provider?: AIProvider;

  prompt?: string;

  imageUrl?: string;

  imageBase64?: string;

  model?: string;

  temperature?: number;

  maxTokens?: number;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface AIResponse<
  T = unknown,
> {
  success: boolean;

  provider?: AIProvider;

  model?: string;

  data?: T;

  text?: string;

  confidence?: number;

  usage?: {
    promptTokens?: number;

    completionTokens?: number;

    totalTokens?: number;
  };

  error?: string;
}

/**
 * ============================================================
 * DASHBOARD
 * ============================================================
 */

export interface Statistic {
  label: string;

  value: number;

  change?: number;

  percentage?: number;

  trend?:
    | "UP"
    | "DOWN"
    | "STABLE";
}

export interface DashboardPeriod {
  from: Date | string;

  to: Date | string;
}

export interface DashboardSummary {
  revenue?: Money;

  bookings?: number;

  customers?: number;

  subscriptions?: number;

  activeUsers?: number;

  pendingPayments?: number;

  statistics?: Statistic[];
}

/**
 * ============================================================
 * DATE / TIME
 * ============================================================
 */

export interface DateRangeFilter {
  startDate?: Date | string;

  endDate?: Date | string;
}

/**
 * ============================================================
 * GEOLOCATION
 * ============================================================
 */

export interface Coordinates {
  latitude: number;

  longitude: number;
}

export interface Location {
  address?: Address;

  coordinates?: Coordinates;

  distanceKm?: number;
}

/**
 * ============================================================
 * PAGINATION HELPERS
 * ============================================================
 */

export function normalizePagination(
  params?: PaginationParams,
): Required<
  Pick<
    PaginationParams,
    "page" | "limit" | "offset"
  >
> {
  const page = Math.max(
    Number(
      params?.page ?? 1,
    ),
    1,
  );

  const limit = Math.min(
    Math.max(
      Number(
        params?.limit ?? 20,
      ),
      1,
    ),
    100,
  );

  const offset =
    params?.offset !== undefined
      ? Math.max(
          Number(
            params.offset,
          ),
          0,
        )
      : (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}

/**
 * ============================================================
 * PAGINATION META BUILDER
 * ============================================================
 */

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages =
    limit > 0
      ? Math.ceil(
          total / limit,
        )
      : 0;

  return {
    page,

    limit,

    total,

    totalPages,

    hasNextPage:
      page < totalPages,

    hasPreviousPage:
      page > 1,
  };
}

/**
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

export function isValidDate(
  value:
    | Date
    | string
    | number,
): boolean {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return !Number.isNaN(
    date.getTime(),
  );
}

/**
 * ============================================================
 * ID HELPERS
 * ============================================================
 */

export function isValidId(
  value: unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length > 0
  );
}

/**
 * ============================================================
 * OBJECT HELPERS
 * ============================================================
 */

export function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * ============================================================
 * ERROR TYPES
 * ============================================================
 */

export interface AppError {
  code: string;

  message: string;

  statusCode?: number;

  details?: unknown;

  field?: string;

  stack?: string;
}

/**
 * ============================================================
 * LOGGER CONTEXT
 * ============================================================
 */

export interface LoggerContext {
  requestId?: string;

  userId?: ID;

  tenantId?: ID;

  action?: string;

  resource?: string;

  resourceId?: ID;

  metadata?: Record<
    string,
    unknown
  >;
}

/**
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

export type HealthStatus =
  | "healthy"
  | "degraded"
  | "unhealthy";

export interface HealthCheckResult {
  service: string;

  status: HealthStatus;

  latencyMs?: number;

  message?: string;

  details?: Record<
    string,
    unknown
  >;

  timestamp: ISODateString;
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default {};

