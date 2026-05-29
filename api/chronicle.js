/* ============================================================
   /api/chronicle  —  cloud saves for A Life.
   GET  ?code=<code>            -> { data, updated_at } | 404
   PUT  ?code=<code>  body:{data,surname,gens,souls,alive} -> { ok, updated_at }

   Talks to Supabase PostgREST with the SERVICE-ROLE key (server-side only).
   The table public.alife_saves is RLS-on / no-policies, so only this route
   (service role) can touch it — the anon key has zero access. No deps; uses
   the Node 18+ global fetch. If env is unset, returns 503 and the client
   silently falls back to local-only saves.
   ============================================================ */
const CODE_RE = /^[a-z0-9]{8,40}$/;
const MAX_DATA = 512 * 1024; // 512 KB cap on a single save

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !KEY) {
    res.status(503).json({ error: 'cloud not configured' });
    return;
  }

  const code = String((req.query && req.query.code) || '').trim().toLowerCase();
  if (!CODE_RE.test(code)) {
    res.status(400).json({ error: 'bad code' });
    return;
  }

  const rest = SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/alife_saves';
  const auth = { apikey: KEY, Authorization: 'Bearer ' + KEY };

  try {
    if (req.method === 'GET') {
      const url = rest + '?code=eq.' + encodeURIComponent(code) + '&select=data,updated_at';
      const r = await fetch(url, { headers: auth });
      if (!r.ok) { res.status(502).json({ error: 'upstream ' + r.status }); return; }
      const rows = await r.json();
      if (!Array.isArray(rows) || !rows.length) { res.status(404).json({ error: 'not found' }); return; }
      res.status(200).json({ data: rows[0].data, updated_at: rows[0].updated_at });
      return;
    }

    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      if (!body || typeof body !== 'object' || body.data == null) {
        res.status(400).json({ error: 'missing data' });
        return;
      }
      if (JSON.stringify(body.data).length > MAX_DATA) {
        res.status(413).json({ error: 'save too large' });
        return;
      }
      const row = {
        code,
        data: body.data,
        surname: body.surname == null ? null : String(body.surname).slice(0, 80),
        gens: Math.max(1, body.gens | 0),
        souls: Math.max(0, body.souls | 0),
        alive: body.alive !== false,
        updated_at: new Date().toISOString(),
      };
      const r = await fetch(rest, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify([row]),
      });
      if (!r.ok) {
        const detail = await r.text().catch(() => '');
        res.status(502).json({ error: 'upstream ' + r.status, detail: detail.slice(0, 300) });
        return;
      }
      const saved = await r.json().catch(() => null);
      res.status(200).json({ ok: true, updated_at: (saved && saved[0] && saved[0].updated_at) || row.updated_at });
      return;
    }

    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
};
