import twilio from 'twilio';
import pool from '../config/db.js';
import * as User from '../models/User.js';
import * as Player from '../models/Player.js';
import * as Team from '../models/Team.js';
import * as Tournament from '../models/Tournament.js';
import { recordOptOut, recordOptIn } from '../services/smsService.js';

const STOP_WORDS  = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
const START_WORDS = new Set(['START', 'UNSTOP']);

/**
 * POST /webhooks/twilio — handle inbound SMS from Twilio.
 * Validates Twilio signature, then routes YES/NO/STOP/START keywords.
 */
export async function handleTwilioInbound(req, res) {
  // Validate Twilio signature
  const signature  = req.headers['x-twilio-signature'];
  const url        = process.env.TWILIO_WEBHOOK_URL;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;

  if (url && authToken) {
    const valid = twilio.validateRequest(authToken, signature, url, req.body);
    if (!valid) return res.status(403).send('Forbidden');
  }

  const from = req.body.From;  // E.164 sender phone
  const body = (req.body.Body || '').trim().toUpperCase();

  // Respond immediately — Twilio expects a fast 200
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');

  // Handle asynchronously after responding
  setImmediate(async () => {
    try {
      await processInbound(from, body);
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  });
}

async function processInbound(from, body) {
  const sender = await User.findByPhone(from);

  // ── STOP / opt-out keywords ──────────────────────────────────────────────
  if (STOP_WORDS.has(body)) {
    if (sender) await recordOptOut(sender.id, from, 'stop_reply');
    return;
  }

  // ── START / opt-in keywords ──────────────────────────────────────────────
  if (START_WORDS.has(body)) {
    await recordOptIn(from);
    return;
  }

  if (!sender) return; // unknown number — ignore

  // ── YES / NO approval ────────────────────────────────────────────────────
  if (body !== 'YES' && body !== 'NO') return;

  const newStatus = body === 'YES' ? 'approved' : 'denied';

  // Check if sender is a tournament creator
  // Find most recent tournament where sender is creator and has a pending player
  const [creatorRows] = await pool.query(
    `SELECT DISTINCT t.id FROM tournaments t
     JOIN teams tm ON tm.tournament_id = t.id
     JOIN players p ON p.team_id = tm.id
     WHERE t.creator_user_id = ? AND p.status = 'pending'
     ORDER BY p.created_at DESC LIMIT 1`,
    [sender.id],
  );

  if (creatorRows.length) {
    const tournament = await Tournament.findById(creatorRows[0].id);
    const pending = await Player.findLatestPendingByTournament(tournament.id);
    if (pending) {
      await Player.updateStatus(pending.id, newStatus);
      // Full post-approval notifications are handled by the playerController on web;
      // SMS webhook approvals are intentionally lightweight.
    }
    return;
  }

  // Check if sender is a team captain
  const [captainRows] = await pool.query(
    `SELECT p.team_id FROM players p
     WHERE p.user_id = ? AND p.is_captain = 1
     LIMIT 1`,
    [sender.id],
  );

  if (captainRows.length) {
    const team = await Team.findById(captainRows[0].team_id);
    const pending = await Player.findLatestPendingByTeam(team.id);
    if (pending) {
      await Player.updateStatus(pending.id, newStatus);
    }
  }
}
