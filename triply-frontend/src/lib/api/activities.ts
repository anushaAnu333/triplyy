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
  duration?: string;
  groupSize?: number;
  languages?: string;
  pointsHeading?: string;
  pointGroups?: Array<{ text: string; subPoints: string[] }>;
  includes?: string[];
  excludes?: string[];
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

export interface ActivityBookingsResponse {
  data: ActivityBooking[];
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
  duration?: string;
  groupSize?: number | null;
  languages?: string;
  pointsHeading?: string;
  pointGroups?: Array<{ text: string; subPoints: string[] }>;
  includes?: string[];
  excludes?: string[];
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
  /** Single-day booking (legacy) */
  selectedDate?: string;
  /** Multi-day: one booking covering all days */
  selectedDates?: string[];
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
  availabilityIds?: string[];
  bookingReference: string;
  status: 'pending_payment' | 'payment_completed' | 'confirmed' | 'cancelled' | 'refunded';
  payment: {
    amount: number;
    currency: string;
    triplyCommission: number;
    merchantAmount: number;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    merchantPayoutStatus: 'pending' | 'paid' | 'failed';
    merchantPayoutDate?: string;
    merchantPayoutTransactionId?: string;
  };
  selectedDate: string;
  selectedDates?: string[];
  lastActivityDate?: string;
  numberOfParticipants: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  specialRequests?: string;
  /** Merchant confirmed the requested date/slot; required before payment */
  merchantAvailabilityApproved?: boolean;
  merchantAvailabilityApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActivityBookingDetail {
  booking: ActivityBooking & {
    activityId?: Activity;
    userId?: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string };
  };
  merchant?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  merchantOnboarding?: {
    businessType?: string;
    categories?: string[];
    businessInfo?: Record<string, unknown>;
    updatedAt?: string;
  } | null;
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

  getMyActivityBookings: async (page = 1, limit = 10): Promise<ActivityBookingsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/activities/my-bookings?${params.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  cancelActivityBooking: async (bookingId: string): Promise<ActivityBooking> => {
    const response = await api.put(`/activities/bookings/${bookingId}/cancel`);
    return response.data.data;
  },
};

// Merchant API (auth required)
export interface MerchantDashboardBookingSummary {
  _id: string;
  bookingReference: string;
  activityTitle: string;
  customerName: string;
  selectedDate: string;
  numberOfParticipants: number;
  merchantAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

export interface MerchantDashboard {
  stats: {
    totalEarnings: number;
    pendingPayouts: number;
    paidOut: number;
    totalBookings: number;
    completedBookings: number;
    totalActivities: number;
    approvedActivities: number;
    /** Activities awaiting platform review */
    pendingListings?: number;
    rejectedListings?: number;
    /** Guest approved slot but has not paid yet */
    awaitingGuestPayment?: number;
    /** Counts needing merchant to confirm availability */
    needsConfirmAvailability?: number;
    /** Paid — need merchant to confirm the trip */
    needsConfirmBooking?: number;
  };
  bookingStatusCounts?: {
    pending_payment: number;
    payment_completed: number;
    confirmed: number;
    cancelled: number;
    refunded: number;
  };
  needsConfirmAvailability?: MerchantDashboardBookingSummary[];
  needsConfirmBooking?: MerchantDashboardBookingSummary[];
  upcomingBookings?: MerchantDashboardBookingSummary[];
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
    activityStatus?: string;
    customerName: string;
    selectedDate: string;
    numberOfParticipants: number;
    amount: number;
    merchantAmount: number;
    currency: string;
    status: string;
    paymentStatus: string;
    payoutStatus: string;
    merchantAvailabilityApproved: boolean;
    createdAt: string;
  }>;
  /** Latest customer payments (payment completed), sorted by paid time */
  recentPaidBookings?: Array<{
    _id: string;
    bookingReference: string;
    activityTitle: string;
    activityStatus?: string;
    customerName: string;
    selectedDate: string;
    numberOfParticipants: number;
    amount: number;
    merchantAmount: number;
    currency: string;
    status: string;
    paymentStatus: string;
    payoutStatus: string;
    paidAt: string;
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
    status?: string;
  };
  merchantAvailabilityApproved?: boolean;
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
    paidAt?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantBookingDetail {
  _id: string;
  bookingReference: string;
  merchantAvailabilityApproved: boolean;
  merchantAvailabilityApprovedAt?: string;
  activity: {
    _id: string;
    title: string;
    photos: string[];
    status?: string;
    location?: string;
    description?: string;
    price?: number;
    currency?: string;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  selectedDate: string;
  selectedDates?: string[];
  lastActivityDate?: string;
  numberOfParticipants: number;
  specialRequests?: string;
  availability?: {
    _id: string;
    date: string;
    availableSlots?: number;
    bookedSlots?: number;
  };
  availabilities?: Array<{ _id: string; date: string }>;
  payment: {
    amount: number;
    merchantAmount: number;
    triplyCommission: number;
    currency: string;
    paymentStatus: string;
    merchantPayoutStatus: string;
    merchantPayoutDate?: string;
    paidAt?: string;
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
    if (data.duration) formData.append('duration', data.duration);
    if (data.groupSize !== undefined && data.groupSize !== null) formData.append('groupSize', data.groupSize.toString());
    if (data.languages) formData.append('languages', data.languages);
    if (data.pointsHeading) formData.append('pointsHeading', data.pointsHeading);
    if (data.pointGroups) formData.append('pointGroups', JSON.stringify(data.pointGroups));
    if (data.includes) formData.append('includes', JSON.stringify(data.includes));
    if (data.excludes) formData.append('excludes', JSON.stringify(data.excludes));
    
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

  getById: async (id: string): Promise<Activity> => {
    const response = await api.get(`/merchant/activities/${id}`);
    return response.data.data;
  },

  getDashboard: async (): Promise<MerchantDashboard> => {
    const response = await api.get('/merchant/dashboard');
    return response.data.data;
  },

  getMerchantBookingById: async (bookingId: string): Promise<MerchantBookingDetail> => {
    const response = await api.get(`/merchant/bookings/${bookingId}`);
    return response.data.data;
  },

  getBookings: async (
    page = 1,
    limit = 10,
    opts?: { status?: string; attention?: string; search?: string }
  ): Promise<MerchantBookingsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (opts?.status) params.append('status', opts.status);
    if (opts?.attention) params.append('attention', opts.attention);
    if (opts?.search?.trim()) params.append('search', opts.search.trim());

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

  approveActivityBooking: async (bookingId: string): Promise<ActivityBooking> => {
    const response = await api.put(`/activities/bookings/${bookingId}/confirm`);
    return response.data.data;
  },

  approveMerchantAvailability: async (
    bookingId: string
  ): Promise<{ bookingReference: string; merchantAvailabilityApproved: boolean }> => {
    const response = await api.put(`/merchant/activity-bookings/${bookingId}/approve-availability`);
    return response.data.data;
  },

  cancelActivityBooking: async (bookingId: string): Promise<ActivityBooking> => {
    const response = await api.put(`/activities/bookings/${bookingId}/cancel`);
    return response.data.data;
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

  getById: async (id: string): Promise<Activity> => {
    const response = await api.get(`/admin/activities/${id}`);
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

  getAdminActivityBookings: async (
    page = 1,
    limit = 10,
    status?: string
  ): Promise<ActivityBookingsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/activities/bookings/admin?${params.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getAdminActivityBookingById: async (bookingId: string): Promise<AdminActivityBookingDetail> => {
    const response = await api.get(`/activities/bookings/admin/${bookingId}`);
    return response.data.data;
  },

  approveActivityBooking: async (bookingId: string): Promise<ActivityBooking> => {
    const response = await api.put(`/activities/bookings/${bookingId}/confirm`);
    return response.data.data;
  },

  /** Admin: after trip date, record that the 80% was paid to merchant (manual transfer). */
  markMerchantPayoutPaid: async (
    bookingId: string,
    payload?: { paymentReference?: string }
  ): Promise<ActivityBooking> => {
    const response = await api.put(`/activities/bookings/${bookingId}/mark-merchant-payout-paid`, payload ?? {});
    return response.data.data;
  },

  cancelActivityBooking: async (bookingId: string): Promise<ActivityBooking> => {
    const response = await api.put(`/activities/bookings/${bookingId}/cancel`);
    return response.data.data;
  },
};
