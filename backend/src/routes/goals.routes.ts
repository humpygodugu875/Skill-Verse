import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { goalsValidator, goalUpdateValidator } from '../validators/goals.validator';
import { GoalController } from '../controllers/goals.controller';

const router = Router();

// Apply auth gate universally across goals routes
router.use(requireAuth);

router.post('/', goalsValidator, validateRequest, GoalController.createGoal);
router.get('/', GoalController.getGoals);
router.get('/:id', GoalController.getGoalDetails);
router.put('/:id', goalUpdateValidator, validateRequest, GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

export default router;
