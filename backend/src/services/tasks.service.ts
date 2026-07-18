import { getSupabaseClient } from '../lib/supabase';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';

export class TasksService {
  /**
   * Updates task status after validating ownership.
   * Recalculates metrics for the parent daily plan.
   */
  public static async updateTaskStatus(
    userId: string,
    taskId: string,
    status: 'completed' | 'pending'
  ): Promise<{ task: any; metrics: any }> {
    logger.info(`[TasksService] Update status request for taskId=${taskId}, userId=${userId}, targetStatus=${status}`);

    const userClient = getSupabaseClient();

    // 1. Fetch task to check existence and ownership
    const { data: task, error: fetchError } = await userClient
      .from('tasks')
      .select('id, user_id, plan_id, title, description, status, estimated_minutes')
      .eq('id', taskId)
      .maybeSingle();

    if (fetchError) {
      throw new AppError('Database error fetching task details', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, fetchError);
    }

    if (!task) {
      logger.warn(`[TasksService] Task not found: ${taskId}`);
      throw AppError.notFound('Task not found.');
    }

    // Verify task belongs to authenticated user
    if (task.user_id !== userId) {
      logger.warn(`[TasksService] Unauthorized access attempt by user ${userId} on task ${taskId} owned by ${task.user_id}`);
      throw new AppError('Access denied. Task does not belong to your account.', 403, ErrorCode.UNAUTHORIZED);
    }

    // 2. Perform task update
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const { data: updatedTask, error: updateError } = await userClient
      .from('tasks')
      .update({
        status,
        completed_at: completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select('id, plan_id, title, description, status, estimated_minutes, completed_at')
      .single();

    if (updateError) {
      throw new AppError('Database error writing task updates', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, updateError);
    }

    logger.info(`[TasksService] Task ${taskId} successfully updated to status: ${status}`);

    // 3. Compile sibling tasks to recalculate status metrics
    const { data: siblingTasks, error: siblingError } = await userClient
      .from('tasks')
      .select('id, status, estimated_minutes')
      .eq('plan_id', task.plan_id);

    if (siblingError || !siblingTasks) {
      throw new AppError('Database error compiling updated plan metrics', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, siblingError);
    }

    const totalTasks = siblingTasks.length;
    const completedTasks = siblingTasks.filter((t: any) => t.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;
    const estimatedStudyMinutes = siblingTasks.reduce((sum: number, t: any) => sum + (t.estimated_minutes || 0), 0);

    // 4. Update the is_completed status on the daily plan row
    const isPlanCompleted = totalTasks > 0 && completedTasks === totalTasks;
    const { error: planUpdateError } = await userClient
      .from('daily_plans')
      .update({
        is_completed: isPlanCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.plan_id);

    if (planUpdateError) {
      logger.warn(`[TasksService] Non-fatal mismatch trying to update daily_plans.is_completed: ${planUpdateError.message}`);
    } else {
      logger.info(`[TasksService] Updated parent daily plan completion: isCompleted=${isPlanCompleted}`);
    }

    return {
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description || '',
        status: updatedTask.status,
        estimatedMinutes: updatedTask.estimated_minutes,
        completedAt: updatedTask.completed_at
      },
      metrics: {
        totalTasks,
        completedTasks,
        completionPercentage,
        estimatedStudyMinutes
      }
    };
  }
}
