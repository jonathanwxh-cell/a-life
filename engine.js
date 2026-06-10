/* ============================================================
   ENGINE
   ============================================================ */
function haveChild(){
  const sex=chance(0.5)?'m':'f';
  const given=pick(sex==='m'?GIVEN_M:GIVEN_F);
  const c=addRel('child',given,sex,72,0);
  // seed the child's nature now (genetics + regression), store for heir handoff
  const partner=rel('spouse')||rel('love');
  // the other parent carries a hidden nature too, so a child genuinely blends two
  // lines before regressing toward the mean. Seeded lazily (covers older saves).
  if(partner){
    if(!partner.seedStats) partner.seedStats={vit:ri(50,72),mind:ri(40,68),heart:ri(45,72),means:ri(20,45),spirit:ri(48,70)};
    if(!partner.traitsSeed) partner.traitsSeed=rollTraits();
  }
  c.seed=seedChildStats(P, partner);
  c.traitsSeed=inheritTraits([...P.traits, ...(partner&&partner.traitsSeed?partner.traitsSeed:[])]);
  const cn=c.given;   // addRel may have re-picked the name to avoid a collision — use the real one
  P.childrenIds.push(cn);
  const kn=P.childrenIds.length;
  const lateBirth = P.age>40;
  const base=[
    "Had a child, "+cn+". The world rearranged itself around a small weight.",
    "Had a child, "+cn+". Was sure of nothing, that first night, except that it had happened.",
    "Had a child, "+cn+", and the whole shape of the days changed to make room.",
    "Had a child, "+cn+" — and discovered a fear {they} had not known {they} owned.",
    "Had a child, "+cn+". Some door {they} hadn't known was shut came quietly open.",
    "Had a child, "+cn+", and began, that night, keeping a different kind of time.",
    "Had a child, "+cn+". Was asleep on {their} feet for a month, and had never once been so awake.",
    "Had a child, "+cn+", and did not know, until that night, quite what {they} had been waiting for."];
  const latePool=[
    "Had a child late, "+cn+", and felt the lateness itself as a kind of luck.",
    "Had a child, "+cn+", at an age {they} had stopped expecting it — and was the more undone.",
    "Had a child, "+cn+", well past when {they} had thought that particular door had closed.",
    "Had a child, "+cn+", later than most — and met the small fierce fact of {them} without a single regret.",
    "Had a child, "+cn+", when {they} had made a quiet peace with not — and unmade it gladly, overnight.",
    "Had a child, "+cn+", late enough that {they} had stopped counting on it, and counted it twice the gift.",
    "Had a child, "+cn+", in the back half of a life, and found the lateness changed nothing the child asked of {them}."];
  // 'red and furious' is a good line — fold it into the base pool so freshPick dedups it across the whole
  // SESSION (the old S._usedFurious flag reset every new dynasty, so it recurred in nearly every house).
  if(!lateBirth) base.push("Had a child, "+cn+" — red and furious and entirely unimpressed by any of it.");
  const firstLine = lateBirth ? freshPick(latePool,P) : freshPick(base,P);
  logLine(kn>=3 ? "Had another child, "+cn+". By now {they} knew the shape of it, and was no less moved."
        : kn===2 ? "Had a second child, "+cn+". The house made room again, more easily this time."
        : firstLine, "joy");
}
function seedChildStats(parent, partner){
  const mean=50;
  const blend=k=>{
    const base = partner ? (parent.stats[k]+ (partner.seedStats?partner.seedStats[k]:parent.stats[k]))/2 : parent.stats[k];
    const regressed = base + (mean-base)*0.35;       // regression to the mean
    return clamp(Math.round(regressed + rnd(-9,9))); // mutation
  };
  return {vit:blend('vit'),mind:blend('mind'),heart:blend('heart'),means:ri(15,35),spirit:blend('spirit')};
}

function observe(){
  const s=P.stats, a=P.age;
  // each line fires at most once per life; the pools are deep so that across a long dynasty the
  // same observation rarely lands twice — the ambient prose is the game's primary texture.
  const ob=(key,cond,pool,cls)=>{ if(!firedObs[key]&&cond){firedObs[key]=1;logLine(Array.isArray(pool)?freshPick(pool,P):pool,cls||'obs');} };
  if(a>40) ob('vit_tire',s.vit<35,["The stairs have started to ask a question of {them}.","The body has begun keeping its own quiet counsel.","{Their} legs know something the rest of {them} is not yet ready to hear.","Mornings take longer to arrive in the body than they once did.","{They} has started to plan the day around what the body will permit.","The body has begun sending its small bills, and expecting them paid.","Some mornings the body answers the bell late, and grumbling.","{They} has started taking the stairs the way one takes a difficult conversation.","The weather has begun living in {their} joints, and forecasting badly.","{They} no longer trusts the body to do, unasked, what it always used to."]);
  if(a>55) ob('vit_neg',s.vit<18,["{Their} body has become a small daily negotiation.","Each day now asks a little more of {them} than the last one did.","The body keeps its own ledger now, and the sums are getting harder.","Getting up has become the first real work of every day.","The body has stopped being something {they} has, and become something {they} tends.","{They} has grown courteous with {their} own body, the way one is with the powerful.","The body sets the day's terms now, and {they} has learned to accept them.","{They} negotiates with the body each morning, and loses a little more of each round.","What the body will allow has become the shape the day is poured into."]);
  ob('mind_hi',s.mind>78&&a>20,["Books have become a country {they} can live in.","The mind has become a room {they} can close the door of.","Reading has stopped being something {they} does, and has become somewhere {they} goes.","{They} has grown used to being the most interested person in the room.","Thinking has become {their} favourite weather.","There is a whole life {they} keeps behind the eyes, and visits often.","{They} has furnished, behind the eyes, a country no one else can quite get into.","An idea, in {them}, is a place to go and not come back from for hours.","{They} has learned to be alone without being lonely, which the mind makes possible.","Curiosity has worn {them} a set of grooves the years keep deepening."]);
  ob('means_lo',s.means<14,["The end of the month keeps arriving before the money does.","{They} has learned exactly how far a single coin can be made to stretch.","There is an arithmetic to being poor, and {they} knows it by heart.","Want has become a quiet, constant houseguest.","{They} counts things now that {they} once never had to count.","Money, or the lack of it, has become the quiet hum under every plan {they} makes.","{They} has the poor person's exact knowledge of what everything costs.","There is a particular tiredness to never quite having enough, and {they} wears it.","Doing without has become less a hardship than a habit, worn smooth."]);
  ob('means_hi',s.means>82,["Money has stopped being a worry and become a kind of weather.","{They} has reached the strange country where money is no longer the question.","The old fear of not-enough has quietly left the house.","{They} no longer does the small arithmetic {they} once did at every till.","Means have stopped being a wall and become a wide, quiet field.","{They} has enough now that enough is no longer quite the word for it.","{They} has crossed into the quiet country where the bills simply get paid.","The having of money has become as unremarkable to {them} as the lacking of it once was unrelenting.","{They} has, at last, the particular freedom of not having to think about it."]);
  ob('spirit_lo',s.spirit<22,["A greyness has moved quietly into {their} rooms.","Something has gone flat in the colour of the days.","{They} carries a weather {they} cannot quite step out of.","The light comes in the same as ever, and lands differently now.","A low tide has come into {them}, and stayed well past its hour.","The days have lost some colour they used to have, and {they} cannot say quite when.","Something heavy has taken up residence in {them}, and pays no rent, and will not leave.","{They} moves through the days now as through deep water, slower than the world around {them}."]);
  ob('spirit_hi',s.spirit>88&&a>30,["{They} still laughs like someone the years have not yet learned how to reach.","The decades have arranged themselves around {them} and somehow never sat down.","Somewhere in {them} a window the years usually close has stayed open.","Whatever the years took, they did not take the lightness in {them}.","{They} has kept, against most of the evidence, a stubborn appetite for the days.","Time has not yet managed to talk {them} out of being glad.","{They} wears the years lightly, the way some people wear a coat they like.","There is a brightness in {them} the hard seasons kept failing to put out.","{They} has stayed, somehow, on speaking terms with joy.","The world has handed {them} the usual griefs, and {they} has gone on being glad anyway."]);
  ob('heart_lo',s.heart<20,["{They} has grown hard to reach, even for {them}self.","Something in {them} has closed a door and mislaid the key.","{They} keeps everyone now at the same careful distance.","Tenderness has become a language {they} no longer speaks with ease.","{They} has walled off the soft rooms, and rarely goes in.","The warmth in {them} has banked itself low, and {they} tends it for no one.","{They} has become, by long practice, difficult to let in.","Something in {them} flinches now from the very closeness it once needed."]);
}

function beingLine(){
  const s=P.stats,a=P.age;
  const parts=[];
  if(a<13) parts.push("a child, still soft at the edges");
  else if(a<26) parts.push(s.spirit>60?"young and mostly unafraid":"young, and already weighing things");
  else if(a<46) parts.push(s.means>60?"settled, with something to lose":"in the thick of it");
  else if(a<66) parts.push(s.vit>55?"weathered but holding":"feeling the turn of the tide");
  else parts.push(s.vit>40?"old, and not done yet":"old, and tired, and tender");
  // once a few choices are in, the aura colours the description — built from the first decision onward
  const au=P.aura;
  if(au && au.turns>=2){
    const w=au.warmth, l=au.light;
    let tone=null;
    if(w>7&&l>4) tone="and growing warm-hearted";
    else if(w>7) tone="and tender with others";
    else if(w<-7&&l<-4) tone="and turning hard and shadowed";
    else if(w<-7) tone="and growing guarded";
    else if(l>7) tone="and lit from within";
    else if(l<-7) tone="and carrying a quiet weight";
    if(tone) parts.push(tone);
  }
  return parts.join(", ")+".";
}

/* yearly drift */
function driftYear(){
  const s=P.stats,a=P.age,T=P.traits;
  // age erodes vitality
  if(a>45) s.vit=clamp(s.vit - (a-45)*0.06 - 0.2);
  if(a<25) s.vit=clamp(s.vit + 0.3);
  if(T.includes('frail')) s.vit=clamp(s.vit-0.4);
  if(T.includes('bookish')) s.mind=clamp(s.mind+0.3);
  if(T.includes('restless')) s.spirit=clamp(s.spirit-0.15);
  if(T.includes('warm')||T.includes('tender')) s.heart=clamp(s.heart+0.2);
  // means quietly compounds with itself (and habits)
  if(s.means>50) s.means=clamp(s.means+0.4);
  if(s.means<25) s.means=clamp(s.means-0.2);
  // spirit drifts toward the company you keep
  const avgBond = P.rels.filter(r=>r.alive).reduce((x,r)=>x+r.bond,0)/Math.max(1,P.rels.filter(r=>r.alive).length);
  s.spirit=clamp(s.spirit + (avgBond>55?0.3:-0.25));
  if(s.means>P.peakMeans)P.peakMeans=s.means;
}

/* relationships age, bonds decay, people die */
function ageRelations(){
  for(const r of P.rels){
    if(!r.alive) continue;
    r.age++;
    r.bond=clamp(r.bond-0.4); // quiet decay without tending
    // the bloodline echo-parent (the previous life) dies exactly at the age the Chronicle recorded
    // — never by the random elder roll — so the lineage and the living world stay consistent.
    if(r.lineageEcho && r.diesAtAge){
      if(r.age>=r.diesAtAge){ r.alive=false; logLine("Lost "+(r.kind==='mother'?'{their} mother':'{their} father')+", "+r.given+".","loss"); }
      continue;
    }
    // elder relations may die
    if(r.age>62){
      let p=Math.max(0,(r.age-62)/650);
      if(r.age>92) p=Math.max(p,0.22);   // centenarians are rare — a lineage parent shouldn't implausibly outlive the heir
      if(chance(p)){
        r.alive=false;
        const term=r.kind==='mother'?'{their} mother':r.kind==='father'?'{their} father':
          r.kind==='spouse'?'{their} '+r.px.spouse:r.kind==='friend'?'an old friend, '+r.given:
          r.kind==='mentor'?'a mentor, '+r.given:r.kind==='sibling'?'{their} '+(r.sex==='m'?'brother':'sister'):
          r.kind==='love'?'someone {they} once loved, '+r.given:r.given;
        logLine("Lost "+term+".","loss");
      }
    }
  }
}

/* death check */
// rare early mortality: a small, vitality-modulated baseline before 55 so some
// lives end before their season (a fever, a fall, a foolish risk). Tuned so
// ~8–12% of lives end before 55. A recent reckless choice raises the odds for a
// short while via P.flags.peril (the age at which the elevated risk lifts).
const EARLY_MORTALITY=0.0024, PERIL_MULT=2.2;
function deathRoll(){
  const a=P.age, v=P.stats.vit;
  let p=0;
  if(a>55) p+=(a-55)/620;
  if(a>72) p+=(a-72)/240;
  if(a>85) p+=(a-85)/80;
  p*=(1.7 - v/100);
  if(P.traits.includes('frail')) p*=1.3;
  // baseline begins at 6 — infancy is survived, so no life ends before a single choice
  if(a>=6 && a<55) p += EARLY_MORTALITY*(1.5 - v/100);
  if(P.flags.peril && a < P.flags.peril) p *= PERIL_MULT;
  return chance(p) || (v<=2 && a>40 && chance(0.4));
}

/* ---------- main tick ---------- */
let timer=null;
let fastFwd=false;   // the player can let the quiet years race by (tap the flow text); a moment still pauses it
function scheduleTick(){
  clearTimeout(timer);
  if(!running||busy) return;
  timer=setTimeout(()=>{ tick(); scheduleTick(); }, fastFwd?Math.round(RATE*0.34):RATE);
}
function tick(){
  if(busy) return;
  P.age++;
  P.sinceCard++;
  driftYear();
  ageRelations();
  observe();
  renderPassing();
  // death
  if(deathRoll()){ die(); return; }
  // event probability rises the longer it's been quiet (quiet, then weight)
  // quiet, then weight: a hard floor of silent years, then a steep ramp
  if(P.sinceCard < 2){ save(); return; }            // never two moments back-to-back
  const base=(P.age<13?0.11:0.07), ramp=Math.min(0.6, Math.pow(Math.max(0,P.sinceCard-2),1.5)*0.045);
  if(chance(base+ramp)) drawCard();
  // otherwise, on a long-quiet year, a rare ambient whisper — weather, not event — to fill the
  // silence the cozy/contemplative read asks for (ephemeral; never written to the chronicle).
  else if(P.sinceCard>=4 && window.AL_ambient && chance(0.14)) window.AL_ambient();
  save();
}

/* ---------- card drawing ---------- */
function eligible(){
  const stage=stageOf(P.age);
  return CARDS.filter(c=>{
    // age band, when present, replaces the broad stage check (cards can span stages)
    if(c.age){ if(P.age<c.age[0]||P.age>c.age[1]) return false; }
    else if(c.stage!=='*'&&c.stage!==stage) return false;
    if(c.once && P.flags['card_'+c.id]) return false;
    // once-per-DYNASTY, as a GENERATIONAL cooldown (not a permanent burn): a "special"/milestone beat
    // rotates out for the next few generations after it fires, so it stops being part of every single
    // life's template — but it can return in a LATER generation, so a long house doesn't run its heirs
    // on thin filler once every milestone has fired once. Default 3 generations; `onceDyn:N` overrides.
    if(c.onceDyn && typeof S!=='undefined' && S && S.seenDyn && S.seenDyn[c.id]!=null && (P.gen - S.seenDyn[c.id]) < (c.onceDyn===true?3:c.onceDyn)) return false;
    // no-repeat cooldown: a non-`once` card can't redraw within ~10 years (or c.cool)
    if(!c.once && P.drewAt && P.drewAt[c.id]!=null && P.age-P.drewAt[c.id] < (c.cool||10)) return false;
    if(c.cond && !c.cond()) return false;
    return true;
  });
}
function drawCard(){
  const pool=eligible();
  if(!pool.length) return;
  // never let the line be foreclosed by draw-luck: if {they} is single, strongly
  // prefer a love-opening card — and make it certain in the last 5 years of its
  // window. The player still chooses whether to take it; they're just never denied
  // the chance. (cooldown still applies — the card must be in the eligible pool.)
  if(!rel('love')&&!rel('spouse')){
    // The fix for the "everyone meets late, marries late, has a child late" monoculture is to spread love
    // ACROSS ages rather than nudging whatever opensLove card is eligible (which in adulthood was always
    // a_meet_late -> always late). Youth love gets the firm nudge (so most coupling happens young, at varied
    // teen/twenties ages); late love gets only a faint chance (so it stays the rarer path, not the default);
    // and the rest of lives stay solitary — a real, content-bearing shape, not the same domestic arc.
    const yc=pool.find(c=>c.id==='y_love1');
    if(yc && chance(0.30)){ presentCard(yc); return; }   // love is a nudge, not a guarantee — and stays young when it lands; with collateral succession a childless or solitary life no longer ends the house, so roughly half of lives now take a genuinely non-domestic shape
    const lc=pool.find(c=>c.id==='a_meet_late');
    if(lc && chance(0.05)){ presentCard(lc); return; }   // late love is the genuine exception, not the fallback
  }
  // a youth should almost always be offered a CALLING — the fork that gives a life its shape and gates a
  // distinct adult arc (soldier / scholar / maker / wanderer). This is the engine of structural variety,
  // so unlike love it IS near-certain: a light nudge early, then sure once past the window's midpoint. The
  // player still chooses which road (and a life that dies young, or slips the draw, simply drifts uncalled).
  if(!P.flags.vocation){
    const vc=pool.find(c=>c.id==='y_calling');
    if(vc && ((vc.age && P.age>=vc.age[1]-4) || chance(0.5))){ presentCard(vc); return; }
  }
  // A coupled life is nudged toward a first child at a VARIED age: a moderate per-draw chance across the
  // whole fertile window (so a young couple may have one in their twenties or thirties, not always the late
  // 40s), strengthening into a safety-net in the final years so most lines still continue. The old hard force
  // at the window's end is gone — it was what clustered every birth into the late 40s and made the "a child,
  // past when they thought that door had closed" line land in nearly every life. ~A sixth of couples now stay
  // childless (a real, content-bearing life-shape, not a foreclosure).
  if((rel('spouse')||rel('love')) && !rels('child').length){
    const cc=pool.find(c=>c.id==='a_child');
    if(cc){ const late = cc.age && P.age>=cc.age[1]-3; if((late && chance(0.55)) || chance(0.33)){ presentCard(cc); return; } }   // ~a fifth of couples now stay childless too — the house can pass sideways
  }
  if(rel('love') && !P.flags.married){
    const mc=pool.find(c=>c.id==='a_marry');
    // marriage follows love by a few years at a VARIED age (a moderate per-draw nudge once in love),
    // strengthening into a late safety-net — so couples who met young also marry young, instead of every
    // marriage clustering at the window's end and reading "married late" no matter when they fell in love.
    if(mc){ const late = mc.age && P.age>=mc.age[1]-4; if((late && chance(0.62)) || chance(0.55)){ presentCard(mc); return; } }   // marriage follows love within a few years, not decades
  }
  // callbacks are rare, memory-gated payoffs (cb_*) — the reach-back that gives a life its
  // particular shape. When one is finally eligible, strongly prefer it so the long arc
  // closes instead of being crowded out by ordinary moments.
  const cb=pool.find(c=>c.id.indexOf('cb_')===0);
  if(cb && chance(0.7)){ presentCard(cb); return; }
  // SIGNATURE cards — the vocation arcs (soldier/scholar/maker/wanderer) and the era moments (a war, a
  // plague, fat years) are the whole point of choosing a calling or being born into a time: they're what
  // makes a soldier's life read differently from a scholar's, gen 8 from gen 2. They're once-per-life and
  // stage-spread, so a firm preference makes them reliably LAND without ever dominating a life.
  const SIG=/^(a_soldier|m_soldier|e_soldier|a_scholar|m_scholar|e_scholar|a_maker|m_maker|e_maker|a_wanderer|m_wanderer|e_wanderer|vx_|t_|w_)/;
  const sig=pool.find(c=>SIG.test(c.id));
  if(sig && chance(0.48)){ presentCard(sig); return; }
  // weighted pick — with a TRAIT AFFINITY so a child's marked nature actually shapes which childhood it
  // has: a bookish child leans to the book, a warm one to the friend, a restless one to leaving/taking.
  // This makes the early years (the jury's "identical checklist") diverge by who the child already is.
  const TRAIT_AFFINITY={c_book:'bookish',c_friend:'warm',c_animal:'tender',c_talent:'bright',c_grandparent:'tender',c_steal:'restless',c_move:'restless',c_sibling:'warm',c_wonder:'dreaming',c_unfair:'stubborn',c_dark:'guarded'};
  const ew=c=>{ const tr=TRAIT_AFFINITY[c.id]; return (tr && P.traits && P.traits.indexOf(tr)>=0) ? c.w*2.6 : c.w; };
  let tot=0; for(const c of pool) tot+=ew(c);
  let r=Math.random()*tot, chosen=pool[0];
  for(const c of pool){ r-=ew(c); if(r<=0){chosen=c;break;} }
  presentCard(chosen);
}
function presentCard(c){
  busy=true; clearTimeout(timer);
  P.sinceCard=0;
  P.drewAt=P.drewAt||{}; P.drewAt[c.id]=P.age;   // for the no-repeat cooldown
  if(c.once) P.flags['card_'+c.id]=1;
  if(c.onceDyn && typeof S!=='undefined' && S){ S.seenDyn=S.seenDyn||{}; S.seenDyn[c.id]=P.gen; }   // record the generation it fired (generational cooldown, not a permanent burn)
  if(typeof markMomentSeen==='function') markMomentSeen(c.id);   // cross-run discovery: count the distinct moments witnessed
  // once the player has made a choice, point them to where it's all recorded
  if(window.hintOnce && P.decisions && P.decisions.length>=1) hintOnce('seenChron',"Every choice is being written into your chronicle — tap “✦ the constellation” (top) to see the whole line.");
  if(window.hintOnce && P.decisions && P.decisions.length>=2) hintOnce('seenLog',"Tap the fading log below any time to read this life's full record.");
  if(window.hintOnce && P.gen===1 && P.decisions && P.decisions.length>=2) hintOnce('seenDynasty',"Everything this life gathers — its name, its means, its standing — will pass to the one who comes after.");
  const card=document.getElementById('card'), pass=document.getElementById('passing');
  pass.classList.remove('show');
  document.getElementById('scene').innerHTML=fmt(c.text);
  const cw=document.getElementById('choices'); cw.innerHTML='';
  c.choices.forEach((ch,ci)=>{
    const b=document.createElement('button'); b.type='button'; b.className='choice';
    const hid = ch.h ? ('choiceh'+ci) : null;
    b.innerHTML=fmt(ch.t)+(ch.h?`<span class="h" id="${hid}">${fmt(ch.h)}</span>`:'');
    if(hid) b.setAttribute('aria-describedby', hid);   // keep the hint in the accessibility tree even while visually collapsed
    b.onclick=()=>{
      if(b.dataset.done) return; b.dataset.done=1;
      b.classList.add('chosen');
      [...cw.children].forEach(o=>{if(o!==b)o.style.opacity='0.35';});
      // record the decision: which option, and the roads not taken
      const before={...P.aura};
      ch.do(P);
      const dW=(P.aura.warmth-(before.warmth||0)), dL=(P.aura.light-(before.light||0));
      const tone = (dW+dL)>2?'joy' : (dW+dL)<-2?'loss' : 'obs';
      if(!P.decisions) P.decisions=[];
      P.decisions.push({
        age:P.age,
        chose: fmt(ch.t).replace(/<[^>]+>/g,''),
        alts: c.choices.filter((_,i)=>i!==ci).map(o=>fmt(o.t).replace(/<[^>]+>/g,'')),
        tone
      });
      if(window.AL_mood) window.AL_mood(ch);
      setTimeout(()=>{
        card.classList.remove('show');
        setTimeout(()=>{ busy=false; renderAll(); scheduleTick(); }, 520);
      }, 560);
    };
    cw.appendChild(b);
  });
  // focus the first choice (not the card wrapper) so a keyboard/screen-reader user lands on an
  // actionable control; #scene is an assertive live region, so the moment's prose is announced too.
  requestAnimationFrame(()=>{ card.classList.add('show'); try{ (cw.firstElementChild||card).focus(); }catch(e){}
    // a tall (3-/4-choice) card can overflow a short phone: start at the top (scene first), and flag
    // overflow so the "more below" cue shows and every option stays reachable by scrolling.
    const st=document.querySelector('.stage');
    if(st){ st.scrollTop=0; st.classList.remove('at-bottom'); st.classList.toggle('scrollable', st.scrollHeight>st.clientHeight+4); }
  });
}
