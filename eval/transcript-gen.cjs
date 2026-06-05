/* Emit readable, resolved playthrough transcripts from the REAL engine — now via the
   real tick()/drawCard() (so callbacks-preference, the love-nudge, varied repeats all
   appear exactly as a player would meet them). Intentional play on love/marry/child.
   Run: node transcript-gen.cjs > /dev/null  (writes transcripts.txt)               */
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
  // resolve tokens at log time so transcripts read exactly as the player sees them
  logLine=function(text,cls){ P.log.push({age:P.age,text:fmt(text),cls:cls||''}); };
  echo=function(text,cls){ logLine(text,cls||'echo'); };
  // A REPRESENTATIVE player, not a continuation-maximizer: a real player declines love sometimes (and lives
  // a solitary life with its own content), stays childless sometimes, and — across many founders — takes all
  // four callings, not one. The old INTENT forced accept on love/marry/child, which made the EVIDENCE PACKET
  // look like a domestic monoculture even though the engine produces ~a quarter solitary lives. This shows
  // the variety the game actually has. (rotateVoc spreads y_calling evenly so no one vocation dominates the packet.)
  var vrot=0;
  function pickChoice(c){
    if(c.id==='y_calling') return c.choices[(vrot++)%c.choices.length];               // rotate soldier/scholar/maker/wanderer evenly
    if(c.id==='y_love1'||c.id==='a_meet_late') return Math.random()<0.9 ? c.choices[0] : c.choices[1]; // mostly accept; the engine's un-offered lives supply the solitary minority
    if(c.id==='a_marry') return Math.random()<0.9 ? c.choices[0] : c.choices[1];
    if(c.id==='a_child') return Math.random()<0.85 ? c.choices[0] : c.choices[1];        // ~15% of couples stay childless
    if(c.id==='m_old_flame') return c.choices[0];
    return c.choices[Math.floor(Math.random()*c.choices.length)];
  }
  // headless presentCard: capture the resolved prompt + choice, then apply it. The real
  // tick()/drawCard() still run, so the love-nudge and cb_* preference shape the draws.
  presentCard=function(c){
    var q=fmt(typeof c.text==='function'?c.text(P):c.text).replace(/<[^>]+>/g,'');
    var ch=pickChoice(c);
    var chose=fmt(ch.t).replace(/<[^>]+>/g,'');
    var alts=c.choices.filter(function(o){return o!==ch;}).map(function(o){return fmt(o.t).replace(/<[^>]+>/g,'');});
    P.sinceCard=0; P.drewAt=P.drewAt||{}; P.drewAt[c.id]=P.age; if(c.once) P.flags['card_'+c.id]=1;
    if(c.onceDyn){ S.seenDyn=S.seenDyn||{}; S.seenDyn[c.id]=1; }
    var before=Object.assign({},P.aura);
    ch.do(P);
    var dW=(P.aura.warmth-(before.warmth||0)), dL=(P.aura.light-(before.light||0));
    var tone=(dW+dL)>2?'joy':(dW+dL)<-2?'loss':'obs';
    P.decisions.push({age:P.age,q:q,chose:chose,alts:alts,tone:tone});
  };
  function setupFounder(){ S={surname:pick(SURNAMES),vrot:ri(0,29),year:0,marks:{gens:1,souls:0,longest:0,peakMeans:0},lineage:[],person:null,house:initHouse(),seenDyn:{}};
    setEra(chance(0.5)?'settled':rollEra(null), false);
    var f=makeFounder(1); S.person=f; P=f; firedObs={}; seedParents(f);
    if(S.era&&S.era!=='settled'&&eraLine()) logLine(eraLine(),eraTone(S.era)); }
  function playDynasty(maxGen){
    setupFounder(); var gen=1, lives=[];
    while(true){
      running=true; busy=false; var guard=0;
      while(P.alive && guard++<250){ tick(); }   // real tick(): ages, drifts, may draw, may die()
      var snap={gen:P.gen,name:P.name,sex:P.sex,traits:P.traits.slice(),deathAge:P.deathAge,
        epitaph:(P.epitaph||fmt(epitaphFor(P))),log:P.log.slice(),decisions:P.decisions.slice(),
        survivors:P.rels.filter(function(r){return r.alive&&r.kind!=='ex';}).map(function(r){return r.given+' ('+r.kind+')';})};
      snap.seatAfter=seatOf(S.house.seat).name; snap.motto=S.house.motto;   // die()->recordAncestor already ran
      snap.heirlooms=(S.house.heirlooms||[]).map(function(h){return h.name;});
      lives.push(snap);
      var kids=rels('child').filter(function(r){return r.alive;});
      if(!kids.length||gen>=maxGen) break;
      kids.sort(function(a,b){return b.age-a.age;});
      succeed(kids[0]); gen++;
    }
    return {surname:S.surname, lives:lives, finalSeat:seatOf(S.house.seat).name, motto:S.house.motto};
  }
  var DYN=[]; var SEEDN=(typeof N!=='undefined')?N:5;
  for(var d=0; d<SEEDN; d++) DYN.push(playDynasty(5));
  DYN;
`;
const ctx={console, N: parseInt(process.argv[2]||'5',10)}; vm.createContext(ctx);   // `node transcript-gen.cjs [dynasties]`
const DYN=vm.runInContext(prelude+'\n'+read('core.js')+'\n'+read('content.js')+'\n'+read('engine.js')+'\n'+read('dynasty.js')+'\n'+body, ctx, {filename:'t.js'});

function ordOf(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
const L=[];
DYN.forEach((dyn,di)=>{
  L.push(''.padEnd(70,'='));
  L.push(`DYNASTY ${di+1} — House ${dyn.surname}   (${dyn.lives.length} generation${dyn.lives.length>1?'s':''})`);
  L.push(`final standing: ${dyn.finalSeat}${dyn.motto?'   ·   motto: “'+dyn.motto+'”':''}`);
  L.push('');
  dyn.lives.forEach(life=>{
    L.push('-'.padEnd(70,'-'));
    L.push(`${life.gen===1?'FOUNDER':ordOf(life.gen)+' of the line'} — ${life.name}  [${life.sex==='m'?'m':'f'}]  ·  ${life.traits.join(', ')||'no marked traits'}`);
    L.push(`lived ${life.deathAge} years · house now: ${life.seatAfter}${life.heirlooms.length?' · heirlooms: '+life.heirlooms.join('; '):''}`);
    L.push('');
    const dByAge={}; life.decisions.forEach(d=>{ (dByAge[d.age]=dByAge[d.age]||[]).push(d); });
    life.log.forEach(e=>{
      L.push(`  ${String(e.age).padStart(2)}  ${e.text}`);
      (dByAge[e.age]||[]).forEach(d=>{
        L.push(`        ▸ faced: ${d.q}`);
        L.push(`          chose “${d.chose}”  ·  passed over: ${d.alts.map(a=>'“'+a+'”').join(', ')}`);
      });
      dByAge[e.age]=null;
    });
    Object.keys(dByAge).forEach(a=>{ (dByAge[a]||[]).forEach(d=>{
      L.push(`  ${String(a).padStart(2)}  ▸ faced: ${d.q}`);
      L.push(`          chose “${d.chose}”  ·  passed over: ${d.alts.map(x=>'“'+x+'”').join(', ')}`);
    });});
    L.push(`   ✝  Died at ${life.deathAge}.  “${life.epitaph}”`);
    if(life.survivors.length) L.push(`      survived by: ${life.survivors.join(', ')}`);
    L.push('');
  });
});
fs.writeFileSync(path.join(__dirname,'transcripts.txt'), L.join('\n'),'utf8');   // writes next to this script, in eval/
console.log('wrote transcripts.txt — '+DYN.length+' dynasties, '+DYN.reduce((a,d)=>a+d.lives.length,0)+' lives');
