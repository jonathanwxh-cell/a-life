/* ============================================================
   EVENT CARDS — the writing is the game.
   Card fields:
     id, w (weight), text (string or p=>string), choices[{t,h?,do}]
     stage: child(0-12) youth(13-25) adult(26-45) midlife(46-65) elder(66+)
     age:[lo,hi]  — when present, REPLACES the stage check: eligible only while
                    lo ≤ P.age ≤ hi (so a moment fits the years it belongs to).
     cond: ()=>bool — extra situation gate (means/relationships/memories). Reads
                      the global P (not the choice's arg).
     once: true   — fires at most once per life.
     cool: N      — min years before a non-once card may redraw (default 10).
   A choice's do(p) may set p.flags.peril = p.age + N to raise death odds for N
   years (earned risk; see engine.js deathRoll). Cards lean on core.js helpers;
   each text/cond/do runs at draw/click time.
   ============================================================ */

const CARDS=[
/* ---- CHILD ---- */
// The OPENER: a born-circumstance card that fires very early and reads differently for every life — by the
// era it's born into, the standing of its house, or its own nature — so childhood no longer universally opens
// on the fever. High weight + the earliest window so it reliably lands first; its text is the variety.
{id:'c_origin',stage:'child',w:8,once:true,age:[3,5],
 text:p=>{const e=(typeof S!=='undefined'&&S&&S.era)?S.era:'settled';const seat=(typeof S!=='undefined'&&S&&S.house)?(S.house.seat||0):1;
   if(e==='hard') return "{n} is small in a lean time — a house counting every coin, a table that never quite fills. The shape of want is among the first things {they} learns.";
   if(e==='plague') return "{n}'s earliest years pass under a quiet dread — a sickness in the land, doors kept shut, the grown-ups speaking low. {They} learns caution before {they} learns much else.";
   if(e==='war') return "{n} comes up in a loud time — a war somewhere past the edge of everything, the grown-ups tense with news that is never quite good. {They} learns early that the world is not safe.";
   if(e==='plenty') return "{n}'s first years fall in a fat time — money easy, the table full, the grown-ups generous and a little distracted. {They} learns the world as a place of plenty, for better and worse.";
   if(e==='turning') return "{n} is born into a time that will not hold still — the old ways and the new ones arguing in every room, the grown-ups unsure which to teach. {They} learns early that nothing is settled.";
   if(seat>=5) return "{n} is born into a house with a name — rooms that echo, a standing to be worthy of, expectations that arrive before {they} can walk. {They} learns early that {they} is meant to be someone in particular.";
   if(seat<=0) return "{n} is born with little more than the name, and not much of that — a bare room, a hard start, a world already indifferent. {They} learns early to expect little, and to reach anyway.";
   if(p.traits.indexOf('frail')>=0) return "{n} comes into the world small and unfinished, a worry from the first — the kind of child the grown-ups watch too closely. The body is a fact {they} learns before any other.";
   if(p.traits.indexOf('bright')>=0) return "{n} is quick from the very start — too quick, the grown-ups say, half proud and half uneasy. Being ahead of the room is among the first things {they} learns.";
   if(p.traits.indexOf('warm')>=0||p.traits.indexOf('tender')>=0) return "{n} is, from the first, an easy and open child — the kind that hugs strangers and weeps at small cruelties. A wide heart is the earliest thing anyone notices.";
   return "{n}'s earliest years pass the way most do — ordinary, half-remembered, a few bright fragments in a long warm blur. The world is, at first, simply everything there is.";},
 choices:[
  {t:"Take the world as it comes.",h:"",do:p=>{fx(p,{spirit:3,heart:2});logLine(freshPick(["Met the first years as they came, and took the shape of them without knowing it.","Soaked up the early world whole, the way children do, before {they} could weigh any of it.","Was, in those first years, simply and entirely a child of wherever {they} happened to land."],p),"obs");}},
  {t:"Feel, even small, it could be otherwise.",h:"",do:p=>{fx(p,{mind:4,spirit:1});remember('early_restless');logLine(freshPick(["Felt, even very small, the first flicker of a sense that things might be arranged some other way.","Carried, from the start, a small private conviction that the given world was not the only possible one.","Looked at the world {they} was handed, even as a child, as if it were a first draft."],p),"obs");}},
 ]},
{id:'c_book',stage:'child',w:3,age:[7,12],text:"A teacher leaves a book on {n}'s desk by mistake. It is far too difficult. {They} could return it, or keep it and try.",
 choices:[
  {t:"Keep it. Climb the hard pages.",h:"the mind reaches",do:p=>{fx(p,{mind:8,spirit:3});remember('child_books');logLine("Read a book {they} couldn't yet understand, and loved it anyway.");}},
  {t:"Give it back. Go out and play.",h:"the body runs",do:p=>{fx(p,{vit:6,heart:4});remember('child_outdoors');logLine(freshPick(["Spent the afternoon outside until the light went.","Gave the book back and ran, and learned the body's case for being a body.","Chose the yard over the page, that day, and most days after."],p));}},
 ]},
{id:'c_sick',stage:'child',w:1,once:true,onceDyn:true,age:[6,11],text:"A fever takes the house for a week. {n} is small in a large bed.",
 choices:[
  {t:"Let mother sit through the nights.",h:"a bond is set",do:p=>{const m=rel('mother');if(m)m.bond=clamp(m.bond+12);fx(p,{vit:-4,heart:5});logLine(["Was nursed through a fever, and remembered a cool hand for life.","Learned, lying small in a large bed, that to be cared for is its own kind of gift.","The fever passed; what stayed was the shape of a hand on a forehead, kept for decades."][rotI(p,3)],"obs");}},
  {t:"Insist on being brave alone.",h:"a habit is set",do:p=>{fx(p,{vit:-2,spirit:-3,mind:2});logLine(freshPick(["Learned early to be ill quietly.","Learned, small and feverish, to need no one — a lesson that took, and cost.","Got through the fever alone on purpose, and kept the habit of it for life."],p),"obs");}},
 ]},
{id:'c_friend',stage:'child',w:2,onceDyn:true,age:[6,12],cond:()=>!rel('friend'),text:"There is a child at the edge of the yard who never gets picked for anything.",
 choices:[
  {t:"Sit beside them.",h:"a friend, perhaps for life",do:p=>{const s=chance(0.5)?'m':'f';addRel('friend',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age);remember('kind_to_outcast');fx(p,{heart:7});logLine("Made a friend nobody else wanted — and that one stayed.","joy");}},
  {t:"Look away. It's safer.",h:"a small cowardice, kept",do:p=>{remember('looked_away');fx(p,{heart:-4,spirit:-2});logLine("Looked away from a lonely child, and the small shame of it stayed.");}},
 ]},
{id:'c_steal',stage:'child',w:2,age:[6,12],cond:()=>P.stats.means<35,text:"Fruit on a stall, and no one watching. {n}'s stomach is loud.",
 choices:[
  {t:"Take it.",h:"",do:p=>{fx(p,{means:2,spirit:-2,heart:-2});logLine("Stole, once, and the taste was guilt as much as fruit.");}},
  {t:"Walk on, hungry.",h:"",do:p=>{fx(p,{spirit:3,vit:-2});logLine("Went hungry rather than take what wasn't given.","obs");}},
 ]},
{id:'c_wonder',stage:'child',w:2,once:true,age:[5,11],text:"Something stops {n} cold in the ordinary day — the inside of a flower, the wheel of stars, the way light falls through dust. The world cracks open a little.",
 choices:[
  {t:"Chase the wonder. Ask why.",h:"a mind that won't settle",do:p=>{fx(p,{mind:7,spirit:5});remember('early_wonder');logLine(freshPick(["Found, young, the particular drug of wanting to know, and never quite got free of it.","Stopped cold before an ordinary marvel, and started, that day, the long habit of asking why.","Looked too hard at one small thing and fell, permanently, into a curiosity the years never cured."],p),"joy");}},
  {t:"Let it pass. Go back to playing.",h:"",do:p=>{fx(p,{vit:4,heart:3,spirit:2});logLine("Felt the world crack open for a moment, shrugged, and went back to the game — which is also a way of being wise.","obs");}},
 ]},
{id:'c_unfair',stage:'child',w:2,once:true,age:[6,12],text:"{n} meets it for the first time, the way every child eventually does: a punishment that wasn't earned, a thing taken that was {their}s. The unfairness of it is enormous.",
 choices:[
  {t:"Burn, and remember.",h:"a sense of justice, forged hard",do:p=>{fx(p,{spirit:3,mind:4,heart:-2});remember('took_a_stand');logLine(freshPick(["Met the world's first unfairness and did not, would not, ever quite accept it.","Learned young that the world is not fair, and decided, privately and for life, to mind.","Took the first injustice personally, and kept taking them personally, all the way up."],p),"obs");}},
  {t:"Shrug. The world is like that.",h:"an early, useful calm",do:p=>{fx(p,{spirit:4,mind:2,heart:2});logLine(freshPick(["Met the world's unfairness early and made an odd, durable peace with it, the way some children do.","Learned young that fair was not how the world worked, and let go of expecting it — a calm that lasted.","Took the first injustice with an unsettling child's shrug, and carried that even temper a long way."],p),"obs");}},
 ]},
{id:'c_dark',stage:'child',w:1,once:true,age:[5,10],text:"There is a season of it, the way there is for some children: the dark behind the door, the thing under the floor, the long bad hour before sleep. {n} is small, and the night is large.",
 choices:[
  {t:"Face the dark down alone.",h:"a hard early courage",do:p=>{fx(p,{spirit:4,vit:2,heart:-2});remember('guarded_self');logLine(freshPick(["Learned, small and alone in the dark, to be {their} own comfort — a skill {they} would lean on for life.","Stared the childhood dark down without help, and kept the slightly armoured heart it gave {them}.","Faced the night alone because there seemed no other option, and grew a quiet, early hardness."],p),"obs");}},
  {t:"Call out. Be gathered up.",h:"a bond, made in the dark",do:p=>{const m=rel('mother')||rel('father');if(m)m.bond=clamp(m.bond+10);fx(p,{heart:6,spirit:3});logLine("Called out into the childhood dark and was gathered up, and learned the deep thing: that calling out can work.","joy");}},
 ]},

/* ---- YOUTH ---- */
{id:'y_calling',stage:'youth',w:4,once:true,age:[14,22],text:p=>["The years ahead want a shape. {n} stands where the roads fork, and the choosing, for once, is really {their}s.","Everyone is suddenly asking {n} the same question — what {they} will be — and it has stopped being easy to wave off.","There comes a morning when the wide-open future narrows, kindly, to a few real roads, and {n} has to pick one to walk."][rotI(p,3)],
 choices:[
  {t:"The blade — a soldier's life.",h:"pay, and odds",do:p=>{fx(p,{vit:8,means:6,heart:-3,spirit:2});p.flags.vocation='soldier';remember('chose_soldier');logLine(freshPick(["Took up the soldier's life — the pay, the odds, the particular company of other people's danger.","Went for a soldier, and learned the trade of standing where other people would not.","Chose the blade, and the hard simple wage of being willing to be where it was worst.","Put on the coat and took the oath, and joined the old profession of organised danger.","Became a soldier — for the pay at first, and then for the strange belonging of it."],p));}},
  {t:"The book — the scholar's road.",h:"hungry now, wider door",do:p=>{fx(p,{mind:16,means:-8,spirit:2});p.flags.vocation='scholar';p.flags.scholar=1;remember('chose_study');logLine(freshPick(["Chose study, and hunger, and the long bet on {their} own head.","Took the scholar's road — the lean years, the late candles, the wager that a mind could be a living.","Chose the book over the bread, betting the hungry years would, eventually, be worth it."],p));}},
  {t:"The hands — a maker's trade.",h:"steady means, narrow door",do:p=>{fx(p,{means:14,mind:-1,vit:2});p.flags.vocation='maker';p.flags.trade=1;remember('chose_trade');logLine(freshPick(["Took up a trade and a set of tools, and chose the wage over the wager — never quite poor, never quite free.","Chose the maker's trade — a craft, a bench, a steady narrow door into a sufficient life.","Learned a trade and took up the tools of it, and traded the wide gamble for the sure small thing."],p));}},
  {t:"The road — go where the work is.",h:"free, and unrooted",do:p=>{fx(p,{mind:6,spirit:6,heart:-3,means:-3});p.flags.vocation='wanderer';remember('chose_road');remember('left_home');logLine(freshPick(["Chose no fixed thing at all — only the road, the work that turns up on it, and the freedom that costs.","Took the road for a trade — no master, no roof for long, only the next town and the next.","Chose the unrooted life, and the particular wealth and poverty of belonging nowhere in particular."],p));}},
 ]},
{id:'y_love1',stage:'youth',w:4,age:[16,25],opensLove:true,cond:()=>!rel('love'),text:p=>["Someone keeps finding reasons to be where {n} is. The reasons are getting thinner.","There is someone who keeps turning up where {n} is. {They} has noticed. And the noticing, by now, runs both ways.","Someone has started to matter — turning up, lingering, the way only a few people ever do.","The same face keeps appearing at the edges of {n}'s days, and the days have begun to arrange themselves around it.","There is a particular person now — nothing announced, nothing decided, just a quiet fact getting truer.","Someone has gone quiet for three days, and {n} is unsettled to find that the quiet has a shape.","It takes {n} a while to name it: the person whose absence, lately, has become the loudest thing in any room."][rotI(p,7)],
 choices:[
  {t:"Meet them halfway.",h:"the heart opens",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,62,p.age+ri(-2,2));fx(p,{spirit:9,heart:6});logLine(freshPick(["Started, without quite deciding to, building the days around another person.","Fell in love — the kind that quietly rearranges the furniture of a life.","Fell in love, and was surprised, as everyone is, that it was {them} this time.","Fell in love, and was aware, with a cold clarity, of everything it now made possible to lose.","Started spending time with someone, and the time arranged itself, without much drama, into a life.","Fell, with no particular grace and no real choice in it, for somebody.","Let someone in, the whole way, for the first time — and felt the terror and the relief of it together.","Found, without looking, the person the rest of the life would arrange itself around."],p),"joy");}},
  {t:"Pretend not to notice.",h:"",do:p=>{remember('unspoken_love');fx(p,{spirit:-4,mind:2});logLine(freshPick(["Let someone slip away by saying nothing, and wondered, later, often.","Saw the wanting coming and chose, deliberately, to be elsewhere — which was not quite the same as not wanting.","Said nothing. The person left. The moment closed over it like water.","Let the chance go by unanswered, and told {them}self, for years, that it had not been one."],p),"obs");}},
 ]},
{id:'y_risk',stage:'youth',w:2,age:[18,28],cond:()=>P.stats.means>20,text:"A friend has a scheme. It could double everything {n} has saved. It could take it.",
 choices:[
  {t:"Put the money in.",h:"fortune is fickle",do:p=>{if(chance(0.45)){fx(p,{means:22,spirit:6});logLine("Took a wild chance and, this time, won.","joy");}else{fx(p,{means:-18,spirit:-7});logLine("Took a wild chance and learned what losing feels like.","loss");}}},
  {t:"Keep it under the mattress.",h:"",do:p=>{fx(p,{means:2,spirit:-1});logLine("Kept {their} money safe and {their} life small.");}},
 ]},
{id:'y_leave',stage:'youth',w:2,once:true,age:[17,24],text:"The town is small and {n} can feel its edges. There is a city somewhere, indifferent and enormous.",
 choices:[
  {t:"Go. Don't look back.",h:"the world widens",do:p=>{fx(p,{mind:6,heart:-3,spirit:5,means:-4});const m=rel('mother');if(m)m.bond=clamp(m.bond-8);p.flags.left=1;remember('left_home');logLine("Left home for the city, carrying one bag and a life not yet started.");}},
  {t:"Stay. The roots are here.",h:"",do:p=>{fx(p,{heart:5,spirit:2,mind:-2});remember('stayed_home');logLine("Stayed where {they} was known, and was, mostly, content.");}},
 ]},
{id:'y_drink',stage:'youth',w:2,age:[18,26],once:true,text:"There is a season where the nights run long and the mornings cost more each time.",
 choices:[
  {t:"Burn through it.",h:"a reckless season",do:p=>{fx(p,{vit:-6,spirit:4,heart:3});p.flags.peril=p.age+5;remember('lived_reckless');logLine("Spent a reckless year {they} would not, on balance, trade away.");}},
  {t:"Pull back early.",h:"",do:p=>{fx(p,{vit:3,spirit:-1,mind:3});logLine("Left the party before it turned.");}},
 ]},

/* ---- ADULT ---- */
{id:'a_marry',stage:'adult',w:4,age:[24,58],cond:()=>rel('love')&&!P.flags.married,text:()=>{const l=rel('love');return [`${P.given} and ${l.given} have been a quiet certainty for years now. ${l.given} is waiting for a question.`,`${l.given} fell asleep first again, mid-sentence; ${P.given} lay awake deciding to ask in the morning — and then, by morning, did not.`,`The question has been in the room for years — between ${P.given} and ${l.given}, just words now, standing between here and the answer.`][rotI(P,3)];},
 choices:[
  {t:"Ask. Build a life.",h:"two become a household",do:p=>{const l=rel('love');l.kind='spouse';p.flags.married=1;fx(p,{spirit:11,heart:6});
    const lines = p.age>48
      ? ["Married "+l.given+" late, and found the lateness made the vow weigh more, not less.","Married "+l.given+" after both had long stopped expecting it, and meant it the more for that.","Married "+l.given+" with most of a life already behind them, and counted it the best thing in any of it.","Married "+l.given+" with grey already coming in, and found the promise none the lighter for it.","Married "+l.given+" long after the age for it, and was privately astonished to be so happy so late."]
      : ["Married "+l.given+". The day was small and the meaning was not.","Married "+l.given+". Nobody made a speech; the years that followed were the speech.","Married "+l.given+" on an ordinary day, and meant every word of it.","Married "+l.given+" in front of the few who mattered, and let the world find out after.","Married "+l.given+" without ceremony and without a single doubt.","Married "+l.given+", and the plain room felt larger for the promise made in it.","Married "+l.given+" young, and spent the years proving it had not been rash.","Married "+l.given+" in a hurry and a downpour, and never once wished it grander."];
    logLine(freshPick(lines,p),"joy");}},
  {t:"Not yet. Maybe never.",h:"",do:p=>{const l=rel('love');l.bond=clamp(l.bond-14);fx(p,{spirit:-6});logLine("Could not say yes, and watched a good thing strain.","loss");}},
 ]},
{id:'a_child',stage:'adult',w:4,age:[26,50],cool:5,cond:()=>(rel('spouse')||rel('love'))&&rels('child').length<3,
 text:p=>{const k=rels('child').length;if(k===0)return ["The question of a child arrives, the way it does — half decision, half tide.","It arrives sideways, the way it does — not quite a question yet, not quite not.","They have not spoken of it in a while. The silence on the subject has its own shape now."][rotI(p,3)];return k===1?"The question of another child arrives — familiar now, and still not small.":"The question of one more arrives, the way it does, and {n} already knows the weight of the answer.";},
 choices:[
  {t:"Yes. Make room in the world.",h:"the line may continue",do:p=>{haveChild();fx(p,{spirit:8,means:-6,vit:-3});}},
  {t:"No. This life, as it is.",h:"",do:p=>{const k=rels('child').length;fx(p,{spirit:2,means:4});logLine(k===0?"Chose a life without children, with clear eyes.":"Chose not to have another — the family, as it already was, was enough.","obs");}},
 ]},
{id:'a_work',stage:'adult',w:2,age:[28,60],cond:()=>(P.age-(P.flags.lastWork||-12))>=12&&(rel('spouse')||rel('love')||rels('child').length),
 text:p=>["There is a promotion, but it eats the evenings. The home gets the leftovers of {n}.","The work wants more — a better title, longer hours. The family would get whatever was left.","An offer comes: more money for more of {n}'s time. There is only ever so much of it."][rotN((p.flags.n_work_take||0)+(p.flags.n_work_refuse||0),3)],
 choices:[
  {t:"Take it. Provide.",h:"means up, hours gone",do:p=>{p.flags.lastWork=p.age;fx(p,{means:16,spirit:-3});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond-7);logLine(nth(p,'work_take')>1?freshPick(["Climbed again, and the family learned, again, to fit around the work.","Took the next rung too, and the house arranged itself, again, around {their} absence."],p):freshPick(["Worked for the family until the family barely saw {them}.","Gave the work its due, and the family what was left of {them}.","Took the better title, and paid for it in evenings.","Chose the ladder over the table, and told {them}self it was for them."],p),"obs");}},
  {t:"Refuse it. Be present.",h:"less money, more evenings",do:p=>{p.flags.lastWork=p.age;fx(p,{means:-2,spirit:6});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond+8);logLine(nth(p,'work_refuse')>1?freshPick(["Chose the table over the ladder once more, with less doubt this time.","Turned the next one down too, and was, by now, entirely at peace with the smaller name."],p):freshPick(["Turned down more money to be home for dinner.","Said no to the title, and yes to the evenings.","Chose the table, the window, the ordinary hour.","Let a smaller career buy a larger presence, and never regretted the trade."],p),"joy");}},
 ]},
{id:'a_old_friend',stage:'adult',w:2,age:[28,60],
 cond:()=>{const f=rel('friend');return f&&!f.refused&&f.bond>30&&(P.age-(f.lastAsked||-10))>=8;},
 text:()=>{const f=rel('friend');return `${f.given}, the friend from the old yard, asks {n} for money${f.lentBefore?', and it is not the first time':''}. It is not a small amount.`;},
 choices:[
  {t:"Give it. That's what it's for.",h:"",do:p=>{const f=rel('friend');const wasLent=!!(f&&f.lentBefore);if(f){f.lastAsked=p.age;f.lentBefore=true;f.bond=clamp(f.bond+6);}fx(p,{means:-12,heart:4});logLine("Helped an old friend"+(wasLent?' again':'')+", knowing how it might go.");}},
  {t:"Say no. Finally.",h:"",do:p=>{const f=rel('friend');if(f){f.refused=true;f.bond=clamp(f.bond-20);}fx(p,{means:2,spirit:-4});logLine("Said no to "+(f?f.given:'an old friend')+", and felt a long friendship cool.","loss");}},
 ]},
{id:'a_affair',stage:'adult',w:2,age:[28,55],
 cond:()=>{const s=rel('spouse');return s&&!s.affairResolved&&!held('strayed')&&s.age>6;},
 text:p=>{const s=rel('spouse');const w=s?s.given:('{their} '+p.px.spouse);
   const variants=["A door opens that "+p.given+" did not knock on. Someone new, and the old marriage feels suddenly worn.","Someone looks at "+p.given+" the way "+w+" stopped looking some years ago — and "+p.given+" notices, with a small shock, how much that look had been missed.","It would be so easy, and so quiet, and no one would ever have to know. Which is precisely what makes it dangerous."];
   // the framing matches who this person is: cold/self-aware when the spirit is low, warm and
   // self-deceiving when heart-led, clinical otherwise — not a random roll
   return variants[ p.stats.spirit<45 ? 2 : (p.stats.heart>=p.stats.mind ? 1 : 0) ];},
 choices:[
  {t:"Close the door.",h:"",do:p=>{const s=rel('spouse');if(s){s.bond=clamp(s.bond+5);s.affairResolved=true;}fx(p,{spirit:3});logLine(["Felt the pull, and chose the marriage anyway.","Stood at the open door a long moment, and then, deliberately, closed it.","Wanted to, and didn't, and told no one either half of that."][rotN(p.gen,3)]);}},
  {t:"Walk through it.",h:"a door that won't close again",do:p=>{const s=rel('spouse');if(s)s.bond=clamp(s.bond-30);remember('strayed');fx(p,{spirit:-8,heart:-5});if(s&&chance(0.5)){s.alive=false;s.kind='ex';logLine("The marriage broke on what {they} did. "+s.given+" left, and was right to.","loss");}else logLine("Strayed, and learned that a secret is a stone you carry, not one you set down.","loss");}},
 ]},

/* ---- MIDLIFE ---- */
{id:'m_parent_age',stage:'midlife',w:3,age:[40,68],
 cond:()=>{const pa=agingParent();return !!pa;},
 text:()=>{const pa=agingParent();return `${pa.given}, {n}'s ${pa.kind}, is old now, and frightened in the small hours. ${pa.px.They} needs someone, and {n} has a life of {their} own.`;},
 choices:[
  {t:"Take them in.",h:"",do:p=>{const pa=agingParent();if(pa){pa.bond=clamp(pa.bond+14);pa.caredFor=true;}fx(p,{means:-8,spirit:-2,heart:6});logLine("Made room for an aging parent, and lost some sleep and gained some grace.");}},
  {t:"Pay for their care, from afar.",h:"",do:p=>{const pa=agingParent();if(pa){pa.bond=clamp(pa.bond-4);pa.caredFor=true;}fx(p,{means:-12});logLine("Did right by a parent at a careful distance.","obs");}},
 ]},
{id:'m_child_grown',stage:'midlife',w:3,age:[40,66],cond:()=>!!grownUnblessedChild(),
 text:()=>{const c=grownUnblessedChild();return `${c.given} is grown enough to make a choice {n} thinks is a mistake. ${c.given} is asking for {n}'s blessing, not {n}'s permission.`;},
 choices:[
  {t:"Give the blessing. Let go.",h:"",do:p=>{const c=grownUnblessedChild();if(c){c.bond=clamp(c.bond+12);c.blessed=true;}fx(p,{spirit:4});logLine("Let "+(c?c.given:'{their} child')+" make "+(c?c.px.their:'their')+" own mistake, with love.","joy");}},
  {t:"Fight it. You know better.",h:"",do:p=>{const c=grownUnblessedChild();if(c){c.bond=clamp(c.bond-16);c.blessed=true;}fx(p,{spirit:-5});logLine("Fought {their} child's choice, and won the fight and lost some of the child.","loss");}},
 ]},
{id:'m_health',stage:'midlife',w:3,once:true,age:[45,68],text:"The body sends its first real letter. A scare, a doctor's careful voice, a word {n} has to look up.",
 choices:[
  {t:"Change everything. Now.",h:"health, at a cost",do:p=>{fx(p,{vit:10,spirit:-3,means:-6});logLine("Took the warning seriously — changed the work, the food, the hours — and bought {them}self years.","obs");}},
  {t:"Carry on as before.",h:"the life, unbroken",do:p=>{fx(p,{vit:-8,spirit:4,means:3});p.flags.peril=p.age+8;logLine("Heard the warning, folded the doctor's letter away, and kept the life {they} had built.","obs");}},
 ]},
{id:'m_money',stage:'midlife',w:2,age:[42,70],cond:()=>P.stats.means>50,text:"The savings have grown into something with weight. {n} could keep building, or finally use some of it to live.",
 choices:[
  {t:"Keep compounding.",h:"the estate grows",do:p=>{fx(p,{means:14,spirit:-3});logLine("Let the money keep working, and worked alongside it.");}},
  {t:"Spend it on the years left.",h:"",do:p=>{fx(p,{means:-14,spirit:12,vit:4,heart:4});logLine("Spent freely on a life {they} could actually feel.","joy");}},
 ]},

/* ---- ELDER ---- */
{id:'e_reconcile',stage:'elder',w:3,age:[64,95],cond:()=>P.rels.some(r=>r.bond<35&&(r.kind==='child'||r.kind==='friend'||r.kind==='spouse')),
 text:"There is a name {n} has not said in too long. A letter would reach them by week's end. So would the pride, if {they} let it.",
 choices:[
  {t:"Call. Say the hard thing.",h:"",do:p=>{const r=p.rels.filter(r=>r.alive&&r.bond<35)[0];if(r){r.bond=clamp(r.bond+25);logLine("Reached across years of silence to "+r.given+".","joy");}fx(p,{spirit:10});}},
  {t:"Let it lie. Too late now.",h:"",do:p=>{fx(p,{spirit:-6});logLine("Decided it was too late to mend it. It was not, but {they} would never know.","loss");}},
 ]},
{id:'e_legacy',stage:'elder',w:3,once:true,age:[66,95],
 text:p=>{const v=p.flags.vocation;
   const q = v==='soldier' ? "A young one asks {n} — who carried a blade, and the weight of it — what {they} wants remembered. The question lands harder than expected."
     : v==='scholar' ? "{n}, who spent a life in thought, is asked what {they} wants remembered. The question is harder than any {they} studied."
     : v==='maker' ? "{n}, whose hands made things that outlasted the making, is asked what {they} wants remembered. It lands harder than expected."
     : (v==='wanderer'||v==='settled') ? "{n}, who went so far and came so late to stillness, is asked what {they} wants remembered. The question lands harder than expected."
     : "{n} is asked what {they} wants remembered. The question lands harder than expected.";
   return q;},
 choices:[
  {t:"\"That I was kind.\"",h:"",do:p=>{fx(p,{heart:5,spirit:4});p.flags.legacy='kind';logLine(freshPick(["Said {they} hoped to be remembered as kind.","Asked only to be remembered as someone who had been gentle with people.","Said the thing {they} most wanted left behind was a kind of warmth, and nothing grander."],p),"obs");}},
  {t:"\"That I built something.\"",h:"",do:p=>{fx(p,{spirit:5,means:2});p.flags.legacy='built';logLine(freshPick(["Said {they} hoped to be remembered for what {they} made.","Wanted, in the end, to be remembered by the thing {they} left standing.","Asked to be measured by the work — the made thing, the built thing, the thing that stayed."],p),"obs");}},
  {t:"\"That I was here at all.\"",h:"",do:p=>{fx(p,{spirit:4,mind:2});p.flags.legacy='here';logLine(freshPick(["Said {they} only hoped to be remembered.","Asked for no monument but the plain fact of having been alive, and meant it.","Wanted only that someone, someday, would know {they} had been here, and had tried."],p),"obs");}},
 ]},
{id:'e_garden',stage:'elder',w:2,age:[68,95],once:true,text:"The days are slow and wide. {n} takes up something small — a garden, a craft, a quiet ritual.",
 choices:[
  {t:"Tend it daily.",h:"",do:p=>{fx(p,{spirit:8,vit:3});remember('made_art');logLine("Found a late, gentle happiness in small daily things.","joy");}},
  {t:"Sit in the window instead.",h:"a quieter happiness",do:p=>{fx(p,{spirit:4,mind:5});logLine("Spent the last years mostly in thought, at the window, and did not find it empty.","obs");}},
 ]},

/* ---- UNIVERSAL / ENTROPY ---- */
{id:'u_windfall',stage:'*',w:1,age:[16,95],cool:14,cond:()=>P.stats.means<80,text:p=>p.flags.sawWindfall?"Another envelope, another stroke of plain luck — the world handing {n} something unasked, again.":"An envelope, a forgotten debt repaid, a stroke of plain luck. Money {n} did not expect.",
 choices:[
  {t:"Save it.",h:"",do:p=>{p.flags.sawWindfall=1;fx(p,{means:12});logLine(nth(p,'wind_save')>1?"Folded the second windfall away with the first, and said nothing.":"Came into unexpected money and, sensibly, kept it.");}},
  {t:"Share it out.",h:"",do:p=>{p.flags.sawWindfall=1;fx(p,{means:4,heart:6,spirit:5});logLine("Came into money and gave most of it away.","joy");}},
 ]},
{id:'u_loss',stage:'*',w:1,age:[16,95],cool:16,cond:()=>P.stats.means>30,text:p=>p.flags.sawLoss?"Another bad year. Another bill that wasn't entirely {n}'s to pay, arriving all the same.":"A bad year. A failure not entirely {n}'s fault, but the bill comes to {them} all the same.",
 choices:[
  {t:"Absorb it. Rebuild.",h:"steady, and slow",do:p=>{p.flags.sawLoss=1;fx(p,{means:-16,spirit:-4,mind:3});logLine(nth(p,'loss_absorb')>1?"Took another hard loss, and knew, this time, the shape of starting over.":"Took a hard loss and started, again, from lower down.","loss");}},
  {t:"Fight to recover it.",h:"the fighting can cost more than the loss",do:p=>{p.flags.sawLoss=1;if(chance(0.5)){fx(p,{means:-4,spirit:-2,mind:2});logLine(nth(p,'loss_fight')>1?"Fought it again, older, and knew better the cost of the fighting.":"Fought the loss nearly to a standstill, and kept most of what {they} had.");}else{fx(p,{means:-16,spirit:-7});logLine("Threw good money after bad, and lost more in the fighting of it.","loss");}}},
 ]},

/* ============================================================
   CALLBACK CARDS — these reach back to who you were.
   They only appear if an earlier choice left its mark.
   ============================================================ */
{id:'cb_books_late',stage:'midlife',w:4,cond:()=>held('child_books')&&P.stats.mind>52,once:true,
 text:"{n} finds the old book on a high shelf — the one too hard for a child's hands, kept all these years.",
 choices:[
  {t:"Read it again, slowly.",h:"a circle closes",do:p=>{const bk=recall('child_books')||{};echo(bk.inherited?"Read, at last with ease, the book the family has always kept.":"Read, at last with ease, the book that began everything at age "+bk.age+".");fx(p,{spirit:9,mind:4});}},
  {t:"Pass it to a young one.",h:"",do:p=>{const c=rels('child')[0];const bk=recall('child_books')||{};echo((bk.inherited?"Gave the book the family has always kept to ":"Gave the book that shaped {them} to ")+(c?c.given:'a child')+", saying nothing of why.");if(c)c.bond=clamp(c.bond+8);fx(p,{spirit:6,heart:4});}},
 ]},
{id:'cb_outcast_return',stage:'adult',w:4,cond:()=>held('kind_to_outcast'),once:true,
 text:()=>{const f=rel('friend');return f?`The child from the yard — ${f.given}, grown — is somebody now, and has not forgotten that ${P.given} sat beside them when no one else would.`:`Someone ${P.given} helped once, years ago and asking nothing in return, is somebody now — and has not forgotten who stood with them.`;},
 choices:[
  {t:"Accept the hand up.",h:"kindness, returned with interest",do:p=>{const f=rel('friend');echo("A kindness done at "+recall('kind_to_outcast').age+" came back, decades later, as a door held open.","joy");fx(p,{means:14,spirit:8});if(f)f.bond=clamp(f.bond+10);}},
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
{id:'cb_study_pays',stage:'adult',w:4,cond:()=>held('chose_study')&&P.stats.mind>62,once:true,
 text:"The long bet on {n}'s own mind, made hungry and young, is finally being called in. Someone wants to pay for what {they} knows.",
 choices:[
  {t:"Name your worth.",h:"the gamble matures",do:p=>{const a=(recall('chose_study')||{age:p.age}).age;echo(freshPick(["The hungry years of study, begun at "+a+", at last came good.","The long bet {they} placed on {their} own head at "+a+" finally, improbably, paid.","What {they} starved for at "+a+" — the learning, the long shot — turned at last into a living.","The wager of those lean studying years, laid down at "+a+", came in at last, and handsomely."],p),"joy");fx(p,{means:20,spirit:7});}},
  {t:"Teach it cheap. Spread it wide.",h:"",do:p=>{echo(freshPick(["Chose to give knowledge away rather than sell it dear.","Set the price low on purpose, so the knowing would reach further than the money ever could.","Gave the learning away at cost, and counted the reach of it the better profit."],p),"joy");fx(p,{means:3,heart:8,spirit:6});remember('became_teacher');}},
 ]},
{id:'cb_left_home',stage:'midlife',w:3,cond:()=>held('left_home'),once:true,onceDyn:true,
 text:"Word comes from the town {n} left long ago. It is smaller than {they} remembered, and mostly gone. {They} could go back, once.",
 choices:[
  {t:"Go back. Stand where you started.",h:"",do:p=>{const a=(recall('left_home')||{age:p.age}).age;echo(freshPick(["Returned to the town {they} fled at "+a+", and found it both smaller and larger than memory.","Went back to the place {they} left at "+a+", stood in it, and felt the strange double size of an old home.","Came back to where {they} began, abandoned at "+a+", and found it had shrunk to fit a smaller life than {they} now lived."],p),"obs");fx(p,{spirit:7,heart:5});}},
  {t:"Let it stay a memory.",h:"",do:p=>{echo(freshPick(["Chose not to return, and kept the town perfect and unvisited.","Left the old place unvisited on purpose, so memory could keep it the way it never quite was.","Decided some places are better kept than seen, and never went back."],p),"obs");fx(p,{spirit:-2,mind:3});}},
 ]},
{id:'cb_unspoken',stage:'elder',w:3,cond:()=>held('unspoken_love'),once:true,
 text:"In the slow evenings, {n} thinks again of the one {they} never answered, all those years ago. {They} finds that name in a newspaper column — still living, a town away.",
 choices:[
  {t:"Write the letter, finally.",h:"",do:p=>{echo("Wrote, at last, to the love {they} let pass in silence half a life ago.","joy");fx(p,{spirit:10,heart:6});}},
  {t:"Some doors stay closed.",h:"",do:p=>{echo("Let the oldest door stay closed, on purpose, at the end.","obs");fx(p,{spirit:2});}},
 ]},
{id:'cb_strayed',stage:'elder',w:2,cond:()=>held('strayed'),once:true,
 text:"Near the end, the thing {n} did to {their} marriage sits in the room like a third person. No one else remembers. {They} does.",
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
{id:'c_animal',stage:'child',w:2,once:true,age:[6,11],text:"A stray follows {n} home. It is thin and trusting and not, by any measure, theirs to keep.",
 choices:[
  {t:"Hide it. Feed it anyway.",h:"",do:p=>{remember('kept_stray');fx(p,{heart:8,spirit:4});logLine(freshPick(["Kept a secret animal alive on stolen scraps, and loved it fiercely.","Hid a stray and fed it in secret, and learned young the weight of a thing that depends on you.","Smuggled scraps to a hidden animal, and loved it with the whole undivided heart only children manage."],p),"joy");}},
  {t:"Do the sensible thing.",h:"",do:p=>{remember('turned_stray');fx(p,{heart:-3,mind:3});logLine("Turned the stray away, because it was sensible, and felt the sense of it like a bruise.");}},
 ]},
{id:'y_mentor',stage:'youth',w:3,once:true,onceDyn:true,age:[14,22],text:"An older stranger sees something in {n} and offers to teach {them} — for nothing, just because someone once did it for them.",
 choices:[
  {t:"Show up every day.",h:"a wing to learn under",do:p=>{remember('had_mentor');fx(p,{mind:11,spirit:5});const s=chance(.5)?'m':'f';addRel('mentor',pick(s==='m'?GIVEN_M:GIVEN_F),s,66,p.age+ri(28,40));logLine("Was taken under a wing, and never forgot the debt of it.","joy");}},
  {t:"Teach yourself instead.",h:"alone, and wholly your own",do:p=>{remember('self_made');fx(p,{mind:5,spirit:2,heart:-2});logLine("Turned the teacher down, and taught {them}self — slower, lonelier, owing the result to no one.");}},
 ]},
{id:'a_fork_career',stage:'adult',w:3,once:true,age:[30,58],cond:()=>P.stats.means>40,text:"{n} can buy security — a dull, safe thing that will hold for thirty years — or risk it all on work that might mean something.",
 choices:[
  {t:"Buy the safe thing.",h:"",do:p=>{fx(p,{means:10,spirit:-5,vit:2});logLine("Chose security, and felt the walls of it close in, comfortably.");}},
  {t:"Risk it on the meaningful thing.",h:"fortune is fickle",do:p=>{if(chance(.5)){fx(p,{means:8,spirit:14,mind:5});logLine("Bet {their} security on meaning, and, this once, both held.","joy");}else{fx(p,{means:-12,spirit:6,vit:3});logLine("Bet security on meaning and lost the money, kept the meaning.","loss");}}},
 ]},
{id:'a_friend_die',stage:'adult',w:2,age:[28,55],cond:()=>rel('friend')&&rel('friend').age<60,once:true,
 text:()=>{const f=rel('friend');return `${f.given} is gone — suddenly, senselessly, far too early. ${P.given} is asked to speak at the service.`;},
 choices:[
  {t:"Speak. Say the true things.",h:"",do:p=>{const f=rel('friend');f.alive=false;echo("Buried "+f.given+" young, and said the true things aloud.","loss");fx(p,{spirit:-6,heart:6});}},
  {t:"You can't. Sit in the back.",h:"",do:p=>{const f=rel('friend');f.alive=false;logLine("Couldn't find the words for "+f.given+", and grieved in silence.","loss");fx(p,{spirit:-8});}},
 ]},
{id:'m_estrange',stage:'midlife',w:2,age:[44,66],cond:()=>rels('child').some(c=>c.age>=20),once:true,
 text:()=>{const c=rels('child').find(c=>c.age>=20);return `${c.given} has stopped calling. ${P.given} is not entirely sure what was said, or by whom, or when it hardened into this.`;},
 choices:[
  {t:"Reach out first. Swallow the pride.",h:"",do:p=>{const c=rels('child').find(c=>c.age>=20);c.bond=clamp(c.bond+18);fx(p,{spirit:5,heart:4});logLine("Made the first call to a child who'd gone quiet.","joy");}},
  {t:"Wait for them to come around.",h:"",do:p=>{const c=rels('child').find(c=>c.age>=20);c.bond=clamp(c.bond-10);fx(p,{spirit:-5});logLine("Waited for a child to call first, and the waiting became years.","loss");}},
 ]},
{id:'e_window',stage:'elder',w:3,age:[60,95],once:true,cond:()=>rels('child').length>0||P.childrenIds.length>0,text:"A grandchild — small, sticky, fearless — climbs into {n}'s lap and asks what {they} was like when {they} was little.",
 choices:[
  {t:"Tell the true story.",h:"",do:p=>{fx(p,{spirit:9,heart:7});const ls=recall('kept_stray'),lb=recall('child_books');const line=(ls&&!ls.inherited)?"told the one about the secret stray":(lb&&!lb.inherited)?"told the one about the book too hard to read":"told the truest one {they} had";logLine("Held a grandchild and "+line+".","joy");}},
  {t:"Tell the better story.",h:"",do:p=>{fx(p,{spirit:5,heart:4});logLine("Improved {their} own childhood a little, for a child who'd never know.","obs");}},
 ]},
{id:'e_last_walk',stage:'elder',w:2,age:[66,95],cond:()=>P.stats.vit<40,once:true,
 text:"{n} senses, without being told, that this may be the last good day {their} body grants. The morning is unreasonably beautiful.",
 choices:[
  {t:"Spend it with someone you love.",h:"",do:p=>{const r=P.rels.filter(x=>x.alive).sort((a,b)=>b.bond-a.bond)[0];echo("Spent a last clear day with "+(r?r.given:'the people {they} loved')+", saying little, meaning all of it.","joy");fx(p,{spirit:12,heart:6});}},
  {t:"Spend it alone, at peace.",h:"",do:p=>{echo("Took a last long walk alone, and found {they} was not afraid.","obs");fx(p,{spirit:8});}},
 ]},

/* ============================================================
   AGE-FITTED EXPANSION — every generation now lives childhood and youth,
   so these fill the early years and broaden the rest. All are age/situation
   gated. The late-love path keeps a missed youth romance from foreclosing
   the line; a couple of reckless branches set P.flags.peril (earned risk).
   ============================================================ */

/* ---- CHILD ---- */
{id:'c_sibling',stage:'child',w:3,age:[5,11],once:true,cond:()=>!rel('sibling'),
 text:"A new baby arrives in the house — small, loud, and suddenly the centre of everything. {n} is not, anymore.",
 choices:[
  {t:"Adore the little intruder.",h:"a bond for life",do:p=>{const s=chance(0.5)?'m':'f';addRel('sibling',pick(s==='m'?GIVEN_M:GIVEN_F),s,64,0);remember('doted_sibling');fx(p,{heart:6,spirit:3});logLine("Took to a new sibling like it was {their} own to raise.","joy");}},
  {t:"Resent the lost attention.",h:"",do:p=>{const s=chance(0.5)?'m':'f';addRel('sibling',pick(s==='m'?GIVEN_M:GIVEN_F),s,42,0);fx(p,{heart:-3,spirit:-2,mind:2});logLine(freshPick(["Learned early that love is divided, and counted {their} share.","Learned, at the new baby's arrival, the first hard lesson in sharing what {they} had thought was all {their} own.","Met the sibling and the arithmetic of divided love in the same week, and resented both a while."],p));}},
 ]},
{id:'c_talent',stage:'child',w:2,age:[7,12],once:true,
 text:"Something comes easily to {n} that does not come easily to others — a quickness with numbers, or a voice, or a way of running that turns heads.",
 choices:[
  {t:"Lean into it. Practise.",h:"a gift, tended",do:p=>{remember('early_talent');fx(p,{mind:6,spirit:5,vit:2});logLine("Found one thing {they} was good at, and poured the hours in.","joy");}},
  {t:"Hide it. Don't stand out.",h:"",do:p=>{fx(p,{spirit:-4,heart:2});logLine("Learned to fold a gift away rather than be looked at.");}},
 ]},
{id:'c_move',stage:'child',w:2,age:[5,11],once:true,
 text:"The family packs everything it owns into crates. There is a new town coming, and the old one — the only one {n} knows — is being left behind.",
 choices:[
  {t:"Make the new place yours.",h:"",do:p=>{fx(p,{spirit:5,heart:-2,mind:3});remember('uprooted');logLine(freshPick(["Was uprooted young, and learned how to begin again among strangers.","Moved as a child, and learned the useful, lonely art of walking into a room where no one knew {them}.","Was transplanted young, and took root again quickly, the way only children can."],p));}},
  {t:"Grieve the one you lost.",h:"",do:p=>{const f=rel('friend');if(f)f.bond=clamp(f.bond-10);fx(p,{spirit:-5,heart:4});logLine(freshPick(["Left a whole small world behind, and felt every mile of it.","Was moved away from the only place {they} knew, and grieved it like a person.","Lost the whole map of a childhood to a move, and never quite stopped missing the old streets."],p),"loss");}},
 ]},
{id:'c_grandparent',stage:'child',w:2,age:[6,12],once:true,
 text:"An old one in the family — a grandmother, a great-uncle — is suddenly, simply, gone. It is the first time {n} meets the fact of it.",
 choices:[
  {t:"Keep something of theirs.",h:"",do:p=>{remember('first_loss');fx(p,{heart:5,spirit:-2,mind:2});logLine(freshPick(["Kept a dead grandparent's small thing, and carried the first grief carefully.","Took one small object off the dead, and learned that this is how the gone stay.","Held onto a token of the first death, and felt, young, the long arithmetic of loss begin."],p),"loss");}},
  {t:"Don't really understand yet.",h:"",do:p=>{fx(p,{spirit:2});logLine(freshPick(["Was too young to hold it, and let the loss pass through like weather.","Met the first death without quite understanding it, and went back to playing.","Was spared, by being small, the full weight of it — and let the grief pass over like a cloud."],p),"obs");}},
 ]},

/* ---- YOUTH ---- */
{id:'y_job',stage:'youth',w:3,age:[15,22],
 text:"The first real work — early mornings, aching hands, a wage that is small but {n}'s own.",
 choices:[
  {t:"Take pride in it.",h:"",do:p=>{fx(p,{means:8,vit:3,spirit:3});remember('first_wage');logLine("Took the first hard job and found a plain dignity in it.","joy");}},
  {t:"Chafe against it.",h:"",do:p=>{fx(p,{means:6,spirit:-4,mind:2});logLine("Worked the first job resentfully, and felt the hours go slow for the hating of them.");}},
 ]},
{id:'y_betray',stage:'youth',w:2,age:[15,24],cond:()=>rel('friend')&&rel('friend').bond>30,
 text:()=>{const f=rel('friend');return `${f.given} — the friend ${P.given} trusted — does something small and sharp: a confidence broken, a story told that wasn't theirs to tell.`;},
 choices:[
  {t:"Forgive it. Keep the friend.",h:"",do:p=>{const f=rel('friend');if(f)f.bond=clamp(f.bond-6);fx(p,{heart:5,spirit:-2});logLine("Forgave a friend the first real wound, and kept them, warier.");}},
  {t:"Cut them loose.",h:"",do:p=>{const f=rel('friend');if(f)f.bond=clamp(f.bond-30);fx(p,{heart:-4,spirit:2,mind:2});logLine("Ended a friendship over a betrayal, cleanly, young.","loss");}},
 ]},
{id:'y_principle',stage:'youth',w:2,age:[16,25],once:true,
 text:"Something unfair is happening, and {n} is the only one in the room who seems to see it. Speaking up will cost something.",
 choices:[
  {t:"Speak. Pay for it.",h:"integrity, at a price",do:p=>{fx(p,{spirit:8,means:-5,heart:3});remember('took_a_stand');logLine("Stood up young against something unfair, and wore the cost of it.","joy");}},
  {t:"Stay quiet. Keep your place.",h:"safe, and a little smaller",do:p=>{fx(p,{spirit:-5,mind:3,means:4});logLine("Saw the wrong of it, said nothing, kept {their} place, and remembered the silence.");}},
 ]},
{id:'y_dare',stage:'youth',w:2,age:[16,23],once:true,
 text:"A dare, a height, a fast machine — a chance to feel, for a few seconds, completely alive and entirely breakable.",
 choices:[
  {t:"Do the reckless thing.",h:"alive and breakable",do:p=>{fx(p,{spirit:7,vit:-2,heart:2});p.flags.peril=p.age+4;remember('lived_reckless');logLine("Did the dangerous, beautiful, breakable thing, and the seconds of it lasted years.");}},
  {t:"Keep both feet down.",h:"",do:p=>{fx(p,{mind:3,spirit:-2});logLine("Watched the others leap, and kept {their} own feet on the ground.");}},
 ]},

/* ---- ADULT — the late road to love, and a settling life ---- */
{id:'a_meet_late',stage:'adult',w:3,age:[30,54],opensLove:true,cond:()=>!rel('love')&&!rel('spouse'),
 text:p=>["It is later than the stories say it should be. And still — across a room, across a counter, across an ordinary Tuesday — someone.","The time for this was supposed to have passed. And yet — a face, a second glance, an afternoon that refuses to end — someone.","Later than anyone plans for, it arrives anyway: across a table, across a season, across the better part of a life — someone."][rotI(p,3)],
 choices:[
  {t:"Let it begin.",h:"the heart, still open",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age+ri(-4,4));fx(p,{spirit:8,heart:6});logLine(freshPick(["Found love later than expected, and was almost embarrassed by the size of it.","Let love in late, and was astonished how little the lateness seemed to matter to it.","Came to love past the age {they} thought it was meant for, and found it meant exactly the same.","Found, well into the second half, the thing {they} had quietly filed under never.","Met someone late, and discovered the heart had been keeping a room aired the whole time.","Fell in love at an unlikely age, and stopped, gratefully, being the exception {they}'d assumed {they} was."],p),"joy");}},
  {t:"It's too late for that.",h:"",do:p=>{remember('closed_to_love');fx(p,{spirit:-3,mind:2});logLine("Decided the time for that had passed, and built a life around the decision.");}},
 ]},
{id:'a_home',stage:'adult',w:2,age:[28,50],once:true,cond:()=>P.stats.means>35,
 text:"There is enough, now, to put {n}'s name on a door — a small place, but a real one, that no landlord can take back.",
 choices:[
  {t:"Buy it. Put down roots.",h:"",do:p=>{fx(p,{means:-12,spirit:7,heart:3});remember('own_home');logLine("Bought a place of {their} own, and slept differently in it.","joy");}},
  {t:"Stay light. Stay free.",h:"",do:p=>{fx(p,{means:6,spirit:-2,mind:2});logLine("Kept {their} life portable, owing nothing to any one place.");}},
 ]},
{id:'a_role',stage:'adult',w:2,age:[30,55],once:true,
 text:"People have started to listen when {n} speaks. There is a role to be had — a small public weight, a chance to shape something beyond {them}self.",
 choices:[
  {t:"Take the weight.",h:"",do:p=>{fx(p,{spirit:5,mind:4,vit:-2});remember('public_role');const f=rel('spouse')||rels('child')[0];if(f)f.bond=clamp(f.bond-5);logLine("Took on a public role, and gave it hours the family quietly missed.");}},
  {t:"Keep your life your own.",h:"",do:p=>{fx(p,{heart:4,spirit:2});logLine("Turned down the larger stage to keep a smaller, truer life.");}},
 ]},
{id:'a_sibling_drift',stage:'adult',w:2,age:[30,56],cond:()=>rel('sibling'),
 text:()=>{const s=rel('sibling');return `${s.given}, ${P.given}'s ${s.sex==='m'?'brother':'sister'}, has drifted to the far edge of life — same blood, separate orbits now.`;},
 choices:[
  {t:"Close the distance.",h:"",do:p=>{const s=rel('sibling');if(s)s.bond=clamp(s.bond+16);fx(p,{heart:5,spirit:3});logLine("Reached back across the years to a sibling, before it was too late to.","joy");}},
  {t:"Let the distance stand.",h:"",do:p=>{const s=rel('sibling');if(s)s.bond=clamp(s.bond-8);fx(p,{spirit:-3,mind:2});logLine("Let a sibling become someone {they} used to know.","obs");}},
 ]},

/* ---- MIDLIFE — turning, passing on, second chances ---- */
{id:'m_reinvent',stage:'midlife',w:2,age:[46,62],once:true,
 text:"It is not too late, exactly — but it is nearly too late — to become someone other than who {n} has spent thirty years becoming.",
 choices:[
  {t:"Change everything anyway.",h:"a late beginning",do:p=>{fx(p,{means:-10,spirit:11,vit:3,mind:4});remember('reinvented');logLine("Tore up the map in midlife and started, improbably, again.","joy");}},
  {t:"Honour the life you built.",h:"",do:p=>{fx(p,{means:6,spirit:-2});logLine("Looked at the whole strange edifice of {their} life and chose to keep it.");}},
 ]},
{id:'m_mentor_young',stage:'midlife',w:2,age:[48,65],cond:()=>P.stats.mind>55,
 text:"A young one turns up with more hunger than skill, and looks at {n} the way {n} once looked at someone who knew things.",
 choices:[
  {t:"Pour everything into them.",h:"",do:p=>{remember('became_teacher');fx(p,{heart:6,spirit:6,mind:-1});logLine("Spent {their} late skill on a young one, and felt it multiply rather than drain.","joy");}},
  {t:"Keep what you know.",h:"",do:p=>{fx(p,{mind:3,spirit:-2});logLine("Held {their} hard-won knowledge close, and watched the young one go elsewhere.");}},
 ]},
{id:'m_old_flame',stage:'midlife',w:4,age:[46,60],once:true,cond:()=>held('unspoken_love')&&!rel('love')&&!rel('spouse'),
 text:"The one {n} never answered, all those years ago, is suddenly here again — older, freer, and looking at {n} with the same old question.",
 choices:[
  {t:"Answer it, finally.",h:"the second chance",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,66,p.age+ri(-3,3));echo("Answered, in midlife, the question {they} fled at "+recall('unspoken_love').age+".","joy");fx(p,{spirit:10,heart:7});P.mem.unspoken_love=null;}},
  {t:"Let it stay unanswered.",h:"",do:p=>{echo("Let the oldest door close a second time, gently, on purpose.","obs");fx(p,{spirit:-2,mind:2});}},
 ]},

/* ---- ELDER — handing on, last journeys, peace ---- */
{id:'e_craft',stage:'elder',w:2,age:[70,90],once:true,cond:()=>P.stats.mind>50||held('became_teacher'),
 text:"In {n}'s hands is a craft, a trade, a way of doing some small thing well — and the hands are slower now. It could go on, or go with {them}.",
 choices:[
  {t:"Teach it to someone young.",h:"",do:p=>{remember('became_teacher');fx(p,{heart:6,spirit:7});logLine("Handed a lifetime's craft to younger hands, and so refused to take it underground.","joy");}},
  {t:"Let it retire with you.",h:"",do:p=>{fx(p,{spirit:-2,mind:2});logLine("Kept {their} craft to the end, and let it end with {them}.","obs");}},
 ]},
{id:'e_journey',stage:'elder',w:2,age:[72,86],once:true,cond:()=>P.stats.vit>32,
 text:"There is a place {n} has meant, {their} whole life, to stand in just once. The body can still, barely, be asked to go.",
 choices:[
  {t:"Go. While you still can.",h:"",do:p=>{fx(p,{spirit:12,vit:-4,means:-8,mind:3});remember('last_journey');logLine("Made the long-deferred journey at last, and stood where {they} had always meant to.","joy");}},
  {t:"Let the wanting be enough.",h:"",do:p=>{fx(p,{spirit:2,mind:4});logLine("Never made the journey, and kept the place perfect in the mind instead.","obs");}},
 ]},
{id:'e_peace',stage:'elder',w:2,age:[70,95],once:true,
 text:"It is close now, and {n} can feel the shape of it. There is a way to meet it, and the choosing of that way is nearly the last choice left.",
 choices:[
  {t:"Set things in order. Say goodbye.",h:"",do:p=>{fx(p,{spirit:10,heart:5});remember('made_peace');const r=P.rels.filter(x=>x.alive).sort((a,b)=>b.bond-a.bond)[0];if(r)r.bond=clamp(r.bond+10);logLine("Met the end with {their} affairs in order and {their} goodbyes said.","joy");}},
  {t:"Rage against it.",h:"unquiet, to the end",do:p=>{fx(p,{vit:2,spirit:-4,heart:-2});logLine("Refused to go quietly, and burned at the dying of it.","loss");}},
 ]},
{id:'e_body',stage:'elder',w:4,age:[58,92],once:true,cond:()=>P.stats.vit<40,
 text:"The body has started keeping different hours than {n} does — a stiffness on waking, a slowness on the stairs, a new arithmetic to the days.",
 choices:[
  {t:"Slow down. Listen to it.",h:"the body, heeded",do:p=>{fx(p,{vit:6,spirit:-2,mind:2});logLine("Began, late, to move at the body's pace, and found a little more room inside the days.","obs");}},
  {t:"Push on regardless.",h:"the body, defied",do:p=>{fx(p,{vit:-6,spirit:5});p.flags.peril=p.age+6;remember('lived_reckless');logLine("Drove the body on past what it asked, paid for it, and would not have chosen otherwise.","obs");}},
 ]},

/* ============================================================
   AGENCY & THE HOUSE — moments where the player STEERS: what to set
   aside for the heir (a real lever across generations), a reckoning
   the family can fall on, and cards that only a house of a certain
   standing or reputation will ever meet. These make the dynasty layer
   gate real content and give a life decisions worth planning around.
   ============================================================ */

/* ---- THE BEQUEST — choose what the next life starts from (read by succeed()) ---- */
{id:'e_bequest',stage:'elder',w:5,once:true,age:[60,95],cond:()=>rels('child').length>0||P.childrenIds.length>0,
 text:"There is less ahead now than behind, and {n} finds {them}self thinking past {their} own end — to the one who will carry the name. There is still time to set aside one thing, deliberately, for them.",
 choices:[
  {t:"Everything I know.",h:"a sharper mind to begin from",do:p=>{p.flags.bequest='mind';remember('bequeathed');fx(p,{mind:2,spirit:4});logLine("Spent {their} last good years pouring everything {they} knew into the one who would come after.","joy");}},
  {t:"Every coin I can spare.",h:"a softer place to land",do:p=>{p.flags.bequest='means';remember('bequeathed');fx(p,{means:-6,spirit:3});logLine("Set aside what {they} could, so the next life would not begin as hungry as {their} own had.","obs");}},
  {t:"The stories, and the warmth.",h:"a fuller heart to start with",do:p=>{p.flags.bequest='heart';remember('bequeathed');fx(p,{heart:4,spirit:5});logLine("Gave the years {they} had left to telling the next one exactly where they came from.","joy");}},
  {t:"Nothing but their own freedom.",h:"no weight, no debt, no map",do:p=>{p.flags.bequest='free';remember('bequeathed');fx(p,{spirit:6});logLine("Decided the kindest inheritance was none at all, and let the next life be wholly its own.","obs");}},
 ]},

/* ---- THE RECKONING — earned failure pressure; updateHouse() reads facedReckoning ---- */
{id:'x_reckoning',stage:'*',w:2,age:[30,80],cool:26,cond:()=>S.house&&S.house.seat>=3&&!P.flags.facedReckoning,
 text:p=>["A hard season comes for the whole house at once — a debt called in, a name questioned, a year that takes far more than it gives. What the family has put by, and who it can call on, is suddenly the only thing that matters.","Trouble arrives the way it does for houses with something to lose — a creditor, a rumour, a ruinous run of luck — and tests, all at once, how solid the ground beneath the name really is."][rotN(p.gen,2)],
 choices:[
  {t:"Meet it head-on. Spend what it takes.",h:"the house holds — but a thin house pays dearly",do:p=>{p.flags.facedReckoning='held';const ready=p.stats.means>45||p.stats.spirit>62;if(ready){fx(p,{means:-15,spirit:-2});logLine("Met the hard season head-on and, at real cost, kept the house standing.","obs");}else{fx(p,{means:-22,spirit:-9});logLine("Met the hard season with little behind {them}, and kept the house standing only by paying ruinously for it.","obs");}}},
  {t:"Protect your own. Let the name take the hit.",h:"you keep your footing; the house loses a step",do:p=>{fx(p,{means:6,spirit:-5});p.flags.facedReckoning='fell';remember('chose_self_over_house');logLine("Shielded {them}self, and let the family's standing take the blow instead.","loss");}},
 ]},

/* ---- SEAT-GATED — only a house of a certain standing meets these ---- */
{id:'s_great_burden',stage:'*',w:2,age:[32,70],cool:20,cond:()=>S.house&&S.house.seat>=4,
 text:"The name opens every door now — and behind every door are people who want something for it. {n} can feel the particular weight of being expected.",
 choices:[
  {t:"Wear the name. Play the part.",h:"",do:p=>{fx(p,{means:8,spirit:-4,vit:-2});p.flags.lastWork=p.age;logLine("Carried the great name the way it asked to be carried, and felt exactly what it cost to.","obs");}},
  {t:"Refuse the performance.",h:"",do:p=>{fx(p,{spirit:7,means:-6});remember('refused_the_name');logLine("Declined to perform the family's importance, and breathed easier for the refusing.","joy");}},
 ]},
{id:'s_from_nothing',stage:'adult',w:3,once:true,onceDyn:true,age:[26,54],cond:()=>S.house&&S.house.seat<=1,
 text:"There is nothing behind {n} — no name that means a thing, no floor to fall back to. Only whatever {they} can make with {their} own two hands, starting now.",
 choices:[
  {t:"Build, brick by brick.",h:"slow, and wholly yours",do:p=>{fx(p,{means:10,vit:-3,spirit:2});remember('self_made');logLine("Began from nothing, and laid the first course of something, alone.","obs");}},
  {t:"Find others to climb with.",h:"",do:p=>{fx(p,{means:5,heart:5,spirit:3});logLine("Threw {their} lot in with others, and rose, slowly, alongside them.","joy");}},
 ]},

/* ---- REPUTE-GATED — the family's character, reaching forward into a life ---- */
{id:'r_scholar_door',stage:'adult',w:3,age:[24,55],cond:()=>S.house&&reputeTop(S.house)==='scholarly',
 text:"The family's learned name carries — and a door opens that opens only for such names: a chance to add to what the house already knows.",
 choices:[
  {t:"Walk through it.",h:"",do:p=>{fx(p,{mind:9,means:6,spirit:3});remember('set_scholar_rep');logLine("Took up the family's learning, and carried it a little further down the years.","joy");}},
  {t:"Choose a life of your own.",h:"",do:p=>{fx(p,{spirit:4,heart:3});remember('broke_with_house');logLine("Set down the family's books to live a life that was not about them.","obs");}},
 ]},
{id:'r_family_shadow',stage:'*',w:3,age:[22,72],cool:18,cond:()=>S.house&&((S.house.secret&&!S.house.secret.known)||reputeTop(S.house)==='tainted'),
 text:"The family's old shadow reaches {n} too — a name said with a certain pause, a story half-known, a thing the house simply does not discuss. It is {their} inheritance as much as anything else.",
 choices:[
  {t:"Carry it quietly, like the others.",h:"",do:p=>{fx(p,{spirit:-4,mind:2});logLine("Took up the family's silence, and wore it without complaint.","obs");}},
  {t:"Refuse to be marked by it.",h:"",do:p=>{fx(p,{spirit:6,heart:-2});remember('broke_with_house');logLine("Refused to carry a shame {they} had not earned, and said as much, aloud.","joy");}},
 ]},

/* ---- VARIETY — broadening the adult/midlife band the readers found thin ---- */
{id:'a_neighbour',stage:'adult',w:2,age:[28,58],cool:14,
 text:"Next door, a household is quietly coming apart — a job lost, a long illness, the small daily signs of it. It would be easy not to notice.",
 choices:[
  {t:"Step in. Lend a hand.",h:"",do:p=>{fx(p,{heart:6,means:-5,spirit:3});remember('kind_to_outcast');logLine("Carried a neighbour through a bad stretch, and asked for nothing back.","joy");}},
  {t:"Mind your own.",h:"",do:p=>{fx(p,{mind:2,heart:-2});logLine("Saw the trouble next door, and kept to {their} own side of the wall.");}},
 ]},
{id:'a_small_lie',stage:'adult',w:2,age:[28,56],cool:16,cond:()=>P.stats.means>30,
 text:"A small dishonesty would smooth everything — a figure adjusted, a thing left unsaid. No one would know, and it would pay.",
 choices:[
  {t:"Tell it. Take the gain.",h:"",do:p=>{fx(p,{means:10,spirit:-5,heart:-3});remember('cut_a_corner');logLine("Took the easy, dishonest gain, and kept the small private knowledge of it.");}},
  {t:"Keep your hands clean.",h:"",do:p=>{fx(p,{means:-3,spirit:5});remember('stayed_straight');logLine("Turned down a clean-looking dishonest gain, and slept the better for it.","obs");}},
 ]},
{id:'m_peer_dies',stage:'midlife',w:2,age:[46,64],once:true,
 text:"Someone {n}'s own age — not close, but a fixed point all the same — is suddenly gone. The arithmetic of {their} own remaining years rearranges itself, quietly.",
 choices:[
  {t:"Let it change how you live.",h:"",do:p=>{fx(p,{spirit:4,vit:3,means:-2});remember('memento_mori');logLine("Took a peer's early death as a letter addressed, also, to {them}self — and answered it.","obs");}},
  {t:"Put it out of your mind.",h:"",do:p=>{fx(p,{mind:2,spirit:-2});logLine("Filed the death away with the others, and did not open the file again.");}},
 ]},
{id:'a_belief',stage:'adult',w:2,age:[26,55],once:true,
 text:"A question {n} had long set aside — about what, if anything, holds the whole thing up — comes back in a quiet hour, asking to be answered, or finally let go.",
 choices:[
  {t:"Make room for the faith.",h:"",do:p=>{fx(p,{spirit:7,heart:3});remember('found_faith');logLine("Made a quiet peace with something larger than {them}self, and carried it lightly.","joy");}},
  {t:"Let the question rest unanswered.",h:"",do:p=>{fx(p,{mind:4,spirit:1});logLine("Left the largest question open, and found {they} could live there comfortably enough.","obs");}},
 ]},
{id:'m_rival',stage:'midlife',w:2,age:[44,64],cond:()=>P.stats.means>40,
 text:"Someone {n} once quietly measured {them}self against has pulled clearly ahead — more money, more name, more of whatever {they} had been counting.",
 choices:[
  {t:"Make peace with the difference.",h:"",do:p=>{fx(p,{spirit:6,heart:2});logLine("Stopped running a race no one else had entered {them} in.","joy");}},
  {t:"Let it drive you harder.",h:"",do:p=>{fx(p,{means:10,spirit:-4,vit:-2});p.flags.lastWork=p.age;remember('driven');logLine("Took an old rival's success as fuel, and burned it for the heat.","obs");}},
 ]},

/* ---- NEW CALLBACKS — the reach-back, extended to more of the life ---- */
{id:'cb_principle',stage:'midlife',w:3,cond:()=>held('took_a_stand'),once:true,
 text:"The thing {n} stood up for once, young and at a cost, comes round again — older now, more tangled, asking the same question with higher stakes.",
 choices:[
  {t:"Stand again. You know the price.",h:"",do:p=>{echo(freshPick(["Paid, a second time and more dearly, for a principle {they} would not set down.","Took the old stand again, older and clearer-eyed, and paid the higher price without flinching.","Fought the same fight twice in one life, and was, the second time, entirely sure."],p),"joy");fx(p,{spirit:7,means:-6,heart:3});}},
  {t:"You've paid enough.",h:"",do:p=>{echo(freshPick(["Let the old fight pass to someone younger, and tried not to call it surrender.","Set down a fight {they} had carried for decades, and called it, with some effort, wisdom.","Handed the old cause to the next ones and stepped back, and mostly made peace with stepping back."],p),"obs");fx(p,{spirit:-3,mind:2});}},
 ]},
{id:'cb_home_keep',stage:'elder',w:2,cond:()=>held('own_home'),once:true,
 text:"The place {n} bought all those years ago is old now too. It could pass to someone, or be quietly let go.",
 choices:[
  {t:"Keep it in the family.",h:"",do:p=>{const c=rels('child')[0];echo("Made sure the house {they} bought at "+(recall('own_home').age)+" would hold someone after {them}.","joy");if(c)c.bond=clamp(c.bond+8);fx(p,{spirit:5,heart:4});}},
  {t:"Let it go to strangers.",h:"",do:p=>{echo("Let the old house pass to people {they} would never meet, and felt the loosening as a kind of peace.","obs");fx(p,{spirit:3,means:6});}},
 ]},

/* ============================================================
   STEERING THE HOUSE — deliberate levers for a player who wants to PLAY the
   dynasty, not only witness it: spend yourself to lift the name; choose what
   the family becomes known for; the particular troubles only a great house
   meets; and moments that only a certain inherited nature will face.
   ============================================================ */

/* ---- invest in the name: a means-sink that deliberately lifts the seat (plan reckonings around it) ---- */
{id:'m_invest_name',stage:'midlife',w:3,age:[42,64],cool:14,cond:()=>S.house&&S.house.seat>=2&&S.house.seat<6&&P.stats.means>40,
 text:"There is a way to spend — money, and years — on the family's standing itself: a patronage, a marriage well made, a public work with the name carved into it. It would cost {n} personally; the house would carry it forward long after.",
 choices:[
  {t:"Invest in the name.",h:"spend yourself to lift the house",do:p=>{fx(p,{means:-17,spirit:-3,vit:-2});p.flags.lastWork=p.age;remember('built_the_name');const rose=Math.random()<0.62;if(S.house&&rose)S.house.seat=Math.min(6,S.house.seat+1);logLine(rose?"Spent {them}self down to lift the family's standing, and watched the name climb a rung.":"Spent {them}self down on the family's standing, and held the name where it stood — no higher, but no lower for the trying.","obs");}},
  {t:"Keep what's yours.",h:"",do:p=>{fx(p,{means:8,spirit:2});logLine("Kept {their} money and {their} years for {them}self, and let the name be only what it was.");}},
 ]},

/* ---- choose the family's character: a direct, 3-way reputation-steering decision ---- */
{id:'a_make_name',stage:'adult',w:2,age:[30,52],once:true,cond:()=>S.house,
 text:"{n} is at the age where a reputation sets, the way a face does. There is still a little say in which one — in what the family comes to be known for, through {them}.",
 choices:[
  {t:"Be known as learned.",h:"toward a scholarly house",do:p=>{fx(p,{mind:9,spirit:2});remember('set_scholar_rep');logLine("Set out, deliberately, to be the one the family came to for answers.","obs");}},
  {t:"Be known as hard to cross.",h:"toward a hard-dealing house",do:p=>{fx(p,{means:9,heart:-3});remember('cut_a_corner');logLine("Set out, deliberately, to be the one no one tried twice.","obs");}},
  {t:"Be known as open-handed.",h:"toward a generous house",do:p=>{fx(p,{heart:7,means:-5,spirit:3});remember('kind_to_outcast');logLine("Set out, deliberately, to be the one the door was always open at.","joy");}},
 ]},

/* ---- the particular troubles of an established house (seat-gated high) ---- */
{id:'s_inheritance_dispute',stage:'*',w:2,age:[34,66],cool:20,cond:()=>S.house&&S.house.seat>=3,
 text:"With a great name comes a great quarrel: someone within the family wants more of it than {n} thinks is rightly theirs. The lawyers, or the peace — and one of them will cost.",
 choices:[
  {t:"Hold the line. Fight for it.",h:"",do:p=>{if(chance(0.6)){fx(p,{means:8,spirit:-4});logLine("Fought {their} own blood for the estate, and kept it whole.","obs");}else{fx(p,{means:-12,spirit:-6,heart:-3});remember('chose_self_over_house');logLine("Fought {their} own blood for the estate, and it cost more than it kept.","loss");}}},
  {t:"Give them their share. Keep the peace.",h:"",do:p=>{fx(p,{means:-10,heart:5,spirit:3});logLine("Gave way to keep the family whole, and counted the peace well worth the price.","joy");}},
 ]},
{id:'s_patronage',stage:'*',w:2,age:[32,64],cool:18,cond:()=>S.house&&S.house.seat>=4,
 text:"People come to a great house for help now — a young talent needing a patron, a cause needing a name behind it. {n} can lift someone who has nothing, or stay unburdened by them.",
 choices:[
  {t:"Lift them. Spend the name.",h:"",do:p=>{fx(p,{means:-10,heart:6,spirit:4});remember('kind_to_outcast');remember('became_teacher');logLine("Put the family's whole weight behind someone who had none, and asked for nothing back.","joy");}},
  {t:"Stay unburdened.",h:"",do:p=>{fx(p,{means:4,spirit:-2});logLine("Kept the family's weight for the family, and let the supplicants pass on by.");}},
 ]},

/* ---- inherited NATURE finally gates content: a few trait-specific moments ---- */
{id:'t_bookish',stage:'midlife',w:2,age:[42,64],once:true,cond:()=>P.traits.includes('bookish'),
 text:"For all the reading, there is a thing the books never taught {n} — and life has just set it on the table, plainly, where no page can be turned to avoid it.",
 choices:[
  {t:"Close the book. Be in the room.",h:"",do:p=>{fx(p,{heart:7,spirit:4,mind:-1});remember('looked_up');logLine("Set down what {they} knew to attend to what {they} didn't, and was the larger for it.","joy");}},
  {t:"Retreat to what you know.",h:"",do:p=>{fx(p,{mind:5,heart:-3,spirit:-2});logLine(freshPick(["Met the one unteachable thing by reaching, again, for a book.","Answered the unanswerable the only way {they} knew — by reading more about it, and feeling no better.","Retreated from the thing no book could fix into the books anyway, because it was where {they} lived."],p));}},
 ]},
{id:'t_guarded',stage:'adult',w:2,age:[28,54],once:true,cond:()=>P.traits.includes('guarded'),
 text:"Someone has gotten close enough to ask {n} the question the walls are up against: what is it {they} is so carefully never saying?",
 choices:[
  {t:"Let them in. Just this once.",h:"",do:p=>{fx(p,{heart:8,spirit:5});remember('let_in');logLine(freshPick(["Opened a door {they} usually kept locked, and was not, in the end, sorry for it.","Let one person all the way in, against long habit, and found the room behind the wall still worked.","Said the unsaid thing to one person, once, and survived the saying of it better than {they}'d feared."],p),"joy");}},
  {t:"Keep the wall.",h:"",do:p=>{fx(p,{spirit:-3,mind:2});logLine(freshPick(["Kept the wall exactly where it had always stood, and watched someone give up trying.","Held the question off one more time, and felt the particular cost of being well-defended.","Kept the door shut, as ever, and told {them}self the solitude was a preference."],p),"obs");}},
 ]},
{id:'t_restless',stage:'youth',w:2,age:[17,28],once:true,cond:()=>P.traits.includes('restless'),
 text:"The old restlessness is loud in {n} this year — the certainty that the real life is happening somewhere {they} is not.",
 choices:[
  {t:"Chase it. Go.",h:"",do:p=>{fx(p,{spirit:6,mind:4,means:-4,heart:-2});p.flags.peril=p.age+3;remember('left_home');logLine("Followed the restlessness clean over the horizon, and let it cost what it cost.","obs");}},
  {t:"Sit with it. Let it pass.",h:"",do:p=>{fx(p,{spirit:-2,mind:5,heart:3});logLine("Learned, young, to sit still inside the wanting, and let the worst of it pass through.","obs");}},
 ]},

/* ---- a reliable creative path (so an 'artistic' house is reachable, not an accident) ---- */
{id:'a_make_thing',stage:'adult',w:2,age:[26,58],once:true,
 text:"There is a thing {n} could make — write it, build it, paint it, play it — that no one is asking for, that will pay nothing, and that will exist because {they} made it, or not at all.",
 choices:[
  {t:"Make it. Whether or not it matters.",h:"",do:p=>{fx(p,{spirit:7,means:-3,mind:3});remember('made_art');logLine("Made a thing the world had not asked for, and was the more {them}self for the making.","joy");}},
  {t:"Spend the hours on something useful.",h:"",do:p=>{fx(p,{means:5,spirit:-2});logLine("Set the unasked-for thing aside, and did the useful work instead.");}},
 ]},

/* ---- callbacks for the harder paths, so ruthless / reckless lives play differently downstream ---- */
{id:'cb_corner',stage:'midlife',w:3,once:true,cond:()=>held('cut_a_corner')&&!held('stayed_straight'),
 text:"The corner {n} cut once, years ago, comes back wearing a larger face — the same quiet dishonesty, more at stake, and the same certainty that no one need ever know.",
 choices:[
  {t:"Cut it again. You know how.",h:"",do:p=>{echo("Did, a second time and for far more, the quiet dishonest thing — and felt almost nothing, which was its own kind of answer.","loss");fx(p,{means:14,heart:-4,spirit:-3});remember('cut_a_corner');}},
  {t:"Not this time.",h:"",do:p=>{echo("Stood, this once, on the side of the thing {they} had cut past before — and was surprised how much lighter it left {them}.","joy");fx(p,{spirit:7,heart:4});remember('stayed_straight');}},
 ]},
{id:'cb_reckless',stage:'elder',w:2,once:true,onceDyn:true,cond:()=>held('lived_reckless'),
 text:"A young one in the family lives the way {n} once did — fast, and breakable, and sure of {their} own luck. {n}, of all people, knows exactly where that road runs.",
 choices:[
  {t:"Tell them to slow down.",h:"",do:p=>{echo(freshPick(["Counselled the caution {they} had never once managed {them}self — and meant every word of it.","Told a young one to be careful in a voice {they} had spent a whole life ignoring, and hoped it carried better than it had.","Handed on the warning {they} had been given and waved away at that age, knowing it would likely be waved away again."],p),"obs");fx(p,{mind:3,heart:3});}},
  {t:"Tell them it was worth it.",h:"",do:p=>{echo(freshPick(["Told a reckless young one the truth: that {they} would not, on balance, give back a single one of those breakable years.","Said the unwise thing, and the true one — that the wild years had been worth their cost, and then some.","Refused to lie to the young about the fire {they}'d played with, and admitted, plainly, that {they}'d do it again."],p),"joy");fx(p,{spirit:6,heart:2});}},
 ]},

/* ============================================================
   COMPETING GOODS — moments with no clean answer, where both roads are
   a kind of virtue and the player cannot be sure which was right. (The
   binary 'open vs. closed' grammar, broken on purpose.)
   ============================================================ */
{id:'x_honest_or_kind',stage:'*',w:1,onceDyn:true,age:[26,74],cool:22,cond:()=>P.rels.some(r=>r.alive&&r.bond>45&&r.kind!=='ex'),
 text:"Someone {n} loves asks a direct question, and the true answer would wound them for no good {n} can see. A kindness and an honesty — and they will not both fit in the room.",
 choices:[
  {t:"Tell the truth. They deserve it.",h:"honesty over comfort",do:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>45)[0];if(r)r.bond=clamp(r.bond-6);fx(p,{spirit:2,mind:2});logLine("Told someone {they} loved a true thing that hurt, because the truth seemed to {them} the larger love.","obs");}},
  {t:"Spare them. Some truths cost more than they're worth.",h:"mercy over candour",do:p=>{fx(p,{heart:4,spirit:-1});remember('a_kind_silence');logLine("Held a true thing back to spare someone pain, and was never afterward quite sure {they} had been right.","obs");}},
 ]},
{id:'x_loyalty_truth',stage:'adult',w:3,age:[28,60],once:true,cond:()=>rel('friend')||rel('sibling'),
 text:"{n} knows a thing about someone {they} loves — a thing that others are genuinely owed. Loyalty pulls one way and honesty the other, and both have always been {n}'s virtues.",
 choices:[
  {t:"Keep faith with your own.",h:"loyalty",do:p=>{const r=rel('friend')||rel('sibling');if(r)r.bond=clamp(r.bond+8);fx(p,{heart:3,spirit:-2});remember('chose_loyalty');logLine("Kept faith with {their} own, and carried what that cost others quietly, alone.","obs");}},
  {t:"Tell the truth that's owed.",h:"honesty",do:p=>{const r=rel('friend')||rel('sibling');if(r)r.bond=clamp(r.bond-14);fx(p,{spirit:3,mind:2});logLine("Told a truth that was owed, and lost some of someone {they} loved in the telling of it.","loss");}},
 ]},
{id:'x_dream_or_duty',stage:'adult',w:3,age:[30,52],once:true,cond:()=>rels('child').length||rel('spouse'),
 text:"The thing {n} has always meant to do with {their} one life has finally come within reach — and taking it would ask real sacrifice of the people who depend on {them}. Both, {they} knows, are forms of love.",
 choices:[
  {t:"Take the chance. A life is your own.",h:"the self",do:p=>{fx(p,{spirit:10,means:-8});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond-8);remember('chose_self');logLine("Reached, at last, for the thing {they} had always wanted — and asked the people {they} loved to carry the cost of it.","obs");}},
  {t:"Set it down. They need you whole.",h:"the others",do:p=>{fx(p,{heart:6,spirit:-4});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond+8);remember('chose_others');logLine("Set down the thing {they} had always wanted, for the people who needed {them} more — and called it, mostly, no regret.","obs");}},
 ]},

/* ---- more adult-band variety, so the middle years aren't the same four moments every life ---- */
{id:'a_public_fall',stage:'adult',w:2,age:[30,58],once:true,cond:()=>P.stats.means>30,
 text:"Something {n} staked {them}self on, publicly, has failed — publicly. The fall is real, and so is the audience for it.",
 choices:[
  {t:"Own it. Stand in the wreck.",h:"",do:p=>{fx(p,{spirit:5,means:-6,heart:2});remember('owned_a_failure');logLine("Stood in the wreck of a public failure and did not look away — and people remembered that longer than the failure.","obs");}},
  {t:"Bury it. Move on fast.",h:"",do:p=>{fx(p,{means:2,spirit:-4,mind:2});logLine("Buried a failure quickly and deep, and felt it settle somewhere it would keep.");}},
 ]},
{id:'a_friend_need',stage:'adult',w:3,age:[28,60],cool:10,cond:()=>{const f=rel('friend');return f&&f.bond>40;},
 text:()=>{const f=rel('friend');return `${f.given} needs more of ${P.given} than ${P.given} has to give just now — time, presence, a shoulder for a long trouble. The friendship will register the answer either way.`;},
 choices:[
  {t:"Give more than you have.",h:"",do:p=>{const f=rel('friend');if(f)f.bond=clamp(f.bond+12);fx(p,{heart:5,spirit:-3,vit:-2});remember('let_in');logLine("Gave a friend more than {they} could spare, and was tired for it, and did not regret a minute.","joy");}},
  {t:"Give what you can, and no more.",h:"",do:p=>{const f=rel('friend');if(f)f.bond=clamp(f.bond-6);fx(p,{spirit:2,mind:2});logLine("Gave a friend what {they} could afford and not a thing past it, and felt the limit of it set.");}},
 ]},
{id:'a_conviction',stage:'adult',w:2,age:[30,56],once:true,cond:()=>held('took_a_stand')||P.stats.spirit>55,
 text:"A private conviction {n} has held quietly could become a public one — said aloud, attached to {their} name, with everything that follows from that.",
 choices:[
  {t:"Say it aloud. Put your name to it.",h:"",do:p=>{fx(p,{spirit:7,means:-5,heart:2});remember('took_a_stand');remember('public_role');logLine("Took a private conviction public, with {their} own name on it, and lived with the weather it brought.","obs");}},
  {t:"Keep it yours. Keep it safe.",h:"",do:p=>{fx(p,{mind:3,spirit:-2});logLine("Kept a conviction private and safe, was never tested on it, and wondered sometimes if that was the same as never having held it.");}},
 ]},

/* ---- shadow-archetype gated content, so a ruthless / tainted house meets a different world ---- */
{id:'r_hard_name',stage:'adult',w:4,age:[26,60],cond:()=>S.house&&(reputeTop(S.house)==='ruthless'||((S.house.heirlooms||[]).some(h=>h.tag==='hardname')&&P.stats.means>45)),
 text:"The family's hard name goes into the room ahead of {n} — and a deal is on the table that the name itself could close, by being exactly as feared as the stories say.",
 choices:[
  {t:"Use the name. Close it hard.",h:"",do:p=>{fx(p,{means:14,heart:-4,spirit:-2});remember('cut_a_corner');logLine("Let the family's hard name do the work, closed the thing cold, and it stayed closed.","obs");}},
  {t:"Refuse the name's help.",h:"",do:p=>{fx(p,{means:-4,heart:5,spirit:4});remember('broke_with_house');logLine("Set the family's reputation aside and dealt straight — the deal was smaller, and {their} own.","joy");}},
 ]},
{id:'r_old_shame',stage:'*',w:3,age:[24,70],cool:20,cond:()=>S.house&&(reputeTop(S.house)==='tainted'||(S.house.secret&&!S.house.secret.known)),
 text:"A marriage, a post, a door {n} wanted — and then the family's old shame surfaces at exactly the wrong moment, the way it always seems to know how to.",
 choices:[
  {t:"Face it down. Refuse to flinch.",h:"",do:p=>{fx(p,{spirit:6,means:-4,heart:-2});logLine("Faced the family's old shame in public and refused to flinch — lost the thing {they} wanted, and kept {them}self.","obs");}},
  {t:"Let it cost you. Walk away.",h:"",do:p=>{fx(p,{spirit:-5,means:2});logLine("Let the old family shame cost {them} the thing {they} wanted, and walked away from both.","loss");}},
 ]},

/* ---- the competing-goods choices finally echo: an elder reckoning that reads them back ---- */
{id:'r_name_cost',stage:'midlife',w:3,age:[46,66],once:true,cond:()=>S.house&&(reputeTop(S.house)==='ruthless'||(S.house.heirlooms||[]).some(h=>h.tag==='hardname')),
 text:"The family's hard name has finally cost {n} something that cannot be bought back: a door closed, a match refused, a young one in the house who has started to flinch at what they stand to inherit.",
 choices:[
  {t:"Soften. It's gone far enough.",h:"",do:p=>{fx(p,{heart:6,means:-6,spirit:3});remember('broke_with_house');logLine("Began, late, to spend the family's hard name back down — quietly, and at real cost to the purse.","obs");}},
  {t:"Let them fear it. It works.",h:"",do:p=>{fx(p,{means:8,heart:-4,spirit:-2});remember('cut_a_corner');logLine("Decided the fear was worth more than the warmth, and let the name keep its teeth.","obs");}},
 ]},
{id:'cb_the_cost',stage:'elder',w:2,once:true,onceDyn:true,cond:()=>held('chose_self')||held('strayed')||held('cut_a_corner')||held('chose_loyalty'),
 text:"Near the end, one old decision keeps returning to {n} — not a wrong one, exactly, but the one with a cost {they} has never quite finished paying.",
 choices:[
  {t:"Decide it was right.",h:"",do:p=>{const which=held('chose_self')?"the life {they} took for {them}self":held('chose_others')?"the dream {they} set down for the people who needed {them}":held('chose_loyalty')?"the truth {they} kept for the sake of {their} own":"the kindness {they} told in place of the truth";echo("Decided, at the last, that "+which+" had been right — and mostly believed it.","obs");fx(p,{spirit:6,heart:3});}},
  {t:"Let it stay unsettled.",h:"",do:p=>{echo("Let the oldest hard choice stay exactly as unsettled as it had always been, and made a kind of peace with that.","obs");fx(p,{mind:3,spirit:2});}},
 ]},

/* ============================================================
   ANTI-STALENESS EXPANSION — structural divergence so two lives
   are different SHAPES of life, not the same shape with new paint:
   • vocations (a youth calling gates a distinct adult cluster)
   • eras (the world a generation is born into: war, plague, plenty…)
   • a wider pool of dilemmas, band-fillers, trait moments
   • dynasty-memory (an ancestor, the family words, played back at you)
   ============================================================ */

/* ---- VOCATIONS: each calling gates its own adult arc ---- */
{id:'a_soldier_service',w:4,once:true,age:[24,44],cond:()=>P.flags.vocation==='soldier',
 text:p=>["The order comes, as it always does for {n}'s sort: a campaign, a far border, a thing that will be called duty.","{n} is good at the soldiering — too good to be left in the barracks. They want {them} where the fighting is worst.","Word comes down. There is a hard piece of work, the kind that makes a name or a grave, and {n}'s name is on the list."][rotI(p,3)],
 choices:[
  {t:"Go where it's worst. Make a name.",h:"glory has a price",do:p=>{fx(p,{means:12,spirit:5,vit:-4,heart:-3});p.flags.peril=p.age+6;remember('driven');remember('soldier_blooded');logLine(["Went where the fighting was worst, and came back with a name and a limp and a quiet {they} kept for life.","Did the hard work that makes a name, and carried what it cost without much complaint.","Made {them}self into the soldier they needed, and was never afterward entirely able to put it down."][rotI(p,3)],"obs");}},
  {t:"Keep your head down. Come home whole.",h:"no medals, all your fingers",do:p=>{fx(p,{vit:4,spirit:-3,heart:2});remember('soldier_survived');logLine("Soldiered carefully, took no medals and no needless risks, and came home with everything {they} left with.","obs");}},
 ]},
{id:'m_soldier_ghost',w:3,once:true,age:[46,68],cond:()=>P.flags.vocation==='soldier'&&(held('soldier_blooded')||held('soldier_survived')),
 text:"Years on, the war comes back to {n} the way it does — not as a story, but at three in the morning, with no warning and no mercy.",
 choices:[
  {t:"Talk about it, finally.",h:"the weight, shared",do:p=>{fx(p,{spirit:7,heart:5,mind:2});remember('made_peace');logLine("Spoke, at last and to one person, of the thing the war had made {them} do — and slept a little better after.","joy");}},
  {t:"Carry it alone, as ever.",h:"some things stay buried",do:p=>{fx(p,{spirit:-4,mind:3,vit:-2});remember('lived_reckless');logLine("Kept the worst of it where {they} had always kept it — behind the teeth, unspoken, {their} own.","obs");}},
 ]},
{id:'e_soldier_old',w:2,once:true,age:[66,92],cond:()=>P.flags.vocation==='soldier',
 text:"A young one, all questions, asks {n} what it was really like — the soldiering, the far places, the things the old songs leave out.",
 choices:[
  {t:"Tell it true. The cost and all.",h:"",do:p=>{fx(p,{heart:5,spirit:3});remember('became_teacher');logLine("Told a young one the truth of the soldiering — not the songs, the cost — and watched them put the songs down.","obs");}},
  {t:"Give them the songs. Let them keep them.",h:"",do:p=>{fx(p,{spirit:4,heart:2});logLine("Gave the young the bright version, and let them keep, a while longer, the thing {they} had long since lost.","obs");}},
 ]},

{id:'a_scholar_question',w:4,once:true,age:[26,48],cond:()=>P.flags.vocation==='scholar',
 text:"A question has its hooks in {n} — a real one, the kind that could take years and lead nowhere. There is also paid, dull work that would feed {them} surely.",
 choices:[
  {t:"Chase the question. Eat later.",h:"the long, hungry bet",do:p=>{fx(p,{mind:16,means:-8,spirit:6});remember('chose_study');remember('set_scholar_rep');logLine(["Gave years to a question with no promise in it, and called the years well spent.","Followed the question down, past where the money was, into the part that was only ever for love of the thing.","Bet the comfortable life against the chance of understanding one hard thing, and never quite regretted it."][rotI(p,3)],"obs");}},
  {t:"Take the paid work. Question on the side.",h:"a roof, and a little light",do:p=>{fx(p,{mind:7,means:8,spirit:-2});remember('chose_study');logLine("Kept the question for evenings and the paid work for days, and made, between them, a sufficient life.","obs");}},
 ]},
{id:'m_scholar_legacy',w:3,once:true,age:[48,70],cond:()=>P.flags.vocation==='scholar'&&P.stats.mind>52,
 text:"{n} has built up a thing worth keeping — a body of knowing, hard-won. The question now is whether to give it away or guard it.",
 choices:[
  {t:"Give it all away. Teach.",h:"knowing, handed on",do:p=>{fx(p,{heart:7,spirit:6,means:-3});remember('became_teacher');logLine("Gave away everything {they} knew, freely and to anyone who'd take it, and so made sure it outlived {them}.","joy");}},
  {t:"Guard it. It was dearly bought.",h:"yours, and yours alone",do:p=>{fx(p,{mind:5,means:6,heart:-3});remember('set_scholar_rep');logLine("Kept what {they} knew close and well-defended, the way a thing dearly bought is kept.","obs");}},
 ]},

{id:'a_maker_shop',w:4,once:true,age:[26,50],cond:()=>P.flags.vocation==='maker',
 text:"{n} could go out on {their} own — {their} name over a door, {their} hours {their} own, every risk {their} own too. Or stay another's hands, safe and waged.",
 choices:[
  {t:"Open your own door.",h:"your name, your neck",do:p=>{if(chance(0.6)){fx(p,{means:14,spirit:8,vit:-2});remember('self_made');remember('built_the_name');logLine("Hung {their} own name over {their} own door, and made the gamble pay — slowly, and with both hands.","joy");}else{fx(p,{means:-10,spirit:-3,mind:4});remember('self_made');logLine("Hung {their} own name over a door, and learned the hard arithmetic of working for {them}self.","loss");}}},
  {t:"Stay waged. Sleep at night.",h:"",do:p=>{fx(p,{means:6,vit:3,spirit:-2});remember('chose_trade');logLine(freshPick(["Stayed another's good hands, took the steady wage, and slept the sleep of the un-indebted.","Kept working for someone else's name, and bought, with the lost ambition, a great deal of peace.","Chose the wage and the quiet over the risk and the glory, and rarely lay awake regretting it."],p),"obs");}},
 ]},
{id:'m_maker_masterwork',w:3,once:true,age:[44,66],cond:()=>P.flags.vocation==='maker',
 text:"There is one piece {n} has always meant to make — the real one, the one that would say everything {they} know how to do. It would cost time {they} can't quite spare.",
 choices:[
  {t:"Make the masterwork.",h:"the one that matters",do:p=>{fx(p,{spirit:10,mind:5,means:-6});remember('made_art');remember('early_talent');logLine(["Made, finally, the one piece {they} had carried unmade for thirty years — and it was as good as {they}'d hoped.","Spent the time {they} didn't have on the work {they} couldn't not make, and left it behind, finished, real.","Put everything {they} had into one made thing, and the thing held it."][rotI(p,3)],"joy");}},
  {t:"Keep the lights on instead.",h:"",do:p=>{fx(p,{means:8,spirit:-4});remember('driven');logLine("Kept the ordinary work coming and the lights on, and let the masterwork stay, as it always had, a thing {they} would make next year.","obs");}},
 ]},
{id:'e_maker_handoff',w:2,once:true,age:[64,90],cond:()=>P.flags.vocation==='maker',
 text:"A young pair of hands keeps turning up at {n}'s bench, watching, wanting to be taught the trade.",
 choices:[
  {t:"Teach them everything.",h:"the craft, passed on",do:p=>{fx(p,{heart:6,spirit:5});remember('became_teacher');remember('had_mentor');logLine("Taught a young pair of hands everything the old ones knew, and so the craft outlived the craftsman.","joy");}},
  {t:"Let it die with you.",h:"some things end",do:p=>{fx(p,{spirit:-2,mind:2});logLine("Kept the trade's last secrets to {them}self, and let a way of making things end, quietly, where {they} ended.","obs");}},
 ]},

{id:'a_wanderer_settle',w:4,once:true,age:[26,52],cond:()=>P.flags.vocation==='wanderer',
 text:p=>["A place has tried to hold {n} again — work, a face, a reason. The road is also right there, as it always is.","{n} has been still long enough to feel the old itch. There is a horizon, and {they} knows exactly how it would feel to walk at it.","Someone has asked {n} to stay. It is a fair offer. It is also a door closing, and {they} can hear it."][rotI(p,3)],
 choices:[
  {t:"Move on. The horizon calls.",h:"free, and unheld",do:p=>{fx(p,{mind:6,spirit:5,heart:-4,means:-3});remember('left_home');remember('lived_reckless');logLine(freshPick(["Moved on again, before the place could close around {them}, and felt the old clean relief of an open road.","Chose the horizon over the held hand, as {they} had before, as {they} probably always would.","Walked when {they} could have stayed, and added another town to the long list {they} had loved and left."],p),"obs");}},
  {t:"Stay. Let the road end here.",h:"roots, at last",do:p=>{fx(p,{heart:8,spirit:4,means:4});p.flags.vocation='settled';remember('stayed_home');logLine("Let the road end, finally, in one place with one set of faces — and was surprised how much like relief it felt.","joy");}},
 ]},
{id:'m_wanderer_return',w:3,once:true,age:[46,68],cond:()=>P.flags.vocation==='wanderer',
 text:"After all the years and all the roads, {n} comes back to the place {they} started — smaller now, or {they} are larger, the arithmetic never quite works.",
 choices:[
  {t:"Stay a while. Make peace.",h:"",do:p=>{fx(p,{heart:6,spirit:5,mind:3});remember('made_peace');logLine(freshPick(["Went home at last, and found it had gone on without {them}, and made a quiet peace with both facts.","Came back to the first place at last, sat in what was left of it, and let the long going settle into something like peace.","Returned, finally, and found home had become a smaller and more forgivable thing than the one {they}'d fled."],p),"obs");}},
  {t:"See it, and go. Home is the road now.",h:"",do:p=>{fx(p,{spirit:3,heart:-2,mind:4});logLine(freshPick(["Looked at the old place once, the way you look at an old photograph, and went back to the only home {they} had left — the going itself.","Saw the first place again, felt nothing {they} could use, and turned back to the road that had become the only home that fit.","Stood in the doorway of the beginning, found it didn't hold {them} any more than it had, and left it for good."],p),"obs");}},
 ]},

/* ---- ERA: the world a generation lives through (gated on S.era) ---- */
{id:'w_war_call',w:5,once:true,age:[16,46],cond:()=>typeof S!=='undefined'&&S&&S.era==='war'&&P.flags.vocation!=='soldier',
 text:"The war that was far off is not far off now. They are taking the young and the able, and {n} is, for the moment, both.",
 choices:[
  {t:"Go when called. It's owed.",h:"a debt to something larger",do:p=>{fx(p,{vit:-3,spirit:4,heart:-2});p.flags.peril=p.age+5;remember('driven');logLine(["Went when the war called, and did what was asked, and spoke little of it after.","Answered the call {they} could have dodged, and carried the going quietly for the rest of {their} life.","Put on the coat and went, not for the glory {they} never believed in, but because someone had to and {they} were there."][rotI(p,3)],"obs");}},
  {t:"Find a way out of it.",h:"alive, and marked for it",do:p=>{fx(p,{spirit:-4,mind:3,means:-4});remember('looked_away');logLine("Found a way to stay out of the war — by money, or wit, or luck — and lived with the small permanent look certain neighbours kept giving {them}.","obs");}},
 ]},
{id:'w_war_loss',w:4,once:true,age:[20,70],cond:()=>typeof S!=='undefined'&&S&&S.era==='war',
 text:"The war reaches into the house the way it reaches into every house, and takes someone out of it who is not given back.",
 choices:[
  {t:"Let the grief in. Don't rush it.",h:"",do:p=>{fx(p,{spirit:-6,heart:6});remember('knew_loss');logLine("Lost someone to the war, and let the grief take its full and proper time, and was, after, more tender than before.","loss");}},
  {t:"Bury it in work. Keep moving.",h:"",do:p=>{fx(p,{spirit:-3,means:6,vit:-2});remember('driven');logLine("Lost someone to the war and put the loss away in work, where it kept, badly, for years.","loss");}},
 ]},
{id:'w_plague_tend',w:5,once:true,age:[18,72],cond:()=>typeof S!=='undefined'&&S&&S.era==='plague',
 text:"The sickness is in the next street, then the next house. Someone close has it, and tending them means breathing the same air.",
 choices:[
  {t:"Tend them. Stay close.",h:"love, at real risk",do:p=>{fx(p,{heart:9,vit:-5,spirit:4});p.flags.peril=p.age+3;remember('chose_others');remember('kept_stray');logLine(["Stayed and nursed the sick when staying could have killed {them}, and counted no cost.","Breathed the same close air as the dying because they should not die alone, and was lucky, and was changed.","Did the tending no one could be blamed for refusing, and refused to refuse it."][rotI(p,3)],"joy");}},
  {t:"Keep your distance. Survive.",h:"alive, and knowing it",do:p=>{fx(p,{vit:3,heart:-5,spirit:-4});remember('looked_away');logLine("Kept a careful distance from the sickness and the sick, and lived, and carried the arithmetic of it a long time.","obs");}},
 ]},
{id:'w_hard_winter',w:4,once:true,age:[12,80],cond:()=>typeof S!=='undefined'&&S&&S.era==='hard',
 text:"It is a lean year on a long list of lean years. The stores will not stretch to feed the household and the ones at the door both.",
 choices:[
  {t:"Share the last of it.",h:"open hand, empty larder",do:p=>{fx(p,{heart:8,vit:-4,spirit:5,means:-5});remember('chose_others');remember('kind_to_outcast');logLine("Shared the last of the stores in a hard winter, went hungry for it, and would have done it again.","joy");}},
  {t:"Hold it. Yours come first.",h:"hard, and warm, and fed",do:p=>{fx(p,{means:4,vit:3,heart:-4});remember('chose_self');remember('cut_a_corner');logLine("Shut the door on the hungry in a hard winter, kept {their} own fed, and made the peace with it that the fed can make.","obs");}},
 ]},
{id:'w_plenty_ride',w:4,once:true,age:[22,60],cond:()=>typeof S!=='undefined'&&S&&S.era==='plenty',
 text:"The fat years are here and money is loose in the streets. A bold hand could turn a little into a great deal — or be left behind by everyone who did.",
 choices:[
  {t:"Ride the boom. Reach.",h:"the tide is in",do:p=>{if(chance(0.62)){fx(p,{means:20,spirit:6,vit:-2});remember('self_made');remember('built_the_name');logLine("Reached, while the reaching was good, and the fat years made {them} — for a while, at least — genuinely rich.","joy");}else{fx(p,{means:-8,spirit:-3});remember('lived_reckless');logLine("Reached for the fat years' easy money and closed {their} hand on air, the way some always do.","loss");}}},
  {t:"Stay modest. Booms end.",h:"",do:p=>{fx(p,{means:6,spirit:2,mind:3});logLine("Watched the fat years make fortunes and stayed, deliberately, modest — and was still standing, quietly, when the tide went out.","obs");}},
 ]},
{id:'w_turning_new',w:4,once:true,age:[20,64],cond:()=>typeof S!=='undefined'&&S&&S.era==='turning',
 text:"The age is changing under {n}'s feet — new machines, new notions, new ways of doing the things {they} learned the old way. The old way still works. For now.",
 choices:[
  {t:"Go to the new. Learn it.",h:"with the turning tide",do:p=>{fx(p,{mind:9,means:6,spirit:3,heart:-2});remember('driven');remember('made_art');logLine(["Threw in with the new age, learned its machines and its manners, and was carried forward instead of left.","Let go of the old certain way and learned the new uncertain one, and felt, for once, ahead of the weather.","Chose the future over the comfortable past, and made {them}self, late, into a person of the new age."][rotI(p,3)],"obs");}},
  {t:"Hold the old way. It's true.",h:"against the current",do:p=>{fx(p,{spirit:4,heart:4,means:-4,mind:-2});remember('took_a_stand');logLine("Held to the old way while the age turned without {them}, and kept something true that the new world was busy forgetting.","obs");}},
 ]},

/* ---- DILEMMAS: vary the "moral moment" so it isn't the same one every life ---- */
{id:'x_promise',w:2,onceDyn:true,age:[30,72],cond:()=>P.rels.some(r=>r.alive&&r.bond>40),
 text:"A promise {n} made long ago, and meant, has come due at exactly the wrong time. Keeping it now will cost {them} something real.",
 choices:[
  {t:"Keep the promise. Pay the cost.",h:"your word, kept",do:p=>{fx(p,{spirit:6,heart:5,means:-6});remember('took_a_stand');remember('chose_others');logLine("Kept an old promise at a price {they} could ill afford, because a promise unkept is a different kind of debt.","obs");}},
  {t:"Release yourself. Quietly.",h:"a reasonable wrong",do:p=>{fx(p,{means:5,spirit:-4,mind:2});remember('cut_a_corner');remember('chose_self');logLine("Let {them}self quietly off an old promise, with reasons that were good and that {they} never quite believed.","obs");}},
 ]},
{id:'x_mercy',w:2,once:true,age:[30,66],cond:()=>P.stats.means>40||S&&S.house&&S.house.seat>=3,
 text:"Someone who once did {n} a real wrong is now, by some turn of the wheel, in {n}'s power. No one would blame {them} for collecting.",
 choices:[
  {t:"Let them go. Be the larger.",h:"mercy, freely given",do:p=>{fx(p,{spirit:7,heart:6});remember('chose_others');remember('made_peace');logLine("Held an old enemy in {their} hand, and opened the hand, and walked away the larger for it.","joy");}},
  {t:"Collect. Justice is owed.",h:"the debt, called in",do:p=>{fx(p,{means:6,spirit:-2,heart:-4});remember('cut_a_corner');remember('lived_reckless');logLine("Collected an old debt of harm when the chance came, and called it justice, and it mostly was.","obs");}},
 ]},
{id:'x_favour',w:2,once:true,age:[28,60],cond:()=>{const f=rel('friend')||rel('sibling')||rel('spouse');return f&&f.bond>45;},
 text:p=>{const f=rel('friend')||rel('sibling')||rel('spouse');return (f?f.given:"Someone")+" asks {n} for a small wrong — nothing terrible, a thumb on a scale, a word in an ear — for a thing they badly need. {n} could do it easily. That is rather the problem.";},
 choices:[
  {t:"Do it. For them.",h:"loyalty over the line",do:p=>{fx(p,{heart:5,spirit:-3});remember('chose_loyalty');remember('cut_a_corner');logLine("Did a small wrong for someone {they} loved, knowing it was wrong, counting the love worth the smudge.","obs");}},
  {t:"Refuse. Even for them.",h:"a clean no, a cooler love",do:p=>{const f=rel('friend')||rel('sibling')||rel('spouse');if(f)f.bond=clamp(f.bond-8);fx(p,{spirit:4,heart:-3});remember('stayed_straight');remember('took_a_stand');logLine("Refused someone {they} loved a wrong they'd asked for, and kept {their} hands clean and {their} house a little colder.","obs");}},
 ]},

/* ---- BAND-FILLERS: thicken the thin years so the pool stays fresh ---- */
{id:'a_road_not_taken',w:2,once:true,age:[30,52],cond:()=>!P.flags.bigMove,
 text:"A door swings open that would change everything — a different city, a different trade, a whole different version of the life {n} is in the middle of living.",
 choices:[
  {t:"Walk through it. Start over.",h:"a life, remade midstream",do:p=>{p.flags.bigMove=1;fx(p,{mind:6,spirit:6,heart:-4,means:-6});remember('left_home');logLine(["Tore the half-built life down to the studs in the middle of it, and built a different one, and only sometimes wondered.","Took the door that meant starting over with most of a life already spent, and never once called it a mistake out loud.","Changed everything when changing everything was hardest, and was, on balance, glad."][rotI(p,3)],"obs");}},
  {t:"Close it. You have a life here.",h:"the one you chose, re-chosen",do:p=>{fx(p,{heart:5,spirit:2,means:3});remember('stayed_home');logLine("Looked through the door at the other life a long moment, and closed it, and chose again the one {they} already had.","obs");}},
 ]},
{id:'a_fallow',w:2,age:[30,58],cool:18,cond:()=>P.stats.spirit<58,
 text:"There is a stretch of years where nothing much happens to {n} — no triumph, no disaster, only the ordinary days, one after another, going by.",
 choices:[
  {t:"Make peace with the quiet.",h:"the un-storied years",do:p=>{fx(p,{spirit:6,heart:4,mind:2});logLine("Lived through a long ordinary stretch and learned, slowly, that the quiet years are most of a life, and not the lesser part of it.","obs");}},
  {t:"Chase something. Anything.",h:"restless in the calm",do:p=>{fx(p,{vit:3,spirit:-2,means:2});remember('driven');logLine("Could not let the quiet years be quiet, and filled them with motion, some of it even worth the trouble.","obs");}},
 ]},
{id:'m_empty_house',w:3,once:true,age:[48,68],cond:()=>rels('child').some(c=>c.age>=20)||held('left_home'),
 text:"The house has gone quiet in a way it never was — the children grown and gone, or never come, the rooms holding more echo than they used to.",
 choices:[
  {t:"Fill it with new things.",h:"the quiet, answered",do:p=>{fx(p,{spirit:5,mind:4,heart:3});remember('reinvented');logLine("Met the quiet house by filling it — with work, or friends, or some late-found thing — and found the second half had its own uses.","obs");}},
  {t:"Sit in the quiet. Let it be.",h:"",do:p=>{fx(p,{spirit:3,heart:4,mind:3});logLine("Let the emptied house be empty, and sat in it, and found the quiet was not, after all, the same thing as the loneliness {they} had feared.","obs");}},
 ]},
{id:'m_who_became',w:2,once:true,age:[46,64],
 text:"{n} catches sight of {them}self — in a window, a remark, a child's flinch — and sees, with a small shock, exactly who the years have made.",
 choices:[
  {t:"Like what you see. Mostly.",h:"",do:p=>{fx(p,{spirit:6,heart:3});logLine("Caught a clear sight of who {they}'d become, and found {they} could mostly live with the person in the glass.","obs");}},
  {t:"Resolve to change one thing.",h:"late, but not too late",do:p=>{fx(p,{spirit:4,mind:4,heart:2});remember('made_peace');logLine("Saw, at midlife, the one thing {they} had become that {they} did not want to be, and set, quietly, about unbecoming it.","obs");}},
 ]},
{id:'e_old_letters',w:2,once:true,age:[64,90],
 text:"In a box {n} has not opened in years are the letters — {their} own hand, younger, certain about things {they} are no longer certain about.",
 choices:[
  {t:"Read them all. Meet your younger self.",h:"",do:p=>{fx(p,{heart:5,spirit:4,mind:3});logLine("Read the letters {their} younger self had written, and was, by turns, embarrassed and moved and finally just fond.","obs");}},
  {t:"Burn them, unread.",h:"",do:p=>{fx(p,{spirit:3,mind:2});logLine("Burned the old letters without reading them, and let the younger self {they}'d been keep, at last, {their} privacy.","obs");}},
 ]},

/* ---- TRAIT MOMENTS: make a marked nature actually surface in a life ---- */
{id:'t_frail',w:2,once:true,age:[20,60],cond:()=>P.traits.includes('frail'),
 text:"The body that was never strong sends its bill early, as it always meant to. {n} has spent a life negotiating with it.",
 choices:[
  {t:"Live carefully. Last longer.",h:"",do:p=>{fx(p,{vit:6,mind:4,spirit:-2});logLine("Made a long quiet study of {their} own frailty, spent {their} strength like a careful coin, and outlasted stronger people doing it.","obs");}},
  {t:"Spend it freely. Last brighter.",h:"",do:p=>{fx(p,{spirit:7,vit:-4,heart:4});p.flags.peril=p.age+4;remember('lived_reckless');logLine("Refused to be careful with a body that was never going to last anyway, and burned what {they} had, brightly, while {they} had it.","obs");}},
 ]},
{id:'t_warm',w:2,once:true,age:[24,62],cond:()=>P.traits.includes('warm')||P.traits.includes('tender'),
 text:"People keep ending up at {n}'s table — the lost, the lonely, the merely hungry. {They} has never been able to work out how to say no, or to want to.",
 choices:[
  {t:"Keep the door open.",h:"a warmth that costs",do:p=>{fx(p,{heart:8,spirit:4,means:-4});remember('let_in');remember('kind_to_outcast');logLine(freshPick(["Kept the door and the table open to whoever turned up, fed more people than {they} could afford to, and was the richer in every way but the one.","Let the lost and the hungry keep finding {their} table, and never learned, or wanted, to turn them away.","Ran an open house {they} couldn't quite afford, and counted the warmth of it worth every coin it cost."],p),"joy");}},
  {t:"Learn, finally, to say no.",h:"a harder, kept self",do:p=>{fx(p,{means:4,spirit:2,heart:-3});remember('stayed_straight');logLine(freshPick(["Learned, late and against {their} nature, to close the door sometimes, and kept a little more of {them}self for the keeping.","Taught {them}self, with effort, to say the no {their} nature resisted, and was a little less spent for it.","Drew, finally, a line around {their} own generosity, and felt the loss and the relief of it together."],p),"obs");}},
 ]},
{id:'t_shrewd',w:2,once:true,age:[26,58],cond:()=>P.traits.includes('shrewd'),
 text:"{n} sees the angle nobody else in the room has noticed — the soft place, the lever, the thing that could be turned to {their} advantage. It would be so easy.",
 choices:[
  {t:"Take the angle.",h:"clever, and a little cold",do:p=>{fx(p,{means:12,spirit:2,heart:-4});remember('cut_a_corner');logLine("Saw the angle no one else had and took it, cleanly, and was a little richer and a little colder for it.","obs");}},
  {t:"See it, and let it go.",h:"the cleverness, unspent",do:p=>{fx(p,{spirit:5,heart:4,mind:3});remember('stayed_straight');logLine("Saw exactly how {they} could have turned the moment to {their} profit, and chose, that time, not to — and slept well.","obs");}},
 ]},
{id:'t_stubborn',w:2,once:true,age:[22,60],cond:()=>P.traits.includes('stubborn'),
 text:"Everyone {n} trusts is telling {them} to bend on this — to let it go, to be reasonable. {They} is fairly sure {they} is right. Fairly.",
 choices:[
  {t:"Don't bend. You're right.",h:"a hill, and you on it",do:p=>{if(chance(0.5)){fx(p,{spirit:7,means:4,mind:2});remember('took_a_stand');logLine("Refused to bend when everyone said bend, and turned out, that time, to have been right, and unbearable, and right.","obs");}else{fx(p,{spirit:-4,means:-5,heart:-3});remember('took_a_stand');logLine("Refused to bend when everyone said bend, and turned out to be wrong, and dug in anyway, for a while, out of sheer principle.","loss");}}},
  {t:"Bend, this once.",h:"",do:p=>{fx(p,{heart:5,spirit:2,mind:3});remember('made_peace');logLine("Bent, against every grain in {them}, on the one thing that mattered, and was quietly amazed the bending didn't break anything.","obs");}},
 ]},
{id:'t_dreaming',w:2,once:true,age:[18,56],cond:()=>P.traits.includes('dreaming')||P.traits.includes('bright'),
 text:"{n} is, as ever, half somewhere else — a place that does not exist, that {they} can see more clearly than the room {they} is standing in.",
 choices:[
  {t:"Follow it. Make it real.",h:"the dream, chased",do:p=>{fx(p,{mind:7,spirit:6,means:-5});remember('made_art');remember('early_talent');logLine("Chased the thing only {they} could see and dragged some piece of it back into the real world, where it had not existed before.","joy");}},
  {t:"Come back. Live here.",h:"the world, chosen",do:p=>{fx(p,{heart:5,vit:3,spirit:-2,means:3});remember('stayed_home');logLine("Set down the elsewhere {they} had always half-lived in, and chose, deliberately, the plainer country of the actual.","obs");}},
 ]},

/* ---- DYNASTY-MEMORY: the family, played back at the living ---- */
{id:'d_ancestor',w:3,age:[20,70],cool:22,cond:()=>typeof S!=='undefined'&&S&&S.lineage&&S.lineage.length>=1,
 text:p=>{const a=S.lineage[rotI(p,S.lineage.length)];const nm=a?a.given:"someone before";return "There is a story in the family about "+nm+", who came before {n} — a thing they did, and what it cost. {n} has heard it so often it has the worn shape of a lesson, though no two tellers agree on the moral.";},
 choices:[
  {t:"Live up to the name.",h:"the line, continued",do:p=>{fx(p,{spirit:5,mind:3,heart:2});remember('honored_line');remember('took_a_stand');logLine("Took the old family story as a thing to live up to, and bent {their} own life, a little, toward its shape.","obs");}},
  {t:"Step out of its shadow.",h:"your own name, your own way",do:p=>{fx(p,{spirit:6,mind:3,means:2});remember('own_way');logLine("Decided the family story was theirs and not {n}'s, and stepped, deliberately, out from under it into {their} own plainer light.","obs");}},
 ]},
{id:'d_motto_test',w:3,once:true,age:[26,68],cond:()=>typeof S!=='undefined'&&S&&S.house&&S.house.motto,
 text:p=>"The family has words it lives by — “"+(S.house.motto)+"” — and {n} has come, today, to a moment that asks whether {they} actually believes them, or only inherited them.",
 choices:[
  {t:"Hold to the family words.",h:"the house, upheld",do:p=>{fx(p,{spirit:6,heart:3});remember('honored_line');remember('took_a_stand');logLine("Met the test the way the family words said to, and felt, for once, the old motto turn from a phrase into a thing {they} meant.","obs");}},
  {t:"Break with them. Be your own.",h:"the house, defied",do:p=>{fx(p,{spirit:5,mind:4,heart:-2});remember('own_way');remember('chose_self');logLine("Broke, in the moment that counted, with the words the family had handed {them}, and chose to be the first of a different kind.","obs");}},
 ]},

/* ============================================================
   ANTI-STALENESS PASS 2 — break the late-love/elder monoculture:
   distinct SOLITARY & CHILDLESS life-shapes (now ~a quarter / a
   seventh of lives), elder arcs that differ by how a life was lived,
   FATE events that simply happen (no choosing your way out), and
   cards that exist only where a vocation meets an era.
   ============================================================ */

/* ---- SOLITARY & CHILDLESS: real shapes, not dead-ends ---- */
{id:'m_solitary',stage:'midlife',w:3,age:[44,64],once:true,cond:()=>!rel('spouse')&&!rel('love'),
 text:"It settles on {n} plainly, somewhere in midlife: the house is {their}s alone, and likely to stay that way. There is a grief in it, and — {they} is surprised to find — a width.",
 choices:[
  {t:"Claim the width. This is the life.",h:"solitude, chosen",do:p=>{fx(p,{spirit:7,mind:5,heart:2});remember('chose_solitude');logLine(["Stopped waiting for the other life to arrive, and moved properly into the one {they} had — which turned out to be wide.","Made a deliberate peace with a life lived single, and found it had rooms {they} had never had time to furnish before.","Quit grieving the family {they} never made, and started, instead, to inhabit the freedom {they} actually had."][rotI(p,3)],"joy");}},
  {t:"Feel the cold of it.",h:"the unshared life",do:p=>{fx(p,{spirit:-3,mind:4,heart:-2});remember('knew_loss');logLine("Felt, in midlife, the particular cold of the unshared evening, and did not pretend otherwise.","obs");}},
 ]},
{id:'a_chosen_family',stage:'adult',w:3,age:[30,60],cool:16,cond:()=>!rel('spouse')&&!rels('child').length,
 text:"The people who keep turning up for {n} — at the door, at the bad times, at the table — are not, strictly, family. {They} has begun to suspect that is a technicality.",
 choices:[
  {t:"Build a life around them.",h:"a family, chosen not given",do:p=>{const s=chance(0.5)?'m':'f';if(!rel('friend'))addRel('friend',pick(s==='m'?GIVEN_M:GIVEN_F),s,66,p.age);fx(p,{heart:8,spirit:6});remember('let_in');remember('chose_others');logLine("Built a life out of chosen people instead of given ones, and was held by it as well as anyone is held.","joy");}},
  {t:"Keep them at arm's length.",h:"",do:p=>{fx(p,{spirit:-2,mind:3,heart:-3});remember('guarded_self');logLine("Kept even the willing ones at a careful arm's length, and called the distance independence.","obs");}},
 ]},
{id:'e_solitary',stage:'elder',w:3,age:[66,95],once:true,cond:()=>!rel('spouse')&&!rels('child').length,
 text:"{n} comes to the end of it alone, more or less — no spouse at the bedside, no children in the doorway. The question is what to make of that, now, with the time {they} has left.",
 choices:[
  {t:"Count what the solitude built.",h:"a life entirely your own",do:p=>{fx(p,{spirit:6,mind:4});remember('made_peace');logLine(["Reckoned up a life lived mostly alone and found, to {their} own surprise, that it came out well ahead.","Looked back over a solitary life and counted the freedoms it had bought, which were many, and real.","Decided a life is not measured by who stands in the doorway at the end of it, and meant it."][rotI(p,3)],"obs");}},
  {t:"Sit with the ache of it.",h:"",do:p=>{fx(p,{spirit:-2,heart:3});logLine("Sat, at the last, with the plain ache of an unshared life, and let it be exactly the size it was.","obs");}},
 ]},
{id:'e_childless',stage:'elder',w:3,age:[64,95],once:true,cond:()=>(rel('spouse')||P.flags.married)&&!rels('child').length&&(!P.childrenIds||!P.childrenIds.length),
 text:"There will be no heir — {n} and the one {they} loved made a life, but not a child. What a life leaves, when it leaves no one, is a question {they} turns over now.",
 choices:[
  {t:"Leave the work, not a name.",h:"a different kind of inheritance",do:p=>{fx(p,{spirit:5,mind:5,means:-3});remember('made_art');remember('became_teacher');logLine("Left the world a thing made or a thing taught instead of a child, and decided that, too, is a way to outlast yourself.","obs");}},
  {t:"Make peace with leaving nothing.",h:"",do:p=>{fx(p,{spirit:6,heart:4});remember('made_peace');logLine("Made an even peace with leaving no one and nothing in particular behind — having been here, fully, seemed enough.","obs");}},
 ]},

/* ---- ELDER CAPS for the remaining vocations (so a life ends in its own shape) ---- */
{id:'e_scholar_old',stage:'elder',w:3,age:[66,93],once:true,cond:()=>P.flags.vocation==='scholar',
 text:"At the end of a life spent thinking, {n} faces the oldest question {they} never quite cracked — and the plain fact that {they} is out of time to crack it.",
 choices:[
  {t:"Hand the question on, unanswered.",h:"the work outlives the worker",do:p=>{fx(p,{spirit:6,heart:4});remember('became_teacher');logLine("Handed {their} great unanswered question to someone younger, the way a runner hands on a flame, and was content to have carried it as far as {they} did.","joy");}},
  {t:"Make peace with not knowing.",h:"",do:p=>{fx(p,{spirit:5,mind:4});remember('made_peace');logLine("Made, at the last, a scholar's peace with the size of what {they} would never know — which was most of it, and always had been.","obs");}},
 ]},
{id:'e_wanderer_old',stage:'elder',w:3,age:[66,92],once:true,cond:()=>P.flags.vocation==='wanderer'||P.flags.vocation==='settled',
 text:"The road is mostly behind {n} now; the body has called {them} in for good. All those places, all that going — it asks to be added up.",
 choices:[
  {t:"Regret nothing. The going was the life.",h:"",do:p=>{fx(p,{spirit:6,heart:3});logLine(freshPick(["Added up all the roads and all the leaving and regretted not one mile of it, even the cold ones.","Decided a life spent going had been a life, fully — that the horizon had been worth every door {they} closed to chase it.","Looked back down the whole long road and found {they} would walk every mile of it again, the hard ones included."],p),"joy");}},
  {t:"Count the doors you closed to keep moving.",h:"",do:p=>{fx(p,{spirit:-2,heart:4,mind:3});remember('knew_loss');logLine(freshPick(["Counted, at the end of the road, the doors {they} had closed in order to keep walking — and felt each one, plainly, for the first time.","Tallied, late, the people and the places {they} had left to keep moving, and let the bill of it come due all at once.","Reckoned up what the going had cost — every held hand let go of — and carried the sum quietly to the end."],p),"obs");}},
 ]},

/* ---- FATE: things that simply happen — no choosing your way out ---- */
{id:'f_fire',stage:'*',w:1,once:true,age:[18,88],cool:30,cond:()=>P.stats.means>24,
 text:"There is no warning, the way there never is. A fire — a lamp, a dry season, a neighbour's carelessness — and by morning a great deal of what {n} had is ash and stink.",
 choices:[
  {t:"Begin again from the ash.",h:"there is no other option",do:p=>{fx(p,{means:-18,spirit:-4,vit:-2});remember('knew_loss');logLine(freshPick(["Lost much of what {they} had to a fire {they} could not have prevented, stood in the wet ash a while, and began again.","Watched a fire take, in one night, what it had taken years to gather — and started over, because there was nothing else to do.","Lost the house and most of what was in it to a fire, and learned the cold lesson of how fast a life's accumulation burns."],p),"loss");}},
 ]},
{id:'f_sudden_loss',stage:'*',w:1,once:true,age:[20,88],cool:28,cond:()=>P.rels.some(r=>r.alive&&r.bond>52&&r.kind!=='ex'),
 text:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>52&&x.kind!=='ex')[0];return (r?r.given:"Someone")+" is simply gone one morning — no illness anyone marked, no warning anyone caught. The world does this sometimes, without asking.";},
 choices:[
  {t:"Let it break you, and mend slow.",h:"",do:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>52&&x.kind!=='ex')[0];if(r)r.alive=false;fx(p,{spirit:-7,heart:5});remember('knew_loss');logLine("Lost someone with no warning at all, let the grief have its full brutal say, and was a long time mending.","loss");}},
  {t:"Go numb, and keep moving.",h:"",do:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>52&&x.kind!=='ex')[0];if(r)r.alive=false;fx(p,{spirit:-4,heart:-3,means:4});remember('driven');logLine(freshPick(["Lost someone without warning, went somewhere cold and useful inside, and did not come fully back for years.","Met the sudden death by going numb and busy, and postponed the grief so long it never quite arrived properly.","Took the blow standing, buried it in work, and carried the undealt-with weight of it for the rest of {their} life."],p),"loss");}},
 ]},
{id:'f_grace',stage:'*',w:1,once:true,age:[14,90],cool:30,
 text:"It comes unasked and undeserved, the way grace does: a stranger's plain kindness, a turn of pure luck, a door held open by no one {n} will ever be able to thank.",
 choices:[
  {t:"Take it, and pass it on someday.",h:"",do:p=>{fx(p,{spirit:6,heart:6,means:3});remember('let_in');logLine(freshPick(["Was handed an undeserved kindness by a stranger, took it, and spent years quietly trying to be worthy of the luck.","Met plain grace from someone who wanted nothing back, and carried the small debt of it gladly for life.","Got, once, a piece of pure undeserved luck from a stranger, and never quite stopped meaning to deserve it."],p),"joy");}},
 ]},
{id:'f_reversal',stage:'*',w:1,once:true,age:[26,80],cool:30,cond:()=>P.stats.means>48,
 text:"It is nobody's fault {n} can name — a bank, a market, a far-off decision by people {they} will never meet — but the comfortable ground gives way underfoot all the same.",
 choices:[
  {t:"Take the fall. Rebuild from lower.",h:"",do:p=>{fx(p,{means:-20,spirit:-3,mind:3});remember('knew_loss');logLine("Watched a comfortable footing collapse through no fault of {their} own, took the fall without flinching much, and started the long climb back from lower down.","loss");}},
 ]},

/* ---- VOCATION x ERA: content that exists only at the intersection ---- */
{id:'vx_scholar_turning',stage:'*',w:4,once:true,age:[34,70],cond:()=>P.flags.vocation==='scholar'&&typeof S!=='undefined'&&S&&S.era==='turning',
 text:"The turning age does to {n} what it does to every scholar of the old kind: makes half of what {they} mastered suddenly quaint. The new thinkers are younger, and they are not entirely wrong.",
 choices:[
  {t:"Learn the new. Be a student again.",h:"humility, late",do:p=>{fx(p,{mind:9,spirit:3,heart:-2});remember('driven');remember('set_scholar_rep');logLine("Sat down, grey-haired, among the young and the new, and let {them}self be a student again — and was carried forward instead of left.","obs");}},
  {t:"Defend the old knowing. It was true.",h:"the keeper of a fading lamp",do:p=>{fx(p,{spirit:4,mind:3,means:-3});remember('took_a_stand');logLine("Stood for the old learning while the age hurried past it, and became, with a kind of dignity, the keeper of a lamp the world was deciding to forget.","obs");}},
 ]},
{id:'vx_soldier_war',stage:'*',w:5,once:true,age:[18,52],cond:()=>P.flags.vocation==='soldier'&&typeof S!=='undefined'&&S&&S.era==='war',
 text:"For most, the war is a rumour that reaches the house. For {n}, who chose the blade, it is the actual thing — the real war, arriving exactly as {they} half-knew it would.",
 choices:[
  {t:"Do the duty fully. Whatever it costs.",h:"the soldier's whole price",do:p=>{fx(p,{means:10,spirit:3,vit:-6,heart:-4});p.flags.peril=p.age+5;remember('soldier_blooded');remember('driven');logLine("Met the real war {they} had trained for and did the whole hard duty of it, and paid, in full, the price {they} had always known the blade might ask.","obs");}},
  {t:"Refuse the worst of the orders.",h:"a soldier with a line",do:p=>{fx(p,{spirit:5,heart:4,means:-6});remember('took_a_stand');remember('stayed_straight');logLine("Found, in the real war, the one order {they} would not carry out, and refused it, and bore the cost of refusing among men who didn't.","obs");}},
 ]},
{id:'vx_maker_plenty',stage:'*',w:4,once:true,age:[28,60],cond:()=>P.flags.vocation==='maker'&&typeof S!=='undefined'&&S&&S.era==='plenty',
 text:"The fat years are kind to a good pair of hands — everyone wants what {n} makes, and wants it now. {They} could grow the workshop into something far larger, or keep it a thing {they} can still put {their} hands on.",
 choices:[
  {t:"Grow it. Ride the good years.",h:"a bigger name, fewer hands",do:p=>{if(chance(0.6)){fx(p,{means:18,spirit:4,heart:-2});remember('built_the_name');remember('driven');logLine("Grew the workshop into a real concern while the good years lasted, and stopped, somewhere in it, being the one who actually made the things.","obs");}else{fx(p,{means:-8,spirit:-3});remember('self_made');logLine("Reached to grow the workshop in the fat years and overreached, and learned the hard edge of easy money.","loss");}}},
  {t:"Keep it small. Keep your hands in it.",h:"the maker, still making",do:p=>{fx(p,{spirit:7,heart:4,means:5});remember('made_art');logLine("Let the fat years make other men big, and stayed small on purpose — still, at the end of every day, the one whose hands had made the thing.","joy");}},
 ]},
];
