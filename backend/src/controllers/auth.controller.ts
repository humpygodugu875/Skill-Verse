import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/responses';
import { AppError } from '../utils/errors';

export class AuthController {
  /**
   * Handles POST /api/auth/signup.
   * Parses credentials and yields user configurations.
   */
  public static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        throw AppError.badRequest('Missing email, password, or fullName fields.');
      }

      const result = await AuthService.signup({ email, password, fullName });
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/login.
   * Authenticates credentials & fetches active JWT session data.
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw AppError.badRequest('Missing email or password fields.');
      }

      const result = await AuthService.login({ email, password });
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/logout.
   * Extracts authorization header JWT tokens and calls logout services.
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

      if (!token) {
        throw AppError.unauthorized('Access token must be provided.');
      }

      const result = await AuthService.logout(token);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET /api/auth/me.
   * Resolves the token bearer back to active user structures.
   */
  public static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

      if (!token) {
        throw AppError.unauthorized('Access token is missing.');
      }

      const result = await AuthService.getCurrentUser(token);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/refresh.
   * Renews session JWT tokens utilizing refresh tokens parameters.
   */
  public static async refreshSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw AppError.badRequest('Required field refreshToken was not provided.');
      }

      const result = await AuthService.refreshSession(refreshToken);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
