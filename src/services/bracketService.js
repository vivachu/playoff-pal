import * as Match from '../models/Match.js';
import * as MatchPlayer from '../models/MatchPlayer.js';
import * as Player from '../models/Player.js';
import * as Team from '../models/Team.js';

const MATCH_DURATION_MS = 20 * 60 * 1000; // 20 minutes

/**
 * Generate the full bracket for a tournament and auto-assign active players.
 * Called when the creator presses START TOURNAMENT.
 *
 * @param {object} tournament - Tournament row (must have id, num_teams, start_datetime, location, theme)
 * @returns {Promise<void>}
 */
export async function generateBracket(tournament) {
  const { id: tournament_id, num_teams, start_datetime, location, active_players_per_side } = tournament;
  const totalRounds = Math.log2(num_teams);

  const teams = await Team.findByTournament(tournament_id);
  // Shuffle teams for random seeding
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i++) {
    await Team.update(shuffled[i].id, { seed: i + 1 });
  }

  // Build matches for every round (team slots for later rounds start null)
  let matchTime = new Date(start_datetime);
  let matchCounter = 1;

  // Round 1 pairings: seed 1 vs seed num_teams, seed 2 vs seed num_teams-1, etc.
  const round1Pairs = [];
  for (let i = 0; i < num_teams / 2; i++) {
    round1Pairs.push({ home: shuffled[i], away: shuffled[num_teams - 1 - i] });
  }

  const allMatchIds = {}; // round -> [matchId, ...]

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = num_teams / Math.pow(2, round);
    allMatchIds[round] = [];

    for (let pos = 1; pos <= matchesInRound; pos++) {
      const schedStart = new Date(matchTime);
      const deadline = new Date(schedStart.getTime() + MATCH_DURATION_MS + 60 * 60 * 1000);

      let homeTeamId = null;
      let awayTeamId = null;

      if (round === 1) {
        const pair = round1Pairs[pos - 1];
        homeTeamId = pair.home.id;
        awayTeamId = pair.away.id;
      }
      // Later rounds: teams are filled when winners advance

      const matchId = await Match.create({
        tournament_id,
        round_number: round,
        match_number: pos,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        location,
        scheduled_start: schedStart,
        score_report_deadline: deadline,
      });

      allMatchIds[round].push(matchId);
      matchTime = new Date(matchTime.getTime() + MATCH_DURATION_MS);
      matchCounter++;
    }
  }

  // Auto-assign players for Round 1
  const round1MatchIds = allMatchIds[1];
  for (let i = 0; i < round1MatchIds.length; i++) {
    const matchId = round1MatchIds[i];
    const pair = round1Pairs[i];

    for (const team of [pair.home, pair.away]) {
      await assignPlayersForMatch(matchId, team.id, 1, active_players_per_side);
    }
  }
}

/**
 * Advance the winner of a completed match into the next round.
 * Finds the correct slot in the next-round match and fills it in.
 *
 * @param {object} completedMatch - Match row with round_number and match_number
 * @param {number} winnerTeamId
 * @returns {Promise<void>}
 */
export async function advanceWinner(completedMatch, winnerTeamId) {
  const { tournament_id, round_number, match_number } = completedMatch;

  const nextRound = round_number + 1;
  const nextMatchNumber = Math.ceil(match_number / 2);

  const [nextMatch] = (await Match.findByRound(tournament_id, nextRound))
    .filter(m => m.match_number === nextMatchNumber);

  if (!nextMatch) return; // Was the championship — no further round

  // Odd match_number → home slot; even → away slot
  if (match_number % 2 === 1) {
    await Match.assignTeams(nextMatch.id, { home_team_id: winnerTeamId });
  } else {
    await Match.assignTeams(nextMatch.id, { away_team_id: winnerTeamId });
  }

  // Auto-assign players for the next match once both slots are filled
  const updated = await Match.findById(nextMatch.id);
  if (updated.home_team_id && updated.away_team_id) {
    const tournament = { active_players_per_side: updated.active_players_per_side };
    // Re-fetch from tournament join is handled by the caller; use a simple lookup here
    const [homeTeam, awayTeam] = await Promise.all([
      Team.findById(updated.home_team_id),
      Team.findById(updated.away_team_id),
    ]);

    // Determine players_per_side from existing match_players of the previous round (fallback: 1)
    const prevHomePlayers = await MatchPlayer.findByMatchAndTeam(completedMatch.id, completedMatch.home_team_id);
    const playersPerSide = prevHomePlayers.length || 1;

    for (const team of [homeTeam, awayTeam]) {
      await assignPlayersForMatch(updated.id, team.id, nextRound, playersPerSide);
    }
  }
}

/**
 * Auto-assign active players for one team in one match using the rotation algorithm.
 * Round 1: first N players by rotation_slot. Subsequent rounds: rotate past those who played last round.
 *
 * @param {number} matchId
 * @param {number} teamId
 * @param {number} roundNumber
 * @param {number} playersPerSide
 * @returns {Promise<void>}
 */
export async function assignPlayersForMatch(matchId, teamId, roundNumber, playersPerSide) {
  const approved = await Player.findByTeam(teamId);
  const eligible = approved.filter(p => p.status === 'approved');
  if (!eligible.length) return;

  // Build rotation order: deterministic shuffle based on player id (stable across rounds)
  // On first call the order is "random" — we use the order already in the DB (by id, set at signup)
  // For subsequent rounds we rotate past the last active players
  let rotation = [...eligible];

  if (roundNumber > 1) {
    // Find players who were active in round (roundNumber - 1) for this team
    const prevMatches = await Match.findByRound(
      (await Match.findById(matchId)).tournament_id,
      roundNumber - 1,
    );
    const prevMatchForTeam = prevMatches.find(
      m => m.home_team_id === teamId || m.away_team_id === teamId,
    );
    if (prevMatchForTeam) {
      const prevActive = await MatchPlayer.findByMatchAndTeam(prevMatchForTeam.id, teamId);
      const prevActiveIds = new Set(prevActive.map(mp => mp.player_id));
      // Move previously-active players to the end of the rotation
      const notPlayed = rotation.filter(p => !prevActiveIds.has(p.id));
      const played    = rotation.filter(p =>  prevActiveIds.has(p.id));
      rotation = [...notPlayed, ...played];
    }
  }

  // Take the first playersPerSide from the rotation
  const selected = rotation.slice(0, playersPerSide);

  // Clear any existing assignments for this team in this match
  await MatchPlayer.deleteByMatchAndTeam(matchId, teamId);

  for (let i = 0; i < selected.length; i++) {
    await MatchPlayer.create({
      match_id: matchId,
      player_id: selected[i].id,
      team_id: teamId,
      rotation_slot: i + 1,
    });
  }
}

/**
 * Organise a flat array of match rows into a nested bracket structure for rendering.
 * @param {object[]} matches - All matches for a tournament
 * @param {number} totalRounds
 * @returns {Array<{ round: number, label: string, matches: object[] }>}
 */
export function buildBracketView(matches, totalRounds) {
  const rounds = [];
  for (let r = 1; r <= totalRounds; r++) {
    rounds.push({
      round: r,
      label: r === totalRounds ? 'Championship' : `Round ${r}`,
      matches: matches.filter(m => m.round_number === r),
    });
  }
  return rounds;
}
