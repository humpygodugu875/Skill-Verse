import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/responses';
import { AppError, ErrorCode } from '../utils/errors';
import { QuizService } from '../services/quiz.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/quiz/current
 * Returns an AI-generated quiz for the user's current active milestone.
 * Re-uses an existing quiz if one already exists for the same module.
 */
router.get('/current', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);

    const token = req.headers.authorization?.split(' ')[1];

    logger.info(`[QuizController] GET /current for user: ${userId}`);

    const quiz = await QuizService.getCurrentQuiz(userId, token);

    sendSuccess(res, quiz, 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quiz/submit
 * Submits the user's answers and returns scored results.
 *
 * Body: { quizId: string, answers: Record<questionId, selectedIndex> }
 */
router.post('/submit', requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);

    const { quizId, answers } = req.body;

    if (!quizId || typeof quizId !== 'string') {
      throw AppError.badRequest('Request body must include a valid "quizId" string.');
    }

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw AppError.badRequest(
        'Request body must include "answers" as an object mapping question IDs to selected option index (0-based).'
      );
    }

    const token = req.headers.authorization?.split(' ')[1];

    logger.info(`[QuizController] POST /submit quizId=${quizId} for user: ${userId}`);

    const result = await QuizService.submitQuiz(userId, quizId, answers, token);

    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
});

export default router;
