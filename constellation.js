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
  // prefers-reduced-motion: freeze the twinkle clock (no auto-motion); pan/zoom,
  // being user-initiated, stays responsive via the same loop.
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function draw(now){
    const dt=now-last; last=now; if(!RM) t+=dt;
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
    for(const s of stars){ if(!s.chosen&&s.from){ g.strokeStyle='rgba(150,160,210,0.32)'; g.lineWidth=1.2/view.z;
      g.beginPath(); g.moveTo(s.from.x,s.from.y); g.lineTo(s.x,s.y); g.stroke(); }}
    for(const nd of nodes){
      g.strokeStyle='rgba(224,194,130,0.5)'; g.lineWidth=1.2/view.z;
      g.beginPath(); g.arc(nd.x,nd.y,4.5,0,6.29); g.stroke();
      g.fillStyle='rgba(255,236,190,0.9)'; g.beginPath(); g.arc(nd.x,nd.y,1.8,0,6.29); g.fill();
      g.fillStyle='rgba(236,225,207,0.86)'; g.font=`${Math.max(12,13/view.z)}px Fraunces, serif`; g.textAlign='center';
      g.shadowColor='rgba(10,8,18,0.95)'; g.shadowBlur=4;
      g.fillText(nd.label, nd.x, nd.y-10/view.z);
      g.shadowBlur=0;
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
