
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
function setExtraBack(){ const g=player; if(!g||!g.fishMesh) return; let row=Math.ceil(S.logs/2)+Math.ceil((S.stones||0)/2)+Math.ceil((S.loot||0)/2);
  const put=(im,n)=>{ n=Math.max(0,Math.min(60,n)); for(let i=0;i<n;i++){ const r=row+Math.floor(i/2), s=i%2; vp.set(s?0.24:-0.24,0.14+r*0.3,-0.05); e3.set(0,Math.PI/2,0.15*(s?1:-1)); q.setFromEuler(e3); vs.set(0.85,0.85,0.85); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); } im.count=n; im.instanceMatrix.needsUpdate=true; row+=Math.ceil(n/2); };
  put(g.fishMesh,S.fish||0); put(g.meatMesh,S.meat||0); }
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
    if(v>=1&&Math.hypot(p.x-P.pos.x,p.z-P.pos.z)<2.6){ P.t-=dt; if(P.t<=0){ P.t=0.05; const take=Math.max(1,Math.min(v,Math.max(4,v/10))); S.rg[P.id]=v-take; fly(P.pos.clone().setY(0.8+n*0.02),player.g,()=>{ S.coins+=take; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.06; SFX.coin(); } } } } }

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
  if(revealed('lake')) lakeCollide(p); }

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
const FISH=[{k:'sazan',n:'Sazan',v:1,w:52,c:0x9fb7a0},{k:'alabalik',n:'Alabalık',v:1.4,w:28,c:0xd79a9a},{k:'turna',n:'Turna',v:2,w:13,c:0x7fa37a},{k:'yayin',n:'Yayın',v:3.4,w:6,c:0x5c6470},{k:'altin',n:'Altın Balık',v:8,w:1.4,c:0xffc93a}];
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
function fishSpot(){ return lat(LK.r-8.6,rand(-2,2)).setY(0.08); }
function endFishing(){ FS.state='idle'; bob.visible=false; fishLine.visible=false; rodMesh.visible=false; fishUI.style.display='none'; }
function rollFish(qual){ const rare=1+0.15*rg('rod')+(qual>0.75?1.5:0); let tot=0; const ws=FISH.map((f,i)=>{ const w=f.w*(i>=2?rare:1); tot+=w; return w; }); let r=Math.random()*tot; for(let i=0;i<FISH.length;i++){ r-=ws[i]; if(r<=0) return FISH[i]; } return FISH[0]; }
function reel(){ if(FS.state!=='bite') return; const d=Math.abs(FS.needle-FS.zc); if(d<=FS.zw/2){ const qual=1-d/(FS.zw/2); const f=rollFish(qual); catchFish(f,qual); } else { floatText(player.g.position,'Kaçtı!','red'); SFX.hit(); FS.state='cool'; FS.t=0.6; fishUI.style.display='none'; bob.visible=false; fishLine.visible=false; } }
function catchFish(f,qual){ FS.state='cool'; FS.t=0.55; fishUI.style.display='none'; const from=bob.position.clone().setY(0.5); bob.visible=false; fishLine.visible=false; burst(from,10,M.waterLight,1.2); SFX.sell();
  fly(from,player.g,()=>{ S.fish=(S.fish||0)+1; setBack(player); },'fish',3.2);
  S.book.fish[f.k]=(S.book.fish[f.k]||0)+1; const first=S.book.fish[f.k]===1; floatText(player.g.position,(qual>0.8?'Mükemmel! ':'')+f.n,first?'green':''); if(first&&f.k!=='sazan'){ banner('Yeni tür: '+f.n,'Koleksiyon defterine eklendi','day'); SFX.fanfare(); }
  if(f.v>=3){ camShake=0.25; celebrate(from.clone().setY(0),0.6); } }
function updateFishing(dt){ const p=player.g.position; const onDock=revealed('lake')&&Math.hypot(p.x-DOCK_END.x,p.z-DOCK_END.z)<1.9; const can=onDock&&!playerMoving&&(S.fish||0)<fishCap()&&!nearestEnemy(p,6)&&!document.querySelector('.intro');
  if(!can){ if(FS.state!=='idle') endFishing(); if(onDock&&(S.fish||0)>=fishCap()&&!playerMoving){ FS.fullT=(FS.fullT||0)-dt; if(FS.fullT<=0){ FS.fullT=2.5; floatText(p,'Sırtın balıkla dolu — balıkhaneye götür','red'); } } return; }
  rodMesh.visible=true; player.g.rotation.y=Math.atan2(-LDIR.x,-LDIR.z);
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
const bossName=()=>(BOSSES[Math.min(10,S.level)]||BOSSES[1]).n;
function applyBossLook(guy){ const B=BOSSES[Math.min(10,S.level)]||BOSSES[1]; if(B.hat==='pirate'){ const brim=mesh(G.cyl,mat(0x1d1d22),0.8,0.08,0.5); brim.position.y=2.0; const top=mesh(G.cone,mat(0x1d1d22),0.5,0.45,0.35); top.position.y=2.25; const sk=mesh(G.sph,M.metal,0.1,0.1,0.05,false); sk.position.set(0,2.2,0.3); const patch=mesh(G.box,mat(0x111111),0.18,0.12,0.05,false); patch.position.set(0.18,1.55,0.52); guy.root.add(brim,top,sk,patch); guy.root.children.forEach(o=>{ if(o.material===M.enemyHelm) o.visible=false; }); }
  else if(B.hat==='crown'){ const c=mesh(G.cyl,M.gold,0.42,0.3,0.42); c.position.y=2.1; guy.root.add(c); }
  else if(B.hat==='wolf'||B.hat==='hood'||B.hat==='witch'){ const h=mesh(G.cone,B.hat==='witch'?mat(0x3a2a4a):mat(0x5a4a3a),0.6,0.9,0.6); h.position.y=2.25; guy.root.add(h); } }

// ----- kaplar: sefere göre en yüksek seviyeler (krallık büyüdükçe açılır) -----
function applyCaps(){ const L=S.level; for(const pd of pads){ const d=pd.def; if(d.kind==='tower') d.max=Math.min(10,5+L); else if(d.id==='wall') d.max=Math.min(10,3+L); else if(d.id==='soldier') d.max=Math.min(10,3+L); else if(d.id==='worker') d.max=Math.min(6,2+L); else if(d.id==='feet'||d.id==='trader') d.max=Math.min(10,3+L); else if(d.id==='newCannon') d.max=Math.min(8,1+L); else if(d.id==='expand') d.max=Math.min(4,1+Math.floor(L/2)); else if(d.id==='stoneWorker') d.max=Math.min(4,L-2); } }

// ----- sen yokken: işçi ve makineler üretir, balıkhane satar, para yığılır -----
function offlineRun(sec){ const out={sec,fish:0,gold:0,wood:0}; if(sec<60) return out; sec=Math.min(sec,3*3600);
  if(revealed('lake')){ const prod=sec*(fishers.length/7+netRate()); const sold=Math.min((S.rg.hutFish||0)+prod,sec/hutSellT()); const st=Math.max(0,Math.min(hutCap(),(S.rg.hutFish||0)+prod-sold)); const before=pileVal(fishPile); pileAdd(fishPile,sold*fishPrice()); S.rg.hutFish=st; out.fish=Math.round(prod); out.gold+=Math.round(pileVal(fishPile)-before); }
  const wood=Math.round(sec/60*workers.filter(w=>w.kind!=='stone').length*9); if(wood>0){ S.wood+=wood; setPile(Math.min(24,S.wood)); out.wood=wood; }
  return out; }
function showOffline(o){ if(o.sec<60||(!o.fish&&!o.gold&&!o.wood)) return false; const m=Math.round(o.sec/60); const card=document.createElement('div'); card.className='intro'; card.id='awayCard';
  card.innerHTML=`<div class="card"><h1>Sen yokken</h1><p>${m>=60?Math.floor(m/60)+' saat '+(m%60)+' dakika':m+' dakika'} boyunca krallığın çalıştı.</p><div class="away">${o.wood?`<div><span>Oduncular depoya</span><b>+${o.wood} odun</b></div>`:''}${o.fish?`<div><span>Balıkçılar ve ağlar</span><b>+${o.fish} balık</b></div>`:''}${o.gold?`<div><span>Balıkhanede biriken para</span><b>💰 ${o.gold}</b></div>`:''}</div><p class="sub">Paralar yerde seni bekliyor — yanına gidip topla.</p><button id="awayOk">Krallığa dön</button></div>`;
  document.body.appendChild(card); $('awayOk').addEventListener('click',()=>{ audio(); card.remove(); }); return true; }

// ----- rehber: taşınan balığı götür, dolan yığını topla, boşken balık tut -----
function regionGuide(mode){ const p=player.g.position;
  if(mode==='carry'){ if((S.fish||0)>0&&revealed('lake')) return {t:HUT_FRONT,text:'Balıkları balıkhaneye götür'}; for(const P of piles){ const v=pileVal(P); if(P.g.visible&&v>=Math.min(P.capFn()*0.6,120)) return {t:P.pos,text:(pileVal(P)>=P.capFn()-0.5?'Yığın doldu — ':'')+'Altınları topla'}; } return null; }
  if(mode==='idle'){ if(revealed('lake')&&(S.fish||0)<fishCap()) return {t:DOCK_END,text:'İskelede balık tut'}; return null; } return null; }

// ----- ana güncelleme -----
let capsT=0;
function updateRegions(dt){ updateRegionFx(dt); if(revealed('lake')){ updateFishing(dt); updateFishers(dt); updateNets(dt); updateHut(dt); const t=performance.now()/1000; for(const r of ripples){ r.t-=dt; if(r.t<=0){ r.t=rand(1.5,3.5); const a=rand(0,6.28), rr=rand(1,LK.r-1.5); r.m.position.set(LC.x+Math.cos(a)*rr,0.07,LC.z+Math.sin(a)*rr); r.age=0; } r.age=(r.age||0)+dt; const k=Math.min(1,r.age/1.4); r.m.scale.setScalar(0.6+2.2*k); r.m.material.opacity=0.55*(1-k); } if(lake.boat) lake.boat.position.y=0.08+Math.sin(t*1.1)*0.05; }
  hutLbl.hide=!revealed('lake'); updatePiles(dt); capsT-=dt; if(capsT<=0){ capsT=1; applyCaps(); syncClouds(); layoutPads(); fishPile.g.visible=revealed('lake'); } }
function initRegions(){ applyCaps(); syncClouds(); for(let i=fishers.length;i<rg('fisher');i++) addFisher(); buildNets(); fishPile.g.visible=revealed('lake'); setExtraBack(); }
