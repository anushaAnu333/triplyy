import { body, param } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Create booking validation rules
 */
export const createBookingValidator = [
  body('destinationId')
    .notEmpty()
    .withMessage('Destination ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid destination ID');
      }
      return true;
    }),
  body('numberOfTravellers')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of travellers must be between 1 and 50'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special requests cannot exceed 1000 characters'),
  body('affiliateCode')
    .optional()
    .trim()
    .toUpperCase(),
];

/**
 * Select travel dates validation rules
 */
export const selectDatesValidator = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid booking ID');
      }
      return true;
    }),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('isFlexible')
    .optional()
    .isBoolean()
    .withMessage('isFlexible must be a boolean'),
];

/**
 * Admin booking update validation rules
 */
export const adminUpdateBookingValidator = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid booking ID');
      }
      return true;
    }),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Admin notes cannot exceed 2000 characters'),
];

/**
 * Reject booking validation rules
 */
export const rejectBookingValidator = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid booking ID');
      }
      return true;
    }),
  body('rejectionReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters'),
];

