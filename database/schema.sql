-- Run once in the Neon SQL editor for an empty application database.
-- Keep DATABASE_URL server-only. No direct browser access is required.
BEGIN;
CREATE TABLE cards (
 id UUID PRIMARY KEY,
 flower TEXT NOT NULL CHECK (flower IN ('tulip','rose','sunflower','cherry','lavender','daisy','lily','lotus','orchid','hydrangea','peony','cosmos','iris','daffodil','poppy','marigold','hibiscus','bluebell')),
 decorations TEXT[] NOT NULL DEFAULT '{}' CHECK (decorations <@ ARRAY['ribbon','butterflies','hearts','sparkles','fireflies','petals','bees','cranes','music','math','physics','english','history','geography','chemistry','books','pencil','graduation','literature']::text[] AND cardinality(decorations)<=3 AND array_position(decorations,NULL) IS NULL),
 theme TEXT NOT NULL CHECK (theme IN ('meadow','heart','blossom','night')),
 garden_x DOUBLE PRECISION,
 garden_y DOUBLE PRECISION,
 CONSTRAINT cards_garden_position_check CHECK ((garden_x IS NULL AND garden_y IS NULL) OR (garden_x IS NOT NULL AND garden_y IS NOT NULL AND garden_x BETWEEN 12 AND 88 AND garden_y BETWEEN 25 AND 94)),
 recipient TEXT NOT NULL CHECK (char_length(trim(recipient)) BETWEEN 1 AND 60),
 message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 5 AND 500),
 sender TEXT NOT NULL CHECK (char_length(sender)<=40),
 anonymous BOOLEAN NOT NULL DEFAULT FALSE,
 public_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
 share_sender BOOLEAN NOT NULL DEFAULT FALSE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('private','pending','approved','rejected')),
 moderation JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(moderation)='object'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 edit_hash TEXT NOT NULL CHECK (char_length(edit_hash)=64),
 CHECK ((anonymous AND sender='') OR (NOT anonymous AND char_length(trim(sender))>=1)),
 CHECK (status='private' OR public_opt_in),
 CHECK (NOT anonymous OR NOT share_sender)
);
CREATE INDEX cards_garden_idx ON cards(created_at DESC,id DESC) WHERE status='approved' AND public_opt_in;
CREATE INDEX cards_moderation_idx ON cards(created_at DESC,id DESC) WHERE public_opt_in AND status IN ('pending','approved');
CREATE TABLE rate_limits (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX rate_limits_expiry_idx ON rate_limits(expires_at);
COMMIT;
