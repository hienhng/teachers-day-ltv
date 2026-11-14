# Trạm phát sóng yêu thương · Vietnamese Teachers' Day 20/11

A Teachers' Day message board for THCS&THPT Lương Thế Vinh, created by Lương Thế Vinh Tân Triều Programming Club.

Students create pastel sticky notes, choose a classic square, heart, star or leaf and up to two stickers at diagonal corners, then write a message for a teacher. Shapes keep their proportions while text sizes down to fit, including in PNG exports. Every submitted note is automatically sent to moderation for the shared classroom chalkboard. Notes can also be shared by URL or downloaded as PNG or QR. Public notes appear only after moderator approval.

The open board checks its current page every five seconds and automatically displays moderation changes, including newly approved notes. Background updates keep the board visible and open notes intact. Checks pause in hidden tabs and resume immediately when returning; temporary connection failures retain the last successful board and retry with backoff.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm ci
# Copy .env.example to .env.local and fill in your real values.
npm run dev
```

## Database

Persisted flower/theme/decorations keys are retained internally as note color, shape, and sticker choices; existing saved links and their message content continue to work. **Existing databases need `005_learning_stickers.sql` and `006_literature_sticker.sql` before saving the new learning-themed stickers, and `007_note_shapes.sql` before saving heart-shaped notes.** These expand the allowed keys and preserve existing notes.

For an empty database, run `database/schema.sql` once in the Neon SQL Editor. It creates `cards`, `rate_limits`, constraints and indexes. Do not replay it against existing tables.

For an older database, apply only outstanding migrations in order:

1. `001_flower_decorations.sql`
2. `002_more_decorations.sql`
3. `003_garden_positions.sql`
4. `004_more_flower_types.sql`
5. `005_learning_stickers.sql`
6. `006_literature_sticker.sql`
7. `007_note_shapes.sql`
8. `008_automatic_moderation.sql` (updates defaults for new notes; existing notes keep their status)
9. `009_ai_moderation.sql` (required before deploying automated moderation; adds review metadata without changing existing decisions)
10. `010_submission_deadline.sql` (required before deploying the admin submission cutoff; creates persistent settings, disabled by default)
11. `011_subject_stickers.sql` (required before saving PE, IT, Biology, and Arts stickers)

In `/admin`, use **Thời hạn nhận lời tri ân** to enable a cutoff, choose a date and time in Vietnam time (UTC+7), and save. New submissions at or after that instant are saved as rejected with a deadline reason and skip AI review. Existing notes keep their status, and admins can manually restore rejected notes. Disable the setting and save to resume normal moderation. The cutoff runs on the server at submission time and needs no scheduled job.

Configure these server-only variables in `.env.local` (or the existing `.env`), and in your hosting environment:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string; keep its SSL settings |
| `ADMIN_PASSWORD` | Unique moderator password, at least 16 characters |
| `ADMIN_SESSION_SECRET` | Independent random secret, at least 32 characters |
| `CARD_RATE_LIMIT` | Optional; defaults to 20 notes per hour per network identity |
| `AUTO_MODERATION_ENABLED` | Defaults to enabled; set exactly `false` to keep every new note pending for manual review |
| `GEMINI_API_KEY` | Server-only Gemini API key from Google AI Studio; `GOOGLE_GENERATIVE_AI_API_KEY` is also accepted |
| `MODERATION_MODEL` | Optional Gemini model ID supporting structured output; defaults to `gemini-3.8-flash` |

Never expose these with `NEXT_PUBLIC_` prefixes. No database credentials are sent to browsers.

## Moderation and privacy

Open `/admin` to approve or hide submissions. Every new note is immediately saved with public sharing enabled and pending moderation; there is no private-letter option. The creation API sets these values explicitly, including on databases that still have the old defaults. The sender name is public only when separately permitted. Anonymous notes persist an empty sender name.

Before AI review, a deterministic word filter automatically rejects `dcm`, `vcl`, `dcmm`, `vl`, `vcd`, `vcc`, `cmm`, `bts`, `clm`, `db`, and `cc`, plus selected profanity in English, Spanish, French, German, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, and Hindi (see `lib/word-filter.ts`) in the recipient, message, or displayed sender name. It matches whole terms case-insensitively, including accents, full-width letters, zero-width characters, and separators such as `d.c.m` or `v c l`. This limited list is not comprehensive multilingual moderation; whole-term boundaries deliberately leave embedded words and other contextual cases to AI. It also rejects quoted listed terms before AI review. This filter runs even when AI review is disabled or unavailable. Admins can restore rejected notes; existing notes are not automatically reprocessed.

After saving, the server automatically reviews the public recipient, message, and sender name (only when the sender chose to display it) using AI SDK structured output directly through the Gemini API. The submitting request waits up to ten seconds for the model; it does not rely on a browser follow-up, a timer, or an unawaited background task. Clearly appropriate letters are approved at a model-reported confidence of at least 0.95. Clear offensive language (including profanity, vulgar swearing, slurs, and derogatory names in any public field), spam, abuse, sexual content, threats, or hate are rejected at at least 0.98. The model applies the same policy to all languages and scripts, including mixed-language messages, transliterated insults, and obfuscated spellings. Passages it cannot confidently understand remain pending for human review; help-seeking reports that quote abuse remain pending for human review. Ambiguous content, sensitive personal information, conflicting classifications, and low-confidence results remain pending. Confidence is a model estimate, not a measured guarantee; evaluate real Vietnamese student messages before relying on the thresholds.

Apply `009_ai_moderation.sql`, set `GEMINI_API_KEY` in `.env.local` (or the existing `.env`) and in your hosting environment, and restart/redeploy to enable live review. Get a key from [Google AI Studio](https://aistudio.google.com/apikey). An empty key keeps new submissions pending; adding the key and restarting enables review without code changes. `GOOGLE_GENERATIVE_AI_API_KEY` is accepted as an alternative. Without credentials, or when a provider times out, refuses, returns malformed data, or fails, submissions are saved successfully and remain pending. No provider error bodies or letter text are logged. Set `AUTO_MODERATION_ENABLED=false` to turn off automatic decisions. The form explains automated review before submission.

The admin page defaults to pending letters, with filters for approved, rejected, or all letters. It shows the latest review source, reason, model, and model-reported confidence. Admins can retry a pending letter, manually approve or reject it, and restore an incorrectly rejected letter. Retries require an authenticated admin session and are rate limited to 30 per hour per network identity. Reviews use a 30-second lease to prevent concurrent model calls; stale attempts can be retried. A late AI response cannot replace a manual decision. Existing letters are not automatically reprocessed; retry pending letters from the admin page if needed.

Anyone with a note's sharing URL can read it, including private notes; these links are not end-to-end encrypted. Hiding a note removes it from the public board but keeps its sharing URL working. Existing private notes retain their status; the new submission flow does not publish them retroactively.

Moderator sessions use signed HttpOnly cookies and expire after one hour. Login attempts are limited to five per 15 minutes. Card creation is rate limited. On Vercel, trusted forwarding headers identify the network; local/other hosts use a shared rate bucket.

## Music

The existing cassette player and user-supplied audio remain available in `public/audio`. Audio begins only when the visitor opens or operates the player, and persists while navigating between the homepage, creator and chalkboard.

## Key files

- `app/homepage.tsx`, `app/homepage-event.tsx`: Teachers' Day homepage.
- `app/teachers-day.css`: classroom visual theme and responsive layouts.
- `app/sticky-note.tsx`, `lib/note-design.ts`: reusable sticky notes and persisted design mappings.
- `app/maker-panel.tsx`: color, paper, stickers and message editor.
- `app/petals.tsx`: navigation, chalkboard, sharing and submission flow.
- `lib/export-letter.ts`, `lib/letter-qr.ts`: PNG and QR exports.
- `app/api/cards/`, `app/api/admin/`, `lib/server.ts`: Neon storage and moderation.
- `database/schema.sql`: fresh database setup.
- `tests/`: backend, creator and compatibility tests.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

Backend tests use an isolated in-memory PGlite database. They do not connect to hosted Neon. Verify the real database connection and a cross-device sharing URL after configuring your deployment.

The live moderation smoke test is skipped by default. To explicitly run multilingual moderation cases against Gemini using synthetic letters and an isolated in-memory database, run in PowerShell:

```powershell
$env:RUN_LIVE_MODERATION='1'
node --env-file=.env node_modules/vitest/vitest.mjs run tests/moderation-live.test.ts
Remove-Item Env:RUN_LIVE_MODERATION
```

This checks multilingual gratitude and abuse, safeguarding reports, spam rejection, personal-information review, and resistance to instructions embedded in a letter. It does not write test letters to hosted Neon.
