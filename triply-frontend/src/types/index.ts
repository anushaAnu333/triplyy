// Re-export types from API modules
export type { User, LoginCredentials, RegisterData, AuthResponse } from '@/lib/api/auth';
export type { Destination, MultilingualText, DestinationFilters, DestinationsResponse } from '@/lib/api/destinations';
export type { Booking, CreateBookingData, CreateBookingResponse, BookingsResponse } from '@/lib/api/bookings';
export type { AffiliateCode, Commission, AffiliateDashboard } from '@/lib/api/affiliates';

// Common types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type BookingStatus = 
  | 'pending_deposit'
  | 'deposit_paid'
  | 'dates_selected'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type CommissionStatus = 'pending' | 'approved' | 'paid';

export type UserRole = 'user' | 'admin' | 'affiliate' | 'merchant';

