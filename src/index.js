import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load env before any config imports that read process.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, `../.env.${process.env.NODE_ENV || 'local'}`) });

import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';

import { errorHandler } from './middleware/errorHandler.js';

const MySQLStore = MySQLStoreFactory(session);
const app = express();

// ── View engine ──────────────────────────────────────────────────────────────
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: join(__dirname, 'views/layouts'),
  partialsDir: join(__dirname, 'views/partials'),
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
// TODO: mount routes as each is implemented
// import authRouter from './routes/auth.js';        // /auth
// import accountRouter from './routes/account.js';  // /account
// import tournamentsRouter from './routes/tournaments.js'; // /tournaments
// import teamsRouter from './routes/teams.js';       // /teams
// import playersRouter from './routes/players.js';   // /players
// import matchesRouter from './routes/matches.js';   // /matches
// import aiRouter from './routes/ai.js';             // /ai
// import webhooksRouter from './routes/webhooks.js'; // /webhooks

// app.use('/auth', authRouter);
// app.use('/account', accountRouter);
// app.use('/tournaments', tournamentsRouter);
// app.use('/teams', teamsRouter);
// app.use('/players', playersRouter);
// app.use('/matches', matchesRouter);
// app.use('/ai', aiRouter);
// app.use('/webhooks', webhooksRouter);

// Temporary 501 catch-all until routes are built
app.use((req, res, next) => {
  res.status(501).json({ success: false, error: 'Not implemented yet.', code: 'NOT_IMPLEMENTED' });
});

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Playoff Pal running on http://localhost:${PORT} [${process.env.NODE_ENV || 'local'}]`);
});

export default app;
