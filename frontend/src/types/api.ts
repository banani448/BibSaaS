export type UserRole = 'CLIENT' | 'BARBER' | 'SALON' | 'SALON_CHAIN' | 'ADMIN' | 'SUPER_ADMIN';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'DELETED';

export type SubscriptionType = 'CLIENT_BASIC' | 'CLIENT_PREMIUM' | 'BARBER' | 'SALON' | 'SALON_CHAIN';

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type PaymentProvider = 'SIMULATED' | 'STRIPE' | 'CINETPAY' | 'PAYPAL' | 'MANUAL';

export type Currency = 'XAF' | 'EUR' | 'USD' | 'GBP' | 'CAD';

export interface UserProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  address?: string | null;
  bio?: string | null;
  phone?: string | null;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profile?: UserProfile;
}

export interface PlanFeature {
  id: string;
  planId: string;
  key: string;
  value?: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  type: SubscriptionType;
  description?: string | null;
  price: number | string;
  currency: Currency;
  durationDays: number;
  maxBookings?: number | null;
  maxBarbers?: number | null;
  maxSalons?: number | null;
  aiRecommendations: boolean;
  isPopular: boolean;
  isActive: boolean;
  features: PlanFeature[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  lastRenewedAt?: string | null;
  cancelledAt?: string | null;
  plan?: SubscriptionPlan;
}

export interface Salon {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  rating?: number | string;
  totalReviews?: number;
  isActive: boolean;
  ownerId?: string;
  owner?: User;
}

export interface Barber {
  id: string;
  userId: string;
  salonId?: string | null;
  experienceYears?: number;
  specialties?: string[];
  rating?: number | string;
  totalReviews?: number;
  isAvailable?: boolean;
  user?: User;
  salon?: Salon | null;
}

export interface Hairstyle {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  category: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  difficulty?: string;
  estimatedDuration?: number | null;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  popularityScore?: number | string;
  viewCount?: number;
  isActive: boolean;
  isPremium: boolean;
}

export interface Booking {
  id: string;
  clientId: string;
  barberId?: string | null;
  salonId?: string | null;
  status: BookingStatus;
  scheduledAt: string;
  duration: number;
  price?: number | string | null;
  currency: Currency;
  notes?: string | null;
  client?: User;
  barber?: Barber | null;
  salon?: Salon | null;
  createdAt?: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  bookingId?: string | null;
  amount: number;
  currency: Currency;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionReference: string;
  description?: string | null;
  phone?: string | null;
  paymentUrl?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  subtotal: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  totalAmount: number | string;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'CANCELLED';
  issueDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
  pdfUrl?: string | null;
  billingName?: string | null;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  channel?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  requestId?: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}
