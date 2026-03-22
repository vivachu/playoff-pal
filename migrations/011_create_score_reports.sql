CREATE TABLE IF NOT EXISTS score_reports (
  id                      INT      NOT NULL AUTO_INCREMENT,
  match_id                INT      NOT NULL,
  reporting_team_id       INT      NOT NULL,
  reported_by_user_id     INT      NOT NULL,
  home_score              INT      NOT NULL,
  away_score              INT      NOT NULL,
  reported_winner_team_id INT      NOT NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_score_reports_match         FOREIGN KEY (match_id)                REFERENCES matches (id),
  CONSTRAINT fk_score_reports_team          FOREIGN KEY (reporting_team_id)       REFERENCES teams   (id),
  CONSTRAINT fk_score_reports_reporter      FOREIGN KEY (reported_by_user_id)     REFERENCES users   (id),
  CONSTRAINT fk_score_reports_winner_team   FOREIGN KEY (reported_winner_team_id) REFERENCES teams   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
