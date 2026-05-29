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
function addRel(kind, given, sex, bond, age){
  const r={rid:_relId++, kind, given, name:given, sex, px:pronouns(sex), bond:clamp(bond), age:age|0, alive:true};
  P.rels.push(r); return r;
}
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

/* ============================================================
   EVENT CARDS  — the writing is the game
   stage: child(0-12) youth(13-25) adult(26-45) midlife(46-65) elder(66+)
   ============================================================ */
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

const CARDS=[
/* ---- CHILD ---- */
{id:'c_book',stage:'child',w:3,text:"A teacher leaves a book on {n}'s desk by mistake. It is far too difficult. {They} could return it, or keep it and try.",
 choices:[
  {t:"Keep it. Climb the hard pages.",h:"the mind reaches",do:p=>{fx(p,{mind:8,spirit:3});remember('child_books');logLine("Read a book {they} couldn't yet understand, and loved it anyway.");}},
  {t:"Give it back. Go out and play.",h:"the body runs",do:p=>{fx(p,{vit:6,heart:4});remember('child_outdoors');logLine("Spent the afternoon outside until the light went.");}},
 ]},
{id:'c_sick',stage:'child',w:2,once:true,text:"A fever takes the house for a week. {n} is small in a large bed.",
 choices:[
  {t:"Let mother sit through the nights.",h:"a bond is set",do:p=>{const m=rel('mother');if(m)m.bond=clamp(m.bond+12);fx(p,{vit:-4,heart:5});logLine("Was nursed through a fever; remembered a cool hand for life.","obs");}},
  {t:"Insist on being brave alone.",h:"a habit is set",do:p=>{fx(p,{vit:-2,spirit:-3,mind:2});logLine("Learned early to be ill quietly.","obs");}},
 ]},
{id:'c_friend',stage:'child',w:3,cond:()=>!rel('friend'),text:"There is a child at the edge of the yard who never gets picked for anything.",
 choices:[
  {t:"Sit beside them.",h:"a friend, perhaps for life",do:p=>{const s=chance(0.5)?'m':'f';addRel('friend',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age);remember('kind_to_outcast');fx(p,{heart:7});logLine("Made a friend nobody else wanted; this turned out to matter.","joy");}},
  {t:"Look away. It's safer.",h:"",do:p=>{remember('looked_away');fx(p,{heart:-4,spirit:-2});logLine("Looked away from a lonely child, and half-remembered it for years.");}},
 ]},
{id:'c_steal',stage:'child',w:2,text:"Fruit on a stall, and no one watching. {n}'s stomach is loud.",
 choices:[
  {t:"Take it.",h:"",do:p=>{fx(p,{means:2,spirit:-2,heart:-2});logLine("Stole, once, and the taste was guilt as much as fruit.");}},
  {t:"Walk on, hungry.",h:"",do:p=>{fx(p,{spirit:3,vit:-2});logLine("Went hungry rather than take what wasn't given.","obs");}},
 ]},

/* ---- YOUTH ---- */
{id:'y_path',stage:'youth',w:3,once:true,text:"Two roads open. A trade that pays now, sure and small — or years of study with no promise at the end.",
 choices:[
  {t:"Take the trade. Eat today.",h:"steady means, narrow door",do:p=>{fx(p,{means:14,mind:-2,vit:2});p.flags.trade=1;remember('chose_trade');logLine("Chose the wage over the wager. Was never quite poor, never quite free.");}},
  {t:"Study. Gamble on the mind.",h:"hungry now, wider door",do:p=>{fx(p,{mind:16,means:-8,spirit:2});p.flags.scholar=1;remember('chose_study');logLine("Chose study, and hunger, and the long bet on {their} own head.");}},
 ]},
{id:'y_love1',stage:'youth',w:4,cond:()=>!rel('love'),text:"Someone keeps finding reasons to be where {n} is. The reasons are getting thinner.",
 choices:[
  {t:"Meet them halfway.",h:"the heart opens",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,62,p.age+ri(-2,2));fx(p,{spirit:9,heart:6});logLine("Fell in love, clumsily and completely.","joy");}},
  {t:"Pretend not to notice.",h:"",do:p=>{remember('unspoken_love');fx(p,{spirit:-4,mind:2});logLine("Let someone slip away by saying nothing. Wondered, later, often.","obs");}},
 ]},
{id:'y_risk',stage:'youth',w:2,text:"A friend has a scheme. It could double everything {n} has saved. It could take it.",
 choices:[
  {t:"Put the money in.",h:"fortune is fickle",do:p=>{if(chance(0.45)){fx(p,{means:22,spirit:6});logLine("Took a wild chance and, this time, won.","joy");}else{fx(p,{means:-18,spirit:-7});logLine("Took a wild chance and learned what losing feels like.","loss");}}},
  {t:"Keep it under the mattress.",h:"",do:p=>{fx(p,{means:2,spirit:-1});logLine("Kept {their} money safe and {their} life small.");}},
 ]},
{id:'y_leave',stage:'youth',w:2,once:true,text:"The town is small and {n} can feel its edges. There is a city somewhere, indifferent and enormous.",
 choices:[
  {t:"Go. Don't look back.",h:"the world widens",do:p=>{fx(p,{mind:6,heart:-3,spirit:5,means:-4});const m=rel('mother');if(m)m.bond=clamp(m.bond-8);p.flags.left=1;remember('left_home');logLine("Left home for the city, carrying one bag and every hope.");}},
  {t:"Stay. The roots are here.",h:"",do:p=>{fx(p,{heart:5,spirit:2,mind:-2});remember('stayed_home');logLine("Stayed where {they} was known, and was, mostly, content.");}},
 ]},
{id:'y_drink',stage:'youth',w:2,text:"There is a season where the nights run long and the mornings cost more each time.",
 choices:[
  {t:"Burn through it.",h:"",do:p=>{fx(p,{vit:-6,spirit:4,heart:3});logLine("Spent a reckless year {they} would not, on balance, trade away.");}},
  {t:"Pull back early.",h:"",do:p=>{fx(p,{vit:3,spirit:-1,mind:3});logLine("Left the party before it turned, every time.");}},
 ]},

/* ---- ADULT ---- */
{id:'a_marry',stage:'adult',w:5,cond:()=>rel('love')&&!P.flags.married,text:()=>{const l=rel('love');return `${P.given} and ${l.given} have been a quiet certainty for years now. ${l.given} is waiting for a question.`;},
 choices:[
  {t:"Ask. Build a life.",h:"two become a household",do:p=>{const l=rel('love');l.kind='spouse';p.flags.married=1;fx(p,{spirit:11,heart:6});logLine("Married "+l.given+". The day was small and the meaning was not.","joy");}},
  {t:"Not yet. Maybe never.",h:"",do:p=>{const l=rel('love');l.bond=clamp(l.bond-14);fx(p,{spirit:-6});logLine("Could not say yes, and watched a good thing strain.","loss");}},
 ]},
{id:'a_child',stage:'adult',w:5,cond:()=>(rel('spouse')||rel('love'))&&rels('child').length<3&&P.age<45,
 text:"The question of a child arrives, the way it does — half decision, half tide.",
 choices:[
  {t:"Yes. Make room in the world.",h:"the line may continue",do:p=>{haveChild();fx(p,{spirit:8,means:-6,vit:-3});}},
  {t:"No. This life, as it is.",h:"",do:p=>{fx(p,{spirit:2,means:4});logLine("Chose a life without children, with clear eyes.","obs");}},
 ]},
{id:'a_work',stage:'adult',w:3,cond:()=>(P.age-(P.flags.lastWork||-12))>=10,
 text:"There is a promotion, but it eats the evenings. The home gets the leftovers of {n}.",
 choices:[
  {t:"Take it. Provide.",h:"means up, hours gone",do:p=>{p.flags.lastWork=p.age;fx(p,{means:16,spirit:-3});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond-7);logLine("Worked for the family until the family barely saw {them}.","obs");}},
  {t:"Refuse it. Be present.",h:"",do:p=>{p.flags.lastWork=p.age;fx(p,{means:-2,spirit:6});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond+8);logLine("Turned down more money to be home for dinner.","joy");}},
 ]},
{id:'a_old_friend',stage:'adult',w:2,
 cond:()=>{const f=rel('friend');return f&&!f.refused&&f.bond>30&&(P.age-(f.lastAsked||-10))>=8;},
 text:()=>{const f=rel('friend');return `${f.given}, the friend from the old yard, asks {n} for money${f.lentBefore?', and it is not the first time':''}. It is not a small amount.`;},
 choices:[
  {t:"Give it. That's what it's for.",h:"",do:p=>{const f=rel('friend');if(f){f.lastAsked=p.age;f.lentBefore=true;f.bond=clamp(f.bond+6);}fx(p,{means:-12,heart:4});logLine("Helped an old friend"+(f&&f.lentBefore?' again':'')+", knowing how it might go.");}},
  {t:"Say no. Finally.",h:"",do:p=>{const f=rel('friend');if(f){f.refused=true;f.bond=clamp(f.bond-20);}fx(p,{means:2,spirit:-4});logLine("Said no to "+(f?f.given:'an old friend')+", and felt a long friendship cool.","loss");}},
 ]},
{id:'a_affair',stage:'adult',w:2,
 cond:()=>{const s=rel('spouse');return s&&!s.affairResolved&&!held('strayed')&&s.age>6;},
 text:"A door opens that {n} did not knock on. Someone new, and the old marriage feels suddenly worn.",
 choices:[
  {t:"Close the door.",h:"",do:p=>{const s=rel('spouse');if(s){s.bond=clamp(s.bond+5);s.affairResolved=true;}fx(p,{spirit:3});logLine("Felt the pull, and chose the marriage anyway.");}},
  {t:"Walk through it.",h:"",do:p=>{const s=rel('spouse');if(s)s.bond=clamp(s.bond-30);remember('strayed');fx(p,{spirit:-8,heart:-5});if(s&&chance(0.5)){s.alive=false;s.kind='ex';logLine("The marriage broke on what {they} did. "+s.given+" left.","loss");}else logLine("Strayed, and carried it like a stone {they} couldn't set down.","loss");}},
 ]},

/* ---- MIDLIFE ---- */
{id:'m_parent_age',stage:'midlife',w:3,
 cond:()=>{const pa=agingParent();return !!pa;},
 text:()=>{const pa=agingParent();return `${pa.given}, {n}'s ${pa.kind}, is old now, and frightened in the small hours. They need someone, and {n} has a life of {their} own.`;},
 choices:[
  {t:"Take them in.",h:"",do:p=>{const pa=agingParent();if(pa){pa.bond=clamp(pa.bond+14);pa.caredFor=true;}fx(p,{means:-8,spirit:-2,heart:6});logLine("Made room for an aging parent, and lost some sleep and gained some grace.");}},
  {t:"Pay for their care, from afar.",h:"",do:p=>{const pa=agingParent();if(pa){pa.bond=clamp(pa.bond-4);pa.caredFor=true;}fx(p,{means:-12});logLine("Did right by a parent at a careful distance.","obs");}},
 ]},
{id:'m_child_grown',stage:'midlife',w:3,cond:()=>!!grownUnblessedChild(),
 text:()=>{const c=grownUnblessedChild();return `${c.given} is grown enough to make a choice {n} thinks is a mistake. ${c.given} is asking for {n}'s blessing, not {n}'s permission.`;},
 choices:[
  {t:"Give the blessing. Let go.",h:"",do:p=>{const c=grownUnblessedChild();if(c){c.bond=clamp(c.bond+12);c.blessed=true;}fx(p,{spirit:4});logLine("Let "+(c?c.given:'{their} child')+" make their own mistake, with love.","joy");}},
  {t:"Fight it. You know better.",h:"",do:p=>{const c=grownUnblessedChild();if(c){c.bond=clamp(c.bond-16);c.blessed=true;}fx(p,{spirit:-5});logLine("Fought {their} child's choice, and won the fight and lost some of the child.","loss");}},
 ]},
{id:'m_health',stage:'midlife',w:3,once:true,text:"The body sends its first real letter. A scare, a doctor's careful voice, a word {n} has to look up.",
 choices:[
  {t:"Change everything. Now.",h:"",do:p=>{fx(p,{vit:10,spirit:-2,means:-4});logLine("Took the warning seriously, and bought {them}self years.","obs");}},
  {t:"Carry on as before.",h:"",do:p=>{fx(p,{vit:-8,spirit:2});logLine("Heard the warning and lit another match anyway.","obs");}},
 ]},
{id:'m_money',stage:'midlife',w:2,text:"The savings have grown into something with weight. {n} could keep building, or finally use some of it to live.",
 choices:[
  {t:"Keep compounding.",h:"the estate grows",do:p=>{fx(p,{means:14,spirit:-3});logLine("Let the money keep working, and worked alongside it.");}},
  {t:"Spend it on the years left.",h:"",do:p=>{fx(p,{means:-14,spirit:12,vit:4,heart:4});logLine("Spent freely on a life {they} could actually feel.","joy");}},
 ]},

/* ---- ELDER ---- */
{id:'e_reconcile',stage:'elder',w:3,cond:()=>P.rels.some(r=>r.bond<35&&(r.kind==='child'||r.kind==='friend'||r.kind==='spouse')),
 text:"There is a name {n} has not said in too long. The phone is right there. So is the pride.",
 choices:[
  {t:"Call. Say the hard thing.",h:"",do:p=>{const r=p.rels.filter(r=>r.alive&&r.bond<35)[0];if(r){r.bond=clamp(r.bond+25);logLine("Reached across years of silence to "+r.given+".","joy");}fx(p,{spirit:10});}},
  {t:"Let it lie. Too late now.",h:"",do:p=>{fx(p,{spirit:-6});logLine("Decided it was too late to mend it. It was not, but {they} would never know.","loss");}},
 ]},
{id:'e_legacy',stage:'elder',w:3,once:true,text:"{n} is asked what {they} wants remembered. The question lands harder than expected.",
 choices:[
  {t:"\"That I was kind.\"",h:"",do:p=>{fx(p,{heart:6,spirit:6});p.flags.legacy='kind';logLine("Said {they} hoped to be remembered as kind.","obs");}},
  {t:"\"That I built something.\"",h:"",do:p=>{fx(p,{spirit:4});p.flags.legacy='built';logLine("Said {they} hoped to be remembered for what {they} made.","obs");}},
  {t:"\"That I was here at all.\"",h:"",do:p=>{fx(p,{spirit:2});p.flags.legacy='here';logLine("Said {they} only hoped to be remembered.","obs");}},
 ]},
{id:'e_garden',stage:'elder',w:2,text:"The days are slow and wide. {n} takes up something small — a garden, a craft, a quiet ritual.",
 choices:[
  {t:"Tend it daily.",h:"",do:p=>{fx(p,{spirit:8,vit:3});logLine("Found a late, gentle happiness in small daily things.","joy");}},
  {t:"Sit in the window instead.",h:"",do:p=>{fx(p,{spirit:-2,mind:3});logLine("Spent the last years mostly in thought, at the window.","obs");}},
 ]},

/* ---- UNIVERSAL / ENTROPY ---- */
{id:'u_windfall',stage:'*',w:1,text:"An envelope, a forgotten debt repaid, a stroke of plain luck. Money {n} did not expect.",
 choices:[
  {t:"Save it.",h:"",do:p=>{fx(p,{means:12});logLine("Came into unexpected money and, sensibly, kept it.");}},
  {t:"Share it out.",h:"",do:p=>{fx(p,{means:4,heart:6,spirit:5});logLine("Came into money and gave most of it away.","joy");}},
 ]},
{id:'u_loss',stage:'*',w:1,cond:()=>P.stats.means>30,text:"A bad year. A failure not entirely {n}'s fault, but the bill comes to {them} all the same.",
 choices:[
  {t:"Absorb it. Rebuild.",h:"",do:p=>{fx(p,{means:-16,spirit:-4,mind:3});logLine("Took a hard loss and started, again, from lower down.","loss");}},
 ]},

/* ============================================================
   CALLBACK CARDS — these reach back to who you were.
   They only appear if an earlier choice left its mark.
   ============================================================ */
{id:'cb_books_late',stage:'midlife',w:4,cond:()=>held('child_books')&&P.stats.mind>60,once:true,
 text:"{n} finds the old book on a high shelf — the one too hard for a child's hands, kept all these years.",
 choices:[
  {t:"Read it again, slowly.",h:"a circle closes",do:p=>{echo("Read, at last with ease, the book that began everything at age "+recall('child_books').age+".");fx(p,{spirit:9,mind:4});}},
  {t:"Pass it to a young one.",h:"",do:p=>{const c=rels('child')[0];echo("Gave the book that shaped {them} to "+(c?c.given:'a child')+", saying nothing of why.");if(c)c.bond=clamp(c.bond+8);fx(p,{spirit:6,heart:4});}},
 ]},
{id:'cb_outcast_return',stage:'adult',w:4,cond:()=>held('kind_to_outcast')&&rel('friend'),once:true,
 text:()=>{const f=rel('friend');return `The child from the yard — ${f.given}, grown — is somebody now, and has not forgotten who sat beside ${P.given} when no one else would.`;},
 choices:[
  {t:"Accept the hand up.",h:"kindness, returned with interest",do:p=>{const f=rel('friend');echo("A kindness done at "+recall('kind_to_outcast').age+" came back, decades later, as a door held open.","joy");fx(p,{means:14,spirit:8});f.bond=clamp(f.bond+10);}},
  {t:"Decline. You didn't do it for this.",h:"",do:p=>{echo("Refused to be repaid for a kindness {they} barely remembered giving.","obs");fx(p,{spirit:6,heart:5});}},
 ]},
{id:'cb_lookaway',stage:'midlife',w:3,cond:()=>held('looked_away'),once:true,
 text:"{n} passes a person sleeping rough, and something very old turns over — the lonely child in the yard, the time {they} looked away.",
 choices:[
  {t:"Stop. Don't look away this time.",h:"a debt, quietly paid",do:p=>{echo("Made up, to a stranger, for a child {they} had ignored "+yearsSince('looked_away')+" years before.","joy");fx(p,{heart:9,spirit:6,means:-3});P.mem.looked_away=null;}},
  {t:"Look away again.",h:"",do:p=>{echo("Looked away a second time, and knew, now, exactly what it cost.","loss");fx(p,{spirit:-6});}},
 ]},
{id:'cb_trade_regret',stage:'midlife',w:3,cond:()=>held('chose_trade')&&P.stats.spirit<55,once:true,
 text:"A young person asks {n} whether they should take the safe job or chase the uncertain dream. {n} hears {their} own youth in the question.",
 choices:[
  {t:"\"Chase it. I didn't.\"",h:"",do:p=>{echo("Told a young dreamer to do what {they} hadn't dared at "+recall('chose_trade').age+".");fx(p,{spirit:5,heart:4});}},
  {t:"\"Take the safe one. Like I did.\"",h:"",do:p=>{echo("Counselled caution, the way {they} had always lived.");fx(p,{spirit:-2,mind:2});}},
 ]},
{id:'cb_study_pays',stage:'adult',w:3,cond:()=>held('chose_study')&&P.stats.mind>72,once:true,
 text:"The long bet on {n}'s own mind, made hungry and young, is finally being called in. Someone wants to pay for what {they} knows.",
 choices:[
  {t:"Name your worth.",h:"the gamble matures",do:p=>{echo("The hungry years of study, begun at "+recall('chose_study').age+", at last came good.","joy");fx(p,{means:20,spirit:7});}},
  {t:"Teach it cheap. Spread it wide.",h:"",do:p=>{echo("Chose to give knowledge away rather than sell it dear.","joy");fx(p,{means:3,heart:8,spirit:6});remember('became_teacher');}},
 ]},
{id:'cb_left_home',stage:'midlife',w:3,cond:()=>held('left_home'),once:true,
 text:"Word comes from the town {n} left long ago. It is smaller than {they} remembered, and mostly gone. {They} could go back, once.",
 choices:[
  {t:"Go back. Stand where you started.",h:"",do:p=>{echo("Returned to the town {they} fled at "+recall('left_home').age+", and found it both smaller and larger than memory.","obs");fx(p,{spirit:7,heart:5});}},
  {t:"Let it stay a memory.",h:"",do:p=>{echo("Chose not to return, and kept the town perfect and unvisited.","obs");fx(p,{spirit:-2,mind:3});}},
 ]},
{id:'cb_unspoken',stage:'elder',w:3,cond:()=>held('unspoken_love'),once:true,
 text:"In the slow evenings, {n} thinks again of the one {they} never answered, all those years ago. {They} learns their name is in the paper — still living, a town away.",
 choices:[
  {t:"Write the letter, finally.",h:"",do:p=>{echo("Wrote, at last, to the love {they} let pass in silence half a life ago.","joy");fx(p,{spirit:10,heart:6});}},
  {t:"Some doors stay closed.",h:"",do:p=>{echo("Let the oldest 'what if' remain one, on purpose, at the end.","obs");fx(p,{spirit:2});}},
 ]},
{id:'cb_strayed',stage:'elder',w:2,cond:()=>held('strayed'),once:true,
 text:"Near the end, the thing {n} did to {their} marriage sits in the room like a third person. No one else remembers. {They} do.",
 choices:[
  {t:"Confess it to someone.",h:"set the stone down",do:p=>{remember('confessed');echo("Spoke aloud, before the end, the thing {they} had carried since "+recall('strayed').age+".","loss");fx(p,{spirit:8,heart:3});}},
  {t:"Take it with you.",h:"",do:p=>{echo("Carried the old betrayal all the way to the end, and told no one.","loss");fx(p,{spirit:-3});}},
 ]},
{id:'cb_inherited_secret',stage:'adult',w:3,cond:()=>held('inherited_secret'),once:true,
 text:()=>{const m=recall('inherited_secret');return `An old relative, near death, takes ${P.given}'s hand and finally explains the thing the family never speaks of — what ${m.from} did, generations back. Now ${P.given} carries it too.`;},
 choices:[
  {t:"Keep the family's silence.",h:"the secret passes on",do:p=>{echo("Learned the oldest family secret, and chose, like those before, to keep it.","obs");fx(p,{spirit:-3,mind:3});}},
  {t:"Speak it. End the silence.",h:"a long shadow lifts",do:p=>{remember('exposed_secret');if(S.house&&S.house.secret)S.house.secret.known=true;echo("Dragged the family's oldest secret into daylight, and let it finally lose its weight.","joy");fx(p,{spirit:9,heart:4});}},
 ]},

/* ============================================================
   NEW MOMENTS — sharper, more particular
   ============================================================ */
{id:'c_animal',stage:'child',w:2,once:true,text:"A stray follows {n} home. It is thin and trusting and not, by any measure, theirs to keep.",
 choices:[
  {t:"Hide it. Feed it anyway.",h:"",do:p=>{remember('kept_stray');fx(p,{heart:8,spirit:4});logLine("Kept a secret animal alive on stolen scraps, and loved it fiercely.","joy");}},
  {t:"Do the sensible thing.",h:"",do:p=>{fx(p,{heart:-3,mind:3});logLine("Turned the stray away, because it was sensible, and felt the sense of it like a bruise.");}},
 ]},
{id:'y_mentor',stage:'youth',w:3,once:true,text:"An older stranger sees something in {n} and offers to teach {them} — for nothing, just because someone once did it for them.",
 choices:[
  {t:"Show up every day.",h:"",do:p=>{remember('had_mentor');fx(p,{mind:11,spirit:5});const s=chance(.5)?'m':'f';addRel('mentor',pick(s==='m'?GIVEN_M:GIVEN_F),s,66,p.age+ri(28,40));logLine("Was taken under a wing, and never forgot the debt of it.","joy");}},
  {t:"Be too proud to need it.",h:"",do:p=>{fx(p,{spirit:-3,mind:-2});logLine("Turned down a teacher out of pride {they} mistook for strength.");}},
 ]},
{id:'a_fork_career',stage:'adult',w:3,once:true,cond:()=>P.stats.means>40,text:"{n} can buy security — a dull, safe thing that will hold for thirty years — or risk it all on work that might mean something.",
 choices:[
  {t:"Buy the safe thing.",h:"",do:p=>{fx(p,{means:10,spirit:-5,vit:2});logLine("Chose security, and felt the walls of it close in, comfortably.");}},
  {t:"Risk it on the meaningful thing.",h:"fortune is fickle",do:p=>{if(chance(.5)){fx(p,{means:8,spirit:14,mind:5});logLine("Bet {their} security on meaning, and, this once, both held.","joy");}else{fx(p,{means:-20,spirit:6});logLine("Bet security on meaning and lost the money, kept the meaning.","loss");}}},
 ]},
{id:'a_friend_die',stage:'adult',w:2,cond:()=>rel('friend')&&rel('friend').age<60,once:true,
 text:()=>{const f=rel('friend');return `${f.given} is gone — suddenly, senselessly, far too early. ${P.given} is asked to speak at the service.`;},
 choices:[
  {t:"Speak. Say the true things.",h:"",do:p=>{const f=rel('friend');f.alive=false;echo("Buried "+f.given+" young, and said the true things aloud.","loss");fx(p,{spirit:-6,heart:6});}},
  {t:"You can't. Sit in the back.",h:"",do:p=>{const f=rel('friend');f.alive=false;logLine("Couldn't find the words for "+f.given+", and grieved in silence.","loss");fx(p,{spirit:-8});}},
 ]},
{id:'m_estrange',stage:'midlife',w:2,cond:()=>rels('child').some(c=>c.age>=20),once:true,
 text:()=>{const c=rels('child').find(c=>c.age>=20);return `${c.given} has stopped calling. ${P.given} is not entirely sure what was said, or by whom, or when it hardened into this.`;},
 choices:[
  {t:"Reach out first. Swallow the pride.",h:"",do:p=>{const c=rels('child').find(c=>c.age>=20);c.bond=clamp(c.bond+18);fx(p,{spirit:5,heart:4});logLine("Made the first call to a child who'd gone quiet.","joy");}},
  {t:"Wait for them to come around.",h:"",do:p=>{const c=rels('child').find(c=>c.age>=20);c.bond=clamp(c.bond-10);fx(p,{spirit:-5});logLine("Waited for a child to call first, and the waiting became years.","loss");}},
 ]},
{id:'e_window',stage:'elder',w:3,cond:()=>rels('child').length>0||P.childrenIds.length>0,text:"A grandchild — small, sticky, fearless — climbs into {n}'s lap and asks what {they} were like when {they} were little.",
 choices:[
  {t:"Tell the true story.",h:"",do:p=>{fx(p,{spirit:9,heart:7});const line= held('kept_stray')?"told the one about the secret stray":held('child_books')?"told the one about the book too hard to read":"told the truest one {they} had";logLine("Held a grandchild and "+line+".","joy");}},
  {t:"Tell the better story.",h:"",do:p=>{fx(p,{spirit:5,heart:4});logLine("Improved {their} own childhood a little, for a child who'd never know.","obs");}},
 ]},
{id:'e_last_walk',stage:'elder',w:2,cond:()=>P.stats.vit<40,once:true,
 text:"{n} senses, without being told, that this may be the last good day {their} body grants. The morning is unreasonably beautiful.",
 choices:[
  {t:"Spend it with someone you love.",h:"",do:p=>{const r=P.rels.filter(x=>x.alive).sort((a,b)=>b.bond-a.bond)[0];echo("Spent a last clear day with "+(r?r.given:'the people {they} loved')+", saying little, meaning all of it.","joy");fx(p,{spirit:12,heart:6});}},
  {t:"Spend it alone, at peace.",h:"",do:p=>{echo("Took a last long walk alone, and found {they} was not afraid.","obs");fx(p,{spirit:8});}},
 ]},
];

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
  if(leg==='kind'||s.heart>72) return "Remembered, above all, as kind.";
  if(leg==='built'||p.peakMeans>78) return "Built something that outlasted the building of it.";
  if(s.mind>78) return "Lived half in the world and half in {their} own head.".replace(/\{their\}/g,p.px.their);
  if(s.spirit>74) return "Carried a lightness the years never managed to take.";
  if(s.spirit<28) return "Knew more sorrow than {they} ever said aloud.".replace(/\{they\}/g,p.px.they);
  if(p.deathAge<40) return "Gone too soon, with so much unspent.";
  if(s.means<18) return "Never had much, and gave away some of that.";
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
  const endMeans=s.means;
  if(endMeans>78) h.seat=Math.min(6,h.seat+ (endMeans>90?2:1));
  else if(endMeans>58) h.seat=Math.min(6,h.seat+ (Math.random()<0.5?1:0));
  else if(endMeans<22) h.seat=Math.max(0,h.seat-1);
  else if(endMeans<10) h.seat=Math.max(0,h.seat-2);

  // --- reputation drifts with the defining qualities of the life ---
  const bump=(tag,n=1)=>{h.repute[tag]=(h.repute[tag]||0)+n;};
  const fade=()=>{for(const k in h.repute){h.repute[k]=Math.max(0,h.repute[k]-0.34);if(h.repute[k]<0.5)delete h.repute[k];}};
  fade(); // reputations soften over generations if not renewed
  if(s.mind>74||m.chose_study||m.became_teacher) bump('scholarly');
  if(s.heart>74||m.kept_stray||p.flags.legacy==='kind') bump('kind');
  if(m.strayed&&!m.confessed) bump('tainted');
  if(s.means>80&&s.heart<40) bump('ruthless');
  if(p.flags.legacy==='built'||s.means>82) bump('industrious');
  if(m.kind_to_outcast) bump('generous',0.5);

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
    h.secret={text:p.given+" did something to their marriage that the family still does not speak of",from:p.given,gen:p.gen,known:false};
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
    given:p.given, gen:p.gen, sex:p.sex,
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
  const child=newPerson({
    given:childRel.given, sex:childRel.sex, gen:dead.gen+1,
    parentName:dead.name,
    seedStats: childRel.seed || seedChildStats(dead,null),
    traits: childRel.traitsSeed || inheritTraits(dead.traits),
    startAge: childRel.age,
    inheritMeans: Math.max(0,inheritMeans),
    nurture: nurture,
    bornYear: dead.bornYear + (dead.deathAge - childRel.age),
  });
  // the heir is BORN INTO the house — heirlooms & the family secret arrive as memories
  child.mem = child.mem || {};
  for(const hl of (h.heirlooms||[])){
    if(hl.tag==='book') child.mem.child_books={age:0,inherited:true};
    if(hl.tag==='stray') child.mem.kept_stray={age:0,inherited:true};
    if(hl.tag==='teaching') child.mem.had_mentor={age:0,inherited:true};
  }
  if(h.secret && !h.secret.known){ child.mem.inherited_secret={age:childRel.age, from:h.secret.from}; }
  // seed the heir's relationships: surviving family carry over as kin
  const carry=dead.rels.filter(r=>r.alive&&r.kind!=='ex'&&r.given!==childRel.given);
  for(const r of carry){
    let k=r.kind;
    if(k==='spouse'||k==='love') k= (r.given===childRel.given)?null:'mother'; // surviving parent
    if(r.kind==='child') k='sibling';
    if(r.kind==='friend') continue; // friends don't transfer
    if(k) child.rels.push({kind:k,given:r.given,name:r.given,sex:r.sex,px:pronouns(r.sex),bond:clamp(r.bond-10),age:r.age,alive:true});
  }
  // the dead parent becomes a remembered presence
  S.person=child; P=child; firedObs={};
  if(window.AL_reseed) window.AL_reseed();
  // opening line reflects the standing the family has reached
  const seat=seatOf(h.seat);
  logLine("Was born into "+seat.name+", and a family that already had a story.","obs");
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
    d.innerHTML=`<div class="o">${ordinal(a.gen)}</div><div><div class="nm">${a.given} ${S.surname}${readable?' <span style="color:var(--amber);font-size:11px;opacity:.7">— read ↗</span>':''}</div><span class="ep">${a.epitaph}${a.extinct?' — the line ended here.':''}</span></div><div class="sp">${a.span} yrs</div>`;
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
    `<div class="nm">${a.given} ${S.surname}</div><div class="sub">${ordinal(a.gen)} of the line · lived ${a.span} years<br>“${a.epitaph}”</div>`;
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
    row.innerHTML=`<div class="body"><div class="nm">House ${m.surname}</div>
      <div class="sub">${m.gens} generation${m.gens>1?'s':''} · ${m.souls} live${m.souls===1?'':'s'} lived · ${seatOf(m.seat).adj}<br>
      <span class="${m.alive?'':'dead'}">${status}</span> · ${when}</div></div>
      <div class="del" title="delete">✕</div>`;
    row.querySelector('.body').onclick=async()=>{
      const ok=await loadSlot(m.slot);
      if(ok){
        document.getElementById('vLoad').classList.remove('show');
        document.getElementById('vTitle').classList.remove('show');
        offlineCatchUp();
        setPP();
        if(P.alive){ renderAll(); scheduleTick(); }
        else { renderAll(); showEulogy(P); }
      }
    };
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
document.getElementById('dBackup').onclick=async()=>{
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
    const code=encodeSave(data);
    const box=document.getElementById('codeBox'); box.value=code;
    box.focus(); box.select();
    let copied=false;
    try{ await navigator.clipboard.writeText(code); copied=true; }
    catch(e){ try{ document.execCommand('copy'); copied=true; }catch(_){} }
    setBackupMsg(copied
      ? 'Copied House '+data.surname+' to your clipboard. Paste it somewhere safe.'
      : 'Save code ready above — long-press to select and copy it.');
  }catch(e){ setBackupMsg('Export failed: '+e.message,true); }
}

async function importFromCode(){
  const box=document.getElementById('codeBox');
  const code=box.value;
  if(!code || !code.trim()){ setBackupMsg('Paste a save code into the box first.',true); return; }
  let obj;
  try{ obj=decodeSave(code); }
  catch(e){ setBackupMsg('That code could not be read: '+e.message,true); return; }
  try{
    // write into a free slot (or the lowest) and load it
    let slot=await nextFreeSlot(); if(slot==null) slot=1;
    await window.storage.set('alife:slot:'+slot, JSON.stringify(obj));
    const idx=(await readIndex()).filter(e=>e.slot!==slot);
    idx.push({slot, surname:obj.surname, gens:(obj.marks&&obj.marks.gens)||1, souls:(obj.marks&&obj.marks.souls)||0,
      seat:(obj.house&&obj.house.seat)||1, living:obj.person.given, age:obj.person.age,
      alive:obj.person.alive!==false, updated:Date.now()});
    await writeIndex(idx);
    const ok=await loadSlot(slot);
    if(ok){
      setBackupMsg('Restored House '+obj.surname+'. Welcome back.');
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
    const t=document.querySelector('#vTitle .sheet > div');
    const cont=document.createElement('button');
    cont.className='btn'; cont.textContent='Continue House '+most.surname;
    cont.onclick=async()=>{
      const ok=await loadSlot(most.slot);
      if(ok){ document.getElementById('vTitle').classList.remove('show'); offlineCatchUp(); setPP();
        if(P.alive){renderAll();scheduleTick();} else {renderAll();showEulogy(P);} }
    };
    t.insertBefore(cont, t.firstChild);
  }
})();

/* ============================================================
   THE LIVING SCENE — atmosphere that serves the writing.
   A whole life is one day: born at dawn, gone by night.
   A tree grows with the years; the world shifts with mood,
   season, and life-stage. Pure ambient backdrop; text rules.
   ============================================================ */
(function(){
  const cv=document.getElementById('sky'), g=cv.getContext('2d');
  let w=0,h=0,dpr=1;
  function size(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;cv.width=w*dpr;cv.height=h*dpr;g.setTransform(dpr,0,0,dpr,0,0);}
  addEventListener('resize',size); size();

  const lerp=(a,b,t)=>a+(b-a)*t;
  const mix=(c1,c2,t)=>[lerp(c1[0],c2[0],t),lerp(c1[1],c2[1],t),lerp(c1[2],c2[2],t)];
  const rgb=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a==null?1:a})`;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

  // life-arc palette: [skyTop, horizon] keyed to progress through a lifespan (~88y)
  const ARC=[
    {p:0.00, top:[42,54,96],  hor:[244,168,150]}, // birth — dawn
    {p:0.12, top:[96,142,196],hor:[255,214,168]}, // childhood — early morning
    {p:0.28, top:[86,140,200],hor:[206,228,238]}, // youth — bright morning
    {p:0.45, top:[92,150,206],hor:[214,232,240]}, // adulthood — high noon
    {p:0.62, top:[120,128,188],hor:[244,176,108]},// midlife — gold afternoon
    {p:0.80, top:[74,64,118],  hor:[210,108,92]},  // elder — dusk
    {p:0.92, top:[36,32,70],   hor:[120,72,96]},   // late elder — last light
    {p:1.00, top:[18,18,42],   hor:[40,34,66]},    // death — night
  ];
  function arcAt(p){
    let a=ARC[0],b=ARC[ARC.length-1];
    for(let i=0;i<ARC.length-1;i++){if(p>=ARC[i].p&&p<=ARC[i+1].p){a=ARC[i];b=ARC[i+1];break;}}
    const t=(p-a.p)/Math.max(1e-4,b.p-a.p);
    return {top:mix(a.top,b.top,t),hor:mix(a.hor,b.hor,t)};
  }

  // mood = momentary reaction to the latest choice (decays). flash = brief bloom.
  let mood=0, flash=0, flashWarm=0;
  window.AL_mood=()=>{
    const P=window.AL_P&&window.AL_P();
    const d=P&&P.aura&&P.aura.lastDelta;
    if(!d) return;
    const mag=Math.max(Math.abs(d.w),Math.abs(d.l));
    const dir=(d.w+d.l)>=0?1:-1;
    mood=clamp(mood + dir*Math.min(1,mag/8)*0.8, -1, 1);
    flash=1; flashWarm=(d.w+d.l)>=0?1:-1;
  };

  // a tree whose form is seeded per-life; grows with age
  let treeSeed=1, treeAge=-1, segs=[];
  function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return ()=>(s=s*16807%2147483647)/2147483647;}
  function buildTree(age, seed){
    const rand=rng(seed*7919+13);
    segs=[];
    const depth=clamp(2+Math.floor(age/10),2,7);
    const baseLen=clamp(h*0.085+age*0.4, h*0.085, h*0.20);
    (function branch(x,y,ang,len,d,phase){
      if(d>depth||len<4) return;
      const ex=x+Math.cos(ang)*len, ey=y+Math.sin(ang)*len;
      segs.push({x1:x,y1:y,x2:ex,y2:ey,d,phase, leaf:d>=depth-1});
      const spread=0.38+rand()*0.34;
      const nl=len*(0.7+rand()*0.08);
      branch(ex,ey,ang-spread,nl,d+1,phase+0.7);
      branch(ex,ey,ang+spread,nl,d+1,phase+1.3);
      if(rand()<0.28&&d<depth-2) branch(ex,ey,ang+(rand()-0.5)*0.3,nl*0.8,d+1,phase+2.1);
    })(0,0,-Math.PI/2,baseLen,0,0);
  }

  // particles: motes by day, stars by night, falling leaves in elder
  const motes=Array.from({length:46},()=>({x:Math.random(),y:Math.random(),s:Math.random()*1.6+0.4,v:Math.random()*0.4+0.1,ph:Math.random()*6.3}));

  function stageWord(age){return age<13?'childhood':age<26?'youth':age<46?'adulthood':age<66?'midlife':'old age';}
  let lastStage=null, st=document.getElementById('stageTitle');

  let t=0, last=performance.now();
  function frame(now){
    const dt=Math.min(now-last,60); last=now; t+=dt;
    const P=window.AL_P?window.AL_P():null; // resolved below
    const alive = P && P.alive!==false;
    const age = P? P.age : 0;
    const prog = clamp(age/88, 0, P&&!alive?1:0.96);
    const sky=arcAt(prog);
    // mood (momentary) decays; flash (choice bloom) decays faster
    mood*= 0.997; flash*=0.94;
    // AURA — the lasting shape of this life, normalized -1..1
    const aw = P&&P.aura? clamp(P.aura.warmth/30,-1,1):0;   // warmth of the life
    const al = P&&P.aura? clamp(P.aura.light/30,-1,1):0;     // light of the life
    const season=(Math.sin((age/4)*Math.PI*2)*0.5+0.5);
    // combined feel: cumulative aura + momentary mood
    const feel = clamp(aw*0.6 + al*0.2 + mood*0.5, -1, 1);
    const warm = clamp(0.5 + feel*0.3 + flash*flashWarm*0.2, 0, 1);

    // --- sky gradient — persistently tinted by the life's aura, flashed by the latest choice ---
    const warmPush = mix(sky.top,[255,225,180], 0.14);
    const coldPush = mix(sky.top,[58,64,108], 0.14);
    let top=mix(sky.top, feel>0?warmPush:coldPush, Math.abs(feel)*0.4);
    let hor=mix(sky.hor, feel<0?mix(sky.hor,[110,114,150],0.2):mix(sky.hor,[255,212,170],0.12), Math.abs(feel)*0.35);
    if(flash>0.01){ const fc=flashWarm>0?[255,226,170]:[120,128,168]; top=mix(top,fc,flash*0.25); hor=mix(hor,fc,flash*0.18); }
    const grd=g.createLinearGradient(0,0,0,h*0.92);
    grd.addColorStop(0,rgb(top)); grd.addColorStop(1,rgb(hor));
    g.fillStyle=grd; g.fillRect(0,0,w,h);

    const horizonY=h*0.74;

    // --- sun / moon arcs across the life ---
    const sunX=lerp(w*0.12,w*0.88,prog);
    const sunY=horizonY - Math.sin(prog*Math.PI)*h*0.5 - h*0.04;
    const isNight=prog>0.9;
    const disc=isNight?[238,236,224]:mix([255,244,214],[255,150,96],clamp((prog-0.5)/0.45,0,1));
    const glow=g.createRadialGradient(sunX,sunY,0,sunX,sunY,isNight?60:120);
    glow.addColorStop(0,rgb(disc,isNight?0.5:0.85)); glow.addColorStop(0.4,rgb(disc,0.32)); glow.addColorStop(1,rgb(disc,0));
    g.fillStyle=glow; g.beginPath(); g.arc(sunX,sunY,isNight?60:120,0,6.29); g.fill();
    g.fillStyle=rgb(disc, isNight?0.9:1); g.beginPath(); g.arc(sunX,sunY,isNight?12:16,0,6.29); g.fill();
    if(isNight){ g.fillStyle=rgb(top,0.95); g.beginPath(); g.arc(sunX+5,sunY-3,13,0,6.29); g.fill(); } // moon crescent

    // --- stars at dusk/night ---
    if(prog>0.74){
      const sa=clamp((prog-0.74)/0.2,0,1);
      for(let i=0;i<70;i++){const x=(i*89%w),y=(i*53%(horizonY*0.9));const tw=0.4+0.5*Math.sin(t*0.002+i);
        g.fillStyle=`rgba(255,250,235,${sa*tw*0.8})`; g.fillRect(x,y,1.4,1.4);}
    }

    // --- distant hills (parallax, grounding) ---
    const hillC=mix(hor, [20,18,32], 0.55);
    g.fillStyle=rgb(mix(hillC,top,0.2),0.9);
    g.beginPath(); g.moveTo(0,horizonY+18);
    for(let x=0;x<=w;x+=40){const y=horizonY+18 - Math.sin(x*0.006+1)*16 - Math.sin(x*0.013)*8; g.lineTo(x,y);} 
    g.lineTo(w,h); g.lineTo(0,h); g.fill();
    g.fillStyle=rgb(mix(hillC,[10,8,16],0.4));
    g.beginPath(); g.moveTo(0,horizonY+44);
    for(let x=0;x<=w;x+=46){const y=horizonY+44 - Math.sin(x*0.009+3)*20; g.lineTo(x,y);} 
    g.lineTo(w,h); g.lineTo(0,h); g.fill();

    // --- ground ---
    g.fillStyle=rgb(mix([26,22,18],hor,0.06)); g.fillRect(0,horizonY+58,w,h);

    // --- the tree of this life ---
    if(P && alive){
      if(treeAge!==age){ treeAge=age; if(treeSeed!==(P.gen*101+ (P.given?P.given.length:3))){} buildTree(age,treeSeed); }
      const childCount = P.rels? P.rels.filter(r=>r.kind==='child').length : 0;
      const tx=w*0.5, ty=horizonY+58;
      g.save(); g.translate(tx,ty);
      // trunk + branches with gentle wind
      for(const s of segs){
        const sway=Math.sin(t*0.0009 + s.phase + s.x2*0.01)*(s.d*0.5);
        const x1=s.x1+sway*0.3, x2=s.x2+sway;
        g.strokeStyle=rgb(mix([46,34,26],[28,20,16],s.d/8), 0.92);
        g.lineWidth=Math.max(1, (8-s.d)*1.1);
        g.beginPath(); g.moveTo(x1,s.y1); g.lineTo(x2,s.y2); g.stroke();
      }
      // foliage: appears in youth, golds in midlife, falls in old age
      let leafAlpha=0, leafC=[120,170,96];
      if(age>=10&&age<48){ leafAlpha=clamp((age-10)/8,0,1); leafC=mix([110,168,92],[150,190,110],season); }
      else if(age>=48&&age<66){ leafAlpha=clamp(1-(age-48)/22,0.25,1); leafC=mix([214,160,72],[206,108,60],(age-48)/18); }
      else if(age>=66){ leafAlpha=clamp(1-(age-66)/14,0,0.5); leafC=mix([180,110,70],[120,80,60],0.5); }
      if(leafAlpha>0.02){
        for(const s of segs){ if(!s.leaf) continue;
          const sway=Math.sin(t*0.0009+s.phase+s.x2*0.01)*(s.d*0.5);
          const x=s.x2+sway, y=s.y2;
          g.fillStyle=rgb(mix(leafC,[230,210,150],warm*0.3), leafAlpha*0.9);
          g.beginPath(); g.ellipse(x,y,7,9,sway*0.1,0,6.29); g.fill();
        }
      }
      g.restore();
      // saplings for each child, beside the tree
      for(let i=0;i<childCount;i++){
        const dir=i%2?1:-1, off=(Math.floor(i/2)+1)*42;
        const sx=tx+dir*off, sy=ty;
        g.strokeStyle=rgb([54,40,30],0.8); g.lineWidth=2;
        g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+Math.sin(t*0.001+i)*2, sy-22); g.stroke();
        g.fillStyle=rgb(mix([120,168,92],leafC,0.5),0.7);
        g.beginPath(); g.ellipse(sx,sy-24,6,8,0,0,6.29); g.fill();
      }
    }

    // --- drifting particles (warmer life => warmer, more abundant motes) ---
    const moteWarmC = feel>0? [255,236,196] : [200,206,224];
    for(let mi=0; mi<motes.length; mi++){
      const m=motes[mi];
      m.y-=m.v*dt*0.0006*(1+mood*0.4);
      if(m.y<0){m.y=1;m.x=Math.random();}
      if(prog>0.74) continue;          // night handled by stars
      if(mi/motes.length > 0.45+0.55*((feel+1)/2)) continue; // fewer motes when the life is cold/heavy
      const px=(m.x*w + Math.sin(t*0.0004+m.ph)*18), py=m.y*horizonY;
      const a=(0.16+0.22*Math.sin(t*0.002+m.ph))*(0.5+0.5*((feel+1)/2));
      g.fillStyle=rgb(moteWarmC,a);
      g.beginPath(); g.arc(px,py,m.s,0,6.29); g.fill();
    }

    // --- birds: a warm, bright life draws them; their number reads the aura at a glance ---
    if(P && alive && prog<0.82){
      const birdN = Math.round(clamp((aw*0.7 + al*0.5)*5, 0, 6)); // 0..6 with the life's warmth/light
      for(let i=0;i<birdN;i++){
        const speed=0.012+0.004*(i%3);
        const bx=((i*160) + t*speed) % (w+80) - 40;
        const by=h*(0.18+0.07*Math.sin(i*1.7)) + Math.sin(t*0.0011+i)*10;
        const flap=Math.sin(t*0.012 + i*2)*4;
        g.strokeStyle='rgba(40,34,40,0.5)'; g.lineWidth=1.6;
        g.beginPath();
        g.moveTo(bx-6, by+flap*0.4); g.quadraticCurveTo(bx, by-flap, bx+0, by-flap);
        g.moveTo(bx+6, by+flap*0.4); g.quadraticCurveTo(bx, by-flap, bx+0, by-flap);
        g.stroke();
      }
    }
    // falling leaves in elder years
    if(P && age>60){
      for(let i=0;i<10;i++){
        const fxp=(i*97 + t*0.02*(1+i%3))%w;
        const fyp=((i*53 + t*0.04*(1+i%2)))%(h*0.9);
        g.fillStyle=`rgba(210,140,80,${0.25})`;
        g.beginPath(); g.ellipse(fxp, fyp, 4,5, Math.sin(t*0.001+i),0,6.29); g.fill();
      }
    }

    // --- legibility scrims top & bottom ---
    const stop=g.createLinearGradient(0,0,0,h*0.28);
    stop.addColorStop(0,'rgba(12,9,7,0.55)'); stop.addColorStop(1,'rgba(12,9,7,0)');
    g.fillStyle=stop; g.fillRect(0,0,w,h*0.28);
    const sbot=g.createLinearGradient(0,h*0.62,0,h);
    sbot.addColorStop(0,'rgba(12,9,7,0)'); sbot.addColorStop(1,'rgba(12,9,7,0.7)');
    g.fillStyle=sbot; g.fillRect(0,h*0.62,w,h*0.38);

    // --- stage transition bloom ---
    if(P&&alive){
      const sw=stageWord(age);
      if(sw!==lastStage){
        if(lastStage!==null){ st.textContent=sw; st.classList.add('show'); setTimeout(()=>st.classList.remove('show'),2600); }
        lastStage=sw;
      }
    }

    requestAnimationFrame(frame);
  }
  // expose current person to the visual loop without touching game scope
  window.AL_P=()=>{ try{ return P; }catch(e){ return null; } };
  // re-seed tree when a new person begins
  const _start=window.AL_reseed=function(){ treeSeed=Math.floor(Math.random()*99999)+1; treeAge=-1; lastStage=null; };
  requestAnimationFrame(frame);
})();

/* ============================================================
   THE CONSTELLATION — the whole bloodline as a star-map.
   Each life is a strand of stars (one per decision); the choice
   made glows, the roads not taken sit faded beside it; generations
   connect down a lineage thread. Drag to roam, scroll/pinch to zoom.
   ============================================================ */
(function(){
  const cv=document.getElementById('starCanvas');
  if(!cv) return;
  const g=cv.getContext('2d');
  const tip=document.getElementById('starTip');
  let W=0,H=0,DPR=1, view={x:0,y:0,z:1}, stars=[], threads=[], nodes=[];
  let anim=null;

  function fit(){
    const r=cv.getBoundingClientRect();
    DPR=Math.min(devicePixelRatio||1,2);
    W=r.width; H=r.height;
    cv.width=W*DPR; cv.height=H*DPR; g.setTransform(DPR,0,0,DPR,0,0);
  }

  function gatherLives(){
    const lives=[];
    const Sref=(typeof S!=='undefined')?S:null;
    const Pref=(typeof P!=='undefined')?P:null;
    if(Sref && Sref.lineage){
      for(const a of Sref.lineage)
        lives.push({given:a.given, gen:a.gen, span:a.span, alive:false, decisions:a.decisions||[], epitaph:a.epitaph});
    }
    if(Pref)
      lives.push({given:Pref.given, gen:Pref.gen, span:Pref.age, alive:true, decisions:Pref.decisions||[], epitaph:null});
    return lives;
  }
  function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return ()=>(s=s*16807%2147483647)/2147483647;}
  function ordinalJS(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}

  function build(){
    fit();
    const lives=gatherLives();
    stars=[]; threads=[]; nodes=[];
    const colW=150;
    const x0=W*0.5 - ((lives.length-1)*colW)/2;
    let prevAnchor=null;
    lives.forEach((life,li)=>{
      const rand=rng((li+1)*7919 + (life.given?life.given.length*131:7));
      const cx=x0 + li*colW;
      const decs=life.decisions||[];
      const topY=64, botY=Math.max(190,H-50);
      nodes.push({x:cx, y:topY-30, r:3, label:life.given+(life.alive?' ·':''), alive:life.alive});
      if(prevAnchor) threads.push({a:prevAnchor, b:{x:cx,y:topY-30}});
      let lastChosen={x:cx,y:topY-30};
      decs.forEach((d,di)=>{
        const ty=decs.length>1 ? topY+(botY-topY)*(di/(decs.length-1)) : (topY+botY)/2;
        const sx=cx + (rand()-0.5)*46;
        const star={x:sx,y:ty,r:2.4+rand()*1.4,chosen:true,tone:d.tone||'obs',age:d.age,label:d.chose,alt:(d.alts&&d.alts[0])||null,ph:rand()*6.28};
        stars.push(star);
        threads.push({a:lastChosen,b:{x:sx,y:ty},walked:true});
        lastChosen={x:sx,y:ty};
        (d.alts||[]).forEach((alt,ai)=>{
          const ang=(ai%2?1:-1)*(0.5+ai*0.2);
          const gx=sx+Math.cos(ang)*42*(1+ai*0.3);
          const gy=ty+Math.abs(Math.sin(ang))*20+8;
          stars.push({x:gx,y:gy,r:1.5+rand()*0.8,chosen:false,age:d.age,label:alt,ph:rand()*6.28,from:{x:sx,y:ty}});
        });
      });
      prevAnchor=lastChosen;
    });
    const xs=stars.concat(nodes).map(s=>s.x);
    const cxAll=xs.length?(Math.min(...xs)+Math.max(...xs))/2:W/2;
    view.x=W/2-cxAll; view.y=0; view.z=1;
  }

  const TONE={joy:[150,210,160], loss:[224,138,134], obs:[244,214,150]};
  let t=0,last=performance.now();
  function draw(now){
    const dt=now-last; last=now; t+=dt;
    g.clearRect(0,0,W,H);
    const neb=g.createRadialGradient(W/2,H*0.2,0,W/2,H*0.2,H);
    neb.addColorStop(0,'rgba(60,54,110,0.20)'); neb.addColorStop(1,'rgba(10,8,18,0)');
    g.fillStyle=neb; g.fillRect(0,0,W,H);
    for(let i=0;i<60;i++){const bx=(i*83%W),by=(i*149%H);const a=0.08+0.1*Math.sin(t*0.001+i);g.fillStyle=`rgba(255,250,235,${a})`;g.fillRect(bx,by,1,1);}

    g.save(); g.translate(view.x,view.y); g.scale(view.z,view.z);
    for(const th of threads){
      g.strokeStyle=th.walked?'rgba(224,194,130,0.30)':'rgba(150,160,210,0.22)';
      g.lineWidth=(th.walked?1.2:1.4)/view.z;
      g.setLineDash(th.walked?[]:[2/view.z,4/view.z]);
      const mx=(th.a.x+th.b.x)/2, my=(th.a.y+th.b.y)/2+14;
      g.beginPath(); g.moveTo(th.a.x,th.a.y); g.quadraticCurveTo(mx,my,th.b.x,th.b.y); g.stroke();
    }
    g.setLineDash([]);
    for(const s of stars){ if(!s.chosen&&s.from){ g.strokeStyle='rgba(150,160,210,0.15)'; g.lineWidth=0.8/view.z;
      g.beginPath(); g.moveTo(s.from.x,s.from.y); g.lineTo(s.x,s.y); g.stroke(); }}
    for(const nd of nodes){
      g.strokeStyle='rgba(224,194,130,0.5)'; g.lineWidth=1.2/view.z;
      g.beginPath(); g.arc(nd.x,nd.y,4.5,0,6.29); g.stroke();
      g.fillStyle='rgba(255,236,190,0.9)'; g.beginPath(); g.arc(nd.x,nd.y,1.8,0,6.29); g.fill();
      g.fillStyle='rgba(236,225,207,0.8)'; g.font=`${Math.max(8,11/view.z)}px Fraunces, serif`; g.textAlign='center';
      g.fillText(nd.label, nd.x, nd.y-10/view.z);
    }
    for(const s of stars){
      const tw=0.6+0.4*Math.sin(t*0.002+s.ph);
      if(s.chosen){
        const c=TONE[s.tone]||TONE.obs;
        const gl=g.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r+6);
        gl.addColorStop(0,`rgba(${c[0]},${c[1]},${c[2]},${0.55*tw})`); gl.addColorStop(1,`rgba(${c[0]},${c[1]},${c[2]},0)`);
        g.fillStyle=gl; g.beginPath(); g.arc(s.x,s.y,s.r+6,0,6.29); g.fill();
        g.fillStyle=`rgba(${Math.min(255,c[0]+20)},${Math.min(255,c[1]+20)},${Math.min(255,c[2]+20)},0.92)`;
        g.beginPath(); g.arc(s.x,s.y,s.r,0,6.29); g.fill();
      } else {
        g.fillStyle=`rgba(165,175,215,${0.34*tw})`;
        g.beginPath(); g.arc(s.x,s.y,s.r,0,6.29); g.fill();
      }
    }
    g.restore();
    anim=requestAnimationFrame(draw);
  }

  let dragging=false,lastP=null;
  function toWorld(px,py){return {x:(px-view.x)/view.z,y:(py-view.y)/view.z};}
  function pickStar(px,py){const wpt=toWorld(px,py);let best=null,bd=14/view.z;
    for(const s of stars){const d=Math.hypot(s.x-wpt.x,s.y-wpt.y);if(d<bd){bd=d;best=s;}}return best;}
  function showTip(lx,ly){
    const s=pickStar(lx,ly);
    if(s){ tip.style.opacity=1; tip.style.left=(s.x*view.z+view.x)+'px'; tip.style.top=(s.y*view.z+view.y)+'px';
      tip.innerHTML=`<span class="age">age ${s.age}</span><br>${s.chosen?s.label:'<span class="alt">not taken: '+s.label+'</span>'}`+(s.chosen&&s.alt?`<div class="alt">instead of: ${s.alt}</div>`:''); }
    else tip.style.opacity=0;
  }
  function panBy(dx,dy){ view.x+=dx; view.y+=dy; }

  // ---- MOUSE (pointer events, mouse only) ----
  cv.addEventListener('pointerdown',e=>{ if(e.pointerType==='touch') return; dragging=true;lastP={x:e.clientX,y:e.clientY};try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener('pointermove',e=>{ if(e.pointerType==='touch') return;
    const r=cv.getBoundingClientRect();
    if(dragging&&lastP){panBy(e.clientX-lastP.x,e.clientY-lastP.y);lastP={x:e.clientX,y:e.clientY};tip.style.opacity=0;return;}
    showTip(e.clientX-r.left,e.clientY-r.top);
  });
  cv.addEventListener('pointerup',e=>{ if(e.pointerType==='touch') return; dragging=false;});
  cv.addEventListener('pointerleave',()=>{dragging=false;tip.style.opacity=0;});
  cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
    const f=e.deltaY<0?1.12:0.89; const nz=Math.max(0.4,Math.min(3,view.z*f));
    view.x=mx-(mx-view.x)*(nz/view.z); view.y=my-(my-view.y)*(nz/view.z); view.z=nz;},{passive:false});

  // ---- TOUCH (owns single-finger pan AND two-finger pinch; always preventDefault so the page never scrolls) ----
  let tPrev=null, pinch=null, tapStart=null;
  const dist=ts=>Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
  const mid=ts=>({x:(ts[0].clientX+ts[1].clientX)/2,y:(ts[0].clientY+ts[1].clientY)/2});
  cv.addEventListener('touchstart',e=>{
    e.preventDefault();
    if(e.touches.length===1){ tPrev={x:e.touches[0].clientX,y:e.touches[0].clientY}; tapStart={x:tPrev.x,y:tPrev.y,t:Date.now()}; pinch=null; }
    else if(e.touches.length===2){ pinch=dist(e.touches); tPrev=mid(e.touches); }
  },{passive:false});
  cv.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(e.touches.length===1 && tPrev && !pinch){
      const x=e.touches[0].clientX, y=e.touches[0].clientY;
      panBy(x-tPrev.x, y-tPrev.y);           // <-- vertical AND horizontal pan now work
      tPrev={x,y}; tip.style.opacity=0;
    } else if(e.touches.length===2 && pinch){
      const d=dist(e.touches), m=mid(e.touches), r=cv.getBoundingClientRect();
      const mx=m.x-r.left, my=m.y-r.top;
      const nz=Math.max(0.4,Math.min(3,view.z*(d/pinch)));
      view.x=mx-(mx-view.x)*(nz/view.z); view.y=my-(my-view.y)*(nz/view.z); view.z=nz;
      // also pan with the pinch centre so two fingers can drag too
      panBy(m.x-tPrev.x, m.y-tPrev.y);
      pinch=d; tPrev=m;
    }
  },{passive:false});
  cv.addEventListener('touchend',e=>{
    e.preventDefault();
    // a quick tap (no real movement) => show that star's tooltip
    if(tapStart && e.changedTouches.length){
      const c=e.changedTouches[0], moved=Math.hypot(c.clientX-tapStart.x,c.clientY-tapStart.y);
      if(moved<8 && Date.now()-tapStart.t<300){ const r=cv.getBoundingClientRect(); showTip(c.clientX-r.left,c.clientY-r.top); }
    }
    if(e.touches.length===0){ tPrev=null; pinch=null; tapStart=null; }
    else if(e.touches.length===1){ tPrev={x:e.touches[0].clientX,y:e.touches[0].clientY}; pinch=null; }
  },{passive:false});

  window.AL_buildStars=function(){ build(); if(!anim){last=performance.now();anim=requestAnimationFrame(draw);} };
  window.AL_stopStars=function(){ if(anim){cancelAnimationFrame(anim);anim=null;} };
})();
