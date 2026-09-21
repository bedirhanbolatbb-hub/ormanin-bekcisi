
// ---------- İnşa alanları (her şeyin max seviyesi 10) ----------
const pads=[]; const padById={};
const P=(x,z)=>()=>[x,z];
const nFree=k=>S.towers.filter(t=>!t.fixed&&t.k===k).length;
const PADS=[
  // Kuzeybatı: sur işleri (kereste) + yeni kuleler
  {id:'wall', lock:'Kuzey kulesi kur', name:'Sur', desc:'Sur ve kapılar güçlenir; 4. seviyeden sonra taş ister', res:l=>l>=3?'stone':'wood', pos:P(-2.9,-2.9), kind:'wall', key:'wall', cost:l=>l>=3?Math.round(30*Math.pow(1.45,l-3)):Math.round(40*Math.pow(1.55,l)), max:MAXL, show:()=>S.towers[1].lvl>=1},
  {id:'gate', lock:'Sur 1', name:'Kapı Onarım', desc:'Kapıların canı artar; ileri seviyeler taş ister', res:l=>l>=3?'stone':'wood', pos:P(-5.4,-2.9), kind:'up', key:'gateLv', cost:l=>l>=3?Math.round(28*Math.pow(1.4,l-3)):Math.round(50*Math.pow(1.4,l)), max:MAXL, show:()=>S.lv.wall>=1},
  {id:'expand', lock:'İki kuzey kulesi', name:'Genişlet', desc:'Sur kare olarak büyür; 4. kademeden sonra taş ister', res:l=>l>=3?'stone':'wood', pos:P(-7.9,-2.9), kind:'expand', key:'expand', cost:l=>l>=3?Math.round(45*Math.pow(1.5,l-3)):Math.round(60*Math.pow(1.6,l)), max:MAXL, show:()=>S.towers[1].lvl>=1&&S.towers[2].lvl>=1},
  {id:'newTower', lock:'Genişlet 1', name:'Yeni Okçu Kulesi', desc:'Sur kenarında istediğin yere kurarsın', res:'gold', pos:P(-2.9,-5.4), kind:'newTower', tk:'a', cost:l=>Math.round(120*Math.pow(1.35,l)), max:MAXL, show:()=>S.lv.expand>=1, lvl:()=>nFree('a')},
  {id:'newCannon', lock:'Genişlet 1', name:'Yeni Topçu Kulesi', desc:'Gülle atar, toplu hasar verir; yerini sen seçersin', res:'gold', pos:P(7.9,2.9), kind:'newTower', tk:'c', cost:l=>Math.round(160*Math.pow(1.4,l)), max:MAXL, show:()=>S.lv.expand>=1, lvl:()=>nFree('c')},
  {id:'cannonTrain', lock:'Bir topçu kulesi', name:'Topçu Talimi', desc:'Tüm topçu kulelerinin hasarı artar', res:'gold', pos:P(7.9,5.4), kind:'up', key:'cannonTrain', cost:l=>Math.round(100*Math.pow(1.3,l)), max:MAXL, show:()=>nFree('c')>=1},
  // Kuzeydoğu: savunma
  {id:'soldier', name:'Asker', desc:'Kapılar arasında düşmana göre yer değiştirir', res:'gold', pos:P(2.9,-2.9), kind:'soldier', key:'soldier', cost:l=>Math.round(30*Math.pow(1.35,l)), max:MAXL, show:()=>true},
  {id:'soldierTrain', lock:'Bir asker', name:'Asker Talimi', desc:'Askerler daha sert ve hızlı vurur', res:'gold', pos:P(5.4,-2.9), kind:'up', key:'soldierTrain', cost:l=>Math.round(50*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.soldier>=1},
  {id:'sword', lock:'Bir asker', name:'Kılıç', desc:'Kılıç hasarı ve menzili artar', res:'gold', pos:P(7.9,-2.9), kind:'up', key:'sword', cost:l=>Math.round(40*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.soldier>=1},
  {id:'towerTrain', lock:'Kuzey kulesi kur', name:'Okçu Talimi', desc:'Tüm okçu kulelerinin hasarı artar', res:'gold', pos:P(2.9,-5.4), kind:'up', key:'towerTrain', cost:l=>Math.round(80*Math.pow(1.3,l)), max:MAXL, show:()=>S.towers[1].lvl>=1},
  {id:'range', lock:'Genişlet 1', name:'Kule Menzili', desc:'Kuleler daha uzağa atar', res:'gold', pos:P(5.4,-5.4), kind:'up', key:'range', cost:l=>Math.round(120*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.expand>=1},
  {id:'collector', lock:'Bir asker', name:'Toplayıcı', desc:'Yerdeki miğferleri toplayıp tezgâha taşır', res:'gold', pos:P(7.9,-5.4), kind:'collector', key:'collector', cost:l=>Math.round(70*Math.pow(1.5,l)), max:MAXL, show:()=>S.lv.soldier>=1},
  // Güneybatı: odun ekonomisi
  {id:'axe', name:'Balta', desc:'Pervane daha hızlı döner, daha hızlı keser', res:'gold', pos:P(-2.9,2.9), kind:'up', key:'axe', cost:l=>Math.round(30*Math.pow(1.3,l)), max:MAXL, show:()=>true},
  {id:'bag', name:'Sırt', desc:'Sırtta daha çok odun ve miğfer taşırsın', res:'gold', pos:P(-5.4,2.9), kind:'up', key:'bag', cost:l=>Math.round(30*Math.pow(1.3,l)), max:MAXL, show:()=>true},
  {id:'worker', lock:'Balta ya da sırt', name:'Oduncu', desc:'Senin yerine ağaç kesip depoya taşır', res:'gold', pos:P(-7.9,2.9), kind:'worker', key:'worker', cost:l=>Math.round(60*Math.pow(1.5,l)), max:MAXL, show:()=>S.lv.axe+S.lv.bag>=1},
  {id:'feet', lock:'Bir oduncu', name:'Midilli', desc:'Midilli daha hızlı koşar', res:'gold', pos:P(-2.9,5.4), kind:'up', key:'feet', cost:l=>Math.round(40*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.worker>=1},
  {id:'magnet', lock:'Bir oduncu', name:'Mıknatıs', desc:'Altın ve ganimeti daha uzaktan çeker', res:'gold', pos:P(-5.4,5.4), kind:'up', key:'magnet', cost:l=>Math.round(60*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.worker>=1},
  {id:'stoneWorker', lock:'Sur 2 ya da genişlet 2', name:'Taşçı', desc:'Taş ocağından taş çıkarıp depoya taşır', res:'gold', pos:P(-7.9,5.4), kind:'stoneWorker', key:'stoneWorker', cost:l=>Math.round(80*Math.pow(1.5,l)), max:MAXL, show:()=>S.lv.wall>=2||S.lv.expand>=2},
  {id:'worker2', lock:'İki oduncu', name:'Oduncu Hızı', desc:'Oduncular daha hızlı yürür', res:'gold', pos:P(5.4,2.9), kind:'up', key:'workerSpd', cost:l=>Math.round(90*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.worker>=2},
  // Güneydoğu: ticaret
  {id:'depot', lock:'Bir oduncu', name:'Odun Deposu', desc:'Oduncular daha çok taşır', res:'gold', pos:P(2.9,2.9), kind:'up', key:'depotLv', cost:l=>Math.round(80*Math.pow(1.4,l)), max:MAXL, show:()=>S.lv.worker>=1},
  {id:'trader', lock:'Bir asker', name:'Tüccar', desc:'Tezgâhta satış daha hızlı, fiyat daha yüksek', res:'gold', pos:P(-7.9,-5.4), kind:'up', key:'trader', cost:l=>Math.round(80*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.soldier>=1},
  {id:'price', lock:'Tüccar 1', name:'Ganimet Fiyatı', desc:'Müşteriler miğfere daha çok öder', res:'gold', pos:P(-5.4,-7.9), kind:'up', key:'price', cost:l=>Math.round(120*Math.pow(1.3,l)), max:MAXL, show:()=>S.lv.trader>=1},
];
function towerPos(i){ const t=S.towers[i]; if(t.side==='C') return [0,0]; return sidePos(t.side,t.a,-1.5); }
// Kule alanı: sabit kuleler için kapının yanında, yeni kuleler için kulenin önünde, merkez için kule kurulunca güneyinde
function towerPadPos(i){ const t=S.towers[i]; if(t.side==='C') return t.lvl<1?[0,0]:[0,-2.9]; if(t.fixed) return sidePos(t.side,Math.sign(t.a)*2.4,-2.4); return sidePos(t.side,t.a,-3.9); }
const FLANK_BASE={N:15,E:30,S:45,W:60};
function towerDef(i){ const t=S.towers[i]; const isC=t.side==='C'; const name=t.k==='c'?'Topçu Kulesi':isC?'Merkez Kule':'Okçu Kulesi'; const desc=t.k==='c'?'Gülle atar; seviye = hasar + hız':isC?'Uzun menzilli, iki okçu; seviye = hasar + hız':'Ok atar; seviye = hasar + hız';
  return {id:'t'+i, ti:i, name, desc, kind:'tower', max:MAXL, sc:isC?1.5:1.0, r:isC?2.4:1.9, pos:()=>towerPadPos(i), res:l=>l===0?'wood':'gold', cost:l=>l===0?(isC?60:FLANK_BASE[t.side]):Math.round((t.k==='c'?60:40)*Math.pow(1.3,l-1)),
    lock: isC? 'Genişlet 1' : t.fixed? (SIDE_TR[t.side]+' kapısı — dalga '+(1+2*(SIDES.indexOf(t.side)-1))) : '', show:()=> isC? S.lv.expand>=1 : t.fixed? SIDES.indexOf(t.side)<sidesShown() : true }; }
function padLevel(d){ return d.kind==='tower'? S.towers[d.ti].lvl : d.kind==='newTower'? d.lvl() : (S.lv[d.key]||0); }
function padTexture(){ const c=document.createElement('canvas'); c.width=320; c.height=320; const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=4; return {c,tex}; }
function rr(x,X,Y,W,Hh,r){ x.beginPath(); x.moveTo(X+r,Y); x.lineTo(X+W-r,Y); x.quadraticCurveTo(X+W,Y,X+W,Y+r); x.lineTo(X+W,Y+Hh-r); x.quadraticCurveTo(X+W,Y+Hh,X+W-r,Y+Hh); x.lineTo(X+r,Y+Hh); x.quadraticCurveTo(X,Y+Hh,X,Y+Hh-r); x.lineTo(X,Y+r); x.quadraticCurveTo(X,Y,X+r,Y); x.closePath(); }
const PF='"Baloo 2","Nunito",sans-serif';
function fitFont(x,txt,w,fs,min,weight){ x.font=`${weight||'bold'} ${fs}px ${PF}`; while(x.measureText(txt).width>w&&fs>min){ fs-=2; x.font=`${weight||'bold'} ${fs}px ${PF}`; } return fs; }
function outlined(x,txt,cx,cy,fill,stroke,lw){ x.lineJoin='round'; x.strokeStyle=stroke; x.lineWidth=lw; x.strokeText(txt,cx,cy); x.fillStyle=fill; x.fillText(txt,cx,cy); }
// Kilitli alan: küçük koyu kare, kilit ve ad; ayrıntı baloncukta
function drawLocked(pd,name,hint){ const x=pd.tex.c.getContext('2d'); x.clearRect(0,0,320,320); x.fillStyle='rgba(30,36,40,0.62)'; rr(x,16,16,288,288,34); x.fill(); x.strokeStyle='rgba(255,255,255,0.35)'; x.lineWidth=6; rr(x,16,16,288,288,34); x.stroke();
  x.fillStyle='#e6e0d4'; rr(x,124,150,72,58,10); x.fill(); x.strokeStyle='#e6e0d4'; x.lineWidth=12; x.beginPath(); x.arc(160,150,26,Math.PI,0); x.stroke(); x.fillStyle='#2b3138'; x.beginPath(); x.arc(160,176,9,0,7); x.fill();
  x.textAlign='center'; x.textBaseline='middle'; fitFont(x,name,262,40,22,'800'); outlined(x,name,160,84,'#ffffff','rgba(0,0,0,0.55)',7);
  x.fillStyle='rgba(255,255,255,0.75)'; fitFont(x,hint,262,26,16,'700'); x.fillText(hint,160,258); pd.tex.tex.needsUpdate=true; }
function drawPad(pd,name,lvlTxt,cur,cost,can){ const x=pd.tex.c.getContext('2d'); x.clearRect(0,0,320,320); const res=padRes(pd); const wood=res==='wood', stone=res==='stone';
  const col= !can? '#3d4a43' : stone? '#5a6068' : wood? '#8a5a2a' : '#1f7a3f'; const col2= !can? '#2c3631' : stone? '#3f444b' : wood? '#6a4320' : '#155a2c';
  const gr=x.createLinearGradient(0,0,0,320); gr.addColorStop(0,col); gr.addColorStop(1,col2); x.fillStyle=gr; rr(x,14,14,292,292,36); x.fill();
  x.strokeStyle=can?'#fff6d6':'rgba(255,255,255,0.45)'; x.lineWidth=8; rr(x,14,14,292,292,36); x.stroke();
  x.strokeStyle='rgba(0,0,0,0.18)'; x.lineWidth=4; rr(x,26,26,268,268,28); x.stroke();
  x.textAlign='center'; x.textBaseline='middle';
  x.fillStyle=can?'#ffd75e':'#cfc7a8'; x.font=`800 30px ${PF}`; x.fillText(lvlTxt,160,50);
  fitFont(x,name,262,42,22,'800'); outlined(x,name,160,100,'#ffffff','rgba(0,0,0,0.5)',7);
  const num=String(Math.max(0,Math.ceil(cost-cur))); x.font=`800 104px ${PF}`; const nw=x.measureText(num).width; const iw=50; const total=nw+iw+14; const nx=160-total/2+nw/2; outlined(x,num,nx,206,can?'#ffffff':'#d8d2c0','rgba(0,0,0,0.5)',10);
  const ix=nx+nw/2+14+iw/2, iy=206;
  if(stone){ x.fillStyle='#c9c3b6'; rr(x,ix-24,iy-14,48,30,8); x.fill(); x.strokeStyle='#6f6a60'; x.lineWidth=3; x.stroke(); x.fillStyle='#e6e0d4'; rr(x,ix-16,iy-9,20,10,3); x.fill(); }
  else if(wood){ x.fillStyle='#c98d4e'; rr(x,ix-26,iy-12,52,24,11); x.fill(); x.fillStyle='#f0cd9c'; x.beginPath(); x.arc(ix+24,iy,12,0,7); x.fill(); x.strokeStyle='#8a5a30'; x.lineWidth=3; x.stroke(); }
  else { x.fillStyle='#ffc93a'; x.beginPath(); x.arc(ix,iy,20,0,7); x.fill(); x.strokeStyle='#8a5a00'; x.lineWidth=4; x.stroke(); x.fillStyle='#8a5a00'; x.font=`800 22px ${PF}`; x.fillText('$',ix,iy+1); }
  if(!can){ x.fillStyle='rgba(255,255,255,0.8)'; x.font=`700 24px ${PF}`; x.fillText(stone?'taş lazım':wood?'odun lazım':'altın lazım',160,272); }
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
function padAvail(pd){ const need=padCost(pd)-(S.paid[pd.def.id]||0); const r=padRes(pd); return r==='wood'? need<=S.logs+S.wood+0.01 : r==='stone'? need<=S.stones+S.stone+0.01 : need<=S.coins+0.01; }
function layoutPads(){ for(const pd of pads){ const pp=pd.def.pos(); pd.g.position.set(pp[0],0,pp[1]); } }
function expandBase(){ S.lv.expand++; applyBase(); placeBuildings(); paintGround(); cullTrees(); cullRocks(); cullDecor(); buildWalls(S.lv.wall); buildGates(S.lv.wall); placeGates(); placeTorches(); rebuildTowers(); layoutPads(); if(typeof drawMiniBase==='function') drawMiniBase(); burst(new THREE.Vector3(0,1,H-4),30,M.plank,1.2); toast('Sur büyüdü!','good'); }
function instantBuy(pd){ const cost=padCost(pd); const cur=S.paid[pd.def.id]||0; const need=Math.max(0,cost-cur); const res=padRes(pd); const wood=res==='wood';
  if(res==='stone'){ if(S.stones+S.stone<need-0.01){ toast('Yeterli taş yok — taş ocağına git'); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.stones); S.stones-=fromBack; n-=fromBack; S.stone-=n; setBack(player); setStonePile(Math.min(18,S.stone)); for(let i=0;i<Math.min(12,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,'stone',rand(4,7)); }
  else if(wood){ if(S.logs+S.wood<need-0.01){ toast('Yeterli odun yok'); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.logs); S.logs-=fromBack; n-=fromBack; S.wood-=n; setBack(player); setPile(Math.min(24,S.wood)); for(let i=0;i<Math.min(14,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,true,rand(4,7)); }
  else { if(S.coins<need-0.01){ toast('Yeterli altın yok'); return; } S.coins-=need; for(let i=0;i<Math.min(14,Math.ceil(need/5)+3);i++) fly(player.g.position.clone().setY(2.4),pd.g.position.clone().setY(0.3),null,false,rand(4,7)); }
  S.paid[pd.def.id]=cost; SFX.pay(); completePad(pd); }
function cancelPad(pd){ const cur=S.paid[pd.def.id]||0; if(cur<=0) return; const r=padRes(pd); if(r==='wood') S.wood+=Math.round(cur); else if(r==='stone'){ S.stone+=Math.round(cur); setStonePile(Math.min(18,S.stone)); } else S.coins+=cur; S.paid[pd.def.id]=0; pd.cool=2.5; setPile(Math.min(24,S.wood)); toast('Vazgeçildi, kaynak geri alındı','good'); }
function completePad(pd){ const d=pd.def; S.paid[d.id]=0; pd.pop=1; pd.cool=1.2;
  if(d.kind==='tower'){ S.towers[d.ti].lvl++; buildTower(d.ti); }
  else if(d.kind==='newTower'){ startPlacing(d.tk); }
  else if(d.kind==='wall'){ S.lv.wall++; buildWalls(S.lv.wall); buildGates(S.lv.wall); S.gateHp=D.gateMax(); }
  else if(d.kind==='worker'){ S.lv.worker++; addWorker(); }
  else if(d.kind==='stoneWorker'){ S.lv.stoneWorker++; addWorker('stone'); }
  else if(d.kind==='soldier'){ S.lv.soldier++; addSoldier(true); }
  else if(d.kind==='expand'){ expandBase(); }
  else if(d.kind==='collector'){ S.lv.collector=(S.lv.collector||0)+1; addCollector(); }
  else { S.lv[d.key]=(S.lv[d.key]||0)+1; if(d.key==='axe') rebuildOrbit(); if(d.key==='depotLv'||d.key==='workerSpd'){ for(const w of workers){ w.cap=8+4*(S.lv.depotLv||0); w.speed=5+0.6*(S.lv.depotLv||0)+0.7*(S.lv.workerSpd||0); } } }
  questEvent('build'); SFX.build(); burst(pd.g.position.clone().setY(0.8),16,M.gold,1.2); if(d.kind!=='newTower') floatText(pd.g.position,d.name+(d.kind==='tower'||d.kind==='wall'?' ↑':' ↑'),'green'); save(); }
let bubblePad=null;
function updatePads(dt){ const p=player.g.position; bubblePad=null;
  for(const pd of pads){ const unlocked=pd.def.show(); const lockable=!!pd.def.lock; const vis=padLevel(pd.def)<pd.def.max&&!placing&&(unlocked||lockable); if(!vis){ pd.shown=0; } pd.g.visible=vis; pd.locked=!unlocked; if(!vis) continue;
    if(pd.locked){ pd.wasLocked=true; pd.shown=Math.min(1,pd.shown+dt*2.5); pd.g.scale.set(0.6*pd.shown*pd.sc,1,0.6*pd.shown*pd.sc); pd.plane.position.y=0.05; pd.fill.scale.set(1,0.001,1); const key='L|'+pd.def.name+'|'+pd.def.lock; if(key!==pd.last){ pd.last=key; drawLocked(pd,pd.def.name,pd.def.lock); } if(Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z)<pd.r*0.8) bubblePad=pd; continue; }
    const cost=padCost(pd); const paid=S.paid[pd.def.id]||0; const lvl=padLevel(pd.def);
    if(pd.wasLocked&&introT>3){ toast('Yeni alan açıldı: '+pd.def.name,'good'); SFX.build(); } pd.wasLocked=false;
    pd.shown=Math.min(1,pd.shown+dt*2.5); const ease=1-Math.pow(1-pd.shown,3); const over=pd.shown<1? ease*(1+0.18*Math.sin(pd.shown*Math.PI)) : 1;
    const pulse=(S.paid[pd.def.id]||0)<cost&&padAvail(pd)? 1+0.05*Math.sin(performance.now()/180) : 1;
    if(pd.pop>0){ pd.pop-=dt*2; const s2=1+Math.sin((1-pd.pop)*Math.PI)*0.25; pd.g.scale.set(s2*over*pd.sc,1,s2*over*pd.sc); } else pd.g.scale.set(over*pulse*pd.sc,1,over*pulse*pd.sc);
    pd.plane.position.y=0.05+(padAvail(pd)?0.02+0.02*Math.sin(performance.now()/180):0);
    pd.cool=Math.max(0,pd.cool-dt);
    const nearAny=Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z)<pd.r; if(nearAny) bubblePad=pd; const near=nearAny&&!playerMoving;
    if(near&&pd.cool<=0&&paid<cost){ if(padRes(pd)==='gold'){ if(S.coins>0.01){ const rate=Math.max(60,cost/0.8); const amt=Math.min(rate*dt,S.coins,cost-paid); S.coins-=amt; S.paid[pd.def.id]=paid+amt; pd.payT-=dt; if(pd.payT<=0){ pd.payT=0.05; fly(p.clone().setY(2.4),pd.g.position.clone().setY(0.3),null,false,6); SFX.pay(); } } }
      else if(padRes(pd)==='stone'){ pd.acc=(pd.acc||0)+Math.max(20,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.stones>0||S.stone>0)&&cur<cost){ n--; const fromBack=S.stones>0; if(fromBack){ S.stones--; } else { S.stone--; } cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.06; fly((fromBack?p.clone().setY(1.6):DEPOT.clone().setY(1.2)),pd.g.position.clone().setY(0.3),null,'stone',fromBack?6:4); SFX.pay(); } } setBack(player); setStonePile(Math.min(18,S.stone)); }
      else { pd.acc=(pd.acc||0)+Math.max(20,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.logs>0||S.wood>0)&&cur<cost){ n--; const fromBack=S.logs>0; if(fromBack){ S.logs--; } else { S.wood--; } cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.06; fly((fromBack?p.clone().setY(1.6):DEPOT.clone().setY(1.2)),pd.g.position.clone().setY(0.3),null,true,fromBack?6:4); SFX.pay(); } } setBack(player); setPile(Math.min(24,S.wood)); } }
    const cur=S.paid[pd.def.id]||0; const k=clamp(cur/cost,0,1); pd.fill.scale.set(1,Math.max(0.001,k),1); pd.fill.position.z=(1-k)*1.0;
    const can=padAvail(pd); const cnt=pd.def.kind==='worker'||pd.def.kind==='stoneWorker'||pd.def.kind==='soldier'||pd.def.kind==='collector'||pd.def.kind==='newTower'; const lvlTxt=cnt? `${lvl}/${pd.def.max}` : `Sv ${lvl}/${pd.def.max}`;
    const key=pd.def.name+'|'+lvlTxt+'|'+Math.ceil(cost-cur)+'|'+can+'|'+padRes(pd); if(key!==pd.last){ pd.last=key; drawPad(pd,pd.def.name,lvlTxt,cur,cost,can); }
    if(cur>=cost-0.01) completePad(pd);
  } }

// ---------- Kuleler: okçu, topçu, merkez; sur kenarına yerleşir ----------
const towers=[];
function towerMesh(kind,lvl,isC,gm){ const mm=m=>gm||m; const g=new THREE.Group(); const sc=isC?1.35:1; const archers=[]; let top;
  const tier=lvl<=3?0:lvl<=6?1:2; const Hh=(2.4+lvl*0.3)*sc;
  if(tier===0){ for(const [lx,lz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=mesh(G.cyl,mm(M.woodDark),0.16,Hh,0.16); l.position.set(lx*0.9*sc,Hh/2,lz*0.9*sc); l.rotation.z=-lx*0.12; l.rotation.x=lz*0.12; g.add(l);} const brace=mesh(G.box,mm(M.wood),2.2*sc,0.12,0.12); brace.position.y=Hh*0.5; const brace2=brace.clone(); brace2.rotation.y=Math.PI/2; g.add(brace,brace2); }
  else { const body=mesh(G.cyl,mm(tier===2?M.stoneBlue:M.stone),1.05*sc,Hh,1.15*sc); body.position.y=Hh/2; g.add(body); const n=Math.round(6+lvl); for(let i=0;i<n;i++){ const b=mesh(G.box,mm(tier===2?M.stoneDark:M.stoneDark),rand(.4,.7),0.3,0.25,false); const a=rand(0,6.28); b.position.set(Math.cos(a)*1.05*sc,rand(0.4,Hh-0.5),Math.sin(a)*1.05*sc); b.rotation.y=-a; g.add(b);} if(tier===2){ const ring=mesh(G.cyl,mm(M.gold),1.2*sc,0.18,1.2*sc,false); ring.position.y=Hh-0.3; g.add(ring); } }
  const deck=mesh(tier?G.cyl:G.box,mm(M.plank),tier?1.45*sc:2.4*sc,0.25,tier?1.45*sc:2.4*sc); deck.position.y=Hh+0.12; g.add(deck);
  for(let i=0;i<8;i++){ const a=i/8*6.283; const r=mesh(G.box,mm(tier?M.stoneDark:M.woodDark),0.22,0.6,0.22); r.position.set(Math.cos(a)*1.25*sc,Hh+0.55,Math.sin(a)*1.25*sc); g.add(r);}
  if(lvl>=2&&kind==='a'){ for(const [px,pz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const r=mesh(G.cyl,mm(M.woodDark),0.08,1.8,0.08); r.position.set(px*sc,Hh+1.2,pz*sc); g.add(r);} const roof=mesh(tier===2?G.cone:G.cone4,mm(lvl>=10?M.flag:tier===2?M.stoneBlue:M.banner),1.9*sc,1.1+0.3*tier,1.9*sc); roof.position.y=Hh+2.6; roof.rotation.y=Math.PI/4; g.add(roof); if(lvl>=10){ const orb=mesh(G.sph,mm(M.gold),0.3,0.3,0.3,false); orb.position.y=Hh+3.5; g.add(orb);} }
  for(let i=0;i<Math.min(lvl-1,4);i++){ const fl=mesh(G.box,mm(M.flag),0.5,0.35,0.04,false); fl.position.set(1.2*sc,Hh-0.5-i*0.45,0.0); fl.rotation.y=Math.PI/2; g.add(fl); }
  if(kind==='a'){ const n=isC?2:1; for(let i=0;i<n;i++){ const ar=makeGuy('soldier'); ar.g.position.set(isC?(i?0.6:-0.6):0,Hh+0.25,0); ar.g.scale.setScalar(0.85); if(gm){ ar.g.traverse(o=>{ if(o.isMesh) o.material=gm; }); } g.add(ar.g); archers.push(ar);} top=new THREE.Vector3(0,Hh+1.4,0); }
  else { const base=mesh(G.box,mm(M.iron),1.0,0.5,1.2); base.position.y=Hh+0.5; const barrel=new THREE.Group(); barrel.position.y=Hh+0.85; const tube=mesh(G.cyl,mm(M.iron),0.28+0.02*lvl,1.6+0.05*lvl,0.28+0.02*lvl); tube.rotation.x=Math.PI/2; tube.position.z=0.5; const rim=mesh(G.cyl,mm(tier===2?M.gold:M.metal),0.34+0.02*lvl,0.2,0.34+0.02*lvl,false); rim.rotation.x=Math.PI/2; rim.position.z=1.25; barrel.add(tube,rim); for(const x of [-0.55,0.55]){ const w=mesh(G.cyl,mm(M.woodDark),0.4,0.14,0.4,false); w.rotation.z=Math.PI/2; w.position.set(x,Hh+0.55,0); g.add(w);} g.add(base,barrel); archers.push({barrel,g:barrel,aim:false}); top=new THREE.Vector3(0,Hh+0.9,0); }
  return {g,archers,top}; }
function buildTower(i){ const t=S.towers[i]; if(towers[i]) scene.remove(towers[i].g); if(t.lvl<1){ towers[i]=null; return; } const [x,z]=towerPos(i); const tm=towerMesh(t.k,t.lvl,t.side==='C'); tm.g.position.set(x,0,z); if(t.side!=='C'){ const d=SD[t.side]; tm.g.rotation.y=Math.atan2(d.o[0],d.o[1]); } scene.add(tm.g); tm.g.scale.setScalar(0.01);
  towers[i]={g:tm.g,archers:tm.archers,cd:rand(0,0.5),lvl:t.lvl,kind:t.k,isC:t.side==='C',pop:0,top:new THREE.Vector3(x,tm.top.y,z)}; }
function rebuildTowers(){ S.towers.forEach((t,i)=>{ buildTower(i); if(towers[i]) towers[i].pop=0.99; }); }
rebuildTowers(); layoutPads(); placeBuildings();
function updateTowers(dt){ for(const t of towers){ if(!t) continue; if(t.pop<1){ t.pop=Math.min(1,t.pop+dt*2.2); const s=t.pop<1? (1.18-0.18*Math.cos(t.pop*Math.PI*1.5))*t.pop : 1; t.g.scale.setScalar(Math.max(0.01,s)); if(t.pop<1) continue; t.g.scale.setScalar(1); }
  t.cd=Math.max(-0.05,t.cd-dt); const range=D.towerRange()+(t.isC?8:0)+(t.kind==='c'?3:0); const e=nearestEnemy(t.g.position,range);
  if(t.kind==='a'){ if(e){ const ang=Math.atan2(e.g.position.x-t.g.position.x,e.g.position.z-t.g.position.z)-t.g.rotation.y; for(const a of t.archers){ a.g.rotation.y=ang; a.aim=true; a.armR.rotation.x=lerp(a.armR.rotation.x,-1.4,dt*8); } if(t.cd<=0){ t.cd=1/((1.5+0.35*(t.lvl-1))*(t.isC?1.4:1)*D.towerRate()); for(const a of t.archers) shoot(t.top,e,D.towerDmg(t.lvl)*(t.isC?1.3:1)); } } else { for(const a of t.archers) a.aim=false; } for(const a of t.archers) animGuy(a,dt,false,1); }
  else { const b=t.archers[0].barrel; if(e){ const ang=Math.atan2(e.g.position.x-t.g.position.x,e.g.position.z-t.g.position.z)-t.g.rotation.y; b.rotation.y=lerp(b.rotation.y,ang,Math.min(1,dt*6)); if(t.cd<=0){ t.cd=1/(0.45+0.08*(t.lvl-1)); fireCannon(t,e); b.position.z=-0.35; } } b.position.z=lerp(b.position.z,0,Math.min(1,dt*4)); } } }
// Yerleştirme modu: yeni kule sur kenarında istenen yere
let placing=null;
function startPlacing(k){ if(placing){ scene.remove(placing.ghost.g); } const ghost=towerMesh(k,1,false,M.ghostOk); scene.add(ghost.g); placing={k,ghost,ok:false,spot:null}; moveTarget=null; toast(isTouch?'Sur kenarında bir yere dokun, kule oraya kurulsun':'Sur kenarında bir yere tıkla, kule oraya kurulsun','good'); const sp=placeSpot(player.g.position.x,player.g.position.z); placeGhostAt(sp.x,sp.z); }
function spotOk(s,a){ if(Math.abs(a)<3.4||Math.abs(a)>H-2.4) return false; const [x,z]=sidePos(s,a,-1.5); for(let i=0;i<S.towers.length;i++){ const [tx,tz]=towerPos(i); if(Math.hypot(tx-x,tz-z)<2.8) return false; } for(const B of [DEPOT,STALL,TREASURY]) if(Math.hypot(B.x-x,B.z-z)<3.6) return false; const [qx,qz]=sidePos(s,a,-3.9); for(const pd of pads){ if(!pd.g.visible&&pd.def.kind!=='tower') continue; const px=pd.g.position.x, pz=pd.g.position.z; if(pd.def.kind!=='tower'&&Math.hypot(px-x,pz-z)<2.4) return false; if(Math.hypot(px-qx,pz-qz)<2.5) return false; } for(const B of [DEPOT,STALL,TREASURY]) if(Math.hypot(B.x-qx,B.z-qz)<3.4) return false; return true; }
function placeSpot(x,z){ let best=null; for(const s of SIDES){ const [a,b]=localOf(s,x,z); const aa=clamp(a,-(H-2.4),H-2.4); const [px,pz]=sidePos(s,aa,-1.5); const d=Math.hypot(px-x,pz-z); if(!best||d<best.d) best={s,a:aa,x:px,z:pz,d}; }
  let ok=best.d<7&&spotOk(best.s,best.a);
  if(!ok&&best.d<7){ for(let off=0.5;off<=5;off+=0.5){ for(const sg of [1,-1]){ const a2=best.a+sg*off; if(spotOk(best.s,a2)){ const [px,pz]=sidePos(best.s,a2,-1.5); best.a=a2; best.x=px; best.z=pz; ok=true; break; } } if(ok) break; } }
  best.ok=ok; return best; }
function placeGhostAt(x,z){ if(!placing) return; const sp=placeSpot(x,z); placing.spot=sp; placing.ok=sp.ok; placing.ghost.g.position.set(sp.x,0,sp.z); const d=SD[sp.s]; placing.ghost.g.rotation.y=Math.atan2(d.o[0],d.o[1]); const m=sp.ok?M.ghostOk:M.ghostBad; placing.ghost.g.traverse(o=>{ if(o.isMesh) o.material=m; }); }
function confirmPlace(){ if(!placing) return; const sp=placing.spot; if(!sp||!sp.ok){ toast('Buraya olmaz — sur kenarında boş bir yer seç'); return; } scene.remove(placing.ghost.g); S.towers.push({k:placing.k,side:sp.s,a:sp.a,lvl:1,fixed:false}); const i=S.towers.length-1; buildTower(i); ensureTowerPads(); layoutPads(); placing=null; SFX.build(); burst(new THREE.Vector3(sp.x,0.8,sp.z),18,M.gold,1.2); floatText(new THREE.Vector3(sp.x,0,sp.z),'Kule kuruldu!','green'); save(); }

// ---------- Askerler: düşmana göre kapılar arasında yer değiştirir ----------
const soldiers=[]; let assignT=0, lastAssignKey='';
function soldierSlot(side,i){ const row=Math.floor(i/2), sgn=i%2?1:-1; return sidePos(side,sgn*(1.6+0.7*row),1.3+1.2*row); }
function addSoldier(fresh){ const s=makeGuy('soldier'); s.g.position.set(fresh?0:rand(-2,2),0,fresh?4:rand(-H-3,-H-1)); s.g.rotation.y=Math.PI; scene.add(s.g); soldiers.push({guy:s,side:'N',slot:soldierSlot('N',soldiers.length),cd:rand(0,0.5),arrived:false,moving:false,speed:5.5}); lastAssignKey=''; }
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
      else { const d=SD[s.side]; g.rotation.y=lerp(g.rotation.y,Math.atan2(d.o[0],d.o[1]),Math.min(1,dt*3)); } }
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
function updateTraderNpc(dt){ if(S.lv.trader>=1&&!traderNpc){ traderNpc=makeGuy('worker'); traderNpc.tool.visible=false; const hat=mesh(G.cone,M.flag,0.45,0.5,0.45); hat.position.y=2.1; traderNpc.root.add(hat); scene.add(traderNpc.g); } if(traderNpc){ traderNpc.g.position.set(STALL.x-0.15,0,STALL.z-0.15); traderNpc.g.rotation.y=Math.PI/4; animGuy(traderNpc,dt,false,1); traderNpc.armR.rotation.x=-0.6+Math.sin(performance.now()/300)*0.3; } }

// ---------- İşçiler ve yol bulma (dört kapı) ----------
const workers=[];
function addWorker(kind){ kind=kind||'wood'; const w=makeGuy('worker'); if(kind==='stone'){ w.tool.children[1].material=M.iron; const band=mesh(G.box,M.iron,0.66,0.1,0.66,false); band.position.y=1.7; w.root.add(band); } w.g.position.set(rand(-3,3),0,rand(2,5)); scene.add(w.g); workers.push({guy:w,kind,state:'idle',target:null,logs:0,cap:8+4*(S.lv.depotLv||0),timer:0,chopT:1,speed:5.0+0.6*(S.lv.depotLv||0)+0.7*(S.lv.workerSpd||0),moving:false}); }
for(let i=0;i<S.lv.worker;i++) addWorker('wood'); for(let i=0;i<(S.lv.stoneWorker||0);i++) addWorker('stone');
function insideWall(x,z,m){ return Math.abs(x)<H-m&&Math.abs(z)<H-m; }
function segHitsW(ax,az,bx,bz){ for(let s=0.1;s<=1;s+=0.04){ if(insideWall(ax+(bx-ax)*s,az+(bz-az)*s,0.25)) return true; } return false; }
const gIn=s=>sidePos(s,0,-1.8), gOut=s=>sidePos(s,0,2.4);
function inChannel(s,x,z){ const [a,b]=localOf(s,x,z); return Math.abs(a)<1.3&&b>-2.0&&b<2.6; }
function bestGate(px,pz,tx,tz){ let best='N',bd=1e9; for(const s of SIDES){ const i=gIn(s),o=gOut(s); const d=Math.hypot(px-i[0],pz-i[1])+Math.hypot(tx-o[0],tz-o[1]); if(d<bd){bd=d;best=s;} } return best; }
function routeGoal(p,tx,tz){
  const inP=inW(p.x,p.z), inT=inW(tx,tz); const ch=SIDES.find(s=>inChannel(s,p.x,p.z));
  if(inP&&inT){ if(ch){ const b=localOf(ch,p.x,p.z)[1]; if(b>-1.3) return gIn(ch); } return [tx,tz]; }
  if(inP&&!inT){ const s=ch||bestGate(p.x,p.z,tx,tz); const i=gIn(s); if(ch||Math.hypot(p.x-i[0],p.z-i[1])<0.6) return gOut(s); return i; }
  if(!inP&&inT){ const s=ch||bestGate(tx,tz,p.x,p.z); const o=gOut(s); if(ch||Math.hypot(p.x-o[0],p.z-o[1])<0.6) return gIn(s); if(segHitsW(p.x,p.z,o[0],o[1])) return cornerVia(p,o[0],o[1]); return o; }
  if(segHitsW(p.x,p.z,tx,tz)) return cornerVia(p,tx,tz); return [tx,tz];
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
function walkTo(w,tx,tz,stopDist,dt){ const p=w.guy.g.position; const dReal=Math.hypot(tx-p.x,tz-p.z); if(dReal<=stopDist){ w.moving=false; w.stuckT=0; return true; }
  let [gx,gz]=routeGoal(p,tx,tz);
  if(w.detourT>0){ w.detourT-=dt; gx=w.detour[0]; gz=w.detour[1]; }
  const dx=gx-p.x, dz=gz-p.z, d=Math.hypot(dx,dz); if(d<0.05){ return false; }
  const ox=p.x, oz=p.z; p.x+=dx/d*w.speed*dt; p.z+=dz/d*w.speed*dt; wallCollide(p,0.6,()=>2.3); pushOutOfTrunks(p,1.2); pushOutOfCenter(p,1.8);
  const adv=Math.hypot(p.x-ox,p.z-oz); if(adv<w.speed*dt*0.35){ w.longStuck=(w.longStuck||0)+dt; } else if(adv>w.speed*dt*0.8){ w.longStuck=0; w.okT=(w.okT||0)+dt; if(w.okT>1){ w.stuckN=0; } }
  if(adv<w.speed*dt*0.35&&w.detourT<=0){ w.stuckT=(w.stuckT||0)+dt; if(w.stuckT>0.25){ w.stuckT=0; w.okT=0; w.stuckN=(w.stuckN||0)+1; let ang; if(w.stuckN<=2){ const side=(w.side=(w.side||1)*-1); ang=Math.atan2(dz,dx)+side*Math.PI/2; } else ang=rand(0,6.28); const L=3+Math.min(4,w.stuckN); w.detour=[p.x+Math.cos(ang)*L,p.z+Math.sin(ang)*L]; w.detourT=0.7+0.1*w.stuckN; } } else if(w.detourT<=0) w.stuckT=0;
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
const EK={grunt:{hp:1,spd:1,atk:4,loot:1,arrow:1,cannon:1,sc:1,rad:1.15,name:'asker'}, runner:{hp:0.5,spd:1.85,atk:3,loot:1,arrow:1,cannon:0.8,sc:0.85,rad:1.0,name:'koşucu'}, shield:{hp:2.2,spd:0.8,atk:6,loot:2,arrow:0.45,cannon:1.25,sc:1.1,rad:1.3,name:'kalkanlı'}, ram:{hp:6,spd:0.62,atk:24,loot:4,arrow:0.6,cannon:1.6,sc:1,rad:1.8,name:'kuşatma aracı'}, boss:{hp:14,spd:0.6,atk:16,loot:12,arrow:0.8,cannon:1.2,sc:1.9,rad:2.2,name:'patron'}};
function makeEnemy(kind,side){ const K=EK[kind]||EK.grunt; const w=gw(); const mul=(plan&&plan.hpMul&&plan.hpMul[side])||1; const hp=Math.round(9*Math.pow(1.14,w-1)*K.hp*mul); let g, guy=null, pushers=null, ramLog=null; const sc=K.sc;
  if(kind==='ram'){ g=new THREE.Group(); const fr=new THREE.Group(); for(const x of [-0.6,0.6]){ const b=mesh(G.box,M.woodDark,0.22,0.3,2.8); b.position.set(x,0.55,0); fr.add(b);} for(const [x,z] of [[-0.8,-0.9],[0.8,-0.9],[-0.8,0.9],[0.8,0.9]]){ const wh=mesh(G.cyl,M.iron,0.36,0.16,0.36); wh.rotation.z=Math.PI/2; wh.position.set(x,0.36,z); fr.add(wh);} for(const z of [-0.8,0.8]){ const post=mesh(G.box,M.woodDark,1.5,0.16,0.16); post.position.set(0,1.3,z); fr.add(post); for(const x of [-0.6,0.6]){ const up=mesh(G.box,M.woodDark,0.14,0.9,0.14); up.position.set(x,0.95,z); fr.add(up);} } ramLog=new THREE.Group(); const lg=mesh(G.cyl,M.trunk,0.3,3.2,0.3); lg.rotation.x=Math.PI/2; ramLog.add(lg); const cap=mesh(G.cone,M.iron,0.36,0.5,0.36); cap.rotation.x=Math.PI/2; cap.position.z=1.85; ramLog.add(cap); for(const z of [-1,0.6]){ const band=mesh(G.cyl,M.iron,0.34,0.14,0.34,false); band.rotation.x=Math.PI/2; band.position.z=z; ramLog.add(band);} ramLog.position.set(0,1.05,0.2); fr.add(ramLog); const flag=mesh(G.box,M.enemy,0.05,0.5,0.7,false); flag.position.set(0,2.0,-0.9); fr.add(flag); g.add(fr); pushers=[]; for(const x of [-0.45,0.45]){ const pg=makeGuy('enemy'); pg.tool.visible=false; pg.g.position.set(x,0,-1.9); pg.armL.rotation.x=-1.4; pg.armR.rotation.x=-1.4; g.add(pg.g); pushers.push(pg);} }
  else { guy=makeGuy('enemy'); g=guy.g; g.scale.setScalar(sc);
    if(kind==='boss'){ const h1=mesh(G.cone,M.gold,0.14,0.5,0.14); h1.position.set(-0.3,2.0,0); h1.rotation.z=0.4; const h2=h1.clone(); h2.position.x=0.3; h2.rotation.z=-0.4; guy.root.add(h1,h2); }
    if(kind==='shield'){ const sh=mesh(G.cyl,M.iron,0.62,0.08,0.62); sh.rotation.x=Math.PI/2; sh.position.set(0.05,-0.25,0.34); const boss2=mesh(G.sph,M.gold,0.14,0.14,0.08,false); boss2.position.set(0.05,-0.25,0.4); guy.armL.add(sh,boss2); const hm=mesh(G.sph,M.iron,0.66,0.46,0.66); hm.position.set(0,1.68,0); guy.root.add(hm); }
    if(kind==='runner'){ const band=mesh(G.box,M.enemyDark,0.62,0.12,0.62,false); band.position.y=1.66; guy.root.add(band); const tail=mesh(G.box,M.enemyDark,0.1,0.06,0.5,false); tail.position.set(0.2,1.62,-0.4); guy.root.add(tail); } }
  const path=ROADS[side]; const off=rand(-0.5,0.5); const d=SD[side]; g.position.set(path[0][0]+d.t[0]*off+rand(-.3,.3),0,path[0][1]+d.t[1]*off+rand(-.3,.3)); scene.add(g);
  const bar=document.createElement('div'); bar.className='hpbar'+(kind==='boss'||kind==='ram'?' boss':''); bar.innerHTML='<i></i>'; document.body.appendChild(bar);
  enemies.push({g,guy,pushers,ramLog,kind,K,hp,maxHp:hp,boss:kind==='boss',sc,rad:K.rad,side,speed:3.4*K.spd*rand(0.97,1.03),atk:K.atk,atkCd:0,atkT:kind==='ram'?1.6:1.0,dead:false,hitT:0,wp:1,off,bar,swing:0,ramT:0});
}
let waveT=8, waveActive=false, spawnQueue=0, spawnT=0, spawnIdx=0, waveSeed=0; let plan=null; let gateWarned=false;

function pickKind(w,i,total){ if(S.wave===WAVES&&i===total-1) return 'boss'; if(w>=5&&i%12===6&&(w>=9||S.wave%2===0)) return 'ram'; const r=Math.random(); if(w>=3&&r<0.2+0.01*w) return 'shield'; if(w>=2&&r<0.45+0.01*w) return 'runner'; return 'grunt'; }
function planWave(){ const w=gw(); const total=7+Math.floor(w*1.9); const k=sidesActive(); const seed=Math.floor(Math.random()*4); const cnt={N:0,E:0,S:0,W:0}; const kinds=[]; const kc={}; for(let i=0;i<total;i++){ cnt[SIDES[(Math.floor(i/4)+seed)%k]]++; const kd=pickKind(w,i,total); kinds.push(kd); kc[kd]=(kc[kd]||0)+1; } plan={seed,cnt,total,kinds,kc}; return plan; }
function planText(){ if(!plan) planWave(); let t=SIDES.filter(s=>plan.cnt[s]>0).map(s=>SIDE_TR[s]+' '+plan.cnt[s]).join(' · '); const ex=[]; if(plan.kc.shield) ex.push('kalkanlı '+plan.kc.shield); if(plan.kc.ram) ex.push('kuşatma '+plan.kc.ram); if(plan.kc.boss) ex.push('patron'); if(ex.length) t+=' · '+ex.join(', '); return t; }
// ---- Denge: dalga gücü, o anki savunma gücüne göre ölçülür (hep "kıl payı" hissi) ----
// Bir kapıya doğru gelen düşmanın yolda ve kapı önünde yiyeceği toplam hasar hesaplanır; dalganın toplam canı bunun biraz altına ayarlanır.
function defenseDps(side,mA,mC){ const [gx,gz]=sidePos(side,0,2.5); let dps=0; for(const t of towers){ if(!t) continue; const range=D.towerRange()+(t.isC?8:0)+(t.kind==='c'?3:0); const d=Math.hypot(t.g.position.x-gx,t.g.position.z-gz); if(d>range-1.5) continue; if(t.kind==='a'){ const rate=(1.5+0.35*(t.lvl-1))*(t.isC?1.4:1)*D.towerRate(); dps+=D.towerDmg(t.lvl)*rate*(t.isC?2.6:1)*0.9*(mA||1); } else { dps+=D.cannonDmg(t.lvl)*(0.45+0.08*(t.lvl-1))*1.5*(mC||1); } } return dps; }
function waveTilt(){ const w=gw(); let t=w<=2?0.5:w<=10?0.5+0.04*(w-2):0.82; if(lastWaveFail===w) t-=0.12; return t; }
// Her kapı için: kule+asker+oyuncu hasarı (düşman türlerinin ok/gülle direnci ve hızı dahil) × düşmanın yolda ve kapıda geçireceği süre × eğim = o kapıya gelen dalganın toplam canı
function balanceWave(pl){ const w=gw(); const k=sidesActive(); const soldierDps=soldiers.length*D.soldierDmg()/Math.max(0.22,0.7-0.05*(S.lv.soldierTrain||0)); const playerDps=D.swordDmg()/0.45*0.5; const gateMax=D.gateMax(); const nominal=9*Math.pow(1.14,w-1); pl.hpMul={}; pl.dbg={};
  for(const s of SIDES){ const cnt=pl.cnt[s]; if(!cnt) continue; let avgHp=0, avgAtk=0, mA=0, mC=0, spd=0; for(let i=0;i<pl.kinds.length;i++){ if(SIDES[(Math.floor(i/4)+pl.seed)%k]!==s) continue; const K=EK[pl.kinds[i]]||EK.grunt; avgHp+=K.hp; avgAtk+=K.atk; mA+=K.arrow; mC+=K.cannon; spd+=K.spd; } avgHp/=cnt; avgAtk/=cnt; mA/=cnt; mC/=cnt; spd/=cnt;
    const share=cnt/pl.total; const dps=defenseDps(s,mA,mC)+soldierDps*share+playerDps*share; const travel=(D.towerRange()-3)/(3.4*spd); const grace=clamp(0.5*gateMax*share/(cnt*0.75*avgAtk),2.5,12); const T=0.36*cnt+travel+grace; const budget=dps*T*waveTilt(); const nomTotal=nominal*avgHp*cnt; const mul=clamp(budget/Math.max(1,nomTotal),0.5,10); pl.hpMul[s]=mul; pl.dbg[s]={dps:Math.round(dps),T:+T.toFixed(1),budget:Math.round(budget),nom:Math.round(nomTotal),mul:+mul.toFixed(2)}; } }
function startWave(){ if(!plan) planWave(); balanceWave(plan); gateWarned=false; waveActive=true; const w=gw(); spawnQueue=plan.total; spawnT=0; spawnIdx=0; waveSeed=plan.seed; SFX.wave(); const k=sidesActive(); toast(S.wave===WAVES? 'Son dalga — patron geliyor!' : plan.kc.ram? `${S.wave}. dalga: kuşatma aracı geliyor! Topçu iyi gelir` : k>1? `${S.wave}. dalga: ${k} yönden saldırı!` : `${S.wave}. dalga geliyor!`); }
function spawnOne(){ const k=sidesActive(); const side=SIDES[(Math.floor(spawnIdx/4)+waveSeed)%k]; const kind=(plan&&plan.kinds[spawnIdx])||'grunt'; spawnIdx++; makeEnemy(kind,side); }
const gateMarks={}; for(const s of SIDES){ const g=new THREE.Group(); const cone=mesh(G.cone,M.enemy,0.55,0.9,0.55,false); cone.rotation.x=Math.PI; const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.7,32),new THREE.MeshBasicMaterial({color:0xd63a3a,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=-5.4; g.add(cone,ring); g.visible=false; scene.add(g); gateMarks[s]={g,cone,ring}; }
function updateGateMarks(dt){ const t=performance.now()/1000; for(const s of SIDES){ const m=gateMarks[s]; let on=false; if(celebT<=0&&!$('levelCard')){ if(!waveActive&&plan&&plan.cnt[s]>0) on=true; if(waveActive&&(enemies.some(e=>!e.dead&&e.side===s)||(spawnQueue>0&&plan&&plan.cnt[s]>0))) on=true; } m.g.visible=on; if(!on) continue; const [x,z]=sidePos(s,0,2.2); m.g.position.set(x,5.6+Math.sin(t*4)*0.3,z); m.g.rotation.y=t*2; const k=1+0.15*Math.sin(t*6); m.ring.scale.set(k,k,1); } }
function damageEnemy(e,dmg,src){ if(e.dead) return; const m=src&&e.K&&e.K[src]!==undefined? e.K[src] : 1; e.hp-=dmg*m; e.hitT=0.18; SFX.hit(); if(m<0.7&&src==='arrow'&&Math.random()<0.3) burst(e.g.position.clone().setY(1.2),3,M.metal,0.5); if(e.hp<=0) killEnemy(e); }
function killEnemy(e){ e.dead=true; e.bar.remove(); S.kills++; questEvent('kill'); if(e.boss) cgCall(k=>k.game.happytime()); SFX.die(); burst(e.g.position.clone().setY(0.8),9,M.enemy,1); const reward=(8+gw()*2.5)*(e.boss?10:e.kind==='ram'?3:1); scene.remove(e.g); const nl=e.K?e.K.loot:1; for(let i=0;i<nl;i++) dropLoot(e.g.position.x,e.g.position.z); if(e.kind==='ram'){ burst(e.g.position.clone().setY(1),16,M.woodDark,1.2); burst(e.g.position.clone().setY(1),8,M.trunk,1); } if(e.boss){ dropCoins(e.g.position.clone().setY(0.8),60,reward/60,8,1.3); } else if(Math.random()<0.35){ dropCoins(e.g.position.clone().setY(0.8),2,Math.round(reward/6),2.5,1); } }
let gateShake=0, gateDownT=0, levelReward=0;
function levelComplete(){ cgCall(k=>k.game.happytime()); levelReward=Math.round(200*Math.pow(1.6,S.level-1)); celebT=10; celebSpawn=0; SFX.wave(); setTimeout(SFX.wave,300); toast(`Bölüm ${S.level} tamamlandı! Altınları topla`,'good'); dropCoins(new THREE.Vector3(0,3,4),60,levelReward/260,6,1.4); }
function showLevelCard(){ if($('levelCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='levelCard'; card.innerHTML=`<div class="card"><div class="stars">★ ★ ★</div><h1>Bölüm ${S.level} tamamlandı!</h1><p>${S.kills} düşman, ${S.treesCut} ağaç. ${Math.floor(S.coins)} altının var.<br>Sıradaki bölümde düşmanlar daha güçlü, ödüller daha büyük.</p><button id="nextLevel">Bölüm ${S.level+1}'e geç</button></div>`; document.body.appendChild(card); $('nextLevel').addEventListener('click',()=>{ const go=()=>{ for(const c of coins) S.coins+=c.value; coins.length=0; stackH.clear(); S.level++; S.wave=1; waveT=12; plan=null; planWave(); S.perkOffer=null; save(); card.remove(); toast(`Bölüm ${S.level} başladı!`,'good'); setTimeout(()=>{ showPerkCard(); S.gateHp=D.gateMax(); },100); }; $('nextLevel').disabled=true; cgAd('midgame',go,go); }); }
function updateEnemies(dt){
  if(celebT>0||$('levelCard')){ }
  else if(!waveActive){ if(gateDownT>0){ } else { if(S.level===1&&S.wave===1&&S.towers[1].lvl<1&&S.towers[2].lvl<1&&introT<30) waveT=Math.max(waveT,4); waveT-=dt; if(waveT<=0) startWave(); } }
  else if(spawnQueue>0){ spawnT-=dt; if(spawnT<=0){ spawnT=0.36; spawnQueue--; spawnOne(); } }
  else if(enemies.every(e=>e.dead)){ waveActive=false; if(S.wave>=WAVES){ levelComplete(); return; } S.wave++; questEvent('wave'); waveT=Math.max(5,10-gw()*0.3); plan=null; planWave(); const bonus=15+gw()*5; toast(`Dalga temizlendi! +${bonus}`,'good'); const n=Math.min(40,10+gw()*2); dropCoins(new THREE.Vector3(0,2,4),n,bonus/n,4,1.2); save(); }
  if(celebT>0){ celebT-=dt; celebSpawn-=dt; if(celebSpawn<=0&&celebT>4){ celebSpawn=0.1; const cx=rand(-H+2,H-2), cz=rand(-H+2,H-2); dropCoins(new THREE.Vector3(cx,6,cz),8,levelReward/260,2.5,0.4); } if(celebT<=0||(celebT<4&&coins.length===0)){ celebT=0; showLevelCard(); } }
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.dead){ enemies.splice(i,1); continue; }
    const path=ROADS[e.side]; const d0=SD[e.side]; const last=e.wp>=path.length; let tx,tz; if(last){ [tx,tz]=sidePos(e.side,e.off*0.8,1.7); } else { tx=path[e.wp][0]+d0.t[0]*e.off; tz=path[e.wp][1]+d0.t[1]*e.off; }
    const dx=tx-e.g.position.x, dz=tz-e.g.position.z, d=Math.hypot(dx,dz);
    let blocked=null; for(const o of enemies){ if(o===e||o.dead) continue; const ox=o.g.position.x-e.g.position.x, oz=o.g.position.z-e.g.position.z; const od=Math.hypot(ox,oz); if(od<(e.rad||1.15)&&od>0.001&&(ox*dx+oz*dz)/(od*d)>0.55){ blocked=o; break; } }
    if(e.stuckT>2.5) blocked=null;
    const nearGate=last&&d<4.2&&blocked;
    if(!last&&d<0.6){ e.wp++; }
    else if((!last||d>0.5)&&!nearGate){ const ox0=e.g.position.x, oz0=e.g.position.z; if(!blocked){ e.g.position.x+=dx/d*e.speed*dt; e.g.position.z+=dz/d*e.speed*dt; } else { const bx=blocked.g.position.x-e.g.position.x, bz=blocked.g.position.z-e.g.position.z, bd=Math.hypot(bx,bz)||1; e.g.position.x+=(dx/d*0.5-bx/bd*0.4)*e.speed*dt; e.g.position.z+=(dz/d*0.5-bz/bd*0.4)*e.speed*dt; } const adv=Math.hypot(e.g.position.x-ox0,e.g.position.z-oz0); e.stuckT=adv<e.speed*dt*0.5? (e.stuckT||0)+dt : (e.stuckT>2.5&&e.stuckT<3.5? e.stuckT+dt : 0); e.g.rotation.y=Math.atan2(dx,dz); animEnemy(e,dt,!blocked); }
    else { e.atkCd-=dt; animEnemy(e,dt,false); if(nearGate&&d>0.5){ e.g.rotation.y=Math.atan2(dx,dz); } if(e.atkCd<=0){ e.atkCd=e.atkT*(nearGate&&d>0.5?1.6:1); if(e.guy) e.guy.swing=0.3; else e.ramT=0.5; S.gateHp-=e.atk; SFX.gate(); gateShake=0.25; if(!gateWarned&&S.gateHp<D.gateMax()*0.35){ gateWarned=true; toast('Sur zorlanıyor — '+SIDE_TR[e.side]+' kapısına koş!'); } const [bx,bz]=sidePos(e.side,rand(-1.5,1.5),0); burst(new THREE.Vector3(bx,1.4,bz),4,M.wood,0.6); if(S.gateHp<=0) gateBroken(); } }
    if(e.hitT>0){ e.hitT-=dt; const k=1+e.hitT*0.8; e.g.scale.set(e.sc*k,e.sc/k,e.sc*k); } else e.g.scale.setScalar(e.sc);
    v3.set(e.g.position.x,e.kind==='ram'?2.8:2.4*e.sc,e.g.position.z).project(camera); e.bar.style.left=((v3.x+1)/2*innerWidth)+'px'; e.bar.style.top=((1-v3.y)/2*innerHeight)+'px'; e.bar.firstElementChild.style.width=(clamp(e.hp/e.maxHp,0,1)*100)+'%';
  }
}
function animEnemy(e,dt,moving){ if(e.guy){ animGuy(e.guy,dt,moving,1.1*(e.kind==='runner'?1.4:1)); return; } for(const pg of e.pushers) animGuy(pg,dt,moving,0.9); if(e.ramT>0){ e.ramT-=dt; const k=e.ramT/0.5; e.ramLog.position.z=0.2+(k>0.5? (1-k)*2*1.0 : k*2*1.0); } else e.ramLog.position.z=lerp(e.ramLog.position.z,0.2,Math.min(1,dt*6)); }
// Sur yarıldı: dalga KAYBEDİLDİ — altın çalınır, düşman ganimetle kaçar, sur onarılınca aynı dalga yeniden gelir (temizlendi sayılmaz)
function gateBroken(){ S.gateHp=0; const loss=Math.floor(S.coins*0.2); S.coins-=loss; for(const e of enemies){ if(!e.dead){ e.dead=true; e.bar.remove(); burst(e.g.position.clone().setY(0.8),5,M.enemy,0.8); scene.remove(e.g);} } for(const pr of projectiles) scene.remove(pr.m); projectiles.length=0; toast(`Sur yarıldı! ${loss} altın çalındı — dalga ${S.wave} onarımdan sonra yeniden gelecek`); SFX.boom(); gateDownT=7; spawnQueue=0; waveActive=false; waveT=12; S.waveFails=(S.waveFails||0)+1; lastWaveFail=gw(); save(); }
let lastWaveFail=0;
function shoot(from,target,dmg){ const m=mesh(G.cyl,M.handle,0.035,0.8,0.035,false); m.position.copy(from); scene.add(m); projectiles.push({m,target,dmg,spd:26}); }
function updateProjectiles(dt){ for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; const t=p.target; if(t.dead){ scene.remove(p.m); projectiles.splice(i,1); continue; } const to=t.g.position.clone(); to.y=0.9; const dir=to.sub(p.m.position); const dist=dir.length(); if(dist<0.7){ scene.remove(p.m); projectiles.splice(i,1); damageEnemy(t,p.dmg,'arrow'); continue; } dir.normalize(); p.m.position.addScaledVector(dir,p.spd*dt); p.m.lookAt(t.g.position.x,0.9,t.g.position.z); p.m.rotateX(Math.PI/2); } }
function fireCannon(t,e){ const m=mesh(G.sph,M.ball,0.28,0.28,0.28,false); m.position.copy(t.top); scene.add(m); const to=e.g.position.clone(); to.addScaledVector(new THREE.Vector3(Math.sin(e.g.rotation.y),0,Math.cos(e.g.rotation.y)),e.speed*0.5); balls.push({m,from:t.top.clone(),to,t:0,dur:0.55+t.top.distanceTo(to)*0.012,dmg:D.cannonDmg(t.lvl)}); SFX.boom(); burst(t.top.clone(),5,M.smoke,0.4,1.4); }
function updateBalls(dt){ for(let i=balls.length-1;i>=0;i--){ const b=balls[i]; b.t+=dt; const k=Math.min(1,b.t/b.dur); b.m.position.lerpVectors(b.from,b.to,k); b.m.position.y+=Math.sin(k*Math.PI)*6; if(k>=1){ scene.remove(b.m); balls.splice(i,1); burst(b.to.clone().setY(0.6),14,M.smoke,1,1.6); burst(b.to.clone().setY(0.6),8,M.gold,1); SFX.boom(); for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(b.to); if(d<2.8) damageEnemy(e,b.dmg*(d<1.2?1:0.6),'cannon'); } } } }
function nearestEnemy(pos,range){ let best=null,bd=range; for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(pos); if(d<bd){bd=d;best=e;} } return best; }
