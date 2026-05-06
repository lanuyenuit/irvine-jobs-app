CREATE TABLE IF NOT EXISTS user_cvs (
  id          SERIAL PRIMARY KEY,
  filename    TEXT NOT NULL,
  raw_text    TEXT NOT NULL,
  file_size   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
