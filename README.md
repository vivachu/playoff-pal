# Playoff Pal

Playoff Pal is a mobile-first web app for creating and managing fun real-life tournaments among friends. Pick a theme, invite teams, and battle it out in a single-elimination bracket. AI auto-generates tournament descriptions, rules, and team names. SMS handles auth and notifications.

## Local Development Setup

### Prerequisites
- Node.js v22.22.1 (use `nvm` to pin)
- MySQL 8.x running locally

### Install
```bash
npm install
```

### Environment Variables

Copy the example file and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Required values for local dev:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=playoffpal_dev
DB_USER=<your mysql user>
DB_PASSWORD=<your mysql password>
SESSION_SECRET=<any random string>
ANTHROPIC_API_KEY=<your Anthropic key>
TWILIO_ACCOUNT_SID=<your Twilio SID>
TWILIO_AUTH_TOKEN=<your Twilio token>
TWILIO_PHONE_NUMBER=<your Twilio number>
HASHIDS_SALT=<any random string>
```

### Database Setup

Create the database and user in MySQL:
```sql
CREATE DATABASE IF NOT EXISTS playoffpal_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'playoffpal'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON playoffpal_dev.* TO 'playoffpal'@'localhost';
FLUSH PRIVILEGES;
```

Run migrations to create all tables:
```bash
npm run migrate
```

Load static reference data (themes, mascots, prize types):
```bash
npm run seed:static
```

Optionally load sample tournament data for testing:
```bash
npm run seed:sample
```

To wipe all seed data and start fresh:
```bash
npm run seed:clear
```

### Running the App
```bash
npm run dev    # dev server with hot reload (nodemon)
npm start      # production server
```

---

## Sample Data

Running `npm run seed:sample` loads four tournaments — one in each lifecycle state — plus 20 test users you can log in as.

> **Auth note:** The app uses SMS OTP for login. In local dev, check your Twilio logs or console output for the OTP code sent to each test number.

### Test Users

All test phone numbers follow the pattern `+1555000100N`.

| # | Name | Phone | Role in sample data |
|---|------|-------|---------------------|
| 1 | Alex Johnson | `+15550001001` | Creator of Draft Hoops |
| 2 | Sam Williams | `+15550001002` | Creator of Signup Showdown; also a player on Mighty Rams |
| 3 | Jordan Lee | `+15550001003` | Creator of Mid-Season Mario; captain of Blue Devils (Signup) |
| 4 | Casey Brown | `+15550001004` | Creator of Chess Champions |
| 5 | Riley Martinez | `+15550001005` | Captain: Howling Wolves (Signup), Turbo Turtles (Mario) |
| 6 | Morgan Davis | `+15550001006` | Player: Howling Wolves, Turbo Turtles |
| 7 | Taylor Wilson | `+15550001007` | Captain: Iron Knights (Signup), Speed Cats (Mario) |
| 8 | Jamie Anderson | `+15550001008` | Captain: Thunder Hawks (Signup); player: Speed Cats |
| 9 | Drew Thompson | `+15550001009` | Captain: Iron Knights (Signup), Nitro Bobcats (Mario) |
| 10 | Avery Jackson | `+15550001010` | Player: Iron Knights, Nitro Bobcats |
| 11 | Quinn Harris | `+15550001011` | Pending on Iron Knights (Signup); captain: Drift Huskies (Mario) |
| 12 | Blake Martin | `+15550001012` | Captain: Silver Owls (Signup); player: Drift Huskies |
| 13 | Cameron White | `+15550001013` | Player: Silver Owls (Signup); captain: White Knights (Chess) |
| 14 | Sage Garcia | `+15550001014` | Captain: Royal Lions (Signup); player: White Knights |
| 15 | Rowan Clark | `+15550001015` | Pending on Royal Lions (Signup); captain: Shadow Owls (Chess) |
| 16 | Phoenix Lewis | `+15550001016` | Captain: Blazing Cardinals (Signup); player: Shadow Owls |
| 17 | Skyler Robinson | `+15550001017` | Player: Blazing Cardinals (Signup); captain: Crimson Lions (Chess) |
| 18 | Parker Hall | `+15550001018` | Pending on Blazing Cardinals (Signup); player: Crimson Lions |
| 19 | Hayden Young | `+15550001019` | Captain: Mighty Rams (Signup); captain: Iron Bears (Chess) |
| 20 | Remi Walker | `+15550001020` | Player: Mighty Rams, Iron Bears |

### Tournaments

#### 1. Draft Hoops — `draft`
- **Theme:** Basketball 3x3 (min 3 players/team)
- **Teams:** 4 (Charging Bulls, Soaring Eagles, Fierce Tigers, Raging Bears)
- **Players:** None yet
- **Use this to test:** The creation wizard, draft preview mode, publishing flow
- **Log in as:** Alex Johnson (`+15550001001`)

#### 2. Signup Showdown — `signup`
- **Theme:** Pickleball 2x2 (min 2 players/team)
- **Teams:** 8 — mix of full, partial, and teams with pending requests
- **Player breakdown:**

  | Team | Status | Players |
  |------|--------|---------|
  | Howling Wolves | 3 approved — above minimum | Riley (captain), Morgan, Taylor |
  | Thunder Hawks | 1 approved — partial | Jamie (captain) |
  | Iron Knights | 2 approved + 1 pending | Drew (captain), Avery; Quinn pending |
  | Silver Owls | 2 approved — at minimum | Blake (captain), Cameron |
  | Royal Lions | 1 approved + 1 pending — partial | Sage (captain); Rowan pending |
  | Blazing Cardinals | 2 approved + 1 pending | Phoenix (captain), Skyler; Parker pending |
  | Mighty Rams | 3 approved — above minimum | Hayden (captain), Remi, Sam |
  | Blue Devils | 1 approved — partial | Jordan (captain) |

- **Use this to test:** Signup board, approving/denying players (YES/NO SMS), the pending state, the START TOURNAMENT button (not yet unlocked — not all teams at minimum)
- **Log in as creator:** Sam Williams (`+15550001002`) to approve pending requests
- **Log in as captain:** Drew Thompson (`+15550001009`) to manage Iron Knights signups

#### 3. Mid-Season Mario — `gameplay`
- **Theme:** Mario Kart 1x1 (min 1 player/team)
- **Teams:** 4 — Round 1 complete, Championship scheduled

  | Team | Status | Players |
  |------|--------|---------|
  | Turbo Turtles (seed 1) | Active — in Championship | Riley (captain, sat in final), Morgan (plays Championship) |
  | Speed Cats (seed 2) | Active — in Championship | Taylor (captain, sat in final), Jamie (plays Championship) |
  | Nitro Bobcats (seed 3) | Eliminated — lost Round 1 | Drew (captain), Avery |
  | Drift Huskies (seed 4) | Eliminated — lost Round 1 | Quinn (captain), Blake |

- **Round 1 results:** Turbo Turtles beat Drift Huskies 3–1; Speed Cats beat Nitro Bobcats 5–2
- **Championship:** Turbo Turtles vs Speed Cats — scheduled, no score yet
- **Use this to test:** Live bracket view, the Report Score modal, score confirmation flow, player rotation in match cards
- **Log in as:** Morgan Davis (`+15550001006`) or Jamie Anderson (`+15550001008`) — both are the active players in the Championship match

#### 4. Chess Champions — `ended`
- **Theme:** Chess 1x1 (min 1 player/team)
- **Teams:** 4 — all rounds complete

  | Team | Status | Players |
  |------|--------|---------|
  | White Knights (seed 1) | **WINNER** | Cameron (captain, played semi), Sage (played final) |
  | Shadow Owls (seed 2) | Eliminated — lost final | Rowan (captain, played semi), Phoenix (played final) |
  | Crimson Lions (seed 3) | Eliminated — lost semi | Skyler (captain), Parker |
  | Iron Bears (seed 4) | Eliminated — lost semi | Hayden (captain), Remi |

- **Final bracket:** White Knights defeated Shadow Owls 1–0 in the Championship
- **Use this to test:** Read-only ended state, winner display, final bracket rendering
- **Log in as:** Cameron White (`+15550001013`) to view from the champion's perspective

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm start` | Start production server |
| `npm run migrate` | Run all pending DB migrations |
| `npm run migrate:rollback` | Roll back the last migration |
| `npm run seed:static` | Load themes, mascots, and prize types |
| `npm run seed:sample` | Load sample tournaments and test users |
| `npm run seed:clear` | Wipe all seed data |
| `npm test` | Run test suite |
| `npm run lint` | ESLint check |

---

## Deployment (Railway)

- Push to `master` → Railway auto-deploys
- Set all env vars from `.env.local.example` in the Railway dashboard
- On first deploy, run via Railway console:
  ```bash
  npm run migrate
  npm run seed:static
  ```
