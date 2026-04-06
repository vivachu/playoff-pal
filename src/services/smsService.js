import pool from '../config/db.js';
import twilioClient, { twilioPhoneNumber } from '../config/twilio.js';

// ── Opt-out guard ─────────────────────────────────────────────────────────────

/**
 * Check whether a phone number is currently opted out of non-OTP SMS.
 * A user is opted out when their most recent sms_opt_outs row has opted_in_at IS NULL
 * or opted_out_at > opted_in_at.
 * @param {string} phoneNumber E.164 format
 * @returns {Promise<boolean>}
 */
async function isOptedOut(phoneNumber) {
  const [rows] = await pool.query(
    'SELECT opted_out_at, opted_in_at FROM sms_opt_outs WHERE phone_number = ? ORDER BY opted_out_at DESC LIMIT 1',
    [phoneNumber],
  );
  if (!rows.length) return false;
  const { opted_out_at, opted_in_at } = rows[0];
  if (!opted_in_at) return true;
  return new Date(opted_out_at) > new Date(opted_in_at);
}

/**
 * Record an opt-out for a phone number.
 * @param {number} user_id
 * @param {string} phoneNumber
 * @param {'stop_reply'|'account_settings'} source
 * @returns {Promise<void>}
 */
export async function recordOptOut(user_id, phoneNumber, source) {
  await pool.query(
    'INSERT INTO sms_opt_outs (user_id, phone_number, opted_out_at, source) VALUES (?, ?, NOW(), ?)',
    [user_id, phoneNumber, source],
  );
}

/**
 * Record an opt-in (re-subscribe) for a phone number.
 * @param {string} phoneNumber
 * @returns {Promise<void>}
 */
export async function recordOptIn(phoneNumber) {
  await pool.query(
    'UPDATE sms_opt_outs SET opted_in_at = NOW() WHERE phone_number = ? AND opted_in_at IS NULL',
    [phoneNumber],
  );
}

// ── Core send ─────────────────────────────────────────────────────────────────

/**
 * Send an SMS, honouring the opt-out table for non-OTP messages.
 * @param {string} to E.164 phone number
 * @param {string} body Message text
 * @param {{ isOtp?: boolean }} [opts]
 * @returns {Promise<void>}
 */
export async function sendSms(to, body, { isOtp = false } = {}) {
  if (!isOtp) {
    const optedOut = await isOptedOut(to);
    if (optedOut) return;
  }
  await twilioClient.messages.create({ to, from: twilioPhoneNumber, body });
}

// ── SMS templates ─────────────────────────────────────────────────────────────

/**
 * Send OTP verification code (always delivered — OTP is exempt from opt-out).
 * @param {string} to
 * @param {string} code
 * @returns {Promise<void>}
 */
export async function sendOtp(to, code) {
  const body =
    `Your Playoff Pal verification code is ${code}. Let the games begin! 🎮\n\n` +
    `By verifying your number, you agree to receive automated updates, notifications, ` +
    `and promotional messages from Playoff Pal. Message and data rates may apply. ` +
    `Reply STOP to opt-out at any time.`;
  await sendSms(to, body, { isOtp: true });
}

/**
 * Notify the tournament creator that a new player has requested to join.
 * @param {string} to Creator's phone
 * @param {{ playerName: string, teamName: string, tournamentName: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendNewSignupRequest(to, { playerName, teamName, tournamentName }) {
  const body =
    `New challenger! ${playerName} wants to join ${teamName} in ${tournamentName}. ` +
    `Reply YES to accept or NO to deny! Go, team, go! 🚀`;
  await sendSms(to, body);
}

/**
 * Tell a newly approved player they're in.
 * @param {string} to Player's phone
 * @param {{ teamName: string, tournamentName: string, shareUrl: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendSignupAccepted(to, { teamName, tournamentName, shareUrl }) {
  const body =
    `You're IN! 🎉 Welcome to ${teamName} for ${tournamentName}. ` +
    `Share this link ${shareUrl} to help fill the rest of the bracket! See you on the court! 🏆`;
  await sendSms(to, body);
}

/**
 * Tell existing team members that someone new joined.
 * @param {string} to Existing team member's phone
 * @param {{ playerName: string, teamName: string, tournamentName: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendNewMemberJoined(to, { playerName, teamName, tournamentName }) {
  const body =
    `Team Update! 🚨 ${playerName} has just joined ${teamName} for the ${tournamentName}. Hype is real! 🔥`;
  await sendSms(to, body);
}

/**
 * Tell the creator all teams have hit the minimum player count.
 * @param {string} to Creator's phone
 * @param {{ tournamentName: string, link: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendMinPlayersReached(to, { tournamentName, link }) {
  const body =
    `The teams are full! 🥳 The minimum number of players for the ${tournamentName} has been reached. ` +
    `Click the START TOURNAMENT button to create the playoff bracket: ${link}`;
  await sendSms(to, body);
}

/**
 * Notify all players that the tournament is starting and send Round 1 details.
 * @param {string} to Player's phone
 * @param {{ tournamentName: string, date: string, time: string, location: string, bracketLink: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendTournamentStart(to, { tournamentName, date, time, location, bracketLink }) {
  const body =
    `IT'S GAME TIME! 🗓 Your first match in the ${tournamentName} is ${date} at ${time} in ${location}. ` +
    `Check the bracket: ${bracketLink}. May the best team win! 🥳`;
  await sendSms(to, body);
}

/**
 * Send 1-hour pre-round reminder to all players.
 * @param {string} to Player's phone
 * @param {{ roundNumber: number, tournamentName: string, time: string, location: string, link: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendRoundReminder(to, { roundNumber, tournamentName, time, location, link }) {
  const body =
    `1 HOUR WARNING! 🔔 Round ${roundNumber} of ${tournamentName} kicks off soon! ` +
    `Be there by ${time} at ${location}. Get ready! ${link}`;
  await sendSms(to, body);
}

/**
 * Notify active match players of the game result.
 * @param {string} to Player's phone
 * @param {{ winnerName: string, loserName: string, roundNumber: number, tournamentName: string, link: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendGameResult(to, { winnerName, loserName, roundNumber, tournamentName, link }) {
  const body =
    `Score Alert! 📣 ${winnerName} defeats ${loserName} in Round ${roundNumber} of ${tournamentName}! ` +
    `${winnerName} advances! Who will they face next? ${link}`;
  await sendSms(to, body);
}

/**
 * Tell all players a round has completed and the next is set.
 * @param {string} to Player's phone
 * @param {{ roundNumber: number, tournamentName: string, link: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendRoundComplete(to, { roundNumber, tournamentName, link }) {
  const body =
    `Round ${roundNumber} Complete! ✅ The bracket is set for the next round of ${tournamentName}. ` +
    `Get hyped for the matchups! ${link}`;
  await sendSms(to, body);
}

/**
 * Announce the tournament champion to everyone.
 * @param {string} to Recipient's phone
 * @param {{ winnerName: string, tournamentName: string, prizeName: string, link: string }} ctx
 * @returns {Promise<void>}
 */
export async function sendTournamentWinner(to, { winnerName, tournamentName, prizeName, link }) {
  const body =
    `CHAMPIONS! 🥇 ${winnerName} has won the ${tournamentName} and the ${prizeName}! ` +
    `Unbelievable tournament! View the final bracket: ${link}`;
  await sendSms(to, body);
}
