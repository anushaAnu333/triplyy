import api from './axios';

export interface MultilingualText {
  en: string;
  ar?: string;
}

export interface Destination {
  _id: string;
  name: MultilingualText;
  slug: string;
  description: MultilingualText;
  shortDescription?: MultilingualText;
  images: string[];
  thumbnailImage: string;
  country: string;
  region?: string;
  depositAmount: number;
  currency: string;
  highlights?: MultilingualText[];
  inclusions?: MultilingualText[];
  exclusions?: MultilingualText[];
  duration: {
    days: number;
    nights: number;
  };
  isActive: boolean;
  isFeatured?: boolean;
}

export interface DestinationsResponse {
  data: Destination[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DestinationFilters {
  page?: number;
  limit?: number;
  country?: string;
  region?: string;
  search?: string;
}

export const destinationsApi = {
  getAll: async (filters?: DestinationFilters): Promise<DestinationsResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.country) params.append('country', filters.country);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/destinations?${params.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getBySlug: async (slug: string): Promise<Destination> => {
    const response = await api.get(`/destinations/${slug}`);
    return response.data.data;
  },

  getAvailability: async (
    destinationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/destinations/${destinationId}/availability?${params.toString()}`);
    return response.data.data;
  },
};

