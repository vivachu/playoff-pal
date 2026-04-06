import * as Match from '../models/Match.js';
import * as Player from '../models/Player.js';
import * as Team from '../models/Team.js';
import * as Tournament from '../models/Tournament.js';
import * as User from '../models/User.js';
import * as MatchPlayer from '../models/MatchPlayer.js';
import * as smsService from '../services/smsService.js';
import { assignPlayersForMatch } from '../services/bracketService.js';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/**
 * POST /teams/:teamId/players — player signs up for a team.
 */
export async function signup(req, res) {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found.', code: 'NOT_FOUND' });

    const tournament = await Tournament.findById(team.tournament_id);
    if (tournament.status !== 'signup') {
      return res.status(400).json({ success: false, error: 'Tournament is not accepting signups.', code: 'INVALID_STATE' });
    }

    const user = await User.findById(req.session.userId);

    // Check not already on this tournament
    const existing = await Player.findByUserAndTournament(user.id, tournament.id);
    if (existing) {
      return res.status(409).json({ success: false, error: 'You are already in this tournament.', code: 'ALREADY_SIGNED_UP' });
    }

    // Enforce max players
    const approvedCount = await Player.countApprovedByTeam(team.id);
    const maxPlayers = tournament.active_players_per_side * 5;
    if (approvedCount >= maxPlayers) {
      return res.status(400).json({ success: false, error: 'Team is full.', code: 'TEAM_FULL' });
    }

    const playerId = await Player.create({
      team_id: team.id,
      user_id: user.id,
      display_name: `${user.first_name} ${user.last_name}`,
      phone_number: user.phone_number,
    });

    // Notify creator
    const creator = await User.findById(tournament.creator_user_id);
    await smsService.sendNewSignupRequest(creator.phone_number, {
      playerName: `${user.first_name} ${user.last_name}`,
      teamName: team.name,
      tournamentName: tournament.title,
    });

    res.json({ success: true, data: { playerId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to sign up.', code: 'INTERNAL_ERROR' });
  }
}

/**
 * PATCH /players/:id/status — creator or captain approves/denies a player.
 */
export async function approveOrDeny(req, res) {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ success: false, error: 'Player not found.', code: 'NOT_FOUND' });

    const team = await Team.findById(player.team_id);
    const tournament = await Tournament.findById(team.tournament_id);

    // Must be creator or team captain
    const captain = (await Player.findByTeam(team.id)).find(
      p => p.user_id === req.session.userId && p.is_captain,
    );
    const isCreator = tournament.creator_user_id === req.session.userId;
    if (!isCreator && !captain) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }

    const { status } = req.body; // 'approved' | 'denied'
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status.', code: 'INVALID_INPUT' });
    }

    await Player.updateStatus(player.id, status);
    const playerUser = await User.findById(player.user_id);

    if (status === 'approved') {
      const shareUrl = `${BASE_URL}/t/${tournament.share_code}`;
      await smsService.sendSignupAccepted(playerUser.phone_number, {
        teamName: team.name,
        tournamentName: tournament.title,
        shareUrl,
      });

      // Notify existing approved teammates
      const teammates = await Player.findByTeam(team.id);
      for (const tm of teammates) {
        if (tm.id !== player.id && tm.status === 'approved') {
          await smsService.sendNewMemberJoined(tm.phone_number, {
            playerName: player.display_name,
            teamName: team.name,
            tournamentName: tournament.title,
          });
        }
      }

      // Check if all teams now have minimum players
      const teams = await Team.findByTournament(tournament.id);
      const counts = await Promise.all(teams.map(t => Player.countApprovedByTeam(t.id)));
      const allReady = counts.every(c => c >= tournament.active_players_per_side);

      if (allReady) {
        const creator = await User.findById(tournament.creator_user_id);
        const link = `${BASE_URL}/t/${tournament.share_code}`;
        await smsService.sendMinPlayersReached(creator.phone_number, {
          tournamentName: tournament.title,
          link,
        });
      }
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update player.', code: 'INTERNAL_ERROR' });
  }
}

/**
 * PUT /matches/:matchId/teams/:teamId/players — captain or creator overrides active player assignments.
 */
export async function updateMatchPlayers(req, res) {
  try {
    const { matchId, teamId } = req.params;
    const { player_ids } = req.body; // array of player ids

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, error: 'Match not found.', code: 'NOT_FOUND' });

    const team = await Team.findById(teamId);
    const tournament = await Tournament.findById(match.tournament_id);

    const captain = (await Player.findByTeam(team.id)).find(
      p => p.user_id === req.session.userId && p.is_captain,
    );
    const isCreator = tournament.creator_user_id === req.session.userId;
    if (!isCreator && !captain) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }

    if (!Array.isArray(player_ids) || player_ids.length !== tournament.active_players_per_side) {
      return res.status(400).json({ success: false, error: 'Incorrect number of players.', code: 'INVALID_INPUT' });
    }

    await MatchPlayer.deleteByMatchAndTeam(matchId, teamId);
    for (let i = 0; i < player_ids.length; i++) {
      await MatchPlayer.create({
        match_id: matchId,
        player_id: player_ids[i],
        team_id: teamId,
        rotation_slot: i + 1,
      });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update match players.', code: 'INTERNAL_ERROR' });
  }
}
