import { query } from 'express-validator';

export const dailyPlanValidator = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date format (YYYY-MM-DD)'),
];
