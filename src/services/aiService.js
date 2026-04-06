import anthropic, { MODEL } from '../config/claude.js';
import * as AiLog from '../models/AiLog.js';

/**
 * Generate a tournament description, select the best matching theme, and produce game rules.
 * @param {{ tournamentName: string, themes: object[], userId?: number }} params
 * @returns {Promise<{ theme_id: number, description: string, game_rules: string }>}
 */
export async function generateRules({ tournamentName, themes, userId = null }) {
  const themesJson = JSON.stringify(
    themes.map(t => ({ id: t.id, category: t.category, theme_name: t.theme_name, format: t.format })),
  );

  const systemPrompt =
    `You are a tournament setup assistant for Playoff Pal.\n` +
    `Given a tournament name, pick the best matching theme and write a short description and game rules.\n` +
    `Return ONLY valid JSON with this exact structure — no preamble, no markdown fences:\n` +
    `{\n` +
    `  "theme_id": <number from available themes>,\n` +
    `  "description": "<string, max 300 chars>",\n` +
    `  "game_rules": "<string, concise rules, target avg 15-min game, e.g. scoring, win condition, format>"\n` +
    `}\n` +
    `Available themes: ${themesJson}`;

  const userPrompt = `Tournament name: "${tournamentName}"`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = message.content[0].text;

  await AiLog.create({
    user_id: userId,
    task_type: 'rules_gen',
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    response: rawText,
    model: MODEL,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  });

  const parsed = JSON.parse(rawText);
  if (
    typeof parsed.theme_id !== 'number' ||
    typeof parsed.description !== 'string' ||
    typeof parsed.game_rules !== 'string'
  ) {
    throw new Error('AI returned unexpected JSON structure for rules_gen');
  }

  return {
    theme_id: parsed.theme_id,
    description: parsed.description.slice(0, 300),
    game_rules: parsed.game_rules,
  };
}

/**
 * Generate team name + mascot suggestions.
 * @param {{ count: number, mascots: object[], themeName: string, userId?: number }} params
 * @returns {Promise<Array<{ name: string, mascot: string }>>}
 */
export async function generateTeamNames({ count, mascots, themeName, userId = null }) {
  const mascotList = mascots.map(m => m.name).join(', ');

  const systemPrompt =
    `You are a creative sports team naming assistant for Playoff Pal.\n` +
    `Generate ${count} fun team names using only the provided mascots.\n` +
    `Return ONLY valid JSON — no preamble, no markdown fences:\n` +
    `{"teams": [{"name": "<string>", "mascot": "<string from list>"}]}\n` +
    `Available mascots: ${mascotList}\n` +
    `Tournament theme: ${themeName}`;

  const userPrompt = `Generate ${count} team names.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = message.content[0].text;

  await AiLog.create({
    user_id: userId,
    task_type: 'team_names',
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    response: rawText,
    model: MODEL,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  });

  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed.teams) || parsed.teams.length !== count) {
    throw new Error('AI returned unexpected JSON structure for team_names');
  }

  return parsed.teams;
}
