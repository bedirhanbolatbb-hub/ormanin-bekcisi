// v48: oyuncu kayıt defteri (ByteBrew) — kişisel bilgi yok; oyuncunun nerede takılıp nerede bıraktığını ve hataları kaydeder
const BBLOG=(function(){
  const ID='bYfe_kLiX', KEY='oZzPIYbGm/O9gxHF+WANOM3yZFSBb0a3djmZ8GIZJ6GiATg0zcnGG8bjWZfD+3Ft', VER='__OBVER__';
  let ok=false; const t0=Date.now(); let errs=0; const guideSeen={}; let guideN=0;
  function on(){ return ok; }
  function init(){ try{ if(location.protocol==='file:'||!window.ByteBrew||/[?&]nolog/.test(location.search)) return; window.ByteBrew.initializeByteBrew(ID,KEY,VER); ok=true; }catch(e){ ok=false; } }
  function mins(){ return Math.round((Date.now()-t0)/6000)/10; }
  function base(){ let l=0,w=0; try{ l=S.level|0; w=S.wave|0; }catch(_){ } return {lvl:String(l),wave:String(w),min:String(mins())}; }
  function ev(name,extra){ if(!ok) return; try{ const o=Object.assign(base(),extra||{}); for(const k in o) o[k]=String(o[k]).replace(/[;:=]/g,' ').slice(0,90); window.ByteBrew.newCustomEvent(name,o); }catch(_){ } }
  function err(kind,msg,src){ if(!ok||errs>=6) return; errs++; ev('gh_error',{kind:kind,msg:String(msg||'').slice(0,90),src:String(src||'').split('/').pop().slice(0,60)}); }
  // durum izleyici: oyun koduna dokunmadan saniyede bir bakar
  let last={}, aliveT=0, hid=false;
  function card(){ const c=document.querySelector('.intro'); return c?(c.id||'card'):'none'; }
  function tick(){ if(!ok) return; let st; try{ st={lvl:S.level|0,wave:S.wave|0,night:!!waveActive,won:!!S.won,failed:!!S.failed,card:card()}; }catch(_){ return; }
    if(last.lvl!==undefined){
      if(st.lvl!==last.lvl) ev('gh_map_start',{from:String(last.lvl)});
      if(st.night&&!last.night) ev('gh_night_start');
      if(st.lvl===last.lvl&&st.wave>last.wave) ev('gh_night_clear',{cleared:String(last.wave)});
      if(st.card==='failCard'&&last.card!=='failCard') ev('gh_fail');
      if(st.card==='winCard'&&last.card!=='winCard') ev('gh_map_win');
    }
    try{ const g=document.querySelector('.guide:not(.off)'); const tx=g&&g.offsetParent?g.textContent.trim().slice(0,60):''; if(tx&&!guideSeen[tx]&&guideN<15){ guideSeen[tx]=1; guideN++; ev('gh_guide',{step:String(guideN),txt:tx}); } }catch(_){ }
    if(!document.hidden&&st.card==='none'){ aliveT++; if(aliveT%120===0) ev('gh_alive'); }
    last=st; }
  function start(){ init(); if(!ok) return; let ret='new'; try{ ret=(+S.lastSeen||0)>0||(S.meta&&(S.meta.unlocked|0)>1)?'back':'new'; }catch(_){ }
    ev('gh_start',{ret:ret,dev:(matchMedia('(pointer:coarse)').matches?'touch':'mouse'),scr:innerWidth+'x'+innerHeight,host:String(location.hostname).slice(0,40)});
    setInterval(tick,1000);
    addEventListener('error',e=>{ const er=e.error; err('error',(er&&er.message)||e.message,(e.filename||'')+':'+(e.lineno||0)); });
    addEventListener('unhandledrejection',e=>{ const r=e.reason; err('promise',(r&&(r.message||r.name))||String(r),''); });
    const bye=()=>{ if(hid) return; hid=true; ev('gh_quit',{card:card(),night:String(!!(typeof waveActive!=='undefined'&&waveActive))}); };
    addEventListener('pagehide',bye); document.addEventListener('visibilitychange',()=>{ if(document.hidden) bye(); else hid=false; }); }
  return {start,ev,err,on};
})();
