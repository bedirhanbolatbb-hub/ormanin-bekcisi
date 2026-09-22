
// ---------- Oyuncu ----------
let fullT=0, chopT=1, sellT=0, autoSaveT=0, atkCd=0, introT=0, playerMoving=false;
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
  const before=[p.x,p.z]; fenceCollide(p); pushOutOfTrunks(p,1.1); pushOutOfCenter(p,1.9); pushOutOfTowers(p,1.6); regionCollide(p);
  if(moveTarget&&moving&&Math.hypot(p.x-before[0],p.z-before[1])>0.001){ moveStuck=(moveStuck||0)+dt; if(moveStuck>1.2){ moveStuck=0; moveTarget=null; moveMark.visible=false; } } else moveStuck=0;
  if(hasPerk('trample')&&moving){ trampleT-=dt; if(trampleT<=0){ trampleT=0.45; for(const o of enemies){ if(o.dead) continue; const dd=Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z); if(dd<1.9){ damageEnemy(o,D.swordDmg()*0.6); burst(o.g.position.clone().setY(0.6),4,M.ponyDark,0.6); } } } }
  playerRing.position.set(p.x,0.04,p.z);
  player.coinMesh.count=Math.min(COIN_STACK,Math.floor(S.coins/25));
  const canChop=S.logs<D.cap()&&!nearestEnemy(p,4); let chopping=false;
  if(canChop){ const near=[]; for(const t of trees){ if(!t.alive||t.falling>0||t.gone) continue; const d=Math.hypot(t.x-p.x,t.z-p.z); if(d<3.1) near.push(t); } if(near.length){ chopping=true; chopT+=dt*D.chopRate(); if(chopT>=1){ chopT=0; for(const t of near){ if(!t.alive) continue; hitTree(t,player,()=>{ if(S.logs<D.cap()){ S.logs++; setBack(player);} }); } } } }
  const capS=Math.floor(D.cap()/2); const canMine=S.stones<capS&&!nearestEnemy(p,4); let mining=false;
  if(canMine&&!chopping){ const near=[]; for(const r of rocks){ if(!r.alive||r.gone) continue; if(Math.hypot(r.x-p.x,r.z-p.z)<3.4) near.push(r); } if(near.length){ mining=true; chopT+=dt*D.chopRate()*0.8; if(chopT>=1){ chopT=0; for(const r of near){ if(!r.alive) continue; hitRock(r,player,()=>{ if(S.stones<capS){ S.stones++; setBack(player);} }); } } } }
  if(!chopping&&!mining) chopT=Math.min(1,chopT+dt*2);
  fullT-=dt; if(fullT<=0){ const fullL=S.logs>=D.cap()&&nearestTree(p,3.6), fullS=S.stones>=capS&&nearestRock(p,4); if(fullL||fullS){ fullT=2.5; floatText(p,fullS?'Sırtın taşla dolu — depoya götür':'Sırtın dolu — depoya götür','red'); } }
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
  let target=null, text='', rgd=null;
  let cheapest=null, cbest=1e9, woodNeed=null, wbest=1e9, stoneNeed=null, sbest=1e9; for(const pd of pads){ if(!padVisible(pd)) continue; if(padAvail(pd)){ if(padCost(pd)<cbest){ cbest=padCost(pd); cheapest=pd; } } else if(padRes(pd)==='wood'&&padCost(pd)<wbest){ wbest=padCost(pd); woodNeed=pd; } else if(padRes(pd)==='stone'&&padCost(pd)<sbest){ sbest=padCost(pd); stoneNeed=pd; } }
  // Öneri sırası: saldırılan kapının kuleleri > yeni topçu > sur > asker > oduncu > diğerleri (düşük seviye öne)
  { let pri=null; for(const pd of pads){ if(!padVisible(pd)||!padAvail(pd)) continue; const k=pd.def.kind; const l=padLevel(pd.def); let sc;
      if(k==='tower'){ const tw=S.towers[pd.def.ti]; const heat=tw.side==='C'?3:((plan&&plan.cnt[tw.side])||0); if(tw.side!=='C'&&SIDES.indexOf(tw.side)>=sidesActive()) continue; sc=10+Math.min(12,heat)*0.6-l*2.2; }
      else if(k==='newTower') sc=9-l*3; else if(k==='wall') sc=8.5-l*2; else if(k==='soldier') sc=7-l*2; else if(k==='worker') sc=7.5-l*2.5; else if(k==='expand') sc=6-l*2; else sc=4-l;
      if(!pri||sc>pri.sc) pri={pd,sc}; } if(pri) cheapest=pri.pd; }
  if(placing){ target=null; }
  else if(gateDownT>0){ target=null; }
  else if(celebT>0&&coins.length>0){ let best=null,bd=1e9; for(const c of coins){ if(c.fly) continue; const d=Math.hypot(c.x-p.x,c.z-p.z); if(d<bd){bd=d;best=c;} } if(best){ target=new THREE.Vector3(best.x,0,best.z); text='Altınları topla'; } }
  else if(enemies.some(o=>!o.dead&&nearBase(o.g.position.x,o.g.position.z,16))){ const o=nearestEnemy(p,999); if(o){ target=new THREE.Vector3(o.g.position.x,0,o.g.position.z); text='Düşmanı durdur'; } }
  else if(loot.length>0&&loot.some(l=>!l.fly&&!l.auto&&!l.taken)&&S.loot<D.cap()){ let best=null,bd=1e9; for(const l of loot){ if(l.fly||l.auto||l.taken) continue; const d=Math.hypot(l.x-p.x,l.z-p.z); if(d<bd){bd=d;best=l;} } target=new THREE.Vector3(best.x,0,best.z); text='Ganimeti topla'; }
  else if(S.loot>0){ target=STALL_FRONT; text='Tezgâha götür'; }
  else if((rgd=regionGuide('carry'))){ target=rgd.t; text=rgd.text; }
  else if(S.bank>=15&&!cheapest){ target=TREASURY; text='Hazineden altın al'; }
  else if(cheapest){ target=cheapest.g.position; const k=cheapest.def.kind; text=cheapest.def.name+((k==='tower'&&padLevel(cheapest.def)===0)||k==='newTower'?' kur':k==='wall'?' güçlendir':k==='soldier'||k==='worker'||k==='stoneWorker'||k==='collector'?' al':k==='expand'?'':' geliştir'); }
  else if(S.stones>=capS&&stoneNeed){ target=stoneNeed.g.position; text='Taşı '+stoneNeed.def.name.toLowerCase()+' için kullan'; }
  else if(S.stones>=capS){ target=DEPOT_FRONT; text='Taşı depola'; }
  else if(stoneNeed&&!woodNeed&&S.logs<D.cap()){ const r=nearestRock(p,300); if(r){ target=new THREE.Vector3(r.x,0,r.z); text=stoneNeed.def.name+' için taş çıkar'; } }
  else if(S.logs>=D.cap()&&woodNeed){ target=woodNeed.g.position; text='Odunu '+woodNeed.def.name.toLowerCase()+' için kullan'; }
  else if(S.logs>=D.cap()){ target=DEPOT_FRONT; text='Odunu depola'; }
  else if(S.stall>0&&customers.length===0){ target=STALL_FRONT; text='Müşteri bekle'; }
  else if(!woodNeed&&(rgd=regionGuide('idle'))){ target=rgd.t; text=rgd.text; }
  else { const t=nearestTree(p,160); if(t){ target=new THREE.Vector3(t.x,0,t.z); text= woodNeed? (woodNeed.def.name+' için odun kes') : (S.logs>0?'Odun topla':'Ağaç kes'); } }
  guideTarget=target; updateGuide(target,text,dt);
  const tipEl=$('tip'); let tip='';
  if(placing) tip='';
  else if(introT<7&&S.wave===1&&S.coins===0&&S.level===1) tip = isTouch? 'Sürükle: yürü · Dokun: oraya git · İki parmak: yakınlaştır' : 'WASD ile yürü · Tıkla: oraya git · Tekerlek: yakınlaştır';
  tipEl.textContent=tip; tipEl.classList.toggle('hide',!tip);
  introT+=dt;
}
let moveStuck=0, trampleT=0, guideTarget=null;
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
  v3.set(target.x,5.1,target.z).project(camera); const gw2=guide.el.offsetWidth/2+8; guide.el.style.left=clamp((v3.x+1)/2*innerWidth,gw2,innerWidth-gw2)+'px'; guide.el.style.top=clamp((1-v3.y)/2*innerHeight,50,innerHeight-40)+'px';
}

// ---------- Kapılar ----------
function updateGates(dt){
  if(runOver){ }
  else if(!waveActive&&S.gateHp<D.gateMax()) S.gateHp=Math.min(D.gateMax(),S.gateHp+D.gateMax()*0.05*dt);
  else if(waveActive&&hasPerk('mason')&&S.gateHp<D.gateMax()) S.gateHp=Math.min(D.gateMax(),S.gateHp+3*dt);
  if(gateShake>0) gateShake-=dt;
  const p=player.g.position; const down=runOver&&S.gateHp<=0;
  for(const s of SIDES){ const gt=gates[s]; let near=Math.hypot(p.x-gt.x,p.z-gt.z)<4.5;
    if(!near){ for(const w of workers){ if(Math.hypot(w.guy.g.position.x-gt.x,w.guy.g.position.z-gt.z)<3.5){ near=true; break; } } }
    if(!near){ for(const c of collectors){ if(Math.hypot(c.guy.g.position.x-gt.x,c.guy.g.position.z-gt.z)<3.5){ near=true; break; } } }
    if(!near){ for(const so of soldiers){ if(so.moving&&Math.hypot(so.guy.g.position.x-gt.x,so.guy.g.position.z-gt.z)<3.5){ near=true; break; } } }
    if(!near){ for(const c of carts){ if(Math.hypot(c.C.g.position.x-gt.x,c.C.g.position.z-gt.z)<5){ near=true; break; } } }
    if(!near&&s==='E'){ for(const c of customers){ if(Math.hypot(c.guy.g.position.x-gt.x,c.guy.g.position.z-gt.z)<4){ near=true; break; } } }
    gt.open+=((near?1:0)-gt.open)*Math.min(1,dt*7);
    const a=gt.open*1.5; gt.L.rotation.y=-a; gt.R.rotation.y=a; const fx=lerp(gt.L.rotation.x, down?1.45:0, Math.min(1,dt*5)); gt.L.rotation.x=gt.R.rotation.x=fx;
    const sh=gateShake>0?Math.sin(gateShake*60)*0.08:0; const d=SD[s]; gt.g.position.set(gt.x+d.t[0]*sh,0,gt.z+d.t[1]*sh); }
}

// ---------- Arayüz ----------
const coinsEl=$('coins'), logsEl=$('logs'), capEl=$('cap'), waveLbl=$('waveLbl'), waveTEl=$('waveT'), gateBar=$('gateBar'), gateLbl=$('gateLbl'), enemyEl=$('enemyCount');
let lastCoins=-1, shownCoins=S.coins;
function toast(msg,cls){ const t=$('toast'); t.textContent=msg; t.className='toast show '+(cls||''); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2400); }
const tutHold=()=>S.level===1&&S.wave===1&&!S.towers.some(t=>t.lvl>=1);
function renderHud(){ for(const L of quarryLabels) L.hide=!revealed('quarry');
  shownCoins=lerp(shownCoins,S.coins,0.25); if(Math.abs(shownCoins-S.coins)<0.6) shownCoins=S.coins; const c=Math.floor(shownCoins); if(lastCoins!==c){ coinsEl.textContent=c; lastCoins=c; }
  logsEl.textContent=S.logs; capEl.textContent='/'+D.cap(); $('woodStock').textContent=S.wood; $('stoneStock').textContent=S.stone+(S.stones?'+'+S.stones:''); $('stoneChip').style.display=revealed('quarry')?'flex':'none'; $('plankChip').style.display=revealed('river')?'flex':'none'; $('plankStock').textContent=S.planks||0; $('lootCount').textContent=S.loot;
  waveLbl.textContent=`${S.level}. Sefer · Gece ${S.wave}/${WAVES}`; waveTEl.textContent = waveActive? (S.wave===WAVES?'patron!':'saldırı!') : tutHold()? 'kule kur' : 'gündüz '+Math.ceil(Math.max(0,waveT))+' sn'; const nx=$('waveNext'); const nt=runOver?'':(waveActive?'Saldıran: ':'Bu gece: ')+planText(); if(nx.textContent!==nt) nx.textContent=nt;
  enemyEl.textContent=enemies.filter(e=>!e.dead).length+spawnQueue;
  const r=clamp(S.gateHp/D.gateMax(),0,1); gateBar.firstElementChild.style.width=(r*100)+'%'; gateBar.classList.toggle('danger',r<0.35); gateLbl.textContent=`Sur ${Math.ceil(Math.max(0,S.gateHp))}/${D.gateMax()}`;
  const nb=$('nightBtn'); const showNb=started&&!placing&&fishUI.style.display==='none'&&!waveActive&&!runOver&&!tutHold()&&!document.querySelector('.intro')&&waveT>3; nb.style.display=showNb?'flex':'none'; if(showNb){ const b=Math.round(waveT*(0.8+0.2*S.wave)); const t=`🌙 Geceyi başlat <span>+${b}</span>`; if(nb._t!==t){ nb._t=t; nb.innerHTML=t; } }
  const pc=$('perkChip'); const keys=Object.keys(S.cards||{}).filter(k=>S.cards[k]>0); pc.style.display=keys.length?'flex':'none'; if(keys.length){ const t=keys.map(k=>CARDS[k].i+(S.cards[k]>1?'×'+S.cards[k]:'')).join(' '); if(pc._t!==t){ pc._t=t; $('perkTxt').textContent=t; } }
}
$('placeCancel').addEventListener('click',e=>{ e.stopPropagation(); audio(); cancelPlacing(); });
addEventListener('keydown',e=>{ if(e.key==='Escape') cancelPlacing(); });
$('muteBtn').addEventListener('click',()=>{ audio(); S.muted=!S.muted; $('muteBtn').textContent=S.muted?'🔇':'🔊'; save(); });
$('muteBtn').textContent=S.muted?'🔇':'🔊';
$('kingBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); if(!waveActive&&!runOver) showMap(); else toast('Gece bitince bakabilirsin'); });
$('nightBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); if(waveActive||runOver) return; const b=Math.round(waveT*(0.8+0.2*S.wave)); if(b>0){ dropCoins(player.g.position.clone().setY(3),Math.min(16,b),b/Math.min(16,b),2,1.1); } waveT=0; startWave(); });
let started=false;
cgCall(k=>k.game.loadingStop());
function banner(title,sub,cls){ const old=$('banner'); if(old) old.remove(); const b=document.createElement('div'); b.id='banner'; b.className='banner '+(cls||''); b.innerHTML=`<b>${title}</b>${sub?`<small>${sub}</small>`:''}`; document.body.appendChild(b); setTimeout(()=>b.classList.add('out'),2100); setTimeout(()=>b.remove(),2700); }
function nightBanner(){ const sides=SIDES.filter(s=>plan&&plan.cnt[s]>0).map(s=>SIDE_TR[s]).join(' · '); if(S.wave===WAVES) banner('PATRON: '+bossName().toLocaleUpperCase('tr'),`${plan.total} düşman · ${sides}`,'boss'); else banner(`GECE ${S.wave}`,`${plan.total} düşman · ${sides}`,'night'); }
let lastSides=sidesActive();
function nightCleared(){ const n=S.wave; if(n>=WAVES){ levelWon(); return; }
  const bonus=12+6*n+4*S.level; const cnt=Math.min(24,bonus); dropCoins(player.g.position.clone().setY(3),cnt,bonus/cnt,3,1.3); celebrate(player.g.position.clone(),0.7);
  S.wave++; plan=null; planWave(); waveT=30; banner(`Gece ${n} atlatıldı!`,`+${bonus} altın · gün doğuyor`,'day');
  const ns=sidesActive(); if(ns>lastSides){ const s=SIDES[ns-1]; setTimeout(()=>toast(`${SIDE_TR[s]} kapısı açıldı — oraya da kule kur!`,'good'),2600); } lastSides=ns;
  save(); setTimeout(showCardPick,1500); }
// ---------- Gece arası güç kartı ----------
function showCardPick(){ if(runOver||$('cardPick')) return; if(!S.cardOffer){ const keys=Object.keys(CARDS).filter(k=>!(k==='trample'&&cc('trample'))&&!(k==='mend'&&cc('mend'))); const pick=[]; while(pick.length<3){ const k=keys[Math.floor(Math.random()*keys.length)]; if(!pick.includes(k)) pick.push(k); } S.cardOffer=pick; save(); }
  const goldAmt=40+25*S.wave+10*S.level;
  const card=document.createElement('div'); card.className='intro'; card.id='cardPick'; card.innerHTML=`<div class="card"><h1>Bir güç seç</h1><p>Bu bölüm boyunca geçerli. Aynısı tekrar gelirse üst üste eklenir.</p><div class="cards">${S.cardOffer.map((k,i)=>`<button data-k="${k}" style="animation-delay:${i*0.08}s"><i>${CARDS[k].i}</i><b>${CARDS[k].n}${cc(k)?` <em>×${cc(k)+1}</em>`:''}</b><small>${k==='gold'?`Hemen +${goldAmt} altın`:CARDS[k].d}</small></button>`).join('')}</div></div>`; document.body.appendChild(card); SFX.card();
  card.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ audio(); const k=b.dataset.k; S.cards[k]=(S.cards[k]||0)+1; S.cardOffer=null; card.remove(); SFX.build();
    if(k==='gold'){ const cnt=24; dropCoins(player.g.position.clone().setY(3.5),cnt,goldAmt/cnt,3,1.3); } if(k==='wall'){ S.gateHp=D.gateMax(); } if(k==='axe') rebuildOrbit();
    toast(CARDS[k].i+' '+CARDS[k].n,'good'); save(); })); }
// ---------- Bölüm sonu: kazanma ----------
function starsFor(minGate){ return minGate>=0.6?3:minGate>=0.25?2:1; }
function levelWon(){ runOver=true; const L=S.level; const st=starsFor(S.minGate); const prev=S.meta.stars[L]||0; const first=!prev; const gain=(first?3:0)+Math.max(0,st-prev)*2+1; S.meta.stars[L]=Math.max(prev,st); S.meta.unlocked=Math.max(S.meta.unlocked,L+1); S.book.boss[L]=bossName(); S.meta.crowns+=gain; S.meta.fails[L]=0; S.won=true; save();
  cgCall(k=>k.game.happytime()); SFX.win(); celebrate(player.g.position.clone(),1.4); setTimeout(()=>celebrate(new THREE.Vector3(0,0,0),1.2),350); confetti();
  setTimeout(()=>showWinCard(st,gain,first),1700); }
function showWinCard(st,gain,first){ const L=S.level; const last=L>=LEVELS; const card=document.createElement('div'); card.className='intro'; card.id='winCard';
  card.innerHTML=`<div class="card result"><div class="bigstars">${[1,2,3].map(i=>`<span class="st${i<=st?' on':''}" style="animation-delay:${0.25+i*0.35}s">★</span>`).join('')}</div><h1>${L}. sefer kazanıldı!</h1><p class="boss">${bossName()} yenildi</p><p>Surun en zor anında <b>%${Math.round(S.minGate*100)}</b> canı kaldı.${st<3?`<br>3 yıldız için sur %60'ın altına düşmemeli.`:'<br>Kusursuz savunma!'}</p><div class="crowns">👑 +${gain} taç${first?' · ilk zafer bonusu':''}</div>${nextRegText(L+1)}<button id="winNext">${L+1}. sefere başla →</button><button id="winMap" class="ghost">Krallık</button></div>`;
  document.body.appendChild(card); [1,2,3].forEach(i=>{ if(i<=st) setTimeout(()=>tone(660+i*220,990+i*220,0.18,'triangle',0.09),250+i*350); });
  $('winNext').addEventListener('click',()=>{ audio(); card.remove(); const go=()=>nextSefer(); cgAd('midgame',go,go); });
  $('winMap').addEventListener('click',()=>{ audio(); card.remove(); nextSefer(true); showMap(); }); }
function confetti(){ const box=document.createElement('div'); box.className='confetti'; const cols=['#ffd23f','#d9534f','#3d9a55','#3d63c9','#fff8e7','#f28c28']; for(let i=0;i<90;i++){ const d=document.createElement('i'); d.style.left=(Math.random()*100)+'%'; d.style.background=cols[i%cols.length]; d.style.animationDelay=(Math.random()*0.8)+'s'; d.style.animationDuration=(1.8+Math.random()*1.6)+'s'; d.style.transform=`rotate(${Math.random()*360}deg)`; box.appendChild(d); } document.body.appendChild(box); setTimeout(()=>box.remove(),4200); }
// ---------- Bölüm sonu: kaybetme ("az kalmıştı") ----------
function failTip(){ const cnt={N:0,E:0,S:0,W:0}; for(const e of enemies) if(!e.dead) cnt[e.side]++; const worst=SIDES.slice().sort((a,b)=>cnt[b]-cnt[a])[0]; const tw=S.towers.filter(t=>t.side===worst&&t.lvl>=1); const lv=tw.reduce((a,t)=>a+t.lvl,0);
  if(tw.length<2) return `${SIDE_TR[worst]} kapısında ${tw.length?'sadece 1':'hiç'} kule yoktu. Oraya kule kur.`; if(soldiers.length===0) return 'Asker al: düşmanın geldiği kapıya koşar.'; if(S.lv.wall<2) return 'Suru güçlendir: daha uzun dayanır.'; if(lv<6) return `${SIDE_TR[worst]} kulelerini yükselt.`; return 'Gündüzleri daha çok odun topla, her şeyi yükselt.'; }
function showFailCard(){ const L=S.level, n=S.wave; const left=failLeft; const tot=(plan&&plan.total)||1; const pct=Math.round(((n-1)+Math.max(0,Math.min(0.99,(tot-left)/tot)))/WAVES*100); const gain=Math.max(0,n-1);
  S.meta.fails[L]=(S.meta.fails[L]||0)+1; S.meta.crowns+=gain; S.failed=true; save();
  const canRevive=!!CG.sdk&&!S.revived; const card=document.createElement('div'); card.className='intro'; card.id='failCard';
  card.innerHTML=`<div class="card result fail"><h1>Sur yıkıldı!</h1><p class="boss">Kalen yerinde duruyor — sefer baştan başlayacak</p><p class="near">${left<=5?`Sadece <b>${left}</b> düşman kalmıştı!`:`Gece ${n}'de <b>${left}</b> düşman kalmıştı.`}</p><div class="prog"><i style="width:0%"></i><span>Bölümün %${pct}'i</span></div><p class="hint">💡 ${failTip()}</p>${gain?`<div class="crowns">👑 +${gain} taç kazandın</div>`:''}${canRevive?'<button id="revive" class="gold">📺 Reklam izle, sur onarılsın, devam et</button>':''}<button id="retry">Tekrar dene</button><button id="failMap" class="ghost">Krallık</button></div>`;
  document.body.appendChild(card); setTimeout(()=>{ const i=card.querySelector('.prog i'); if(i) i.style.width=pct+'%'; },80);
  $('retry').addEventListener('click',()=>{ audio(); card.remove(); const go=()=>restartSefer(); cgAd('midgame',go,go); });
  $('failMap').addEventListener('click',()=>{ audio(); card.remove(); restartSefer(true); showMap(); });
  if(canRevive) $('revive').addEventListener('click',()=>{ audio(); const b=$('revive'); b.disabled=true; b.textContent='Reklam yükleniyor…'; cgAd('rewarded',()=>{ card.remove(); revive(); },()=>{ b.textContent='Reklam yok, şimdilik olmadı'; }); }); }
function revive(){ S.revived=true; S.failed=false; S.meta.fails[S.level]=Math.max(0,(S.meta.fails[S.level]||1)-1); S.gateHp=D.gateMax()*0.6; S.minGate=Math.min(S.minGate,0.01); for(const e of enemies){ if(e.dead) continue; const [x,z]=sidePos(e.side,e.off*2,10+Math.random()*6); e.g.position.set(x,0,z); e.wp=ROADS[e.side].length; } runOver=false; celebrate(player.g.position.clone(),1); toast('Sur onarıldı, devam!','good'); save(); }
// ---------- Harita ve kalıcı güçlendirme ----------
const UPG={ gold:{n:'Hazine',d:'Her sefer başında +40 altın',i:'💰'}, wall:{n:'Taş Temel',d:'Sur canı +%10',i:'🧱'}, arrow:{n:'Usta Okçular',d:'Okçu hasarı +%8',i:'🏹'} }; const UPC=[3,5,8,12,18];
const dayKey=()=>{ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
function dailyGift(){ const k=dayKey(); if(S.meta.dailyDate===k) return 0; const y=new Date(); y.setDate(y.getDate()-1); const yk=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate(); S.meta.streak=(S.meta.dailyDate===yk)?(S.meta.streak||0)+1:1; S.meta.dailyDate=k; const g=1+Math.min(3,S.meta.streak); S.meta.crowns+=g; save(); return g; }
function showMap(){ if($('mapCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='mapCard'; document.body.appendChild(card); const gift=dailyGift();
  const render=()=>{ const m=S.meta; const regs=Object.keys(REG).map(k=>REG[k]); const nodes=[]; for(let L=1;L<=Math.max(10,S.level);L++){ const st=m.stars[L]||0; const done=L<S.level; const cur=L===S.level; const R=regs.find(r=>r.sefer===L); nodes.push(`<div class="sn${done?' done':''}${cur?' cur':''}"><b>${L}</b><span>${R?R.name:(L===1?'Orman Kapısı':'Sonsuz Kuşatma')}</span><small>${done?'★'.repeat(st)+'☆'.repeat(3-st):cur?'şu an':'🔒'}</small></div>`); }
    const fishN=Object.keys(S.book.fish).length;
    card.innerHTML=`<div class="card map"><div class="maphead"><h1>Krallık</h1><div class="crowns big">👑 ${m.crowns}</div></div>${gift?`<div class="gift">Günlük hediye: +${gift} taç · ${m.streak}. gün</div>`:''}<button id="cont">Devam et · ${S.level}. sefer, Gece ${S.wave}</button><div class="sefers">${nodes.join('')}</div><h2>Koleksiyon defteri</h2><div class="book">${FISH.map(f=>{ const n=S.book.fish[f.k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${f.c.toString(16).padStart(6,'0')}"></i><b>${n?f.n:'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div><div class="book" style="margin-top:6px">${HUNT.map(f=>{ const n=S.book.hunt[f.k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${f.c.toString(16).padStart(6,'0')};border-radius:40%"></i><b>${n?f.n:'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div><p class="sub">${fishN}/${FISH.length} balık · ${Object.keys(S.book.hunt).length}/${HUNT.length} av · ${Object.keys(S.book.boss).length} patron yenildi</p><h2>Kalıcı güçlendirme</h2><div class="ups">${Object.keys(UPG).map(k=>{ const lv=m.up[k]||0; const max=lv>=5; const cost=UPC[lv]; return `<div class="upr"><i>${UPG[k].i}</i><div><b>${UPG[k].n} <span>${lv}/5</span></b><small>${UPG[k].d}</small></div><button data-u="${k}" ${max||m.crowns<cost?'disabled':''}>${max?'Tam':'👑 '+cost}</button></div>`; }).join('')}</div><p class="sub">Taç: her seferi kazanınca, yıldız toplayınca ve kaybettiğinde atlattığın her gece için kazanılır.</p></div>`;
    card.querySelectorAll('.upr button').forEach(b=>b.addEventListener('click',()=>{ audio(); const k=b.dataset.u; const lv=S.meta.up[k]||0; const cost=UPC[lv]; if(lv>=5||S.meta.crowns<cost) return; S.meta.crowns-=cost; S.meta.up[k]=lv+1; SFX.fanfare(); save(); render(); }));
    $('cont').addEventListener('click',()=>{ audio(); card.remove(); if(pendingReveal){ const id=pendingReveal; pendingReveal=null; revealRegion(id,()=>startBanner()); } else startBanner(); }); };
  render(); }
function nextRegText(L){ const k=Object.keys(REG).find(k=>REG[k].sefer===L); return k?`<div class="nextreg">Açılacak bölge: <b>${REG[k].name}</b> · ${REG[k].job}</div>`:''; }
let pendingReveal=null;
function clearBattle(){ for(const e of enemies){ e.bar.remove(); scene.remove(e.g); } enemies.length=0; for(const pr of projectiles) scene.remove(pr.m); projectiles.length=0; for(const b of balls) scene.remove(b.m); balls.length=0; spawnQueue=0; waveActive=false; }
// Sefer bitti: kale yerinde, yeni bölge açılır, yeni sefer başlar
function nextSefer(silent){ clearBattle(); S.level++; S.coins+=40*mu('gold'); S.wave=1; S.cards={}; S.cardOffer=null; S.minGate=1; S.failed=false; S.won=false; S.revived=false; runOver=false; plan=null; planWave(); waveT=40; lastSides=sidesActive(); applyCaps(); S.gateHp=D.gateMax(); save();
  const rid=Object.keys(REG).find(k=>REG[k].sefer===S.level); if(rid&&!revealed(rid)){ if(silent){ pendingReveal=rid; } else revealRegion(rid,()=>startBanner()); } else if(!silent) startBanner(); }
// Kaybedildi: kale kalır; bu seferin geceleri baştan, elde tutulanların yarısı gider
function restartSefer(silent){ clearBattle(); S.wave=1; S.cards={}; S.cardOffer=null; S.minGate=1; S.failed=false; S.revived=false; runOver=false; S.loot=Math.floor(S.loot/2); S.fish=Math.floor((S.fish||0)/2); S.meat=Math.floor((S.meat||0)/2); S.stall=Math.floor(S.stall/2); setBack(player); plan=null; planWave(); waveT=30; lastSides=sidesActive(); S.gateHp=D.gateMax(); save(); if(!silent) startBanner(); }
function startBanner(){ banner(`${S.level}. Sefer`, S.wave>1?`Gece ${S.wave}/${WAVES}`:(S.level===1?'Ağaç kes, ilk kuleyi kur':`${WAVES} gece dayan · patron: ${bossName()}`),'day'); }
// ---------- Bölümü sıfırla (her bölüm yeni bir kaleyle başlar) ----------
function restoreNature(){ let a=false; trees.forEach((t,i)=>{ t.claimed=null; if(t.culled&&!nearBase(t.x,t.z,5.5)){ t.culled=false; t.gone=false; t.alive=true; t.falling=0; t.regrow=0; t.hp=D.treeHits(); writeTree(i); a=true; } }); if(a){ treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true; } rocks.forEach((r,i)=>{ r.claimed=null; if(r.culled&&!nearBase(r.x,r.z,5.5)){ r.culled=false; r.gone=false; r.alive=true; r.hp=3; r.regrow=0; writeRock(i); } }); rockMesh.instanceMatrix.needsUpdate=true; }
function resetRun(level){ const meta=S.meta, muted=S.muted;
  for(const e of enemies){ e.bar.remove(); scene.remove(e.g); } enemies.length=0; for(const pr of projectiles) scene.remove(pr.m); projectiles.length=0; for(const b of balls) scene.remove(b.m); balls.length=0; for(const f of fliers) scene.remove(f.m); fliers.length=0;
  coins.length=0; stackH.clear(); loot.length=0; for(const w of workers) scene.remove(w.guy.g); workers.length=0; for(const so of soldiers) scene.remove(so.guy.g); soldiers.length=0; for(const c of collectors) scene.remove(c.guy.g); collectors.length=0;
  for(const t of towers){ if(t) scene.remove(t.g); } towers.length=0; for(let i=pads.length-1;i>=0;i--){ const pd=pads[i]; if(pd.def.kind==='tower'&&pd.def.ti>8){ scene.remove(pd.g); delete padById[pd.def.id]; pads.splice(i,1); } } if(placing){ scene.remove(placing.ghost.g); placing=null; $('placeBar').style.display='none'; }
  for(const k of Object.keys(S)) delete S[k]; Object.assign(S,runState(level)); for(const f of fishers){ scene.remove(f.g.g); scene.remove(f.b); scene.remove(f.ln); } fishers.length=0; for(const h of hunters) scene.remove(h.guy.g); hunters.length=0; for(const c of carts) scene.remove(c.C.g); carts.length=0; for(const a of animals) scene.remove(a.m.g); animals.length=0; S.meta=meta; S.muted=muted; S.coins=20+25*mu('gold'); S.started=true;
  applyBase(); placeBuildings(); paintGround(); restoreNature(); cullTrees(); cullRocks(); cullDecor(); buildWalls(0); buildGates(0); placeGates(); placeTorches(); rebuildTowers(); layoutPads(); rebuildOrbit(); drawMiniBase();
  S.gateHp=D.gateMax(); setPile(0); setStonePile(0); stallPile.count=0; player.g.position.set(0,0,5.5); moveTarget=null; moveMark.visible=false; setBack(player); recenter();
  for(const pd of pads){ pd.last=''; pd.shown=0; pd.wasLocked=false; S.paid[pd.def.id]=0; }
  for(const id in REG) if(REG[id].sefer<=level) S.revealed[id]=true; waveActive=false; spawnQueue=0; runOver=false; plan=null; planWave(); waveT=S.level===1?30:25; buildNets(); buildTraps(); applyCaps(); syncClouds(); nightKills=0; lastSides=sidesActive(); introT=0; save(); }
function startPlay(){ if(started) return; const it=$('intro'); if(it) it.remove(); started=true; renderHud();
  if(!S.started){ resetRun(1); initRegions(); startBanner(); return; }
  initRegions(); if(S.failed) restartSefer(true); runOver=false; const off=offlineRun(S.lastSeen?(Date.now()-S.lastSeen)/1000:0); S.lastSeen=Date.now(); save(); showOffline(off); startBanner(); }
$('startBtn').addEventListener('click',()=>{ audio(); startPlay(); });
if(CG.sdk&&CG.env!=='disabled'){ setTimeout(startPlay,150); }
if(S.started){ $('startBtn').textContent='Devam et'; $('intro').querySelector('p').textContent=`Krallığın seni bekliyor: ${S.level}. sefer, Gece ${S.wave}.`; }

function cgAd(type,onDone,onFail){ if(!CG.sdk){ onFail&&onFail(); return; } if(type==='midgame'&&Date.now()-CG.lastMid<180000){ onFail&&onFail(); return; } let ended=false; const end=(ok)=>{ if(ended) return; ended=true; adMute=false; if(ok){ if(type==='midgame') CG.lastMid=Date.now(); onDone&&onDone(); } else onFail&&onFail(); }; try{ CG.sdk.ad.requestAd(type,{adStarted:()=>{ adMute=true; },adFinished:()=>end(true),adError:()=>end(false)}); setTimeout(()=>{ if(!ended&&!adMute) end(false); },4000); }catch(e){ end(false); } }
function questEvent(){}
addEventListener('pagehide',save); document.addEventListener('visibilitychange',()=>{ if(document.hidden) save(); });
// ---------- Kutlama efektleri: ışık sütunu, yer dalgası, parıltı, sarsıntı ----------
let camShake=0; const fx=[]; const pillarGeo=new THREE.CylinderGeometry(1,1,1,18,1,true); const shakeOff=new THREE.Vector3();
function celebrate(at,power){ power=power||1; camShake=Math.max(camShake,0.22+0.22*power);
  const pm=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}); const pil=new THREE.Mesh(pillarGeo,pm); pil.position.set(at.x,5,at.z); pil.scale.set(0.2,10,0.2); scene.add(pil);
  const rm=new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}); const ring=new THREE.Mesh(new THREE.RingGeometry(0.8,1.15,40),rm); ring.rotation.x=-Math.PI/2; ring.position.set(at.x,0.12,at.z); scene.add(ring);
  fx.push({pil,ring,t:0,power}); burst(at.clone().setY(1.2),Math.round(18+16*power),M.gold,1.5,1.7); burst(at.clone().setY(0.5),10,M.plank,1.1,1.3); if(power>=1) SFX.fanfare(); else SFX.build(); }
function updateFx(dt){ for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; const k=f.t/0.9; if(k>=1){ scene.remove(f.pil); scene.remove(f.ring); f.pil.material.dispose(); f.ring.material.dispose(); f.ring.geometry.dispose(); fx.splice(i,1); continue; } const w=0.2+1.3*f.power*Math.sin(Math.min(1,k*3)*Math.PI/2); f.pil.scale.set(w*(1-k*0.6),10+5*k,w*(1-k*0.6)); f.pil.material.opacity=0.75*(1-k); const r=1+8*f.power*(1-Math.pow(1-k,3)); f.ring.scale.set(r,r,1); f.ring.material.opacity=0.9*(1-k); } }
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
function tick(dt){ updateGateMarks(dt); updatePlayer(dt); updateTrees(dt); updateRocks(dt); updateWorkers(dt); updateSoldiers(dt); updateTowers(dt); updatePads(dt); updateEnemies(dt); updateProjectiles(dt); updateBalls(dt); updateGates(dt); updateFliers(dt); updateChips(dt); updateCoins(dt); updateLoot(dt); updateCustomers(dt); updateCollectors(dt); updateTraderNpc(dt); updateFx(dt); updateRegions(dt); }
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(0.05,(now-last)/1000); last=now;
  camera.position.sub(shakeOff); shakeOff.set(0,0,0);
  const playing=started&&!document.hidden&&!document.querySelector('.intro')&&!adMute; if(playing!==CG.playing){ CG.playing=playing; cgCall(k=>playing?k.game.gameplayStart():k.game.gameplayStop()); }
  if(playing){ tick(dt); updateFloats(dt); updateLabels(); updateBubble(); autoSaveT+=dt; if(autoSaveT>5){ autoSaveT=0; S.lastSeen=Date.now(); save(); } }
  const p=player.g.position;
  if(follow){ camPan.multiplyScalar(Math.pow(0.001,dt)); } camTarget.set(p.x+camPan.x,0,p.z+camPan.z);
  zoom=lerp(zoom,zoomTarget,1-Math.pow(0.002,dt)); camPos.copy(camTarget).addScaledVector(camOff,zoom); camera.position.lerp(camPos,1-Math.pow(0.0005,dt));
  camera.lookAt(camera.position.x-camOff.x*zoom,0,camera.position.z-camOff.z*zoom);
  if(camShake>0){ camShake=Math.max(0,camShake-dt); const k=camShake*camShake*2.4; shakeOff.set((Math.random()-0.5)*k,(Math.random()-0.5)*k,(Math.random()-0.5)*k); camera.position.add(shakeOff); }
  const nightT=waveActive?1:0; const nk=1-Math.pow(0.35,dt); night+=(nightT-night)*nk; applyNight(night); for(const t of torches) t.l.intensity=0.5+1.5*night; musicTick(night);
  if(wallPop<1&&wallGroup){ wallPop=Math.min(1,wallPop+dt*2.2); const k=1-Math.pow(1-wallPop,3); wallGroup.scale.set(1,0.05+0.95*k*(1+0.12*Math.sin(wallPop*Math.PI)),1); }
  sun.position.set(p.x+14,26,p.z+10); sun.target.position.set(p.x,0,p.z);
  renderHud(); miniT+=dt; if(miniT>0.12){ miniT=0; drawMini(); }
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.__dbg={bubblePadId:()=>bubblePad&&bubblePad.def.id+":"+(bubblePad.needLeave?"NL":"")+(playerMoving?"MV":""),carts,QCUT,MILL,RC,QC,animals,hunters,HHUT_FRONT,MC,nextSefer,restartSefer,revealRegion,offlineRun,showOffline,regionGuide,get pileFish(){ return S.rg.fishPile||0; },FS,fishers,DOCK_END,HUT_FRONT,fishPile,rebuildT:rebuildTowers,placeSpotRaw:(x,z)=>{ const r=placeSpot(x,z); return r.ok&&Math.hypot(r.x-x,r.z-z)<0.01; },cancelPlacing,rocksArr:()=>rocks,S,D,damageEnemy,killEnemy,player,trees,enemies,workers,soldiers,towers,pads,coins,loot,customers,plan:()=>plan,get waveActive(){return waveActive;},get waveT(){return waveT;},set waveT(v){waveT=v;},get runOver(){return runOver;},set runOver(v){runOver=v;},get placing(){return placing;},get moveTarget(){return moveTarget;},set moveTarget(v){moveTarget=v;},get guideTarget(){return guideTarget;},get zoom(){return zoom;},set zoom(v){zoom=v;},get zoomTarget(){return zoomTarget;},set zoomTarget(v){zoomTarget=v;},camera,camOff,camTarget,camPan,tick,startWave,resetRun,showMap,showCardPick,levelWon,gateBroken,placeSpot,placeGhostAt,confirmPlace,instantBuy,sidePos,setBack,setPile,setStonePile,dropCoins,addWorker,addSoldier,makeEnemy,expandBase,nightHp,nightCount,celebrate,STALL,DEPOT,get H(){return H;},startPlay};
}
