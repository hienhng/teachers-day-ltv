-- New submissions enter moderation. Existing notes retain their status and consent.
BEGIN;
ALTER TABLE cards ALTER COLUMN public_opt_in SET DEFAULT TRUE;
ALTER TABLE cards ALTER COLUMN status SET DEFAULT 'pending';
COMMIT;
