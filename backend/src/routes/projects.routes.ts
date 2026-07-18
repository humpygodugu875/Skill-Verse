import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getSupabaseClient } from '../lib/supabase';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';
import { ProjectMentorService } from '../services/project-mentor.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/projects
 * Returns all projects for the authenticated user across all milestones.
 */
router.get('/', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);

    const token = req.headers.authorization?.split(' ')[1];
    const client = getSupabaseClient(token);

    const { data, error } = await client
      .from('projects')
      .select(`
        id,
        module_id,
        title,
        description,
        requirements,
        tech_stack,
        steps,
        estimated_hours,
        created_at,
        roadmap_modules (
          id,
          title,
          sequence_number
        ),
        project_progress (
          id,
          status,
          started_at,
          completed_at,
          steps_completed,
          qa_history
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch projects', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, error);
    }

    sendSuccess(res, data || [], 200);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId
 * Returns a single project with its progress and chat history.
 */
router.get('/:projectId', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);

    const { projectId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const client = getSupabaseClient(token);

    const { data: project, error } = await client
      .from('projects')
      .select(`
        id,
        module_id,
        title,
        description,
        requirements,
        tech_stack,
        steps,
        estimated_hours,
        roadmap_modules (
          id,
          title,
          sequence_number,
          topics
        ),
        project_progress (
          id,
          status,
          steps_completed,
          qa_history
        )
      `)
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      throw AppError.notFound(`Project not found: ${projectId}`);
    }

    sendSuccess(res, project, 200);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/chat
 * Retrieves the full conversation history for a project.
 */
router.get('/:projectId/chat', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);

    const { projectId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    logger.info(`[ProjectChat] GET history for project: ${projectId}, user: ${userId}`);

    const history = await ProjectMentorService.getHistory(userId, projectId, token);

    sendSuccess(res, { history }, 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:projectId/chat
 * Sends a user message to the Socratic mentor and returns an AI reply.
 *
 * Request body: { "message": "..." }
 * Response:     { "reply": "...", "history": [...] }
 */
router.post('/:projectId/chat', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);

    const { projectId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw AppError.badRequest('Request body must include a non-empty "message" string.');
    }

    if (message.trim().length > 2000) {
      throw AppError.badRequest('Message must not exceed 2000 characters.');
    }

    const token = req.headers.authorization?.split(' ')[1];

    logger.info(`[ProjectChat] POST message for project: ${projectId}, user: ${userId}`);

    const result = await ProjectMentorService.sendMessage(
      userId,
      projectId,
      message.trim(),
      token
    );

    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
});

export default router;
