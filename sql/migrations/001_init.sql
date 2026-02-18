CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audios (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  sourate VARCHAR(255),
  verset_start INT,
  verset_end INT,
  description TEXT,
  file_path VARCHAR(500),
  basmala_added BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audio_stats (
  id UUID PRIMARY KEY,
  audio_id UUID NOT NULL REFERENCES audios(id) ON DELETE CASCADE,
  listens_count INT NOT NULL DEFAULT 0,
  downloads_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_audios_sourate ON audios(sourate);
CREATE INDEX IF NOT EXISTS idx_audios_created_at ON audios(created_at);
