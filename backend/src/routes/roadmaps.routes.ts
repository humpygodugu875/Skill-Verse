import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getSupabaseClient } from '../lib/supabase';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';

const router = Router();

router.get('/active', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
    }
    const token = req.headers.authorization?.split(' ')[1];
    const userClient = getSupabaseClient(token);

    // Fetch latest active roadmap
    const { data: roadmap, error: rmError } = await userClient
      .from('roadmaps')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rmError) {
      throw new AppError('Database query failed', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, rmError);
    }

    if (!roadmap) {
      sendSuccess(res, null, 200);
      return;
    }

    // Fetch modules
    const { data: modules, error: modError } = await userClient
      .from('roadmap_modules')
      .select('*')
      .eq('roadmap_id', roadmap.id)
      .order('sequence_number', { ascending: true });

    if (modError) {
      throw new AppError('Failed to fetch modules', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, modError);
    }

    // Assemble module resources & projects
    const milestones = [];
    for (const m of modules || []) {
      const { data: resources } = await userClient
        .from('resources')
        .select('*')
        .eq('module_id', m.id);

      const { data: project } = await userClient
        .from('projects')
        .select('*')
        .eq('module_id', m.id)
        .maybeSingle();

      milestones.push({
        ...m,
        // Ensure learning_objectives and topics are arrays of strings matching standard expectations
        learning_objectives: Array.isArray(m.topics) ? m.topics : [], 
        resources: resources || [],
        project: project || null,
      });
    }

    sendSuccess(res, {
      ...roadmap,
      milestones,
    }, 200);
    return;
  } catch (error) {
    next(error);
  }
});

export default router;
