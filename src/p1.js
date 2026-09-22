// CrazyGames köprüsü: site dışında sessizce çalışmaz, oyunu etkilemez
const CG={sdk:null,env:'none',playing:false,lastMid:0};
function cgCall(fn){ try{ if(CG.sdk) return fn(CG.sdk); }catch(e){} }
(async function boot(){ const s=window.CrazyGames&&window.CrazyGames.SDK; if(s){ try{ await Promise.race([s.init(),new Promise(r=>setTimeout(r,3000))]); CG.sdk=s; CG.env=s.environment||'unknown'; cgCall(k=>k.game.loadingStart()); }catch(e){} } startGame(); })();
function startGame(){
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
const SAVE_KEY='ormanin-bekcisi-v7'; const OLD_KEY='ormanin-bekcisi-v6';
const WAVES=5; const MAXL=10; const LEVELS=10;
const LV0={axe:0,bag:0,feet:0,worker:0,stoneWorker:0,sword:0,wall:0,soldier:0,expand:0,trader:0,towerTrain:0,magnet:0,collector:0,gateLv:0,range:0,depotLv:0,workerSpd:0,price:0,soldierTrain:0,cannonTrain:0};
const SIDES=['N','E','S','W']; const SIDE_TR={N:'Kuzey',E:'Doğu',S:'Güney',W:'Batı'};
function defaultTowers(){ const t=[{k:'a',side:'C',a:0,lvl:0,fixed:true}]; for(const s of SIDES) for(const a of [-5.2,5.2]) t.push({k:'a',side:s,a,lvl:0,fixed:true}); return t; }
// Kalıcı (meta): açılan bölüm, yıldızlar, taç, kalıcı güçlendirmeler. Bölümlük (run): her bölüm başında sıfırlanır.
const META0={unlocked:1,stars:{},crowns:0,up:{gold:0,wall:0,arrow:0},dailyDate:'',streak:0,fails:{}};
function runState(level){ return { coins:0, bank:0, logs:0, stones:0, stone:0, loot:0, wood:0, stall:0, wave:1, level:level||1, gateHp:150, treesCut:0, kills:0, lv:Object.assign({},LV0), towers:defaultTowers(), paid:{}, cards:{}, cardOffer:null, minGate:1, started:false }; }
const S = Object.assign(runState(1), { muted:false, meta:JSON.parse(JSON.stringify(META0)) });
const store={ get:k=>{ let v=null; try{ if(CG.sdk&&CG.sdk.data) v=CG.sdk.data.getItem(k); }catch(e){} if(v==null){ try{ v=localStorage.getItem(k); }catch(e){} } return v; }, set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} try{ if(CG.sdk&&CG.sdk.data) CG.sdk.data.setItem(k,v); }catch(e){} } };
function load(){ try{ const j=JSON.parse(store.get(SAVE_KEY)); if(j){ Object.assign(S,j); S.lv=Object.assign({},LV0, j.lv||{}); S.towers=Array.isArray(j.towers)&&j.towers.length>=9? j.towers : defaultTowers(); S.paid=j.paid||{}; S.cards=j.cards||{}; S.meta=Object.assign(JSON.parse(JSON.stringify(META0)),j.meta||{}); S.meta.up=Object.assign({gold:0,wall:0,arrow:0},S.meta.up||{}); return; } }catch(e){}
  // eski kayıttan geçiş: ulaşılan bölüm açık kalır, ilerleme taça çevrilir
  try{ const o=JSON.parse(store.get(OLD_KEY)); if(o&&o.level){ S.meta.unlocked=Math.min(LEVELS,Math.max(1,o.level)); S.meta.crowns=Math.min(20,2*(o.level-1)); S.muted=!!o.muted; } }catch(e){} }
function save(){ store.set(SAVE_KEY, JSON.stringify(S)); }
load();
const gw=()=>(S.level-1)*WAVES+S.wave;
// Gece arası güç kartları (bölüm boyunca geçerli, üst üste eklenir)
const CARDS={
  arrow:{n:'Keskin Oklar',d:'Okçu kulelerinin hasarı +%25',i:'🏹'}, rate:{n:'Hızlı Yay',d:'Okçular %20 daha hızlı atar',i:'💨'}, range:{n:'Uzun Menzil',d:'Tüm kulelerin menzili +3',i:'🎯'},
  powder:{n:'Barut',d:'Topçu hasarı +%40',i:'💣'}, wall:{n:'Sağlam Sur',d:'Sur canı +%25 ve tamamen onarılır',i:'🧱'}, mend:{n:'Duvarcı',d:'Saldırı sırasında sur kendini onarır',i:'🔧'},
  sword:{n:'Keskin Kılıç',d:'Kılıç hasarı +%40, menzili biraz artar',i:'⚔️'}, drill:{n:'Talimli Asker',d:'Askerler %40 daha sert vurur',i:'🛡️'}, trample:{n:'Midilli Ezme',d:'Koşarken çarptığın düşmanı ezersin',i:'🐴'},
  pony:{n:'Çevik Midilli',d:'Midilli %15 daha hızlı',i:'🥕'}, axe:{n:'Güçlü Balta',d:'Ağaçları %30 daha hızlı kesersin',i:'🪓'}, lumber:{n:'Odun Bereketi',d:'Her ağaç +2 odun verir',i:'🌲'},
  magnet:{n:'Mıknatıs',d:'Altın ve ganimet %60 daha uzaktan gelir',i:'🧲'}, trade:{n:'Pazarlık',d:'Miğferler %30 daha pahalı satılır',i:'🤝'}, gold:{n:'Hazine Sandığı',d:'Hemen altın kazan',i:'💰'},
};
const cc=k=>(S.cards&&S.cards[k])||0; const mu=k=>(S.meta&&S.meta.up&&S.meta.up[k])||0;
const hasPerk=k=>cc({arrows:'rate',mason:'mend',gold:'trade',lumber:'lumber',magnet:'magnet',cannon:'powder',trample:'trample'}[k]||k)>0;
const D = {
  chopRate:()=>4.0*(1+0.3*cc('axe')), treeHits:()=>1, logsPerTree:()=>4+2*cc('lumber'),
  cap:()=>40+15*S.lv.feet, speed:()=>(8.4+0.5*S.lv.feet)*(1+0.15*cc('pony')), magnet:()=>3.8*(1+0.6*cc('magnet')), lootPrice:()=>(8+gw()*1.5+3*S.lv.trader)*(1+0.3*cc('trade')), buyTime:()=>Math.max(0.25,0.7-0.08*S.lv.trader),
  swordDmg:()=>9*(1+0.4*cc('sword')), swordRange:()=>2.9+0.3*cc('sword'),
  gateMax:()=>Math.round((150+120*S.lv.wall)*(1+0.25*cc('wall'))*(1+0.1*mu('wall'))), towerDmg:l=>(5+3*(l-1))*(1+0.25*cc('arrow'))*(1+0.08*mu('arrow')), towerRange:()=>17+3*cc('range'), towerRate:()=>1+0.2*cc('rate'), cannonDmg:l=>(14+7*(l-1))*(1+0.4*cc('powder')), soldierDmg:()=>8*(1+0.4*cc('drill')),
};
// Kapı sayısı: bölümün gecesine ve bölüm numarasına göre açılır
const sidesActive=()=>Math.min(4,1+Math.floor((S.wave-1)/2)+Math.floor((S.level-1)/2));
const sidesShown=()=>Math.min(4,sidesActive()+1);

// ---------- Ses ----------
let AC=null;
function audio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); if(AC) musicInit(); }
let adMute=false;
function tone(f0,f1,dur,type,vol){ if(S.muted||adMute||!AC) return; const o=AC.createOscillator(), g=AC.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f0,AC.currentTime); o.frequency.exponentialRampToValueAtTime(f1,AC.currentTime+dur); g.gain.setValueAtTime(vol||0.08,AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+dur); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime+dur); }
function noise(dur,vol){ if(S.muted||adMute||!AC) return; const n=AC.sampleRate*dur, b=AC.createBuffer(1,n,AC.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n); const s=AC.createBufferSource(); s.buffer=b; const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900; const g=AC.createGain(); g.gain.value=vol||0.25; s.connect(f).connect(g).connect(AC.destination); s.start(); }
const SFX = {
  chop:()=>{ noise(0.08,0.35); tone(180,90,0.08,'square',0.04); }, fall:()=>{ noise(0.3,0.4); tone(120,50,0.3,'sawtooth',0.05); },
  coin:()=>{ tone(880,1320,0.12,'sine',0.06); }, sell:()=>{ tone(660,990,0.08,'triangle',0.05); }, pay:(k)=>{ k=Math.max(0,Math.min(1,k||0)); const f=420+k*900; tone(f,f*1.12,0.05,'triangle',0.03+0.03*k); },
  build:()=>{ tone(300,600,0.15,'triangle',0.08); setTimeout(()=>tone(600,900,0.2,'triangle',0.08),120); setTimeout(()=>tone(900,1200,0.25,'sine',0.07),260); },
  slash:()=>{ noise(0.07,0.25); tone(900,300,0.09,'sawtooth',0.04); }, hit:()=>{ tone(300,120,0.1,'square',0.05); }, die:()=>{ tone(400,80,0.2,'sawtooth',0.05); },
  gate:()=>{ noise(0.12,0.3); tone(90,40,0.15,'square',0.06); }, wave:()=>{ tone(220,330,0.25,'triangle',0.08); setTimeout(()=>tone(330,440,0.3,'triangle',0.08),200); },
  boom:()=>{ noise(0.35,0.5); tone(90,30,0.35,'sawtooth',0.08); },
  // büyük satın alma: gümbürtü + yükselen üç nota + parıltı
  fanfare:()=>{ noise(0.25,0.35); tone(110,55,0.3,'sine',0.12); [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,f*1.01,0.22+i*0.05,'triangle',0.09),80+i*95)); setTimeout(()=>tone(2093,2637,0.3,'sine',0.04),480); },
  win:()=>{ [523,659,784,1047,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,f,0.28,'triangle',0.1),i*140)); setTimeout(()=>noise(0.4,0.2),900); },
  lose:()=>{ [392,349,311,262].forEach((f,i)=>setTimeout(()=>tone(f,f*0.97,0.35,'sawtooth',0.06),i*220)); },
  night:()=>{ tone(110,98,0.9,'sawtooth',0.06); setTimeout(()=>tone(147,131,0.9,'sawtooth',0.05),250); noise(0.6,0.12); },
  card:()=>{ tone(880,1760,0.15,'sine',0.07); setTimeout(()=>tone(1320,1760,0.2,'sine',0.06),110); },
};
// ---------- Müzik: gündüz sakin, gece gergin (tamamen kod ile üretilir, dosya yok) ----------
const MUS={next:0,step:0,mel:4,vol:null,lp:null,mode:'day'};
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const SCALES={day:[60,62,64,67,69,72,74,76],night:[57,60,62,64,67,69,72,74]};
const ROOTS={day:[48,45,41,43],night:[45,41,43,40]};
function musicInit(){ if(MUS.vol||!AC) return; MUS.vol=AC.createGain(); MUS.vol.gain.value=0; MUS.lp=AC.createBiquadFilter(); MUS.lp.type='lowpass'; MUS.lp.frequency.value=1800; MUS.lp.connect(MUS.vol).connect(AC.destination); MUS.next=AC.currentTime+0.1; }
function mnote(midi,t,dur,type,vol,det){ const o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.value=NOTE(midi); if(det) o.detune.value=det; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g).connect(MUS.lp); o.start(t); o.stop(t+dur+0.05); }
function musicTick(night){ if(!AC||!MUS.vol) return; const target=(S.muted||adMute)?0:(night>0.5?0.09:0.07); MUS.vol.gain.setTargetAtTime(target,AC.currentTime,0.8); const mode=night>0.5?'night':'day'; if(mode!==MUS.mode){ MUS.mode=mode; MUS.lp.frequency.setTargetAtTime(mode==='night'?1200:1800,AC.currentTime,0.5); }
  const bpm=mode==='night'?132:96; const st=60/bpm/2; while(MUS.next<AC.currentTime+0.4){ const t=MUS.next; const i=MUS.step; const bar=Math.floor(i/16), beat=i%16; const root=ROOTS[mode][Math.floor(bar/2)%4]; const sc=SCALES[mode];
    if(beat===0){ mnote(root,t,st*16,'sine',0.5); mnote(root+7,t,st*16,'sine',0.25,6); mnote(root+12,t,st*16,'triangle',0.12,-5); }
    if(beat%4===0) mnote(root-12,t,st*3,mode==='night'?'sawtooth':'triangle',mode==='night'?0.28:0.2);
    if(mode==='night'&&beat%4===2) mnote(root-12,t,st*1.2,'square',0.06);
    if(beat%2===0&&Math.random()<(mode==='night'?0.75:0.55)){ MUS.mel=clamp(MUS.mel+(Math.random()<0.5?-1:1)*(Math.random()<0.25?2:1),0,sc.length-1); mnote(sc[MUS.mel],t,st*(Math.random()<0.3?4:2),mode==='night'?'square':'triangle',mode==='night'?0.12:0.16); }
    MUS.step++; MUS.next+=st; } }

// ---------- Sahne ----------
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isMobile?1.75:2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xe8dcc0);
scene.fog=new THREE.Fog(0xe8dcc0,120,230);
const camera=new THREE.PerspectiveCamera(36,1,0.5,360);
const YAW=0.55;
const camOff=new THREE.Vector3(Math.sin(YAW)*30,44,Math.cos(YAW)*30);
const hemi=new THREE.HemisphereLight(0xfff4e0,0x8f7a55,0.5); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1d2,1.25);
const DAY={bg:new THREE.Color(0xe8dcc0),sun:new THREE.Color(0xfff1d2),hemi:new THREE.Color(0xfff4e0),sunI:1.25,hemiI:0.5,exp:1.12}, NIGHT={bg:new THREE.Color(0x3b4160),sun:new THREE.Color(0x8fa6ff),hemi:new THREE.Color(0x6f7fb8),sunI:0.55,hemiI:0.32,exp:0.95}; let night=0; const tmpC=new THREE.Color();
function applyNight(k){ scene.background.copy(DAY.bg).lerp(NIGHT.bg,k); scene.fog.color.copy(scene.background); sun.color.copy(DAY.sun).lerp(NIGHT.sun,k); sun.intensity=lerp(DAY.sunI,NIGHT.sunI,k); hemi.color.copy(DAY.hemi).lerp(NIGHT.hemi,k); hemi.intensity=lerp(DAY.hemiI,NIGHT.hemiI,k); renderer.toneMappingExposure=lerp(DAY.exp,NIGHT.exp,k); }
sun.position.set(14,26,10); sun.castShadow=true;
sun.shadow.mapSize.set(isMobile?1024:2048,isMobile?1024:2048);
Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:120});
sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.02; sun.shadow.camera.updateProjectionMatrix();
scene.add(sun); scene.add(sun.target);

const mat=(c,extra)=>new THREE.MeshLambertMaterial(Object.assign({color:c},extra||{}));
const M={
  trunk:mat(0x8a5a36), leaf:mat(0xffffff), log:mat(0xc98d4e), logEnd:mat(0xf0cd9c),
  wood:mat(0xb5803f), woodDark:mat(0x7d5124), plank:mat(0xd2a15e), stone:mat(0xa8a49c), stoneDark:mat(0x7f7b74), stoneBlue:mat(0x8a93a6), bush:mat(0x4fa66a), flower:mat(0xffffff),
  skin:mat(0xffd7b1), skin2:mat(0xf5b98f), shirt:mat(0x2f6fd6), pants:mat(0x3f5484), belt:mat(0x5a3a1e), boot:mat(0x4a2f1a), crown:mat(0xffc93a,{emissive:0x6a4a00}), hair:mat(0x5a3a1e),
  workerShirt:mat(0xe8e2d6), workerHat:mat(0xd9534f), soldierShirt:mat(0x3d63c9), soldierHelm:mat(0x3b4f8a),
  metal:mat(0xd8dee4), iron:mat(0x4a4f57), handle:mat(0x6d4a2a), blade:mat(0xe8f0ff,{emissive:0x334466}), pony:mat(0xc98a4e), ponyLight:mat(0xe8c9a0), ponyDark:mat(0xa8703a), mane:mat(0x4a2e18),
  coin:mat(0xf59e0b,{emissive:0x6b3f00}), gold:mat(0xe8961a,{emissive:0x5a3800}),
  enemy:mat(0xd63a3a), enemyDark:mat(0x9c2323), enemyHelm:mat(0xc02f2f), eye:mat(0xffffff), pupil:mat(0x1d1d22),
  gate:mat(0xb5803f), banner:mat(0xd9534f), flag:mat(0xf2b43c), arrow:mat(0xffffff,{emissive:0x8a8a8a}), chest:mat(0x8c4b25), chestGold:mat(0xffd36b,{emissive:0x6a4a00}),
  ghostOk:new THREE.MeshLambertMaterial({color:0x6fe08a,transparent:true,opacity:0.55,depthWrite:false}), ghostBad:new THREE.MeshLambertMaterial({color:0xe05a5a,transparent:true,opacity:0.55,depthWrite:false}),
  ball:mat(0x2a2d33), smoke:mat(0x777777), roof:mat(0x6e4a3a), roofDark:mat(0x553628), canvas:mat(0xf1e6cf), canvasDark:mat(0x5b8f6a), rope:mat(0xc9a86a),
};
const G={
  box:new THREE.BoxGeometry(1,1,1), cyl:new THREE.CylinderGeometry(1,1,1,12), cone:new THREE.ConeGeometry(1,1,8), cone4:new THREE.ConeGeometry(1,1,4), sph:new THREE.SphereGeometry(1,14,12),
  log:new THREE.CylinderGeometry(0.2,0.2,0.95,9), dod:new THREE.DodecahedronGeometry(1,0), coin:new THREE.CylinderGeometry(0.42,0.42,0.14,12),
};
function mesh(g,m,sx,sy,sz,shadow){ const o=new THREE.Mesh(g,m); o.scale.set(sx,sy,sz); o.castShadow=shadow!==false; o.receiveShadow=true; return o; }
function mergeGeos(list){ const pos=[],nor=[]; for(const g of list){ const gg=g.index?g.toNonIndexed():g; const p=gg.attributes.position.array, n=gg.attributes.normal.array; for(let i=0;i<p.length;i++){ pos.push(p[i]); nor.push(n[i]); } } const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); return geo; }
const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e3=new THREE.Euler(), vs=new THREE.Vector3(), vp=new THREE.Vector3(), v3=new THREE.Vector3();
function instanced(geo,material,items,shadow){ const im=new THREE.InstancedMesh(geo,material,Math.max(1,items.length)); items.forEach((it,i)=>{ e3.set(it.rx||0,it.ry||0,it.rz||0); q.setFromEuler(e3); vp.set(it.x,it.y||0,it.z); vs.set(it.sx||it.s||1,it.sy||it.s||1,it.sz||it.s||1); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); if(it.c!==undefined) im.setColorAt(i,new THREE.Color(it.c)); }); im.count=items.length; im.castShadow=shadow!==false; im.receiveShadow=true; scene.add(im); return im; }

// ---------- Dünya: ormanın ortasında kare sur, dört kapı ----------
const WORLD=100;
const SD={N:{o:[0,-1],t:[1,0]},E:{o:[1,0],t:[0,1]},S:{o:[0,1],t:[1,0]},W:{o:[-1,0],t:[0,1]}};
let H=12; const hOf=k=>12+2*Math.min(MAXL,k);
function applyBase(){ H=hOf(S.lv.expand||0); }
applyBase();
function sidePos(s,a,b){ const d=SD[s]; return [d.o[0]*H+d.t[0]*a+d.o[0]*b, d.o[1]*H+d.t[1]*a+d.o[1]*b]; } // a: duvar boyunca, b: dışarı (+)
function localOf(s,x,z){ const d=SD[s]; const cx=d.o[0]*H, cz=d.o[1]*H; return [(x-cx)*d.t[0]+(z-cz)*d.t[1], (x-cx)*d.o[0]+(z-cz)*d.o[1]]; }
function inW(x,z){ return Math.abs(x)<H&&Math.abs(z)<H; }
function inBase(x,z){ return Math.abs(x)<H+1.2&&Math.abs(z)<H+1.2; }
// Köşeler (kamera güneydoğudan bakar; tezgâh ve depo köşede 45° dönük, önleri meydana bakar): KB tezgâh, GD depo, GB hazine, KD asker çadırı + kuyu
const ROT45=-3*Math.PI/4; const DIAG=Math.SQRT1_2;
function rotPt(base,lx,ly,lz){ const c=Math.cos(ROT45), s=Math.sin(ROT45); return new THREE.Vector3(base.x+lx*c+lz*s, ly, base.z-lx*s+lz*c); }
const STALL=new THREE.Vector3(-(H-2.8),0,-(H-2.8)), DEPOT=new THREE.Vector3(H-2.8,0,H-2.8), TREASURY=new THREE.Vector3(-(H-2.9),0,H-2.9), CAMP=new THREE.Vector3(H-2.8,0,-(H-2.8));
const STALL_FRONT=new THREE.Vector3(), DEPOT_FRONT=new THREE.Vector3(), QUEUE_IN=new THREE.Vector3(-3.6,0,-0.6), QUEUE_OUT=new THREE.Vector3(-3.6,0,0.6);
function placeBuildings(){ STALL.set(-(H-2.8),0,-(H-2.8)); DEPOT.set(H-2.8,0,H-2.8); TREASURY.set(-(H-2.9),0,H-2.9); CAMP.set(H-2.8,0,-(H-2.8)); STALL_FRONT.set(STALL.x+2.2,0,STALL.z+2.2); DEPOT_FRONT.set(DEPOT.x-2.0,0,DEPOT.z-2.0);
  if(typeof camp!=='undefined') camp.position.copy(CAMP); if(typeof placeRopes==='function') placeRopes(); if(typeof depot!=='undefined') depot.position.copy(DEPOT); if(typeof stall!=='undefined') stall.position.copy(STALL); if(typeof treasury!=='undefined') treasury.position.copy(TREASURY); for(const L of (typeof labels!=='undefined'?labels:[])){ if(L.src) L.pos.copy(L.src); } }
const ROADS={ N:[[0,-98],[-4,-84],[3,-68],[-3,-52],[2,-40],[0,-34]], E:[[98,0],[84,4],[68,-3],[52,3],[40,-2],[34,0]], S:[[0,98],[4,84],[-3,68],[3,52],[-2,40],[0,34]], W:[[-98,0],[-84,-4],[-68,3],[-52,-3],[-40,2],[-34,0]] };
function roadPath(s){ return ROADS[s].concat([sidePos(s,0,0),[0,0]]); }
function roadDist(x,z){ let best=1e9; for(const s of SIDES){ const P=roadPath(s); for(let i=0;i<P.length-1;i++){ const [ax,az]=P[i],[bx,bz]=P[i+1]; const dx=bx-ax,dz=bz-az; const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1); const d=Math.hypot(ax+dx*t-x,az+dz*t-z); if(d<best) best=d; } } return best; }
function nearBase(x,z,m){ return Math.abs(x)<H+m&&Math.abs(z)<H+m; }
const QUARRIES=[[22,22],[-22,-22],[44,-44],[-44,44],[44,44]];
function nearQuarry(x,z,m){ return QUARRIES.some(qq=>Math.hypot(x-qq[0],z-qq[1])<m); }
function freeSpot(x,z,pad){ return !nearBase(x,z,5.5) && roadDist(x,z)>4.2+pad && !nearQuarry(x,z,7.5); }

let groundTex=null;
function paintGround(){
  const N=2048, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d');
  const W2=WORLD*2; const px=v=>(v+WORLD)/W2*N; const pw=v=>v/W2*N;
  x.fillStyle='#d7b989'; x.fillRect(0,0,N,N);
  for(let i=0;i<6000;i++){ const r=rand(8,60); x.fillStyle=`hsla(${rand(32,44)},${rand(38,52)}%,${rand(58,72)}%,${rand(.12,.35)})`; x.beginPath(); x.ellipse(rand(0,N),rand(0,N),r,r*rand(.5,1),rand(0,3),0,7); x.fill(); }
  for(let i=0;i<500;i++){ const r=rand(30,110); x.fillStyle=`hsla(${rand(95,115)},${rand(40,55)}%,${rand(48,60)}%,${rand(.35,.7)})`; x.beginPath(); x.ellipse(rand(0,N),rand(0,N),r,r*rand(.5,1),rand(0,3),0,7); x.fill(); }
  x.lineCap='round'; x.lineJoin='round';
  for(const s of SIDES){ const P=roadPath(s); for(const [col,w] of [['#c9a26d',6],['#e3c898',3.6]]){ x.strokeStyle=col; x.lineWidth=pw(w); x.beginPath(); P.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke(); } }
  for(const [qx,qz] of QUARRIES){ x.fillStyle='#b9b3a6'; x.beginPath(); x.ellipse(px(qx),px(qz),pw(7),pw(6),0.6,0,7); x.fill(); x.fillStyle='#a19b8f'; for(let i=0;i<14;i++){ x.beginPath(); x.ellipse(px(qx+rand(-5,5)),px(qz+rand(-4,4)),pw(rand(.8,2)),pw(rand(.6,1.4)),rand(0,3),0,7); x.fill(); } }
  x.fillStyle='#63b85a'; x.fillRect(px(-H),px(-H),pw(2*H),pw(2*H));
  for(let i=0;i<Math.round(H*H*2);i++){ x.fillStyle=`hsla(${rand(100,120)},${rand(40,55)}%,${rand(42,58)}%,${rand(.15,.35)})`; x.beginPath(); x.ellipse(rand(px(-H),px(H)),rand(px(-H),px(H)),rand(6,22),rand(4,14),rand(0,3),0,7); x.fill(); }
  // sur içi yollar (dört kapıdan merkeze) ve meydan
  x.strokeStyle='#e0c69a'; x.lineWidth=pw(3.4); x.beginPath(); x.moveTo(px(0),px(-H)); x.lineTo(px(0),px(H)); x.moveTo(px(-H),px(0)); x.lineTo(px(H),px(0)); x.stroke();
  // köşe binalarına giden ince patikalar
  x.strokeStyle='#dcc296'; x.lineWidth=pw(1.6); x.beginPath(); for(const [sx,sz] of [[-1,-1],[1,1],[-1,1],[1,-1]]){ x.moveTo(px(sx*3.2),px(sz*3.2)); x.lineTo(px(sx*(H-4.6)),px(sz*(H-4.6))); } x.stroke();
  x.fillStyle='#e6cfa4'; x.beginPath(); x.arc(px(0),px(0),pw(4.2),0,7); x.fill();
  x.strokeStyle='#cfb283'; x.lineWidth=pw(0.35); x.beginPath(); x.arc(px(0),px(0),pw(4.2),0,7); x.stroke();
  if(!groundTex){ groundTex=new THREE.CanvasTexture(c); groundTex.encoding=THREE.sRGBEncoding; groundTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); const ground=new THREE.Mesh(new THREE.PlaneGeometry(W2,W2),new THREE.MeshLambertMaterial({map:groundTex})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground); }
  else { groundTex.image=c; groundTex.needsUpdate=true; }
}
paintGround();
const decor=[];
function cullDecor(){ for(const d of decor){ let any=false; d.items.forEach((it,i)=>{ if(it.gone||!nearBase(it.x,it.z,2.5)) return; it.gone=true; any=true; vp.set(it.x,-5,it.z); vs.set(0.001,0.001,0.001); q.identity(); m4.compose(vp,q,vs); d.im.setMatrixAt(i,m4); }); if(any) d.im.instanceMatrix.needsUpdate=true; } }
(function(){
  const rocks=[]; for(let i=0;i<260;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(nearBase(x,z,3)||roadDist(x,z)<3.5) continue; rocks.push({x,y:0.1,z,ry:rand(0,6),sx:rand(.4,1.4),sy:rand(.3,.8),sz:rand(.4,1.4),c:Math.random()<.5?0xc9c2b4:0xa8a196}); }
  decor.push({im:instanced(G.dod,mat(0xffffff),rocks),items:rocks});
  const bushGeo=mergeGeos([new THREE.SphereGeometry(0.6,8,6).translate(0,0.4,0),new THREE.SphereGeometry(0.45,8,6).translate(0.45,0.35,0.2),new THREE.SphereGeometry(0.42,8,6).translate(-0.4,0.3,-0.15)]);
  const bushes=[]; for(let i=0;i<340;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(!freeSpot(x,z,0.5)) continue; bushes.push({x,y:0,z,ry:rand(0,6),s:rand(.7,1.3),c:Math.random()<.5?0x5fae5a:0x7cb75a}); }
  decor.push({im:instanced(bushGeo,mat(0xffffff),bushes),items:bushes});
  const grass=[]; for(let i=0;i<1100;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(!freeSpot(x,z,0)) continue; grass.push({x,y:0.18,z,ry:rand(0,6),rz:rand(-.25,.25),s:rand(.6,1.3),c:Math.random()<.5?0x9fd07a:0x86bf64}); }
  decor.push({im:instanced(new THREE.ConeGeometry(0.22,0.5,4),mat(0xffffff),grass,false),items:grass});
  const hills=[]; for(let i=0;i<40;i++){ const a=i/40*6.283; const r=rand(104,120); hills.push({x:Math.cos(a)*r,y:-1,z:Math.sin(a)*r,sx:rand(12,22),sy:rand(7,14),sz:rand(12,22),c:Math.random()<.5?0xc9b48e:0xb7a17a}); }
  instanced(G.sph,mat(0xffffff),hills,false);
})();
