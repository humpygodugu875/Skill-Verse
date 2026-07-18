import { param, body } from 'express-validator';

export const updateTaskStatusValidator = [
  param('taskId')
    .isUUID()
    .withMessage('Task ID must be a valid UUID format'),
  body('status')
    .isIn(['completed', 'pending'])
    .withMessage("Status must be either 'completed' or 'pending'"),
];
