ALTER TABLE audios
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(30) DEFAULT 'ready';

ALTER TABLE audios
ADD COLUMN IF NOT EXISTS processing_error TEXT;

ALTER TABLE audios
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;

ALTER TABLE audios
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP;
