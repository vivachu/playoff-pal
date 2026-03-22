CREATE TABLE IF NOT EXISTS otp_codes (
  id         INT         NOT NULL AUTO_INCREMENT,
  user_id    INT         NOT NULL,
  code       VARCHAR(6)  NOT NULL,
  expires_at DATETIME    NOT NULL,
  used       TINYINT(1)  NOT NULL DEFAULT 0,
  attempts   INT         NOT NULL DEFAULT 0,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
