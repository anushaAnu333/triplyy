import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { errorResponse } from '../utils/apiResponse';

/**
 * Validation middleware wrapper
 * Runs express-validator validation chains and handles errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format and return validation errors
    const formattedErrors = errors.array().map((error) => {
      if ('path' in error) {
        return `${error.path}: ${error.msg}`;
      }
      return error.msg;
    });

    errorResponse(res, 400, 'Validation failed', formattedErrors.join('. '));
  };
};

