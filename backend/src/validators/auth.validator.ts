import { body } from 'express-validator';

/**
 * Validation schema rule-chains for user registration.
 */
export const signupValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.'),
];

/**
 * Validation schema rule-chains for user login.
 */
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

/**
 * Validation schema rule-chains for token refresh.
 */
export const refreshValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required.'),
];
