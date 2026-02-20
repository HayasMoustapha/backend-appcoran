ALTER TABLE audios
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS audios_unique_identity_idx
ON audios (
  LOWER(title),
  LOWER(sourate),
  COALESCE(verset_start, 0),
  COALESCE(verset_end, 0)
);
