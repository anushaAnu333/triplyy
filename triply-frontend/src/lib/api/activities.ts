import api from './axios';

export interface Activity {
  _id: string;
  merchantId: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
  };
  title: string;
  description: string;
  location: string;
  price: number;
  currency: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  location?: string;
  search?: string;
}

export interface ActivitiesResponse {
  data: Activity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmitActivityData {
  title: string;
  description: string;
  location: string;
  price: number;
  currency?: string;
  photos: File[];
}

export interface ActivityInquiryData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredDate: string;
  message?: string;
}

export interface ActivityAvailability {
  _id: string;
  activityId: string;
  date: string;
  availableSlots: number;
  bookedSlots: number;
  isAvailable: boolean;
  price?: number;
  remainingSlots?: number;
  isFullyBooked?: boolean;
}

export interface ActivityBookingData {
  selectedDate: string;
  numberOfParticipants: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
}

export interface ActivityBooking {
  _id: string;
  userId: string;
  activityId: string;
  availabilityId: string;
  bookingReference: string;
  status: 'pending_payment' | 'payment_completed' | 'confirmed' | 'cancelled' | 'refunded';
  payment: {
    amount: number;
    currency: string;
    triplyCommission: number;
    merchantAmount: number;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    merchantPayoutStatus: 'pending' | 'paid' | 'failed';
  };
  selectedDate: string;
  numberOfParticipants: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

// Public API (no auth required)
export const activitiesApi = {
  getAll: async (filters?: ActivityFilters): Promise<ActivitiesResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.location) params.append('location', filters.location);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/activities?${params.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await api.get(`/activities/${id}`);
    return response.data.data;
  },

  submitInquiry: async (id: string, data: ActivityInquiryData): Promise<void> => {
    await api.post(`/activities/${id}/inquire`, data);
  },

  getAvailability: async (id: string, startDate?: string, endDate?: string): Promise<{ activityId: string; availability: ActivityAvailability[]; dateRange: { start: string; end: string } }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/activities/${id}/availability?${params.toString()}`);
    return response.data.data;
  },

  createBooking: async (id: string, data: ActivityBookingData): Promise<ActivityBooking> => {
    const response = await api.post(`/activities/${id}/book`, data);
    return response.data.data;
  },

  getBookingById: async (bookingId: string): Promise<ActivityBooking> => {
    const response = await api.get(`/activities/bookings/${bookingId}`);
    return response.data.data;
  },
};

// Merchant API (auth required)
export interface MerchantDashboard {
  stats: {
    totalEarnings: number;
    pendingPayouts: number;
    paidOut: number;
    totalBookings: number;
    completedBookings: number;
    totalActivities: number;
    approvedActivities: number;
  };
  activitiesWithStats: Array<{
    _id: string;
    title: string;
    status: string;
    bookingsCount: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    _id: string;
    bookingReference: string;
    activityTitle: string;
    customerName: string;
    selectedDate: string;
    numberOfParticipants: number;
    amount: number;
    merchantAmount: number;
    currency: string;
    status: string;
    paymentStatus: string;
    payoutStatus: string;
    createdAt: string;
  }>;
}

export interface MerchantBooking {
  _id: string;
  bookingReference: string;
  activity: {
    _id: string;
    title: string;
    photos: string[];
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  selectedDate: string;
  numberOfParticipants: number;
  payment: {
    amount: number;
    merchantAmount: number;
    triplyCommission: number;
    currency: string;
    paymentStatus: string;
    merchantPayoutStatus: string;
    merchantPayoutDate?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantBookingsResponse {
  data: MerchantBooking[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const merchantActivitiesApi = {
  register: async (): Promise<{ role: string }> => {
    const response = await api.post('/merchant/register');
    return response.data.data;
  },

  submit: async (data: SubmitActivityData): Promise<Activity> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('location', data.location);
    formData.append('price', data.price.toString());
    if (data.currency) formData.append('currency', data.currency);
    
    data.photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    const response = await api.post('/merchant/activities', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  getMyActivities: async (): Promise<Activity[]> => {
    const response = await api.get('/merchant/activities');
    return response.data.data;
  },

  getDashboard: async (): Promise<MerchantDashboard> => {
    const response = await api.get('/merchant/dashboard');
    return response.data.data;
  },

  getBookings: async (page = 1, limit = 10, status?: string): Promise<MerchantBookingsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/merchant/bookings?${params.toString()}`);
    return response.data.data;
  },

  getActivityAvailability: async (activityId: string, startDate?: string, endDate?: string): Promise<{
    activityId: string;
    availability: Array<{
      _id: string;
      date: string;
      availableSlots: number;
      bookedSlots: number;
      isAvailable: boolean;
      price?: number;
    }>;
    dateRange?: { start: string; end: string };
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/merchant/activities/${activityId}/availability?${params.toString()}`);
    return response.data.data;
  },

  blockActivityDates: async (activityId: string, dates: string[], isBlocked: boolean): Promise<void> => {
    await api.put(`/merchant/activities/${activityId}/availability/block`, {
      dates,
      isBlocked,
    });
  },

  updateActivitySlots: async (activityId: string, dates: string[], totalSlots: number): Promise<void> => {
    await api.put(`/merchant/activities/${activityId}/availability/slots`, {
      dates,
      totalSlots,
    });
  },
};

// Admin API (auth required)
export const adminActivitiesApi = {
  getPending: async (): Promise<Activity[]> => {
    const response = await api.get('/admin/activities/pending');
    return response.data.data;
  },

  getAll: async (status?: 'pending' | 'approved'): Promise<Activity[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/activities/all${params}`);
    return response.data.data;
  },

  approve: async (id: string): Promise<Activity> => {
    const response = await api.put(`/admin/activities/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string, rejectionReason: string): Promise<Activity> => {
    const response = await api.put(`/admin/activities/${id}/reject`, { rejectionReason });
    return response.data.data;
  },
};
