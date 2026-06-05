/* ============================================================
   RENDER
   ============================================================ */
let _hGenGen=-1;
function renderHeader(){
  document.getElementById('hName').textContent=P.name;
  const kin=[];
  const sp=rel('spouse'); if(sp)kin.push(P.px.spouse+' of '+sp.given);
  const kids=rels('child'); if(kids.length)kin.push(kids.length===1?'parent of one':'parent of '+kids.length);
  document.getElementById('hMeta').textContent = (P.age<13?'a child':stageOf(P.age))+ (kin.length?' · '+kin[0]:'');
  // only rebuild the chronicle links when the generation ordinal changes — rebuilding them
  // every tick (via renderPassing) was destroying a keyboard user's focus mid-navigation.
  if(_hGenGen!==P.gen){
    _hGenGen=P.gen;
    document.getElementById('hGen').innerHTML = ordinal(P.gen)+' of the line<br><span class="chron" id="openStars" tabindex="0" role="button" aria-label="open the constellation">✦ the constellation</span><br><span class="chron2" id="openChron" tabindex="0" role="button" aria-label="open the chronicle">the chronicle ↗</span>';
    const _os=document.getElementById('openStars'), _oc=document.getElementById('openChron');
    const _key=fn=>e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fn(); } };
    _os.onclick=()=>openChronicle('stars'); _os.onkeydown=_key(()=>openChronicle('stars'));
    _oc.onclick=()=>openChronicle('life');  _oc.onkeydown=_key(()=>openChronicle('life'));
  }
}
const _reduceMotion=()=>{ try{ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
function renderBeing(){
  const b=document.getElementById('being');
  if(_reduceMotion()){ b.textContent=beingLine(); b.style.opacity=0.9; return; }  // no invisible-text gap under reduced motion
  b.style.opacity=0;
  setTimeout(()=>{b.textContent=beingLine(); b.style.opacity=0.9;},250);
}
// the emotional register of a log line is shown in colour; name it for screen-reader and
// colour-blind users so a joy never reads the same as a loss.
function srTag(cls){ const m={joy:'Joyful',loss:'A loss',echo:'An echo'}; return m[cls]?`<span class="sr-only">${m[cls]}: </span>`:''; }
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
function addEphemeralEntry(log, e, life){
  const div=document.createElement('div');
  div.className='entry '+(e.cls||'');
  // stored lines keep their pronoun tokens (obs/echo use them); resolve at render time
  div.innerHTML=`<span class="a">${e.age}</span>${srTag(e.cls)}${reTok(e.text)}`;
  log.appendChild(div);
  const live=[...log.children].filter(c=>!c.dataset.out);
  while(live.length>3) fadeOutEntry(live.shift());      // cap simultaneous lines
  div._t=setTimeout(()=>fadeOutEntry(div), life||6500); // and let this one fade after a breath (hints linger longer)
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
  const log=document.getElementById('log'); if(log) addEphemeralEntry(log, {age:'', text, cls:'hint'}, 13000);  // onboarding lines linger
  // briefly draw the eye to the actual chronicle control the hint refers to
  if(key==='seenChron'){ const s=document.getElementById('openStars'); if(s){ s.classList.add('beckon'); setTimeout(()=>s.classList.remove('beckon'),5400); } }
  if(key==='seenLog'){ const l=document.getElementById('log'); if(l){ l.classList.add('beckon'); setTimeout(()=>l.classList.remove('beckon'),5400); } }
}
// a rare, ephemeral ambient line during the quiet years — fills the silence between moments
// without writing anything to the chronicle (these are weather, not events worth recording).
const AMBIENT={
  child:["A long afternoon goes by with nothing in it but light.","Somewhere a window stays open, and the whole day comes in.","A whole season passes in the slow way only childhood seasons do."],
  adult:["The ordinary week turns out to be where a life is actually lived.","A stretch of work and evenings goes by, and is mostly good.","The middle of a life is wide and quiet and full of nothing in particular.","The days run together for a while, the way the good ones tend to."],
  elder:["The days are wide and slow and mostly kind now.","Morning, the long noon, the longer evening; morning again.","The hours have loosened, and {they} lets them."],
  any:["The season turns over, quietly, and turns again.","An ordinary week passes, and is not kept.","Rain comes, and stays a while, and goes.","The light lengthens, and shortens, and lengthens again.","A year goes by that no one will remember, and it is a good one.","The house settles around its own small sounds."]
};
let _ambN=0;
function ambientWhisper(){
  if(!P||!P.alive) return;
  const stage = P.age<13?'child':(P.age>=66?'elder':(P.age>=26?'adult':null));
  const pool = (stage?AMBIENT[stage]:[]).concat(AMBIENT.any);
  const line = pool[(_ambN++ + (typeof houseOff==='function'?houseOff():0))%pool.length];
  const log=document.getElementById('log'); if(log) addEphemeralEntry(log, {age:P.age, text:line, cls:'whisper'});
}
window.AL_ambient = ambientWhisper;
// hide the "more below" cue once a tall card has been scrolled to the bottom
(function(){ const st=document.querySelector('.stage'); if(!st) return;
  st.addEventListener('scroll', ()=>{ st.classList.toggle('at-bottom', st.scrollTop+st.clientHeight >= st.scrollHeight-6); }, {passive:true});
})();
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
    row.innerHTML=`<div class="ma">${e.age}</div><div class="mt">${srTag(e.cls)}${reTok(e.text)}</div>`;
    M.appendChild(row);
  }
}
function switchTab(which){
  [['tabLife','life'],['tabLine','line'],['tabStars','stars']].forEach(([id,t])=>{
    const el=document.getElementById(id); const on=which===t;
    el.classList.toggle('on',on); el.setAttribute('aria-selected',on?'true':'false'); el.tabIndex=on?0:-1;  // roving tabindex
  });
  document.getElementById('paneLife').style.display=which==='life'?'':'none';
  document.getElementById('paneLine').style.display=which==='line'?'':'none';
  document.getElementById('paneStars').style.display=which==='stars'?'':'none';
  if(which==='stars' && window.AL_buildStars) requestAnimationFrame(()=>window.AL_buildStars());
  if(which==='stars'){ const a=document.getElementById('starA11y');
    if(a){ const n=((typeof S!=='undefined'&&S&&S.lineage)?S.lineage.reduce((x,an)=>x+((an.decisions&&an.decisions.length)||0),0):0)+((P&&P.decisions)?P.decisions.length:0);
      a.textContent='The constellation: '+n+' choices across the bloodline, drawn as a star-map. Use the arrow keys to move between them.'; } }
}
document.getElementById('tabLife').onclick=()=>switchTab('life');
document.getElementById('tabLine').onclick=()=>switchTab('line');
document.getElementById('tabStars').onclick=()=>switchTab('stars');
// the eulogy screen's link into the Chronicle (a natural moment to look back)
(function(){ const dc=document.getElementById('dChron'); if(dc){ const open=()=>openChronicle('life');
  dc.onclick=open; dc.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); } }; } })();
// arrow-key roving for the Chronicle tablist (ARIA tabs pattern)
(function(){ const order=['life','line','stars'], tabs={life:'tabLife',line:'tabLine',stars:'tabStars'};
  const tl=document.querySelector('.tabs'); if(!tl) return;
  tl.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key)<0) return; e.preventDefault();
    const cur=order.findIndex(t=>document.getElementById(tabs[t]).getAttribute('aria-selected')==='true');
    let i=cur<0?0:cur;
    if(e.key==='ArrowRight') i=(i+1)%3; else if(e.key==='ArrowLeft') i=(i+2)%3; else if(e.key==='Home') i=0; else i=2;
    switchTab(order[i]); document.getElementById(tabs[order[i]]).focus();
  });
})();

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
  const L=document.getElementById('lineage'); L.innerHTML=''; L.setAttribute('role','list');
  const all=[...S.lineage];
  for(const a of all){
    const li=document.createElement('div'); li.setAttribute('role','listitem');
    const d=document.createElement('div'); d.className='anc';
    const readable = a.log && a.log.length;
    d.innerHTML=`<div class="o">${ordinal(a.gen)}</div><div><div class="nm">${a.given} ${a.surname||S.surname}${readable?' <span style="color:var(--amber);font-size:11px;opacity:.7">— read ↗</span>':''}</div><span class="ep">${a.epitaph}${a.extinct?' — the line ended here.':''}</span></div><div class="sp">${a.span} yrs</div>`;
    if(readable){ d.style.cursor='pointer'; d.tabIndex=0; d.setAttribute('role','button'); d.setAttribute('aria-label','Read the life of '+a.given);
      d.onclick=()=>showAncestorLife(a); d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); showAncestorLife(a); } }; }
    li.appendChild(d); L.appendChild(li);
  }
  // current living person — tap to jump to This Life
  const li=document.createElement('div'); li.setAttribute('role','listitem');
  const d=document.createElement('div'); d.className='anc alive'; d.style.cursor='pointer'; d.tabIndex=0; d.setAttribute('role','button'); d.setAttribute('aria-label','Read this life');
  d.innerHTML=`<div class="o">${ordinal(P.gen)}</div><div><div class="nm">${P.given} ${S.surname} <span style="color:var(--amber);font-size:11px;opacity:.7">— read ↗</span></div><span class="ep">living — ${beingLine()}</span></div><div class="sp">age ${P.age}</div>`;
  const _jump=()=>{ renderMemoir(); switchTab('life'); };
  d.onclick=_jump; d.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); _jump(); } };
  li.appendChild(d); L.appendChild(li);
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
    row.innerHTML=`<div class="ma">${e.age}</div><div class="mt">${srTag(e.cls)}${e.text}</div>`;
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
  const flowEl=document.getElementById('flow');
  flowEl.textContent=running?(fastFwd?'the years are racing by':'the years are passing'):'time held still';
  flowEl.setAttribute('aria-label', running?(fastFwd?'the years are racing by — tap to return to the usual pace':'the years are passing — tap to race ahead'):'time held still — tap to let the years resume');
  // (no aria-pressed: this is a 3-state control, not a 2-state toggle — the label carries the state)
  document.body.classList.toggle('paused',!running);
  document.body.classList.toggle('hurry',running&&fastFwd);}
pp.onclick=()=>{ if(busy)return; running=!running; setPP(); if(running)scheduleTick(); else clearTimeout(timer); };

/* ---- pace control (tap the flowing-years text) & quick log → chronicle ---- */
(function(){
  const flow=document.getElementById('flow');
  const toggleFast=()=>{ if(!P||P.alive===false) return;
    if(!running){ running=true; setPP(); scheduleTick(); return; }   // paused → resume
    fastFwd=!fastFwd; setPP(); scheduleTick(); };                     // running → toggle the quick pace
  if(flow){ flow.onclick=toggleFast; flow.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleFast(); } }; }
  const log=document.getElementById('log');
  const openLog=()=>{ if(P&&S) openChronicle('life'); };   // tap the fading log to read the whole life so far
  if(log){ log.addEventListener('click',openLog); log.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openLog(); } }); }
})();

/* ---- "how things stand": a diegetic, number-free reading of where the life sits right now.
   Opt-in (behind a quiet button), so the default view keeps its no-numbers calm — but a player
   who wants something to plan against can read the body, mind, heart, means, and spirit in prose. */
function _tier(v, bands){ for(const b of bands){ if(v<b[0]) return b[1]; } return bands[bands.length-1][1]; }
function lifeReadout(){
  const s=P.stats;
  return [
    ['The body',  _tier(s.vit,  [[18,'is failing'],[34,'is wearing'],[52,'holds, mostly'],[72,'is still strong enough'],[999,'is strong, and knows it']])],
    ['The mind',  _tier(s.mind, [[28,'has gone scattered'],[45,'is getting by'],[63,'is clear enough'],[80,'is sharp'],[999,'is sharp as a blade, and restless with it']])],
    ['The heart', _tier(s.heart,[[22,'has walled itself off'],[40,'is guarded'],[58,'is open enough'],[76,'is warm, and easily reached'],[999,'is wide open, and easily hurt']])],
    ['The means', _tier(s.means,[[14,'never stretch far enough'],[30,'are thin'],[50,'are comfortable enough'],[70,'are comfortable, with something put by'],[86,'are ample'],[999,'are deep, and closely watched']])],
    ['The spirit',_tier(s.spirit,[[22,'is in shadow'],[40,'is low, but holding'],[60,'is steady'],[78,'is light'],[999,'is lit from within']])],
  ];
}
function openStock(){
  if(!P) return;
  const v=document.getElementById('vStock'); v._wasRunning=running; running=false; clearTimeout(timer);
  document.getElementById('stockWho').textContent = P.name+' · '+(P.age<13?'a child':stageOf(P.age))+', age '+P.age;
  const rows=lifeReadout().map(([k,val])=>`<div class="srow"><span class="sk">${k}</span> <span class="sv">${val}.</span></div>`);
  const extra=[];
  const h=S.house; if(h){ const seat=seatOf(h.seat);
    extra.push(`The house holds <b>${seat.name}</b>.`);
    extra.push(houseCharacter(h));
    let dir;
    if(h.seat>=7) dir='The house is written into the histories — as high as a name can be raised.';
    else if(h.seat>=6){ dir='The house holds an old and famous name. To be written into the histories, it must keep this seat, hold one reputation strong across many lives, and raise an heir whose fortune reaches its full height.';
      dir += ' '+((P.peakMeans||0)>=76 ? 'This life’s fortune has reached that height.' : 'This life’s fortune has not yet reached that height.'); }
    else if(h.seat>=5) dir='The house holds a grand estate. From here it climbs on an heir whose fortune reaches a real height, or on a name settled deep into the family’s character over several lives — and can still slip in a hard year met empty-handed.';
    else dir='The house rises on a life that ends far richer than it began, or on a name made strong for one thing — and can slip a step in a hard year met empty-handed.';
    if(h.seat>=2 && h.seat<6 && P.stats.means>40 && P.age>=40 && P.age<=64) dir += ' A life can spend deliberately now — on a patronage, a marriage well made, a public work with the name on it — to push the standing up; it does not always hold, but it tilts the odds.';
    extra.push(`<span class="shint">${dir}</span>`);
    // what the house has yet to reach — something concrete to steer the next lives toward
    if(typeof houseAspirations==='function'){ const asp=houseAspirations(h, S.marks); if(asp.length) extra.push(`<span class="shint">Still ahead for the house: ${asp.slice(0,3).join('; ')}.</span>`); } }
  const tie=P.rels.filter(r=>r.alive&&r.kind!=='ex').sort((a,b)=>b.bond-a.bond)[0];
  if(tie) extra.push(`Closest, just now, to ${tie.given}.`);
  if(P.flags.peril && P.age<P.flags.peril) extra.push(`And something in how ${P.px.they} has been living has put the body, for a while, at risk.`);
  if(P.age>=60 && (rels('child').length||(P.childrenIds&&P.childrenIds.length)) && !held('bequeathed')) extra.push(`There is still time to decide what to set aside for the one who comes after.`);
  document.getElementById('stockBody').innerHTML = rows.join('') + (extra.length?`<div class="snote">${extra.join('<br>')}</div>`:'');
  v.classList.add('show');
}
(function(){
  const b=document.getElementById('stockBtn'); if(b) b.onclick=openStock;
  const c=document.getElementById('stockClose'); if(c) c.onclick=()=>{ const v=document.getElementById('vStock'); v.classList.remove('show');
    running=!!v._wasRunning; setPP(); if(P&&P.alive&&running) scheduleTick(); };
})();

// ---- modal focus management ----
// when a veil opens, remember where focus was and move it into the dialog; when it
// closes, return focus to the trigger. Centralised via a class observer so the many
// show/hide call-sites stay untouched.
(function(){
  if(typeof MutationObserver==='undefined') return;
  const FOCUSABLE='a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const ESC_CLOSE={vChron:'chronClose', vLoad:'loadBack', vStock:'stockClose'};   // dismissable modals (not the narrative gates)
  const visibles=v=>[...v.querySelectorAll(FOCUSABLE)].filter(el=>el.offsetParent!==null || el===document.activeElement);
  const focusIn=v=>{ const el=v.querySelector(FOCUSABLE); if(el&&el.focus) setTimeout(()=>{ try{ el.focus(); }catch(e){} },40); };
  let stack=[]; const top=()=>stack[stack.length-1]||null;     // support nested veils (e.g. chronicle over eulogy)
  document.addEventListener('keydown',e=>{
    const v=top(); if(!v) return;
    if(e.key==='Escape'){ const id=ESC_CLOSE[v.id], btn=id&&document.getElementById(id); if(btn){ e.preventDefault(); btn.click(); } return; }
    if(e.key==='Tab'){                                        // trap focus inside the topmost veil
      const f=visibles(v); if(!f.length) return;
      const first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
      else if(!v.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    }
  });
  ['vTitle','vLoad','vDeath','vHeir','vChron','vStock'].forEach(id=>{
    const v=document.getElementById(id); if(!v) return;
    new MutationObserver(()=>{
      if(v.classList.contains('show')){
        if(stack.indexOf(v)<0){
          if(document.activeElement && !v.contains(document.activeElement) && document.activeElement!==document.body) v._prevFocus=document.activeElement;
          stack.push(v);
        }
        focusIn(v);
      } else {
        const i=stack.indexOf(v); if(i>=0) stack.splice(i,1);
        if(v._prevFocus){ try{ v._prevFocus.focus(); }catch(e){} v._prevFocus=null; }
        else { const t=top(); if(t) focusIn(t); }            // re-trap the veil underneath
      }
    }).observe(v,{attributes:true,attributeFilter:['class']});
  });
  // the title veil starts with .show already set, so its MutationObserver never fires on
  // load — seed any already-open veil here so it's focus-trapped from the first Tab.
  ['vTitle','vLoad','vDeath','vHeir','vChron','vStock'].forEach(id=>{
    const v=document.getElementById(id);
    if(v && v.classList.contains('show')){ if(stack.indexOf(v)<0) stack.push(v); focusIn(v); }
  });
})();
