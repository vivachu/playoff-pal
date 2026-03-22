CREATE TABLE IF NOT EXISTS prize_types (
  id        INT          NOT NULL AUTO_INCREMENT,
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) NOT NULL,
  icon_path VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_prize_types_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
