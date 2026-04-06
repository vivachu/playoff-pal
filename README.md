# Playoff Pal

Mobile-first web app for creating and managing single-elimination tournaments among friends. Pick a theme, invite friends to teams, and battle through a bracket. AI auto-generates descriptions, rules, and team names. SMS handles auth and all notifications.

---

## Local Development Setup

### Prerequisites
- Node.js v22.22.1 (use `nvm install 22.22.1 && nvm use 22.22.1`)
- MySQL 8.x running locally

### Install dependencies
```bash
npm install
```

### Environment variables
Copy the example file and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Required values to fill in:
| Variable | Description |
|---|---|
| `DB_USER` / `DB_PASSWORD` | MySQL credentials |
| `SESSION_SECRET` | Any random string (e.g. `openssl rand -hex 32`) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | From twilio.com |
| `TWILIO_WEBHOOK_URL` | Public URL for your `/webhooks/twilio` endpoint (use ngrok in dev) |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `HASHIDS_SALT` | Any random string |

### Database setup
```bash
# Create the database first
mysql -u root -e "CREATE DATABASE IF NOT EXISTS playoffpal_dev;"

# Run all migrations
npm run migrate

# Load static reference data (themes, mascots, prize types)
npm run seed:static

# Optionally load sample tournament data for testing
npm run seed:sample
```

### Run the dev server
```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Dev Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (nodemon) |
| `npm start` | Start production server |
| `npm run migrate` | Run all pending DB migrations |
| `npm run migrate:rollback` | Rollback the last migration |
| `npm run seed:static` | Load static reference data |
| `npm run seed:sample` | Load sample tournament data (4 tournaments in all states) |
| `npm run seed:clear` | Clear all seed data from dev DB |
| `npm run lint` | ESLint check |

---

## Project Structure

```
src/
  config/       — DB pool, Twilio client, Anthropic client
  controllers/  — Request handlers (auth, account, tournaments, teams, players, matches, ai, webhooks)
  middleware/   — Auth guard, error handler, OTP rate limiter
  models/       — DB query functions per table
  routes/       — Express routers
  services/     — Business logic (SMS, AI, bracket, scoring, share codes, avatars)
  views/        — Handlebars templates (layouts, partials, pages)
migrations/     — Numbered SQL migration files (never edit past ones)
seeds/
  static/       — themes.sql, mascots.sql, prize_types.sql
  sample/       — sample_tournaments.sql (4 tournaments across all states)
scripts/
  migrate.js    — Migration runner
  seed.js       — Seed runner
public/
  css/main.css  — App styles (CSS variables, components, responsive)
  js/main.js    — Client-side JS (GSAP animations, SweetAlert2 modals, wizard)
docs/
  schema.md     — DB schema reference
  api.md        — Route/endpoint reference
  functions.md  — Service/model function reference
```

---

## Deployment (Railway)

1. Connect your GitHub repo to a Railway project
2. Add a MySQL 8 plugin
3. Set all env vars from `.env.local.example` in the Railway dashboard (`NODE_ENV=production`)
4. Start command: `npm start`
5. On first deploy, run via Railway console:
   ```bash
   npm run migrate && npm run seed:static
   ```

Push to `master` → Railway auto-deploys.
