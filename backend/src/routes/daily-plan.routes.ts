import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { dailyPlanValidator } from '../validators/daily-plan.validator';
import { DailyPlanController } from '../controllers/daily-plan.controller';

const router = Router();

// Protect GET /daily-plan route with auth check and date format validation
router.get('/', requireAuth, dailyPlanValidator, validateRequest, DailyPlanController.getDailyPlan);

export default router;
