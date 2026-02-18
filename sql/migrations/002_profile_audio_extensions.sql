-- Imam profile table
CREATE TABLE IF NOT EXISTS imam_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  biography TEXT,
  parcours TEXT,
  statut VARCHAR(255),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audio extensions
ALTER TABLE audios
  ADD COLUMN IF NOT EXISTS numero_sourate INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS listen_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audios_numero_sourate_check'
  ) THEN
    ALTER TABLE audios
      ADD CONSTRAINT audios_numero_sourate_check
      CHECK (numero_sourate BETWEEN 1 AND 114);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_numero_sourate ON audios(numero_sourate);
