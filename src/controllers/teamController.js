import pool from '../config/db.js';
import * as Tournament from '../models/Tournament.js';
import * as Team from '../models/Team.js';

/**
 * POST /tournaments/:tournamentId/teams
 * Bulk-create teams from the wizard step (called after AI generates names).
 */
export async function createTeams(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament || tournament.creator_user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }
    if (tournament.status !== 'draft') {
      return res.status(400).json({ success: false, error: 'Can only add teams to a draft tournament.', code: 'INVALID_STATE' });
    }

    const { teams } = req.body; // [{ name, mascot_id }]
    if (!Array.isArray(teams) || teams.length !== tournament.num_teams) {
      return res.status(400).json({ success: false, error: 'Team count mismatch.', code: 'INVALID_INPUT' });
    }

    const ids = [];
    for (const t of teams) {
      let mascotId = t.mascot_id ? parseInt(t.mascot_id, 10) : null;

      // If mascot_id not provided but mascot_name is (from AI wizard), look up by name
      if (!mascotId && t.mascot_name) {
        const [rows] = await pool.query(
          'SELECT id FROM mascots WHERE name = ? OR slug = ? LIMIT 1',
          [t.mascot_name, t.mascot_name.toLowerCase().replace(/\s+/g, '-')],
        );
        mascotId = rows[0]?.id ?? null;
      }

      const id = await Team.create({
        tournament_id: tournament.id,
        name: t.name,
        mascot_id: mascotId,
      });
      ids.push(id);
    }

    res.json({ success: true, data: { teamIds: ids } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create teams.', code: 'INTERNAL_ERROR' });
  }
}

/**
 * PATCH /tournaments/:tournamentId/teams/:id
 * Update a single team name or mascot.
 */
export async function updateTeam(req, res) {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament || tournament.creator_user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
    }
    const { name, mascot_id } = req.body;
    await Team.update(req.params.id, { name, mascot_id });
    res.json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update team.', code: 'INTERNAL_ERROR' });
  }
}
