
// ---------- Oyuncu ----------
let chopT=1, sellT=0, autoSaveT=0, atkCd=0, introT=0, playerMoving=false;
function fenceCollide(p){ wallCollide(p,0.7,s=>gates[s].open<0.55?0:2.3); }
function updatePlayer(dt){
  const inp=inputVec(); const sp=D.speed();
  const p=player.g.position; let mx=inp.x*inp.l, mz=inp.z*inp.l; let moving=inp.l>0.05;
  if(!moving&&moveTarget&&!placing){ const dr=Math.hypot(moveTarget[0]-p.x,moveTarget[1]-p.z); if(dr<0.35){ moveTarget=null; moveMark.visible=false; } else { const [gx,gz]=routeGoal(p,moveTarget[0],moveTarget[1]); const dx=gx-p.x, dz=gz-p.z, d=Math.hypot(dx,dz); if(d>0.05){ const k=Math.min(1,dr/1.2); mx=dx/d*k; mz=dz/d*k; moving=true; } } }
  if(placing) moving=false;
  playerMoving=moving;
  if(moving&&!follow&&(inp.l>0.05||moveTarget)) recenter();
  if(moving){ p.x+=mx*sp*dt; p.z+=mz*sp*dt; const ang=Math.atan2(mx,mz); let d=ang-player.g.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); player.g.rotation.y+=d*Math.min(1,dt*16); }
  if(moveMark.visible){ moveMark.scale.setScalar(lerp(moveMark.scale.x,1,Math.min(1,dt*6))); moveMark.rotation.z+=dt*2; }
  p.x=clamp(p.x,-WORLD+2,WORLD-2); p.z=clamp(p.z,-WORLD+2,WORLD-2);
  const before=[p.x,p.z]; fenceCollide(p); pushOutOfTrunks(p,1.1); pushOutOfCenter(p,1.9);
  if(moveTarget&&moving&&Math.hypot(p.x-before[0],p.z-before[1])>0.001){ moveStuck=(moveStuck||0)+dt; if(moveStuck>1.2){ moveStuck=0; moveTarget=null; moveMark.visible=false; } } else moveStuck=0;
  if(hasPerk('trample')&&moving){ trampleT-=dt; if(trampleT<=0){ trampleT=0.45; for(const o of enemies){ if(o.dead) continue; const dd=Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z); if(dd<1.9){ damageEnemy(o,D.swordDmg()*0.6); burst(o.g.position.clone().setY(0.6),4,M.ponyDark,0.6); } } } }
  playerRing.position.set(p.x,0.04,p.z);
  player.coinMesh.count=Math.min(COIN_STACK,Math.floor(S.coins/25));
  const canChop=S.logs<D.cap()&&!nearestEnemy(p,4); let chopping=false;
  if(canChop){ const near=[]; for(const t of trees){ if(!t.alive||t.falling>0||t.gone) continue; const d=Math.hypot(t.x-p.x,t.z-p.z); if(d<3.1) near.push(t); } if(near.length){ chopping=true; chopT+=dt*D.chopRate(); if(chopT>=1){ chopT=0; for(const t of near){ if(!t.alive) continue; hitTree(t,player,()=>{ if(S.logs<D.cap()){ S.logs++; setBack(player);} }); } } } }
  const capS=Math.floor(D.cap()/2); const canMine=S.stones<capS&&!nearestEnemy(p,4); let mining=false;
  if(canMine&&!chopping){ const near=[]; for(const r of rocks){ if(!r.alive||r.gone) continue; if(Math.hypot(r.x-p.x,r.z-p.z)<3.4) near.push(r); } if(near.length){ mining=true; chopT+=dt*D.chopRate()*0.8; if(chopT>=1){ chopT=0; for(const r of near){ if(!r.alive) continue; hitRock(r,player,()=>{ if(S.stones<capS){ S.stones++; setBack(player);} }); } } } }
  if(!chopping&&!mining) chopT=Math.min(1,chopT+dt*2);
  const nearRock=canMine?nearestRock(p,4.8):null;
  const nearTree=nearestTree(p,4.5)||nearRock; orbit.spin+=dt*(nearTree?(22+2*S.lv.axe):5); orbit.g.rotation.y=orbit.spin; orbit.on=lerp(orbit.on,nearTree&&canChop?1:0,Math.min(1,dt*6)); orbit.g.scale.setScalar(Math.max(0.001,orbit.on*orbit.n)); orbit.g.position.set(p.x,1.0,p.z); orbit.g.visible=orbit.on>0.02;
  animGuy(player,dt,moving,0.85+inp.l*0.3);
  if(S.logs>0&&p.distanceTo(DEPOT)<3.6){ sellT-=dt; if(sellT<=0){ sellT=0.05; S.logs--; setBack(player); storeLog(p); } }
  else if(S.stones>0&&p.distanceTo(DEPOT)<3.6){ sellT-=dt; if(sellT<=0){ sellT=0.06; S.stones--; setBack(player); storeStone(p); } }
  if(sellGain>0){ sellFlushT-=dt; if(sellFlushT<=0){ sellFlushT=0.4; floatText(p,`+${Math.round(sellGain)}`,''); sellGain=0; } }
  if(S.loot>0&&p.distanceTo(STALL_FRONT)<2.6){ sellT-=dt; if(sellT<=0){ sellT=0.06; S.loot--; setBack(player); fly(p.clone().setY(1.6),stallDrop(),()=>{ S.stall++; },false,5); } }
  atkCd-=dt; const e=nearestEnemy(p,D.swordRange());
  if(e&&atkCd<=0){ atkCd=0.45; player.swing=0.3; SFX.slash(); const ang=Math.atan2(e.g.position.x-p.x,e.g.position.z-p.z); player.g.rotation.y=ang; slash.position.set(p.x,1.4,p.z); slash.rotation.z=-ang+Math.PI/2; slashT=0.22; for(const o of enemies){ if(o.dead) continue; const dx=o.g.position.x-p.x, dz=o.g.position.z-p.z; const d=Math.hypot(dx,dz); if(d<D.swordRange()+0.4&&(dx*Math.sin(ang)+dz*Math.cos(ang))/d>0.1) damageEnemy(o,D.swordDmg()); } }
  if(slashT>0){ slashT-=dt; slash.material.opacity=slashT/0.22*0.8; slash.scale.setScalar(1+(0.22-slashT)*1.5); } else slash.material.opacity=0;
  let target=null, text='';
  let cheapest=null, cbest=1e9, woodNeed=null, wbest=1e9, stoneNeed=null, sbest=1e9; for(const pd of pads){ if(!padVisible(pd)) continue; if(padAvail(pd)){ if(padCost(pd)<cbest){ cbest=padCost(pd); cheapest=pd; } } else if(padRes(pd)==='wood'&&padCost(pd)<wbest){ wbest=padCost(pd); woodNeed=pd; } else if(padRes(pd)==='stone'&&padCost(pd)<sbest){ sbest=padCost(pd); stoneNeed=pd; } }
  if(placing){ target=null; }
  else if(gateDownT>0){ target=null; }
  else if(celebT>0&&coins.length>0){ let best=null,bd=1e9; for(const c of coins){ if(c.fly) continue; const d=Math.hypot(c.x-p.x,c.z-p.z); if(d<bd){bd=d;best=c;} } if(best){ target=new THREE.Vector3(best.x,0,best.z); text='Altınları topla'; } }
  else if(enemies.some(o=>!o.dead&&nearBase(o.g.position.x,o.g.position.z,16))){ const o=nearestEnemy(p,999); if(o){ target=new THREE.Vector3(o.g.position.x,0,o.g.position.z); text='Düşmanı durdur'; } }
  else if(loot.length>0&&loot.some(l=>!l.fly&&!l.auto&&!l.taken)&&S.loot<D.cap()){ let best=null,bd=1e9; for(const l of loot){ if(l.fly||l.auto||l.taken) continue; const d=Math.hypot(l.x-p.x,l.z-p.z); if(d<bd){bd=d;best=l;} } target=new THREE.Vector3(best.x,0,best.z); text='Ganimeti topla'; }
  else if(S.loot>0){ target=STALL_FRONT; text='Tezgâha götür'; }
  else if(S.bank>=15&&!cheapest){ target=TREASURY; text='Hazineden altın al'; }
  else if(cheapest){ target=cheapest.g.position; const k=cheapest.def.kind; text=cheapest.def.name+((k==='tower'&&padLevel(cheapest.def)===0)||k==='newTower'?' kur':k==='wall'?' güçlendir':k==='soldier'||k==='worker'||k==='stoneWorker'||k==='collector'?' al':k==='expand'?'':' geliştir'); }
  else if(S.stones>=capS&&stoneNeed){ target=stoneNeed.g.position; text='Taşı '+stoneNeed.def.name.toLowerCase()+' için kullan'; }
  else if(S.stones>=capS){ target=DEPOT_FRONT; text='Taşı depola'; }
  else if(stoneNeed&&!woodNeed&&S.logs<D.cap()){ const r=nearestRock(p,300); if(r){ target=new THREE.Vector3(r.x,0,r.z); text=stoneNeed.def.name+' için taş çıkar'; } }
  else if(S.logs>=D.cap()&&woodNeed){ target=woodNeed.g.position; text='Odunu '+woodNeed.def.name.toLowerCase()+' için kullan'; }
  else if(S.logs>=D.cap()){ target=DEPOT_FRONT; text='Odunu depola'; }
  else if(S.stall>0&&customers.length===0){ target=STALL_FRONT; text='Müşteri bekle'; }
  else { const t=nearestTree(p,160); if(t){ target=new THREE.Vector3(t.x,0,t.z); text= woodNeed? (woodNeed.def.name+' için odun kes') : (S.logs>0?'Odun topla':'Ağaç kes'); } }
  updateGuide(target,text,dt);
  const tipEl=$('tip'); let tip='';
  if(placing) tip='Kule için sur kenarında bir yer seç';
  else if(introT<7&&S.wave===1&&S.coins===0&&S.level===1) tip = isTouch? 'Sürükle: yürü · Dokun: oraya git · İki parmak: yakınlaştır' : 'WASD ile yürü · Tıkla: oraya git · Tekerlek: yakınlaştır';
  tipEl.textContent=tip; tipEl.classList.toggle('hide',!tip);
  introT+=dt;
}
let moveStuck=0, trampleT=0;
function updateGuide(target,text,dt){
  const p=player.g.position;
  if(!target){ guide.arrow.visible=guide.ring.visible=guide.pin.visible=false; guide.el.style.display='none'; return; }
  const dx=target.x-p.x, dz=target.z-p.z, dist=Math.hypot(dx,dz), ang=Math.atan2(dx,dz);
  const near=dist<3.2;
  guide.arrow.visible=!near; guide.arrow.rotation.z=ang+Math.PI; guide.arrow.position.set(p.x+Math.sin(ang)*2.1,0.07,p.z+Math.cos(ang)*2.1);
  const pulse=1+Math.sin(performance.now()/160)*0.08; guide.arrow.scale.set(pulse,pulse,1);
  guide.ring.visible=true; guide.ring.position.set(target.x,0.05,target.z); guide.ring.rotation.z+=dt*1.5; const rs=1+Math.sin(performance.now()/220)*0.1; guide.ring.scale.set(rs,rs,1);
  guide.pin.visible=true; guide.pin.position.set(target.x,4.2+Math.sin(performance.now()/200)*0.25,target.z);
  guide.el.style.display='block'; guide.el.textContent = near? text : `${text} · ${Math.round(dist)} m`;
  v3.set(target.x,5.1,target.z).project(camera); guide.el.style.left=((v3.x+1)/2*innerWidth)+'px'; guide.el.style.top=((1-v3.y)/2*innerHeight)+'px';
}

// ---------- Kapılar ----------
function updateGates(dt){
  if(gateDownT>0){ gateDownT-=dt; S.gateHp=D.gateMax()*(1-gateDownT/7); if(gateDownT<=0){ S.gateHp=D.gateMax(); toast('Sur onarıldı!','good'); waveT=Math.max(waveT,6); } }
  else if(!waveActive&&S.gateHp<D.gateMax()) S.gateHp=Math.min(D.gateMax(),S.gateHp+5*dt);
  else if(waveActive&&hasPerk('mason')&&S.gateHp<D.gateMax()) S.gateHp=Math.min(D.gateMax(),S.gateHp+3*dt);
  if(gateShake>0) gateShake-=dt;
  const p=player.g.position; const down=gateDownT>0;
  for(const s of SIDES){ const gt=gates[s]; let near=Math.hypot(p.x-gt.x,p.z-gt.z)<4.5;
    if(!near){ for(const w of workers){ if(Math.hypot(w.guy.g.position.x-gt.x,w.guy.g.position.z-gt.z)<3.5){ near=true; break; } } }
    if(!near){ for(const c of collectors){ if(Math.hypot(c.guy.g.position.x-gt.x,c.guy.g.position.z-gt.z)<3.5){ near=true; break; } } }
    if(!near){ for(const so of soldiers){ if(so.moving&&Math.hypot(so.guy.g.position.x-gt.x,so.guy.g.position.z-gt.z)<3.5){ near=true; break; } } }
    if(!near&&s==='E'){ for(const c of customers){ if(Math.hypot(c.guy.g.position.x-gt.x,c.guy.g.position.z-gt.z)<4){ near=true; break; } } }
    gt.open+=((near?1:0)-gt.open)*Math.min(1,dt*7);
    const a=gt.open*1.5; gt.L.rotation.y=-a; gt.R.rotation.y=a; const fx=lerp(gt.L.rotation.x, down?1.45:0, Math.min(1,dt*5)); gt.L.rotation.x=gt.R.rotation.x=fx;
    const sh=gateShake>0?Math.sin(gateShake*60)*0.08:0; const d=SD[s]; gt.g.position.set(gt.x+d.t[0]*sh,0,gt.z+d.t[1]*sh); }
}

// ---------- Arayüz ----------
const coinsEl=$('coins'), logsEl=$('logs'), capEl=$('cap'), waveLbl=$('waveLbl'), waveTEl=$('waveT'), gateBar=$('gateBar'), gateLbl=$('gateLbl'), enemyEl=$('enemyCount');
let lastCoins=-1, shownCoins=S.coins;
function toast(msg,cls){ const t=$('toast'); t.textContent=msg; t.className='toast show '+(cls||''); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2400); }
function renderHud(){
  shownCoins=lerp(shownCoins,S.coins,0.25); if(Math.abs(shownCoins-S.coins)<0.6) shownCoins=S.coins; const c=Math.floor(shownCoins); if(lastCoins!==c){ coinsEl.textContent=c; lastCoins=c; }
  logsEl.textContent=S.logs; capEl.textContent='/'+D.cap(); $('woodStock').textContent=S.wood; $('stoneStock').textContent=S.stone+(S.stones?'+'+S.stones:''); $('lootCount').textContent=S.loot;
  waveLbl.textContent=`Bölüm ${S.level} · Dalga ${S.wave}/${WAVES}`; waveTEl.textContent = celebT>0? 'Altınları topla!' : waveActive? 'saldırı!' : Math.ceil(waveT)+' sn'; const nx=$('waveNext'); const nt=(celebT>0||$('levelCard'))?'':(waveActive?'Saldıran: ':'Sıradaki: ')+planText(); if(nx.textContent!==nt) nx.textContent=nt;
  enemyEl.textContent=enemies.length+spawnQueue;
  const r=clamp(S.gateHp/D.gateMax(),0,1); gateBar.firstElementChild.style.width=(r*100)+'%'; gateBar.classList.toggle('danger',r<0.35); gateLbl.textContent=`Sur ${Math.ceil(S.gateHp)}/${D.gateMax()}`;
}
$('muteBtn').addEventListener('click',()=>{ audio(); S.muted=!S.muted; $('muteBtn').textContent=S.muted?'🔇':'🔊'; save(); });
$('muteBtn').textContent=S.muted?'🔇':'🔊';
let started=false;
cgCall(k=>k.game.loadingStop());
function startPlay(){ if(started) return; const it=$('intro'); if(it) it.remove(); started=true; ensureQuests(); renderQuests(); renderPerkChip(); const rep=awayReport(); S.lastSeen=Date.now(); showAway(rep); save(); }
$('startBtn').addEventListener('click',()=>{ audio(); startPlay(); });
if(CG.sdk&&CG.env!=='disabled'){ setTimeout(startPlay,150); }
if(S.coins>0||S.wave>1||S.level>1){ $('startBtn').textContent='Devam et'; $('intro').querySelector('p').textContent=`Kaldığın yerden: Bölüm ${S.level}, ${S.wave}. dalga, ${Math.floor(S.coins)} altın.`; }

// ---------- Günlük görevler, günlük ödül, sen yokken kazanç ----------
const QPOOL=[ {k:'chop',t:'Ağaç kes',n:l=>25+5*l,r:l=>40+10*l}, {k:'kill',t:'Düşman yok et',n:l=>20+8*l,r:l=>50+12*l}, {k:'wave',t:'Dalga temizle',n:l=>3,r:l=>60+15*l}, {k:'build',t:'İnşa et / geliştir',n:l=>4,r:l=>45+10*l}, {k:'sell',t:'Miğfer sat',n:l=>12+4*l,r:l=>50+10*l}, {k:'wood',t:'Depoya odun koy',n:l=>60+20*l,r:l=>45+10*l}, {k:'stone',t:'Taş çıkar',n:l=>18+6*l,r:l=>55+10*l} ];
const dayKey=()=>{ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
function ensureQuests(){ const k=dayKey(); if(!S.q||S.q.date!==k){ const pool=QPOOL.filter(q=>q.k!=='stone'||S.lv.wall>=2||S.lv.expand>=2); const list=[]; const l=S.level-1; for(let i=0;i<3;i++){ const j=Math.floor(Math.random()*pool.length); const q=pool.splice(j,1)[0]; list.push({k:q.k,t:q.t,n:q.n(l),r:q.r(l),p:0,done:false}); } S.q={date:k,list}; } }
function questEvent(k,n){ if(!S.q) return; n=n||1; for(const q of S.q.list){ if(q.k!==k||q.done) continue; q.p=Math.min(q.n,q.p+n); if(q.p>=q.n){ q.done=true; S.coins+=q.r; toast(`Görev tamam: ${q.t} · +${q.r} altın`,'good'); SFX.build(); dropCoins(player.g.position.clone().setY(2.5),Math.min(30,Math.round(q.r/4)),0,3,1.2); } } renderQuests(); }
const questBtn=$('questBtn'), questSheet=$('questSheet');
function renderQuests(){ if(!S.q) return; const done=S.q.list.filter(q=>q.done).length; $('questTxt').textContent=done+'/3'; questBtn.classList.toggle('done',done===3);
  $('questList').innerHTML=S.q.list.map(q=>`<div class="q${q.done?' ok':''}"><div class="qb"><b>${q.t}</b><small>${Math.min(q.p,q.n)} / ${q.n}${q.done?' · tamamlandı ✓':''}</small><div class="qbar"><i style="width:${Math.min(100,q.p/q.n*100)}%"></i></div></div><div class="rw">${q.done?'✓':'+'+q.r} 🪙</div></div>`).join(''); }
questBtn.addEventListener('click',()=>{ audio(); renderQuests(); questSheet.classList.toggle('open'); });
$('questClose').addEventListener('click',()=>questSheet.classList.remove('open'));
function fmtDur(sec){ const m=Math.floor(sec/60), h=Math.floor(m/60); return h>0? `${h} sa ${m%60} dk` : `${Math.max(1,m)} dk`; }
function awayReport(){ const now=Date.now(); const last=S.lastSeen||0; const sec=Math.min(6*3600,Math.max(0,(now-last)/1000)); const out={sec:0,wood:0,gold:0,daily:0,streak:0};
  if(last&&sec>=90){ const min=sec/60; const wpm=workers.filter(w=>w.kind!=='stone').length*4*(1+0.15*(S.lv.workerSpd||0)); out.wood=Math.round(wpm*min); out.stone=Math.round(workers.filter(w=>w.kind==='stone').length*2.5*min); const def=S.towers.reduce((a,t)=>a+t.lvl,0)+soldiers.length*2; if(def>0){ const raids=Math.floor(min/3); out.gold=Math.round(raids*Math.min(def,12)*D.lootPrice()*0.35); } out.sec=sec; }
  const k=dayKey(); if(S.dailyDate!==k){ const y=new Date(); y.setDate(y.getDate()-1); const yk=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate(); S.streak=(S.dailyDate===yk)?(S.streak||0)+1:1; S.dailyDate=k; out.streak=S.streak; out.daily=50+25*Math.min(7,S.streak); }
  return out; }
function showAway(rep){ if(rep.sec<=0&&!rep.daily){ showPerkCard(); return; } const card=document.createElement('div'); card.className='intro'; card.id='awayCard'; const rows=[]; if(rep.sec>0){ rows.push(`<div><span>Sen yokken geçen süre</span><b>${fmtDur(rep.sec)}</b></div>`); if(rep.wood>0) rows.push(`<div><span>Oduncular kesti</span><b>+${rep.wood} odun</b></div>`); if(rep.stone>0) rows.push(`<div><span>Taşçılar çıkardı</span><b>+${rep.stone} taş</b></div>`); if(rep.gold>0) rows.push(`<div><span>Nöbetçiler baskın püskürttü</span><b>+${rep.gold} altın</b></div>`); if(!rep.wood&&!rep.gold&&!rep.stone) rows.push(`<div><span>Oduncu ve nöbetçi yoktu</span><b>—</b></div>`); }
  if(rep.daily) rows.push(`<div><span>Günlük giriş ödülü · ${rep.streak}. gün</span><b>+${rep.daily} altın</b></div>`);
  const canAd=!!CG.sdk&&(rep.wood+rep.gold+(rep.stone||0))>0; card.innerHTML=`<div class="card"><h1>${rep.sec>0?'Sen yokken':'Hoş geldin!'}</h1><div class="away">${rows.join('')}</div><button id="awayTake">Topla</button>${canAd?'<button id="awayAd" style="margin-top:8px;background:var(--coin);color:var(--coin-ink)">📺 Reklam izle, 2 katını al</button>':''}</div>`; document.body.appendChild(card);
  if(canAd){ $('awayAd').addEventListener('click',()=>{ audio(); $('awayAd').disabled=true; $('awayAd').textContent='Reklam yükleniyor…'; cgAd('rewarded',()=>{ rep.wood*=2; rep.gold*=2; rep.stone=(rep.stone||0)*2; toast('İki katı alındı!','good'); $('awayTake').click(); },()=>{ $('awayAd').textContent='Reklam yok, normal topla'; $('awayAd').disabled=true; }); }); }
  $('awayTake').addEventListener('click',()=>{ audio(); card.remove(); setTimeout(showPerkCard,150); S.wood+=rep.wood; setPile(Math.min(24,S.wood)); S.stone+=(rep.stone||0); setStonePile(Math.min(18,S.stone)); const g=rep.gold+rep.daily; if(g>0){ dropCoins(player.g.position.clone().setY(3),Math.min(80,Math.round(g/3)+6),g/Math.min(80,Math.round(g/3)+6),5,1.4); } if(rep.wood>0) burst(DEPOT.clone().setY(1.5),20,M.log,1); SFX.build(); save(); }); }
function renderPerkChip(){ const el=$('perkChip'); if(S.perk&&S.perkLevel===S.level){ el.style.display='flex'; $('perkTxt').textContent=PERKS[S.perk].n; } else el.style.display='none'; }
function showPerkCard(){ if($('perkCard')||$('awayCard')) return; if(S.perkLevel===S.level&&S.perk) return; if(!S.perkOffer||S.perkOfferLevel!==S.level){ const keys=Object.keys(PERKS); const pick=[]; while(pick.length<3){ const k=keys[Math.floor(Math.random()*keys.length)]; if(!pick.includes(k)) pick.push(k); } S.perkOffer=pick; S.perkOfferLevel=S.level; save(); }
  const card=document.createElement('div'); card.className='intro'; card.id='perkCard'; card.innerHTML=`<div class="card"><h1>Bölüm ${S.level} · Yetenek seç</h1><p>Bu bölüm boyunca geçerli. Bir tane seç.</p><div class="perks">${S.perkOffer.map(k=>`<button data-k="${k}"><b>${PERKS[k].n}</b><small>${PERKS[k].d}</small></button>`).join('')}</div></div>`; document.body.appendChild(card);
  card.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ audio(); S.perk=b.dataset.k; S.perkLevel=S.level; S.perkOffer=null; card.remove(); renderPerkChip(); S.gateHp=Math.min(S.gateHp,D.gateMax()); toast('Yetenek: '+PERKS[S.perk].n,'good'); SFX.build(); save(); })); }
function cgAd(type,onDone,onFail){ if(!CG.sdk){ onFail&&onFail(); return; } if(type==='midgame'&&Date.now()-CG.lastMid<180000){ onFail&&onFail(); return; } let ended=false; const end=(ok)=>{ if(ended) return; ended=true; adMute=false; if(ok){ if(type==='midgame') CG.lastMid=Date.now(); onDone&&onDone(); } else onFail&&onFail(); }; try{ CG.sdk.ad.requestAd(type,{adStarted:()=>{ adMute=true; },adFinished:()=>end(true),adError:()=>end(false)}); setTimeout(()=>{ if(!ended&&!adMute) end(false); },4000); }catch(e){ end(false); } }
function markSeen(){ S.lastSeen=Date.now(); save(); }
addEventListener('pagehide',markSeen); document.addEventListener('visibilitychange',()=>{ if(document.hidden) markSeen(); });
// ---------- Mini harita ----------
const miniEl=$('mini'); const mctx=miniEl.getContext('2d'); let miniBase=null, miniT=0;
function drawMiniBase(){ const N=132; const c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'); const px=v=>(v+WORLD)/(2*WORLD)*N; x.fillStyle='#d7b989'; x.fillRect(0,0,N,N); x.fillStyle='#2f7d47'; for(const t of trees){ if(t.gone) continue; x.fillRect(px(t.x)-0.6,px(t.z)-0.6,1.3,1.3); } x.strokeStyle='#e3c898'; x.lineWidth=2; x.lineCap='round'; for(const s of SIDES){ const P=roadPath(s); x.beginPath(); P.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke(); } for(const [qx,qz] of QUARRIES){ x.fillStyle='#b9b3a6'; x.beginPath(); x.ellipse(px(qx),px(qz),4.5,3.8,0.6,0,7); x.fill(); } x.fillStyle='#63b85a'; x.fillRect(px(-H),px(-H),px(H)-px(-H),px(H)-px(-H)); x.strokeStyle='#7d5124'; x.lineWidth=2; x.strokeRect(px(-H),px(-H),px(H)-px(-H),px(H)-px(-H)); x.fillStyle='#e3c898'; for(const s of SIDES){ const [gx,gz]=sidePos(s,0,0); x.fillRect(px(gx)-2,px(gz)-2,4,4); } miniBase=c; }
function drawMini(){ if(!miniBase) drawMiniBase(); const N=132; const px=v=>(v+WORLD)/(2*WORLD)*N; mctx.drawImage(miniBase,0,0); const dot=(x,z,c,r)=>{ mctx.fillStyle=c; mctx.beginPath(); mctx.arc(px(x),px(z),r,0,7); mctx.fill(); };
  for(const w of workers) dot(w.guy.g.position.x,w.guy.g.position.z,'#fff8e7',1.6); for(const c of collectors) dot(c.guy.g.position.x,c.guy.g.position.z,'#fff8e7',1.6); for(const so of soldiers) dot(so.guy.g.position.x,so.guy.g.position.z,'#3d63c9',1.8); for(const e of enemies){ if(!e.dead) dot(e.g.position.x,e.g.position.z,'#d63a3a',e.boss?3:2); }
  if(plan&&(!waveActive||spawnQueue>0)){ for(const s of SIDES){ if(!plan.cnt[s]) continue; const [gx,gz]=sidePos(s,0,6); mctx.fillStyle='#d63a3a'; mctx.font='bold 11px sans-serif'; mctx.textAlign='center'; mctx.fillText('!',px(gx),px(gz)+4); } }
  const p=player.g.position; dot(p.x,p.z,'#ffd23f',3); mctx.strokeStyle='#2b3a2e'; mctx.lineWidth=1; mctx.beginPath(); mctx.arc(px(p.x),px(p.z),3,0,7); mctx.stroke();
  const portrait=innerHeight>innerWidth; const hw=(portrait?13:22)*zoom, hh=hw*innerHeight/innerWidth; mctx.strokeStyle='rgba(255,255,255,.85)'; mctx.lineWidth=1; mctx.strokeRect(px(camTarget.x-hw),px(camTarget.z-hh),px(camTarget.x+hw)-px(camTarget.x-hw),px(camTarget.z+hh)-px(camTarget.z-hh)); }
miniEl.addEventListener('pointerdown',e=>{ e.stopPropagation(); audio(); const r=miniEl.getBoundingClientRect(); const wx=((e.clientX-r.left)/r.width)*2*WORLD-WORLD, wz=((e.clientY-r.top)/r.height)*2*WORLD-WORLD; const p=player.g.position; camPan.set(wx-p.x,0,wz-p.z); follow=false; recenterEl.classList.add('show'); });
// ---------- Döngü ----------
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; const portrait=h>w; const halfW=portrait?13:22; const dist=camOff.length(); const hf=2*Math.atan(halfW/dist); camera.fov=2*Math.atan(Math.tan(hf/2)/camera.aspect)*180/Math.PI; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();
let last=performance.now(); const camTarget=new THREE.Vector3(); const camPos=new THREE.Vector3();
function tick(dt){ updateGateMarks(dt); updatePlayer(dt); updateTrees(dt); updateRocks(dt); updateWorkers(dt); updateSoldiers(dt); updateTowers(dt); updatePads(dt); updateEnemies(dt); updateProjectiles(dt); updateBalls(dt); updateGates(dt); updateFliers(dt); updateChips(dt); updateCoins(dt); updateLoot(dt); updateCustomers(dt); updateTreasury(dt); updateCollectors(dt); updateTraderNpc(dt); }
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(0.05,(now-last)/1000); last=now;
  const playing=started&&!document.hidden&&!$('awayCard')&&!$('perkCard')&&!$('levelCard')&&!adMute; if(playing!==CG.playing){ CG.playing=playing; cgCall(k=>playing?k.game.gameplayStart():k.game.gameplayStop()); }
  if(playing){ tick(dt); updateFloats(dt); updateLabels(); updateBubble(); autoSaveT+=dt; if(autoSaveT>5){ autoSaveT=0; S.lastSeen=Date.now(); save(); } }
  const p=player.g.position;
  if(follow){ camPan.multiplyScalar(Math.pow(0.001,dt)); } camTarget.set(p.x+camPan.x,0,p.z+camPan.z);
  zoom=lerp(zoom,zoomTarget,1-Math.pow(0.002,dt)); camPos.copy(camTarget).addScaledVector(camOff,zoom); camera.position.lerp(camPos,1-Math.pow(0.0005,dt));
  camera.lookAt(camera.position.x-camOff.x*zoom,0,camera.position.z-camOff.z*zoom);
  const nightT=(waveActive&&celebT<=0)?1:0; const nk=1-Math.pow(0.35,dt); night+=(nightT-night)*nk; applyNight(night); for(const t of torches) t.l.intensity=0.5+1.5*night; musicTick(night);
  if(wallPop<1&&wallGroup){ wallPop=Math.min(1,wallPop+dt*2.2); const k=1-Math.pow(1-wallPop,3); wallGroup.scale.set(1,0.05+0.95*k*(1+0.12*Math.sin(wallPop*Math.PI)),1); }
  sun.position.set(p.x+14,26,p.z+10); sun.target.position.set(p.x,0,p.z);
  renderHud(); miniT+=dt; if(miniT>0.12){ miniT=0; drawMini(); }
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.__dbg={rocks,expandBase,dropLootFn:dropLoot,addCollectorFn:addCollector,replan:()=>{ plan=null; planWave(); },addSoldierFn:addSoldier,setPile,setStonePile,customers,traderNpc:()=>traderNpc,buildWalls,buildGates,rebuildTowers,gateBroken,get waveActive(){return waveActive;},balanceWave,defenseDps,waveTilt,get gateDownT(){return gateDownT;},hitRock,get night(){return night;},set night(v){night=v;},damageEnemy,addWorker,questEvent,awayReport,showAway,ensureQuests,camPan,panBy,recenter,get follow(){return follow;},drawMiniBase,get plan(){return plan;},S,player,trees,enemies,workers,soldiers,towers,pads,D,coins,dropCoins,tick,loot,customers,setBack,STALL,TREASURY,DEPOT,orbit,collectors,get H(){return H;},get zoom(){return zoom;},set zoom(v){zoom=v;},camera,camOff,camTarget,get zoomTarget(){return zoomTarget;},set zoomTarget(v){zoomTarget=v;},bubbleEl,get bubblePad(){return bubblePad;},get placing(){return placing;},placeGhostAt,confirmPlace,instantBuy,cancelPad,get moveTarget(){return moveTarget;},set moveTarget(v){moveTarget=v;},gates,routeGoal,startWave,spawnOne,makeEnemy,sidePos};
}
