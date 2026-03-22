CREATE TABLE IF NOT EXISTS teams (
  id            INT          NOT NULL AUTO_INCREMENT,
  tournament_id INT          NOT NULL,
  name          VARCHAR(100) NOT NULL,
  mascot_id     INT          NOT NULL,
  seed          INT,
  status        ENUM('active','eliminated','winner') NOT NULL DEFAULT 'active',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_teams_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
  CONSTRAINT fk_teams_mascot     FOREIGN KEY (mascot_id)     REFERENCES mascots     (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
