
// ---------- Oyuncu ----------
let blkP=null, blkT=0; let fullT=0, chopT=1, sellT=0, autoSaveT=0, atkCd=0, introT=0, playerMoving=false, movedOnce=false, stillT=0;
function fenceCollide(p){ wallCollide(p,0.7,s=>gates[s].open<0.55?0:2.3); }
function updatePlayer(dt){
  const inp=inputVec(); const sp=D.speed()*(pHitT>0?0.6:1); /* düşman oku değdi: kısa yavaşlama */
  const p=player.g.position; let mx=inp.x*inp.l, mz=inp.z*inp.l; let moving=inp.l>0.05;
  if(!moving&&moveTarget&&!placing){ const dr=Math.hypot(moveTarget[0]-p.x,moveTarget[1]-p.z); if(dr<0.35){ moveTarget=null; moveMark.visible=false; } else { const [gx,gz]=routeGoal(p,moveTarget[0],moveTarget[1]); const dx=gx-p.x, dz=gz-p.z, d=Math.hypot(dx,dz); if(d>0.05){ const k=Math.min(1,dr/1.2); mx=dx/d*k; mz=dz/d*k; moving=true; } } }
  if(placing) moving=false;
  /* duvara/binaya dayanıp ilerleyemeyen oyuncu "duruyor" sayılır: pad ödemesi yapılır, dokunarak yürüme hedefi bırakılır */
  if(moving&&blkP){ const md=Math.hypot(p.x-blkP[0],p.z-blkP[1]); if(md<sp*dt*0.15) blkT+=dt; else blkT=0; } else blkT=0; blkP=[p.x,p.z]; if(blkT>0.8&&moveTarget){ moveTarget=null; moveMark.visible=false; }
  playerMoving=moving&&blkT<=0.5; if(moving){ movedOnce=true; stillT=0; } else stillT+=dt;
  if(moving&&!follow&&(inp.l>0.05||moveTarget)) recenter();
  if(moving){ p.x+=mx*sp*dt; p.z+=mz*sp*dt; const ang=Math.atan2(mx,mz); let d=ang-player.g.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); player.g.rotation.y+=d*Math.min(1,dt*16); }
  if(moveMark.visible){ moveMark.scale.setScalar(lerp(moveMark.scale.x,1,Math.min(1,dt*6))); moveMark.rotation.z+=dt*2; }
  p.x=clamp(p.x,-WORLD+2,WORLD-2); p.z=clamp(p.z,-WORLD+2,WORLD-2);
  const before=[p.x,p.z]; fenceCollide(p); pushOutOfTrunks(p,1.1); pushOutOfCenter(p,1.9); pushOutOfTowers(p,1.6); regionCollide(p);
  if(moveTarget&&moving&&Math.hypot(p.x-before[0],p.z-before[1])>0.001){ moveStuck=(moveStuck||0)+dt; if(moveStuck>1.2){ moveStuck=0; moveTarget=null; moveMark.visible=false; } } else moveStuck=0;
  if(hasPerk('trample')&&moving){ trampleT-=dt; if(trampleT<=0){ trampleT=0.45; for(const o of enemies){ if(o.dead) continue; const dd=Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z); if(dd<1.9){ damageEnemy(o,D.swordDmg()*0.6); burst(o.g.position.clone().setY(0.6),4,M.ponyDark,0.6); } } } }
  playerRing.position.set(p.x,0.04,p.z);
  player.coinMesh.count=Math.min(16,Math.floor(S.coins/25)); updBackLbl();
  const canChop=S.logs<D.cap()&&!nearestEnemy(p,4); let chopping=false;
  if(canChop){ const near=[]; for(const t of trees){ if(!t.alive||t.falling>0||t.gone) continue; const d=Math.hypot(t.x-p.x,t.z-p.z); if(d<3.1) near.push(t); } if(near.length){ chopping=true; chopT+=dt*D.chopRate(); if(chopT>=1){ chopT=0; for(const t of near){ if(!t.alive) continue; hitTree(t,player,()=>{ if(S.logs<D.cap()){ S.logs++; setBack(player);} }); } } } }
  const capS=Math.floor(D.cap()/2); const canMine=revealed('quarry')&&S.stones<capS&&!nearestEnemy(p,4); let mining=false;
  if(canMine&&!chopping){ const near=[]; for(const r of rocks){ if(!r.alive||r.gone) continue; if(Math.hypot(r.x-p.x,r.z-p.z)<3.4) near.push(r); } if(near.length){ mining=true; chopT+=dt*D.chopRate()*0.8; if(chopT>=1){ chopT=0; for(const r of near){ if(!r.alive) continue; hitRock(r,player,()=>{ if(S.stones<capS){ S.stones++; setBack(player);} }); } } } }
  if(!chopping&&!mining) chopT=Math.min(1,chopT+dt*2);
  fullT-=dt; if(fullT<=0){ const fullL=S.logs>=D.cap()&&nearestTree(p,3.6), fullS=S.stones>=capS&&nearestRock(p,4); if(fullL||fullS){ fullT=2.5; floatText(p,T('DOLU','MAX'),'red'); } }
  const nearRock=canMine?nearestRock(p,4.8):null;
  const nearTree=nearestTree(p,4.5)||nearRock; orbit.spin+=dt*(nearTree?(22+2*S.lv.axe):5); orbit.g.rotation.y=orbit.spin; orbit.on=lerp(orbit.on,nearTree&&canChop?1:0,Math.min(1,dt*6)); orbit.g.scale.setScalar(Math.max(0.001,orbit.on*orbit.n)); orbit.g.position.set(p.x,1.0,p.z); orbit.g.visible=orbit.on>0.02;
  animGuy(player,dt,moving,0.85+inp.l*0.3);
  if(S.logs>0&&p.distanceTo(DEPOT)<3.6){ sellT-=dt; if(sellT<=0){ sellT=0.05; S.logs--; setBack(player); storeLog(p); } }
  else if(S.stones>0&&p.distanceTo(DEPOT)<3.6){ sellT-=dt; if(sellT<=0){ sellT=0.06; S.stones--; setBack(player); storeStone(p); } }
  if(sellGain>0){ floatText(p,'','',{key:'pgold',v:sellGain,follow:player.g,fmt:v=>'+'+Math.round(v)}); sellGain=0; } /* FX4: toplanan altın oyuncunun üstünde tek, büyüyen bir sayı (eskiden sellGain hiç beslenmiyordu) */
  if(S.loot>0&&p.distanceTo(STALL_FRONT)<2.6){ sellT-=dt; if(sellT<=0){ sellT=0.06; S.loot--; S.stall++; /* FX1: hemen sayılır */ setBack(player); fly(p.clone().setY(1.6),stallDrop(),null,false,5); } }
  atkCd-=dt; const e=nearestEnemy(p,D.swordRange());
  if(e&&atkCd<=0){ atkCd=0.45; player.swing=0.3; SFX.slash(); const ang=Math.atan2(e.g.position.x-p.x,e.g.position.z-p.z); player.g.rotation.y=ang; slash.position.set(p.x,1.4,p.z); slash.rotation.z=-ang+Math.PI/2; slashT=0.22; for(const o of enemies){ if(o.dead) continue; const dx=o.g.position.x-p.x, dz=o.g.position.z-p.z; const d=Math.hypot(dx,dz); if(d<D.swordRange()+0.4&&(dx*Math.sin(ang)+dz*Math.cos(ang))/d>0.1) damageEnemy(o,D.swordDmg(),'sword'); } }
  if(slashT>0){ slashT-=dt; slash.material.opacity=slashT/0.22*0.8; slash.scale.setScalar(1+(0.22-slashT)*1.5); } else slash.material.opacity=0;
  let target=null, text='', rgd=null, buyText=0, rest=0, priSc=-99;
  let cheapest=null, cbest=1e9, woodNeed=null, wbest=1e9, stoneNeed=null, sbest=1e9; for(const pd of pads){ if(!padVisible(pd)||pd.needLeave||guideSkip(pd)) continue; if(padAvail(pd)){ if(padCost(pd)<cbest){ cbest=padCost(pd); cheapest=pd; } } else if(padRes(pd)==='wood'&&padCost(pd)<wbest){ wbest=padCost(pd); woodNeed=pd; } else if(padRes(pd)==='stone'&&padCost(pd)<sbest){ sbest=padCost(pd); stoneNeed=pd; } }
  // Öneri sırası: saldırılan kapının kuleleri > yeni topçu > sur > asker > oduncu > diğerleri (düşük seviye öne)
  const nr=newRegion(); let goldGap=1e9, newGold=false; for(const pd of pads){ if(!padVisible(pd)||padRes(pd)!=='gold'||padAvail(pd)) continue; goldGap=Math.min(goldGap,padCost(pd)-(S.paid[pd.def.id]||0)-S.coins); if(nr&&pd.def.grp===nr&&padLevel(pd.def)===0) newGold=true; }
  const woodWant=!!woodNeed||(rg('mill')>0&&S.wood<400)||S.wood+S.logs<40, ga=gateAttack();
  const dUrg=defUrg(); { let pri=null; for(const pd of pads){ if(!padVisible(pd)||!padAvail(pd)||pd.needLeave||guideSkip(pd)) continue; if(waveActive&&!nearBase(pd.g.position.x,pd.g.position.z,3)) continue; /* gece surların dışındaki pede yollama */ const k=pd.def.kind; const l=padLevel(pd.def); let sc;
      if(k==='tower'){ const tw=S.towers[pd.def.ti]; const heat=tw.side==='C'?3:((plan&&plan.cnt[tw.side])||0); if(tw.side!=='C'&&SIDES.indexOf(tw.side)>=sidesActive()) continue; sc=10+Math.min(12,heat)*0.6-l*2.2; }
      else if(k==='newTower') sc=9-l*3; else if(k==='wall') sc=8.5-l*2; else if(k==='soldier') sc=7-l*2; else if(k==='worker') sc=7.5-l*2.5; else if(k==='expand') sc=6-l*2; else sc=4-l;
      if(BN.has(pd.def.id)) sc=Math.max(sc,6.5); /* F4: darboğaz, ekonomi yükseltmelerinin önünde (savunmanın arkasında) */
      if(dUrg){ if(isDefPad(pd)) sc=Math.max(sc,7.2+1.4*dUrg+2.5*(1-l/Math.max(1,pd.def.max))+(k==='tower'?Math.min(12,(S.towers[pd.def.ti].side==='C'?3:((plan&&plan.cnt[S.towers[pd.def.ti].side])||0)))*0.12:k==='wall'?0.6:0)); else if(pd.def.id!=='tribute') sc=Math.min(sc,6.2); } /* F9b: gece yaklaşınca (günün son %40'ı) ve patron gününde savunma ekonomiden önce */
      if(nr&&pd.def.grp===nr&&l===0) sc=Math.max(sc,(S.wave<=1?13:9.6)-0.1*(pd.def.ord||0)); // yeni bölgenin işçi/alet pedleri alınabilir olunca öne
      if(k==='up'&&pd.def.key==='qcart'&&l>0&&(S.rg.cutOut||0)<cutCap()*0.4) continue; /* taş kesici arabayı doldurmuyorsa araba geliştirmesi boşa */
      sc-=0.025*Math.hypot(pd.g.position.x-p.x,pd.g.position.z-p.z); /* F6: benzer değerde yakın ped öne: uzak iki ped arasında gidip gelmesin */ if(!pri||sc>pri.sc) pri={pd,sc}; } if(pri){ cheapest=pri.pd; priSc=pri.sc; } else if(waveActive) cheapest=null; /* F8: gece surların dışındaki ucuz ped kalmasın */ }
  if(placing){ target=null; }
  else if(gateDownT>0){ target=null; }
  else if(celebT>0&&coins.length>0){ let best=null,bd=1e9; for(const c of coins){ if(c.fly) continue; const d=Math.hypot(c.x-p.x,c.z-p.z); if(d<bd){bd=d;best=c;} } if(best){ target=new THREE.Vector3(best.x,0,best.z); text=T('Altınları topla','Collect gold'); } }
  else if((rgd=kingWardT())){ target=new THREE.Vector3(rgd.x,0,rgd.z); text=KW_TXT(); rgd=null; } /* F9b: Kara Kral'ın kalkanını kılıçla kır */
  else if(ga){ const [x,z]=sidePos(ga,0,2.2); target=new THREE.Vector3(x,0,z); text=T(`${SIDE_TR[ga]} kapısını koru`,`Defend the ${SIDE_TR[ga]} Gate`); }
  else if(enemies.some(o=>!o.dead&&nearBase(o.g.position.x,o.g.position.z,16))){ let o=null,od=1e9; for(const e of enemies){ if(e.dead||!nearBase(e.g.position.x,e.g.position.z,16)) continue; const d=Math.hypot(e.g.position.x-p.x,e.g.position.z-p.z); if(d<od){ od=d; o=e; } } /* F8: yalnız surlara yakın düşman; yollarda uzağa kovalatmaz */ if(o){ target=new THREE.Vector3(o.g.position.x,0,o.g.position.z); text=T('Düşmanı durdur','Stop the enemy'); } }
  else if((rgd=regionGuide('intro'))){ target=rgd.t; text=rgd.text; }
  else if((rgd=chestGuide(p,priSc))){ target=rgd.t; text=rgd.text; } /* F8: sahile vuran sandık */
  else if(cheapest){ buyText=1; } /* alınabilir anlamlı bir geliştirme, altın yığınından/ganimetten önce gelir (yeni bölge pedi dahil) */
  else if(waveActive&&(rgd=busyGate())){ const [x,z]=sidePos(rgd,0,2.2); target=new THREE.Vector3(x,0,z); text=T(`${SIDE_TR[rgd]} kapısını koru`,`Defend the ${SIDE_TR[rgd]} Gate`); }
  else if(loot.length>0&&loot.some(l=>!l.fly&&!l.auto&&!l.taken&&(!waveActive||nearBase(l.x,l.z,10)))&&S.loot<D.cap()){ let best=null,bd=1e9; for(const l of loot){ if(l.fly||l.auto||l.taken||(waveActive&&!nearBase(l.x,l.z,10))) continue; const d=Math.hypot(l.x-p.x,l.z-p.z); if(d<bd){bd=d;best=l;} } target=new THREE.Vector3(best.x,0,best.z); text=T('Ganimeti topla','Collect loot'); }
  else if(S.loot>0){ target=STALL_FRONT; text=T('Tezgâha götür','Take to Stall'); }
  else if((rgd=regionGuide('carry'))){ target=rgd.t; text=rgd.text; }
  else if((rgd=regionGuide('pile',-1))){ target=rgd.t; text=rgd.text; }
  else if(S.bank>=15&&!cheapest){ target=TREASURY; text=T('Hazineden altın al','Get Treasury gold'); }
  else if(cheapest){ buyText=1; }
  else rest=1;
  if(buyText){ target=cheapest.g.position; const k=cheapest.def.kind, nm=cheapest.def.name; text=((k==='tower'&&padLevel(cheapest.def)===0)||k==='newTower')?T(`${nm} kur`,`Build ${nm}`):k==='wall'?T(`Geliştir: ${nm}`,`Upgrade ${nm}`):(k==='soldier'||k==='worker'||k==='stoneWorker'||k==='collector')?T(`${nm} al`,`Hire ${nm}`):k==='expand'?T('Suru genişlet','Expand the Walls'):cheapest.def.id==='tribute'?T(`Öde: ${nm} 👑`,`Pay ${nm} 👑`):cheapest.block?blockShort(cheapest):padLevel(cheapest.def)===0?T(`${nm} al`,`Get ${nm}`):T(`Geliştir: ${nm}`,`Upgrade ${nm}`); }
  else if(!rest){ }
  else if(goldGap<1e9&&(rgd=regionGuide('pile',goldGap))){ target=rgd.t; text=rgd.text; }
  else if(S.stones>=capS&&stoneNeed){ target=stoneNeed.g.position; text=T('Taşı kullan: '+stoneNeed.def.name,'Use stone for '+stoneNeed.def.name); }
  else if(S.stones>=capS){ target=DEPOT_FRONT; text=T('Taşı depola','Store stone'); }
  else if(stoneNeed&&!woodNeed&&S.logs<D.cap()){ const r=nearestRock(p,300); if(r){ target=rockSpot(r,p); text=T(stoneNeed.def.name+' için taş çıkar','Mine stone for '+stoneNeed.def.name); } }
  else if(S.logs>=D.cap()&&woodNeed){ target=woodNeed.g.position; text=T('Odunu kullan: '+woodNeed.def.name,'Use wood for '+woodNeed.def.name); }
  else if(S.logs>=D.cap()&&woodWant){ target=DEPOT_FRONT; text=T('Odunu depola','Store wood'); }
  else if(S.stall>0&&customers.length===0){ target=STALL_FRONT; text=T('Müşteri bekle','Wait for buyers'); }
  else if((!woodNeed||newGold)&&(rgd=regionGuide('idle'))){ target=rgd.t; text=rgd.text; }
  else if(!woodWant&&S.wood+S.logs>=150){ rgd=regionGuide('pile',1); if(rgd){ target=rgd.t; text=rgd.text; } } // odun bol ve harcanacak yer yok: odun önerme
  else { const t=nearestTree(p,160); if(t){ target=new THREE.Vector3(t.x,0,t.z); text= woodNeed? T(woodNeed.def.name+' için odun kes','Chop wood for '+woodNeed.def.name) : (S.logs>0?T('Odun topla','Gather wood'):T('Ağaç kes','Chop trees')); } }
  // titremesin: yeni öneri en az 1.5 sn eskisinin yerine geçmez (kapı savunması ve hedefsizlik hariç)
  // F6 bağlılık: seçilen hedef bitene/geçersizleşene dek kalır; en az 6 sn (ve yenisi 1.5 sn üst üste gelmeden) değişmez. Acil (kapı, düşman, yerleştirme), gece/gündüz geçişi, hedefe varınca ya da çok daha yakın bir iş çıkınca hemen değişir
  { const C=gHold, urg=!!(placing||gateDownT>0||(celebT>0&&coins.length>0)||ga||text===T('Düşmanı durdur','Stop the enemy')||text===KW_TXT()); let gv=null; if(buyText){ const pd=cheapest; gv=()=>padVisible(pd)&&padAvail(pd)&&!pd.needLeave; } else if(rgd&&rgd.v&&rgd.text===text) gv=rgd.v;
    if(text===C.text){ C.tg=target; C.v=gv; C.miss=0; } else { C.miss=(C.miss||0)+dt; const dC=C.tg?Math.hypot(C.tg.x-p.x,C.tg.z-p.z):0, dN=target?Math.hypot(target.x-p.x,target.z-p.z):0;
      const keep=text&&C.text&&C.tg&&!urg&&!C.urg&&C.night===waveActive&&!(C.v&&!C.v())&&!(dC<4&&C.miss>1)&&!(C.t>=6&&C.miss>=1.5)&&!(C.t>=3&&C.miss>=1&&dC>25&&dN<dC*0.25);
      if(keep){ target=C.tg; text=C.text; } else { C.text=text; C.t=0; C.tg=target; C.v=gv; C.miss=0; C.urg=urg; C.night=waveActive; } }
    C.t+=dt; }
  guideTarget=target; updateGuide(target,text,dt);
  const tipEl=$('tip'); let tip='';
  if(placing) tip='';
  else if(S.level===1&&S.wave===1&&!waveActive&&introT>0.8&&(!movedOnce||(tutHold()&&stillT>12))) tip = isTouch? T('👆 Sürükle, yürü','👆 Drag to walk') : T('⌨️ WASD ile yürü','⌨️ WASD to walk');
  if(tip&&tipEl.textContent!==tip) tipEl.textContent=tip; tipEl.classList.toggle('hide',!tip);
  introT+=dt;
}
// sırt yığını kısaltıldıysa gerçek sayılar yığının üstünde rozet olarak görünür
const backLbl=addLabel(new THREE.Vector3(),'',6); backLbl.pos=player.g.position; backLbl.near=-1; backLbl.hide=true; backLbl.el.classList.add('backLbl');
function updBackLbl(){ const bv=backVis(); backLbl.hide=bv.k>=1||!!placing; if(backLbl.hide) return; const rows=Math.ceil(bv.v(S.logs)/2)+Math.ceil(bv.v(S.stones||0)/2)+Math.ceil(bv.v(S.loot)/2)+Math.ceil(bv.v(S.fish||0)/2)+Math.ceil(bv.v(S.meat||0)/2)+Math.ceil(bv.v(backExtraTotal())/2); backLbl.h=1.7+rows*0.3;
  const it=[[S.logs,'<span class="log-dot"></span>'],[S.stones||0,'<span class="stone-dot"></span>'],[S.loot,'<span class="helm"></span>'],[S.fish||0,'🐟'],[S.meat||0,'🍖'],[S.herb||0,'🍄'],[S.ore||0,'⛏️'],[S.crystal||0,'💎']].filter(x=>x[0]>0); const h='<span class="ics">'+it.map(x=>x[1]+x[0]).join(' ')+'</span>'; if(backLbl._h!==h){ backLbl._h=h; backLbl.el.innerHTML=h; } }
let moveStuck=0, trampleT=0, guideTarget=null; const gHold={text:'',t:0,tg:null,v:null,miss:0,urg:false,night:false}; let gAtk=null, gAtkT=0;
// gece saldırılan kapı: kapıya 16 birimden yakın düşman sayısı; seçilen kapı, başka kapı açıkça (3+) daha kalabalık olmadıkça değişmez
// gece, kapılarda henüz düşman yokken: en kalabalık (canlı + gelecek) kapıya yollar; ekonomi işlerine değil
// F9b: savunma pedleri (kuleler, sur, asker, kapı eşyaları, kale balistası); aciliyet: 0 gündüz, 1 günün son %40'ı, 2 patron günü
const DEF_IDS={ironArrow:1,ironWall:1,lamp:1,ballista:1};
const KW_TXT=()=>T('⚔️ Kara Kral\'a vur: kalkanını kır!','⚔️ Strike the Black King: break his ward!');
function isDefPad(pd){ const k=pd.def.kind; return k==='tower'||k==='newTower'||k==='wall'||k==='soldier'||!!DEF_IDS[pd.def.id]; }
function defUrg(){ if(waveActive||runOver) return 0; if(S.wave>=WAVES) return 2; return waveT<dayLen()*0.4?1:0; }
function busyGate(){ const c={}; for(const e of enemies) if(!e.dead) c[e.side]=(c[e.side]||0)+(e.boss?5:e.kind==='ram'?3:1); if(spawnQueue>0&&plan){ const k=sidesActive(); for(let i=0;i<plan.total;i++){ if(plan.done?plan.done[i]:i<spawnIdx) continue; const sd=SIDES[(Math.floor(i/4)+plan.seed)%k]; c[sd]=(c[sd]||0)+0.5; } } let b=null; for(const k in c) if(!b||c[k]>c[b]) b=k; return b; }
function gateAttack(){ if(!waveActive||runOver){ gAtk=null; return null; } const cnt={}; for(const e of enemies){ if(e.dead) continue; const g=gates[e.side]; if(g&&Math.hypot(e.g.position.x-g.x,e.g.position.z-g.z)<(e.side===gAtk?22:16)) cnt[e.side]=(cnt[e.side]||0)+(e.boss?5:e.kind==='ram'?3:1); } /* patron ve koçbaşı kapısı öncelikli */
  let best=null; for(const k in cnt) if(!best||cnt[k]>cnt[best]) best=k; if(gAtk&&cnt[gAtk]>0&&!(best&&cnt[best]>=cnt[gAtk]+3)) best=gAtk;
  if(best) gAtkT=gameT; else if(gAtk&&gameT-gAtkT<2.5&&enemies.some(e=>!e.dead)) best=gAtk; gAtk=best; return gAtk; } // kapı 2.5 sn daha tutulur: ganimet/kapı arasında gidip gelmesin
function updateGuide(target,text,dt){
  const p=player.g.position;
  if(!target||Object.keys(regionFx).some(k=>regionFx[k].rev)){ guide.arrow.visible=guide.ring.visible=guide.pin.visible=false; /* F9b: bölge açılış gösterisinde rehber gizli */ guide.el.style.display='none'; guide.lastText=''; return; }
  const dx=target.x-p.x, dz=target.z-p.z, dist=Math.hypot(dx,dz), ang=Math.atan2(dx,dz);
  const near=dist<3.2;
  guide.arrow.visible=!near; guide.arrow.rotation.z=ang+Math.PI; guide.arrow.position.set(p.x+Math.sin(ang)*2.1,0.07,p.z+Math.cos(ang)*2.1);
  const pulse=1+Math.sin(performance.now()/160)*0.08; guide.arrow.scale.set(pulse,pulse,1);
  guide.ring.visible=true; guide.ring.position.set(target.x,0.05,target.z); guide.ring.rotation.z+=dt*1.5; const rs=1+Math.sin(performance.now()/220)*0.1; guide.ring.scale.set(rs,rs,1);
  guide.pin.visible=true; guide.pin.position.set(target.x,4.2+Math.sin(performance.now()/200)*0.25,target.z);
  // yazı: ilk gecede hep açık; sonra yalnız hedef değişince birkaç saniye ya da oyuncu bir süre durup kalırsa. Ok, halka ve işaret hep yerinde
  if(text!==guide.lastText){ guide.lastText=text; guide.showT=4.5; } guide.showT=(guide.showT||0)-dt; guide.idleT=playerMoving?0:(guide.idleT||0)+dt;
  const txtOn=!bubblePad&&((S.level===1&&S.wave===1)||guide.showT>0||guide.idleT>6);
  guide.el.style.display='block'; guide.el.classList.toggle('off',!txtOn); if(guide.el.textContent!==text) guide.el.textContent=text;
  v3.set(target.x,5.1,target.z).project(camera); const gw2=guide.el.offsetWidth/2+8, gh=guide.el.offsetHeight+8;
  const gx=clamp((v3.x+1)/2*innerWidth,gw2,innerWidth-gw2); let gy=clamp((1-v3.y)/2*innerHeight,50,innerHeight-40);
  // yazı ekranın kenarına yapışınca üstteki sayaçların / alttaki düğmelerin altında kalmasın: engelin dışına kaydır
  const obs=hudObstacles(); for(let pass=0;pass<2;pass++) for(const r of obs){ if(gx+gw2-8<r.left-4||gx-gw2+8>r.right+4||gy<r.top-4||gy-gh>r.bottom+4) continue; gy= (r.top+r.bottom<innerHeight)? r.bottom+gh+4 : r.top-6; }
  guide.el.style.left=gx+'px'; guide.el.style.top=clamp(gy,gh,innerHeight-4)+'px';
}
let hudRects=[], hudRectT=-1;
function hudObstacles(){ const now=performance.now(); if(now-hudRectT<250) return hudRects; hudRectT=now; hudRects=[];
  for(const el of document.querySelectorAll('.hud .chip,.hud .wv,#bossBar,#toast.show,#mini,#muteBtn,#kingBtn,#nightBtn,#placeBar,#recenter,.fishUI')){ const r=el.getBoundingClientRect(); if(r.width>1&&r.height>1) hudRects.push(r); }
  return hudRects; }

// ---------- Kapılar ----------
function updateGates(dt){
  if(runOver){ }
  else if(!waveActive&&!noRegen&&S.gateHp<D.gateMax()) S.gateHp=Math.min(D.gateMax(),S.gateHp+D.gateMax()*0.05*dt);
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
const coinsEl=$('coins'), waveTEl=$('waveT'), gateBar=$('gateBar'), enemyEl=$('enemyCount'), nightsEl=$('nights'), waveBoxEl=$('waveBox');
const setTxt=(el,t)=>{ t=String(t); if(el.textContent!==t) el.textContent=t; }, setShow=(el,on)=>{ const d=on?'flex':'none'; if(el.style.display!==d){ el.style.display=d; hudRectT=-1e9; if($('toast').classList.contains('show')) toastPlace(); } }; /* FX3: HUD değişince bildirim yeniden yerleşir */ /* görünürlük değişince HUD engelleri hemen yeniden ölçülür */
let lastCoins=-1, shownCoins=S.coins;
// açık bir pencere (kart, çark, uzaktayken…) varken gelen bildirimler kaybolmaz: sıraya girer, pencere kapanınca (ve bekleyen güç kartı seçilince) sırayla gösterilir
const toastQ=[]; function toastBlocked(){ return !!document.querySelector('.intro')||(S.cardPending&&!waveActive&&!runOver); }
/* FX3: bildirim, büyük başlık ekrandayken ya da önceki bildirim 1,5 sn'den kısa süredir görünürken sıraya girer; süre metnin uzunluğuna göre (2,4–6,5 sn) */
function toast(msg,cls,queue){ const t=$('toast'), bn=$('banner'); if(queue||document.querySelector('.intro')||(bn&&!bn.classList.contains('out'))||(t.classList.contains('show')&&t._msg!==msg&&performance.now()-(t._at||0)<1500)){ if(toastQ.length<4&&!toastQ.some(q=>q[0]===msg)) toastQ.push([msg,cls]); return; } showToast(msg,cls); }
const TOAST_IC={wood:'<span class="log-dot"></span>',stone:'<span class="stone-dot"></span>',plank:'<span class="plank-dot"></span>',iron:'<span class="iron-dot"></span>',coin:'<span class="coin-dot"></span>'};
function toastHtml(msg){ return String(msg).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\{(wood|stone|plank|iron|coin)\}/g,(m,k)=>TOAST_IC[k]); }
function showToast(msg,cls){ const t=$('toast'); if(/\{(wood|stone|plank|iron|coin)\}/.test(msg)) t.innerHTML=toastHtml(msg); else t.textContent=msg; t._msg=msg; t._at=performance.now(); t.className='toast show '+(cls||''); clearTimeout(t._h); const dur=Math.max(2400,Math.min(6500,1600+55*String(msg).length)); t._h=setTimeout(()=>t.classList.remove('show'),dur); toastPlace(); hudRectT=-1e9; }
/* F6: uyarı patron can çubuğunun üstüne düşerse çubuğun altına iner (her görünümde) */
/* FX3: HUD sütunları (altın/görev çipi, kaynak çipleri) ile de çakışırsa onların altına iner */
function toastPlace(){ const t=$('toast'); if(t.style.top) t.style.top=''; const obs=[$('bossBar'),document.querySelector('.hud .left'),document.querySelector('.hud .right')]; for(let pass=0;pass<2;pass++){ for(const el of obs){ if(!el||el.style.display==='none') continue; const a=t.getBoundingClientRect(), b=el.getBoundingClientRect(); if(!b.height||a.right<b.left-4||a.left>b.right+4||a.bottom<b.top-4||a.top>b.bottom+4) continue; t.style.top=Math.round(b.bottom+8)+'px'; t.style.bottom='auto'; } } if(!t.style.top) t.style.bottom=''; }
function flushToasts(){ { const t=$('toast'), nw=performance.now(); if(t.classList.contains('show')&&nw-(t._pl||0)>300){ t._pl=nw; toastPlace(); } } if(!toastQ.length||toastBlocked()||$('toast').classList.contains('show')||$('banner')) return; const [m,c]=toastQ.shift(); showToast(m,c); }
// ilk gece ilk kule kurulana dek başlamaz (süre sınırı yok; kayıp sonrası da geçerli)
function tutHold(){ return S.level===1&&S.wave===1&&!S.towers.some(t=>t.lvl>=1); }
function renderHud(){ for(const L of quarryLabels) L.hide=!revealed('quarry'); const dq=revealed('quarry'); if(depotLbl._k!==dq){ depotLbl._k=dq; depotLbl.el.innerHTML='<span class="ics">⬇ <span class="log-dot"></span>'+(dq?'<span class="stone-dot"></span>':'')+'</span>'; }
  shownCoins=lerp(shownCoins,S.coins,0.25); if(Math.abs(shownCoins-S.coins)<0.6) shownCoins=S.coins; const c=Math.floor(shownCoins+0.01); if(lastCoins!==c){ coinsEl.textContent=fmtC(c); lastCoins=c; }
  // sayaçlar: yalnız simge + sayı; sırttaki yük de kullanılabilir stoka dahil
  setTxt($('woodStock'),fmtC(S.wood+S.logs)); setShow($('stoneChip'),revealed('quarry')||S.stone+(S.stones||0)>0); setTxt($('stoneStock'),fmtC(S.stone+(S.stones||0))); setShow($('plankChip'),revealed('river')); setTxt($('plankStock'),fmtC(S.planks||0)); setShow($('ironChip'),revealed('iron')); setTxt($('ironStock'),fmtC(S.iron||0)); setShow($('potionChip'),revealed('swamp')&&(rg('cauldron')>0||((S.rg&&S.rg.potions)||0)>0)); $('potionChip').classList.toggle('pready',((S.rg&&S.rg.potions)||0)>=1&&S.gateHp<D.gateMax()*0.9); /* F4: iksir düğmesi: sur eksikken parlar, dokununca içilir */ setTxt($('potionStock'),(S.rg&&S.rg.potions)||0);
  setShow($('lootChip'),S.loot>0); setTxt($('lootCount'),S.loot);
  const en=enemies.filter(e=>!e.dead).length+spawnQueue; setTxt(enemyEl,en); setShow($('enemyChip'),waveActive||en>0);
  // gece noktaları: bitenler yeşil, bu gece parlak, 5. gece patron
  { const el=$('endl'), on=endless(); const t=on?`♾ ${T('Gece','Night')} ${eNight(S.level,S.wave)}${S.meta.best?` · 🏆 ${S.meta.best}`:''}`:''; if(el&&el._t!==t){ el._t=t; el.textContent=t; el.style.display=on?'block':'none'; } } /* F9a: sonsuz kuşatma gecesi + rekor */
  const nk=S.wave+'|'+WAVES; if(nightsEl._k!==nk){ nightsEl._k=nk; let h=''; for(let i=1;i<=WAVES;i++){ const boss=i===WAVES; h+=`<i class="${i<S.wave?'done':i===S.wave?'now':''}${boss?' boss':''}">${boss?'💀':''}</i>`; } nightsEl.innerHTML=h; }
  waveBoxEl.classList.toggle('night',waveActive&&!runOver);
  setTxt(waveTEl, waveActive? (shieldT>0?'🛡️ '+Math.ceil(shieldT):S.wave===WAVES?'⚔️':'🌙') : tutHold()? '☀️' : (S.wave===WAVES?'💀 ':'☀️ ')+Math.ceil(Math.max(0,waveT)));
  const r=clamp(S.gateHp/D.gateMax(),0,1); gateBar.firstElementChild.style.width=(r*100)+'%'; gateBar.classList.toggle('danger',r<0.35); waveBoxEl.classList.toggle('danger',waveActive&&r<0.35);
  const nb=$('nightBtn'); const showNb=started&&!placing&&!S.cardPending&&!S.pendingReveal&&fishUI.style.display==='none'&&!waveActive&&!runOver&&!tutHold()&&!document.querySelector('.intro')&&waveT>3&&(S.wave!==WAVES||bossReady()); nb.style.display=showNb?'flex':'none'; if(showNb){ const b=nightBonus(); const t=S.wave===WAVES?T(`💀 Patron gecesi ${b>0?`<span>+${b}</span>`:''}`,`💀 Boss Night ${b>0?`<span>+${b}</span>`:''}`):T(`🌙 Geceyi başlat ${b>0?`<span>+${b}</span>`:''}`,`🌙 Start Night ${b>0?`<span>+${b}</span>`:''}`); if(nb._t!==t){ nb._t=t; nb.innerHTML=t; } }
  { const kb=$('kingBtn'), ku=started&&kingUp(); if(kb._u!==ku){ kb._u=ku; kb.classList.toggle('ready',ku); } { const kv=started&&(S.level>1||(S.meta.crowns||0)>0||Object.values(S.meta.up||{}).some(v=>v>0)); if(kb._v!==kv){ kb._v=kv; kb.style.visibility=kv?'':'hidden'; } } /* FX3: 0 taçlı yeni oyuncuya Krallık düğmesi gösterilmez */
    /* F9b: gece yaklaşırken / patron gününde harcanmamış taçlar için 👑 düğmesinin yanında çağrı (dokununca Krallık açılır) */
    const kt=$('kingTip'), c=S.meta.crowns||0, kon=ku&&!placing&&!document.querySelector('.intro')&&defUrg()>0&&(S.wave>=WAVES||c>=12); const ktx=kon?(S.wave>=WAVES?T(`👑 ${c} taç: patrondan önce harca!`,`👑 ${c} crowns: spend before the boss!`):T(`👑 ${c} taç harcanmadı`,`👑 ${c} crowns unspent`)):''; if(kt._t!==ktx){ kt._t=ktx; kt.textContent=ktx; kt.style.display=kon?'block':'none'; } } /* taç bir güçlendirmeye yetince 👑 düğmesi nabız atar */
  renderQuestChip(); updateBossUI(); updateGatePtrs();
  const pc=$('perkChip'); const keys=Object.keys(S.cards||{}).filter(k=>S.cards[k]>0); setShow(pc,keys.length>0); if(keys.length){ const t=keys.map(k=>CARDS[k].i+(S.cards[k]>1?'×'+S.cards[k]:'')).join(' '); if(pc._t!==t){ pc._t=t; $('perkTxt').textContent=t; } }
}
// patron: üstte ad + can çubuğu (HUD sütunlarının arasına ya da sağ sütunun altına), ekran dışındaysa kenarda yön oku
const bossBarEl=$('bossBar'), bossPtrEl=$('bossPtr'); let bossLay=null, bossLayT=-1;
function bossLayout(){ const now=performance.now(); if(bossLay&&now-bossLayT<300) return bossLay; bossLayT=now; const W=innerWidth; let lr=0; for(const el of document.querySelectorAll('.hud .left .chip')){ const r=el.getBoundingClientRect(); if(r.width>1) lr=Math.max(lr,r.right); } const top=$('coinChip').getBoundingClientRect().top; const rr=document.querySelector('.hud .right').getBoundingClientRect(); const gl=lr+10, gr=rr.left-10;
  bossLay= gr-gl>=190? {x:(gl+gr)/2,w:Math.min(340,gr-gl),y:top} : {x:(gl+W-12)/2,w:Math.min(320,W-12-gl),y:rr.bottom+6}; return bossLay; }
let bossUiL=null;
// F9b: gece ekran dışındaki saldırı altındaki kapılar: ekran kenarında kapıyı gösteren ok + canlı düşman sayısı (dövülen kapı nabız atar)
const gatePtrEl={}; for(const s of SIDES){ const el=document.createElement('div'); el.className='gatePtr'; el.style.display='none'; el.innerHTML='<span></span><i></i>'; document.body.appendChild(el); gatePtrEl[s]=el; }
function updateGatePtrs(){ const on=waveActive&&!runOver&&!document.querySelector('.intro'); const cnt={}, hot={}; if(on) for(const e of enemies){ if(e.dead) continue; cnt[e.side]=(cnt[e.side]||0)+1; const g=gates[e.side]; if(g&&Math.hypot(e.g.position.x-g.x,e.g.position.z-g.z)<16) hot[e.side]=1; }
  const W=innerWidth, H=innerHeight, L=bossLayout(), p=player.g.position; const bp=bossPtrEl.style.display!=='none'?[parseFloat(bossPtrEl.style.left),parseFloat(bossPtrEl.style.top)]:null; const used=[];
  for(const s of SIDES){ const el=gatePtrEl[s], n=cnt[s]||0; let show=false; if(n>0){ const [gx,gz]=sidePos(s,0,0); v3.set(gx,1,gz).project(camera); const x=(v3.x+1)/2*W, y=(1-v3.y)/2*H;
      if(!(v3.z<1&&x>20&&x<W-20&&y>60&&y<H-40)){ show=true; const ux=gx-p.x, uz=gz-p.z, ul=Math.hypot(ux,uz)||1; v3.set(p.x,1,p.z).project(camera); const qx=(v3.x+1)/2*W, qy=(1-v3.y)/2*H, cx=W/2, cy=H/2; v3.set(p.x+ux/ul*6,1,p.z+uz/ul*6).project(camera); let dx=(v3.x+1)/2*W-qx, dy=(1-v3.y)/2*H-qy; const dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;
        const x0=26, x1=W-26, y0=Math.max(L.y+64,96), y1=H-44; const k=Math.min(dx>0?(x1-cx)/dx:dx<0?(x0-cx)/dx:1e9, dy>0?(y1-cy)/dy:dy<0?(y0-cy)/dy:1e9); let px=cx+dx*Math.max(0,k), py=cy+dy*Math.max(0,k);
        for(let pass=0;pass<2;pass++) for(const r of hudObstacles()){ if(px<r.left-20||px>r.right+20||py<r.top-20||py>r.bottom+20) continue; if(r.top>H/2) py=r.top-22; else py=r.bottom+22; }
        for(const q of (bp?[bp]:[]).concat(used)) if(Math.hypot(q[0]-px,q[1]-py)<40){ if(Math.abs(dx)>Math.abs(dy)) py+=py<H/2?42:-42; else px+=px<W/2?42:-42; } used.push([px,py]);
        el.style.left=px+'px'; el.style.top=py+'px'; el.firstElementChild.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(dx,-dy)}rad) translateY(-24px)`; const t=String(n); if(el._t!==t){ el._t=t; el.lastElementChild.textContent=t; } el.classList.toggle('hot',!!hot[s]); } }
    if(el._on!==show){ el._on=show; el.style.display=show?'flex':'none'; } } }
function updateBossUI(){ const b=waveActive&&!runOver?enemies.find(e=>e.boss&&!e.dead):null; setShow(bossBarEl,!!b); if(!b){ bossPtrEl.style.display='none'; if(bossUiL){ bossUiL=null; toastPlace(); } return; }
  const L=bossLayout(); bossBarEl.style.left=L.x+'px'; bossBarEl.style.top=L.y+'px'; bossBarEl.style.width=L.w+'px'; if(bossUiL!==L){ bossUiL=L; toastPlace(); } const pct=clamp(b.hp/b.maxHp,0,1); const t=`💀 ${bossName()}`+(b.ward>0?` 🛡${b.ward}`:''); bossBarEl.classList.toggle('ward',b.ward>0||b.chanT>0); if(bossBarEl._t!==t){ bossBarEl._t=t; $('bossNm').textContent=t; } setTxt($('bossPct'),Math.ceil(pct*100)+'%'); bossBarEl.lastElementChild.firstElementChild.style.width=(pct*100)+'%'; bossBarEl.classList.toggle('roar',gameT-(b.roarAt||-9)<1);
  const W=innerWidth, H=innerHeight; v3.set(b.g.position.x,1.5,b.g.position.z).project(camera); const x=(v3.x+1)/2*W, y=(1-v3.y)/2*H; if(v3.z<1&&x>8&&x<W-8&&y>8&&y<H-8){ bossPtrEl.style.display='none'; return; }
  /* yön: oyuncudan patrona doğru kısa bir adım ekrana izdüşürülür (kamera arkasındaki noktalar yanıltmasın) */ const p=player.g.position; const ux=b.g.position.x-p.x, uz=b.g.position.z-p.z, ul=Math.hypot(ux,uz)||1; v3.set(p.x,1.5,p.z).project(camera); const qx=(v3.x+1)/2*W, qy=(1-v3.y)/2*H, cx=W/2, cy=H/2; v3.set(p.x+ux/ul*6,1.5,p.z+uz/ul*6).project(camera); let dx=(v3.x+1)/2*W-qx, dy=(1-v3.y)/2*H-qy; const dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;
  const x0=28, x1=W-28, y0=Math.max(L.y+64,90), y1=H-40; const k=Math.min(dx>0?(x1-cx)/dx:dx<0?(x0-cx)/dx:1e9, dy>0?(y1-cy)/dy:dy<0?(y0-cy)/dy:1e9); let px=cx+dx*Math.max(0,k), py=cy+dy*Math.max(0,k);
  for(let pass=0;pass<2;pass++) for(const r of hudObstacles()){ if(px<r.left-22||px>r.right+22||py<r.top-22||py>r.bottom+22) continue; if(r.top>H/2) py=r.top-24; else py=r.bottom+24; }
  bossPtrEl.style.display='flex'; bossPtrEl.style.left=px+'px'; bossPtrEl.style.top=py+'px'; bossPtrEl.firstElementChild.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(dx,-dy)}rad) translateY(-27px)`; }
$('placeCancel').addEventListener('click',e=>{ e.stopPropagation(); audio(); cancelPlacing(); });
addEventListener('keydown',e=>{ if(e.key==='Backspace'||e.key==='Delete') cancelPlacing(); });
/* FX3 klavye: açılan pencere birincil düğmeye odaklanır ve Tab onun içinde döner; Enter/Boşluk birincil düğmeye, 1-3 kartlara basar, Esc kapatır.
   Oyunda: Enter alan baloncuğundaki düğmeye basar, N geceyi başlatır, yerleştirirken Enter/Boşluk kuleyi kahramanın yanına kurar, Esc vazgeçer. */
let kbdLast=false; addEventListener('pointerdown',()=>{ kbdLast=false; },true);
const POP_PRIMARY='#revive,#retry,#winNext,#wheelSpin:not(:disabled),#wheelOk,#cont,#startBtn,#qClose,button.prim,button.gold:not(:disabled),.cards button';
function topPop(){ const a=document.querySelectorAll('.intro'); return a.length?a[a.length-1]:null; }
function popButtons(pop){ return [...pop.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetParent!==null); }
function popPrimary(pop){ const bs=popButtons(pop); for(const sel of POP_PRIMARY.split(',')){ const b=bs.find(x=>x.matches(sel)); if(b) return b; } return bs.find(b=>!b.classList.contains('ghost'))||bs[0]||null; }
function focusPop(pop){ if(!pop||!kbdLast) return; if(pop.contains(document.activeElement)) return; const b=popPrimary(pop); if(b) try{ b.focus({preventScroll:true}); }catch(e){} }
new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes) if(n.classList&&n.classList.contains('intro')) setTimeout(()=>focusPop(n),60); }).observe(document.body,{childList:true});
function kbdUI(e){ kbdLast=true; const k=e.key, pop=topPop();
  if(pop){ if(k==='Tab'){ const bs=popButtons(pop); if(!bs.length) return true; const i=bs.indexOf(document.activeElement); const j=i<0?0:(i+(e.shiftKey?-1:1)+bs.length)%bs.length; bs[j].focus(); return true; }
    if(k==='Escape'){ const c=pop.querySelector('#qClose,#cont,#wheelOk,button.ghost'); if(c&&!c.disabled&&c.offsetParent!==null) c.click(); return true; }
    if(pop.id==='cardPick'&&/^[1-4]$/.test(k)){ const b=pop.querySelectorAll('.cards button')[+k-1]; if(b) b.click(); return true; }
    if(k==='Enter'||k===' '){ const b=popPrimary(pop); if(b) b.click(); return true; }
    return false; }
  if(placing){ if(k==='Escape'){ cancelPlacing(); return true; } if(k==='Enter'||k===' '){ const p=player.g.position; if(!placing.spot||!placing.spot.ok||placing.kbd) placeGhostAt(p.x,p.z); confirmPlace(); return true; } if(/^(arrow|[wasd]$)/i.test(k)) placing.kbd=true; return false; }
  if(k==='Enter'){ const b=bubbleEl.style.display!=='none'&&bubbleEl.querySelector('button[data-act=buy]:not(.off)'); if(b){ b.click(); return true; } const nb=$('nightBtn'); if(nb&&nb.style.display!=='none'){ nb.click(); return true; } return false; }
  if(k==='n'||k==='N'){ const nb=$('nightBtn'); if(nb&&nb.style.display!=='none'){ nb.click(); return true; } }
  return false; }
addEventListener('keyup',e=>{ if(placing&&placing.kbd&&/^(arrow|[wasd]$)/i.test(e.key)){ const p=player.g.position; placeGhostAt(p.x,p.z); } });
// ses: hepsi açık → yalnız efektler (müzik kapalı) → hepsi kapalı
function drawMute(){ const n=S.snd|0; const b=$('muteBtn'); b.innerHTML=n>=2?'🔇':n===1?'🔊<i class="nomus">♪</i>':'🔊'; b.classList.toggle('off',n>=2); }
$('muteBtn').addEventListener('click',()=>{ audio(); S.snd=((S.snd|0)+1)%3; S.muted=S.snd>=2; drawMute(); if(S.snd<2) tone(660,990,0.08,'triangle',0.05); save(); });
drawMute();
$('kingTip').addEventListener('click',e=>{ e.stopPropagation(); audio(); if(!waveActive&&!runOver) showMap(); });
$('kingBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); if(!waveActive&&!runOver) showMap(); else toast(T('🌙 Gece bitince','🌙 When night ends')); });
$('nightBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); if(waveActive||runOver) return; const b=nightBonus(); if(b>0){ dropCoins(player.g.position.clone().setY(3),Math.min(16,b),b/Math.min(16,b),2,1.1); } waveT=0; startWave(); });
let started=false, noRegen=false;
cgCall(k=>k.game.loadingStop());
// F8: afiş sırası: patron afişi ekrandayken başka afiş onu silmez, sıraya girer; queue=true olan afiş de ekrandakini beklemeye alır
const banQ=[]; let banQT=0;
function flushBanner(){ const old=$('banner'); if(old&&!old.classList.contains('out')){ clearTimeout(banQT); banQT=setTimeout(flushBanner,400); return; } const b=banQ.shift(); if(b) banner(b[0],b[1],b[2]); if(banQ.length){ clearTimeout(banQT); banQT=setTimeout(flushBanner,2200); } }
/* FX3: büyük başlık HUD'un (kaynak çipleri, patron çubuğu, sol sütun) altında kalır, üstüne binmez */
function bannerPlace(b){ try{ const h=b.offsetHeight, w=b.offsetWidth, top=parseFloat(getComputedStyle(b).top)||0, L=(innerWidth-w)/2, Rr=L+w; let hb=0; for(const el of [document.querySelector('.hud .left'),document.querySelector('.hud .right'),$('bossBar')]){ if(!el||el.style.display==='none') continue; const r=el.getBoundingClientRect(); if(!r.height||r.right<L||r.left>Rr) continue; hb=Math.max(hb,r.bottom); } if(hb&&top-h/2<hb+8&&hb+8+h<innerHeight*0.8) b.style.top=Math.round(hb+8+h/2)+'px'; }catch(e){} }
function banner(title,sub,cls,queue){ const old=$('banner'); if(old&&!old.classList.contains('out')&&(queue||(old.classList.contains('boss')&&cls!=='boss'))){ if(banQ.length<3&&!banQ.some(q=>q[0]===title)) banQ.push([title,sub,cls]); clearTimeout(banQT); banQT=setTimeout(flushBanner,500); return; } if(old) old.remove(); const b=document.createElement('div'); b.id='banner'; b.className='banner '+(cls||''); b.innerHTML=`<b>${title}</b>${sub?`<small>${sub}</small>`:''}`; document.body.appendChild(b); bannerPlace(b); { const t=$('toast'); if(t.classList.contains('show')){ t.classList.remove('show'); clearTimeout(t._h); if(t._msg&&performance.now()-(t._at||0)<1500&&!toastQ.some(q=>q[0]===t._msg)) toastQ.unshift([t._msg,(t.className.match(/\b(good|gold)\b/)||[])[0]]); } } /* FX3: büyük başlık bildirimin üstüne binmez; yeni bildirim başlıktan sonra gösterilir */ setTimeout(()=>b.classList.add('out'),2100); setTimeout(()=>b.remove(),2700); }
function nightBanner(){ const sides=SIDES.filter(s=>plan&&plan.cnt[s]>0).map(s=>SIDE_TR[s]).join(' · '); if(S.wave===WAVES) banner(T('PATRON: ','BOSS: ')+bossName().toLocaleUpperCase(LANG==='tr'?'tr':'en'),`⚔️ ${plan.total} · ${sides}`,'boss'); else { const n=endless()?eNight(S.level,S.wave):S.wave; banner(T(`GECE ${n}`,`NIGHT ${n}`),`⚔️ ${plan.total} · ${sides}`,'night'); } }
let lastSides=sidesActive(), newGate=null;
function nightCleared(){ S.nightOn=false; const n=S.wave; if(n>=WAVES){ levelWon(); return; } stat('nights'); const en=endless()?eNight(S.level,n):0; if(en>(S.meta.best||0)) S.meta.best=en; /* F9a */
  const bonus=12+6*n+4*S.level; const cnt=Math.min(24,bonus); dropCoins(player.g.position.clone().setY(3),cnt,bonus/cnt,3,1.3); celebrate(player.g.position.clone(),0.7);
  S.wave++; plan=null; planWave(); waveT=dayLen(); dawnRepair(); questEvent('night',1); banner(T(`Gece ${en||n} atlatıldı!`,`Night ${en||n} cleared!`),`+${bonus} 💰`+(S.wave===WAVES?T(' · 💀 Sıradaki gece patron!',' · 💀 Boss next night!'):''),'day');
  const ns=sidesActive(); if(ns>lastSides){ const s=SIDES[ns-1]; newGate=s; toast(T(`🚪 ${SIDE_TR[s]} kapısı açıldı`,`🚪 ${SIDE_TR[s]} Gate opened`),'good',true); } else newGate=null; lastSides=ns;
  S.dayGrace=0; S.nightSnap=null; S.cardPending=true; save(); setTimeout(showCardPick,1500); }
// ---------- Gece arası güç kartı ----------
let cardRetry=0;
function showCardPick(force){ if(runOver||waveActive||$('cardPick')||!(S.cardPending||S.cardOffer)) return; if(modalOpen()||(!force&&$('banner')&&!$('banner').classList.contains('out'))){ clearTimeout(cardRetry); cardRetry=setTimeout(showCardPick,500); return; } /* tek seferde tek pencere: başka kart/çark/bölge gösterisi açıkken bekler; gece afişi bitince açılır */ if(S.cardOffer&&!(Array.isArray(S.cardOffer)&&S.cardOffer.every(cardUseful))) S.cardOffer=null; if(!S.cardOffer){ const keys=Object.keys(CARDS).filter(k=>!(k==='trample'&&cc('trample'))&&!(k==='mend'&&cc('mend'))&&cardUseful(k)); /* patron gecesinden önce savaş kartları 3 kat daha sık */ const wt=k=>S.wave===WAVES&&CARD_FIGHT.includes(k)?3:1; const pick=[]; while(pick.length<Math.min(3,keys.length)){ const rest=keys.filter(k=>!pick.includes(k)); let r=Math.random()*rest.reduce((a,k)=>a+wt(k),0), k=rest[rest.length-1]; for(const q of rest){ r-=wt(q); if(r<0){ k=q; break; } } pick.push(k); } S.cardOffer=pick; save(); }
  const goldAmt=40+25*S.wave+10*S.level;
  const card=document.createElement('div'); card.className='intro'; card.id='cardPick'; card.innerHTML=`<div class="card"><h1>${T('Bir güç seç','Pick a power')}</h1><p>${endless()?T('Sıradaki patron yenilene dek','Until the next boss falls'):T('Bu sefer boyunca','For this chapter')}</p>${S.wave===WAVES?`<p class="bosswarn">💀 ${T(`Sıradaki gece patron: <b>${bossName()}</b>`,`Boss next night: <b>${bossName()}</b>`)}${newGate?T(` · 🚪 ${SIDE_TR[newGate]} kapısı açıldı`,` · 🚪 ${SIDE_TR[newGate]} Gate opened`):''}</p>`:''}${S.wave!==WAVES&&newGate?`<p class="bosswarn">🚪 ${T(`${SIDE_TR[newGate]} kapısı açıldı: bu gece oradan da gelecekler`,`${SIDE_TR[newGate]} Gate opened: enemies come there tonight too`)}</p>`:''}<div class="cards">${S.cardOffer.map((k,i)=>`<button data-k="${k}" style="animation-delay:${i*0.08}s"><i>${CARDS[k].i}</i><b>${CARDS[k].n}${cc(k)?` <em>×${cc(k)+1}</em>`:''}</b><small>${k==='gold'?T(`Hemen +${goldAmt} altın`,`+${goldAmt} gold now`):CARDS[k].d}</small></button>`).join('')}</div></div>`; document.body.appendChild(card); SFX.card();
  card.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ audio(); const k=b.dataset.k; S.cards[k]=(S.cards[k]||0)+1; S.cardOffer=null; S.cardPending=false; card.remove(); SFX.build();
    if(k==='gold'){ const cnt=24; dropCoins(player.g.position.clone().setY(3.5),cnt,goldAmt/cnt,3,1.3); } if(k==='wall'){ S.gateHp=D.gateMax(); } if(k==='axe') rebuildOrbit();
    toast(CARDS[k].i+' '+CARDS[k].n,'good'); if(S.wave===WAVES&&!waveActive) setTimeout(()=>{ if(!waveActive&&!runOver) toast(T(`💀 Patron geliyor: ${bossName()}! Hazırlan.`,`💀 Boss next night: ${bossName()}! Get ready.`)+(kingUp()?T(` 👑 ${S.meta.crowns} tacını Krallık'ta harca.`,` 👑 Spend your ${S.meta.crowns} crowns in the Kingdom.`):'')); },2500); save(); })); }
// ---------- Bölüm sonu: kazanma ----------
function starsFor(minGate){ return minGate>=0.6?3:minGate>=0.25?2:1; }
function levelWon(){ runOver=true; S.nightOn=false; const L=S.level; const st=starsFor(S.minGate); const prev=S.meta.stars[L]||0; const first=!prev; const gain=(first?3:0)+Math.max(0,st-prev)*2+1; S.meta.stars[L]=Math.max(prev,st); S.meta.unlocked=Math.max(S.meta.unlocked,L+1); S.book.boss[L]=bossName(); S.meta.crowns+=gain; S.meta.fails[L]=0; S.won=true; S.post={st,gain,first,wheel:0}; stat('nights'); if(endless(L)){ const E=eNight(L,WAVES), pb=S.meta.best||0; S.meta.best=Math.max(pb,E); S.meta.bestSeen=S.meta.best; const mc=3+Math.ceil(E/10); S.meta.crowns+=mc; S.meta.nextCard=(S.meta.nextCard||0)+1; S.post.ms={E,mc,pb}; } /* F9a: her 5 sonsuz gecede kilometre taşı: taç + sonraki geceye güç kartı */ S.nightSnap=null; questEvent('night',1); dawnRepair(); save();
  cgCall(k=>k.game.happytime()); SFX.win(); celebrate(player.g.position.clone(),1.4); setTimeout(()=>celebrate(new THREE.Vector3(0,0,0),1.2),350); confetti();
  pullCoins(); setTimeout(()=>{ flushCoins(); postFlow(); },1900); } /* FX4: patronun altınları çark açılmadan oyuncuya akar (çark oyunu durdurur, altın yerde kalıyordu) */
// patron sonrası akış (çark → kazanma kartı) kayıtta durur: yeniden yüklemede kaldığı yerden bir kez sürer
function postFlow(){ const P=S.post; if(!P||$('winCard')||$('wheelCard')) return; if(S.level===LEVELS&&!P.cm){ castleMoment(()=>{ if(S.post){ S.post.cm=1; save(); } postFlow(); }); return; } /* F9a: son zaferde önce Kara Kale anı */ const win=()=>showWinCard(P.st,P.gain,P.first); if(P.wheel) win(); else showBossWheel(win); }
function showWinCard(st,gain,first){ const L=S.level; const last=L>=LEVELS; if(L===LEVELS){ showEndCard(st,gain,first); return; } const card=document.createElement('div'); card.className='intro'; card.id='winCard';
  card.innerHTML=`<div class="card result"><div class="bigstars">${[1,2,3].map(i=>`<span class="st${i<=st?' on':''}" style="animation-delay:${0.25+i*0.35}s">★</span>`).join('')}</div><h1>${endless(L)?T(`Gece ${eNight(L,WAVES)} atlatıldı!`,`Night ${eNight(L,WAVES)} survived!`):T(`${L}. sefer kazanıldı!`,`Chapter ${L} complete!`)}</h1><p class="boss">${T(`${bossName()} yenildi`,`${bossName()} defeated`)}</p><p>${T(`Surun en zor anında <b>%${Math.round(S.minGate*100)}</b> canı kaldı.`,`Lowest Wall HP: <b>${Math.round(S.minGate*100)}%</b>.`)}${st<3?T(`<br>3 yıldız için sur %60'ın altına düşmemeli.`,`<br>3 stars: don't let Walls drop below 60%.`):(S.minGate>=0.99?T('<br>Kusursuz savunma!','<br>Flawless defense!'):T('<br>Harika savunma!','<br>Great defense!'))}</p><div class="crowns">${T(`👑 +${gain} taç`,`👑 +${gain} crown${gain===1?'':'s'}`)}${first?T(' · ilk zafer bonusu',' · first win bonus'):''}</div>${nextRegText(L+1)}${endlessWinTxt()}<button id="winNext">${endless(L)?T(`Gece ${eNight(L,WAVES)+1} →`,`Night ${eNight(L,WAVES)+1} →`):T(`${L+1}. sefere başla →`,`Start Chapter ${L+1} →`)}</button><button id="winMap" class="ghost">${T('Krallık','Kingdom')}</button></div>`;
  document.body.appendChild(card); [1,2,3].forEach(i=>{ if(i<=st) setTimeout(()=>tone(660+i*220,990+i*220,0.18,'triangle',0.09),250+i*350); });
  $('winNext').addEventListener('click',()=>{ audio(); card.remove(); const go=()=>nextSefer(); cgAd('midgame',go,go); });
  $('winMap').addEventListener('click',()=>{ audio(); card.remove(); nextSefer(true); showMap(); }); }
function confetti(){ const box=document.createElement('div'); box.className='confetti'; const cols=['#ffd23f','#d9534f','#3d9a55','#3d63c9','#fff8e7','#f28c28']; for(let i=0;i<90;i++){ const d=document.createElement('i'); d.style.left=(Math.random()*100)+'%'; d.style.background=cols[i%cols.length]; d.style.animationDelay=(Math.random()*0.8)+'s'; d.style.animationDuration=(1.8+Math.random()*1.6)+'s'; d.style.transform=`rotate(${Math.random()*360}deg)`; box.appendChild(d); } document.body.appendChild(box); setTimeout(()=>box.remove(),4200); }
// ---------- Bölüm sonu: kaybetme ("az kalmıştı") ----------
// kayıp ipucu duruma göre: eksik kule > koçbaşı hasarı > asker > parası yeten savunma > zayıf kapı > sur > taç (Krallık) > kalan savunma > patron > kart
function failTip(){ const cnt={N:0,E:0,S:0,W:0}; for(const e of enemies) if(!e.dead) cnt[e.side]++; const worst=SIDES.slice().sort((a,b)=>cnt[b]-cnt[a])[0]; const tw=S.towers.filter(t=>t.side===worst&&t.lvl>=1); const lv=tw.reduce((a,t)=>a+t.lvl,0);
  const act=pd=>pd.def.kind!=='tower'||SIDES.indexOf(S.towers[pd.def.ti].side)<sidesActive(); const vis=pads.filter(pd=>padVisible(pd)&&!pd.locked&&act(pd)); const has=k=>vis.some(pd=>pd.def.kind===k);
  const wTw=vis.filter(pd=>pd.def.kind==='tower'&&S.towers[pd.def.ti].side===worst); const def=[...wTw,...vis.filter(pd=>pd.def.kind==='wall'),...vis.filter(pd=>pd.def.kind==='soldier'),...vis.filter(pd=>pd.def.kind==='newTower'),...vis.filter(pd=>pd.def.kind==='tower'&&!wTw.includes(pd))];
  const nm=pd=>{ if(pd.def.kind!=='tower') return pd.def.name; const t=S.towers[pd.def.ti]; if(!t||t.side==='C'||!SIDE_TR[t.side]) return pd.def.name; const s=SIDE_TR[t.side]; return t.k==='c'?T(`${s} Topçu Kulesi`,`${s} Cannon Tower`):T(`${s} Okçu Kulesi`,`${s} Archer Tower`); }; /* F8: Merkez Kule adıyla, topçu kulesi "Topçu Kulesi" */ let tot=0; for(const k in nightDmg) tot+=nightDmg[k]; const share=k=>(nightDmg[k]||0)/Math.max(1,tot);
  if(tw.length<2&&wTw.some(pd=>padLevel(pd.def)===0)) return T(tw.length?`${SIDE_TR[worst]} kapısında sadece 1 kule vardı. Oraya kule ekle.`:`${SIDE_TR[worst]} kapısında hiç kule yoktu. Oraya kule kur.`, tw.length?`${SIDE_TR[worst]} Gate had just 1 tower. Build more there.`:`${SIDE_TR[worst]} Gate had no towers. Build one there.`);
  if(share('ram')>0.35&&has('newTower')) return T('Surun çoğunu koçbaşları yıktı. Topçu Kulesi kur: gülleler koçbaşına çok vurur.','Rams did most of the damage. Build a Cannon Tower: cannonballs hit rams hard.');
  if(soldiers.length===0&&has('soldier')) return T('Asker al: düşmanın geldiği kapıya koşar.','Hire Soldiers: they rush to the attacked Gate.');
  const aff=def.find(pd=>padAvail(pd)); if(aff) return T(`Kaynağın yetiyordu! Geceden önce geliştir: ${nm(aff)}.`,`You could afford it! Upgrade before the night: ${nm(aff)}.`);
  if(wTw.length&&lv<6) return T(`${SIDE_TR[worst]} kulelerini geliştir.`,`Upgrade your ${SIDE_TR[worst]} towers.`);
  if(has('wall')&&S.lv.wall<2) return T('Suru güçlendir: daha uzun dayanır.','Upgrade the Walls: they last longer.');
  if(def.length){ const pd=def[0], r=padRes(pd); const how=r==='wood'?T('odun kes','chop wood'):r==='stone'?T('taş çıkar','mine stone'):r==='plank'?T('kereste biriktir','make planks'):r==='iron'?T('demir topla','collect iron'):T('bölgelerden altın topla','collect region gold'); return T(`Gündüz ${how}, sonra geliştir: ${nm(pd)}.`,`By day ${how}, then upgrade: ${nm(pd)}.`); }
  if(share('boss')>0.25) return T('Patron gelince onun kapısına koş ve kılıcınla vur: okçular yardım eder.','When the boss comes, ride to its Gate and hit it with your sword.');
  return T('Her şey en üst seviyede! 🏹 Keskin Oklar ve 🧱 Sağlam Sur kartlarını seç, en kalabalık kapıda kılıcınla savaş.','Everything is maxed! Pick 🏹 Sharp Arrows and 🧱 Sturdy Walls cards and fight at the busiest Gate with your sword.'); }
function showFailCard(){ const L=S.level, n=S.wave; const left=failLeft; const tot=(plan&&plan.total)||1; const pct=Math.round(((n-1)+Math.max(0,Math.min(0.99,(tot-left)/tot)))/WAVES*100); const gain=Math.max(0,n-1);
  const paid=payFail(); S.failed=true; const rec=endless()&&(S.meta.best||0)>(S.meta.bestSeen||0); if(endless()) S.meta.bestSeen=S.meta.best||0; save(); /* kart yalnız gerçekten ödenen tacı gösterir */
  // platform kuralı: reklamla devam her kayıpta sunulmaz (seferde bir kez) ve aynı molada ara reklamla birlikte olmaz
  const canRevive=!S.revived&&S.reviveLv!==L; const adRev=ADS&&!!CG.sdk; /* FX1: reklam yoksa/engelliyse ikinci şans yine bedava */ const ku=kingUp(); if(canRevive){ S.reviveLv=L; save(); } const card=document.createElement('div'); card.className='intro'; card.id='failCard';
  card.innerHTML=`<div class="card result fail"><h1>${T('Sur yıkıldı!','The Walls fell!')}</h1><p class="boss">${endless()?`${chapTitle()} · `:''}${T('Kalen yerinde — bu gece baştan başlayacak','Your castle stands — this night starts over')}</p><p class="near">${left<=5?T(`Sadece <b>${left}</b> düşman kalmıştı!`,`Only <b>${left}</b> ${left===1?'enemy':'enemies'} left!`):T(`${n}. gecede <b>${left}</b> düşman kalmıştı.`,`Night ${n}: <b>${left}</b> enemies left.`)}</p>${endless()?`<p class="rec${rec?' new':''}">🏆 ${rec?T(`Yeni rekor! ${S.meta.best}. gece`,`New record! Night ${S.meta.best}`):T(`Rekor: ${S.meta.best||0}. gece`,`Best: Night ${S.meta.best||0}`)}</p>`:`<div class="prog"><i style="width:0%"></i><span>${T(`Sefer ilerlemesi: %${pct}`,`Chapter progress: ${pct}%`)}</span></div>`}<p class="hint">💡 ${failTip()}</p>${ku&&!canRevive?`<p class="hint kh">👑 ${T(`${S.meta.crowns} tacın harcanmayı bekliyor: Krallık'ta kalıcı güç al (Taş Temel sur canını artırır).`,`${S.meta.crowns} crowns unspent: buy a permanent upgrade in the Kingdom (Stone Foundation adds Wall HP).`)}</p>`:''}${paid?`<div class="crowns">${T(`👑 +${paid} taç kazandın`,`👑 +${paid} crown${paid===1?'':'s'} earned`)}</div>`:''}${canRevive?(adRev?'<button id="revive">'+T('📺 İkinci şans (reklam)','📺 Second chance (ad)')+'</button>':'<button id="revive" class="gold prim">'+T('🛡️ İkinci şans','🛡️ Second chance')+'<small>'+T('Sur onarılır, savaş sürer','Walls repaired, keep fighting')+'</small></button>'):''}<div class="brow"><button id="retry"${canRevive&&!adRev?' class="sec"':''}>${T(`Gece ${endless()?eNight(L,n):n}: tekrar dene`,`Retry Night ${endless()?eNight(L,n):n}`)}</button><button id="failMap" class="ghost">${ku?`👑 ${S.meta.crowns} · `:''}${T('Krallık','Kingdom')}</button></div></div>`; if(rec) setTimeout(confetti,300);
  document.body.appendChild(card); setTimeout(()=>{ const i=card.querySelector('.prog i'); if(i) i.style.width=pct+'%'; },80);
  $('retry').addEventListener('click',()=>{ audio(); card.remove(); const go=()=>retryNight(); if(canRevive) go(); else cgAd('midgame',go,go); });
  $('failMap').addEventListener('click',()=>{ audio(); card.remove(); retryNight(true); showMap(); });
  if(canRevive) $('revive').addEventListener('click',()=>{ audio(); const b=$('revive'); b.disabled=true; if(!adRev){ card.remove(); revive(); return; } b.textContent=T('Reklam yükleniyor…','Loading ad…'); cgAd('rewarded',()=>{ card.remove(); revive(); },()=>{ card.remove(); revive(); setTimeout(()=>toast(T('📺 Reklam yok: ikinci şans bedava','📺 No ad right now: free second chance')),600); }); }); }
// canlanma reklama değmeli: sur adil seviyeye (patron gecesi tam) döner, düşmanlar yolun gerisine itilir (koçbaşı/patron daha da geriye), 8 sn kalkan sur hasarını keser
function revive(){ S.revived=true; S.failed=false; S.nightOn=true; S.failPaid=false; /* yenilgi sayacı düşmez (tekrar deneme zorlaşmaz); ikinci kayıp da tacını öder */ const bn=S.wave===WAVES; S.gateHp=D.gateMax()*(bn?1:0.8); { const sn=S.nightSnap; if(sn&&sn.level===S.level&&sn.wave===S.wave&&typeof sn.minGate==='number') S.minGate=sn.minGate; } /* FX1: Gece tekrarı gibi: yıldız için sur gece başındaki değere döner (eskiden 0.01 → en çok 1 yıldız) */ gateWarned=0;
  for(const e of enemies){ if(e.dead||e.hold||(e.pre&&e.pre.length)) continue; const P=ROADS[e.side], d0=SD[e.side], big=e.boss||e.kind==='ram'; const i=big?2:3, k=big?Math.random()*0.3:Math.random()*0.6; const x=lerp(P[i][0],P[i+1][0],k)+d0.t[0]*e.off, z=lerp(P[i][1],P[i+1][1],k)+d0.t[1]*e.off; e.g.position.set(x,0,z); e.wp=i+1; e.stuckT=0; e.rage=0; e.atkCd=1; }
  shieldT=8; runOver=false; celebrate(player.g.position.clone(),1); banner(T('Sur onarıldı!','Walls fixed!'),T('🛡️ 8 sn kalkan · düşmanlar geri püskürtüldü','🛡️ 8 s shield · enemies pushed back'),'day'); save(); }
// ---------- Harita ve kalıcı güçlendirme ----------
const UPG={ gold:{n:T('Başlangıç Kesesi','Starting Purse'),d:T('Her seferin başında +40 altın','+40 gold at the start of each chapter'),i:'💰'}, wall:{n:T('Taş Temel','Stone Foundation'),d:T('Sur canı +%5','Wall HP +5%'),i:'🧱'}, arrow:{n:T('Usta Okçular','Master Archers'),d:T('Okçu hasarı +%4','Archer damage +4%'),i:'🏹'} }; const UPC=[3,5,8,12,18,26,36,50,70,95], KMAX=UPC.length; /* F4: 10 seviye — Kraliyet Haracı'ndan gelen taçlar için kalıcı yutak */
function kingUp(){ const m=S.meta; if(!m||!m.up) return false; return Object.keys(UPG).some(k=>(m.up[k]||0)<KMAX&&(m.crowns||0)>=UPC[m.up[k]||0]); }
const dayKey=()=>{ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
function dailyGift(){ const k=dayKey(); if(S.meta.dailyDate===k) return 0; const y=new Date(); y.setDate(y.getDate()-1); const yk=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate(); S.meta.streak=(S.meta.dailyDate===yk)?(S.meta.streak||0)+1:1; S.meta.dailyDate=k; const g=giftOf(S.meta.streak); S.meta.crowns+=g; save(); return g; }
const GIFT=[2,3,4,5,6,8,10]; function giftOf(n){ return GIFT[Math.max(0,Math.min(GIFT.length-1,(n||1)-1))]; } /* FX2: 7 günlük seri (eski 2-4 taç); dönüşte kartla verilir */
function showMap(){ if($('mapCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='mapCard'; document.body.appendChild(card); const gift=dailyGift();
  const render=()=>{ const m=S.meta; const regs=Object.keys(REG).map(k=>REG[k]); const nodes=[]; /* F9a: sonsuz kuşatma tek kutu (gece + rekor) */ const endTile=()=>S.level>LEVELS?`<div class="sn cur endl"><b>♾</b><span>${ENAME()}</span><small>${T(`Gece ${eNight(S.level,S.wave)}`,`Night ${eNight(S.level,S.wave)}`)}${m.best?` · 🏆 ${m.best}`:''}</small></div>`:''; for(let L=1;L<=LEVELS;L++){ const st=m.stars[L]||0; const done=L<S.level; const cur=L===S.level; const R=regs.find(r=>r.sefer===L); nodes.push(`<div class="sn${done?' done':''}${cur?' cur':''}"><b>${L}</b><span>${R?R.name:(L===1?T('Orman Kapısı','Forest Gate'):T('Sonsuz Kuşatma','Endless Siege'))}</span><small>${done?'★'.repeat(st)+'☆'.repeat(3-st):cur?T('şu an','now'):'🔒'}</small></div>`); }
    const fishN=Object.keys(S.book.fish).length;
    card.innerHTML=`<div class="card map"><div class="maphead"><h1>${T('Krallık','Kingdom')}</h1><div class="crowns big">👑 ${m.crowns}</div></div>${gift?`<div class="gift">${T(`Günlük hediye: +${gift} taç · ${m.streak}. gün`,`Daily gift: +${gift} crowns · Day ${m.streak}`)}</div>`:''}<button id="cont">${endless()?`▶ ${chapTitle()}`:T(`▶ ${S.level}. sefer · Gece ${S.wave}`,`▶ Chapter ${S.level} · Night ${S.wave}`)}</button><div class="sefers">${nodes.join('')}${endTile()}</div><h2>${T('Kalıcı güçlendirme','Permanent Upgrades')}</h2><div class="ups">${Object.keys(UPG).map(k=>{ const lv=m.up[k]||0; const max=lv>=KMAX; const cost=UPC[lv]; return `<div class="upr"><i>${UPG[k].i}</i><div><b>${UPG[k].n} <span>${lv}/${KMAX}</span></b><small>${UPG[k].d}</small></div><button data-u="${k}" ${max||m.crowns<cost?'disabled':''}>${max?T('Maks.','Max'):'👑 '+cost}</button></div>`; }).join('')}</div><p class="sub">${T('Taç: her seferi kazanınca, yıldız toplayınca ve kaybettiğinde atlattığın her gece için kazanılır.','Earn crowns by winning chapters, getting stars, and surviving nights before a loss.')}</p><h2>${T('Koleksiyon defteri','Collection Book')}</h2><h3 class="bkh">🐟 ${T('Balıklar','Fish')} · ${fishN}/${FISH.length}</h3><div class="book">${FISH.map(f=>{ const n=S.book.fish[f.k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${f.c.toString(16).padStart(6,'0')}"></i><b>${n?f.n:'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div><h3 class="bkh">🦌 ${T('Av hayvanları','Animals')} · ${Object.keys(S.book.hunt).length}/${HUNT.length}</h3><div class="book">${HUNT.map(f=>{ const n=S.book.hunt[f.k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${f.c.toString(16).padStart(6,'0')};border-radius:40%"></i><b>${n?f.n:'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div>${chestBook()}<p class="sub">${T(`${fishN}/${FISH.length} balık · ${Object.keys(S.book.hunt).length}/${HUNT.length} av · ${Object.keys(S.book.boss).length} patron yenildi`,`${fishN}/${FISH.length} fish · ${Object.keys(S.book.hunt).length}/${HUNT.length} animals · ${Object.keys(S.book.boss).length} ${Object.keys(S.book.boss).length===1?'boss':'bosses'} beaten`)}</p><div class="setrow"><button id="langBtn" class="ghost">${T('🌐 English','🌐 Türkçe')}</button><button id="calmBtn" class="ghost" aria-pressed="${calmOn()}">${calmOn()?T('🎞️ Hareket: azaltılmış','🎞️ Motion: reduced'):T('🎞️ Hareket: tam (sarsıntı açık)','🎞️ Motion: full (screen shake on)')}</button></div></div>`;
    card.querySelectorAll('.upr button').forEach(b=>b.addEventListener('click',()=>{ audio(); const k=b.dataset.u; const lv=S.meta.up[k]||0; const cost=UPC[lv]; if(lv>=KMAX||S.meta.crowns<cost) return; S.meta.crowns-=cost; S.meta.up[k]=lv+1; SFX.fanfare(); save(); render(); }));
    $('cont').addEventListener('click',()=>{ audio(); card.remove(); if(!runReveal()) startBanner(); });
    $('langBtn').addEventListener('click',()=>{ audio(); setLang(LANG==='tr'?'en':'tr'); save(); setTimeout(()=>location.reload(),CG.sdk?1500:0); /* FX1: Data modülü eşitlesin */ }); $('calmBtn').addEventListener('click',()=>{ audio(); S.meta.calm=!calmOn(); applyCalm(); save(); render(); }); };
  render(); }
function endlessWinTxt(){ const m=S.post&&S.post.ms; if(!m) return ''; return `<div class="nextreg">🏅 ${T(`Kilometre taşı: ${m.E}. gece · 👑 +${m.mc} · 🃏 sonraki geceye güç kartı`,`Milestone: Night ${m.E} · 👑 +${m.mc} · 🃏 power card for next night`)}${m.E>m.pb?T(` · 🏆 yeni rekor!`,` · 🏆 new record!`):''}</div>`; }
function nextRegText(L){ const k=Object.keys(REG).find(k=>REG[k].sefer===L); return k?`<div class="nextreg">${T('Açılacak bölge:','Next region:')} <b>${REG[k].name}</b> · ${REG[k].job}</div>`:''; }
// yeni bölgenin açılış gösterisi kayıtta bekler (S.pendingReveal): yeniden yüklemede de bir kez oynar
function runReveal(){ const id=S.pendingReveal; if(!id) return false; if(!REG[id]){ S.pendingReveal=null; return false; } S.revealed[id]=false; syncClouds(); revealRegion(id,()=>{ S.pendingReveal=null; save(); startBanner(); }); return true; }
function clearBattle(){ clearP7Battle(); for(const e of enemies){ e.dead=true; e.bar.remove(); scene.remove(e.g); } enemies.length=0; for(const b of bolts) scene.remove(b.m); bolts.length=0; /* FX1: uçan balista okları da temizlenir (tekrar denemede hayalet öldürme yok) */ for(const pr of projectiles) scene.remove(pr.m); projectiles.length=0; for(const b of balls) scene.remove(b.m); balls.length=0; spawnQueue=0; waveActive=false; }
// Sefer bitti: kale yerinde, yeni bölge açılır, yeni sefer başlar
function nextSefer(silent){ clearBattle(); S.nightOn=false; noRegen=false; S.failPaid=false; S.failCr=0; S.cardPending=false; S.post=null; S.nightSnap=null; S.dayGrace=0; S.level++; S.coins+=40*mu('gold'); S.wave=1; S.cards={}; S.cardOffer=null; applyNextCard(); S.minGate=1; S.failed=false; S.won=false; S.revived=false; runOver=false; plan=null; planWave(); waveT=40; lastSides=sidesActive(); applyCaps(); S.gateHp=D.gateMax();
  const rid=Object.keys(REG).find(k=>REG[k].sefer===S.level); if(rid&&!revealed(rid)) S.pendingReveal=rid; save(); if(!silent&&!runReveal()) startBanner(); }
// Kaybedildi: kale kalır; bu seferin geceleri baştan, elde tutulanların yarısı gider
function restartSefer(silent){ clearBattle(); dawnRepair(); S.nightOn=false; noRegen=false; S.failPaid=false; S.cardPending=false; S.post=null; S.nightSnap=null; S.dayGrace=0; S.wave=1; S.cards=Object.assign({},S.wheelCards||{}); S.cardOffer=null; S.minGate=1; S.failed=false; S.revived=false; runOver=false; S.loot=Math.floor(S.loot/2); S.fish=Math.floor((S.fish||0)/2); S.meat=Math.floor((S.meat||0)/2); S.herb=Math.floor((S.herb||0)/2); S.ore=Math.floor((S.ore||0)/2); S.crystal=Math.floor((S.crystal||0)/2); S.stall=Math.floor(S.stall/2); setBack(player); plan=null; planWave(); waveT=dayLen(); introT=0; lastSides=sidesActive(); S.gateHp=D.gateMax(); save(); if(!silent) startBanner(); }
// F9a: kayıp = AYNI gece baştan (eskiden bütün sefer 1. geceden). Eldekiler kalır, sur dolar, kısa bir hazırlık gündüzü; yıldız için sur o gecenin başındaki değere döner.
// Gece ortasında yeniden yükleme de buraya gelir (p1 load → startPlay): kayıpla aynı sonuç, yalnız kayıp ödülü/merhamet sayacı yok.
function retryDay(){ return Math.min(dayLen(),20); }
function payFail(){ if(S.failPaid) return 0; const L=S.level, n=S.wave; const gain=Math.max(0,(n-1)-(S.failCr||0)); /* taç: bu seferde ilk kez atlatılan geceler için (aynı geceyi kaybederek taç toplanmaz) */ S.meta.fails[L]=(S.meta.fails[L]||0)+1; S.meta.crowns+=gain; S.failCr=Math.max(S.failCr||0,n-1); S.failPaid=true; return gain; }
function retryNight(silent){ if(S.failed) payFail(); clearBattle(); dawnRepair(); S.nightOn=false; noRegen=false; S.failPaid=false; S.cardPending=S.cardPending&&!S.failed; S.post=null; S.failed=false; runOver=false; shieldT=0;
  const sn=S.nightSnap; if(sn&&sn.level===S.level&&sn.wave===S.wave&&typeof sn.minGate==='number') S.minGate=sn.minGate; S.nightSnap=null; S.dayGrace=0;
  setBack(player); plan=null; planWave(); waveT=retryDay(); S.dayT=null; introT=0; lastSides=sidesActive(); S.gateHp=D.gateMax(); save(); if(!silent) startBanner(); }
function F8busy(){ return !!($('wheelCard')||$('winCard')||$('mapCard')); }
function flushOffline(){ const o=showOffline.pend; if(!o) return; if(S.post||S.pendingReveal||F8busy()||document.querySelector('.intro')){ clearTimeout(flushOffline.t); flushOffline.t=setTimeout(flushOffline,800); return; } showOffline.pend=null; showOffline(o); }
function startBanner(){ if(showOffline.pend){ clearTimeout(flushOffline.t); flushOffline.t=setTimeout(flushOffline,1500); } if(endless()){ const b=S.meta.best||0; banner(chapTitle(), (S.wave===WAVES?T(`💀 Patron gecesi: ${bossName()}`,`💀 Boss night: ${bossName()}`):T(`💀 Patron: ${eNight(S.level,WAVES)}. gece`,`💀 Boss: Night ${eNight(S.level,WAVES)}`))+(b?` · 🏆 ${b}`:''),'day'); return; } banner(T(`${S.level}. Sefer`,`Chapter ${S.level}`), S.wave===WAVES?T(`💀 Gece ${S.wave}/${WAVES}: ${bossName()}`,`💀 Night ${S.wave}/${WAVES}: ${bossName()}`):S.wave>1?T(`Gece ${S.wave}/${WAVES}`,`Night ${S.wave}/${WAVES}`):(S.level===1?T('🪓 Kes › 🏹 Kur › 🌙 Savun › 💀 Patron','🪓 Chop › 🏹 Build › 🌙 Defend › 💀 Boss'):isWinter()?T(`❄️ Kış · 💀 ${bossName()}`,`❄️ Winter · 💀 ${bossName()}`):T(`${WAVES} gece · 💀 ${bossName()}`,`${WAVES} nights · 💀 ${bossName()}`)),'day'); }
// ---------- Bölümü sıfırla (her bölüm yeni bir kaleyle başlar) ----------
function restoreNature(){ let a=false; trees.forEach((t,i)=>{ t.claimed=null; if(t.culled&&!nearBase(t.x,t.z,5.5)){ t.culled=false; t.gone=false; t.alive=true; t.falling=0; t.regrow=0; t.hp=D.treeHits(); writeTree(i); a=true; } }); if(a){ treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true; } rocks.forEach((r,i)=>{ r.claimed=null; if(r.culled&&!nearBase(r.x,r.z,5.5)){ r.culled=false; r.gone=false; r.alive=true; r.hp=3; r.regrow=0; writeRock(i); } }); rockMesh.instanceMatrix.needsUpdate=true; }
function resetRun(level){ const meta=S.meta, muted=S.muted, snd=S.snd;
  for(const e of enemies){ e.bar.remove(); scene.remove(e.g); } enemies.length=0; for(const pr of projectiles) scene.remove(pr.m); projectiles.length=0; for(const b of balls) scene.remove(b.m); balls.length=0; for(const f of fliers) scene.remove(f.m); fliers.length=0;
  coins.length=0; stackH.clear(); loot.length=0; for(const w of workers) scene.remove(w.guy.g); workers.length=0; for(const so of soldiers) scene.remove(so.guy.g); soldiers.length=0; for(const c of collectors) scene.remove(c.guy.g); collectors.length=0;
  for(const t of towers){ if(t) scene.remove(t.g); } towers.length=0; for(let i=pads.length-1;i>=0;i--){ const pd=pads[i]; if(pd.def.kind==='tower'&&pd.def.ti>8){ scene.remove(pd.g); delete padById[pd.def.id]; pads.splice(i,1); } } if(placing){ scene.remove(placing.ghost.g); placing=null; $('placeBar').style.display='none'; }
  for(const k of Object.keys(S)) delete S[k]; Object.assign(S,runState(level)); for(const f of fishers){ scene.remove(f.g.g); scene.remove(f.b); scene.remove(f.ln); } fishers.length=0; for(const h of hunters) scene.remove(h.guy.g); hunters.length=0; for(const c of carts) scene.remove(c.C.g); carts.length=0; for(const a of animals) scene.remove(a.m.g); animals.length=0; resetRegions6(); S.meta=meta; S.muted=muted; S.snd=snd; S.coins=20+25*mu('gold'); S.started=true;
  applyBase(); placeBuildings(); paintGround(); restoreNature(); cullTrees(); cullRocks(); cullDecor(); buildWalls(0); buildGates(0); placeGates(); placeTorches(); rebuildTowers(); layoutPads(); rebuildOrbit(); drawMiniBase();
  S.gateHp=D.gateMax(); setPile(0); setStonePile(0); stallPile.count=0; player.g.position.set(0,0,5.5); moveTarget=null; moveMark.visible=false; setBack(player); recenter();
  for(const pd of pads){ pd.last=''; pd.shown=0; pd.wasLocked=false; S.paid[pd.def.id]=0; }
  for(const id in REG) if(REG[id].sefer<=level) S.revealed[id]=true; waveActive=false; spawnQueue=0; runOver=false; plan=null; planWave(); waveT=S.level===1?30:25; buildNets(); buildTraps(); applyCaps(); syncClouds(); nightKills=0; lastSides=sidesActive(); introT=0; save(); }
function startPlay(){ if(started) return; const it=$('intro'); if(it) it.remove(); const gg=S.groundGold||0; S.groundGold=0; started=true; renderHud();
  if(!S.started){ resetRun(1); initRegions(); startBanner(); return; }
  const post=S.won&&!S.failed&&S.post; const re=!!S.nightRe; delete S.nightRe; if(!S.nightOn&&!S.won&&!S.failed) restoreDay(); if(gg>0){ const n=Math.min(20,Math.max(3,Math.round(gg/15))); dropCoins(STALL_FRONT.clone().setY(1),n,gg/n,2.2,1); }
  if(S.won&&!S.failed&&!post) nextSefer(true); S.revealed=S.revealed||{}; for(const id in REG) if(REG[id].sefer<=S.level&&id!==S.pendingReveal) S.revealed[id]=true;
  if(S.pendingRefund>0){ S.coins+=S.pendingRefund; S.pendingRefund=0; } cartsRestore();
  initRegions(); if(S.failed||re) retryNight(true); if(re&&!S.failed) S.dayGrace=waveT; /* FX1: gece ortası yeniden yükleme Geceyi başlat altınını yeniden vermez */ runOver=!!post; if((S.cardPending||S.cardOffer)&&!S.failed) setTimeout(showCardPick,1200); if(S.nightOn&&!S.failed){ noRegen=true; waveT=4; } const off=offlineRun(S.lastSeen?(Date.now()-S.lastSeen)/1000:0); S.lastSeen=Date.now(); save(); showOffline(off);
  if(re) setTimeout(()=>toast(T('🌙 Gece baştan başlıyor','🌙 The night starts over')),900); if(post) setTimeout(postFlow,600); else if(!runReveal()) startBanner(); }
$('startBtn').addEventListener('click',()=>{ audio(); startPlay(); });
if(CG.sdk&&CG.env!=='disabled'){ setTimeout(()=>{ const fresh=!S.started; startPlay(); if(fresh) loopHelp(); },150); }
// FX1: başlangıç kartı atlanan yeni oyuncuya hafif, engellemeyen döngü şeridi: 🪓 Kes › 🏹 Kur › 🌙 Savun › 💀 Patron; o anki adım parlar, 1. gece atlatılınca kaybolur (✕ ile de); geri dönen oyuncuda hiç çıkmaz
function loopHelp(){ if($('loopHelp')) return; const el=document.createElement('div'); el.id='loopHelp'; el.setAttribute('role','status'); const st=[['🪓',T('Kes','Chop')],['🏹',T('Kur','Build')],['🌙',T('Savun','Defend')],['💀',T('Patron','Boss')]];
  el.innerHTML=st.map(([i,n])=>`<span><i>${i}</i>${n}</span>`).join('<b>›</b>')+`<button aria-label="${T('Kapat','Close')}">✕</button>`; document.body.appendChild(el); const sp=[...el.querySelectorAll('span')]; let doneT=0;
  const bye=()=>{ clearInterval(iv); el.classList.add('out'); setTimeout(()=>el.remove(),600); }; el.querySelector('button').addEventListener('click',e=>{ e.stopPropagation(); bye(); });
  const iv=setInterval(()=>{ if(!document.body.contains(el)){ clearInterval(iv); return; } if(S.level>1||S.wave>2){ bye(); return; } const built=S.towers.some(t=>t.lvl>=1); const k=waveActive?2:S.wave>=2?3:built?2:(S.logs>0||S.wood>0)?1:0; sp.forEach((x,i)=>x.classList.toggle('on',i===k)); el.style.display=document.querySelector('.intro')?'none':''; if(k===3){ doneT+=0.5; if(doneT>8) bye(); } },500); }
if(S.started){ $('startBtn').textContent=T('Devam et','Continue'); const ir=$('introRet'); ir.textContent=endless()?chapTitle():T(`👑 ${S.level}. sefer · 🌙 ${S.wave}/${WAVES}`,`👑 Chapter ${S.level} · 🌙 ${S.wave}/${WAVES}`); ir.style.display='block'; document.querySelector('#intro .steps').style.display='none'; }
if(!isTouch) $('ctlHint').textContent=T('WASD: yürü · Tekerlek: yakınlaştır','WASD: walk · Wheel: zoom');

// reklam: SDK hiç geri dönmezse oyun sonsuza dek durmaz (başlamazsa 4 sn, başladıysa en çok 45/90 sn); ödüllü reklam bitmeden ödül yok
// ara reklam: herhangi bir reklamdan (ödüllü dahil) sonra en az 3 dk gösterilmez; iki reklam art arda gelmez (son reklam zamanı oturumda saklanır)
function adGap(){ let t=CG.lastMid||0; try{ t=Math.max(t,+sessionStorage.getItem('ob-lastAd')||0); }catch(e){} return Date.now()-t; }
function adMark(){ CG.lastMid=Date.now(); try{ sessionStorage.setItem('ob-lastAd',String(CG.lastMid)); }catch(e){} }
// FX1: istekten bitişe dek oyun kilitli (⏳ perdesi .intro: tick durur, gameplayStop gider); 12 sn'de başlamazsa oyun sürer, reklam yine de geç başlarsa oyun bitene dek yeniden kilitlenir.
// ara reklam: oturumda en az 2 dk gerçek oynanıştan önce yok (CG.playSec, frame)
function adWait(on){ let w=$('adWait'); if(on&&!w){ w=document.createElement('div'); w.className='intro'; w.id='adWait'; w.innerHTML='<div class="card" role="status" aria-label="'+T('Reklam yükleniyor','Loading ad')+'" style="max-width:110px;font-size:36px;padding:14px">⏳</div>'; document.body.appendChild(w); } else if(!on&&w) w.remove(); }
function cgAd(type,onDone,onFail){ if(!CG.sdk||!ADS){ onFail&&onFail(); return; } if(type==='midgame'&&(adGap()<180000||(CG.playSec||0)<120)){ onFail&&onFail(); return; } let ended=false, wd=0, shown=false; const end=(ok)=>{ clearTimeout(wd); adMute=false; adWait(false); if(shown||ok) adMark(); if(ended) return; ended=true; if(ok){ onDone&&onDone(); } else onFail&&onFail(); };
  adWait(true); try{ CG.sdk.ad.requestAd(type,{adStarted:()=>{ adMute=true; shown=true; adMark(); adWait(true); clearTimeout(wd); wd=setTimeout(()=>{ end(false); },type==='rewarded'?90000:45000); },adFinished:()=>end(true),adError:()=>end(false)}); if(!ended&&!shown) wd=setTimeout(()=>{ if(!shown) end(false); },12000); }catch(e){ end(false); } }
// kayıt anında: kalan gündüz süresi ve yerdeki altın (toplanan altın bir daha yazılmaz, patron altını kaybolmaz)
function syncSave(){ if(!started) return; let gg=0; for(const c of coins) gg+=c.value||0; S.groundGold=Math.round(gg); S.dayT=waveActive||runOver?null:Math.max(0,Math.round(waveT*10)/10); }
saveHook=syncSave;
// gece başı kaydı: gece yarıda kalırsa bu kayıttan baştan başlar (tutarlı, tekrar toplanamaz)
function snapNight(){ S.nightSnap=null; if(!started) return; S.nightSnap={level:S.level,wave:S.wave,minGate:S.minGate}; } /* F9a: yalnız gece başı (tekrar deneme: yıldız sur değeri) */
// yüklemede gündüz kaldığı yerden sürer; en az 8 sn (aynı gündüz ikinci yüklemede 2 sn) oyuncu ekrana alışsın. Eski kayıt: tam gündüz
function restoreDay(){ const d=S.dayT; if(typeof d!=='number'||!(d>=0)){ waveT=dayLen(); return; } const g=Math.max(0,((S.dayGrace||0)>0?2:8)-d); waveT=Math.min(40,d+g); S.dayGrace=(S.dayGrace||0)+g; }
// patron gününde "Geceyi başlat" yalnız hazırsan görünür: sur dolu ve alınabilir savunma geliştirmesi kalmamış (küçük ödül için yarım surla patrona girilmesin)
// F8: 12 sn'den uzun süre alınabilir durup alınmayan ped (ulaşılamayan, adım bekleyen, oyuncunun istemediği) düğmeyi sonsuza dek gizlemez
function bossReady(){ if(S.gateHp<D.gateMax()*0.97) return false; return !pads.map(pd=>{ const k=pd.def.kind; const av=(k==='tower'||k==='wall'||k==='soldier'||k==='newTower')&&padVisible(pd)&&!pd.locked&&!pd.block&&padAvail(pd)&&(k!=='tower'||SIDES.indexOf(S.towers[pd.def.ti].side)<sidesActive());
  if(!av){ pd.affSince=null; return false; } const key=S.level*10+S.wave; if(pd.affKey!==key||pd.affSince==null){ pd.affKey=key; pd.affSince=gameT; } return gameT-pd.affSince<12; }).some(x=>x); }
function nightBonus(){ return Math.round(Math.max(0,waveT-(S.dayGrace||0))*(0.8+0.2*S.wave)); }
addEventListener('pagehide',save);
// FX1: arka plandaki sekmeye 60 sn+ sonra dönülünce yüklemedeki gibi çevrimdışı kazanç (aynı offlineRun/showOffline, aynı tavan); gizliyken lastSeen ilerlemez (p1 save)
function awayBack(){ const t=awayAt; awayAt=0; if(!t) return; if(!started||!S.started){ save(); return; } const sec=(Date.now()-(S.lastSeen||t))/1000; if(!(sec>=60)){ save(); return; }
  const off=offlineRun(sec); S.lastSeen=Date.now(); save(); if(document.querySelector('.intro')||runOver){ if((off.rows||[]).length){ showOffline.pend=off; clearTimeout(flushOffline.t); flushOffline.t=setTimeout(flushOffline,1500); } } else showOffline(off); }
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(!awayAt){ save(); awayAt=Date.now(); } } else awayBack(); });
addEventListener('pageshow',e=>{ if(e.persisted) awayBack(); });
// ---------- Kutlama efektleri: ışık sütunu, yer dalgası, parıltı, sarsıntı ----------
/* FX3: hareket azaltma — işletim sisteminin prefers-reduced-motion ayarı varsayılan; Krallık ekranından değiştirilebilir (S.meta.calm). Açıkken ekran sarsılmaz, yanıp sönen/nabız animasyonları durur */
const RMQ=(()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)'); }catch(e){ return {matches:false}; } })();
function calmOn(){ return S.meta&&typeof S.meta.calm==='boolean'?S.meta.calm:!!RMQ.matches; }
function applyCalm(){ try{ document.body.classList.toggle('calm',calmOn()); }catch(e){} } applyCalm(); try{ RMQ.addEventListener('change',applyCalm); }catch(e){}
let camShake=0; const fx=[]; const pillarGeo=new THREE.CylinderGeometry(1,1,1,18,1,true); const shakeOff=new THREE.Vector3();
function celebrate(at,power,quiet){ power=power||1; if(!quiet) camShake=Math.max(camShake,0.22+0.22*power); /* FX4: quiet = küçük alım: sarsıntı yok, az parıltı */
  const pm=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}); const pil=new THREE.Mesh(pillarGeo,pm); pil.position.set(at.x,5,at.z); pil.scale.set(0.2,10,0.2); scene.add(pil);
  const rm=new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}); const ring=new THREE.Mesh(new THREE.RingGeometry(0.8,1.15,40),rm); ring.rotation.x=-Math.PI/2; ring.position.set(at.x,0.12,at.z); scene.add(ring);
  fx.push({pil,ring,t:0,power}); burst(at.clone().setY(1.2),quiet?12:Math.round(18+16*power),M.gold,1.5,1.7); burst(at.clone().setY(0.5),10,M.plank,1.1,1.3); if(power>=1) SFX.fanfare(); else SFX.build(); }
function updateFx(dt){ for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.t+=dt; const k=f.t/0.9; if(k>=1){ scene.remove(f.pil); scene.remove(f.ring); f.pil.material.dispose(); f.ring.material.dispose(); f.ring.geometry.dispose(); fx.splice(i,1); continue; } const w=0.2+1.3*f.power*Math.sin(Math.min(1,k*3)*Math.PI/2); f.pil.scale.set(w*(1-k*0.6),10+5*k,w*(1-k*0.6)); f.pil.material.opacity=0.75*(1-k); const r=1+8*f.power*(1-Math.pow(1-k,3)); f.ring.scale.set(r,r,1); f.ring.material.opacity=0.9*(1-k); } }
// ---------- Mini harita ----------
const miniEl=$('mini'); const mctx=miniEl.getContext('2d'); let miniBase=null, miniT=0;
function drawMiniBase(){ const N=132; const c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'); const px=v=>(v+WORLD)/(2*WORLD)*N; x.fillStyle='#d7b989'; x.fillRect(0,0,N,N); x.fillStyle='#2f7d47'; for(const t of trees){ if(t.gone) continue; x.fillRect(px(t.x)-0.6,px(t.z)-0.6,1.3,1.3); } x.strokeStyle='#e3c898'; x.lineWidth=2; x.lineCap='round'; for(const s of SIDES){ const P=roadPath(s); x.beginPath(); P.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke(); } for(const [qx,qz] of QUARRIES){ x.fillStyle='#b9b3a6'; x.beginPath(); x.ellipse(px(qx),px(qz),4.5,3.8,0.6,0,7); x.fill(); } x.fillStyle='#63b85a'; x.fillRect(px(-H),px(-H),px(H)-px(-H),px(H)-px(-H)); x.strokeStyle='#7d5124'; x.lineWidth=2; x.strokeRect(px(-H),px(-H),px(H)-px(-H),px(H)-px(-H)); x.fillStyle='#e3c898'; for(const s of SIDES){ const [gx,gz]=sidePos(s,0,0); x.fillRect(px(gx)-2,px(gz)-2,4,4); } miniBase=c; }
function drawMini(){ if(!miniBase) drawMiniBase(); const N=132; const px=v=>(v+WORLD)/(2*WORLD)*N; mctx.drawImage(miniBase,0,0); const dot=(x,z,c,r)=>{ mctx.fillStyle=c; mctx.beginPath(); mctx.arc(px(x),px(z),r,0,7); mctx.fill(); };
  for(const w of workers) dot(w.guy.g.position.x,w.guy.g.position.z,'#fff8e7',1.6); for(const c of collectors) dot(c.guy.g.position.x,c.guy.g.position.z,'#fff8e7',1.6); for(const so of soldiers) dot(so.guy.g.position.x,so.guy.g.position.z,'#3d63c9',1.8); mctx.lineWidth=1; mctx.strokeStyle='#1b1b1b'; mctx.fillStyle='#ff7a1a'; for(const e of enemies){ if(e.dead) continue; const X=px(e.g.position.x), Y=px(e.g.position.z), r=e.boss?4.5:2.8; mctx.beginPath(); mctx.moveTo(X,Y-r); mctx.lineTo(X+r,Y); mctx.lineTo(X,Y+r); mctx.lineTo(X-r,Y); mctx.closePath(); if(e.boss){ mctx.fillStyle='#ff3b30'; mctx.fill(); mctx.strokeStyle='#fff'; mctx.lineWidth=1.5; mctx.stroke(); mctx.fillStyle='#ff7a1a'; mctx.strokeStyle='#1b1b1b'; mctx.lineWidth=1; } else { mctx.fill(); mctx.stroke(); } } /* FX3: düşman = koyu kenarlı turuncu baklava (renk körü dostu: biçimle ayrılır) */
  // bu gece hangi kapıdan kaç düşman: kırmızı rozet + sayı (eski yazılı satırın yerine)
  if(plan&&(!waveActive||spawnQueue>0)){ for(const s of SIDES){ const n=plan.cnt[s]; if(!n) continue; const [gx,gz]=sidePos(s,0,16); const X=px(gx), Y=px(gz); mctx.fillStyle='#d63a3a'; mctx.beginPath(); mctx.arc(X,Y,8,0,7); mctx.fill(); mctx.strokeStyle='#fff'; mctx.lineWidth=1.5; mctx.stroke(); mctx.fillStyle='#fff'; mctx.font='bold 10px sans-serif'; mctx.textAlign='center'; mctx.textBaseline='middle'; mctx.fillText(String(Math.min(99,n)),X,Y+0.5); } mctx.textBaseline='alphabetic'; }
  for(const s of fogGates()){ const [gx,gz]=sidePos(s,0,7); const X=px(gx), Y=px(gz); mctx.fillStyle='rgba(236,242,248,.92)'; mctx.strokeStyle='#5d6b7a'; mctx.lineWidth=1; for(const [ox,oy,r] of [[-4,1,4],[3,1,4.5],[0,-2,4.5]]){ mctx.beginPath(); mctx.arc(X+ox,Y+oy,r,0,7); mctx.fill(); mctx.stroke(); } for(const [ox,oy,r] of [[-4,1,3.3],[3,1,3.8],[0,-2,3.8]]){ mctx.beginPath(); mctx.arc(X+ox,Y+oy,r,0,7); mctx.fill(); } } /* F6: sisli kapı bulutu */
  const p=player.g.position; dot(p.x,p.z,'#ffd23f',3); mctx.strokeStyle='#2b3a2e'; mctx.lineWidth=1; mctx.beginPath(); mctx.arc(px(p.x),px(p.z),3,0,7); mctx.stroke();
  const hw=viewHalfW()*zoom, hh=hw*innerHeight/innerWidth; mctx.strokeStyle='rgba(255,255,255,.85)'; mctx.lineWidth=1; mctx.strokeRect(px(camTarget.x-hw),px(camTarget.z-hh),px(camTarget.x+hw)-px(camTarget.x-hw),px(camTarget.z+hh)-px(camTarget.z-hh)); }
miniEl.addEventListener('pointerdown',e=>{ e.stopPropagation(); audio(); const r=miniEl.getBoundingClientRect(); const wx=((e.clientX-r.left)/r.width)*2*WORLD-WORLD, wz=((e.clientY-r.top)/r.height)*2*WORLD-WORLD; const p=player.g.position; camPan.set(wx-p.x,0,wz-p.z); follow=false; recenterEl.classList.add('show'); });
// ---------- Döngü ----------
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; const halfW=viewHalfW(); const dist=camOff.length(); const hf=2*Math.atan(halfW/dist); camera.fov=2*Math.atan(Math.tan(hf/2)/camera.aspect)*180/Math.PI; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();
// telefon döndürülünce: bazı telefonlar yeni ekran boyunu biraz geç bildirir, birkaç kez yeniden ölç
function resizeSoon(){ resize(); for(const t of [120,350,800]) setTimeout(resize,t); }
addEventListener('orientationchange',resizeSoon); if(window.visualViewport) visualViewport.addEventListener('resize',resize); if(screen.orientation&&screen.orientation.addEventListener) screen.orientation.addEventListener('change',resizeSoon);
let zAuto=1; let last=performance.now(); const camTarget=new THREE.Vector3(); const camPos=new THREE.Vector3();
/* F6: gölge kamerası yalnız ekranda görünen zemine (ve 8 birim yüksekliğe) sığdırılır; eskiden oyuncu çevresinde 120×120 alan çiziliyordu */
const SUN_DIR=new THREE.Vector3(14,26,10).normalize(); let shKey='';
function fitShadow(){ const key=zoom.toFixed(2)+'|'+camera.aspect.toFixed(3)+'|'+camera.fov.toFixed(2); if(key===shKey) return; shKey=key;
  const cam=camera.clone(); cam.position.copy(camOff).multiplyScalar(zoom); cam.lookAt(0,0,0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const lc=new THREE.OrthographicCamera(); lc.position.copy(SUN_DIR).multiplyScalar(60); lc.lookAt(0,0,0); lc.updateMatrixWorld(); const inv=lc.matrixWorld.clone().invert(); const a=new THREE.Vector3(), b=new THREE.Vector3();
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(let i=0;i<=4;i++) for(let j=0;j<=4;j++){ a.set(-1+i/2,-1+j/2,0.5).unproject(cam).sub(cam.position).normalize(); const t=a.y<-1e-3?-cam.position.y/a.y:1e9; b.copy(cam.position).addScaledVector(a,Math.min(t,400)); b.y=0; const h=Math.hypot(b.x,b.z); if(h>85) b.multiplyScalar(85/h);
    for(const y of [0,8]){ a.set(b.x,y,b.z).applyMatrix4(inv); x0=Math.min(x0,a.x); x1=Math.max(x1,a.x); y0=Math.min(y0,a.y); y1=Math.max(y1,a.y); } }
  const sc=sun.shadow.camera; sc.left=x0-3; sc.right=x1+3; sc.bottom=y0-3; sc.top=y1+3; sc.near=1; sc.far=150; sc.updateProjectionMatrix(); }
function tick(dt){ gameT+=dt; updateGateMarks(dt); updatePlayer(dt); updateTrees(dt); updateRocks(dt); updateWorkers(dt); updateSoldiers(dt); updateTowers(dt); updatePads(dt); updateEnemies(dt); updateProjectiles(dt); updateBalls(dt); updateGates(dt); updateFliers(dt); updateChips(dt); updateCoins(dt); updateLoot(dt); updateCustomers(dt); updateCollectors(dt); updateTraderNpc(dt); updateFx(dt); updateEnding(dt); updateRegions(dt); updateMachineFx(dt); depotFx(); }
/* FX4: kendiliğinden kalite: gerçek kare aralığı ~3 sn boyunca uzunsa (>26 ms) bir kademe düşer, uzun süre akıcıysa (<18.5 ms, 30 sn+) bir kademe çıkar; seçilen kademe hatırlanır.
   2 = eski ayarlar · 1 = piksel oranı ≤1.25, gölge haritası 1024 · 0 = piksel oranı 1, gölge haritası 512, gölge iki karede bir. 90/120/144 Hz ekranlarda en çok 60 kare (telefon ısınmasın) */
const QG={tier:2,ema:16.7,hi:0,lo:0,t0:0,last:-1e9,upWait:30000,acc:0,prev:0,sh:0,maxPR:Math.min(window.devicePixelRatio||1,isMobile?1.75:2)};
try{ const t=localStorage.getItem('ob-q'); if(t==='0'||t==='1') QG.tier=+t; }catch(e){}
if(QG.tier===2&&isMobile&&navigator.deviceMemory&&navigator.deviceMemory<=2) QG.tier=1;
function applyQuality(){ const t=QG.tier, pr=t===2?QG.maxPR:t===1?Math.min(QG.maxPR,1.25):1; if(Math.abs(renderer.getPixelRatio()-pr)>0.01){ renderer.setPixelRatio(pr); resize(); }
  const ms=t===2?(isMobile?1024:2048):t===1?1024:512; if(sun.shadow.mapSize.x!==ms){ sun.shadow.mapSize.set(ms,ms); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } } renderer.shadowMap.autoUpdate=t>0; renderer.shadowMap.needsUpdate=true; }
applyQuality();
function setQuality(t){ t=Math.max(0,Math.min(2,t)); if(t===QG.tier) return; if(t<QG.tier&&QG.up) QG.upWait=Math.min(300000,QG.upWait*2); QG.up=t>QG.tier; QG.tier=t; QG.last=performance.now(); QG.hi=QG.lo=0; applyQuality(); try{ localStorage.setItem('ob-q',String(t)); }catch(e){} }
function qualityStep(now,iv){ iv=Math.min(100,iv); QG.ema+=(iv-QG.ema)*0.05; if(!started||document.hidden||document.querySelector('.intro')){ QG.t0=now; QG.hi=QG.lo=0; return; } if(now-QG.t0<4000) return; /* açılış/kart sonrası derleme takılmaları sayılmaz */
  if(QG.ema>26){ QG.hi+=iv; QG.lo=0; } else if(QG.ema<18.5){ QG.lo+=iv; QG.hi=Math.max(0,QG.hi-iv); } else { QG.hi=Math.max(0,QG.hi-iv*0.5); QG.lo=0; }
  if(QG.hi>3000&&QG.tier>0&&now-QG.last>4000) setQuality(QG.tier-1); else if(QG.lo>10000&&QG.tier<2&&now-QG.last>QG.upWait) setQuality(QG.tier+1); }
function frameRaf(now){ if(QG.prev) QG.acc+=now-QG.prev; QG.prev=now; if(QG.acc>0&&QG.acc<15.2){ requestAnimationFrame(frameRaf); return; } const iv=QG.acc||16.7; QG.acc=Math.max(0,Math.min(16.67,QG.acc-16.67)); qualityStep(now,iv); if(QG.tier===0&&(QG.sh^=1)) renderer.shadowMap.needsUpdate=true; frame(now); }
function frame(now){
  requestAnimationFrame(frameRaf);
  let dt=Math.min(0.05,(now-last)/1000); last=now; if(slowT>0){ slowT=Math.max(0,slowT-dt); dt*=1-0.72*Math.min(1,slowT/0.9); }
  camera.position.sub(shakeOff); shakeOff.set(0,0,0);
  const sdkPlay=started&&!document.querySelector('.intro')&&!adMute, playing=sdkPlay&&!document.hidden; if(sdkPlay!==CG.playing){ CG.playing=sdkPlay; cgCall(k=>sdkPlay?k.game.gameplayStart():k.game.gameplayStop()); } /* FX1: sekme gizlenince gameplayStop yollanmaz (SDK kendisi yapar) */
  if(playing){ CG.playSec=(CG.playSec||0)+dt; tick(dt); updateFloats(dt); updateLabels(); updateBubble(); autoSaveT+=dt; if(autoSaveT>5){ autoSaveT=0; save(); } }
  const p=player.g.position;
  if(follow){ camPan.multiplyScalar(Math.pow(0.001,dt)); } camTarget.set(p.x+camPan.x,0,p.z+camPan.z);
  { let n=0; if(waveActive&&!runOver) for(const e of enemies) if(!e.dead) n++; const zt=1+(camera.aspect<1?0.28:0.18)*clamp((n-8)/22,0,1); zAuto+=(zt-zAuto)*(1-Math.pow(0.55,dt)); if(window.__zA) zAuto=zt; /* test: hemen */ } /* F9b: kalabalık gecede kamera yavaşça biraz uzaklaşır (dikeyde daha çok), şafakta döner */
  zoom=lerp(zoom,Math.max(zoomTarget,Math.min(2.2,zoomTarget*zAuto)),1-Math.pow(0.002,dt)); camPos.copy(camTarget).addScaledVector(camOff,zoom); camera.position.lerp(camPos,1-Math.pow(0.0005,dt));
  camera.lookAt(camera.position.x-camOff.x*zoom,0,camera.position.z-camOff.z*zoom);
  if(camShake>0&&calmOn()) camShake=0; /* FX3 */
  if(camShake>0){ camShake=Math.max(0,camShake-dt); const k=camShake*camShake*2.4; shakeOff.set((Math.random()-0.5)*k,(Math.random()-0.5)*k,(Math.random()-0.5)*k); camera.position.add(shakeOff); }
  const nightT=waveActive?1:0; const nk=1-Math.pow(0.35,dt); night+=(nightT-night)*nk; applyNight(night); torchNight(night); /* FX4 */ musicTick(night);
  if(wallPop<1&&wallGroup){ wallPop=Math.min(1,wallPop+dt*2.2); const k=1-Math.pow(1-wallPop,3); wallGroup.scale.set(1,0.05+0.95*k*(1+0.12*Math.sin(wallPop*Math.PI)),1); }
  fitShadow(); { const lx=camera.position.x-camOff.x*zoom, lz=camera.position.z-camOff.z*zoom; sun.target.position.set(lx,0,lz); sun.position.set(lx,0,lz).addScaledVector(SUN_DIR,60); } /* F6: gölge ekranın gördüğü yere odaklı */
  renderHud(); miniT+=dt; if(miniT>0.12){ miniT=0; drawMini(); }
  updateBlobs(); /* FX4 */
  renderer.render(scene,camera);
}
requestAnimationFrame(frameRaf);
window.__dbg={setFollow:v=>{ follow=v; },routeGoal,avoidProps,MFX,CUT,MIL,FRG,DRL,LAKE,MDW,SWP,SNW,CST,DEP,DEPOT,initRegions,cards:{showWinCard,showFailCard,showEndCard},p7:{showBossWheel,showQuests,questEvent,ensureQuests,dawnRepair,ships,eArrows,bossChests,isWinter,get slowT(){ return slowT; }},get night(){ return night; },set night(v){ night=v; applyNight(v); },f8:{failTip,bossReady,chestGuide,upgradesLeft,questN,dayLen,banner,berth,get chestCall(){ return chestCall; },get offPend(){ return showOffline.pend; }},f6:{renderer,scene,sun,toast,planWave,fogLbl,fogGates,threatLbl,SHUT,MINE,WH,WH_FRONT,LIGHT,DRILL,CDRILL,IRON_PEAKS,SW_POOLS,SW_DEAD,HUT,MILL,MILL_IN,SAW,centerVia,propObstacles},p6:{fogSides,chests,spawnChest,openChest,boats,mushNodes,oreNodes,crysNodes,herbalists,miners,cminers,SHUT_FRONT,FORGE_FRONT,JEW_FRONT,CAUL,FORGE,JEW,lampPosts,fogK,SC,CU,PIER_B:PIER_END,castle,bossPhase,SW,IR,CO,SN,swampPile,coastPile,snowPile},bubblePadId:()=>bubblePad&&bubblePad.def.id+":"+(bubblePad.needLeave?"NL":"")+(playerMoving?"MV":""),carts,QCUT,MILL,RC,QC,animals,hunters,HHUT_FRONT,MC,nextSefer,restartSefer,revealRegion,offlineRun,showOffline,regionGuide,get pileFish(){ return S.rg.fishPile||0; },FS,fishers,DOCK_END,HUT_FRONT,fishPile,rebuildT:rebuildTowers,placeSpotRaw:(x,z)=>{ const r=placeSpot(x,z); return r.ok&&Math.hypot(r.x-x,r.z-z)<0.01; },cancelPlacing,rocksArr:()=>rocks,S,D,damageEnemy,killEnemy,player,trees,enemies,workers,soldiers,towers,pads,coins,loot,customers,plan:()=>plan,get waveActive(){return waveActive;},get waveT(){return waveT;},set waveT(v){waveT=v;},get runOver(){return runOver;},set runOver(v){runOver=v;},get placing(){return placing;},get moveTarget(){return moveTarget;},set moveTarget(v){moveTarget=v;},get guideTarget(){return guideTarget;},get zoom(){return zoom;},set zoom(v){zoom=v;},get zoomTarget(){return zoomTarget;},set zoomTarget(v){zoomTarget=v;},camera,camOff,camTarget,camPan,tick,startWave,resetRun,showMap,showCardPick,levelWon,gateBroken,placeSpot,placeGhostAt,confirmPlace,instantBuy,sidePos,setBack,setPile,setStonePile,dropCoins,addWorker,addSoldier,makeEnemy,planWaveX:planWave,expandBase,nightHp,nightCount,celebrate,STALL,DEPOT,get H(){return H;},startPlay,frameOnce:()=>frame(performance.now()),get follow(){return follow;}};
window.__dbg.fx4={QG,setQuality,applyQuality,BLOBS,blobIM,torchFx,get celebT(){ return celebT; },floats}; /* FX4: test erişimi */
}
