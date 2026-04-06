import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { signup, approveOrDeny, updateMatchPlayers } from '../controllers/playerController.js';

const router = Router();

// Public signup — player must be logged in but tournament is public
router.post('/teams/:teamId/players', requireAuth, signup);

// Approval — creator or captain
router.patch('/players/:id/status', requireAuth, approveOrDeny);

// Captain/creator match player override
router.put('/matches/:matchId/teams/:teamId/players', requireAuth, updateMatchPlayers);

export default router;
