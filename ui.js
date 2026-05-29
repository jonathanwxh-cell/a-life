/* ============================================================
   RENDER
   ============================================================ */
function renderHeader(){
  document.getElementById('hName').textContent=P.name;
  const kin=[];
  const sp=rel('spouse'); if(sp)kin.push(P.px.spouse+' of '+sp.given);
  const kids=rels('child'); if(kids.length)kin.push(kids.length===1?'parent of one':'parent of '+kids.length);
  document.getElementById('hMeta').textContent = (P.age<13?'a child':stageOf(P.age))+ (kin.length?' · '+kin[0]:'');
  document.getElementById('hGen').innerHTML = ordinal(P.gen)+' of the line<br><span class="chron" id="openStars">✦ the constellation</span><br><span class="chron2" id="openChron">the chronicle ↗</span>';
  document.getElementById('openStars').onclick=()=>openChronicle('stars');
  document.getElementById('openChron').onclick=()=>openChronicle('life');
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
  const div=document.createElement('div');
  div.className='entry '+(e.cls||'');
  // stored lines keep their pronoun tokens (obs/echo lines use them); resolve at render time
  div.innerHTML=`<span class="a">${e.age}</span>${reTok(e.text)}`;
  log.appendChild(div);
  log.scrollTop=log.scrollHeight;
  // trim DOM
  while(log.children.length>60) log.removeChild(log.firstChild);
}
function reTok(s){const px=P.px;return s.replace(/\{they\}/g,px.they).replace(/\{them\}/g,px.them).replace(/\{their\}/g,px.their).replace(/\{They\}/g,px.They).replace(/\{Their\}/g,px.Their);}
function renderLogFull(){
  const log=document.getElementById('log'); log.innerHTML='';
  for(const e of P.log.slice(-50)){
    const div=document.createElement('div');
    div.className='entry '+(e.cls||'');
    div.innerHTML=`<span class="a">${e.age}</span>${reTok(e.text)}`;
    div.style.animation='none'; div.style.opacity=1;
    log.appendChild(div);
  }
  log.scrollTop=log.scrollHeight;
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
    if(readable){ d.style.cursor='pointer'; d.onclick=()=>showAncestorLife(a); }
    L.appendChild(d);
  }
  // current living person — tap to jump to This Life
  const d=document.createElement('div'); d.className='anc alive'; d.style.cursor='pointer';
  d.innerHTML=`<div class="o">${ordinal(P.gen)}</div><div><div class="nm">${P.given} ${S.surname} <span style="color:var(--amber);font-size:11px;opacity:.7">— read ↗</span></div><span class="ep">living — ${beingLine()}</span></div><div class="sp">age ${P.age}</div>`;
  d.onclick=()=>{ renderMemoir(); switchTab('life'); };
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
  document.getElementById('flow').textContent=running?'the years are passing':'time held still';}
pp.onclick=()=>{ if(busy)return; running=!running; setPP(); if(running)scheduleTick(); else clearTimeout(timer); };
