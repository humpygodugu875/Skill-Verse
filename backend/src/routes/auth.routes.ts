import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  signupValidator,
  loginValidator,
  refreshValidator,
} from '../validators/auth.validator';

const router = Router();

// POST /api/auth/signup - User registration
router.post(
  '/signup',
  signupValidator,
  validateRequest,
  AuthController.signup
);

// POST /api/auth/login - User login
router.post(
  '/login',
  loginValidator,
  validateRequest,
  AuthController.login
);

// POST /api/auth/logout - User session revocation
router.post(
  '/logout',
  AuthController.logout
);

// GET /api/auth/me - Retrieves current authenticated user context
router.get(
  '/me',
  requireAuth,
  AuthController.getCurrentUser
);

// POST /api/auth/refresh - Renews active tokens credentials
router.post(
  '/refresh',
  refreshValidator,
  validateRequest,
  AuthController.refreshSession
);

export default router;
