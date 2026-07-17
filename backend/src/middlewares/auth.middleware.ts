import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Middleware to require authentication on protected routes.
 * Extract access tokens from headers, and prepares session validations.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(
        'Authorization header is missing.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Authorization header must follow the Bearer <token> format.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !parts[1]) {
      throw new AppError(
        'Authorization token is missing or malformed.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const token = parts[1];

    logger.debug(`[AuthMiddleware] Extracted access token: ${token.substring(0, 10)}... JWT signature validation pending.`);

    // TODO: Verify JWT token & assign user payload to request context
    
    next();
  } catch (error) {
    next(error);
  }
};
