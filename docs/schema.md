# Database Schema

> Auto-updated on every migration. Never edit manually — update by adding a new migration and appending the table definition here.

---

## `schema_migrations` (internal — migration runner)
Tracks which migration files have been applied to this database.

| Column      | Type         | Notes                        |
|-------------|--------------|------------------------------|
| id          | INT PK AI    |                              |
| filename    | VARCHAR(255) | UNIQUE — migration filename  |
| executed_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP    |

---

## `users` (001)
Core user accounts. Identified by phone number; no passwords.

| Column       | Type        | Notes                       |
|--------------|-------------|-----------------------------|
| id           | INT PK AI   |                             |
| phone_number | VARCHAR(20) | UNIQUE, E.164 format        |
| first_name   | VARCHAR(50) |                             |
| last_name    | VARCHAR(50) |                             |
| created_at   | DATETIME    | DEFAULT CURRENT_TIMESTAMP   |
| updated_at   | DATETIME    | AUTO ON UPDATE              |

---

## `otp_codes` (002)
One-time passcodes for phone-number authentication.

| Column     | Type       | Notes                                  |
|------------|------------|----------------------------------------|
| id         | INT PK AI  |                                        |
| user_id    | INT FK     | → users.id                             |
| code       | VARCHAR(6) | 6-digit numeric                        |
| expires_at | DATETIME   | 10 minutes after creation              |
| used       | TINYINT(1) | 0=unused, 1=consumed                   |
| attempts   | INT        | Increments on wrong guess; max 3       |
| created_at | DATETIME   | DEFAULT CURRENT_TIMESTAMP              |

---

## `tournament_themes` (003)
Static reference data — tournament types with format and player count info.

| Column                  | Type         | Notes                                     |
|-------------------------|--------------|-------------------------------------------|
| id                      | INT PK AI    |                                           |
| category                | VARCHAR(50)  | Sports, VideoGames, BoardGames            |
| theme_name              | VARCHAR(100) | e.g. Basketball, Mario Kart               |
| format                  | VARCHAR(10)  | 1x1, 2x2, 3x3, 4x4, 5x5, etc.           |
| active_players_per_side | INT          | Players required per team per game        |
| icon_path               | VARCHAR(255) | /images/tournaments/{cat}/{slug}.png      |
| default_rules           | TEXT         | Empty string; AI fills at runtime         |

---

## `mascots` (004)
Static reference data — all 28 team mascot options.

| Column    | Type         | Notes                                |
|-----------|--------------|--------------------------------------|
| id        | INT PK AI    |                                      |
| name      | VARCHAR(100) | Display name e.g. "Blue Devil"       |
| slug      | VARCHAR(100) | UNIQUE; URL-safe e.g. "blue-devil"   |
| icon_path | VARCHAR(255) | /images/teams/mascots/{slug}.png     |

---

## `prize_types` (005)
Static reference data — 8 prize category options.

| Column    | Type         | Notes                          |
|-----------|--------------|--------------------------------|
| id        | INT PK AI    |                                |
| name      | VARCHAR(100) | e.g. "Bragging Rights"         |
| slug      | VARCHAR(100) | UNIQUE; e.g. "bragging-rights" |
| icon_path | VARCHAR(255) | /images/prizes/{slug}.png      |

---

## `tournaments` (006)
A tournament instance, from draft through completion.

| Column            | Type         | Notes                                                    |
|-------------------|--------------|----------------------------------------------------------|
| id                | INT PK AI    |                                                          |
| share_code        | VARCHAR(10)  | UNIQUE; hashids-encoded 6-char slug                      |
| creator_user_id   | INT FK       | → users.id                                               |
| title             | VARCHAR(100) |                                                          |
| description       | VARCHAR(300) | AI-generated                                             |
| theme_id          | INT FK       | → tournament_themes.id                                   |
| game_rules        | TEXT         | AI-generated                                             |
| status            | ENUM         | draft, signup, gameplay, ended                           |
| prize_type_id     | INT FK       | → prize_types.id (nullable)                              |
| prize_description | TEXT         | Free-form (nullable)                                     |
| location          | VARCHAR(255) | Default game location                                    |
| start_datetime    | DATETIME     |                                                          |
| timezone          | VARCHAR(50)  | e.g. "America/New_York"                                  |
| num_teams         | INT          | 2, 4, 8, or 16 only                                      |
| created_at        | DATETIME     |                                                          |
| updated_at        | DATETIME     |                                                          |

---

## `teams` (007)
A team within a tournament.

| Column        | Type         | Notes                                  |
|---------------|--------------|----------------------------------------|
| id            | INT PK AI    |                                        |
| tournament_id | INT FK       | → tournaments.id                       |
| name          | VARCHAR(100) | AI-suggested; editable by creator      |
| mascot_id     | INT FK       | → mascots.id                           |
| seed          | INT          | Bracket seed position (nullable)       |
| status        | ENUM         | active, eliminated, winner             |
| created_at    | DATETIME     |                                        |

---

## `players` (008)
A person signed up for a team. Linked to a user after OTP verification.

| Column       | Type         | Notes                                       |
|--------------|--------------|---------------------------------------------|
| id           | INT PK AI    |                                             |
| team_id      | INT FK       | → teams.id                                  |
| user_id      | INT FK       | → users.id (set after OTP verified)         |
| display_name | VARCHAR(100) | Snapshot of name at signup                  |
| phone_number | VARCHAR(20)  | E.164 format                                |
| is_captain   | TINYINT(1)   | 1 = team captain                            |
| status       | ENUM         | pending, approved, denied                   |
| created_at   | DATETIME     |                                             |

---

## `matches` (009)
A single game within the bracket.

| Column               | Type         | Notes                                         |
|----------------------|--------------|-----------------------------------------------|
| id                   | INT PK AI    |                                               |
| tournament_id        | INT FK       | → tournaments.id                              |
| round_number         | INT          | 1 = first round                               |
| match_number         | INT          | Sequential within the round                   |
| home_team_id         | INT FK       | → teams.id (nullable for bye)                 |
| away_team_id         | INT FK       | → teams.id (nullable for bye)                 |
| winner_team_id       | INT FK       | → teams.id (null until resolved)              |
| status               | ENUM         | scheduled, active, completed, disputed        |
| is_bye               | TINYINT(1)   | 1 = auto-advances without score               |
| location             | VARCHAR(255) | Per-match override; null = use tournament loc |
| scheduled_start      | DATETIME     |                                               |
| score_report_deadline| DATETIME     | scheduled_start + 20 min + 1 hour             |
| referee_override     | TINYINT(1)   | 1 = creator manually set winner               |
| created_at           | DATETIME     |                                               |
| updated_at           | DATETIME     |                                               |

---

## `match_players` (010)
Tracks which specific players are active for each team in each match.

| Column        | Type      | Notes                                              |
|---------------|-----------|----------------------------------------------------|
| id            | INT PK AI |                                                    |
| match_id      | INT FK    | → matches.id                                       |
| player_id     | INT FK    | → players.id                                       |
| team_id       | INT FK    | → teams.id (denormalized for fast bracket queries) |
| rotation_slot | INT       | Player's rotation order for this team (1-based)    |
| created_at    | DATETIME  |                                                    |
| updated_at    | DATETIME  |                                                    |

---

## `score_reports` (011)
A score submission from one team for a match.

| Column                  | Type      | Notes                                 |
|-------------------------|-----------|---------------------------------------|
| id                      | INT PK AI |                                       |
| match_id                | INT FK    | → matches.id                          |
| reporting_team_id       | INT FK    | → teams.id                            |
| reported_by_user_id     | INT FK    | → users.id                            |
| home_score              | INT       |                                       |
| away_score              | INT       |                                       |
| reported_winner_team_id | INT FK    | → teams.id; no ties allowed           |
| created_at              | DATETIME  |                                       |

---

## `ai_logs` (012)
Audit log of every Claude API call made by the application.

| Column        | Type        | Notes                                        |
|---------------|-------------|----------------------------------------------|
| id            | INT PK AI   |                                              |
| user_id       | INT FK      | → users.id (nullable for system-level calls) |
| task_type     | VARCHAR(50) | rules_gen, team_names                        |
| prompt        | TEXT        |                                              |
| response      | TEXT        |                                              |
| model         | VARCHAR(50) | e.g. claude-sonnet-4-6                       |
| input_tokens  | INT         |                                              |
| output_tokens | INT         |                                              |
| created_at    | DATETIME    |                                              |

---

## `sms_opt_outs` (013)
Tracks users who have opted out of non-OTP SMS notifications.

| Column       | Type        | Notes                                               |
|--------------|-------------|-----------------------------------------------------|
| id           | INT PK AI   |                                                     |
| user_id      | INT FK      | → users.id                                          |
| phone_number | VARCHAR(20) | Denormalized for fast lookup                        |
| opted_out_at | DATETIME    |                                                     |
| source       | ENUM        | stop_reply, account_settings                        |
| opted_in_at  | DATETIME    | Populated if user re-opts in (nullable)             |
