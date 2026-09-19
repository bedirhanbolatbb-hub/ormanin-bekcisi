(function(){
'use strict';
const THREE = window.THREE;
if(THREE.ColorManagement) THREE.ColorManagement.legacyMode=false;
const $ = id => document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const isTouch=matchMedia('(pointer:coarse)').matches;
const isMobile=isTouch||innerWidth<700;

// ---------- Kalıcı durum ----------
const SAVE_KEY='ormanin-bekcisi-v5';
const WAVES=8;
const LV0={axe:0,bag:0,feet:0,worker:0,sword:0,wall:0,soldier:0,expand:0,trader:0,towerTrain:0,magnet:0};
const S = { coins:0, bank:0, logs:0, loot:0, wood:0, stall:0, wave:1, level:1, gateHp:150, muted:false, treesCut:0, kills:0, lv:Object.assign({},LV0), tw:[0,0,0,0,0,0,0,0,0,0,0,0], paid:{} };
function load(){ try{ const j=JSON.parse(localStorage.getItem(SAVE_KEY)); if(j){ Object.assign(S,j); S.lv=Object.assign({},LV0, j.lv||{}); S.tw=j.tw||[]; while(S.tw.length<12) S.tw.push(0); S.paid=j.paid||{}; } }catch(e){} }
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
load();
const gw=()=>(S.level-1)*WAVES+S.wave;
const D = {
  chopRate:()=>4.0*(1+0.2*S.lv.axe), treeHits:()=>1, logsPerTree:()=>4,
  cap:()=>40+15*S.lv.bag, speed:()=>7.4+0.5*S.lv.feet, magnet:()=>3.8+0.8*S.lv.magnet, lootPrice:()=>8+gw()*1.5+3*S.lv.trader+4*(S.lv.price||0), buyTime:()=>Math.max(0.25,0.7-0.08*S.lv.trader),
  swordDmg:()=>9+4*S.lv.sword, swordRange:()=>2.9+0.1*S.lv.sword,
  gateMax:()=>150+160*S.lv.wall+60*(S.lv.gateLv||0), towerDmg:l=>5+3*(l-1)+2*S.lv.towerTrain, towerRange:()=>17+2*(S.lv.range||0), soldierDmg:()=>6+2*S.lv.sword+2*(S.lv.soldierTrain||0), logPrice:()=>5,
};

// ---------- Ses ----------
let AC=null;
function audio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); }
function tone(f0,f1,dur,type,vol){ if(S.muted||!AC) return; const o=AC.createOscillator(), g=AC.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f0,AC.currentTime); o.frequency.exponentialRampToValueAtTime(f1,AC.currentTime+dur); g.gain.setValueAtTime(vol||0.08,AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+dur); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime+dur); }
function noise(dur,vol){ if(S.muted||!AC) return; const n=AC.sampleRate*dur, b=AC.createBuffer(1,n,AC.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n); const s=AC.createBufferSource(); s.buffer=b; const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900; const g=AC.createGain(); g.gain.value=vol||0.25; s.connect(f).connect(g).connect(AC.destination); s.start(); }
const SFX = {
  chop:()=>{ noise(0.08,0.35); tone(180,90,0.08,'square',0.04); }, fall:()=>{ noise(0.3,0.4); tone(120,50,0.3,'sawtooth',0.05); },
  coin:()=>{ tone(880,1320,0.12,'sine',0.06); }, sell:()=>{ tone(660,990,0.08,'triangle',0.05); }, pay:()=>{ tone(740,520,0.05,'triangle',0.03); },
  build:()=>{ tone(300,600,0.15,'triangle',0.08); setTimeout(()=>tone(600,900,0.2,'triangle',0.08),120); setTimeout(()=>tone(900,1200,0.25,'sine',0.07),260); },
  slash:()=>{ noise(0.07,0.25); tone(900,300,0.09,'sawtooth',0.04); }, hit:()=>{ tone(300,120,0.1,'square',0.05); }, die:()=>{ tone(400,80,0.2,'sawtooth',0.05); },
  gate:()=>{ noise(0.12,0.3); tone(90,40,0.15,'square',0.06); }, wave:()=>{ tone(220,330,0.25,'triangle',0.08); setTimeout(()=>tone(330,440,0.3,'triangle',0.08),200); },
};

// ---------- Sahne ----------
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isMobile?1.75:2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xe8dcc0);
scene.fog=new THREE.Fog(0xe8dcc0,110,210);
const camera=new THREE.PerspectiveCamera(36,1,0.5,320);
const YAW=0.55; // çapraz (izometrik) bakış
const camOff=new THREE.Vector3(Math.sin(YAW)*30,44,Math.cos(YAW)*30);
scene.add(new THREE.HemisphereLight(0xfff4e0,0x8f7a55,0.5));
const sun=new THREE.DirectionalLight(0xfff1d2,1.25);
sun.position.set(14,26,10); sun.castShadow=true;
sun.shadow.mapSize.set(isMobile?1024:2048,isMobile?1024:2048);
Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:120});
sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.02; sun.shadow.camera.updateProjectionMatrix();
scene.add(sun); scene.add(sun.target);

const mat=(c,extra)=>new THREE.MeshLambertMaterial(Object.assign({color:c},extra||{}));
const M={
  trunk:mat(0x8a5a36), leaf:mat(0xffffff), log:mat(0xc98d4e), logEnd:mat(0xf0cd9c),
  wood:mat(0xb5803f), woodDark:mat(0x7d5124), plank:mat(0xd2a15e), stone:mat(0xa8a49c), stoneDark:mat(0x7f7b74), bush:mat(0x4fa66a), flower:mat(0xffffff),
  skin:mat(0xffd7b1), skin2:mat(0xf5b98f), shirt:mat(0x2f6fd6), pants:mat(0x3f5484), belt:mat(0x5a3a1e), boot:mat(0x4a2f1a), crown:mat(0xffc93a,{emissive:0x6a4a00}), hair:mat(0x5a3a1e),
  workerShirt:mat(0xe8e2d6), workerHat:mat(0xd9534f), soldierShirt:mat(0x3d63c9), soldierHelm:mat(0x3b4f8a),
  metal:mat(0xd8dee4), handle:mat(0x6d4a2a), blade:mat(0xe8f0ff,{emissive:0x334466}),
  coin:mat(0xf59e0b,{emissive:0x6b3f00}), gold:mat(0xe8961a,{emissive:0x5a3800}),
  enemy:mat(0xd63a3a), enemyDark:mat(0x9c2323), enemyHelm:mat(0xc02f2f), eye:mat(0xffffff), pupil:mat(0x1d1d22),
  gate:mat(0xb5803f), banner:mat(0xd9534f), flag:mat(0xf2b43c), arrow:mat(0xffffff,{emissive:0x8a8a8a}), chest:mat(0x8c4b25), chestGold:mat(0xffd36b,{emissive:0x6a4a00}),
};
const G={
  box:new THREE.BoxGeometry(1,1,1), cyl:new THREE.CylinderGeometry(1,1,1,12), cone:new THREE.ConeGeometry(1,1,8), cone4:new THREE.ConeGeometry(1,1,4), sph:new THREE.SphereGeometry(1,14,12),
  log:new THREE.CylinderGeometry(0.2,0.2,0.95,9), dod:new THREE.DodecahedronGeometry(1,0), coin:new THREE.CylinderGeometry(0.42,0.42,0.14,12),
};
function mesh(g,m,sx,sy,sz,shadow){ const o=new THREE.Mesh(g,m); o.scale.set(sx,sy,sz); o.castShadow=shadow!==false; o.receiveShadow=true; return o; }
function mergeGeos(list){ const pos=[],nor=[]; for(const g of list){ const gg=g.index?g.toNonIndexed():g; const p=gg.attributes.position.array, n=gg.attributes.normal.array; for(let i=0;i<p.length;i++){ pos.push(p[i]); nor.push(n[i]); } } const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); return geo; }
const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e3=new THREE.Euler(), vs=new THREE.Vector3(), vp=new THREE.Vector3(), v3=new THREE.Vector3();
function instanced(geo,material,items,shadow){ const im=new THREE.InstancedMesh(geo,material,Math.max(1,items.length)); items.forEach((it,i)=>{ e3.set(it.rx||0,it.ry||0,it.rz||0); q.setFromEuler(e3); vp.set(it.x,it.y||0,it.z); vs.set(it.sx||it.s||1,it.sy||it.s||1,it.sz||it.s||1); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); if(it.c!==undefined) im.setColorAt(i,new THREE.Color(it.c)); }); im.count=items.length; im.castShadow=shadow!==false; im.receiveShadow=true; scene.add(im); return im; }

// ---------- Dünya ----------
const WORLD=60;
const BASE={x0:-12,x1:12,z0:4,z1:20};
function applyBase(){ BASE.z1=20+8*Math.min(4,S.lv.expand); R.x0=BASE.x0-1.4; R.x1=BASE.x1+1.4; R.z0=BASE.z0-1.4; R.z1=BASE.z1+1.4; }
const R={x0:0,x1:0,z0:0,z1:0}; applyBase();
function inBase(x,z){ return x>BASE.x0-1.2&&x<BASE.x1+1.2&&z>BASE.z0-1.2&&z<BASE.z1+1.2; }
const GATE_POS=new THREE.Vector3(0,0,BASE.z0);
const DEPOT=new THREE.Vector3(-8,0,12); const STALL=new THREE.Vector3(BASE.x1-2.4,0,11); const TREASURY=new THREE.Vector3(BASE.x1-6.5,0,11);
const ROAD=[[-40,-38],[-30,-31],[-21,-21],[-13,-12],[-6,-6],[-2,-1.5],[0,1.4]];
function roadDist(x,z){ let best=1e9; for(let i=0;i<ROAD.length-1;i++){ const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1]; const dx=bx-ax,dz=bz-az; const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1); const d=Math.hypot(ax+dx*t-x,az+dz*t-z); if(d<best) best=d; } return best; }
function inBaseMax(x,z){ return x>BASE.x0-1.2&&x<BASE.x1+1.2&&z>BASE.z0-1.2&&z<52+1.2; }
function freeSpot(x,z,pad){ return !inBaseMax(x,z) && roadDist(x,z)>4.2+pad && !(Math.abs(x)<4&&z<BASE.z0&&z>-4) && !(x>BASE.x1&&Math.abs(z-11)<3.5+pad); }

let groundTex=null;
function paintGround(){
  const N=1024, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d');
  const W2=WORLD*2; const px=v=>(v+WORLD)/W2*N;
  x.fillStyle='#d7b989'; x.fillRect(0,0,N,N);
  for(let i=0;i<2200;i++){ const r=rand(6,40); x.fillStyle=`hsla(${rand(32,44)},${rand(38,52)}%,${rand(58,72)}%,${rand(.12,.35)})`; x.beginPath(); x.ellipse(rand(0,N),rand(0,N),r,r*rand(.5,1),rand(0,3),0,7); x.fill(); }
  for(let i=0;i<160;i++){ const r=rand(20,70); x.fillStyle=`hsla(${rand(95,115)},${rand(40,55)}%,${rand(48,60)}%,${rand(.35,.7)})`; x.beginPath(); x.ellipse(rand(0,N),rand(0,N),r,r*rand(.5,1),rand(0,3),0,7); x.fill(); }
  x.lineCap='round'; x.lineJoin='round';
  x.strokeStyle='#c9a26d'; x.lineWidth=px(6)-px(0); x.beginPath(); ROAD.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke();
  x.strokeStyle='#e3c898'; x.lineWidth=px(3.6)-px(0); x.beginPath(); ROAD.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke();
  // müşteri yolu (doğu)
  x.strokeStyle='#cfae7a'; x.lineWidth=px(3)-px(0); x.beginPath(); x.moveTo(px(BASE.x1+1),px(11)); x.lineTo(px(WORLD),px(11)); x.stroke();
  x.fillStyle='#63b85a'; x.fillRect(px(BASE.x0),px(BASE.z0),px(BASE.x1)-px(BASE.x0),px(BASE.z1)-px(BASE.z0));
  for(let i=0;i<260;i++){ x.fillStyle=`hsla(${rand(100,120)},${rand(40,55)}%,${rand(42,58)}%,${rand(.15,.35)})`; x.beginPath(); x.ellipse(rand(px(BASE.x0),px(BASE.x1)),rand(px(BASE.z0),px(BASE.z1)),rand(6,22),rand(4,14),rand(0,3),0,7); x.fill(); }
  if(!groundTex){ groundTex=new THREE.CanvasTexture(c); groundTex.encoding=THREE.sRGBEncoding; groundTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); const ground=new THREE.Mesh(new THREE.PlaneGeometry(W2,W2),new THREE.MeshLambertMaterial({map:groundTex})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground); }
  else { groundTex.image=c; groundTex.needsUpdate=true; }
}
paintGround();
(function(){
  const rocks=[]; for(let i=0;i<90;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(inBaseMax(x,z)||roadDist(x,z)<3.5) continue; rocks.push({x,y:0.1,z,ry:rand(0,6),sx:rand(.4,1.4),sy:rand(.3,.8),sz:rand(.4,1.4),c:Math.random()<.5?0xc9c2b4:0xa8a196}); }
  instanced(G.dod,mat(0xffffff),rocks);
  const bushGeo=mergeGeos([new THREE.SphereGeometry(0.6,8,6).translate(0,0.4,0),new THREE.SphereGeometry(0.45,8,6).translate(0.45,0.35,0.2),new THREE.SphereGeometry(0.42,8,6).translate(-0.4,0.3,-0.15)]);
  const bushes=[]; for(let i=0;i<120;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(!freeSpot(x,z,0.5)) continue; bushes.push({x,y:0,z,ry:rand(0,6),s:rand(.7,1.3),c:Math.random()<.5?0x5fae5a:0x7cb75a}); }
  instanced(bushGeo,mat(0xffffff),bushes);
  const grass=[]; for(let i=0;i<400;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(!freeSpot(x,z,0)) continue; grass.push({x,y:0.18,z,ry:rand(0,6),rz:rand(-.25,.25),s:rand(.6,1.3),c:Math.random()<.5?0x9fd07a:0x86bf64}); }
  instanced(new THREE.ConeGeometry(0.22,0.5,4),mat(0xffffff),grass,false);
  const hills=[]; for(let i=0;i<28;i++){ const a=i/28*6.283; const r=rand(66,84); hills.push({x:Math.cos(a)*r,y:-1,z:Math.sin(a)*r,sx:rand(9,16),sy:rand(5,11),sz:rand(9,16),c:Math.random()<.5?0xc9b48e:0xb7a17a}); }
  instanced(G.sph,mat(0xffffff),hills,false);
})();

// ---------- Üs: sur, kapı, depo ----------
let wallGroup=null;
let wallPop=1;
function buildWalls(level){
  if(wallGroup) scene.remove(wallGroup); wallGroup=new THREE.Group(); scene.add(wallGroup); wallPop=0;
  const add=(im)=>{ scene.remove(im); wallGroup.add(im); return im; };
  const segs=[[BASE.x0,BASE.z1,BASE.x1,BASE.z1],[BASE.x0,BASE.z0,BASE.x0,BASE.z1],[BASE.x1,BASE.z0,BASE.x1,8.8],[BASE.x1,13.2,BASE.x1,BASE.z1],[BASE.x0,BASE.z0,-2.6,BASE.z0],[2.6,BASE.z0,BASE.x1,BASE.z0]];
  if(level<=1){
    const h0=level===0?1.6:2.5; const logs=[]; for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),n=Math.round(len/0.5); for(let i=0;i<=n;i++){ const h=h0+rand(-0.15,0.2); logs.push({x:x0+dx*i/n,y:h/2,z:z0+dz*i/n,sx:.27,sy:h,sz:.27,c:Math.random()<.5?0x9a6a3a:0x86582c}); } }
    const tips=logs.map(l=>({x:l.x,y:l.sy+0.18,z:l.z,sx:.27,sy:.36,sz:.27,c:l.c}));
    add(instanced(G.cyl,mat(0xffffff),logs)); add(instanced(G.cone,mat(0xffffff),tips));
    if(level===1){ const rails=[]; for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz); rails.push({x:(x0+x1)/2,y:1.5,z:(z0+z1)/2,ry:-Math.atan2(dz,dx),sx:len,sy:.14,sz:.36,c:0x7d5124}); } add(instanced(G.box,mat(0xffffff),rails)); }
  } else {
    const blocks=[], crens=[]; const H=level===2?2.6:3.2;
    for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz); const ry=-Math.atan2(dz,dx); blocks.push({x:(x0+x1)/2,y:H/2,z:(z0+z1)/2,ry,sx:len+0.6,sy:H,sz:0.9,c:0xa8a49c}); const n=Math.round(len/1.2); for(let i=0;i<=n;i++){ crens.push({x:x0+dx*i/n,y:H+0.3,z:z0+dz*i/n,ry,sx:.6,sy:.6,sz:1.0,c:0x9c9890}); }
      const m=Math.max(1,Math.round(len)); for(let i=0;i<m;i++){ blocks.push({x:x0+dx*(i+0.5)/m,y:rand(0.4,H-0.4),z:z0+dz*(i+0.5)/m,ry,sx:rand(.5,1.1),sy:.35,sz:0.94,c:Math.random()<.5?0x8f8b83:0xb4b0a8}); } }
    add(instanced(G.box,mat(0xffffff),blocks)); add(instanced(G.box,mat(0xffffff),crens));
    if(level>=3){ for(const [x,z] of [[BASE.x0,BASE.z0],[BASE.x1,BASE.z0],[BASE.x0,BASE.z1],[BASE.x1,BASE.z1]]){ const t=mesh(G.cyl,M.stone,1.0,5,1.0); t.position.set(x,2.5,z); const cap=mesh(G.cone,M.banner,1.3,1.4,1.3); cap.position.set(x,5.6,z); const fl=mesh(G.box,M.flag,0.7,0.5,0.05); fl.position.set(x+0.35,6.4,z); const pole=mesh(G.cyl,M.handle,0.05,1.4,0.05); pole.position.set(x,6.5,z); wallGroup.add(t,cap,fl,pole); } }
  }
  for(const [x,z] of [[-3.6,BASE.z0-0.4],[3.6,BASE.z0-0.4]]){ const p=mesh(G.cyl,M.woodDark,0.08,1.6,0.08); p.position.set(x,0.8,z); const f=mesh(G.sph,M.gold,0.18,0.26,0.18,false); f.position.set(x,1.75,z); wallGroup.add(p,f); }
}
buildWalls(S.lv.wall);
for(const [x,z] of [[-3.6,BASE.z0-0.4],[3.6,BASE.z0-0.4]]){ const l=new THREE.PointLight(0xffb15a,0.6,8); l.position.set(x,2,z); scene.add(l); }
const gate=new THREE.Group(); const gateLeaves={L:null,R:null}; let gateOpen=0;
(function(){
  function post(x){ const t=new THREE.Group(); const b=mesh(G.cyl,M.woodDark,0.42,3.4,0.42); b.position.y=1.7; const cap=mesh(G.cone,M.woodDark,0.42,0.5,0.42); cap.position.y=3.6; t.add(b,cap); t.position.x=x; return t; }
  const top=mesh(G.box,M.woodDark,5.4,0.35,0.5); top.position.y=3.2;
  function leaf(sign){ const h=new THREE.Group(); h.position.set(sign*-2.3,0,0); for(let i=0;i<5;i++){ const d=mesh(G.cyl,M.gate,0.2,2.4,0.2); d.position.set(sign*(0.25+i*0.45),1.2,0); const c=mesh(G.cone,M.gate,0.2,0.3,0.2); c.position.set(sign*(0.25+i*0.45),2.55,0); h.add(d,c);} const b1=mesh(G.box,M.woodDark,2.2,0.16,0.28); b1.position.set(sign*1.15,0.8,0.1); const b2=b1.clone(); b2.position.y=1.9; h.add(b1,b2); return h; }
  gateLeaves.L=leaf(1); gateLeaves.R=leaf(-1);
  gate.add(post(-2.6),post(2.6),top,gateLeaves.L,gateLeaves.R); gate.position.copy(GATE_POS); scene.add(gate);
})();
const depot=new THREE.Group(); const pileLogs=[];
(function(){
  const deck=mesh(G.box,M.plank,5.2,0.3,3.6); deck.position.y=0.15;
  for(let i=0;i<6;i++){ const line=mesh(G.box,M.woodDark,5.2,0.31,0.04,false); line.position.set(0,0.15,-1.5+i*0.6); depot.add(line); }
  for(const x of [-2.4,2.4]){ const p=mesh(G.cyl,M.woodDark,0.13,3.2,0.13); p.position.set(x,1.6,-1.75); depot.add(p); }
  const backWall=mesh(G.box,M.plank,5.2,1.1,0.16); backWall.position.set(0,0.85,-1.7); const rail=mesh(G.box,M.woodDark,5.3,0.14,0.2); rail.position.set(0,1.45,-1.7);
  const sign=mesh(G.box,M.plank,2.6,0.8,0.1); sign.position.set(0,2.8,-1.75); const signLog=mesh(G.log,M.log,0.8,0.8,0.8,false); signLog.rotation.z=Math.PI/2; signLog.position.set(-0.55,2.8,-1.68); const signLog2=mesh(G.log,M.log,0.8,0.8,0.8,false); signLog2.rotation.z=Math.PI/2; signLog2.position.set(0.5,2.8,-1.68); const signBar=mesh(G.box,M.woodDark,2.7,0.12,0.14); signBar.position.set(0,3.25,-1.75);
  depot.add(deck,backWall,rail,sign,signLog,signLog2,signBar);
  depot.position.copy(DEPOT); scene.add(depot);
})();
function setPile(n){ n=Math.min(n,24); while(pileLogs.length<n){ const i=pileLogs.length; const row=Math.floor(i/6), col=i%6; const l=mesh(G.log,M.log,1.1,1.1,1.1); l.rotation.z=Math.PI/2; l.position.set(-1.9+col*0.46+(row%2)*0.23,0.5+row*0.4,-0.6); depot.add(l); pileLogs.push(l);} while(pileLogs.length>n){ depot.remove(pileLogs.pop()); } }

// ---------- Ağaçlar ----------
const trees=[]; let treeTrunk, treeCrown; const TRUNK_H=1.7;
(function(){
  let tries=0;
  while(trees.length<1100&&tries<200000){ tries++;
    const x=rand(-WORLD+2,WORLD-2), z=rand(-WORLD+2,WORLD-2);
    if(!freeSpot(x,z,1.5)) continue;
    const cx=clamp(x,BASE.x0,BASE.x1), cz=clamp(z,BASE.z0,52); if(Math.hypot(x-cx,z-cz)<5.5) continue; // üs çevresi açık kalsın
    const grove=Math.hypot(x-26,z-16)<19||Math.hypot(x+27,z-22)<17||Math.hypot(x-16,z-42)<14||Math.hypot(x+22,z+18)<12; // sık korular
    if(!grove&&Math.random()<0.7) continue;
    if(trees.some(t=>Math.hypot(t.x-x,t.z-z)<(grove?1.8:3.2))) continue;
    trees.push({x,z,s:rand(0.85,1.3),ry:rand(0,6.28),ci:Math.floor(Math.random()*3),hp:D.treeHits(),alive:true,shake:0,falling:0,regrow:0,claimed:null,dirty:true});
  }
  const trunkGeo=new THREE.CylinderGeometry(0.24,0.34,TRUNK_H,9).translate(0,TRUNK_H/2,0);
  const crownGeo=mergeGeos([new THREE.ConeGeometry(1.35,2.4,8).translate(0,2.3,0),new THREE.ConeGeometry(1.05,2.1,8).translate(0,3.5,0),new THREE.ConeGeometry(0.7,1.8,8).translate(0,4.6,0)]);
  treeTrunk=new THREE.InstancedMesh(trunkGeo,M.trunk,trees.length); treeCrown=new THREE.InstancedMesh(crownGeo,M.leaf,trees.length);
  treeTrunk.castShadow=treeCrown.castShadow=true; treeTrunk.receiveShadow=treeCrown.receiveShadow=true;
  const leafCols=[new THREE.Color(0x2f7d47),new THREE.Color(0x3a8c4e),new THREE.Color(0x256b3c)];
  trees.forEach((t,i)=>{ treeCrown.setColorAt(i,leafCols[t.ci]); });
  treeTrunk.instanceMatrix.setUsage(THREE.DynamicDrawUsage); treeCrown.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(treeTrunk,treeCrown);
})();
function writeTree(i){ const t=trees[i]; let fall=0, sc=1, trunkY=1, crownVis=1, shakeZ=0;
  if(t.falling>0){ const k=Math.min(1,t.falling/0.55); fall=k*k*1.5; }
  if(!t.alive&&t.falling===0){ trunkY=0.22; crownVis=0; }
  if(t.regrow>0){ const T=12; if(t.regrow>T){ const k=Math.min(1,(t.regrow-T)/1.0); sc=0.05+0.95*(1-Math.pow(1-k,3)); trunkY=sc; crownVis=sc; } }
  if(t.shake>0) shakeZ=Math.sin(t.shake*45)*0.09;
  vp.set(t.x,0,t.z); e3.set(fall,t.ry,0,'YXZ'); q.setFromEuler(e3); vs.set(t.s*sc,t.s*trunkY,t.s*sc); m4.compose(vp,q,vs); treeTrunk.setMatrixAt(i,m4);
  e3.set(fall,t.ry,shakeZ,'YXZ'); q.setFromEuler(e3); const cs=t.s*crownVis; vs.set(cs,cs,cs); if(crownVis===0) vs.set(0.0001,0.0001,0.0001); m4.compose(vp,q,vs); treeCrown.setMatrixAt(i,m4);
}
trees.forEach((t,i)=>writeTree(i)); treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true;
function updateTrees(dt){ let any=false; trees.forEach((t,i)=>{ let d=false;
  if(t.shake>0){ t.shake-=dt; d=true; }
  if(t.falling>0){ t.falling+=dt; d=true; if(t.falling>0.9){ t.falling=0; t.regrow=0.001; t.claimed=null; } }
  if(t.regrow>0){ t.regrow+=dt; if(t.regrow>12) d=true; if(t.regrow>13){ t.regrow=0; t.alive=true; t.hp=D.treeHits(); d=true; } }
  if(d||t.dirty){ t.dirty=false; writeTree(i); any=true; } });
  if(any){ treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true; } }
function nearestTree(pos,range,forWorker){ let best=null,bd=range; for(const t of trees){ if(!t.alive||t.falling>0) continue; if(forWorker&&t.claimed&&t.claimed!==forWorker) continue; if(forWorker&&t.z>BASE.z1-2&&Math.abs(t.x)<BASE.x1+8) continue; const d=Math.hypot(t.x-pos.x,t.z-pos.z); if(d<bd){bd=d;best=t;} } return best; }
function hitTree(t,byGuy,onLog){ t.hp-=1; t.shake=0.3; t.dirty=true; SFX.chop(); burst(new THREE.Vector3(t.x,1.2*t.s,t.z),6,M.logEnd,1); burst(new THREE.Vector3(t.x,2.4*t.s,t.z),5,M.bush,0.5);
  if(t.hp<=0){ t.alive=false; t.falling=0.001; S.treesCut=(S.treesCut||0)+1; SFX.fall(); const n=D.logsPerTree(); for(let i=0;i<n;i++){ setTimeout(()=>{ fly(new THREE.Vector3(t.x+rand(-.6,.6),1.0,t.z+rand(-.6,.6)),byGuy.g,onLog,true,4); }, 300+i*70); } } }
function pushOutOfTrunks(p,r){ for(const t of trees){ if(!t.alive&&t.falling===0&&t.regrow<12) continue; const dx=p.x-t.x, dz=p.z-t.z, d=Math.hypot(dx,dz); if(d<r&&d>0.001){ p.x=t.x+dx/d*r; p.z=t.z+dz/d*r; } } }

// ---------- Karakterler (chibi) ----------
const helmGeo=mergeGeos([new THREE.SphereGeometry(0.45,10,8).scale(1,0.55,1).translate(0,0.2,0),new THREE.BoxGeometry(0.7,0.12,0.24).translate(0,0.12,0.35)]);
const LOG_MAX=160; const logSlots=[]; for(let i=0;i<LOG_MAX;i++){ const row=Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.1+row*0.3,-0.05-(row%2)*0.06); e3.set(0,rand(-.08,.08),Math.PI/2); q.setFromEuler(e3); vs.set(1,1,1); logSlots.push(new THREE.Matrix4().compose(vp,q,vs)); }
const COIN_STACK=40; const coinSlots=[]; for(let i=0;i<COIN_STACK;i++){ vp.set(rand(-.03,.03),0.08+i*0.15,rand(-.03,.03)); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.75,0.75,0.75); coinSlots.push(new THREE.Matrix4().compose(vp,q,vs)); }
function makeGuy(kind){
  const g=new THREE.Group(); const root=new THREE.Group(); g.add(root);
  const shirt= kind==='player'?M.shirt: kind==='worker'?M.workerShirt: kind==='soldier'?M.soldierShirt: M.enemy;
  const torso=mesh(G.box,shirt,0.62,0.6,0.42); torso.position.y=0.72;
  const belt=mesh(G.box,M.belt,0.64,0.1,0.44); belt.position.y=0.44;
  const head=mesh(G.sph,M.skin,0.55,0.52,0.55); head.position.y=1.5;
  const e1=mesh(G.sph,M.pupil,0.07,0.1,0.05,false); e1.position.set(-0.18,1.52,0.5); const e2=e1.clone(); e2.position.x=0.18;
  const hair=mesh(G.sph,M.hair,0.57,0.36,0.57); hair.position.set(0,1.62,-0.06);
  root.add(torso,belt,head,e1,e2,hair);
  if(kind==='player'){ const c=mesh(G.cyl,M.crown,0.36,0.22,0.36); c.position.y=2.05; root.add(c); for(let i=0;i<5;i++){ const a=i/5*6.283; const sp=mesh(G.cone,M.crown,0.09,0.2,0.09); sp.position.set(Math.cos(a)*0.32,2.24,Math.sin(a)*0.32); root.add(sp);} const cape=mesh(G.box,M.banner,0.6,0.9,0.06); cape.position.set(0,0.75,-0.26); root.add(cape); }
  if(kind==='worker'){ const cap=mesh(G.sph,M.workerHat,0.5,0.32,0.5); cap.position.set(0,1.78,0); root.add(cap); }
  if(kind==='soldier'){ const hm=mesh(G.sph,M.soldierHelm,0.6,0.42,0.6); hm.position.set(0,1.68,0); const rim=mesh(G.cyl,M.soldierHelm,0.64,0.1,0.64); rim.position.y=1.6; const plume=mesh(G.box,M.flag,0.1,0.35,0.5); plume.position.y=2.02; root.add(hm,rim,plume); }
  if(kind==='enemy'){ const hm=mesh(G.sph,M.enemyHelm,0.62,0.44,0.62); hm.position.set(0,1.66,0); const visor=mesh(G.box,M.enemyDark,0.9,0.16,0.3,false); visor.position.set(0,1.5,0.42); const plume=mesh(G.box,M.enemyDark,0.1,0.4,0.55); plume.position.y=2.02; root.add(hm,visor,plume); }
  function leg(x){ const h=new THREE.Group(); h.position.set(x,0.42,0); const th=mesh(G.box,M.pants,0.26,0.3,0.28); th.position.y=-0.16; const ft=mesh(G.box,M.boot,0.28,0.14,0.36); ft.position.set(0,-0.36,0.04); h.add(th,ft); return h; }
  function arm(x){ const h=new THREE.Group(); h.position.set(x,0.98,0); const ua=mesh(G.box,shirt,0.2,0.26,0.22); ua.position.y=-0.12; const hd=mesh(G.sph,M.skin,0.13,0.13,0.13); hd.position.y=-0.34; h.add(ua,hd); return h; }
  const legL=leg(-0.17), legR=leg(0.17), armL=arm(-0.44), armR=arm(0.44);
  root.add(legL,legR,armL,armR);
  const tool=new THREE.Group(); tool.position.set(0,-0.34,0.05);
  if(kind==='player'||kind==='soldier'||kind==='enemy'){ const bl=mesh(G.box,kind==='enemy'?M.metal:M.blade,0.1,0.06,1.1); bl.position.z=0.7; const guard=mesh(G.box,M.gold,0.34,0.08,0.08); guard.position.z=0.18; const grip=mesh(G.cyl,M.handle,0.05,0.3,0.05); grip.rotation.x=Math.PI/2; grip.position.z=0.02; tool.add(bl,guard,grip); if(kind==='enemy'){ const sh=mesh(G.cyl,M.enemyDark,0.36,0.06,0.36); sh.rotation.z=Math.PI/2; sh.position.set(-0.1,0,0.1); armL.add(sh);} }
  else { const handle=mesh(G.cyl,M.handle,0.06,1.0,0.06); handle.rotation.x=Math.PI/2; handle.position.z=0.35; const head2=mesh(G.box,M.metal,0.12,0.44,0.28); head2.position.set(0,0.14,0.75); const head3=mesh(G.box,M.handle,0.15,0.18,0.16); head3.position.set(0,0,0.75); tool.add(handle,head2,head3); }
  armR.add(tool);
  const back=new THREE.Group(); back.position.set(0,0.5,-0.4); root.add(back);
  const logMesh=new THREE.InstancedMesh(G.log,M.log,LOG_MAX); logSlots.forEach((m,i)=>logMesh.setMatrixAt(i,m)); logMesh.count=0; logMesh.castShadow=true; logMesh.frustumCulled=false; back.add(logMesh);
  const lootMesh=new THREE.InstancedMesh(helmGeo,M.enemy,LOG_MAX); lootMesh.count=0; lootMesh.castShadow=true; lootMesh.frustumCulled=false; back.add(lootMesh);
  let coinMesh=null; if(kind==='player'){ coinMesh=new THREE.InstancedMesh(G.coin,M.coin,COIN_STACK); coinSlots.forEach((m,i)=>coinMesh.setMatrixAt(i,m)); coinMesh.count=0; coinMesh.frustumCulled=false; coinMesh.position.y=2.3; root.add(coinMesh); }
  return {g,root,head,legL,legR,armL,armR,tool,back,logMesh,lootMesh,coinMesh,walkT:rand(0,6),swing:0,moving:false,aim:false};
}
function animGuy(guy,dt,moving,k){
  k=k||1; const r=guy.root;
  if(moving){ guy.walkT+=dt*13*k; const s1=Math.sin(guy.walkT); guy.legL.rotation.x=s1*0.9; guy.legR.rotation.x=-s1*0.9; guy.armL.rotation.x=-s1*0.8; if(guy.swing<=0&&!guy.aim) guy.armR.rotation.x=s1*0.8; r.position.y=Math.abs(Math.cos(guy.walkT))*0.1; r.rotation.x=0.12; r.rotation.z=Math.sin(guy.walkT)*0.05; guy.back.rotation.z=Math.sin(guy.walkT)*0.06; guy.back.rotation.x=-0.08; }
  else { const e=1-Math.pow(0.0005,dt); guy.legL.rotation.x*=1-e; guy.legR.rotation.x*=1-e; guy.armL.rotation.x*=1-e; if(guy.swing<=0&&!guy.aim) guy.armR.rotation.x*=1-e; r.position.y=lerp(r.position.y,Math.sin(performance.now()/500)*0.015,e); r.rotation.x*=1-e; r.rotation.z*=1-e; guy.back.rotation.z*=1-e; guy.back.rotation.x*=1-e; }
  if(guy.swing>0){ guy.swing-=dt; const t=1-guy.swing/0.3; guy.armR.rotation.x = t<0.35? lerp(0,-2.3,t/0.35) : lerp(-2.3,0.9,(t-0.35)/0.65); }
}
function setLogs(guy,n){ guy.logMesh.count=Math.min(LOG_MAX,n); }
function setBack(guy){ guy.logMesh.count=Math.min(LOG_MAX,S.logs); const base=Math.ceil(S.logs/2); const n=Math.min(LOG_MAX-base*2,S.loot); for(let i=0;i<n;i++){ const row=base+Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.12+row*0.3,-0.05); e3.set(0,side?0.3:-0.3,0); q.setFromEuler(e3); vs.set(0.55,0.55,0.55); m4.compose(vp,q,vs); guy.lootMesh.setMatrixAt(i,m4); } guy.lootMesh.count=Math.max(0,n); guy.lootMesh.instanceMatrix.needsUpdate=true; }
const player=makeGuy('player'); player.g.position.set(0,0,11); scene.add(player.g);
setBack(player);
const playerRing=new THREE.Mesh(new THREE.RingGeometry(0.6,0.8,24),new THREE.MeshBasicMaterial({color:0x9dffb0,transparent:true,opacity:0.7,depthWrite:false})); playerRing.rotation.x=-Math.PI/2; playerRing.position.y=0.04; scene.add(playerRing);
// Dönen balta halkası (odun kesme)
const orbit=(function(){ const g=new THREE.Group(); scene.add(g); return {g,spin:0,on:0,n:0}; })();
function rebuildOrbit(){ const n=Math.min(8,3+Math.floor(S.lv.axe/2)); if(orbit.n===n) return; orbit.n=n; while(orbit.g.children.length) orbit.g.remove(orbit.g.children[0]); for(let i=0;i<n;i++){ const a=i/n*6.283; const ax=new THREE.Group(); ax.position.set(Math.cos(a)*1.9,0,Math.sin(a)*1.9); ax.rotation.y=-a; const handle=mesh(G.cyl,M.handle,0.06,1.1,0.06); handle.rotation.z=Math.PI/2; const head=mesh(G.box,M.blade,0.2,0.62,0.42); head.position.set(0.55,0.0,0); const head2=mesh(G.box,M.handle,0.2,0.2,0.2); head2.position.set(0.45,0,0); ax.add(handle,head,head2); orbit.g.add(ax);} }
rebuildOrbit();
const slash=new THREE.Mesh(new THREE.RingGeometry(1.4,2.9,24,1,-0.9,1.8),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})); slash.rotation.x=-Math.PI/2; slash.position.y=0.9; scene.add(slash); let slashT=0;

// ---------- Yönlendirme ----------
const guide=(function(){
  const shp=new THREE.Shape(); shp.moveTo(0,0.9); shp.lineTo(0.7,-0.1); shp.lineTo(0.28,-0.1); shp.lineTo(0.28,-0.9); shp.lineTo(-0.28,-0.9); shp.lineTo(-0.28,-0.1); shp.lineTo(-0.7,-0.1); shp.closePath();
  const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shp),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:0.97,depthWrite:false})); arrow.rotation.x=-Math.PI/2; arrow.position.y=0.07; arrow.renderOrder=2;
  const outline=new THREE.Mesh(new THREE.ShapeGeometry(shp),new THREE.MeshBasicMaterial({color:0x2b3a2e,transparent:true,opacity:0.9,depthWrite:false})); outline.scale.set(1.25,1.18,1); outline.position.z=-0.005; arrow.add(outline);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.9,1.2,32),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:0.85,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=0.05;
  const pin=mesh(G.cone,M.arrow,0.35,0.7,0.35,false); pin.rotation.x=Math.PI;
  scene.add(arrow,ring,pin);
  const el=document.createElement('div'); el.className='guide'; document.body.appendChild(el);
  return {arrow,ring,pin,el};
})();

// ---------- Kontroller (kameraya göre) ----------
const keys={};
addEventListener('keydown',e=>{ keys[e.key.toLowerCase()]=true; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); });
addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });
const joy={active:false,id:null,ox:0,oy:0,dx:0,dy:0};
const joyEl=$('joy');
canvas.addEventListener('pointerdown',e=>{ audio(); if(joy.active) return; joy.active=true; joy.id=e.pointerId; joy.ox=e.clientX; joy.oy=e.clientY; joy.dx=joy.dy=0; joyEl.style.display='block'; joyEl.style.left=e.clientX+'px'; joyEl.style.top=e.clientY+'px'; joyEl.firstElementChild.style.transform='translate(-50%,-50%)'; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove',e=>{ if(!joy.active||e.pointerId!==joy.id) return; let dx=e.clientX-joy.ox, dy=e.clientY-joy.oy; const len=Math.hypot(dx,dy), R=42; if(len>R){ joy.ox=e.clientX-dx*R/len; joy.oy=e.clientY-dy*R/len; joyEl.style.left=joy.ox+'px'; joyEl.style.top=joy.oy+'px'; dx*=R/len; dy*=R/len; } joy.dx=dx/R; joy.dy=dy/R; joyEl.firstElementChild.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`; });
const joyEnd=e=>{ if(!joy.active||e.pointerId!==joy.id) return; joy.active=false; joy.dx=joy.dy=0; joyEl.style.display='none'; };
canvas.addEventListener('pointerup',joyEnd); canvas.addEventListener('pointercancel',joyEnd);
function inputVec(){ let sx=0,sy=0; if(keys['w']||keys['arrowup']) sy-=1; if(keys['s']||keys['arrowdown']) sy+=1; if(keys['a']||keys['arrowleft']) sx-=1; if(keys['d']||keys['arrowright']) sx+=1; if(joy.active){ sx+=joy.dx; sy+=joy.dy; } let l=Math.hypot(sx,sy); if(l>1){sx/=l;sy/=l;l=1;} const cy=Math.cos(YAW), sn=Math.sin(YAW); const x=sx*cy+sy*sn, z=-sx*sn+sy*cy; return {x,z,l}; }

// ---------- Yazılar / etiketler ----------
const floats=[];
function floatText(pos,txt,cls){ const el=document.createElement('div'); el.className='float '+(cls||''); el.textContent=txt; document.body.appendChild(el); floats.push({el,p:pos.clone(),t:0}); }
function updateFloats(dt){ for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.t+=dt; if(f.t>1.1){ f.el.remove(); floats.splice(i,1); continue;} v3.copy(f.p); v3.y+=2.4+f.t*1.6; v3.project(camera); f.el.style.left=((v3.x+1)/2*innerWidth)+'px'; f.el.style.top=((1-v3.y)/2*innerHeight)+'px'; f.el.style.opacity=String(1-Math.max(0,f.t-0.6)/0.5); } }
const labels=[];
function addLabel(pos,text,h){ const el=document.createElement('div'); el.className='wl'; el.innerHTML=text; document.body.appendChild(el); const L={el,pos:pos.clone(),h:h||3.2,hide:false,near:6}; labels.push(L); return L; }
addLabel(DEPOT,'Kereste Deposu<small>odun stoğu</small>',3.9); addLabel(STALL,'Ganimet Tezgâhı<small>miğfer → altın</small>',3.6);
function updateLabels(){ const pp=player.g.position; for(const L of labels){ v3.set(L.pos.x,L.h,L.pos.z).project(camera); const on=!L.hide&&L.pos.distanceTo(pp)>L.near&&v3.z<1&&Math.abs(v3.x)<1.2&&Math.abs(v3.y)<1.2; L.el.style.display=on?'block':'none'; if(on){ L.el.style.left=((v3.x+1)/2*innerWidth)+'px'; L.el.style.top=((1-v3.y)/2*innerHeight)+'px'; } } }

// ---------- Uçan nesneler / parçacıklar ----------
const fliers=[];
function fly(from,toObj,onDone,logLike,speed){ const m=logLike?mesh(G.log,M.log,1,1,1,false):mesh(G.cyl,M.coin,0.3,0.1,0.3,false); if(logLike) m.rotation.z=Math.PI/2; else m.rotation.x=Math.PI/2; m.position.copy(from); scene.add(m); fliers.push({m,toObj,t:0,from:from.clone(),onDone,spin:rand(4,9),speed:speed||3.4,logLike}); }
function updateFliers(dt){ for(let i=fliers.length-1;i>=0;i--){ const f=fliers[i]; f.t+=dt*f.speed; const to=f.toObj.position?f.toObj.position:f.toObj; const t=Math.min(1,f.t); f.m.position.lerpVectors(f.from,to,t); f.m.position.y+=Math.sin(t*Math.PI)*2.4+0.9*(1-t); if(f.logLike) f.m.rotation.x+=f.spin*dt; else f.m.rotation.z+=f.spin*dt; if(t>=1){ scene.remove(f.m); fliers.splice(i,1); f.onDone&&f.onDone(); } } }
const chips=[]; const chipGeo=new THREE.BoxGeometry(0.14,0.09,0.14);
function burst(pos,n,matl,up){ for(let i=0;i<n;i++){ const m=new THREE.Mesh(chipGeo,matl); m.position.copy(pos); m.castShadow=false; scene.add(m); chips.push({m,v:new THREE.Vector3(rand(-2.5,2.5),rand(2,5.5)*(up||1),rand(-2.5,2.5)),t:0}); } }
function updateChips(dt){ for(let i=chips.length-1;i>=0;i--){ const c=chips[i]; c.t+=dt; c.v.y-=14*dt; c.m.position.addScaledVector(c.v,dt); c.m.rotation.x+=5*dt; c.m.rotation.z+=4*dt; if(c.m.position.y<0){ c.m.position.y=0; c.v.set(0,0,0);} if(c.t>0.9){ scene.remove(c.m); chips.splice(i,1);} } }
// Yerdeki ganimet (düşen miğferler) — oyuncu toplar, tezgâhta satar
const LOOT_MAX=200; const lootMesh=new THREE.InstancedMesh(helmGeo,M.enemy,LOOT_MAX); lootMesh.count=0; lootMesh.castShadow=true; lootMesh.frustumCulled=false; lootMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(lootMesh); const loot=[];
function dropLoot(x,z){ if(loot.length>=LOOT_MAX) loot.shift(); loot.push({x:x+rand(-.6,.6),y:1,z:z+rand(-.6,.6),vy:rand(3,6),ry:rand(0,6),t:0,fly:false}); }
function updateLoot(dt){ const p=player.g.position; const R=D.magnet(); let got=0;
  for(let i=loot.length-1;i>=0;i--){ const l=loot[i]; l.t+=dt;
    if(!l.fly){ if(l.y>0.02||l.vy>0){ l.vy-=20*dt; l.y=Math.max(0.02,l.y+l.vy*dt); if(l.y<=0.02) l.vy=0; } const d=Math.hypot(l.x-p.x,l.z-p.z); if(l.t>0.4&&d<R&&S.loot<D.cap()){ l.fly=true; l.t=0; } }
    else { l.t+=dt; const dx=p.x-l.x, dy=1.2-l.y, dz=p.z-l.z, d=Math.hypot(dx,dy,dz); const sp=(7+l.t*40)*dt; if(d<Math.max(0.5,sp)){ loot.splice(i,1); if(S.loot<D.cap()){ S.loot++; setBack(player); got++; } continue; } l.x+=dx/d*sp; l.y+=dy/d*sp; l.z+=dz/d*sp; } }
  if(got>0) SFX.sell();
  loot.forEach((l,i)=>{ vp.set(l.x,l.y,l.z); e3.set(l.fly?l.t*10:0,l.ry,0); q.setFromEuler(e3); vs.set(1,1,1); m4.compose(vp,q,vs); lootMesh.setMatrixAt(i,m4); }); lootMesh.count=loot.length; lootMesh.instanceMatrix.needsUpdate=true; }
// ---------- Yerdeki altınlar ----------
const COIN_MAX=900;
const coinMesh=new THREE.InstancedMesh(G.coin,M.coin,COIN_MAX); coinMesh.castShadow=false; coinMesh.count=0; coinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); coinMesh.frustumCulled=false; scene.add(coinMesh);
const coins=[]; const stackH=new Map(); let coinSfxT=0, celebT=0, celebSpawn=0;
const cellKey=(x,z)=>((Math.round(x/0.9))+','+(Math.round(z/0.9)));
function dropCoins(pos,n,value,spread,up){ for(let i=0;i<n;i++){ if(coins.length>=COIN_MAX){ const c=coins.shift(); S.coins+=c.value; if(c.key) stackH.set(c.key,Math.max(0,(stackH.get(c.key)||1)-1)); } const a=rand(0,6.28), sp=rand(0.3,1)*(spread||3); coins.push({x:pos.x,y:(pos.y||1),z:pos.z,vx:Math.cos(a)*sp,vy:rand(5,9)*(up||1),vz:Math.sin(a)*sp,fly:false,rest:false,t:0,rot:rand(0,6),value,key:null,ry:0.07}); } }
function updateCoins(dt){
  const p=player.g.position; const R=celebT>0?9:D.magnet(); coinSfxT-=dt; let got=0;
  for(let i=coins.length-1;i>=0;i--){ const c=coins[i];
    if(!c.fly){ c.t+=dt;
      if(!c.rest){ c.vy-=22*dt; c.x+=c.vx*dt; c.y+=c.vy*dt; c.z+=c.vz*dt; if(c.y<0.07){ c.y=0.07; c.vy=-c.vy*0.4; c.vx*=0.6; c.vz*=0.6; if(Math.abs(c.vy)<0.8){ c.rest=true; c.key=cellKey(c.x,c.z); const h=(stackH.get(c.key)||0); stackH.set(c.key,h+1); c.ry=0.07+h*0.15; c.x=Math.round(c.x/0.9)*0.9+rand(-.12,.12); c.z=Math.round(c.z/0.9)*0.9+rand(-.12,.12); } } }
      else { c.y=lerp(c.y,c.ry,Math.min(1,dt*10)); }
      const d=Math.hypot(c.x-p.x,c.z-p.z); if(c.t>0.3&&d<R){ c.fly=true; c.t=0; if(c.key){ stackH.set(c.key,Math.max(0,(stackH.get(c.key)||1)-1)); } } }
    else { c.t+=dt; const dx=p.x-c.x, dy=1.0-c.y, dz=p.z-c.z, d=Math.hypot(dx,dy,dz); const sp=(7+c.t*40)*dt; if(d<Math.max(0.5,sp)){ coins.splice(i,1); S.coins+=c.value; got++; continue; } c.x+=dx/d*sp; c.y+=dy/d*sp; c.z+=dz/d*sp; }
  }
  if(got>0){ coinPop(); if(coinSfxT<=0){ coinSfxT=0.06; SFX.coin(); } }
  coins.forEach((c,i)=>{ vp.set(c.x,c.y,c.z); if(c.fly){ e3.set(c.t*12,c.rot+c.t*8,0); } else { e3.set(0,c.rot,c.rest?0:c.t*6); } q.setFromEuler(e3); vs.set(1,1,1); m4.compose(vp,q,vs); coinMesh.setMatrixAt(i,m4); });
  coinMesh.count=coins.length; coinMesh.instanceMatrix.needsUpdate=true;
}
let sellGain=0, sellFlushT=0, pileCount=0;
function storeLog(fromPos){ fly(fromPos.clone().setY(1),DEPOT.clone().add(new THREE.Vector3(-0.6,0.9,-0.4)),()=>{ S.wood++; setPile(Math.min(24,S.wood)); SFX.sell(); },true,4); }
setPile(Math.min(24,S.wood));
function coinPop(){ const el=$('coinChip'); el.style.transform='scale(1.18)'; setTimeout(()=>el.style.transform='',110); }

// ---------- Ganimet tezgâhı ve müşteriler ----------
const stall=new THREE.Group(); const stallPile=new THREE.InstancedMesh(helmGeo,M.enemy,30); stallPile.count=0; stallPile.castShadow=true;
(function(){ const counter=mesh(G.box,M.plank,1.2,1.0,4.2); counter.position.set(0.6,0.5,0); const top=mesh(G.box,M.woodDark,1.4,0.12,4.4); top.position.set(0.6,1.05,0); for(const z of [-1.9,1.9]){ const p=mesh(G.cyl,M.woodDark,0.1,3.2,0.1); p.position.set(0.6,1.6,z); stall.add(p);} const awn=mesh(G.box,M.banner,2.4,0.1,4.6); awn.position.set(1.0,3.1,0); awn.rotation.z=0.25; const awn2=mesh(G.box,M.flag,2.4,0.1,0.5); awn2.position.set(1.0,3.1,0); awn2.rotation.z=0.25; stall.add(counter,top,awn,awn2);
  for(let i=0;i<30;i++){ const row=Math.floor(i/6), col=i%6; vp.set(0.6+(row%2)*0.2,1.15+row*0.35,-1.6+col*0.62); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.6,0.6,0.6); m4.compose(vp,q,vs); stallPile.setMatrixAt(i,m4);} stall.add(stallPile); stall.position.copy(STALL); scene.add(stall); })();
// Hazine: satış altınları burada birikir, yanına gelince sana akar
const treasury=new THREE.Group(); const bankPile=new THREE.InstancedMesh(G.coin,M.coin,90); bankPile.count=0; bankPile.castShadow=true;
(function(){ const base=mesh(G.box,M.plank,2.8,0.3,2.8); base.position.y=0.15; const rim=mesh(G.box,M.woodDark,3.0,0.12,3.0); rim.position.y=0.02; for(let i=0;i<90;i++){ const col=i%9, row=Math.floor(i/9); const cx=(col%3)-1, cz=Math.floor(col/3)-1; vp.set(cx*0.85,0.4+row*0.15,cz*0.85); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.9,0.9,0.9); m4.compose(vp,q,vs); bankPile.setMatrixAt(i,m4);} treasury.add(base,rim,bankPile); treasury.position.copy(TREASURY); scene.add(treasury); })();
const bankLabel=addLabel(TREASURY,'',2.6); bankLabel.near=-1; let withdrawT=0;
function bankIn(amount){ S.bank+=amount; }
function updateTreasury(dt){ const p=player.g.position; bankPile.count=Math.min(90,Math.ceil(S.bank/4)); bankLabel.el.innerHTML=`Hazine<small><b>${Math.floor(S.bank)}</b> altın</small>`;
  if(S.bank>0.5&&p.distanceTo(TREASURY)<2.6){ withdrawT-=dt; if(withdrawT<=0){ withdrawT=0.05; const amt=Math.min(S.bank,Math.max(3,S.bank/12)); S.bank-=amt; fly(TREASURY.clone().setY(0.9),player.g,()=>{ S.coins+=amt; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.08; SFX.coin(); } } } }
const customers=[]; const CUST_N=5; let stallT=0, custSpawnT=0;
function custSlot(i){ return [BASE.x1+2.2+i*1.35, 11]; }
function makeCustomer(){ const g=makeGuy('worker'); g.tool.visible=false; g.g.position.set(BASE.x1+2.2+CUST_N*1.35+6,0,11+rand(-.3,.3)); scene.add(g.g); customers.push({guy:g,state:'walk',t:0}); }
function updateCustomers(dt){
  custSpawnT-=dt; if(customers.filter(c=>c.state!=='leave').length<CUST_N&&custSpawnT<=0){ custSpawnT=0.8; makeCustomer(); }
  let qi=0;
  for(let i=customers.length-1;i>=0;i--){ const c=customers[i]; const p=c.guy.g.position;
    if(c.state==='leave'){ c.t+=dt; p.x+=6*dt; p.z+=Math.sin(c.t*3)*dt*0.5; c.guy.g.rotation.y=Math.PI/2; animGuy(c.guy,dt,true,0.9); if(p.x>BASE.x1+22){ scene.remove(c.guy.g); customers.splice(i,1); } continue; }
    const [sx,sz]=custSlot(qi); qi++; const dx=sx-p.x, dz=sz-p.z, d=Math.hypot(dx,dz);
    if(d>0.15){ p.x+=dx/d*Math.min(d,4.2*dt); p.z+=dz/d*Math.min(d,4.2*dt); c.guy.g.rotation.y=Math.atan2(dx,dz); animGuy(c.guy,dt,true,0.9); c.state='walk'; }
    else { c.state='queue'; c.guy.g.rotation.y=-Math.PI/2; animGuy(c.guy,dt,false,1); }
  }
  // satış: sıradaki ilk müşteri, tezgâhta mal varsa alır
  const first=customers.find(c=>c.state==='queue'); stallT-=dt;
  if(first&&S.stall>0&&stallT<=0){ stallT=D.buyTime(); S.stall--; stallPile.count=Math.min(30,S.stall); const price=D.lootPrice(); first.state='leave'; first.t=0; SFX.coin(); const from=STALL.clone().add(new THREE.Vector3(-0.4,1.4,rand(-1.5,1.5))); const n=Math.max(2,Math.round(price/6)); for(let i=0;i<n;i++) setTimeout(()=>fly(from,TREASURY.clone().setY(0.6),()=>{ bankIn(price/n); },false,4),i*50); floatText(from,`+${Math.round(price)}`,''); }
  stallPile.count=Math.min(30,S.stall);
}
stallPile.count=Math.min(30,S.stall);
// ---------- İnşa alanları ----------
const pads=[]; const towers=new Array(12).fill(null);
const TOWER_SLOTS=[[-7.4,6.8],[7.4,6.8],[-9.8,18.2],[9.8,18.2],[-9.8,26.2],[9.8,26.2],[-9.8,34.2],[9.8,34.2],[-9.8,42.2],[9.8,42.2],[-9.8,50.2],[9.8,50.2]];
const TOWER_ZONE=[0,0,0,0,1,1,2,2,3,3,4,4];
const SOLDIER_SLOTS=[[-2.6,1.2],[2.6,1.2],[-3.4,-1.2],[3.4,-1.2],[-1.6,-2.8],[1.6,-2.8]];
const WX=BASE.x0+2.3, EX=BASE.x1-2.3;
const towerPad=(i,base,prev)=>({id:'tower'+i, name:'Okçu Kulesi', res:l=>l===0?'wood':'gold', pos:TOWER_SLOTS[i], kind:'tower', slot:i, cost:l=>l===0?base:Math.round(40*Math.pow(1.3,l-1)), max:10, show:()=>S.lv.expand>=TOWER_ZONE[i]&&(prev<0||S.tw[prev]>=1)});
const PADS=[
  towerPad(0,15,-1), towerPad(1,25,0), towerPad(2,40,1), towerPad(3,55,2),
  {id:'soldier', name:'Asker', res:'gold', pos:[-3.8,7.2], kind:'soldier', key:'soldier', cost:l=>Math.round(30*Math.pow(1.35,l)), max:6, show:()=>true},
  {id:'wall', name:'Sur', res:'wood', pos:[3.8,7.2], kind:'wall', key:'wall', cost:l=>Math.round(40*Math.pow(1.7,l)), max:3, show:()=>S.tw[0]>=1},
  {id:'soldierTrain', name:'Asker Talimi', res:'gold', pos:[-3.8,10.2], kind:'up', key:'soldierTrain', cost:l=>Math.round(50*Math.pow(1.3,l)), max:20, show:()=>S.lv.soldier>=1},
  {id:'axe', name:'Balta', res:'gold', pos:[WX,9.2], kind:'up', key:'axe', cost:l=>Math.round(30*Math.pow(1.3,l)), max:20, show:()=>true},
  {id:'bag', name:'Sırt', res:'gold', pos:[WX,11.8], kind:'up', key:'bag', cost:l=>Math.round(30*Math.pow(1.3,l)), max:20, show:()=>true},
  {id:'worker', name:'Oduncu', res:'gold', pos:[WX,14.4], kind:'worker', key:'worker', cost:l=>Math.round(60*Math.pow(1.6,l)), max:6, show:()=>S.lv.axe+S.lv.bag>=1},
  {id:'sword', name:'Kılıç', res:'gold', pos:[-6.4,17.4], kind:'up', key:'sword', cost:l=>Math.round(40*Math.pow(1.3,l)), max:30, show:()=>S.lv.soldier>=1},
  {id:'feet', name:'Çizme', res:'gold', pos:[6.4,17.4], kind:'up', key:'feet', cost:l=>Math.round(40*Math.pow(1.3,l)), max:12, show:()=>S.lv.worker>=1},
  {id:'expand', name:'Genişlet', res:'wood', pos:[0,17.3], kind:'expand', key:'expand', cost:l=>Math.round(40*Math.pow(2.0,l)), max:4, show:()=>S.tw[0]>=1, dyn:true},
  towerPad(4,60,2), towerPad(5,60,3),
  {id:'trader', name:'Tüccar', res:'gold', pos:[WX,22.4], kind:'up', key:'trader', cost:l=>Math.round(80*Math.pow(1.3,l)), max:10, show:()=>S.lv.expand>=1},
  {id:'magnet', name:'Mıknatıs', res:'gold', pos:[EX,22.4], kind:'up', key:'magnet', cost:l=>Math.round(60*Math.pow(1.3,l)), max:8, show:()=>S.lv.expand>=1},
  {id:'towerTrain', name:'Okçu Talimi', res:'gold', pos:[-6.4,25.4], kind:'up', key:'towerTrain', cost:l=>Math.round(80*Math.pow(1.3,l)), max:20, show:()=>S.lv.expand>=1},
  {id:'depot', name:'Odun Deposu', res:'gold', pos:[6.4,25.4], kind:'up', key:'depotLv', cost:l=>Math.round(80*Math.pow(1.4,l)), max:5, show:()=>S.lv.expand>=1},
  towerPad(6,80,4), towerPad(7,80,5),
  {id:'gate', name:'Kapı Onarım', res:'wood', pos:[WX,30.4], kind:'up', key:'gateLv', cost:l=>Math.round(60*Math.pow(1.4,l)), max:10, show:()=>S.lv.expand>=2},
  {id:'worker2', name:'Oduncu Hızı', res:'gold', pos:[EX,30.4], kind:'up', key:'workerSpd', cost:l=>Math.round(90*Math.pow(1.3,l)), max:10, show:()=>S.lv.expand>=2},
  towerPad(8,100,6), towerPad(9,100,7),
  {id:'range', name:'Okçu Menzili', res:'gold', pos:[WX,38.4], kind:'up', key:'range', cost:l=>Math.round(120*Math.pow(1.3,l)), max:10, show:()=>S.lv.expand>=3},
  {id:'price', name:'Ganimet Fiyatı', res:'gold', pos:[EX,38.4], kind:'up', key:'price', cost:l=>Math.round(120*Math.pow(1.3,l)), max:10, show:()=>S.lv.expand>=3},
  towerPad(10,120,8), towerPad(11,120,9),
];
function padLevel(d){ return d.kind==='tower'? S.tw[d.slot] : (S.lv[d.key]||0); }
function padTexture(){ const c=document.createElement('canvas'); c.width=256; c.height=256; const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; return {c,tex}; }
function rr(x,X,Y,W,H,r){ x.beginPath(); x.moveTo(X+r,Y); x.lineTo(X+W-r,Y); x.quadraticCurveTo(X+W,Y,X+W,Y+r); x.lineTo(X+W,Y+H-r); x.quadraticCurveTo(X+W,Y+H,X+W-r,Y+H); x.lineTo(X+r,Y+H); x.quadraticCurveTo(X,Y+H,X,Y+H-r); x.lineTo(X,Y+r); x.quadraticCurveTo(X,Y,X+r,Y); x.closePath(); }
function drawPad(pd,name,cur,cost,can){ const x=pd.tex.c.getContext('2d'); x.clearRect(0,0,256,256); const wood=padRes(pd)==='wood';
  x.fillStyle=can?(wood?'rgba(120,80,30,0.92)':'rgba(30,110,60,0.9)'):'rgba(35,50,40,0.75)'; rr(x,10,10,236,236,22); x.fill();
  x.strokeStyle='#ffffff'; x.lineWidth=7; x.setLineDash([26,16]); rr(x,14,14,228,228,20); x.stroke(); x.setLineDash([]);
  x.fillStyle='#ffffff'; x.textAlign='center'; x.font='bold 30px "Baloo 2","Nunito",sans-serif'; x.fillText(name,128,64);
  x.font='800 78px "Baloo 2","Nunito",sans-serif'; x.fillText(String(Math.max(0,Math.ceil(cost-cur))),128,160);
  if(wood){ x.fillStyle='#c98d4e'; rr(x,98,192,60,26,12); x.fill(); x.fillStyle='#f0cd9c'; x.beginPath(); x.arc(158,205,13,0,7); x.fill(); x.strokeStyle='#8a5a30'; x.lineWidth=3; x.stroke(); }
  else { x.fillStyle='#ffc93a'; x.beginPath(); x.arc(128,205,17,0,7); x.fill(); x.strokeStyle='#8a5a00'; x.lineWidth=4; x.stroke(); }
  pd.tex.tex.needsUpdate=true; }
for(const pd of PADS){
  const g=new THREE.Group(); g.position.set(pd.pos[0],0,pd.pos[1]);
  const tex=padTexture(); const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.7,2.7),new THREE.MeshBasicMaterial({map:tex.tex,transparent:true,depthWrite:false})); plane.rotation.x=-Math.PI/2; plane.position.y=0.05; plane.renderOrder=1;
  const fill=new THREE.Mesh(new THREE.PlaneGeometry(2.45,2.45),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:0.35,depthWrite:false})); fill.rotation.x=-Math.PI/2; fill.position.y=0.04; fill.scale.set(1,0.001,1);
  g.add(plane,fill); scene.add(g);
  g.scale.setScalar(0.001); pads.push({def:pd,g,plane,fill,tex,payT:0,pop:0,cool:0,last:'',shown:0});
}
function padCost(pd){ return pd.def.cost(padLevel(pd.def)); }
function padRes(pd){ const r=pd.def.res; return typeof r==='function'? r(padLevel(pd.def)) : r; }
function padVisible(pd){ return padLevel(pd.def)<pd.def.max && pd.def.show(); }
function padAvail(pd){ const need=padCost(pd)-(S.paid[pd.def.id]||0); return padRes(pd)==='wood'? need<=S.logs+S.wood+0.01 : need<=S.coins+0.01; }
function expandBase(){ S.lv.expand++; applyBase(); paintGround(); buildWalls(S.lv.wall); burst(new THREE.Vector3(0,1,BASE.z1-4),30,M.plank,1.2); for(const pd of pads){ if(pd.def.dyn){ pd.g.position.z=BASE.z1-2.7; } } toast('Üs genişledi! Yeni inşa alanları açıldı','good'); }
function completePad(pd){ const d=pd.def; S.paid[d.id]=0; pd.pop=1; pd.cool=1.2;
  if(d.kind==='tower'){ S.tw[d.slot]++; buildTower(d.slot); }
  else if(d.kind==='wall'){ S.lv.wall++; buildWalls(S.lv.wall); S.gateHp=D.gateMax(); }
  else if(d.kind==='worker'){ S.lv.worker++; addWorker(); }
  else if(d.kind==='soldier'){ S.lv.soldier++; addSoldier(true); }
  else if(d.kind==='expand'){ expandBase(); }
  else { S.lv[d.key]=(S.lv[d.key]||0)+1; if(d.key==='axe') rebuildOrbit(); if(d.key==='depotLv'||d.key==='workerSpd'){ for(const w of workers){ w.cap=8+4*(S.lv.depotLv||0); w.speed=5+0.6*(S.lv.depotLv||0)+0.7*(S.lv.workerSpd||0); } } }
  SFX.build(); burst(pd.g.position.clone().setY(0.8),16,M.gold,1.2); floatText(pd.g.position,d.name+(d.kind==='tower'||d.kind==='wall'?' inşa edildi!':' ↑'),'green'); save(); }
function updatePads(dt){ const p=player.g.position;
  for(const pd of pads){ const vis=padVisible(pd); if(!vis){ pd.shown=0; } pd.g.visible=vis; if(!vis) continue;
    const cost=padCost(pd); const paid=S.paid[pd.def.id]||0; const lvl=padLevel(pd.def);
    pd.shown=Math.min(1,pd.shown+dt*2.5); const ease=1-Math.pow(1-pd.shown,3); const over=pd.shown<1? ease*(1+0.18*Math.sin(pd.shown*Math.PI)) : 1;
    const pulse=(S.paid[pd.def.id]||0)<cost&&padAvail(pd)? 1+0.05*Math.sin(performance.now()/180) : 1;
    if(pd.pop>0){ pd.pop-=dt*2; const s2=1+Math.sin((1-pd.pop)*Math.PI)*0.25; pd.g.scale.set(s2*over,1,s2*over); } else pd.g.scale.set(over*pulse,1,over*pulse);
    pd.plane.position.y=0.05+(padAvail(pd)?0.02+0.02*Math.sin(performance.now()/180):0);
    pd.cool=Math.max(0,pd.cool-dt);
    const near=Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z)<1.7&&!playerMoving;
    if(near&&pd.cool<=0&&paid<cost){ if(padRes(pd)==='gold'){ if(S.coins>0.01){ const rate=Math.max(35,cost/1.4); const amt=Math.min(rate*dt,S.coins,cost-paid); S.coins-=amt; S.paid[pd.def.id]=paid+amt; pd.payT-=dt; if(pd.payT<=0){ pd.payT=0.06; fly(p.clone().setY(2.4),pd.g.position.clone().setY(0.3),null,false,6); SFX.pay(); } } }
      else { pd.payT-=dt; if(pd.payT<=0&&(S.logs>0||S.wood>0)){ pd.payT=0.03; const fromBack=S.logs>0; if(fromBack){ S.logs--; setBack(player); } else { S.wood--; setPile(Math.min(24,S.wood)); } S.paid[pd.def.id]=Math.min(cost,paid+1); fly((fromBack?p.clone().setY(1.6):DEPOT.clone().setY(1.2)),pd.g.position.clone().setY(0.3),null,true,fromBack?6:4); SFX.pay(); } } }
    const cur=S.paid[pd.def.id]||0; const k=clamp(cur/cost,0,1); pd.fill.scale.set(1,Math.max(0.001,k),1); pd.fill.position.z=(1-k)*1.225;
    const can=S.coins+cur>=cost; const name=pd.def.name+(lvl>0&&pd.def.kind!=='worker'&&pd.def.kind!=='soldier'?' '+(lvl+1):'')+(pd.def.kind==='worker'||pd.def.kind==='soldier'?' '+(lvl+1)+'/'+pd.def.max:'');
    const key=name+'|'+Math.ceil(cost-cur)+'|'+can+'|'+padRes(pd); if(key!==pd.last){ pd.last=key; drawPad(pd,name,cur,cost,can); }
    if(cur>=cost-0.01) completePad(pd);
  } }
function buildTower(slot){ if(towers[slot]) scene.remove(towers[slot].g); const lvl=S.tw[slot]; const g=new THREE.Group(); const [x,z]=TOWER_SLOTS[slot]; g.position.set(x,0,z);
  const H=2.6+lvl*0.45; for(const [lx,lz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=mesh(G.cyl,M.woodDark,0.16,H,0.16); l.position.set(lx*0.9,H/2,lz*0.9); l.rotation.z=-lx*0.12; l.rotation.x=lz*0.12; g.add(l);} const brace=mesh(G.box,M.wood,2.2,0.12,0.12); brace.position.y=H*0.5; const brace2=brace.clone(); brace2.rotation.y=Math.PI/2; g.add(brace,brace2);
  const deck=mesh(G.box,M.plank,2.4,0.25,2.4); deck.position.y=H+0.12; for(let i=0;i<8;i++){ const a=i/8*6.283; const r=mesh(G.box,M.woodDark,0.14,0.6,0.14); r.position.set(Math.cos(a)*1.15,H+0.55,Math.sin(a)*1.15); g.add(r);}
  if(lvl>=2){ for(const [px,pz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const r=mesh(G.cyl,M.woodDark,0.08,1.8,0.08); r.position.set(px,H+1.2,pz); g.add(r);} const roof=mesh(G.cone4,lvl>=4?M.flag:M.banner,1.9,1.1,1.9); roof.position.y=H+2.6; roof.rotation.y=Math.PI/4; g.add(roof); }
  const archer=makeGuy('soldier'); archer.g.position.y=H+0.25; archer.g.scale.setScalar(0.85);
  for(let i=0;i<Math.min(lvl-1,4);i++){ const fl=mesh(G.box,M.flag,0.5,0.35,0.04,false); fl.position.set(1.2,H-0.5-i*0.45,0.0); fl.rotation.y=Math.PI/2; g.add(fl); }
  g.add(deck,archer.g); scene.add(g); g.scale.setScalar(0.01);
  towers[slot]={g,archer,cd:rand(0,0.5),lvl,pop:0,top:new THREE.Vector3(x,H+1.4,z)}; }
for(let i=0;i<12;i++) if(S.tw[i]>0){ buildTower(i); towers[i].pop=0.99; }
for(const pd of pads){ if(pd.def.dyn) pd.g.position.z=BASE.z1-2.7; }
function updateTowers(dt){ for(const t of towers){ if(!t) continue; if(t.pop<1){ t.pop=Math.min(1,t.pop+dt*2.2); const s=t.pop<1? (1.18-0.18*Math.cos(t.pop*Math.PI*1.5))*t.pop : 1; t.g.scale.setScalar(Math.max(0.01,s)); if(t.pop<1) continue; t.g.scale.setScalar(1); }
  t.cd-=dt; const e=nearestEnemy(t.g.position,D.towerRange()); if(e){ const a=t.archer; a.g.rotation.y=Math.atan2(e.g.position.x-t.g.position.x,e.g.position.z-t.g.position.z); a.aim=true; a.armR.rotation.x=lerp(a.armR.rotation.x,-1.4,dt*8); if(t.cd<=0){ t.cd=1/1.5; shoot(t.top,e,D.towerDmg(t.lvl)); } } else { t.archer.aim=false; } animGuy(t.archer,dt,false,1); } }

// ---------- Askerler (kapı önü) ----------
const soldiers=[];
function addSoldier(fresh){ const i=soldiers.length; if(i>=SOLDIER_SLOTS.length) return; const s=makeGuy('soldier'); const [x,z]=SOLDIER_SLOTS[i]; s.g.position.set(fresh?0:x,0,fresh?9:z); s.g.rotation.y=Math.PI; scene.add(s.g); soldiers.push({guy:s,slot:[x,z],cd:rand(0,0.5),arrived:!fresh}); }
for(let i=0;i<S.lv.soldier;i++) addSoldier(false);
function updateSoldiers(dt){ for(const s of soldiers){ const g=s.guy.g, p=g.position; const [sx,sz]=s.slot;
  if(!s.arrived){ const dx=sx-p.x, dz=sz-p.z, d=Math.hypot(dx,dz); if(d<0.2){ s.arrived=true; } else { p.x+=dx/d*5*dt; p.z+=dz/d*5*dt; g.rotation.y=Math.atan2(dx,dz); animGuy(s.guy,dt,true,0.8); continue; } }
  s.cd-=dt; const e=nearestEnemy(p,2.6); if(e){ g.rotation.y=Math.atan2(e.g.position.x-p.x,e.g.position.z-p.z); if(s.cd<=0){ s.cd=0.7; s.guy.swing=0.3; damageEnemy(e,D.soldierDmg()); } } else { g.rotation.y=lerp(g.rotation.y,Math.PI,dt*3); }
  animGuy(s.guy,dt,false,1); } }

// ---------- İşçiler ----------
const workers=[];
function addWorker(){ const w=makeGuy('worker'); w.g.position.set(rand(-3,3),0,rand(9,14)); scene.add(w.g); workers.push({guy:w,state:'idle',target:null,logs:0,cap:8+4*(S.lv.depotLv||0),timer:0,chopT:1,speed:5.0+0.6*(S.lv.depotLv||0)+0.7*(S.lv.workerSpd||0),moving:false}); }
for(let i=0;i<S.lv.worker;i++) addWorker();
function insideR(x,z){ return x>R.x0&&x<R.x1&&z>R.z0&&z<R.z1; }
function segHitsR(ax,az,bx,bz){ for(let s=0.15;s<=1;s+=0.04){ if(insideR(ax+(bx-ax)*s,az+(bz-az)*s)) return true; } return false; }
const G_IN=[0,BASE.z0+1.8], G_OUT=[0,BASE.z0-2.4];
function routeGoal(p,tx,tz){
  const inW=(x,z)=>x>BASE.x0&&x<BASE.x1&&z>BASE.z0&&z<BASE.z1; const inP=inW(p.x,p.z), inT=inW(tx,tz);
  const nearIn=Math.hypot(p.x-G_IN[0],p.z-G_IN[1])<0.6, nearOut=Math.hypot(p.x-G_OUT[0],p.z-G_OUT[1])<0.6;
  const inChannel=Math.abs(p.x)<1.3&&p.z>G_OUT[1]-0.2&&p.z<G_IN[1]+0.2;
  if(inP&&inT){ return (inChannel&&!nearIn)? G_IN : [tx,tz]; }
  if(inP&&!inT){ return (inChannel||nearIn)? G_OUT : G_IN; }
  if(!inP&&inT){ if(inChannel||nearOut) return G_IN; if(segHitsR(p.x,p.z,G_OUT[0],G_OUT[1])) return cornerVia(p,G_OUT[0],G_OUT[1]); return G_OUT; }
  if(segHitsR(p.x,p.z,tx,tz)) return cornerVia(p,tx,tz); return [tx,tz];
}
function cornerVia(p,tx,tz){ const e=0.8; const cs=[[R.x0-e,R.z0-e],[R.x1+e,R.z0-e],[R.x0-e,R.z1+e],[R.x1+e,R.z1+e]]; let best=null,bd=1e9; for(const c of cs){ const dp=Math.hypot(c[0]-p.x,c[1]-p.z); if(dp<0.7) continue; if(segHitsR(p.x,p.z,c[0],c[1])) continue; const d=dp+Math.hypot(tx-c[0],tz-c[1]); if(d<bd){bd=d;best=c;} } if(!best){ for(const c of cs){ const dp=Math.hypot(c[0]-p.x,c[1]-p.z); if(dp>=0.7&&dp<bd){bd=dp;best=c;} } } return best||[tx,tz]; }
function fenceCollideW(p){ const h=2.3;
  if(p.z>BASE.z0-0.6&&p.z<BASE.z0+0.6&&Math.abs(p.x)>=h&&Math.abs(p.x)<BASE.x1+0.6){ p.z = p.z<BASE.z0? BASE.z0-0.6: BASE.z0+0.6; }
  if(Math.abs(p.z-BASE.z1)<0.6&&p.x>BASE.x0-0.6&&p.x<BASE.x1+0.6){ p.z = p.z<BASE.z1? BASE.z1-0.6: BASE.z1+0.6; }
  if(Math.abs(p.x-BASE.x0)<0.6&&p.z>BASE.z0-0.6&&p.z<BASE.z1+0.6){ p.x = p.x<BASE.x0? BASE.x0-0.6: BASE.x0+0.6; }
  if(Math.abs(p.x-BASE.x1)<0.6&&p.z>BASE.z0-0.6&&p.z<BASE.z1+0.6){ p.x = p.x<BASE.x1? BASE.x1-0.6: BASE.x1+0.6; } }
function walkTo(w,tx,tz,stopDist,dt){ const p=w.guy.g.position; const dReal=Math.hypot(tx-p.x,tz-p.z); if(dReal<=stopDist){ w.moving=false; w.stuckT=0; return true; }
  let [gx,gz]=routeGoal(p,tx,tz);
  // ağaca takılınca yandan dolan
  if(w.detourT>0){ w.detourT-=dt; gx=w.detour[0]; gz=w.detour[1]; }
  const dx=gx-p.x, dz=gz-p.z, d=Math.hypot(dx,dz); if(d<0.05){ return false; }
  const ox=p.x, oz=p.z; p.x+=dx/d*w.speed*dt; p.z+=dz/d*w.speed*dt; fenceCollideW(p); pushOutOfTrunks(p,1.2);
  const adv=Math.hypot(p.x-ox,p.z-oz); if(adv<w.speed*dt*0.35&&w.detourT<=0){ w.stuckT=(w.stuckT||0)+dt; if(w.stuckT>0.25){ w.stuckT=0; const side=(w.side=(w.side||1)*-1); w.detour=[p.x-dz/d*3*side,p.z+dx/d*3*side]; w.detourT=0.7; } } else if(w.detourT<=0) w.stuckT=0;
  w.guy.g.rotation.y=Math.atan2(dx,dz); w.moving=true; return false; }
function updateWorkers(dt){
  for(const w of workers){ const g=w.guy.g, p=g.position;
    if(w.state==='idle'){ w.moving=false; const t=nearestTree(p,120,w); if(t){ t.claimed=w; w.target=t; w.state='toTree'; w.chopT=1; } }
    else if(w.state==='toTree'){ const t=w.target; if(!t.alive){ t.claimed=null; w.state='idle'; continue; } if(walkTo(w,t.x,t.z,2.0,dt)){ g.rotation.y=Math.atan2(t.x-p.x,t.z-p.z); w.chopT+=dt*1.1; if(w.chopT>=1){ w.chopT=0; w.guy.swing=0.3; hitTree(t,w.guy,()=>{ w.logs++; setLogs(w.guy,w.logs); }); } if(!t.alive){ t.claimed=null; w.state='wait'; w.timer=0; } } }
    else if(w.state==='wait'){ w.moving=false; w.timer+=dt; if(w.timer>0.7){ w.state = w.logs>=w.cap? 'toDepot':'idle'; } }
    else if(w.state==='toDepot'){ if(walkTo(w,DEPOT.x,DEPOT.z,3.0,dt)){ if(w.logs>0){ w.sellT=(w.sellT||0)-dt; if(w.sellT<=0){ w.sellT=0.08; w.logs--; setLogs(w.guy,w.logs); storeLog(p); } } else w.state='idle'; } }
    animGuy(w.guy,dt,w.moving,0.75);
  }
}

// ---------- Düşmanlar (kırmızı ordu, yol boyunca sıra sıra) ----------
const enemies=[]; const projectiles=[];
function makeEnemy(boss,hp){
  const guy=makeGuy('enemy'); const g=guy.g; const sc=boss?1.9:1; g.scale.setScalar(sc);
  if(boss){ const h1=mesh(G.cone,M.gold,0.14,0.5,0.14); h1.position.set(-0.3,2.0,0); h1.rotation.z=0.4; const h2=h1.clone(); h2.position.x=0.3; h2.rotation.z=-0.4; guy.root.add(h1,h2); }
  const off=rand(-0.5,0.5); g.position.set(ROAD[0][0]+off,0,ROAD[0][1]+rand(-0.5,0.5)); scene.add(g);
  const bar=document.createElement('div'); bar.className='hpbar'+(boss?' boss':''); bar.innerHTML='<i></i>'; document.body.appendChild(bar);
  enemies.push({g,guy,hp,maxHp:hp,boss,sc,speed:(boss?2.0:3.4)*rand(0.97,1.03),atk:boss?16:4,atkCd:0,dead:false,hitT:0,wp:1,off,bar,swing:0});
}
let waveT=12, waveActive=false, spawnQueue=0, spawnT=0;
function startWave(){ waveActive=true; const w=gw(); spawnQueue=6+Math.floor(w*1.7); spawnT=0; SFX.wave(); toast(S.wave===WAVES? 'Son dalga — patron geliyor!' : `${S.wave}. dalga geliyor!`); }
function spawnOne(){ const w=gw(); const boss=(S.wave===WAVES)&&spawnQueue===1; const hp=Math.round(9*Math.pow(1.14,w-1)*(boss?14:1)); makeEnemy(boss,hp); }
function damageEnemy(e,dmg){ if(e.dead) return; e.hp-=dmg; e.hitT=0.18; SFX.hit(); if(e.hp<=0) killEnemy(e); }
function killEnemy(e){ e.dead=true; e.bar.remove(); S.kills++; SFX.die(); burst(e.g.position.clone().setY(0.8),9,M.enemy,1); const reward=(8+gw()*2.5)*(e.boss?10:1); scene.remove(e.g); const nl=e.boss?12:1; for(let i=0;i<nl;i++) dropLoot(e.g.position.x,e.g.position.z); if(e.boss){ dropCoins(e.g.position.clone().setY(0.8),60,reward/60,8,1.3); } else if(Math.random()<0.35){ dropCoins(e.g.position.clone().setY(0.8),2,Math.round(reward/6),2.5,1); } }
let gateShake=0, gateDownT=0, levelReward=0;
function levelComplete(){ levelReward=Math.round(200*Math.pow(1.6,S.level-1)); celebT=10; celebSpawn=0; SFX.wave(); setTimeout(SFX.wave,300); toast(`Bölüm ${S.level} tamamlandı! Altınları topla`,'good'); dropCoins(new THREE.Vector3(0,3,GATE_POS.z+2),60,levelReward/260,6,1.4); }
function showLevelCard(){ if($('levelCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='levelCard'; card.innerHTML=`<div class="card"><div class="stars">★ ★ ★</div><h1>Bölüm ${S.level} tamamlandı!</h1><p>${S.kills} düşman, ${S.treesCut} ağaç. ${Math.floor(S.coins)} altının var.<br>Sıradaki bölümde düşmanlar daha güçlü, ödüller daha büyük.</p><button id="nextLevel">Bölüm ${S.level+1}'e geç</button></div>`; document.body.appendChild(card); $('nextLevel').addEventListener('click',()=>{ for(const c of coins) S.coins+=c.value; coins.length=0; stackH.clear(); S.level++; S.wave=1; waveT=14; S.gateHp=D.gateMax(); save(); card.remove(); toast(`Bölüm ${S.level} başladı!`,'good'); }); }
function updateEnemies(dt){
  if(celebT>0||$('levelCard')){ }
  else if(!waveActive){ waveT-=dt; if(waveT<=0) startWave(); }
  else if(spawnQueue>0){ spawnT-=dt; if(spawnT<=0){ spawnT=0.42; spawnQueue--; spawnOne(); } }
  else if(enemies.every(e=>e.dead)){ waveActive=false; if(S.wave>=WAVES){ levelComplete(); return; } S.wave++; waveT=Math.max(7,14-gw()*0.3); const bonus=15+gw()*5; toast(`Dalga temizlendi! +${bonus}`,'good'); const n=Math.min(40,10+gw()*2); dropCoins(new THREE.Vector3(0,2,GATE_POS.z-3),n,bonus/n,4,1.2); save(); }
  if(celebT>0){ celebT-=dt; celebSpawn-=dt; if(celebSpawn<=0&&celebT>4){ celebSpawn=0.1; const cx=rand(BASE.x0+2,BASE.x1-2), cz=rand(BASE.z0+2,BASE.z1-2); dropCoins(new THREE.Vector3(cx,6,cz),8,levelReward/260,2.5,0.4); } if(celebT<=0||(celebT<4&&coins.length===0)){ celebT=0; showLevelCard(); } }
  for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.dead){ enemies.splice(i,1); continue; }
    const last=e.wp>=ROAD.length-1; const tgt=last? [e.off*0.8,GATE_POS.z-1.7] : ROAD[e.wp]; const tx=tgt[0]+(last?0:e.off), tz=tgt[1];
    const dx=tx-e.g.position.x, dz=tz-e.g.position.z, d=Math.hypot(dx,dz);
    let blocked=false; for(const o of enemies){ if(o===e||o.dead) continue; const ox=o.g.position.x-e.g.position.x, oz=o.g.position.z-e.g.position.z; const ahead=ox*dx+oz*dz>0; if(ahead&&Math.hypot(ox,oz)<1.15*e.sc){ blocked=true; break; } }
    if(!last&&d<0.6){ e.wp++; }
    else if(!last||d>0.5){ if(!blocked){ e.g.position.x+=dx/d*e.speed*dt; e.g.position.z+=dz/d*e.speed*dt; } e.g.rotation.y=Math.atan2(dx,dz); animGuy(e.guy,dt,!blocked,1.1); }
    else { e.atkCd-=dt; animGuy(e.guy,dt,false,1); if(e.atkCd<=0){ e.atkCd=1.0; e.guy.swing=0.3; S.gateHp-=e.atk; SFX.gate(); gateShake=0.25; burst(new THREE.Vector3(rand(-1.5,1.5),1.4,GATE_POS.z),4,M.wood,0.6); if(S.gateHp<=0) gateBroken(); } }
    if(e.hitT>0){ e.hitT-=dt; const k=1+e.hitT*0.8; e.g.scale.set(e.sc*k,e.sc/k,e.sc*k); } else e.g.scale.setScalar(e.sc);
    v3.set(e.g.position.x,2.4*e.sc,e.g.position.z).project(camera); e.bar.style.left=((v3.x+1)/2*innerWidth)+'px'; e.bar.style.top=((1-v3.y)/2*innerHeight)+'px'; e.bar.firstElementChild.style.width=(clamp(e.hp/e.maxHp,0,1)*100)+'%';
  }
}
function gateBroken(){ S.gateHp=0; const loss=Math.floor(S.coins*0.2); S.coins-=loss; for(const e of enemies){ if(!e.dead){ e.dead=true; e.bar.remove(); scene.remove(e.g);} } toast(`Kapı kırıldı! ${loss} altın çalındı. Kapı onarılıyor…`); gateDownT=7; spawnQueue=0; }
function shoot(from,target,dmg){ const m=mesh(G.cyl,M.handle,0.035,0.8,0.035,false); m.position.copy(from); scene.add(m); projectiles.push({m,target,dmg,spd:26}); }
function updateProjectiles(dt){ for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; const t=p.target; if(t.dead){ scene.remove(p.m); projectiles.splice(i,1); continue; } const to=t.g.position.clone(); to.y=0.9; const dir=to.sub(p.m.position); const dist=dir.length(); if(dist<0.7){ scene.remove(p.m); projectiles.splice(i,1); damageEnemy(t,p.dmg); continue; } dir.normalize(); p.m.position.addScaledVector(dir,p.spd*dt); p.m.lookAt(t.g.position.x,0.9,t.g.position.z); p.m.rotateX(Math.PI/2); } }
function nearestEnemy(pos,range){ let best=null,bd=range; for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(pos); if(d<bd){bd=d;best=e;} } return best; }

// ---------- Oyuncu ----------
let chopT=1, sellT=0, autoSaveT=0, atkCd=0, introT=0, lastTree=null, playerMoving=false;
function fenceCollide(p){
  const holeHalf = gateOpen<0.55? 0 : 2.3;
  if(p.z>BASE.z0-0.7&&p.z<BASE.z0+0.7&&Math.abs(p.x)>=holeHalf&&Math.abs(p.x)<BASE.x1+0.7){ p.z = p.z<BASE.z0? BASE.z0-0.7: BASE.z0+0.7; }
  if(Math.abs(p.z-BASE.z1)<0.7&&p.x>BASE.x0-0.7&&p.x<BASE.x1+0.7){ p.z = p.z<BASE.z1? BASE.z1-0.7: BASE.z1+0.7; }
  if(Math.abs(p.x-BASE.x0)<0.7&&p.z>BASE.z0-0.7&&p.z<BASE.z1+0.7){ p.x = p.x<BASE.x0? BASE.x0-0.7: BASE.x0+0.7; }
  if(Math.abs(p.x-BASE.x1)<0.7&&p.z>BASE.z0-0.7&&p.z<BASE.z1+0.7){ p.x = p.x<BASE.x1? BASE.x1-0.7: BASE.x1+0.7; }
}
function updatePlayer(dt){
  const inp=inputVec(); const sp=D.speed();
  const p=player.g.position; const moving=inp.l>0.05; playerMoving=moving;
  if(moving){ p.x+=inp.x*sp*inp.l*dt; p.z+=inp.z*sp*inp.l*dt; const ang=Math.atan2(inp.x,inp.z); let d=ang-player.g.rotation.y; d=Math.atan2(Math.sin(d),Math.cos(d)); player.g.rotation.y+=d*Math.min(1,dt*16); }
  p.x=clamp(p.x,-WORLD+2,WORLD-2); p.z=clamp(p.z,-WORLD+2,WORLD-2);
  fenceCollide(p); pushOutOfTrunks(p,1.1);
  playerRing.position.set(p.x,0.04,p.z);
  player.coinMesh.count=Math.min(COIN_STACK,Math.floor(S.coins/8));
  // Pervane baltalar: yakındaki ağaçları yürürken de keser
  const canChop=S.logs<D.cap()&&!nearestEnemy(p,4); let chopping=false;
  if(canChop){ const near=[]; for(const t of trees){ if(!t.alive||t.falling>0) continue; const d=Math.hypot(t.x-p.x,t.z-p.z); if(d<2.9) near.push(t); } if(near.length){ chopping=true; chopT+=dt*D.chopRate(); if(chopT>=1){ chopT=0; for(const t of near){ if(!t.alive) continue; hitTree(t,player,()=>{ if(S.logs<D.cap()){ S.logs++; setBack(player);} }); } } } }
  if(!chopping) chopT=Math.min(1,chopT+dt*2);
  const nearTree=nearestTree(p,4.5); orbit.spin+=dt*(nearTree?15:3); orbit.g.rotation.y=orbit.spin; orbit.on=lerp(orbit.on,nearTree&&canChop?1:0,Math.min(1,dt*6)); orbit.g.scale.setScalar(Math.max(0.001,orbit.on)); orbit.g.position.set(p.x,1.1,p.z); orbit.g.visible=orbit.on>0.02;
  animGuy(player,dt,moving,0.85+inp.l*0.3);
  if(S.logs>0&&p.distanceTo(DEPOT)<3.4){ sellT-=dt; if(sellT<=0){ sellT=0.05; S.logs--; setBack(player); storeLog(p); } }
  if(sellGain>0){ sellFlushT-=dt; if(sellFlushT<=0){ sellFlushT=0.4; floatText(p,`+${Math.round(sellGain)}`,''); sellGain=0; } }
  if(S.loot>0&&p.distanceTo(STALL)<3.2){ sellT-=dt; if(sellT<=0){ sellT=0.06; S.loot--; setBack(player); fly(p.clone().setY(1.6),STALL.clone().add(new THREE.Vector3(0.6,1.4,rand(-1.5,1.5))),()=>{ S.stall++; },false,5); } }
  atkCd-=dt; const e=nearestEnemy(p,D.swordRange());
  if(e&&atkCd<=0){ atkCd=0.45; player.swing=0.3; SFX.slash(); const ang=Math.atan2(e.g.position.x-p.x,e.g.position.z-p.z); player.g.rotation.y=ang; slash.position.set(p.x,0.9,p.z); slash.rotation.z=-ang+Math.PI/2; slashT=0.22; for(const o of enemies){ if(o.dead) continue; const dx=o.g.position.x-p.x, dz=o.g.position.z-p.z; const d=Math.hypot(dx,dz); if(d<D.swordRange()+0.4&&(dx*Math.sin(ang)+dz*Math.cos(ang))/d>0.1) damageEnemy(o,D.swordDmg()); } }
  if(slashT>0){ slashT-=dt; slash.material.opacity=slashT/0.22*0.8; slash.scale.setScalar(1+(0.22-slashT)*1.5); } else slash.material.opacity=0;
  let target=null, text='';
  let cheapest=null, cbest=1e9, woodNeed=null, wbest=1e9; for(const pd of pads){ if(!padVisible(pd)) continue; if(padAvail(pd)){ if(padCost(pd)<cbest){ cbest=padCost(pd); cheapest=pd; } } else if(padRes(pd)==='wood'&&padCost(pd)<wbest){ wbest=padCost(pd); woodNeed=pd; } }
  if(gateDownT>0){ target=null; }
  else if(celebT>0&&coins.length>0){ let best=null,bd=1e9; for(const c of coins){ if(c.fly) continue; const d=Math.hypot(c.x-p.x,c.z-p.z); if(d<bd){bd=d;best=c;} } if(best){ target=new THREE.Vector3(best.x,0,best.z); text='Altınları topla'; } }
  else if(enemies.some(o=>!o.dead&&o.g.position.z>GATE_POS.z-14)){ const o=nearestEnemy(p,999); if(o){ target=new THREE.Vector3(o.g.position.x,0,Math.max(o.g.position.z,GATE_POS.z-3)); text='Düşmanı durdur'; } }
  else if(loot.length>0&&!loot.every(l=>l.fly)&&S.loot<D.cap()){ let best=null,bd=1e9; for(const l of loot){ if(l.fly) continue; const d=Math.hypot(l.x-p.x,l.z-p.z); if(d<bd){bd=d;best=l;} } target=new THREE.Vector3(best.x,0,best.z); text='Ganimeti topla'; }
  else if(S.loot>0){ target=STALL; text='Tezgâha götür'; }
  else if(S.bank>=15&&!cheapest){ target=TREASURY; text='Hazineden altın al'; }
  else if(cheapest){ target=cheapest.g.position; text=cheapest.def.name+((cheapest.def.kind==='tower'&&padLevel(cheapest.def)===0)||cheapest.def.kind==='wall'?' inşa et':cheapest.def.kind==='soldier'||cheapest.def.kind==='worker'?' al':cheapest.def.kind==='expand'?'':' geliştir'); }
  else if(S.logs>=D.cap()&&woodNeed){ target=woodNeed.g.position; text='Odunu '+woodNeed.def.name.toLowerCase()+' için kullan'; }
  else if(S.logs>=D.cap()){ target=DEPOT; text='Odunu depola'; }
  else if(S.stall>0&&customers.length===0){ target=STALL; text='Müşteri bekle'; }
  else { const t=nearestTree(p,120); if(t){ target=new THREE.Vector3(t.x,0,t.z); text= woodNeed? (woodNeed.def.name+' için odun kes') : (S.logs>0?'Odun topla':'Ağaç kes'); } }
  updateGuide(target,text,dt);
  const tipEl=$('tip'); let tip='';
  if(introT<6&&S.wave===1&&S.coins===0) tip = isTouch? 'Parmağını ekranda sürükleyerek yürü' : 'WASD ya da ok tuşlarıyla yürü';
  tipEl.textContent=tip; tipEl.classList.toggle('hide',!tip);
  introT+=dt;
}
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

// ---------- Kapı ----------
function updateGate(dt){
  if(gateDownT>0){ gateDownT-=dt; S.gateHp=D.gateMax()*(1-gateDownT/7); if(gateDownT<=0){ S.gateHp=D.gateMax(); toast('Kapı onarıldı!','good'); waveT=Math.max(waveT,8); } }
  else if(!waveActive&&S.gateHp<D.gateMax()) S.gateHp=Math.min(D.gateMax(),S.gateHp+5*dt);
  if(gateShake>0){ gateShake-=dt; gate.position.x=Math.sin(gateShake*60)*0.08; } else gate.position.x=0;
  const p=player.g.position; let near=Math.abs(p.x)<4.5&&Math.abs(p.z-GATE_POS.z)<4.5; for(const w of workers){ const wp=w.guy.g.position; if(Math.abs(wp.x)<3&&Math.abs(wp.z-GATE_POS.z)<3.5) near=true; } for(const s of soldiers){ if(!s.arrived) near=true; }
  gateOpen+=((near?1:0)-gateOpen)*Math.min(1,dt*7);
  const down=gateDownT>0; const a=gateOpen*1.5; gateLeaves.L.rotation.y=-a; gateLeaves.R.rotation.y=a; const fx=lerp(gateLeaves.L.rotation.x, down?1.45:0, Math.min(1,dt*5)); gateLeaves.L.rotation.x=gateLeaves.R.rotation.x=fx;
}

// ---------- Arayüz ----------
const coinsEl=$('coins'), logsEl=$('logs'), capEl=$('cap'), waveLbl=$('waveLbl'), waveTEl=$('waveT'), gateBar=$('gateBar'), gateLbl=$('gateLbl'), enemyEl=$('enemyCount');
let lastCoins=-1, shownCoins=S.coins;
function toast(msg,cls){ const t=$('toast'); t.textContent=msg; t.className='toast show '+(cls||''); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200); }
function renderHud(){
  shownCoins=lerp(shownCoins,S.coins,0.25); if(Math.abs(shownCoins-S.coins)<0.6) shownCoins=S.coins; const c=Math.floor(shownCoins); if(lastCoins!==c){ coinsEl.textContent=c; lastCoins=c; }
  logsEl.textContent=S.logs; capEl.textContent='/'+D.cap(); $('woodStock').textContent=S.wood; $('lootCount').textContent=S.loot;
  waveLbl.textContent=`Bölüm ${S.level} · Dalga ${S.wave}/${WAVES}`; waveTEl.textContent = celebT>0? 'Altınları topla!' : waveActive? 'saldırı!' : Math.ceil(waveT)+' sn';
  enemyEl.textContent=enemies.length+spawnQueue;
  const r=clamp(S.gateHp/D.gateMax(),0,1); gateBar.firstElementChild.style.width=(r*100)+'%'; gateBar.classList.toggle('danger',r<0.35); gateLbl.textContent=`Kapı ${Math.ceil(S.gateHp)}/${D.gateMax()}`;
}
$('muteBtn').addEventListener('click',()=>{ audio(); S.muted=!S.muted; $('muteBtn').textContent=S.muted?'🔇':'🔊'; save(); });
$('muteBtn').textContent=S.muted?'🔇':'🔊';
let started=false;
$('startBtn').addEventListener('click',()=>{ audio(); $('intro').remove(); started=true; });
if(S.coins>0||S.wave>1||S.level>1){ $('startBtn').textContent='Devam et'; $('intro').querySelector('p').textContent=`Kaldığın yerden: Bölüm ${S.level}, ${S.wave}. dalga, ${Math.floor(S.coins)} altın.`; }

// ---------- Döngü ----------
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; const portrait=h>w; const halfW=portrait?13:22; const dist=camOff.length(); const hf=2*Math.atan(halfW/dist); camera.fov=2*Math.atan(Math.tan(hf/2)/camera.aspect)*180/Math.PI; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();
let last=performance.now(); const camTarget=new THREE.Vector3(); const camPos=new THREE.Vector3();
function tick(dt){ updatePlayer(dt); updateTrees(dt); updateWorkers(dt); updateSoldiers(dt); updateTowers(dt); updatePads(dt); updateEnemies(dt); updateProjectiles(dt); updateGate(dt); updateFliers(dt); updateChips(dt); updateCoins(dt); updateLoot(dt); updateCustomers(dt); updateTreasury(dt); }
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(0.05,(now-last)/1000); last=now;
  if(started&&!document.hidden){ tick(dt); updateFloats(dt); updateLabels(); autoSaveT+=dt; if(autoSaveT>5){ autoSaveT=0; save(); } }
  const p=player.g.position;
  camTarget.set(p.x,0,p.z);
  camPos.copy(camTarget).add(camOff); camera.position.lerp(camPos,1-Math.pow(0.0005,dt));
  camera.lookAt(camera.position.x-camOff.x,0,camera.position.z-camOff.z);
  if(wallPop<1&&wallGroup){ wallPop=Math.min(1,wallPop+dt*2.2); const k=1-Math.pow(1-wallPop,3); wallGroup.scale.set(1,0.05+0.95*k*(1+0.12*Math.sin(wallPop*Math.PI)),1); }
  sun.position.set(p.x+14,26,p.z+10); sun.target.position.set(p.x,0,p.z);
  renderHud();
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.__dbg={S,player,trees,enemies,workers,soldiers,towers,pads,D,coins,dropCoins,tick,loot,customers,setBack};
})();
