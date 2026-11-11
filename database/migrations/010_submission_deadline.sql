-- Optional cutoff for new notes. Existing notes keep their current status.
BEGIN;
CREATE TABLE IF NOT EXISTS submission_settings (
 id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
 rejection_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 reject_after TIMESTAMPTZ,
 CHECK (NOT rejection_enabled OR reject_after IS NOT NULL)
);
INSERT INTO submission_settings(id) VALUES(TRUE) ON CONFLICT(id) DO NOTHING;
COMMIT;
