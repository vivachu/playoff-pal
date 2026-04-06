import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { rulesGen, teamNames } from '../controllers/aiController.js';

const router = Router();

router.use(requireAuth);

router.post('/rules-gen',   rulesGen);
router.post('/team-names',  teamNames);

export default router;
