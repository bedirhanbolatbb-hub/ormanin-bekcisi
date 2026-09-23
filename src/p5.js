
// =====================================================================
// ---------- Krallık: bölgeler, balık, makineler, para yığınları ----------
// =====================================================================
const FISH_GEO=mergeGeos([new THREE.SphereGeometry(0.3,10,8).scale(1.6,0.8,0.5), new THREE.ConeGeometry(0.22,0.38,4).rotateZ(Math.PI/2).translate(-0.62,0,0)]);
const MEAT_GEO=mergeGeos([new THREE.SphereGeometry(0.28,10,8).scale(1.3,0.9,0.9), new THREE.CylinderGeometry(0.06,0.06,0.5,6).rotateZ(Math.PI/2).translate(0.52,0,0)]);
const revealed=id=>!!(S.revealed&&S.revealed[id]);
const rg=k=>(S.lv&&S.lv[k])||0;

// ----- oyuncunun sırtında balık ve et -----
player.fishMesh=new THREE.InstancedMesh(FISH_GEO,M.fish,60); player.fishMesh.count=0; player.fishMesh.frustumCulled=false; player.back.add(player.fishMesh);
player.meatMesh=new THREE.InstancedMesh(MEAT_GEO,M.meat,60); player.meatMesh.count=0; player.meatMesh.frustumCulled=false; player.back.add(player.meatMesh);
const BACK_EXTRA=[];
function setExtraBack(){ const g=player; if(!g||!g.fishMesh) return; let row=Math.ceil(S.logs/2)+Math.ceil((S.stones||0)/2)+Math.ceil((S.loot||0)/2);
  const put=(im,n)=>{ n=Math.max(0,Math.min(60,n)); for(let i=0;i<n;i++){ const r=row+Math.floor(i/2), s=i%2; vp.set(s?0.24:-0.24,0.14+r*0.3,-0.05); e3.set(0,Math.PI/2,0.15*(s?1:-1)); q.setFromEuler(e3); vs.set(0.85,0.85,0.85); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); } im.count=n; im.instanceMatrix.needsUpdate=true; row+=Math.ceil(n/2); };
  put(g.fishMesh,S.fish||0); put(g.meatMesh,S.meat||0); for(const b of BACK_EXTRA) put(b.im,S[b.key]||0); }
const fishCap=()=>12+4*S.lv.feet;

// ----- para yığını: makinenin ürettiği altın burada birikir, yanına gelince toplanır -----
const piles=[];
function makePile(pos,capFn){ const g=new THREE.Group(); g.position.copy(pos); const base=mesh(G.cyl,M.woodDark,1.1,0.18,1.1); base.position.y=0.09; g.add(base);
  const im=new THREE.InstancedMesh(G.coin,M.coin,64); im.count=0; im.castShadow=true; g.add(im); scene.add(g);
  for(let i=0;i<64;i++){ const col=i%4, row=Math.floor(i/4); const cx=(col%2)-0.5, cz=Math.floor(col/2)-0.5; vp.set(cx*0.5,0.26+row*0.13,cz*0.5); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.85,0.85,0.85); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); }
  const L=addLabel(pos,'',2.4); L.near=-1; L.el.classList.add('pileLbl');
  const P={g,im,pos,capFn,L,key:'',t:0,full:false}; piles.push(P); return P; }
function pileVal(P){ return (S.rg[P.id]||0); }
function pileAdd(P,v){ const cap=P.capFn(); S.rg[P.id]=Math.min(cap,(S.rg[P.id]||0)+v); }
function updatePiles(dt){ const p=player.g.position; for(const P of piles){ if(!P.g.visible) continue; const v=pileVal(P), cap=P.capFn(); const n=v<=0?0:Math.min(64,Math.max(1,Math.ceil(v/cap*64))); if(P.im.count!==n){ P.im.count=n; }
    P.full=v>=cap-0.5; const key=Math.floor(v)+'|'+P.full; if(key!==P.key){ P.key=key; P.L.el.innerHTML=v<1?'':(P.full?'<b class="full">Dolu!</b> ':'')+'💰 '+Math.floor(v); P.L.el.style.display=v<1?'none':''; } P.L.hide=v<1;
    if(v>=1&&Math.hypot(p.x-P.pos.x,p.z-P.pos.z)<2.6){ P.t-=dt; if(P.t<=0){ P.t=0.05; const take=Math.max(1,Math.min(v,Math.max(4,v/10))); S.rg[P.id]=v-take; questEvent('pile',take); fly(P.pos.clone().setY(0.8+n*0.02),player.g,()=>{ S.coins+=take; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.06; SFX.coin(); } } } } }

// ----- kilitli bölgeler: bulut örtüsü + tabela; sefer kazanınca törenle açılır -----
const regionFx={};
function buildClouds(id){ const R=REG[id]; const g=new THREE.Group(); g.position.set(R.c[0],0,R.c[1]); const n=Math.round(10+R.r*1.1); const puffs=[];
  for(let i=0;i<n;i++){ const a=i/n*6.283+rand(-.2,.2), rr=rand(0.2,1)*R.r; const s=rand(3.2,5.6); const m=new THREE.Mesh(G.sph,M.cloud); m.scale.set(s,s*0.62,s); m.position.set(Math.cos(a)*rr,s*0.35+rand(0,1.2),Math.sin(a)*rr); m.castShadow=false; m.receiveShadow=true; g.add(m); puffs.push({m,y0:m.position.y,ph:rand(0,6)}); }
  const post=mesh(G.cyl,M.woodDark,0.14,3.0,0.14); const dir=new THREE.Vector3(-R.c[0],0,-R.c[1]).normalize(); const sp=dir.clone().multiplyScalar(R.r+2.5); post.position.set(sp.x,1.5,sp.z); const board=mesh(G.box,M.plank,2.2,1.0,0.14); board.position.set(sp.x,2.7,sp.z); board.rotation.y=Math.atan2(dir.x,dir.z); g.add(post,board);
  scene.add(g); const L=addLabel(new THREE.Vector3(R.c[0]+sp.x,0,R.c[1]+sp.z),`🔒 ${R.name}<small>${R.sefer}. seferde açılır · ${R.job}</small>`,4.0); L.near=3; L.el.classList.add('lockLbl');
  regionFx[id]={g,puffs,L,rev:null}; }
for(const id in REG) buildClouds(id);
function syncClouds(){ for(const id in regionFx){ const F=regionFx[id]; const on=!revealed(id); if(!F.rev){ F.g.visible=on; F.L.hide=!on; } } }
function revealRegion(id,cb){ const F=regionFx[id]; if(!F){ cb&&cb(); return; } S.revealed[id]=true; save(); F.rev={t:0,cb,done:false}; follow=false; }
function updateRegionFx(dt){ const t=performance.now()/1000; for(const id in regionFx){ const F=regionFx[id]; if(!F.g.visible) continue; for(const pf of F.puffs){ pf.m.position.y=pf.y0+Math.sin(t*0.6+pf.ph)*0.25; }
    if(F.rev){ const r=F.rev; r.t+=dt; const R=REG[id]; const p=player.g.position; const tgt=new THREE.Vector3(R.c[0]-p.x,0,R.c[1]-p.z);
      if(r.t<1.0){ camPan.lerp(tgt,Math.min(1,dt*3.2)); zoomTarget=Math.max(zoomTarget,1.35); }
      else if(r.t<3.2){ camPan.copy(tgt); const k=clamp((r.t-1.2)/1.6,0,1); for(const pf of F.puffs){ const s0=pf.s0||(pf.s0=pf.m.scale.x); const s=s0*(1-k*k); pf.m.scale.set(Math.max(0.001,s),Math.max(0.001,s*0.62),Math.max(0.001,s)); pf.m.position.y+=dt*6*k; } M.cloud.opacity=0.96;
        if(!r.boom&&r.t>1.25){ r.boom=true; SFX.fanfare(); camShake=0.5; for(let i=0;i<8;i++) burst(new THREE.Vector3(R.c[0]+rand(-R.r,R.r),2,R.c[1]+rand(-R.r,R.r)),10,M.cloud,1.4,2.2); celebrate(new THREE.Vector3(R.c[0],0,R.c[1]),1.6); }
        if(!r.ban&&r.t>1.6){ r.ban=true; banner('Yeni bölge: '+R.name,R.job+' açıldı!','day'); } }
      else { F.g.visible=false; F.L.hide=true; for(const pf of F.puffs){ if(pf.s0) pf.m.scale.set(pf.s0,pf.s0*0.62,pf.s0); } F.rev=null; recenter(); if(r.cb) setTimeout(r.cb,300); } } } }
function regionCollide(p){ for(const id in REG){ if(revealed(id)) continue; const R=REG[id]; const dx=p.x-R.c[0], dz=p.z-R.c[1], d=Math.hypot(dx,dz), rr=R.r+2.2; if(d<rr&&d>0.001){ p.x=R.c[0]+dx/d*rr; p.z=R.c[1]+dz/d*rr; } }
  if(revealed('lake')) lakeCollide(p); collide6(p); }

// =====================================================================
// ---------- Gümüş Göl: su, iskele, balıkhane, balıkçı, balık ağı ----------
// =====================================================================
const LK=REG.lake; const LC=new THREE.Vector3(LK.c[0],0,LK.c[1]); const LDIR=new THREE.Vector3(-LK.c[0],0,-LK.c[1]).normalize(); const LPERP=new THREE.Vector3(-LDIR.z,0,LDIR.x);
const lat=(d,s)=>LC.clone().addScaledVector(LDIR,d).addScaledVector(LPERP,s);
const DOCK_END=lat(LK.r-5.2,0), DOCK_BASE=lat(LK.r+1.2,0), HUT=lat(LK.r+3.4,5.6), HUT_FRONT=lat(LK.r+5.2,4.6);
const lake=new THREE.Group(); scene.add(lake);
const ripples=[];
(function(){ const shore=new THREE.Mesh(new THREE.CircleGeometry(LK.r+2.4,64),M.sand); shore.rotation.x=-Math.PI/2; shore.position.set(LC.x,0.015,LC.z); shore.receiveShadow=true;
  const water=new THREE.Mesh(new THREE.CircleGeometry(LK.r,64),M.water); water.rotation.x=-Math.PI/2; water.position.set(LC.x,0.05,LC.z); water.receiveShadow=true;
  const deep=new THREE.Mesh(new THREE.CircleGeometry(LK.r*0.55,48),new THREE.MeshBasicMaterial({color:0x2a7fb0,transparent:true,opacity:0.35,depthWrite:false})); deep.rotation.x=-Math.PI/2; deep.position.set(LC.x+1.2,0.055,LC.z-0.8);
  const shine=new THREE.Mesh(new THREE.RingGeometry(LK.r-0.9,LK.r-0.35,64),M.waterLight); shine.rotation.x=-Math.PI/2; shine.position.set(LC.x,0.06,LC.z); lake.add(shore,water,deep,shine);
  for(let i=0;i<7;i++){ const m=new THREE.Mesh(new THREE.RingGeometry(0.5,0.7,28),new THREE.MeshBasicMaterial({color:0xe6f7ff,transparent:true,opacity:0,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=0.07; lake.add(m); ripples.push({m,t:rand(0,3)}); }
  for(let i=0;i<9;i++){ const a=rand(0,6.28), rr=rand(3,LK.r-2); const lp=new THREE.Mesh(new THREE.CircleGeometry(rand(0.45,0.75),10,0.3,5.6),M.lily); lp.rotation.x=-Math.PI/2; lp.rotation.z=rand(0,6); lp.position.set(LC.x+Math.cos(a)*rr,0.07,LC.z+Math.sin(a)*rr); lake.add(lp); if(i%3===0){ const fl=mesh(G.sph,M.flower,0.16,0.12,0.16,false); fl.material=mat(0xf6a6c8); fl.position.set(lp.position.x+0.15,0.14,lp.position.z); lake.add(fl); } }
  const reeds=[]; for(let i=0;i<70;i++){ const a=rand(0,6.28); if(Math.abs(Math.atan2(Math.sin(a-Math.atan2(LDIR.z,LDIR.x)),Math.cos(a-Math.atan2(LDIR.z,LDIR.x))))<0.5) continue; const rr=LK.r+rand(-0.4,0.9); reeds.push({x:LC.x+Math.cos(a)*rr,y:0.45,z:LC.z+Math.sin(a)*rr,sx:.12,sy:rand(.6,1.3),sz:.12,rz:rand(-.2,.2),c:Math.random()<.5?0x5c9a4a:0x7aa85a}); }
  instanced(G.cone,mat(0xffffff),reeds,false);
  const stones=[]; for(let i=0;i<16;i++){ const a=rand(0,6.28), rr=LK.r+rand(1.0,2.2); stones.push({x:LC.x+Math.cos(a)*rr,y:0.1,z:LC.z+Math.sin(a)*rr,sx:rand(.3,.7),sy:rand(.2,.4),sz:rand(.3,.7),ry:rand(0,6),c:0xb9b3a6}); } instanced(G.dod,mat(0xffffff),stones);
  // iskele
  const len=(LK.r+1.2)-(LK.r-5.8); const mid=lat((LK.r+1.2+LK.r-5.8)/2,0); const ang=Math.atan2(LDIR.x,LDIR.z);
  const deck=mesh(G.box,M.plank,1.9,0.18,len); deck.position.set(mid.x,0.34,mid.z); deck.rotation.y=ang; lake.add(deck);
  for(let i=0;i<=len/0.55;i++){ const pp=lat(LK.r+1.2-i*0.55,0); const ln=mesh(G.box,M.woodDark,1.92,0.19,0.05,false); ln.position.set(pp.x,0.345,pp.z); ln.rotation.y=ang; lake.add(ln); }
  for(let i=0;i<4;i++){ for(const s of [-0.95,0.95]){ const pp=lat(LK.r-0.4-i*1.8,s); const post=mesh(G.cyl,M.woodDark,0.12,1.2,0.12); post.position.set(pp.x,0.35,pp.z); lake.add(post); } }
  const lamp=lat(LK.r-5.6,0.9); const lp2=mesh(G.cyl,M.woodDark,0.07,1.8,0.07); lp2.position.set(lamp.x,1.2,lamp.z); const lb=mesh(G.box,M.gold,0.22,0.3,0.22,false); lb.position.set(lamp.x,2.2,lamp.z); lake.add(lp2,lb);
  const boat=new THREE.Group(); const hull=mesh(G.box,M.wood,1.1,0.4,2.4); hull.position.y=0.2; const bow=mesh(G.cone4,M.wood,0.55,0.8,0.3); bow.rotation.x=Math.PI/2; bow.position.set(0,0.2,1.5); const seat=mesh(G.box,M.woodDark,1.0,0.1,0.3,false); seat.position.y=0.42; boat.add(hull,bow,seat); const bp=lat(LK.r-2.2,-2.1); boat.position.set(bp.x,0.08,bp.z); boat.rotation.y=ang+0.4; lake.add(boat); lake.boat=boat;
})();
function lakeCollide(p){ const dx=p.x-LC.x, dz=p.z-LC.z, d=Math.hypot(dx,dz); if(d>=LK.r-0.25) return; const along=dx*LDIR.x+dz*LDIR.z, side=dx*LPERP.x+dz*LPERP.z;
  if(along>LK.r-6.2&&Math.abs(side)<1.8){ const s=clamp(side,-0.9,0.9); const a=Math.min(along,LK.r+2); p.x=LC.x+LDIR.x*a+LPERP.x*s; p.z=LC.z+LDIR.z*a+LPERP.z*s; return; }
  const rr=LK.r-0.25; p.x=LC.x+dx/d*rr; p.z=LC.z+dz/d*rr; }
// Balıkhane: iskele başında küçük kulübe, tezgâhta balıklar, önünde para yığını
const hut=new THREE.Group(); const hutFish=new THREE.InstancedMesh(FISH_GEO,M.fish,24); hutFish.count=0;
(function(){ const fl=mesh(G.box,M.plank,3.6,0.2,3.0); fl.position.y=0.1; const back=mesh(G.box,M.wood,3.6,2.2,0.18); back.position.set(0,1.2,-1.4); const s1=mesh(G.box,M.wood,0.18,2.2,2.8); s1.position.set(-1.7,1.2,0); const s2=s1.clone(); s2.position.x=1.7;
  const counter=mesh(G.box,M.woodDark,3.4,0.95,0.8); counter.position.set(0,0.55,1.05); const ice=mesh(G.box,mat(0xdff4ff),3.1,0.12,0.65,false); ice.position.set(0,1.08,1.05);
  const roofL=mesh(G.box,M.canvasDark,4.0,0.12,2.0); roofL.position.set(0,2.75,-0.55); roofL.rotation.x=0.45; const roofF=mesh(G.box,M.canvas,4.0,0.1,1.3); roofF.position.set(0,2.45,1.1); roofF.rotation.x=-0.25;
  const sign=mesh(G.box,M.plank,1.8,0.6,0.1); sign.position.set(0,3.35,-1.2); const sf=new THREE.Mesh(FISH_GEO,M.fish); sf.scale.setScalar(1.4); sf.position.set(0,3.35,-1.1); sf.castShadow=true;
  for(const x of [-1.35,1.35]){ const b=mesh(G.cyl,M.woodDark,0.36,0.8,0.36); b.position.set(x*1.55,0.4,1.9); hut.add(b); }
  hut.add(fl,back,s1,s2,counter,ice,roofL,roofF,sign,sf);
  for(let i=0;i<24;i++){ const col=i%8,row=Math.floor(i/8); vp.set(-1.3+col*0.37,1.18+row*0.12,0.95+(row%2)*0.12); e3.set(0,rand(-.3,.3)+Math.PI/2,0); q.setFromEuler(e3); vs.set(0.9,0.9,0.9); m4.compose(vp,q,vs); hutFish.setMatrixAt(i,m4); } hut.add(hutFish);
  hut.position.copy(HUT); hut.rotation.y=Math.atan2(LDIR.x,LDIR.z); scene.add(hut); })();
const hutLbl=addLabel(HUT,'',4.1); hutLbl.near=-1; hutLbl.el.classList.add('machLbl');
const fishPile=makePile(lat(LK.r+6.6,7.2),()=>Math.round((220+160*rg('fishhut'))*(1+0.12*S.level))); fishPile.id='fishPile';
// Balık türleri (koleksiyon defteri)
const FISH=[{k:'sazan',n:'Sazan',v:1,w:52,c:0x9fb7a0},{k:'alabalik',n:'Alabalık',v:1.4,w:28,c:0xd79a9a},{k:'turna',n:'Turna',v:2,w:13,c:0x7fa37a},{k:'yayin',n:'Yayın',v:3.4,w:6,c:0x5c6470},{k:'altin',n:'Altın Balık',v:8,w:1.4,c:0xffc93a},{k:'levrek',n:'Levrek',v:2.2,w:45,c:0x9ab0c8,sea:1},{k:'orkinos',n:'Orkinos',v:4,w:25,c:0x3a5a8a,sea:1},{k:'kilic',n:'Kılıç Balığı',v:7,w:8,c:0x5a86b0,sea:1},{k:'ejder',n:'Deniz Ejderi',v:18,w:1.2,c:0x3affc8,sea:1}];
const fishValue=k=>{ const f=FISH.find(x=>x.k===k)||FISH[0]; return (6+1.3*gw())*f.v; };
const fishPrice=()=>(2.5+0.45*gw())*(1+0.1*rg('fishhut'));
const hutCap=()=>30+15*rg('fishhut'); const hutSellT=()=>Math.max(0.55,2.6-0.35*rg('fishhut'));
let hutT=0, fishDropT=0;
function updateHut(dt){ if(!revealed('lake')) return; const st=S.rg.hutFish||0; hutFish.count=Math.min(24,st); hutT-=dt;
  if(st>0&&hutT<=0&&pileVal(fishPile)<fishPile.capFn()-0.5){ hutT=hutSellT(); S.rg.hutFish=st-1; const v=fishPrice(); pileAdd(fishPile,v); fly(HUT.clone().setY(1.4),fishPile.pos.clone().setY(0.8),null,false,4); }
  const p=player.g.position; if(S.fish>0&&Math.hypot(p.x-HUT_FRONT.x,p.z-HUT_FRONT.z)<3.0){ fishDropT-=dt; if(fishDropT<=0&&(S.rg.hutFish||0)<hutCap()){ fishDropT=0.06; S.fish--; setBack(player); fly(p.clone().setY(1.6),HUT.clone().setY(1.3),()=>{ S.rg.hutFish=Math.min(hutCap(),(S.rg.hutFish||0)+1); },'fish',5); SFX.sell(); } }
  const k=(S.rg.hutFish||0)+'|'+hutCap()+'|'+rg('fishhut'); if(hutLbl._k!==k){ hutLbl._k=k; const full=(S.rg.hutFish||0)>=hutCap(); hutLbl.el.innerHTML=`Balıkhane <i>Sv ${rg('fishhut')+1}</i><small>🐟 ${S.rg.hutFish||0}/${hutCap()}${full?' · <b class="full">Dolu!</b>':''} · dakikada ${Math.round(60/hutSellT())} satış</small>`; } }
function toHut(from,n){ for(let i=0;i<n;i++){ setTimeout(()=>{ fly(from.clone(),HUT.clone().setY(1.3),()=>{ S.rg.hutFish=Math.min(hutCap(),(S.rg.hutFish||0)+1); },'fish',2.2); },i*120); } }

// ----- Balık tutma (elle): iskelenin ucunda dur, olta kendiliğinden atılır, ibre yeşildeyken ÇEK -----
const FS={state:'idle',t:0,needle:0,dir:1,spd:1,zc:0.5,zw:0.25,bob:null,line:null};
const bob=new THREE.Group(); (function(){ const b1=mesh(G.sph,M.buoy,0.16,0.16,0.16,false); const b2=mesh(G.sph,M.flower,0.12,0.1,0.12,false); b2.position.y=0.1; bob.add(b1,b2); bob.visible=false; scene.add(bob); })();
const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]); const fishLine=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.8})); fishLine.visible=false; fishLine.frustumCulled=false; scene.add(fishLine);
const rodMesh=mesh(G.cyl,M.handle,0.035,1.9,0.035,false); rodMesh.rotation.x=-0.9; rodMesh.position.set(0,0.1,0.75); rodMesh.visible=false; player.armR.add(rodMesh);
const fishUI=document.createElement('div'); fishUI.className='fishUI'; fishUI.innerHTML='<div class="fbar"><i class="zone"></i><i class="needle"></i></div><button id="reelBtn">ÇEK!</button><small id="fishTip">Balık bekleniyor…</small>'; fishUI.style.display='none'; document.body.appendChild(fishUI);
fishUI.addEventListener('pointerdown',e=>e.stopPropagation()); $('reelBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); reel(); });
addEventListener('keydown',e=>{ if(e.key===' '&&FS.state==='bite'){ e.preventDefault(); reel(); } });
function fishSpot(){ if(FS.loc==='sea') return SC.clone().addScaledVector(CU,SEA.r-13).addScaledVector(rotU(CU,Math.PI/2),rand(-2,2)).setY(0.1); return lat(LK.r-8.6,rand(-2,2)).setY(0.08); }
function endFishing(){ FS.state='idle'; bob.visible=false; fishLine.visible=false; rodMesh.visible=false; fishUI.style.display='none'; }
function rollFish(qual){ const sea=FS.loc==='sea'; const pool=FISH.filter(f=>!!f.sea===sea); const rare=1+0.15*rg('rod')+(sea?0.15*rg('harbor'):0)+(qual>0.75?1.5:0); const half=Math.ceil(pool.length/2); let tot=0; const ws=pool.map((f,i)=>{ const w=f.w*(i>=half?rare:1); tot+=w; return w; }); let r=Math.random()*tot; for(let i=0;i<pool.length;i++){ r-=ws[i]; if(r<=0) return pool[i]; } return pool[0]; }
function reel(){ if(FS.state!=='bite') return; const d=Math.abs(FS.needle-FS.zc); if(d<=FS.zw/2){ const qual=1-d/(FS.zw/2); const f=rollFish(qual); catchFish(f,qual); } else { floatText(player.g.position,'Kaçtı!','red'); SFX.hit(); FS.state='cool'; FS.t=0.6; fishUI.style.display='none'; bob.visible=false; fishLine.visible=false; } }
function catchFish(f,qual){ FS.state='cool'; FS.t=0.55; fishUI.style.display='none'; const from=bob.position.clone().setY(0.5); bob.visible=false; fishLine.visible=false; burst(from,10,M.waterLight,1.2); SFX.sell();
  fly(from,player.g,()=>{ S.fish=(S.fish||0)+1; setBack(player); },'fish',3.2);
  questEvent('fish',1); S.book.fish[f.k]=(S.book.fish[f.k]||0)+1; const first=S.book.fish[f.k]===1; floatText(player.g.position,(qual>0.8?'Mükemmel! ':'')+f.n,first?'green':''); if(first&&f.k!=='sazan'&&f.k!=='levrek'){ banner('Yeni tür: '+f.n,'Koleksiyon defterine eklendi','day'); SFX.fanfare(); }
  if(f.v>=3){ camShake=0.25; celebrate(from.clone().setY(0),0.6); } }
function updateFishing(dt){ const p=player.g.position; const nearPier=revealed('coast')&&Math.hypot(p.x-PIER_END.x,p.z-PIER_END.z)<1.9, nearDock=revealed('lake')&&Math.hypot(p.x-DOCK_END.x,p.z-DOCK_END.z)<1.9; const loc=nearPier?'sea':nearDock?'lake':(FS.loc||'lake'); if(loc!==FS.loc){ if(FS.state!=='idle') endFishing(); FS.loc=loc; } const onDock=nearPier||nearDock; const can=onDock&&!playerMoving&&(S.fish||0)<fishCap()&&!nearestEnemy(p,6)&&!document.querySelector('.intro');
  if(!can){ if(FS.state!=='idle') endFishing(); if(onDock&&(S.fish||0)>=fishCap()&&!playerMoving){ FS.fullT=(FS.fullT||0)-dt; if(FS.fullT<=0){ FS.fullT=2.5; floatText(p,'Sırtın balıkla dolu — balıkhaneye götür','red'); } } return; }
  rodMesh.visible=true; if(FS.loc==='sea') player.g.rotation.y=Math.atan2(SC.x-p.x,SC.z-p.z); else player.g.rotation.y=Math.atan2(-LDIR.x,-LDIR.z);
  if(FS.state==='idle'){ FS.state='cast'; FS.t=0; FS.spot=fishSpot(); bob.visible=true; fishLine.visible=true; SFX.slash(); }
  const tip=new THREE.Vector3(); rodMesh.getWorldPosition(tip); tip.y+=0.9;
  if(FS.state==='cast'){ FS.t+=dt*2.2; const k=Math.min(1,FS.t); bob.position.lerpVectors(p.clone().setY(2),FS.spot,k); bob.position.y+=Math.sin(k*Math.PI)*2; if(k>=1){ FS.state='wait'; FS.t=rand(0.8,2.0); burst(FS.spot.clone(),5,M.waterLight,0.6); } }
  else if(FS.state==='wait'){ FS.t-=dt; bob.position.y=0.08+Math.sin(performance.now()/300)*0.03; if(FS.t<=0){ FS.state='bite'; FS.t=2.8; FS.needle=0; FS.dir=1; FS.zw=Math.min(0.42,0.22+0.035*rg('rod')); FS.zc=rand(0.2+FS.zw/2,0.8-FS.zw/2); FS.spd=rand(0.95,1.35); fishUI.style.display='flex'; const z=fishUI.querySelector('.zone'); z.style.left=((FS.zc-FS.zw/2)*100)+'%'; z.style.width=(FS.zw*100)+'%'; $('fishTip').textContent='Vuruyor! İbre yeşildeyken ÇEK'; tone(900,1300,0.1,'square',0.05); } }
  else if(FS.state==='bite'){ FS.t-=dt; FS.needle+=FS.dir*FS.spd*dt; if(FS.needle>1){ FS.needle=1; FS.dir=-1; } if(FS.needle<0){ FS.needle=0; FS.dir=1; } fishUI.querySelector('.needle').style.left=(FS.needle*100)+'%'; bob.position.y=0.02+Math.abs(Math.sin(performance.now()/60))*0.08; if(window.__autoReel&&Math.abs(FS.needle-FS.zc)<FS.zw*0.3) reel(); if(FS.state==='bite'&&FS.t<=0){ floatText(p,'Kaçtı!','red'); FS.state='cool'; FS.t=0.5; fishUI.style.display='none'; bob.visible=false; fishLine.visible=false; } }
  else if(FS.state==='cool'){ FS.t-=dt; if(FS.t<=0){ FS.state='idle'; } }
  if(fishLine.visible){ const a=lineGeo.attributes.position; a.setXYZ(0,tip.x,tip.y,tip.z); a.setXYZ(1,bob.position.x,bob.position.y,bob.position.z); a.needsUpdate=true; } }

// ----- Balıkçı (işçi): iskelenin kenarında oturur, düzenli balık tutar, balıkhaneye gönderir -----
const fishers=[];
function addFisher(){ const i=fishers.length; const g=makeGuy('worker'); g.tool.visible=false; const rod=mesh(G.cyl,M.handle,0.035,1.9,0.035,false); rod.rotation.x=-0.9; rod.position.set(0,0.1,0.75); g.armR.add(rod); g.armR.rotation.x=-0.9;
  const pp=lat(LK.r-1.2-i*1.9,i%2?1.25:-1.25); g.g.position.set(pp.x,0.35,pp.z); g.g.rotation.y=Math.atan2(LPERP.x*(i%2?1:-1),LPERP.z*(i%2?1:-1)); scene.add(g.g); const b=mesh(G.sph,M.buoy,0.12,0.12,0.12,false); const bp=lat(LK.r-1.2-i*1.9,(i%2?1:-1)*4.2); b.position.set(bp.x,0.1,bp.z); scene.add(b);
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),fishLine.material); ln.frustumCulled=false; scene.add(ln); fishers.push({g,b,ln,rod,t:rand(3,7),bp}); }
function updateFishers(dt){ const tip=new THREE.Vector3(); for(const f of fishers){ f.t-=dt; f.b.position.y=0.08+Math.sin(performance.now()/400+f.t)*0.03; animGuy(f.g,dt,false,1); f.g.armR.rotation.x=-0.9+(f.t<0.4?-0.6:0);
    f.rod.getWorldPosition(tip); tip.y+=0.9; const a=f.ln.geometry.attributes.position; a.setXYZ(0,tip.x,tip.y,tip.z); a.setXYZ(1,f.b.position.x,f.b.position.y,f.b.position.z); a.needsUpdate=true;
    if(f.t<=0){ f.t=7; if((S.rg.hutFish||0)<hutCap()){ burst(f.b.position.clone(),6,M.waterLight,0.8); toHut(f.b.position.clone().setY(0.4),1); } } } }

// ----- Balık Ağı (makine): gölde yüzen ağlar; Sv3'ten sonra ahşap balık çiftliği -----
const netGroup=new THREE.Group(); scene.add(netGroup); const nets=[]; const NET_SPOTS=[[-2.5,-5.2],[-3,5.4],[-7.4,-2.2],[-7.8,3.8],[-10.5,0.6]];
const netRate=()=>{ const l=rg('net'); return l<=0?0:l*(l>=3?2:1)/12; };
function buildNets(){ while(netGroup.children.length) netGroup.remove(netGroup.children[0]); nets.length=0; const l=rg('net'); for(let i=0;i<Math.min(5,l);i++){ const [d,s]=NET_SPOTS[i]; const c=lat(LK.r+d,s); const g=new THREE.Group(); g.position.set(c.x,0.07,c.z);
    const netm=new THREE.Mesh(new THREE.CircleGeometry(1.5,20),new THREE.MeshLambertMaterial({color:0xe8d6a8,transparent:true,opacity:0.55,depthWrite:false})); netm.rotation.x=-Math.PI/2; netm.position.y=0.01; g.add(netm);
    for(let k=0;k<8;k++){ const a=k/8*6.283; const b=mesh(G.sph,k%2?M.buoy:M.flower,0.17,0.17,0.17,false); b.position.set(Math.cos(a)*1.5,0.08,Math.sin(a)*1.5); g.add(b); }
    if(l>=3){ for(const [x,z] of [[-1.8,-1.8],[1.8,-1.8],[-1.8,1.8],[1.8,1.8]]){ const post=mesh(G.cyl,M.woodDark,0.1,1.2,0.1); post.position.set(x,0.3,z); g.add(post); } for(const [x,z,ry] of [[0,-1.8,0],[0,1.8,0],[-1.8,0,Math.PI/2],[1.8,0,Math.PI/2]]){ const rail=mesh(G.box,M.wood,3.6,0.12,0.12); rail.position.set(x,0.55,z); rail.rotation.y=ry; g.add(rail); } }
    if(l>=5){ const flag=mesh(G.box,M.flag,0.5,0.35,0.04,false); flag.position.set(1.8,1.3,-1.8); const pole=mesh(G.cyl,M.handle,0.04,1.5,0.04); pole.position.set(1.8,0.9,-1.8); g.add(flag,pole); }
    netGroup.add(g); nets.push({g,t:rand(2,10),c}); }
  netLbl.pos.copy(lat(LK.r-5,0)); }
const netLbl=addLabel(lat(LK.r-5,0),'',2.8); netLbl.near=-1; netLbl.el.classList.add('machLbl');
function updateNets(dt){ const l=rg('net'); netLbl.hide=l<=0||!revealed('lake'); const k=l+'|'+((S.rg.hutFish||0)>=hutCap()); if(netLbl._k!==k){ netLbl._k=k; netLbl.el.innerHTML=`${l>=3?'Balık Çiftliği':'Balık Ağı'} <i>Sv ${l}</i><small>dakikada ${Math.round(netRate()*60)} balık${(S.rg.hutFish||0)>=hutCap()?' · <b class="full">balıkhane dolu</b>':''}</small>`; }
  const t=performance.now()/1000; for(const n of nets){ n.g.position.y=0.07+Math.sin(t*1.3+n.c.x)*0.03; n.t-=dt; if(n.t<=0){ n.t=12; const cnt=l>=3?2:1; if((S.rg.hutFish||0)<hutCap()){ burst(n.c.clone().setY(0.3),8,M.waterLight,1); tone(520,780,0.08,'sine',0.03); toHut(n.c.clone().setY(0.5),cnt); } } } }

// ----- Gölün alanları -----
const LPADS=[
  {id:'rod', grp:'lake', ord:1, name:'Olta', desc:'Yeşil alan genişler, nadir balık şansı artar', res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-7.4); return [v.x,v.z]; }, kind:'up', key:'rod', cost:l=>Math.round(55*Math.pow(1.55,l)), max:5, show:()=>revealed('lake')},
  {id:'fisher', grp:'lake', ord:2, name:'Balıkçı', desc:'İskelede oturur, 7 saniyede bir balık tutar', res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-4.7); return [v.x,v.z]; }, kind:'up', key:'fisher', cost:l=>Math.round(90*Math.pow(1.7,l)), max:3, show:()=>revealed('lake'), onBuy:()=>{ addFisher(); celebrate(lat(LK.r-1.2-(fishers.length-1)*1.9,0),1); }},
  {id:'net', grp:'lake', ord:3, lock:'Bir balıkçı', name:'Balık Ağı', desc:'Makine: gölde ağ kurar, balık kendiliğinden balıkhaneye akar. Sv3: balık çiftliği', res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-2.0); return [v.x,v.z]; }, kind:'up', key:'net', cost:l=>Math.round(180*Math.pow(1.75,l)), max:5, show:()=>revealed('lake')&&rg('fisher')>=1, onBuy:()=>{ buildNets(); const c=nets.length?nets[nets.length-1].c:LC; celebrate(c.clone().setY(0),1.4); camShake=0.4; }},
  {id:'fishhut', grp:'lake', ord:4, name:'Balıkhane', desc:'Daha hızlı ve daha pahalı satar, daha çok stok ve para tutar', res:'gold', pos:()=>{ const v=lat(LK.r+7.6,2.4); return [v.x,v.z]; }, kind:'up', key:'fishhut', cost:l=>Math.round(70*Math.pow(1.55,l)), max:5, show:()=>revealed('lake'), onBuy:()=>{ celebrate(HUT.clone(),1); hut.scale.setScalar(1+0.05*rg('fishhut')); }},
];
for(const d of LPADS) makePad(d);

// ----- düşman görünümleri: sefere göre patron -----
const BOSSES={1:{n:'Kabile Reisi',hat:'horns'},2:{n:'Korsan Kaptan',hat:'pirate',c:0x2b3a8a},3:{n:'Dev Kurt',hat:'wolf'},4:{n:'Koçbaşı Ustası',hat:'helm'},5:{n:'Ok Ustası',hat:'hood'},6:{n:'Bataklık Cadısı',hat:'witch'},7:{n:'Demir Dev',hat:'helm'},8:{n:'Korsan Kralı',hat:'pirate'},9:{n:'Buz Devi',hat:'horns'},10:{n:'Kara Kral',hat:'crown'}};
const bossOf=()=>S.level<=10?(BOSSES[S.level]||BOSSES[1]):BOSSES[((S.level-11)%10)+1];
const bossName=()=>(S.level>10?'Öfkeli ':'')+bossOf().n;
function applyBossLook(guy){ const B=bossOf(); if(B.hat==='pirate'){ const brim=mesh(G.cyl,mat(0x1d1d22),0.8,0.08,0.5); brim.position.y=2.0; const top=mesh(G.cone,mat(0x1d1d22),0.5,0.45,0.35); top.position.y=2.25; const sk=mesh(G.sph,M.metal,0.1,0.1,0.05,false); sk.position.set(0,2.2,0.3); const patch=mesh(G.box,mat(0x111111),0.18,0.12,0.05,false); patch.position.set(0.18,1.55,0.52); guy.root.add(brim,top,sk,patch); guy.root.children.forEach(o=>{ if(o.material===M.enemyHelm) o.visible=false; }); }
  else if(B.hat==='crown'){ const c=mesh(G.cyl,M.gold,0.42,0.3,0.42); c.position.y=2.1; guy.root.add(c); }
  else if(B.hat==='wolf'||B.hat==='hood'||B.hat==='witch'){ const h=mesh(G.cone,B.hat==='witch'?mat(0x3a2a4a):mat(0x5a4a3a),0.6,0.9,0.6); h.position.y=2.25; guy.root.add(h); } }

// ----- kaplar: sefere göre en yüksek seviyeler (krallık büyüdükçe açılır) -----
function applyCaps(){ const L=S.level; for(const pd of pads){ const d=pd.def; if(d.kind==='tower') d.max=revealed('river')?Math.min(10,5+L):Math.min(6,5+L); else if(d.id==='wall') d.max=revealed('quarry')?Math.min(10,3+L):Math.min(3,3+L); else if(d.id==='soldier') d.max=Math.min(10,3+L)+Math.floor(rg('smoke')/2); else if(d.id==='worker') d.max=Math.min(6,2+L); else if(d.id==='feet'||d.id==='trader') d.max=Math.min(10,3+L); else if(d.id==='newCannon') d.max=Math.min(8,1+L); else if(d.id==='expand') d.max=Math.min(4,1+Math.floor(L/2)); else if(d.id==='stoneWorker') d.max=revealed('quarry')?4:0; } }

// =====================================================================
// ---------- Geyik Çayırı: av, avcı, tuzak makinesi, tütsühane; kurt düşmanlar ----------
// =====================================================================
const MD=REG.meadow; const MC=new THREE.Vector3(MD.c[0],0,MD.c[1]); const MDIR=new THREE.Vector3(-MD.c[0],0,-MD.c[1]).normalize(); const MPERP=new THREE.Vector3(-MDIR.z,0,MDIR.x);
const mat2=(d,s)=>MC.clone().addScaledVector(MDIR,d).addScaledVector(MPERP,s);
const HHUT=mat2(MD.r+3.4,5.6), HHUT_FRONT=mat2(MD.r+5.2,4.6);
(function(){ const g=new THREE.Group(); const grass=new THREE.Mesh(new THREE.CircleGeometry(MD.r+2,64),mat(0x92cf6c)); grass.rotation.x=-Math.PI/2; grass.position.set(MC.x,0.012,MC.z); grass.receiveShadow=true; g.add(grass);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(MD.r*0.7,48),mat(0xa4d876)); inner.rotation.x=-Math.PI/2; inner.position.set(MC.x-1,0.014,MC.z+1); inner.receiveShadow=true; g.add(inner);
  const fl=[]; const cols=[0xffffff,0xffd23f,0xf6a6c8,0xb9a6f6,0xff8a5c]; for(let i=0;i<160;i++){ const a=rand(0,6.28), rr=Math.sqrt(Math.random())*(MD.r+1); fl.push({x:MC.x+Math.cos(a)*rr,y:0.12,z:MC.z+Math.sin(a)*rr,s:rand(.09,.16),c:cols[i%cols.length]}); } instanced(G.sph,mat(0xffffff),fl,false);
  const tufts=[]; for(let i=0;i<120;i++){ const a=rand(0,6.28), rr=Math.sqrt(Math.random())*(MD.r+1.5); tufts.push({x:MC.x+Math.cos(a)*rr,y:0.2,z:MC.z+Math.sin(a)*rr,ry:rand(0,6),rz:rand(-.3,.3),s:rand(.5,1),c:Math.random()<.5?0x7cbf5a:0x6aae4c}); } instanced(new THREE.ConeGeometry(0.2,0.55,4),mat(0xffffff),tufts,false);
  // alçak çit yayı (kuzey yarı), saman balyaları, tek ağaç
  const posts=[], rails=[]; for(let i=0;i<=22;i++){ const a=Math.atan2(-MDIR.z,-MDIR.x)-1.3+i*(2.6/22); const x=MC.x+Math.cos(a)*(MD.r+1.6), z=MC.z+Math.sin(a)*(MD.r+1.6); posts.push({x,y:0.5,z,sx:.16,sy:1,sz:.16,c:0x7d5124}); if(i<22){ const a2=a+(2.6/22)/2; rails.push({x:MC.x+Math.cos(a2)*(MD.r+1.6),y:0.7,z:MC.z+Math.sin(a2)*(MD.r+1.6),ry:-a2,sx:.1,sy:.12,sz:(MD.r+1.6)*(2.6/22)+0.1,c:0xb5803f}); } }
  instanced(G.cyl,mat(0xffffff),posts); instanced(G.box,mat(0xffffff),rails);
  for(const [d,s] of [[-6,-8],[-8,-5],[-3,-10]]){ const v=mat2(d,s); const hay=mesh(G.cyl,M.gold,0.6,1.0,0.6); hay.rotation.z=Math.PI/2; hay.rotation.y=rand(0,3); hay.position.set(v.x,0.6,v.z); g.add(hay); }
  scene.add(g); })();
// Av kulübesi + tütsühane (bacası tüter)
const hhut=new THREE.Group(); const hhutMeat=new THREE.InstancedMesh(MEAT_GEO,M.meat,20); hhutMeat.count=0; let chimneyTop=new THREE.Vector3();
(function(){ const fl=mesh(G.box,M.plank,3.8,0.2,3.2); fl.position.y=0.1; const body=mesh(G.box,M.wood,3.4,2.2,2.4); body.position.set(0,1.2,-0.3); const roof1=mesh(G.box,M.roof,3.9,0.14,1.7); roof1.position.set(0,2.75,-0.85); roof1.rotation.x=0.55; const roof2=roof1.clone(); roof2.position.z=0.25; roof2.rotation.x=-0.55;
  const chim=mesh(G.box,M.stone,0.6,1.6,0.6); chim.position.set(1.1,3.0,-0.6); const rack=mesh(G.box,M.woodDark,3.2,0.1,0.1); rack.position.set(0,1.9,1.3); const p1=mesh(G.cyl,M.woodDark,0.07,1.9,0.07); p1.position.set(-1.6,0.95,1.3); const p2=p1.clone(); p2.position.x=1.6;
  const counter=mesh(G.box,M.woodDark,3.2,0.9,0.6); counter.position.set(0,0.55,1.35); const sign=mesh(G.box,M.plank,1.6,0.55,0.1); sign.position.set(0,2.35,1.0); const ant=mesh(G.box,M.plank,0.1,0.5,0.1); ant.position.set(-0.3,2.75,1.0); ant.rotation.z=0.5; const ant2=ant.clone(); ant2.position.x=0.3; ant2.rotation.z=-0.5;
  hhut.add(fl,body,roof1,roof2,chim,rack,p1,p2,counter,sign,ant,ant2);
  for(let i=0;i<20;i++){ const col=i%7,row=Math.floor(i/7); vp.set(-1.3+col*0.43,row<2?1.62-row*0.35:1.1,row<2?1.3:1.35); e3.set(row<2?Math.PI/2:0,0,0); q.setFromEuler(e3); vs.set(0.8,0.8,0.8); m4.compose(vp,q,vs); hhutMeat.setMatrixAt(i,m4); } hhut.add(hhutMeat);
  hhut.position.copy(HHUT); hhut.rotation.y=Math.atan2(MDIR.x,MDIR.z); scene.add(hhut); chimneyTop=HHUT.clone().add(new THREE.Vector3(0,3.9,0)); })();
const hhutLbl=addLabel(HHUT,'',4.3); hhutLbl.near=-1; hhutLbl.el.classList.add('machLbl');
const meatPile=makePile(mat2(MD.r+6.6,7.2),()=>Math.round((220+160*rg('smoke'))*(1+0.12*S.level))); meatPile.id='meatPile';
const HUNT=[{k:'tavsan',n:'Tavşan',hp:1,meat:1,spd:5.6,w:45,c:0xf2efe8},{k:'geyik',n:'Geyik',hp:2,meat:3,spd:6.4,w:38,c:0xc08a52},{k:'domuz',n:'Yaban Domuzu',hp:4,meat:5,spd:3.8,w:14,c:0x5a4030},{k:'ak_geyik',n:'Ak Geyik',hp:6,meat:10,spd:7,w:2,c:0xffffff}];
const meatCap=()=>12+4*S.lv.feet;
const meatPrice=()=>(2.5+0.45*gw())*(1+0.15*rg('smoke'))*(rg('smoke')>0?1.4:1);
const hhutCap=()=>30+15*rg('smoke'); const hhutSellT=()=>Math.max(0.55,2.8-0.35*rg('smoke'));
let hhutT=0, meatDropT=0; const smoke=[];
function updateHHut(dt){ if(!revealed('meadow')) return; const st=S.rg.huntMeat||0; hhutMeat.count=Math.min(20,st); hhutT-=dt;
  if(st>0&&hhutT<=0&&pileVal(meatPile)<meatPile.capFn()-0.5){ hhutT=hhutSellT(); S.rg.huntMeat=st-1; pileAdd(meatPile,meatPrice()); fly(HHUT.clone().setY(1.4),meatPile.pos.clone().setY(0.8),null,false,4); }
  if(rg('smoke')>0){ const sm=smoke.find(s=>s.t<=0); if(Math.random()<dt*6){ const s=sm||(()=>{ const m=new THREE.Mesh(G.sph,new THREE.MeshLambertMaterial({color:0xdddddd,transparent:true,opacity:0.7,depthWrite:false})); scene.add(m); const o={m,t:0}; smoke.push(o); return o; })(); s.t=2.2; s.m.position.copy(chimneyTop).add(new THREE.Vector3(rand(-.2,.2),0,rand(-.2,.2))); s.m.visible=true; } }
  for(const s of smoke){ if(s.t<=0){ s.m.visible=false; continue; } s.t-=dt; const k=1-s.t/2.2; s.m.position.y+=dt*1.4; s.m.position.x+=dt*0.4; s.m.scale.setScalar(0.25+k*0.9); s.m.material.opacity=0.6*(1-k); }
  const p=player.g.position; if((S.meat||0)>0&&Math.hypot(p.x-HHUT_FRONT.x,p.z-HHUT_FRONT.z)<3.0){ meatDropT-=dt; if(meatDropT<=0&&(S.rg.huntMeat||0)<hhutCap()){ meatDropT=0.06; S.meat--; setBack(player); fly(p.clone().setY(1.6),HHUT.clone().setY(1.3),()=>{ S.rg.huntMeat=Math.min(hhutCap(),(S.rg.huntMeat||0)+1); },'meat',5); SFX.sell(); } }
  const k=(S.rg.huntMeat||0)+'|'+hhutCap()+'|'+rg('smoke'); if(hhutLbl._k!==k){ hhutLbl._k=k; const full=(S.rg.huntMeat||0)>=hhutCap(); hhutLbl.el.innerHTML=`${rg('smoke')>0?'Tütsühane':'Av Kulübesi'} <i>Sv ${rg('smoke')+1}</i><small>🍖 ${S.rg.huntMeat||0}/${hhutCap()}${full?' · <b class="full">Dolu!</b>':''} · dakikada ${Math.round(60/hhutSellT())} satış</small>`; } }
function toHHut(from,n){ for(let i=0;i<n;i++){ setTimeout(()=>{ fly(from.clone(),HHUT.clone().setY(1.3),()=>{ S.rg.huntMeat=Math.min(hhutCap(),(S.rg.huntMeat||0)+1); },'meat',2.2); },i*110); } }
// ----- hayvanlar -----
function animalMesh(k){ const g=new THREE.Group(); const b=new THREE.Group(); g.add(b); const legs=[]; let head;
  if(k==='tavsan'){ const body=mesh(G.sph,mat(0xf2efe8),0.34,0.3,0.42); body.position.y=0.32; head=new THREE.Group(); head.position.set(0,0.52,0.3); const hd=mesh(G.sph,mat(0xf2efe8),0.22,0.22,0.22); const e1=mesh(G.box,mat(0xf2efe8),0.07,0.34,0.05); e1.position.set(-0.08,0.28,-0.02); const e2=e1.clone(); e2.position.x=0.08; const ey=mesh(G.sph,M.pupil,0.04,0.04,0.03,false); ey.position.set(0.1,0.04,0.15); const ey2=ey.clone(); ey2.position.x=-0.1; head.add(hd,e1,e2,ey,ey2); const tail=mesh(G.sph,mat(0xffffff),0.1,0.1,0.1,false); tail.position.set(0,0.4,-0.38); b.add(body,head,tail); }
  else { const deer=k==='geyik'||k==='ak_geyik'; const col=k==='ak_geyik'?0xfaf8f2:deer?0xc08a52:0x5a4030; const L=deer?0.62:0.42; const body=mesh(G.box,mat(col),deer?0.55:0.75,deer?0.55:0.65,deer?1.2:1.15); body.position.y=L+0.25; head=new THREE.Group(); head.position.set(0,L+(deer?0.75:0.3),deer?0.72:0.7);
    const hd=mesh(G.box,mat(col),deer?0.32:0.5,deer?0.34:0.45,deer?0.5:0.5); head.add(hd); const ey=mesh(G.sph,M.pupil,0.05,0.05,0.04,false); ey.position.set(0.14,0.06,0.15); const ey2=ey.clone(); ey2.position.x=-0.14; head.add(ey,ey2);
    if(deer){ const neck=mesh(G.box,mat(col),0.26,0.55,0.26); neck.position.set(0,L+0.5,0.5); neck.rotation.x=-0.4; b.add(neck); const tail=mesh(G.box,mat(0xffffff),0.14,0.2,0.1,false); tail.position.set(0,L+0.4,-0.62); b.add(tail); if(Math.random()<0.6||k==='ak_geyik'){ for(const s of [-1,1]){ const an=mesh(G.cyl,mat(k==='ak_geyik'?0xffd23f:0xe8d6b0),0.04,0.5,0.04,false); an.position.set(0.12*s,0.4,-0.05); an.rotation.z=-0.4*s; const tip=an.clone(); tip.position.set(0.25*s,0.55,0.05); tip.rotation.z=0.6*s; tip.scale.y=0.6; head.add(an,tip); } } }
    else { const sn=mesh(G.box,mat(0x7a5a48),0.28,0.22,0.2); sn.position.set(0,-0.08,0.32); const t1=mesh(G.cone,mat(0xfff4dc),0.05,0.2,0.05,false); t1.position.set(0.12,-0.02,0.38); t1.rotation.x=-0.6; const t2=t1.clone(); t2.position.x=-0.12; head.add(sn,t1,t2); const mane=mesh(G.box,mat(0x3a2a20),0.2,0.2,0.9,false); mane.position.set(0,L+0.62,0); b.add(mane); }
    for(const [x,z] of [[-0.18,0.4],[0.18,0.4],[-0.18,-0.4],[0.18,-0.4]]){ const lg=new THREE.Group(); lg.position.set(x*(deer?1:1.4),L,z*(deer?1.1:1)); const lm=mesh(G.box,mat(deer?0x8a5a30:0x3a2a20),0.12,L,0.12); lm.position.y=-L/2; lg.add(lm); b.add(lg); legs.push(lg); } b.add(body,head); }
  return {g,b,legs,head,ph:rand(0,6)}; }
const animals=[]; let spawnAT=0;
function spawnAnimal(){ let tot=0; for(const h of HUNT) tot+=h.w; let r=Math.random()*tot, H=HUNT[0]; for(const h of HUNT){ r-=h.w; if(r<=0){ H=h; break; } } const a=rand(0,6.28), rr=rand(3,MD.r-1); const m=animalMesh(H.k); m.g.position.set(MC.x+Math.cos(a)*rr,0,MC.z+Math.sin(a)*rr); m.g.rotation.y=rand(0,6); m.g.scale.setScalar(0.01); scene.add(m.g); animals.push({H,m,hp:H.hp,tx:null,tz:null,wait:rand(0,2),pop:0,hit:0,claimed:null}); }
function killAnimal(a,byHunter){ const i=animals.indexOf(a); if(i>=0) animals.splice(i,1); scene.remove(a.m.g); const pos=a.m.g.position.clone(); burst(pos.clone().setY(0.6),10,M.meat,1.1); SFX.die();
  const n=Math.max(1,Math.round(a.H.meat*(1+0.25*rg('bow')))); S.book.hunt[a.H.k]=(S.book.hunt[a.H.k]||0)+1; const first=S.book.hunt[a.H.k]===1;
  if(byHunter){ toHHut(pos.clone().setY(0.6),n); }
  else { questEvent('hunt',1); for(let j=0;j<n;j++){ setTimeout(()=>fly(pos.clone().setY(0.6),player.g,()=>{ if((S.meat||0)<meatCap()){ S.meat=(S.meat||0)+1; setBack(player); } },'meat',3.2),j*70); } floatText(pos,a.H.n+' +'+n+' et',first?'green':''); if(first&&a.H.k!=='tavsan'){ banner('Yeni av: '+a.H.n,'Koleksiyon defterine eklendi','day'); SFX.fanfare(); } if(a.H.k==='ak_geyik'){ celebrate(pos,1); camShake=0.3; } } }
function hurtAnimal(a,dmg,byHunter){ a.hp-=dmg; a.hit=0.2; SFX.hit(); if(a.hp<=0) killAnimal(a,byHunter); }
let huntCd=0;
function updateAnimals(dt){ const p=player.g.position; const target=7+2*rg('trap'); spawnAT-=dt; if(animals.length<target&&spawnAT<=0){ spawnAT=3.5; spawnAnimal(); }
  for(const a of animals.slice()){ const g=a.m.g, pos=g.position; if(a.pop<1){ a.pop=Math.min(1,a.pop+dt*2.5); g.scale.setScalar(Math.max(0.01,a.pop*(1+0.2*Math.sin(a.pop*Math.PI)))); }
    const dp=Math.hypot(p.x-pos.x,p.z-pos.z); let vx=0,vz=0,spd=0;
    if(dp<5.5&&a.H.k!=='domuz'){ vx=(pos.x-p.x)/dp; vz=(pos.z-p.z)/dp; spd=a.H.spd; a.tx=null; }
    else if(dp<3.5&&a.H.k==='domuz'){ vx=(pos.x-p.x)/dp; vz=(pos.z-p.z)/dp; spd=a.H.spd; }
    else { a.wait-=dt; if(a.wait<=0&&a.tx===null){ const an=rand(0,6.28), rr=rand(1,MD.r-1.5); a.tx=MC.x+Math.cos(an)*rr; a.tz=MC.z+Math.sin(an)*rr; } if(a.tx!==null){ const dx=a.tx-pos.x, dz=a.tz-pos.z, d=Math.hypot(dx,dz); if(d<0.4){ a.tx=null; a.wait=rand(1,3.5); } else { vx=dx/d; vz=dz/d; spd=1.4; } } }
    if(spd>0){ pos.x+=vx*spd*dt; pos.z+=vz*spd*dt; const dc=Math.hypot(pos.x-MC.x,pos.z-MC.z); if(dc>MD.r-0.6){ pos.x=MC.x+(pos.x-MC.x)/dc*(MD.r-0.6); pos.z=MC.z+(pos.z-MC.z)/dc*(MD.r-0.6); } const ang=Math.atan2(vx,vz); let dr=ang-g.rotation.y; dr=Math.atan2(Math.sin(dr),Math.cos(dr)); g.rotation.y+=dr*Math.min(1,dt*10); }
    a.m.ph+=dt*(spd>2?16:spd>0?7:0); const sw=spd>0?Math.sin(a.m.ph)*0.7:0; a.m.legs.forEach((l,i)=>{ l.rotation.x=(i===0||i===3)?sw:-sw; }); if(a.H.k==='tavsan') a.m.b.position.y=spd>0?Math.abs(Math.sin(a.m.ph))*0.35:0; else a.m.b.position.y=spd>2?Math.abs(Math.sin(a.m.ph))*0.08:0;
    if(a.m.head&&spd===0) a.m.head.rotation.x=0.35+Math.sin(performance.now()/700+a.m.ph)*0.25; else if(a.m.head) a.m.head.rotation.x=0;
    if(a.hit>0){ a.hit-=dt; const k=1+a.hit*1.2; g.scale.set(k,1/k,k); } else if(a.pop>=1) g.scale.setScalar(1); }
  // oyuncu kılıçla avlar (düşman yakında değilse)
  huntCd-=dt; if(huntCd<=0&&!nearestEnemy(p,4)){ let best=null,bd=2.7+0.15*rg('bow'); for(const a of animals){ const d=Math.hypot(a.m.g.position.x-p.x,a.m.g.position.z-p.z); if(d<bd){ bd=d; best=a; } } if(best){ huntCd=0.42; player.swing=0.3; SFX.slash(); const ang=Math.atan2(best.m.g.position.x-p.x,best.m.g.position.z-p.z); player.g.rotation.y=ang; slash.position.set(p.x,1.4,p.z); slash.rotation.z=-ang+Math.PI/2; slashT=0.22; hurtAnimal(best,1+0.5*rg('bow'),false); } } }
// ----- Avcı (işçi): yayla avlar, eti kulübeye gönderir -----
const hunters=[]; const arrowsH=[];
function addHunter(){ const g=makeGuy('worker'); g.tool.visible=false; const bow=mesh(G.box,M.woodDark,0.08,0.9,0.08,false); bow.position.set(0,-0.3,0.1); g.armL.add(bow); const cap=mesh(G.cone,mat(0x5c8a3a),0.45,0.5,0.45); cap.position.y=2.0; g.root.add(cap); const v=mat2(MD.r+1,rand(-3,3)); g.g.position.set(v.x,0,v.z); scene.add(g.g); hunters.push({guy:g,t:rand(0,1.5),tgt:null,moving:false,speed:5}); }
function updateHunters(dt){ for(const h of hunters){ const p=h.guy.g.position; h.moving=false; if(!h.tgt||!animals.includes(h.tgt)){ let best=null,bd=1e9; for(const a of animals){ if(a.claimed&&a.claimed!==h) continue; const d=Math.hypot(a.m.g.position.x-p.x,a.m.g.position.z-p.z); if(d<bd){ bd=d; best=a; } } h.tgt=best; if(best) best.claimed=h; }
    const a=h.tgt; if(a){ const tp=a.m.g.position; const d=Math.hypot(tp.x-p.x,tp.z-p.z); h.guy.g.rotation.y=Math.atan2(tp.x-p.x,tp.z-p.z); if(d>7){ p.x+=(tp.x-p.x)/d*h.speed*dt; p.z+=(tp.z-p.z)/d*h.speed*dt; h.moving=true; } else { h.t-=dt; h.guy.armL.rotation.x=-1.4; if(h.t<=0){ h.t=1.6; const ar=mesh(G.cyl,M.handle,0.035,0.8,0.035,false); ar.position.copy(p).setY(1.3); scene.add(ar); arrowsH.push({m:ar,a,t:0}); tone(700,400,0.06,'triangle',0.03); } } }
    animGuy(h.guy,dt,h.moving,0.9); }
  for(let i=arrowsH.length-1;i>=0;i--){ const r=arrowsH[i]; const a=r.a; if(!animals.includes(a)){ scene.remove(r.m); arrowsH.splice(i,1); continue; } const to=a.m.g.position.clone().setY(0.5); const dir=to.clone().sub(r.m.position); const d=dir.length(); if(d<0.6){ scene.remove(r.m); arrowsH.splice(i,1); hurtAnimal(a,1,true); continue; } dir.normalize(); r.m.position.addScaledVector(dir,22*dt); r.m.lookAt(to); r.m.rotateX(Math.PI/2); } }
// ----- Tuzak (makine): çayırın kenarına kafesli tuzaklar kurulur, kendiliğinden av yakalar -----
const trapGroup=new THREE.Group(); scene.add(trapGroup); const traps=[]; const trapRate=()=>{ const l=rg('trap'); return l<=0?0:l*(l>=3?2:1)/14; };
function buildTraps(){ while(trapGroup.children.length) trapGroup.remove(trapGroup.children[0]); traps.length=0; const l=rg('trap'); for(let i=0;i<Math.min(5,l);i++){ const a=Math.atan2(MDIR.z,MDIR.x)+Math.PI+(i-2)*0.55; const c=new THREE.Vector3(MC.x+Math.cos(a)*(MD.r-2.2),0,MC.z+Math.sin(a)*(MD.r-2.2)); const g=new THREE.Group(); g.position.copy(c);
    const base=mesh(G.box,M.woodDark,1.4,0.12,1.0); base.position.y=0.06; g.add(base); for(let k=0;k<5;k++){ for(const z of [-0.45,0.45]){ const bar=mesh(G.cyl,M.iron,0.03,0.8,0.03,false); bar.position.set(-0.6+k*0.3,0.46,z); g.add(bar); } } const top=mesh(G.box,M.wood,1.44,0.1,1.04); top.position.y=0.9; g.add(top); const door=mesh(G.box,M.iron,0.05,0.8,0.9,false); door.position.set(0.7,0.46,0); g.add(door);
    const bait=mesh(G.cone,mat(0xff8a2a),0.1,0.3,0.1,false); bait.position.set(0,0.25,0); g.add(bait); if(l>=3){ const flag=mesh(G.box,M.flag,0.35,0.25,0.04,false); flag.position.set(0.6,1.4,0); const pole=mesh(G.cyl,M.handle,0.03,0.6,0.03,false); pole.position.set(0.6,1.15,0); g.add(flag,pole); }
    g.rotation.y=-a; trapGroup.add(g); traps.push({g,c,t:rand(3,14),door,caught:0}); } }
const trapLbl=addLabel(mat2(MD.r-4,0),'',2.6); trapLbl.near=-1; trapLbl.el.classList.add('machLbl');
function updateTraps(dt){ const l=rg('trap'); trapLbl.hide=l<=0||!revealed('meadow'); const k=l+'|'+((S.rg.huntMeat||0)>=hhutCap()); if(trapLbl._k!==k){ trapLbl._k=k; trapLbl.el.innerHTML=`${l>=3?'Av Çiftliği':'Tuzaklar'} <i>Sv ${l}</i><small>dakikada ${Math.round(trapRate()*60*2)} et${(S.rg.huntMeat||0)>=hhutCap()?' · <b class="full">kulübe dolu</b>':''}</small>`; }
  for(const t of traps){ t.t-=dt; t.door.rotation.z=lerp(t.door.rotation.z,t.caught>0?0:-1.2,Math.min(1,dt*8)); if(t.caught>0){ t.caught-=dt; if(t.caught<=0){ const n=l>=3?4:2; if((S.rg.huntMeat||0)<hhutCap()) toHHut(t.c.clone().setY(0.6),n); burst(t.c.clone().setY(0.6),6,M.meat,0.8); } } if(t.t<=0){ t.t=14; t.caught=1.2; tone(300,200,0.08,'square',0.03); } } }
// ----- Çayırın alanları -----
const MPADS=[
  {id:'bow', grp:'meadow', ord:1, name:'Av Bıçağı', desc:'Hayvana daha sert vurursun, avdan daha çok et çıkar', res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-7.4); return [v.x,v.z]; }, kind:'up', key:'bow', cost:l=>Math.round(70*Math.pow(1.55,l)), max:5, show:()=>revealed('meadow')},
  {id:'hunter', grp:'meadow', ord:2, name:'Avcı', desc:'Yayla avlanır, eti kulübeye gönderir', res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-4.7); return [v.x,v.z]; }, kind:'up', key:'hunter', cost:l=>Math.round(110*Math.pow(1.7,l)), max:3, show:()=>revealed('meadow'), onBuy:()=>{ addHunter(); celebrate(hunters[hunters.length-1].guy.g.position.clone(),1); }},
  {id:'trap', grp:'meadow', ord:3, lock:'Bir avcı', name:'Tuzak', desc:'Makine: kafesler kendiliğinden av yakalar, et kulübeye akar. Sv3: av çiftliği', res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-2.0); return [v.x,v.z]; }, kind:'up', key:'trap', cost:l=>Math.round(220*Math.pow(1.75,l)), max:5, show:()=>revealed('meadow')&&rg('hunter')>=1, onBuy:()=>{ buildTraps(); const t=traps[traps.length-1]; if(t) celebrate(t.c.clone(),1.4); camShake=0.4; }},
  {id:'smoke', grp:'meadow', ord:4, name:'Tütsühane', desc:'Makine: et tütsülenir, daha pahalı ve hızlı satılır; her 2 seviye +1 asker hakkı', res:'gold', pos:()=>{ const v=mat2(MD.r+7.6,2.4); return [v.x,v.z]; }, kind:'up', key:'smoke', cost:l=>Math.round(120*Math.pow(1.6,l)), max:5, show:()=>revealed('meadow'), onBuy:()=>{ celebrate(HHUT.clone(),1.2); hhut.scale.setScalar(1+0.05*rg('smoke')); }},
];
for(const d of MPADS) makePad(d);
// ----- kurt (düşman) -----
function makeWolf(big){ const g=new THREE.Group(); const b=new THREE.Group(); g.add(b); const col=big?mat(0x4a4f5a):mat(0x7d828c), dark=mat(0x3a3e46);
  const body=mesh(G.box,col,0.55,0.5,1.25); body.position.y=0.72; const chest=mesh(G.box,mat(0xd8d4cc),0.45,0.35,0.3,false); chest.position.set(0,0.62,0.55); const head=new THREE.Group(); head.position.set(0,1.0,0.75);
  const hd=mesh(G.box,col,0.42,0.38,0.42); const sn=mesh(G.box,col,0.24,0.2,0.34); sn.position.set(0,-0.06,0.32); const nose=mesh(G.box,dark,0.1,0.08,0.06,false); nose.position.set(0,-0.02,0.5); const e1=mesh(G.sph,mat(0xffd23f,{emissive:0x886600}),0.05,0.05,0.04,false); e1.position.set(0.12,0.07,0.21); const e2=e1.clone(); e2.position.x=-0.12;
  const ear1=mesh(G.cone4,col,0.1,0.22,0.08); ear1.position.set(0.12,0.28,-0.02); const ear2=ear1.clone(); ear2.position.x=-0.12; head.add(hd,sn,nose,e1,e2,ear1,ear2); const tail=mesh(G.box,col,0.14,0.14,0.6); tail.position.set(0,0.85,-0.8); tail.rotation.x=0.6;
  b.add(body,chest,head,tail); const legs=[]; for(const [x,z] of [[-0.17,0.42],[0.17,0.42],[-0.17,-0.42],[0.17,-0.42]]){ const lg=new THREE.Group(); lg.position.set(x,0.55,z); const lm=mesh(G.box,dark,0.12,0.55,0.12); lm.position.y=-0.27; lg.add(lm); b.add(lg); legs.push(lg); }
  if(big){ const collar=mesh(G.cyl,M.enemy,0.32,0.12,0.32,false); collar.position.set(0,0.95,0.55); b.add(collar); for(let i=0;i<4;i++){ const sp=mesh(G.cone,M.metal,0.05,0.16,0.05,false); sp.position.set(-0.2+i*0.13,1.05,0.55); b.add(sp); } }
  return {g,b,legs,head,tail,ph:rand(0,6)}; }
function animWolf(w,dt,moving){ w.ph+=dt*(moving?15:3); const s=moving?Math.sin(w.ph)*0.8:0; w.legs.forEach((l,i)=>{ l.rotation.x=(i===0||i===3)?s:-s; }); w.b.position.y=moving?Math.abs(Math.sin(w.ph))*0.1:0; w.tail.rotation.y=Math.sin(w.ph*0.5)*0.4; }

// =====================================================================
// ---------- Yük arabaları: makinelerin ürününü kendiliğinden taşır ----------
// =====================================================================
const carts=[];
function makeCart(){ const g=new THREE.Group(); const bed=mesh(G.box,M.wood,1.5,0.35,2.2); bed.position.y=0.75; const rim=mesh(G.box,M.woodDark,1.6,0.35,0.12); rim.position.set(0,1.05,1.05); const rim2=rim.clone(); rim2.position.z=-1.05; const rim3=mesh(G.box,M.woodDark,0.12,0.35,2.2); rim3.position.set(0.75,1.05,0); const rim4=rim3.clone(); rim4.position.x=-0.75; g.add(bed,rim,rim2,rim3,rim4);
  const wheels=[]; for(const [x,z] of [[-0.85,0.6],[0.85,0.6],[-0.85,-0.6],[0.85,-0.6]]){ const w=new THREE.Group(); w.position.set(x,0.42,z); const wm=mesh(G.cyl,M.woodDark,0.42,0.14,0.42); wm.rotation.z=Math.PI/2; const hub=mesh(G.cyl,M.iron,0.12,0.18,0.12,false); hub.rotation.z=Math.PI/2; for(let k=0;k<4;k++){ const sp=mesh(G.box,M.wood,0.05,0.7,0.06,false); sp.rotation.x=k*Math.PI/4; w.add(sp); } w.add(wm,hub); g.add(w); wheels.push(w); }
  const shaft=mesh(G.box,M.woodDark,0.1,0.1,1.4); shaft.position.set(-0.35,0.8,1.8); const shaft2=shaft.clone(); shaft2.position.x=0.35; g.add(shaft,shaft2);
  const pony=makePony(); pony.g.position.set(0,0,2.9); g.add(pony.g);
  const cargo=new THREE.Group(); cargo.position.y=0.95; g.add(cargo); scene.add(g); return {g,wheels,pony,cargo}; }
function cargoShow(C,type,n){ while(C.cargo.children.length) C.cargo.remove(C.cargo.children[0]); const k=Math.min(18,n); for(let i=0;i<k;i++){ const row=Math.floor(i/6), col=i%6; const m=type==='iron'?itemMesh(BAR_GEO,M.bar):type==='stone'?mesh(G.box,M.rock,0.42,0.32,0.42,false):type==='plank'?mesh(G.box,M.plank,1.1,0.12,0.3,false):mesh(G.log,M.log,1,1,1,false); if(type==='log') m.rotation.x=Math.PI/2; m.position.set(-0.45+(col%3)*0.45,0.12+row*0.3,col<3?-0.45:0.45); if(type==='plank'){ m.position.set(0,0.1+row*0.14+(col%3)*0.0,-0.8+col*0.32); } C.cargo.add(m); } }
// rota: noktalar dizisi; araba A ucunda yüklenir, B ucunda boşaltır, geri döner
function addCart(kind){ const C=makeCart(); const c={kind,C,seg:0,t:0,dir:1,wait:1,load:null,n:0,route:null}; c.route=cartRoute(kind); const p0=c.route[0]; C.g.position.set(p0[0],0,p0[1]); carts.push(c); return c; }
function cartRoute(kind){ const inE=sidePos('E',0,-3), outE=sidePos('E',0,5), inW=sidePos('W',0,-3), outW=sidePos('W',0,5);
  if(kind==='iron') return ironRoute();
  if(kind==='quarry') return [[QOUT.x,QOUT.z],...CART_PATHS[0].slice(0,2),[CART_PATHS[0][2][0],CART_PATHS[0][2][1]],[outE[0],outE[1]],[inE[0],inE[1]],[DEPOT_FRONT.x,DEPOT_FRONT.z]];
  return [[DEPOT_FRONT.x,DEPOT_FRONT.z],[0,4],[inW[0],inW[1]],[outW[0],outW[1]],...CART_PATHS[1].slice().reverse(),[MILL_IN.x,MILL_IN.z]]; }
const cartKey=kind=>kind==='quarry'?'qcart':kind==='iron'?'forge':'mcart'; const cartCap=kind=>10+6*rg(cartKey(kind)); const cartSpd=kind=>7+1.6*rg(cartKey(kind));
function cartArrive(c,end){ if(c.kind==='iron') return ironArrive(c,end); const pos=c.C.g.position.clone();
  if(c.kind==='quarry'){ if(end==='A'){ const n=Math.min(Math.floor(S.rg.cutOut||0),cartCap('quarry')); if(n<=0) return false; S.rg.cutOut-=n; c.load='stone'; c.n=n; cargoShow(c.C,'stone',n); return true; }
    if(c.n>0){ const n=c.n; for(let i=0;i<Math.min(10,n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),rotPt(DEPOT,1.1,0.9,1.1),null,'stone',4),i*60); S.stone+=n; setStonePile(Math.min(18,S.stone)); floatText(pos,'+'+n+' taş',''); SFX.sell(); c.n=0; cargoShow(c.C,'',0); } return true; }
  // değirmen arabası: depodan odun götürür, keresteyi getirir
  if(end==='A'){ if(c.n>0&&c.load==='plank'){ const n=c.n; for(let i=0;i<Math.min(10,n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),rotPt(DEPOT,-0.4,1.0,0.6),null,'plank',4),i*60); S.planks=(S.planks||0)+n; floatText(pos,'+'+n+' kereste','green'); SFX.sell(); c.n=0; }
    const n=Math.min(Math.max(0,S.wood-15),cartCap('mill'),Math.max(0,millInCap()-(S.rg.millIn||0))); if(n<=0&&(S.rg.millOut||0)<1){ cargoShow(c.C,'',0); return false; } if(n>0){ S.wood-=n; setPile(Math.min(24,S.wood)); c.load='log'; c.n=n; cargoShow(c.C,'log',n); } else { c.load=null; c.n=0; cargoShow(c.C,'',0); } return true; }
  if(c.load==='log'&&c.n>0){ S.rg.millIn=(S.rg.millIn||0)+c.n; for(let i=0;i<Math.min(8,c.n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),MILL_IN.clone().setY(0.8),null,true,4),i*60); }
  const out=Math.min(Math.floor(S.rg.millOut||0),cartCap('mill')); S.rg.millOut=(S.rg.millOut||0)-out; c.load=out>0?'plank':null; c.n=out; cargoShow(c.C,out>0?'plank':'',out); return true; }
function updateCarts(dt){ for(const c of carts){ const g=c.C.g; if(c.wait>0){ c.wait-=dt; if(c.wait<=0){ const end=c.dir===1?'A':'B'; if(c.seg===0&&c.dir===1){ if(!cartArrive(c,'A')){ c.wait=2; continue; } c.route=cartRoute(c.kind); } } animCart(c,dt,false); continue; }
    const R=c.route; const i0=c.dir===1?c.seg:R.length-1-c.seg, i1=c.dir===1?c.seg+1:R.length-2-c.seg; const a=R[i0], b=R[i1]; const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1; c.t+=dt*cartSpd(c.kind)/len; const k=Math.min(1,c.t);
    g.position.set(a[0]+(b[0]-a[0])*k,0,a[1]+(b[1]-a[1])*k); const ang=Math.atan2(b[0]-a[0],b[1]-a[1]); let dr=ang-g.rotation.y; dr=Math.atan2(Math.sin(dr),Math.cos(dr)); g.rotation.y+=dr*Math.min(1,dt*6); animCart(c,dt,true);
    if(k>=1){ c.t=0; c.seg++; if(c.seg>=R.length-1){ c.seg=0; if(c.dir===1){ c.dir=-1; cartArrive(c,'B'); c.wait=0.8; } else { c.dir=1; c.wait=0.8; } } } } }
function animCart(c,dt,moving){ for(const w of c.C.wheels) w.rotation.x+=moving?dt*cartSpd(c.kind)/0.42:0; const po=c.C.pony; if(moving){ po.t+=dt*14; const s1=Math.sin(po.t); po.legs[0].rotation.x=s1*0.8; po.legs[3].rotation.x=s1*0.8; po.legs[1].rotation.x=-s1*0.8; po.legs[2].rotation.x=-s1*0.8; po.g.position.y=Math.abs(Math.sin(po.t))*0.08; } else { for(const l of po.legs) l.rotation.x*=0.9; } }

// =====================================================================
// ---------- Taş Ocağı: taş kesme tezgâhı (makine) + taş arabası ----------
// =====================================================================
const QD=REG.quarry; const QC=new THREE.Vector3(QD.c[0],0,QD.c[1]); const QDIR=new THREE.Vector3(-QD.c[0],0,-QD.c[1]).normalize(); const QPERP=new THREE.Vector3(-QDIR.z,0,QDIR.x);
const qat=(d,s)=>QC.clone().addScaledVector(QDIR,d).addScaledVector(QPERP,s);
const QCUT=new THREE.Vector3(34.5,0,33.2), QOUT=new THREE.Vector3(34,0,29);
const cutter=new THREE.Group(); let sawBlade=null; const cutStack=new THREE.InstancedMesh(G.box,M.rock,24); cutStack.count=0;
(function(){ const base=mesh(G.box,M.stoneDark,3.6,0.4,2.6); base.position.y=0.2; const table=mesh(G.box,M.wood,3.0,0.25,1.4); table.position.set(0,1.0,0); for(const [x,z] of [[-1.3,-0.55],[1.3,-0.55],[-1.3,0.55],[1.3,0.55]]){ const l=mesh(G.box,M.woodDark,0.16,0.8,0.16); l.position.set(x,0.6,z); cutter.add(l); }
  sawBlade=new THREE.Group(); sawBlade.position.set(0,1.45,0); const disk=mesh(G.cyl,M.metal,0.75,0.05,0.75); disk.rotation.x=Math.PI/2; sawBlade.add(disk); for(let i=0;i<12;i++){ const tt=mesh(G.cone4,M.metal,0.08,0.18,0.03,false); const a=i/12*6.283; tt.position.set(Math.cos(a)*0.8,Math.sin(a)*0.8,0); tt.rotation.z=a-Math.PI/2; sawBlade.add(tt); }
  const frame=mesh(G.box,M.iron,0.14,1.4,0.14); frame.position.set(0,1.8,-0.6); const arm=mesh(G.box,M.iron,0.14,0.14,0.7); arm.position.set(0,2.45,-0.3); const blk=mesh(G.box,M.rock,1.0,0.6,0.8); blk.position.set(0.9,1.45,0);
  const roof=mesh(G.box,M.roof,4.0,0.14,3.0); roof.position.set(0,3.2,0); roof.rotation.z=0.12; for(const [x,z] of [[-1.7,-1.2],[1.7,-1.2],[-1.7,1.2],[1.7,1.2]]){ const p=mesh(G.cyl,M.woodDark,0.1,3.1,0.1); p.position.set(x,1.6,z); cutter.add(p); }
  cutter.add(base,table,sawBlade,frame,arm,blk,roof);
  for(let i=0;i<24;i++){ const row=Math.floor(i/6),col=i%6; vp.set(-1.2+(col%3)*0.5,0.25+row*0.3,(col<3?1.7:2.2)); e3.set(0,rand(-.1,.1),0); q.setFromEuler(e3); vs.set(0.44,0.3,0.44); m4.compose(vp,q,vs); cutStack.setMatrixAt(i,m4); } cutter.add(cutStack);
  cutter.position.copy(QCUT); cutter.rotation.y=Math.atan2(QDIR.x,QDIR.z); cutter.visible=false; scene.add(cutter); })();
const cutLbl=addLabel(QCUT,'',4.0); cutLbl.near=-1; cutLbl.el.classList.add('machLbl');
const cutRate=()=>rg('cutter')/2.6; // saniyede taş
const cutCap=()=>30+20*rg('cutter');
function updateCutter(dt){ const l=rg('cutter'); cutter.visible=l>0; cutLbl.hide=l<=0; if(l<=0) return; const full=(S.rg.cutOut||0)>=cutCap(); if(!full){ S.rg.cutOut=Math.min(cutCap(),(S.rg.cutOut||0)+cutRate()*dt); sawBlade.rotation.z-=dt*(10+4*l); if(Math.random()<dt*8) burst(QCUT.clone().setY(1.5),2,M.rockLight,0.6); }
  cutStack.count=Math.min(24,Math.floor(S.rg.cutOut||0)); const k=Math.floor(S.rg.cutOut||0)+'|'+l+'|'+full; if(cutLbl._k!==k){ cutLbl._k=k; cutLbl.el.innerHTML=`Taş Kesme Tezgâhı <i>Sv ${l}</i><small>dakikada ${Math.round(cutRate()*60)} taş · 🪨 ${Math.floor(S.rg.cutOut||0)}/${cutCap()}${full?' · <b class="full">Dolu! Araba bekliyor</b>':''}</small>`; } }
const QPADS=[
  {id:'cutter', grp:'quarry', ord:1, name:'Taş Kesme Tezgâhı', desc:'Makine: ocaktan kendiliğinden taş keser; araba taşı depoya götürür', res:'gold', pos:()=>{ const v=qat(QD.r+5,-5.2); return [v.x,v.z]; }, kind:'up', key:'cutter', cost:l=>Math.round(260*Math.pow(1.7,l)), max:5, show:()=>revealed('quarry'), onBuy:()=>{ if(!carts.some(c=>c.kind==='quarry')) addCart('quarry'); cutter.scale.setScalar(1+0.06*(rg('cutter')-1)); celebrate(QCUT.clone(),1.4); camShake=0.4; }},
  {id:'qcart', grp:'quarry', ord:2, lock:'Taş kesme tezgâhı', name:'Taş Arabası', desc:'Araba daha çok taşır, daha hızlı gider', res:'gold', pos:()=>{ const v=qat(QD.r+5,-2.6); return [v.x,v.z]; }, kind:'up', key:'qcart', cost:l=>Math.round(150*Math.pow(1.6,l)), max:5, show:()=>revealed('quarry')&&rg('cutter')>=1, onBuy:()=>{ const c=carts.find(c=>c.kind==='quarry'); if(c) celebrate(c.C.g.position.clone(),0.8); }},
];
for(const d of QPADS) makePad(d);

// =====================================================================
// ---------- Nehir: su değirmeni + bıçkıhane (odun → kereste) + kereste arabası ----------
// =====================================================================
const RV=REG.river; const RC=new THREE.Vector3(RV.c[0],0,RV.c[1]); const RDIR=new THREE.Vector3(-RV.c[0],0,-RV.c[1]).normalize(); const RPERP=new THREE.Vector3(-RDIR.z,0,RDIR.x);
const rat=(d,s)=>RC.clone().addScaledVector(RDIR,d).addScaledVector(RPERP,s);
const MILL=rat(3.4,-1.2), MILL_IN=rat(5.2,4.6), SAW=rat(3.6,4.8);
const mill=new THREE.Group(); let wheel=null, saw2=null; const beltLogs=[]; const plankStack=new THREE.InstancedMesh(G.box,M.plank,24); plankStack.count=0; const inStack=new THREE.InstancedMesh(G.log,M.log,20); inStack.count=0;
(function(){ const g=mill; const ang=Math.atan2(RDIR.x,RDIR.z);
  const house=new THREE.Group(); const base=mesh(G.box,M.stone,3.4,1.4,3.0); base.position.y=0.7; const up=mesh(G.box,M.wood,3.2,1.8,2.8); up.position.y=2.3; const r1=mesh(G.box,M.roof,3.8,0.15,1.9); r1.position.set(0,3.75,-0.72); r1.rotation.x=0.65; const r2=r1.clone(); r2.position.z=0.72; r2.rotation.x=-0.65; const door=mesh(G.box,M.woodDark,0.8,1.2,0.1,false); door.position.set(0,0.6,1.52); const win=mesh(G.box,M.gold,0.5,0.5,0.08,false); win.position.set(0.8,2.4,1.42); house.add(base,up,r1,r2,door,win); house.position.copy(MILL); house.rotation.y=ang; house.scale.setScalar(1.3); g.add(house);
  // su çarkı: nehrin içinde, evin yanında
  wheel=new THREE.Group(); const wp=RC.clone(); wheel.position.set(wp.x,1.6,wp.z); wheel.rotation.y=ang+Math.PI/2; const hub=mesh(G.cyl,M.iron,0.35,0.9,0.35); hub.rotation.x=Math.PI/2; wheel.add(hub); for(let i=0;i<10;i++){ const a=i/10*6.283; const spoke=mesh(G.box,M.woodDark,0.12,1.6,0.12,false); spoke.position.set(Math.cos(a)*0.8,Math.sin(a)*0.8,0); spoke.rotation.z=a-Math.PI/2; const pad=mesh(G.box,M.wood,0.5,0.1,0.9); pad.position.set(Math.cos(a)*1.55,Math.sin(a)*1.55,0); pad.rotation.z=a; wheel.add(spoke,pad); } for(const z of [-0.45,0.45]){ const ring=new THREE.Mesh(new THREE.TorusGeometry(1.5,0.07,6,24),M.woodDark); ring.position.z=z; wheel.add(ring); }
  const axle=mesh(G.cyl,M.iron,0.12,2.2,0.12); axle.position.set((wp.x+MILL.x)/2,1.6,(wp.z+MILL.z)/2); axle.rotation.z=Math.PI/2; axle.rotation.y=ang; g.add(wheel,axle);
  // bıçkıhane: bant, testere, kereste yığını
  const sb=new THREE.Group(); const tbl=mesh(G.box,M.woodDark,1.2,0.6,4.4); tbl.position.y=0.5; const belt=mesh(G.box,mat(0x3a3a3a),0.9,0.08,4.3,false); belt.position.y=0.84; saw2=new THREE.Group(); saw2.position.set(0,1.2,0); const disk=mesh(G.cyl,M.metal,0.6,0.05,0.6); disk.rotation.z=Math.PI/2; saw2.add(disk); const hood=mesh(G.box,M.iron,0.3,0.4,0.9); hood.position.set(0,1.75,0); sb.add(tbl,belt,saw2,hood);
  for(let i=0;i<4;i++){ const lg=mesh(G.log,M.log,1.1,1.1,1.1,false); lg.rotation.x=Math.PI/2; lg.position.set(0,1.0,-2+i*1.3); sb.add(lg); beltLogs.push(lg); }
  sb.position.copy(SAW); sb.rotation.y=ang+Math.PI/2; g.add(sb);
  for(let i=0;i<24;i++){ const row=Math.floor(i/4),col=i%4; vp.set(-0.6+col*0.4,0.12+row*0.14,0); e3.set(0,Math.PI/2,0); q.setFromEuler(e3); vs.set(1.4,0.12,0.36); m4.compose(vp,q,vs); plankStack.setMatrixAt(i,m4); } plankStack.position.copy(rat(5.8,1.5)); g.add(plankStack);
  for(let i=0;i<20;i++){ const row=Math.floor(i/5),col=i%5; vp.set(-0.9+col*0.45+(row%2)*0.22,0.25+row*0.38,0); e3.set(0,0,Math.PI/2); q.setFromEuler(e3); vs.set(1.1,1.1,1.1); m4.compose(vp,q,vs); inStack.setMatrixAt(i,m4); } inStack.position.copy(MILL_IN); inStack.rotation.y=ang; g.add(inStack);
  mill.visible=false; scene.add(mill); })();
const millLbl=addLabel(rat(6.5,2),'',3.2); millLbl.near=-1; millLbl.el.classList.add('machLbl');
const millRate=()=>rg('mill')/3; // saniyede kereste (2 odun → 1 kereste)
const millInCap=()=>40+20*rg('mill');
function updateMill(dt){ const l=rg('mill'); mill.visible=l>0; millLbl.hide=l<=0; if(l<=0) return; const inn=S.rg.millIn||0; const working=inn>=2;
  wheel.rotation.z-=dt*(1.2+0.3*l); if(working){ const d=Math.min(millRate()*dt,inn/2); S.rg.millIn=inn-d*2; S.rg.millOut=(S.rg.millOut||0)+d; saw2.rotation.x+=dt*(14+4*l); for(const lg of beltLogs){ lg.position.z+=dt*(0.8+0.25*l); if(lg.position.z>2.4){ lg.position.z=-2.4; burst(SAW.clone().setY(1.2),3,M.logEnd,0.5); } } }
  inStack.count=Math.min(20,Math.ceil((S.rg.millIn||0)/3)); plankStack.count=Math.min(24,Math.floor(S.rg.millOut||0));
  const k=Math.floor(S.rg.millIn||0)+'|'+Math.floor(S.rg.millOut||0)+'|'+l; if(millLbl._k!==k){ millLbl._k=k; millLbl.el.innerHTML=`Su Değirmeni <i>Sv ${l}</i><small>dakikada ${Math.round(millRate()*60)} kereste · 🪵 ${Math.floor(S.rg.millIn||0)} odun bekliyor${working?'':' · <b class="full">odun yok — depoya odun koy</b>'}</small>`; } }
const RPADS=[
  {id:'mill', grp:'river', ord:1, name:'Su Değirmeni', desc:'Makine: depodaki odunu keresteye çevirir; kereste 7. seviye ve üstü kuleler için gerekir', res:'gold', pos:()=>{ const v=rat(RV.r+2,-4.2); return [v.x,v.z]; }, kind:'up', key:'mill', cost:l=>Math.round(300*Math.pow(1.7,l)), max:5, show:()=>revealed('river'), onBuy:()=>{ if(!carts.some(c=>c.kind==='mill')) addCart('mill'); celebrate(MILL.clone(),1.6); camShake=0.5; }},
  {id:'mcart', grp:'river', ord:2, lock:'Su değirmeni', name:'Kereste Arabası', desc:'Araba daha çok taşır, daha hızlı gider', res:'gold', pos:()=>{ const v=rat(RV.r+2,-1.6); return [v.x,v.z]; }, kind:'up', key:'mcart', cost:l=>Math.round(160*Math.pow(1.6,l)), max:5, show:()=>revealed('river')&&rg('mill')>=1, onBuy:()=>{ const c=carts.find(c=>c.kind==='mill'); if(c) celebrate(c.C.g.position.clone(),0.8); }},
];
for(const d of RPADS) makePad(d);

// ----- sen yokken: işçi ve makineler üretir, balıkhane satar, para yığılır -----
function offlineRun(sec){ const out={sec,fish:0,gold:0,wood:0}; if(sec<60) return out; sec=Math.min(sec,3*3600);
  if(revealed('lake')){ const prod=sec*(fishers.length/7+netRate()); const sold=Math.min((S.rg.hutFish||0)+prod,sec/hutSellT()); const st=Math.max(0,Math.min(hutCap(),(S.rg.hutFish||0)+prod-sold)); const before=pileVal(fishPile); pileAdd(fishPile,sold*fishPrice()); S.rg.hutFish=st; out.fish=Math.round(prod); out.gold+=Math.round(pileVal(fishPile)-before); }
  if(revealed('meadow')){ const prod=sec*(hunters.length*2/10+trapRate()*2); const sold=Math.min((S.rg.huntMeat||0)+prod,sec/hhutSellT()); const st=Math.max(0,Math.min(hhutCap(),(S.rg.huntMeat||0)+prod-sold)); const before=pileVal(meatPile); pileAdd(meatPile,sold*meatPrice()); S.rg.huntMeat=st; out.meat=Math.round(prod); out.gold+=Math.round(pileVal(meatPile)-before); }
  if(rg('cutter')>0){ const st=Math.round(sec*cutRate()*0.8); S.stone+=st; out.stone=st; }
  if(rg('mill')>0){ const pl=Math.round(Math.min(sec*millRate()*0.8,(S.wood-15)/2)); if(pl>0){ S.planks=(S.planks||0)+pl; S.wood-=pl*2; out.planks=pl; } }
  offline6(sec,out);
  const wood=Math.round(sec/60*workers.filter(w=>w.kind!=='stone').length*9); if(wood>0){ S.wood+=wood; setPile(Math.min(24,S.wood)); out.wood=wood; }
  return out; }
function showOffline(o){ if(o.sec<60||(!o.fish&&!o.gold&&!o.wood&&!o.meat&&!o.stone&&!o.planks&&!o.iron&&!o.herb&&!o.crystal&&!o.chests)) return false; const m=Math.round(o.sec/60); const card=document.createElement('div'); card.className='intro'; card.id='awayCard';
  card.innerHTML=`<div class="card"><h1>Sen yokken</h1><p>${m>=60?Math.floor(m/60)+' saat '+(m%60)+' dakika':m+' dakika'} boyunca krallığın çalıştı.</p><div class="away">${o.wood?`<div><span>Oduncular depoya</span><b>+${o.wood} odun</b></div>`:''}${o.fish?`<div><span>Balıkçılar ve ağlar</span><b>+${o.fish} balık</b></div>`:''}${o.meat?`<div><span>Avcılar ve tuzaklar</span><b>+${o.meat} et</b></div>`:''}${o.stone?`<div><span>Taş kesme tezgâhı</span><b>+${o.stone} taş</b></div>`:''}${o.planks?`<div><span>Su değirmeni</span><b>+${o.planks} kereste</b></div>`:''}${offlineRows6(o)}${o.gold?`<div><span>Satışlardan biriken para</span><b>💰 ${o.gold}</b></div>`:''}</div><p class="sub">Paralar yerde seni bekliyor — yanına gidip topla.</p><button id="awayOk">Krallığa dön</button></div>`;
  document.body.appendChild(card); $('awayOk').addEventListener('click',()=>{ audio(); card.remove(); }); return true; }

// ----- rehber: taşınan balığı götür, dolan yığını topla, boşken balık tut -----
function regionGuide(mode){ const p=player.g.position; if(mode==='carry'){ const r6=regionGuide6('carry'); if(r6) return r6; } if(mode==='idle'){ const r6=regionGuide6('idle'); if(r6) return r6; }
  if(mode==='carry'){ if((S.meat||0)>0&&revealed('meadow')) return {t:HHUT_FRONT,text:'Eti av kulübesine götür'}; if((S.fish||0)>0&&revealed('coast')&&(!revealed('lake')||p.distanceTo(WH_FRONT)<p.distanceTo(HUT_FRONT))) return {t:WH_FRONT,text:'Balıkları limana sat'}; if((S.fish||0)>0&&revealed('lake')) return {t:HUT_FRONT,text:'Balıkları balıkhaneye götür'}; return null; }
  if(mode==='pile'){ let best=null,bv=0; for(const P of piles){ const v=pileVal(P); if(!P.g.visible||v<Math.min(P.capFn()*0.5,150)) continue; const sc=v/P.capFn()*100-Math.hypot(P.pos.x-p.x,P.pos.z-p.z)*0.3; if(!best||sc>bv){ bv=sc; best=P; } } if(best) return {t:best.pos,text:(pileVal(best)>=best.capFn()-0.5?'Yığın doldu — ':'')+'Altınları topla'}; return null; }
  if(mode==='idle'){ const lakeV=revealed('lake')?pileVal(fishPile)+(S.rg.hutFish||0)*3:1e9, mdV=revealed('meadow')?pileVal(meatPile)+(S.rg.huntMeat||0)*3:1e9; if(revealed('meadow')&&mdV<=lakeV&&animals.length&&(S.meat||0)<meatCap()){ let best=null,bd=1e9; for(const a of animals){ const d=Math.hypot(a.m.g.position.x-p.x,a.m.g.position.z-p.z); if(d<bd){ bd=d; best=a; } } return {t:best.m.g.position.clone(),text:'Çayırda avlan'}; } if(revealed('lake')&&(S.fish||0)<fishCap()) return {t:DOCK_END,text:'İskelede balık tut'}; return null; } return null; }

// ----- ana güncelleme -----
let capsT=0;
function updateRegions(dt){ updateRegionFx(dt); if(revealed('lake')){ updateFishing(dt); updateFishers(dt); updateNets(dt); updateHut(dt); const t=performance.now()/1000; for(const r of ripples){ r.t-=dt; if(r.t<=0){ r.t=rand(1.5,3.5); const a=rand(0,6.28), rr=rand(1,LK.r-1.5); r.m.position.set(LC.x+Math.cos(a)*rr,0.07,LC.z+Math.sin(a)*rr); r.age=0; } r.age=(r.age||0)+dt; const k=Math.min(1,r.age/1.4); r.m.scale.setScalar(0.6+2.2*k); r.m.material.opacity=0.55*(1-k); } if(lake.boat) lake.boat.position.y=0.08+Math.sin(t*1.1)*0.05; }
  if(revealed('meadow')){ updateAnimals(dt); updateHunters(dt); updateTraps(dt); updateHHut(dt); }
  if(revealed('quarry')) updateCutter(dt); if(revealed('river')) updateMill(dt); updateCarts(dt);
  hutLbl.hide=!revealed('lake'); hhutLbl.hide=!revealed('meadow'); updateRegions6(dt); updatePiles(dt); capsT-=dt; if(capsT<=0){ capsT=1; applyCaps(); syncClouds(); layoutPads(); fishPile.g.visible=revealed('lake'); meatPile.g.visible=revealed('meadow'); } }
function initRegions(){ applyCaps(); syncClouds(); for(let i=fishers.length;i<rg('fisher');i++) addFisher(); for(let i=hunters.length;i<rg('hunter');i++) addHunter(); buildNets(); buildTraps(); if(rg('cutter')>0&&!carts.some(c=>c.kind==='quarry')) addCart('quarry'); if(rg('mill')>0&&!carts.some(c=>c.kind==='mill')) addCart('mill'); fishPile.g.visible=revealed('lake'); meatPile.g.visible=revealed('meadow'); initRegions6(); setExtraBack(); }
