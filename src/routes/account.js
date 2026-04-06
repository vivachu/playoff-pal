import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { showEdit, submitEdit } from '../controllers/accountController.js';

const router = Router();

router.use(requireAuth);

router.get('/edit',  showEdit);
router.post('/edit', submitEdit);

export default router;
