import { Router } from 'express';
import { handleTwilioInbound } from '../controllers/webhookController.js';

const router = Router();

// Twilio sends application/x-www-form-urlencoded
router.post('/twilio', handleTwilioInbound);

export default router;
