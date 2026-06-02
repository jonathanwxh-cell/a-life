/* ============================================================
   RENDER
   ============================================================ */
function renderHeader(){
  document.getElementById('hName').textContent=P.name;
  const kin=[];
  const sp=rel('spouse'); if(sp)kin.push(P.px.spouse+' of '+sp.given);
  const kids=rels('child'); if(kids.length)kin.push(kids.length===1?'parent of one':'parent of '+kids.length);
  document.getElementById('hMeta').textContent = (P.age<13?'a child':stageOf(P.age))+ (kin.length?' · '+kin[0]:'');
  document.getElementById('hGen').innerHTML = ordinal(P.gen)+' of the line<br><span class="chron" id="openStars" tabindex="0" role="button" aria-label="open the constellation">✦ the constellation</span><br><span class="chron2" id="openChron" tabindex="0" role="button" aria-label="open the chronicle">the chronicle ↗</span>';
  const _os=document.getElementById('openStars'), _oc=document.getElementById('openChron');
  const _key=fn=>e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fn(); } };
  _os.onclick=()=>openChronicle('stars'); _os.onkeydown=_key(()=>openChronicle('stars'));
  _oc.onclick=()=>openChronicle('life');  _oc.onkeydown=_key(()=>openChronicle('life'));
}
function renderBeing(){
  const b=document.getElementById('being');
  b.style.opacity=0;
  setTimeout(()=>{b.textContent=beingLine(); b.style.opacity=0.9;},250);
}
function renderPassing(){
  document.getElementById('pAge').firstChild.textContent=P.age;
  document.getElementById('pYr').textContent='age';
  renderHeader();
}
function showPassing(){
  document.getElementById('passing').classList.add('show');
  renderPassing();
}
function renderLogTail(){
  const log=document.getElementById('log');
  const e=P.log[P.log.length-1];
  if(!e) return;
  addEphemeralEntry(log, e);
}
// the in-play log is ephemeral: a line fades in, lingers, then fades out, so the
// scene stays clear between moments. The full history lives in the Chronicle.
function addEphemeralEntry(log, e){
  const div=document.createElement('div');
  div.className='entry '+(e.cls||'');
  // stored lines keep their pronoun tokens (obs/echo use them); resolve at render time
  div.innerHTML=`<span class="a">${e.age}</span>${reTok(e.text)}`;
  log.appendChild(div);
  const live=[...log.children].filter(c=>!c.dataset.out);
  while(live.length>3) fadeOutEntry(live.shift());      // cap simultaneous lines
  div._t=setTimeout(()=>fadeOutEntry(div), 6500);        // and let this one fade after a breath
}
function fadeOutEntry(div){
  if(!div || div.dataset.out) return;
  div.dataset.out='1'; clearTimeout(div._t);
  div.style.animation='none'; div.style.transition='opacity 1.4s ease';
  void div.offsetWidth; div.style.opacity='0';
  setTimeout(()=>{ if(div.parentNode) div.parentNode.removeChild(div); }, 1500);
}
function reTok(s){const px=P.px;return s.replace(/\{they\}/g,px.they).replace(/\{them\}/g,px.them).replace(/\{their\}/g,px.their).replace(/\{They\}/g,px.They).replace(/\{Their\}/g,px.Their);}
// a one-time, non-persisted orientation line (fades like any log entry, never saved to
// the chronicle). Gated per key in localStorage so a returning player never sees it.
function hintOnce(key, text){
  try{ if(!window.localStorage || localStorage.getItem('alife:'+key)) return; localStorage.setItem('alife:'+key,'1'); }catch(e){ return; }
  const log=document.getElementById('log'); if(log) addEphemeralEntry(log, {age:'', text, cls:'obs'});
  // briefly draw the eye to the actual chronicle control the hint refers to
  if(key==='seenChron'){ const s=document.getElementById('openStars'); if(s){ s.classList.add('beckon'); setTimeout(()=>s.classList.remove('beckon'),5400); } }
}
function renderLogFull(){
  // ephemeral model: only seed the latest beat when the log is empty (a fresh
  // load / new life); otherwise leave the fading entries be (no flicker on choices).
  const log=document.getElementById('log');
  if(log.children.length) return;
  for(const e of P.log.slice(-1)) addEphemeralEntry(log, e);
}
function renderAll(){ renderHeader(); renderBeing(); renderLogFull(); showPassing(); }

/* chronicle */
function renderMemoir(){
  // current life header
  const kids=rels('child');
  const subBits=[];
  subBits.push(P.alive!==false?('age '+P.age+', '+beingLine().replace(/\.$/,'')):('lived '+ (P.deathAge||P.age)+' years'));
  document.getElementById('lifeHead').innerHTML=
    `<div class="nm">${P.name}</div><div class="sub">${ordinal(P.gen)} of House ${S.surname}<br>${subBits[0]}.</div>`;
  // full decision history, grouped by stage
  const M=document.getElementById('memoir'); M.innerHTML='';
  const stageName=a=>a<13?'childhood':a<26?'youth':a<46?'adulthood':a<66?'midlife':'old age';
  let lastStage=null;
  if(!P.log||!P.log.length){ M.innerHTML='<div class="mline"><div class="mt" style="font-style:italic;opacity:.6">The story has only just begun.</div></div>'; return; }
  for(const e of P.log){
    const sg=stageName(e.age);
    if(sg!==lastStage){ lastStage=sg;
      const sep=document.createElement('div'); sep.className='mline';
      sep.innerHTML=`<div class="ma"></div><div class="mt"><span class="stage-sep">${sg}</span></div>`;
      M.appendChild(sep);
    }
    const row=document.createElement('div'); row.className='mline '+(e.cls||'');
    row.innerHTML=`<div class="ma">${e.age}</div><div class="mt">${reTok(e.text)}</div>`;
    M.appendChild(row);
  }
}
function switchTab(which){
  document.getElementById('tabLife').classList.toggle('on',which==='life');
  document.getElementById('tabLine').classList.toggle('on',which==='line');
  document.getElementById('tabStars').classList.toggle('on',which==='stars');
  document.getElementById('paneLife').style.display=which==='life'?'':'none';
  document.getElementById('paneLine').style.display=which==='line'?'':'none';
  document.getElementById('paneStars').style.display=which==='stars'?'':'none';
  if(which==='stars' && window.AL_buildStars) requestAnimationFrame(()=>window.AL_buildStars());
}
document.getElementById('tabLife').onclick=()=>switchTab('life');
document.getElementById('tabLine').onclick=()=>switchTab('line');
document.getElementById('tabStars').onclick=()=>switchTab('stars');

function openChronicle(startTab){
  running=false; clearTimeout(timer);
  document.getElementById('chronName').textContent='House '+S.surname;
  renderMemoir();
  switchTab(startTab||'life');
  // house standing panel
  const h=S.house||initHouse();
  const seat=seatOf(h.seat);
  const reps=Object.entries(h.repute||{}).filter(([k,v])=>v>=1).sort((a,b)=>b[1]-a[1]).map(([k])=>REPUTE_WORD[k]||k);
  let hp=`<div class="seat">The house holds <b>${seat.name}</b>.</div>`;
  if(reps.length) hp+=`<div class="rep">Known, over the years, as ${reps.slice(0,3).join(', ')}.</div>`;
  for(const hl of (h.heirlooms||[])) hp+=`<div class="item">Carries down ${hl.name} — from ${hl.from}, ${ordinal(hl.gen)} of the line.</div>`;
  if(h.secret && !h.secret.known) hp+=`<div class="item secret">A silence kept since ${ordinal(h.secret.gen)} generation: ${h.secret.text}.</div>`;
  if(h.secret && h.secret.known) hp+=`<div class="item">An old secret, once kept, now spoken and laid to rest.</div>`;
  if(h.motto) hp+=`<div class="motto">“${h.motto}”</div>`;
  document.getElementById('housePanel').innerHTML=hp;
  const m=S.marks;
  document.getElementById('marks').innerHTML=`
    <div class="mark"><div class="v">${m.gens||1}</div><div class="l">generations</div></div>
    <div class="mark"><div class="v">${m.souls||0}</div><div class="l">lives lived</div></div>
    <div class="mark"><div class="v">${m.longest||P.age}</div><div class="l">longest life</div></div>
    <div class="mark"><div class="v">${seatOf(m.peakSeat||h.seat).adj}</div><div class="l">peak standing</div></div>`;
  const L=document.getElementById('lineage'); L.innerHTML='';
  const all=[...S.lineage];
  for(const a of all){
    const d=document.createElement('div'); d.className='anc';
    const readable = a.log && a.log.length;
    d.innerHTML=`<div class="o">${ordinal(a.gen)}</div><div><div class="nm">${a.given} ${a.surname||S.surname}${readable?' <span style="color:var(--amber);font-size:11px;opacity:.7">— read ↗</span>':''}</div><span class="ep">${a.epitaph}${a.extinct?' — the line ended here.':''}</span></div><div class="sp">${a.span} yrs</div>`;
    if(readable){ d.style.cursor='pointer'; d.tabIndex=0; d.setAttribute('role','button'); d.setAttribute('aria-label','Read the life of '+a.given);
      d.onclick=()=>showAncestorLife(a); d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); showAncestorLife(a); } }; }
    L.appendChild(d);
  }
  // current living person — tap to jump to This Life
  const d=document.createElement('div'); d.className='anc alive'; d.style.cursor='pointer'; d.tabIndex=0; d.setAttribute('role','button'); d.setAttribute('aria-label','Read this life');
  d.innerHTML=`<div class="o">${ordinal(P.gen)}</div><div><div class="nm">${P.given} ${S.surname} <span style="color:var(--amber);font-size:11px;opacity:.7">— read ↗</span></div><span class="ep">living — ${beingLine()}</span></div><div class="sp">age ${P.age}</div>`;
  const _jump=()=>{ renderMemoir(); switchTab('life'); };
  d.onclick=_jump; d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); _jump(); } };
  L.appendChild(d);
  document.getElementById('vChron').classList.add('show');
  // if we opened straight to the constellation, rebuild now that the canvas has size
  if((startTab||'life')==='stars' && window.AL_buildStars){
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.AL_buildStars()));
  }
}
// render a past ancestor's full recorded life into the This Life pane
function showAncestorLife(a){
  document.getElementById('lifeHead').innerHTML=
    `<div class="nm">${a.given} ${a.surname||S.surname}</div><div class="sub">${ordinal(a.gen)} of the line · lived ${a.span} years<br>“${a.epitaph}”</div>`;
  const M=document.getElementById('memoir'); M.innerHTML='';
  const stageName=ag=>ag<13?'childhood':ag<26?'youth':ag<46?'adulthood':ag<66?'midlife':'old age';
  let lastStage=null;
  for(const e of a.log){
    const sg=stageName(e.age);
    if(sg!==lastStage){ lastStage=sg; const sep=document.createElement('div'); sep.className='mline';
      sep.innerHTML=`<div class="ma"></div><div class="mt"><span class="stage-sep">${sg}</span></div>`; M.appendChild(sep); }
    const row=document.createElement('div'); row.className='mline '+(e.cls||'');
    row.innerHTML=`<div class="ma">${e.age}</div><div class="mt">${e.text}</div>`;
    M.appendChild(row);
  }
  switchTab('life');
}
document.getElementById('chronClose').onclick=()=>{
  document.getElementById('vChron').classList.remove('show');
  if(window.AL_stopStars) window.AL_stopStars();
  if(P.alive){ running=true; scheduleTick(); }
};

/* pause/play */
const pp=document.getElementById('pp');
function setPP(){pp.innerHTML=running?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  pp.setAttribute('aria-label',running?'pause':'play'); pp.setAttribute('title',running?'pause':'play');
  document.getElementById('flow').textContent=running?'the years are passing':'time held still';
  document.body.classList.toggle('paused',!running);}
pp.onclick=()=>{ if(busy)return; running=!running; setPP(); if(running)scheduleTick(); else clearTimeout(timer); };

// ---- modal focus management ----
// when a veil opens, remember where focus was and move it into the dialog; when it
// closes, return focus to the trigger. Centralised via a class observer so the many
// show/hide call-sites stay untouched.
(function(){
  if(typeof MutationObserver==='undefined') return;
  let prevFocus=null;
  ['vTitle','vLoad','vDeath','vHeir','vChron'].forEach(id=>{
    const v=document.getElementById(id); if(!v) return;
    new MutationObserver(()=>{
      if(v.classList.contains('show')){
        if(document.activeElement && !v.contains(document.activeElement) && document.activeElement!==document.body) prevFocus=document.activeElement;
        const el=v.querySelector('.btn:not([disabled]), button:not([disabled]), [tabindex], textarea');
        if(el&&el.focus) setTimeout(()=>{ try{ el.focus(); }catch(e){} },40);
      } else if(prevFocus){
        try{ prevFocus.focus(); }catch(e){} prevFocus=null;
      }
    }).observe(v,{attributes:true,attributeFilter:['class']});
  });
})();
