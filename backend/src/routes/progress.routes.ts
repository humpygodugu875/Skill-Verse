import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getSupabaseClient } from '../lib/supabase';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';

const router = Router();

router.get('/', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
    }
    const token = req.headers.authorization?.split(' ')[1];
    const userClient = getSupabaseClient(token);

    // Query active progress
    const { data: progress, error } = await userClient
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AppError('Database failure fetching progress', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, error);
    }

    if (!progress) {
      // Return fresh empty telemetry
      sendSuccess(res, {
        completion_percentage: 0,
        completed_tasks: 0,
        total_tasks: 0,
        completed_modules: 0,
        total_modules: 0,
        current_streak: 0,
        longest_streak: 0,
        activity_log: []
      }, 200);
      return;
    }

    sendSuccess(res, progress, 200);
    return;
  } catch (error) {
    next(error);
  }
});

export default router;
