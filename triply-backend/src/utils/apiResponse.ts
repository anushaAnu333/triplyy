import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponseOptions<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

/**
 * Standardized API response format
 * All API responses follow this structure for consistency
 */
export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  options: ApiResponseOptions<T>
): Response => {
  return res.status(statusCode).json(options);
};

/**
 * Success response helper
 */
export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  meta?: PaginationMeta
): Response => {
  return sendResponse(res, 200, {
    success: true,
    message,
    data,
    meta,
  });
};

/**
 * Created response helper (201)
 */
export const createdResponse = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return sendResponse(res, 201, {
    success: true,
    message,
    data,
  });
};

/**
 * Error response helper
 */
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error?: string
): Response => {
  return sendResponse(res, statusCode, {
    success: false,
    message,
    error,
  });
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

