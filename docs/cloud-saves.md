# Cloud Saves

*Status: current as of 2026-06-29. The old Vercel `/api/chronicle` + Supabase route has been removed from this checkout. Cloud sync now uses the external chronicle endpoint configured in `cloud.js`: `https://a-life-db.alyoechosys.dev/chronicle`. The game still falls back to local-only whenever the endpoint is unreachable or the page is opened from `file://`.*

## Goal

Let a player's dynasty follow them across devices and survive a cleared browser, without adding a login. Local storage remains the instant source of truth; the cloud layer is a best-effort shadow keyed by a private chronicle code.

## Principles

1. **Cloud is optional.** If the endpoint is down, blocked, slow, or unavailable from `file://`, the game behaves exactly like a local-only save.
2. **Static frontend stays static.** No build step, framework, ES modules, or client dependency is added. `cloud.js` is a classic script loaded after `persistence.js`.
3. **No secrets in the repo.** Database credentials live on the external chronicle service, not in Vercel env vars and not in browser code.
4. **Capability-token model.** The chronicle code is the read/write key for one save. Anyone with the code can load that dynasty, so players should keep it private.

## Architecture

```text
browser (a-life) -- HTTPS --> https://a-life-db.alyoechosys.dev/chronicle
        |
        +-- localStorage via window.storage
```

- `cloud.js` is the only client file that talks to the endpoint.
- The endpoint accepts exact-code `GET` and `PUT` requests and keeps database credentials server-side.
- There is no `api/chronicle.js` in this repo, and Vercel deploys only the static game files plus cache headers.

## Client Sync

**Chronicle code:** 20 chars from `[0-9a-z]`, generated with `crypto.getRandomValues`. It is stored on the save as `S.code`.

**Push:** `save()` writes local storage immediately, increments `S.rev`, and asks `cloud.js` to debounce a `PUT`. Successful pushes record the server timestamp in `S.cloudUpdatedAt` and the pushed revision in `S.cloudRev`.

**Reconcile:** after loading a local slot, `cloud.js` fetches the remote copy. It adopts the cloud save only when the remote save revision is newer than local, or when the revisions match and the endpoint's server timestamp is newer than the last cloud timestamp recorded locally. This avoids comparing one device's `Date.now()` against another server/device clock.

**Restore by code:** the Load menu calls `GET` through `cloud.js`, validates the returned save, writes it into a free local slot, and resumes play. If all six slots are full, import stops and asks the player to delete a chronicle first.

**Offline backup:** self-contained `ALIFE1:` export/import remains available for local-only or offline use.

## Endpoint Contract

- `GET /chronicle?code=<code>`
  - `200 { data, updated_at }` when found.
  - `404` when no save exists for the code.
- `PUT /chronicle?code=<code>` with JSON body `{ data, surname, gens, souls, alive }`
  - Upserts the save for that exact code.
  - Ideally returns `{ ok: true, updated_at }`; if it returns no JSON, the client falls back to the HTTP `Date` header for `S.cloudUpdatedAt`.

## Security Notes

- The chronicle code is unguessable enough for this low-stakes single-player save use case, but it is still a bearer token.
- Imported/cloud saves are validated before being written into a slot.
- The local app must treat save names and metadata as untrusted because cloud/import data can be user-supplied.

## Verification

1. Serve the site locally and confirm normal local saves still work.
2. Open from `file://` and confirm `window.AL_cloud.enabled === false`.
3. On the hosted site, create or load a dynasty, use **Sync & copy code**, and verify the code can restore into an empty browser profile.
4. Fill all six slots, attempt an import, and confirm no existing slot is overwritten.
