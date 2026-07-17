import { getSupabaseClient } from '../lib/supabase';
import { AIService } from './ai.service';
import { logger } from '../utils/logger';
import { AppError, ErrorCode } from '../utils/errors';

export class GoalService {
  /**
   * Submits a new learning goal: Generates analysis & roadmap, then inserts all linked models.
   */
  public static async createGoal(
    userId: string,
    input: {
      title: string;
      description: string;
      skill_level: string;
      target_skill_level: string;
      learning_style: string;
      weekly_hours: number;
      target_date: string;
      category: string;
    },
    token?: string
  ): Promise<any> {
    const userClient = getSupabaseClient(token);
    logger.info(`Starting AI learning goal analysis and roadmap generation for user: ${userId}`);

    // 1. Invoke AI service to perform analysis and roadmap planning
    const { analysis, roadmap } = await AIService.analyzeAndPlan({
      title: input.title,
      description: input.description,
      skill_level: input.skill_level,
      target_skill_level: input.target_skill_level,
      learning_style: input.learning_style,
      weekly_hours: input.weekly_hours,
      target_date: input.target_date,
    });

    // 2. Insert Goal details into public.learning_goals
    const { data: goalData, error: goalError } = await userClient
      .from('learning_goals')
      .insert({
        user_id: userId,
        title: input.title,
        raw_goal: input.description,
        target_date: input.target_date,
        skill_level: input.skill_level,
        hours_per_week: input.weekly_hours,
        duration_weeks: roadmap.total_weeks || 4,
        status: 'active',
        analyzed_payload: {
          difficulty_score: analysis.difficulty_score,
          estimated_duration: analysis.estimated_duration,
          prerequisites: analysis.prerequisites,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          starting_point: analysis.starting_point,
          learning_strategy: analysis.learning_strategy,
          confidence_score: analysis.confidence_score,
          target_skill_level: input.target_skill_level,
          learning_style: input.learning_style,
          category: input.category,
        },
      })
      .select()
      .single();

    if (goalError) {
      logger.error('Failed to save learning goal: ' + goalError.message);
      throw new AppError('Database failure saving goal', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, goalError);
    }

    const goalId = goalData.id;

    // 3. Insert Roadmap root referencing the goal
    const { data: roadmapData, error: roadmapError } = await userClient
      .from('roadmaps')
      .insert({
        user_id: userId,
        goal_id: goalId,
        title: roadmap.title || input.title,
        description: roadmap.description || input.description,
        total_weeks: roadmap.total_weeks || 4,
        start_date: new Date().toISOString().split('T')[0],
        end_date: input.target_date,
        status: 'active',
      })
      .select()
      .single();

    if (roadmapError) {
      logger.error('Failed to save learning roadmap: ' + roadmapError.message);
      // Clean up goal to avoid orphan records
      await userClient.from('learning_goals').delete().eq('id', goalId);
      throw new AppError('Database failure saving roadmap', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, roadmapError);
    }

    const roadmapId = roadmapData.id;
    let totalTasksCount = 0;

    // 4. Iterate and insert Milestones, Projects, Resources and Daily checklists
    for (const milestone of roadmap.milestones) {
      const { data: moduleData, error: moduleError } = await userClient
        .from('roadmap_modules')
        .insert({
          user_id: userId,
          roadmap_id: roadmapId,
          sequence_number: milestone.sequence_number,
          title: milestone.title,
          description: milestone.description,
          estimated_days: milestone.estimated_days || 7,
          topics: milestone.topics,
          status: milestone.sequence_number === 1 ? 'in_progress' : 'not_started',
        })
        .select()
        .single();

      if (moduleError) {
        logger.error('Failed to save roadmap module: ' + moduleError.message);
        continue;
      }

      const moduleId = moduleData.id;

      // 4a. Save Resources for module
      if (milestone.resources && milestone.resources.length > 0) {
        const resourcesPayload = milestone.resources.map(r => ({
          user_id: userId,
          module_id: moduleId,
          title: r.title,
          url: r.url,
          resource_type: r.resource_type,
          estimated_minutes: r.estimated_minutes,
          why_recommended: r.why_recommended,
          is_completed: false,
        }));
        await userClient.from('resources').insert(resourcesPayload);
      }

      // 4b. Save Capstone Project
      if (milestone.project) {
        const { data: projectData, error: projectError } = await userClient
          .from('projects')
          .insert({
            user_id: userId,
            module_id: moduleId,
            title: milestone.project.title,
            description: milestone.project.description,
            requirements: milestone.project.requirements,
            tech_stack: milestone.project.tech_stack,
            steps: milestone.project.steps,
            estimated_hours: milestone.project.estimated_hours,
          })
          .select()
          .single();

        if (!projectError && projectData) {
          // Initialize project_progress
          await userClient.from('project_progress').insert({
            user_id: userId,
            project_id: projectData.id,
            status: 'not_started',
            steps_completed: [],
          });
        }
      }

      // 4c. Setup daily plans and tasks
      if (milestone.tasks && milestone.tasks.length > 0) {
        totalTasksCount += milestone.tasks.length;

        // Group tasks by day to minimize daily_plan inserts
        const tasksByDay: { [day: number]: typeof milestone.tasks } = {};
        milestone.tasks.forEach(t => {
          if (!tasksByDay[t.day_number]) {
            tasksByDay[t.day_number] = [];
          }
          tasksByDay[t.day_number].push(t);
        });

        // Insert plans & tasks
        for (const dayStr of Object.keys(tasksByDay)) {
          const day = parseInt(dayStr, 10);
          const planDate = new Date();
          planDate.setDate(planDate.getDate() + (milestone.sequence_number - 1) * 7 + (day - 1));

          const { data: planData, error: planError } = await userClient
            .from('daily_plans')
            .insert({
              user_id: userId,
              roadmap_id: roadmapId,
              module_id: moduleId,
              day_number: day,
              plan_date: planDate.toISOString().split('T')[0],
              focus_topic: milestone.topics[0] || 'Focus Study',
              is_completed: false,
            })
            .select()
            .single();

          if (!planError && planData) {
            const tasksPayload = tasksByDay[day].map(t => ({
              user_id: userId,
              plan_id: planData.id,
              module_id: moduleId,
              title: t.title,
              description: t.description,
              task_type: t.task_type,
              estimated_minutes: t.estimated_minutes,
              status: 'pending',
            }));
            await userClient.from('tasks').insert(tasksPayload);
          }
        }
      }
    }

    // 5. Seed progress tracker log entry
    await userClient.from('progress').insert({
      user_id: userId,
      roadmap_id: roadmapId,
      completion_percentage: 0,
      completed_tasks: 0,
      total_tasks: totalTasksCount,
      completed_modules: 0,
      total_modules: roadmap.milestones.length,
      current_streak: 0,
      longest_streak: 0,
      activity_log: [],
    });

    logger.info(`Successfully completed onboarding setup for goal: ${goalId}`);
    return goalData;
  }

  /**
   * Retrieves all goals created by a user, ordered newest first.
   */
  public static async getGoals(userId: string, token?: string): Promise<any[]> {
    const userClient = getSupabaseClient(token);
    const { data, error } = await userClient
      .from('learning_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch goals', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, error);
    }
    return data || [];
  }

  /**
   * Retrieves details of a specific goal.
   */
  public static async getGoalDetails(userId: string, goalId: string, token?: string): Promise<any> {
    const userClient = getSupabaseClient(token);
    const { data, error } = await userClient
      .from('learning_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new AppError('Goal details not found', 404, ErrorCode.NOT_FOUND, true, error);
    }
    return data;
  }

  /**
   * Updates core properties of a learning goal.
   */
  public static async updateGoal(
    userId: string,
    goalId: string,
    input: {
      title?: string;
      description?: string;
      skill_level?: string;
      hours_per_week?: number;
      target_date?: string;
    },
    token?: string
  ): Promise<any> {
    const userClient = getSupabaseClient(token);

    // Fetch existing goal first to verify ownership
    await this.getGoalDetails(userId, goalId, token);

    const updatePayload: any = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.raw_goal = input.description;
    if (input.skill_level !== undefined) updatePayload.skill_level = input.skill_level;
    if (input.hours_per_week !== undefined) updatePayload.hours_per_week = input.hours_per_week;
    if (input.target_date !== undefined) updatePayload.target_date = input.target_date;

    const { data, error } = await userClient
      .from('learning_goals')
      .update(updatePayload)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update goal', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, error);
    }
    return data;
  }

  /**
   * Deletes a goal and performs manual cascades: removes progress, plans, resources, modules and roadmaps.
   */
  public static async deleteGoal(userId: string, goalId: string, token?: string): Promise<void> {
    const userClient = getSupabaseClient(token);

    // Verify ownership
    await this.getGoalDetails(userId, goalId, token);

    logger.info(`Starting deletion cascade for learning goal: ${goalId}`);

    // Query roadmap referencing this goal
    const { data: roadmaps, error: rmQueryError } = await userClient
      .from('roadmaps')
      .select('id')
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (rmQueryError) {
      throw new AppError('Error querying linked roadmaps', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, rmQueryError);
    }

    const roadmapIds = (roadmaps || []).map(r => r.id);

    if (roadmapIds.length > 0) {
      // 1. Delete public.progress linked to roadmaps
      await userClient.from('progress').delete().in('roadmap_id', roadmapIds);

      // Query module IDs linked to roadmaps
      const { data: modules, error: modQueryError } = await userClient
        .from('roadmap_modules')
        .select('id')
        .in('roadmap_id', roadmapIds);

      if (!modQueryError && modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);

        // 2. Delete project_progress linked to projects in these modules
        const { data: projects } = await userClient
          .from('projects')
          .select('id')
          .in('module_id', moduleIds);

        if (projects && projects.length > 0) {
          const projectIds = projects.map(p => p.id);
          await userClient.from('project_progress').delete().in('project_id', projectIds);
          // 3. Delete projects
          await userClient.from('projects').delete().in('id', projectIds);
        }

        // 4. Delete tasks
        await userClient.from('tasks').delete().in('module_id', moduleIds);

        // 5. Delete resources
        await userClient.from('resources').delete().in('module_id', moduleIds);

        // 6. Delete daily_plans
        await userClient.from('daily_plans').delete().in('roadmap_id', roadmapIds);

        // 7. Delete modules
        await userClient.from('roadmap_modules').delete().in('id', moduleIds);
      }

      // 8. Delete roadmaps
      await userClient.from('roadmaps').delete().in('id', roadmapIds);
    }

    // 9. Delete goal
    const { error: deleteGoalErr } = await userClient
      .from('learning_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (deleteGoalErr) {
      throw new AppError('Failed to delete goal', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, deleteGoalErr);
    }

    logger.info(`Completed deletion cascade for learning goal: ${goalId}`);
  }
}
