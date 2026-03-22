CREATE TABLE IF NOT EXISTS ai_logs (
  id            INT          NOT NULL AUTO_INCREMENT,
  user_id       INT,
  task_type     VARCHAR(50)  NOT NULL,
  prompt        TEXT         NOT NULL,
  response      TEXT         NOT NULL,
  model         VARCHAR(50)  NOT NULL,
  input_tokens  INT          NOT NULL,
  output_tokens INT          NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ai_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
