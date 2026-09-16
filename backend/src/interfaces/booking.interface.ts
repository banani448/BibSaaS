
/**
 * ============================================================
 * BibSaaS — Booking Interfaces
 * ============================================================
 *
 * File:
 * interfaces/booking.interface.ts
 *
 * Description:
 * Contrats TypeScript pour le système de réservation BibSaaS.
 *
 * Fonctionnalités :
 * - Création de réservation
 * - Modification
 * - Annulation
 * - Confirmation
 * - Check-in / Check-out
 * - Barber
 * - Salon
 * - Multi-salon
 * - Services
 * - Créneaux horaires
 * - Disponibilité
 * - Paiement
 * - Pagination
 * - Filtres
 * - Audit
 * - API responses
 *
 * ============================================================
 */

/**
 * ============================================================
 * ENUMS
 * ============================================================
 */

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW"
  | "EXPIRED";

export type BookingPaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "PARTIALLY_PAID"
  | "REFUNDED"
  | "FAILED"
  | "CANCELLED";

export type BookingPaymentMethod =
  | "CASH"
  | "MTN_MOMO"
  | "AIRTEL_MONEY"
  | "ORANGE_MONEY"
  | "MPESA"
  | "CINETPAY"
  | "FLUTTERWAVE"
  | "STRIPE"
  | "CARD"
  | "SIMULATED";

export type BookingSource =
  | "WEB"
  | "MOBILE"
  | "ADMIN"
  | "BARBER"
  | "SALON"
  | "API";

export type BookingType =
  | "STANDARD"
  | "WALK_IN"
  | "ONLINE"
  | "RECURRING";

export type CancellationActor =
  | "CLIENT"
  | "BARBER"
  | "SALON"
  | "ADMIN"
  | "SYSTEM";

/**
 * ============================================================
 * BASIC REFERENCES
 * ============================================================
 */

export interface BookingUserReference {
  id: string;

  firstName?: string | null;

  lastName?: string | null;

  email?: string | null;

  phone?: string | null;

  avatarUrl?: string | null;
}

export interface BookingBarberReference {
  id: string;

  userId?: string;

  name?: string;

  firstName?: string;

  lastName?: string;

  avatarUrl?: string | null;

  specialty?: string | null;

  rating?: number | null;
}

export interface BookingSalonReference {
  id: string;

  name: string;

  slug?: string;

  logoUrl?: string | null;

  address?: string | null;

  city?: string | null;

  country?: string | null;

  latitude?: number | null;

  longitude?: number | null;

  phone?: string | null;
}

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */

export interface BookingServiceItem {
  id: string;

  name: string;

  description?: string | null;

  durationMinutes: number;

  price: number;

  currency: string;

  quantity?: number;

  subtotal?: number;
}

/**
 * ============================================================
 * BOOKING PRICE
 * ============================================================
 */

export interface BookingPricing {
  subtotal: number;

  discount?: number;

  tax?: number;

  serviceFee?: number;

  platformFee?: number;

  total: number;

  currency: string;
}

/**
 * ============================================================
 * DATE / TIME
 * ============================================================
 */

export interface BookingTimeSlot {
  startAt: Date | string;

  endAt: Date | string;

  timezone?: string;

  durationMinutes: number;
}

/**
 * ============================================================
 * CREATE BOOKING
 * ============================================================
 */

export interface CreateBookingRequest {
  barberId: string;

  salonId: string;

  serviceId?: string;

  serviceIds?: string[];

  startAt: Date | string;

  endAt?: Date | string;

  date?: string;

  startTime?: string;

  notes?: string;

  clientNotes?: string;

  paymentMethod?: BookingPaymentMethod;

  paymentId?: string;

  source?: BookingSource;

  type?: BookingType;

  currency?: string;

  couponCode?: string;
}

/**
 * Données nettoyées après validation.
 */
export interface CreateBookingPayload {
  clientId: string;

  barberId: string;

  salonId: string;

  serviceIds: string[];

  startAt: Date;

  endAt: Date;

  notes?: string;

  clientNotes?: string;

  paymentMethod?: BookingPaymentMethod;

  paymentId?: string;

  source: BookingSource;

  type: BookingType;

  currency: string;

  couponCode?: string;
}

/**
 * ============================================================
 * UPDATE BOOKING
 * ============================================================
 */

export interface UpdateBookingRequest {
  barberId?: string;

  salonId?: string;

  serviceId?: string;

  serviceIds?: string[];

  startAt?: Date | string;

  endAt?: Date | string;

  date?: string;

  startTime?: string;

  notes?: string;

  clientNotes?: string;

  paymentMethod?: BookingPaymentMethod;

  currency?: string;
}

export interface UpdateBookingPayload {
  barberId?: string;

  salonId?: string;

  serviceIds?: string[];

  startAt?: Date;

  endAt?: Date;

  notes?: string;

  clientNotes?: string;

  paymentMethod?: BookingPaymentMethod;

  currency?: string;
}

/**
 * ============================================================
 * CONFIRMATION
 * ============================================================
 */

export interface ConfirmBookingRequest {
  bookingId: string;

  note?: string;
}

export interface RejectBookingRequest {
  bookingId: string;

  reason: string;
}

/**
 * ============================================================
 * CANCELLATION
 * ============================================================
 */

export interface CancelBookingRequest {
  bookingId: string;

  reason?: string;

  actor?: CancellationActor;
}

export interface CancellationDetails {
  cancelledAt: Date | string;

  cancelledBy?: string;

  actor: CancellationActor;

  reason?: string;

  refundEligible?: boolean;

  refundAmount?: number;

  refundCurrency?: string;
}

/**
 * ============================================================
 * CHECK-IN / CHECK-OUT
 * ============================================================
 */

export interface CheckInBookingRequest {
  bookingId: string;

  note?: string;
}

export interface CompleteBookingRequest {
  bookingId: string;

  note?: string;

  finalPrice?: number;
}

/**
 * ============================================================
 * BOOKING
 * ============================================================
 */

export interface Booking {
  id: string;

  bookingNumber?: string;

  clientId: string;

  barberId: string;

  salonId: string;

  status: BookingStatus;

  paymentStatus: BookingPaymentStatus;

  paymentMethod?: BookingPaymentMethod | null;

  type: BookingType;

  source: BookingSource;

  timeSlot: BookingTimeSlot;

  services: BookingServiceItem[];

  pricing: BookingPricing;

  notes?: string | null;

  clientNotes?: string | null;

  cancellation?: CancellationDetails | null;

  createdAt: Date | string;

  updatedAt: Date | string;

  confirmedAt?: Date | string | null;

  completedAt?: Date | string | null;
}

/**
 * ============================================================
 * POPULATED BOOKING
 * ============================================================
 */

export interface BookingDetails
  extends Booking {
  client?: BookingUserReference;

  barber?: BookingBarberReference;

  salon?: BookingSalonReference;
}

/**
 * ============================================================
 * BOOKING LIST FILTERS
 * ============================================================
 */

export interface BookingFilters {
  status?: BookingStatus | BookingStatus[];

  paymentStatus?: BookingPaymentStatus;

  barberId?: string;

  salonId?: string;

  clientId?: string;

  serviceId?: string;

  startDate?: Date | string;

  endDate?: Date | string;

  date?: Date | string;

  search?: string;

  source?: BookingSource;

  type?: BookingType;

  paymentMethod?: BookingPaymentMethod;
}

/**
 * ============================================================
 * PAGINATION
 * ============================================================
 */

export interface BookingPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

/**
 * ============================================================
 * SORTING
 * ============================================================
 */

export type BookingSortField =
  | "createdAt"
  | "updatedAt"
  | "startAt"
  | "endAt"
  | "total"
  | "status";

export type BookingSortOrder =
  | "asc"
  | "desc";

export interface BookingSort {
  field: BookingSortField;

  order: BookingSortOrder;
}

/**
 * ============================================================
 * BOOKING QUERY
 * ============================================================
 */

export interface BookingQuery {
  page?: number;

  limit?: number;

  filters?: BookingFilters;

  sort?: BookingSort;
}

/**
 * ============================================================
 * AVAILABILITY
 * ============================================================
 */

export interface AvailabilityRequest {
  barberId?: string;

  salonId: string;

  serviceId?: string;

  serviceIds?: string[];

  date: string;

  timezone?: string;
}

export interface AvailabilitySlot {
  startAt: Date | string;

  endAt: Date | string;

  durationMinutes: number;

  available: boolean;

  barberId?: string;

  salonId: string;

  reason?: string;
}

export interface AvailabilityResponse {
  date: string;

  timezone: string;

  slots: AvailabilitySlot[];
}

/**
 * ============================================================
 * BOOKING CONFLICT
 * ============================================================
 */

export interface BookingConflict {
  hasConflict: boolean;

  bookingId?: string;

  startAt?: Date | string;

  endAt?: Date | string;

  reason?: string;
}

/**
 * ============================================================
 * BOOKING RESPONSE
 * ============================================================
 */

export interface BookingResponseData {
  booking: BookingDetails;

  message?: string;
}

export interface BookingListResponseData {
  bookings: BookingDetails[];

  pagination: BookingPagination;
}

/**
 * ============================================================
 * API RESPONSE
 * ============================================================
 */

export interface BookingApiResponse<T = unknown> {
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
 * BOOKING ERROR CODES
 * ============================================================
 */

export type BookingErrorCode =
  | "BOOKING_NOT_FOUND"
  | "BOOKING_ALREADY_EXISTS"
  | "BOOKING_CONFLICT"
  | "SLOT_NOT_AVAILABLE"
  | "BARBER_NOT_AVAILABLE"
  | "SALON_NOT_AVAILABLE"
  | "SERVICE_NOT_FOUND"
  | "BARBER_NOT_FOUND"
  | "SALON_NOT_FOUND"
  | "INVALID_TIME_SLOT"
  | "INVALID_DATE"
  | "BOOKING_ALREADY_CONFIRMED"
  | "BOOKING_ALREADY_CANCELLED"
  | "BOOKING_ALREADY_COMPLETED"
  | "BOOKING_CANNOT_BE_CANCELLED"
  | "BOOKING_CANNOT_BE_UPDATED"
  | "BOOKING_EXPIRED"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_FAILED"
  | "INSUFFICIENT_PERMISSION"
  | "FORBIDDEN";

/**
 * ============================================================
 * BOOKING ERROR
 * ============================================================
 */

export interface BookingError {
  code: BookingErrorCode;

  message: string;

  statusCode: number;

  details?: unknown;

  requestId?: string;
}

/**
 * ============================================================
 * BOOKING PERMISSIONS
 * ============================================================
 */

export type BookingPermission =
  | "BOOKING_READ"
  | "BOOKING_CREATE"
  | "BOOKING_UPDATE"
  | "BOOKING_CONFIRM"
  | "BOOKING_REJECT"
  | "BOOKING_CANCEL"
  | "BOOKING_CHECKIN"
  | "BOOKING_COMPLETE"
  | "BOOKING_DELETE"
  | "BOOKING_MANAGE_ALL";

/**
 * ============================================================
 * BOOKING AUTHORIZATION
 * ============================================================
 */

export interface BookingAuthorizationContext {
  userId: string;

  role:
    | "CLIENT"
    | "BARBER"
    | "SALON"
    | "SALON_MANAGER"
    | "SALON_CHAIN"
    | "ADMIN"
    | "SUPER_ADMIN";

  permissions: BookingPermission[];

  bookingOwnerId?: string;

  barberId?: string;

  salonId?: string;
}

/**
 * ============================================================
 * BOOKING AUDIT
 * ============================================================
 */

export type BookingAuditAction =
  | "CREATED"
  | "UPDATED"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "NO_SHOW"
  | "EXPIRED"
  | "PAYMENT_ATTACHED"
  | "PAYMENT_UPDATED";

export interface BookingAuditLog {
  id?: string;

  bookingId: string;

  action: BookingAuditAction;

  actorId?: string;

  actorRole?: string;

  previousStatus?: BookingStatus;

  newStatus?: BookingStatus;

  reason?: string;

  metadata?: Record<
    string,
    unknown
  >;

  createdAt?: Date | string;
}

/**
 * ============================================================
 * BOOKING NOTIFICATION
 * ============================================================
 */

export type BookingNotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "BOOKING_STARTED"
  | "BOOKING_COMPLETED"
  | "BOOKING_PAYMENT_REQUIRED";

export interface BookingNotification {
  type: BookingNotificationType;

  bookingId: string;

  recipientId: string;

  title: string;

  message: string;

  channels?: Array<
    | "IN_APP"
    | "EMAIL"
    | "SMS"
    | "PUSH"
    | "WHATSAPP"
  >;

  scheduledAt?: Date | string;
}

/**
 * ============================================================
 * REMINDER
 * ============================================================
 */

export interface BookingReminder {
  bookingId: string;

  recipientId: string;

  reminderMinutesBefore: number;

  scheduledAt: Date | string;

  sentAt?: Date | string | null;

  status:
    | "PENDING"
    | "SENT"
    | "FAILED"
    | "CANCELLED";
}

/**
 * ============================================================
 * RECURRING BOOKING
 * ============================================================
 */

export type RecurrenceFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY";

export interface RecurringBookingRequest {
  barberId: string;

  salonId: string;

  serviceIds: string[];

  startAt: Date | string;

  frequency: RecurrenceFrequency;

  occurrences: number;

  endDate?: Date | string;

  notes?: string;
}

/**
 * ============================================================
 * BOOKING STATS
 * ============================================================
 */

export interface BookingStatistics {
  total: number;

  pending: number;

  confirmed: number;

  inProgress: number;

  completed: number;

  cancelled: number;

  rejected: number;

  noShow: number;

  expired: number;

  revenue: number;

  currency: string;

  averageBookingValue: number;

  cancellationRate: number;

  completionRate: number;
}

/**
 * ============================================================
 * BOOKING CALENDAR
 * ============================================================
 */

export interface BookingCalendarDay {
  date: string;

  bookings: BookingDetails[];

  availableSlots: AvailabilitySlot[];

  totalBookings: number;
}

export interface BookingCalendar {
  startDate: string;

  endDate: string;

  timezone: string;

  days: BookingCalendarDay[];
}

/**
 * ============================================================
 * BOOKING SERVICE CONTRACT
 * ============================================================
 */

export interface BookingServiceContract {
  createBooking(
    payload: CreateBookingPayload,
  ): Promise<BookingDetails>;

  getBookingById(
    bookingId: string,
    userId?: string,
  ): Promise<BookingDetails>;

  listBookings(
    query: BookingQuery,
    userId?: string,
  ): Promise<BookingListResponseData>;

  updateBooking(
    bookingId: string,
    payload: UpdateBookingPayload,
    userId: string,
  ): Promise<BookingDetails>;

  confirmBooking(
    bookingId: string,
    userId: string,
  ): Promise<BookingDetails>;

  rejectBooking(
    bookingId: string,
    reason: string,
    userId: string,
  ): Promise<BookingDetails>;

  cancelBooking(
    bookingId: string,
    payload: CancelBookingRequest,
    userId: string,
  ): Promise<BookingDetails>;

  checkInBooking(
    bookingId: string,
    userId: string,
  ): Promise<BookingDetails>;

  completeBooking(
    bookingId: string,
    userId: string,
  ): Promise<BookingDetails>;

  checkAvailability(
    payload: AvailabilityRequest,
  ): Promise<AvailabilityResponse>;
}

/**
 * ============================================================
 * IDEMPOTENCY
 * ============================================================
 */

export interface BookingIdempotencyRequest {
  idempotencyKey: string;

  userId: string;

  payloadHash: string;

  bookingId?: string;

  createdAt?: Date | string;

  expiresAt?: Date | string;
}

/**
 * ============================================================
 * TRANSACTION
 * ============================================================
 */

export interface BookingTransactionContext {
  transactionId: string;

  bookingId?: string;

  paymentId?: string;

  userId: string;

  createdAt: Date | string;
}

/**
 * ============================================================
 * FINAL BOOKING RESULT
 * ============================================================
 */

export interface BookingOperationResult {
  success: boolean;

  booking?: BookingDetails;

  message: string;

  error?: BookingError;

  transactionId?: string;
}

