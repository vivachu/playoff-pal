CREATE TABLE IF NOT EXISTS players (
  id           INT          NOT NULL AUTO_INCREMENT,
  team_id      INT          NOT NULL,
  user_id      INT,
  display_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20)  NOT NULL,
  is_captain   TINYINT(1)   NOT NULL DEFAULT 0,
  status       ENUM('pending','approved','denied') NOT NULL DEFAULT 'pending',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_players_team FOREIGN KEY (team_id) REFERENCES teams (id),
  CONSTRAINT fk_players_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
