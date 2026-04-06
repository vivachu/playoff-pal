import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { reportScore } from '../controllers/matchController.js';

const router = Router();

router.post('/:id/score-report', requireAuth, reportScore);

export default router;
