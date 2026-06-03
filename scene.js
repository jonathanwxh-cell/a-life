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
  let lastStage=null, st=document.getElementById('stageTitle'), stArt=document.getElementById('stageArt');
  const STAGE_ART={childhood:'stage-child',youth:'stage-youth',adulthood:'stage-adult',midlife:'stage-midlife','old age':'stage-elder'};

  let t=0, last=performance.now();
  // honour prefers-reduced-motion: freeze the animation clock (so sway, motes,
  // birds, twinkle all hold still) and throttle the loop; the scene still updates
  // with age/stage, just without continuous motion.
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function frame(now){
    const dt=REDUCE?0:Math.min(now-last,60); last=now; if(!REDUCE) t+=dt;
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
      for(let i=0;i<70;i++){const x=(Math.abs(Math.sin(i*12.9898))*w)%w, y=(Math.abs(Math.sin(i*78.233))*(horizonY*0.9))%(horizonY*0.9);const tw=0.4+0.5*Math.sin(t*0.002+i);
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
    stop.addColorStop(0,'rgba(12,9,7,0.7)'); stop.addColorStop(1,'rgba(12,9,7,0)');
    g.fillStyle=stop; g.fillRect(0,0,w,h*0.28);
    const sbot=g.createLinearGradient(0,h*0.62,0,h);
    sbot.addColorStop(0,'rgba(12,9,7,0)'); sbot.addColorStop(1,'rgba(12,9,7,0.7)');
    g.fillStyle=sbot; g.fillRect(0,h*0.62,w,h*0.38);

    // --- stage transition bloom ---
    if(P&&alive){
      const sw=stageWord(age);
      if(sw!==lastStage){
        const a11y=document.getElementById('stageA11y'); if(a11y) a11y.textContent='A new season of life: '+sw+'.';  // announce EVERY stage incl. the opening childhood, independent of the animated title
        if(lastStage!==null){   // the visual title/art only flashes on a TRANSITION, not at birth
          st.textContent=sw; st.classList.add('show'); setTimeout(()=>st.classList.remove('show'),3500);
          if(stArt && STAGE_ART[sw]){ stArt.style.backgroundImage="url('assets/"+STAGE_ART[sw]+".webp')"; stArt.classList.add('show'); setTimeout(()=>stArt.classList.remove('show'),5000); }
        }
        lastStage=sw;
      }
    }

    if(REDUCE){ setTimeout(function(){ frame(performance.now()); }, 250); } else { requestAnimationFrame(frame); }
  }
  // expose current person to the visual loop without touching game scope
  window.AL_P=()=>{ try{ return P; }catch(e){ return null; } };
  // re-seed tree when a new person begins
  const _start=window.AL_reseed=function(){ treeSeed=Math.floor(Math.random()*99999)+1; treeAge=-1; lastStage=null; };
  requestAnimationFrame(frame);
})();
