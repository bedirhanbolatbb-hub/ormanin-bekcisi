
// ---------- İnşa alanları (her şeyin max seviyesi 10) ----------
const pads=[]; const padById={};
const P=(x,z)=>()=>[x,z];
const nFree=k=>S.towers.filter(t=>!t.fixed&&t.k===k).length;
// 8 alan: Sur, Okçu kuleleri (kapı yanlarında), Topçu, Asker, Oduncu, Midilli, Genişlet, Tezgâh (+ 3. bölümden sonra Taşçı)
const PADS=[
  {id:'wall', ord:2, lock:T('Bir okçu kulesi','An Archer Tower'), name:T('Sur','Wall'), desc:T('Sur ve kapılar güçlenir','Stronger walls and gates'), res:l=>l>=3?'stone':'wood', pos:P(-2.9,-2.9), kind:'wall', key:'wall', cost:l=>l>=3?Math.round(24*Math.pow(1.45,l-3)):Math.round(30*Math.pow(1.6,l)), max:5, show:()=>S.towers.some(t=>t.lvl>=1)},
  {id:'soldier', ord:3, lock:T('Bir okçu kulesi','An Archer Tower'), name:T('Asker','Soldier'), desc:T('Saldırılan kapıya koşar','Runs to attacked gates'), res:'gold', pos:P(2.9,-2.9), kind:'soldier', key:'soldier', cost:l=>Math.round(35*Math.pow(1.45,l)), max:5, show:()=>S.towers.some(t=>t.lvl>=1)},
  {id:'worker', ord:4, lock:T('Sur 1','Wall 1'), name:T('Oduncu','Lumberjack'), desc:T('Senin yerine odun keser','Chops wood for you'), res:'gold', pos:P(-2.9,2.9), kind:'worker', key:'worker', cost:l=>Math.round(45*Math.pow(1.5,l)), max:4, show:()=>S.lv.wall>=1},
  {id:'feet', ord:5, lock:T('Bir asker','A Soldier'), name:T('Midilli','Pony'), desc:T('Hızlı koş, çok taşı','Run fast, carry more'), res:'gold', pos:P(-5.4,2.9), kind:'up', key:'feet', cost:l=>Math.round(30*Math.pow(1.4,l)), max:5, show:()=>S.lv.soldier>=1},
  {id:'trader', ord:6, lock:T('İlk ganimet satışı','First loot sale'), name:T('Tezgâh','Stall'), desc:T('Miğferler pahalı ve hızlı satılır','Helmets sell faster, for more'), res:'gold', pos:P(-5.4,-2.9), kind:'up', key:'trader', cost:l=>Math.round(40*Math.pow(1.4,l)), max:5, show:()=>(S.sold||0)>=1},
  {id:'newCannon', ord:7, lock:T('Gece 2','Night 2'), name:T('Topçu Kulesi','Cannon Tower'), desc:T('Gülle atar; yerini sen seç','Fires cannonballs; you place it'), res:'gold', pos:P(5.4,-2.9), kind:'newTower', tk:'c', cost:l=>Math.round(90*Math.pow(1.6,l)), max:3, show:()=>S.level>1||S.wave>=2, lvl:()=>nFree('c')},
  {id:'expand', ord:8, lock:T('Sur 2','Wall 2'), name:T('Genişlet','Expand'), desc:T('Sur büyür, merkez kule açılır','Walls grow, Central Tower unlocks'), res:'wood', pos:P(-2.9,-5.4), kind:'expand', key:'expand', cost:l=>Math.round(60*Math.pow(1.7,l)), max:2, show:()=>S.lv.wall>=2},
  {id:'stoneWorker', ord:9, lock:T('Taş Ocağı açılınca','Stone Quarry'), name:T('Taşçı','Quarryman'), desc:T('Senin yerine taş çıkarır','Quarries stone for you'), res:'gold', pos:P(-2.9,5.4), kind:'stoneWorker', key:'stoneWorker', cost:l=>Math.round(60*Math.pow(1.5,l)), max:3, show:()=>revealed('quarry')},
];
function towerPos(i){ const t=S.towers[i]; if(t.side==='C') return [0,0]; if(t.x!==undefined) return [t.x,t.z]; return sidePos(t.side,t.a,-1.5); }
// Kule alanı: sabit kuleler için kapının yanında, yeni kuleler için kulenin önünde, merkez için kule kurulunca güneyinde
function towerPadPos(i){ const t=S.towers[i]; if(t.side==='C') return t.lvl<1?[0,0]:[0,-2.9]; if(t.fixed) return sidePos(t.side,Math.sign(t.a)*2.4,-2.4); if(t.px!==undefined) return [t.px,t.pz]; return sidePos(t.side,t.a,-3.9); }
const FLANK_BASE={N:12,E:20,S:28,W:36};
function towerDef(i){ const t=S.towers[i]; const isC=t.side==='C'; const name=t.k==='c'?T('Topçu Kulesi','Cannon Tower'):isC?T('Merkez Kule','Central Tower'):T('Okçu Kulesi','Archer Tower'); const desc=t.k==='c'?T('Gülle atar, kalabalığı dağıtır','Fires cannonballs, scatters crowds'):isC?T('Uzun menzil, iki okçu','Long range, two archers'):T('Ok atar','Shoots arrows');
  return {id:'t'+i, ti:i, ord:isC?8.5:1, name, desc, kind:'tower', max:5, sc:isC?1.5:1.0, r:isC?2.4:1.9, pos:()=>towerPadPos(i), res:l=>l===0?'wood':l>=6?'plank':'gold', cost:l=>l===0?(isC?60:FLANK_BASE[t.side]):l>=6?Math.round((t.k==='c'?40:26)*Math.pow(1.35,l-6)):Math.round((t.k==='c'?70:35)*Math.pow(1.45,l-1)),
    lock: isC? T('Genişlet 1','Expand 1') : '', show:()=> isC? S.lv.expand>=1 : t.fixed? SIDES.indexOf(t.side)<sidesActive() : true }; }
function padLevel(d){ return d.kind==='tower'? S.towers[d.ti].lvl : d.kind==='newTower'? d.lvl() : (S.lv[d.key]||0); }
function padTexture(){ const c=document.createElement('canvas'); c.width=320; c.height=320; const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=4; return {c,tex}; }
function rr(x,X,Y,W,Hh,r){ x.beginPath(); x.moveTo(X+r,Y); x.lineTo(X+W-r,Y); x.quadraticCurveTo(X+W,Y,X+W,Y+r); x.lineTo(X+W,Y+Hh-r); x.quadraticCurveTo(X+W,Y+Hh,X+W-r,Y+Hh); x.lineTo(X+r,Y+Hh); x.quadraticCurveTo(X,Y+Hh,X,Y+Hh-r); x.lineTo(X,Y+r); x.quadraticCurveTo(X,Y,X+r,Y); x.closePath(); }
const PF='"Baloo 2","Nunito",sans-serif';
function fitFont(x,txt,w,fs,min,weight){ x.font=`${weight||'bold'} ${fs}px ${PF}`; while(x.measureText(txt).width>w&&fs>min){ fs-=2; x.font=`${weight||'bold'} ${fs}px ${PF}`; } return fs; }
function outlined(x,txt,cx,cy,fill,stroke,lw){ x.lineJoin='round'; x.strokeStyle=stroke; x.lineWidth=lw; x.strokeText(txt,cx,cy); x.fillStyle=fill; x.fillText(txt,cx,cy); }
// Alan kareleri yazısız: ne olduğu simgeyle, seviyesi noktalarla, fiyatı sayı + malzeme simgesiyle. Ad ve açıklama üstüne gelince baloncukta
const PAD_IC={wall:'🧱',soldier:'⚔️',worker:'🪓',feet:'🐴',trader:'🪖',newCannon:'💣',expand:'🏗️',stoneWorker:'⛏️',rod:'🎣',fisher:'🚣',net:'🕸️',fishhut:'🐟',bow:'🔪',hunter:'🦌',trap:'🪤',smoke:'🍖',cutter:'🪚',qcart:'🛒',mill:'💧',mcart:'🛒',lamp:'🏮',herbalist:'🌿',farm:'🍄',cauldron:'🧪',ironArrow:'🎯',ironWall:'🚪',miner:'⚒️',drill:'🔩',forge:'🔥',lighthouse:'🔦',boat:'⛵',harbor:'⚓',jeweler:'💍',cminer:'💎',cdrill:'💠'};
function padIcon(d){ if(d.kind==='tower'){ const t=S.towers[d.ti]; return t&&t.k==='c'?'💣':t&&t.side==='C'?'🏰':'🏹'; } return PAD_IC[d.id]||d.ic||'⭐'; }
const EMO='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
function drawIcon(x,ic,cx,cy,size,alpha){ x.save(); x.globalAlpha=alpha==null?1:alpha; x.fillStyle='#000'; x.font=`${size}px ${EMO}`; x.textAlign='center'; x.textBaseline='middle'; x.shadowColor='rgba(0,0,0,0.35)'; x.shadowBlur=10; x.shadowOffsetY=5; x.fillText(ic,cx,cy); x.restore(); }
function drawPips(x,lvl,max,cy,can){ const n=Math.max(1,Math.min(max,10)); const r=n>6?8:10, gap=n>6?23:29; const w=(n-1)*gap; for(let i=0;i<n;i++){ const cx=160-w/2+i*gap; x.beginPath(); x.arc(cx,cy,r,0,7); if(i<lvl){ x.fillStyle=can?'#ffd75e':'#d9cfae'; x.fill(); x.lineWidth=3; x.strokeStyle='rgba(90,60,0,0.45)'; x.stroke(); } else { x.fillStyle='rgba(0,0,0,0.28)'; x.fill(); x.lineWidth=3; x.strokeStyle='rgba(255,255,255,0.55)'; x.stroke(); } } }
function drawLocked(pd){ const x=pd.tex.c.getContext('2d'); x.clearRect(0,0,320,320); x.fillStyle='rgba(30,36,40,0.62)'; rr(x,16,16,288,288,34); x.fill(); x.strokeStyle='rgba(255,255,255,0.35)'; x.lineWidth=6; rr(x,16,16,288,288,34); x.stroke();
  drawIcon(x,padIcon(pd.def),160,128,118,0.42);
  x.fillStyle='#e6e0d4'; rr(x,130,214,60,46,9); x.fill(); x.strokeStyle='#e6e0d4'; x.lineWidth=10; x.beginPath(); x.arc(160,214,20,Math.PI,0); x.stroke(); x.fillStyle='#2b3138'; x.beginPath(); x.arc(160,236,8,0,7); x.fill();
  pd.tex.tex.needsUpdate=true; }
function drawPad(pd,lvl,cur,cost,can){ const x=pd.tex.c.getContext('2d'); x.clearRect(0,0,320,320); const res=padRes(pd); const wood=res==='wood', stone=res==='stone', plank=res==='plank', iron=res==='iron';
  const col= !can? '#3d4a43' : iron? '#4a5566' : plank? '#a8742e' : stone? '#5a6068' : wood? '#8a5a2a' : '#1f7a3f'; const col2= !can? '#2c3631' : iron? '#323a46' : plank? '#7c521c' : stone? '#3f444b' : wood? '#6a4320' : '#155a2c';
  const gr=x.createLinearGradient(0,0,0,320); gr.addColorStop(0,col); gr.addColorStop(1,col2); x.fillStyle=gr; rr(x,14,14,292,292,36); x.fill();
  x.strokeStyle=can?'#fff6d6':'rgba(255,255,255,0.45)'; x.lineWidth=8; rr(x,14,14,292,292,36); x.stroke();
  x.strokeStyle='rgba(0,0,0,0.18)'; x.lineWidth=4; rr(x,26,26,268,268,28); x.stroke();
  if(pd.def.max>1&&pd.def.max<50) drawPips(x,lvl,pd.def.max,50,can);
  drawIcon(x,padIcon(pd.def),160,pd.def.max>1?132:122,106,can?1:0.7);
  x.textAlign='center'; x.textBaseline='middle';
  if(pd.block){ /* F4: darboğaz — önce aşağı akıştaki yapı: ⬆ + onun simgesi */ x.font=`800 80px ${PF}`; outlined(x,'⬆',112,242,'#ffd75e','rgba(0,0,0,0.55)',10); drawIcon(x,PAD_IC[pd.block]||'⭐',196,238,74,1); pd.tex.tex.needsUpdate=true; return; }
  const num=String(Math.max(0,Math.ceil(cost-cur))); x.font=`800 86px ${PF}`; const nw=x.measureText(num).width; const iw=50; const total=nw+iw+14; const nx=160-total/2+nw/2; outlined(x,num,nx,240,can?'#ffffff':'#d8d2c0','rgba(0,0,0,0.5)',10);
  const ix=nx+nw/2+14+iw/2, iy=240;
  if(iron){ x.fillStyle='#9aa6b8'; rr(x,ix-24,iy-8,48,18,4); x.fill(); x.fillStyle='#c8d2e0'; rr(x,ix-18,iy-14,36,8,3); x.fill(); }
  else if(plank){ x.fillStyle='#e8b86a'; for(let k=0;k<3;k++){ rr(x,ix-26,iy-14+k*10,52,8,2); x.fill(); } x.strokeStyle='#8a5a20'; x.lineWidth=2; for(let k=0;k<3;k++){ rr(x,ix-26,iy-14+k*10,52,8,2); x.stroke(); } }
  else if(stone){ x.fillStyle='#c9c3b6'; rr(x,ix-24,iy-14,48,30,8); x.fill(); x.strokeStyle='#6f6a60'; x.lineWidth=3; x.stroke(); x.fillStyle='#e6e0d4'; rr(x,ix-16,iy-9,20,10,3); x.fill(); }
  else if(wood){ x.fillStyle='#c98d4e'; rr(x,ix-26,iy-12,52,24,11); x.fill(); x.fillStyle='#f0cd9c'; x.beginPath(); x.arc(ix+24,iy,12,0,7); x.fill(); x.strokeStyle='#8a5a30'; x.lineWidth=3; x.stroke(); }
  else { x.fillStyle='#ffc93a'; x.beginPath(); x.arc(ix,iy,20,0,7); x.fill(); x.strokeStyle='#8a5a00'; x.lineWidth=4; x.stroke(); x.fillStyle='#8a5a00'; x.font=`800 22px ${PF}`; x.fillText('$',ix,iy+1); }
  pd.tex.tex.needsUpdate=true; }
function makePad(def){
  const g=new THREE.Group(); const pp=def.pos(); g.position.set(pp[0],0,pp[1]);
  const tex=padTexture(); const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshBasicMaterial({map:tex.tex,transparent:true,depthWrite:false})); plane.rotation.x=-Math.PI/2; plane.position.y=0.05; plane.renderOrder=1;
  const fill=new THREE.Mesh(new THREE.PlaneGeometry(2.0,2.0),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:0.35,depthWrite:false})); fill.rotation.x=-Math.PI/2; fill.position.y=0.04; fill.scale.set(1,0.001,1);
  g.add(plane,fill); scene.add(g); g.scale.setScalar(0.001); const pd={def,g,plane,fill,tex,payT:0,pop:0,cool:0,last:'',shown:0,sc:def.sc||1,r:def.r||1.5}; pads.push(pd); padById[def.id]=pd; return pd; }
for(const d of PADS) makePad(d);
function ensureTowerPads(){ S.towers.forEach((t,i)=>{ if(!padById['t'+i]) makePad(towerDef(i)); }); }
ensureTowerPads();
function padCost(pd){ return pd.def.cost(padLevel(pd.def)); }
function padRes(pd){ const r=pd.def.res; return typeof r==='function'? r(padLevel(pd.def)) : r; }
function padVisible(pd){ return padLevel(pd.def)<pd.def.max && pd.def.show(); }
function padAvail(pd){ if(pd.block) return false; /* F4: darboğaz kilidi */ const need=padCost(pd)-(S.paid[pd.def.id]||0); const r=padRes(pd); return r==='iron'? need<=(S.iron||0)+0.01 : r==='plank'? need<=(S.planks||0)+0.01 : r==='wood'? need<=S.logs+S.wood+0.01 : r==='stone'? need<=S.stones+S.stone+0.01 : need<=S.coins+0.01; }
function layoutPads(){ for(const pd of pads){ const pp=pd.def.pos(); pd.g.position.set(pp[0],0,pp[1]); } }
function expandBase(){ S.lv.expand++; applyBase(); placeBuildings(); paintGround(); cullTrees(); cullRocks(); cullDecor(); buildWalls(S.lv.wall); buildGates(S.lv.wall); placeGates(); placeTorches(); rebuildTowers(); layoutPads(); if(typeof drawMiniBase==='function') drawMiniBase(); burst(new THREE.Vector3(0,1,H-4),30,M.plank,1.2); toast(T('Sur büyüdü!','Walls grew!'),'good'); }
function instantBuy(pd){ if(pd.block){ toast(blockHint(pd)); return; } const cost=padCost(pd); const cur=S.paid[pd.def.id]||0; const need=Math.max(0,cost-cur); const res=padRes(pd); const wood=res==='wood';
  if(res==='iron'){ if((S.iron||0)<need-0.01){ toast(T('⛓ Demir yetmiyor','⛓ Not enough iron')); return; } S.iron-=Math.ceil(need); }
  else if(res==='plank'){ if((S.planks||0)<need-0.01){ toast(T('🪵 Kereste yetmiyor','🪵 Not enough planks')); return; } S.planks-=Math.ceil(need); for(let i=0;i<Math.min(12,Math.ceil(need));i++) fly(DEPOT.clone().setY(1.2),pd.g.position.clone().setY(0.3),null,'plank',rand(3,5)); }
  else if(res==='stone'){ if(S.stones+S.stone<need-0.01){ toast(T('🪨 Taş yetmiyor','🪨 Not enough stone')); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.stones); S.stones-=fromBack; n-=fromBack; S.stone-=n; setBack(player); setStonePile(Math.min(18,S.stone)); for(let i=0;i<Math.min(12,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,'stone',rand(4,7)); }
  else if(wood){ if(S.logs+S.wood<need-0.01){ toast(T('🪵 Odun yetmiyor','🪵 Not enough wood')); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.logs); S.logs-=fromBack; n-=fromBack; S.wood-=n; setBack(player); setPile(Math.min(24,S.wood)); for(let i=0;i<Math.min(14,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,true,rand(4,7)); }
  else { if(S.coins<need-0.01){ toast(T('💰 Altın yetmiyor','💰 Not enough gold')); return; } S.coins-=need; for(let i=0;i<Math.min(14,Math.ceil(need/5)+3);i++) fly(player.g.position.clone().setY(2.4),pd.g.position.clone().setY(0.3),null,false,rand(4,7)); }
  S.paid[pd.def.id]=cost; SFX.pay(1); completePad(pd); }
function cancelPad(pd){ const cur=S.paid[pd.def.id]||0; if(cur<=0) return; const r=padRes(pd); if(r==='iron') S.iron=(S.iron||0)+Math.round(cur); else if(r==='plank') S.planks=(S.planks||0)+Math.round(cur); else if(r==='wood') S.wood+=Math.round(cur); else if(r==='stone'){ S.stone+=Math.round(cur); setStonePile(Math.min(18,S.stone)); } else S.coins+=cur; S.paid[pd.def.id]=0; pd.cool=2.5; setPile(Math.min(24,S.wood)); toast(T('↩ Geri verildi','↩ Refunded'),'good'); }
function completePad(pd){ const d=pd.def; S.paid[d.id]=0; pd.pop=1; pd.cool=1.2; if(d.kind!=='newTower') questEvent('buy',1);
  if(d.kind==='tower'){ S.towers[d.ti].lvl++; buildTower(d.ti); layoutPads(); }
  else if(d.kind==='newTower'){ if(!startPlacing(d.tk,d.cost(padLevel(d)),pd)) pd.needLeave=true; save(); return; }
  else if(d.kind==='wall'){ S.lv.wall++; buildWalls(S.lv.wall); buildGates(S.lv.wall); S.gateHp=D.gateMax(); }
  else if(d.kind==='worker'){ S.lv.worker++; addWorker(); }
  else if(d.kind==='stoneWorker'){ S.lv.stoneWorker++; addWorker('stone'); }
  else if(d.kind==='soldier'){ S.lv.soldier++; addSoldier(true); }
  else if(d.kind==='expand'){ expandBase(); }
  else if(d.kind==='collector'){ S.lv.collector=(S.lv.collector||0)+1; addCollector(); }
  else { S.lv[d.key]=(S.lv[d.key]||0)+1; if(d.onBuy) d.onBuy(); if(d.key==='axe') rebuildOrbit(); if(d.key==='depotLv'||d.key==='workerSpd'){ for(const w of workers){ w.cap=8+4*(S.lv.depotLv||0); w.speed=5+0.6*(S.lv.depotLv||0)+0.7*(S.lv.workerSpd||0); } } }
  const big=d.kind==='tower'||d.kind==='wall'||d.kind==='expand'||d.kind==='newTower'; const at=pd.g.position.clone(); if(d.kind==='tower'){ const tp=towerPos(d.ti); at.set(tp[0],0,tp[1]); }
  /* bir sonraki seviyeye yetmiyorsa ödeme kendiliğinden başlamaz: oyuncu pedden çıkıp bilerek geri gelmeli (ilk altın sessizce erimesin) */ if(padVisible(pd)&&!padAvail(pd)) pd.needLeave=true;
  celebrate(at,big?1:0.6); if(d.kind!=='newTower'){ const lv=padLevel(d); floatText(at,(d.kind==='tower'?(S.towers[d.ti].k==='c'?T('Topçu','Cannon'):T('Okçu','Archer'))+T(' Sv ',' Lv ')+lv:d.name+(d.max>1&&d.kind!=='worker'&&d.kind!=='soldier'?T(' Sv ',' Lv ')+lv:''))+'!','green'); } save(); }
let bubblePad=null;
// Kilitli alanlardan yalnız sıradaki (en küçük sıra numaralı) görünür; kalabalık olmasın
function nextLockedPad(){ const best={}; for(const pd of pads){ if(!pd.def.lock||pd.def.show()||padLevel(pd.def)>=pd.def.max) continue; const g=pd.def.grp||'base'; if(g!=='base'&&!revealed(g)) continue; if(!best[g]||(pd.def.ord||9)<(best[g].def.ord||9)) best[g]=pd; } return new Set(Object.values(best)); }
function updatePads(dt){ const p=player.g.position; bubblePad=null; const nextL=nextLockedPad(); let payPad=null, payD=1e9; for(const pd of pads){ if(!pd.g.visible) continue; const d=Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z); if(d<(pd.locked?pd.r*0.8:pd.r)&&d<payD){ payD=d; payPad=pd; } }
  for(const pd of pads){ const unlocked=pd.def.show(); const vis=padLevel(pd.def)<pd.def.max&&!placing&&(unlocked||nextL.has(pd)); if(!vis){ pd.shown=0; } pd.g.visible=vis; pd.locked=!unlocked; if(!vis) continue;
    if(pd.locked){ pd.wasLocked=true; pd.shown=Math.min(1,pd.shown+dt*2.5); pd.g.scale.set(0.6*pd.shown*pd.sc,1,0.6*pd.shown*pd.sc); pd.plane.position.y=0.05; pd.fill.scale.set(1,0.001,1); const key='L|'+padIcon(pd.def); if(key!==pd.last){ pd.last=key; drawLocked(pd); } if(pd===payPad) bubblePad=pd; continue; }
    const cost=padCost(pd); const paid=S.paid[pd.def.id]||0; const lvl=padLevel(pd.def);
    if(pd.wasLocked&&introT>3){ toast(T('✨ Yeni: '+pd.def.name,'✨ New: '+pd.def.name),'good'); SFX.build(); } pd.wasLocked=false;
    pd.shown=Math.min(1,pd.shown+dt*2.5); const ease=1-Math.pow(1-pd.shown,3); const over=pd.shown<1? ease*(1+0.18*Math.sin(pd.shown*Math.PI)) : 1;
    const pulse=(S.paid[pd.def.id]||0)<cost&&padAvail(pd)? 1+0.05*Math.sin(performance.now()/180) : 1;
    if(pd.pop>0){ pd.pop-=dt*2; const s2=1+Math.sin((1-pd.pop)*Math.PI)*0.25; pd.g.scale.set(s2*over*pd.sc,1,s2*over*pd.sc); } else pd.g.scale.set(over*pulse*pd.sc,1,over*pulse*pd.sc);
    pd.plane.position.y=0.05+(padAvail(pd)?0.02+0.02*Math.sin(performance.now()/180):0);
    pd.cool=Math.max(0,pd.cool-dt);
    const dpd=Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z); if(pd.needLeave&&dpd>pd.r+0.8) pd.needLeave=false; const nearAny=dpd<pd.r&&pd===payPad; if(nearAny) bubblePad=pd; const near=nearAny&&!playerMoving&&!pd.needLeave;
    if(near&&pd.cool<=0&&paid<cost&&!pd.block){ if(padRes(pd)==='gold'){ if(S.coins>0.01){ const rate=Math.max(60,cost/0.8); const amt=Math.min(rate*dt,S.coins,cost-paid); S.coins-=amt; S.paid[pd.def.id]=paid+amt; pd.payT-=dt; if(pd.payT<=0){ pd.payT=0.05; fly(p.clone().setY(2.4),pd.g.position.clone().setY(0.3),null,false,6); SFX.pay((paid+amt)/cost); } } }
      else if(padRes(pd)==='iron'){ pd.acc=(pd.acc||0)+Math.max(10,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.iron||0)>0&&cur<cost){ n--; S.iron--; cur++; S.paid[pd.def.id]=cur; SFX.pay(cur/cost); } }
      else if(padRes(pd)==='plank'){ pd.acc=(pd.acc||0)+Math.max(15,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.planks||0)>0&&cur<cost){ n--; S.planks--; cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.07; fly(DEPOT.clone().setY(1.2),pd.g.position.clone().setY(0.3),null,'plank',3.5); SFX.pay(cur/cost); } } }
      else if(padRes(pd)==='stone'){ pd.acc=(pd.acc||0)+Math.max(20,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.stones>0||S.stone>0)&&cur<cost){ n--; const fromBack=S.stones>0; if(fromBack){ S.stones--; } else { S.stone--; } cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.06; fly((fromBack?p.clone().setY(1.6):DEPOT.clone().setY(1.2)),pd.g.position.clone().setY(0.3),null,'stone',fromBack?6:4); SFX.pay(cur/cost); } } setBack(player); setStonePile(Math.min(18,S.stone)); }
      else { pd.acc=(pd.acc||0)+Math.max(20,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.logs>0||S.wood>0)&&cur<cost){ n--; const fromBack=S.logs>0; if(fromBack){ S.logs--; } else { S.wood--; } cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.06; fly((fromBack?p.clone().setY(1.6):DEPOT.clone().setY(1.2)),pd.g.position.clone().setY(0.3),null,true,fromBack?6:4); SFX.pay(cur/cost); } } setBack(player); setPile(Math.min(24,S.wood)); } }
    const cur=S.paid[pd.def.id]||0; const k=clamp(cur/cost,0,1); pd.fill.scale.set(1,Math.max(0.001,k),1); pd.fill.position.z=(1-k)*1.0;
    const can=padAvail(pd);
    const key=padIcon(pd.def)+'|'+lvl+'|'+pd.def.max+'|'+Math.ceil(cost-cur)+'|'+can+'|'+padRes(pd)+'|'+(pd.block||''); if(key!==pd.last){ pd.last=key; drawPad(pd,lvl,cur,cost,can); }
    if(cur>=cost-0.01) completePad(pd);
  } updateRangeRing(dt); }
// kule menzili: kule kurarken ya da kulenin alanında dururken yerde halka (neyi koruduğu görünsün)
const rangeRing=(()=>{ const g=new THREE.Group(); const ring=new THREE.Mesh(new THREE.RingGeometry(0.975,1,72),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.7,depthWrite:false})); const fill=new THREE.Mesh(new THREE.CircleGeometry(1,72),new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:0.1,depthWrite:false})); for(const m of [ring,fill]){ m.rotation.x=-Math.PI/2; g.add(m); } ring.position.y=0.07; fill.position.y=0.06; g.visible=false; scene.add(g); return {g,ring,fill,k:0,r:10}; })();
function updateRangeRing(dt){ let at=null, r=0, ok=true;
  if(placing&&placing.spot){ at=placing.spot; r=D.towerRange()+(placing.k==='c'?3:0); ok=placing.ok; }
  else if(bubblePad&&bubblePad.def.kind==='tower'&&!waveActive){ const t=towers[bubblePad.def.ti]; if(t){ at=t.g.position; r=D.towerRange()+(t.isC?8:0)+(t.kind==='c'?3:0); } }
  const R=rangeRing; R.k=Math.max(0,Math.min(1,R.k+(at?dt*4:-dt*5))); R.g.visible=R.k>0.01; if(!R.g.visible) return;
  if(at){ R.g.position.set(at.x,0,at.z); R.r=r; R.ring.material.color.setHex(ok?0xffffff:0xff6b5f); }
  const e=1-Math.pow(1-R.k,3); R.g.scale.setScalar(R.r*(0.85+0.15*e)); R.ring.material.opacity=0.7*e; R.fill.material.opacity=0.1*e; }

// ---------- Kuleler: okçu, topçu, merkez; sur kenarına yerleşir ----------
const towers=[];
function towerMesh(kind,lvl0,isC,gm){ const lvl=Math.min(lvl0,14); /* F9a: sonsuz seviyelerde boy/parça sayısı 14'te durur */ const mm=m=>gm||m; const g=new THREE.Group(); const sc=isC?1.35:1; const archers=[]; let top;
  const tier=lvl<=3?0:lvl<=6?1:2; const Hh=(2.4+lvl*0.3)*sc;
  if(tier===0){ for(const [lx,lz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=mesh(G.cyl,mm(M.woodDark),0.16,Hh,0.16); l.position.set(lx*0.9*sc,Hh/2,lz*0.9*sc); l.rotation.z=-lx*0.12; l.rotation.x=lz*0.12; g.add(l);} const brace=mesh(G.box,mm(M.wood),2.2*sc,0.12,0.12); brace.position.y=Hh*0.5; const brace2=brace.clone(); brace2.rotation.y=Math.PI/2; g.add(brace,brace2); }
  else { const body=mesh(G.cyl,mm(tier===2?M.stoneBlue:M.stone),1.05*sc,Hh,1.15*sc); body.position.y=Hh/2; g.add(body); const n=Math.round(6+lvl); for(let i=0;i<n;i++){ const b=mesh(G.box,mm(tier===2?M.stoneDark:M.stoneDark),rand(.4,.7),0.3,0.25,false); const a=rand(0,6.28); b.position.set(Math.cos(a)*1.05*sc,rand(0.4,Hh-0.5),Math.sin(a)*1.05*sc); b.rotation.y=-a; g.add(b);} if(tier===2){ const ring=mesh(G.cyl,mm(M.gold),1.2*sc,0.18,1.2*sc,false); ring.position.y=Hh-0.3; g.add(ring); } }
  const deck=mesh(tier?G.cyl:G.box,mm(M.plank),tier?1.45*sc:2.4*sc,0.25,tier?1.45*sc:2.4*sc); deck.position.y=Hh+0.12; g.add(deck);
  for(let i=0;i<8;i++){ const a=i/8*6.283; const r=mesh(G.box,mm(tier?M.stoneDark:M.woodDark),0.22,0.6,0.22); r.position.set(Math.cos(a)*1.25*sc,Hh+0.55,Math.sin(a)*1.25*sc); g.add(r);}
  if(lvl>=2&&kind==='a'){ for(const [px,pz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const r=mesh(G.cyl,mm(M.woodDark),0.08,1.8,0.08); r.position.set(px*sc,Hh+1.2,pz*sc); g.add(r);} const roof=mesh(tier===2?G.cone:G.cone4,mm(lvl>=10?M.flag:tier===2?M.stoneBlue:M.banner),1.9*sc,1.1+0.3*tier,1.9*sc); roof.position.y=Hh+2.6; roof.rotation.y=Math.PI/4; g.add(roof); if(lvl>=10){ const orb=mesh(G.sph,mm(M.gold),0.3,0.3,0.3,false); orb.position.y=Hh+3.5; g.add(orb);} }
  for(let i=0;i<Math.min(lvl-1,4);i++){ const fl=mesh(G.box,mm(M.flag),0.5,0.35,0.04,false); fl.position.set(1.2*sc,Hh-0.5-i*0.45,0.0); fl.rotation.y=Math.PI/2; g.add(fl); }
  if(kind==='a'){ const n=isC?2:1; for(let i=0;i<n;i++){ const ar=makeGuy('soldier'); ar.g.position.set(isC?(i?0.6:-0.6):0,Hh+0.25,0); ar.g.scale.setScalar(0.85); if(gm){ ar.g.traverse(o=>{ if(o.isMesh) o.material=gm; }); } g.add(ar.g); archers.push(ar);} top=new THREE.Vector3(0,Hh+1.4,0); }
  else { const base=mesh(G.box,mm(M.iron),1.0,0.5,1.2); base.position.y=Hh+0.5; const barrel=new THREE.Group(); barrel.position.y=Hh+0.85; const tube=mesh(G.cyl,mm(M.iron),0.28+0.02*lvl,1.6+0.05*lvl,0.28+0.02*lvl); tube.rotation.x=Math.PI/2; tube.position.z=0.5; const rim=mesh(G.cyl,mm(tier===2?M.gold:M.metal),0.34+0.02*lvl,0.2,0.34+0.02*lvl,false); rim.rotation.x=Math.PI/2; rim.position.z=1.25; barrel.add(tube,rim); for(const x of [-0.55,0.55]){ const w=mesh(G.cyl,mm(M.woodDark),0.4,0.14,0.4,false); w.rotation.z=Math.PI/2; w.position.set(x,Hh+0.55,0); g.add(w);} g.add(base,barrel); archers.push({barrel,g:barrel,aim:false}); top=new THREE.Vector3(0,Hh+0.9,0); }
  bakeStatic(g); /* F6: kulenin durağan parçaları birleşir (okçu/namlu ayrı kalır) */ return {g,archers,top}; }
function buildTower(i){ const t=S.towers[i]; if(towers[i]){ scene.remove(towers[i].g); disposeBaked(towers[i].g); if(towers[i].bar) towers[i].bar.remove(); } if(t.lvl<1){ towers[i]=null; return; } const [x,z]=towerPos(i); const tm=towerMesh(t.k,t.lvl,t.side==='C'); tm.g.position.set(x,0,z); if(t.side!=='C'){ const d=SD[t.side]; tm.g.rotation.y=Math.atan2(d.o[0],d.o[1]); } scene.add(tm.g); tm.g.scale.setScalar(0.01);
  towers[i]={g:tm.g,archers:tm.archers,cd:rand(0,0.5),lvl:t.lvl,kind:t.k,isC:t.side==='C',pop:0,top:new THREE.Vector3(x,tm.top.y,z)}; }
function rebuildTowers(){ S.towers.forEach((t,i)=>{ buildTower(i); if(towers[i]) towers[i].pop=0.99; }); }
rebuildTowers(); layoutPads(); placeBuildings();
function updateTowers(dt){ for(const t of towers){ if(!t) continue; if(t.pop<1){ t.pop=Math.min(1,t.pop+dt*2.2); const s=t.pop<1? (1.18-0.18*Math.cos(t.pop*Math.PI*1.5))*t.pop : 1; t.g.scale.setScalar(Math.max(0.01,s)); if(t.pop<1) continue; t.g.scale.setScalar(1); }
  if(towerDownTick(t,dt)) continue;
  t.cd=Math.max(-0.05,t.cd-dt); const range=(D.towerRange()+(t.isC?8:0)+(t.kind==='c'?3:0))*fogK(t); const e=nearestEnemy(t.g.position,range);
  if(t.kind==='a'){ if(e){ const ang=Math.atan2(e.g.position.x-t.g.position.x,e.g.position.z-t.g.position.z)-t.g.rotation.y; for(const a of t.archers){ a.g.rotation.y=ang; a.aim=true; a.armR.rotation.x=lerp(a.armR.rotation.x,-1.4,dt*8); } if(t.cd<=0){ t.cd=1/((1.5+0.35*(t.lvl-1))*(t.isC?1.4:1)*D.towerRate()); for(const a of t.archers) shoot(t.top,e,D.towerDmg(t.lvl)*(t.isC?1.3:1)); } } else { for(const a of t.archers) a.aim=false; } for(const a of t.archers) animGuy(a,dt,false,1); }
  else { const b=t.archers[0].barrel; if(e){ const ang=Math.atan2(e.g.position.x-t.g.position.x,e.g.position.z-t.g.position.z)-t.g.rotation.y; b.rotation.y=lerp(b.rotation.y,ang,Math.min(1,dt*6)); if(t.cd<=0){ t.cd=1/(0.45+0.08*(t.lvl-1)); fireCannon(t,e); b.position.z=-0.35; } } b.position.z=lerp(b.position.z,0,Math.min(1,dt*4)); } } }
// Yerleştirme modu: yeni kule sur içinde boş bir yere; kulenin geliştirme alanı hemen yanına düşer
let placing=null;
function nearestSide(x,z){ return Math.abs(x)>Math.abs(z)? (x>0?'E':'W') : (z>0?'S':'N'); }
function reservedPads(){ const out=[]; for(const pd of pads){ if(pd.def.kind==='tower') continue; const pp=pd.def.pos(); out.push(pp); } S.towers.forEach((t,i)=>{ out.push(towerPadPos(i)); }); out.routes=cartRoutesRaw(); return out; }
function spotFree(x,z,res){ const lim=H-1.8; if(Math.abs(x)>lim||Math.abs(z)>lim) return false; if(Math.hypot(x,z)<3.6) return false;
  for(const s of SIDES){ const [a,b]=localOf(s,x,z); if(Math.abs(a)<2.6&&b>-4.5) return false; }
  for(let i=0;i<S.towers.length;i++){ const [tx,tz]=towerPos(i); if(Math.hypot(tx-x,tz-z)<2.7) return false; }
  for(const [px,pz] of res){ if(Math.hypot(px-x,pz-z)<2.3) return false; }
  for(const B of [DEPOT,STALL,CAMP]) if(Math.hypot(B.x-x,B.z-z)<3.4) return false; for(const R of (res.routes||cartRoutesRaw())) if(polyDist(R,x,z)<2.6) return false; /* araba yolu açık kalır */ return true; }
function padFor(x,z,res){ const base=Math.atan2(-z,-x); for(const da of [0,0.6,-0.6,1.2,-1.2,1.8,-1.8,Math.PI]){ const a=base+da; const px=x+Math.cos(a)*2.5, pz=z+Math.sin(a)*2.5; const lim=H-1.4; if(Math.abs(px)>lim||Math.abs(pz)>lim) continue; let ok=Math.hypot(px,pz)>=2.4; for(const [qx,qz] of res){ if(Math.hypot(qx-px,qz-pz)<2.3){ ok=false; break; } } if(ok) for(let i=0;i<S.towers.length;i++){ const [tx,tz]=towerPos(i); if(Math.hypot(tx-px,tz-pz)<2.0){ ok=false; break; } } if(ok) for(const B of [DEPOT,STALL,CAMP]) if(Math.hypot(B.x-px,B.z-pz)<3.0){ ok=false; break; } if(ok) return [px,pz]; } return null; }
function placeSpot(x,z){ const res=reservedPads(); const lim=H-1.8; const tryAt=(cx,cz)=>{ if(!spotFree(cx,cz,res)) return null; const pp=padFor(cx,cz,res); return pp? {x:cx,z:cz,px:pp[0],pz:pp[1],s:nearestSide(cx,cz),ok:true} : null; };
  x=clamp(x,-lim,lim); z=clamp(z,-lim,lim); let r=tryAt(x,z); if(r) return r;
  for(let rad=0.6;rad<=2*H;rad+=0.6){ const n=Math.max(8,Math.round(rad*5)); let best=null,bd=1e9; for(let k=0;k<n;k++){ const a=k/n*6.2832; const cx=x+Math.cos(a)*rad, cz=z+Math.sin(a)*rad; const t=tryAt(cx,cz); if(t){ const d=Math.hypot(cx-x,cz-z); if(d<bd){bd=d;best=t;} } } if(best) return best; }
  return {x,z,s:nearestSide(x,z),ok:false}; }
function startPlacing(k,refund,pd){ if(placing){ scene.remove(placing.ghost.g); } const sp=placeSpot(player.g.position.x,player.g.position.z);
  if(!sp.ok){ S.coins+=refund||0; toast(T('Yer yok — önce 🏗️ genişlet','No room — 🏗️ expand first')); return false; }
  const ghost=towerMesh(k,1,false,M.ghostOk); scene.add(ghost.g); placing={k,ghost,ok:false,spot:null,refund:refund||0,pd}; S.pendingRefund=refund||0; moveTarget=null; $('placeBar').style.display='flex';
  toast(isTouch?T('👆 Boş yere dokun','👆 Tap an empty spot'):T('🖱️ Boş yere tıkla','🖱️ Click an empty spot'),'good'); placeGhostAt(sp.x,sp.z); return true; }
function cancelPlacing(){ if(!placing) return; scene.remove(placing.ghost.g); S.coins+=placing.refund; S.pendingRefund=0; if(placing.pd) placing.pd.needLeave=true; placing=null; $('placeBar').style.display='none'; toast(T('↩ Geri verildi','↩ Refunded'),'good'); }
function pushOutOfTowers(p,r){ for(let i=9;i<S.towers.length;i++){ const t=S.towers[i]; if(t.x===undefined||t.lvl<1) continue; const dx=p.x-t.x, dz=p.z-t.z, d=Math.hypot(dx,dz); if(d<r&&d>0.001){ p.x=t.x+dx/d*r; p.z=t.z+dz/d*r; } } }
function placeGhostAt(x,z){ if(!placing) return; const sp=placeSpot(x,z); placing.spot=sp; placing.ok=sp.ok; placing.ghost.g.position.set(sp.x,0,sp.z); const d=SD[sp.s]; placing.ghost.g.rotation.y=Math.atan2(d.o[0],d.o[1]); const m=sp.ok?M.ghostOk:M.ghostBad; placing.ghost.g.traverse(o=>{ if(o.isMesh) o.material=m; }); }
function confirmPlace(){ if(!placing) return; const sp=placing.spot; if(!sp||!sp.ok){ toast(T('Buraya olmaz','Not here')); return; } scene.remove(placing.ghost.g); S.towers.push({k:placing.k,side:sp.s,a:0,x:sp.x,z:sp.z,px:sp.px,pz:sp.pz,lvl:1,fixed:false}); const i=S.towers.length-1; buildTower(i); ensureTowerPads(); applyCaps(); layoutPads(); S.pendingRefund=0; questEvent('buy',1); if(placing.pd) placing.pd.needLeave=true; placing=null; $('placeBar').style.display='none'; celebrate(new THREE.Vector3(sp.x,0,sp.z),1); floatText(new THREE.Vector3(sp.x,0,sp.z),T('Kule kuruldu!','Tower built!'),'green'); save(); }

// ---------- Askerler: düşmana göre kapılar arasında yer değiştirir ----------
const soldiers=[]; let assignT=0, lastAssignKey='';
function soldierSlot(side,i){ const row=Math.floor(i/2), sgn=i%2?1:-1; return sidePos(side,sgn*(1.6+0.7*row),1.3+1.2*row); }
function addSoldier(fresh){ const s=makeGuy('soldier'); s.g.position.set(fresh?rand(-1.2,1.2):rand(-2,2),0,fresh?4:rand(-H-3,-H-1)); s.g.rotation.y=Math.PI; scene.add(s.g); soldiers.push({guy:s,side:'N',slot:soldierSlot('N',soldiers.length),cd:rand(0,0.5),arrived:false,moving:false,speed:5.5}); lastAssignKey=''; }
for(let i=0;i<S.lv.soldier;i++) addSoldier(false);
function assignSoldiers(){ const n=soldiers.length; if(!n) return; const cnt={N:0,E:0,S:0,W:0}; let tot=0; for(const e of enemies){ if(e.dead) continue; cnt[e.side]++; tot++; }
  const want={N:0,E:0,S:0,W:0};
  if(tot===0){ const k=sidesActive(); for(let i=0;i<n;i++) want[SIDES[i%k]]++; }
  else { const act=SIDES.filter(s=>cnt[s]>0); for(const s of act) want[s]=Math.max(1,Math.floor(n*cnt[s]/tot)); let sum=act.reduce((a,s)=>a+want[s],0); while(sum>n){ const s=act.slice().sort((a,b)=>want[b]-want[a])[0]; want[s]--; sum--; } while(sum<n){ const s=act.slice().sort((a,b)=>cnt[b]/(want[b]+1)-cnt[a]/(want[a]+1))[0]; want[s]++; sum++; } }
  const key=SIDES.map(s=>want[s]).join(','); if(key===lastAssignKey) return; lastAssignKey=key;
  const free=soldiers.slice(); for(const s of SIDES){ for(let i=0;i<want[s];i++){ const [sx,sz]=soldierSlot(s,i); let bi=0,bd=1e9; free.forEach((so,j)=>{ const d=Math.hypot(so.guy.g.position.x-sx,so.guy.g.position.z-sz)-(so.side===s?4:0); if(d<bd){bd=d;bi=j;} }); const so=free.splice(bi,1)[0]; if(so.side!==s||Math.hypot(so.slot[0]-sx,so.slot[1]-sz)>0.1){ so.side=s; so.slot=[sx,sz]; so.arrived=false; } } } }
function updateSoldiers(dt){ assignT-=dt; if(assignT<=0){ assignT=0.5; assignSoldiers(); }
  for(const s of soldiers){ const g=s.guy.g, p=g.position; s.cd-=dt; s.moving=false; if(s.longStuck>5){ s.longStuck=0; s.stuckN=0; s.detourT=0; s.arrived=false; lastAssignKey=''; }
    const e=nearestEnemy(p,2.6);
    if(e){ g.rotation.y=Math.atan2(e.g.position.x-p.x,e.g.position.z-p.z); if(s.cd<=0){ s.cd=Math.max(0.22,0.7-0.05*(S.lv.soldierTrain||0)); s.guy.swing=0.3; damageEnemy(e,D.soldierDmg()); } }
    else { let chase=null,bd=8; for(const o of enemies){ if(o.dead||o.side!==s.side) continue; const d=Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z); if(d<bd&&!inW(o.g.position.x,o.g.position.z)){ bd=d; chase=o; } }
      if(chase){ walkTo(s,chase.g.position.x,chase.g.position.z,1.9,dt); }
      else if(!s.arrived){ if(walkTo(s,s.slot[0],s.slot[1],0.35,dt)) s.arrived=true; }
      else { const d=SD[s.side]; if(d) g.rotation.y=lerp(g.rotation.y,Math.atan2(d.o[0],d.o[1]),Math.min(1,dt*3)); else { s.side='N'; s.arrived=false; lastAssignKey=''; } } }
    animGuy(s.guy,dt,s.moving,0.9); } }

// ---------- Yardımcılar: toplayıcı, tüccar ----------
const collectors=[];
function addCollector(){ const g=makeGuy('worker'); g.tool.visible=false; g.g.position.set(rand(-2,2),0,rand(2,4)); scene.add(g.g); collectors.push({guy:g,state:'idle',logs:0,cap:12,moving:false,speed:6.5,target:null}); }
for(let i=0;i<(S.lv.collector||0);i++) addCollector();
function updateCollectors(dt){ for(const c of collectors){ const p=c.guy.g.position;
  if(c.longStuck>5){ c.longStuck=0; c.stuckN=0; c.detourT=0; if(c.target&&c.state==='toLoot'){ c.target.taken=false; c.target.auto=true; c.target.t=0; } c.target=null; c.home=null; c.state='idle'; }
  if(c.state==='idle'){ c.moving=false; let best=null,bd=1e9; for(const l of loot){ if(l.fly||l.auto||l.taken) continue; const d=Math.hypot(l.x-p.x,l.z-p.z); if(d<bd){bd=d;best=l;} } if(best&&c.logs<c.cap){ c.target=best; best.taken=true; c.state='toLoot'; } else if(c.logs>0){ c.state='toStall'; } else if(Math.hypot(p.x,p.z-3)>3){ if(!c.home) c.home=[rand(-2,2),rand(2,4)]; if(walkTo(c,c.home[0],c.home[1],1.2,dt)) c.home=null; } }
  else if(c.state==='toLoot'){ const l=c.target; c.tryT=(c.tryT||0)+dt; if(!l||!loot.includes(l)||l.fly||l.auto||c.tryT>8){ if(l&&loot.includes(l)&&c.tryT>8){ l.auto=true; l.t=0; } if(l) l.taken=false; c.tryT=0; c.state='idle'; continue; } if(walkTo(c,l.x,l.z,1.6,dt)){ c.tryT=0; const i=loot.indexOf(l); if(i>=0) loot.splice(i,1); c.logs++; setLootBack(c.guy,c.logs); c.state='idle'; } }
  else if(c.state==='toStall'){ if(walkTo(c,STALL.x+0.4,STALL.z+2.4,1.2,dt)){ c.sellT=(c.sellT||0)-dt; if(c.sellT<=0&&c.logs>0){ c.sellT=0.08; c.logs--; setLootBack(c.guy,c.logs); fly(p.clone().setY(1.4),stallDrop(),()=>{ S.stall++; },false,5); } if(c.logs<=0) c.state='idle'; } }
  animGuy(c.guy,dt,c.moving,0.9); } }
let traderNpc=null;
function updateTraderNpc(dt){ if(S.lv.trader>=1&&!traderNpc){ traderNpc=makeGuy('worker'); traderNpc.tool.visible=false; const hat=mesh(G.cone,M.flag,0.45,0.5,0.45); hat.position.y=2.1; traderNpc.root.add(hat); scene.add(traderNpc.g); } if(traderNpc) traderNpc.g.visible=S.lv.trader>=1; if(traderNpc){ traderNpc.g.position.set(STALL.x-0.15,0,STALL.z-0.15); traderNpc.g.rotation.y=Math.PI/4; animGuy(traderNpc,dt,false,1); traderNpc.armR.rotation.x=-0.6+Math.sin(performance.now()/300)*0.3; } }

// ---------- İşçiler ve yol bulma (dört kapı) ----------
const workers=[];
function addWorker(kind){ kind=kind||'wood'; const w=makeGuy('worker'); if(kind==='stone'){ w.tool.children[1].material=M.iron; const band=mesh(G.box,M.iron,0.66,0.1,0.66,false); band.position.y=1.7; w.root.add(band); } w.g.position.set(rand(-3,3),0,rand(2,5)); scene.add(w.g); workers.push({guy:w,kind,state:'idle',target:null,logs:0,cap:8+4*(S.lv.depotLv||0),timer:0,chopT:1,speed:5.0+0.6*(S.lv.depotLv||0)+0.7*(S.lv.workerSpd||0),moving:false}); }
for(let i=0;i<S.lv.worker;i++) addWorker('wood'); for(let i=0;i<(S.lv.stoneWorker||0);i++) addWorker('stone');
function insideWall(x,z,m){ return Math.abs(x)<H-m&&Math.abs(z)<H-m; }
function segHitsW(ax,az,bx,bz){ for(let s=0.1;s<=1;s+=0.04){ if(insideWall(ax+(bx-ax)*s,az+(bz-az)*s,0.25)) return true; } return false; }
const gIn=s=>sidePos(s,0,-1.8), gOut=s=>sidePos(s,0,2.4);
function inChannel(s,x,z){ const [a,b]=localOf(s,x,z); return Math.abs(a)<1.3&&b>-2.0&&b<2.6; }
function bestGate(px,pz,tx,tz){ let best='N',bd=1e9; for(const s of SIDES){ const i=gIn(s),o=gOut(s); const d=Math.hypot(px-i[0],pz-i[1])+Math.hypot(tx-o[0],tz-o[1]); if(d<bd){bd=d;best=s;} } return best; }
function routeGoal(p,tx,tz){ return centerVia(p,routeGoal0(p,tx,tz),tx,tz); }
/* F6: merkez kulenin etrafından dolaş — yol merkeze 2.3'ten yakın geçiyorsa teğet noktaya, sonra yay boyunca */
function centerVia(p,g,tx,tz){ if(S.towers[0].lvl<1) return g; const px=p.x,pz=p.z, dx=g[0]-px, dz=g[1]-pz, L2=dx*dx+dz*dz; if(L2<1e-4) return g;
  const t=-(px*dx+pz*dz)/L2; if(t<=0.02||t>=0.98) return g; const cx=px+dx*t, cz=pz+dz*t; if(Math.hypot(cx,cz)>=2.3) return g;
  const R=2.8, dp=Math.max(0.01,Math.hypot(px,pz)), ap=Math.atan2(pz,px); let sg=Math.hypot(cx,cz)>0.05?Math.sign(px*cz-pz*cx):0; if(!sg) sg=Math.sign(px*tz-pz*tx)||Math.sign(px*g[1]-pz*g[0])||1;
  const a=ap+sg*(dp>R+0.05?Math.acos(R/dp)+0.15:0.55); return [Math.cos(a)*R,Math.sin(a)*R]; }
function routeGoal0(p,tx,tz){
  const inP=inW(p.x,p.z), inT=inW(tx,tz); const ch=SIDES.find(s=>inChannel(s,p.x,p.z));
  if(inP&&inT){ if(ch){ const b=localOf(ch,p.x,p.z)[1]; if(b>-1.3) return gIn(ch); } return [tx,tz]; }
  if(inP&&!inT){ const s=ch||bestGate(p.x,p.z,tx,tz); const i=gIn(s); if(ch||Math.hypot(p.x-i[0],p.z-i[1])<0.6) return gOut(s); return i; }
  if(!inP&&inT){ const s=ch||bestGate(tx,tz,p.x,p.z); const o=gOut(s); if(ch||Math.hypot(p.x-o[0],p.z-o[1])<0.6) return gIn(s); if(segHitsW(p.x,p.z,o[0],o[1])) return cornerVia(p,o[0],o[1]); return avoidProps(p,o[0],o[1]); }
  if(segHitsW(p.x,p.z,tx,tz)) return cornerVia(p,tx,tz); return avoidProps(p,tx,tz);
}
function cornerVia(p,tx,tz){ const e=H+2.4; const cs=[[-e,-e],[e,-e],[-e,e],[e,e]]; const costFrom=c=>{ if(!segHitsW(c[0],c[1],tx,tz)) return Math.hypot(tx-c[0],tz-c[1]); let b=1e9; for(const c2 of cs){ if(c2===c||segHitsW(c[0],c[1],c2[0],c2[1])||segHitsW(c2[0],c2[1],tx,tz)) continue; b=Math.min(b,Math.hypot(c2[0]-c[0],c2[1]-c[1])+Math.hypot(tx-c2[0],tz-c2[1])); } return b; }; let best=null,bd=1e9; for(const c of cs){ const dp=Math.hypot(c[0]-p.x,c[1]-p.z); if(dp<1.6) continue; if(segHitsW(p.x,p.z,c[0],c[1])) continue; const d=dp+costFrom(c); if(d<bd){bd=d;best=c;} } if(!best){ for(const c of cs){ const dp=Math.hypot(c[0]-p.x,c[1]-p.z); if(dp>=1.6&&dp<bd){bd=dp;best=c;} } } return best||[tx,tz]; }
function wallCollide(p,r,holeFn){ const ax=Math.abs(p.x), az=Math.abs(p.z);
  if(ax<H&&az<H){ const dx=H-ax, dz=H-az;
    if(dx<r&&dx<=dz){ const s=p.x>0?'E':'W'; if(az>=holeFn(s)) p.x=Math.sign(p.x)*(H-r); }
    else if(dz<r){ const s=p.z>0?'S':'N'; if(ax>=holeFn(s)) p.z=Math.sign(p.z)*(H-r); } }
  else { const cx=clamp(p.x,-H,H), cz=clamp(p.z,-H,H); let dx=p.x-cx, dz=p.z-cz; const d=Math.hypot(dx,dz); if(d>=r) return;
    let s; if(Math.abs(dx)>=Math.abs(dz)) s=dx>0?'E':'W'; else s=dz>0?'S':'N'; const a=(s==='E'||s==='W')?cz:cx; if(Math.abs(a)<holeFn(s)) return;
    if(d<1e-4){ dx=s==='E'?1:s==='W'?-1:0; dz=s==='S'?1:s==='N'?-1:0; } else { dx/=d; dz/=d; }
    p.x=cx+dx*r; p.z=cz+dz*r; } }
function walkTo(w,tx,tz,stopDist,dt){ const p=w.guy.g.position; if(!isFinite(p.x)||!isFinite(p.z)){ p.set(rand(-1,1),0,4); w.detourT=0; w.stuckN=0; } const dReal=Math.hypot(tx-p.x,tz-p.z); if(dReal<=stopDist){ w.moving=false; w.stuckT=0; return true; }
  let [gx,gz]=routeGoal(p,tx,tz);
  if(w.detourT>0){ w.detourT-=dt; gx=w.detour[0]; gz=w.detour[1]; }
  const dx=gx-p.x, dz=gz-p.z, d=Math.hypot(dx,dz); if(d<0.05){ return false; }
  const ox=p.x, oz=p.z; p.x+=dx/d*w.speed*dt; p.z+=dz/d*w.speed*dt; wallCollide(p,0.6,()=>2.3); pushOutOfTrunks(p,1.2); pushOutOfCenter(p,1.8); pushOutOfTowers(p,1.5);
  const adv=Math.hypot(p.x-ox,p.z-oz); if(adv<w.speed*dt*0.35){ w.longStuck=(w.longStuck||0)+dt; } else if(adv>w.speed*dt*0.8){ w.longStuck=0; w.okT=(w.okT||0)+dt; if(w.okT>1){ w.stuckN=0; } }
  if(adv<w.speed*dt*0.35&&!(w.detourT>0)){ w.stuckT=(w.stuckT||0)+dt; if(w.stuckT>0.25){ w.stuckT=0; w.okT=0; w.stuckN=(w.stuckN||0)+1; let ang; if(w.stuckN<=2){ const sg=(w.dodge=(w.dodge||1)*-1); ang=Math.atan2(dz,dx)+sg*Math.PI/2; } else ang=rand(0,6.28); const L=3+Math.min(4,w.stuckN); w.detour=[p.x+Math.cos(ang)*L,p.z+Math.sin(ang)*L]; w.detourT=0.7+0.1*w.stuckN; } } else if(!(w.detourT>0)) w.stuckT=0;
  w.guy.g.rotation.y=Math.atan2(dx,dz); w.moving=true; return false; }
function updateWorkers(dt){
  for(const w of workers){ const g=w.guy.g, p=g.position;
    const st=w.kind==='stone';
    if(w.state==='idle'){ w.moving=false; const t=st?nearestRock(p,200,w):nearestTree(p,140,w); if(t){ t.claimed=w; w.target=t; w.state='toTree'; w.chopT=1; } }
    if(w.longStuck>5){ w.longStuck=0; w.stuckN=0; w.detourT=0; if(w.target){ w.target.claimed=null; } w.target=null; w.state=w.logs>0?'toDepot':'idle'; }
    else if(w.state==='toTree'){ const t=w.target; if(!t.alive||t.gone){ t.claimed=null; w.state='idle'; continue; } if(walkTo(w,t.x,t.z,st?2.4:2.0,dt)){ g.rotation.y=Math.atan2(t.x-p.x,t.z-p.z); w.chopT+=dt*1.1; if(w.chopT>=1){ w.chopT=0; w.guy.swing=0.3; if(st) hitRock(t,w.guy,()=>{ w.logs++; setStones(w.guy,w.logs); }); else hitTree(t,w.guy,()=>{ w.logs++; setLogs(w.guy,w.logs); }); } if(!t.alive){ t.claimed=null; w.state='wait'; w.timer=0; } } }
    else if(w.state==='wait'){ w.moving=false; w.timer+=dt; if(w.timer>0.7){ w.state = w.logs>=w.cap? 'toDepot':'idle'; } }
    else if(w.state==='toDepot'){ if(walkTo(w,DEPOT_FRONT.x,DEPOT_FRONT.z,1.6,dt)){ if(w.logs>0){ w.sellT=(w.sellT||0)-dt; if(w.sellT<=0){ w.sellT=0.08; w.logs--; if(st){ setStones(w.guy,w.logs); storeStone(p); } else { setLogs(w.guy,w.logs); storeLog(p); } } } else w.state='idle'; } }
    animGuy(w.guy,dt,w.moving,0.75);
  }
}

// ---------- Düşmanlar: dört yoldan, sıra sıra ----------
const enemies=[]; const projectiles=[]; const balls=[];
const EK={grunt:{hp:1,spd:1,atk:4,loot:1,arrow:1,cannon:1,sc:1,rad:1.15,name:T('asker','soldier')}, runner:{hp:0.5,spd:1.85,atk:3,loot:1,arrow:1,cannon:0.8,sc:0.85,rad:1.0,name:T('koşucu','runner')}, shield:{hp:2.2,spd:0.8,atk:6,loot:2,arrow:0.45,cannon:1.25,sc:1.1,rad:1.3,name:T('kalkanlı','shield bearer')}, ram:{hp:6,spd:0.62,atk:24,loot:4,arrow:0.6,cannon:1.6,sc:1,rad:1.8,name:T('kuşatma aracı','battering ram')}, poison:{hp:1.1,spd:1.05,atk:6,loot:1,arrow:1,cannon:1,sc:1,rad:1.15,name:T('zehirli','poisoner')}, knight:{hp:2.6,spd:0.85,atk:7,loot:2,arrow:0.35,cannon:1.2,sc:1.12,rad:1.3,name:T('şövalye','knight')}, pirate:{hp:1.2,spd:1.2,atk:5,loot:2,arrow:1,cannon:1,sc:1.02,rad:1.15,name:T('korsan','pirate')}, ice:{hp:1.5,spd:0.95,atk:5,loot:1,arrow:0.8,cannon:1.3,sc:1.05,rad:1.2,name:T('buz askeri','ice soldier')}, archer:{hp:0.8,spd:1,atk:3,loot:1,arrow:1,cannon:1.1,sc:0.95,rad:1.1,name:T('okçu','archer')}, wolf:{hp:0.55,spd:2.0,atk:3,loot:1,arrow:1,cannon:0.9,sc:1,rad:1.0,name:T('kurt','wolf')}, raider:{hp:0.8,spd:1.35,atk:4,loot:1,arrow:1,cannon:1,sc:0.95,rad:1.1,name:T('akıncı','raider')}, boss:{hp:14,spd:0.8,atk:12,loot:12,arrow:0.8,cannon:1.2,sc:1.9,rad:2.2,name:T('patron','boss')}};
const KING_HP=6, WARD_K=0.2;
function makeEnemy(kind,side){ const K=EK[kind]||EK.grunt; const w=gw(); const hp=Math.round(nightHp()*K.hp*((plan&&plan.mul&&plan.mul[side])||1)*(kind==='boss'&&bossOf().hat==='crown'?(window.__khp||KING_HP):1)); /* F9b: Kara Kral kapıda uzun bir dövüş: canı gece bütçesinin üstüne eklenir */ let g, guy=null, pushers=null, ramLog=null, wolf=null; const sc=K.sc*(kind==='boss'&&bossOf().sc||1); /* F6: patron boyu patrona göre */
  if(kind==='wolf'||(kind==='boss'&&bossOf().hat==='wolf')){ wolf=makeWolf(kind==='boss'); g=wolf.g; g.scale.setScalar(sc); }
  else if(kind==='ram'){ g=new THREE.Group(); const fr=new THREE.Group(); for(const x of [-0.6,0.6]){ const b=mesh(G.box,M.woodDark,0.22,0.3,2.8); b.position.set(x,0.55,0); fr.add(b);} for(const [x,z] of [[-0.8,-0.9],[0.8,-0.9],[-0.8,0.9],[0.8,0.9]]){ const wh=mesh(G.cyl,M.iron,0.36,0.16,0.36); wh.rotation.z=Math.PI/2; wh.position.set(x,0.36,z); fr.add(wh);} for(const z of [-0.8,0.8]){ const post=mesh(G.box,M.woodDark,1.5,0.16,0.16); post.position.set(0,1.3,z); fr.add(post); for(const x of [-0.6,0.6]){ const up=mesh(G.box,M.woodDark,0.14,0.9,0.14); up.position.set(x,0.95,z); fr.add(up);} } ramLog=new THREE.Group(); const lg=mesh(G.cyl,M.trunk,0.3,3.2,0.3); lg.rotation.x=Math.PI/2; ramLog.add(lg); const cap=mesh(G.cone,M.iron,0.36,0.5,0.36); cap.rotation.x=Math.PI/2; cap.position.z=1.85; ramLog.add(cap); for(const z of [-1,0.6]){ const band=mesh(G.cyl,M.iron,0.34,0.14,0.34,false); band.rotation.x=Math.PI/2; band.position.z=z; ramLog.add(band);} ramLog.position.set(0,1.05,0.2); fr.add(ramLog); const flag=mesh(G.box,M.enemy,0.05,0.5,0.7,false); flag.position.set(0,2.0,-0.9); fr.add(flag); g.add(fr); pushers=[]; for(const x of [-0.45,0.45]){ const pg=makeGuy('enemy'); pg.tool.visible=false; pg.g.position.set(x,0,-1.9); pg.armL.rotation.x=-1.4; pg.armR.rotation.x=-1.4; g.add(pg.g); pushers.push(pg);} }
  else { guy=makeGuy('enemy'); g=guy.g; g.scale.setScalar(sc);
    if(kind==='poison'){ const hood=mesh(G.cone,mat(0x4a8a3a),0.62,0.8,0.62); hood.position.y=2.0; guy.root.add(hood); guy.g.traverse(o=>{ if(o.material===M.enemy) o.material=mat(0x5aa84a); }); }
    if(kind==='knight'){ const hm=mesh(G.cyl,M.metal,0.62,0.6,0.62); hm.position.y=1.72; const pl=mesh(G.box,M.enemyDark,0.1,0.35,0.5,false); pl.position.y=2.15; guy.root.add(hm,pl); guy.g.traverse(o=>{ if(o.material===M.enemy) o.material=M.iron; }); const sh=mesh(G.box,M.metal,0.08,0.7,0.55); sh.position.set(0.05,-0.25,0.3); guy.armL.add(sh); }
    if(kind==='pirate'){ const brim=mesh(G.cyl,mat(0x1d1d22),0.72,0.07,0.45,false); brim.position.y=1.98; const top=mesh(G.cone,mat(0x1d1d22),0.45,0.4,0.3,false); top.position.y=2.2; guy.root.add(brim,top); }
    if(kind==='ice'){ const IM=M.iceBody||(M.iceBody=mat(0xe4f2fa)), IC=M.iceCrown||(M.iceCrown=mat(0x7fe0ff,{emissive:0x2a8ab8})); guy.g.traverse(o=>{ if(o.material===M.enemyHelm) o.material=IM; }); for(const x of [-0.42,0.42]){ const sp=mesh(G.cone,IC,0.12,0.4,0.12,false); sp.position.set(x,1.5,0); sp.rotation.z=-x*1.2; guy.root.add(sp); } for(const [x,z,h] of [[0,0,0.55],[-0.16,0.06,0.38],[0.16,0.06,0.38]]){ const cr=mesh(G.cone,IC,0.14,h,0.14,false); cr.position.set(x,1.95+h/2,z); guy.root.add(cr); } } /* F8: kırmızı düşman gövdesi (müttefik mavisiyle karışmaz) + karlı beyaz miğfer, buz taçı ve omuz buz dikenleri; ortak malzeme: düşman başına yeni malzeme yok */
    if(kind==='archer'){ const hood=mesh(G.cone,mat(0x6a4a2a),0.6,0.7,0.6); hood.position.y=2.0; guy.root.add(hood); const bow=mesh(G.box,M.woodDark,0.07,1.0,0.07,false); bow.position.set(0,-0.3,0.12); guy.armL.add(bow); guy.tool.visible=false; }
    if(kind==='raider'){ const band=mesh(G.box,mat(0x2f6fd6),0.66,0.14,0.66,false); band.position.y=1.66; guy.root.add(band); const tail=mesh(G.box,mat(0x2f6fd6),0.1,0.08,0.5,false); tail.position.set(-0.2,1.62,-0.42); guy.root.add(tail); }
    if(kind==='boss') applyBossLook(guy);
    if(kind==='shield'){ const sh=mesh(G.cyl,M.iron,0.62,0.08,0.62); sh.rotation.x=Math.PI/2; sh.position.set(0.05,-0.25,0.34); const boss2=mesh(G.sph,M.gold,0.14,0.14,0.08,false); boss2.position.set(0.05,-0.25,0.4); guy.armL.add(sh,boss2); const hm=mesh(G.sph,M.iron,0.66,0.46,0.66); hm.position.set(0,1.68,0); guy.root.add(hm); }
    if(kind==='runner'){ const band=mesh(G.box,M.enemyDark,0.62,0.12,0.62,false); band.position.y=1.66; guy.root.add(band); const tail=mesh(G.box,M.enemyDark,0.1,0.06,0.5,false); tail.position.set(0.2,1.62,-0.4); guy.root.add(tail); } }
  if(guy) bakeGuy(guy); if(pushers) pushers.forEach(bakeGuy); /* F6: parçalar boyandıktan sonra birleşir */
  const path=ROADS[side]; const off=rand(-0.5,0.5); const d=SD[side]; g.position.set(path[0][0]+d.t[0]*off+rand(-.3,.3),0,path[0][1]+d.t[1]*off+rand(-.3,.3)); scene.add(g);
  const bar=document.createElement('div'); bar.className='hpbar'+(kind==='boss'||kind==='ram'?' boss':''); bar.innerHTML='<i></i>'; document.body.appendChild(bar);
  enemies.push({g,guy,pushers,ramLog,wolf,kind,K,hp,maxHp:hp,boss:kind==='boss',shooter:kind==='archer'||(kind==='boss'&&bossOf().hat==='hood'),shootLeft:9,shootCd:rand(0.5,1.5),sc,rad:K.rad,side,speed:3.4*K.spd*rand(0.97,1.03),atk:K.atk*atkK(),atkCd:0,atkT:kind==='ram'?1.6:1.0,dead:false,hitT:0,wp:1,off,bar,swing:0,ramT:0});
}
let nightKills=0, runOver=false, slowT=0, gameT=0; let waveT=8, waveActive=false, spawnQueue=0, spawnT=0, spawnIdx=0, waveSeed=0, nightClock=0; let plan=null; let gateWarned=0, nightDmg={}; const alertQ=[]; let alertT=0;

// patron gecesi: patron dalganın ortasında (ordusuyla) varır, sonda tek başına değil; koçbaşı gelmez (3-4. gecelerde gelir), patronla sona yığılıp suru birden yıkmaz
function pickKind(i,total){ const L=S.level, n=S.wave, bn=n===WAVES; if(bn&&i===Math.floor(total*0.35)) return 'boss'; const r=Math.random(); if(L>=10){ const ks=['wolf','raider','knight','pirate','ice','poison','shield','archer']; if(r<0.7) return ks[Math.floor(Math.random()*ks.length)]; if(r>=0.86) return 'archer'; } else if(L>=3) return mixKind(i,L,n,bn,r); if(L>=2&&r<0.4&&r>=0.2) return 'raider'; if(L>=3&&n>=3&&!bn&&i%10===5) return 'ram'; if((L>=2||n>=4)&&r<0.16+0.02*L) return 'shield'; if(n>=2&&r<0.42+0.02*L) return 'runner'; return 'grunt'; }
/* F6: 3. seferden sonra yeni düşman eskisinin yerine geçmez, orduya eklenir: bölümün yeni türü %18, eski özel türler %12'yi paylaşır; akıncı, kalkanlı, okçu, koşucu hep var. Toplam can bütçesini balanceWave aynı tutar */
const MIX_NEW=[[3,'wolf'],[6,'poison'],[7,'knight'],[8,'pirate'],[9,'ice']];
function mixKind(i,L,n,bn,r){ if(n>=3&&!bn&&i%10===5&&r<(L>=5?0.46:0.6)) return 'ram'; const un=MIX_NEW.filter(([l])=>L>=l).map(([,k])=>k), nw=un.pop(); const w=[[nw,18],[ 'raider',10],['shield',5]]; for(const k of un) w.push([k,12/un.length]); if(L>=5) w.push(['archer',14]); if(n>=2) w.push(['runner',2*L+2]);
  let x=Math.random()*100; for(const [k,v] of w){ if(x<v) return k; x-=v; } return 'grunt'; }
// Zorluk eğrisi: gece ilerledikçe ve bölüm arttıkça düşman güçlenir. Kaybettiğin bölümde her denemede biraz yumuşar (en çok 3 kez).
const HPK0=window.__hpk||0; const hpkL=()=>HPK0||Math.min(2.6,2.1+0.25*(S.level-1));
function nightHp(){ const fails=Math.min(3,(S.meta.fails&&S.meta.fails[S.level])||0); const lvK=Math.pow(Math.pow(1.11,S.level-1),S.wave/WAVES); return hpkL()*9*Math.pow(window.__hpg||1.32,S.wave-1)*lvK*(1-0.08*fails); }
// Düşman vuruşu seferle güçlenir: geliştirilmiş sur da zorlanır, gece hep gergin kalır
function atkK(){ if(endless()) return (1+0.12*(LEVELS*WAVES-8))*Math.pow(EGR.atk,(eNight(S.level,S.wave)-1)/WAVES); return 1+0.12*Math.max(0,gw()-8); }
/* F9a: Sonsuz Kuşatma gece gece yumuşak büyür (eski: saldırı doğrusal sınırsız, gece 1-2 bedava, 19-20. seferde duvar). base/tilt: kapı başına can bütçesi; hp/atk/cnt: SEFER (5 gece) başına büyüme, gece gece dağıtılır */
const EGR={base:2000,tilt:[0,0.72,0.8,0.88,0.96,1.1],hp:1.21,atk:1.08,cnt:0.03}; window.__egr=EGR;
function nightCount(){ if(endless()){ const wE=2.5+0.5*S.wave; return Math.round((8+5*wE)*(1+0.06*(LEVELS-1)*wE/WAVES)*(1+EGR.cnt*(eNight(S.level,S.wave)-1)/WAVES)*(window.__cnt||1)); } return Math.round((8+5*S.wave)*(1+0.06*(S.level-1)*S.wave/WAVES)*(window.__cnt||1)); }
function planWave(){ const total=nightCount(); const k=sidesActive(); let seed=Math.floor(Math.random()*4); if(S.wave===WAVES&&bossOf().hat==='crown'&&k===4) seed=((-Math.floor(Math.floor(total*0.35)/4))%4+4)%4; /* F9b: Kara Kral ve muhafızı kalesinden, Kuzey yolundan çıkar */ const cnt={N:0,E:0,S:0,W:0}; const kinds=[]; const kc={}; for(let i=0;i<total;i++){ cnt[SIDES[(Math.floor(i/4)+seed)%k]]++; const kd=pickKind(i,total); kinds.push(kd); } midSpecials(kinds,seed,k); for(const kd of kinds) kc[kd]=(kc[kd]||0)+1; const via=kinds.map((kd,i)=>{ const p=pulseOf(i,total), P=pulsesOf(total); return (P<3||(p>0&&p<P-1))?planVia(kd,SIDES[(Math.floor(i/4)+seed)%k]):''; }); plan={seed,cnt,total,kinds,kc,via,id:Math.random()}; return plan; }
// F7: gece okunur DARBELER halinde gelir (7 düşmanda bir darbe, 2-7 darbe). Özel birlikler (koçbaşı, şövalye, sal, korsan gemisi) ilk ve son darbeye değil ortadakilere düşer.
function pulsesOf(n){ return clamp(Math.round(n/7),2,7); }
function pulseOf(i,n){ const P=pulsesOf(n); return Math.min(P-1,Math.floor(i*P/n)); }
const SPECIAL_K={ram:1,knight:1};
function midSpecials(kinds,seed,k){ const n=kinds.length, P=pulsesOf(n); if(P<3) return; const sd=i=>(Math.floor(i/4)+seed)%k; const edge=i=>{ const p=pulseOf(i,n); return p===0||p===P-1; };
  for(let j=0;j<n;j++){ if(!SPECIAL_K[kinds[j]]||!edge(j)) continue; let m=-1; for(let q=0;q<n;q++){ if(edge(q)||SPECIAL_K[kinds[q]]||kinds[q]==='boss') continue; if(sd(q)===sd(j)){ m=q; break; } if(m<0) m=q; } if(m>=0){ const t=kinds[m]; kinds[m]=kinds[j]; kinds[j]=t; } } }
// her düşmanın doğma anı, menzile VARIŞI kendi darbesine denk gelecek şekilde: yavaşlar erken çıkar, sal/gemi yolunun süresi hesaba katılır; ilk darbe ~8 sn'de kulelerin menzilinde (gece boş başlamaz)
function scheduleWave(pl){ const n=pl.total, P=pulsesOf(n), k=sidesActive(), gap=clamp(34/(P-1),5,8); pl.at=[]; pl.adv=[]; const inP={};
  for(let i=0;i<n;i++){ const p=pulseOf(i,n); const j=inP[p]=(inP[p]||0)+1; const arr=8+p*gap+(j-1)*0.45; const side=SIDES[(Math.floor(i/4)+pl.seed)%k]; const K=EK[pl.kinds[i]]||EK.grunt; const via=(pl.via&&pl.via[i])||''; const ap=approachOf(side,via); const sp=3.4*K.spd;
    let st=arr-(ap.d/sp+ap.s), adv=0; if(st<0){ if(!via) adv=Math.min(28,-st*sp); st=0; } pl.at.push(st); pl.adv.push(adv); }
  pl.order=[...Array(n).keys()].sort((a,b)=>pl.at[a]-pl.at[b]||a-b); pl.done=[]; }
function advanceOnRoad(e,dist){ const path=ROADS[e.side], d0=SD[e.side]; let x=e.g.position.x, z=e.g.position.z; while(dist>0.01&&e.wp<path.length){ const tx=path[e.wp][0]+d0.t[0]*e.off, tz=path[e.wp][1]+d0.t[1]*e.off; const seg=Math.hypot(tx-x,tz-z); if(seg<=dist){ dist-=seg; x=tx; z=tz; e.wp++; } else { x+=(tx-x)/seg*dist; z+=(tz-z)/seg*dist; dist=0; } } e.g.position.x=x; e.g.position.z=z; }
function planText(){ if(!plan) planWave(); let t=SIDES.filter(s=>plan.cnt[s]>0).map(s=>SIDE_TR[s]+' '+plan.cnt[s]).join(' · '); const ex=[]; if(plan.kc.shield) ex.push(T('kalkanlı '+plan.kc.shield,'shield '+plan.kc.shield)); if(plan.kc.ram) ex.push(T('kuşatma '+plan.kc.ram,'siege '+plan.kc.ram)); if(plan.kc.boss) ex.push(T('patron','boss')); if(ex.length) t+=' · '+ex.join(', '); return t; }
// F7: bir kapının anlık savunma gücü (kule dps'i). Zorluk artık bunu İZLEMEZ (bkz. REF_DPS); yalnız test/ölçüm için (window.__rho).
function defenseDps(side,mA,mC){ const [gx,gz]=sidePos(side,0,2.5); let dps=0; for(const t of towers){ if(!t) continue; const range=D.towerRange()+(t.isC?8:0)+(t.kind==='c'?3:0); const d=Math.hypot(t.g.position.x-gx,t.g.position.z-gz); if(d>range-1.5) continue; if(t.kind==='a'){ const rate=(1.5+0.35*(t.lvl-1))*(t.isC?1.4:1)*D.towerRate(); dps+=D.towerDmg(t.lvl)*rate*(t.isC?2.6:1)*0.9*(mA||1); } else { dps+=D.cannonDmg(t.lvl)*(0.45+0.08*(t.lvl-1))*1.5*(mC||1); } } return dps; }
// F7: SABİT zorluk eğrisi. Düşman gücü oyuncunun ölçülen gücünü İZLEMEZ: sefer ve geceye göre tasarlanmış referans savunmaya (F4 ekonomisinde o gecedeki beklenen kule gücü, kartsız/Krallıksız) göre boyutlanır.
// Böylece kart, Krallık, fazladan kule ve geliştirme tam hissedilir. Gece eğrisi sefer içinde hep artar: G1<G2<G3<G4<patron. Aynı seferde her kayıptan sonra düşman %8 zayıflar (en çok %30).
const REF_DPS=[0, [50, 71, 73, 131, 147], [196, 226, 258, 302, 327], [288, 320, 368, 354, 394], [430, 440, 460, 490, 530], [570, 620, 680, 720, 750], [720, 760, 830, 900, 950], [948, 1032, 1176, 1320, 1318], [1537, 1708, 1830, 1928, 2013], [1523, 1750, 1944, 2106, 2268], [2340, 2600, 2860, 3120, 2704]];
function refDps(L,N){ const R=REF_DPS, n=R.length-1, i=Math.max(1,Math.min(5,N))-1; if(L<=n) return R[Math.max(1,L)][i]; return R[n][i]*Math.pow(1.06,L-n); } /* sefer x gece: o gecede beklenen savunma (kule başına dps, kartsız) */
function mercyK(){ const f=(S.meta.fails&&S.meta.fails[S.level])||0; return 1-Math.min(0.3,0.08*f); }
const TILT=[0, 0.28, 0.45, 0.63, 0.7, 0.92]; /* patron gecesi: patron ordunun ortasında gelip okları üstüne çektiği için toplam can payı düşük (eskiden 2.07, patron sonda gelirken) */
function balanceWave(pl){ const k=sidesActive(); pl.mul={}; const N=Math.min(5,S.wave); let R=(endless()?EGR.base*EGR.tilt[N]*Math.pow(EGR.hp,(eNight(S.level,S.wave)-1)/WAVES):refDps(S.level,N)*TILT[N]*(S.level===10&&N===1?1.25:1))*(window.__tilt||1)*mercyK(); /* F9b: son seferin ilk gecesi belirgin ağır */
  if(window.__rho){ let a=0,c=0; for(const s of SIDES) if(pl.cnt[s]){ a+=defenseDps(s,1,1); c++; } R=window.__rho*a/Math.max(1,c); } /* yalnız test: baskı oranı ölçümü */
  for(const s of SIDES){ const cnt=pl.cnt[s]; if(!cnt) continue; let nom=0; for(let i=0;i<pl.kinds.length;i++){ if(SIDES[(Math.floor(i/4)+pl.seed)%k]!==s) continue; const K=EK[pl.kinds[i]]||EK.grunt; nom+=K.hp/(0.85*K.arrow+0.15*K.cannon); } /* şövalye/kalkanlı gibi oka dayanıklılar etkin canla sayılır: sıçrama yapmaz */
    pl.mul[s]=clamp(R*(0.36*cnt+10)/Math.max(1,nom*nightHp()),1e-4,1e4); } }
function startWave(){ if(S.cardPending&&!runOver){ showCardPick(true); if($('cardPick')||modalOpen()) return; } /* seçilmemiş güç kartı önce sunulur, gece seçimden sonra başlar */ snapNight(); if(!plan) planWave(); balanceWave(plan); scheduleWave(plan); nightClock=0; gateWarned=0; nightDmg={}; alertQ.length=0; waveActive=true; S.nightOn=true; noRegen=false; nightKills=0; const w=gw(); nightBanner(); SFX.night(); spawnQueue=plan.total; spawnT=0; spawnIdx=0; waveSeed=plan.seed; }
function spawnOne(){ const k=sidesActive(); const i=(plan&&plan.order)?plan.order[spawnIdx]:spawnIdx; const side=SIDES[(Math.floor(i/4)+waveSeed)%k]; const kind=(plan&&plan.kinds[i])||'grunt'; spawnIdx++; if(plan&&plan.done) plan.done[i]=1; makeEnemy(kind,side); const e=enemies[enemies.length-1]; e.via=(plan&&plan.via)?(plan.via[i]||''):undefined; rigSpawn(e); if(plan&&plan.adv&&plan.adv[i]>0&&!e.pre&&!e.hold) advanceOnRoad(e,plan.adv[i]); }
const gateMarks={}; for(const s of SIDES){ const g=new THREE.Group(); const cone=mesh(G.cone,M.enemy,0.55,0.9,0.55,false); cone.rotation.x=Math.PI; const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.7,32),new THREE.MeshBasicMaterial({color:0xd63a3a,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=-5.4; g.add(cone,ring); g.visible=false; scene.add(g); gateMarks[s]={g,cone,ring}; }
// gündüz: saldırılacak kapının üstünde kaç düşman ve hangi özel türler geleceği (simgeyle)
const KIND_IC={runner:'💨',shield:'🛡️',ram:'🐏',knight:'⚔️',pirate:'🏴‍☠️',ice:'❄️',poison:'☠️',archer:'🏹',wolf:'🐺',raider:'🏇',boss:'👑'};
const threatLbl={}; for(const s of SIDES){ const L=addLabel(new THREE.Vector3(0,0,0),'',7.6); L.near=-1; L.hide=true; L.avoid=true; L.el.classList.add('threat'); threatLbl[s]=L; }
function sideKinds(pl){ if(pl.sk) return pl.sk; const k=sidesActive(); const sk={}; for(let i=0;i<pl.kinds.length;i++){ const sd=SIDES[(Math.floor(i/4)+pl.seed)%k]; const kd=pl.kinds[i]; (sk[sd]||(sk[sd]={}))[kd]=((sk[sd]||{})[kd]||0)+1; } pl.sk=sk; return sk; }
function threatHtml(s){ const n=plan.cnt[s]; const kc=sideKinds(plan)[s]||{}; const ex=Object.keys(kc).filter(k=>KIND_IC[k]).sort((a,b)=>(b==='boss')-(a==='boss')||kc[b]-kc[a]).slice(0,3); return `<span class="ics"><span class="shield"></span>${n}${ex.map(k=>`<span>${KIND_IC[k]}</span>`).join('')}${fogGates().includes(s)?'<span class="fogIc">🌫️</span>':''}</span>`; } /* F6: sisli kapı */
function updateGateMarks(dt){ const t=performance.now()/1000; for(const s of SIDES){ const m=gateMarks[s]; let on=false; if(celebT<=0&&!$('levelCard')){ if(!waveActive&&plan&&plan.cnt[s]>0) on=true; if(waveActive&&(enemies.some(e=>!e.dead&&e.side===s)||(spawnQueue>0&&plan&&plan.cnt[s]>0))) on=true; } m.g.visible=on; const TL=threatLbl[s]; TL.hide=!(on&&!waveActive&&plan&&plan.cnt[s]>0); if(!TL.hide){ const [lx,lz]=sidePos(s,0,2.2); TL.pos.set(lx,0,lz); const key=plan.id+fogGates().join(''); if(TL._k!==key){ TL._k=key; TL.el.innerHTML=threatHtml(s); } } if(!on) continue; const [x,z]=sidePos(s,0,2.2); m.g.position.set(x,5.6+Math.sin(t*4)*0.3,z); m.g.rotation.y=t*2; const k=1+0.15*Math.sin(t*6); m.ring.scale.set(k,k,1); } }
function damageEnemy(e,dmg,src){ if(e.dead||e.hold) return; if(!(e.flashT>0)) flashOn(e); e.flashT=0.07; let m=src&&e.K&&e.K[src]!==undefined? e.K[src] : 1; if(src==='sword'){ if(e.guard) m*=2; else if(e.boss&&bossOf().hat==='crown') m*=1.5; } if(e.ward>0){ if(src==='sword') wardHit(e); else m*=WARD_K; } else if(e.chanT>0) m*=0.5; /* F9b: Kara Kral'ın kara kalkanı: kule %20, kılıç kırar; öfke toplarken yarı hasar */ if(src==='arrow'&&e.kind==='knight'&&S.lv.ironArrow) m=Math.min(1,m+0.13*S.lv.ironArrow); e.hp-=dmg*m; if(e.boss&&!e.ph2&&e.hp>0) bossPhase(e); e.hitT=0.18; SFX.hit(); if(m<0.7&&src==='arrow'&&Math.random()<0.3) burst(e.g.position.clone().setY(1.2),3,M.metal,0.5); if(e.hp<=0) killEnemy(e); }
function killEnemy(e){ e.dead=true; e.bar.remove(); S.kills++; nightKills++; questEvent('kill',1); if(e.boss){ cgCall(k=>k.game.happytime()); slowT=1.3; spawnBossChest(e.g.position.clone()); } comboKill(e); burst(e.g.position.clone().setY(0.8),9,M.enemy,1); const reward=(8+gw()*2.5)*(e.boss?10:e.kind==='ram'?3:1); scene.remove(e.g); const nl=e.K?e.K.loot:1; for(let i=0;i<nl;i++) dropLoot(e.g.position.x,e.g.position.z); if(e.kind==='ram'){ burst(e.g.position.clone().setY(1),16,M.woodDark,1.2); burst(e.g.position.clone().setY(1),8,M.trunk,1); } if(e.boss){ dropCoins(e.g.position.clone().setY(0.8),60,reward/60,8,1.3); } else if(Math.random()<0.35){ dropCoins(e.g.position.clone().setY(0.8),2,Math.round(reward/6),2.5,1); } }
let gateShake=0, gateDownT=0, levelReward=0;
// gündüz sayacı, bir pencere (kart, çark, kayıp/zafer, uzaktayken, görevler, krallık…) ya da bölge açılış gösterisi açıkken durur
function modalOpen(){ if(document.querySelector('.intro')) return true; for(const id in regionFx) if(regionFx[id].rev) return true; return false; }
// gece uyarıları sıraya girer, üst üste binmez (en az 2 sn arayla)
function gateAlert(msg,now){ if(now||gameT-alertT>2.2){ alertT=gameT; toast(msg); } else if(alertQ.length<3) alertQ.push(msg); }
// patron kükremesi: kapıya 35 birim yaklaşınca 9 sn'de bir, yakındaki düşmanlar 3 sn hızlanır (turuncu can çubuğu); okunur ve kısa
function bossRoar(e,dt){ e.roarT=(e.roarT===undefined?2:e.roarT)-dt; if(e.roarT>0) return; const [gx,gz]=sidePos(e.side,0,0); if(Math.hypot(e.g.position.x-gx,e.g.position.z-gz)>35){ e.roarT=0.5; return; } e.roarT=9; const pos=e.g.position; let n=0; for(const o of enemies){ if(o===e||o.dead) continue; if(Math.hypot(o.g.position.x-pos.x,o.g.position.z-pos.z)<7){ o.rage=3; o.bar.classList.add('rage'); n++; } } e.roarAt=gameT; floatText(pos.clone().setY(2.5*e.sc),T('KÜKREME!','ROAR!'),'red'); burst(pos.clone().setY(1.5),14,M.enemy,1.3,1.4); tone(160,70,0.5,'sawtooth',0.05); }
function updateEnemies(dt){
  if(alertQ.length&&gameT-alertT>2.2){ alertT=gameT; toast(alertQ.shift()); }
  if(shieldT>0) shieldT=Math.max(0,shieldT-dt);
  flushToasts();
  if(runOver){ }
  else if(!waveActive){ const tut=tutHold(); if(!tut&&!modalOpen()) waveT-=dt; if(waveT<=0) startWave(); }
  else if(spawnQueue>0){ nightClock+=dt; if(plan&&plan.at){ while(spawnQueue>0&&plan.at[plan.order[spawnIdx]]<=nightClock){ spawnQueue--; spawnOne(); } } else { spawnT-=dt; if(spawnT<=0){ spawnT=0.36; spawnQueue--; spawnOne(); } } }
  else if(enemies.every(e=>e.dead)){ waveActive=false; nightCleared(); return; }
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.dead){ enemies.splice(i,1); continue; }
    if(e.hold&&!holdTick(e,dt)) continue; if(e.flashT>0){ e.flashT-=dt; if(e.flashT<=0) flashOff(e); }
    const path=ROADS[e.side]; const d0=SD[e.side]; const pre=e.pre&&e.pre.length; const last=!pre&&e.wp>=path.length; let tx,tz; if(pre){ tx=e.pre[0][0]; tz=e.pre[0][1]; } else if(last){ [tx,tz]=sidePos(e.side,e.off*0.8,1.7); } else { tx=path[e.wp][0]+d0.t[0]*e.off; tz=path[e.wp][1]+d0.t[1]*e.off; }
    const dx=tx-e.g.position.x, dz=tz-e.g.position.z, d=Math.hypot(dx,dz);
    let blocked=null; for(const o of enemies){ if(o===e||o.dead) continue; const ox=o.g.position.x-e.g.position.x, oz=o.g.position.z-e.g.position.z; const od=Math.hypot(ox,oz); if(od<(e.rad||1.15)&&od>0.001&&(ox*dx+oz*dz)/(od*d)>0.55){ blocked=o; break; } }
    if(e.stuckT>2.5) blocked=null;
    const nearGate=last&&d<4.2&&blocked;
    if(pre&&d<0.8){ e.pre.shift(); preArrive(e); }
    else if(!pre&&!last&&d<0.6){ e.wp++; }
    else if(e.chanT>0){ animEnemy(e,dt,false); } /* F9b: Kara Kral öfke toplarken durur (3 sn uyarı) */
    else if(e.shooter&&!pre&&shooterTick(e,dt)){ animEnemy(e,dt,false); }
    else if((!last||d>0.5)&&!nearGate){ const ox0=e.g.position.x, oz0=e.g.position.z; const sp=e.speed*(e.rage>0?1.35:1); if(!blocked){ e.g.position.x+=dx/d*sp*dt; e.g.position.z+=dz/d*sp*dt; } else { const bx=blocked.g.position.x-e.g.position.x, bz=blocked.g.position.z-e.g.position.z, bd=Math.hypot(bx,bz)||1; e.g.position.x+=(dx/d*0.5-bx/bd*0.4)*sp*dt; e.g.position.z+=(dz/d*0.5-bz/bd*0.4)*sp*dt; } const adv=Math.hypot(e.g.position.x-ox0,e.g.position.z-oz0); e.stuckT=adv<e.speed*dt*0.5? (e.stuckT||0)+dt : (e.stuckT>2.5&&e.stuckT<3.5? e.stuckT+dt : 0); e.g.rotation.y=Math.atan2(dx,dz); animEnemy(e,dt,!blocked); }
    else { e.atkCd-=dt; animEnemy(e,dt,false); if(nearGate&&d>0.5){ e.g.rotation.y=Math.atan2(dx,dz); } if(e.atkCd<=0){ e.atkCd=e.atkT*(nearGate&&d>0.5?1.6:1); if(e.guy) e.guy.swing=0.3; else e.ramT=0.5; hitGate(e.side,e.kind,e.atk); } }
    if(e.rage>0){ e.rage-=dt; if(e.rage<=0) e.bar.classList.remove('rage'); } if(e.boss){ bossRoar(e,dt); if(e.ph2) kingTick(e,dt); } if((e.boss||e.kind==='ram')&&!e.warned){ const [gx,gz]=sidePos(e.side,0,0); if(Math.hypot(e.g.position.x-gx,e.g.position.z-gz)<20){ e.warned=true; gateAlert(e.boss?T(`💀 Patron ${SIDE_TR[e.side]} kapısına geliyor!`,`💀 Boss coming to the ${SIDE_TR[e.side]} Gate!`):T(`🐏 Koçbaşı ${SIDE_TR[e.side]} kapısına geliyor!`,`🐏 Ram coming to the ${SIDE_TR[e.side]} Gate!`)); } }
    if(e.hitT>0){ e.hitT-=dt; const k=1+e.hitT*0.8; e.g.scale.set(e.sc*k,e.sc/k,e.sc*k); } else e.g.scale.setScalar(e.sc);
    v3.set(e.g.position.x,e.kind==='ram'?2.8:2.4*e.sc,e.g.position.z).project(camera); e.bar.style.left=((v3.x+1)/2*innerWidth)+'px'; e.bar.style.top=((1-v3.y)/2*innerHeight)+'px'; e.bar.firstElementChild.style.width=(clamp(e.hp/e.maxHp,0,1)*100)+'%';
  }
}
function animEnemy(e,dt,moving){ if(e.wolf){ animWolf(e.wolf,dt,moving); if(e.ramT>0){ e.ramT-=dt; e.wolf.head.rotation.x=-0.5*Math.sin(e.ramT*12); } return; } if(e.guy){ animGuy(e.guy,dt,moving,1.1*(e.kind==='runner'?1.4:1)); return; } for(const pg of e.pushers) animGuy(pg,dt,moving,0.9); if(e.ramT>0){ e.ramT-=dt; const k=e.ramT/0.5; e.ramLog.position.z=0.2+(k>0.5? (1-k)*2*1.0 : k*2*1.0); } else e.ramLog.position.z=lerp(e.ramLog.position.z,0.2,Math.min(1,dt*6)); }
// sura vuruş (yakın dövüş ya da ok); canlanmadan sonraki kalkan süresince sur hasar almaz
let shieldT=0;
// F9b: Kara Kral gecesinde sura saniyede en çok ~%4.5 (üstü %25 geçer): öfke anında sur birkaç saniyede yok olmaz, oyuncuya tepki süresi kalır
let gBurst=0, gBurstT=0;
function burstCap(a){ if(!(S.wave===WAVES&&bossOf().hat==='crown')) return a; const cap=D.gateMax()*0.045; gBurst=Math.max(0,gBurst-(gameT-gBurstT)*cap); gBurstT=gameT; const room=Math.max(0,cap*1.2-gBurst); const r=Math.min(a,room)+Math.max(0,a-room)*0.25; gBurst+=r; return r; }
function hitGate(side,kind,amt,ranged){ if(runOver) return; /* F9a: yıkıldıktan sonra sur eksiye inmez */ if(shieldT>0){ if(Math.random()<0.3){ const [bx,bz]=sidePos(side,rand(-1.5,1.5),0.3); burst(new THREE.Vector3(bx,1.6,bz),3,M.flashW||M.gold,0.5); } return; } amt=burstCap(amt); S.gateHp=Math.max(0,S.gateHp-amt); nightDmg[kind]=(nightDmg[kind]||0)+amt; if(!ranged){ SFX.gate(); gateShake=0.25; } S.minGate=Math.min(S.minGate,Math.max(0,S.gateHp)/D.gateMax());
  { const r=S.gateHp/D.gateMax(), lv=r<0.35?2:r<0.6?1:0; if(lv>gateWarned){ gateWarned=lv; alertQ.length=0; gateAlert(lv===2?T(`⚠ Sur %${Math.max(0,Math.round(r*100))}! ${SIDE_TR[side]} kapısı!`,`⚠ Walls ${Math.max(0,Math.round(r*100))}%! ${SIDE_TR[side]} Gate!`):T(`⚠ ${SIDE_TR[side]} kapısı saldırı altında!`,`⚠ ${SIDE_TR[side]} Gate under attack!`),true); } }
  const [bx,bz]=sidePos(side,rand(-1.5,1.5),0); burst(new THREE.Vector3(bx,1.4,bz),ranged?2:4,M.wood,0.6); if(S.gateHp<=0) gateBroken(); }
let failLeft=0;
function gateBroken(){ if(runOver) return; S.gateHp=0; runOver=true; S.failed=true; S.nightOn=false; save(); failLeft=Math.max(1,enemies.filter(e=>!e.dead).length+spawnQueue); SFX.lose(); SFX.boom(); camShake=0.6; setTimeout(showFailCard,900); }
let lastWaveFail=0;
function shoot(from,target,dmg){ const m=mesh(G.cyl,M.handle,0.035,0.8,0.035,false); m.position.copy(from); scene.add(m); projectiles.push({m,target,dmg,spd:26}); }
function updateProjectiles(dt){ for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; const t=p.target; if(t.dead){ scene.remove(p.m); projectiles.splice(i,1); continue; } const to=t.g.position.clone(); to.y=0.9; const dir=to.sub(p.m.position); const dist=dir.length(); if(dist<0.7){ scene.remove(p.m); projectiles.splice(i,1); damageEnemy(t,p.dmg,'arrow'); continue; } dir.normalize(); p.m.position.addScaledVector(dir,p.spd*dt); p.m.lookAt(t.g.position.x,0.9,t.g.position.z); p.m.rotateX(Math.PI/2); } }
function fireCannon(t,e){ const m=mesh(G.sph,M.ball,0.28,0.28,0.28,false); m.position.copy(t.top); scene.add(m); const to=e.g.position.clone(); to.addScaledVector(new THREE.Vector3(Math.sin(e.g.rotation.y),0,Math.cos(e.g.rotation.y)),e.speed*0.5); balls.push({m,from:t.top.clone(),to,t:0,dur:0.55+t.top.distanceTo(to)*0.012,dmg:D.cannonDmg(t.lvl)}); SFX.boom(); burst(t.top.clone(),5,M.smoke,0.4,1.4); }
function updateBalls(dt){ for(let i=balls.length-1;i>=0;i--){ const b=balls[i]; b.t+=dt; const k=Math.min(1,b.t/b.dur); b.m.position.lerpVectors(b.from,b.to,k); b.m.position.y+=Math.sin(k*Math.PI)*6; if(k>=1){ scene.remove(b.m); balls.splice(i,1); burst(b.to.clone().setY(0.6),14,M.smoke,1,1.6); burst(b.to.clone().setY(0.6),8,M.gold,1); SFX.boom(); for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(b.to); if(d<2.8) damageEnemy(e,b.dmg*(d<1.2?1:0.6),'cannon'); } } } }
function nearestEnemy(pos,range){ let best=null,bd=range; for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(pos); if(d<bd){bd=d;best=e;} } return best; }
