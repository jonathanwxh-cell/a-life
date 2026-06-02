/* A LIFE — death & succession, and the house that accrues across the line. */

/* ---------- death & succession ---------- */
function die(){
  busy=true; running=false; clearTimeout(timer);
  P.alive=false;
  P.deathAge=P.age;
  recordAncestor(P);
  showEulogy(P);
  save();
}
function epitaphFor(p){
  const s=p.stats, leg=p.flags.legacy, m=p.mem||{};
  // a defining memory can claim the epitaph
  if(m.kept_stray && s.heart>60) return "Loved small helpless things {their} whole life long.".replace(/\{their\}/g,p.px.their);
  if(m.became_teacher) return "Gave away everything {they} knew, and so kept it.".replace(/\{they\}/g,p.px.they);
  if(m.strayed && !m.confessed) return "Carried one secret all the way to the end.";
  // an explicit legacy choice (e_legacy) wins over stat-derived epitaphs below
  if(leg==='built') return "Built something that outlasted the building of it.";
  if(leg==='here') return "Asked for no monument — only that the years had been real.";
  if(leg==='kind'||s.heart>82) return "Remembered, above all, as kind.";
  if(p.peakMeans>78) return "Built something that outlasted the building of it.";
  if(s.mind>78) return "Lived half in the world and half in {their} own head.".replace(/\{their\}/g,p.px.their);
  if(s.spirit>74) return "Carried a lightness the years never managed to take.";
  if(s.spirit<28) return "Knew more sorrow than {they} ever said aloud.".replace(/\{they\}/g,p.px.they);
  if(p.deathAge<40) return "Gone too soon, with so much unspent.";
  if(s.means<18) return "Never had much, and gave away some of that.";
  // mid-tier lives — broadly decent without peaking — get their own quiet lines,
  // so the default below stays reserved for the genuinely unremarkable.
  if(s.spirit>=52&&s.heart>=52&&s.means>=38) return "Held more than most, and seldom needed to say so.";
  if(s.heart>=55&&s.means<45) return "Had little to spare, and spared it anyway.";
  if(s.heart>=60) return "Easy to love, and not always easy to live with.";
  if(p.deathAge>=82) return "Lived a long time, and left the rooms quieter for the leaving.";
  return "An ordinary life, which is to say, a whole world.";
}
/* ============================================================
   DYNASTY STATE — the house accumulates across generations.
   A seat that rises or falls, a reputation that drifts with how
   each ancestor lived, heirlooms gained, and secrets that pass down.
   ============================================================ */
const SEATS=[
  {min:0,  name:"nothing but a name",      adj:"landless"},
  {min:1,  name:"a rented room",           adj:"struggling"},
  {min:2,  name:"a small house in town",   adj:"modest"},
  {min:3,  name:"a comfortable household", adj:"comfortable"},
  {min:4,  name:"a fine townhouse",        adj:"well-to-do"},
  {min:5,  name:"a grand estate",          adj:"landed"},
  {min:6,  name:"an old and famous house", adj:"illustrious"},
];
function seatOf(lvl){ let s=SEATS[0]; for(const x of SEATS) if(lvl>=x.min) s=x; return s; }

function initHouse(){
  return {
    seat:1,                 // 0..6, the family's standing/home
    repute:{},              // tags like {scholarly:2, kind:1, tainted:1} — drift with lives
    heirlooms:[],           // {name, from, gen} — objects/legacies passed down
    secret:null,            // {text, from, gen, known:false} — an inheritable secret
    motto:null,             // emerges once
    eldestLine:true,
  };
}
function reputeTop(h){
  const e=Object.entries(h.repute||{}).filter(([k,v])=>v>=2).sort((a,b)=>b[1]-a[1]);
  return e.length?e[0][0]:null;
}
const REPUTE_WORD={scholarly:"learned",kind:"kind-hearted",ruthless:"hard-dealing",
  artistic:"creative",pious:"devout",tainted:"quietly disgraced",generous:"open-handed",
  industrious:"hard-working",reckless:"wild"};

// called at death: fold this life's character into the house
function updateHouse(p){
  const h=S.house;
  const s=p.stats, m=p.mem||{};
  // --- seat moves with how much fortune the life ended holding, relative to its peak ---
  // the house rises on what a life ACHIEVED at its height (peakMeans), not only what
  // it ended holding — so building wealth and then living on it still lifts the family.
  // Falls require genuine end-of-life hardship. This lets a tended line accumulate.
  const endMeans=s.means, peak=p.peakMeans;
  if(peak>=80) h.seat=Math.min(6,h.seat+ (peak>=92?2:1));
  else if(peak>=58) h.seat=Math.min(6,h.seat+ (Math.random()<0.6?1:0));
  else if(endMeans<14) h.seat=Math.max(0,h.seat- (endMeans<8?2:1));

  // --- reputation drifts with the defining qualities of the life ---
  const bump=(tag,n=1)=>{h.repute[tag]=(h.repute[tag]||0)+n;};
  const fade=()=>{for(const k in h.repute){h.repute[k]=Math.max(0,h.repute[k]-0.18);if(h.repute[k]<0.4)delete h.repute[k];}};
  fade(); // reputations soften over generations if not renewed
  if(s.mind>74||m.chose_study||m.became_teacher) bump('scholarly');
  if(s.heart>74||m.kept_stray||p.flags.legacy==='kind') bump('kind');
  if(m.strayed&&!m.confessed) bump('tainted');
  if(s.means>80&&s.heart<40) bump('ruthless');
  if(p.flags.legacy==='built'||s.means>82) bump('industrious');
  if(m.kind_to_outcast) bump('generous',0.5);

  // a family can also climb on a strong, sustained reputation — not only on wealth.
  // A scholarly or kind or hard-working line earns standing the modest can reach
  // (capped below the very top, which stays the province of fortune).
  const repTop=reputeTop(h);
  if(repTop && h.repute[repTop]>=2.5 && h.seat<5 && Math.random()<0.55) h.seat=Math.min(5,h.seat+1);

  // --- heirlooms: certain lives leave an object behind ---
  if(m.child_books && !h.heirlooms.some(x=>x.tag==='book'))
    h.heirlooms.push({tag:'book',name:"a book too hard for a child's hands",from:p.given,gen:p.gen});
  if(m.kept_stray && !h.heirlooms.some(x=>x.tag==='stray'))
    h.heirlooms.push({tag:'stray',name:"a soft spot for strays",from:p.given,gen:p.gen});
  if(s.means>88 && !h.heirlooms.some(x=>x.tag==='fortune'))
    h.heirlooms.push({tag:'fortune',name:"a fortune, and the fear of losing it",from:p.given,gen:p.gen});
  if(m.had_mentor && !h.heirlooms.some(x=>x.tag==='teaching'))
    h.heirlooms.push({tag:'teaching',name:"the habit of teaching the young",from:p.given,gen:p.gen});

  // --- secret: a strayed-and-unconfessed life buries one for descendants to inherit ---
  if(m.strayed && !m.confessed && !h.secret)
    h.secret={text:p.given+" did something to "+p.px.their+" marriage that the family still does not speak of",from:p.given,gen:p.gen,known:false};
  // a confession lays an existing secret to rest
  if(m.confessed && h.secret) h.secret=null;

  // --- motto crystallizes once the house has a clear character ---
  if(!h.motto){
    const top=reputeTop(h);
    const MOTTOS={scholarly:"What the mind holds cannot be taken.",kind:"We take in what the world turns out.",
      ruthless:"We do not ask twice.",industrious:"By our own hands.",generous:"An open door, an open hand.",
      tainted:"We do not speak of everything.",pious:"In time, all is weighed.",artistic:"We leave something beautiful behind."};
    if(top&&MOTTOS[top]&&p.gen>=2) h.motto=MOTTOS[top];
  }
}

function recordAncestor(p){
  if(!S.house) S.house=initHouse();
  updateHouse(p);
  S.lineage.push({
    given:p.given, surname:S.surname, gen:p.gen, sex:p.sex,
    born:p.bornYear, died:p.bornYear+p.deathAge, span:p.deathAge,
    epitaph:fmt(epitaphFor(p)),
    peakMeans:Math.round(p.peakMeans),
    hadHeir: rels('child').length>0,
    seatAfter: S.house.seat,
    log: (p.log||[]).map(e=>({age:e.age, text:reTok(e.text), cls:e.cls||''})),
    decisions: (p.decisions||[]).map(d=>({age:d.age, chose:d.chose, alts:d.alts, tone:d.tone}))
  });
  // high-water marks
  S.marks.longest=Math.max(S.marks.longest||0, p.deathAge);
  S.marks.peakMeans=Math.max(S.marks.peakMeans||0, Math.round(p.peakMeans));
  S.marks.peakSeat=Math.max(S.marks.peakSeat||0, S.house.seat);
  S.marks.souls=(S.marks.souls||0)+1;
  S.marks.gens=Math.max(S.marks.gens||1, p.gen);
}
function showEulogy(p){
  document.getElementById('dName').textContent=p.name;
  document.getElementById('dSpan').textContent=`${p.gen===1?'Founder of the line':ordinal(p.gen)+' of the line'} · lived ${p.deathAge} years`;
  document.getElementById('dEul').textContent='“'+fmt(epitaphFor(p))+'”';
  // survivors
  const surv=p.rels.filter(r=>r.alive&&r.kind!=='ex');
  const kids=rels('child');
  let stext='';
  if(surv.length){
    stext='Survived by '+surv.map(r=>r.given).join(', ')+'.';
  } else stext='No one was left to grieve {them}.'.replace(/\{them\}/g,p.px.them);
  document.getElementById('dSurv').textContent=fmt(stext);
  const btn=document.getElementById('dNext');
  if(kids.length){
    btn.textContent='Become '+kids[0].given;
    btn.onclick=()=>succeed(kids.sort((a,b)=>b.age-a.age)[0]);
  } else {
    btn.textContent='The line ends. Begin anew.';
    btn.onclick=()=>{ S.lineage[S.lineage.length-1].extinct=true; beginNewLine(); };
  }
  document.getElementById('vDeath').classList.add('show');
}
function ordinal(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}

function succeed(childRel){
  document.getElementById('vDeath').classList.remove('show');
  const dead=P;
  const h=S.house||initHouse();
  // estate passes with entropy — but the family SEAT sets a floor, so a great house
  // cushions a poor heir and a fallen house gives even a rich parent's child less.
  const seatFloor=[0,6,14,26,40,56,72][h.seat]||0;
  const inheritMeans = Math.max(seatFloor, Math.round(dead.peakMeans*0.55) - 6) - 6;
  const nurture = Math.round((dead.stats.mind-50)*0.18 + (childRel.bond-50)*0.10);
  // the heir is BORN — startAge 0 — and lives the whole arc. Inheritance applies
  // as starting conditions (estate share, blended traits, the house's standing,
  // a parent's sharpening), not as a head start in years.
  const child=newPerson({
    given:childRel.given, sex:childRel.sex, gen:dead.gen+1,
    parentName:dead.name,
    seedStats: childRel.seed || seedChildStats(dead,null),
    traits: childRel.traitsSeed || inheritTraits(dead.traits),
    startAge: 0,
    inheritMeans: Math.max(0,inheritMeans),
    nurture: nurture,
    bornYear: dead.bornYear + (dead.deathAge - childRel.age),
  });
  // born into the house — heirlooms & the family secret arrive as latent memories
  child.mem = child.mem || {};
  for(const hl of (h.heirlooms||[])){
    if(hl.tag==='book') child.mem.child_books={age:0,inherited:true};
    if(hl.tag==='stray') child.mem.kept_stray={age:0,inherited:true};
    if(hl.tag==='teaching') child.mem.had_mentor={age:0,inherited:true};
  }
  if(h.secret && !h.secret.known){ child.mem.inherited_secret={age:0, from:h.secret.from}; }
  S.person=child; P=child; firedObs={};
  if(window.AL_reseed) window.AL_reseed();
  // a newborn with its own childhood family, seeded fresh like a founder's — but the
  // parent on the bloodline carries the departed ancestor's name, so the line continues
  // as a living echo rather than re-simulating the dead. No other relations carry over.
  const lineKind = dead.sex==='m'?'father':'mother';
  const otherSex = dead.sex==='m'?'f':'m', otherKind = dead.sex==='m'?'mother':'father';
  addRel(lineKind, dead.given, dead.sex, 74, ri(24,38));
  addRel(otherKind, pick(otherSex==='m'?GIVEN_M:GIVEN_F), otherSex, 68, ri(22,34));
  // opening lines reflect being born a child of the house it has become
  const seat=seatOf(h.seat);
  const births=["Was born into "+seat.name+", and a family that already had a story.",
    "Was born where the last life ended — into "+seat.name+", and a name already partly spent.",
    "Came into the world already inside a story someone else had begun, with "+seat.name+" for an inheritance."];
  logLine(births[child.gen % births.length],"obs");
  if(h.motto) logLine("Raised on the family words: “"+h.motto+"”","obs");
  showHeir(child, dead, inheritMeans, nurture, h);
}
function showHeir(child, dead, inh, nur, h){
  document.getElementById('heirKick').textContent=ordinal(child.gen)+' of '+(h?'House '+S.surname:'the line');
  document.getElementById('heirName').textContent=child.name;
  const t=[];
  t.push(`Child of ${dead.given}.`);
  const rep = h?reputeTop(h):null;
  if(rep&&REPUTE_WORD[rep]) t.push('Of a family known as '+REPUTE_WORD[rep]+'.');
  if(child.traits.length) t.push('Said, already, to be '+child.traits.join(' and ')+'.');
  document.getElementById('heirTag').innerHTML=t.join('<br>');
  let insight='';
  const seat = h?seatOf(h.seat):null;
  if(seat){
    if(h.seat>=5) insight="Born into "+seat.name+" — every door already open, and a name to be worthy of.";
    else if(h.seat>=3) insight="Born into "+seat.name+". Neither hungry nor free.";
    else if(h.seat>=1) insight="Born into "+seat.name+". The climbing is not finished.";
    else insight="Born with nothing but the name. It will have to be enough.";
  }
  if(nur>6) insight+=" A mind sharpened by a parent who taught.";
  // inherited heirlooms / secret, surfaced at birth
  const lines=[insight];
  if(h){
    for(const hl of (h.heirlooms||[])) lines.push('Inherits '+hl.name+' (from '+hl.from+').');
    if(h.secret && !h.secret.known) lines.push('And inherits a silence: '+h.secret.text+'.');
  }
  document.getElementById('heirInherit').innerHTML=lines.join('<br>');
  document.getElementById('vHeir').classList.add('show');
}
document.getElementById('heirGo').onclick=()=>{
  document.getElementById('vHeir').classList.remove('show');
  running=true; busy=false; renderAll(); scheduleTick(); save();
};

/* ---------- new line (founder) ---------- */
function makeFounder(gen=1, surname){
  const sex=chance(0.5)?'m':'f';
  const given=pick(sex==='m'?GIVEN_M:GIVEN_F);
  const p=newPerson({given,sex,gen,bornYear:S?S.year:0});
  return p;
}
function seedParents(p){
  P=p;
  addRel('mother',pick(GIVEN_F),'f',64,ri(22,34));
  if(chance(0.85)) addRel('father',pick(GIVEN_M),'m',58,ri(24,38));
}
function startLife(p){
  S.person=p; P=p; firedObs={};
  if(window.AL_reseed) window.AL_reseed();
  seedParents(p);
  logLine("Was born.","obs");
  // a gentle one-time orientation for a first-ever player (non-persisted; fades)
  if(window.hintOnce) setTimeout(()=>{ if(P&&P.alive) hintOnce('seenIntro',"The years move on their own — pause any time with the ▮▮ below. Now and then, a moment will ask something of you."); },1600);
  running=true; busy=false;
}

function beginNewLine(){
  document.getElementById('vDeath').classList.remove('show');
  document.getElementById('vHeir').classList.remove('show');
  S.surname=pick(SURNAMES);
  S.house=initHouse();
  const f=makeFounder(1);
  startLife(f);
  renderAll(); scheduleTick(); save();
}
