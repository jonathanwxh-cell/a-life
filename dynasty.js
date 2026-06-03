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
  const s=p.stats, leg=p.flags.legacy, m=p.mem||{}, px=p.px;
  // Three layers keep a chronicle from reading repetitively down the generations:
  //  1. pr() rotates a per-generation variant and skips either of the last two
  //     ancestors' exact lines (no phrase ever lands twice in a row);
  //  2. blocked() steps a STAT-derived life aside when the last two ancestors
  //     already shared its theme, so a house never reads three of one note running;
  //  3. out() tags the chosen theme so recordAncestor can remember it for (2).
  const sub=t=>t.replace(/\{they\}/g,px.they).replace(/\{their\}/g,px.their).replace(/\{them\}/g,px.them);
  const lin=(typeof S!=='undefined'&&S.lineage)?S.lineage.slice(-2):[];
  const recent=lin.map(a=>a&&a.epitaph), recentC=lin.map(a=>a&&a.cluster);
  const blocked=k=>recentC.filter(c=>c===k).length>=2;
  const out=(k,txt)=>{ p._epiCluster=k; return txt; };
  const pr=arr=>{ const opts=arr.map(sub); const fresh=opts.filter(o=>!recent.includes(o)); const pool=fresh.length?fresh:opts; return pool[((p.gen-1+(typeof houseOff==='function'?houseOff():0))%pool.length+pool.length)%pool.length]; };
  const built=["Built something that outlasted the building of it.","Made something real, and the making was the life.","Left more behind than {they} took, and the difference is what remains.","Put something into the world that stayed there after {them}."];
  const kind=["Remembered, above all, as kind.","Remembered, most of all, for a steady kindness.","Kind in the small daily ways that turn out to be the large ones.","Left people gentler than {they} found them.","Carried a warmth into every room, and left it there."];
  // a defining memory or chosen legacy claims the epitaph (identity — always honored)
  if(m.kept_stray && !m.kept_stray.inherited && s.heart>60 && !m.turned_stray && !blocked('stray')) return out('stray', pr(["Loved small helpless things {their} whole life long.","Never could pass a hurt creature without stopping for it.","Left the world a little more tender than {they} found it.","Gave shelter to whatever could not fend for itself, all {their} days."]));
  if(m.became_teacher && !blocked('teacher')) return out('teacher', pr(["Gave away everything {they} knew, and so kept it.","Taught what {they} knew, and so outlived the knowing of it.","Spent a whole life handing on what {they} had learned.","Left {their} knowing in other heads, where it kept on being used."]));
  if(m.strayed && !m.confessed && !blocked('secret')) return out('secret', pr(["Carried one secret all the way to the end.","Kept the one thing {they} could not say, and carried it the whole way.","Took one door, unopened, all the way into the ground."]));
  if(leg==='built' && !blocked('built')) return out('built', pr(built));
  if(leg==='here' && !blocked('here')) return out('here', pr(["Asked for no monument — only that the years had been real.","Wanted no marker but the fact of having been here.","Left no monument, and would have refused one."]));
  if(leg==='kind' && !blocked('kind')) return out('kind', pr(kind));
  // stat-derived themes step aside if the last two ancestors already shared them
  if(s.heart>82 && !blocked('kind')) return out('kind', pr(kind));
  if(p.peakMeans>78 && !blocked('built')) return out('built', pr(built));
  if(s.mind>78 && !blocked('mind')) return out('mind', pr(["Lived half in the world and half in {their} own head.","Kept a whole country behind the eyes, and lived there often.","Was elsewhere as often as here, and the elsewhere was wide."]));
  if(s.spirit>74 && !blocked('light')) return out('light', pr(["Carried a lightness the years never managed to take.","Laughed easily to the end, in a way the hard years never quite explained.","Found the days, even the late ones, mostly worth the trouble of waking for.","Was, to the very last, difficult to discourage."]));
  if(s.spirit<28 && !blocked('dark')) return out('dark', pr(["Knew more sorrow than {they} ever said aloud.","Carried a weight {they} rarely named.","Held more grief than the quiet face ever let on."]));
  if(p.deathAge<40) return out('early', pr(["Gone too soon, with so much unspent.","Gone early, with the better part still ahead.","Left before the story had found its middle."]));
  if(s.means<18 && !blocked('poor')) return out('poor', pr(["Never had much, and gave away some of that.","Owned little, and shared even that.","Was poor in all but the giving of it."]));
  // mid-tier lives — broadly decent without peaking — get their own quiet lines.
  if(s.spirit>=52&&s.heart>=52&&s.means>=38 && !blocked('content')) return out('content', pr(["Held more than most, and seldom needed to say so.","Had enough, and knew it, which is rarer than plenty.","Lived well within the life {they} were handed."]));
  if(s.heart>=55&&s.means<45 && !blocked('generous')) return out('generous', pr(["Had little to spare, and spared it anyway.","Gave past what {they} could afford, and mentioned it to no one.","Was generous in the way only the un-rich manage."]));
  if(s.heart>=60 && !blocked('warm')) return out('warm', pr(["Easy to love, and not always easy to live with.","Loved well, and was a little hard to live beside.","Warm at the centre, and sharp at the odd edge."]));
  if(p.deathAge>=82) return out('long', pr(["Lived a long time, and left the rooms quieter for the leaving.","Outlasted nearly everyone, and was missed by the few still there.","Stayed a long while, and still left too soon for some."]));
  return out('ordinary', pr(["An ordinary life, which is to say, a whole world.","A quiet life, complete within its own small compass.","An unremarkable life, and entirely {their} own."]));
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
  {min:7,  name:"a house written into the histories", adj:"storied"},
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
  // wealth can lift a house as far as seat 6, but never PULLS a higher house down
  // (Math.max guards a storied seat-7 line from being demoted by a merely-rich heir).
  if(peak>=80) h.seat=Math.max(h.seat, Math.min(6,h.seat+ (peak>=92?2:1)));
  else if(peak>=58) h.seat=Math.max(h.seat, Math.min(6,h.seat+ (Math.random()<0.5?1:0)));   // climb slightly damped, so the top isn't a foregone conclusion
  else if(endMeans<14) h.seat=Math.max(0,h.seat- (endMeans<8?2:1));   // genuine hardship can still topple even a storied house
  // earned, choice-driven downward pressure: a reckoning the family failed to meet costs it a seat;
  // a genuinely broken life (ending both poor and in shadow) can pull a house down a step too.
  if(p.flags.facedReckoning==='fell') h.seat=Math.max(0,h.seat-1);
  else if(s.spirit<24 && endMeans<32 && h.seat>1 && Math.random()<0.5) h.seat=Math.max(1,h.seat-1);

  // --- reputation drifts with the defining qualities of the life ---
  const bump=(tag,n=1)=>{h.repute[tag]=(h.repute[tag]||0)+n;};
  const fade=()=>{for(const k in h.repute){h.repute[k]=Math.max(0,h.repute[k]-0.12);if(h.repute[k]<0.4)delete h.repute[k];}};
  fade(); // reputations soften over generations if not renewed
  // Crucial: an INHERITED soft-spot/book (injected into every heir's mem as {inherited:true})
  // must NOT keep re-scoring a reputation — only a life that ACTUALLY lived it counts. Without
  // this guard the stray heirloom silently forced 'kind' onto nearly every dynasty, collapsing
  // every house to the same motto. A reputation must be re-earned, not merely carried.
  const lived=k=>m[k] && !m[k].inherited;
  // Reputation is driven FIRST by what a life DID (choices/memories), and only lightly by a raw stat
  // as a fallback — so distinct play yields distinct houses, instead of every line drifting toward
  // whichever stat happened to run high (which collapsed all mottos to one).
  if(m.chose_study||m.became_teacher||lived('child_books')) bump('scholarly',1.2); else if(s.mind>80) bump('scholarly',0.6);
  if(lived('kept_stray')||p.flags.legacy==='kind'||m.let_in||m.looked_up) bump('kind',1.2); else if(s.heart>82) bump('kind',0.6);
  if(m.strayed&&!m.confessed) bump('tainted',1.3);
  if(m.cut_a_corner||m.chose_self_over_house||(s.means>82&&s.heart<40)) bump('ruthless',1.2);
  if(p.flags.legacy==='built'||m.self_made||m.built_the_name||m.driven) bump('industrious',1.1); else if(s.means>84) bump('industrious',0.6);
  if(m.kind_to_outcast) bump('generous',1.0);
  // the character paths the card set now writes — so a house can read as wild, creative, devout,
  // or hard-driving, not only learned or kind (this is what lets distinct dynasties crystallize
  // distinct mottos; with the inherited-heirloom guard above, these now actually win sometimes).
  if(m.lived_reckless||p.flags.peril) bump('reckless',1.2);
  if(m.early_talent||m.made_art) bump('artistic',1.2);
  if(m.found_faith||m.made_peace) bump('pious',1.2);

  // a family can also climb on a strong, sustained reputation — not only on wealth.
  // A scholarly or kind or hard-working line earns standing the modest can reach
  // (capped below the very top, which stays the province of fortune).
  const repTop=reputeTop(h);
  if(repTop && h.repute[repTop]>=2.0 && h.seat<5 && Math.random()<0.6) h.seat=Math.min(5,h.seat+1);

  // the very top — "a house written into the histories" — is not a status you reach
  // and keep; it must be RE-EARNED every generation. It needs a seat-6 house, a single
  // reputation held strong across many lives (repute >= 5), and a life that itself peaked
  // remarkably (peakMeans >= 86) — and even then only sometimes. If a later generation
  // fails to clear that bar, the house lapses back to "old and famous." This keeps the
  // pinnacle genuinely rare and makes the very top precarious rather than won-and-done.
  if(h.seat>=6 && repTop && h.repute[repTop]>=7.5 && p.peakMeans>=92 && Math.random()<0.25) h.seat=7;
  else if(h.seat===7) h.seat=6;

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
      tainted:"We do not speak of everything.",pious:"In time, all is weighed.",artistic:"We leave something beautiful behind.",
      reckless:"We burn bright, and we burn."};
    if(top&&MOTTOS[top]&&p.gen>=2) h.motto=MOTTOS[top];
  }
}

function recordAncestor(p){
  if(!S.house) S.house=initHouse();
  updateHouse(p);
  // Compute the epitaph exactly ONCE, here, while S.lineage still holds only prior
  // generations — so the look-back in epitaphFor() is correct. Everything downstream
  // (the eulogy screen, the chronicle, the constellation) reuses this stored string
  // instead of recomputing, which would see this very life already in the lineage and
  // drift to a different variant.
  p.epitaph = fmt(epitaphFor(p));
  S.lineage.push({
    given:p.given, surname:S.surname, gen:p.gen, sex:p.sex,
    born:p.bornYear, died:p.bornYear+p.deathAge, span:p.deathAge,
    epitaph:p.epitaph, cluster:p._epiCluster,
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
  document.getElementById('dEul').textContent='“'+(p.epitaph||fmt(epitaphFor(p)))+'”';
  // survivors
  const surv=p.rels.filter(r=>r.alive&&r.kind!=='ex');
  const kids=rels('child');
  let stext='';
  if(surv.length){
    stext='Survived by '+surv.map(r=>r.given).join(', ')+'.';
  } else stext='No one was left to grieve {them}.'.replace(/\{them\}/g,p.px.them);
  // a short life is framed as complete, not cut off — so an early death deepens the mood rather than punishing
  if(p.deathAge<45) stext = 'A short life — and, taken on its own terms, a whole one.  ' + stext;
  // when the line ends here, close with a tally of what the house became — the run's summary
  if(!kids.length){
    const mk=S.marks||{}, seat=seatOf((S.house&&S.house.seat)||0), rep=S.house?reputeTop(S.house):null;
    const gens=mk.gens||p.gen, souls=mk.souls||1;
    stext += '  House '+S.surname+' ends here — '+gens+' generation'+(gens>1?'s':'')+', '+souls+' live'+(souls>1?'s':'')+', risen to '+seat.name+(rep&&REPUTE_WORD[rep]?', and known as '+REPUTE_WORD[rep]:'')+'.';
  }
  document.getElementById('dSurv').textContent=fmt(stext);
  const btn=document.getElementById('dNext');
  if(kids.length){
    const heir=kids.slice().sort((a,b)=>b.age-a.age)[0];   // eldest — and the label must name the same child succession picks
    btn.textContent='Become '+heir.given;
    btn.onclick=()=>succeed(heir);
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
  const seatFloor=[0,6,14,26,40,56,72,72][h.seat]||0;   // seat 7 grants prestige, not extra wealth — same floor as 6, so the pinnacle can't self-perpetuate on money
  const inheritMeans = Math.max(seatFloor, Math.round(dead.peakMeans*0.55) - 6) - 6;
  const nurture = Math.round((dead.stats.mind-50)*0.18 + (childRel.bond-50)*0.10);
  // THE BEQUEST — what the dying deliberately set aside (e_bequest) becomes the heir's real
  // starting conditions. This is the player's lever across the generation boundary: a choice made
  // at the end of one life that visibly shapes the beginning of the next.
  const beq = dead.flags && dead.flags.bequest;
  let nurtureBeq=0, meansBeq=0, heartBeq=0, spiritBeq=0; const freeBeq = beq==='free';
  if(beq==='mind') nurtureBeq=10;
  else if(beq==='means') meansBeq=16;
  else if(beq==='heart'){ heartBeq=8; spiritBeq=6; }
  // the heir is BORN — startAge 0 — and lives the whole arc. Inheritance applies
  // as starting conditions (estate share, blended traits, the house's standing,
  // a parent's sharpening, and the bequest), not as a head start in years.
  const child=newPerson({
    given:childRel.given, sex:childRel.sex, gen:dead.gen+1,
    parentName:dead.name,
    seedStats: childRel.seed || seedChildStats(dead,null),
    traits: freeBeq ? rollTraits() : (childRel.traitsSeed || inheritTraits(dead.traits)),  // "their own freedom" — a nature wholly their own, not inherited
    startAge: 0,
    inheritMeans: Math.max(0,inheritMeans+meansBeq),
    nurture: nurture+nurtureBeq,
    bornYear: dead.bornYear + (dead.deathAge - childRel.age),
  });
  if(heartBeq) child.stats.heart = clamp(child.stats.heart+heartBeq);
  if(spiritBeq||freeBeq) child.stats.spirit = clamp(child.stats.spirit+(spiritBeq||5));
  child._bequest = beq;
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
  // The bloodline parent IS the life just lived. Seed its age from the real arithmetic — the
  // ancestor's age when this heir was born — and mark it a lineage echo that dies EXACTLY at the
  // age the Chronicle recorded (see ageRelations). That makes the echo born and gone in precisely
  // the years the lineage already holds, so an ancestor can never appear alive (and "frightened in
  // the small hours") years after their recorded death — the world and the Chronicle never disagree.
  const parentAgeAtBirth = Math.max(16, dead.deathAge - childRel.age);
  const echoParent = addRel(lineKind, dead.given, dead.sex, 74, parentAgeAtBirth);
  echoParent.given = dead.given; echoParent.name = dead.given;   // deliberately the ancestor — keep the name even though addRel now avoids lineage names
  echoParent.lineageEcho = true; echoParent.diesAtAge = dead.deathAge;
  if(beq==='heart') echoParent.bond = clamp(echoParent.bond+10);   // the warmth that was deliberately handed down
  // the heir's other parent gets a name not already worn by an ancestor, so the
  // chronicle never reads one given name in two unrelated roles down the generations
  const taken=new Set((S.lineage||[]).map(a=>a&&a.given)); taken.add(dead.given);
  let oNm=pick(otherSex==='m'?GIVEN_M:GIVEN_F), g=0;
  while(taken.has(oNm) && g++<20) oNm=pick(otherSex==='m'?GIVEN_M:GIVEN_F);
  addRel(otherKind, oNm, otherSex, 68, ri(22,34));
  // opening lines reflect being born a child of the house it has become
  const seat=seatOf(h.seat);
  const births=["Was born into "+seat.name+", and a family that already had a story.",
    "Was born where the last life ended — into "+seat.name+", and even that already partly spent.",
    "Came into the world already inside a story someone else had begun, with "+seat.name+" for an inheritance."];
  logLine(births[rotI(child, births.length)],"obs");
  if(h.motto) logLine("Raised on the family words: “"+h.motto+"”","obs");
  showHeir(child, dead, inheritMeans, nurture+nurtureBeq, h);
}
function showHeir(child, dead, inh, nur, h){
  document.getElementById('heirKick').textContent=ordinal(child.gen)+' of '+(h?'House '+S.surname:'the line');
  document.getElementById('heirName').textContent=child.name;
  const t=[];
  // make the identity hand-off explicit — a first-timer needs to know they BECOME the heir
  t.push(`You are no longer ${dead.given}. You are ${child.given}, ${dead.px.their} ${child.sex==='m'?'son':'daughter'} — born into the world ${dead.px.they} left behind.`);
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
  // the bequest — the one thing the last life set aside on purpose — stated plainly
  const BEQ_LINE={
    mind:'From '+dead.given+', deliberately: everything they knew — a mind with a running start.',
    means:'From '+dead.given+', deliberately: every coin they could spare — a softer place to begin.',
    heart:'From '+dead.given+', deliberately: the stories and the warmth — a fuller heart to start from.',
    free:'From '+dead.given+', deliberately: nothing but your own freedom — no weight, no debt, no map.'
  };
  if(child._bequest && BEQ_LINE[child._bequest]) lines.push(BEQ_LINE[child._bequest]);
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
