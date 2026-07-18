import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { updateTaskStatusValidator } from '../validators/tasks.validator';
import { TasksController } from '../controllers/tasks.controller';

const router = Router();

// Protect PATCH /api/tasks/:taskId with Auth checks, parameters validators and controllers helper
router.patch(
  '/:taskId',
  requireAuth,
  updateTaskStatusValidator,
  validateRequest,
  TasksController.updateTaskStatus
);

export default router;
