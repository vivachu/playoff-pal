-- Sample tournament data for local dev/QA
-- Requires: static seeds already loaded (themes, mascots, prize_types)
-- Requires: at least 10 users to exist (seeded inline below)

-- ── Sample users ─────────────────────────────────────────────────────────────
INSERT INTO users (id, phone_number, first_name, last_name, created_at, updated_at) VALUES
  (1,  '+15550000001', 'Alex',    'Johnson',  NOW(), NOW()),
  (2,  '+15550000002', 'Jordan',  'Smith',    NOW(), NOW()),
  (3,  '+15550000003', 'Taylor',  'Williams', NOW(), NOW()),
  (4,  '+15550000004', 'Morgan',  'Brown',    NOW(), NOW()),
  (5,  '+15550000005', 'Casey',   'Davis',    NOW(), NOW()),
  (6,  '+15550000006', 'Riley',   'Miller',   NOW(), NOW()),
  (7,  '+15550000007', 'Jamie',   'Wilson',   NOW(), NOW()),
  (8,  '+15550000008', 'Drew',    'Moore',    NOW(), NOW()),
  (9,  '+15550000009', 'Quinn',   'Taylor',   NOW(), NOW()),
  (10, '+15550000010', 'Avery',   'Anderson', NOW(), NOW()),
  (11, '+15550000011', 'Blake',   'Thomas',   NOW(), NOW()),
  (12, '+15550000012', 'Parker',  'Jackson',  NOW(), NOW())
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- ═══════════════════════════════════════════════════════════════════
-- Tournament 1: "Draft Hoops" — status: draft, 4 teams, no players
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO tournaments
  (id, share_code, creator_user_id, title, description, theme_id, game_rules, status,
   prize_type_id, prize_description, location, start_datetime, timezone, num_teams,
   created_at, updated_at)
SELECT
  1, 'dft001', 1,
  'Draft Hoops',
  'A friendly 3x3 basketball tournament — still in planning!',
  tt.id,
  'First team to 21 points wins. Must win by 2. Alternating possessions after made baskets.',
  'draft',
  pt.id, 'Winner buys pizza',
  'Central Park Court 4',
  DATE_ADD(NOW(), INTERVAL 14 DAY),
  'America/New_York',
  4,
  NOW(), NOW()
FROM tournament_themes tt
CROSS JOIN prize_types pt
WHERE tt.theme_name = 'Basketball' AND tt.format = '3x3'
  AND pt.slug = 'bragging-rights'
LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Teams for Draft Hoops (no players yet)
INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 1, 1, 'Flying Eagles', m.id, 1, 'active', NOW() FROM mascots m WHERE m.slug = 'eagle' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 2, 1, 'Raging Bulls', m.id, 2, 'active', NOW() FROM mascots m WHERE m.slug = 'bull' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 3, 1, 'Striped Tigers', m.id, 3, 'active', NOW() FROM mascots m WHERE m.slug = 'tiger' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 4, 1, 'Golden Bears', m.id, 4, 'active', NOW() FROM mascots m WHERE m.slug = 'bear' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ═══════════════════════════════════════════════════════════════════
-- Tournament 2: "Signup Showdown" — status: signup, 8 teams, mixed players
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO tournaments
  (id, share_code, creator_user_id, title, description, theme_id, game_rules, status,
   prize_type_id, prize_description, location, start_datetime, timezone, num_teams,
   created_at, updated_at)
SELECT
  2, 'sgn002', 1,
  'Signup Showdown',
  'Mario Kart tournament — 8 teams battling it out! Signups open now.',
  tt.id,
  '3 races per match. Total points determine winner. 150cc, all items, no bans.',
  'signup',
  pt.id, '$50 Amazon gift card',
  'Game Cave Lounge',
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  'America/Chicago',
  8,
  NOW(), NOW()
FROM tournament_themes tt
CROSS JOIN prize_types pt
WHERE tt.theme_name = 'Mario Kart' AND tt.format = '1x1'
  AND pt.slug = 'gift-card'
LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 8 Teams for Signup Showdown
INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 5, 2, 'Speed Wolves',  m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'wolf' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 6, 2, 'Drift Owls',    m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'owl' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 7, 2, 'Turbo Lions',   m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'lion' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 8, 2, 'Rocket Hawks',  m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'hawk' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 9, 2, 'Nitro Knights', m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'knight' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 10, 2, 'Blaze Cats',   m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'cat' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 11, 2, 'Storm Rams',   m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'ram' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 12, 2, 'Iron Crocs',   m.id, NULL, 'active', NOW() FROM mascots m WHERE m.slug = 'croc' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Players for Signup Showdown (mix of approved, pending, some teams short)
INSERT INTO players (id, team_id, user_id, display_name, phone_number, is_captain, status, created_at) VALUES
  (1,  5, 2, 'Jordan Smith',    '+15550000002', 1, 'approved', NOW()),
  (2,  5, 3, 'Taylor Williams', '+15550000003', 0, 'approved', NOW()),
  (3,  6, 4, 'Morgan Brown',    '+15550000004', 1, 'approved', NOW()),
  (4,  6, 5, 'Casey Davis',     '+15550000005', 0, 'pending',  NOW()),
  (5,  7, 6, 'Riley Miller',    '+15550000006', 1, 'approved', NOW()),
  (6,  8, 7, 'Jamie Wilson',    '+15550000007', 1, 'approved', NOW()),
  (7,  9, 8, 'Drew Moore',      '+15550000008', 1, 'approved', NOW()),
  (8, 10, 9, 'Quinn Taylor',    '+15550000009', 1, 'approved', NOW())
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ═══════════════════════════════════════════════════════════════════
-- Tournament 3: "Mid-Season Mario" — status: gameplay, 4 teams, bracket active
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO tournaments
  (id, share_code, creator_user_id, title, description, theme_id, game_rules, status,
   prize_type_id, prize_description, location, start_datetime, timezone, num_teams,
   created_at, updated_at)
SELECT
  3, 'gpl003', 1,
  'Mid-Season Mario',
  '4-team Mario Kart throwdown. Bracket is live — may the best racer win!',
  tt.id,
  '3 races per match. Most points wins. 150cc, all items.',
  'gameplay',
  pt.id, 'Bragging rights and a trophy',
  'Player 1 Arcade Bar',
  DATE_ADD(NOW(), INTERVAL -1 DAY),
  'America/Los_Angeles',
  4,
  NOW(), NOW()
FROM tournament_themes tt
CROSS JOIN prize_types pt
WHERE tt.theme_name = 'Mario Kart' AND tt.format = '1x1'
  AND pt.slug = 'trophy'
LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 13, 3, 'Blue Devils',   m.id, 1, 'active',     NOW() FROM mascots m WHERE m.slug = 'blue-devil' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 14, 3, 'Red Devils',    m.id, 2, 'eliminated',  NOW() FROM mascots m WHERE m.slug = 'red-devil' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 15, 3, 'Bulldogs',      m.id, 3, 'active',     NOW() FROM mascots m WHERE m.slug = 'bull-dog' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 16, 3, 'Bobcats',       m.id, 4, 'eliminated',  NOW() FROM mascots m WHERE m.slug = 'bobcat' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Players for Mid-Season Mario
INSERT INTO players (id, team_id, user_id, display_name, phone_number, is_captain, status, created_at) VALUES
  (9,  13, 10, 'Avery Anderson', '+15550000010', 1, 'approved', NOW()),
  (10, 14, 11, 'Blake Thomas',   '+15550000011', 1, 'approved', NOW()),
  (11, 15, 12, 'Parker Jackson', '+15550000012', 1, 'approved', NOW()),
  (12, 16, 2,  'Jordan Smith',   '+15550000002', 1, 'approved', NOW())
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Matches for Mid-Season Mario (4 teams = 3 matches, 2 rounds)
-- Round 1, Match 1: Blue Devils vs Bobcats → Blue Devils won
INSERT INTO matches
  (id, tournament_id, round_number, match_number, home_team_id, away_team_id, winner_team_id,
   status, is_bye, location, scheduled_start, score_report_deadline, referee_override, created_at, updated_at)
VALUES
  (1, 3, 1, 1, 13, 16, 13, 'completed', 0, 'Player 1 Arcade Bar',
   DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE winner_team_id = VALUES(winner_team_id), status = VALUES(status);

-- Round 1, Match 2: Red Devils vs Bulldogs → Bulldogs won
INSERT INTO matches
  (id, tournament_id, round_number, match_number, home_team_id, away_team_id, winner_team_id,
   status, is_bye, location, scheduled_start, score_report_deadline, referee_override, created_at, updated_at)
VALUES
  (2, 3, 1, 2, 14, 15, 15, 'completed', 0, 'Player 1 Arcade Bar',
   DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE winner_team_id = VALUES(winner_team_id), status = VALUES(status);

-- Championship: Blue Devils vs Bulldogs (in progress)
INSERT INTO matches
  (id, tournament_id, round_number, match_number, home_team_id, away_team_id, winner_team_id,
   status, is_bye, location, scheduled_start, score_report_deadline, referee_override, created_at, updated_at)
VALUES
  (3, 3, 2, 1, 13, 15, NULL, 'scheduled', 0, 'Player 1 Arcade Bar',
   DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE home_team_id = VALUES(home_team_id), away_team_id = VALUES(away_team_id);

-- Score reports for completed matches
INSERT INTO score_reports
  (id, match_id, reporting_team_id, reported_by_user_id, home_score, away_score, reported_winner_team_id, created_at)
VALUES
  (1, 1, 13, 10, 3, 1, 13, NOW()),
  (2, 1, 16,  2, 3, 1, 13, NOW()),
  (3, 2, 14, 11, 1, 3, 15, NOW()),
  (4, 2, 15, 12, 1, 3, 15, NOW())
ON DUPLICATE KEY UPDATE home_score = VALUES(home_score);

-- Match players for championship
INSERT INTO match_players (id, match_id, player_id, team_id, rotation_slot, created_at, updated_at)
VALUES
  (1, 3,  9, 13, 1, NOW(), NOW()),
  (2, 3, 11, 15, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE rotation_slot = VALUES(rotation_slot);

-- ═══════════════════════════════════════════════════════════════════
-- Tournament 4: "Chess Champions" — status: ended, 4 teams, winner declared
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO tournaments
  (id, share_code, creator_user_id, title, description, theme_id, game_rules, status,
   prize_type_id, prize_description, location, start_datetime, timezone, num_teams,
   created_at, updated_at)
SELECT
  4, 'end004', 1,
  'Chess Champions',
  'The ultimate chess showdown — all 3 rounds complete. The champion reigns!',
  tt.id,
  'Standard FIDE rules. 15+10 time control. First to 2 wins advances.',
  'ended',
  pt.id, 'Custom chess trophy + bragging rights forever',
  'Board Game Café',
  DATE_SUB(NOW(), INTERVAL 7 DAY),
  'America/New_York',
  4,
  DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM tournament_themes tt
CROSS JOIN prize_types pt
WHERE tt.theme_name = 'Chess' AND tt.format = '1x1'
  AND pt.slug = 'trophy'
LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 17, 4, 'Wise Owls',    m.id, 1, 'winner',     DATE_SUB(NOW(), INTERVAL 8 DAY) FROM mascots m WHERE m.slug = 'owl' LIMIT 1
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 18, 4, 'Silver Knights', m.id, 2, 'eliminated', DATE_SUB(NOW(), INTERVAL 8 DAY) FROM mascots m WHERE m.slug = 'knight' LIMIT 1
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 19, 4, 'Bold Cardinals', m.id, 3, 'eliminated', DATE_SUB(NOW(), INTERVAL 8 DAY) FROM mascots m WHERE m.slug = 'cardinal' LIMIT 1
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO teams (id, tournament_id, name, mascot_id, seed, status, created_at)
SELECT 20, 4, 'Brave Lions',   m.id, 4, 'eliminated', DATE_SUB(NOW(), INTERVAL 8 DAY) FROM mascots m WHERE m.slug = 'lion' LIMIT 1
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO players (id, team_id, user_id, display_name, phone_number, is_captain, status, created_at) VALUES
  (13, 17, 3,  'Taylor Williams', '+15550000003', 1, 'approved', DATE_SUB(NOW(), INTERVAL 9 DAY)),
  (14, 18, 4,  'Morgan Brown',    '+15550000004', 1, 'approved', DATE_SUB(NOW(), INTERVAL 9 DAY)),
  (15, 19, 5,  'Casey Davis',     '+15550000005', 1, 'approved', DATE_SUB(NOW(), INTERVAL 9 DAY)),
  (16, 20, 6,  'Riley Miller',    '+15550000006', 1, 'approved', DATE_SUB(NOW(), INTERVAL 9 DAY))
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Matches for Chess Champions (completed tournament)
INSERT INTO matches
  (id, tournament_id, round_number, match_number, home_team_id, away_team_id, winner_team_id,
   status, is_bye, location, scheduled_start, score_report_deadline, referee_override, created_at, updated_at)
VALUES
  (4, 4, 1, 1, 17, 20, 17, 'completed', 0, 'Board Game Café',
   DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 0, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (5, 4, 1, 2, 18, 19, 18, 'completed', 0, 'Board Game Café',
   DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 0, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (6, 4, 2, 1, 17, 18, 17, 'completed', 0, 'Board Game Café',
   DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 0, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE winner_team_id = VALUES(winner_team_id), status = VALUES(status);

INSERT INTO score_reports
  (id, match_id, reporting_team_id, reported_by_user_id, home_score, away_score, reported_winner_team_id, created_at)
VALUES
  (5, 4, 17,  3, 2, 0, 17, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (6, 4, 20,  6, 2, 0, 17, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (7, 5, 18,  4, 2, 1, 18, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (8, 5, 19,  5, 2, 1, 18, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (9, 6, 17,  3, 2, 1, 17, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (10, 6, 18, 4, 2, 1, 17, DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE home_score = VALUES(home_score);
