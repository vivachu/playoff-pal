import * as Tournament from '../models/Tournament.js';
import * as Team from '../models/Team.js';
import * as Player from '../models/Player.js';
import * as Match from '../models/Match.js';
import * as MatchPlayer from '../models/MatchPlayer.js';
import * as User from '../models/User.js';
import * as TournamentTheme from '../models/TournamentTheme.js';
import { getAvatarUrl } from '../services/avatarService.js';
import { buildBracketView, generateBracket } from '../services/bracketService.js';
import { creatorOverride } from '../services/scoreService.js';
import * as smsService from '../services/smsService.js';
import { encodeId } from '../services/shareCodeService.js';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/** GET / — home screen with user's tournaments and public feed */
export async function showHome(req, res) {
  const user = req.session.userId ? await User.findById(req.session.userId) : null;
  const publicTournaments = await Tournament.findPublic();
  const myTournaments = user ? await Tournament.findByCreator(user.id) : [];
  const avatarUrl = user ? getAvatarUrl(user.first_name, user.last_name) : null;

  res.render('home/index', {
    title: 'Playoff Pal',
    user,
    avatarUrl,
    myTournaments,
    publicTournaments,
  });
}

/** POST /tournaments — create a new tournament from the wizard */
export async function createTournament(req, res) {
  try {
    const {
      title, description, theme_id, game_rules, num_teams,
      prize_type_id, prize_description, location, start_datetime, timezone,
    } = req.body;

    const id = await Tournament.create({
      creator_user_id: req.session.userId,
      title, description,
      theme_id: parseInt(theme_id, 10),
      game_rules,
      num_teams: parseInt(num_teams, 10),
      prize_type_id: prize_type_id ? parseInt(prize_type_id, 10) : null,
      prize_description: prize_description || null,
      location, start_datetime, timezone,
    });

    const shareCode = encodeId(id);
    await Tournament.updateShareCode(id, shareCode);

    res.json({ success: true, data: { tournamentId: id, shareCode } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create tournament.', code: 'INTERNAL_ERROR' });
  }
}

/** GET /tournaments/create */
export async function showCreate(req, res) {
  const user = await User.findById(req.session.userId);
  const themes = await TournamentTheme.findAll();
  const avatarUrl = getAvatarUrl(user.first_name, user.last_name);
  res.render('tournaments/create', { title: 'Create Tournament', user, avatarUrl, themes });
}

/** GET /t/:shareCode */
export async function showTournament(req, res) {
  const tournament = await Tournament.findByShareCode(req.params.shareCode);
  if (!tournament) return res.status(404).render('error', { title: 'Not Found', message: 'Tournament not found.' });

  // Gate draft tournaments to creator only
  if (tournament.status === 'draft') {
    if (!req.session.userId || req.session.userId !== tournament.creator_user_id) {
      return res.status(403).render('error', { title: 'Not Found', message: 'Tournament not found.' });
    }
  }

  const user = req.session.userId ? await User.findById(req.session.userId) : null;
  const avatarUrl = user ? getAvatarUrl(user.first_name, user.last_name) : null;
  const teams = await Team.findByTournament(tournament.id);

  // Attach players to each team
  const teamsWithPlayers = await Promise.all(
    teams.map(async (team) => {
      const players = await Player.findByTeam(team.id);
      return { ...team, players };
    }),
  );

  const matches = await Match.findByTournament(tournament.id);
  const totalRounds = Math.log2(tournament.num_teams);
  const bracketRounds = buildBracketView(matches, totalRounds);

  // Attach match_players to each match
  const matchesWithPlayers = await Promise.all(
    matches.map(async (m) => {
      const mp = await MatchPlayer.findByMatch(m.id);
      return { ...m, matchPlayers: mp };
    }),
  );
  const bracketRoundsWithPlayers = buildBracketView(matchesWithPlayers, totalRounds);

  const isCreator = user && user.id === tournament.creator_user_id;
  const myPlayer = user ? await Player.findByUserAndTournament(user.id, tournament.id) : null;
  const shareUrl = `${BASE_URL}/t/${tournament.share_code}`;

  // Check if all teams have minimum players (for START button)
  let allTeamsReady = false;
  if (tournament.status === 'signup') {
    const counts = await Promise.all(teams.map(t => Player.countApprovedByTeam(t.id)));
    allTeamsReady = counts.every(c => c >= tournament.active_players_per_side);
  }

  res.render('tournaments/show', {
    title: tournament.title,
    tournament,
    user,
    avatarUrl,
    teams: teamsWithPlayers,
    bracketRounds: bracketRoundsWithPlayers,
    isCreator,
    myPlayer,
    shareUrl,
    allTeamsReady,
  });
}

/** POST /tournaments/:id/publish */
export async function publish(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament || tournament.creator_user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }
    if (tournament.status !== 'draft') {
      return res.status(400).json({ success: false, error: 'Already published.', code: 'INVALID_STATE' });
    }
    await Tournament.updateStatus(tournament.id, 'signup');
    res.json({ success: true, data: { shareUrl: `${BASE_URL}/t/${tournament.share_code}` } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to publish.', code: 'INTERNAL_ERROR' });
  }
}

/** POST /tournaments/:id/start */
export async function startTournament(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament || tournament.creator_user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }
    if (tournament.status !== 'signup') {
      return res.status(400).json({ success: false, error: 'Invalid state.', code: 'INVALID_STATE' });
    }

    await Tournament.updateStatus(tournament.id, 'gameplay');
    await generateBracket(tournament);

    const bracketLink = `${BASE_URL}/t/${tournament.share_code}#round-1`;
    const allPlayers = await Player.findApprovedByTournament(tournament.id);
    const firstMatch = (await Match.findByRound(tournament.id, 1))[0];

    for (const player of allPlayers) {
      await smsService.sendTournamentStart(player.phone_number, {
        tournamentName: tournament.title,
        date: firstMatch ? new Date(firstMatch.scheduled_start).toLocaleDateString() : 'TBD',
        time: firstMatch ? new Date(firstMatch.scheduled_start).toLocaleTimeString() : 'TBD',
        location: firstMatch?.location || tournament.location,
        bracketLink,
      });
    }

    res.json({ success: true, data: { shareUrl: `${BASE_URL}/t/${tournament.share_code}` } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to start tournament.', code: 'INTERNAL_ERROR' });
  }
}

/** POST /tournaments/:id/matches/:matchId/schedule */
export async function updateMatchSchedule(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament || tournament.creator_user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }
    const { location, scheduled_start } = req.body;
    await Match.update(req.params.matchId, { location, scheduled_start: new Date(scheduled_start) });
    res.json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update schedule.', code: 'INTERNAL_ERROR' });
  }
}

/** POST /tournaments/:id/matches/:matchId/winner */
export async function creatorSetWinner(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament || tournament.creator_user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }
    const { winner_team_id } = req.body;
    await creatorOverride(parseInt(req.params.matchId, 10), parseInt(winner_team_id, 10));
    res.json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to set winner.', code: 'INTERNAL_ERROR' });
  }
}
