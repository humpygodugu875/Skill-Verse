import { Request, Response, NextFunction } from 'express';
import { GoalService } from '../services/goals.service';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';

export class GoalController {
  public static async createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const token = req.headers.authorization?.split(' ')[1];
      const goal = await GoalService.createGoal(userId, req.body, token);

      sendSuccess(res, goal, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const token = req.headers.authorization?.split(' ')[1];
      const goals = await GoalService.getGoals(userId, token);

      sendSuccess(res, goals, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getGoalDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const goalId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const token = req.headers.authorization?.split(' ')[1];
      const goal = await GoalService.getGoalDetails(userId, goalId, token);

      sendSuccess(res, goal, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const goalId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const token = req.headers.authorization?.split(' ')[1];
      const updated = await GoalService.updateGoal(userId, goalId, req.body, token);

      sendSuccess(res, updated, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const goalId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      }

      const token = req.headers.authorization?.split(' ')[1];
      await GoalService.deleteGoal(userId, goalId, token);

      sendSuccess(res, { message: 'Goal successfully deleted' }, 200);
    } catch (error) {
      next(error);
    }
  }
}

