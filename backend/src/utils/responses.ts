import { Response } from 'express';
import { ErrorCode } from './errors';

export interface SuccessResponsePayload<T> {
  success: true;
  data: T;
  meta?: any;
}

export interface ErrorResponsePayload {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    details?: any;
  };
}

/**
 * Format and send a successful HTTP response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: any
): Response => {
  const payload: SuccessResponsePayload<T> = {
    success: true,
    data,
  };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Format and send an error HTTP response.
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = ErrorCode.INTERNAL_SERVER_ERROR,
  details?: any
): Response => {
  const payload: ErrorResponsePayload = {
    success: false,
    error: {
      message,
      code,
    },
  };
  if (details !== undefined) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
};
