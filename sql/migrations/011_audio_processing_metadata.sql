ALTER TABLE audios
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

ALTER TABLE audios
ADD COLUMN IF NOT EXISTS bitrate_kbps INTEGER;

ALTER TABLE audios
ADD COLUMN IF NOT EXISTS size_bytes BIGINT;

CREATE INDEX IF NOT EXISTS audios_processing_status_idx
ON audios (processing_status, created_at);

ALTER TABLE audios
ALTER COLUMN processing_status SET DEFAULT 'uploaded';

UPDATE audios
SET processing_status = 'completed'
WHERE processing_status = 'ready';
