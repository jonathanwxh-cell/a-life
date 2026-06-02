/* ============================================================
   A LIFE — generational sim. Stats are hidden; the player faces
   writing, choices, faces, and time.
   ============================================================ */

/* ---------- storage adapter ----------
   The save system talks to an async key-value store via window.storage
   (get / set / delete / list). A sandboxed host (e.g. an embedded artifact)
   may supply one; a plain browser does not. When it's absent we back it with
   localStorage, so saves persist when the game is opened as a file or served
   on GitHub Pages — exactly as the README promises. A host-provided store is
   left untouched. */
if(typeof window!=='undefined' && !window.storage){
  window.storage={
    async get(k){ try{ const v=localStorage.getItem(k); return v==null?null:{value:v}; }catch(e){ return null; } },
    async set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
    async delete(k){ try{ localStorage.removeItem(k); }catch(e){} },
    async list(prefix){ const keys=[]; try{ const pre=prefix||''; for(let i=0;i<localStorage.length;i++){ const key=localStorage.key(i); if(key&&key.indexOf(pre)===0) keys.push(key); } }catch(e){} return {keys}; },
  };
}

/* ---------- names ---------- */
const GIVEN_M=['Tomas','Elias','Henrik','Caleb','Aldous','Mateo','Ren','Soren','Idris','Cassian','Otto','Bram','Lucan','Emory','Hale'];
const GIVEN_F=['Mira','Iris','Lena','Cosima','Noor','Saoirse','Adaline','Yara','Esme','Theda','Liv','Marguerite','Ronja','Calla','Vesna'];
const SURNAMES=['Aldecott','Vane','Mercer','Holloway','Brandt','Okonkwo','Salvedi','Lindqvist','Fenn','Castellane','Ashby','Reyes','Voss','Marlowe','Thorne'];

const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
const chance=p=>Math.random()<p;

function pronouns(sex){
  return sex==='m'
    ? {they:'he',them:'him',their:'his',They:'He',Their:'His',child:'son',parent:'father',spouse:'husband'}
    : {they:'she',them:'her',their:'her',They:'She',Their:'Her',child:'daughter',parent:'mother',spouse:'wife'};
}

/* ---------- game state ---------- */
let S=null; // whole save: {surname, founded, year, marks, lineage[], person, lastSaved}
let P=null; // current person (alias S.person)
let firedObs={};
let running=true, busy=false;
const RATE=2100; // ms per year (idle pace — slower; the quiet is the point)

/* ---------- person factory ---------- */
function newPerson({given,sex,gen,parentName,seedStats,traits,startAge=0,inheritMeans=0,nurture=0,bornYear}){
  const px=pronouns(sex);
  const st = seedStats || {vit:ri(55,80),mind:ri(40,65),heart:ri(45,70),means:ri(20,45),spirit:ri(50,70)};
  if(nurture) st.mind=clamp(st.mind+nurture);
  st.means=clamp(st.means+inheritMeans);
  return {
    given, sex, px, gen,
    name:given+' '+S.surname,
    parentName: parentName||null,
    bornYear: bornYear,
    age: startAge,
    alive:true,
    stats: st,
    traits: traits || rollTraits(),
    rels: [],
    log: [],
    peakMeans: st.means,
    childrenIds: [],
    flags:{},
    sinceCard: 0,
    // decisions: chosen option + the roads not taken, for the constellation view
    decisions: [],
    // aura: the cumulative emotional/moral shape of THIS life, written by every choice.
    // warmth (cold..warm), light (heavy..bright), the count of choices made.
    aura:{ warmth:0, light:0, turns:0, lastDelta:null },
  };
}
const TRAITS=['bookish','frail','warm','restless','shrewd','tender','guarded','bright','stubborn','dreaming'];
function rollTraits(){const t=[pick(TRAITS)];if(chance(0.5))t.push(pick(TRAITS.filter(x=>x!==t[0])));return [...new Set(t)];}
function inheritTraits(parentTraits){
  const t=[];
  for(const tr of parentTraits) if(chance(0.45)) t.push(tr);
  if(chance(0.55)) t.push(pick(TRAITS)); // mutation
  return [...new Set(t)].slice(0,2);
}

/* relationships */
let _relId=1;
// a same-sex name not already worn by the player or a living relative — so the
// generated prose never collides ("Cosima, Cosima's sister"; "Bram, Bram's father").
function freshName(sex){
  const used=new Set(); if(P){ used.add(P.given); for(const r of P.rels) used.add(r.given); }
  const pool=(sex==='m'?GIVEN_M:GIVEN_F).filter(n=>!used.has(n));
  return pool.length?pick(pool):pick(sex==='m'?GIVEN_M:GIVEN_F);
}
function addRel(kind, given, sex, bond, age){
  if(P){ const used=new Set([P.given]); for(const r of P.rels) used.add(r.given); if(used.has(given)) given=freshName(sex); }
  const r={rid:_relId++, kind, given, name:given, sex, px:pronouns(sex), bond:clamp(bond), age:age|0, alive:true};
  P.rels.push(r); return r;
}
// returns how many times this keyed moment has occurred this life (1,2,3…), so a
// recurring card can vary its prose instead of repeating a sentence verbatim.
function nth(p, key){ p.flags=p.flags||{}; const k='n_'+key; return (p.flags[k]=(p.flags[k]||0)+1); }
const rel=kind=>P.rels.find(r=>r.kind===kind&&r.alive);
const rels=kind=>P.rels.filter(r=>r.kind===kind&&r.alive);
// the single oldest living parent who is genuinely old and not yet cared for (deterministic)
function agingParent(){
  return P.rels
    .filter(r=>(r.kind==='mother'||r.kind==='father')&&r.alive&&!r.caredFor&&r.age>=60)
    .sort((a,b)=>b.age-a.age)[0] || null;
}
// oldest grown child whose big choice hasn't been blessed/fought yet (deterministic)
function grownUnblessedChild(){
  return P.rels
    .filter(r=>r.kind==='child'&&r.alive&&!r.blessed&&r.age>=16)
    .sort((a,b)=>b.age-a.age)[0] || null;
}

/* ---------- logging ---------- */
function logLine(text, cls){
  P.log.push({age:P.age, text, cls:cls||''});
  renderLogTail();
}
function fmt(s){
  if(typeof s==='function') s=s(P);
  const px=P.px;
  return s.replace(/\{n\}/g,P.given)
    .replace(/\{they\}/g,px.they).replace(/\{them\}/g,px.them).replace(/\{their\}/g,px.their)
    .replace(/\{They\}/g,px.They).replace(/\{Their\}/g,px.Their);
}

function stageOf(a){return a<13?'child':a<26?'youth':a<46?'adult':a<66?'midlife':'elder';}

function fx(p, d){
  for(const k in d) p.stats[k]=clamp(p.stats[k]+d[k]);
  // every choice writes to the life's aura, so the world reflects who you're becoming
  if(p.aura){
    const warmD = (d.heart||0)*0.6 + (d.spirit||0)*0.3 + (d.means||0)*0.05;
    const lightD = (d.spirit||0)*0.6 + (d.heart||0)*0.2 + (d.mind||0)*0.15;
    p.aura.warmth = clamp((p.aura.warmth||0) + warmD*0.5, -40, 40);
    p.aura.light  = clamp((p.aura.light||0)  + lightD*0.5, -40, 40);
    p.aura.turns  = (p.aura.turns||0)+1;
    p.aura.lastDelta = {w:warmD, l:lightD};
  }
}

/* ---- memory: choices leave durable marks the future can find ---- */
function remember(key, val){ P.mem = P.mem||{}; P.mem[key]={v:val==null?true:val, age:P.age}; }
function recall(key){ return P.mem && P.mem[key]; }
function held(key){ return !!(P.mem && P.mem[key]); }
function yearsSince(key){ const m=recall(key); return m? P.age-m.age : null; }
// an echo is a line that consciously reaches back across the years
function echo(text, cls){ logLine(text, cls||'echo'); }
