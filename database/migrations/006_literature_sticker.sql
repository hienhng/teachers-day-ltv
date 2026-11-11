-- Existing databases: run after 005_learning_stickers.sql.
-- Fresh installations use schema.sql instead. Preserve all saved stickers.
BEGIN;
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_decorations_check;
ALTER TABLE cards ADD CONSTRAINT cards_decorations_check CHECK (
 decorations <@ ARRAY['ribbon','butterflies','hearts','sparkles','fireflies','petals','bees','cranes','music','math','physics','english','history','geography','chemistry','books','pencil','graduation','literature']::text[]
 AND cardinality(decorations)<=3 AND array_position(decorations,NULL) IS NULL
);
COMMIT;
