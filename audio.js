/* ============================================================
   MUSIC — optional, opt-in ambient. Off by default, because this
   is a quiet reading game. A single <audio> element loops the one
   piece that fits the current scene (title / living / eulogy / heir),
   chosen by watching which veil is shown; switches fade gently so
   nothing cuts. The player turns it on with the ♪ button, and the
   preference persists. Tracks load lazily on first enable, so the
   ~20MB of audio never downloads unless the player actually wants it.
   Opt-in also means the toggle tap is the user gesture browsers
   require, so playback is never blocked.
   ============================================================ */
(function(){
  const TRACKS = {
    theme:  'assets/music/theme.mp3',   // the title screen
    living: 'assets/music/living.mp3',  // a life unfolding
    ending: 'assets/music/ending.mp3',  // the eulogy
    heir:   'assets/music/heir.mp3',    // the line continues
  };
  const MAX_VOL = 0.42;   // sits *under* the reading, never over it
  const FADE_MS = 750;
  const KEY = 'alife:music';

  let el = null;          // the single <audio> element (built on first enable)
  let cur = null;         // the logical track currently loaded
  let enabled = false;
  let fadeTimer = null;

  const btn  = () => document.getElementById('musicBtn');
  const shown = id => { const e = document.getElementById(id); return !!(e && e.classList.contains('show')); };
  const inGame = () => (typeof P !== 'undefined' && P);

  // Which piece fits right now. Narrative beats (an ending, an heir) win;
  // then the title; otherwise the life is simply being lived.
  function pick(){
    if (shown('vDeath')) return 'ending';
    if (shown('vHeir'))  return 'heir';
    if (shown('vTitle')) return 'theme';
    if (shown('vLoad') && !inGame()) return 'theme';   // load menu opened from the title
    return 'living';                                    // play, or a menu over play
  }

  function ensureEl(){
    if (el) return el;
    el = new Audio();
    el.loop = true;
    el.preload = 'none';
    el.volume = 0;
    return el;
  }

  function fadeTo(target, done){
    clearInterval(fadeTimer);
    const from = el.volume, t0 = Date.now();
    fadeTimer = setInterval(()=>{
      const k = Math.min(1, (Date.now() - t0) / FADE_MS);
      el.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k >= 1){ clearInterval(fadeTimer); fadeTimer = null; if (done) done(); }
    }, 40);
  }

  function play(name){
    if (!enabled || !TRACKS[name]) return;
    ensureEl();
    if (cur === name && el.src){                          // the right track is already loaded
      if (el.paused){ const p = el.play(); if (p && p.catch) p.catch(()=>{}); }   // resume from where it was (e.g. after the tab was hidden)
      if (el.volume < MAX_VOL - 0.01) fadeTo(MAX_VOL);
      return;
    }
    const swap = ()=>{                                    // a different track — cross over to it
      cur = name;
      el.src = TRACKS[name];
      const p = el.play();
      if (p && p.catch) p.catch(()=>{});   // autoplay can be blocked until a gesture — retried on the next scene change/gesture
      fadeTo(MAX_VOL);
    };
    if (cur && el.src && !el.paused) fadeTo(0, swap); else swap();
  }

  // Never play to an empty room: pause while the tab is hidden or unloading
  // (backgrounded or about to close), and resume from the same spot on return.
  function suspend(){ clearInterval(fadeTimer); fadeTimer = null; if (el){ el.volume = 0; try { el.pause(); } catch(_){} } }

  function stop(){
    if (!el) return;
    fadeTo(0, ()=>{ try { el.pause(); } catch(_){} });
    cur = null;
  }

  function sync(){ if (enabled) play(pick()); }

  function reflect(on){
    const b = btn();
    if (!b) return;
    b.classList.toggle('on', on);
    b.setAttribute('aria-label', on ? 'music on — tap to mute' : 'music off — tap to play');
  }

  function setEnabled(on){
    enabled = on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch(_){}
    reflect(on);
    if (on) sync(); else stop();
  }

  function init(){
    const b = btn();
    if (b) b.addEventListener('click', ()=> setEnabled(!enabled));

    // follow the scene: re-pick the track whenever a veil opens or closes
    const mo = new MutationObserver(()=> sync());
    ['vTitle','vLoad','vDeath','vHeir','vChron'].forEach(id=>{
      const v = document.getElementById(id);
      if (v) mo.observe(v, { attributes:true, attributeFilter:['class'] });
    });

    // pause when the tab is hidden/backgrounded or unloading; resume when it returns
    document.addEventListener('visibilitychange', ()=>{ if (document.hidden) suspend(); else if (enabled) sync(); });
    window.addEventListener('pagehide', suspend);

    // restore the preference. If it was on, reflect that visually but only
    // start audio after the first user gesture (Begin/Continue), since a
    // fresh page load has no gesture yet and browsers would block autoplay.
    let pref = '0'; try { pref = localStorage.getItem(KEY) || '0'; } catch(_){}
    if (pref === '1'){
      enabled = true; reflect(true);
      const kick = ()=>{
        document.removeEventListener('pointerdown', kick);
        document.removeEventListener('keydown', kick);
        if (enabled) sync();
      };
      document.addEventListener('pointerdown', kick);
      document.addEventListener('keydown', kick);
      sync();   // also try now (harmless if blocked)
    } else {
      reflect(false);
    }

    window.AL_music = { sync, toggle: ()=> setEnabled(!enabled), get on(){ return enabled; }, get track(){ return cur; }, get playing(){ return !!(el && el.src && !el.paused); } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
