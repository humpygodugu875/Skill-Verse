import { Request, Response, NextFunction } from 'express';
import { TasksService } from '../services/tasks.service';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';

export class TasksController {
  /**
   * PATCH /api/tasks/:taskId
   * Body: { "status": "completed" | "pending" }
   */
  public static async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { taskId } = req.params;
    const { status } = req.body;
    let userIdForLog = 'unknown';

    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized: User token context missing.', 401, ErrorCode.UNAUTHORIZED);
      }
      userIdForLog = userId;

      logger.info(`[TasksController] User ${userIdForLog} requesting task status change for taskId=${taskId} to: ${status}`);

      const result = await TasksService.updateTaskStatus(userId, taskId, status);

      logger.info(`[TasksController] Task status successfully updated for user: ${userIdForLog}, taskId=${taskId}`);

      sendSuccess(res, result, 200);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[TasksController] Failed to update status for user: ${userIdForLog}, taskId=${taskId}. Error: ${errorMsg}`);
      next(error);
    }
  }
}
