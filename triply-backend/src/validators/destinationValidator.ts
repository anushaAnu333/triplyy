import { body, param } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Create/Update destination validation rules
 */
export const destinationValidator = [
  body('name.en')
    .notEmpty()
    .withMessage('English name is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Name cannot exceed 200 characters'),
  body('name.ar')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Arabic name cannot exceed 200 characters'),
  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Invalid slug format'),
  body('description.en')
    .notEmpty()
    .withMessage('English description is required')
    .trim(),
  body('description.ar')
    .optional()
    .trim(),
  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .trim(),
  body('region')
    .optional()
    .trim(),
  body('depositAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deposit amount must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('duration.days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration days must be at least 1'),
  body('duration.nights')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration nights cannot be negative'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

/**
 * Destination ID parameter validation
 */
export const destinationIdValidator = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid destination ID');
      }
      return true;
    }),
];

/**
 * Destination slug parameter validation
 */
export const destinationSlugValidator = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required'),
];

