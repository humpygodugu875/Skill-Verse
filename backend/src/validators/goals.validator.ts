import { body } from 'express-validator';

export const goalsValidator = [
  body('title')
    .notEmpty()
    .withMessage('Goal title is required')
    .isString()
    .withMessage('Goal title must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Goal title must be between 3 and 200 characters'),
    
  body('description')
    .notEmpty()
    .withMessage('Goal description is required')
    .isString()
    .withMessage('Goal description must be a string')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Goal description must be between 10 and 2000 characters'),
    
  body('skill_level')
    .notEmpty()
    .withMessage('Current skill level is required')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Current skill level must be one of: beginner, intermediate, advanced'),
    
  body('target_skill_level')
    .notEmpty()
    .withMessage('Target skill level is required')
    .isIn(['intermediate', 'advanced', 'expert'])
    .withMessage('Target skill level must be one of: intermediate, advanced, expert'),
    
  body('learning_style')
    .notEmpty()
    .withMessage('Learning style is required')
    .isString()
    .withMessage('Learning style must be a string'),
    
  body('weekly_hours')
    .notEmpty()
    .withMessage('Weekly committed hours is required')
    .isInt({ min: 1, max: 168 })
    .withMessage('Weekly committed hours must be an integer between 1 and 168'),
    
  body('target_date')
    .notEmpty()
    .withMessage('Target completion date is required')
    .isISO8601()
    .withMessage('Target completion date must be a valid date in YYYY-MM-DD format'),
    
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isString()
    .withMessage('Category must be a string'),
];

export const goalUpdateValidator = [
  body('title')
    .optional()
    .isString()
    .withMessage('Goal title must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Goal title must be between 3 and 200 characters'),
    
  body('description')
    .optional()
    .isString()
    .withMessage('Goal description must be a string')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Goal description must be between 10 and 2000 characters'),
    
  body('skill_level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Current skill level must be one of: beginner, intermediate, advanced'),
    
  body('hours_per_week')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Weekly committed hours must be an integer between 1 and 168'),
    
  body('target_date')
    .optional()
    .isISO8601()
    .withMessage('Target completion date must be a valid date'),
];
