import * as Match from '../models/Match.js';
import * as ScoreReport from '../models/ScoreReport.js';
import * as Team from '../models/Team.js';
import * as Player from '../models/Player.js';
import * as MatchPlayer from '../models/MatchPlayer.js';
import * as Tournament from '../models/Tournament.js';
import * as User from '../models/User.js';
import * as smsService from './smsService.js';
import { advanceWinner } from './bracketService.js';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/**
 * Handle a score report submission from one team.
 * Applies resolution rules in priority order and advances the winner if confirmed.
 *
 * @param {{ matchId: number, reportingTeamId: number, reportedByUserId: number, homeScore: number, awayScore: number, reportedWinnerTeamId: number }} params
 * @returns {Promise<{ resolved: boolean, winnerId: number|null }>}
 */
export async function handleScoreReport({
  matchId, reportingTeamId, reportedByUserId,
  homeScore, awayScore, reportedWinnerTeamId,
}) {
  await ScoreReport.create({
    match_id: matchId,
    reporting_team_id: reportingTeamId,
    reported_by_user_id: reportedByUserId,
    home_score: homeScore,
    away_score: awayScore,
    reported_winner_team_id: reportedWinnerTeamId,
  });

  const match = await Match.findById(matchId);
  const reports = await ScoreReport.findByMatch(matchId);

  if (reports.length < 2) {
    // Only one team has reported — wait for the other or deadline
    return { resolved: false, winnerId: null };
  }

  const [r1, r2] = reports;

  // Rule 1: both teams agree on the winner → auto-confirm
  if (r1.reported_winner_team_id === r2.reported_winner_team_id) {
    await resolveMatch(match, r1.reported_winner_team_id);
    return { resolved: true, winnerId: r1.reported_winner_team_id };
  }

  // Both teams reported but disagree → disputed
  await Match.updateStatus(matchId, 'disputed');
  return { resolved: false, winnerId: null };
}

/**
 * Check matches past their score_report_deadline and resolve any that are still pending.
 * Rule 2: one team reported and deadline passed → use that report.
 * Rule 3: neither team reported → notify creator.
 * Called by a scheduled job or triggered from a route.
 *
 * @param {number} tournamentId
 * @returns {Promise<void>}
 */
export async function resolveExpiredMatches(tournamentId) {
  const allMatches = await Match.findByTournament(tournamentId);
  const now = new Date();

  for (const match of allMatches) {
    if (match.status !== 'scheduled' && match.status !== 'active') continue;
    if (!match.score_report_deadline || new Date(match.score_report_deadline) > now) continue;

    const reports = await ScoreReport.findByMatch(match.id);
    const tournament = await Tournament.findById(tournamentId);

    if (reports.length === 1) {
      // Rule 2: solo report stands
      await resolveMatch(match, reports[0].reported_winner_team_id);
    } else if (reports.length === 0) {
      // Rule 3: notify creator
      const creator = await User.findById(tournament.creator_user_id);
      const link = `${BASE_URL}/t/${tournament.share_code}#bracket`;
      await smsService.sendSms(
        creator.phone_number,
        `No score reported for a match in ${tournament.title}. Please set the winner: ${link}`,
      );
    }
  }
}

/**
 * Creator override: manually set the winner for any match.
 * @param {number} matchId
 * @param {number} winnerTeamId
 * @returns {Promise<void>}
 */
export async function creatorOverride(matchId, winnerTeamId) {
  const match = await Match.findById(matchId);
  await resolveMatch(match, winnerTeamId, true);
}

// ── Internal ──────────────────────────────────────────────────────────────────

/**
 * Mark a match as completed, update team status, advance winner, and send SMS notifications.
 * @param {object} match
 * @param {number} winnerTeamId
 * @param {boolean} [isOverride=false]
 * @returns {Promise<void>}
 */
async function resolveMatch(match, winnerTeamId, isOverride = false) {
  await Match.setWinner(match.id, winnerTeamId, isOverride);

  const loserTeamId = match.home_team_id === winnerTeamId ? match.away_team_id : match.home_team_id;
  await Team.updateStatus(winnerTeamId, 'active');   // still active until championship
  await Team.updateStatus(loserTeamId, 'eliminated');

  const tournament = await Tournament.findById(match.tournament_id);
  const totalRounds = Math.log2(tournament.num_teams);
  const link = `${BASE_URL}/t/${tournament.share_code}#bracket`;

  const winnerTeam = await Team.findById(winnerTeamId);
  const loserTeam  = await Team.findById(loserTeamId);

  // SMS active players from both teams
  const activePlayers = await MatchPlayer.findByMatch(match.id);
  for (const mp of activePlayers) {
    await smsService.sendGameResult(mp.phone_number, {
      winnerName: winnerTeam.name,
      loserName: loserTeam.name,
      roundNumber: match.round_number,
      tournamentName: tournament.title,
      link,
    });
  }

  // Advance winner to next round
  await advanceWinner(match, winnerTeamId);

  // Check if the whole round is done
  const roundMatches = await Match.findByRound(match.tournament_id, match.round_number);
  const allDone = roundMatches.every(m => m.status === 'completed' || m.id === match.id);

  if (allDone) {
    // Championship won?
    if (match.round_number === totalRounds) {
      await Tournament.updateStatus(tournament.id, 'ended');
      await Team.updateStatus(winnerTeamId, 'winner');

      const allPlayers = await Player.findApprovedByTournament(tournament.id);
      const prizeName = tournament.prize_name || 'Bragging Rights';
      for (const player of allPlayers) {
        await smsService.sendTournamentWinner(player.phone_number, {
          winnerName: winnerTeam.name,
          tournamentName: tournament.title,
          prizeName,
          link,
        });
      }
    } else {
      // Round complete — notify everyone
      const allPlayers = await Player.findApprovedByTournament(tournament.id);
      for (const player of allPlayers) {
        await smsService.sendRoundComplete(player.phone_number, {
          roundNumber: match.round_number,
          tournamentName: tournament.title,
          link,
        });
      }
    }
  }
}
