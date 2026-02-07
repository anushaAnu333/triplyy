import api from './axios';
import { Destination } from './destinations';

export interface ActivityBooking {
  _id: string;
  activityId: {
    _id: string;
    title: string;
    description: string;
    location: string;
    price: number;
    currency: string;
    photos: string[];
  };
  bookingReference: string;
  status: string;
  selectedDate: string;
  numberOfParticipants: number;
  payment: {
    amount: number;
    currency: string;
    paymentStatus: string;
  };
}

export interface Booking {
  _id: string;
  userId: string;
  destinationId: Destination | string;
  bookingReference: string;
  status: 'pending_deposit' | 'deposit_paid' | 'dates_selected' | 'confirmed' | 'rejected' | 'cancelled';
  depositPayment: {
    amount: number;
    currency: string;
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  };
  travelDates: {
    startDate?: string;
    endDate?: string;
    isFlexible: boolean;
  };
  numberOfTravellers: number;
  specialRequests?: string;
  affiliateCode?: string;
  calendarUnlockedUntil?: string;
  rejectionReason?: string;
  linkedActivityBookings?: ActivityBooking[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityBookingItem {
  activityId: string;
  selectedDate: string;
  numberOfParticipants: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  specialRequests?: string;
}

export interface CreateBookingData {
  destinationId: string;
  numberOfTravellers?: number;
  specialRequests?: string;
  affiliateCode?: string;
  activities?: ActivityBookingItem[];
}

export interface CreateBookingResponse {
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    depositAmount: number;
    currency: string;
    totalAmount?: number;
    activityAmount?: number;
    hasActivities?: boolean;
  };
  payment: {
    clientSecret: string;
    paymentIntentId: string;
  };
  activities?: Array<{
    id: string;
    bookingReference: string;
    amount: number;
  }>;
}

export interface BookingsResponse {
  data: Booking[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const bookingsApi = {
  create: async (data: CreateBookingData): Promise<CreateBookingResponse> => {
    const response = await api.post('/bookings', data);
    return response.data.data;
  },

  getMyBookings: async (page = 1, limit = 10, status?: string): Promise<BookingsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/bookings/my-bookings?${params.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data.data;
  },

  selectDates: async (
    id: string,
    startDate: string,
    endDate: string,
    isFlexible = false
  ): Promise<Booking> => {
    const response = await api.put(`/bookings/${id}/select-dates`, {
      startDate,
      endDate,
      isFlexible,
    });
    return response.data.data;
  },

  cancel: async (id: string): Promise<Booking> => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data.data;
  },
};

