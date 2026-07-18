import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getSupabaseClient } from '../lib/supabase';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';

const router = Router();

/**
 * GET /api/resources
 * Returns all resources for the authenticated user.
 * Optional query param: ?type=article|video|course|documentation|tool
 */
router.get('/', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
    }

    const token = req.headers.authorization?.split(' ')[1];
    const userClient = getSupabaseClient(token);

    // Optional filter by resource_type
    const typeFilter = req.query.type as string | undefined;

    const validTypes = ['article', 'video', 'course', 'documentation', 'tool'];

    let query = userClient
      .from('resources')
      .select(`
        id,
        module_id,
        title,
        url,
        resource_type,
        estimated_minutes,
        why_recommended,
        is_completed,
        created_at,
        roadmap_modules (
          id,
          title,
          sequence_number
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // Apply type filter only if it is a valid enum value
    if (typeFilter && validTypes.includes(typeFilter.toLowerCase())) {
      query = query.eq('resource_type', typeFilter.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError('Failed to fetch resources', 500, ErrorCode.INTERNAL_SERVER_ERROR, true, error);
    }

    sendSuccess(res, data || [], 200);
    return;
  } catch (error) {
    next(error);
  }
});

export default router;
