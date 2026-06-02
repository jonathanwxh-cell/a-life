/* ============================================================
   PERSISTENCE — multi-slot saves
   Keys:  alife:index  -> [{slot, surname, gens, souls, seat, updated}]
          alife:slot:N -> full save S
   ============================================================ */
let SLOT=null; // active slot id

async function readIndex(){
  try{ const r=await window.storage.get('alife:index'); return r? JSON.parse(r.value): []; }
  catch(e){ return []; }
}
async function writeIndex(idx){
  try{ await window.storage.set('alife:index', JSON.stringify(idx)); }catch(e){}
}
function slotMeta(){
  return { slot:SLOT, surname:S.surname,
    gens:(S.marks&&S.marks.gens)||1, souls:(S.marks&&S.marks.souls)||0,
    seat:(S.house&&S.house.seat)||1,
    living: S.person? S.person.given : '—',
    age: S.person? S.person.age : 0,
    alive: S.person? S.person.alive!==false : false,
    updated: Date.now() };
}
async function save(){
  if(SLOT==null) return;
  try{
    S.lastSaved=Date.now();
    await window.storage.set('alife:slot:'+SLOT, JSON.stringify(S));
    const idx=await readIndex();
    const i=idx.findIndex(e=>e.slot===SLOT);
    const meta=slotMeta();
    if(i>=0) idx[i]=meta; else idx.push(meta);
    await writeIndex(idx);
  }catch(e){}
  if(window.AL_cloud) window.AL_cloud.schedulePush();   // shadow the save up to the cloud (debounced, optional)
}
async function loadSlot(slot){
  try{
    const r=await window.storage.get('alife:slot:'+slot);
    if(!r) return false;
    S=JSON.parse(r.value); P=S.person; SLOT=slot;
    if(!S.house) S.house=initHouse();
    if(!S.marks) S.marks={gens:1,souls:0,longest:0,peakMeans:0};
    if(P){
      P.px=pronouns(P.sex);
      if(!Array.isArray(P.rels)) P.rels=[];
      for(const rl of P.rels) rl.px=pronouns(rl.sex);
      if(!P.aura) P.aura={warmth:0,light:0,turns:0,lastDelta:null};
      if(!P.flags) P.flags={};
      if(!Array.isArray(P.log)) P.log=[];
      if(!Array.isArray(P.childrenIds)) P.childrenIds=[];
    }
    firedObs={};
    return !!P;
  }catch(e){ return false; }
}
async function deleteSlot(slot){
  try{
    await window.storage.delete('alife:slot:'+slot);
    const idx=(await readIndex()).filter(e=>e.slot!==slot);
    await writeIndex(idx);
  }catch(e){}
  // if we just deleted the line being played, stop and clear it — otherwise the
  // in-memory game keeps ticking and re-saves itself, resurrecting the slot.
  if(slot===SLOT){
    running=false; busy=false; clearTimeout(timer);
    S=null; P=null; SLOT=null; firedObs={};
    setPP();
  }
}
async function nextFreeSlot(){
  const idx=await readIndex();
  const used=new Set(idx.map(e=>e.slot));
  for(let i=1;i<=6;i++) if(!used.has(i)) return i;
  return null; // all 6 full
}

/* ============================================================
   BOOT & MENUS
   ============================================================ */
async function startFreshGame(){
  const slot=await nextFreeSlot();
  if(slot==null){ document.getElementById('loadHint').textContent='All six chronicles are full — delete one to begin anew.'; openLoadMenu(); return; }
  SLOT=slot;
  document.getElementById('vTitle').classList.remove('show');
  document.getElementById('vLoad').classList.remove('show');
  S={surname:pick(SURNAMES), year:0, marks:{gens:1,souls:0,longest:0,peakMeans:0}, lineage:[], person:null, house:initHouse()};
  const f=makeFounder(1);
  startLife(f);
  setPP(); renderAll(); scheduleTick(); save();
}
document.getElementById('begin').onclick=startFreshGame;

async function openLoadMenu(){
  await migrateLegacy();                          // also recover any old save when browsing slots
  const idx=(await readIndex()).sort((a,b)=>b.updated-a.updated);
  const list=document.getElementById('slotList'); list.innerHTML='';
  if(!idx.length){
    const e=document.createElement('div'); e.className='slot empty'; e.textContent='No chronicles yet.';
    list.appendChild(e);
  }
  for(const m of idx){
    const row=document.createElement('div'); row.className='slot';
    const when=timeAgo(m.updated);
    const status = m.alive ? `${m.living}, age ${m.age}` : `${m.living} — the line rests`;
    row.innerHTML=`<div class="body" tabindex="0" role="button" aria-label="Load House ${m.surname}"><div class="nm">House ${m.surname}</div>
      <div class="sub">${m.gens} generation${m.gens>1?'s':''} · ${m.souls} live${m.souls===1?'':'s'} lived · ${seatOf(m.seat).adj}<br>
      <span class="${m.alive?'':'dead'}">${status}</span> · ${when}</div></div>
      <button class="del" type="button" aria-label="Delete this chronicle" title="delete">✕</button>`;
    const _loadRow=async()=>{
      const ok=await loadSlot(m.slot);
      if(ok){
        if(window.AL_cloud) await window.AL_cloud.reconcile();   // adopt a newer cloud copy before resuming
        document.getElementById('vLoad').classList.remove('show');
        document.getElementById('vTitle').classList.remove('show');
        offlineCatchUp();
        setPP();
        if(P.alive){ renderAll(); scheduleTick(); }
        else { renderAll(); showEulogy(P); }
      }
    };
    const _bodyEl=row.querySelector('.body'); _bodyEl.onclick=_loadRow;
    _bodyEl.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); _loadRow(); } };
    row.querySelector('.del').onclick=async(e)=>{
      e.stopPropagation();
      if(confirm('Delete House '+m.surname+' forever? This cannot be undone.')){ await deleteSlot(m.slot); openLoadMenu(); }
    };
    list.appendChild(row);
  }
  document.getElementById('vLoad').classList.add('show');
}
document.getElementById('openLoad').onclick=openLoadMenu;
document.getElementById('inspectBtn').onclick=inspectStorage;
document.getElementById('exportBtn').onclick=exportCurrent;
document.getElementById('importBtn').onclick=importFromCode;
const _doBackup=async()=>{
  await save();
  try{
    const code=encodeSave(S);
    let copied=false;
    try{ await navigator.clipboard.writeText(code); copied=true; }catch(_){ }
    const el=document.getElementById('dBackup');
    el.textContent = copied ? '✓ copied — paste it somewhere safe' : '⤓ open Menu → Load to copy your code';
    el.style.color='var(--sage)';
  }catch(e){ document.getElementById('dBackup').textContent='backup failed — use Menu → Load'; }
};
(function(){ const b=document.getElementById('dBackup'); b.onclick=_doBackup;
  b.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); _doBackup(); } }; })();
document.getElementById('menuBtn').onclick=async()=>{
  running=false; clearTimeout(timer); setPP();
  await save();
  document.getElementById('loadHint').textContent='Saved. Choose a line to continue, or start another.';
  openLoadMenu();
};
document.getElementById('loadBack').onclick=()=>{
  document.getElementById('vLoad').classList.remove('show');
  document.getElementById('loadHint').textContent='Choose a line to continue, or start another.';
  if(!P) document.getElementById('vTitle').classList.add('show');
};

function timeAgo(ts){
  if(!ts) return 'just now';
  const s=(Date.now()-ts)/1000;
  if(s<60) return 'moments ago';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
function offlineCatchUp(){
  if(P.alive && S.lastSaved){
    const yrs=Math.min(4, Math.floor((Date.now()-S.lastSaved)/(RATE*1.5)));
    if(yrs>0){
      for(let i=0;i<yrs && P.alive;i++){P.age++;driftYear();ageRelations();observe();if(deathRoll()){break;}}
      if(P.alive) logLine("While you were away, "+yrs+(yrs===1?" year":" years")+" passed quietly.","obs");
    }
  }
}

// ---- EXPORT / IMPORT: the durable backup the player holds themselves ----
function encodeSave(obj){
  // JSON -> URI-escaped UTF-8 -> base64, prefixed with a version tag
  const json=JSON.stringify(obj);
  const b64=btoa(unescape(encodeURIComponent(json)));
  return 'ALIFE1:'+b64;
}
function decodeSave(code){
  let s=String(code||'').trim();
  if(s.indexOf('ALIFE1:')===0) s=s.slice(7);
  s=s.replace(/\s+/g,'');
  const json=decodeURIComponent(escape(atob(s)));
  const obj=JSON.parse(json);
  if(!obj || !obj.person || !obj.surname) throw new Error('not a valid A Life save');
  return obj;
}
function setBackupMsg(t,warn){ const m=document.getElementById('backupMsg'); m.textContent=t; m.classList.toggle('warn',!!warn); }

async function exportCurrent(){
  try{
    let data=null;
    if(typeof S!=='undefined' && S && S.person){ data=S; }
    else {
      // no active game — export the most recent slot
      const idx=(await readIndex()).sort((a,b)=>b.updated-a.updated);
      if(idx.length){ const r=await window.storage.get('alife:slot:'+idx[0].slot); if(r) data=JSON.parse(r.value); }
    }
    if(!data){ setBackupMsg('No line to export yet — begin one first.',true); return; }
    const box=document.getElementById('codeBox');
    // Cloud path: a short chronicle code that follows you across devices.
    if(window.AL_cloud && window.AL_cloud.enabled && data===S){
      if(!data.code) data.code=window.AL_cloud.mintCode();
      await save();                  // persist the code locally + schedule a push
      await window.AL_cloud.flush(); // push now so the code resolves immediately elsewhere
      box.value=data.code; box.focus(); box.select();
      let copied=false;
      try{ await navigator.clipboard.writeText(data.code); copied=true; }
      catch(e){ try{ document.execCommand('copy'); }catch(_){ } }
      setBackupMsg((copied?'Copied your chronicle code. ':'Your chronicle code is above. ')
        + 'On another device, paste it and tap “Continue from code”.');
      return;
    }
    // Offline fallback: a self-contained base64 backup (works with no network).
    const code=encodeSave(data);
    box.value=code; box.focus(); box.select();
    let copied=false;
    try{ await navigator.clipboard.writeText(code); copied=true; }
    catch(e){ try{ document.execCommand('copy'); copied=true; }catch(_){} }
    setBackupMsg(copied
      ? 'Offline backup code copied (cloud unavailable here) — keep it safe.'
      : 'Offline backup code ready above — long-press to copy.');
  }catch(e){ setBackupMsg('Export failed: '+e.message,true); }
}

async function importFromCode(){
  const box=document.getElementById('codeBox');
  const raw=box.value;
  if(!raw || !raw.trim()){ setBackupMsg('Paste a code into the box first.',true); return; }
  // A short chronicle code -> pull that dynasty from the cloud.
  if(window.AL_cloud && window.AL_cloud.isCode(raw)){
    setBackupMsg('Looking up that chronicle code…');
    const res=await window.AL_cloud.fetchByCode(raw);
    if(res.data){ await adoptIntoSlot(res.data, 'Continued House '+res.data.surname+' from the cloud.'); return; }
    if(res.error && res.error!=='not-a-code'){ setBackupMsg(res.error,true); return; }
    // 'not-a-code' falls through to the base64 path below
  }
  // Otherwise treat it as a self-contained base64 backup.
  let obj;
  try{ obj=decodeSave(raw); }
  catch(e){ setBackupMsg('That code could not be read: '+e.message,true); return; }
  await adoptIntoSlot(obj, 'Restored House '+obj.surname+'.');
}

// write a save into a free slot, load it, and resume play
async function adoptIntoSlot(obj, okMsg){
  try{
    let slot=await nextFreeSlot(); if(slot==null) slot=1;
    await window.storage.set('alife:slot:'+slot, JSON.stringify(obj));
    const idx=(await readIndex()).filter(e=>e.slot!==slot);
    idx.push({slot, surname:obj.surname, gens:(obj.marks&&obj.marks.gens)||1, souls:(obj.marks&&obj.marks.souls)||0,
      seat:(obj.house&&obj.house.seat)||1, living:obj.person.given, age:obj.person.age,
      alive:obj.person.alive!==false, updated:Date.now()});
    await writeIndex(idx);
    const ok=await loadSlot(slot);
    if(ok){
      setBackupMsg(okMsg);
      document.getElementById('vLoad').classList.remove('show');
      document.getElementById('vTitle').classList.remove('show');
      offlineCatchUp(); setPP();
      if(P.alive){ renderAll(); scheduleTick(); } else { renderAll(); showEulogy(P); }
    } else setBackupMsg('The code decoded but the save would not load.',true);
  }catch(e){ setBackupMsg('Import failed: '+e.message,true); }
}

// scan EVERY storage key and rebuild from whatever survived — diagnosis + last-resort recovery
async function inspectStorage(){
  const out=document.getElementById('inspectOut');
  let lines=[]; let keys=[];
  try{ const r=await window.storage.list(''); keys=(r&&r.keys)||[]; }
  catch(e){ lines.push('Could not list storage: '+e.message); }
  const alifeKeys=keys.filter(k=>String(k).indexOf('alife')===0);
  lines.push('Keys visible here: '+keys.length);
  lines.push('A Life keys: '+(alifeKeys.length?alifeKeys.join(', '):'(none)'));
  let recovered=[];
  for(const k of alifeKeys){
    if(/alife:slot:\d+/.test(k) || k==='alife:v1'){
      try{ const v=await window.storage.get(k); if(v){ const data=JSON.parse(v.value);
        if(data&&data.person) recovered.push({key:k, surname:data.surname, given:data.person.given, age:data.person.age, gens:(data.marks&&data.marks.gens)||1});
      }}catch(e){}
    }
  }
  if(recovered.length){
    lines.push(''); lines.push('Recoverable saves found:');
    recovered.forEach(r=>lines.push('  • House '+r.surname+' — '+r.given+', age '+r.age+' (gen '+r.gens+')'));
    const idx=await readIndex();
    for(const r of recovered){
      let slot; const mm=r.key.match(/alife:slot:(\d+)/); slot = mm? +mm[1] : ((await nextFreeSlot())||1);
      if(r.key==='alife:v1'){ const v=await window.storage.get('alife:v1'); await window.storage.set('alife:slot:'+slot, v.value); }
      if(!idx.some(e=>e.slot===slot)){
        const v=await window.storage.get('alife:slot:'+slot); const d=JSON.parse(v.value);
        idx.push({slot, surname:d.surname, gens:(d.marks&&d.marks.gens)||1, souls:(d.marks&&d.marks.souls)||0,
          seat:(d.house&&d.house.seat)||1, living:d.person.given, age:d.person.age, alive:d.person.alive!==false, updated:d.lastSaved||Date.now()});
      }
    }
    await writeIndex(idx);
    lines.push(''); lines.push('→ Rebuilt the list. Tap Back, then Load again — they should appear.');
  } else {
    lines.push(''); lines.push('No save data is present in this storage scope. The previous game is not reachable from this version of the artifact, so it cannot be recovered from here.');
  }
  out.textContent=lines.join('\n');
}

// migrate a pre-slots save (alife:v1) into the slot system, once
async function migrateLegacy(){
  try{
    const idx=await readIndex();
    const r=await window.storage.get('alife:v1');
    if(!r) return idx;                         // nothing old to recover
    const already = idx.some(e=>e.migrated);
    if(already) return idx;                    // already brought across
    const old=JSON.parse(r.value);
    if(!old || !old.person) return idx;
    // find a free slot (or reuse 1)
    let slot=1; const used=new Set(idx.map(e=>e.slot));
    while(used.has(slot)&&slot<=6) slot++;
    if(slot>6) slot=1;
    await window.storage.set('alife:slot:'+slot, JSON.stringify(old));
    const meta={ slot, surname:old.surname, migrated:true,
      gens:(old.marks&&old.marks.gens)||1, souls:(old.marks&&old.marks.souls)||0,
      seat:(old.house&&old.house.seat)||1,
      living:old.person?old.person.given:'—', age:old.person?old.person.age:0,
      alive:old.person?old.person.alive!==false:false, updated:(old.lastSaved||Date.now()) };
    const ni=idx.filter(e=>e.slot!==slot); ni.push(meta);
    await writeIndex(ni);
    return ni;
  }catch(e){ return await readIndex(); }
}

// on first load: recover any legacy save, then offer Continue for the most recent chronicle
(async()=>{
  const idx=await migrateLegacy();
  if(idx.length){
    const most=idx.slice().sort((a,b)=>b.updated-a.updated)[0];
    const t=document.getElementById('begin').parentNode;   // the button group, not the tagline
    const cont=document.createElement('button');
    cont.className='btn'; cont.textContent='Continue House '+most.surname;
    cont.onclick=async()=>{
      const ok=await loadSlot(most.slot);
      if(ok){ if(window.AL_cloud) await window.AL_cloud.reconcile();
        document.getElementById('vTitle').classList.remove('show'); offlineCatchUp(); setPP();
        if(P.alive){renderAll();scheduleTick();} else {renderAll();showEulogy(P);} }
    };
    t.insertBefore(cont, t.firstChild);
  }
})();
