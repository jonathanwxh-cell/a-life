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
  P.childrenIds.push(given);
  logLine("Had a child, "+given+". The world rearranged itself around a small weight.","joy");
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
  const ob=(key,cond,line,cls)=>{ if(!firedObs[key]&&cond){firedObs[key]=1;logLine(line,cls||'obs');} };
  if(a>40) ob('vit_tire',s.vit<35,"The stairs have started to ask a question of {them}.");
  if(a>55) ob('vit_neg',s.vit<18,"{Their} body has become a small daily negotiation.");
  ob('mind_hi',s.mind>78&&a>20,"Books have become a country {they} live in.");
  ob('means_lo',s.means<14,"The end of the month keeps arriving before the money does.");
  ob('means_hi',s.means>82,"Money has stopped being a worry and become a kind of weather.");
  ob('spirit_lo',s.spirit<22,"A greyness has moved quietly into the rooms of {them}.");
  ob('spirit_hi',s.spirit>85&&a>30,"There is a lightness to {them} that the years did not take.");
  ob('heart_lo',s.heart<20,"{They} has grown hard to reach, even for {them}self.");
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
    // elder relations may die
    if(r.age>62){
      const p=Math.max(0,(r.age-62)/650);
      if(chance(p)){
        r.alive=false;
        const term=r.kind==='mother'?'{their} mother':r.kind==='father'?'{their} father':
          r.kind==='spouse'?'{their} '+P.px.spouse:r.kind==='friend'?'an old friend, '+r.given:r.given;
        logLine("Lost "+term+".","loss");
      }
    }
  }
}

/* death check */
function deathRoll(){
  const a=P.age, v=P.stats.vit;
  let p=0;
  if(a>55) p+=(a-55)/620;
  if(a>72) p+=(a-72)/240;
  if(a>85) p+=(a-85)/80;
  p*=(1.7 - v/100);
  if(P.traits.includes('frail')) p*=1.3;
  return chance(p) || (v<=2 && a>40 && chance(0.4));
}

/* ---------- main tick ---------- */
let timer=null;
function scheduleTick(){
  clearTimeout(timer);
  if(!running||busy) return;
  timer=setTimeout(()=>{ tick(); scheduleTick(); }, RATE);
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
  const base=0.07, ramp=Math.min(0.6, Math.pow(Math.max(0,P.sinceCard-2),1.5)*0.045);
  if(chance(base+ramp)) drawCard();
  save();
}

/* ---------- card drawing ---------- */
function eligible(){
  const stage=stageOf(P.age);
  return CARDS.filter(c=>{
    if(c.stage!=='*'&&c.stage!==stage) return false;
    if(c.once && P.flags['card_'+c.id]) return false;
    if(c.cond && !c.cond()) return false;
    return true;
  });
}
function drawCard(){
  const pool=eligible();
  if(!pool.length) return;
  // weighted pick
  let tot=0; for(const c of pool) tot+=c.w;
  let r=Math.random()*tot, chosen=pool[0];
  for(const c of pool){ r-=c.w; if(r<=0){chosen=c;break;} }
  presentCard(chosen);
}
function presentCard(c){
  busy=true; clearTimeout(timer);
  P.sinceCard=0;
  if(c.once) P.flags['card_'+c.id]=1;
  const card=document.getElementById('card'), pass=document.getElementById('passing');
  pass.classList.remove('show');
  document.getElementById('scene').innerHTML=fmt(c.text);
  const cw=document.getElementById('choices'); cw.innerHTML='';
  c.choices.forEach((ch,ci)=>{
    const b=document.createElement('button'); b.className='choice';
    b.innerHTML=fmt(ch.t)+(ch.h?`<span class="h">${fmt(ch.h)}</span>`:'');
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
      }, 360);
    };
    cw.appendChild(b);
  });
  requestAnimationFrame(()=>card.classList.add('show'));
}
