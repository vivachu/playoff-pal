CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id           INT         NOT NULL AUTO_INCREMENT,
  user_id      INT         NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  opted_out_at DATETIME    NOT NULL,
  source       ENUM('stop_reply','account_settings') NOT NULL,
  opted_in_at  DATETIME,
  PRIMARY KEY (id),
  CONSTRAINT fk_sms_opt_outs_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
