import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import logger from '../utils/logger';
import env from '../config/environment';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface ValidationError extends Error {
  errors?: Record<string, { message: string }>;
}

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Handle MongoDB duplicate key error
  if ((err as MongoError).code === 11000) {
    statusCode = 400;
    const field = Object.keys((err as MongoError).keyValue || {})[0];
    message = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Field'} already exists`;
    isOperational = true;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = (err as ValidationError).errors;
    if (errors) {
      message = Object.values(errors)
        .map((e) => e.message)
        .join('. ');
    }
    isOperational = true;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
    isOperational = true;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
    isOperational = true;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    isOperational = true;
  }

  // Log error
  if (!isOperational) {
    logger.error(`Unexpected error: ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`Operational error: ${message}`);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    // Only include stack trace in development for non-operational errors
    ...(env.NODE_ENV === 'development' && !isOperational && { stack: err.stack }),
  });
};

export default errorHandler;

