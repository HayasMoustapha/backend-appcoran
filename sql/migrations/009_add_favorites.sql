ALTER TABLE audios
  ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS audio_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES audios(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, audio_id)
);

CREATE INDEX IF NOT EXISTS idx_audio_favorites_audio_id ON audio_favorites(audio_id);
