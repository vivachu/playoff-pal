import * as Match from '../models/Match.js';
import * as Team from '../models/Team.js';
import * as Player from '../models/Player.js';
import * as Tournament from '../models/Tournament.js';
import { handleScoreReport } from '../services/scoreService.js';

/**
 * POST /matches/:id/score-report
 * Report scores for a match. Only active players (or team captain/creator) may submit.
 */
export async function reportScore(req, res) {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: 'Match not found.', code: 'NOT_FOUND' });

    if (match.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Match is already completed.', code: 'ALREADY_COMPLETED' });
    }

    const tournament = await Tournament.findById(match.tournament_id);
    const userId = req.session.userId;

    // Determine which team the current user belongs to
    const myPlayer = await Player.findByUserAndTournament(userId, tournament.id);
    const isCreator = tournament.creator_user_id === userId;

    if (!myPlayer && !isCreator) {
      return res.status(403).json({ success: false, error: 'You are not a participant.', code: 'FORBIDDEN' });
    }

    const reportingTeamId = myPlayer
      ? myPlayer.team_id
      : (req.body.reporting_team_id ? parseInt(req.body.reporting_team_id, 10) : null);

    if (!reportingTeamId) {
      return res.status(400).json({ success: false, error: 'reporting_team_id required for creator override.', code: 'INVALID_INPUT' });
    }

    // Validate report window: 2 hrs before to 2 hrs after scheduled_start
    if (match.scheduled_start) {
      const start = new Date(match.scheduled_start);
      const now = new Date();
      const windowOpen  = new Date(start.getTime() - 2 * 60 * 60 * 1000);
      const windowClose = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      if (!isCreator && (now < windowOpen || now > windowClose)) {
        return res.status(400).json({ success: false, error: 'Score reporting window is not open.', code: 'OUT_OF_WINDOW' });
      }
    }

    const { home_score, away_score, reported_winner_team_id } = req.body;
    if (home_score === undefined || away_score === undefined || !reported_winner_team_id) {
      return res.status(400).json({ success: false, error: 'home_score, away_score, and reported_winner_team_id are required.', code: 'INVALID_INPUT' });
    }

    const result = await handleScoreReport({
      matchId: match.id,
      reportingTeamId,
      reportedByUserId: userId,
      homeScore: parseInt(home_score, 10),
      awayScore: parseInt(away_score, 10),
      reportedWinnerTeamId: parseInt(reported_winner_team_id, 10),
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to submit score.', code: 'INTERNAL_ERROR' });
  }
}
