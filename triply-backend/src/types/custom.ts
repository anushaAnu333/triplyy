import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: 'user' | 'admin' | 'affiliate';
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface BookingFilters extends PaginationQuery {
  status?: string;
  destinationId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  affiliateCode?: string;
}

export interface DestinationFilters extends PaginationQuery {
  country?: string;
  region?: string;
  search?: string;
}

