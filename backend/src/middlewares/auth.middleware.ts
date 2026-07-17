import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';

// Type extension mapping user parameters to Express request scope
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        metadata: any;
      };
    }
  }
}

/**
 * Middleware to require authentication on protected routes.
 * Extract access tokens from headers, validates JWTs via Supabase, and configures user context.
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

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError(
        error?.message || 'Invalid or expired authentication session.',
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    // Attach authenticated user information to request object wrapper
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      metadata: user.user_metadata,
    };

    logger.debug(`[AuthMiddleware] User token verified successfully for: ${user.id}`);
    
    next();
  } catch (error) {
    next(error);
  }
};
