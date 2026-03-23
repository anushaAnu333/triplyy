import api from './axios';
import type { TripPackage } from './packages';

export type PackageBookingStatus =
  | 'pending_deposit'
  | 'pending_date'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export interface PackageBooking {
  _id: string;
  userId: string;
  packageId: TripPackage | string;
  bookingReference: string;
  status: PackageBookingStatus;
  depositPayment: {
    amount: number;
    currency: string;
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: string;
    paymentStatus: string;
  };
  travelDates: {
    startDate?: string;
    endDate?: string;
  };
  numberOfTravellers: number;
  specialRequests?: string;
  adminNotes?: string;
  rejectionReason?: string;
  calendarUnlockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export const packageBookingsApi = {
  getMine: async (params?: { page?: number; limit?: number }): Promise<{
    data: PackageBooking[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    const response = await api.get(`/package-bookings/my?${q.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getById: async (id: string): Promise<PackageBooking> => {
    const response = await api.get(`/package-bookings/${id}`);
    return response.data.data;
  },

  adminList: async (params?: { page?: number; limit?: number; status?: string }): Promise<{
    data: PackageBooking[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.status) q.append('status', params.status);
    const response = await api.get(`/admin/package-bookings?${q.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  adminAssignDates: async (
    id: string,
    body: { startDate: string; endDate: string; adminNotes?: string }
  ): Promise<PackageBooking> => {
    const response = await api.patch(`/admin/package-bookings/${id}/assign-dates`, body);
    return response.data.data;
  },
};
