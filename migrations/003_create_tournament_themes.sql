CREATE TABLE IF NOT EXISTS tournament_themes (
  id                      INT          NOT NULL AUTO_INCREMENT,
  category                VARCHAR(50)  NOT NULL,
  theme_name              VARCHAR(100) NOT NULL,
  format                  VARCHAR(10)  NOT NULL,
  active_players_per_side INT          NOT NULL,
  icon_path               VARCHAR(255) NOT NULL,
  default_rules           TEXT         NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
