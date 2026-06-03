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
  {t:"Sit beside them.",h:"a friend, perhaps for life",do:p=>{const s=chance(0.5)?'m':'f';addRel('friend',pick(s==='m'?GIVEN_M:GIVEN_F),s,60,p.age);remember('kind_to_outcast');fx(p,{heart:7});logLine("Made a friend nobody else wanted — and that one stayed.","joy");}},
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
{id:'y_love1',stage:'youth',w:4,age:[16,25],opensLove:true,cond:()=>!rel('love'),text:p=>["Someone keeps finding reasons to be where {n} is. The reasons are getting thinner.","There is someone who keeps turning up where {n} is. {They} has noticed. And the noticing, by now, runs both ways.","Someone has started to matter — turning up, lingering, the way only a few people ever do.","The same face keeps appearing at the edges of {n}'s days, and the days have begun to arrange themselves around it.","There is a particular person now — nothing announced, nothing decided, just a quiet fact getting truer.","Someone has gone quiet for three days, and {n} is unsettled to find that the quiet has a shape.","It takes {n} a while to name it: the person whose absence, lately, has become the loudest thing in any room."][rotI(p,7)],
 choices:[
  {t:"Meet them halfway.",h:"the heart opens",do:p=>{const s=p.sex==='m'?'f':'m';addRel('love',pick(s==='m'?GIVEN_M:GIVEN_F),s,62,p.age+ri(-2,2));fx(p,{spirit:9,heart:6});logLine(["Started, without quite deciding to, building the days around another person.","Fell in love — the kind that quietly rearranges the furniture of a life.","Fell in love, and was surprised, as everyone is, that it was {them} this time."][rotI(p,3)],"joy");}},
  {t:"Pretend not to notice.",h:"",do:p=>{remember('unspoken_love');fx(p,{spirit:-4,mind:2});logLine(["Let someone slip away by saying nothing. Wondered, later, often.","Said nothing, let the moment pass, and watched it become one of the things {they} simply hadn't done.","Kept {their} own counsel, let someone go, and felt the shape of that silence for years."][rotI(p,3)],"obs");}},
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
{id:'a_marry',stage:'adult',w:5,age:[24,58],cond:()=>rel('love')&&!P.flags.married,text:()=>{const l=rel('love');return [`${P.given} and ${l.given} have been a quiet certainty for years now. ${l.given} is waiting for a question.`,`${l.given} fell asleep first again, mid-sentence; ${P.given} lay awake deciding to ask in the morning — and then, by morning, did not.`,`The question has been in the room for years — between ${P.given} and ${l.given}, just words now, standing between here and the answer.`][rotI(P,3)];},
 choices:[
  {t:"Ask. Build a life.",h:"two become a household",do:p=>{const l=rel('love');l.kind='spouse';p.flags.married=1;fx(p,{spirit:11,heart:6});
    const lines = p.age>48
      ? ["Married "+l.given+" late, and found the lateness made the vow weigh more, not less.","Married "+l.given+" after both had long stopped expecting it, and meant it the more for that.","Married "+l.given+" with most of a life already behind them, and counted it the best thing in any of it."]
      : ["Married "+l.given+". The day was small and the meaning was not.","Married "+l.given+". Nobody made a speech; the years that followed were the speech.","Married "+l.given+" on an ordinary day, and meant every word of it.","Married "+l.given+" in front of the few who mattered, and let the world find out after.","Married "+l.given+" without ceremony and without a single doubt.","Married "+l.given+", and the plain room felt larger for the promise made in it."];
    logLine(lines[rotI(p,lines.length)],"joy");}},
  {t:"Not yet. Maybe never.",h:"",do:p=>{const l=rel('love');l.bond=clamp(l.bond-14);fx(p,{spirit:-6});logLine("Could not say yes, and watched a good thing strain.","loss");}},
 ]},
{id:'a_child',stage:'adult',w:5,age:[26,50],cool:5,cond:()=>(rel('spouse')||rel('love'))&&rels('child').length<3,
 text:p=>{const k=rels('child').length;if(k===0)return ["The question of a child arrives, the way it does — half decision, half tide.","It arrives sideways, the way it does — not quite a question yet, not quite not.","They have not spoken of it in a while. The silence on the subject has its own shape now."][rotI(p,3)];return k===1?"The question of another child arrives — familiar now, and still not small.":"The question of one more arrives, the way it does, and {n} already knows the weight of the answer.";},
 choices:[
  {t:"Yes. Make room in the world.",h:"the line may continue",do:p=>{haveChild();fx(p,{spirit:8,means:-6,vit:-3});}},
  {t:"No. This life, as it is.",h:"",do:p=>{fx(p,{spirit:2,means:4});logLine("Chose a life without children, with clear eyes.","obs");}},
 ]},
{id:'a_work',stage:'adult',w:3,age:[28,60],cond:()=>(P.age-(P.flags.lastWork||-12))>=10,
 text:p=>["There is a promotion, but it eats the evenings. The home gets the leftovers of {n}.","The work wants more — a better title, longer hours. The family would get whatever was left.","An offer comes: more money for more of {n}'s time. There is only ever so much of it."][rotN((p.flags.n_work_take||0)+(p.flags.n_work_refuse||0),3)],
 choices:[
  {t:"Take it. Provide.",h:"means up, hours gone",do:p=>{p.flags.lastWork=p.age;fx(p,{means:16,spirit:-3});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond-7);logLine(nth(p,'work_take')>1?"Climbed again, and the family learned, again, to fit around the work.":["Worked for the family until the family barely saw {them}.","Gave the work its due, and the family what was left of {them}.","Took the better title, and paid for it in evenings."][rotI(p,3)],"obs");}},
  {t:"Refuse it. Be present.",h:"less money, more evenings",do:p=>{p.flags.lastWork=p.age;fx(p,{means:-2,spirit:6});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond+8);logLine(nth(p,'work_refuse')>1?"Chose the table over the ladder once more, with less doubt this time.":["Turned down more money to be home for dinner.","Said no to the title, and yes to the evenings.","Chose the table, the window, the ordinary hour."][rotI(p,3)],"joy");}},
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
 text:p=>{const s=rel('spouse');const w=s?s.given:('{their} '+p.px.spouse);return ["A door opens that "+p.given+" did not knock on. Someone new, and the old marriage feels suddenly worn.","Someone looks at "+p.given+" the way "+w+" stopped looking some years ago — and "+p.given+" notices, with a small shock, how much that look had been missed.","It would be so easy, and so quiet, and no one would ever have to know. Which is precisely what makes it dangerous."][rotN(p.gen,3)];},
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
{id:'e_legacy',stage:'elder',w:3,once:true,age:[66,95],text:"{n} is asked what {they} wants remembered. The question lands harder than expected.",
 choices:[
  {t:"\"That I was kind.\"",h:"",do:p=>{fx(p,{heart:6,spirit:6});p.flags.legacy='kind';logLine("Said {they} hoped to be remembered as kind.","obs");}},
  {t:"\"That I built something.\"",h:"",do:p=>{fx(p,{spirit:4});p.flags.legacy='built';logLine("Said {they} hoped to be remembered for what {they} made.","obs");}},
  {t:"\"That I was here at all.\"",h:"",do:p=>{fx(p,{spirit:2});p.flags.legacy='here';logLine("Said {they} only hoped to be remembered.","obs");}},
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
  {t:"Hide it. Feed it anyway.",h:"",do:p=>{remember('kept_stray');fx(p,{heart:8,spirit:4});logLine("Kept a secret animal alive on stolen scraps, and loved it fiercely.","joy");}},
  {t:"Do the sensible thing.",h:"",do:p=>{remember('turned_stray');fx(p,{heart:-3,mind:3});logLine("Turned the stray away, because it was sensible, and felt the sense of it like a bruise.");}},
 ]},
{id:'y_mentor',stage:'youth',w:3,once:true,age:[14,22],text:"An older stranger sees something in {n} and offers to teach {them} — for nothing, just because someone once did it for them.",
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
{id:'y_dare',stage:'youth',w:2,age:[16,23],once:true,
 text:"A dare, a height, a fast machine — a chance to feel, for a few seconds, completely alive and entirely breakable.",
 choices:[
  {t:"Do the reckless thing.",h:"alive and breakable",do:p=>{fx(p,{spirit:7,vit:-2,heart:2});p.flags.peril=p.age+4;remember('lived_reckless');logLine("Did the dangerous, beautiful, breakable thing, and the seconds of it lasted years.");}},
  {t:"Keep both feet down.",h:"",do:p=>{fx(p,{mind:3,spirit:-2});logLine("Watched the others leap, and kept {their} own feet on the ground.");}},
 ]},

/* ---- ADULT — the late road to love, and a settling life ---- */
{id:'a_meet_late',stage:'adult',w:5,age:[26,54],opensLove:true,cond:()=>!rel('love')&&!rel('spouse'),
 text:p=>["It is later than the stories say it should be. And still — across a room, across a counter, across an ordinary Tuesday — someone.","The time for this was supposed to have passed. And yet — a face, a second glance, an afternoon that refuses to end — someone.","Later than anyone plans for, it arrives anyway: across a table, across a season, across the better part of a life — someone."][rotI(p,3)],
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
{id:'s_great_burden',stage:'*',w:2,age:[32,70],cool:20,cond:()=>S.house&&S.house.seat>=5,
 text:"The name opens every door now — and behind every door are people who want something for it. {n} can feel the particular weight of being expected.",
 choices:[
  {t:"Wear the name. Play the part.",h:"",do:p=>{fx(p,{means:8,spirit:-4,vit:-2});p.flags.lastWork=p.age;logLine("Carried the great name the way it asked to be carried, and felt exactly what it cost to.","obs");}},
  {t:"Refuse the performance.",h:"",do:p=>{fx(p,{spirit:7,means:-6});remember('refused_the_name');logLine("Declined to perform the family's importance, and breathed easier for the refusing.","joy");}},
 ]},
{id:'s_from_nothing',stage:'adult',w:3,once:true,age:[26,54],cond:()=>S.house&&S.house.seat<=1,
 text:"There is nothing behind {n} — no name that means a thing, no floor to fall back to. Only whatever {they} can make with {their} own two hands, starting now.",
 choices:[
  {t:"Build, brick by brick.",h:"slow, and wholly yours",do:p=>{fx(p,{means:10,vit:-3,spirit:2});remember('self_made');logLine("Began from nothing, and laid the first course of something, alone.","obs");}},
  {t:"Find others to climb with.",h:"",do:p=>{fx(p,{means:5,heart:5,spirit:3});logLine("Threw {their} lot in with others, and rose, slowly, alongside them.","joy");}},
 ]},

/* ---- REPUTE-GATED — the family's character, reaching forward into a life ---- */
{id:'r_scholar_door',stage:'adult',w:3,age:[24,55],cond:()=>S.house&&reputeTop(S.house)==='scholarly',
 text:"The family's learned name carries — and a door opens that opens only for such names: a chance to add to what the house already knows.",
 choices:[
  {t:"Walk through it.",h:"",do:p=>{fx(p,{mind:9,means:6,spirit:3});remember('chose_study');logLine("Took up the family's learning, and carried it a little further down the years.","joy");}},
  {t:"Choose a life of your own.",h:"",do:p=>{fx(p,{spirit:4,heart:3});remember('broke_with_house');logLine("Set down the family's books to live a life that was not about them.","obs");}},
 ]},
{id:'r_family_shadow',stage:'*',w:3,age:[22,72],cool:18,cond:()=>S.house&&(S.house.secret||reputeTop(S.house)==='tainted'),
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
  {t:"Stand again. You know the price.",h:"",do:p=>{echo("Paid, a second time and more dearly, for a principle {they} would not set down.","joy");fx(p,{spirit:7,means:-6,heart:3});}},
  {t:"You've paid enough.",h:"",do:p=>{echo("Let the old fight pass to someone younger, and tried not to call it surrender.","obs");fx(p,{spirit:-3,mind:2});}},
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
{id:'s_inheritance_dispute',stage:'*',w:2,age:[34,66],cool:20,cond:()=>S.house&&S.house.seat>=4,
 text:"With a great name comes a great quarrel: someone within the family wants more of it than {n} thinks is rightly theirs. The lawyers, or the peace — and one of them will cost.",
 choices:[
  {t:"Hold the line. Fight for it.",h:"",do:p=>{if(chance(0.6)){fx(p,{means:8,spirit:-4});logLine("Fought {their} own blood for the estate, and kept it whole.","obs");}else{fx(p,{means:-12,spirit:-6,heart:-3});remember('chose_self_over_house');logLine("Fought {their} own blood for the estate, and it cost more than it kept.","loss");}}},
  {t:"Give them their share. Keep the peace.",h:"",do:p=>{fx(p,{means:-10,heart:5,spirit:3});logLine("Gave way to keep the family whole, and counted the peace well worth the price.","joy");}},
 ]},
{id:'s_patronage',stage:'*',w:2,age:[32,64],cool:18,cond:()=>S.house&&S.house.seat>=5,
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
  {t:"Retreat to what you know.",h:"",do:p=>{fx(p,{mind:5,heart:-3,spirit:-2});logLine("Met the one unteachable thing by reaching, again, for a book.");}},
 ]},
{id:'t_guarded',stage:'adult',w:2,age:[28,54],once:true,cond:()=>P.traits.includes('guarded'),
 text:"Someone has gotten close enough to ask {n} the question the walls are up against: what is it {they} is so carefully never saying?",
 choices:[
  {t:"Let them in. Just this once.",h:"",do:p=>{fx(p,{heart:8,spirit:5});remember('let_in');logLine("Opened a door {they} usually kept locked, and was not, in the end, sorry for it.","joy");}},
  {t:"Keep the wall.",h:"",do:p=>{fx(p,{spirit:-3,mind:2});logLine("Kept the wall exactly where it had always stood, and watched someone give up trying.","obs");}},
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
{id:'cb_reckless',stage:'elder',w:2,once:true,cond:()=>held('lived_reckless'),
 text:"A young one in the family lives the way {n} once did — fast, and breakable, and sure of {their} own luck. {n}, of all people, knows exactly where that road runs.",
 choices:[
  {t:"Tell them to slow down.",h:"",do:p=>{echo("Counselled the caution {they} had never once managed {them}self — and meant every word of it.","obs");fx(p,{mind:3,heart:3});}},
  {t:"Tell them it was worth it.",h:"",do:p=>{echo("Told a reckless young one the truth: that {they} would not, on balance, give back a single one of those breakable years.","joy");fx(p,{spirit:6,heart:2});}},
 ]},

/* ============================================================
   COMPETING GOODS — moments with no clean answer, where both roads are
   a kind of virtue and the player cannot be sure which was right. (The
   binary 'open vs. closed' grammar, broken on purpose.)
   ============================================================ */
{id:'x_honest_or_kind',stage:'*',w:2,age:[26,74],cool:22,cond:()=>P.rels.some(r=>r.alive&&r.bond>45&&r.kind!=='ex'),
 text:"Someone {n} loves asks a direct question, and the true answer would wound them for no good {n} can see. A kindness and an honesty — and they will not both fit in the room.",
 choices:[
  {t:"Tell the truth. They deserve it.",h:"honesty over comfort",do:p=>{const r=P.rels.filter(x=>x.alive&&x.bond>45)[0];if(r)r.bond=clamp(r.bond-6);fx(p,{spirit:2,mind:2});logLine("Told someone {they} loved a true thing that hurt, because the truth seemed to {them} the larger love.","obs");}},
  {t:"Spare them. Some truths cost more than they're worth.",h:"mercy over candour",do:p=>{fx(p,{heart:4,spirit:-1});remember('a_kind_silence');logLine("Held a true thing back to spare someone pain, and was never afterward quite sure {they} had been right.","obs");}},
 ]},
{id:'x_loyalty_truth',stage:'adult',w:2,age:[28,60],once:true,cond:()=>rel('friend')||rel('sibling'),
 text:"{n} knows a thing about someone {they} loves — a thing that others are genuinely owed. Loyalty pulls one way and honesty the other, and both have always been {n}'s virtues.",
 choices:[
  {t:"Keep faith with your own.",h:"loyalty",do:p=>{const r=rel('friend')||rel('sibling');if(r)r.bond=clamp(r.bond+8);fx(p,{heart:3,spirit:-2});remember('chose_loyalty');logLine("Kept faith with {their} own, and carried what that cost others quietly, alone.","obs");}},
  {t:"Tell the truth that's owed.",h:"honesty",do:p=>{const r=rel('friend')||rel('sibling');if(r)r.bond=clamp(r.bond-14);fx(p,{spirit:3,mind:2});logLine("Told a truth that was owed, and lost some of someone {they} loved in the telling of it.","loss");}},
 ]},
{id:'x_dream_or_duty',stage:'adult',w:2,age:[30,52],once:true,cond:()=>rels('child').length||rel('spouse'),
 text:"The thing {n} has always meant to do with {their} one life has finally come within reach — and taking it would ask real sacrifice of the people who depend on {them}. Both, {they} knows, are forms of love.",
 choices:[
  {t:"Take the chance. A life is your own.",h:"the self",do:p=>{fx(p,{spirit:10,means:-8});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond-8);remember('chose_self');logLine("Reached, at last, for the thing {they} had always wanted — and asked the people {they} loved to carry the cost of it.","obs");}},
  {t:"Set it down. They need you whole.",h:"the others",do:p=>{fx(p,{heart:6,spirit:-4});const f=rels('child')[0]||rel('spouse');if(f)f.bond=clamp(f.bond+8);remember('chose_others');logLine("Set down the thing {they} had always wanted, for the people who needed {them} more — and called it, mostly, no regret.","obs");}},
 ]},
];
