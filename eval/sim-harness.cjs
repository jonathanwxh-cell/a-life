/* Faithful headless harness: overrides presentCard() so the REAL tick()+drawCard()
   (incl. the love-nudge, opensLove, new u_loss) run with no DOM. Intentional play on
   love/marry/child. Reports early-death, age/cooldown/once violations, love/child
   rates, dynasty depth, and the house-seat distribution. Run: node sim-harness.cjs [N] */
const fs=require('fs'), vm=require('vm'), path=require('path');
const DIR=path.resolve(__dirname,'..');   // the game files live one level up (this script sits in eval/)
const read=f=>fs.readFileSync(path.join(DIR,f),'utf8');
const prelude=`
  var requestAnimationFrame=function(){}; var setTimeout=function(){return 0;}; var clearTimeout=function(){};
  var fakeEl=new Proxy({classList:{add:function(){},remove:function(){},toggle:function(){}},style:{},dataset:{}},{
    get:function(t,k){ if(k in t) return t[k];
      if(['appendChild','setAttribute','addEventListener','removeChild','remove','focus'].indexOf(k)>=0) return function(){};
      if(k==='children') return []; return ''; }, set:function(t,k,v){ t[k]=v; return true; }});
  var document={getElementById:function(){return fakeEl;},createElement:function(){return fakeEl;},querySelector:function(){return fakeEl;},body:fakeEl,addEventListener:function(){}};
  var window={storage:{get:function(){},set:function(){},delete:function(){},list:function(){}}};
  function renderLogTail(){} function renderPassing(){} function renderAll(){} function save(){} function reTok(t){return t;}
  function scheduleTick(){}
`;
const body=`
  var rec;
  // headless presentCard: assert, mirror state writes, apply a choice (intentional on the dynasty path)
  presentCard=function(c){
    var stage=stageOf(P.age);
    if(c.age){ if(P.age<c.age[0]||P.age>c.age[1]) rec.ageViol.push(c.id+'@'+P.age+' ['+c.age+']'); }
    else if(c.stage!=='*'&&c.stage!==stage) rec.stageViol.push(c.id+'@'+P.age+' '+c.stage);
    if(c.once && P.flags['card_'+c.id]) rec.onceViol.push(c.id+'@'+P.age);
    if(c.onceDyn && S && S.seenDyn && S.seenDyn[c.id]!=null && (P.gen-S.seenDyn[c.id])<(c.onceDyn===true?3:c.onceDyn)) rec.dynViol.push(c.id+'@gen'+P.gen);   // a once-per-dynasty beat fired again inside its generational cooldown
    if(!c.once && P.drewAt && P.drewAt[c.id]!=null && (P.age-P.drewAt[c.id])<(c.cool||10)) rec.coolViol.push(c.id+' '+(P.age-P.drewAt[c.id]));
    rec.cardUse[c.id]=(rec.cardUse[c.id]||0)+1;
    P.sinceCard=0; P.drewAt=P.drewAt||{}; P.drewAt[c.id]=P.age; if(c.once) P.flags['card_'+c.id]=1;
    if(c.onceDyn){ S.seenDyn=S.seenDyn||{}; S.seenDyn[c.id]=P.gen; }
    var INTENT={y_love1:1,a_meet_late:1,a_marry:1,a_child:1,m_old_flame:1};
    var ch=INTENT[c.id]?c.choices[0]:c.choices[Math.floor(Math.random()*c.choices.length)];
    var hadLove=P.rels.some(function(r){return r.alive&&(r.kind==='love'||r.kind==='spouse');});
    var kids0=rels('child').length;
    var married0=P.flags.married;
    ch.do(P);
    if(!hadLove && P.rels.some(function(r){return r.alive&&(r.kind==='love'||r.kind==='spouse');})) rec.loveAges.push(P.age);
    if(rels('child').length>kids0 && kids0===0) rec.childAges.push(P.age);
    if(!married0 && P.flags.married) rec.marriageAges.push(P.age);
  };
  function setupFounder(){ S={surname:pick(SURNAMES),vrot:ri(0,29),year:0,marks:{gens:1,souls:0,longest:0,peakMeans:0},lineage:[],person:null,house:initHouse(),seenDyn:{}};
    S.era=ERA_KEYS[ri(0,ERA_KEYS.length-1)];   // force uniform coverage of all eras across the run, so era cards get violation-checked
    var f=makeFounder(1); S.person=f; P=f; firedObs={}; seedParents(f); }
  function runLine(maxGen){
    setupFounder(); var gen=1;
    while(true){
      running=true; busy=false; var guard=0;
      while(P.alive && guard++<250){ tick(); }   // real tick(): ages, drifts, may draw, may die()
      rec.lives++; rec.deathAges.push(P.deathAge);
      if(P.deathAge<55) rec.before55++; if(P.deathAge<40) rec.before40++;
      var hasLove=P.rels.some(function(r){return r.kind==='love'||r.kind==='spouse';});
      var hasKid=P.rels.some(function(r){return r.kind==='child';});
      if(hasLove) rec.gotLove++;
      if(hasKid) rec.hadChild++;
      if(hasLove&&!hasKid) rec.coupledChildless++;
      if(gen>=2){ rec.heirLives++; if(P.startAge0) rec.heirStart0++; }
      var kids=rels('child').filter(function(r){return r.alive;});
      if(gen>=maxGen) break;
      if(kids.length){ kids.sort(function(a,b){return b.age-a.age;}); succeed(kids[0]); rec.directSucc=(rec.directSucc||0)+1; }
      else if(collateralAvailable(P)){ var sx=Math.random()<0.5?'m':'f'; succeed({given:pick(sx==='m'?GIVEN_M:GIVEN_F),sex:sx,age:0,bond:50,collateral:true}, true); rec.collSucc=(rec.collSucc||0)+1; }
      else break;
      P.startAge0=(P.age===0); gen++;
      if(Math.random()<0.5) S.era=ERA_KEYS[ri(0,ERA_KEYS.length-1)];   // the world turns between generations — exercise era shifts
    }
    rec.gens.push(gen); if(gen>=2) rec.linesHeir++;
    rec.seats[seatOf(S.house.seat).name]=(rec.seats[seatOf(S.house.seat).name]||0)+1;
    rec.peakSeat=Math.max(rec.peakSeat, S.house.seat);
  }
  function run(N,maxGen){
    rec={lives:0,heirLives:0,heirStart0:0,before55:0,before40:0,gotLove:0,hadChild:0,coupledChildless:0,deathAges:[],loveAges:[],childAges:[],
      marriageAges:[],ageViol:[],stageViol:[],coolViol:[],onceViol:[],dynViol:[],cardUse:{},gens:[],linesHeir:0,seats:{},peakSeat:0,lines:N};
    for(var n=0;n<N;n++) runLine(maxGen);
    return rec;
  }
  run((typeof HN!=='undefined')?HN:5000, 14);
`;
const N=parseInt(process.argv[2]||'5000',10);
const ctx={console, HN:N}; vm.createContext(ctx);
const R=vm.runInContext(prelude+'\n'+read('core.js')+'\n'+read('content.js')+'\n'+read('engine.js')+'\n'+read('dynasty.js')+'\n'+body, ctx, {filename:'sim.js'});
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
const pct=(x,d)=>(100*x/d).toFixed(1)+'%';
const gensAvg=R.gens.reduce((a,b)=>a+b,0)/R.gens.length;
console.log('=== A LIFE — faithful sim over '+R.lines+' lines, '+R.lives+' lives (intentional dynasty play) ===');
console.log('Early death <55: '+pct(R.before55,R.lives)+'   <40: '+pct(R.before40,R.lives)+'   (target 8-12%)');
console.log('Death age min/med/max: '+Math.min(...R.deathAges)+' / '+med(R.deathAges)+' / '+Math.max(...R.deathAges));
console.log('Ever had love/spouse: '+pct(R.gotLove,R.lives)+'   ever had a child: '+pct(R.hadChild,R.lives)+'   coupled-but-childless: '+pct(R.coupledChildless,R.lives));
console.log('NON-DOMESTIC lives (no child of their own): '+pct(R.lives-R.hadChild,R.lives)+'   succession: '+(R.directSucc||0)+' direct / '+(R.collSucc||0)+' collateral (the house passing sideways)');
const band=(a,lo,hi)=>pct(a.filter(x=>x>=lo&&x<=hi).length,a.length);
if(R.loveAges.length) console.log('Age at first love  — <26: '+band(R.loveAges,0,25)+'  26-39: '+band(R.loveAges,26,39)+'  40+: '+band(R.loveAges,40,99)+'   (median '+med(R.loveAges)+')');
if(R.childAges.length) console.log('Age at first child — <30: '+band(R.childAges,0,29)+'  30-39: '+band(R.childAges,30,39)+'  40+: '+band(R.childAges,40,99)+'   (median '+med(R.childAges)+')');
if(R.marriageAges.length) console.log('Age at marriage    — <30: '+band(R.marriageAges,0,29)+'  30-44: '+band(R.marriageAges,30,44)+'  45+: '+band(R.marriageAges,45,99)+'   (median '+med(R.marriageAges)+')');
console.log('Lines reaching gen>=2: '+pct(R.linesHeir,R.lines)+'   avg gens/line: '+gensAvg.toFixed(2)+'   max seat reached: '+R.peakSeat+'/6');
console.log('VIOLATIONS age:'+R.ageViol.length+' stage:'+R.stageViol.length+' cooldown:'+R.coolViol.length+' once:'+R.onceViol.length+' onceDyn:'+R.dynViol.length);
if(R.ageViol.length) console.log('  age e.g.: '+R.ageViol.slice(0,6).join(' | '));
if(R.coolViol.length) console.log('  cool e.g.: '+R.coolViol.slice(0,6).join(' | '));
if(R.onceViol.length) console.log('  once e.g.: '+R.onceViol.slice(0,6).join(' | '));
if(R.dynViol.length) console.log('  onceDyn e.g.: '+R.dynViol.slice(0,6).join(' | '));
console.log('Final house seat distribution:');
Object.entries(R.seats).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('   '+pct(v,R.lines).padStart(6)+'  '+k));
// optional card-usage histogram: `node sim-harness.cjs N cards [filterRegex]` — draws per 100 lives
if(process.argv[3]==='cards'){
  const filt=process.argv[4]?new RegExp(process.argv[4]):null;
  console.log('\nCard usage (draws per 100 lives)'+(filt?' matching /'+process.argv[4]+'/':'')+':');
  Object.entries(R.cardUse).filter(([k])=>!filt||filt.test(k)).sort((a,b)=>b[1]-a[1])
    .forEach(([k,v])=>console.log('   '+(100*v/R.lives).toFixed(1).padStart(6)+'  '+k));
}
