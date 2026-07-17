import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { sendError } from '../utils/responses';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Express Global Error Handling Middleware.
 * Catches all thrown exceptions throughout controllers and route execution chains.
 */
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Delegate handling to default express handler if responses headers were already sent
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let code = ErrorCode.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred on the server.';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.errorCode;
    message = err.message;
    details = err.details;
    
    if (err.isOperational) {
      logger.warn(`Operational Error [${req.method} ${req.originalUrl}]: [${code}] - ${message}`);
    } else {
      logger.error(`Critical AppError [${req.method} ${req.originalUrl}]: [${code}] - ${message}\nStack: ${err.stack}`);
    }
  } else {
    logger.error(`Unhandled System Exception [${req.method} ${req.originalUrl}]: ${err.message}\nStack: ${err.stack}`);
    
    // Only display verbose javascript system errors in local developmental phases
    if (env.NODE_ENV === 'development') {
      message = err.message;
      details = { stack: err.stack };
    }
  }

  return sendError(res, message, statusCode, code, details);
};
