# Functions & Services Reference

> Auto-updated on every new exported function or service.

---

## `src/models/User.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findById` | `(id: number) → User\|null` | Find user by PK |
| `findByPhone` | `(phone: string) → User\|null` | Find user by E.164 phone |
| `create` | `({ phone_number, first_name, last_name }) → number` | Insert user, return id |
| `update` | `(id, { first_name, last_name }) → void` | Update name fields |
| `updatePhone` | `(id, phone_number) → void` | Update phone number |

## `src/models/OtpCode.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `create` | `({ user_id, code, expires_at }) → number` | Insert OTP record |
| `findLatestByUserId` | `(user_id) → OtpCode\|null` | Most recent unused/unexpired code |
| `markUsed` | `(id) → void` | Set used=1 |
| `incrementAttempts` | `(id) → void` | Increment failed attempt counter |
| `countSentSince` | `(user_id, since: Date) → number` | Count OTPs sent in window (rate limit) |

## `src/models/Tournament.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findById` | `(id) → Tournament\|null` | With theme + prize joins |
| `findByShareCode` | `(code) → Tournament\|null` | Look up by hashids slug |
| `findByCreator` | `(user_id) → Tournament[]` | All tournaments by creator |
| `findPublic` | `() → Tournament[]` | signup/gameplay/ended, newest first |
| `create` | `(fields) → number` | Insert draft tournament |
| `updateShareCode` | `(id, share_code) → void` | Set share code after insert |
| `update` | `(id, fields) → void` | Update editable fields |
| `updateStatus` | `(id, status) → void` | Transition status enum |

## `src/models/TournamentTheme.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findAll` | `() → TournamentTheme[]` | All themes, ordered |
| `findById` | `(id) → TournamentTheme\|null` | Single theme |

## `src/models/Team.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findById` | `(id) → Team\|null` | With mascot join |
| `findByTournament` | `(tournament_id) → Team[]` | All teams in a tournament |
| `create` | `({ tournament_id, name, mascot_id }) → number` | Insert team |
| `update` | `(id, { name?, mascot_id?, seed? }) → void` | Update team fields |
| `updateStatus` | `(id, status) → void` | Transition status enum |

## `src/models/Player.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findById` | `(id) → Player\|null` | Single player |
| `findByTeam` | `(team_id) → Player[]` | All players on a team |
| `findByUserAndTournament` | `(user_id, tournament_id) → Player\|null` | Check if user is in tournament |
| `findLatestPendingByTournament` | `(tournament_id) → Player\|null` | For creator YES/NO SMS |
| `findLatestPendingByTeam` | `(team_id) → Player\|null` | For captain YES/NO SMS |
| `findApprovedByTournament` | `(tournament_id) → Player[]` | All approved players for bulk SMS |
| `create` | `(fields) → number` | Insert player signup |
| `updateStatus` | `(id, status) → void` | Approve or deny |
| `countApprovedByTeam` | `(team_id) → number` | For min-players check |

## `src/models/Match.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findById` | `(id) → Match\|null` | With team name joins |
| `findByTournament` | `(tournament_id) → Match[]` | All matches, ordered by round |
| `findByRound` | `(tournament_id, round_number) → Match[]` | Matches in one round |
| `create` | `(fields) → number` | Insert match |
| `update` | `(id, fields) → void` | Update location/schedule |
| `updateStatus` | `(id, status) → void` | Transition status |
| `setWinner` | `(id, winner_team_id, refereeOverride?) → void` | Mark completed + set winner |
| `assignTeams` | `(id, { home_team_id?, away_team_id? }) → void` | Fill bracket slots for winner advancement |

## `src/models/MatchPlayer.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findByMatch` | `(match_id) → MatchPlayer[]` | All assignments for a match |
| `findByMatchAndTeam` | `(match_id, team_id) → MatchPlayer[]` | One team's assignments |
| `create` | `(fields) → number` | Insert single assignment |
| `deleteByMatch` | `(match_id) → void` | Clear all assignments for a match |
| `deleteByMatchAndTeam` | `(match_id, team_id) → void` | Clear one team's assignments |

## `src/models/ScoreReport.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `findByMatch` | `(match_id) → ScoreReport[]` | All reports for a match |
| `findByMatchAndTeam` | `(match_id, team_id) → ScoreReport\|null` | One team's report |
| `create` | `(fields) → number` | Insert score report |

## `src/models/AiLog.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `create` | `(fields) → number` | Insert AI call audit log |

---

## `src/services/shareCodeService.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `encodeId` | `(id: number) → string` | Tournament id → 6-char lowercase slug |
| `decodeCode` | `(code: string) → number\|null` | Share code → tournament id |

## `src/services/avatarService.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `getAvatarUrl` | `(firstName, lastName) → string` | ui-avatars.com URL for initials avatar |

## `src/services/smsService.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `sendSms` | `(to, body, { isOtp? }) → void` | Core send with opt-out guard |
| `recordOptOut` | `(user_id, phone, source) → void` | Insert sms_opt_outs row |
| `recordOptIn` | `(phone) → void` | Update opted_in_at |
| `sendOtp` | `(to, code) → void` | OTP SMS with TCPA disclosure |
| `sendNewSignupRequest` | `(to, ctx) → void` | Notify creator of new player |
| `sendSignupAccepted` | `(to, ctx) → void` | Tell player they're approved |
| `sendNewMemberJoined` | `(to, ctx) → void` | Tell teammates of new member |
| `sendMinPlayersReached` | `(to, ctx) → void` | Tell creator to START |
| `sendTournamentStart` | `(to, ctx) → void` | Round 1 game time + bracket link |
| `sendRoundReminder` | `(to, ctx) → void` | 1-hour pre-round reminder |
| `sendGameResult` | `(to, ctx) → void` | Score alert after match resolves |
| `sendRoundComplete` | `(to, ctx) → void` | Round complete, next round set |
| `sendTournamentWinner` | `(to, ctx) → void` | Champion announcement |

## `src/services/aiService.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `generateRules` | `({ tournamentName, themes, userId? }) → { theme_id, description, game_rules }` | Claude API: pick theme + generate description and rules |
| `generateTeamNames` | `({ count, mascots, themeName, userId? }) → { name, mascot }[]` | Claude API: generate team names with mascots |

## `src/services/bracketService.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `generateBracket` | `(tournament) → void` | Create all match rows + auto-assign round 1 players |
| `advanceWinner` | `(completedMatch, winnerTeamId) → void` | Fill next-round slot and auto-assign players |
| `assignPlayersForMatch` | `(matchId, teamId, roundNumber, playersPerSide) → void` | Auto-assign via rotation algorithm |
| `buildBracketView` | `(matches, totalRounds) → { round, label, matches }[]` | Format bracket data for template rendering |

## `src/services/scoreService.js`
| Function | Signature | Description |
|----------|-----------|-------------|
| `handleScoreReport` | `(params) → { resolved, winnerId }` | Process a score submission; auto-resolve if both teams agree |
| `resolveExpiredMatches` | `(tournamentId) → void` | Rule 2/3 resolution after deadline passes |
| `creatorOverride` | `(matchId, winnerTeamId) → void` | Creator manually sets the winner |
