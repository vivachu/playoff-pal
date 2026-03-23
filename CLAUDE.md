# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Playoff Pal — AI Developer Context & Project Reference
# Based on Functional Spec v3 (MVP) — Fully resolved; no open blockers; ready to build

---

## Project Status (as of initial checkin)

**Implementation has not started.** The repository currently contains only:
- `public/images/` — All static image assets (mascots, pp-mascot variants, etc.)
- `package.json` — No dependencies installed yet; no npm scripts defined yet

**Everything in the spec below needs to be built from scratch.** Start by:
1. Adding all dependencies to `package.json` and running `npm install`
2. Creating the `src/`, `migrations/`, `seeds/`, `scripts/`, and `docs/` directories
3. Setting up `src/index.js` as the Express entry point
4. Running migrations against a local MySQL 8 database

The npm scripts (`dev`, `start`, `migrate`, `seed:*`, `lint`) are defined in the spec but not yet in `package.json` — add them when scaffolding.

---

## Project Overview

**Playoff Pal** is a mobile-first web application for creating and managing fun real-life
tournaments among friends. Users pick a theme (e.g. 3x3 Basketball, Mario Kart, Chess),
invite friends to join teams, and face off head-to-head in single-elimination brackets.
AI (Claude API) auto-generates tournament descriptions, rules, and team names.
SMS (Twilio) handles OTP authentication, signup notifications, score alerts, and round updates.

**Target audience:** Casual friend groups, families, offices, gaming communities aged 12–25.
**Priority platform:** Mobile browser first, desktop second.

---

## Tech Stack

| Layer              | Technology                                                        |
|--------------------|-------------------------------------------------------------------|
| Runtime            | Node.js v22.22.1                                                  |
| Framework          | Express.js                                                        |
| Frontend Rendering | EJS + Handlebars (MVC — server-rendered templates)                |
| Session Management | express-session + express-mysql-session                           |
| Database           | MySQL 8.x                                                         |
| AI / LLM           | `@anthropic-ai/sdk` — claude-sonnet-4-6                           |
| SMS / OTP          | Twilio (SMS auth, notifications, inbound webhook responses)       |
| UI Animations      | GSAP (transitions, entrance animations, wait states)              |
| Alert / Confirm UI | SweetAlert2 (match result popups, confirmations, errors)          |
| Profanity Filter   | `bad-words` npm package                                           |
| Share Code         | `hashids` npm package — encode tournament DB id → 6-char slug     |
| User Avatars       | ui-avatars.com Web API — initials avatar in nav header            |
| Deployment         | Railway (production), localhost MySQL (dev)                       |
| Version Control    | GitHub (master branch → Railway auto-deploy)                      |

---

## Dev Environment Setup

### Prerequisites
```bash
node --version   # Must be v22.22.1 (use nvm to pin)
mysql --version  # Must be 8.x
```

### Install
```bash
npm install
```

### Environment Variables
- **Never hardcode credentials** — use environment-named `.env` files:
  - `.env.local` — local development
  - `.env.staging` — staging server
  - `.env.production` — production (Railway injects these)
- Commit `.env.local.example` to repo as a template
- All `.env.*` files (except `.example`) must be in `.gitignore`

### `.env.local.example`
```env
# Server
PORT=3000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=playoffpal_dev
DB_USER=
DB_PASSWORD=

# Session
SESSION_SECRET=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=

# Anthropic
ANTHROPIC_API_KEY=

# HashIds (share code generation)
HASHIDS_SALT=
HASHIDS_MIN_LENGTH=6

# App
APP_BASE_URL=http://localhost:3000
```

---

## Dev Commands

| Command                    | Description                                             |
|----------------------------|---------------------------------------------------------|
| `npm run dev`              | Start dev server with nodemon (hot reload)              |
| `npm start`                | Start production server                                 |
| `npm run migrate`          | Run all pending DB migrations in order                  |
| `npm run migrate:rollback` | Rollback the last migration                             |
| `npm run seed:static`      | Load static reference data (themes, mascots, prizes)    |
| `npm run seed:sample`      | Load sample tournament data for testing                 |
| `npm run seed:clear`       | Clear all seed data from dev DB                         |
| `npm test`                 | Run test suite                                          |
| `npm run lint`             | ESLint check                                            |

---

## Project Folder Structure

```
playoff-pal/
├── src/
│   ├── index.js                    # Express app entry point
│   ├── config/
│   │   ├── db.js                   # MySQL connection pool (reads from env)
│   │   ├── twilio.js               # Twilio client setup
│   │   └── claude.js               # Anthropic SDK client setup
│   ├── routes/
│   │   ├── auth.js                 # /auth — OTP send, verify, logout
│   │   ├── account.js              # /account — edit name, phone number
│   │   ├── tournaments.js          # /tournaments — CRUD, state transitions
│   │   ├── teams.js                # /teams — team management
│   │   ├── players.js              # /players — signup, approval
│   │   ├── matches.js              # /matches — score reporting, player assignment
│   │   ├── ai.js                   # /ai — Claude API proxy endpoints
│   │   └── webhooks.js             # /webhooks/twilio — inbound SMS actions
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── tournamentController.js
│   │   ├── teamController.js
│   │   ├── playerController.js
│   │   ├── matchController.js
│   │   └── aiController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── OtpCode.js
│   │   ├── Tournament.js
│   │   ├── TournamentTheme.js
│   │   ├── Team.js
│   │   ├── Player.js
│   │   ├── Match.js
│   │   ├── MatchPlayer.js          # Active player assignments per match
│   │   ├── ScoreReport.js
│   │   └── AiLog.js
│   ├── middleware/
│   │   ├── auth.js                 # Session guard — require logged-in user
│   │   ├── errorHandler.js         # Global error handler
│   │   └── rateLimiter.js          # OTP endpoint rate limiting
│   ├── services/
│   │   ├── smsService.js           # Twilio send/receive wrappers + templates
│   │   ├── bracketService.js       # Bracket generation + advancement logic
│   │   ├── aiService.js            # Claude API call wrappers
│   │   ├── scoreService.js         # Score reporting + winner resolution
│   │   ├── shareCodeService.js     # hashids encode/decode for share codes
│   │   └── avatarService.js        # ui-avatars.com URL builder
│   └── views/                      # Handlebars templates
│       ├── layouts/
│       │   └── main.hbs            # Base layout (nav header with avatar, footer)
│       ├── auth/
│       │   ├── login.hbs           # Phone number entry
│       │   └── verify.hbs          # OTP entry + TCPA consent display
│       ├── account/
│       │   └── edit.hbs            # Edit first/last name, phone number
│       ├── home/
│       │   └── index.hbs           # Invited tournaments + public feed + Create CTA
│       ├── tournaments/
│       │   ├── create.hbs          # Multi-step creation wizard
│       │   └── show.hbs            # Tournament Page (adapts per state; includes #bracket anchor section)
│       └── partials/
│           ├── nav-header.hbs      # Header with avatar initials + popup menu
│           ├── team-card.hbs       # Team card with mascot + player slots
│           ├── match-card.hbs      # Match card in bracket view
│           ├── bracket-section.hbs # Full bracket partial embedded in show.hbs at id="bracket"
│           ├── score-modal.hbs     # Report Score modal content
│           └── mascot-anim.hbs     # Referee bot animation wrapper
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_otp_codes.sql
│   ├── 003_create_tournament_themes.sql
│   ├── 004_create_mascots.sql
│   ├── 005_create_prize_types.sql
│   ├── 006_create_tournaments.sql
│   ├── 007_create_teams.sql
│   ├── 008_create_players.sql
│   ├── 009_create_matches.sql
│   ├── 010_create_match_players.sql
│   ├── 011_create_score_reports.sql
│   ├── 012_create_ai_logs.sql
│   └── 013_create_sms_opt_outs.sql
├── seeds/
│   ├── static/
│   │   ├── themes.sql              # All tournament themes with icon paths
│   │   ├── mascots.sql             # All 28 mascots with slugs + icon paths
│   │   └── prize_types.sql         # All 8 prize types with slugs + icon paths
│   └── sample/
│       └── sample_tournaments.sql  # Tournaments in all 4 states for testing
├── scripts/
│   ├── migrate.js                  # Migration runner
│   └── seed.js                     # Seed runner (--static or --sample flag)
├── public/
│   ├── css/main.css
│   ├── js/main.js
│   └── images/
│       ├── logo/
│       ├── tournaments/
│       │   ├── sports/
│       │   ├── video-games/
│       │   └── board-games/
│       ├── teams/mascots/
│       ├── prizes/
│       └── pp-mascot/
├── docs/
│   ├── schema.md                   # AUTO-UPDATED on every migration
│   ├── api.md                      # AUTO-UPDATED on every new route
│   └── functions.md                # AUTO-UPDATED on every new function/service
├── .env.local.example
├── .gitignore
├── CLAUDE.md
├── README.md
└── package.json
```

---

## Database Schema

> **Rule:** Every schema change = new numbered migration file. Never edit past migrations.
> Update `docs/schema.md` immediately after every migration is written.

### `users`
| Column       | Type         | Notes                             |
|--------------|--------------|-----------------------------------|
| id           | INT PK AI    |                                   |
| phone_number | VARCHAR(20)  | UNIQUE, E.164 format              |
| first_name   | VARCHAR(50)  |                                   |
| last_name    | VARCHAR(50)  |                                   |
| created_at   | DATETIME     |                                   |
| updated_at   | DATETIME     |                                   |

> `display_name` is always computed as `first_name + ' ' + last_name`. Never store separately.
> Avatar URL is always generated via ui-avatars.com from initials — never stored in DB.

### `otp_codes`
| Column     | Type       | Notes                                      |
|------------|------------|--------------------------------------------|
| id         | INT PK AI  |                                            |
| user_id    | INT FK     | → users.id                                 |
| code       | VARCHAR(6) | 6-digit numeric code                       |
| expires_at | DATETIME   | 10 minutes after creation                  |
| used       | TINYINT(1) | 0=unused, 1=consumed                       |
| attempts   | INT        | Increments on each wrong guess; max 3      |
| created_at | DATETIME   |                                            |

### `tournament_themes`  ← Static seed data
| Column                  | Type         | Notes                                      |
|-------------------------|--------------|--------------------------------------------|
| id                      | INT PK AI    |                                            |
| category                | VARCHAR(50)  | Sports, VideoGames, BoardGames             |
| theme_name              | VARCHAR(100) | Basketball, MarioKart, Chess, etc.         |
| format                  | VARCHAR(10)  | 1x1, 2x2, 3x3, 4x4, 5x5                   |
| active_players_per_side | INT          | Required active players per team per game  |
| icon_path               | VARCHAR(255) | /images/tournaments/{cat}/{slug}.png       |
| default_rules           | TEXT         | Seed with empty string; AI fills at runtime|

### `mascots`  ← Static seed data
| Column    | Type         | Notes                                     |
|-----------|--------------|-------------------------------------------|
| id        | INT PK AI    |                                           |
| name      | VARCHAR(100) | Display name e.g. "Blue Devil"            |
| slug      | VARCHAR(100) | URL-safe e.g. "blue-devil"                |
| icon_path | VARCHAR(255) | /images/teams/mascots/{slug}.png          |

### `prize_types`  ← Static seed data
| Column    | Type         | Notes                                     |
|-----------|--------------|-------------------------------------------|
| id        | INT PK AI    |                                           |
| name      | VARCHAR(100) | e.g. "Bragging Rights"                    |
| slug      | VARCHAR(100) | e.g. "bragging-rights"                    |
| icon_path | VARCHAR(255) | /images/prizes/{slug}.png                 |

### `tournaments`
| Column            | Type         | Notes                                                      |
|-------------------|--------------|------------------------------------------------------------|
| id                | INT PK AI    |                                                            |
| share_code        | VARCHAR(10)  | UNIQUE; hashids-encoded from id; 6 lowercase alphanumeric  |
| creator_user_id   | INT FK       | → users.id                                                 |
| title             | VARCHAR(100) | Max 100 chars; bad-words checked before save               |
| description       | VARCHAR(300) | AI-generated; max 300 chars                                |
| theme_id          | INT FK       | → tournament_themes.id                                     |
| game_rules        | TEXT         | AI-generated concise rules targeting ≤15 min games         |
| status            | ENUM         | draft, signup, gameplay, ended                             |
| prize_type_id     | INT FK       | → prize_types.id (nullable)                                |
| prize_description | TEXT         | Free-form prize details (nullable)                         |
| location          | VARCHAR(255) | Default location for all games e.g. "Nick's House"         |
| start_datetime    | DATETIME     | Tournament start date/time                                 |
| timezone          | VARCHAR(50)  | e.g. "America/New_York"                                    |
| num_teams         | INT          | 2, 4, 8, or 16 only (enforce power of 2)                   |
| created_at        | DATETIME     |                                                            |
| updated_at        | DATETIME     |                                                            |

**Share code generation:**
```js
// In shareCodeService.js
import Hashids from 'hashids';
const hashids = new Hashids(process.env.HASHIDS_SALT, 6);

export const encodeId = (id) => hashids.encode(id).toLowerCase();  // → 6-char slug
export const decodeCode = (code) => hashids.decode(code)[0];        // → numeric id
```
Share URL format: `{APP_BASE_URL}/t/{share_code}` e.g. `https://playoffpal.com/t/ab3x9z`

### `teams`
| Column        | Type         | Notes                                      |
|---------------|--------------|--------------------------------------------|
| id            | INT PK AI    |                                            |
| tournament_id | INT FK       | → tournaments.id                           |
| name          | VARCHAR(100) | AI-suggested; editable by creator          |
| mascot_id     | INT FK       | → mascots.id                               |
| seed          | INT          | Bracket seed position (nullable)           |
| status        | ENUM         | active, eliminated, winner                 |
| created_at    | DATETIME     |                                            |

### `players`
| Column            | Type         | Notes                                             |
|-------------------|--------------|---------------------------------------------------|
| id                | INT PK AI    |                                                   |
| team_id           | INT FK       | → teams.id                                        |
| user_id           | INT FK       | → users.id (set after OTP verified)               |
| display_name      | VARCHAR(100) | Snapshot of name at time of signup                |
| phone_number      | VARCHAR(20)  | E.164 format                                      |
| is_captain        | TINYINT(1)   | 1 = team captain                                  |
| status            | ENUM         | pending, approved, denied                         |
| created_at        | DATETIME     |                                                   |

**Team size rules (derived from theme):**
- `min_players` = `active_players_per_side` (from tournament_themes)
- `max_players` = `active_players_per_side × 5`
- Example: 5x5 basketball → min 5, max 25 players per team

Gameplay state transition is triggered when **all teams** in the tournament reach their
`min_players` count. The creator then receives an SMS notification and sees the
**START TOURNAMENT** button on the Tournament Page.

### `matches`
| Column                | Type         | Notes                                             |
|-----------------------|--------------|---------------------------------------------------|
| id                    | INT PK AI    |                                                   |
| tournament_id         | INT FK       | → tournaments.id                                  |
| round_number          | INT          | 1 = first round; final round = "Championship"     |
| match_number          | INT          | Sequential position within the round              |
| home_team_id          | INT FK       | → teams.id (nullable for bye)                     |
| away_team_id          | INT FK       | → teams.id (nullable for bye)                     |
| winner_team_id        | INT FK       | → teams.id (null until resolved)                  |
| status                | ENUM         | scheduled, active, completed, disputed            |
| is_bye                | TINYINT(1)   | 1 = single team; auto-advances without score      |
| location              | VARCHAR(255) | Per-match override; null = use tournament.location|
| scheduled_start       | DATETIME     | Auto-set consecutively; 20-min slots from start   |
| score_report_deadline | DATETIME     | scheduled_start + 20 min + 1 hour                 |
| referee_override      | TINYINT(1)   | 1 = creator manually set winner                   |
| created_at            | DATETIME     |                                                   |
| updated_at            | DATETIME     |                                                   |

### `match_players`
Tracks which specific players are assigned as **active** for each team in each match.
The bracket UI allows inline editing of active players by the team captain or tournament creator,
at any time before the match's `scheduled_start`.

| Column        | Type      | Notes                                                          |
|---------------|-----------|----------------------------------------------------------------|
| id            | INT PK AI |                                                                |
| match_id      | INT FK    | → matches.id                                                   |
| player_id     | INT FK    | → players.id                                                   |
| team_id       | INT FK    | → teams.id (denormalized for fast bracket queries)             |
| rotation_slot | INT       | Player's position in the rotation order for this team (1-based)|
| created_at    | DATETIME  |                                                                |
| updated_at    | DATETIME  |                                                                |

**Constraint:** Number of active `match_players` rows per team per match must equal `active_players_per_side`.

**Auto-assignment logic (runs when bracket is first generated):**
1. For each team, the initial player order is assigned **randomly** across all approved players.
   This random order is stored as each player's `rotation_slot` (1, 2, 3…) and is fixed going forward.
2. For **Round 1** matches, the first `active_players_per_side` players in rotation_slot order are assigned.
3. For **subsequent rounds**, the rotation advances: players who played in the previous round move
   to the back of the rotation. The next `active_players_per_side` players who have not yet played
   (or have played the least) are auto-assigned.
4. Rotation wraps around once all players have had a turn.
5. Manual overrides by captains or creator replace the auto-assigned rows for that specific match only;
   the underlying rotation order is preserved for future auto-assignments.

**Bracket display:**
- Always show the currently assigned `match_players` for each match in the bracket view.
- If a match has no `match_players` rows (edge case), show all approved players as a fallback placeholder.

### `score_reports`
| Column                  | Type      | Notes                                      |
|-------------------------|-----------|--------------------------------------------|
| id                      | INT PK AI |                                            |
| match_id                | INT FK    | → matches.id                               |
| reporting_team_id       | INT FK    | → teams.id (which team submitted)          |
| reported_by_user_id     | INT FK    | → users.id                                 |
| home_score              | INT       | Numeric score for home team                |
| away_score              | INT       | Numeric score for away team                |
| reported_winner_team_id | INT FK    | → teams.id; required; no ties allowed      |
| created_at              | DATETIME  |                                            |

### `ai_logs`
| Column        | Type         | Notes                                           |
|---------------|--------------|-------------------------------------------------|
| id            | INT PK AI    |                                                 |
| user_id       | INT FK       | → users.id (nullable for system-level calls)    |
| task_type     | VARCHAR(50)  | rules_gen, team_names                           |
| prompt        | TEXT         | Full prompt sent to Claude                      |
| response      | TEXT         | Raw response from Claude                        |
| model         | VARCHAR(50)  | e.g. claude-sonnet-4-6                          |
| input_tokens  | INT          |                                                 |
| output_tokens | INT          |                                                 |
| created_at    | DATETIME     |                                                 |

### `sms_opt_outs`
Tracks users who have opted out of SMS notifications, either via STOP reply or the Account Edit screen.
`smsService.js` must check this table before sending **any** non-OTP SMS — if the recipient's
phone number is in this table, skip the Twilio API call entirely.

| Column        | Type         | Notes                                                        |
|---------------|--------------|--------------------------------------------------------------|
| id            | INT PK AI    |                                                              |
| user_id       | INT FK       | → users.id                                                   |
| phone_number  | VARCHAR(20)  | Denormalized for fast lookup without joining users table     |
| opted_out_at  | DATETIME     | When the opt-out was recorded                                |
| source        | ENUM         | `stop_reply` (Twilio webhook) or `account_settings` (UI)    |
| opted_in_at   | DATETIME     | Populated if user later opts back in (nullable)              |

**Opt-out state:** a user is opted out if their most recent `sms_opt_outs` row has a null `opted_in_at`,
or if `opted_out_at` > `opted_in_at`. A user is opted in otherwise (or if no row exists).

**OTP messages are exempt** — OTP codes must always be delivered regardless of opt-out status,
as they are transactional (required for account access), not promotional.

---

## Tournament State Machine

```
DRAFT ──publish──▶ SIGNUP ──all minimums met + creator presses START──▶ GAMEPLAY ──final winner──▶ ENDED
  │                   │                                                       │
  └─ creator only     └─ public to all (incl. logged-out users)               └─ public, read-only
```

| State      | Visibility                          | Key Behavior                                                      |
|------------|-------------------------------------|-------------------------------------------------------------------|
| `draft`    | Creator only                        | All wizard properties editable; Tournament Page in preview mode   |
| `signup`   | Public (logged-in and logged-out)   | Signup board active; players join teams; creator/captains approve |
| `gameplay` | Public (logged-in and logged-out)   | Bracket live; score reporting active; no structural edits         |
| `ended`    | Public (logged-in and logged-out)   | Read-only; winner featured prominently; final bracket displayed   |

**There is no public/private toggle.** Visibility is determined entirely by state:
- `draft` = private to creator
- All other states = fully public (no login required to view)

---

## Account Management

### User Initials Avatar (Nav Header)
- Every page's nav header shows the logged-in user's initials in the top-right corner
- Generated via ui-avatars.com Web API — never stored in DB
- URL pattern:
  ```
  https://ui-avatars.com/api/?name={INITIALS}&background={COLOR}&color=fff&rounded=true&bold=true
  ```
- Use a background color that contrasts with the main nav bar (e.g. `#2ECC71` green or `#E74C3C` red)
- Initials = first letter of `first_name` + first letter of `last_name` (uppercase)
- Tapping/clicking the avatar opens a popup menu with two options:
  - **Edit Account** → navigates to `/account/edit`
  - **Sign Out** → destroys session, redirects to login

### Account Edit Screen (`/account/edit`)
- Fields: First Name, Last Name, Phone Number, SMS Notifications toggle (opt in / opt out)
- Phone number changes require re-verification via OTP (same flow as signup)
- **SMS Notifications toggle:**
  - On page load: read current opt-out state from `sms_opt_outs` table for this user
  - Toggle ON (opted in): if a row exists with null `opted_in_at`, update `opted_in_at` = now()
  - Toggle OFF (opted out): insert new row into `sms_opt_outs` with `source = 'account_settings'`
  - Display clearly: "You will not receive game updates or notifications via SMS. OTP login codes are always sent."
- On save: update `users` table; redirect back to home screen

---

## OTP Auth & TCPA Compliance

### OTP Flow
1. User enters phone number on login/signup screen
2. Server checks if phone exists in `users`:
   - Exists → send OTP, proceed to verify screen
   - Doesn't exist → collect first + last name, then send OTP, create user on verify
3. **TCPA consent disclosure** — must be shown on the OTP verify screen:
   > *"By verifying your number, you agree to receive automated updates, notifications,
   > and promotional messages from Playoff Pal. Message and data rates may apply.
   > Reply STOP to opt-out at any time."*
4. This same disclosure text must be included in the OTP SMS message body (see SMS templates)
5. OTP code: 6 digits, expires 10 minutes after creation, max 3 failed attempts
6. Rate limit: max 5 OTP send requests per phone number per hour

### OTP SMS Template (includes TCPA disclosure)
```
Your Playoff Pal verification code is [CODE]. Let the games begin! 🎮

By verifying your number, you agree to receive automated updates, notifications,
and promotional messages from Playoff Pal. Message and data rates may apply.
Reply STOP to opt-out at any time.
```

---

## Tournament Creation Wizard (Step by Step)

1. **Name entry** (max 100 chars)
   - Run `bad-words` check on input immediately
   - If clean → call Claude API (`rules_gen`):
     - Auto-select best matching theme from `tournament_themes` table
     - Generate `description` (≤300 chars)
     - Generate `game_rules` (concise, ≤15-min target game time)
   - If profanity detected → show error, block progression

2. **Theme + description review**
   - Theme dropdown pre-filled from AI result; user may change
   - Description editable; changing theme re-triggers AI call
   - Game rules displayed (read-only with edit option)

3. **Team setup**
   - Dropdown: 2, 4, 8, or 16 teams (enforce powers of 2 only)
   - Press **CREATE TEAMS** → Claude API call (`team_names`):
     - Pass count + random sample of mascots from `mascots` table
     - Returns array of `{name, mascot}` pairs
   - UI: show all suggested teams; allow per-name edits; **Regenerate All** button; **SAVE**

4. **Prize setup**
   - Dropdown of `prize_types` (Bragging Rights, Cash, Gift Card, etc.)
   - Free-form text field for prize description

5. **Location + Date/Time**
   - Text field: location name (e.g. "Nick's House")
   - Date/time picker with timezone selector

6. **Preview + Publish**
   - Creator redirected to Tournament Page in `draft` preview mode
   - **Share** button: copies `{APP_BASE_URL}/t/{share_code}` to clipboard
   - **Publish** button: transitions status → `signup`, page becomes public

---

## Bracket & Match Logic

### Bracket URL & Anchor
- The bracket is **not** a separate page or route. It is a section within the Tournament Page (`/t/{share_code}`), rendered by the `bracket-section.hbs` partial inside `show.hbs`.
- The bracket section must have `id="bracket"` on its container element.
- All SMS links that reference the bracket use the anchor URL: `/t/{share_code}#bracket`
- Round-specific SMS links append the round number: `/t/{share_code}#round-{N}`
  - Example: `/t/ab3x9z#round-2` scrolls directly to Round 2 in the bracket on page load
- Implement smooth scroll-to-anchor on page load when a `#round-N` hash is present

### Structure
- Single elimination only; no double elimination in MVP
- Team count: 2, 4, 8, or 16 (power of 2 enforced in wizard dropdown)
- No byes in MVP (power-of-2 enforcement eliminates the need)
- Round naming: all non-final rounds named "Round N"; final round = "Championship"
- 16 teams → 4 rounds; 8 teams → 3 rounds; 4 teams → 2 rounds; 2 teams → 1 round

### Scheduling Defaults
- All games scheduled consecutively starting at tournament `start_datetime`
- 20-minute estimated duration per game
- All games default to tournament `location`
- Creator may change any match's `scheduled_start` and `location`
- Team captain or tournament creator may edit active player assignments inline from the bracket UI, any time before `scheduled_start`
- Match location is shown on the bracket **only** when `matches.location` is non-null (an explicit override). If null, display nothing — the tournament default location is implied.

### Gameplay Start Flow
1. All teams in tournament reach `min_players` (`active_players_per_side`) count
2. Creator receives SMS: *"The teams are full! 🥳 Minimum players reached. Click START TOURNAMENT: [link]"*
3. Creator sees green **START TOURNAMENT** button on Tournament Page
4. Creator presses button → status transitions to `gameplay`
5. Bracket auto-populated with round 1 matches; active players auto-assigned via rotation algorithm (random initial order, then fixed rotation advancing each round)
6. All players receive SMS: round 1 game time, location, bracket link (`/t/{share_code}#round-1`)
7. Schedule a 1-hour reminder SMS to fire before the **first game of every round** (not just Round 1)

### Score Report Window
- **Report Score** button visible from 2 hours before to 2 hours after `scheduled_start`
- `score_report_deadline` = `scheduled_start` + 20 min + 1 hour

### Score Resolution (in priority order)
1. **Both teams report matching scores AND same winner** → winner auto-confirmed; all players SMS-notified
2. **One team reports, other doesn't within deadline** → reporting team's score and winner stand
3. **Neither team reports by deadline** → creator notified via SMS to manually determine winner
4. **Creator override** → creator may set or override winner at any time
5. **Bye match** → single team auto-advances, no score, no SMS for that match

### Score Report Modal UI
- Triggered by **Report Score** button; rendered as SweetAlert2 popup
- Two numeric input fields: **[Home Team] Score** and **[Away Team] Score**
- Radio button toggle to select which team won — **winner selection is required**
- No ties allowed — winner must be selected before submission
- Submit sends `POST /matches/:id/score-report`

---

## AI Integration (Claude API)

Use `@anthropic-ai/sdk`. Model: `claude-sonnet-4-6`.

### AI Tasks

| Task          | Trigger                  | Input                                       | Output schema                            |
|---------------|--------------------------|---------------------------------------------|------------------------------------------|
| `rules_gen`   | Tournament name entered  | Tournament name + all themes as JSON        | `{theme_id, description, game_rules}`    |
| `team_names`  | CREATE TEAMS pressed     | Count + random mascot name array            | `{teams: [{name, mascot}]}`              |

### AI Service Rules
- Always specify strict JSON output schema in the system prompt
- Parse and validate all AI JSON output before any DB write
- Log every call to `ai_logs` (prompt, response, model, tokens, task_type, user_id)
- All AI errors shown to user as SweetAlert2 popup with `referee-whistle` mascot
- Wrap all AI calls in try/catch with graceful UI fallback
- Run `bad-words` profanity check BEFORE calling Claude — never send bad content to the API

### System Prompt: `rules_gen`
```
You are a tournament setup assistant for Playoff Pal.
Given a tournament name, pick the best matching theme and write a short description and game rules.
Return ONLY valid JSON with this exact structure — no preamble, no markdown fences:
{
  "theme_id": <number from available themes>,
  "description": "<string, max 300 chars>",
  "game_rules": "<string, concise rules, target avg 15-min game, e.g. scoring, win condition, format>"
}
Available themes: {themes_json}
```

### System Prompt: `team_names`
```
You are a creative sports team naming assistant for Playoff Pal.
Generate {count} fun team names using only the provided mascots.
Return ONLY valid JSON — no preamble, no markdown fences:
{"teams": [{"name": "<string>", "mascot": "<string from list>"}]}
Available mascots: {mascot_list}
Tournament theme: {theme_name}
```

---

## SMS / Twilio Integration

### Notification Events & Templates

All SMS copy: fun, exciting, concise, informative. All templates are in `smsService.js`.

| Event                              | Recipients                      | Template                                                                                                                                                                           |
|------------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| OTP verification                   | User signing up / logging in     | `Your Playoff Pal verification code is [CODE]. Let the games begin! 🎮\n\nBy verifying your number, you agree to receive automated updates, notifications, and promotional messages from Playoff Pal. Message and data rates may apply. Reply STOP to opt-out at any time.` |
| New signup request                 | Tournament creator               | `New challenger! [Player Name] wants to join [Team Name] in [Tournament Name]. Reply YES to accept or NO to deny! Go, team, go! 🚀`                                               |
| Signup accepted                    | New player                       | `You're IN! 🎉 Welcome to [Team Name] for [Tournament Name]. Share this link [Link] to help fill the rest of the bracket! See you on the court! 🏆`                               |
| New member joined                  | All existing team members        | `Team Update! 🚨 [Player Name] has just joined [Team Name] for the [Tournament Name]. Hype is real! 🔥`                                                                           |
| Minimum players reached            | Tournament creator only          | `The teams are full! 🥳 The minimum number of players for the [Tournament Name] has been reached. Click the START TOURNAMENT button to create the playoff bracket: [Link]`        |
| Round 1 / tournament start         | All players across all teams     | `IT'S GAME TIME! 🗓 Your first match in the [Tournament Name] is [Date] at [Time] in [Location]. Check the bracket: [Link]. May the best team win! 🥳`                           |
| 1-hour pre-round reminder          | All players across all teams     | `1 HOUR WARNING! 🔔 Round [N] of [Tournament Name] kicks off soon! Be there by [Time] at [Location]. Get ready! [Link]` — sent 1 hour before the first game of **every round**, not just Round 1 |
| Game result                        | Active players from both teams   | `Score Alert! 📣 [Winning Team] defeats [Losing Team] in Round [N] of [Tournament Name]! [Winning Team] advances! Who will they face next? [Link]`                                |
| Round completion                   | All players across all teams     | `Round [N] Complete! ✅ The bracket is set for the next round of [Tournament Name]. Get hyped for the matchups! [Link]`                                                            |
| Tournament winner / final round    | All players + creator            | `CHAMPIONS! 🥇 [Winning Team] has won the [Tournament Name] and the [Prize Name]! Unbelievable tournament! View the final bracket: [Link]`                                        |

### Twilio Inbound Webhook
- Endpoint: `POST /webhooks/twilio`
- Validate Twilio request signature on **every** request using `twilio.validateRequest`
- Parse `Body` field of inbound SMS for action keywords:
  - `YES` → approve player; `NO` → deny player
  - `STOP` / `STOPALL` / `UNSUBSCRIBE` / `CANCEL` / `END` / `QUIT` → Twilio handles delivery blocking automatically at carrier level; additionally, insert a row into `sms_opt_outs` with `source = 'stop_reply'`
  - `START` / `UNSTOP` / `YES` (after a STOP) → Twilio re-enables delivery; additionally, update the user's `sms_opt_outs` row setting `opted_in_at` = now()
- Lookup logic for inbound YES/NO reply:
  1. Resolve sender's `user_id` from `From` phone number in `users` table
  2. If sender is the **tournament creator** → find the most recent `pending` player across any team in the tournament
  3. If sender is a **team captain** → find the most recent `pending` player on **their team only** (captains have no authority over other teams' signups)
  4. If sender matches neither role → ignore the reply silently
- All webhook handlers must be idempotent

### SMS Send Guard (in `smsService.js`)
Before every non-OTP `sendSms()` call, check `sms_opt_outs` for the recipient:
```js
// smsService.js — guard pattern
export async function sendSms(toPhoneNumber, body, { isOtp = false } = {}) {
  if (!isOtp) {
    const optedOut = await isUserOptedOut(toPhoneNumber); // checks sms_opt_outs table
    if (optedOut) return; // skip silently — do not throw
  }
  await twilioClient.messages.create({ to: toPhoneNumber, from: process.env.TWILIO_PHONE_NUMBER, body });
}
```
OTP sends must always pass `{ isOtp: true }` to bypass the opt-out check.

---

## Static Assets

Express config (in `src/index.js`):
```js
app.use(express.static(path.join(__dirname, '../public')));
```
All asset URLs are root-relative — **never** include `/public/` in any template or route.

### Asset Directory Map

| Asset Type              | Directory                              | URL Prefix                          |
|-------------------------|----------------------------------------|-------------------------------------|
| Logo (full + icon)      | public/images/logo/                    | /images/logo/                       |
| Tournament type icons   | public/images/tournaments/{category}/  | /images/tournaments/{category}/     |
| Team mascot icons       | public/images/teams/mascots/           | /images/teams/mascots/              |
| Prize type icons        | public/images/prizes/                  | /images/prizes/                     |
| PP Mascot variants      | public/images/pp-mascot/               | /images/pp-mascot/                  |

### Logo & Favicon
- `/images/logo/playoff-pal-logo.png` — Full logo + wordmark. Nav header, login screen.
- `/images/logo/playoff-pal-icon.png` — Mascot icon only. Favicon, PWA icon.
- `/favicon.ico` — Copy of playoff-pal-icon.png as .ico

### Tournament Type Icons
Pattern: `/images/tournaments/${category-slug}/${theme-slug}.png`

Category slug map:
```
Sports      → sports
VideoGames  → video-games
BoardGames  → board-games
```

Theme slugs per category:
- **sports:** `basketball`, `football`, `soccer`, `wiffle-ball`, `baseball`, `tennis`, `pickleball`, `ping-pong`
- **video-games:** `super-smash-brothers`, `mario-kart`, `fortnite`
- **board-games:** `chess`, `checkers`, `go`

Always use `icon_path` from the `tournament_themes` DB record — do not construct paths ad-hoc in templates.

### Team Mascot Icons
Pattern: `/images/teams/mascots/${mascot-slug}.png`

All 28 mascot slugs:
`bear`, `beaver`, `blue-devil`, `bob`, `bobcat`, `bull`, `bull-dog`, `captain`,
`cardinal`, `cat`, `croc`, `eagle`, `elephant`, `hawk`, `horse`, `husky`,
`jay-hawk`, `knight`, `leprechaun`, `lion`, `lioness`, `owl`, `police`,
`ram`, `red-devil`, `tiger`, `turtle`, `wolf`

Always use `icon_path` from the `mascots` DB record.

### Prize Type Icons
Pattern: `/images/prizes/${prize-slug}.png`

Prize slugs: `bragging-rights`, `cash`, `gift-card`, `charity-donation`, `prize-basket`, `trophy`, `ribbon`, `medal`

### Playoff Pal Mascot (Referee Bot) Variants

| File                                        | Use When                                      |
|---------------------------------------------|-----------------------------------------------|
| `/images/pp-mascot/referee-idle.png`        | Default state, no active action               |
| `/images/pp-mascot/referee-thinking.png`    | AI processing / any loading wait state        |
| `/images/pp-mascot/referee-celebrating.png` | Winner announced, score confirmed, published  |
| `/images/pp-mascot/referee-whistle.png`     | Score dispute, override, error/alert          |
| `/images/pp-mascot/referee-welcome.png`     | Login screen, OTP verify, onboarding steps    |

### Image Size Conventions
- **256×256px (default)** — team card listings, icon grids, small popups, nav
- **512×512px (`@2x`)** — e.g. `/images/teams/mascots/eagle@2x.png` — large popups, detail views
- **1024×1024px (`@3x`)** — e.g. `/images/teams/mascots/eagle@3x.png` — tournament page hero
- Format: PNG; filenames: lowercase, hyphen-separated, no spaces
- No user-uploaded images in MVP — all images are bundled static assets

---

## UI & Design System

### Color Palette (CSS Variables)
```css
:root {
  --color-gold:    #FFD700;  /* Winner's Gold — CTA buttons, trophies, champions  */
  --color-blue:    #00BFFF;  /* Playoff Blue — nav, links, AI referee glow         */
  --color-red:     #FF4500;  /* Victory Red — alerts, Final Round tags              */
  --color-green:   #32CD32;  /* Court Green — success states, START button         */
  --color-purple:  #9370DB;  /* Fun Purple — board games, creative tournaments      */
  --color-orange:  #FFA500;  /* Championship Orange — active brackets, 2° buttons   */
  --color-gray:    #A8ABA9;  /* Friendly Gray — borders, inactive, backgrounds      */
}
```

### Typography
- **Headline:** Rocket Grotesk (fallback: Nunito, Fredoka One) — Bold, Rounded Sans-Serif
  - Use for: App logo, tournament titles, round headers, "You Won!" popups
- **Body:** Open Sans or Inter — Clean Geometric Sans-Serif
  - Use for: Player names, scores, bracket data, dates, settings, form labels

### Animation Libraries
- **GSAP** — All major transitions, bracket reveals, entrance animations, state changes
- **SweetAlert2** — Score report modal, winner confirmations, errors, disputes
  - Apply Playoff Pal color palette to all SweetAlert2 themes
  - Include the appropriate `pp-mascot` variant image in every SweetAlert2 popup

### Animation Trigger Map

| UI Event                      | GSAP Animation                | Mascot Variant            | SweetAlert2 |
|-------------------------------|-------------------------------|---------------------------|-------------|
| AI generating content         | Mascot pulse/bounce loop      | referee-thinking          | No          |
| Tournament published           | Confetti burst + panel slide  | referee-celebrating       | Yes         |
| START TOURNAMENT pressed      | Bracket reveal animation      | referee-celebrating       | Yes         |
| Score submitted               | Button bounce + checkmark     | referee-celebrating       | Yes         |
| Score dispute / override      | Shake + red flash             | referee-whistle           | Yes         |
| Match result confirmed        | Bracket connector highlight   | referee-celebrating       | Yes         |
| Error / failed action         | Shake animation               | referee-whistle           | Yes         |
| Login / OTP screen load       | Staggered entrance fade+slide | referee-welcome           | No          |
| Any loading/wait state        | Mascot idle bounce loop       | referee-thinking          | No          |

### Responsive Design Rules
- Mobile-first: base layout at 375px, scale up with breakpoints for tablet (768px) and desktop (1024px)
- All touch targets: minimum 44×44px
- Bracket view: horizontally scrollable on mobile (`overflow-x: auto`)
- Navigation: bottom tab bar on mobile, top nav bar on desktop
- Popups/modals: always animate open (scale + fade in) and close (scale + fade out) via GSAP

---

## SQL Seed Scripts

### Static Data (`seeds/static/`) — run once on fresh DB, before any sample data

**`themes.sql`** — All tournament theme rows with: category, theme_name, format, active_players_per_side, icon_path
All formats for all sports must be included (e.g. Basketball has 1x1, 2x2, 3x3, 4x4, 5x5 — each is a separate row).

**`mascots.sql`** — All 28 mascots: id, name, slug, icon_path

**`prize_types.sql`** — All 8 prize types: id, name, slug, icon_path

### Sample Data (`seeds/sample/`) — for local dev and QA

**`sample_tournaments.sql`** — One complete tournament per state:

| Name                | State      | Teams | Notes                                                             |
|---------------------|------------|-------|-------------------------------------------------------------------|
| "Draft Hoops"       | draft      | 4     | Created but not yet published; teams named, no players yet        |
| "Signup Showdown"   | signup     | 8     | Published; mix of full and partial teams; some pending approvals  |
| "Mid-Season Mario"  | gameplay   | 4     | Bracket active; round 1 partially complete (2 matches done)       |
| "Chess Champions"   | ended      | 4     | All rounds complete; winner declared; final bracket set           |

Each sample tournament must include: tournament row, teams, players (2–4 per team with correct
min/max for the theme), matches with full bracket structure, match_players assignments,
score_reports for completed matches.

---

## Code Conventions

- **ES Modules** (`import`/`export`) — no CommonJS `require()`
- **async/await** for all DB and API calls — no `.then()` chains
- **Consistent response format for all API endpoints:**
  ```js
  { success: true, data: { ... } }
  { success: false, error: "Human-readable message", code: "ERROR_CODE" }
  ```
- **JSDoc on every exported function** — `@param`, `@returns`, one-line description
- Commit messages: imperative mood, under 72 characters
- Feature branches before significant changes; merge to master after local verification

---

## Documentation Auto-Enforcement Rules

Claude must apply these rules automatically on every code generation task:

1. **New migration** → append table definition + purpose to `docs/schema.md`
2. **New function/service** → add JSDoc entry to `docs/functions.md`
3. **New route/endpoint** → add to `docs/api.md` (method, path, auth required, body params, response shape)
4. **New env var** → add to `.env.local.example` with empty value and inline comment
5. **README.md** → update Local Setup section after any dependency or config changes

---

## Deployment: Railway (Production)

- Node.js service start command: `npm start`
- MySQL 8 plugin: Railway injects `MYSQL_URL` or individual `MYSQL_*` environment variables
- All env vars set via Railway dashboard — never in committed code
- `NODE_ENV=production` must be set in Railway env vars
- GitHub integration: push to `master` → Railway auto-deploys
- On first deploy: run `npm run migrate` then `npm run seed:static` via Railway CLI or console

---

## Remaining Open Questions

All 🔴 MVP blockers and all 🟡 beta blockers are fully resolved and incorporated above.
Only post-MVP future features remain open.

### 🟢 Post-MVP / Future Spec

1. **AI image generation** — Player/team avatars, prize images listed as future features.
2. **Creator monetization** — Payments, entry fees, sponsorships listed as future features.
3. **Leagues / permanent teams** — Listed as future feature.
4. **PWA / add-to-home-screen** — Responsive web only for MVP; PWA post-MVP.
5. **Odd team counts with byes** — MVP enforces powers of 2 only; post-MVP can add support.
6. **Double elimination / round-robin** — Single elimination only for MVP.
