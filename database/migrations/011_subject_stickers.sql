-- Existing databases: run after 010_submission_deadline.sql.
-- Fresh installations use schema.sql instead. Preserve all saved stickers.
BEGIN;
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_decorations_check;
ALTER TABLE cards ADD CONSTRAINT cards_decorations_check CHECK (
 decorations <@ ARRAY['ribbon','hearts','sparkles','fireflies','petals','bees','cranes','music','math','physics','english','history','geography','chemistry','books','pencil','graduation','literature','pe','it','biology','arts']::text[]
 AND cardinality(decorations)<=3 AND array_position(decorations,NULL) IS NULL
);
COMMIT;
