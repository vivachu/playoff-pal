import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { engine } from 'express-handlebars';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';

import { errorHandler } from './middleware/errorHandler.js';

import authRouter        from './routes/auth.js';
import accountRouter     from './routes/account.js';
import tournamentsRouter from './routes/tournaments.js';
import teamsRouter       from './routes/teams.js';
import playersRouter     from './routes/players.js';
import matchesRouter     from './routes/matches.js';
import aiRouter          from './routes/ai.js';
import webhooksRouter    from './routes/webhooks.js';

const MySQLStore = MySQLStoreFactory(session);
const app = express();

// ── View engine ──────────────────────────────────────────────────────────────
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: join(__dirname, 'views/layouts'),
  partialsDir: join(__dirname, 'views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    json: (val) => JSON.stringify(val),
    formatDate: (d) => d ? new Date(d).toLocaleString() : '',
  },
}));
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

// ── Static assets ─────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '../public')));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ───────────────────────────────────────────────────────────────────
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',      authRouter);
app.use('/account',   accountRouter);
app.use('/webhooks',  webhooksRouter);
app.use('/matches',   matchesRouter);
app.use('/ai',        aiRouter);
app.use('/',          tournamentsRouter);   // handles GET /, GET /t/:shareCode, GET /tournaments/create
app.use('/',          teamsRouter);         // handles POST /tournaments/:id/teams
app.use('/',          playersRouter);       // handles POST /teams/:id/players, PATCH /players/:id/status

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Playoff Pal running on http://localhost:${PORT} [${process.env.NODE_ENV || 'local'}]`);
});

export default app;
