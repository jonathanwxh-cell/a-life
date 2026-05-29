# Cloud saves — design spec

*Status: live as of 2026-05-29 — `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set on Vercel, and the route PUT/GET round-trip verified against production. Falls back to local-only whenever the cloud is unreachable. Date: 2026-05-29.*

## Goal

Let a player's dynasty follow them across devices and survive a cleared browser, without adding a login. Today saves live only in the browser's `localStorage` (per-origin, client-only). This adds an optional **cloud layer** keyed by a **chronicle code**: a short, unguessable token the player can carry to another device to continue the same line.

## Principles / constraints

1. **The cloud is never a hard dependency.** If the sync endpoint is unreachable (offline, opened from `file://`, env not configured), the game behaves exactly as it does today on `localStorage`. No feature breaks; nothing throws.
2. **Plain static frontend, no build, no client dependencies.** The browser code stays vanilla JS loaded via ordered `<script>` tags. The only new runtime piece is one server-side function.
3. **Match the `zo-playground` Supabase convention.** All Supabase access goes through a **server route using the service-role key**; the table has **RLS enabled with no policies** (service-role only). The anon/publishable key is never used and is not exposed to the client.
4. **YAGNI.** No accounts, no realtime, no multi-writer merge. Last-write-wins is acceptable for a single-player save game.

## Architecture

```
browser (a-life) ──HTTP──> Vercel API route /api/chronicle ──service-role──> Supabase (zo-playground)
        │                         (same-origin)                                  table: public.alife_saves
        └── localStorage (instant local layer, unchanged) ──────────────────────────────────────────────
```

- **Vercel API route**, not a Supabase Edge Function: a-life already deploys on Vercel, so `/api/*` ships alongside the static files with no extra deploy and is **same-origin** (no CORS surface). An Edge Function would also work but adds a separate deploy and CORS config; rejected for simplicity.
- The existing `window.storage` (localStorage adapter in `core.js`) is **unchanged** and remains the instant local layer. Cloud sync is a thin layer on top.

## Data model

One new table in the `zo-playground` project (`zymkxucjamvirqqhmpgi`):

```sql
create table public.alife_saves (
  code        text primary key,        -- chronicle code = capability token
  data        jsonb       not null,     -- the full save object S
  surname     text,
  gens        int         not null default 1,
  souls       int         not null default 0,
  alive       boolean     not null default true,
  updated_at  timestamptz not null default now()
);
alter table public.alife_saves enable row level security;
-- intentionally NO policies: service-role only, matching messages / council_jobs / etc.
```

`surname/gens/souls/alive/updated_at` are denormalized from `data` so a future "my chronicles" listing is possible without parsing JSON; not required for v1.

## API endpoint

`api/chronicle.js` — a Vercel Node serverless function. Uses built-in `fetch` against Supabase PostgREST with the service-role key (**no `supabase-js` dependency**).

- `GET /api/chronicle?code=<code>`
  - 400 if `code` missing/malformed.
  - 200 `{ data, updated_at }` if found; 404 if not.
- `PUT /api/chronicle?code=<code>` with JSON body `{ data, surname, gens, souls, alive }`
  - Upsert on `code` (PostgREST `POST … Prefer: resolution=merge-duplicates`, `on_conflict=code`), setting `updated_at = now()`.
  - 200 `{ ok: true, updated_at }`.
  - Reject bodies over a sane size cap (e.g. 512 KB) → 413.
- Any other method → 405.

Environment variables (Vercel project settings, never in client code):
- `SUPABASE_URL` = `https://zymkxucjamvirqqhmpgi.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (service role key)

The route sends `apikey` + `Authorization: Bearer <service-role>` headers to PostgREST. If either env var is missing, the route returns 503 and the client treats it as "cloud unavailable" (degrades to local-only).

## Client sync layer — `cloud.js` (new module)

A small module loaded after `persistence.js`. It does not replace local saving; it shadows it.

**Chronicle code:** 20 chars from `[0-9a-z]`, generated with `crypto.getRandomValues` (~103 bits — not enumerable). Stored on the save as `S.code` so it rides along in `localStorage`. Minted lazily the first time a save syncs to the cloud while online.

**Sync triggers / debounce:** `save()` continues to write `localStorage` synchronously (instant). It also schedules a debounced cloud `PUT` (~2 s, to coalesce rapid year-ticks). A best-effort flush fires on death, on opening the menu, and on `visibilitychange → hidden`.

**Boot / load (last-write-wins):** `localStorage` is the immediate source of truth so the UI is never blocked on the network. If the loaded slot has an `S.code`, fetch the cloud copy in the background and compare `cloud.updated_at` against local `S.lastSaved`:
- cloud newer → adopt cloud, re-render.
- local newer or cloud missing → push local up.

**Restore on a new device:** a "Continue from a code" field in the Load menu → `GET /api/chronicle?code=` → write the returned save into a free local slot, set it active, and keep syncing.

**Failure behavior:** every cloud call is wrapped; any network/HTTP error is swallowed and the game proceeds on `localStorage`. A small, non-blocking status line ("synced" / "offline — saved on this device") communicates state; it never gates play.

**Migration of existing saves:** a local save with no `S.code` simply gets one minted and pushed the next time it saves while online. Existing players lose nothing.

## UX

Repurpose the existing **Export / Import** block in the Load menu:
- The headline "code" becomes the short **chronicle code** (cloud-backed) instead of the long base64 blob. "Copy code" / "Continue from a code".
- The current base64 `ALIFE1:` export stays available but de-emphasized as an **offline backup** (works with no network), so no capability is lost.

## Security

- Service-role key lives only in Vercel env; never shipped to the browser.
- `public.alife_saves` is RLS-on / no-policies → unreachable by anon/publishable keys; only the service-role route touches it.
- The chronicle code is a **capability token**: whoever holds it can read/write that one save (same trust model as today's export code). Codes are long and random to defeat enumeration. This is acceptable for a low-stakes single-player save.
- Same-origin (`/api/*` under the game's domain) → no CORS exposure.
- Out of scope for v1: rate limiting, per-save secrets/rotation, abuse throttling. Note as a follow-up if the table grows hot.

## Files

| File | Change |
| --- | --- |
| `api/chronicle.js` | **new** — GET/PUT serverless route (service-role → PostgREST) |
| `cloud.js` | **new** — client sync layer; loaded after `persistence.js` |
| `a-life.html` | add `<script src="cloud.js">` after `persistence.js` |
| `persistence.js` | call into `cloud.js` from `save()` / load / restore (thin hooks) |
| `core.js` | unchanged (localStorage adapter stays the local layer) |
| Supabase | apply migration creating `public.alife_saves` |
| Vercel | set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` env vars |

## Docs to update (the "specs")

- This file (`docs/cloud-saves.md`).
- `README.md` — "Saving & backups" (local + optional cloud via chronicle code) and "Tech" (static frontend **+ one Vercel serverless function + Supabase**; no longer purely static).
- Memory `project_a_life_vercel.md` — record the Supabase table + route.

## Verification plan

1. Apply the migration; confirm `alife_saves` exists with RLS on and no policies (re-run the security advisor — expect no *new* findings).
2. Local: deploy, play a line, confirm `PUT /api/chronicle` fires and a row appears (queried via service-role).
3. Cross-device: copy the code, load it in a fresh browser profile (empty `localStorage`) → the dynasty resumes.
4. Offline: block `/api/chronicle` (or run from `file://`) → game still plays and saves locally with no console errors.
5. Conflict: edit on device A, then device B → last-write-wins by `updated_at` (documented, not merged).

## Out of scope (deliberately)

Accounts/auth, realtime sync, conflict merging, listing all chronicles, server-side rate limiting. Each is a possible later increment; none is needed for "saves follow me across devices."
