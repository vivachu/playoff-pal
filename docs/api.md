# API Reference

> Auto-updated on every new route. Prefix: all routes served from `APP_BASE_URL`.

---

## Auth (`/auth`)

| Method | Path              | Auth | Body / Params                               | Response                              |
|--------|-------------------|------|---------------------------------------------|---------------------------------------|
| GET    | /auth/login       | No   | —                                           | Renders `auth/login.hbs`              |
| POST   | /auth/login       | No   | `phone_number`                              | Redirect to /auth/verify or /auth/register |
| GET    | /auth/register    | No   | —                                           | Renders `auth/register.hbs`           |
| POST   | /auth/register    | No   | `phone_number, first_name, last_name`       | Redirect to /auth/verify              |
| GET    | /auth/verify      | No   | —                                           | Renders `auth/verify.hbs`             |
| POST   | /auth/verify      | No   | `code`                                      | Redirect to `/` on success            |
| POST   | /auth/logout      | Yes  | —                                           | Redirect to /auth/login               |

---

## Account (`/account`)

| Method | Path           | Auth | Body                                        | Response                        |
|--------|----------------|------|---------------------------------------------|---------------------------------|
| GET    | /account/edit  | Yes  | —                                           | Renders `account/edit.hbs`      |
| POST   | /account/edit  | Yes  | `first_name, last_name, sms_enabled`        | Redirect to `/`                 |

---

## Tournaments

| Method | Path                                            | Auth    | Body / Params                                                                        | Response                             |
|--------|-------------------------------------------------|---------|--------------------------------------------------------------------------------------|--------------------------------------|
| GET    | /                                               | No      | —                                                                                    | Renders `home/index.hbs`             |
| GET    | /tournaments/create                             | Yes     | —                                                                                    | Renders `tournaments/create.hbs`     |
| POST   | /tournaments                                    | Yes     | `title, description, theme_id, game_rules, num_teams, prize_type_id, prize_description, location, start_datetime, timezone` | `{ success, data: { tournamentId, shareCode } }` |
| GET    | /t/:shareCode                                   | No*     | —                                                                                    | Renders `tournaments/show.hbs`       |
| POST   | /tournaments/:id/publish                        | Yes     | —                                                                                    | `{ success, data: { shareUrl } }`    |
| POST   | /tournaments/:id/start                          | Yes     | —                                                                                    | `{ success, data: { shareUrl } }`    |
| POST   | /tournaments/:id/matches/:matchId/schedule      | Yes     | `location, scheduled_start`                                                          | `{ success, data: {} }`              |
| POST   | /tournaments/:id/matches/:matchId/winner        | Yes     | `winner_team_id`                                                                     | `{ success, data: {} }`              |

*Draft tournaments are restricted to creator only.

---

## Teams

| Method | Path                                  | Auth | Body                                         | Response                          |
|--------|---------------------------------------|------|----------------------------------------------|-----------------------------------|
| POST   | /tournaments/:tournamentId/teams      | Yes  | `teams: [{ name, mascot_id? mascot_name? }]` | `{ success, data: { teamIds } }`  |
| PATCH  | /tournaments/:tournamentId/teams/:id  | Yes  | `name?, mascot_id?`                          | `{ success, data: {} }`           |

---

## Players

| Method | Path                                         | Auth | Body                              | Response                          |
|--------|----------------------------------------------|------|-----------------------------------|-----------------------------------|
| POST   | /teams/:teamId/players                       | Yes  | —                                 | `{ success, data: { playerId } }` |
| PATCH  | /players/:id/status                          | Yes  | `status: 'approved' \| 'denied'` | `{ success, data: {} }`           |
| PUT    | /matches/:matchId/teams/:teamId/players      | Yes  | `player_ids: number[]`            | `{ success, data: {} }`           |

---

## Matches

| Method | Path                      | Auth | Body                                                                  | Response                                      |
|--------|---------------------------|------|-----------------------------------------------------------------------|-----------------------------------------------|
| POST   | /matches/:id/score-report | Yes  | `home_score, away_score, reported_winner_team_id, reporting_team_id?` | `{ success, data: { resolved, winnerId } }`   |

---

## AI

| Method | Path             | Auth | Body                              | Response                                              |
|--------|------------------|------|-----------------------------------|-------------------------------------------------------|
| POST   | /ai/rules-gen    | Yes  | `tournament_name`                 | `{ success, data: { theme_id, description, game_rules } }` |
| POST   | /ai/team-names   | Yes  | `count, theme_id`                 | `{ success, data: { teams: [{ name, mascot }] } }`    |

---

## Webhooks

| Method | Path              | Auth            | Body                     | Response        |
|--------|-------------------|-----------------|--------------------------|-----------------|
| POST   | /webhooks/twilio  | Twilio sig only | Twilio inbound SMS fields | `<Response/>`   |

---

## Error Response Shape

All API errors follow:
```json
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE" }
```

Common codes: `NOT_FOUND`, `FORBIDDEN`, `INVALID_INPUT`, `INVALID_STATE`, `ALREADY_SIGNED_UP`, `TEAM_FULL`, `AI_ERROR`, `OTP_RATE_LIMITED`, `INTERNAL_ERROR`
