-- Store the latest automated or manual review without changing existing decisions.
BEGIN;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS moderation JSONB NOT NULL DEFAULT '{}'::jsonb
 CHECK (jsonb_typeof(moderation)='object');
COMMIT;
