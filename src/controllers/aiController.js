import Filter from 'bad-words';
import * as TournamentTheme from '../models/TournamentTheme.js';
import pool from '../config/db.js';
import { generateRules, generateTeamNames } from '../services/aiService.js';

const filter = new Filter();

/**
 * POST /ai/rules-gen
 * Body: { tournament_name: string }
 * Returns: { theme_id, description, game_rules }
 */
export async function rulesGen(req, res) {
  try {
    const { tournament_name } = req.body;
    if (!tournament_name?.trim()) {
      return res.status(400).json({ success: false, error: 'tournament_name is required.', code: 'INVALID_INPUT' });
    }

    if (filter.isProfane(tournament_name)) {
      return res.status(400).json({ success: false, error: 'Tournament name contains inappropriate language.', code: 'PROFANITY' });
    }

    const themes = await TournamentTheme.findAll();
    const result = await generateRules({
      tournamentName: tournament_name.trim(),
      themes,
      userId: req.session.userId,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'AI request failed. Please try again.', code: 'AI_ERROR' });
  }
}

/**
 * POST /ai/team-names
 * Body: { count: number, theme_id: number }
 * Returns: { teams: [{ name, mascot }] }
 */
export async function teamNames(req, res) {
  try {
    const { count, theme_id } = req.body;
    const numTeams = parseInt(count, 10);

    if (!numTeams || ![2, 4, 8, 16].includes(numTeams)) {
      return res.status(400).json({ success: false, error: 'count must be 2, 4, 8, or 16.', code: 'INVALID_INPUT' });
    }

    // Fetch theme for name
    const [themeRows] = await pool.query('SELECT * FROM tournament_themes WHERE id = ?', [theme_id]);
    const theme = themeRows[0];
    if (!theme) return res.status(400).json({ success: false, error: 'Invalid theme_id.', code: 'INVALID_INPUT' });

    // Pick a random sample of mascots (double the team count to give AI variety)
    const [mascotRows] = await pool.query(
      'SELECT * FROM mascots ORDER BY RAND() LIMIT ?',
      [Math.min(numTeams * 2, 28)],
    );

    const teams = await generateTeamNames({
      count: numTeams,
      mascots: mascotRows,
      themeName: theme.theme_name,
      userId: req.session.userId,
    });

    res.json({ success: true, data: { teams } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'AI request failed. Please try again.', code: 'AI_ERROR' });
  }
}
