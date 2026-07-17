export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace excluding constructor call from trace logs
    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message: string, errorCode = ErrorCode.BAD_REQUEST) {
    return new AppError(message, 400, errorCode);
  }

  public static unauthorized(message: string, errorCode = ErrorCode.UNAUTHORIZED) {
    return new AppError(message, 401, errorCode);
  }

  public static forbidden(message: string, errorCode = ErrorCode.FORBIDDEN) {
    return new AppError(message, 403, errorCode);
  }

  public static notFound(message: string, errorCode = ErrorCode.NOT_FOUND) {
    return new AppError(message, 404, errorCode);
  }

  public static conflict(message: string, errorCode = ErrorCode.CONFLICT) {
    return new AppError(message, 409, errorCode);
  }

  public static internal(
    message: string, 
    errorCode = ErrorCode.INTERNAL_SERVER_ERROR, 
    isOperational = false
  ) {
    return new AppError(message, 500, errorCode, isOperational);
  }

  public static validation(message: string, details?: any) {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }
}
