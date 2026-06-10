/* A LIFE — death & succession, and the house that accrues across the line. */
let RECENT_CLUSTERS=[];   // session-wide memory of recent epitaph THEMES, so a cluster can't dominate across dynasties
let USED_MOTTOS=[];       // mottos already crystallized this session, so two houses don't earn the identical words

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
  // block a THEME (cluster) that the last two ancestors already shared (per-dynasty) OR that has dominated
  // the last several deaths across the whole session — so e.g. the "teacher" or "kind" epitaph can't recur
  // every few dynasties just because its memory flag is easy to earn.
  const recentGC=(typeof RECENT_CLUSTERS!=='undefined')?RECENT_CLUSTERS:[];
  const blocked=k=>recentC.filter(c=>c===k).length>=2 || recentGC.slice(-9).filter(c=>c===k).length>=3;
  const out=(k,txt)=>{ p._epiCluster=k; return txt; };
  const pr=arr=>{ const opts=arr.map(sub);
    // avoid both the last two ancestors' exact lines (per-dynasty) AND anything used recently across the
    // whole session (RECENT_LINES) — a juror reads many lives in a row, and an epitaph repeating verbatim
    // across nearby dynasties is the single most visible staleness signal.
    const recentG=(typeof RECENT_LINES!=='undefined')?RECENT_LINES:[];
    let pool=opts.filter(o=>!recent.includes(o) && recentG.indexOf(o)<0);
    if(!pool.length) pool=opts.filter(o=>!recent.includes(o));
    if(!pool.length) pool=opts;
    const choice=pool[((p.gen-1+(typeof houseOff==='function'?houseOff():0))%pool.length+pool.length)%pool.length];
    if(typeof RECENT_LINES!=='undefined'){ RECENT_LINES.push(choice); if(RECENT_LINES.length>150) RECENT_LINES.shift(); }
    return choice; };
  const built=["Built something that outlasted the building of it.","Made something real, and the making was the life.","Left more behind than {they} took, and the difference is what remains.","Put something into the world that stayed there after {them}."];
  const kind=["Remembered, above all, as kind.","Remembered, most of all, for a steady kindness.","Kind in the small daily ways that turn out to be the large ones.","Left people gentler than {they} found them.","Carried a warmth into every room, and left it there."];
  // a defining memory or chosen legacy claims the epitaph (identity — always honored)
  if(m.kept_stray && !m.kept_stray.inherited && s.heart>60 && !m.turned_stray && !blocked('stray')) return out('stray', pr(["Loved small helpless things {their} whole life long.","Never could pass a hurt creature without stopping for it.","Left the world a little more tender than {they} found it.","Gave shelter to whatever could not fend for itself, all {their} days.","Kept a soft place, all {their} life, for whatever the world had thrown away.","Was the one the lost things found, and was never sorry to be found by them."]));
  if(m.became_teacher && !blocked('teacher')) return out('teacher', pr(["Gave away everything {they} knew, and so kept it.","Taught what {they} knew, and so outlived the knowing of it.","Spent a whole life handing on what {they} had learned.","Left {their} knowing in other heads, where it kept on being used.","Poured what {they} knew into the young, and so refused, quietly, to die all the way.","Made of {their} own mind a thing other people got to keep."]));
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

/* ---------- the world's ERA — the times a generation is born into ----------
   A light macro-layer so a long house lives through CHANGING times: a war, a hard
   winter, fat years, a turning age. Eras gate their own cards (cond:()=>S.era==='war')
   and colour the world a life opens in — so gen 8 is not gen 2 with new names. Most of
   life is the same human business; the era only tilts which rare moments can happen and
   how the world feels. The era drifts at each succession, so a house lives through history. */
const ERAS={
  settled:{lines:["These are settled years — the country quiet, the roads safe, the seasons turning as they should.","These are quiet years, as years go — no war worth the name, no plague at the door, the world minding itself.","The times are ordinary, which is to say kind: the harvests come, the roads hold, nothing large is on fire."]},
  war:    {lines:["There is a war on in these years. Far off, at first.","The country is at war in these years — distant, and then, the way it always comes, not distant at all.","These are war years. The drums are someone else's problem, until quite suddenly they are not."]},
  plague: {lines:["A sickness is moving through the country — slow, and close, and without much mercy.","There is a fever in the land these years — patient, and thorough, and no respecter of doors.","A plague walks the country in these years, taking its tithe house by house, in no particular hurry."]},
  plenty: {lines:["These are fat years — trade good, the granaries full, money loose and everywhere.","These are years of plenty — the markets fat, the purses loose, optimism cheap and on every corner.","The country is flush in these years — easy money, easy credit, everyone suddenly an expert on the good times."]},
  hard:   {lines:["These are lean years — thin harvests, long winters, every coin counted twice.","These are hard years — the harvests short, the winters cruel, every household doing sums it would rather not.","The country is pinched in these years — work scarce, bread dear, and a general tightening of belts and faces."]},
  turning:{lines:["The age itself is turning — new ideas, new machines, new gods, and the old certainties coming loose.","Something is shifting in the age — new machines, new notions, the old ways of doing things suddenly in question.","The world is changing under everyone's feet these years — new tools, new faiths, the ground of the ordinary moving."]},
};
const ERA_KEYS=Object.keys(ERAS);
// the next era: usually drifts back toward ordinary (most years are quiet), sometimes lurches into history.
function rollEra(prev){ if(chance(0.3)) return 'settled'; const o=ERA_KEYS.filter(k=>k!=='settled'&&k!==prev); return o[ri(0,o.length-1)]; }
function eraTone(k){ return (k==='war'||k==='plague'||k==='hard')?'loss':(k==='plenty'?'joy':'obs'); }
function eraPick(k){ const e=ERAS[k]; if(!e) return null; return (typeof freshPick==='function')?freshPick(e.lines,P):e.lines[0]; }
function setEra(key,announce){ if(typeof S==='undefined'||!S) return false; const changed=S.era!==key; S.era=key;
  if(announce && changed && ERAS[key] && typeof logLine==='function') logLine(eraPick(key), eraTone(key));
  return changed; }
function eraLine(){ return (typeof S!=='undefined'&&S&&S.era&&ERAS[S.era])?eraPick(S.era):null; }

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
// A number-free, in-voice reading of where the house's REPUTATION currently sits — so a player
// can see what character the family is building toward (and how close a motto is) without raw tallies.
function houseCharacter(h){
  if(!h||!h.repute) return 'The family has not yet become known for any one thing.';
  const e=Object.entries(h.repute).filter(([k,v])=>v>=0.5).sort((a,b)=>b[1]-a[1]);
  if(!e.length) return 'The family has not yet become known for any one thing.';
  const w=k=>REPUTE_WORD[k]||k;
  const [k0,v0]=e[0];
  let s;
  if(v0>=2) s='The family is known, by now, as '+w(k0)+' — settled enough that it has become the house’s character'+(h.motto?' (“'+h.motto+'”)':'')+'.';
  else if(v0>=1.2) s='The family is becoming known as '+w(k0)+' — one or two more lives of the same, and it could settle into the family’s words.';
  else s='A name for being '+w(k0)+' is only just beginning to gather.';
  if(e[1] && e[1][1]>=1) s+=' There is something of the '+w(e[1][0])+' in it too.';
  // a prose reading of how far the leading reputation has come toward the histories (the seat-7 gate
  // is the cumulative high-water mark h.repPeak >= 3.5) — so the climb has a legible trajectory, not just a goal
  if((h.seat||0)>=5 && (h.seat||0)<7){   // any leading reputation gets a trajectory reading — no silent gap when it's thin
    const rp=Math.max(v0, h.repPeak||0);
    const tier = rp>=3.5 ? 'is deep enough now for the histories — it wants the house raised to its summit seat and an heir whose fortune reaches its full height'
               : rp>=2.5 ? 'has lasted — a little more of the same, and the house raised to the summit, and it could be written into the histories'
               : rp>=1.7 ? 'has real weight behind it now, though the histories would ask for a good deal more of it yet'
               : 'has barely begun to settle — it would take several more lives of the same before the histories took any notice';
    s+=' As a name, it '+tier+'.';
  }
  return s;
}

// A short, diegetic list of what the house has NOT yet reached — so the player has something concrete to
// chase across lives ("still ahead: a name written into the histories") instead of only witnessing. Drives
// the heir screen and the "how things stand" readout; never a number, always a thing wanted.
function houseAspirations(h, marks){
  if(!h) return [];
  const g=(marks&&marks.gens)||1, longest=(marks&&marks.longest)||0, asp=[];
  const seat=h.seat||0;
  if(seat<3) asp.push('a household of its own to keep');
  else if(seat<5) asp.push('a house of real standing');
  else if(seat<6) asp.push('an old and famous name');
  else if(seat<7) asp.push('a place in the histories — the summit a name can reach');
  if(!h.motto) asp.push('words the family can live by');
  if(!(h.heirlooms&&h.heirlooms.length)) asp.push('something worth handing down');
  if(g<4) asp.push('a line that reaches a fourth generation');
  else if(g<6) asp.push('a line six generations deep');
  if(longest<80) asp.push('a life that passes eighty');
  if(!h.secret && !asp.length) asp.push('to keep what it has built, and not slip');
  return asp;
}
// called at death: fold this life's character into the house
function updateHouse(p){
  const h=S.house;
  const s=p.stats, m=p.mem||{};
  const seatBefore=h.seat;   // so a rise or a fall can be NAMED in the life that caused it (not just discovered later)
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
  // slow decline: a life that ends far poorer than it once stood — the house living beyond its means
  else if(peak-endMeans>=40 && endMeans<35 && h.seat>1 && Math.random()<0.4) h.seat=Math.max(1,h.seat-1);

  // --- reputation drifts with the defining qualities of the life ---
  const bump=(tag,n=1)=>{h.repute[tag]=(h.repute[tag]||0)+n;};
  const fade=()=>{for(const k in h.repute){h.repute[k]=Math.max(0,h.repute[k]-0.09);if(h.repute[k]<0.4)delete h.repute[k];}};  // gentle, so a focused line isn't quietly erased between lives
  fade(); // reputations soften over generations if not renewed
  // Crucial: an INHERITED soft-spot/book (injected into every heir's mem as {inherited:true})
  // must NOT keep re-scoring a reputation — only a life that ACTUALLY lived it counts. Without
  // this guard the stray heirloom silently forced 'kind' onto nearly every dynasty, collapsing
  // every house to the same motto. A reputation must be re-earned, not merely carried.
  const lived=k=>m[k] && !m[k].inherited;
  // Reputation is driven FIRST by what a life DID (choices/memories), and only lightly by a raw stat
  // as a fallback — so distinct play yields distinct houses, instead of every line drifting toward
  // whichever stat happened to run high (which collapsed all mottos to one).
  // Balanced so no single tag has many more inputs than the others — otherwise every house drifts to
  // whichever reputation has the most paths (it was 'kind'). 'kind' now means only the genuinely
  // kind-DEFINING acts; broad warmth-to-others reads as 'generous' (its own motto).
  if(m.chose_study||m.became_teacher||m.set_scholar_rep||lived('child_books')) bump('scholarly',1.0); else if(s.mind>82) bump('scholarly',0.5);
  if(lived('kept_stray')||p.flags.legacy==='kind') bump('kind',1.2);
  if(m.strayed&&!m.confessed) bump('tainted',1.3);
  if(m.cut_a_corner||m.chose_self_over_house||(s.means>82&&s.heart<40)) bump('ruthless',1.2);
  if(p.flags.legacy==='built'||m.self_made||m.built_the_name||m.driven) bump('industrious',1.0); else if(s.means>88) bump('industrious',0.5);
  if(m.kind_to_outcast||m.chose_others||m.let_in) bump('generous',1.1);
  if(m.lived_reckless||p.flags.peril) bump('reckless',1.2);
  if(m.early_talent||m.made_art) bump('artistic',1.2);
  if(m.found_faith||m.made_peace||m.looked_up) bump('pious',1.1);

  // a family can also climb on a strong, sustained reputation — not only on wealth.
  // A scholarly or kind or hard-working line earns standing the modest can reach
  // (capped below the very top, which stays the province of fortune).
  const repTop=reputeTop(h);
  if(repTop && h.repute[repTop]>=2.0 && h.seat<5 && Math.random()<0.6) h.seat=Math.min(5,h.seat+1);

  // the very top — "a house written into the histories" — is not a status you reach
  // and keep; it must be RE-EARNED every generation. It needs a seat-6 house, a single
  // reputation built strong across many lives (high-water mark repPeak >= 3.5), and a life
  // that itself peaked well (peakMeans >= 76) — and even then only sometimes. If a later generation
  // fails to clear that bar, the house lapses back to "old and famous." This keeps the
  // pinnacle genuinely rare and makes the very top precarious rather than won-and-done.
  // track the high-water mark of the leading reputation, so the pinnacle rewards a line that BUILT
  // a strong name even if it has softened a little since — not only the current (post-fade) value
  if(repTop) h.repPeak=Math.max(h.repPeak||0, h.repute[repTop]);
  if(h.seat>=6 && (h.repPeak||0)>=3.5 && p.peakMeans>=76 && Math.random()<0.45) h.seat=7;   // reachable through a focused run, still re-earned each generation
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
  if((m.cut_a_corner||m.chose_self_over_house) && s.means>68 && !h.heirlooms.some(x=>x.tag==='hardname'))
    h.heirlooms.push({tag:'hardname',name:"a name that opens doors by being feared",from:p.given,gen:p.gen});

  // --- secret: a strayed-and-unconfessed life buries one for descendants to inherit ---
  if(m.strayed && !m.confessed && !h.secret)
    h.secret={text:p.given+" did something to "+p.px.their+" marriage that the family still does not speak of",from:p.given,gen:p.gen,known:false};
  // a confession lays an existing secret to rest
  if(m.confessed && h.secret) h.secret=null;

  // --- motto crystallizes once the house has a clear character (a slightly lower bar than reputeTop,
  // so a focused 3-4 generation line reliably earns its words rather than ending without any) ---
  if(!h.motto){
    const me=Object.entries(h.repute||{}).filter(([k,v])=>v>=1.5).sort((a,b)=>b[1]-a[1]);
    const top=me.length?me[0][0]:null;
    // each reputation now has several possible words, picked fresh across the session, so two scholarly (or
    // reckless) houses don't crystallize the identical motto — the family words were a juror's favourite
    // dynasty artefact, and seeing one repeat verbatim broke the sense that each house is its own story.
    const MOTTOS={
      scholarly:["What the mind holds cannot be taken.","A book outlasts the hand that closed it.","We keep what we have learned."],
      kind:["We take in what the world turns out.","No one is turned from this door.","The world is hard enough; we are not."],
      ruthless:["We do not ask twice.","We are owed, and we collect.","We decline the luxury of sentiment."],
      industrious:["By our own hands.","Nothing was given; all was built.","We earn the bread we eat."],
      generous:["An open door, an open hand.","What we have, we share.","We give past what we can spare."],
      tainted:["We do not speak of everything.","Some doors stay shut.","The family keeps its silences."],
      pious:["In time, all is weighed.","We answer to a longer ledger.","The quiet ones are listening."],
      artistic:["We leave something beautiful behind.","We make, and so remain.","Beauty is the only argument we trust."],
      reckless:["We burn bright, and we burn.","Better a short blaze than a long smoke.","We do not save ourselves for later."]};
    let marr=MOTTOS[top];
    if(top&&marr&&p.gen>=2){
      // prefer a motto not already worn by another house this session, so two dynasties don't crystallize
      // the identical words; only when every variant for this character is taken do we let one repeat.
      const fresh=marr.filter(m=>USED_MOTTOS.indexOf(m)<0); if(fresh.length) marr=fresh;
      h.motto=(typeof freshPick==='function')?freshPick(marr,p):marr[0];
      USED_MOTTOS.push(h.motto); if(USED_MOTTOS.length>40) USED_MOTTOS.shift();
      logLine("The family's character has settled, at last, into words: “"+h.motto+"”","joy"); }   // name the milestone in the life that earned it
  }

  // name the change in standing within the very life that caused it, so the player feels the
  // dynasty rise and fall in the moment rather than only inferring it later from the heir screen.
  if(p.gen>=2 && h.seat!==seatBefore){
    const sn=seatOf(h.seat).name;
    logLine(h.seat>seatBefore
      ? freshPick(["The family climbed in the world this generation — the house now keeps "+sn+".","The house rose a step this life — it holds "+sn+" now, and the name with it.","This generation lifted the family — "+sn+", where before there was less.","The standing went up this generation; the house keeps "+sn+" now."],p)
      : freshPick(["The family's standing slipped this generation — the house holds "+sn+" now.","The house lost ground this life — down to "+sn+", and the name a little lighter for it.","This generation cost the family a step — "+sn+" now, where there had been more.","The standing fell this generation; the house holds only "+sn+" now."],p),
      h.seat>seatBefore?"joy":"loss");
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
  if(p._epiCluster){ RECENT_CLUSTERS.push(p._epiCluster); if(RECENT_CLUSTERS.length>14) RECENT_CLUSTERS.shift(); }
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
// When a life ends without a DIRECT child, an established house can still pass sideways — to a niece,
// nephew, or cousin raised on the same name and stories. This is the structural lever that lets solitary
// and childless lives be a COMMON, real life-shape (the jury's standing complaint was that every life
// converged on love -> marry -> child, because a childless line otherwise just ended) WITHOUT collapsing
// the dynasty. A first-generation house with no standing and no kin genuinely ends; an established one,
// or one where the life had a sibling, carries on through the wider family.
function collateralAvailable(p){
  if(typeof S==='undefined'||!S||!p) return false;
  // A gen-1 founder used to be "established" (eligible for a collateral heir) only with a sibling or some
  // standing — so a childless founder usually ENDED the house at gen 1. That left ~9 of 15 dynasties single-
  // generation in a long read, which starves the whole dynasty layer (seat/motto/dyn_* content a strategist
  // wants never fires). A founder plausibly has extended kin off-screen, so give them a real chance to pass
  // the name sideways too — keeping the non-domestic life-shape intact while letting more lines reach depth.
  const established = (p.gen>=2) || ((S.house&&S.house.seat||0)>=2) || (P.rels&&P.rels.some(r=>r.kind==='sibling')) || chance(0.42);
  // reliable enough that a childless life is usually NOT the end of the house, but not guaranteed —
  // so a line still genuinely ends now and then (keeping the "raise another house" rhythm and the
  // cross-run collection meaningful), and a higher-standing house, with more kin, holds on better.
  const odds = 0.5 + ((S.house&&S.house.seat||0)>=3 ? 0.15 : 0) + ((p.gen>=3)?0.05:0);
  return established && chance(odds);
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
  // no DIRECT heir: an established house passes sideways (collateral); a young, standing-less, kin-less one ends.
  const coll = !kids.length && collateralAvailable(p);
  if(!kids.length && !coll){
    const mk=S.marks||{}, seat=seatOf((S.house&&S.house.seat)||0), rep=S.house?reputeTop(S.house):null;
    const gens=mk.gens||p.gen, souls=mk.souls||1;
    stext += '  House '+S.surname+' ends here — '+gens+' generation'+(gens>1?'s':'')+', '+souls+' live'+(souls>1?'s':'')+', risen to '+seat.name+(rep&&REPUTE_WORD[rep]?', and known as '+REPUTE_WORD[rep]:'')+'.';
  } else if(coll){
    stext += '  No child of '+p.px.their+' own — but the house does not end with '+p.px.them+': the name passes sideways, to one of the wider family, raised on the same stories.';
  }
  document.getElementById('dSurv').textContent=fmt(stext);
  const btn=document.getElementById('dNext');
  if(kids.length){
    const heir=kids.slice().sort((a,b)=>b.age-a.age)[0];   // eldest — and the label must name the same child succession picks
    btn.textContent='Become '+heir.given;
    btn.onclick=()=>succeed(heir);
  } else if(coll){
    const sex=chance(0.5)?'m':'f';
    const taken=new Set((S.lineage||[]).map(a=>a&&a.given)); taken.add(p.given);
    let nm=pick(sex==='m'?GIVEN_M:GIVEN_F),g=0; while(taken.has(nm)&&g++<20) nm=pick(sex==='m'?GIVEN_M:GIVEN_F);
    btn.textContent='Become '+nm+' — the line goes sideways';
    btn.onclick=()=>succeed({given:nm,sex,age:0,bond:50,collateral:true}, true);
  } else {
    btn.textContent='The line ends. Begin anew.';
    btn.onclick=()=>{ S.lineage[S.lineage.length-1].extinct=true; beginNewLine(); };
  }
  document.getElementById('vDeath').classList.add('show');
}
function ordinal(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}

function succeed(childRel, isCollateral){
  document.getElementById('vDeath').classList.remove('show');
  const dead=P;
  const h=S.house||initHouse();
  // estate passes with entropy — but the family SEAT sets a floor, so a great house
  // cushions a poor heir and a fallen house gives even a rich parent's child less. A COLLATERAL heir
  // (a niece/nephew/cousin) inherits the name and the house's STANDING, but far less of the personal
  // fortune — the wider family carries the seat, not the dead's private estate.
  const seatFloor=[0,6,14,26,40,56,72,72][h.seat]||0;   // seat 7 grants prestige, not extra wealth — same floor as 6, so the pinnacle can't self-perpetuate on money
  const inheritMeans = Math.max(seatFloor, Math.round(dead.peakMeans*(isCollateral?0.30:0.55)) - 6) - 6;
  const nurture = isCollateral ? Math.round((dead.stats.mind-50)*0.05) : Math.round((dead.stats.mind-50)*0.18 + (childRel.bond-50)*0.10);
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
    traits: freeBeq ? rollTraits() : (isCollateral ? (chance(0.5)?rollTraits():inheritTraits(dead.traits)) : (childRel.traitsSeed || inheritTraits(dead.traits))),  // "their own freedom" / a collateral cousin shares less blood — looser inheritance
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
  if(!isCollateral){
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
  } else {
    // a COLLATERAL heir has their own living parents (seeded fresh, like a founder); the dead is a
    // deceased elder of the wider family — an aunt or uncle whose name and house the heir takes up.
    seedParents(child);
    const k=addRel(dead.sex==='m'?'uncle':'aunt', dead.given, dead.sex, 56, Math.max(20, dead.deathAge));
    k.given=dead.given; k.name=dead.given; k.alive=false;   // already gone — a remembered elder, not a living echo
  }
  // the world turns between generations — the heir may be born into a changed age. The era line is
  // announced ONLY when it changes (not re-stated at every birth, which made "there is a war" recur every
  // generation) — so a shift in the times reads as news, and a steady era stays quietly in the background.
  const eraChanged = chance(0.45) ? setEra(rollEra(S.era), false) : false;
  // opening lines reflect being born a child of the house it has become
  const seat=seatOf(h.seat);
  const sn=seat.name;
  const births = isCollateral ? [
    "Was born off to the side of the main line — into "+sn+", and a name that would, by an accident of who outlived whom, come to rest on "+dead.px.them+".",
    "Was born a cousin to the line that mattered, into "+sn+" — not the heir anyone expected, and the one the house got.",
    "Came up in the wider family, into "+sn+", on stories of an aunt or uncle "+dead.px.they+" would grow up to replace.",
    "Was born collateral to the house — into "+sn+", and a surname that would need "+dead.px.them+" sooner than anyone planned."]
   : ["Was born into "+sn+", and a family that already had a story.",
    "Was born where the last life ended — into "+sn+", and even that already partly spent.",
    "Came into the world already inside a story someone else had begun, with "+sn+" for an inheritance.",
    "Was born to "+sn+" and a surname with some weight already on it.",
    "Arrived into "+sn+", and a house that had been keeping its accounts long before {them}.",
    "Was born partway through the family's story — into "+sn+", and whatever the last life had left of it."];
  logLine(freshPick(births,child),"obs");
  if(eraChanged && eraLine()) logLine(eraLine(), eraTone(S.era));   // only when the age itself has turned
  if(h.motto) logLine("Raised on the family words: “"+h.motto+"”","obs");
  showHeir(child, dead, inheritMeans, nurture+nurtureBeq, h, isCollateral);
}
function showHeir(child, dead, inh, nur, h, isCollateral){
  document.getElementById('heirKick').textContent=ordinal(child.gen)+' of '+(h?'House '+S.surname:'the line');
  document.getElementById('heirName').textContent=child.name;
  const t=[];
  // make the identity hand-off explicit — a first-timer needs to know they BECOME the heir
  t.push(isCollateral
    ? `You are no longer ${dead.given}. You are ${child.given} — of the wider family, raised on ${dead.px.their} stories, and the one the name came to rest on when ${dead.px.they} left no child.`
    : `You are no longer ${dead.given}. You are ${child.given}, ${dead.px.their} ${child.sex==='m'?'son':'daughter'} — born into the world ${dead.px.they} left behind.`);
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
    lines.push(houseCharacter(h));   // the family's character so far — what the next life inherits and can build on
    for(const hl of (h.heirlooms||[])) lines.push('Inherits '+hl.name+' (from '+hl.from+').');
    if(h.secret && !h.secret.known) lines.push('And inherits a silence: '+h.secret.text+'.');
    const asp=houseAspirations(h, S.marks);   // something concrete for this life to reach toward
    if(asp.length) lines.push('Still ahead for the house: '+asp.slice(0,2).join(', and ')+'.');
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
  if(S&&S.era&&S.era!=='settled'&&eraLine()) logLine(eraLine(), eraTone(S.era));   // born into a world already in motion
  // a gentle one-time orientation for a first-ever player (non-persisted; fades)
  if(window.hintOnce) setTimeout(()=>{ if(P&&P.alive) hintOnce('seenIntro',"The years move on their own — pause any time with the ▮▮ below. Now and then, a moment will ask something of you."); },1600);
  running=true; busy=false;
}

function beginNewLine(){
  // the line that just ended joins the quiet collection of houses you've raised (title screen)
  if(typeof recordHouseLegacy==='function' && typeof S!=='undefined' && S && S.lineage && S.lineage.length) recordHouseLegacy(S);
  document.getElementById('vDeath').classList.remove('show');
  document.getElementById('vHeir').classList.remove('show');
  S.surname=pick(SURNAMES);
  S.house=initHouse();
  S.seenDyn={};                                              // the new house has seen none of the "once-per-dynasty" beats yet
  setEra(chance(0.55)?'settled':rollEra(null), false);       // the world this house is founded into (announced at the first birth)
  const f=makeFounder(1);
  startLife(f);
  renderAll(); scheduleTick(); save();
}
