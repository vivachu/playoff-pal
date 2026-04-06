import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createTeams, updateTeam } from '../controllers/teamController.js';

const router = Router();

router.use(requireAuth);

router.post('/tournaments/:tournamentId/teams',     createTeams);
router.patch('/tournaments/:tournamentId/teams/:id', updateTeam);

export default router;
