CREATE TABLE IF NOT EXISTS match_players (
  id            INT      NOT NULL AUTO_INCREMENT,
  match_id      INT      NOT NULL,
  player_id     INT      NOT NULL,
  team_id       INT      NOT NULL,
  rotation_slot INT      NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_match_players_match  FOREIGN KEY (match_id)  REFERENCES matches (id),
  CONSTRAINT fk_match_players_player FOREIGN KEY (player_id) REFERENCES players (id),
  CONSTRAINT fk_match_players_team   FOREIGN KEY (team_id)   REFERENCES teams   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
