/* ============================================================
   CLOUD SAVES — optional cross-device sync via a chronicle code.
   localStorage stays the source of truth; this shadows the active
   save up to a small endpoint on the Hetzner box (Postgres, code-gated)
   and pulls it back on another device. Never required: offline, or opened
   from file://, every call no-ops and the game plays on localStorage.
   The endpoint replaced the old Vercel /api/chronicle function (Supabase);
   it does exact-code GET/PUT only and holds the DB creds server-side.
   Loaded after persistence.js; talks to its globals at runtime.
   ============================================================ */
(function(){
  const API='https://a-life-db.alyoechosys.dev/chronicle';
  const ENABLED = typeof location!=='undefined' && /^https?:$/.test(location.protocol);
  const CODE_RE=/^[a-z0-9]{8,40}$/;

  // 20 chars of [0-9a-z] (~103 bits) — unguessable, so codes can't be enumerated
  function mintCode(){
    const a=new Uint8Array(20);
    (window.crypto||self.crypto).getRandomValues(a);
    let s=''; for(let i=0;i<a.length;i++) s+=(a[i]%36).toString(36);
    return s;
  }

  let hideT=null;
  function setStatus(txt,cls){
    const el=document.getElementById('cloudStatus'); if(!el) return;
    el.textContent=txt; el.className='cloudStatus show '+(cls||'');
    clearTimeout(hideT); hideT=setTimeout(()=>{ el.className='cloudStatus '+(cls||''); }, 2600);
  }

  // fetch with an abort timeout so a slow network never hangs the game
  async function timed(make, ms){
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(), ms);
    try{ return await make(ctrl.signal); } finally{ clearTimeout(t); }
  }

  let pushTimer=null, pushing=false, again=false;
  async function doPush(){
    if(typeof S==='undefined'||!S||!S.person) return;
    if(!S.code) S.code=mintCode();
    if(pushing){ again=true; return; }
    pushing=true;
    const pushedRev=S.rev||0;
    const body={ data:S, surname:S.surname,
      gens:(S.marks&&S.marks.gens)||1, souls:(S.marks&&S.marks.souls)||0,
      alive: S.person? S.person.alive!==false : true };
    try{
      const r=await timed(sig=>fetch(API+'?code='+encodeURIComponent(S.code),
        {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:sig}), 8000);
      if(r.ok){
        let j=null; try{ j=await r.clone().json(); }catch(_){}
        const serverT=Date.parse((j&&j.updated_at)||r.headers.get('Date')||'')||0;
        if(serverT){ S.cloudUpdatedAt=serverT; S.cloudRev=pushedRev; if(typeof SLOT!=='undefined'&&SLOT!=null) await window.storage.set('alife:slot:'+SLOT, JSON.stringify(S)); }
      }
      setStatus(r.ok?'✦ synced':'saved on this device', r.ok?'ok':'dim');
    }catch(e){ setStatus('offline — saved on this device','dim'); }
    finally{ pushing=false; if(again){ again=false; schedulePush(); } }
  }
  function schedulePush(){ if(!ENABLED) return; clearTimeout(pushTimer); pushTimer=setTimeout(doPush, 2000); }
  function flush(){ if(!ENABLED) return; clearTimeout(pushTimer); return doPush(); }

  // after a local load (before the caller renders / starts the loop): pull the
  // cloud copy and adopt it iff strictly newer. Reuses loadSlot for normalization.
  async function reconcile(){
    if(!ENABLED || typeof S==='undefined' || !S || !S.code || typeof SLOT==='undefined' || SLOT==null) return;
    try{
      const r=await timed(sig=>fetch(API+'?code='+encodeURIComponent(S.code),{signal:sig}), 3500);
      if(!r.ok){ if(r.status===404) schedulePush(); return; }
      const j=await r.json(); if(!j||!j.data) return;
      const cloudT=Date.parse(j.updated_at||'')||0;
      const cloudRev=(j.data&&j.data.rev)||0, localRev=S.rev||0, localCloudT=S.cloudUpdatedAt||0;
      if(cloudRev>localRev || (cloudRev===localRev && cloudT && cloudT>localCloudT)){
        j.data.cloudUpdatedAt=cloudT; j.data.cloudRev=cloudRev||j.data.rev||0;
        await window.storage.set('alife:slot:'+SLOT, JSON.stringify(j.data));
        await loadSlot(SLOT);                 // tested normalization path
        if(window.AL_reseed) window.AL_reseed();
        setStatus('✦ synced from the cloud','ok');
      } else {
        schedulePush();                        // local is current — make sure the cloud has it
      }
    }catch(e){}
  }

  // pull a dynasty by a code typed on a fresh device; returns {data} or {error}
  async function fetchByCode(code){
    code=String(code||'').trim().toLowerCase();
    if(!ENABLED) return {error:'Cloud codes need the hosted game (you seem to be offline or local).'};
    if(!CODE_RE.test(code)) return {error:'not-a-code'};
    try{
      const r=await timed(sig=>fetch(API+'?code='+encodeURIComponent(code),{signal:sig}), 6000);
      if(r.status===404) return {error:'No chronicle found for that code.'};
      if(!r.ok) return {error:'Could not reach the cloud just now.'};
      const j=await r.json(); if(!j||!j.data) return {error:'That code held no save.'};
      const data=j.data; data.code=code;       // keep syncing under this code
      return {data};
    }catch(e){ return {error:'Could not reach the cloud just now.'}; }
  }

  window.AL_cloud={
    enabled:ENABLED, schedulePush, flush, reconcile, fetchByCode, mintCode,
    isCode:s=>CODE_RE.test(String(s||'').trim().toLowerCase()),
  };
  if(ENABLED) addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') flush(); });
})();
