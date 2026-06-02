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
{id:'c_book',stage:'child',w:3,age:[7,12],text:"A teacher leaves a book on {n}'s desk by mistake. It is far too difficult. {They} could return it, or keep it and try.",
 choices:[
  {t:"Keep it. Climb the hard pages.",h:"the mind reaches",do:p=>{fx(p,{mind:8,spirit:3});remember('child_books');logLine("Read a book {they} couldn't yet understand, and loved it anyway.");}},
  {t:"Give it back. Go out and play.",h:"the body runs",do:p=>{fx(p,{vit:6,heart:4});remember('child_outdoors');logLine("Spent the afternoon outside until the light went.");}},
 ]},
{id:'c_sick',stage:'child',w:2,once:true,age:[3,10],text:"A fever takes the house for a week. {n} is small in a large bed.",
 choices:[
  {t:"Let mother sit through the nights.",h:"a bond is set",do:p=>{const m=rel('mother');if(m)m.bond=clamp(m.bond+12);fx(p,{vit:-4,heart:5});logLine("Was nursed through a fever; remembered a cool hand for life.","obs");}},
  {t:"Insist on being brave alone.",h:"a habit is set",do:p=>{fx(p,{vit:-2,spirit:-3,mind:2});logLine("Learned early to be ill quietly.","obs");}},
 ]},
{id:'c_friend',stage:'child',w:3,age:[6,12],cond:()=>!rel('friend'),text:"There is a child at the edge of the yard who never gets picked for anything.",
 choices:[
  {t:"Sit beside them.",h:"a friend, perhaps for life",do:p=>{const s=chance(0.5)?'m':'f';addRel('friend',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age);remember('kind_to_outcast');fx(p,{heart:7});logLine("Made a friend nobody else wanted; this turned out to matter.","joy");}},
  {t:"Look away. It's safer.",h:"a small cowardice, kept",do:p=>{remember('looked_away');fx(p,{heart:-4,spirit:-2});logLine("Looked away from a lonely child, and the small shame of it stayed.");}},
 ]},
{id:'c_steal',stage:'child',w:2,age:[6,12],cond:()=>P.stats.means<35,text:"Fruit on a stall, and no one watching. {n}'s stomach is loud.",
 choices:[
  {t:"Take it.",h:"",do:p=>{fx(p,{means:2,spirit:-2,heart:-2});logLine("Stole, once, and the taste was guilt as much as fruit.");}},
  {t:"Walk on, hungry.",h:"",do:p=>{fx(p,{spirit:3,vit:-2});logLine("Went hungry rather than take what wasn't given.","obs");}},
 ]},

/* ---- YOUTH ---- */
{id:'y_path',stage:'youth',w:3,once:true,age:[15,20],text:"Two roads open. A trade that pays now, sure and small — or years of study with no promise at the end.",
 choices:[
  {t:"Take the trade. Eat today.",h:"steady means, narrow door",do:p=>{fx(p,{means:14,mind:-2,vit:2});p.flags.trade=1;remember('chose_trade');logLine("Chose the wage over the wager. Was never quite poor, never quite free.");}},
  {t:"Study. Gamble on the mind.",h:"hungry now, wider door",do:p=>{fx(p,{mind:16,means:-8,spirit:2});p.flags.scholar=1;remember('chose_study');logLine("Chose study, and hunger, and the long bet on {their} own head.");}},
 ]},
{id:'y_love1',stage:'youth',w:6,age:[16,25],opensLove:true,cond:()=>!rel('love'),text:"Someone keeps finding reasons to be where {n} is. The reasons are getting thinner.",
 choices:[
  {t:"Meet them halfway.",h:"the heart opens",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,62,p.age+ri(-2,2));fx(p,{spirit:9,heart:6});logLine("Fell in love, clumsily and completely.","joy");}},
  {t:"Pretend not to notice.",h:"",do:p=>{remember('unspoken_love');fx(p,{spirit:-4,mind:2});logLine("Let someone slip away by saying nothing. Wondered, later, often.","obs");}},
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
{id:'y_drink',stage:'youth',w:2,age:[18,26],text:"There is a season where the nights run long and the mornings cost more each time.",
 choices:[
  {t:"Burn through it.",h:"a reckless season",do:p=>{fx(p,{vit:-6,spirit:4,heart:3});p.flags.peril=p.age+5;logLine("Spent a reckless year {they} would not, on balance, trade away.");}},
  {t:"Pull back early.",h:"",do:p=>{fx(p,{vit:3,spirit:-1,mind:3});logLine("Left the party before it turned, every time.");}},
 ]},

/* ---- ADULT ---- */
{id:'a_marry',stage:'adult',w:5,age:[24,58],cond:()=>rel('love')&&!P.flags.married,text:()=>{const l=rel('love');return `${P.given} and ${l.given} have been a quiet certainty for years now. ${l.given} is waiting for a question.`;},
 choices:[
  {t:"Ask. Build a life.",h:"two become a household",do:p=>{const l=rel('love');l.kind='spouse';p.flags.married=1;fx(p,{spirit:11,heart:6});logLine("Married "+l.given+". The day was small and the meaning was not.","joy");}},
  {t:"Not yet. Maybe never.",h:"",do:p=>{const l=rel('love');l.bond=clamp(l.bond-14);fx(p,{spirit:-6});logLine("Could not say yes, and watched a good thing strain.","loss");}},
 ]},
{id:'a_child',stage:'adult',w:7,age:[26,46],cool:5,cond:()=>(rel('spouse')||rel('love'))&&rels('child').length<3,
 text:"The question of a child arrives, the way it does — half decision, half tide.",
 choices:[
  {t:"Yes. Make room in the world.",h:"the line may continue",do:p=>{haveChild();fx(p,{spirit:8,means:-6,vit:-3});}},
  {t:"No. This life, as it is.",h:"",do:p=>{fx(p,{spirit:2,means:4});logLine("Chose a life without children, with clear eyes.","obs");}},
 ]},
{id:'a_work',stage:'adult',w:3,age:[28,60],cond:()=>(P.age-(P.flags.lastWork||-12))>=10,
 text:"There is a promotion, but it eats the evenings. The home gets the leftovers of {n}.",
 choices:[
  {t:"Take it. Provide.",h:"means up, hours gone",do:p=>{p.flags.lastWork=p.age;fx(p,{means:16,spirit:-3});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond-7);logLine(nth(p,'work_take')>1?"Climbed again, and the family learned, again, to fit around the work.":"Worked for the family until the family barely saw {them}.","obs");}},
  {t:"Refuse it. Be present.",h:"less money, more evenings",do:p=>{p.flags.lastWork=p.age;fx(p,{means:-2,spirit:6});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond+8);logLine(nth(p,'work_refuse')>1?"Chose the table over the ladder once more, with less doubt this time.":"Turned down more money to be home for dinner.","joy");}},
 ]},
{id:'a_old_friend',stage:'adult',w:2,age:[28,60],
 cond:()=>{const f=rel('friend');return f&&!f.refused&&f.bond>30&&(P.age-(f.lastAsked||-10))>=8;},
 text:()=>{const f=rel('friend');return `${f.given}, the friend from the old yard, asks {n} for money${f.lentBefore?', and it is not the first time':''}. It is not a small amount.`;},
 choices:[
  {t:"Give it. That's what it's for.",h:"",do:p=>{const f=rel('friend');if(f){f.lastAsked=p.age;f.lentBefore=true;f.bond=clamp(f.bond+6);}fx(p,{means:-12,heart:4});logLine("Helped an old friend"+(f&&f.lentBefore?' again':'')+", knowing how it might go.");}},
  {t:"Say no. Finally.",h:"",do:p=>{const f=rel('friend');if(f){f.refused=true;f.bond=clamp(f.bond-20);}fx(p,{means:2,spirit:-4});logLine("Said no to "+(f?f.given:'an old friend')+", and felt a long friendship cool.","loss");}},
 ]},
{id:'a_affair',stage:'adult',w:2,age:[28,55],
 cond:()=>{const s=rel('spouse');return s&&!s.affairResolved&&!held('strayed')&&s.age>6;},
 text:"A door opens that {n} did not knock on. Someone new, and the old marriage feels suddenly worn.",
 choices:[
  {t:"Close the door.",h:"",do:p=>{const s=rel('spouse');if(s){s.bond=clamp(s.bond+5);s.affairResolved=true;}fx(p,{spirit:3});logLine("Felt the pull, and chose the marriage anyway.");}},
  {t:"Walk through it.",h:"a door that won't close again",do:p=>{const s=rel('spouse');if(s)s.bond=clamp(s.bond-30);remember('strayed');fx(p,{spirit:-8,heart:-5});if(s&&chance(0.5)){s.alive=false;s.kind='ex';logLine("The marriage broke on what {they} did. "+s.given+" left.","loss");}else logLine("Strayed, and carried it like a stone {they} couldn't set down.","loss");}},
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
  {t:"Give the blessing. Let go.",h:"",do:p=>{const c=grownUnblessedChild();if(c){c.bond=clamp(c.bond+12);c.blessed=true;}fx(p,{spirit:4});logLine("Let "+(c?c.given:'{their} child')+" make their own mistake, with love.","joy");}},
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
{id:'e_legacy',stage:'elder',w:3,once:true,age:[66,95],text:"{n} is asked what {they} wants remembered. The question lands harder than expected.",
 choices:[
  {t:"\"That I was kind.\"",h:"",do:p=>{fx(p,{heart:6,spirit:6});p.flags.legacy='kind';logLine("Said {they} hoped to be remembered as kind.","obs");}},
  {t:"\"That I built something.\"",h:"",do:p=>{fx(p,{spirit:4});p.flags.legacy='built';logLine("Said {they} hoped to be remembered for what {they} made.","obs");}},
  {t:"\"That I was here at all.\"",h:"",do:p=>{fx(p,{spirit:2});p.flags.legacy='here';logLine("Said {they} only hoped to be remembered.","obs");}},
 ]},
{id:'e_garden',stage:'elder',w:2,age:[66,95],once:true,text:"The days are slow and wide. {n} takes up something small — a garden, a craft, a quiet ritual.",
 choices:[
  {t:"Tend it daily.",h:"",do:p=>{fx(p,{spirit:8,vit:3});logLine("Found a late, gentle happiness in small daily things.","joy");}},
  {t:"Sit in the window instead.",h:"",do:p=>{fx(p,{spirit:-2,mind:3});logLine("Spent the last years mostly in thought, at the window.","obs");}},
 ]},

/* ---- UNIVERSAL / ENTROPY ---- */
{id:'u_windfall',stage:'*',w:1,cool:14,text:p=>p.flags.sawWindfall?"Another envelope, another stroke of plain luck — the world handing {n} something unasked, again.":"An envelope, a forgotten debt repaid, a stroke of plain luck. Money {n} did not expect.",
 choices:[
  {t:"Save it.",h:"",do:p=>{p.flags.sawWindfall=1;fx(p,{means:12});logLine(nth(p,'wind_save')>1?"Folded the second windfall away with the first, and said nothing.":"Came into unexpected money and, sensibly, kept it.");}},
  {t:"Share it out.",h:"",do:p=>{p.flags.sawWindfall=1;fx(p,{means:4,heart:6,spirit:5});logLine("Came into money and gave most of it away.","joy");}},
 ]},
{id:'u_loss',stage:'*',w:1,cool:16,cond:()=>P.stats.means>30,text:p=>p.flags.sawLoss?"Another bad year. Another bill that wasn't entirely {n}'s to pay, arriving all the same.":"A bad year. A failure not entirely {n}'s fault, but the bill comes to {them} all the same.",
 choices:[
  {t:"Absorb it. Rebuild.",h:"steady, and slow",do:p=>{p.flags.sawLoss=1;fx(p,{means:-16,spirit:-4,mind:3});logLine(nth(p,'loss_absorb')>1?"Took another hard loss, and knew, this time, the shape of starting over.":"Took a hard loss and started, again, from lower down.","loss");}},
  {t:"Fight to recover it.",h:"fortune is fickle",do:p=>{p.flags.sawLoss=1;if(chance(0.5)){fx(p,{means:-4,spirit:-2,mind:2});logLine(nth(p,'loss_fight')>1?"Fought it again, older, and knew better the cost of the fighting.":"Fought the loss nearly to a standstill, and kept most of what {they} had.");}else{fx(p,{means:-24,spirit:-7});logLine("Threw good money after bad, and lost more in the fighting of it.","loss");}}},
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
 text:()=>{const f=rel('friend');return `The child from the yard — ${f.given}, grown — is somebody now, and has not forgotten that ${P.given} sat beside them when no one else would.`;},
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
 text:"In the slow evenings, {n} thinks again of the one {they} never answered, all those years ago. {They} finds that name in a newspaper column — still living, a town away.",
 choices:[
  {t:"Write the letter, finally.",h:"",do:p=>{echo("Wrote, at last, to the love {they} let pass in silence half a life ago.","joy");fx(p,{spirit:10,heart:6});}},
  {t:"Some doors stay closed.",h:"",do:p=>{echo("Let the oldest 'what if' remain one, on purpose, at the end.","obs");fx(p,{spirit:2});}},
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
  {t:"Hide it. Feed it anyway.",h:"",do:p=>{remember('kept_stray');fx(p,{heart:8,spirit:4});logLine("Kept a secret animal alive on stolen scraps, and loved it fiercely.","joy");}},
  {t:"Do the sensible thing.",h:"",do:p=>{fx(p,{heart:-3,mind:3});logLine("Turned the stray away, because it was sensible, and felt the sense of it like a bruise.");}},
 ]},
{id:'y_mentor',stage:'youth',w:3,once:true,age:[14,22],text:"An older stranger sees something in {n} and offers to teach {them} — for nothing, just because someone once did it for them.",
 choices:[
  {t:"Show up every day.",h:"a wing to learn under",do:p=>{remember('had_mentor');fx(p,{mind:11,spirit:5});const s=chance(.5)?'m':'f';addRel('mentor',pick(s==='m'?GIVEN_M:GIVEN_F),s,66,p.age+ri(28,40));logLine("Was taken under a wing, and never forgot the debt of it.","joy");}},
  {t:"Teach yourself instead.",h:"alone, and wholly your own",do:p=>{remember('self_made');fx(p,{mind:5,spirit:2,heart:-2});logLine("Turned the teacher down, and taught {them}self — slower, lonelier, owing the result to no one.");}},
 ]},
{id:'a_fork_career',stage:'adult',w:3,once:true,age:[30,58],cond:()=>P.stats.means>40,text:"{n} can buy security — a dull, safe thing that will hold for thirty years — or risk it all on work that might mean something.",
 choices:[
  {t:"Buy the safe thing.",h:"",do:p=>{fx(p,{means:10,spirit:-5,vit:2});logLine("Chose security, and felt the walls of it close in, comfortably.");}},
  {t:"Risk it on the meaningful thing.",h:"fortune is fickle",do:p=>{if(chance(.5)){fx(p,{means:8,spirit:14,mind:5});logLine("Bet {their} security on meaning, and, this once, both held.","joy");}else{fx(p,{means:-20,spirit:6});logLine("Bet security on meaning and lost the money, kept the meaning.","loss");}}},
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
{id:'e_window',stage:'elder',w:3,age:[60,95],cond:()=>rels('child').length>0||P.childrenIds.length>0,text:"A grandchild — small, sticky, fearless — climbs into {n}'s lap and asks what {they} was like when {they} was little.",
 choices:[
  {t:"Tell the true story.",h:"",do:p=>{fx(p,{spirit:9,heart:7});const line= held('kept_stray')?"told the one about the secret stray":held('child_books')?"told the one about the book too hard to read":"told the truest one {they} had";logLine("Held a grandchild and "+line+".","joy");}},
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
  {t:"Resent the lost attention.",h:"",do:p=>{const s=chance(0.5)?'m':'f';addRel('sibling',pick(s==='m'?GIVEN_M:GIVEN_F),s,42,0);fx(p,{heart:-3,spirit:-2,mind:2});logLine("Learned early that love is divided, and counted {their} share.");}},
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
  {t:"Make the new place yours.",h:"",do:p=>{fx(p,{spirit:5,heart:-2,mind:3});remember('uprooted');logLine("Was uprooted young, and learned how to begin again among strangers.");}},
  {t:"Grieve the one you lost.",h:"",do:p=>{const f=rel('friend');if(f)f.bond=clamp(f.bond-10);fx(p,{spirit:-5,heart:4});logLine("Left a whole small world behind, and felt every mile of it.","loss");}},
 ]},
{id:'c_grandparent',stage:'child',w:2,age:[6,12],once:true,
 text:"An old one in the family — a grandmother, a great-uncle — is suddenly, simply, gone. It is the first time {n} meets the fact of it.",
 choices:[
  {t:"Keep something of theirs.",h:"",do:p=>{remember('first_loss');fx(p,{heart:5,spirit:-2,mind:2});logLine("Kept a dead grandparent's small thing, and carried the first grief carefully.","loss");}},
  {t:"Don't really understand yet.",h:"",do:p=>{fx(p,{spirit:2});logLine("Was too young to hold it, and let the loss pass through like weather.","obs");}},
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
{id:'y_dare',stage:'youth',w:2,age:[16,23],
 text:"A dare, a height, a fast machine — a chance to feel, for a few seconds, completely alive and entirely breakable.",
 choices:[
  {t:"Do the reckless thing.",h:"alive and breakable",do:p=>{fx(p,{spirit:7,vit:-2,heart:2});p.flags.peril=p.age+4;logLine("Did the dangerous, beautiful, breakable thing, and the seconds of it lasted years.");}},
  {t:"Keep both feet down.",h:"",do:p=>{fx(p,{mind:3,spirit:-2});logLine("Watched the others leap, and kept {their} own feet on the ground.");}},
 ]},

/* ---- ADULT — the late road to love, and a settling life ---- */
{id:'a_meet_late',stage:'adult',w:5,age:[26,54],opensLove:true,cond:()=>!rel('love')&&!rel('spouse'),
 text:"It is later than the stories say it should be. And still — across a room, across a counter, across an ordinary Tuesday — someone.",
 choices:[
  {t:"Let it begin.",h:"the heart, still open",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age+ri(-4,4));fx(p,{spirit:8,heart:6});logLine("Found love later than expected, and was almost embarrassed by the size of it.","joy");}},
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
{id:'m_old_flame',stage:'midlife',w:2,age:[46,60],once:true,cond:()=>held('unspoken_love')&&!rel('love')&&!rel('spouse'),
 text:"The one {n} never answered, all those years ago, is suddenly here again — older, freer, and looking at {n} with the same old question.",
 choices:[
  {t:"Answer it, finally.",h:"the second chance",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,66,p.age+ri(-3,3));echo("Answered, in midlife, the question {they} fled at "+recall('unspoken_love').age+".","joy");fx(p,{spirit:10,heart:7});P.mem.unspoken_love=null;}},
  {t:"Let it stay unanswered.",h:"",do:p=>{echo("Let the oldest door close a second time, gently, on purpose.","obs");fx(p,{spirit:-2,mind:2});}},
 ]},

/* ---- ELDER — handing on, last journeys, peace ---- */
{id:'e_craft',stage:'elder',w:2,age:[66,90],cond:()=>P.stats.mind>50||held('became_teacher'),
 text:"In {n}'s hands is a craft, a trade, a way of doing some small thing well — and the hands are slower now. It could go on, or go with {them}.",
 choices:[
  {t:"Teach it to someone young.",h:"",do:p=>{remember('became_teacher');fx(p,{heart:6,spirit:7});logLine("Handed a lifetime's craft to younger hands, and so refused to take it underground.","joy");}},
  {t:"Let it retire with you.",h:"",do:p=>{fx(p,{spirit:-2,mind:2});logLine("Kept {their} craft to the end, and let it end with {them}.","obs");}},
 ]},
{id:'e_journey',stage:'elder',w:2,age:[66,86],once:true,cond:()=>P.stats.vit>32,
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
];
