import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  showHome,
  showCreate,
  createTournament,
  showTournament,
  publish,
  startTournament,
  updateMatchSchedule,
  creatorSetWinner,
} from '../controllers/tournamentController.js';

const router = Router();

// Home / public feed
router.get('/', showHome);

// Tournament detail — public
router.get('/t/:shareCode', showTournament);

// Create wizard — auth required
router.get('/tournaments/create', requireAuth, showCreate);
router.post('/tournaments',       requireAuth, createTournament);

// State transitions — auth required
router.post('/tournaments/:id/publish',        requireAuth, publish);
router.post('/tournaments/:id/start',          requireAuth, startTournament);
router.post('/tournaments/:id/matches/:matchId/schedule', requireAuth, updateMatchSchedule);
router.post('/tournaments/:id/matches/:matchId/winner',   requireAuth, creatorSetWinner);

export default router;
