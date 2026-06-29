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
   const gen=p.gen||1;
   if(seat>=7) return "{n} is born into a house written into the histories — a name that walks into rooms ahead of {them}, a past with its own gravity. {They} learns, before nearly anything, that {they} is the latest line of a story {they} did not begin.";
   if(seat>=5) return "{n} is born into a house with a name — rooms that echo, a standing to be worthy of, expectations that arrive before {they} can walk. {They} learns early that {they} is meant to be someone in particular.";
   if(gen>=5) return "{n} arrives well down a long line — five generations and more of the same name behind {them}, a whole crowded past leaning gently at {their} back. {They} is born already belonging to a story long underway.";
   if(seat<=0) return "{n} is born with little more than the name, and not much of that — a bare room, a hard start, a world already indifferent. {They} learns early to expect little, and to reach anyway.";
   if(p.traits.indexOf('frail')>=0) return "{n} comes into the world small and unfinished, a worry from the first — the kind of child the grown-ups watch too closely. The body is a fact {they} learns before any other.";
   if(p.traits.indexOf('bright')>=0) return "{n} is quick from the very start — too quick, the grown-ups say, half proud and half uneasy. Being ahead of the room is among the first things {they} learns.";
   if(p.traits.indexOf('warm')>=0||p.traits.indexOf('tender')>=0) return "{n} is, from the first, an easy and open child — the kind that hugs strangers and weeps at small cruelties. A wide heart is the earliest thing anyone notices.";
   return freshPick(["{n}'s earliest years pass the way most do — ordinary, half-remembered, a few bright fragments in a long warm blur. The world is, at first, simply everything there is.","{n}'s first years are the unremarkable kind that make the best soil — no great fortune, no great lack, just enough of everything and a world that has not yet asked anything back.","{n} comes up plainly, in a house neither high nor low, and learns the world the ordinary way: slowly, half-attending, certain it will always be this size."],p);},
 choices:[
  {t:"Take the world as it comes.",h:"",do:p=>{fx(p,{spirit:3,heart:2});logLine(freshPick(["Met the first years as they came, and took the shape of them without knowing it.","Soaked up the early world whole, the way children do, before {they} could weigh any of it.","Was, in those first years, simply and entirely a child of wherever {they} happened to land.","Took the given world for the whole world, as children do, and was at home in it without trying.","Accepted the early years exactly as handed over, and let them quietly become the floor {they} would always stand on.","Moved through the first world unquestioning and unhurried, and let it print itself on {them} for good."],p),"obs");}},
  {t:"Feel, even small, it could be otherwise.",h:"",do:p=>{fx(p,{mind:4,spirit:1});remember('early_restless');logLine(freshPick(["Felt, even very small, the first flicker of a sense that things might be arranged some other way.","Carried, from the start, a small private conviction that the given world was not the only possible one.","Looked at the world {they} was handed, even as a child, as if it were a first draft.","Sensed early, without the words for it, that the way things were was not the only way they could be.","Kept, from very young, a quiet suspicion that the world had been assembled, and could therefore be assembled differently.","Felt the given arrangement of things as provisional, even as a child, and never entirely lost the feeling."],p),"obs");}},
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
{id:'c_friend',stage:'child',w:2,onceDyn:true,age:[6,12],cond:()=>!rel('friend'),text:p=>freshPick(["There is a child at the edge of the yard who never gets picked for anything.","There is a child who spends every game just outside the circle, pretending not to mind.","One child is always left at the margin when teams are chosen, and {n} has begun to notice."],p),
 choices:[
  {t:"Sit beside them.",h:"a friend, perhaps for life",do:p=>{const s=chance(0.5)?'m':'f';addRel('friend',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age);remember('kind_to_outcast');fx(p,{heart:7});logLine(freshPick(["Made a friend nobody else wanted — and that one stayed.","Sat beside the child no one chose, and found a friendship waiting there.","Chose the edge of the yard that day, and made it less lonely for two people."],p),"joy");}},
  {t:"Look away. It's safer.",h:"a small cowardice, kept",do:p=>{remember('looked_away');fx(p,{heart:-4,spirit:-2});logLine(bucketPick(["Looked away from a lonely child, and the small shame of it stayed.","Chose not to see the child no one else saw either, and kept the small cowardice of it for years.","Walked past the lonely one, because it was easier, and felt the easiness curdle into something {they} remembered."],'lookaway_child'));}},
 ]},
{id:'c_steal',stage:'child',w:2,once:true,age:[6,12],cond:()=>P.stats.means<35,text:"Fruit on a stall, and no one watching. {n}'s stomach is loud.",
 choices:[
  {t:"Take it.",h:"",do:p=>{fx(p,{means:2,spirit:-2,heart:-2});logLine(freshPick(["Stole, once, and the taste was guilt as much as fruit.","Took what wasn't {their}s, that once, and remembered the sour taste of it longer than the sweet.","Learned, with one stolen apple, exactly how guilt sits in the stomach next to hunger."],p));}},
  {t:"Walk on, hungry.",h:"",do:p=>{fx(p,{spirit:3,vit:-2});logLine(freshPick(["Went hungry rather than take what wasn't given.","Left the fruit on the stall and the hunger in {their} belly, and felt obscurely proud of both.","Chose the empty stomach over the full pocket, young, and meant it."],p),"obs");}},
 ]},
{id:'c_wonder',stage:'child',w:2,once:true,age:[5,11],text:"Something stops {n} cold in the ordinary day — the inside of a flower, the wheel of stars, the way light falls through dust. The world cracks open a little.",
 choices:[
  {t:"Chase the wonder. Ask why.",h:"a mind that won't settle",do:p=>{fx(p,{mind:7,spirit:5});remember('early_wonder');logLine(freshPick(["Found, young, the particular drug of wanting to know, and never quite got free of it.","Stopped cold before an ordinary marvel, and started, that day, the long habit of asking why.","Looked too hard at one small thing and fell, permanently, into a curiosity the years never cured."],p),"joy");}},
  {t:"Let it pass. Go back to playing.",h:"",do:p=>{fx(p,{vit:4,heart:3,spirit:2});logLine("Felt the world crack open for a moment, shrugged, and went back to the game — which is also a way of being wise.","obs");}},
 ]},
{id:'c_unfair',stage:'child',w:2,once:true,age:[6,12],text:p=>freshPick(["{n} meets it for the first time, the way every child eventually does: a punishment that wasn't earned, a thing taken that was {their}s. The unfairness of it is enormous.","The first real injustice finds {n} early, the way it finds everyone: blamed for a thing {they} didn't do, or robbed of a thing {they} did. To a child, the size of the wrong is staggering.","{n} runs, for the first time, straight into the plain fact that the world is not fair — a credit stolen, a punishment misplaced — and feels the whole enormity of it the way only a child can."],p),
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
{id:'y_calling',stage:'youth',w:4,once:true,age:[14,22],cond:()=>!P.flags.noCalling,text:p=>{const e=(typeof S!=='undefined'&&S&&S.era)?S.era:'settled';const seat=(typeof S!=='undefined'&&S&&S.house)?(S.house.seat||0):1;
   if(e==='war') return "There is a war on, and it is hungry for the young. {n} can choose a road now — or wait, and have one chosen.";
   if(e==='hard') return "In a lean time, the choice of what to be is also the choice of how to eat. {n} stands at the fork with an empty stomach, which concentrates the mind.";
   if(e==='turning') return "The age is changing so fast that half the old roads lead nowhere now. {n} has to choose a life in a world that won't hold still long enough to promise anything.";
   if(seat>=5) return "A house with a name expects its young to take up something worthy of it. {n} feels the weight of that, and the narrower fork it makes of the open road.";
   if(seat<=0) return "With nothing behind {them} and no name to trade on, {n} chooses a road the hard way — on its own merits, and {their} own nerve.";
   return freshPick(["The years ahead want a shape. {n} stands where the roads fork, and the choosing, for once, is really {their}s.","Everyone is suddenly asking {n} the same question — what {they} will be — and it has stopped being easy to wave off.","There comes a morning when the wide-open future narrows, kindly, to a few real roads, and {n} has to pick one to walk.","{n} is old enough now to be asked the question that shapes the rest: not who {they} is, but what {they} will make of the having-been-born."],p);},
 choices:[
  {t:"The blade — a soldier's life.",h:"pay, and odds",do:p=>{fx(p,{vit:8,means:6,heart:-3,spirit:2});p.flags.vocation='soldier';remember('chose_soldier');logLine(freshPick(["Took up the soldier's life — the pay, the odds, the particular company of other people's danger.","Went for a soldier, and learned the trade of standing where other people would not.","Chose the blade, and the hard simple wage of being willing to be where it was worst.","Put on the coat and took the oath, and joined the old profession of organised danger.","Became a soldier — for the pay at first, and then for the strange belonging of it."],p));}},
  {t:"The book — the scholar's road.",h:"hungry now, wider door",do:p=>{fx(p,{mind:16,means:-8,spirit:2});p.flags.vocation='scholar';p.flags.scholar=1;remember('chose_study');logLine(freshPick(["Chose study, and hunger, and the long bet on {their} own head.","Took the scholar's road — the lean years, the late candles, the wager that a mind could be a living.","Chose the book over the bread, betting the hungry years would, eventually, be worth it.","Set out to make a living of {their} own head, and signed up, knowingly, for the long lean apprenticeship of it.","Picked the road that ran through libraries and went hungry, betting the mind would feed {them} eventually.","Chose to be paid in understanding first and bread much later, and called that a fair trade at the time.","Took up the scholar's gamble — years of want against the chance of one day knowing something worth knowing."],p));}},
  {t:"The hands — a maker's trade.",h:"steady means, narrow door",do:p=>{fx(p,{means:14,mind:-1,vit:2});p.flags.vocation='maker';p.flags.trade=1;remember('chose_trade');logLine(freshPick(["Took up a trade and a set of tools, and chose the wage over the wager — never quite poor, never quite free.","Chose the maker's trade — a craft, a bench, a steady narrow door into a sufficient life.","Learned a trade and took up the tools of it, and traded the wide gamble for the sure small thing.","Apprenticed {them}self to a craft, and chose the calluses and the certainty over the open question.","Took up tools and a trade and the modest, durable dignity of being able to make a thing well.","Chose the bench over the book and the gamble both — a known wage, a known skill, a life {they} could hold in {their} two hands.","Learned to make something the world reliably wanted, and bought, with the narrowness of it, a floor {they} would never fall through."],p));}},
  {t:"The road — go where the work is.",h:"free, and unrooted",do:p=>{fx(p,{mind:6,spirit:6,heart:-3,means:-3});p.flags.vocation='wanderer';remember('chose_road');remember('left_home');logLine(freshPick(["Chose no fixed thing at all — only the road, the work that turns up on it, and the freedom that costs.","Took the road for a trade — no master, no roof for long, only the next town and the next.","Chose the unrooted life, and the particular wealth and poverty of belonging nowhere in particular.","Picked the open road over any single roof, and learned to carry {their} whole life in what {they} could lift.","Chose movement itself as a kind of profession — the next place, the next work, the clean slate of being no one's neighbour.","Took up the wanderer's trade of belonging nowhere, and paid for the horizon in roots {they} would never put down.","Decided no one town would hold {them}, and made a life of the leaving, town after town after town."],p));}},
 ]},
// THE DRIFTER — the fifth life-shape, for the minority the engine never pushed into a calling. The fork at
// the heart of the genre's "what will you be" goes unanswered, on purpose, and that refusal is itself a road.
// Fires late in youth (after the calling window) only for the noCalling lives; sets vocation='adrift', which
// gates a full parallel adult/elder arc — so a drifter's life reads nothing like a soldier's or a scholar's.
{id:'y_adrift',stage:'youth',w:6,once:true,age:[20,28],cond:()=>P.flags.noCalling&&!P.flags.vocation,
 text:p=>freshPick(["Everyone {n}'s age has chosen a road by now — a trade, a calling, a direction. {n} has chosen none, and the not-choosing has started to feel less like lateness and more like a kind of answer.","The question of what to be never quite resolved for {n} — not from laziness, exactly, but because no single road ever looked truer than the rest. The fork is behind {them} now, untaken.","{n} watches the others settle into shapes — soldier, scholar, maker — and feels no pull toward any of them. There is a road that is just the going, and {they} seems, against the general advice, to be on it."],p),
 choices:[
  {t:"Make the drifting deliberate.",h:"a life of no fixed shape, chosen",do:p=>{p.flags.vocation='adrift';remember('chose_drift');fx(p,{spirit:5,mind:4,heart:-1});logLine(freshPick(["Decided, with a clear head, to be the one who never picked a single thing — and to do that, at least, on purpose.","Chose the open road of no chosen road, and made the refusal itself the closest thing to a calling {they} would own.","Took {their} not-choosing in hand and made it a stance: a life kept deliberately unshaped, and {their}s."],p),"obs");}},
  {t:"Let it just be what happened.",h:"a life that drifted, by default",do:p=>{p.flags.vocation='adrift';remember('drifted_default');fx(p,{mind:4,spirit:-2});logLine(freshPick(["Never quite decided, and let the years decide instead — the work that turned up, the rooms that came free, the life that accreted without a plan.","Let the question of what to be lapse, unanswered, and lived in the long shrug of it.","Drifted, not by choice exactly but by the absence of one, into a life that took whatever shape the days handed {them}."],p),"obs");}},
 ]},
{id:'y_love1',stage:'youth',w:4,age:[16,25],opensLove:true,cond:()=>!rel('love'),text:p=>freshPick(["Someone keeps finding reasons to be where {n} is. The reasons are getting thinner.","There is someone who keeps turning up where {n} is. {They} has noticed. And the noticing, by now, runs both ways.","Someone has started to matter — turning up, lingering, the way only a few people ever do.","The same face keeps appearing at the edges of {n}'s days, and the days have begun to arrange themselves around it.","There is a particular person now — nothing announced, nothing decided, just a quiet fact getting truer.","Someone has gone quiet for three days, and {n} is unsettled to find that the quiet has a shape.","It takes {n} a while to name it: the person whose absence, lately, has become the loudest thing in any room."],p),
 choices:[
  {t:"Meet them halfway.",h:"the heart opens",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,62,p.age+ri(-2,2));fx(p,{spirit:9,heart:6});logLine(bucketPick(["Started, without quite deciding to, building the days around another person.","Fell in love — the kind that quietly rearranges the furniture of a life.","Fell in love, and was surprised, as everyone is, that it was {them} this time.","Fell in love, and was aware, with a cold clarity, of everything it now made possible to lose.","Started spending time with someone, and the time arranged itself, without much drama, into a life.","Fell, with no particular grace and no real choice in it, for somebody.","Let someone in, the whole way, for the first time — and felt the terror and the relief of it together.","Found, without looking, the person the rest of the life would arrange itself around.","Chose it, clear-eyed for once — not fallen into but walked toward, and meant.","Watched it happen and let it, and was, for once, glad to be the one it happened to.","Found {them}self, against every plan, building a life around the fact of another person."],'love'),"joy");}},
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
{id:'a_marry',stage:'adult',w:4,age:[24,58],cond:()=>rel('love')&&!P.flags.married,text:()=>{const l=rel('love');const e=(typeof S!=='undefined'&&S&&S.era)?S.era:'settled';const v=P.flags.vocation;
   // era/vocation-coloured framings first (the game's most-seen beat now varies by the world and the life),
   // then the deep general pool
   if(e==='war'&&chance(0.7)) return `There is a war on, and ${P.given} and ${l.given} have stopped pretending the future is guaranteed. The question of marrying has gone, suddenly, from someday to now or perhaps never.`;
   if(e==='plague'&&chance(0.7)) return `With the sickness in the streets, the small certainties have all gone fragile — and ${P.given} finds the question of marrying ${l.given} has acquired a terrible, clarifying urgency.`;
   if(v==='soldier'&&chance(0.55)) return `${P.given} is to be posted out before long, and the asking of ${l.given} can no longer wait for a better moment — there will not be one. The question stands, plainly, between here and going.`;
   if(v==='wanderer'&&chance(0.55)) return `To marry ${l.given} would be to choose a door over the open road — the first time ${P.given} has wanted the door more than the going. It is a strange and serious wanting.`;
   return freshPick([`${P.given} and ${l.given} have been a quiet certainty for years now. ${l.given} is waiting for a question.`,`${l.given} fell asleep first again, mid-sentence; ${P.given} lay awake deciding to ask in the morning — and then, by morning, did not.`,`The question has been in the room for years — between ${P.given} and ${l.given}, just words now, standing between here and the answer.`,`It would be the simplest thing in the world, and the largest: to ask ${l.given} the question that turns two people into a household.`,`${P.given} has the ring, or the words, or the nerve — two of the three, most days. ${l.given} is not waiting, exactly. But ${l.given} is there.`,`Everyone has assumed it for years. ${P.given} and ${l.given} have assumed it for years. Only the actual asking remains, absurdly undone.`,`${P.given} keeps rehearsing the question for ${l.given} and keeps not asking it — not from doubt, which is the strange part, but from a kind of reverence that the asking is so large.`,`There is no obstacle left between ${P.given} and ${l.given} — no objection, no rival, no reason — only the small enormous matter of saying the words out loud.`],P);},
 choices:[
  {t:"Ask. Build a life.",h:"two become a household",do:p=>{const l=rel('love');l.kind='spouse';p.flags.married=1;fx(p,{spirit:11,heart:6});
    const lines = p.age>48
      ? ["Married "+l.given+" late, and found the lateness made the vow weigh more, not less.","Married "+l.given+" after both had long stopped expecting it, and meant it the more for that.","Married "+l.given+" with most of a life already behind them, and counted it the best thing in any of it.","Married "+l.given+" with grey already coming in, and found the promise none the lighter for it.","Married "+l.given+" long after the age for it, and was privately astonished to be so happy so late.","Married "+l.given+" when both had given up the expecting, and treated each ordinary day after as the windfall it was."]
      : ["Married "+l.given+". The day was small and the meaning was not.","Married "+l.given+". Nobody made a speech; the years that followed were the speech.","Married "+l.given+" on an ordinary day, and meant every word of it.","Married "+l.given+" in front of the few who mattered, and let the world find out after.","Married "+l.given+" without ceremony and without a single doubt.","Married "+l.given+", and the plain room felt larger for the promise made in it.","Married "+l.given+" young, and spent the years proving it had not been rash.","Married "+l.given+" in a hurry and a downpour, and never once wished it grander.","Married "+l.given+", and was amazed how a single ordinary afternoon could re-sort an entire life around itself.","Married "+l.given+" with borrowed rings and no money and a great deal of nerve, and never counted it anything but rich."];
    logLine(bucketPick(lines,p.age>48?'marry_late':'marry'),"joy");}},
  {t:"Not yet. Maybe never.",h:"",do:p=>{const l=rel('love');l.bond=clamp(l.bond-14);fx(p,{spirit:-6});logLine(freshPick(["Could not say yes, and watched a good thing strain.","Let the question go unasked one more time, and felt the patient thing between them lose a little of its patience.","Held back from the asking, for reasons that were real and that {they} could not, later, quite reconstruct, and the holding-back cost.","Found {they} could not, yet, make the promise — and saw, in {their} love's face, the small specific wound of the not-yet."],P),"loss");}},
 ]},
{id:'a_child',stage:'adult',w:4,age:[26,50],cool:5,cond:()=>{const k=rels('child').length; return (rel('spouse')||rel('love'))&&k<3&&!(k===0&&P.flags.noChildren)&&!(k>0&&P.flags.noMoreChildren);},
 text:p=>{const k=rels('child').length;if(k===0)return freshPick(["The question of a child arrives, the way it does — half decision, half tide.","It arrives sideways, the way it does — not quite a question yet, not quite not.","They have not spoken of it in a while. The silence on the subject has its own shape now.","The question of a child has started turning up — in a look, a held baby, an offhand remark that lands too hard.","It is on the table now, the child question, the way a large thing can sit quietly in a small room.","{n} keeps almost raising it, the question of a child, and keeps not — which is, {they} knows, its own kind of answer waiting to be overruled."],p);return k===1?"The question of another child arrives — familiar now, and still not small.":"The question of one more arrives, the way it does, and {n} already knows the weight of the answer.";},
 choices:[
  {t:"Yes. Make room in the world.",h:"the line may continue",do:p=>{haveChild();fx(p,{spirit:8,means:-6,vit:-3});}},
  {t:"No. This life, as it is.",h:"",do:p=>{const k=rels('child').length;if(k===0)p.flags.noChildren=1;else p.flags.noMoreChildren=1;fx(p,{spirit:2,means:4});logLine(k===0?bucketPick(["Chose a life without children, with clear eyes.","Decided, without regret {they} could find, that the line would not run on through {them}.","Closed the door on children deliberately, and felt the room behind it was wide, not empty.","Chose a life shaped some other way than around a child, and meant the choosing."],'nochild'):"Chose not to have another — the family, as it already was, was enough.","obs");}},
 ]},
{id:'a_work',stage:'adult',w:2,onceDyn:true,age:[28,60],cond:()=>(P.age-(P.flags.lastWork||-12))>=12&&(rel('spouse')||rel('love')||rels('child').length),
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
{id:'m_parent_age',stage:'midlife',w:3,onceDyn:true,age:[40,68],
 cond:()=>{const pa=agingParent();return !!pa;},
 text:()=>{const pa=agingParent();return `${pa.given}, {n}'s ${pa.kind}, is old now, and frightened in the small hours. ${pa.px.They} needs someone, and {n} has a life of {their} own.`;},
 choices:[
  {t:"Take them in.",h:"",do:p=>{const pa=agingParent();if(pa){pa.bond=clamp(pa.bond+14);pa.caredFor=true;}fx(p,{means:-8,spirit:-2,heart:6});logLine("Made room for an aging parent, and lost some sleep and gained some grace.");}},
  {t:"Pay for their care, from afar.",h:"",do:p=>{const pa=agingParent();if(pa){pa.bond=clamp(pa.bond-4);pa.caredFor=true;}fx(p,{means:-12});logLine(freshPick(["Did right by a parent at a careful distance.","Saw the aging parent provided for — properly, and from a distance {they} did not quite close.","Met the duty with money rather than presence, did it well, and tried not to weigh the difference.","Kept a parent comfortable and cared-for from afar, and carried the small guilt of the 'afar' quietly."],p),"obs");}},
 ]},
{id:'m_child_grown',stage:'midlife',w:3,age:[40,66],cond:()=>!!grownUnblessedChild(),
 text:()=>{const c=grownUnblessedChild();return `${c.given} is grown enough to make a choice {n} thinks is a mistake. ${c.given} is asking for {n}'s blessing, not {n}'s permission.`;},
 choices:[
  {t:"Give the blessing. Let go.",h:"",do:p=>{const c=grownUnblessedChild();if(c){c.bond=clamp(c.bond+12);c.blessed=true;}fx(p,{spirit:4});logLine("Let "+(c?c.given:'{their} child')+" make "+(c?c.px.their:'their')+" own mistake, with love.","joy");}},
  {t:"Fight it. You know better.",h:"",do:p=>{const c=grownUnblessedChild();if(c){c.bond=clamp(c.bond-16);c.blessed=true;}fx(p,{spirit:-5});logLine("Fought {their} child's choice, and won the fight and lost some of the child.","loss");}},
 ]},
{id:'m_health',stage:'midlife',w:3,once:true,onceDyn:4,age:[45,68],text:p=>freshPick(["The body sends its first real letter. A scare, a doctor's careful voice, a word {n} has to look up.","The first real warning arrives the way they do — a test, a pause, a doctor choosing words too carefully.","Something in the body finally raises its hand: a scare with a name to it, and a choice underneath the fear."],p),
 choices:[
  {t:"Change everything. Now.",h:"health, at a cost",do:p=>{fx(p,{vit:10,spirit:-3,means:-6});logLine(freshPick(["Took the warning seriously — changed the work, the food, the hours — and bought {them}self years.","Heard the body out and rebuilt the life around it — the food, the pace, the priorities — and was repaid in time.","Treated the scare as the letter it was, answered it fully, and added years {they} had nearly not had."],p),"obs");}},
  {t:"Carry on as before.",h:"the life, unbroken",do:p=>{fx(p,{vit:-8,spirit:4,means:3});p.flags.peril=p.age+8;logLine(freshPick(["Heard the warning, folded the doctor's letter away, and kept the life {they} had built.","Listened to the scare, thanked the doctor, and changed not one thing about how {they} meant to live.","Took the warning in, set it down, and went on exactly as before — for better and for worse."],p),"obs");}},
 ]},
{id:'m_money',stage:'midlife',w:2,onceDyn:true,age:[42,70],cond:()=>P.stats.means>50,text:"The savings have grown into something with weight. {n} could keep building, or finally use some of it to live.",
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
{id:'e_legacy',stage:'elder',w:3,once:true,onceDyn:5,age:[66,95],
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
{id:'e_garden',stage:'elder',w:2,age:[68,95],once:true,onceDyn:true,text:"The days are slow and wide. {n} takes up something small — a garden, a craft, a quiet ritual.",
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
{id:'cb_books_late',stage:'midlife',w:4,cond:()=>held('child_books')&&P.stats.mind>52,once:true,onceDyn:true,
 text:"{n} finds the old book on a high shelf — the one too hard for a child's hands, kept all these years.",
 choices:[
  {t:"Read it again, slowly.",h:"a circle closes",do:p=>{const bk=recall('child_books')||{};echo(bk.inherited?"Read, at last with ease, the book the family has always kept.":"Read, at last with ease, the book that began everything at age "+bk.age+".");fx(p,{spirit:9,mind:4});}},
  {t:"Pass it to a young one.",h:"",do:p=>{const c=rels('child')[0];const bk=recall('child_books')||{};echo((bk.inherited?"Gave the book the family has always kept to ":"Gave the book that shaped {them} to ")+(c?c.given:'a child')+", saying nothing of why.");if(c)c.bond=clamp(c.bond+8);fx(p,{spirit:6,heart:4});}},
 ]},
{id:'cb_outcast_return',stage:'adult',w:4,cond:()=>held('kind_to_outcast'),once:true,onceDyn:true,
 text:()=>{const f=rel('friend');return f?`The child from the yard — ${f.given}, grown — is somebody now, and has not forgotten that ${P.given} sat beside them when no one else would.`:`Someone ${P.given} helped once, years ago and asking nothing in return, is somebody now — and has not forgotten who stood with them.`;},
 choices:[
  {t:"Accept the hand up.",h:"kindness, returned with interest",do:p=>{const f=rel('friend');const a=(recall('kind_to_outcast')||{age:p.age}).age;echo(freshPick(["A kindness done at "+a+" came back, decades later, as a door held open.","The small mercy {they} showed at "+a+" returned, grown and unlooked-for, as a hand up when {they} needed one.","Found that a thing {they} did at "+a+" for no reason but decency had been quietly earning interest the whole time, and collected it."],p),"joy");fx(p,{means:14,spirit:8});if(f)f.bond=clamp(f.bond+10);}},
  {t:"Decline. You didn't do it for this.",h:"",do:p=>{echo(freshPick(["Refused to be repaid for a kindness {they} barely remembered giving.","Waved off the repayment, gently — the kindness had not been a loan, and {they} would not start treating it as one now.","Declined the returned favour, having done the original thing for its own sake and wanting to keep it that way."],p),"obs");fx(p,{spirit:6,heart:5});}},
 ]},
{id:'cb_lookaway',stage:'midlife',w:3,cond:()=>held('looked_away'),once:true,onceDyn:4,
 text:p=>freshPick(["{n} passes a person sleeping rough, and something very old turns over — the lonely child in the yard, the time {they} looked away.","A figure in a doorway, hunched against the cold, and {n} feels the decades fold: the same averted glance, the same easy walking-on, offered now to a grown stranger.","Someone needs noticing on the street, and {n} feels the old reflex to not — and behind it, suddenly, the child {they} once refused to see."],p),
 choices:[
  {t:"Stop. Don't look away this time.",h:"a debt, quietly paid",do:p=>{echo(freshPick(["Made up, to a stranger, for a child {they} had ignored "+yearsSince('looked_away')+" years before.","Stopped, this time, for the person most would pass — and paid, to someone who would never know it, a debt "+yearsSince('looked_away')+" years overdue.","Did for a stranger what {they} had failed to do for a child "+yearsSince('looked_away')+" years back, and felt an old knot, quietly, come loose."],p),"joy");fx(p,{heart:9,spirit:6,means:-3});P.mem.looked_away=null;}},
  {t:"Look away again.",h:"",do:p=>{echo(freshPick(["Looked away a second time, and knew, now, exactly what it cost.","Walked on past, as {they} had once before — but this time with no innocence left to hide behind.","Averted {their} eyes again, and felt the second turning-away settle on top of the first, heavier."],p),"loss");fx(p,{spirit:-6});}},
 ]},
{id:'cb_trade_regret',stage:'midlife',w:3,cond:()=>held('chose_trade')&&P.stats.spirit<55,once:true,
 text:"A young person asks {n} whether they should take the safe job or chase the uncertain dream. {n} hears {their} own youth in the question.",
 choices:[
  {t:"\"Chase it. I didn't.\"",h:"",do:p=>{echo("Told a young dreamer to do what {they} hadn't dared at "+recall('chose_trade').age+".");fx(p,{spirit:5,heart:4});}},
  {t:"\"Take the safe one. Like I did.\"",h:"",do:p=>{echo("Counselled caution, the way {they} had always lived.");fx(p,{spirit:-2,mind:2});}},
 ]},
{id:'cb_study_pays',stage:'adult',w:4,cond:()=>held('chose_study')&&P.stats.mind>62,once:true,onceDyn:5,
 text:p=>freshPick(["The long bet on {n}'s own mind, made hungry and young, is finally being called in. Someone wants to pay for what {they} knows.","The lean years of study come due, at last, in {their} favour: someone has found that what {n} knows is worth real money to them.","Years after {n} wagered {their} whole future on a mind and a stack of books, the wager pays — a door opens that only the learned get to walk through."],p),
 choices:[
  {t:"Name your worth.",h:"the gamble matures",do:p=>{const a=(recall('chose_study')||{age:p.age}).age;echo(freshPick(["The hungry years of study, begun at "+a+", at last came good.","The long bet {they} placed on {their} own head at "+a+" finally, improbably, paid.","What {they} starved for at "+a+" — the learning, the long shot — turned at last into a living.","The wager of those lean studying years, laid down at "+a+", came in at last, and handsomely."],p),"joy");fx(p,{means:20,spirit:7});}},
  {t:"Teach it cheap. Spread it wide.",h:"",do:p=>{echo(freshPick(["Chose to give knowledge away rather than sell it dear.","Set the price low on purpose, so the knowing would reach further than the money ever could.","Gave the learning away at cost, and counted the reach of it the better profit."],p),"joy");fx(p,{means:3,heart:8,spirit:6});remember('became_teacher');}},
 ]},
// gated on !didReturn so a life can't meet the "go back to where you started" beat twice (it also lives in
// m_wanderer_return); onceDyn:5 keeps it from recurring every few dynasties as the same hometown-return note.
{id:'cb_left_home',stage:'midlife',w:3,cond:()=>held('left_home')&&!P.flags.didReturn,once:true,onceDyn:5,
 text:p=>freshPick(["Word comes from the town {n} left long ago. It is smaller than {they} remembered, and mostly gone. {They} could go back, once.","A letter, a death, a piece of news drags {n}'s mind back to the town {they} left a lifetime ago — still there, apparently, and smaller. {They} could go and see.","The old town surfaces in {n}'s thoughts, unbidden — the place {they} left and never quite returned to. It would be a day's travel, and a lifetime's, to go back."],p),
 choices:[
  {t:"Go back. Stand where you started.",h:"",do:p=>{p.flags.didReturn=1;const a=(recall('left_home')||{age:p.age}).age;echo(freshPick(["Returned to the town {they} fled at "+a+", and found it both smaller and larger than memory.","Went back to the place {they} left at "+a+", stood in it, and felt the strange double size of an old home.","Came back to where {they} began, abandoned at "+a+", and found it had shrunk to fit a smaller life than {they} now lived."],p),"obs");fx(p,{spirit:7,heart:5});}},
  {t:"Let it stay a memory.",h:"",do:p=>{p.flags.didReturn=1;echo(freshPick(["Chose not to return, and kept the town perfect and unvisited.","Left the old place unvisited on purpose, so memory could keep it the way it never quite was.","Decided some places are better kept than seen, and never went back."],p),"obs");fx(p,{spirit:-2,mind:3});}},
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
{id:'e_window',stage:'elder',w:3,age:[60,95],once:true,onceDyn:true,cond:()=>rels('child').length>0||P.childrenIds.length>0,text:"A grandchild — small, sticky, fearless — climbs into {n}'s lap and asks what {they} was like when {they} was little.",
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
 text:p=>freshPick(["A new baby arrives in the house — small, loud, and suddenly the centre of everything. {n} is not, anymore.","The house makes room, abruptly, for a new and noisy arrival, and {n} discovers what it is to no longer be the only one.","A sibling turns up — red, demanding, and instantly the thing everyone orbits. {n} is quietly, suddenly, moved out of the centre of the world."],p),
 choices:[
  {t:"Adore the little intruder.",h:"a bond for life",do:p=>{const s=chance(0.5)?'m':'f';addRel('sibling',pick(s==='m'?GIVEN_M:GIVEN_F),s,64,0);remember('doted_sibling');fx(p,{heart:6,spirit:3});logLine(freshPick(["Took to a new sibling like it was {their} own to raise.","Fell hard for the new arrival, appointed {them}self its second protector, and meant it for life.","Decided on the spot that the small loud intruder was {their}s to look after, and never really un-decided it."],p),"joy");}},
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
{id:'a_meet_late',stage:'adult',w:2,age:[32,54],opensLove:true,cond:()=>!rel('love')&&!rel('spouse'),
 text:p=>freshPick(["It is later than the stories say it should be. And still — across a room, across a counter, across an ordinary Tuesday — someone.","The time for this was supposed to have passed. And yet — a face, a second glance, an afternoon that refuses to end — someone.","Later than anyone plans for, it arrives anyway: across a table, across a season, across the better part of a life — someone.","{n} had quietly filed this under finished, under not-for-me. And then, unreasonably and well past the deadline — someone.","Long after the believing-in-it had lapsed, it turns up regardless, wearing a face {they} did not see coming.","It comes at the wrong age and the wrong time and entirely unbidden: someone, exactly where {n} had stopped leaving room for anyone."],p),
 choices:[
  {t:"Let it begin.",h:"the heart, still open",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age+ri(-4,4));fx(p,{spirit:8,heart:6});logLine(bucketPick(["Found love later than expected, and was almost embarrassed by the size of it.","Let love in late, and was astonished how little the lateness seemed to matter to it.","Came to love past the age {they} thought it was meant for, and found it meant exactly the same.","Found, well into the second half, the thing {they} had quietly filed under never.","Met someone late, and discovered the heart had been keeping a room aired the whole time.","Fell in love at an unlikely age, and stopped, gratefully, being the exception {they}'d assumed {they} was.","Let someone matter, late, and found the lateness had only sharpened the wanting.","Came, past the age for it, to the thing {they}'d decided wasn't coming — and was wrong, gladly."],'love'),"joy");}},
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
  {t:"Keep your life your own.",h:"",do:p=>{fx(p,{heart:4,spirit:2});logLine(bucketPick(["Turned down the larger stage to keep a smaller, truer life.","Said no to the public weight, and kept instead the private life {they} actually wanted.","Let the bigger role pass to someone hungrier for it, and kept {their} own quieter ground."],'keepownlife'));}},
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
{id:'e_craft',stage:'elder',w:2,age:[70,90],once:true,onceDyn:true,cond:()=>P.stats.mind>50||held('became_teacher'),
 text:"In {n}'s hands is a craft, a trade, a way of doing some small thing well — and the hands are slower now. It could go on, or go with {them}.",
 choices:[
  {t:"Teach it to someone young.",h:"",do:p=>{remember('became_teacher');fx(p,{heart:6,spirit:7});logLine("Handed a lifetime's craft to younger hands, and so refused to take it underground.","joy");}},
  {t:"Let it retire with you.",h:"",do:p=>{fx(p,{spirit:-2,mind:2});logLine("Kept {their} craft to the end, and let it end with {them}.","obs");}},
 ]},
{id:'e_journey',stage:'elder',w:2,age:[72,86],once:true,onceDyn:true,cond:()=>P.stats.vit>32,
 text:"There is a place {n} has meant, {their} whole life, to stand in just once. The body can still, barely, be asked to go.",
 choices:[
  {t:"Go. While you still can.",h:"",do:p=>{fx(p,{spirit:12,vit:-4,means:-8,mind:3});remember('last_journey');logLine("Made the long-deferred journey at last, and stood where {they} had always meant to.","joy");}},
  {t:"Let the wanting be enough.",h:"",do:p=>{fx(p,{spirit:2,mind:4});logLine("Never made the journey, and kept the place perfect in the mind instead.","obs");}},
 ]},
{id:'e_peace',stage:'elder',w:2,age:[70,95],once:true,onceDyn:4,
 text:p=>freshPick(["It is close now, and {n} can feel the shape of it. There is a way to meet it, and the choosing of that way is nearly the last choice left.","The end has stopped being an idea and become a fact with a near date. How to meet it is nearly the last thing {n} still gets to decide.","{n} can feel it now, the way you feel weather coming. There is still a choice in how to stand when it arrives."],p),
 choices:[
  {t:"Set things in order. Say goodbye.",h:"",do:p=>{fx(p,{spirit:10,heart:5});remember('made_peace');const r=P.rels.filter(x=>x.alive).sort((a,b)=>b.bond-a.bond)[0];if(r)r.bond=clamp(r.bond+10);logLine(freshPick(["Met the end with {their} affairs in order and {their} goodbyes said.","Put the small things straight, said the things that needed saying, and met the end unhurried.","Spent the last of the time closing accounts and holding hands, and went without much left unsaid."],p),"joy");}},
  {t:"Rage against it.",h:"unquiet, to the end",do:p=>{fx(p,{vit:2,spirit:-4,heart:-2});logLine(freshPick(["Refused to go quietly, and burned at the dying of it.","Met the end the way {they}'d met most things — unwilling, and loud, and entirely {them}self.","Went down fighting a fight no one wins, and would not, even then, pretend to be at peace."],p),"loss");}},
 ]},
{id:'e_body',stage:'elder',w:3,age:[58,92],once:true,onceDyn:3,cond:()=>P.stats.vit<40,
 text:p=>freshPick(["The body has started keeping different hours than {n} does — a stiffness on waking, a slowness on the stairs, a new arithmetic to the days.","The body has begun setting its own terms — a slower morning, a shorter reach, a quiet shortening of all the old distances.","{n} and {their} body have started disagreeing about what a day can hold, and the body, lately, keeps winning the argument."],p),
 choices:[
  {t:"Slow down. Listen to it.",h:"the body, heeded",do:p=>{fx(p,{vit:6,spirit:-2,mind:2});logLine(freshPick(["Began, late, to move at the body's pace, and found a little more room inside the days.","Made, finally, an honest treaty with the slowing body, and the days grew oddly wider for it.","Let the body set the speed at last, and discovered the slower hours were not the emptier ones."],p),"obs");}},
  {t:"Push on regardless.",h:"the body, defied",do:p=>{fx(p,{vit:-6,spirit:5});p.flags.peril=p.age+6;remember('lived_reckless');logLine(freshPick(["Drove the body on past what it asked, paid for it, and would not have chosen otherwise.","Refused the body's terms and kept {their} old pace, and took the cost of it without much complaint.","Ignored what the body was plainly telling {them}, lived at the old speed anyway, and called it living."],p),"obs");}},
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
 text:p=>freshPick(["There is less ahead now than behind, and {n} finds {them}self thinking past {their} own end — to the one who will carry the name. There is still time to set aside one thing, deliberately, for them.","{n} has begun, lately, to think in terms of what gets left — and to whom. There is one thing {they} can still choose to hand down on purpose, rather than by accident.","Near the end, the question sharpens for {n}: of everything a life gathers, what is the one thing worth deliberately pressing into the hands of the one who comes next?"],p),
 choices:[
  {t:"Everything I know.",h:"a sharper mind to begin from",do:p=>{p.flags.bequest='mind';remember('bequeathed');fx(p,{mind:2,spirit:4});logLine(freshPick(["Spent {their} last good years pouring everything {they} knew into the one who would come after.","Made of {their} final years a long handing-over of everything {they}'d learned, so the next one need not learn it all the hard way.","Chose to leave a mind with a running start — every hard-won lesson set down plainly for the one who'd follow."],p),"joy");}},
  {t:"Every coin I can spare.",h:"a softer place to land",do:p=>{p.flags.bequest='means';remember('bequeathed');fx(p,{means:-6,spirit:3});logLine(freshPick(["Set aside what {they} could, so the next life would not begin as hungry as {their} own had.","Pared {their} own comfort to leave a softer landing for the one who came next, and counted it well spent.","Chose to leave money over wisdom — a floor under the next life, so it could afford to make its own mistakes."],p),"obs");}},
  {t:"The stories, and the warmth.",h:"a fuller heart to start with",do:p=>{p.flags.bequest='heart';remember('bequeathed');fx(p,{heart:4,spirit:5});logLine(freshPick(["Gave the years {they} had left to telling the next one exactly where they came from.","Left, instead of money or method, the whole warm tangle of where the family had been and who it had loved.","Chose to hand down the stories — the names, the jokes, the old kindnesses — so the next one would start knowing it belonged somewhere."],p),"joy");}},
  {t:"Nothing but their own freedom.",h:"no weight, no debt, no map",do:p=>{p.flags.bequest='free';remember('bequeathed');fx(p,{spirit:6});logLine(freshPick(["Decided the kindest inheritance was none at all, and let the next life be wholly its own.","Left, deliberately, no map and no debt — only a clean slate and the freedom to fill it however the next one chose.","Chose to bequeath nothing but room: no expectations, no weight, no inherited shape to live up to or against."],p),"obs");}},
 ]},

/* ---- THE RECKONING — earned failure pressure; updateHouse() reads facedReckoning ---- */
{id:'x_reckoning',stage:'*',w:3,age:[30,80],cool:16,cond:()=>S.house&&S.house.seat>=3&&!P.flags.facedReckoning,
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
// "nothing behind you" must mean it: only a genuinely fresh, low-gen line with no crystallised identity yet —
// not a 5th-generation heir of a house that merely slipped to seat 1 but still carries a motto and heirlooms
// (firing it there read as a logic break and made every low-seat adulthood identical). onceDyn:5 too.
{id:'s_from_nothing',stage:'adult',w:3,once:true,onceDyn:5,age:[26,54],cond:()=>S.house&&(S.house.seat||0)<=1&&P.gen<=2&&!S.house.motto&&!(S.house.heirlooms&&S.house.heirlooms.length),
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
{id:'m_peer_dies',stage:'midlife',w:2,age:[46,64],once:true,onceDyn:true,
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
// a genuine reach-back: only if the defining stand was made YOUNG (the flag's most recent set is still a
// youthful one) and is a real distance back — so it doesn't fire for every life that ever took any stand.
{id:'cb_principle',stage:'midlife',w:3,once:true,onceDyn:5,
 cond:()=>{const m=recall('took_a_stand');return m&&m.age<32&&(P.age-m.age)>=14&&P.stats.spirit>54;},
 text:p=>freshPick(["The thing {n} stood up for once, young and at a cost, comes round again — older now, more tangled, asking the same question with higher stakes.","A cause {n} bled for in {their} youth resurfaces, decades on, wearing a more complicated face and asking whether the old conviction still holds.","The principle {n} paid for young returns, the way such things do — same question at heart, but the stakes grown up alongside {them}."],p),
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
{id:'cb_talent',stage:'midlife',w:3,cond:()=>held('early_talent'),once:true,onceDyn:4,
 text:p=>{const a=(recall('early_talent')||{age:p.age}).age;return freshPick(["The thing that came so easily to {n} as a child — back at "+a+", the gift the grown-ups half-feared — surfaces again, and asks what {they} ever actually did with it.","Somewhere in midlife {n} meets, again, the early gift: the one thing that was effortless at "+a+", before the years buried it under everything that wasn't.","A young one shows {n} a flash of the same ease {they} had at "+a+", and the old talent stirs, and wants an accounting."],p);},
 choices:[
  {t:"It became the work of your life.",h:"a gift, kept faith with",do:p=>{echo(freshPick(["Looked back and found the early gift had, after all, run like a thread through the whole life — never abandoned, only grown up.","Could say, honestly, that the thing easy at the start had stayed the thing that mattered, all the way down.","Found the childhood ease had become a grown competence {they}'d built a life around, and was quietly proud of the through-line."],p),"joy");fx(p,{spirit:8,mind:4,heart:2});remember('made_art');}},
  {t:"You let it go quiet.",h:"the road not kept",do:p=>{echo(freshPick(["Admitted the early gift had been let go quiet years ago, traded for sensible things, and felt the small particular grief of an unspent talent.","Reckoned that the one effortless thing had been allowed to lapse, and sat a while with the version of {them}self that hadn't let it.","Found the childhood ease had gone unused so long it was nearly a stranger now, and mourned it briefly, and honestly."],p),"obs");fx(p,{spirit:-3,mind:3,heart:2});}},
 ]},
{id:'cb_first_loss',stage:'elder',w:2,cond:()=>held('first_loss'),once:true,onceDyn:4,
 text:p=>{const a=(recall('first_loss')||{age:p.age}).age;return freshPick(["{n} still has the small thing kept off the first dead — taken at "+a+", carried all these years. Now {n} is the old one, and the keeping has turned, quietly, into the being-kept.","The token from the first death, held since "+a+", surfaces in a drawer — and {n} understands, with a turn of the stomach, that {they} has become the grandparent {they} kept it for.","That first grief at "+a+", and the small object {they} took from it, comes back to {n} now from the other side: the one who will, soon enough, be the thing someone small keeps a token of."],p);},
 choices:[
  {t:"Pass it on. Tell the story with it.",h:"the thread, handed down",do:p=>{const c=rels('child')[0]||P.rels.filter(r=>r.alive)[0];echo(freshPick(["Gave the old token to a younger hand and the story along with it, so the first dead would be remembered one more generation on.","Pressed the small kept thing into a young palm and told whose it had been, and so refused to let the first loss finish dying.","Handed on the object and the name attached to it, and felt the long chain of keeping reach forward past {their} own end."],p),"joy");if(c)c.bond=clamp(c.bond+8);fx(p,{heart:6,spirit:5});}},
  {t:"Let it be buried with you.",h:"some things end with the one who kept them",do:p=>{echo(freshPick(["Decided the token had done its keeping, and let it go where {they} was going, the story closing gently behind them both.","Kept the small thing to the very end, unexplained, and let it be buried with the last person who knew what it meant.","Chose to let the first grief rest fully at last — the object and its meaning going quietly out of the world together with {them}."],p),"obs");fx(p,{spirit:3,mind:2});}},
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
 text:p=>bucketPick(["{n} is at the age where a reputation sets, the way a face does. There is still a little say in which one — in what the family comes to be known for, through {them}.","Somewhere in these years a name hardens around {n} — and the family's name with it. {They} has, for a little while yet, some say in which name it is.","People have started to know what to expect of {n}, and through {n}, of the house. The shape of that expectation is, for now, still slightly {their}s to set.","A reputation is setting on {n} like a cast on a healing bone. There is a narrow window left to choose what shape it sets in."],'makename_q'),
 choices:[
  {t:"Be known as learned.",h:"toward a scholarly house",do:p=>{fx(p,{mind:9,spirit:2});remember('set_scholar_rep');logLine(bucketPick(["Set out, deliberately, to be the one the family came to for answers.","Aimed {them}self at being known for knowing things, and bent the house's name that way.","Chose to make {their} name on learning, and to drag the family's reputation toward the library with {them}."],'makename'),"obs");}},
  {t:"Be known as hard to cross.",h:"toward a hard-dealing house",do:p=>{fx(p,{means:9,heart:-3});remember('cut_a_corner');logLine(bucketPick(["Set out, deliberately, to be the one no one tried twice.","Chose to be feared rather than liked, and built the family a name with teeth in it.","Decided a hard name opened more doors than a warm one, and set about earning the house exactly that."],'makename'),"obs");}},
  {t:"Be known as open-handed.",h:"toward a generous house",do:p=>{fx(p,{heart:7,means:-5,spirit:3});remember('kind_to_outcast');logLine(bucketPick(["Set out, deliberately, to be the one the door was always open at.","Chose to be known for the open hand, and to make generosity the family's whole reputation.","Aimed the house's name at warmth, and spent {them}self steadily making it true."],'makename'),"joy");}},
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
// the dishonesty callback — once the JURY's single most-repeated beat, because cut_a_corner is set by a
// dozen cards, so nearly every non-saintly life triggered it. Now it needs a corner that actually MARKED the
// person (a cold heart, or a compounding pattern), and a 5-generation cooldown — so it lands as an earned
// reckoning for a genuinely hard life, not a scheduled midlife tax in two houses out of three.
{id:'cb_corner',stage:'midlife',w:3,once:true,onceDyn:5,
 cond:()=>held('cut_a_corner')&&!held('stayed_straight')&&(P.stats.heart<54||held('strayed')||held('chose_self_over_house')||held('driven')),
 text:p=>freshPick(["The corner {n} cut once, years ago, comes back wearing a larger face — the same quiet dishonesty, more at stake, and the same certainty that no one need ever know.","An old shortcut of {n}'s circles back, grown — a bigger version of the same small wrong, and the same easy door standing open.","The thing {n} did once and got away with returns with higher stakes, asking, in the same reasonable voice, to be done again."],p),
 choices:[
  {t:"Cut it again. You know how.",h:"",do:p=>{echo(freshPick(["Did, a second time and for far more, the quiet dishonest thing — and felt almost nothing, which was its own kind of answer.","Took the larger version of the old shortcut without much pause, and noted, distantly, how little it now cost {them} to.","Cut the bigger corner the way {they}'d cut the small one, and found the second time asked even less of {their} conscience than the first."],p),"loss");fx(p,{means:14,heart:-4,spirit:-3});remember('cut_a_corner');remember('cut_deep');}},
  {t:"Not this time.",h:"",do:p=>{echo(freshPick(["Stood, this once, on the side of the thing {they} had cut past before — and was surprised how much lighter it left {them}.","Turned down the bigger version of {their} old shortcut, and felt an old weight {they}'d stopped noticing finally lift.","Refused, this time, the easy crooked thing {they}'d have taken once, and walked out of the room a degree straighter than {they} went in."],p),"joy");fx(p,{spirit:7,heart:4});remember('stayed_straight');}},
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
  {t:"Tell the truth that's owed.",h:"honesty",do:p=>{const r=rel('friend')||rel('sibling');if(r)r.bond=clamp(r.bond-14);fx(p,{spirit:3,mind:2});logLine(freshPick(["Told a truth that was owed, and lost some of someone {they} loved in the telling of it.","Said the owed thing aloud, to the people owed it, and watched it cost {them} someone {they} loved.","Chose the truth others had a right to over the loyalty {they} wanted to keep, and paid for the choosing in a friendship.","Gave the truth where it was owed, and learned that being right and being forgiven are not the same transaction."],p),"loss");}},
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
// the elder reckoning — also over-fired, because its old condition (chose_loyalty OR any cut_a_corner)
// caught most lives. Now it wants a choice that genuinely cost: a betrayal, a self-over-others fork, a
// cold corner — with a 5-generation cooldown so the closing act isn't the same reckoning house after house.
{id:'cb_the_cost',stage:'elder',w:2,once:true,onceDyn:5,
 cond:()=>held('strayed')||held('chose_self_over_house')||(held('chose_self')&&P.stats.heart<50)||(held('cut_a_corner')&&!held('stayed_straight')&&P.stats.heart<48),
 text:p=>freshPick(["Near the end, one old decision keeps returning to {n} — not a wrong one, exactly, but the one with a cost {they} has never quite finished paying.","In the last quiet, a single old choice keeps surfacing — the one {they} would defend to anyone, and has never once managed to fully settle with {them}self.","One decision, decades back, refuses to lie down at the end — the costly one, the one {they} has argued both sides of for half a life."],p),
 choices:[
  {t:"Decide it was right.",h:"",do:p=>{const which=held('chose_self')?"the life {they} took for {them}self":held('chose_others')?"the dream {they} set down for the people who needed {them}":held('strayed')?"the thing {they} did, once, to a marriage":held('chose_self_over_house')?"the way {they} put {them}self before the family's name":"the cold thing {they} did when the soft thing would have cost more";echo(freshPick(["Decided, at the last, that "+which+" had been right — and mostly believed it.","Settled, near the end, on calling "+which+" the right call — and got most of the way to meaning it.","Chose, finally, to forgive {them}self for "+which+", and found the forgiveness held, more or less."],p),"obs");fx(p,{spirit:6,heart:3});}},
  {t:"Let it stay unsettled.",h:"",do:p=>{echo(freshPick(["Let the oldest hard choice stay exactly as unsettled as it had always been, and made a kind of peace with that.","Decided some old choices are not meant to be closed, only carried, and carried this one the rest of the way without resolving it.","Left the oldest reckoning open at the end, the way it had always been, and stopped needing it to be otherwise."],p),"obs");fx(p,{mind:3,spirit:2});}},
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
  {t:"Talk about it, finally.",h:"the weight, shared",do:p=>{fx(p,{spirit:7,heart:5,mind:2});remember('made_peace');logLine(freshPick(["Spoke, at last and to one person, of the thing the war had made {them} do — and slept a little better after.","Said the unsayable war-thing aloud, once, to one trusted person, and felt the weight of it shift if not lift.","Finally let someone in on what the soldiering had cost {them}, and was, after, a fraction less alone with it."],p),"joy");}},
  {t:"Carry it alone, as ever.",h:"some things stay buried",do:p=>{fx(p,{spirit:-4,mind:3,vit:-2});remember('lived_reckless');logLine(freshPick(["Kept the worst of it where {they} had always kept it — behind the teeth, unspoken, {their} own.","Held the war's worst memory exactly where {they}'d always held it, and let it keep waking {them} at three.","Said nothing, again, and carried the soldiering's whole private weight all the way to the end."],p),"obs");}},
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
  {t:"Take the paid work. Question on the side.",h:"a roof, and a little light",do:p=>{fx(p,{mind:7,means:8,spirit:-2});remember('chose_study');logLine(bucketPick(["Kept the question for evenings and the paid work for days, and made, between them, a sufficient life.","Fed {them}self with dull paid work and the question with whatever evenings were left, and called the arrangement enough.","Split the difference — a wage by day, the real wondering by night — and built a roof over a quiet obsession."],'scholar_sideq'),"obs");}},
 ]},
{id:'m_scholar_legacy',w:3,once:true,onceDyn:5,age:[48,70],cond:()=>P.flags.vocation==='scholar'&&P.stats.mind>52,
 text:p=>freshPick(["{n} has built up a thing worth keeping — a body of knowing, hard-won. The question now is whether to give it away or guard it.","The learning {n} spent a life accumulating has become an estate of its own. What to do with it — spend it freely, or keep it close — is suddenly a real question.","{n} holds, now, a great deal of hard-won knowing, and a choice about it: to scatter it wide while {they} can, or to hold it as the dearly-bought thing it was."],p),
 choices:[
  {t:"Give it all away. Teach.",h:"knowing, handed on",do:p=>{fx(p,{heart:7,spirit:6,means:-3});remember('became_teacher');logLine(freshPick(["Gave away everything {they} knew, freely and to anyone who'd take it, and so made sure it outlived {them}.","Spent {their} last good years pouring the learning into whoever would hold still for it, and so refused to take it underground.","Opened the whole hard-won storehouse of what {they} knew and let anyone walk in, counting the giving-away the truest keeping.","Handed the learning out with both hands, to the deserving and the un-, and made of {their} knowing a thing that would outlast the knower.","Decided knowledge hoarded was knowledge half-dead, and gave {their}s away until there was nothing left to guard."],p),"joy");}},
  {t:"Guard it. It was dearly bought.",h:"yours, and yours alone",do:p=>{fx(p,{mind:5,means:6,heart:-3});remember('set_scholar_rep');logLine(freshPick(["Kept what {they} knew close and well-defended, the way a thing dearly bought is kept.","Held the learning tight, parted with it only at a price, and felt no need to apologise for valuing what had cost {them} so much.","Guarded the hard-won knowing like the asset it was, and let those who wanted it pay, in coin or in deference, for the privilege.","Kept the storehouse locked and the key {their} own, having starved too long for the contents to give them away now."],p),"obs");}},
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
  {t:"Stay. Let the road end here.",h:"roots, at last",do:p=>{fx(p,{heart:8,spirit:4,means:4});p.flags.vocation='settled';remember('stayed_home');logLine(freshPick(["Let the road end, finally, in one place with one set of faces — and was surprised how much like relief it felt.","Stopped, at last, and let one town and one set of faces be enough — and found, to {their} surprise, that they were.","Put the road down for good and stayed, and discovered that roots, after all the running, felt less like a cage than a chair.","Chose, after a life of leaving, to stay — and met the strange unfamiliar peace of waking in the same place twice."],p),"joy");}},
 ]},
{id:'m_wanderer_return',w:3,once:true,onceDyn:5,age:[46,68],cond:()=>P.flags.vocation==='wanderer'&&!P.flags.didReturn,
 text:p=>freshPick(["After all the years and all the roads, {n} comes back to the place {they} started — smaller now, or {they} are larger, the arithmetic never quite works.","The road loops back, the way it does, and sets {n} down at last in the town {they} started from — changed, or unchanged, it is hard to say which of them did the changing.","One of the roads finally leads home, and {n} walks it: back to the first place, after all the others, to see what is left and what {they} has become."],p),
 choices:[
  {t:"Stay a while. Make peace.",h:"",do:p=>{p.flags.didReturn=1;fx(p,{heart:6,spirit:5,mind:3});remember('made_peace');logLine(freshPick(["Went home at last, and found it had gone on without {them}, and made a quiet peace with both facts.","Came back to the first place at last, sat in what was left of it, and let the long going settle into something like peace.","Returned, finally, and found home had become a smaller and more forgivable thing than the one {they}'d fled."],p),"obs");}},
  {t:"See it, and go. Home is the road now.",h:"",do:p=>{p.flags.didReturn=1;fx(p,{spirit:3,heart:-2,mind:4});logLine(freshPick(["Looked at the old place once, the way you look at an old photograph, and went back to the only home {they} had left — the going itself.","Saw the first place again, felt nothing {they} could use, and turned back to the road that had become the only home that fit.","Stood in the doorway of the beginning, found it didn't hold {them} any more than it had, and left it for good."],p),"obs");}},
 ]},

/* ---- THE DRIFTER ARC — a full parallel cluster for the uncalled life (vocation==='adrift') ---- */
{id:'a_adrift_work',w:4,once:true,age:[28,52],cond:()=>P.flags.vocation==='adrift',
 text:p=>freshPick(["{n} has done a dozen things by now and mastered none on purpose — a season here, a trade there, a job held just long enough to learn it and leave. People keep asking what {they} actually does. {They} has stopped having an answer ready.","The work, for {n}, has always been whatever was going — hands for hire, a knack picked up and set down, no name over any door. It has its freedoms. It also has a way of leaving {them} the odd one out at every table.","By now {n} could turn a hand to most things and calls none of them {their}s. A life assembled from odd pieces — and the question, lately, of whether the pieces add to anything."],p),
 choices:[
  {t:"Lean into the range. Be unplaceable.",h:"a jack of all, master of the going",do:p=>{fx(p,{mind:7,spirit:4,means:-2,heart:-2});remember('self_made');logLine(freshPick(["Made a virtue of the variety, got good at being good-enough at everything, and wore the unplaceability like a coat that fit.","Stopped apologising for having no single trade and started trading, openly, on knowing a little of all of them.","Leaned all the way into the drifting life, and found the range itself was a kind of skill few of the settled ever got."],p),"obs");}},
  {t:"Ache, quietly, for an anchor.",h:"the cost of no fixed thing",do:p=>{fx(p,{spirit:-3,mind:3,heart:2});remember('knew_loss');logLine(freshPick(["Felt, under the freedom, the particular tiredness of the unanchored — the envy, now and then, of people who knew what they were.","Caught {them}self wanting, badly and briefly, the one solid thing the settled had: a name for what they did all day.","Carried the small constant weight of the unrooted — the sense, at every gathering, of being the question no one had an answer to."],p),"obs");}},
 ]},
{id:'m_adrift_reckon',w:3,once:true,age:[46,64],cond:()=>P.flags.vocation==='adrift',
 text:p=>freshPick(["The ones who chose — the soldier, the scholar, the one with the shop — have arrived somewhere by now: a title, a body of work, a thing to point at. {n} is asked, at a certain age, to point at something, and finds the gesture harder than expected.","Midlife asks {n} the question {they} dodged at twenty, and asks it harder: what, in the end, has the not-choosing built? The answer is not nothing. It is also not the thing the settled have.","{n} reaches the middle of it and takes stock — and the stock is strange: no career to total up, no craft to weigh, only a long uncatalogued accumulation of having been many places and no one in particular."],p),
 choices:[
  {t:"Make peace. The drift was the life.",h:"a shape, after all",do:p=>{fx(p,{spirit:7,mind:4,heart:3});remember('made_peace');remember('chose_drift');logLine(freshPick(["Decided, at the reckoning, that a life spent unfixed had been a life all the same — wider than most, if harder to name.","Stopped measuring {them}self by the settled people's ruler, and found, by {their} own, the drifting had added to plenty.","Made an honest peace with having built no monument, and counted instead the rooms entered, the things half-learned, the freedom kept."],p),"joy");}},
  {t:"Grasp, late, for a single thing.",h:"a shape, chosen at last",do:p=>{fx(p,{mind:5,spirit:-2,means:3});remember('reinvented');logLine(freshPick(["Tried, late and a little desperately, to become the one thing {they}'d never picked — and got further than {they}'d feared, if not as far as {they}'d hoped.","Reached, at midlife, for a single trade to finally be {their}s, and bent the back half of the life toward it.","Decided the drifting had gone on long enough and set, belatedly, about choosing — which at that age is its own steep climb."],p),"obs");}},
 ]},
{id:'e_adrift_old',w:3,once:true,age:[66,92],cond:()=>P.flags.vocation==='adrift',
 text:p=>freshPick(["At the end, {n} has no body of work to leave, no trade to hand on, no title carved anywhere. What a life leaves when it refused to be one thing is the question of these last quiet days.","The others are remembered for what they were — the soldier, the maker. {n} will be remembered, if at all, for something harder to say: a way of being loose in the world, present everywhere and held nowhere.","{n} comes to the end of a life that never picked a shape, and finds the un-shaping was, itself, the most consistent thing about {them} — the one road walked the whole way through."],p),
 choices:[
  {t:"Count the roads not closed.",h:"a life kept open to the end",do:p=>{fx(p,{spirit:6,mind:4});remember('made_peace');logLine(freshPick(["Reckoned up a life that kept every door open by walking through none for long, and found the openness itself had been worth the rootlessness.","Decided a life is not failed for refusing a single shape — that {they} had, in the drifting, stayed more free than nearly anyone {they} knew.","Looked back over all the unpicked roads and felt no regret {they} could name — only the wide, strange completeness of having belonged to none of them."],p),"obs");}},
  {t:"Count the doors a fixed life would have opened.",h:"the cost of belonging nowhere",do:p=>{fx(p,{spirit:-2,heart:3,mind:3});remember('knew_loss');logLine(freshPick(["Tallied, at the last, what a single chosen road might have built — the mastery, the belonging, the name — and felt the absence of it plainly, and let it be.","Counted the cost of the open life: the depth never reached, the people who never quite knew where to place {them}, the monument never started.","Wondered, at the end, who {they} might have become with one road walked all the way down — and carried the unanswerable question out with {them}, gently."],p),"obs");}},
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
  {t:"Bury it in work. Keep moving.",h:"",do:p=>{fx(p,{spirit:-3,means:6,vit:-2});remember('driven');logLine(bucketPick(["Lost someone to the war and put the loss away in work, where it kept, badly, for years.","Took the war's theft of someone and folded it into labour, where it sat, undealt-with, for a long time.","Met the war-grief by refusing to meet it — buried it under work, and let it keep there, souring, for years.","Lost someone to the war and went somewhere cold and busy inside, and stayed there longer than was good for {them}."],'wargrief'),"loss");}},
 ]},
{id:'w_plague_tend',w:5,once:true,age:[18,72],cond:()=>typeof S!=='undefined'&&S&&S.era==='plague',
 text:p=>bucketPick(["The sickness is in the next street, then the next house. Someone close has it, and tending them means breathing the same air.","It reaches {n}'s household the way it reaches every household — someone close falls ill, and to tend them is to share the air that is killing them.","The plague stops being other people's news the morning someone {n} loves wakes burning. To nurse them is to stand in its path.","First the rumours, then the shuttered doors, then the fever in {n}'s own house — and the impossible arithmetic of whether to go near the one who is sick.","The dying has come indoors. Someone {n} loves is among the stricken now, and there is no tending them from a safe distance."],'plague_tend'),
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
{id:'t_warm',w:2,once:true,onceDyn:true,age:[24,62],cond:()=>P.traits.includes('warm')||P.traits.includes('tender'),
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
{id:'d_ancestor',w:3,once:true,onceDyn:true,age:[20,70],cond:()=>typeof S!=='undefined'&&S&&S.lineage&&S.lineage.length>=1,
 text:p=>{const a=S.lineage[rotI(p,S.lineage.length)];const nm=a?a.given:"someone before";
   const DEED={stray:"the one who took in every hurt and helpless thing",teacher:"the one who gave away everything they knew",secret:"the one who carried something to the grave the family still won't name",built:"the one who built something that outlasted the building of it",here:"the one who asked for no monument but the fact of having been here",kind:"the one remembered, above all, for a fierce plain kindness",mind:"the one who lived half in their own head and saw further for it",light:"the one nothing could quite discourage, to the very end",dark:"the one who carried more sorrow than they ever said aloud",poor:"the one who never had much and shared even that",generous:"the one who gave past what they could afford",warm:"the one who was easy to love and not always easy to live beside",content:"the one who had enough, and knew it",long:"the one who outlasted nearly everyone",early:"the one taken too soon, with so much unspent"};
   const deed=(a&&a.cluster&&DEED[a.cluster])?DEED[a.cluster]:"the one who did a hard, particular thing the family still argues about";
   return "There is a story in the family about "+nm+" — "+deed+". {n} has heard it so often it has the worn shape of a lesson, though no two tellers agree on the moral.";},
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
   DYNASTY-STATE — content a NEW house literally cannot reach. These gate on
   accumulated state (a summit seat, a fall from a remembered height, five
   generations of line) so that a long-played house meets moments a founder
   never will — the jury's "reward building a dynasty, don't treat each life as
   an episode." A new player sees none of these; a deep line earns all of them.
   ============================================================ */
{id:'dyn_summit',w:4,once:true,onceDyn:3,age:[30,80],cond:()=>S&&S.house&&(S.house.seat||0)>=6,
 text:p=>freshPick(["The name {n} carries is, now, one of the great ones — written where such names get written, said with the particular weight reserved for houses at the very top. There is only one direction left from here, and {n} can feel the whole family leaning against it.","{n} stands at the summit a hundred earlier lives climbed toward: a storied house, every door already open, every eye already on the name. It is a strange air up here — thin, exposed, and impossible to climb any higher in.","To be {n}, at the height the family has reached, is to spend a life being recognised before {they} speaks — and to hold, whether {they} wants it or not, a name that a great many people are watching to see fall."],p),
 choices:[
  {t:"Hold the summit. Guard the name.",h:"the weight of the top",do:p=>{fx(p,{means:-12,spirit:-4,vit:-2});p.flags.lastWork=p.age;remember('built_the_name');remember('honored_line');logLine(freshPick(["Spent {them}self holding the family at its summit — the entertaining, the patronage, the endless careful guarding of a name with nowhere left to rise.","Carried the storied name the way it demanded to be carried, and paid, in years and coin, the steep rent of the very top.","Gave {their} own life over to keeping the house where generations had labored to put it, and felt the full cold weight of the summit settle on {their} shoulders."],p),"obs");}},
  {t:"Loosen your grip. Let it be lighter.",h:"a name worn, not served",do:p=>{fx(p,{spirit:7,heart:4,means:4});remember('refused_the_name');logLine(freshPick(["Decided the summit could keep itself for a generation, and wore the great name lightly, and breathed, for once, at the top.","Refused to spend a whole life serving a name, even a storied one, and let the house sit at its height without {them} guarding every inch of it.","Loosened {their} grip on the family's pinnacle, on purpose, and discovered the name did not, in fact, fall the instant {they} stopped clutching it."],p),"joy");}},
 ]},
{id:'dyn_decline',w:4,once:true,onceDyn:3,age:[28,72],cond:()=>P.gen>=4&&S&&S.house&&(S.house.seat||0)<=2&&S.marks&&(S.marks.peakSeat||0)>=4,
 text:p=>freshPick(["There are still old people who remember when {n}'s name meant something — a house of standing, a family that mattered. {n} lives in the gap between what the name was and what it has become, and the gap has a particular ache to it.","The family was great once, and is not now. {n} carries a name heavier than the house behind it — the silver long sold, the rooms long let go, only the memory of standing left, and the strangers who still, occasionally, expect it.","{n} inherited a fallen thing: a name that opened doors two generations ago and now mostly invites the question of what happened. The house remembers a height it can no longer reach, and asks {n}, quietly, to do something about that."],p),
 choices:[
  {t:"Try to climb it back.",h:"the long road up, again",do:p=>{fx(p,{means:6,spirit:-3,vit:-2});p.flags.lastWork=p.age;remember('driven');remember('built_the_name');logLine(freshPick(["Set {them}self, against long odds, to climbing the family back toward the height it had fallen from — and got at least the climbing started.","Refused to be the generation that let the old name finish dying, and spent {their} strength trying to haul it back up the hill.","Took the fallen house as a debt {they} meant to pay, and bent {their} life to the slow, unglamorous work of restoring a name."],p),"obs");}},
  {t:"Let the old name go. Live your own size.",h:"free of a borrowed height",do:p=>{fx(p,{spirit:6,heart:3,mind:2});remember('own_way');logLine(freshPick(["Let the family's old greatness be the past's business, and lived, with some relief, at the honest size of the present.","Set down the heavy memory of what the house had been, and stopped measuring a real life against a remembered one.","Decided the fallen name was a story, not a sentence, and built a smaller, truer life with no apology owed to the dead."],p),"joy");}},
 ]},
{id:'dyn_founder_echo',w:3,once:true,onceDyn:4,age:[24,76],cond:()=>P.gen>=5&&S&&S.lineage&&S.lineage.length>=1,
 text:p=>{const f=S.lineage[0];const nm=f?f.given:"the first of the line";return freshPick(["Five generations back stands "+nm+" — the one who began all this, who founded a line out of not much and never saw past the first room of it. {n} carries a name that is now, in part, an answer to a question "+nm+" never got to ask.","The family has a beginning, and its name is "+nm+". {n} is far enough down the line now that the founder is more legend than person — and yet here {they} is, the living end of a thread "+nm+" tied off and let go of long ago.","{n} comes, today, to think of "+nm+" — the first of them, gone these five generations, who would not recognise the house {they} started, and might or might not be proud of where the thread has run."],p);},
 choices:[
  {t:"Honour the first of the line.",h:"the thread, held",do:p=>{fx(p,{spirit:5,heart:3,mind:2});remember('honored_line');remember('took_a_stand');logLine(freshPick(["Took up the founder's beginning as a thing to be worthy of, and bent the present life, a little, toward honouring a person {they} never met.","Decided the first of the line had earned {their} carrying-on, and carried the name forward as a debt gladly owed across five generations.","Felt the long thread back to the founder pull taut, and chose, deliberately, to be a good continuation of it."],p),"obs");}},
  {t:"The founder is a stranger now. Be your own first.",h:"a new beginning, claimed",do:p=>{fx(p,{spirit:6,mind:3,means:2});remember('own_way');remember('chose_self');logLine(freshPick(["Decided five generations was distance enough, let the founder be the founder, and resolved to be the first of whatever came next instead.","Set the old beginning down with respect and no obligation, and chose to start a thread of {their} own from where {they} stood.","Looked back at the founder across five generations, felt mostly the strangeness of it, and turned to face {their} own beginning instead."],p),"obs");}},
 ]},

/* ============================================================
   ANTI-STALENESS PASS 2 — break the late-love/elder monoculture:
   distinct SOLITARY & CHILDLESS life-shapes (now ~a quarter / a
   seventh of lives), elder arcs that differ by how a life was lived,
   FATE events that simply happen (no choosing your way out), and
   cards that exist only where a vocation meets an era.
   ============================================================ */

/* ---- SOLITARY & CHILDLESS: real shapes, not dead-ends ---- */
{id:'m_solitary',stage:'midlife',w:3,age:[44,64],once:true,cond:()=>!rel('spouse')&&!rel('love')&&!rels('child').length&&(!P.childrenIds||!P.childrenIds.length),
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
{id:'f_fire',stage:'*',w:1,once:true,onceDyn:5,age:[18,88],cool:30,cond:()=>P.stats.means>24,
 text:p=>freshPick(["There is no warning, the way there never is. A fire — a lamp, a dry season, a neighbour's carelessness — and by morning a great deal of what {n} had is ash and stink.","It starts small and somewhere else — a lamp, a spark, a dry wind — and by the time {n} understands it, much of what {they} owned is going up in the dark.","Fire, the old indiscriminate thief: a careless flame in the night, and by morning the years of accumulation {n} had thought solid are smoke and wet ash."],p),
 choices:[
  {t:"Begin again from the ash.",h:"there is no other option",do:p=>{fx(p,{means:-18,spirit:-4,vit:-2});remember('knew_loss');logLine(freshPick(["Lost much of what {they} had to a fire {they} could not have prevented, stood in the wet ash a while, and began again.","Watched a fire take, in one night, what it had taken years to gather — and started over, because there was nothing else to do.","Lost the house and most of what was in it to a fire, and learned the cold lesson of how fast a life's accumulation burns."],p),"loss");}},
 ]},
{id:'f_sudden_loss',stage:'*',w:1,once:true,onceDyn:4,age:[20,88],cool:28,cond:()=>P.rels.some(r=>r.alive&&r.bond>52&&r.kind!=='ex'),
 text:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>52&&x.kind!=='ex')[0];return (r?r.given:"Someone")+" is simply gone one morning — no illness anyone marked, no warning anyone caught. The world does this sometimes, without asking.";},
 choices:[
  {t:"Let it break you, and mend slow.",h:"",do:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>52&&x.kind!=='ex')[0];if(r)r.alive=false;fx(p,{spirit:-7,heart:5});remember('knew_loss');logLine("Lost someone with no warning at all, let the grief have its full brutal say, and was a long time mending.","loss");}},
  {t:"Go numb, and keep moving.",h:"",do:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>52&&x.kind!=='ex')[0];if(r)r.alive=false;fx(p,{spirit:-4,heart:-3,means:4});remember('driven');logLine(freshPick(["Lost someone without warning, went somewhere cold and useful inside, and did not come fully back for years.","Met the sudden death by going numb and busy, and postponed the grief so long it never quite arrived properly.","Took the blow standing, buried it in work, and carried the undealt-with weight of it for the rest of {their} life."],p),"loss");}},
 ]},
{id:'f_grace',stage:'*',w:1,once:true,onceDyn:6,age:[14,90],cool:30,
 text:p=>freshPick(["It comes unasked and undeserved, the way grace does: a stranger's plain kindness, a turn of pure luck, a door held open by no one {n} will ever be able to thank.","Out of nowhere, and for no reason {n} can find, the world is briefly and inexplicably kind — a trouble taken on {their} behalf, a piece of luck {they} did nothing to earn.","Grace arrives sideways and undeserved: someone {n} will never see again does {them} a plain, large kindness, and is gone before {they} can even learn the name to thank."],p),
 choices:[
  {t:"Take it, and pass it on someday.",h:"",do:p=>{fx(p,{spirit:6,heart:6,means:3});remember('let_in');logLine(freshPick(["Was handed an undeserved kindness by a stranger, took it, and spent years quietly trying to be worthy of the luck.","Met plain grace from someone who wanted nothing back, and carried the small debt of it gladly for life.","Got, once, a piece of pure undeserved luck from a stranger, and never quite stopped meaning to deserve it."],p),"joy");}},
 ]},
{id:'f_reversal',stage:'*',w:1,once:true,onceDyn:5,age:[26,80],cool:30,cond:()=>P.stats.means>48,
 text:p=>freshPick(["It is nobody's fault {n} can name — a bank, a market, a far-off decision by people {they} will never meet — but the comfortable ground gives way underfoot all the same.","Somewhere far off, people {n} will never meet make a decision, and the solid floor of {their} circumstances quietly turns to air.","No one did it to {n}, exactly — a market, a panic, a number moving in a city {they} has never seen — and yet the comfort {they} had built is suddenly, bafflingly gone."],p),
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

/* ============================================================
   ANTI-STALENESS PASS 7 — thicken the thin adult/midlife years
   (repeatable, so they keep the 28-64 band alive in later
   generations after the once-per-dynasty milestones have rotated out)
   ============================================================ */
{id:'a_smallchoice',stage:'adult',w:3,once:true,age:[27,58],
 text:p=>freshPick(["A small fork in an ordinary week: the easy thing or the right thing, and no one watching to know which {n} picks.","One of those minor crossroads the years are mostly made of — nothing dramatic, just a quiet chance to be a little better or a little worse.","A low-stakes choice arrives, the kind that leaves no mark on the day and somehow all the marks on the life."],p),
 choices:[
  {t:"The right thing. Quietly.",h:"character, in private",do:p=>{fx(p,{spirit:4,heart:3,means:-1});remember('stayed_straight');logLine(freshPick(["Did the harder right thing when no one was watching, which is the only place it ever really counts.","Chose well in a moment too small to be noticed, and was, by a hair, a better person for it.","Took the quiet honest option nobody would have known {they} skipped, and knew."],p),"obs");}},
  {t:"The easy thing. Just this once.",h:"a small slack, taken",do:p=>{fx(p,{means:2,spirit:-1});logLine(freshPick(["Took the easy way in a small thing, told {them}self it didn't matter, and was mostly right.","Cut the small corner, the way everyone does, and felt the almost-nothing of it.","Let {them}self off the hook on a little thing, and the little thing stayed little."],p),"obs");}},
 ]},
{id:'a_friend_drift',stage:'adult',w:2,once:true,age:[30,62],cond:()=>rel('friend'),
 text:p=>{const f=rel('friend');return (f?f.given:"An old friend")+" and {n} have drifted, the way people do — not a falling-out, just two lives that stopped overlapping. A word now would close the gap, or confirm it.";},
 choices:[
  {t:"Reach out. Mend it.",h:"",do:p=>{const f=rel('friend');if(f)f.bond=clamp(f.bond+10);fx(p,{heart:5,spirit:3});logLine(freshPick(["Picked up a drifted friendship before it could finish drifting, and was glad to find it still fit.","Reached across the gap of years to an old friend, and found the bridge held.","Made the small effort that keeps a friendship from quietly becoming a memory."],p),"joy");}},
  {t:"Let it fade. People do.",h:"",do:p=>{fx(p,{spirit:-2,mind:2});logLine(freshPick(["Let an old friendship finish its quiet fade, and told {them}self it was just how the years went.","Watched a friendship thin to nothing without doing the one small thing that would have saved it.","Let the gap with an old friend become permanent, by the simple method of doing nothing."],p),"obs");}},
 ]},
{id:'m_smaller_body',stage:'midlife',w:3,once:true,age:[48,66],cond:()=>P.stats.vit<58,
 text:p=>freshPick(["Not a scare, exactly — just the body making one more small, non-negotiable adjustment to what it will and won't do now.","The body files another minor amendment: a thing that used to be free now costs a little, and will keep costing.","One more of the body's quiet retirements — some small ability handed in, without ceremony, for good."],p),
 choices:[
  {t:"Adjust. Carry on.",h:"",do:p=>{fx(p,{mind:2,spirit:1});logLine(freshPick(["Made the small adjustment the body asked for, without much fuss, and carried on.","Took the body's latest small retirement in stride, and found a workaround, as one does.","Quietly rearranged the day around one more thing the body would no longer do."],p),"obs");}},
  {t:"Rage, a little, first.",h:"",do:p=>{fx(p,{spirit:-2,vit:1,heart:1});logLine(freshPick(["Was briefly, uselessly furious at the body for its latest small betrayal, then adjusted anyway.","Resented the body's newest limit for an afternoon, which changed nothing and helped a little.","Grieved one more small lost ability properly before getting on with the workaround."],p),"obs");}},
 ]},
{id:'a_recognition',stage:'adult',w:2,once:true,age:[32,60],cond:()=>P.stats.means>34||P.stats.mind>60,
 text:p=>freshPick(["A small recognition arrives — not fame, just being, for once, plainly seen and valued for the work {n} actually does.","Someone, with no reason to flatter, tells {n} that the work is good, and means it. It lands harder than expected.","A modest honour, a word of real praise, a thing {n} can point to — the quiet validation of a life's ordinary effort."],p),
 choices:[
  {t:"Let it land. Enjoy it.",h:"",do:p=>{fx(p,{spirit:6,heart:2});logLine(freshPick(["Let a small, genuine recognition land fully, instead of deflecting it, for once.","Took the rare plain praise without arguing with it, and was warmer for days.","Believed, for a whole afternoon, that the work had been worth doing — because someone said so, and meant it."],p),"joy");}},
  {t:"Deflect. Back to work.",h:"",do:p=>{fx(p,{mind:3,means:2,spirit:-1});remember('driven');logLine(freshPick(["Deflected the praise, as ever, and was back at the work before it could properly warm {them}.","Brushed off a real recognition with a joke, and privately wondered why {they} always did that.","Took the compliment sideways and got back to it, which is its own small sad efficiency."],p),"obs");}},
 ]},
{id:'m_late_skill',stage:'midlife',w:2,age:[46,64],once:true,
 text:"Past the age when people are supposed to start things, {n} finds {them}self wanting to learn one — an instrument, a language, a craft — from the clumsy beginning.",
 choices:[
  {t:"Begin badly, anyway.",h:"a beginner, late",do:p=>{fx(p,{mind:6,spirit:5,heart:2});remember('reinvented');logLine(freshPick(["Took up a new thing too late to ever be good at it, and loved being bad at something again.","Became, in midlife, a clumsy beginner at one chosen thing, and found the beginning was the best part.","Started something new past the proper age for starting, purely for the pleasure of being a novice once more."],p),"joy");}},
  {t:"Decide it's too late.",h:"",do:p=>{fx(p,{spirit:-2,mind:2});logLine(freshPick(["Decided it was too late to begin, which was both true and the wrong lesson.","Let the wish to learn a new thing pass, filed under someday, which is to say never.","Talked {them}self out of beginning, with reasons that were sensible and a little sad."],p),"obs");}},
 ]},
];
