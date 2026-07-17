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
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      throw new AppError(
        'Authentication credentials are required to access this resource.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    logger.debug('[AuthMiddleware] Extracted access token. JWT signature validation pending.');

    // TODO: Verify JWT token & assign user payload to request context
    
    next();
  } catch (error) {
    next(error);
  }
};
