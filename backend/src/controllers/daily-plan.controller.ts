import { Request, Response, NextFunction } from 'express';
import { DailyPlanService } from '../services/daily-plan.service';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';

export class DailyPlanController {
  public static async getDailyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestedDate = req.query.date as string | undefined;
    let userIdForLog = 'unknown';

    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized: User context code missing or invalid.', 401, ErrorCode.UNAUTHORIZED);
      }
      userIdForLog = userId;

      logger.info(`[DailyPlanController] Request start - fetching daily plan for user: ${userIdForLog}${requestedDate ? ` on date: ${requestedDate}` : ''}`);

      // Call Service stub
      const result = await DailyPlanService.getDailyPlan(userId, requestedDate);

      logger.info(`[DailyPlanController] Request success - successfully retrieved plan for user: ${userIdForLog}`);
      
      sendSuccess(res, result, 200);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[DailyPlanController] Request failure - failed retrieving plan for user: ${userIdForLog}. Error: ${errorMsg}`);
      next(error);
    }
  }
}
