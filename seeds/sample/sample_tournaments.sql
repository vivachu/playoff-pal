-- =============================================================================
-- Sample seed data: four tournaments in each lifecycle state
-- Depends on static seeds (themes, mascots, prize_types) already loaded.
-- Run with: npm run seed:sample
-- Clear with: npm run seed:clear
-- =============================================================================

-- ─── Users (20 total) ─────────────────────────────────────────────────────────
-- Users 1–4 are tournament creators. Users 5–20 are players reused across
-- tournaments so the dataset stays small but realistic.

INSERT IGNORE INTO users (id, phone_number, first_name, last_name, created_at, updated_at) VALUES
(1,  '+15550001001', 'Alex',    'Johnson',  '2026-03-01 10:00:00', '2026-03-01 10:00:00'),
(2,  '+15550001002', 'Sam',     'Williams', '2026-03-01 10:05:00', '2026-03-01 10:05:00'),
(3,  '+15550001003', 'Jordan',  'Lee',      '2026-03-01 10:10:00', '2026-03-01 10:10:00'),
(4,  '+15550001004', 'Casey',   'Brown',    '2026-03-01 10:15:00', '2026-03-01 10:15:00'),
(5,  '+15550001005', 'Riley',   'Martinez', '2026-03-05 09:00:00', '2026-03-05 09:00:00'),
(6,  '+15550001006', 'Morgan',  'Davis',    '2026-03-05 09:05:00', '2026-03-05 09:05:00'),
(7,  '+15550001007', 'Taylor',  'Wilson',   '2026-03-05 09:10:00', '2026-03-05 09:10:00'),
(8,  '+15550001008', 'Jamie',   'Anderson', '2026-03-05 09:15:00', '2026-03-05 09:15:00'),
(9,  '+15550001009', 'Drew',    'Thompson', '2026-03-05 09:20:00', '2026-03-05 09:20:00'),
(10, '+15550001010', 'Avery',   'Jackson',  '2026-03-05 09:25:00', '2026-03-05 09:25:00'),
(11, '+15550001011', 'Quinn',   'Harris',   '2026-03-05 09:30:00', '2026-03-05 09:30:00'),
(12, '+15550001012', 'Blake',   'Martin',   '2026-03-05 09:35:00', '2026-03-05 09:35:00'),
(13, '+15550001013', 'Cameron', 'White',    '2026-03-10 08:00:00', '2026-03-10 08:00:00'),
(14, '+15550001014', 'Sage',    'Garcia',   '2026-03-10 08:05:00', '2026-03-10 08:05:00'),
(15, '+15550001015', 'Rowan',   'Clark',    '2026-03-10 08:10:00', '2026-03-10 08:10:00'),
(16, '+15550001016', 'Phoenix', 'Lewis',    '2026-03-10 08:15:00', '2026-03-10 08:15:00'),
(17, '+15550001017', 'Skyler',  'Robinson', '2026-03-10 08:20:00', '2026-03-10 08:20:00'),
(18, '+15550001018', 'Parker',  'Hall',     '2026-03-10 08:25:00', '2026-03-10 08:25:00'),
(19, '+15550001019', 'Hayden',  'Young',    '2026-03-10 08:30:00', '2026-03-10 08:30:00'),
(20, '+15550001020', 'Remi',    'Walker',   '2026-03-10 08:35:00', '2026-03-10 08:35:00');

-- ─── Tournaments ──────────────────────────────────────────────────────────────
-- theme_id reference:
--   3  = Basketball 3x3   (active_players_per_side=3, min=3, max=15)
--  19  = Pickleball 2x2   (active_players_per_side=2, min=2, max=10)
--  24  = Mario Kart 1x1   (active_players_per_side=1, min=1, max=5)
--  30  = Chess 1x1        (active_players_per_side=1, min=1, max=5)
-- prize_type_id: 1=Bragging Rights 2=Cash 6=Trophy 7=Ribbon

INSERT IGNORE INTO tournaments
  (id, share_code, creator_user_id, title, description, theme_id, game_rules,
   status, prize_type_id, prize_description, location, start_datetime, timezone,
   num_teams, created_at, updated_at)
VALUES

-- 1. Draft Hoops — draft state (creator-only preview; no players yet)
(1, 'dr4fth', 1,
 'Draft Hoops',
 'Four squads battle it out in fast-paced 3-on-3 basketball. First to 21 wins!',
 3,
 'First to 21 points wins, win by 2, cap at 32. Inside the arc = 1 pt, outside = 2 pts. Winners ball after each made basket.',
 'draft', 6, NULL,
 'Nick''s House',
 '2026-04-12 14:00:00', 'America/New_York',
 4, '2026-04-01 09:00:00', '2026-04-01 09:00:00'),

-- 2. Signup Showdown — signup state (published; mix of full/partial teams + pending approvals)
(2, 's1gn2p', 2,
 'Signup Showdown',
 'Eight doubles teams square off in a fierce pickleball tournament. Grab your paddle and let''s rally!',
 19,
 'Games to 11, win by 2, cap at 15. Rally scoring every point. Kitchen violations = point for opponent. Best of 3 games per match.',
 'signup', 2, '$50 split between winning team members',
 'Community Center Court 3',
 '2026-04-20 10:00:00', 'America/Chicago',
 8, '2026-03-28 14:00:00', '2026-03-28 14:00:00'),

-- 3. Mid-Season Mario — gameplay state (Round 1 complete; Championship upcoming today)
(3, 'mrkart', 3,
 'Mid-Season Mario',
 'The ultimate Mario Kart showdown! Four racers enter, one champion emerges. Blue shells not included.',
 24,
 '3-race series per match on random tracks. Points: 1st=3, 2nd=2, 3rd=1, 4th=0. Most points after 3 races wins. Ties broken by most 1st-place finishes.',
 'gameplay', 1, NULL,
 'Jordan''s Living Room',
 '2026-04-05 13:00:00', 'America/Los_Angeles',
 4, '2026-03-25 11:00:00', '2026-04-05 14:10:00'),

-- 4. Chess Champions — ended state (all rounds complete; winner declared)
(4, 'ch3smp', 4,
 'Chess Champions',
 'A battle of wits and strategy. Four players compete for the title of Westside Chess Champion!',
 30,
 'Standard FIDE rules. 15-minute clock per player. Resignation, checkmate, or timeout ends the game. No draws — play to a result.',
 'ended', 7, NULL,
 'Westside Library Meeting Room',
 '2026-03-22 10:00:00', 'America/New_York',
 4, '2026-03-15 10:00:00', '2026-03-22 12:00:00');

-- ─── Teams ────────────────────────────────────────────────────────────────────
-- mascot_id reference (from mascots table):
--   1=Bear  3=Blue Devil  5=Bobcat  6=Bull  9=Cardinal  10=Cat
--  12=Eagle 14=Hawk      16=Husky  18=Knight 20=Lion    22=Owl
--  24=Ram   26=Tiger     27=Turtle 28=Wolf

INSERT IGNORE INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at) VALUES

-- Tournament 1: Draft Hoops (4 teams, no players yet, no seeds assigned)
(1,  1, 'Charging Bulls',    6,  NULL, 'active',     '2026-04-01 09:05:00'),
(2,  1, 'Soaring Eagles',    12, NULL, 'active',     '2026-04-01 09:05:00'),
(3,  1, 'Fierce Tigers',     26, NULL, 'active',     '2026-04-01 09:05:00'),
(4,  1, 'Raging Bears',      1,  NULL, 'active',     '2026-04-01 09:05:00'),

-- Tournament 2: Signup Showdown (8 teams, no seeds yet — set when bracket generates)
(5,  2, 'Howling Wolves',    28, NULL, 'active',     '2026-03-28 14:05:00'),
(6,  2, 'Thunder Hawks',     14, NULL, 'active',     '2026-03-28 14:05:00'),
(7,  2, 'Iron Knights',      18, NULL, 'active',     '2026-03-28 14:05:00'),
(8,  2, 'Silver Owls',       22, NULL, 'active',     '2026-03-28 14:05:00'),
(9,  2, 'Royal Lions',       20, NULL, 'active',     '2026-03-28 14:05:00'),
(10, 2, 'Blazing Cardinals', 9,  NULL, 'active',     '2026-03-28 14:05:00'),
(11, 2, 'Mighty Rams',       24, NULL, 'active',     '2026-03-28 14:05:00'),
(12, 2, 'Blue Devils',       3,  NULL, 'active',     '2026-03-28 14:05:00'),

-- Tournament 3: Mid-Season Mario (Round 1 complete; 2 teams remain)
(13, 3, 'Turbo Turtles',     27, 1, 'active',        '2026-03-25 11:05:00'),  -- advancing to championship
(14, 3, 'Speed Cats',        10, 2, 'active',        '2026-03-25 11:05:00'),  -- advancing to championship
(15, 3, 'Nitro Bobcats',     5,  3, 'eliminated',    '2026-03-25 11:05:00'),  -- lost semi
(16, 3, 'Drift Huskies',     16, 4, 'eliminated',    '2026-03-25 11:05:00'),  -- lost semi

-- Tournament 4: Chess Champions (complete)
(17, 4, 'White Knights',     18, 1, 'winner',        '2026-03-15 10:05:00'),  -- CHAMPION
(18, 4, 'Shadow Owls',       22, 2, 'eliminated',    '2026-03-15 10:05:00'),  -- finalist
(19, 4, 'Crimson Lions',     20, 3, 'eliminated',    '2026-03-15 10:05:00'),  -- semi loss
(20, 4, 'Iron Bears',        1,  4, 'eliminated',    '2026-03-15 10:05:00');  -- semi loss

-- ─── Players ──────────────────────────────────────────────────────────────────
-- Tournament 2 (Pickleball 2x2, min_players=2):
--   Teams 5,7,10,11 are at/above minimum; teams 6,8,9,12 are partial.
--   Teams 7,9,10 have pending signup requests.
--
-- Tournaments 3 & 4 (1x1 format, min_players=1):
--   Each team has 2 approved players for rotation depth.

INSERT IGNORE INTO players
  (id, team_id, user_id, display_name, phone_number, is_captain, status, created_at)
VALUES

-- ── Signup Showdown (teams 5–12) ───────────────────────────────────────────
-- Team 5: Howling Wolves — 3 approved (above minimum)
(1,  5,  5,  'Riley Martinez',  '+15550001005', 1, 'approved', '2026-03-29 08:00:00'),
(2,  5,  6,  'Morgan Davis',    '+15550001006', 0, 'approved', '2026-03-29 08:30:00'),
(3,  5,  7,  'Taylor Wilson',   '+15550001007', 0, 'approved', '2026-03-29 09:00:00'),
-- Team 6: Thunder Hawks — 1 approved (partial; needs 1 more)
(4,  6,  8,  'Jamie Anderson',  '+15550001008', 1, 'approved', '2026-03-29 10:00:00'),
-- Team 7: Iron Knights — 2 approved + 1 pending
(5,  7,  9,  'Drew Thompson',   '+15550001009', 1, 'approved', '2026-03-30 07:00:00'),
(6,  7,  10, 'Avery Jackson',   '+15550001010', 0, 'approved', '2026-03-30 07:30:00'),
(7,  7,  11, 'Quinn Harris',    '+15550001011', 0, 'pending',  '2026-03-30 08:00:00'),
-- Team 8: Silver Owls — 2 approved (at minimum)
(8,  8,  12, 'Blake Martin',    '+15550001012', 1, 'approved', '2026-03-30 09:00:00'),
(9,  8,  13, 'Cameron White',   '+15550001013', 0, 'approved', '2026-03-30 09:30:00'),
-- Team 9: Royal Lions — 1 approved + 1 pending (partial)
(10, 9,  14, 'Sage Garcia',     '+15550001014', 1, 'approved', '2026-03-31 08:00:00'),
(11, 9,  15, 'Rowan Clark',     '+15550001015', 0, 'pending',  '2026-03-31 08:30:00'),
-- Team 10: Blazing Cardinals — 2 approved + 1 pending
(12, 10, 16, 'Phoenix Lewis',   '+15550001016', 1, 'approved', '2026-03-31 10:00:00'),
(13, 10, 17, 'Skyler Robinson', '+15550001017', 0, 'approved', '2026-03-31 10:30:00'),
(14, 10, 18, 'Parker Hall',     '+15550001018', 0, 'pending',  '2026-03-31 11:00:00'),
-- Team 11: Mighty Rams — 3 approved (creator Sam also plays)
(15, 11, 19, 'Hayden Young',    '+15550001019', 1, 'approved', '2026-04-01 07:00:00'),
(16, 11, 20, 'Remi Walker',     '+15550001020', 0, 'approved', '2026-04-01 07:30:00'),
(17, 11, 2,  'Sam Williams',    '+15550001002', 0, 'approved', '2026-04-01 08:00:00'),
-- Team 12: Blue Devils — 1 approved (partial; creator Jordan playing)
(18, 12, 3,  'Jordan Lee',      '+15550001003', 1, 'approved', '2026-04-01 09:00:00'),

-- ── Mid-Season Mario (teams 13–16) ─────────────────────────────────────────
-- Team 13: Turbo Turtles
(19, 13, 5,  'Riley Martinez',  '+15550001005', 1, 'approved', '2026-03-26 08:00:00'),
(20, 13, 6,  'Morgan Davis',    '+15550001006', 0, 'approved', '2026-03-26 08:30:00'),
-- Team 14: Speed Cats
(21, 14, 7,  'Taylor Wilson',   '+15550001007', 1, 'approved', '2026-03-26 09:00:00'),
(22, 14, 8,  'Jamie Anderson',  '+15550001008', 0, 'approved', '2026-03-26 09:30:00'),
-- Team 15: Nitro Bobcats (eliminated)
(23, 15, 9,  'Drew Thompson',   '+15550001009', 1, 'approved', '2026-03-26 10:00:00'),
(24, 15, 10, 'Avery Jackson',   '+15550001010', 0, 'approved', '2026-03-26 10:30:00'),
-- Team 16: Drift Huskies (eliminated)
(25, 16, 11, 'Quinn Harris',    '+15550001011', 1, 'approved', '2026-03-26 11:00:00'),
(26, 16, 12, 'Blake Martin',    '+15550001012', 0, 'approved', '2026-03-26 11:30:00'),

-- ── Chess Champions (teams 17–20) ──────────────────────────────────────────
-- Team 17: White Knights (CHAMPION)
(27, 17, 13, 'Cameron White',   '+15550001013', 1, 'approved', '2026-03-16 08:00:00'),
(28, 17, 14, 'Sage Garcia',     '+15550001014', 0, 'approved', '2026-03-16 08:30:00'),
-- Team 18: Shadow Owls (finalist)
(29, 18, 15, 'Rowan Clark',     '+15550001015', 1, 'approved', '2026-03-16 09:00:00'),
(30, 18, 16, 'Phoenix Lewis',   '+15550001016', 0, 'approved', '2026-03-16 09:30:00'),
-- Team 19: Crimson Lions
(31, 19, 17, 'Skyler Robinson', '+15550001017', 1, 'approved', '2026-03-16 10:00:00'),
(32, 19, 18, 'Parker Hall',     '+15550001018', 0, 'approved', '2026-03-16 10:30:00'),
-- Team 20: Iron Bears
(33, 20, 19, 'Hayden Young',    '+15550001019', 1, 'approved', '2026-03-16 11:00:00'),
(34, 20, 20, 'Remi Walker',     '+15550001020', 0, 'approved', '2026-03-16 11:30:00');

-- ─── Matches ──────────────────────────────────────────────────────────────────
-- score_report_deadline = scheduled_start + 80 minutes (20 min game + 1 hr window)
-- Tournaments 1 & 2 have no matches (draft/signup states).

INSERT IGNORE INTO matches
  (id, tournament_id, round_number, match_number,
   home_team_id, away_team_id, winner_team_id,
   status, is_bye, location,
   scheduled_start, score_report_deadline,
   referee_override, created_at, updated_at)
VALUES

-- ── Mid-Season Mario: Round 1 (Semifinals) — both completed ────────────────
(1, 3, 1, 1, 13, 16, 13, 'completed', 0, NULL,
 '2026-04-05 13:00:00', '2026-04-05 14:20:00', 0,
 '2026-04-05 13:00:00', '2026-04-05 13:50:00'),   -- Turbo Turtles beat Drift Huskies

(2, 3, 1, 2, 14, 15, 14, 'completed', 0, NULL,
 '2026-04-05 13:20:00', '2026-04-05 14:40:00', 0,
 '2026-04-05 13:00:00', '2026-04-05 14:10:00'),   -- Speed Cats beat Nitro Bobcats

-- ── Mid-Season Mario: Round 2 (Championship) — scheduled later today ───────
(3, 3, 2, 1, 13, 14, NULL, 'scheduled', 0, NULL,
 '2026-04-05 14:30:00', '2026-04-05 15:50:00', 0,
 '2026-04-05 14:11:00', '2026-04-05 14:11:00'),   -- Turbo Turtles vs Speed Cats

-- ── Chess Champions: Round 1 (Semifinals) — both completed ─────────────────
(4, 4, 1, 1, 17, 20, 17, 'completed', 0, NULL,
 '2026-03-22 10:00:00', '2026-03-22 11:20:00', 0,
 '2026-03-22 10:00:00', '2026-03-22 10:38:00'),   -- White Knights beat Iron Bears

(5, 4, 1, 2, 18, 19, 18, 'completed', 0, NULL,
 '2026-03-22 10:20:00', '2026-03-22 11:40:00', 0,
 '2026-03-22 10:00:00', '2026-03-22 11:05:00'),   -- Shadow Owls beat Crimson Lions

-- ── Chess Champions: Round 2 (Championship) — completed ────────────────────
(6, 4, 2, 1, 17, 18, 17, 'completed', 0, NULL,
 '2026-03-22 11:00:00', '2026-03-22 12:20:00', 0,
 '2026-03-22 11:06:00', '2026-03-22 11:57:00');   -- White Knights beat Shadow Owls

-- ─── Match Players ────────────────────────────────────────────────────────────
-- rotation_slot reflects the player's position in the fixed rotation order.
-- Round 1 uses slot-1 players; Round 2 advances to slot-2 (slot-1 players sat).

INSERT IGNORE INTO match_players
  (id, match_id, player_id, team_id, rotation_slot, created_at, updated_at)
VALUES

-- Match 1 (T3 Semi 1: Turbo Turtles vs Drift Huskies)
(1,  1, 19, 13, 1, '2026-04-05 13:00:00', '2026-04-05 13:00:00'),  -- Riley  (Turtles, slot 1)
(2,  1, 25, 16, 1, '2026-04-05 13:00:00', '2026-04-05 13:00:00'),  -- Quinn  (Huskies, slot 1)

-- Match 2 (T3 Semi 2: Speed Cats vs Nitro Bobcats)
(3,  2, 21, 14, 1, '2026-04-05 13:00:00', '2026-04-05 13:00:00'),  -- Taylor (Speed Cats, slot 1)
(4,  2, 23, 15, 1, '2026-04-05 13:00:00', '2026-04-05 13:00:00'),  -- Drew   (Bobcats, slot 1)

-- Match 3 (T3 Championship: Turbo Turtles vs Speed Cats) — rotation advanced
(5,  3, 20, 13, 2, '2026-04-05 14:11:00', '2026-04-05 14:11:00'),  -- Morgan (Turtles, slot 2; Riley sat)
(6,  3, 22, 14, 2, '2026-04-05 14:11:00', '2026-04-05 14:11:00'),  -- Jamie  (Speed Cats, slot 2; Taylor sat)

-- Match 4 (T4 Semi 1: White Knights vs Iron Bears)
(7,  4, 27, 17, 1, '2026-03-22 10:00:00', '2026-03-22 10:00:00'),  -- Cameron (Knights, slot 1)
(8,  4, 33, 20, 1, '2026-03-22 10:00:00', '2026-03-22 10:00:00'),  -- Hayden  (Bears, slot 1)

-- Match 5 (T4 Semi 2: Shadow Owls vs Crimson Lions)
(9,  5, 29, 18, 1, '2026-03-22 10:00:00', '2026-03-22 10:00:00'),  -- Rowan   (Owls, slot 1)
(10, 5, 31, 19, 1, '2026-03-22 10:00:00', '2026-03-22 10:00:00'),  -- Skyler  (Lions, slot 1)

-- Match 6 (T4 Championship: White Knights vs Shadow Owls) — rotation advanced
(11, 6, 28, 17, 2, '2026-03-22 11:06:00', '2026-03-22 11:06:00'),  -- Sage    (Knights, slot 2; Cameron sat)
(12, 6, 30, 18, 2, '2026-03-22 11:06:00', '2026-03-22 11:06:00');  -- Phoenix (Owls, slot 2; Rowan sat)

-- ─── Score Reports ────────────────────────────────────────────────────────────
-- Matches 1 & 2 (T3): both teams agreed on scores — auto-confirmed.
-- Match 3 (T3): championship not yet played — no reports.
-- Match 4 (T4): only home team reported before deadline — auto-confirmed.
-- Matches 5 & 6 (T4): both teams agreed.

INSERT IGNORE INTO score_reports
  (id, match_id, reporting_team_id, reported_by_user_id,
   home_score, away_score, reported_winner_team_id, created_at)
VALUES

-- Match 1 (T3 Semi 1: Turtles 3 – Huskies 1) — both agree
(1, 1, 13, 5,  3, 1, 13, '2026-04-05 13:48:00'),  -- Riley (Turtles captain) reports
(2, 1, 16, 11, 3, 1, 13, '2026-04-05 13:50:00'),  -- Quinn (Huskies captain) confirms

-- Match 2 (T3 Semi 2: Speed Cats 5 – Bobcats 2) — both agree
(3, 2, 14, 7,  5, 2, 14, '2026-04-05 14:08:00'),  -- Taylor (Speed Cats captain) reports
(4, 2, 15, 9,  5, 2, 14, '2026-04-05 14:10:00'),  -- Drew (Bobcats captain) confirms

-- Match 4 (T4 Semi 1: White Knights 1 – Iron Bears 0) — deadline passed; one report stands
(5, 4, 17, 13, 1, 0, 17, '2026-03-22 10:38:00'),  -- Cameron (Knights captain) reports

-- Match 5 (T4 Semi 2: Shadow Owls 1 – Crimson Lions 0) — both agree
(6, 5, 18, 15, 1, 0, 18, '2026-03-22 11:03:00'),  -- Rowan (Owls captain) reports
(7, 5, 19, 17, 1, 0, 18, '2026-03-22 11:05:00'),  -- Skyler (Lions captain) confirms

-- Match 6 (T4 Championship: White Knights 1 – Shadow Owls 0) — both agree
(8, 6, 17, 14, 1, 0, 17, '2026-03-22 11:55:00'),  -- Sage (Knights, active player) reports
(9, 6, 18, 15, 1, 0, 17, '2026-03-22 11:57:00');  -- Rowan (Owls captain) confirms
