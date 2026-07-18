import { getSupabaseClient } from '../lib/supabase';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';

export class DailyPlanService {
  /**
   * Retrieves the daily learning plan and associated tasks for a user on a given date.
   */
  public static async getDailyPlan(userId: string, date?: string): Promise<{ dailyPlan: any; tasks: any[] }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    logger.info(`[DailyPlanService] Fetching daily plan started for user: ${userId} and date: ${targetDate}`);

    try {
      const userClient = getSupabaseClient();

      // 1. Fetch user's active roadmap to scope daily plans accurately
      const { data: activeRoadmap, error: roadmapError } = await userClient
        .from('roadmaps')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roadmapError) {
        logger.error(`[DailyPlanService] Database query active roadmap error: ${JSON.stringify(roadmapError)}`);
        throw new AppError('Database failure fetching active roadmap', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, roadmapError);
      }

      if (!activeRoadmap) {
        logger.warn(`[DailyPlanService] Active roadmap not found for user: ${userId}`);
        throw AppError.notFound(`No active roadmap found for user.`);
      }

      // 2. Perform query joining daily_plans and nested tasks for that active roadmap
      const { data: planData, error: planError } = await userClient
        .from('daily_plans')
        .select(`
          id,
          plan_date,
          focus_topic,
          is_completed,
          tasks (
            id,
            title,
            description,
            status,
            estimated_minutes,
            completed_at,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('roadmap_id', activeRoadmap.id)
        .eq('plan_date', targetDate)
        .maybeSingle();

      if (planError) {
        logger.error(`[DailyPlanService] Database query error details: ${JSON.stringify(planError)}`);
        throw new AppError('Database failure fetching daily plan', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, planError);
      }

      if (!planData) {
        logger.warn(`[DailyPlanService] Daily plan not found for user: ${userId} and date: ${targetDate}`);
        throw AppError.notFound(`No daily plan found for date ${targetDate}.`);
      }

      logger.info(`[DailyPlanService] Daily plan found: ${planData.id}`);

      // Sort tasks by creation time for stable ordering
      const rawTasks = planData.tasks || [];
      const tasks = [...rawTasks].sort((a: any, b: any) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      logger.info(`[DailyPlanService] Task count: ${tasks.length} tasks registered for plan ID: ${planData.id}`);

      // Compute statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
      const completionPercentage = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;
      const estimatedStudyMinutes = tasks.reduce((sum: number, t: any) => sum + (t.estimated_minutes || 0), 0);

      logger.info(`[DailyPlanService] Computed execution metrics: completion = ${completionPercentage}% (${completedTasks}/${totalTasks}), study time = ${estimatedStudyMinutes}m`);

      // Construct mapped JSON responses
      const businessObject = {
        dailyPlan: {
          id: planData.id,
          date: planData.plan_date,
          focusTopic: planData.focus_topic,
          isCompleted: planData.is_completed,
          totalTasks,
          completedTasks,
          completionPercentage,
          estimatedStudyMinutes,
        },
        tasks: tasks.map((t: any, index: number) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status,
          estimatedMinutes: t.estimated_minutes,
          order: index + 1,
        })),
      };

      return businessObject;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[DailyPlanService] Error retrieving daily plan for user: ${userId}: ${errorMsg}`);
      throw new AppError('Service execution failure retrieving plan', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, error);
    }
  }
}
