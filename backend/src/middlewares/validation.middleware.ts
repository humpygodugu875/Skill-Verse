import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/errors';

/**
 * Controller-level interceptor to handle express-validator schema results.
 * If errors are found, formats the stack and throws a structured AppError.validation.
 */
export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
      location: err.type === 'field' ? err.location : undefined,
      value: err.type === 'field' ? err.value : undefined,
    }));
    
    throw AppError.validation('Request schema validation failed.', formattedErrors);
  }
  
  next();
};
