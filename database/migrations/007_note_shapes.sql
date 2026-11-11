-- Existing databases: run after 006_literature_sticker.sql.
-- Retain the original design keys and allow the additional heart-shaped note.
BEGIN;
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_theme_check;
ALTER TABLE cards ADD CONSTRAINT cards_theme_check
 CHECK (theme IN ('meadow','heart','blossom','night'));
COMMIT;
