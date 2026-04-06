import api from './axios';
import type { ItineraryDay } from './destinations';

export type { ItineraryDay };

export interface PackagePricingTableRow {
  category: string;
  values: number[];
}

export interface PackagePricingTable {
  currency: string;
  columnHeaders: string[];
  rows: PackagePricingTableRow[];
}

export interface PackageHotelGroup {
  title: string;
  items: string[];
}

/** Staff-only files (PDF / images); not returned from public package endpoints. */
export interface PackageAdminAttachment {
  url: string;
  originalName: string;
  mimeType?: string;
}

export interface TripPackage {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  thumbnailImage: string;
  location: string;
  duration: { days: number; nights: number };
  priceLabel?: string;
  priceCurrency: string;
  pricingTable?: PackagePricingTable;
  hotelGroups?: PackageHotelGroup[];
  blackoutDates?: string[];
  inclusions: string[];
  exclusions: string[];
  importantNotes?: string[];
  highlights: string[];
  itinerary?: ItineraryDay[];
  secondaryItineraryTitle?: string;
  secondaryItinerary?: ItineraryDay[];
  contactPhone?: string;
  contactEmail?: string;
  contactInstagram?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isPromotion: boolean;
  promotionStartDate?: string;
  promotionEndDate?: string;
  isActive: boolean;
  /** Present only when loaded via admin API */
  adminOnlyAttachments?: PackageAdminAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PackagesResponse {
  data: TripPackage[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Body for create/update — matches backend `buildPackagePayload`. */
export type PackageUpsertBody = Partial<TripPackage> & {
  name?: string;
  description?: string;
  location?: string;
};

export const packagesApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PackagesResponse> => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.search) q.append('search', params.search);
    const response = await api.get(`/packages?${q.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getBySlug: async (slug: string): Promise<TripPackage> => {
    const response = await api.get(`/packages/${encodeURIComponent(slug)}`);
    return response.data.data;
  },

  /** Admin: fetch by MongoDB id */
  getById: async (id: string): Promise<TripPackage> => {
    const response = await api.get(`/packages/admin/${encodeURIComponent(id)}`);
    return response.data.data;
  },

  getAdminList: async (params?: { page?: number; limit?: number; search?: string }): Promise<PackagesResponse> => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.search) q.append('search', params.search);
    const response = await api.get(`/packages/admin/list?${q.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  create: async (
    body: PackageUpsertBody & { name: string; description: string; location: string }
  ): Promise<TripPackage> => {
    const response = await api.post('/packages', body);
    return response.data.data;
  },

  update: async (id: string, body: PackageUpsertBody): Promise<TripPackage> => {
    const response = await api.put(`/packages/${id}`, body);
    return response.data.data;
  },

  /** Upload package images (1-5 files). Returns { urls: string[] }. */
  uploadImages: async (files: File[]): Promise<{ urls: string[] }> => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    const response = await api.post('/packages/upload-images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { urls: response.data.data?.urls ?? [] };
  },

  /** Upload PDF or image for admin-only package attachments (max 5 per request). */
  uploadAdminAttachments: async (
    files: File[]
  ): Promise<{ attachments: PackageAdminAttachment[] }> => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const response = await api.post('/packages/upload-admin-attachments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const attachments = response.data.data?.attachments ?? [];
    return { attachments };
  },

  /**
   * Download a Cloudinary-stored attachment via the API (streams with Content-Disposition: attachment).
   * Uses the shared destination proxy; admin auth required.
   */
  downloadAdminAttachment: async (att: PackageAdminAttachment): Promise<void> => {
    const response = await api.post(
      '/destinations/download-attachment',
      { url: att.url, fileName: att.originalName || 'download' },
      { responseType: 'blob' }
    );
    const blob = response.data as Blob;
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = att.originalName || 'download';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/packages/${id}`);
  },
};
