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
const SAVE_KEY='ormanin-bekcisi-v8'; const OLD_KEY='ormanin-bekcisi-v7';
const WAVES=5; const MAXL=10; const LEVELS=10;
const LV0={axe:0,bag:0,feet:0,worker:0,stoneWorker:0,sword:0,wall:0,soldier:0,expand:0,trader:0,towerTrain:0,magnet:0,collector:0,gateLv:0,range:0,depotLv:0,workerSpd:0,price:0,soldierTrain:0,cannonTrain:0};
const SIDES=['N','E','S','W']; const SIDE_TR={N:'Kuzey',E:'Doğu',S:'Güney',W:'Batı'};
function defaultTowers(){ const t=[{k:'a',side:'C',a:0,lvl:0,fixed:true}]; for(const s of SIDES) for(const a of [-5.2,5.2]) t.push({k:'a',side:s,a,lvl:0,fixed:true}); return t; }
// Kalıcı (meta): açılan bölüm, yıldızlar, taç, kalıcı güçlendirmeler. Bölümlük (run): her bölüm başında sıfırlanır.
const META0={unlocked:1,stars:{},crowns:0,up:{gold:0,wall:0,arrow:0},dailyDate:'',streak:0,fails:{}};
function runState(level){ return { fish:0, meat:0, planks:0, iron:0, ore:0, herb:0, crystal:0, rg:{}, revealed:{forest:true}, book:{fish:{},hunt:{},boss:{},chest:{}}, lastSeen:0, coins:0, bank:0, logs:0, stones:0, stone:0, loot:0, wood:0, stall:0, wave:1, level:level||1, gateHp:150, treesCut:0, kills:0, lv:Object.assign({},LV0), towers:defaultTowers(), paid:{}, cards:{}, cardOffer:null, minGate:1, started:false }; }
const S = Object.assign(runState(1), { muted:false, meta:JSON.parse(JSON.stringify(META0)) });
const store={ get:k=>{ let v=null; try{ if(CG.sdk&&CG.sdk.data) v=CG.sdk.data.getItem(k); }catch(e){} if(v==null){ try{ v=localStorage.getItem(k); }catch(e){} } return v; }, set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} try{ if(CG.sdk&&CG.sdk.data) CG.sdk.data.setItem(k,v); }catch(e){} } };
function load(){ try{ const j=JSON.parse(store.get(SAVE_KEY)); if(j){ Object.assign(S,j); S.lv=Object.assign({},LV0, j.lv||{}); S.towers=Array.isArray(j.towers)&&j.towers.length>=9? j.towers : defaultTowers(); S.paid=j.paid||{}; S.cards=j.cards||{}; S.meta=Object.assign(JSON.parse(JSON.stringify(META0)),j.meta||{}); S.meta.up=Object.assign({gold:0,wall:0,arrow:0},S.meta.up||{}); return; } }catch(e){}
  // eski kayıttan geçiş: taç ve kalıcı güçlendirmeler korunur, krallık 1. seferden kurulur
  try{ const o=JSON.parse(store.get(OLD_KEY)); if(o&&o.meta){ S.meta.crowns=o.meta.crowns||0; S.meta.up=Object.assign({gold:0,wall:0,arrow:0},o.meta.up||{}); S.muted=!!o.muted; S.meta.dailyDate=o.meta.dailyDate||''; S.meta.streak=o.meta.streak||0; } }catch(e){} }
function save(){ if(S.started) S.lastSeen=Date.now(); store.set(SAVE_KEY, JSON.stringify(S)); }
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
  chopRate:()=>4.0*(1+0.3*cc('axe'))*(isWinter()?0.72:1), treeHits:()=>1, logsPerTree:()=>4+2*cc('lumber'),
  cap:()=>40+15*S.lv.feet, speed:()=>(8.4+0.5*S.lv.feet)*(1+0.15*cc('pony')), magnet:()=>3.8*(1+0.6*cc('magnet')), lootPrice:()=>(8+gw()*1.5+3*S.lv.trader)*(1+0.3*cc('trade')), buyTime:()=>Math.max(0.25,0.7-0.08*S.lv.trader),
  swordDmg:()=>9*(1+0.4*cc('sword')), swordRange:()=>2.9+0.3*cc('sword'),
  gateMax:()=>Math.round((150+120*S.lv.wall)*(1+0.25*cc('wall'))*(1+0.1*mu('wall'))*(1+0.12*(S.lv.ironWall||0))), towerDmg:l=>(5+3*(l-1))*(1+0.25*cc('arrow'))*(1+0.08*mu('arrow'))*(1+0.1*(S.lv.ironArrow||0)), towerRange:()=>17+3*cc('range'), towerRate:()=>1+0.2*cc('rate'), cannonDmg:l=>(14+7*(l-1))*(1+0.4*cc('powder')), soldierDmg:()=>8*(1+0.4*cc('drill')),
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
  ball:mat(0x2a2d33), smoke:mat(0x777777), rock:mat(0xaeb6c6), rockLight:mat(0xe3e7ee), fish:mat(0x9fc3d8), fishGold:mat(0xffc93a,{emissive:0x6a4a00}), meat:mat(0xc9594a), water:new THREE.MeshLambertMaterial({color:0x3d9ccc,transparent:true,opacity:0.93}), waterLight:new THREE.MeshBasicMaterial({color:0x8fd6f0,transparent:true,opacity:0.35,depthWrite:false}), sand:mat(0xe8d3a2), reed:mat(0x5c9a4a), lily:mat(0x4f9a52), cloud:new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.96}), net:mat(0xd9c49a), buoy:mat(0xe8503a), rope2:mat(0x8a6a3a), roof:mat(0x6e4a3a), roofDark:mat(0x553628), canvas:mat(0xf1e6cf), canvasDark:mat(0x5b8f6a), rope:mat(0xc9a86a),
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
// Bölgeler: her sefer kalenin çevresinde yeni bir bölge açar (merkez, yarıçap, ağaçsız alan)
const REG={
  lake:{sefer:2,name:'Gümüş Göl',job:'Balık tutma',c:[40,-40],r:11,clear:23},
  meadow:{sefer:3,name:'Geyik Çayırı',job:'Av ve tütsühane',c:[-42,42],r:14,clear:25},
  quarry:{sefer:4,name:'Taş Ocağı',job:'Taş kesme tezgâhı',c:[40,40],r:12,clear:22},
  river:{sefer:5,name:'Nehir',job:'Su değirmeni ve kereste',c:[-42,-42],r:12,clear:22},
  swamp:{sefer:6,name:'Sisli Bataklık',job:'Fener, mantar ve iksir kazanı',c:[-70,-22],r:12,clear:22},
  iron:{sefer:7,name:'Demir Dağı',job:'Maden, demirci ocağı ve delici ok',c:[24,-70],r:12,clear:22},
  coast:{sefer:8,name:'Kıyı',job:'Sandıklar, deniz feneri ve ticaret teknesi',c:[72,70],r:14,clear:26},
  snow:{sefer:9,name:'Karlı Geçit',job:'Kristal madeni ve kuyumcu',c:[-72,72],r:12,clear:22},
  dark:{sefer:10,name:'Kara Kale',job:'Son kuşatma',c:[0,-86],r:9,clear:20},
};
const QUARRIES=[[41,39],[49,47]];
// Yük arabası yolları (ağaçsız, toprak) ve nehir
const CART_PATHS=[[[34,29],[32,14],[31,4]],[[-37,-35],[-33,-18],[-31,-4]],[[17,-54],[9,-38],[4,-28]]];
const SEA={x:100,z:100,r:30};
const RIVER=[[-100,-30],[-70,-36],[-52,-40],[-42,-42],[-38,-52],[-34,-70],[-30,-100]];
function polyDist(P,x,z){ let best=1e9; for(let i=0;i<P.length-1;i++){ const [ax,az]=P[i],[bx,bz]=P[i+1]; const dx=bx-ax,dz=bz-az; const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1); const d=Math.hypot(ax+dx*t-x,az+dz*t-z); if(d<best) best=d; } return best; }
function nearQuarry(x,z,m){ return QUARRIES.some(qq=>Math.hypot(x-qq[0],z-qq[1])<m); }
function inRegClear(x,z){ for(const k in REG){ const R=REG[k]; if(Math.hypot(x-R.c[0],z-R.c[1])<R.clear) return true; } return false; }
function freeSpot(x,z,pad){ return !nearBase(x,z,5.5) && roadDist(x,z)>4.2+pad && !nearQuarry(x,z,7.5) && !inRegClear(x,z) && polyDist(RIVER,x,z)>4.5+pad && Math.hypot(x-SEA.x,z-SEA.z)>SEA.r+3+pad && !CART_PATHS.some(P=>polyDist(P,x,z)<3+pad); }

let groundTex=null;
function paintGround(){
  const N=2048, c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d');
  const W2=WORLD*2; const px=v=>(v+WORLD)/W2*N; const pw=v=>v/W2*N;
  x.fillStyle='#d7b989'; x.fillRect(0,0,N,N);
  for(let i=0;i<6000;i++){ const r=rand(8,60); x.fillStyle=`hsla(${rand(32,44)},${rand(38,52)}%,${rand(58,72)}%,${rand(.12,.35)})`; x.beginPath(); x.ellipse(rand(0,N),rand(0,N),r,r*rand(.5,1),rand(0,3),0,7); x.fill(); }
  for(let i=0;i<500;i++){ const r=rand(30,110); x.fillStyle=`hsla(${rand(95,115)},${rand(40,55)}%,${rand(48,60)}%,${rand(.35,.7)})`; x.beginPath(); x.ellipse(rand(0,N),rand(0,N),r,r*rand(.5,1),rand(0,3),0,7); x.fill(); }
  x.lineCap='round'; x.lineJoin='round';
  for(const s of SIDES){ const P=roadPath(s); for(const [col,w] of [['#c9a26d',6],['#e3c898',3.6]]){ x.strokeStyle=col; x.lineWidth=pw(w); x.beginPath(); P.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke(); } }
  x.lineCap='round'; x.lineJoin='round'; for(const P of CART_PATHS){ for(const [col,w] of [['#c9a26d',3.2],['#dcc093',1.8]]){ x.strokeStyle=col; x.lineWidth=pw(w); x.beginPath(); P.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke(); } }
  for(const [col,w] of [['#d8c28f',7.5],['#3d8fc0',5],['#5fb0dc',3],['#8fd0ee',0.9]]){ x.strokeStyle=col; x.lineWidth=pw(w); x.beginPath(); RIVER.forEach(([a,b],i)=> i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b))); x.stroke(); }
  // son bölgelerin zemini: bataklık yosunu, dağ eteği, sahil kumu, kar, kavrulmuş toprak
  const blob=(cx,cz,r,cols,n,sz)=>{ for(let i=0;i<n;i++){ const a=rand(0,6.283), rr=Math.sqrt(Math.random())*r; x.fillStyle=cols[i%cols.length]; x.beginPath(); x.ellipse(px(cx+Math.cos(a)*rr),px(cz+Math.sin(a)*rr),pw(rand(sz*0.5,sz)),pw(rand(sz*0.4,sz*0.8)),rand(0,3),0,7); x.fill(); } };
  { const R=REG.swamp; blob(R.c[0],R.c[1],R.clear-3,['rgba(88,112,64,.55)','rgba(70,92,54,.5)','rgba(104,120,72,.45)'],160,5); }
  { const R=REG.iron; blob(R.c[0],R.c[1],R.clear-3,['rgba(150,136,120,.55)','rgba(128,114,100,.5)','rgba(168,154,136,.45)'],160,5); }
  { const R=REG.snow; blob(R.c[0],R.c[1],R.clear,['rgba(246,250,252,.9)','rgba(226,238,246,.85)','rgba(255,255,255,.9)'],260,6); blob(R.c[0],R.c[1],R.clear+10,['rgba(240,246,250,.45)'],120,5); }
  { const R=REG.dark; blob(R.c[0]-2,R.c[1]-4,R.clear-2,['rgba(96,86,84,.55)','rgba(76,68,70,.5)'],140,5); }
  x.fillStyle='#ecd9a8'; x.beginPath(); x.arc(px(SEA.x),px(SEA.z),pw(SEA.r+6),0,7); x.fill(); blob(SEA.x,SEA.z,SEA.r+6,['rgba(222,196,140,.4)','rgba(246,230,190,.5)'],120,3); x.fillStyle='#2f7fb4'; x.beginPath(); x.arc(px(SEA.x),px(SEA.z),pw(SEA.r),0,7); x.fill();
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
  const rocks=[]; for(let i=0;i<180;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(nearBase(x,z,3)||roadDist(x,z)<3.5||nearQuarry(x,z,12)) continue; rocks.push({x,y:0.05,z,ry:rand(0,6),sx:rand(.3,.75),sy:rand(.15,.35),sz:rand(.3,.75),c:Math.random()<.5?0x8fa37a:0x7d9270}); }
  decor.push({im:instanced(G.dod,mat(0xffffff),rocks),items:rocks});
  const bushGeo=mergeGeos([new THREE.SphereGeometry(0.6,8,6).translate(0,0.4,0),new THREE.SphereGeometry(0.45,8,6).translate(0.45,0.35,0.2),new THREE.SphereGeometry(0.42,8,6).translate(-0.4,0.3,-0.15)]);
  const bushes=[]; for(let i=0;i<340;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(!freeSpot(x,z,0.5)) continue; bushes.push({x,y:0,z,ry:rand(0,6),s:rand(.7,1.3),c:Math.random()<.5?0x5fae5a:0x7cb75a}); }
  decor.push({im:instanced(bushGeo,mat(0xffffff),bushes),items:bushes});
  const grass=[]; for(let i=0;i<1100;i++){ const x=rand(-WORLD,WORLD), z=rand(-WORLD,WORLD); if(!freeSpot(x,z,0)) continue; grass.push({x,y:0.18,z,ry:rand(0,6),rz:rand(-.25,.25),s:rand(.6,1.3),c:Math.random()<.5?0x9fd07a:0x86bf64}); }
  decor.push({im:instanced(new THREE.ConeGeometry(0.22,0.5,4),mat(0xffffff),grass,false),items:grass});
  const hills=[]; for(let i=0;i<48;i++){ const a=i/48*6.283; const deg=a*180/Math.PI; if(deg>20&&deg<70) continue; const diag=Math.abs(Math.sin(2*a)); const r=rand(104,118)+diag*26; const snowy=deg>108&&deg<162; hills.push({x:Math.cos(a)*r,y:-1,z:Math.sin(a)*r,sx:rand(12,22),sy:rand(7,14),sz:rand(12,22),c:snowy?(Math.random()<.5?0xeef3f6:0xd6e2ea):(Math.random()<.5?0xc9b48e:0xb7a17a)}); }
  instanced(G.sph,mat(0xffffff),hills,false);
})();

// ---------- Sur (10 seviye, her seviyede farklı görünüm) ----------
let wallGroup=null; let wallPop=1;
function wallSegs(){ const h=H, g=2.6; return [[-h,-h,-g,-h],[g,-h,h,-h],[-h,h,-g,h],[g,h,h,h],[-h,-h,-h,-g],[-h,g,-h,h],[h,-h,h,-g],[h,g,h,h]]; }
function buildWalls(level){
  if(wallGroup) scene.remove(wallGroup); wallGroup=new THREE.Group(); scene.add(wallGroup); wallPop=0;
  const add=(im)=>{ scene.remove(im); wallGroup.add(im); return im; };
  const segs=wallSegs();
  if(level<=3){
    const h0=[1.6,2.2,2.6,3.0][level]; const logs=[]; for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),n=Math.round(len/0.5); for(let i=0;i<=n;i++){ const h=h0+rand(-0.15,0.2); logs.push({x:x0+dx*i/n,y:h/2,z:z0+dz*i/n,sx:.27,sy:h,sz:.27,c:level>=2?(Math.random()<.5?0x8a5a2c:0x76481f):(Math.random()<.5?0x9a6a3a:0x86582c)}); } }
    const tips=logs.map(l=>({x:l.x,y:l.sy+0.18,z:l.z,sx:.27,sy:.36,sz:.27,c:l.c}));
    add(instanced(G.cyl,mat(0xffffff),logs)); add(instanced(G.cone,mat(0xffffff),tips));
    if(level>=1){ const rails=[]; for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz); const ry=-Math.atan2(dz,dx); rails.push({x:(x0+x1)/2,y:h0*0.55,z:(z0+z1)/2,ry,sx:len,sy:.14,sz:.36,c:0x7d5124}); if(level>=3) rails.push({x:(x0+x1)/2,y:h0*0.85,z:(z0+z1)/2,ry,sx:len,sy:.14,sz:.36,c:0x5a3a1e}); } add(instanced(G.box,mat(0xffffff),rails)); }
  } else {
    const tier=level<=6?0:1; const Hh=[2.6,3.0,3.4,3.6,3.9,4.2,4.6][level-4]; const col=tier?0x8d94a4:0xa8a49c, col2=tier?0x6f7686:0x9c9890;
    const blocks=[], crens=[];
    for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz); const ry=-Math.atan2(dz,dx); blocks.push({x:(x0+x1)/2,y:Hh/2,z:(z0+z1)/2,ry,sx:len+0.6,sy:Hh,sz:0.9+0.15*tier,c:col}); const n=Math.round(len/1.2); if(level>=5) for(let i=0;i<=n;i++){ crens.push({x:x0+dx*i/n,y:Hh+0.3,z:z0+dz*i/n,ry,sx:.6,sy:.6,sz:1.0+0.15*tier,c:col2}); }
      const m=Math.max(1,Math.round(len)); for(let i=0;i<m;i++){ blocks.push({x:x0+dx*(i+0.5)/m,y:rand(0.4,Hh-0.4),z:z0+dz*(i+0.5)/m,ry,sx:rand(.5,1.1),sy:.35,sz:0.94+0.15*tier,c:Math.random()<.5?col2:col}); }
      if(level>=9){ blocks.push({x:(x0+x1)/2,y:Hh-0.15,z:(z0+z1)/2,ry,sx:len+0.6,sy:0.14,sz:1.0+0.15*tier,c:0xf2b43c}); } }
    add(instanced(G.box,mat(0xffffff),blocks)); if(crens.length) add(instanced(G.box,mat(0xffffff),crens));
    if(level>=7){ for(const [x,z] of [[-H,-H],[H,-H],[-H,H],[H,H]]){ const t=mesh(G.cyl,tier?M.stoneBlue:M.stone,1.1,Hh+2,1.1); t.position.set(x,(Hh+2)/2,z); const cap=mesh(G.cone,level>=10?M.flag:M.banner,1.5,1.5,1.5); cap.position.set(x,Hh+2.7,z); const fl=mesh(G.box,M.flag,0.7,0.5,0.05); fl.position.set(x+0.35,Hh+3.6,z); const pole=mesh(G.cyl,M.handle,0.05,1.6,0.05); pole.position.set(x,Hh+3.7,z); wallGroup.add(t,cap,fl,pole); } }
  }
  for(const s of SIDES){ for(const a of [-3.6,3.6]){ const [x,z]=sidePos(s,a,0.4); const p=mesh(G.cyl,M.woodDark,0.08,1.6,0.08); p.position.set(x,0.8,z); const f=mesh(G.sph,M.gold,0.18,0.26,0.18,false); f.position.set(x,1.75,z); wallGroup.add(p,f); } }
}
buildWalls(S.lv.wall);
const torches=[]; for(const s of SIDES){ for(const a of [-3.6,3.6]){ const l=new THREE.PointLight(0xffb15a,0.5,8); scene.add(l); torches.push({l,s,a}); } }
function placeTorches(){ for(const t of torches){ const [x,z]=sidePos(t.s,t.a,0.4); t.l.position.set(x,2,z); } } placeTorches();
// ---------- Dört kapı ----------
const gates={}; // side -> {g,L,R,open}
function buildGates(level){
  const tier=level<4?0:level<7?1:2; const postM=tier===0?M.woodDark:tier===1?M.stone:M.stoneBlue; const leafM=tier===2?M.iron:M.gate; const bandM=tier===0?M.woodDark:M.metal;
  for(const s of SIDES){ if(gates[s]) scene.remove(gates[s].g); const g=new THREE.Group();
    function post(x){ const t=new THREE.Group(); const b=mesh(tier?G.box:G.cyl,postM,tier?0.8:0.42,3.4+0.4*tier,tier?0.8:0.42); b.position.y=(3.4+0.4*tier)/2; const cap=mesh(tier?G.box:G.cone,tier===2?M.gold:postM,tier?0.95:0.42,0.5,tier?0.95:0.42); cap.position.y=3.6+0.4*tier; t.add(b,cap); t.position.x=x; return t; }
    const top=mesh(G.box,postM,5.4,0.35+0.2*tier,0.5+0.3*tier); top.position.y=3.2+0.3*tier;
    function leaf(sign){ const h=new THREE.Group(); h.position.set(sign*-2.3,0,0); for(let i=0;i<5;i++){ const d=mesh(G.cyl,leafM,0.2,2.4,0.2); d.position.set(sign*(0.25+i*0.45),1.2,0); const c=mesh(G.cone,leafM,0.2,0.3,0.2); c.position.set(sign*(0.25+i*0.45),2.55,0); h.add(d,c);} const b1=mesh(G.box,bandM,2.2,0.16,0.28); b1.position.set(sign*1.15,0.8,0.1); const b2=b1.clone(); b2.position.y=1.9; h.add(b1,b2); if(tier>=1){ for(let i=0;i<4;i++){ const r=mesh(G.sph,M.metal,0.07,0.07,0.07,false); r.position.set(sign*(0.4+i*0.5),0.8,0.26); h.add(r); const r2=r.clone(); r2.position.y=1.9; h.add(r2);} } return h; }
    const L=leaf(1), R=leaf(-1); g.add(post(-2.6),post(2.6),top,L,R);
    if(tier>=1){ const arch=mesh(G.box,postM,6.2,0.6,0.9+0.3*tier); arch.position.y=3.9+0.3*tier; g.add(arch); }
    if(tier===2){ for(const x of [-2.6,2.6]){ const fl=mesh(G.box,M.banner,0.06,1.2,0.7); fl.position.set(x,4.6,0.5); g.add(fl);} }
    const [x,z]=sidePos(s,0,0); g.position.set(x,0,z); g.rotation.y=(s==='E'||s==='W')?Math.PI/2:0; scene.add(g); gates[s]={g,L,R,open:gates[s]?gates[s].open:0,x,z}; }
}
buildGates(S.lv.wall);
function placeGates(){ for(const s of SIDES){ const [x,z]=sidePos(s,0,0); gates[s].g.position.set(x,0,z); gates[s].x=x; gates[s].z=z; } }
const depot=new THREE.Group(); const pileLogs=[];
// Kereste avlusu: taş döşeme, arkada çit, ortada A-raf ve tomruklar, önde taş kasası, kütük+balta, tabela (üstten okunur, çatı yok)
(function(){
  const slab=mesh(G.box,M.stone,4.4,0.22,4.4); slab.position.y=0.11; depot.add(slab);
  const floor=mesh(G.box,M.plank,4.0,0.12,4.0); floor.position.y=0.26; depot.add(floor);
  for(let i=0;i<7;i++){ const line=mesh(G.box,M.woodDark,4.0,0.13,0.05,false); line.position.set(0,0.27,-1.8+i*0.6); depot.add(line); }
  // arka ve yan çit (köşeye bakan iki kenar)
  for(let i=0;i<5;i++){ const x=-2.0+i*1.0; const post=mesh(G.cyl,M.woodDark,0.12,1.3,0.12); post.position.set(x,0.85,-2.05); depot.add(post); const post2=mesh(G.cyl,M.woodDark,0.12,1.3,0.12); post2.position.set(2.05,0.85,-2.0+i*1.0); depot.add(post2); }
  for(const y of [0.75,1.25]){ const rail=mesh(G.box,M.wood,4.2,0.12,0.1); rail.position.set(0,y,-2.05); depot.add(rail); const rail2=mesh(G.box,M.wood,0.1,0.12,4.2); rail2.position.set(2.05,y,0); depot.add(rail2); }
  // tomruk rafı: iki A-destek
  for(const x of [-1.55,1.55]){ for(const sgn of [-1,1]){ const a=mesh(G.box,M.woodDark,0.14,2.2,0.14); a.position.set(x,1.05,-0.6+sgn*0.5); a.rotation.x=sgn*0.42; depot.add(a); } const bar=mesh(G.box,M.woodDark,0.16,0.16,1.5); bar.position.set(x,0.5,-0.6); depot.add(bar); }
  const beam=mesh(G.box,M.woodDark,3.4,0.14,0.14); beam.position.set(0,2.05,-0.6); depot.add(beam);
  // taş kasası (sağ ön)
  const crate=mesh(G.box,M.woodDark,1.7,0.12,1.2); crate.position.set(1.1,0.35,1.1); depot.add(crate); for(const z of [0.55,1.65]){ const w=mesh(G.box,M.wood,1.7,0.55,0.1); w.position.set(1.1,0.6,z); depot.add(w); } for(const x of [0.3,1.9]){ const w=mesh(G.box,M.wood,0.1,0.55,1.2); w.position.set(x,0.6,1.1); depot.add(w); }
  // kütük ve balta (sol ön)
  const stump=mesh(G.cyl,M.trunk,0.42,0.6,0.42); stump.position.set(-1.25,0.6,1.2); const ring=mesh(G.cyl,M.logEnd,0.36,0.04,0.36,false); ring.position.set(-1.25,0.92,1.2); const axH=mesh(G.cyl,M.handle,0.05,0.9,0.05); axH.position.set(-1.05,1.3,1.2); axH.rotation.z=-0.5; const axB=mesh(G.box,M.metal,0.12,0.36,0.26); axB.position.set(-1.3,1.55,1.2); depot.add(stump,ring,axH,axB);
  // tabela: köşe direğinde, ön tarafa bakar
  const sp=mesh(G.cyl,M.woodDark,0.1,3.0,0.1); sp.position.set(-1.9,1.5,-1.85); depot.add(sp); const sign=mesh(G.box,M.plank,1.8,0.7,0.12); sign.position.set(-1.2,2.75,-1.75); const signL=mesh(G.log,M.log,0.7,0.7,0.7,false); signL.rotation.z=Math.PI/2; signL.position.set(-1.6,2.75,-1.62); const signL2=signL.clone(); signL2.position.x=-0.8; const signBar=mesh(G.box,M.woodDark,1.9,0.1,0.14); signBar.position.set(-1.2,3.15,-1.75); depot.add(sign,signL,signL2,signBar);
  depot.rotation.y=ROT45; depot.position.copy(DEPOT); scene.add(depot);
})();
const pileStones=[]; function setStonePile(n){ n=Math.min(n,18); while(pileStones.length<n){ const i=pileStones.length; const row=Math.floor(i/6), col=i%6; const b=mesh(G.box,M.rock,0.34,0.26,0.34); b.position.set(0.45+col*0.26+(row%2)*0.1,0.5+row*0.24,0.9+(col%2)*0.32); b.rotation.y=rand(-.4,.4); depot.add(b); pileStones.push(b);} while(pileStones.length>n){ depot.remove(pileStones.pop()); } }
function setPile(n){ n=Math.min(n,24); while(pileLogs.length<n){ const i=pileLogs.length; const row=Math.floor(i/6), col=i%6; const l=mesh(G.log,M.log,1.2,1.2,1.2); l.rotation.z=Math.PI/2; l.position.set(-1.3+col*0.52+(row%2)*0.26,0.62+row*0.4,-0.6); depot.add(l); pileLogs.push(l);} while(pileLogs.length>n){ depot.remove(pileLogs.pop()); } }

// ---------- Ağaçlar (geniş orman) ----------
const trees=[]; let treeTrunk, treeCrown; const TRUNK_H=1.7;
(function(){
  const cell=new Map(); const ck=(x,z)=>Math.floor(x/3)+','+Math.floor(z/3);
  const near=(x,z,r)=>{ const cx=Math.floor(x/3), cz=Math.floor(z/3); for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const arr=cell.get((cx+i)+','+(cz+j)); if(!arr) continue; for(const t of arr){ if(Math.hypot(t.x-x,t.z-z)<r) return true; } } return false; };
  const groves=[]; for(let i=0;i<12;i++){ const a=i/12*6.283+rand(-.2,.2); const r=rand(34,78); groves.push([Math.cos(a)*r,Math.sin(a)*r,rand(13,20)]); }
  let tries=0;
  while(trees.length<2600&&tries<260000){ tries++;
    const x=rand(-WORLD+2,WORLD-2), z=rand(-WORLD+2,WORLD-2);
    if(!freeSpot(x,z,1.5)) continue;
    const grove=groves.some(g=>Math.hypot(x-g[0],z-g[1])<g[2]);
    if(!grove&&Math.random()<0.72) continue;
    if(near(x,z,grove?1.8:3.2)) continue;
    const t={x,z,s:rand(0.85,1.3),ry:rand(0,6.28),ci:Math.floor(Math.random()*3),hp:D.treeHits(),alive:true,gone:false,shake:0,falling:0,regrow:0,claimed:null,dirty:true};
    trees.push(t); const k=ck(x,z); if(!cell.has(k)) cell.set(k,[]); cell.get(k).push(t);
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
  if(t.gone){ vp.set(t.x,-3,t.z); vs.set(0.0001,0.0001,0.0001); q.identity(); m4.compose(vp,q,vs); treeTrunk.setMatrixAt(i,m4); treeCrown.setMatrixAt(i,m4); return; }
  if(t.falling>0){ const k=Math.min(1,t.falling/0.55); fall=k*k*1.5; }
  if(!t.alive&&t.falling===0){ trunkY=0.22; crownVis=0; }
  if(t.regrow>0){ const T=12; if(t.regrow>T){ const k=Math.min(1,(t.regrow-T)/1.0); sc=0.05+0.95*(1-Math.pow(1-k,3)); trunkY=sc; crownVis=sc; } }
  if(t.shake>0) shakeZ=Math.sin(t.shake*45)*0.09;
  vp.set(t.x,0,t.z); e3.set(fall,t.ry,0,'YXZ'); q.setFromEuler(e3); vs.set(t.s*sc,t.s*trunkY,t.s*sc); m4.compose(vp,q,vs); treeTrunk.setMatrixAt(i,m4);
  e3.set(fall,t.ry,shakeZ,'YXZ'); q.setFromEuler(e3); const cs=t.s*crownVis; vs.set(cs,cs,cs); if(crownVis===0) vs.set(0.0001,0.0001,0.0001); m4.compose(vp,q,vs); treeCrown.setMatrixAt(i,m4);
}
function cullTrees(){ let any=false; trees.forEach((t,i)=>{ if(!t.gone&&nearBase(t.x,t.z,5.5)){ t.gone=true; t.culled=true; t.alive=false; t.claimed=null; writeTree(i); any=true; } }); if(any){ treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true; } }
cullTrees(); trees.forEach((t,i)=>writeTree(i)); treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true;
function updateTrees(dt){ let any=false; trees.forEach((t,i)=>{ if(t.gone) return; let d=false;
  if(t.shake>0){ t.shake-=dt; d=true; }
  if(t.falling>0){ t.falling+=dt; d=true; if(t.falling>0.9){ t.falling=0; t.regrow=0.001; t.claimed=null; } }
  if(t.regrow>0){ t.regrow+=dt; if(t.regrow>12) d=true; if(t.regrow>13){ t.regrow=0; t.alive=true; t.hp=D.treeHits(); d=true; } }
  if(d||t.dirty){ t.dirty=false; writeTree(i); any=true; } });
  if(any){ treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true; } }
function nearestTree(pos,range,forWorker){ let best=null,bd=range; for(const t of trees){ if(!t.alive||t.falling>0||t.gone) continue; if(forWorker&&t.claimed&&t.claimed!==forWorker) continue; const d=Math.hypot(t.x-pos.x,t.z-pos.z); if(d<bd){bd=d;best=t;} } return best; }
function hitTree(t,byGuy,onLog){ t.hp-=1; t.shake=0.3; t.dirty=true; SFX.chop(); burst(new THREE.Vector3(t.x,1.2*t.s,t.z),6,M.logEnd,1); burst(new THREE.Vector3(t.x,2.4*t.s,t.z),5,M.bush,0.5);
  if(t.hp<=0){ t.alive=false; t.falling=0.001; S.treesCut=(S.treesCut||0)+1; questEvent('chop'); SFX.fall(); const n=D.logsPerTree(); for(let i=0;i<n;i++){ setTimeout(()=>{ fly(new THREE.Vector3(t.x+rand(-.6,.6),1.0,t.z+rand(-.6,.6)),byGuy.g,onLog,true,4); }, 300+i*70); } } }
function pushOutOfTrunks(p,r){ for(const t of trees){ if(t.gone) continue; if(!t.alive&&t.falling===0&&t.regrow<12) continue; const dx=p.x-t.x, dz=p.z-t.z; if(Math.abs(dx)>r||Math.abs(dz)>r) continue; const d=Math.hypot(dx,dz); if(d<r&&d>0.001){ p.x=t.x+dx/d*r; p.z=t.z+dz/d*r; } } }
function pushOutOfCenter(p,r){ if(S.towers[0].lvl<1) return; const d=Math.hypot(p.x,p.z); if(d<r&&d>0.001){ p.x=p.x/d*r; p.z=p.z/d*r; } }

// ---------- Taş ocakları ----------
const rocks=[]; let rockMesh;
(function(){ for(const [qx,qz] of QUARRIES){ for(let i=0;i<8;i++){ const a=i/8*6.283+rand(-.3,.3); const r=i===0?0:rand(2.2,4.6); rocks.push({x:qx+Math.cos(a)*r,z:qz+Math.sin(a)*r,s:rand(1.1,1.8),ry:rand(0,6),hp:3,alive:true,gone:false,shake:0,regrow:0,claimed:null,dirty:true}); } }
  rockMesh=new THREE.InstancedMesh(G.dod,mat(0xffffff),rocks.length); rockMesh.castShadow=true; rockMesh.receiveShadow=true; rockMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rocks.forEach((r,i)=>rockMesh.setColorAt(i,new THREE.Color(Math.random()<.5?0x98a2b6:0xb5bdcc))); scene.add(rockMesh); })();
function writeRock(i){ const r=rocks[i]; let sc=r.gone||(!r.alive&&r.regrow<25)?0.0001:1; if(r.regrow>25){ sc=Math.min(1,(r.regrow-25)/1.5); } const sh=r.shake>0?Math.sin(r.shake*40)*0.06:0; vp.set(r.x,r.s*0.55*sc,r.z); e3.set(sh,r.ry,0); q.setFromEuler(e3); vs.set(r.s*sc,r.s*0.8*sc,r.s*sc); m4.compose(vp,q,vs); rockMesh.setMatrixAt(i,m4); }
function cullRocks(){ let any=false; rocks.forEach((r,i)=>{ if(!r.gone&&nearBase(r.x,r.z,5.5)){ r.gone=true; r.culled=true; r.alive=false; r.claimed=null; writeRock(i); any=true; } }); if(any) rockMesh.instanceMatrix.needsUpdate=true; }
cullRocks(); rocks.forEach((r,i)=>writeRock(i)); rockMesh.instanceMatrix.needsUpdate=true;
function updateRocks(dt){ let any=false; rocks.forEach((r,i)=>{ if(r.gone) return; let d=false; if(r.shake>0){ r.shake-=dt; d=true; } if(!r.alive){ r.regrow+=dt; if(r.regrow>25) d=true; if(r.regrow>26.5){ r.regrow=0; r.alive=true; r.hp=3; d=true; } } if(d||r.dirty){ r.dirty=false; writeRock(i); any=true; } }); if(any) rockMesh.instanceMatrix.needsUpdate=true; }
function nearestRock(pos,range,forWorker){ let best=null,bd=range; for(const r of rocks){ if(!r.alive||r.gone) continue; if(forWorker&&r.claimed&&r.claimed!==forWorker) continue; const d=Math.hypot(r.x-pos.x,r.z-pos.z); if(d<bd){bd=d;best=r;} } return best; }
function hitRock(r,byGuy,onStone){ r.hp-=1; r.shake=0.3; r.dirty=true; SFX.hit(); burst(new THREE.Vector3(r.x,r.s*0.8,r.z),7,M.rockLight,0.9);
  if(r.hp<=0){ r.alive=false; r.regrow=0.001; r.claimed=null; r.dirty=true; SFX.boom(); burst(new THREE.Vector3(r.x,0.8,r.z),14,M.rock,1.1); questEvent('stone',3); for(let i=0;i<3;i++){ setTimeout(()=>{ fly(new THREE.Vector3(r.x+rand(-.6,.6),0.8,r.z+rand(-.6,.6)),byGuy.g,onStone,'stone',4); },200+i*80); } } }
// ---------- Karakterler (chibi) ----------
const helmGeo=mergeGeos([new THREE.SphereGeometry(0.45,10,8).scale(1,0.55,1).translate(0,0.2,0),new THREE.BoxGeometry(0.7,0.12,0.24).translate(0,0.12,0.35)]);
const LOG_MAX=160; const logSlots=[]; for(let i=0;i<LOG_MAX;i++){ const row=Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.1+row*0.3,-0.05-(row%2)*0.06); e3.set(0,rand(-.08,.08),Math.PI/2); q.setFromEuler(e3); vs.set(1,1,1); logSlots.push(new THREE.Matrix4().compose(vp,q,vs)); }
const COIN_STACK=40; const coinSlots=[]; for(let i=0;i<COIN_STACK;i++){ vp.set(rand(-.03,.03),0.08+i*0.15,rand(-.03,.03)); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.75,0.75,0.75); coinSlots.push(new THREE.Matrix4().compose(vp,q,vs)); }
function makePony(){ const g=new THREE.Group(); const body=mesh(G.box,M.pony,0.7,0.62,1.35); body.position.set(0,0.78,-0.05); const neck=mesh(G.box,M.pony,0.4,0.5,0.4); neck.position.set(0,1.1,0.6); neck.rotation.x=-0.5; const head=mesh(G.box,M.pony,0.42,0.42,0.62); head.position.set(0,1.32,0.95); const snout=mesh(G.box,M.ponyLight,0.3,0.24,0.24); snout.position.set(0,1.22,1.3); const e1=mesh(G.sph,M.pupil,0.05,0.06,0.04,false); e1.position.set(-0.19,1.4,1.1); const e2=e1.clone(); e2.position.x=0.19; const earL=mesh(G.cone,M.pony,0.09,0.25,0.09); earL.position.set(-0.15,1.62,0.85); const earR=earL.clone(); earR.position.x=0.15; const mane=mesh(G.box,M.mane,0.14,0.5,0.7); mane.position.set(0,1.28,0.5); mane.rotation.x=-0.5; const tail=mesh(G.box,M.mane,0.14,0.6,0.16); tail.position.set(0,0.85,-0.78); tail.rotation.x=0.4; const saddle=mesh(G.box,M.banner,0.76,0.12,0.6); saddle.position.set(0,1.12,-0.05); g.add(body,neck,head,snout,e1,e2,earL,earR,mane,tail,saddle); const legs=[]; for(const [x,z] of [[-0.24,0.42],[0.24,0.42],[-0.24,-0.5],[0.24,-0.5]]){ const l=new THREE.Group(); l.position.set(x,0.55,z); const lm=mesh(G.box,M.ponyDark,0.18,0.55,0.2); lm.position.y=-0.28; const hoof=mesh(G.box,M.mane,0.2,0.1,0.22); hoof.position.y=-0.56; l.add(lm,hoof); g.add(l); legs.push(l);} return {g,legs,tail,t:rand(0,6)}; }
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
  let pony=null; if(kind==='player'){ pony=makePony(); g.add(pony.g); root.position.y=0.95; legL.rotation.x=-1.3; legR.rotation.x=-1.3; legL.position.set(-0.3,0.42,0.1); legR.position.set(0.3,0.42,0.1); }
  const tool=new THREE.Group(); tool.position.set(0,-0.34,0.05);
  if(kind==='player'||kind==='soldier'||kind==='enemy'){ const bl=mesh(G.box,kind==='enemy'?M.metal:M.blade,0.1,0.06,1.1); bl.position.z=0.7; const guard=mesh(G.box,M.gold,0.34,0.08,0.08); guard.position.z=0.18; const grip=mesh(G.cyl,M.handle,0.05,0.3,0.05); grip.rotation.x=Math.PI/2; grip.position.z=0.02; tool.add(bl,guard,grip); if(kind==='enemy'){ const sh=mesh(G.cyl,M.enemyDark,0.36,0.06,0.36); sh.rotation.z=Math.PI/2; sh.position.set(-0.1,0,0.1); armL.add(sh);} }
  else { const handle=mesh(G.cyl,M.handle,0.06,1.0,0.06); handle.rotation.x=Math.PI/2; handle.position.z=0.35; const head2=mesh(G.box,M.metal,0.12,0.44,0.28); head2.position.set(0,0.14,0.75); const head3=mesh(G.box,M.handle,0.15,0.18,0.16); head3.position.set(0,0,0.75); tool.add(handle,head2,head3); }
  armR.add(tool);
  const back=new THREE.Group(); back.position.set(0,0.5,-0.4); root.add(back);
  const logMesh=new THREE.InstancedMesh(G.log,M.log,LOG_MAX); logSlots.forEach((m,i)=>logMesh.setMatrixAt(i,m)); logMesh.count=0; logMesh.castShadow=true; logMesh.frustumCulled=false; back.add(logMesh);
  const lootMesh=new THREE.InstancedMesh(helmGeo,M.enemy,LOG_MAX); lootMesh.count=0; lootMesh.castShadow=true; lootMesh.frustumCulled=false; back.add(lootMesh);
  const stoneMesh=new THREE.InstancedMesh(G.box,M.rock,LOG_MAX); stoneMesh.count=0; stoneMesh.castShadow=true; stoneMesh.frustumCulled=false; back.add(stoneMesh);
  let coinMesh=null; if(kind==='player'){ coinMesh=new THREE.InstancedMesh(G.coin,M.coin,COIN_STACK); coinSlots.forEach((m,i)=>coinMesh.setMatrixAt(i,m)); coinMesh.count=0; coinMesh.frustumCulled=false; coinMesh.position.y=2.3; root.add(coinMesh); }
  return {g,root,head,legL,legR,armL,armR,tool,back,logMesh,lootMesh,stoneMesh,coinMesh,pony,walkT:rand(0,6),swing:0,moving:false,aim:false};
}
function animGuy(guy,dt,moving,k){
  k=k||1; const r=guy.root;
  if(guy.pony){ const po=guy.pony; if(moving){ po.t+=dt*16*k; const s1=Math.sin(po.t); po.legs[0].rotation.x=s1*0.8; po.legs[3].rotation.x=s1*0.8; po.legs[1].rotation.x=-s1*0.8; po.legs[2].rotation.x=-s1*0.8; po.g.position.y=Math.abs(Math.sin(po.t))*0.12; po.g.rotation.x=Math.sin(po.t)*0.05; po.tail.rotation.x=0.4+Math.sin(po.t*0.5)*0.3; } else { const e=1-Math.pow(0.001,dt); for(const l of po.legs) l.rotation.x*=1-e; po.g.position.y*=1-e; po.g.rotation.x*=1-e; po.tail.rotation.x=0.4+Math.sin(performance.now()/400)*0.15; }
    guy.armL.rotation.x=moving? -0.9+Math.sin(po.t)*0.1 : -0.9; if(guy.swing<=0&&!guy.aim) guy.armR.rotation.x=lerp(guy.armR.rotation.x,-0.9,Math.min(1,dt*8)); r.position.y=0.95+(moving?Math.abs(Math.sin(po.t))*0.12:0); r.rotation.x=moving?0.08:0; guy.back.rotation.z=moving?Math.sin(po.t)*0.05:0; if(guy.swing>0){ guy.swing-=dt; const t=1-guy.swing/0.3; guy.armR.rotation.x = t<0.35? lerp(-0.9,-2.3,t/0.35) : lerp(-2.3,0.6,(t-0.35)/0.65); } return; }
  if(moving){ guy.walkT+=dt*13*k; const s1=Math.sin(guy.walkT); guy.legL.rotation.x=s1*0.9; guy.legR.rotation.x=-s1*0.9; guy.armL.rotation.x=-s1*0.8; if(guy.swing<=0&&!guy.aim) guy.armR.rotation.x=s1*0.8; r.position.y=Math.abs(Math.cos(guy.walkT))*0.1; r.rotation.x=0.12; r.rotation.z=Math.sin(guy.walkT)*0.05; guy.back.rotation.z=Math.sin(guy.walkT)*0.06; guy.back.rotation.x=-0.08; }
  else { const e=1-Math.pow(0.0005,dt); guy.legL.rotation.x*=1-e; guy.legR.rotation.x*=1-e; guy.armL.rotation.x*=1-e; if(guy.swing<=0&&!guy.aim) guy.armR.rotation.x*=1-e; r.position.y=lerp(r.position.y,Math.sin(performance.now()/500)*0.015,e); r.rotation.x*=1-e; r.rotation.z*=1-e; guy.back.rotation.z*=1-e; guy.back.rotation.x*=1-e; }
  if(guy.swing>0){ guy.swing-=dt; const t=1-guy.swing/0.3; guy.armR.rotation.x = t<0.35? lerp(0,-2.3,t/0.35) : lerp(-2.3,0.9,(t-0.35)/0.65); }
}
function setLogs(guy,n){ guy.logMesh.count=Math.min(LOG_MAX,n); }
function setLootBack(guy,n){ for(let i=0;i<n;i++){ const row=Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.12+row*0.3,-0.05); e3.set(0,side?0.3:-0.3,0); q.setFromEuler(e3); vs.set(0.55,0.55,0.55); m4.compose(vp,q,vs); guy.lootMesh.setMatrixAt(i,m4); } guy.lootMesh.count=Math.max(0,n); guy.lootMesh.instanceMatrix.needsUpdate=true; }
function setStones(guy,n,base){ base=base||0; n=Math.max(0,Math.min(LOG_MAX-base*2,n)); for(let i=0;i<n;i++){ const row=base+Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.1+row*0.3,-0.05-(row%2)*0.06); e3.set(0,rand(-.2,.2),0); q.setFromEuler(e3); vs.set(0.42,0.3,0.42); m4.compose(vp,q,vs); guy.stoneMesh.setMatrixAt(i,m4); } guy.stoneMesh.count=n; guy.stoneMesh.instanceMatrix.needsUpdate=true; }
function setBack(guy){ if(guy===player) setExtraBack(); guy.logMesh.count=Math.min(LOG_MAX,S.logs); setStones(guy,S.stones,Math.ceil(S.logs/2)); const base=Math.ceil(S.logs/2)+Math.ceil(S.stones/2); const n=Math.min(LOG_MAX-base*2,S.loot); for(let i=0;i<n;i++){ const row=base+Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.12+row*0.3,-0.05); e3.set(0,side?0.3:-0.3,0); q.setFromEuler(e3); vs.set(0.55,0.55,0.55); m4.compose(vp,q,vs); guy.lootMesh.setMatrixAt(i,m4); } guy.lootMesh.count=Math.max(0,n); guy.lootMesh.instanceMatrix.needsUpdate=true; }
const player=makeGuy('player'); player.g.position.set(0,0,5.5); scene.add(player.g);
setBack(player);
const playerRing=new THREE.Mesh(new THREE.RingGeometry(0.6,0.8,24),new THREE.MeshBasicMaterial({color:0x9dffb0,transparent:true,opacity:0.7,depthWrite:false})); playerRing.rotation.x=-Math.PI/2; playerRing.position.y=0.04; scene.add(playerRing);
const moveMark=new THREE.Mesh(new THREE.RingGeometry(0.5,0.7,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,depthWrite:false})); moveMark.rotation.x=-Math.PI/2; moveMark.position.y=0.05; moveMark.visible=false; scene.add(moveMark);
// Dönen pervane baltalar
const orbit=(function(){ const g=new THREE.Group(); scene.add(g); return {g,spin:0,on:0,n:0}; })();
function rebuildOrbit(){ const n=6; const sc=1+0.08*Math.min(6,cc('axe')); if(orbit.n===sc) return; orbit.n=sc; while(orbit.g.children.length) orbit.g.remove(orbit.g.children[0]); const hub=mesh(G.cyl,M.metal,0.35,0.16,0.35); orbit.g.add(hub); for(let i=0;i<n;i++){ const a=i/n*6.283; const ax=new THREE.Group(); ax.rotation.y=-a; const arm=mesh(G.box,M.handle,1.5,0.08,0.1); arm.position.x=0.9; const head=mesh(G.box,M.blade,0.9,0.05,0.5); head.position.set(1.9,0,0.12); const edge=mesh(G.box,M.metal,0.95,0.07,0.06,false); edge.position.set(1.9,0,0.38); ax.add(arm,head,edge); orbit.g.add(ax);} orbit.g.scale.setScalar(sc); }
rebuildOrbit();
const slash=new THREE.Mesh(new THREE.RingGeometry(1.4,2.9,24,1,-0.9,1.8),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})); slash.rotation.x=-Math.PI/2; slash.position.y=1.4; scene.add(slash); let slashT=0;

// ---------- Yönlendirme, baloncuk ----------
const bubbleEl=(function(){ const el=document.createElement('div'); el.className='bubble'; el.style.display='none'; document.body.appendChild(el); el.addEventListener('pointerdown',e=>{ e.stopPropagation(); }); el.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||!bubblePad) return; e.stopPropagation(); audio(); if(b.dataset.act==='buy') instantBuy(bubblePad); else cancelPad(bubblePad); }); return el; })();
let bubbleKey='';
function updateBubble(){ const pd=bubblePad; if(!pd){ bubbleEl.style.display='none'; bubbleKey=''; return; } if(pd.locked){ const key='L'+pd.def.id; if(key!==bubbleKey){ bubbleKey=key; bubbleEl.innerHTML=`<b>🔒 ${pd.def.name}</b><span>${pd.def.desc}</span><em>${pd.def.lock} ile açılır</em>`; } bubbleEl.style.display='block'; const p=player.g.position; v3.set(p.x,4.6,p.z).project(camera); bubbleEl.style.left=((v3.x+1)/2*innerWidth)+'px'; bubbleEl.style.top=((1-v3.y)/2*innerHeight)+'px'; return; } const lvl=padLevel(pd.def); const cost=padCost(pd); const cur=S.paid[pd.def.id]||0; const need=Math.max(0,Math.ceil(cost-cur)); const pr=padRes(pd); const wood=pr==='wood'; const res=pr==='iron'?'demir':pr==='plank'?'kereste':pr==='stone'?'taş':wood?'odun':'altın'; const have=pr==='iron'?(S.iron||0):pr==='plank'?(S.planks||0):pr==='stone'?S.stones+S.stone:wood?S.logs+S.wood:S.coins; const can=have>=need-0.01;
  const key=pd.def.id+'|'+lvl+'|'+need+'|'+can+'|'+(cur>0.5); if(key!==bubbleKey){ bubbleKey=key; const lv=pd.def.kind==='up'||pd.def.kind==='tower'||pd.def.kind==='wall'||pd.def.kind==='expand'? `<i>Sv ${lvl}/${pd.def.max}</i>` : `<i>${lvl}/${pd.def.max}</i>`; bubbleEl.innerHTML=`<b>${pd.def.name} ${lv}</b><span>${pd.def.desc}</span><div class="bb"><button data-act="buy" class="${can?'':'off'}">${can?'Hemen yükselt':'Yetersiz '+res}</button>${cur>0.5?'<button data-act="no">Vazgeç</button>':''}</div>`; }
  bubbleEl.style.display='block'; const p=player.g.position; v3.set(p.x,4.6,p.z).project(camera); bubbleEl.style.left=((v3.x+1)/2*innerWidth)+'px'; bubbleEl.style.top=((1-v3.y)/2*innerHeight)+'px'; }
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

// ---------- Kontroller: sürükle = yürü, dokun = oraya git, iki parmak = yakınlaştır ----------
const keys={};
addEventListener('keydown',e=>{ keys[e.key.toLowerCase()]=true; moveTarget=null; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); });
addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });
const joy={active:false,id:null,ox:0,oy:0,dx:0,dy:0,t0:0,sx:0,sy:0,moved:false}; let zoom=1, zoomTarget=1; const ptrs=new Map(); let pinchD0=0, pinchZ0=1, pinchMid=null; let moveTarget=null;
// Kamera gezinme: iki parmakla sürükle / sağ tuşla sürükle; karakter yürüyünce kamera ona döner
const camPan=new THREE.Vector3(); let follow=true; let panDrag=null; const recenterEl=$('recenter');
// ekranın kısa kenarı her zaman aynı genişlikte dünya gösterir: telefon dönünce dünya büyüyüp küçülmez, sadece yanlar açılır
function viewHalfW(){ const a=innerWidth/Math.max(1,innerHeight); return a<1?13:Math.max(22,13*a); }
function worldPerPx(){ return 2*viewHalfW()*zoom/innerWidth; }
function panBy(dxPx,dyPx){ const k=worldPerPx(); const cy=Math.cos(YAW), sn=Math.sin(YAW); camPan.x-=(dxPx*cy+dyPx*sn)*k; camPan.z-=(-dxPx*sn+dyPx*cy)*k; const lim=WORLD+10; camPan.x=clamp(camPan.x,-lim-player.g.position.x,lim-player.g.position.x); camPan.z=clamp(camPan.z,-lim-player.g.position.z,lim-player.g.position.z); follow=false; recenterEl.classList.add('show'); }
function recenter(){ follow=true; recenterEl.classList.remove('show'); }
recenterEl.addEventListener('click',()=>{ audio(); recenter(); });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
const joyEl=$('joy'); const ray=new THREE.Raycaster();
function groundPoint(cx,cy){ v3.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1,0.5); ray.setFromCamera(v3,camera); const o=ray.ray.origin, d=ray.ray.direction; if(Math.abs(d.y)<1e-4) return null; const t=-o.y/d.y; if(t<0) return null; return [o.x+d.x*t,o.z+d.z*t]; }
canvas.addEventListener('pointerdown',e=>{ audio(); if(e.pointerType==='mouse'&&e.button!==0){ panDrag=[e.clientX,e.clientY]; canvas.setPointerCapture(e.pointerId); return; } ptrs.set(e.pointerId,[e.clientX,e.clientY]); if(ptrs.size===2){ const a=[...ptrs.values()]; pinchD0=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]); pinchZ0=zoomTarget; pinchMid=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2]; joy.active=false; joy.dx=joy.dy=0; joyEl.style.display='none'; return; } if(joy.active) return; joy.active=true; joy.id=e.pointerId; joy.ox=e.clientX; joy.oy=e.clientY; joy.sx=e.clientX; joy.sy=e.clientY; joy.t0=performance.now(); joy.moved=false; joy.dx=joy.dy=0; canvas.setPointerCapture(e.pointerId); if(placing){ const gp=groundPoint(e.clientX,e.clientY); if(gp) placeGhostAt(gp[0],gp[1]); } });
canvas.addEventListener('pointermove',e=>{ if(panDrag){ panBy(e.clientX-panDrag[0],e.clientY-panDrag[1]); panDrag=[e.clientX,e.clientY]; return; } if(ptrs.has(e.pointerId)) ptrs.set(e.pointerId,[e.clientX,e.clientY]); if(ptrs.size===2){ const a=[...ptrs.values()]; const d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]); if(pinchD0>0) zoomTarget=clamp(pinchZ0*pinchD0/d,0.6,2.2); const mid=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2]; if(pinchMid){ panBy(mid[0]-pinchMid[0],mid[1]-pinchMid[1]); } pinchMid=mid; return; }
  if(placing&&!isTouch){ const gp=groundPoint(e.clientX,e.clientY); if(gp) placeGhostAt(gp[0],gp[1]); }
  if(!joy.active||e.pointerId!==joy.id) return; let dx=e.clientX-joy.ox, dy=e.clientY-joy.oy; if(!joy.moved){ if(Math.hypot(e.clientX-joy.sx,e.clientY-joy.sy)<10) return; joy.moved=true; if(placing) return; joyEl.style.display='block'; joyEl.style.left=joy.ox+'px'; joyEl.style.top=joy.oy+'px'; moveTarget=null; }
  if(placing) return; const len=Math.hypot(dx,dy), R=42; if(len>R){ joy.ox=e.clientX-dx*R/len; joy.oy=e.clientY-dy*R/len; joyEl.style.left=joy.ox+'px'; joyEl.style.top=joy.oy+'px'; dx*=R/len; dy*=R/len; } joy.dx=dx/R; joy.dy=dy/R; joyEl.firstElementChild.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`; });
const joyEnd=e=>{ if(panDrag){ panDrag=null; return; } ptrs.delete(e.pointerId); if(ptrs.size<2) pinchMid=null; if(!joy.active||e.pointerId!==joy.id) return; const tap=!joy.moved&&performance.now()-joy.t0<350; joy.active=false; joy.dx=joy.dy=0; joyEl.style.display='none'; if(tap){ const gp=groundPoint(e.clientX,e.clientY); if(!gp) return; if(placing){ placeGhostAt(gp[0],gp[1]); confirmPlace(); return; } let tx=clamp(gp[0],-WORLD+2,WORLD-2), tz=clamp(gp[1],-WORLD+2,WORLD-2); for(const pd of pads){ if(pd.g.visible&&Math.hypot(pd.g.position.x-tx,pd.g.position.z-tz)<1.7){ tx=pd.g.position.x; tz=pd.g.position.z; break; } } moveTarget=[tx,tz]; moveMark.visible=true; moveMark.position.set(tx,0.05,tz); moveMark.scale.setScalar(1.6); } };
canvas.addEventListener('wheel',e=>{ e.preventDefault(); zoomTarget=clamp(zoomTarget*(e.deltaY>0?1.08:0.92),0.6,2.2); },{passive:false});
canvas.addEventListener('pointerup',joyEnd); canvas.addEventListener('pointercancel',joyEnd);
function inputVec(){ let sx=0,sy=0; if(keys['w']||keys['arrowup']) sy-=1; if(keys['s']||keys['arrowdown']) sy+=1; if(keys['a']||keys['arrowleft']) sx-=1; if(keys['d']||keys['arrowright']) sx+=1; if(joy.active&&joy.moved){ sx+=joy.dx; sy+=joy.dy; } let l=Math.hypot(sx,sy); if(l>1){sx/=l;sy/=l;l=1;} const cy=Math.cos(YAW), sn=Math.sin(YAW); const x=sx*cy+sy*sn, z=-sx*sn+sy*cy; return {x,z,l}; }

// ---------- Yazılar / etiketler ----------
const floats=[];
function floatText(pos,txt,cls){ const el=document.createElement('div'); el.className='float '+(cls||''); el.textContent=txt; document.body.appendChild(el); floats.push({el,p:pos.clone(),t:0}); }
function updateFloats(dt){ for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.t+=dt; if(f.t>1.1){ f.el.remove(); floats.splice(i,1); continue;} v3.copy(f.p); v3.y+=2.4+f.t*1.6; v3.project(camera); f.el.style.left=((v3.x+1)/2*innerWidth)+'px'; f.el.style.top=((1-v3.y)/2*innerHeight)+'px'; f.el.style.opacity=String(1-Math.max(0,f.t-0.6)/0.5); } }
const labels=[];
function addLabel(pos,text,h){ const el=document.createElement('div'); el.className='wl'; el.innerHTML=text; document.body.appendChild(el); const L={el,pos:pos.clone(),src:pos,h:h||3.2,hide:false,near:6}; labels.push(L); return L; }
// yapı etiketleri yazı değil simge: depo = odun/taş bırakılır, tezgâh = miğfer altına döner
const quarryLabels=QUARRIES.map(([qx,qz])=>{ const L=addLabel(new THREE.Vector3(qx,0,qz),'<span class="ics">⛏️</span>',4.2); L.near=5; return L; }); const depotLbl=addLabel(DEPOT,'<span class="ics">⬇ <span class="log-dot"></span></span>',3.9); addLabel(STALL,'<span class="ics"><span class="helm"></span>→<span class="coin-dot"></span></span>',3.6);
function updateLabels(){ const pp=player.g.position; for(const L of labels){ v3.set(L.pos.x,L.h,L.pos.z).project(camera); const on=!L.hide&&L.el.firstChild!==null&&L.pos.distanceTo(pp)>L.near&&v3.z<1&&Math.abs(v3.x)<1.2&&Math.abs(v3.y)<1.2; L.el.style.display=on?'block':'none'; if(on){ L.el.style.left=((v3.x+1)/2*innerWidth)+'px'; L.el.style.top=((1-v3.y)/2*innerHeight)+'px'; } } }

// ---------- Uçan nesneler / parçacıklar ----------
const fliers=[];
function fly(from,toObj,onDone,logLike,speed){ const m=logLike&&logLike.isObject3D?logLike:logLike==='fish'?new THREE.Mesh(FISH_GEO,M.fish):logLike==='meat'?new THREE.Mesh(MEAT_GEO,M.meat):logLike==='plank'?mesh(G.box,M.plank,0.9,0.14,0.34,false):logLike==='stone'?mesh(G.box,M.rock,0.42,0.32,0.42,false):logLike?mesh(G.log,M.log,1,1,1,false):mesh(G.cyl,M.coin,0.3,0.1,0.3,false); if(logLike===true) m.rotation.z=Math.PI/2; else if(!logLike) m.rotation.x=Math.PI/2; m.position.copy(from); scene.add(m); fliers.push({m,toObj,t:0,from:from.clone(),onDone,spin:rand(4,9),speed:speed||3.4,logLike}); }
function updateFliers(dt){ for(let i=fliers.length-1;i>=0;i--){ const f=fliers[i]; f.t+=dt*f.speed; const to=f.toObj.position?f.toObj.position:f.toObj; const t=Math.min(1,f.t); f.m.position.lerpVectors(f.from,to,t); f.m.position.y+=Math.sin(t*Math.PI)*2.4+0.9*(1-t); if(f.logLike) f.m.rotation.x+=f.spin*dt; else f.m.rotation.z+=f.spin*dt; if(t>=1){ scene.remove(f.m); fliers.splice(i,1); f.onDone&&f.onDone(); } } }
const chips=[]; const chipGeo=new THREE.BoxGeometry(0.14,0.09,0.14);
function burst(pos,n,matl,up,big){ for(let i=0;i<n;i++){ const m=new THREE.Mesh(chipGeo,matl); m.position.copy(pos); if(big) m.scale.setScalar(big); m.castShadow=false; scene.add(m); chips.push({m,v:new THREE.Vector3(rand(-2.5,2.5),rand(2,5.5)*(up||1),rand(-2.5,2.5)),t:0}); } }
function updateChips(dt){ for(let i=chips.length-1;i>=0;i--){ const c=chips[i]; c.t+=dt; c.v.y-=14*dt; c.m.position.addScaledVector(c.v,dt); c.m.rotation.x+=5*dt; c.m.rotation.z+=4*dt; if(c.m.position.y<0){ c.m.position.y=0; c.v.set(0,0,0);} if(c.t>0.9){ scene.remove(c.m); chips.splice(i,1);} } }
// Yerdeki ganimet: oyuncu ya da toplayıcı alır; kimse almazsa kendi tezgâha uçar (yerde kalmaz)
const LOOT_MAX=200; const lootMesh=new THREE.InstancedMesh(helmGeo,M.enemy,LOOT_MAX); lootMesh.count=0; lootMesh.castShadow=true; lootMesh.frustumCulled=false; lootMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(lootMesh); const loot=[];
function dropLoot(x,z){ if(loot.length>=LOOT_MAX) loot.shift(); loot.push({x:x+rand(-.6,.6),y:1,z:z+rand(-.6,.6),vy:rand(3,6),ry:rand(0,6),t:0,fly:false,auto:false,taken:false}); }
function updateLoot(dt){ const p=player.g.position; const R=D.magnet(); let got=0;
  for(let i=loot.length-1;i>=0;i--){ const l=loot[i]; l.t+=dt;
    if(l.auto){ const tp=rotPt(STALL,0,1.5,-1.2); const dx=tp.x-l.x, dy=tp.y-l.y, dz=tp.z-l.z, d=Math.hypot(dx,dy,dz); const sp=(9+l.t*30)*dt; if(d<Math.max(0.5,sp)){ loot.splice(i,1); S.stall++; continue; } l.x+=dx/d*sp; l.y+=dy/d*sp+Math.sin(l.t*3)*0.02; l.z+=dz/d*sp; continue; }
    if(!l.fly){ if(l.y>0.02||l.vy>0){ l.vy-=20*dt; l.y=Math.max(0.02,l.y+l.vy*dt); if(l.y<=0.02) l.vy=0; } const d=Math.hypot(l.x-p.x,l.z-p.z); if(l.t>0.4&&d<R&&S.loot<D.cap()){ l.fly=true; l.t=0; } else if(l.t>(l.taken?12:7)){ l.auto=true; l.t=0; } }
    else { l.t+=dt; const dx=p.x-l.x, dy=1.2-l.y, dz=p.z-l.z, d=Math.hypot(dx,dy,dz); const sp=(7+l.t*40)*dt; if(d<Math.max(0.5,sp)){ loot.splice(i,1); if(S.loot<D.cap()){ S.loot++; setBack(player); got++; } continue; } l.x+=dx/d*sp; l.y+=dy/d*sp; l.z+=dz/d*sp; } }
  if(got>0) SFX.sell();
  loot.forEach((l,i)=>{ vp.set(l.x,l.y,l.z); e3.set(l.fly||l.auto?l.t*10:0,l.ry,0); q.setFromEuler(e3); vs.set(1,1,1); m4.compose(vp,q,vs); lootMesh.setMatrixAt(i,m4); }); lootMesh.count=loot.length; lootMesh.instanceMatrix.needsUpdate=true; }
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
let sellGain=0, sellFlushT=0;
function storeLog(fromPos){ fly(fromPos.clone().setY(1),rotPt(DEPOT,0,1.0,-0.6),()=>{ S.wood++; questEvent('wood'); setPile(Math.min(24,S.wood)); SFX.sell(); },true,4); }
function storeStone(fromPos){ fly(fromPos.clone().setY(1),rotPt(DEPOT,1.1,0.9,1.1),()=>{ S.stone++; setStonePile(Math.min(18,S.stone)); SFX.sell(); },'stone',4); }
setPile(Math.min(24,S.wood)); setStonePile(Math.min(18,S.stone));
function coinPop(){ const el=$('coinChip'); el.style.transform='scale(1.18)'; setTimeout(()=>el.style.transform='',110); }

// ---------- Ganimet tezgâhı, hazine, müşteriler (doğu kapısından gelir) ----------
const stall=new THREE.Group(); const stallPile=new THREE.InstancedMesh(helmGeo,M.enemy,30); stallPile.count=0; stallPile.castShadow=true;
// Ganimet tezgâhı: kuzeye bakan tezgâh, çizgili tente, arkada raf, yanlarda fıçı ve sandık, üstte tabela
(function(){
  const floor=mesh(G.box,M.plank,4.0,0.2,3.6); floor.position.set(0,0.1,0.2); stall.add(floor);
  const counter=mesh(G.box,M.wood,3.6,1.0,0.9); counter.position.set(0,0.6,-1.2); const top=mesh(G.box,M.woodDark,3.8,0.14,1.1); top.position.set(0,1.12,-1.2); stall.add(counter,top);
  for(let i=0;i<6;i++){ const st=mesh(G.box,i%2?M.banner:M.canvas,0.6,0.7,0.06,false); st.position.set(-1.5+i*0.6,0.62,-1.68); stall.add(st); }
  for(const [x,z] of [[-1.85,-1.55],[1.85,-1.55],[-1.85,1.5],[1.85,1.5]]){ const post=mesh(G.cyl,M.woodDark,0.11,3.2,0.11); post.position.set(x,1.6,z); stall.add(post); }
  const back=mesh(G.box,M.plank,3.9,2.0,0.14); back.position.set(0,1.2,1.55); stall.add(back); for(const y of [1.0,1.7]){ const shelf=mesh(G.box,M.woodDark,3.6,0.08,0.5); shelf.position.set(0,y,1.3); stall.add(shelf); for(let i=0;i<4;i++){ const jar=mesh(G.cyl,i%2?M.gold:M.metal,0.16,0.3,0.16,false); jar.position.set(-1.2+i*0.8,y+0.2,1.3); stall.add(jar); } }
  for(let i=0;i<8;i++){ const st=mesh(G.box,i%2?M.banner:M.canvas,0.52,0.08,3.9); st.position.set(-1.82+i*0.52,3.05,-0.05); st.rotation.x=-0.22; stall.add(st); const scal=mesh(G.cyl,i%2?M.banner:M.canvas,0.24,0.06,0.24,false); scal.rotation.x=Math.PI/2-0.22; scal.position.set(-1.82+i*0.52,2.63,-2.0); stall.add(scal); }
  const ridge=mesh(G.box,M.woodDark,4.3,0.14,0.14,false); ridge.position.set(0,3.5,1.85); stall.add(ridge);
  const sign=mesh(G.box,M.flag,2.2,0.6,0.1); sign.position.set(0,3.75,-1.3); const helm=new THREE.Mesh(helmGeo,M.enemy); helm.scale.setScalar(0.7); helm.position.set(0,4.2,-1.3); helm.castShadow=true; stall.add(sign,helm);
  for(const x of [2.5,2.5]){ } const b1=mesh(G.cyl,M.woodDark,0.45,0.9,0.45); b1.position.set(2.45,0.45,-0.6); const b2=b1.clone(); b2.position.set(2.45,0.45,0.5); const b3=b1.clone(); b3.position.set(2.45,1.35,-0.05); stall.add(b1,b2,b3); for(const b of [b1,b2,b3]){ const band=mesh(G.cyl,M.metal,0.47,0.08,0.47,false); band.position.copy(b.position); band.position.y+=0.25; stall.add(band); }
  const c1=mesh(G.box,M.wood,0.9,0.7,0.9); c1.position.set(-2.5,0.35,-0.4); const c2=mesh(G.box,M.plank,0.8,0.6,0.8); c2.position.set(-2.5,1.0,-0.4); c2.rotation.y=0.3; const c3=mesh(G.box,M.wood,0.9,0.7,0.9); c3.position.set(-2.5,0.35,0.7); stall.add(c1,c2,c3);
  for(let i=0;i<30;i++){ const row=Math.floor(i/6), col=i%6; vp.set(-1.4+col*0.56+(row%2)*0.14,1.32+row*0.34,-1.2+(row%3-1)*0.22); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.6,0.6,0.6); m4.compose(vp,q,vs); stallPile.setMatrixAt(i,m4);} stall.add(stallPile);
  stall.rotation.y=ROT45; stall.position.copy(STALL); scene.add(stall);
})();
// Sıra ipleri: müşteri kuyruğu boyunca üç direk
const ropePosts=new THREE.Group(); (function(){ for(let i=0;i<3;i++){ const post=mesh(G.cyl,M.woodDark,0.09,1.0,0.09); post.position.set(0,0.5,-i*2.0); const knob=mesh(G.sph,M.gold,0.14,0.14,0.14,false); knob.position.set(0,1.05,-i*2.0); ropePosts.add(post,knob); if(i<2){ const rope=mesh(G.box,M.rope,0.05,0.05,1.9,false); rope.position.set(0,0.82,-i*2.0-1.0); ropePosts.add(rope); } } scene.add(ropePosts); })();
function placeRopes(){ const o=rotPt(STALL,-1.3,0,-2.9); ropePosts.position.copy(o); ropePosts.rotation.y=ROT45; }
placeRopes();
// Hazine: taş kaide üstünde açık sandık, içi altın; yanında keseler
const treasury=new THREE.Group(); const bankPile=new THREE.InstancedMesh(G.coin,M.coin,90); bankPile.count=0; bankPile.castShadow=true;
(function(){ const base=mesh(G.box,M.stone,2.6,0.3,2.6); base.position.y=0.15; const rim=mesh(G.box,M.stoneDark,2.8,0.1,2.8); rim.position.y=0.03; treasury.add(base,rim);
  const body=mesh(G.box,M.chest,1.9,1.0,1.3); body.position.set(0,0.8,0); treasury.add(body); for(const x of [-0.6,0.6]){ const strap=mesh(G.box,M.gold,0.16,1.04,1.34,false); strap.position.set(x,0.8,0); treasury.add(strap); }
  const lid=new THREE.Group(); lid.position.set(0,1.3,-0.65); const lm=mesh(G.box,M.chest,1.9,0.4,1.3); lm.position.set(0,0.2,0.65); lid.add(lm); for(const x of [-0.6,0.6]){ const strap=mesh(G.box,M.gold,0.16,0.44,1.34,false); strap.position.set(x,0.2,0.65); lid.add(strap); } lid.rotation.x=-1.9; treasury.add(lid);
  const lock=mesh(G.box,M.gold,0.3,0.3,0.1); lock.position.set(0,0.95,0.68); treasury.add(lock);
  for(const [x,z] of [[-1.05,0.75],[1.05,0.7]]){ const sack=mesh(G.sph,M.rope,0.36,0.42,0.36); sack.position.set(x,0.6,z); const tie=mesh(G.cyl,M.woodDark,0.14,0.12,0.14,false); tie.position.set(x,0.98,z); treasury.add(sack,tie); } for(const [x,z,r] of [[-2.0,-0.9,0.3],[-2.1,0.4,0.8],[0.6,-2.0,0.1]]){ const hay=mesh(G.cyl,M.gold,0.5,0.9,0.5); hay.rotation.z=Math.PI/2; hay.rotation.y=r; hay.position.set(x,0.5,z); treasury.add(hay); const band=mesh(G.cyl,M.rope,0.52,0.1,0.52,false); band.rotation.z=Math.PI/2; band.rotation.y=r; band.position.set(x,0.5,z); treasury.add(band); }
  for(let i=0;i<90;i++){ const col=i%9, row=Math.floor(i/9); const cx=(col%3)-1, cz=Math.floor(col/3)-1; vp.set(cx*0.5,1.0+row*0.13,cz*0.36); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.8,0.8,0.8); m4.compose(vp,q,vs); bankPile.setMatrixAt(i,m4); } treasury.add(bankPile); treasury.position.copy(TREASURY); scene.add(treasury); })();
// Asker çadırı (KD köşe) ve kuyu (GB köşe): süs
const camp=new THREE.Group(); (function(){ const tentL=mesh(G.box,M.canvasDark,3.4,0.14,2.2); tentL.position.set(-0.85,1.1,0); tentL.rotation.z=0.95; const tentR=tentL.clone(); tentR.position.x=0.85; tentR.rotation.z=-0.95; const ridge=mesh(G.box,M.woodDark,0.12,0.12,2.4,false); ridge.position.set(0,1.95,0); const back=mesh(G.box,M.canvas,2.6,1.9,0.1); back.position.set(0,0.95,-1.1); back.rotation.z=0; const pole=mesh(G.cyl,M.woodDark,0.06,2.6,0.06); pole.position.set(0,1.3,1.2); const flag=mesh(G.box,M.flag,0.7,0.45,0.05,false); flag.position.set(0.35,2.4,1.2); camp.add(tentL,tentR,ridge,back,pole,flag);
  const fire=new THREE.Group(); fire.position.set(1.9,0,1.3); for(let i=0;i<6;i++){ const a=i/6*6.283; const st=mesh(G.dod,M.rock,0.22,0.16,0.22); st.position.set(Math.cos(a)*0.55,0.1,Math.sin(a)*0.55); fire.add(st); } for(const a of [0.4,1.5,2.6]){ const lg=mesh(G.log,M.woodDark,0.9,0.9,0.9,false); lg.rotation.z=Math.PI/2; lg.rotation.y=a; lg.position.y=0.12; fire.add(lg); } const fl=mesh(G.cone,M.flag,0.28,0.6,0.28,false); fl.position.y=0.5; fire.add(fl); const fl2=mesh(G.cone,M.gold,0.16,0.4,0.16,false); fl2.position.y=0.65; fire.add(fl2); camp.add(fire); camp.fire=fl; camp.fire2=fl2;
  const rack=mesh(G.box,M.woodDark,0.1,1.2,1.4); rack.position.set(-1.9,0.6,0.9); camp.add(rack); for(let i=0;i<3;i++){ const sp=mesh(G.cyl,M.handle,0.04,1.6,0.04); sp.position.set(-1.85,0.9,0.4+i*0.4); sp.rotation.x=0.2; camp.add(sp); const tip=mesh(G.cone,M.metal,0.07,0.22,0.07,false); tip.position.set(-1.85,1.75,0.22+i*0.4); camp.add(tip); }
  const well=new THREE.Group(); well.position.set(-1.1,0,2.2); const ring=mesh(G.cyl,M.stone,0.7,0.7,0.7); ring.position.y=0.35; const inner=mesh(G.cyl,M.iron,0.52,0.72,0.52,false); inner.position.y=0.35; for(let i=0;i<8;i++){ const a=i/8*6.283; const b=mesh(G.box,M.stoneDark,0.3,0.24,0.2,false); b.position.set(Math.cos(a)*0.65,0.62,Math.sin(a)*0.65); b.rotation.y=-a; well.add(b); } for(const x of [-0.6,0.6]){ const pp=mesh(G.cyl,M.woodDark,0.07,1.6,0.07); pp.position.set(x,1.1,0); well.add(pp); } const beam=mesh(G.cyl,M.handle,0.06,1.4,0.06); beam.rotation.z=Math.PI/2; beam.position.y=1.75; const roofL=mesh(G.box,M.roof,1.7,0.08,0.7); roofL.position.set(0,2.1,-0.3); roofL.rotation.x=0.6; const roofR=roofL.clone(); roofR.position.z=0.3; roofR.rotation.x=-0.6; const bucket=mesh(G.cyl,M.woodDark,0.16,0.26,0.16); bucket.position.set(0,1.3,0); well.add(ring,inner,beam,roofL,roofR,bucket); camp.add(well);
  camp.position.copy(CAMP); scene.add(camp); })();
const bankLabel=addLabel(TREASURY,'',2.6); bankLabel.near=-1; bankLabel.hide=true; treasury.visible=false; let withdrawT=0;
function bankIn(amount){ S.bank+=amount; }
function updateTreasury(dt){ const p=player.g.position; bankPile.count=Math.min(90,Math.ceil(S.bank/4)); bankLabel.el.innerHTML=`Hazine<small><b>${Math.floor(S.bank)}</b> altın</small>`;
  if(S.bank>0.5&&p.distanceTo(TREASURY)<2.6){ withdrawT-=dt; if(withdrawT<=0){ withdrawT=0.05; const amt=Math.min(S.bank,Math.max(3,S.bank/12)); S.bank-=amt; fly(TREASURY.clone().setY(0.9),player.g,()=>{ S.coins+=amt; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.08; SFX.coin(); } } } }
const customers=[]; const CUST_N=4; let stallT=0, custSpawnT=0;
function custSlot(i){ const t=2.9+1.2*i; return [STALL.x+t*DIAG, STALL.z+t*DIAG]; }
const stallDrop=()=>rotPt(STALL,rand(-1.4,1.4),1.5,-1.2);
function makeCustomer(){ const g=makeGuy('worker'); g.tool.visible=false; g.g.position.set(-(H+30),0,-0.6+rand(-.2,.2)); scene.add(g.g); customers.push({guy:g,state:'walk',t:0}); }
// Müşteri: batı kapısından girer, yolun kuzey şeridinden meydana yürür, çapraz kuyruktan tezgâha iner; satış bitince güney şeridinden çıkar
function updateCustomers(dt){
  custSpawnT-=dt; if(customers.filter(c=>c.state!=='leave').length<CUST_N&&custSpawnT<=0){ custSpawnT=0.8; makeCustomer(); }
  const order=new Map(); { let qi=0; for(const c of customers){ if(c.state!=='leave') order.set(c,qi++); } }
  for(let i=customers.length-1;i>=0;i--){ const c=customers[i]; const p=c.guy.g.position;
    if(c.state==='leave'){ c.t+=dt; let tx,tz; if(!c.out){ tx=QUEUE_OUT.x; tz=QUEUE_OUT.z; if(Math.hypot(tx-p.x,tz-p.z)<0.3) c.out=true; } else { tx=-(H+30); tz=QUEUE_OUT.z; } const dx=tx-p.x, dz=tz-p.z, d=Math.hypot(dx,dz); const st=Math.min(d,5*dt); if(d>0.01){ p.x+=dx/d*st; p.z+=dz/d*st; c.guy.g.rotation.y=Math.atan2(dx,dz); } animGuy(c.guy,dt,true,0.9); if(p.x<-(H+26)){ scene.remove(c.guy.g); customers.splice(i,1); } continue; }
    let [sx,sz]=custSlot(order.get(c)||0); if(!c.in){ sx=QUEUE_IN.x; sz=QUEUE_IN.z; if(Math.hypot(sx-p.x,sz-p.z)<0.3) c.in=true; } const dx=sx-p.x, dz=sz-p.z, d=Math.hypot(dx,dz);
    if(d>0.15){ p.x+=dx/d*Math.min(d,4.2*dt); p.z+=dz/d*Math.min(d,4.2*dt); c.guy.g.rotation.y=Math.atan2(dx,dz); animGuy(c.guy,dt,true,0.9); c.state='walk'; }
    else { c.state='queue'; c.guy.g.rotation.y=ROT45; animGuy(c.guy,dt,false,1); }
  }
  const first=customers.find(c=>c.state==='queue'); stallT-=dt;
  if(first&&S.stall>0&&stallT<=0){ stallT=D.buyTime(); S.stall--; S.sold=(S.sold||0)+1; stallPile.count=Math.min(30,S.stall); const price=D.lootPrice(); first.state='leave'; first.t=0; SFX.coin(); const from=stallDrop(); const n=Math.max(2,Math.min(8,Math.round(price/5))); dropCoins(STALL_FRONT.clone().setY(1.4),n,price/n,1.8,0.8); floatText(from,`+${Math.round(price)}`,''); }
  stallPile.count=Math.min(30,S.stall);
}
stallPile.count=Math.min(30,S.stall);

// ---------- İnşa alanları (her şeyin max seviyesi 10) ----------
const pads=[]; const padById={};
const P=(x,z)=>()=>[x,z];
const nFree=k=>S.towers.filter(t=>!t.fixed&&t.k===k).length;
// 8 alan: Sur, Okçu kuleleri (kapı yanlarında), Topçu, Asker, Oduncu, Midilli, Genişlet, Tezgâh (+ 3. bölümden sonra Taşçı)
const PADS=[
  {id:'wall', ord:2, lock:'Bir okçu kulesi', name:'Sur', desc:'Sur ve kapılar güçlenir', res:l=>l>=3?'stone':'wood', pos:P(-2.9,-2.9), kind:'wall', key:'wall', cost:l=>l>=3?Math.round(24*Math.pow(1.45,l-3)):Math.round(30*Math.pow(1.6,l)), max:5, show:()=>S.towers.some(t=>t.lvl>=1)},
  {id:'soldier', ord:3, lock:'Bir okçu kulesi', name:'Asker', desc:'Saldırılan kapıya koşar', res:'gold', pos:P(2.9,-2.9), kind:'soldier', key:'soldier', cost:l=>Math.round(35*Math.pow(1.45,l)), max:5, show:()=>S.towers.some(t=>t.lvl>=1)},
  {id:'worker', ord:4, lock:'Sur 1', name:'Oduncu', desc:'Senin yerine odun keser', res:'gold', pos:P(-2.9,2.9), kind:'worker', key:'worker', cost:l=>Math.round(45*Math.pow(1.5,l)), max:4, show:()=>S.lv.wall>=1},
  {id:'feet', ord:5, lock:'Bir asker', name:'Midilli', desc:'Hızlı koş, çok taşı', res:'gold', pos:P(-5.4,2.9), kind:'up', key:'feet', cost:l=>Math.round(30*Math.pow(1.4,l)), max:5, show:()=>S.lv.soldier>=1},
  {id:'trader', ord:6, lock:'İlk ganimet satışı', name:'Tezgâh', desc:'Miğferler pahalı ve hızlı satılır', res:'gold', pos:P(-5.4,-2.9), kind:'up', key:'trader', cost:l=>Math.round(40*Math.pow(1.4,l)), max:5, show:()=>(S.sold||0)>=1},
  {id:'newCannon', ord:7, lock:'Gece 2', name:'Topçu Kulesi', desc:'Gülle atar; yerini sen seç', res:'gold', pos:P(5.4,-2.9), kind:'newTower', tk:'c', cost:l=>Math.round(90*Math.pow(1.6,l)), max:3, show:()=>S.wave>=2, lvl:()=>nFree('c')},
  {id:'expand', ord:8, lock:'Sur 2', name:'Genişlet', desc:'Sur büyür, merkez kule açılır', res:'wood', pos:P(-2.9,-5.4), kind:'expand', key:'expand', cost:l=>Math.round(60*Math.pow(1.7,l)), max:2, show:()=>S.lv.wall>=2},
  {id:'stoneWorker', ord:9, lock:'Taş Ocağı açılınca', name:'Taşçı', desc:'Senin yerine taş çıkarır', res:'gold', pos:P(-2.9,5.4), kind:'stoneWorker', key:'stoneWorker', cost:l=>Math.round(60*Math.pow(1.5,l)), max:3, show:()=>revealed('quarry')},
];
function towerPos(i){ const t=S.towers[i]; if(t.side==='C') return [0,0]; if(t.x!==undefined) return [t.x,t.z]; return sidePos(t.side,t.a,-1.5); }
// Kule alanı: sabit kuleler için kapının yanında, yeni kuleler için kulenin önünde, merkez için kule kurulunca güneyinde
function towerPadPos(i){ const t=S.towers[i]; if(t.side==='C') return t.lvl<1?[0,0]:[0,-2.9]; if(t.fixed) return sidePos(t.side,Math.sign(t.a)*2.4,-2.4); if(t.px!==undefined) return [t.px,t.pz]; return sidePos(t.side,t.a,-3.9); }
const FLANK_BASE={N:12,E:20,S:28,W:36};
function towerDef(i){ const t=S.towers[i]; const isC=t.side==='C'; const name=t.k==='c'?'Topçu Kulesi':isC?'Merkez Kule':'Okçu Kulesi'; const desc=t.k==='c'?'Gülle atar, kalabalığı dağıtır':isC?'Uzun menzil, iki okçu':'Ok atar';
  return {id:'t'+i, ti:i, ord:isC?8.5:1, name, desc, kind:'tower', max:5, sc:isC?1.5:1.0, r:isC?2.4:1.9, pos:()=>towerPadPos(i), res:l=>l===0?'wood':l>=6?'plank':'gold', cost:l=>l===0?(isC?60:FLANK_BASE[t.side]):l>=6?Math.round((t.k==='c'?40:26)*Math.pow(1.35,l-6)):Math.round((t.k==='c'?70:35)*Math.pow(1.45,l-1)),
    lock: isC? 'Genişlet 1' : '', show:()=> isC? S.lv.expand>=1 : t.fixed? SIDES.indexOf(t.side)<sidesActive() : true }; }
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
  if(pd.def.max>1) drawPips(x,lvl,pd.def.max,50,can);
  drawIcon(x,padIcon(pd.def),160,pd.def.max>1?132:122,106,can?1:0.7);
  x.textAlign='center'; x.textBaseline='middle';
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
function padAvail(pd){ const need=padCost(pd)-(S.paid[pd.def.id]||0); const r=padRes(pd); return r==='iron'? need<=(S.iron||0)+0.01 : r==='plank'? need<=(S.planks||0)+0.01 : r==='wood'? need<=S.logs+S.wood+0.01 : r==='stone'? need<=S.stones+S.stone+0.01 : need<=S.coins+0.01; }
function layoutPads(){ for(const pd of pads){ const pp=pd.def.pos(); pd.g.position.set(pp[0],0,pp[1]); } }
function expandBase(){ S.lv.expand++; applyBase(); placeBuildings(); paintGround(); cullTrees(); cullRocks(); cullDecor(); buildWalls(S.lv.wall); buildGates(S.lv.wall); placeGates(); placeTorches(); rebuildTowers(); layoutPads(); if(typeof drawMiniBase==='function') drawMiniBase(); burst(new THREE.Vector3(0,1,H-4),30,M.plank,1.2); toast('Sur büyüdü!','good'); }
function instantBuy(pd){ const cost=padCost(pd); const cur=S.paid[pd.def.id]||0; const need=Math.max(0,cost-cur); const res=padRes(pd); const wood=res==='wood';
  if(res==='iron'){ if((S.iron||0)<need-0.01){ toast('⛓ Demir yetmiyor'); return; } S.iron-=Math.ceil(need); }
  else if(res==='plank'){ if((S.planks||0)<need-0.01){ toast('🪵 Kereste yetmiyor'); return; } S.planks-=Math.ceil(need); for(let i=0;i<Math.min(12,Math.ceil(need));i++) fly(DEPOT.clone().setY(1.2),pd.g.position.clone().setY(0.3),null,'plank',rand(3,5)); }
  else if(res==='stone'){ if(S.stones+S.stone<need-0.01){ toast('🪨 Taş yetmiyor'); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.stones); S.stones-=fromBack; n-=fromBack; S.stone-=n; setBack(player); setStonePile(Math.min(18,S.stone)); for(let i=0;i<Math.min(12,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,'stone',rand(4,7)); }
  else if(wood){ if(S.logs+S.wood<need-0.01){ toast('🪵 Odun yetmiyor'); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.logs); S.logs-=fromBack; n-=fromBack; S.wood-=n; setBack(player); setPile(Math.min(24,S.wood)); for(let i=0;i<Math.min(14,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,true,rand(4,7)); }
  else { if(S.coins<need-0.01){ toast('💰 Altın yetmiyor'); return; } S.coins-=need; for(let i=0;i<Math.min(14,Math.ceil(need/5)+3);i++) fly(player.g.position.clone().setY(2.4),pd.g.position.clone().setY(0.3),null,false,rand(4,7)); }
  S.paid[pd.def.id]=cost; SFX.pay(1); completePad(pd); }
function cancelPad(pd){ const cur=S.paid[pd.def.id]||0; if(cur<=0) return; const r=padRes(pd); if(r==='iron') S.iron=(S.iron||0)+Math.round(cur); else if(r==='plank') S.planks=(S.planks||0)+Math.round(cur); else if(r==='wood') S.wood+=Math.round(cur); else if(r==='stone'){ S.stone+=Math.round(cur); setStonePile(Math.min(18,S.stone)); } else S.coins+=cur; S.paid[pd.def.id]=0; pd.cool=2.5; setPile(Math.min(24,S.wood)); toast('↩ Geri verildi','good'); }
function completePad(pd){ const d=pd.def; S.paid[d.id]=0; pd.pop=1; pd.cool=1.2; questEvent('buy',1);
  if(d.kind==='tower'){ S.towers[d.ti].lvl++; buildTower(d.ti); layoutPads(); }
  else if(d.kind==='newTower'){ startPlacing(d.tk,d.cost(padLevel(d)),pd); }
  else if(d.kind==='wall'){ S.lv.wall++; buildWalls(S.lv.wall); buildGates(S.lv.wall); S.gateHp=D.gateMax(); }
  else if(d.kind==='worker'){ S.lv.worker++; addWorker(); }
  else if(d.kind==='stoneWorker'){ S.lv.stoneWorker++; addWorker('stone'); }
  else if(d.kind==='soldier'){ S.lv.soldier++; addSoldier(true); }
  else if(d.kind==='expand'){ expandBase(); }
  else if(d.kind==='collector'){ S.lv.collector=(S.lv.collector||0)+1; addCollector(); }
  else { S.lv[d.key]=(S.lv[d.key]||0)+1; if(d.onBuy) d.onBuy(); if(d.key==='axe') rebuildOrbit(); if(d.key==='depotLv'||d.key==='workerSpd'){ for(const w of workers){ w.cap=8+4*(S.lv.depotLv||0); w.speed=5+0.6*(S.lv.depotLv||0)+0.7*(S.lv.workerSpd||0); } } }
  const big=d.kind==='tower'||d.kind==='wall'||d.kind==='expand'||d.kind==='newTower'; const at=pd.g.position.clone(); if(d.kind==='tower'){ const tp=towerPos(d.ti); at.set(tp[0],0,tp[1]); }
  celebrate(at,big?1:0.6); if(d.kind!=='newTower'){ const lv=padLevel(d); floatText(at,(d.kind==='tower'?(S.towers[d.ti].k==='c'?'Topçu':'Okçu')+' Sv '+lv:d.name+(d.max>1&&d.kind!=='worker'&&d.kind!=='soldier'?' Sv '+lv:''))+'!','green'); } save(); }
let bubblePad=null;
// Kilitli alanlardan yalnız sıradaki (en küçük sıra numaralı) görünür; kalabalık olmasın
function nextLockedPad(){ const best={}; for(const pd of pads){ if(!pd.def.lock||pd.def.show()||padLevel(pd.def)>=pd.def.max) continue; const g=pd.def.grp||'base'; if(g!=='base'&&!revealed(g)) continue; if(!best[g]||(pd.def.ord||9)<(best[g].def.ord||9)) best[g]=pd; } return new Set(Object.values(best)); }
function updatePads(dt){ const p=player.g.position; bubblePad=null; const nextL=nextLockedPad();
  for(const pd of pads){ const unlocked=pd.def.show(); const vis=padLevel(pd.def)<pd.def.max&&!placing&&(unlocked||nextL.has(pd)); if(!vis){ pd.shown=0; } pd.g.visible=vis; pd.locked=!unlocked; if(!vis) continue;
    if(pd.locked){ pd.wasLocked=true; pd.shown=Math.min(1,pd.shown+dt*2.5); pd.g.scale.set(0.6*pd.shown*pd.sc,1,0.6*pd.shown*pd.sc); pd.plane.position.y=0.05; pd.fill.scale.set(1,0.001,1); const key='L|'+padIcon(pd.def); if(key!==pd.last){ pd.last=key; drawLocked(pd); } if(Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z)<pd.r*0.8) bubblePad=pd; continue; }
    const cost=padCost(pd); const paid=S.paid[pd.def.id]||0; const lvl=padLevel(pd.def);
    if(pd.wasLocked&&introT>3){ toast('✨ Yeni: '+pd.def.name,'good'); SFX.build(); } pd.wasLocked=false;
    pd.shown=Math.min(1,pd.shown+dt*2.5); const ease=1-Math.pow(1-pd.shown,3); const over=pd.shown<1? ease*(1+0.18*Math.sin(pd.shown*Math.PI)) : 1;
    const pulse=(S.paid[pd.def.id]||0)<cost&&padAvail(pd)? 1+0.05*Math.sin(performance.now()/180) : 1;
    if(pd.pop>0){ pd.pop-=dt*2; const s2=1+Math.sin((1-pd.pop)*Math.PI)*0.25; pd.g.scale.set(s2*over*pd.sc,1,s2*over*pd.sc); } else pd.g.scale.set(over*pulse*pd.sc,1,over*pulse*pd.sc);
    pd.plane.position.y=0.05+(padAvail(pd)?0.02+0.02*Math.sin(performance.now()/180):0);
    pd.cool=Math.max(0,pd.cool-dt);
    const dpd=Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z); if(pd.needLeave&&dpd>pd.r+0.8) pd.needLeave=false; const nearAny=dpd<pd.r; if(nearAny) bubblePad=pd; const near=nearAny&&!playerMoving&&!pd.needLeave;
    if(near&&pd.cool<=0&&paid<cost){ if(padRes(pd)==='gold'){ if(S.coins>0.01){ const rate=Math.max(60,cost/0.8); const amt=Math.min(rate*dt,S.coins,cost-paid); S.coins-=amt; S.paid[pd.def.id]=paid+amt; pd.payT-=dt; if(pd.payT<=0){ pd.payT=0.05; fly(p.clone().setY(2.4),pd.g.position.clone().setY(0.3),null,false,6); SFX.pay((paid+amt)/cost); } } }
      else if(padRes(pd)==='iron'){ pd.acc=(pd.acc||0)+Math.max(10,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.iron||0)>0&&cur<cost){ n--; S.iron--; cur++; S.paid[pd.def.id]=cur; SFX.pay(cur/cost); } }
      else if(padRes(pd)==='plank'){ pd.acc=(pd.acc||0)+Math.max(15,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.planks||0)>0&&cur<cost){ n--; S.planks--; cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.07; fly(DEPOT.clone().setY(1.2),pd.g.position.clone().setY(0.3),null,'plank',3.5); SFX.pay(cur/cost); } } }
      else if(padRes(pd)==='stone'){ pd.acc=(pd.acc||0)+Math.max(20,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.stones>0||S.stone>0)&&cur<cost){ n--; const fromBack=S.stones>0; if(fromBack){ S.stones--; } else { S.stone--; } cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.06; fly((fromBack?p.clone().setY(1.6):DEPOT.clone().setY(1.2)),pd.g.position.clone().setY(0.3),null,'stone',fromBack?6:4); SFX.pay(cur/cost); } } setBack(player); setStonePile(Math.min(18,S.stone)); }
      else { pd.acc=(pd.acc||0)+Math.max(20,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid; while(n>0&&(S.logs>0||S.wood>0)&&cur<cost){ n--; const fromBack=S.logs>0; if(fromBack){ S.logs--; } else { S.wood--; } cur++; S.paid[pd.def.id]=cur; pd.payT-=0.05; if(pd.payT<=0){ pd.payT=0.06; fly((fromBack?p.clone().setY(1.6):DEPOT.clone().setY(1.2)),pd.g.position.clone().setY(0.3),null,true,fromBack?6:4); SFX.pay(cur/cost); } } setBack(player); setPile(Math.min(24,S.wood)); } }
    const cur=S.paid[pd.def.id]||0; const k=clamp(cur/cost,0,1); pd.fill.scale.set(1,Math.max(0.001,k),1); pd.fill.position.z=(1-k)*1.0;
    const can=padAvail(pd);
    const key=padIcon(pd.def)+'|'+lvl+'|'+Math.ceil(cost-cur)+'|'+can+'|'+padRes(pd); if(key!==pd.last){ pd.last=key; drawPad(pd,lvl,cur,cost,can); }
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
function buildTower(i){ const t=S.towers[i]; if(towers[i]){ scene.remove(towers[i].g); if(towers[i].bar) towers[i].bar.remove(); } if(t.lvl<1){ towers[i]=null; return; } const [x,z]=towerPos(i); const tm=towerMesh(t.k,t.lvl,t.side==='C'); tm.g.position.set(x,0,z); if(t.side!=='C'){ const d=SD[t.side]; tm.g.rotation.y=Math.atan2(d.o[0],d.o[1]); } scene.add(tm.g); tm.g.scale.setScalar(0.01);
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
function reservedPads(){ const out=[]; for(const pd of pads){ if(pd.def.kind==='tower') continue; const pp=pd.def.pos(); out.push(pp); } S.towers.forEach((t,i)=>{ out.push(towerPadPos(i)); }); return out; }
function spotFree(x,z,res){ const lim=H-1.8; if(Math.abs(x)>lim||Math.abs(z)>lim) return false; if(Math.hypot(x,z)<3.6) return false;
  for(const s of SIDES){ const [a,b]=localOf(s,x,z); if(Math.abs(a)<2.6&&b>-4.5) return false; }
  for(let i=0;i<S.towers.length;i++){ const [tx,tz]=towerPos(i); if(Math.hypot(tx-x,tz-z)<2.7) return false; }
  for(const [px,pz] of res){ if(Math.hypot(px-x,pz-z)<2.3) return false; }
  for(const B of [DEPOT,STALL,CAMP]) if(Math.hypot(B.x-x,B.z-z)<3.4) return false; return true; }
function padFor(x,z,res){ const base=Math.atan2(-z,-x); for(const da of [0,0.6,-0.6,1.2,-1.2,1.8,-1.8,Math.PI]){ const a=base+da; const px=x+Math.cos(a)*2.5, pz=z+Math.sin(a)*2.5; const lim=H-1.4; if(Math.abs(px)>lim||Math.abs(pz)>lim) continue; let ok=Math.hypot(px,pz)>=2.4; for(const [qx,qz] of res){ if(Math.hypot(qx-px,qz-pz)<2.3){ ok=false; break; } } if(ok) for(let i=0;i<S.towers.length;i++){ const [tx,tz]=towerPos(i); if(Math.hypot(tx-px,tz-pz)<2.0){ ok=false; break; } } if(ok) for(const B of [DEPOT,STALL,CAMP]) if(Math.hypot(B.x-px,B.z-pz)<3.0){ ok=false; break; } if(ok) return [px,pz]; } return null; }
function placeSpot(x,z){ const res=reservedPads(); const lim=H-1.8; const tryAt=(cx,cz)=>{ if(!spotFree(cx,cz,res)) return null; const pp=padFor(cx,cz,res); return pp? {x:cx,z:cz,px:pp[0],pz:pp[1],s:nearestSide(cx,cz),ok:true} : null; };
  x=clamp(x,-lim,lim); z=clamp(z,-lim,lim); let r=tryAt(x,z); if(r) return r;
  for(let rad=0.6;rad<=2*H;rad+=0.6){ const n=Math.max(8,Math.round(rad*5)); let best=null,bd=1e9; for(let k=0;k<n;k++){ const a=k/n*6.2832; const cx=x+Math.cos(a)*rad, cz=z+Math.sin(a)*rad; const t=tryAt(cx,cz); if(t){ const d=Math.hypot(cx-x,cz-z); if(d<bd){bd=d;best=t;} } } if(best) return best; }
  return {x,z,s:nearestSide(x,z),ok:false}; }
function startPlacing(k,refund,pd){ if(placing){ scene.remove(placing.ghost.g); } const sp=placeSpot(player.g.position.x,player.g.position.z);
  if(!sp.ok){ S.coins+=refund||0; toast('Yer yok — önce 🏗️ genişlet'); return false; }
  const ghost=towerMesh(k,1,false,M.ghostOk); scene.add(ghost.g); placing={k,ghost,ok:false,spot:null,refund:refund||0,pd}; moveTarget=null; $('placeBar').style.display='flex';
  toast(isTouch?'👆 Boş yere dokun':'🖱️ Boş yere tıkla','good'); placeGhostAt(sp.x,sp.z); return true; }
function cancelPlacing(){ if(!placing) return; scene.remove(placing.ghost.g); S.coins+=placing.refund; if(placing.pd) placing.pd.needLeave=true; placing=null; $('placeBar').style.display='none'; toast('↩ Geri verildi','good'); }
function pushOutOfTowers(p,r){ for(let i=9;i<S.towers.length;i++){ const t=S.towers[i]; if(t.x===undefined||t.lvl<1) continue; const dx=p.x-t.x, dz=p.z-t.z, d=Math.hypot(dx,dz); if(d<r&&d>0.001){ p.x=t.x+dx/d*r; p.z=t.z+dz/d*r; } } }
function placeGhostAt(x,z){ if(!placing) return; const sp=placeSpot(x,z); placing.spot=sp; placing.ok=sp.ok; placing.ghost.g.position.set(sp.x,0,sp.z); const d=SD[sp.s]; placing.ghost.g.rotation.y=Math.atan2(d.o[0],d.o[1]); const m=sp.ok?M.ghostOk:M.ghostBad; placing.ghost.g.traverse(o=>{ if(o.isMesh) o.material=m; }); }
function confirmPlace(){ if(!placing) return; const sp=placing.spot; if(!sp||!sp.ok){ toast('Buraya olmaz'); return; } scene.remove(placing.ghost.g); S.towers.push({k:placing.k,side:sp.s,a:0,x:sp.x,z:sp.z,px:sp.px,pz:sp.pz,lvl:1,fixed:false}); const i=S.towers.length-1; buildTower(i); ensureTowerPads(); layoutPads(); if(placing.pd) placing.pd.needLeave=true; placing=null; $('placeBar').style.display='none'; celebrate(new THREE.Vector3(sp.x,0,sp.z),1); floatText(new THREE.Vector3(sp.x,0,sp.z),'Kule kuruldu!','green'); save(); }

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
  const ox=p.x, oz=p.z; p.x+=dx/d*w.speed*dt; p.z+=dz/d*w.speed*dt; wallCollide(p,0.6,()=>2.3); pushOutOfTrunks(p,1.2); pushOutOfCenter(p,1.8); pushOutOfTowers(p,1.5);
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
const EK={grunt:{hp:1,spd:1,atk:4,loot:1,arrow:1,cannon:1,sc:1,rad:1.15,name:'asker'}, runner:{hp:0.5,spd:1.85,atk:3,loot:1,arrow:1,cannon:0.8,sc:0.85,rad:1.0,name:'koşucu'}, shield:{hp:2.2,spd:0.8,atk:6,loot:2,arrow:0.45,cannon:1.25,sc:1.1,rad:1.3,name:'kalkanlı'}, ram:{hp:6,spd:0.62,atk:24,loot:4,arrow:0.6,cannon:1.6,sc:1,rad:1.8,name:'kuşatma aracı'}, poison:{hp:1.1,spd:1.05,atk:6,loot:1,arrow:1,cannon:1,sc:1,rad:1.15,name:'zehirli'}, knight:{hp:2.6,spd:0.85,atk:7,loot:2,arrow:0.35,cannon:1.2,sc:1.12,rad:1.3,name:'şövalye'}, pirate:{hp:1.2,spd:1.2,atk:5,loot:2,arrow:1,cannon:1,sc:1.02,rad:1.15,name:'korsan'}, ice:{hp:1.5,spd:0.95,atk:5,loot:1,arrow:0.8,cannon:1.3,sc:1.05,rad:1.2,name:'buz askeri'}, archer:{hp:0.8,spd:1,atk:3,loot:1,arrow:1,cannon:1.1,sc:0.95,rad:1.1,name:'okçu'}, wolf:{hp:0.55,spd:2.0,atk:3,loot:1,arrow:1,cannon:0.9,sc:1,rad:1.0,name:'kurt'}, raider:{hp:0.8,spd:1.35,atk:4,loot:1,arrow:1,cannon:1,sc:0.95,rad:1.1,name:'akıncı'}, boss:{hp:14,spd:0.6,atk:16,loot:12,arrow:0.8,cannon:1.2,sc:1.9,rad:2.2,name:'patron'}};
function makeEnemy(kind,side){ const K=EK[kind]||EK.grunt; const w=gw(); const hp=Math.round(nightHp()*K.hp*((plan&&plan.mul&&plan.mul[side])||1)); let g, guy=null, pushers=null, ramLog=null, wolf=null; const sc=K.sc;
  if(kind==='wolf'||(kind==='boss'&&bossOf().hat==='wolf')){ wolf=makeWolf(kind==='boss'); g=wolf.g; g.scale.setScalar(sc); }
  else if(kind==='ram'){ g=new THREE.Group(); const fr=new THREE.Group(); for(const x of [-0.6,0.6]){ const b=mesh(G.box,M.woodDark,0.22,0.3,2.8); b.position.set(x,0.55,0); fr.add(b);} for(const [x,z] of [[-0.8,-0.9],[0.8,-0.9],[-0.8,0.9],[0.8,0.9]]){ const wh=mesh(G.cyl,M.iron,0.36,0.16,0.36); wh.rotation.z=Math.PI/2; wh.position.set(x,0.36,z); fr.add(wh);} for(const z of [-0.8,0.8]){ const post=mesh(G.box,M.woodDark,1.5,0.16,0.16); post.position.set(0,1.3,z); fr.add(post); for(const x of [-0.6,0.6]){ const up=mesh(G.box,M.woodDark,0.14,0.9,0.14); up.position.set(x,0.95,z); fr.add(up);} } ramLog=new THREE.Group(); const lg=mesh(G.cyl,M.trunk,0.3,3.2,0.3); lg.rotation.x=Math.PI/2; ramLog.add(lg); const cap=mesh(G.cone,M.iron,0.36,0.5,0.36); cap.rotation.x=Math.PI/2; cap.position.z=1.85; ramLog.add(cap); for(const z of [-1,0.6]){ const band=mesh(G.cyl,M.iron,0.34,0.14,0.34,false); band.rotation.x=Math.PI/2; band.position.z=z; ramLog.add(band);} ramLog.position.set(0,1.05,0.2); fr.add(ramLog); const flag=mesh(G.box,M.enemy,0.05,0.5,0.7,false); flag.position.set(0,2.0,-0.9); fr.add(flag); g.add(fr); pushers=[]; for(const x of [-0.45,0.45]){ const pg=makeGuy('enemy'); pg.tool.visible=false; pg.g.position.set(x,0,-1.9); pg.armL.rotation.x=-1.4; pg.armR.rotation.x=-1.4; g.add(pg.g); pushers.push(pg);} }
  else { guy=makeGuy('enemy'); g=guy.g; g.scale.setScalar(sc);
    if(kind==='poison'){ const hood=mesh(G.cone,mat(0x4a8a3a),0.62,0.8,0.62); hood.position.y=2.0; guy.root.add(hood); guy.g.traverse(o=>{ if(o.material===M.enemy) o.material=mat(0x5aa84a); }); }
    if(kind==='knight'){ const hm=mesh(G.cyl,M.metal,0.62,0.6,0.62); hm.position.y=1.72; const pl=mesh(G.box,M.enemyDark,0.1,0.35,0.5,false); pl.position.y=2.15; guy.root.add(hm,pl); guy.g.traverse(o=>{ if(o.material===M.enemy) o.material=M.iron; }); const sh=mesh(G.box,M.metal,0.08,0.7,0.55); sh.position.set(0.05,-0.25,0.3); guy.armL.add(sh); }
    if(kind==='pirate'){ const brim=mesh(G.cyl,mat(0x1d1d22),0.72,0.07,0.45,false); brim.position.y=1.98; const top=mesh(G.cone,mat(0x1d1d22),0.45,0.4,0.3,false); top.position.y=2.2; guy.root.add(brim,top); }
    if(kind==='ice'){ guy.g.traverse(o=>{ if(o.material===M.enemy||o.material===M.enemyHelm) o.material=mat(0x9ad4f0); }); const cr=mesh(G.cone,mat(0xdff4ff,{emissive:0x3a6a8a}),0.18,0.5,0.18,false); cr.position.y=2.1; guy.root.add(cr); }
    if(kind==='archer'){ const hood=mesh(G.cone,mat(0x6a4a2a),0.6,0.7,0.6); hood.position.y=2.0; guy.root.add(hood); const bow=mesh(G.box,M.woodDark,0.07,1.0,0.07,false); bow.position.set(0,-0.3,0.12); guy.armL.add(bow); guy.tool.visible=false; }
    if(kind==='raider'){ const band=mesh(G.box,mat(0x2f6fd6),0.66,0.14,0.66,false); band.position.y=1.66; guy.root.add(band); const tail=mesh(G.box,mat(0x2f6fd6),0.1,0.08,0.5,false); tail.position.set(-0.2,1.62,-0.42); guy.root.add(tail); }
    if(kind==='boss'&&bossOf().hat!=='horns'){ applyBossLook(guy); } else if(kind==='boss'){ const h1=mesh(G.cone,M.gold,0.14,0.5,0.14); h1.position.set(-0.3,2.0,0); h1.rotation.z=0.4; const h2=h1.clone(); h2.position.x=0.3; h2.rotation.z=-0.4; guy.root.add(h1,h2); }
    if(kind==='shield'){ const sh=mesh(G.cyl,M.iron,0.62,0.08,0.62); sh.rotation.x=Math.PI/2; sh.position.set(0.05,-0.25,0.34); const boss2=mesh(G.sph,M.gold,0.14,0.14,0.08,false); boss2.position.set(0.05,-0.25,0.4); guy.armL.add(sh,boss2); const hm=mesh(G.sph,M.iron,0.66,0.46,0.66); hm.position.set(0,1.68,0); guy.root.add(hm); }
    if(kind==='runner'){ const band=mesh(G.box,M.enemyDark,0.62,0.12,0.62,false); band.position.y=1.66; guy.root.add(band); const tail=mesh(G.box,M.enemyDark,0.1,0.06,0.5,false); tail.position.set(0.2,1.62,-0.4); guy.root.add(tail); } }
  const path=ROADS[side]; const off=rand(-0.5,0.5); const d=SD[side]; g.position.set(path[0][0]+d.t[0]*off+rand(-.3,.3),0,path[0][1]+d.t[1]*off+rand(-.3,.3)); scene.add(g);
  const bar=document.createElement('div'); bar.className='hpbar'+(kind==='boss'||kind==='ram'?' boss':''); bar.innerHTML='<i></i>'; document.body.appendChild(bar);
  enemies.push({g,guy,pushers,ramLog,wolf,kind,K,hp,maxHp:hp,boss:kind==='boss',shooter:kind==='archer'||(kind==='boss'&&bossOf().hat==='hood'),shootLeft:9,shootCd:rand(0.5,1.5),sc,rad:K.rad,side,speed:3.4*K.spd*rand(0.97,1.03),atk:K.atk*atkK(),atkCd:0,atkT:kind==='ram'?1.6:1.0,dead:false,hitT:0,wp:1,off,bar,swing:0,ramT:0});
}
let nightKills=0, runOver=false, slowT=0, gameT=0; let waveT=8, waveActive=false, spawnQueue=0, spawnT=0, spawnIdx=0, waveSeed=0; let plan=null; let gateWarned=false;

function pickKind(i,total){ const L=S.level, n=S.wave; if(n===WAVES&&i===total-1) return 'boss'; const r=Math.random(); if(L>=10){ const ks=['wolf','raider','knight','pirate','ice','poison','shield','archer']; if(r<0.7) return ks[Math.floor(Math.random()*ks.length)]; } if(L>=5&&r>=0.86) return 'archer'; if(L>=9&&r<0.25) return 'ice'; if(L>=8&&r<0.25) return 'pirate'; if(L>=7&&r<0.22) return 'knight'; if(L>=6&&r<0.22) return 'poison'; if(L>=3&&r<0.26) return 'wolf'; if(L>=2&&r<0.4&&r>=0.2) return 'raider'; if(L>=3&&n>=3&&i%10===5) return 'ram'; if((L>=2||n>=4)&&r<0.16+0.02*L) return 'shield'; if(n>=2&&r<0.42+0.02*L) return 'runner'; return 'grunt'; }
// Zorluk eğrisi: gece ilerledikçe ve bölüm arttıkça düşman güçlenir. Kaybettiğin bölümde her denemede biraz yumuşar (en çok 3 kez).
const HPK0=window.__hpk||0; const hpkL=()=>HPK0||Math.min(2.6,2.1+0.25*(S.level-1));
function nightHp(){ const fails=Math.min(3,(S.meta.fails&&S.meta.fails[S.level])||0); const lvK=Math.pow(Math.pow(1.11,S.level-1),S.wave/WAVES); return hpkL()*9*Math.pow(window.__hpg||1.32,S.wave-1)*lvK*(1-0.08*fails); }
// Düşman vuruşu seferle güçlenir: geliştirilmiş sur da zorlanır, gece hep gergin kalır
function atkK(){ return 1+0.12*Math.max(0,gw()-8); }
function nightCount(){ return Math.round((8+5*S.wave)*(1+0.06*(S.level-1)*S.wave/WAVES)*(window.__cnt||1)); }
function planWave(){ const total=nightCount(); const k=sidesActive(); const seed=Math.floor(Math.random()*4); const cnt={N:0,E:0,S:0,W:0}; const kinds=[]; const kc={}; for(let i=0;i<total;i++){ cnt[SIDES[(Math.floor(i/4)+seed)%k]]++; const kd=pickKind(i,total); kinds.push(kd); kc[kd]=(kc[kd]||0)+1; } plan={seed,cnt,total,kinds,kc}; return plan; }
function planText(){ if(!plan) planWave(); let t=SIDES.filter(s=>plan.cnt[s]>0).map(s=>SIDE_TR[s]+' '+plan.cnt[s]).join(' · '); const ex=[]; if(plan.kc.shield) ex.push('kalkanlı '+plan.kc.shield); if(plan.kc.ram) ex.push('kuşatma '+plan.kc.ram); if(plan.kc.boss) ex.push('patron'); if(ex.length) t+=' · '+ex.join(', '); return t; }
// ---- Uyarlanan zorluk: her gece başında her kapının savunma gücü ölçülür; düşmanın toplam canı bu gücün gecelik payına göre ayarlanır.
// Oyuncunun fazladan gücünün bir kısmı ona kalır (üs 0.75): geliştirme hep işe yarar, ama gece hiç boş geçmez.
function defenseDps(side,mA,mC){ const [gx,gz]=sidePos(side,0,2.5); let dps=0; for(const t of towers){ if(!t) continue; const range=D.towerRange()+(t.isC?8:0)+(t.kind==='c'?3:0); const d=Math.hypot(t.g.position.x-gx,t.g.position.z-gz); if(d>range-1.5) continue; if(t.kind==='a'){ const rate=(1.5+0.35*(t.lvl-1))*(t.isC?1.4:1)*D.towerRate(); dps+=D.towerDmg(t.lvl)*rate*(t.isC?2.6:1)*0.9*(mA||1); } else { dps+=D.cannonDmg(t.lvl)*(0.45+0.08*(t.lvl-1))*1.5*(mC||1); } } return dps; }
const TILT=[0,1.15,1.38,1.61,1.84,2.07];
function balanceWave(pl){ const k=sidesActive(); const soldierDps=soldiers.length*D.soldierDmg()/Math.max(0.22,0.7-0.05*(S.lv.soldierTrain||0)); const playerDps=D.swordDmg()/0.45*0.5; const gateMax=D.gateMax(); pl.mul={};
  for(const s of SIDES){ const cnt=pl.cnt[s]; if(!cnt) continue; let avgHp=0,avgAtk=0,mA=0,mC=0,spd=0; for(let i=0;i<pl.kinds.length;i++){ if(SIDES[(Math.floor(i/4)+pl.seed)%k]!==s) continue; const K=EK[pl.kinds[i]]||EK.grunt; avgHp+=K.hp; avgAtk+=K.atk; mA+=K.arrow; mC+=K.cannon; spd+=K.spd; } avgHp/=cnt; avgAtk/=cnt; mA/=cnt; mC/=cnt; spd/=cnt;
    const share=cnt/pl.total; const dps=defenseDps(s,mA,mC)+soldierDps*share+playerDps*share; const travel=(D.towerRange()-3)/(3.4*spd); const grace=clamp(0.5*gateMax*share/(cnt*0.75*avgAtk*atkK()),2.5,14); const T=0.36*cnt+travel+grace;
    const tilt=(window.__tilt||1)*TILT[Math.min(5,S.wave)]*(1-0.06*Math.min(3,(S.meta.fails&&S.meta.fails[S.level])||0)); const budget=dps*T*tilt; const nom=nightHp()*avgHp*cnt; const raw=budget/Math.max(1,nom);
    pl.mul[s]=(S.level<=1&&S.wave<=2)?1:clamp(Math.pow(raw,0.75),0.85,80); } }
function startWave(){ if(!plan) planWave(); balanceWave(plan); gateWarned=false; waveActive=true; nightKills=0; const w=gw(); nightBanner(); SFX.night(); spawnQueue=plan.total; spawnT=0; spawnIdx=0; waveSeed=plan.seed; }
function spawnOne(){ const k=sidesActive(); const side=SIDES[(Math.floor(spawnIdx/4)+waveSeed)%k]; const kind=(plan&&plan.kinds[spawnIdx])||'grunt'; spawnIdx++; makeEnemy(kind,side); rigSpawn(enemies[enemies.length-1]); }
const gateMarks={}; for(const s of SIDES){ const g=new THREE.Group(); const cone=mesh(G.cone,M.enemy,0.55,0.9,0.55,false); cone.rotation.x=Math.PI; const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.7,32),new THREE.MeshBasicMaterial({color:0xd63a3a,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=-5.4; g.add(cone,ring); g.visible=false; scene.add(g); gateMarks[s]={g,cone,ring}; }
function updateGateMarks(dt){ const t=performance.now()/1000; for(const s of SIDES){ const m=gateMarks[s]; let on=false; if(celebT<=0&&!$('levelCard')){ if(!waveActive&&plan&&plan.cnt[s]>0) on=true; if(waveActive&&(enemies.some(e=>!e.dead&&e.side===s)||(spawnQueue>0&&plan&&plan.cnt[s]>0))) on=true; } m.g.visible=on; if(!on) continue; const [x,z]=sidePos(s,0,2.2); m.g.position.set(x,5.6+Math.sin(t*4)*0.3,z); m.g.rotation.y=t*2; const k=1+0.15*Math.sin(t*6); m.ring.scale.set(k,k,1); } }
function damageEnemy(e,dmg,src){ if(e.dead||e.hold) return; if(!(e.flashT>0)) flashOn(e); e.flashT=0.07; let m=src&&e.K&&e.K[src]!==undefined? e.K[src] : 1; if(src==='arrow'&&e.kind==='knight'&&S.lv.ironArrow) m=Math.min(1,m+0.13*S.lv.ironArrow); e.hp-=dmg*m; if(e.boss&&!e.ph2&&e.hp>0) bossPhase(e); e.hitT=0.18; SFX.hit(); if(m<0.7&&src==='arrow'&&Math.random()<0.3) burst(e.g.position.clone().setY(1.2),3,M.metal,0.5); if(e.hp<=0) killEnemy(e); }
function killEnemy(e){ e.dead=true; e.bar.remove(); S.kills++; nightKills++; questEvent('kill',1); if(e.boss){ cgCall(k=>k.game.happytime()); slowT=1.3; spawnBossChest(e.g.position.clone()); } comboKill(e); burst(e.g.position.clone().setY(0.8),9,M.enemy,1); const reward=(8+gw()*2.5)*(e.boss?10:e.kind==='ram'?3:1); scene.remove(e.g); const nl=e.K?e.K.loot:1; for(let i=0;i<nl;i++) dropLoot(e.g.position.x,e.g.position.z); if(e.kind==='ram'){ burst(e.g.position.clone().setY(1),16,M.woodDark,1.2); burst(e.g.position.clone().setY(1),8,M.trunk,1); } if(e.boss){ dropCoins(e.g.position.clone().setY(0.8),60,reward/60,8,1.3); } else if(Math.random()<0.35){ dropCoins(e.g.position.clone().setY(0.8),2,Math.round(reward/6),2.5,1); } }
let gateShake=0, gateDownT=0, levelReward=0;
function updateEnemies(dt){
  if(runOver){ }
  else if(!waveActive){ const tut=S.level===1&&S.wave===1&&!S.towers.some(t=>t.lvl>=1)&&introT<120; if(!tut) waveT-=dt; if(waveT<=0) startWave(); }
  else if(spawnQueue>0){ spawnT-=dt; if(spawnT<=0){ spawnT=0.36; spawnQueue--; spawnOne(); } }
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
    else if(e.shooter&&!last&&shooterTick(e,dt)){ animEnemy(e,dt,false); }
    else if((!last||d>0.5)&&!nearGate){ const ox0=e.g.position.x, oz0=e.g.position.z; if(!blocked){ e.g.position.x+=dx/d*e.speed*dt; e.g.position.z+=dz/d*e.speed*dt; } else { const bx=blocked.g.position.x-e.g.position.x, bz=blocked.g.position.z-e.g.position.z, bd=Math.hypot(bx,bz)||1; e.g.position.x+=(dx/d*0.5-bx/bd*0.4)*e.speed*dt; e.g.position.z+=(dz/d*0.5-bz/bd*0.4)*e.speed*dt; } const adv=Math.hypot(e.g.position.x-ox0,e.g.position.z-oz0); e.stuckT=adv<e.speed*dt*0.5? (e.stuckT||0)+dt : (e.stuckT>2.5&&e.stuckT<3.5? e.stuckT+dt : 0); e.g.rotation.y=Math.atan2(dx,dz); animEnemy(e,dt,!blocked); }
    else { e.atkCd-=dt; animEnemy(e,dt,false); if(nearGate&&d>0.5){ e.g.rotation.y=Math.atan2(dx,dz); } if(e.atkCd<=0){ e.atkCd=e.atkT*(nearGate&&d>0.5?1.6:1); if(e.guy) e.guy.swing=0.3; else e.ramT=0.5; S.gateHp-=e.atk; SFX.gate(); gateShake=0.25; S.minGate=Math.min(S.minGate,Math.max(0,S.gateHp)/D.gateMax()); if(!gateWarned&&S.gateHp<D.gateMax()*0.35){ gateWarned=true; toast('⚠ '+SIDE_TR[e.side]+' kapısı!'); } const [bx,bz]=sidePos(e.side,rand(-1.5,1.5),0); burst(new THREE.Vector3(bx,1.4,bz),4,M.wood,0.6); if(S.gateHp<=0) gateBroken(); } }
    if(e.hitT>0){ e.hitT-=dt; const k=1+e.hitT*0.8; e.g.scale.set(e.sc*k,e.sc/k,e.sc*k); } else e.g.scale.setScalar(e.sc);
    v3.set(e.g.position.x,e.kind==='ram'?2.8:2.4*e.sc,e.g.position.z).project(camera); e.bar.style.left=((v3.x+1)/2*innerWidth)+'px'; e.bar.style.top=((1-v3.y)/2*innerHeight)+'px'; e.bar.firstElementChild.style.width=(clamp(e.hp/e.maxHp,0,1)*100)+'%';
  }
}
function animEnemy(e,dt,moving){ if(e.wolf){ animWolf(e.wolf,dt,moving); if(e.ramT>0){ e.ramT-=dt; e.wolf.head.rotation.x=-0.5*Math.sin(e.ramT*12); } return; } if(e.guy){ animGuy(e.guy,dt,moving,1.1*(e.kind==='runner'?1.4:1)); return; } for(const pg of e.pushers) animGuy(pg,dt,moving,0.9); if(e.ramT>0){ e.ramT-=dt; const k=e.ramT/0.5; e.ramLog.position.z=0.2+(k>0.5? (1-k)*2*1.0 : k*2*1.0); } else e.ramLog.position.z=lerp(e.ramLog.position.z,0.2,Math.min(1,dt*6)); }
let failLeft=0;
function gateBroken(){ if(runOver) return; S.gateHp=0; runOver=true; failLeft=Math.max(1,enemies.filter(e=>!e.dead).length+spawnQueue); SFX.lose(); SFX.boom(); camShake=0.6; setTimeout(showFailCard,900); }
let lastWaveFail=0;
function shoot(from,target,dmg){ const m=mesh(G.cyl,M.handle,0.035,0.8,0.035,false); m.position.copy(from); scene.add(m); projectiles.push({m,target,dmg,spd:26}); }
function updateProjectiles(dt){ for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; const t=p.target; if(t.dead){ scene.remove(p.m); projectiles.splice(i,1); continue; } const to=t.g.position.clone(); to.y=0.9; const dir=to.sub(p.m.position); const dist=dir.length(); if(dist<0.7){ scene.remove(p.m); projectiles.splice(i,1); damageEnemy(t,p.dmg,'arrow'); continue; } dir.normalize(); p.m.position.addScaledVector(dir,p.spd*dt); p.m.lookAt(t.g.position.x,0.9,t.g.position.z); p.m.rotateX(Math.PI/2); } }
function fireCannon(t,e){ const m=mesh(G.sph,M.ball,0.28,0.28,0.28,false); m.position.copy(t.top); scene.add(m); const to=e.g.position.clone(); to.addScaledVector(new THREE.Vector3(Math.sin(e.g.rotation.y),0,Math.cos(e.g.rotation.y)),e.speed*0.5); balls.push({m,from:t.top.clone(),to,t:0,dur:0.55+t.top.distanceTo(to)*0.012,dmg:D.cannonDmg(t.lvl)}); SFX.boom(); burst(t.top.clone(),5,M.smoke,0.4,1.4); }
function updateBalls(dt){ for(let i=balls.length-1;i>=0;i--){ const b=balls[i]; b.t+=dt; const k=Math.min(1,b.t/b.dur); b.m.position.lerpVectors(b.from,b.to,k); b.m.position.y+=Math.sin(k*Math.PI)*6; if(k>=1){ scene.remove(b.m); balls.splice(i,1); burst(b.to.clone().setY(0.6),14,M.smoke,1,1.6); burst(b.to.clone().setY(0.6),8,M.gold,1); SFX.boom(); for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(b.to); if(d<2.8) damageEnemy(e,b.dmg*(d<1.2?1:0.6),'cannon'); } } } }
function nearestEnemy(pos,range){ let best=null,bd=range; for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(pos); if(d<bd){bd=d;best=e;} } return best; }

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
    P.full=v>=cap-0.5; const key=Math.floor(v)+'|'+P.full; if(key!==P.key){ P.key=key; P.L.el.innerHTML=v<1?'':'💰 '+Math.floor(v)+(P.full?' <b class="full">MAX</b>':''); P.L.el.style.display=v<1?'none':''; } P.L.hide=v<1;
    if(v>=1&&Math.hypot(p.x-P.pos.x,p.z-P.pos.z)<2.6){ P.t-=dt; if(P.t<=0){ P.t=0.05; const take=Math.max(1,Math.min(v,Math.max(4,v/10))); S.rg[P.id]=v-take; questEvent('pile',take); fly(P.pos.clone().setY(0.8+n*0.02),player.g,()=>{ S.coins+=take; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.06; SFX.coin(); } } } } }

// ----- kilitli bölgeler: bulut örtüsü + tabela; sefer kazanınca törenle açılır -----
const REG_IC={lake:'🎣',meadow:'🦌',quarry:'⛏️',river:'🪚',swamp:'🍄',iron:'⚒️',coast:'⚓',snow:'💎',dark:'🏰'};
const regionFx={};
function buildClouds(id){ const R=REG[id]; const g=new THREE.Group(); g.position.set(R.c[0],0,R.c[1]); const n=Math.round(10+R.r*1.1); const puffs=[];
  for(let i=0;i<n;i++){ const a=i/n*6.283+rand(-.2,.2), rr=rand(0.2,1)*R.r; const s=rand(3.2,5.6); const m=new THREE.Mesh(G.sph,M.cloud); m.scale.set(s,s*0.62,s); m.position.set(Math.cos(a)*rr,s*0.35+rand(0,1.2),Math.sin(a)*rr); m.castShadow=false; m.receiveShadow=true; g.add(m); puffs.push({m,y0:m.position.y,ph:rand(0,6)}); }
  const post=mesh(G.cyl,M.woodDark,0.14,3.0,0.14); const dir=new THREE.Vector3(-R.c[0],0,-R.c[1]).normalize(); const sp=dir.clone().multiplyScalar(R.r+2.5); post.position.set(sp.x,1.5,sp.z); const board=mesh(G.box,M.plank,2.2,1.0,0.14); board.position.set(sp.x,2.7,sp.z); board.rotation.y=Math.atan2(dir.x,dir.z); g.add(post,board);
  scene.add(g); const L=addLabel(new THREE.Vector3(R.c[0]+sp.x,0,R.c[1]+sp.z),`🔒 ${REG_IC[id]||''}<small>${R.sefer}. sefer</small>`,4.0); L.near=3; L.el.classList.add('lockLbl');
  regionFx[id]={g,puffs,L,rev:null}; }
for(const id in REG) buildClouds(id);
function syncClouds(){ for(const id in regionFx){ const F=regionFx[id]; const on=!revealed(id); if(!F.rev){ F.g.visible=on; F.L.hide=!on; } } }
function revealRegion(id,cb){ const F=regionFx[id]; if(!F){ cb&&cb(); return; } S.revealed[id]=true; save(); F.rev={t:0,cb,done:false}; follow=false; }
function updateRegionFx(dt){ const t=performance.now()/1000; for(const id in regionFx){ const F=regionFx[id]; if(!F.g.visible) continue; for(const pf of F.puffs){ pf.m.position.y=pf.y0+Math.sin(t*0.6+pf.ph)*0.25; }
    if(F.rev){ const r=F.rev; r.t+=dt; const R=REG[id]; const p=player.g.position; const tgt=new THREE.Vector3(R.c[0]-p.x,0,R.c[1]-p.z);
      if(r.t<1.0){ camPan.lerp(tgt,Math.min(1,dt*3.2)); zoomTarget=Math.max(zoomTarget,1.35); }
      else if(r.t<3.2){ camPan.copy(tgt); const k=clamp((r.t-1.2)/1.6,0,1); for(const pf of F.puffs){ const s0=pf.s0||(pf.s0=pf.m.scale.x); const s=s0*(1-k*k); pf.m.scale.set(Math.max(0.001,s),Math.max(0.001,s*0.62),Math.max(0.001,s)); pf.m.position.y+=dt*6*k; } M.cloud.opacity=0.96;
        if(!r.boom&&r.t>1.25){ r.boom=true; SFX.fanfare(); camShake=0.5; for(let i=0;i<8;i++) burst(new THREE.Vector3(R.c[0]+rand(-R.r,R.r),2,R.c[1]+rand(-R.r,R.r)),10,M.cloud,1.4,2.2); celebrate(new THREE.Vector3(R.c[0],0,R.c[1]),1.6); }
        if(!r.ban&&r.t>1.6){ r.ban=true; banner('Yeni bölge: '+R.name,(REG_IC[id]||'')+' '+R.job,'day'); } }
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
  const k=(S.rg.hutFish||0)+'|'+hutCap()+'|'+rg('fishhut'); if(hutLbl._k!==k){ hutLbl._k=k; const full=(S.rg.hutFish||0)>=hutCap(); hutLbl.el.innerHTML=`🐟 ${S.rg.hutFish||0}/${hutCap()}${full?' <b class="full">MAX</b>':''}`; } }
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
  questEvent('fish',1); S.book.fish[f.k]=(S.book.fish[f.k]||0)+1; const first=S.book.fish[f.k]===1; floatText(player.g.position,(qual>0.8?'Mükemmel! ':'')+f.n,first?'green':''); if(first&&f.k!=='sazan'&&f.k!=='levrek'){ banner('Yeni tür: '+f.n,'📖 Deftere eklendi','day'); SFX.fanfare(); }
  if(f.v>=3){ camShake=0.25; celebrate(from.clone().setY(0),0.6); } }
function updateFishing(dt){ const p=player.g.position; const nearPier=revealed('coast')&&Math.hypot(p.x-PIER_END.x,p.z-PIER_END.z)<1.9, nearDock=revealed('lake')&&Math.hypot(p.x-DOCK_END.x,p.z-DOCK_END.z)<1.9; const loc=nearPier?'sea':nearDock?'lake':(FS.loc||'lake'); if(loc!==FS.loc){ if(FS.state!=='idle') endFishing(); FS.loc=loc; } const onDock=nearPier||nearDock; const can=onDock&&!playerMoving&&(S.fish||0)<fishCap()&&!nearestEnemy(p,6)&&!document.querySelector('.intro');
  if(!can){ if(FS.state!=='idle') endFishing(); if(onDock&&(S.fish||0)>=fishCap()&&!playerMoving){ FS.fullT=(FS.fullT||0)-dt; if(FS.fullT<=0){ FS.fullT=2.5; floatText(p,'MAX','red'); } } return; }
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
function updateNets(dt){ const l=rg('net'); netLbl.hide=l<=0||!revealed('lake'); const k=l+'|'+((S.rg.hutFish||0)>=hutCap()); if(netLbl._k!==k){ netLbl._k=k; netLbl.el.innerHTML=''; }
  const t=performance.now()/1000; for(const n of nets){ n.g.position.y=0.07+Math.sin(t*1.3+n.c.x)*0.03; n.t-=dt; if(n.t<=0){ n.t=12; const cnt=l>=3?2:1; if((S.rg.hutFish||0)<hutCap()){ burst(n.c.clone().setY(0.3),8,M.waterLight,1); tone(520,780,0.08,'sine',0.03); toHut(n.c.clone().setY(0.5),cnt); } } } }

// ----- Gölün alanları -----
const LPADS=[
  {id:'rod', grp:'lake', ord:1, name:'Olta', desc:'Nadir balık şansı artar', res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-7.4); return [v.x,v.z]; }, kind:'up', key:'rod', cost:l=>Math.round(55*Math.pow(1.55,l)), max:5, show:()=>revealed('lake')},
  {id:'fisher', grp:'lake', ord:2, name:'Balıkçı', desc:'İskelede senin yerine balık tutar', res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-4.7); return [v.x,v.z]; }, kind:'up', key:'fisher', cost:l=>Math.round(90*Math.pow(1.7,l)), max:3, show:()=>revealed('lake'), onBuy:()=>{ addFisher(); celebrate(lat(LK.r-1.2-(fishers.length-1)*1.9,0),1); }},
  {id:'net', grp:'lake', ord:3, lock:'Bir balıkçı', name:'Balık Ağı', desc:'Makine: balık kendiliğinden gelir', res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-2.0); return [v.x,v.z]; }, kind:'up', key:'net', cost:l=>Math.round(180*Math.pow(1.75,l)), max:5, show:()=>revealed('lake')&&rg('fisher')>=1, onBuy:()=>{ buildNets(); const c=nets.length?nets[nets.length-1].c:LC; celebrate(c.clone().setY(0),1.4); camShake=0.4; }},
  {id:'fishhut', grp:'lake', ord:4, name:'Balıkhane', desc:'Hızlı ve pahalı satar, çok tutar', res:'gold', pos:()=>{ const v=lat(LK.r+7.6,2.4); return [v.x,v.z]; }, kind:'up', key:'fishhut', cost:l=>Math.round(70*Math.pow(1.55,l)), max:5, show:()=>revealed('lake'), onBuy:()=>{ celebrate(HUT.clone(),1); hut.scale.setScalar(1+0.05*rg('fishhut')); }},
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
  const k=(S.rg.huntMeat||0)+'|'+hhutCap()+'|'+rg('smoke'); if(hhutLbl._k!==k){ hhutLbl._k=k; const full=(S.rg.huntMeat||0)>=hhutCap(); hhutLbl.el.innerHTML=`🍖 ${S.rg.huntMeat||0}/${hhutCap()}${full?' <b class="full">MAX</b>':''}`; } }
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
  else { questEvent('hunt',1); for(let j=0;j<n;j++){ setTimeout(()=>fly(pos.clone().setY(0.6),player.g,()=>{ if((S.meat||0)<meatCap()){ S.meat=(S.meat||0)+1; setBack(player); } },'meat',3.2),j*70); } floatText(pos,a.H.n+' +'+n+' et',first?'green':''); if(first&&a.H.k!=='tavsan'){ banner('Yeni av: '+a.H.n,'📖 Deftere eklendi','day'); SFX.fanfare(); } if(a.H.k==='ak_geyik'){ celebrate(pos,1); camShake=0.3; } } }
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
function updateTraps(dt){ const l=rg('trap'); trapLbl.hide=l<=0||!revealed('meadow'); const k=l+'|'+((S.rg.huntMeat||0)>=hhutCap()); if(trapLbl._k!==k){ trapLbl._k=k; trapLbl.el.innerHTML=''; }
  for(const t of traps){ t.t-=dt; t.door.rotation.z=lerp(t.door.rotation.z,t.caught>0?0:-1.2,Math.min(1,dt*8)); if(t.caught>0){ t.caught-=dt; if(t.caught<=0){ const n=l>=3?4:2; if((S.rg.huntMeat||0)<hhutCap()) toHHut(t.c.clone().setY(0.6),n); burst(t.c.clone().setY(0.6),6,M.meat,0.8); } } if(t.t<=0){ t.t=14; t.caught=1.2; tone(300,200,0.08,'square',0.03); } } }
// ----- Çayırın alanları -----
const MPADS=[
  {id:'bow', grp:'meadow', ord:1, name:'Av Bıçağı', desc:'Daha sert vur, çok et al', res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-7.4); return [v.x,v.z]; }, kind:'up', key:'bow', cost:l=>Math.round(70*Math.pow(1.55,l)), max:5, show:()=>revealed('meadow')},
  {id:'hunter', grp:'meadow', ord:2, name:'Avcı', desc:'Senin yerine avlanır', res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-4.7); return [v.x,v.z]; }, kind:'up', key:'hunter', cost:l=>Math.round(110*Math.pow(1.7,l)), max:3, show:()=>revealed('meadow'), onBuy:()=>{ addHunter(); celebrate(hunters[hunters.length-1].guy.g.position.clone(),1); }},
  {id:'trap', grp:'meadow', ord:3, lock:'Bir avcı', name:'Tuzak', desc:'Makine: av kendiliğinden gelir', res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-2.0); return [v.x,v.z]; }, kind:'up', key:'trap', cost:l=>Math.round(220*Math.pow(1.75,l)), max:5, show:()=>revealed('meadow')&&rg('hunter')>=1, onBuy:()=>{ buildTraps(); const t=traps[traps.length-1]; if(t) celebrate(t.c.clone(),1.4); camShake=0.4; }},
  {id:'smoke', grp:'meadow', ord:4, name:'Tütsühane', desc:'Et pahalı satılır, +asker hakkı', res:'gold', pos:()=>{ const v=mat2(MD.r+7.6,2.4); return [v.x,v.z]; }, kind:'up', key:'smoke', cost:l=>Math.round(120*Math.pow(1.6,l)), max:5, show:()=>revealed('meadow'), onBuy:()=>{ celebrate(HHUT.clone(),1.2); hhut.scale.setScalar(1+0.05*rg('smoke')); }},
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
  cutStack.count=Math.min(24,Math.floor(S.rg.cutOut||0)); const k=Math.floor(S.rg.cutOut||0)+'|'+l+'|'+full; if(cutLbl._k!==k){ cutLbl._k=k; cutLbl.el.innerHTML=`🪨 ${Math.floor(S.rg.cutOut||0)}/${cutCap()}${full?' <b class="full">MAX</b>':''}`; } }
const QPADS=[
  {id:'cutter', grp:'quarry', ord:1, name:'Taş Kesme Tezgâhı', desc:'Makine: taş kendiliğinden kesilir', res:'gold', pos:()=>{ const v=qat(QD.r+5,-5.2); return [v.x,v.z]; }, kind:'up', key:'cutter', cost:l=>Math.round(260*Math.pow(1.7,l)), max:5, show:()=>revealed('quarry'), onBuy:()=>{ if(!carts.some(c=>c.kind==='quarry')) addCart('quarry'); cutter.scale.setScalar(1+0.06*(rg('cutter')-1)); celebrate(QCUT.clone(),1.4); camShake=0.4; }},
  {id:'qcart', grp:'quarry', ord:2, lock:'Taş kesme tezgâhı', name:'Taş Arabası', desc:'Araba çok taşır, hızlı gider', res:'gold', pos:()=>{ const v=qat(QD.r+5,-2.6); return [v.x,v.z]; }, kind:'up', key:'qcart', cost:l=>Math.round(150*Math.pow(1.6,l)), max:5, show:()=>revealed('quarry')&&rg('cutter')>=1, onBuy:()=>{ const c=carts.find(c=>c.kind==='quarry'); if(c) celebrate(c.C.g.position.clone(),0.8); }},
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
  const k=Math.floor(S.rg.millIn||0)+'|'+Math.floor(S.rg.millOut||0)+'|'+l; if(millLbl._k!==k){ millLbl._k=k; millLbl.el.innerHTML=working?`<span class="ics"><span class="log-dot"></span>${Math.floor(S.rg.millIn||0)}</span>`:`<span class="ics"><b class="full">⚠</b><span class="log-dot"></span></span>`; } }
const RPADS=[
  {id:'mill', grp:'river', ord:1, name:'Su Değirmeni', desc:'Makine: odunu keresteye çevirir', res:'gold', pos:()=>{ const v=rat(RV.r+2,-4.2); return [v.x,v.z]; }, kind:'up', key:'mill', cost:l=>Math.round(300*Math.pow(1.7,l)), max:5, show:()=>revealed('river'), onBuy:()=>{ if(!carts.some(c=>c.kind==='mill')) addCart('mill'); celebrate(MILL.clone(),1.6); camShake=0.5; }},
  {id:'mcart', grp:'river', ord:2, lock:'Su değirmeni', name:'Kereste Arabası', desc:'Araba çok taşır, hızlı gider', res:'gold', pos:()=>{ const v=rat(RV.r+2,-1.6); return [v.x,v.z]; }, kind:'up', key:'mcart', cost:l=>Math.round(160*Math.pow(1.6,l)), max:5, show:()=>revealed('river')&&rg('mill')>=1, onBuy:()=>{ const c=carts.find(c=>c.kind==='mill'); if(c) celebrate(c.C.g.position.clone(),0.8); }},
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
// =====================================================================
// ---------- p6: son beş bölge — Sisli Bataklık, Demir Dağı, Kıyı, Karlı Geçit, Kara Kale ----------
// Her bölge aynı merdiveni izler: elle topla → işçi → makine → taşıma. Her biri yeni bir düşmana karşı da bir çözüm getirir.
// =====================================================================
function regF(id){ const R=REG[id]; const C=new THREE.Vector3(R.c[0],0,R.c[1]); const DIR=new THREE.Vector3(-R.c[0],0,-R.c[1]).normalize(); const PERP=new THREE.Vector3(-DIR.z,0,DIR.x); return {id,R,C,DIR,PERP,ang:Math.atan2(DIR.x,DIR.z),at:(d,s)=>C.clone().addScaledVector(DIR,d).addScaledVector(PERP,s||0)}; }
const glowTex=(function(){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(255,255,255,0.5)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
function glow(color,size,op){ const m=new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity:op===undefined?0.8:op,depthWrite:false,blending:THREE.AdditiveBlending}); const s=new THREE.Sprite(m); s.scale.set(size,size,1); return s; }
const MUSH_GEO=mergeGeos([new THREE.SphereGeometry(0.3,10,6,0,6.2832,0,Math.PI/2).scale(1,0.8,1).translate(0,0.26,0), new THREE.CylinderGeometry(0.09,0.12,0.3,8).translate(0,0.13,0)]);
const ORE_GEO=new THREE.DodecahedronGeometry(0.27,0);
const BAR_GEO=new THREE.BoxGeometry(0.56,0.16,0.24);
const CRYS_GEO=new THREE.OctahedronGeometry(0.26,0).scale(0.75,1.5,0.75);
const POT_GEO=mergeGeos([new THREE.SphereGeometry(0.2,10,8).translate(0,0.18,0), new THREE.CylinderGeometry(0.07,0.08,0.2,8).translate(0,0.44,0)]);
Object.assign(M,{ mush:mat(0x7fe6c8,{emissive:0x1f7a64}), mushRed:mat(0xe0607a,{emissive:0x5a1a2a}), ore:mat(0x8a5e48), oreVein:mat(0xff8a3a,{emissive:0xc05010}), bar:mat(0xb4bdc7,{emissive:0x1e252c}), crys:mat(0x9fe8ff,{emissive:0x2a86a8}), crysDeep:mat(0x6fb8ff,{emissive:0x1a4a8a}), potion:mat(0xb46ae6,{emissive:0x5a1a7a}),
  bog:new THREE.MeshLambertMaterial({color:0x4f6a48,transparent:true,opacity:0.92}), deadWood:mat(0x5e5248), moss:mat(0x5f7a3e), snow:mat(0xf4f8fb), darkStone:mat(0x46424e), darkStone2:mat(0x2f2c36), darkRoof:mat(0x4a2a5a), evil:mat(0xff5a3a,{emissive:0xff2a10}), warm:mat(0xffd36b,{emissive:0xffa020}),
  sea:new THREE.MeshLambertMaterial({color:0x2f8fc4,transparent:true,opacity:0.95}), foam:new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.55,depthWrite:false}), palm:mat(0x4fa04a), palmTrunk:mat(0xb08050), sail:mat(0xfff4e0,{side:THREE.DoubleSide}), sailRed:mat(0xd9534f,{side:THREE.DoubleSide}),
  mount:mat(0x8a7f74), mount2:mat(0x756b62), lampGlass:mat(0xffd36b,{emissive:0xffb020}), fire:mat(0xff9a2a,{emissive:0xff6a00}), brew:mat(0x7dffb0,{emissive:0x2aa060}), fogPuff:new THREE.MeshLambertMaterial({color:0xc9d6cc,transparent:true,opacity:0,depthWrite:false}) });

// ----- sırtta taşınanlar: mantar, cevher, kristal -----
function backItem(geo,matl,key){ const im=new THREE.InstancedMesh(geo,matl,60); im.count=0; im.frustumCulled=false; player.back.add(im); BACK_EXTRA.push({im,key}); return im; }
backItem(MUSH_GEO,M.mush,'herb'); backItem(ORE_GEO,M.ore,'ore'); backItem(CRYS_GEO,M.crys,'crystal');
const carryCap=()=>12+4*S.lv.feet;
const itemMesh=(geo,m)=>{ const o=new THREE.Mesh(geo,m); o.castShadow=true; return o; };

// ----- toplanabilir kaynak (mantar kümesi, cevher, kristal): vurunca çıkar, bir süre sonra yeniden biter -----
function makeNode(pos,build){ const g=new THREE.Group(); build(g); g.position.copy(pos); g.rotation.y=rand(0,6.28); scene.add(g); return {g,pos:pos.clone(),hp:0,alive:true,regrow:0,pop:1,claimed:null,hit:0}; }
function nodeTick(n,dt){ if(!n.alive){ n.regrow-=dt; if(n.regrow<=0){ n.alive=true; n.pop=0; n.hp=0; } } if(n.alive&&n.pop<1) n.pop=Math.min(1,n.pop+dt*1.4); const s=n.alive?Math.max(0.01,n.pop*(1+0.25*Math.sin(n.pop*Math.PI))):0.001; if(n.hit>0){ n.hit-=dt; const k=1+n.hit*1.4; n.g.scale.set(s*k,s/k,s*k); } else n.g.scale.setScalar(s); }
function spotsIn(F,n,rMin,rMax,avoid){ const out=[]; let guard=0; while(out.length<n&&guard++<600){ const a=rand(0,6.283), r=rand(rMin,rMax); const p=F.C.clone().add(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)); if(avoid.some(v=>Math.hypot(v[0].x-p.x,v[0].z-p.z)<v[1])) continue; if(out.some(o=>Math.hypot(o.x-p.x,o.z-p.z)<2.6)) continue; out.push(p); } return out; }
let mineCd=0, fullWarnT=0;
function playerHarvest(nodes,o){ const p=player.g.position; let best=null,bd=2.6; for(const n of nodes){ if(!n.alive||n.claimed) continue; const d=Math.hypot(n.pos.x-p.x,n.pos.z-p.z); if(d<bd){ bd=d; best=n; } } if(!best) return false;
  if((S[o.key]||0)>=carryCap()){ if(fullWarnT<=0){ fullWarnT=2.5; floatText(p,'MAX','red'); } return true; }
  if(mineCd>0) return true; mineCd=o.cd||0.42; player.swing=0.3; const ang=Math.atan2(best.pos.x-p.x,best.pos.z-p.z); player.g.rotation.y=ang; slash.position.set(p.x,1.4,p.z); slash.rotation.z=-ang+Math.PI/2; slashT=0.22; if(o.soft) tone(700,900,0.06,'sine',0.04); else SFX.chop();
  best.hp=(best.hp||o.hits)-1; best.hit=0.2; burst(best.pos.clone().setY(0.6),5,o.chip,0.8);
  if(best.hp<=0){ const at=best.pos.clone().setY(0.6); best.alive=false; best.regrow=o.regrow; const n=o.yield(); questEvent(o.key==='herb'?'herb':'mine',n); for(let j=0;j<n;j++) setTimeout(()=>fly(at.clone(),player.g,()=>{ if((S[o.key]||0)<carryCap()){ S[o.key]=(S[o.key]||0)+1; setBack(player); } },itemMesh(o.geo,o.mat),3.2),j*70); floatText(at,'+'+n+' '+o.name,''); if(o.onGet) o.onGet(best); }
  return true; }
// teslim noktası: sırttakini binaya boşalt
let dropT6=0;
function deliver(dt,key,front,to,inKey,capFn,geo,matl){ const p=player.g.position; if(!((S[key]||0)>0)) return; if(Math.hypot(p.x-front.x,p.z-front.z)>3) return; dropT6-=dt; if(dropT6>0) return; if((S.rg[inKey]||0)>=capFn()) return; dropT6=0.06; S[key]--; setBack(player); fly(p.clone().setY(1.6),to.clone().setY(1.3),()=>{ S.rg[inKey]=Math.min(capFn(),(S.rg[inKey]||0)+1); },itemMesh(geo,matl),5); SFX.sell(); }
function sendTo(from,to,n,inKey,capFn,geo,matl){ for(let i=0;i<n;i++) setTimeout(()=>fly(from.clone(),to.clone().setY(1.3),()=>{ S.rg[inKey]=Math.min(capFn(),(S.rg[inKey]||0)+1); },itemMesh(geo,matl),1.6),i*110); }
// toplayıcı işçi: en yakın boş kaynağa yürür, çalışır, ürünü binaya uçurur
function addGatherer(list,pos,hat){ const g=makeGuy('worker'); if(hat){ const h=mesh(G.cone,hat,0.5,0.5,0.5); h.position.y=2.0; g.root.add(h); } g.g.position.copy(pos); scene.add(g.g); const w={guy:g,tgt:null,t:0,sw:0,home:pos.clone()}; list.push(w); return w; }
function updateGatherers(list,nodes,dt,o){ for(const w of list){ const p=w.guy.g.position; let moving=false;
    if(w.tgt&&(!w.tgt.alive||w.tgt.claimed!==w)){ w.tgt=null; }
    if(!w.tgt&&!o.full()){ let best=null,bd=1e9; for(const n of nodes){ if(!n.alive||n.claimed) continue; const d=Math.hypot(n.pos.x-p.x,n.pos.z-p.z); if(d<bd){ bd=d; best=n; } } if(best){ best.claimed=w; w.tgt=best; w.t=o.work; } }
    let tx=null,tz=null; if(w.tgt){ tx=w.tgt.pos.x; tz=w.tgt.pos.z; } else { tx=w.home.x; tz=w.home.z; }
    const dx=tx-p.x, dz=tz-p.z, d=Math.hypot(dx,dz); const reach=w.tgt?1.4:0.3;
    if(d>reach){ const sp=Math.min(d,3.4*dt); p.x+=dx/d*sp; p.z+=dz/d*sp; w.guy.g.rotation.y=Math.atan2(dx,dz); moving=true; }
    else if(w.tgt){ const n=w.tgt; w.guy.g.rotation.y=Math.atan2(dx,dz); w.t-=dt; w.sw-=dt; if(w.sw<=0){ w.sw=0.55; w.guy.swing=0.3; n.hit=0.18; burst(n.pos.clone().setY(0.5),3,o.chip,0.6); } if(w.t<=0){ n.claimed=null; n.alive=false; n.regrow=o.regrow; o.send(n.pos.clone().setY(0.7),o.yield()); w.tgt=null; } }
    animGuy(w.guy,dt,moving,1); } }
function clearGatherers(list){ for(const w of list){ scene.remove(w.guy.g); if(w.tgt) w.tgt.claimed=null; } list.length=0; }
// küçük yardımcılar
function stackIM(geo,matl,n,place){ const im=new THREE.InstancedMesh(geo,matl,n); for(let i=0;i<n;i++){ place(i); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); } im.count=0; im.castShadow=true; return im; }
function smokePuff(list,at){ if(list.length>18) return; const m=new THREE.Mesh(G.sph,new THREE.MeshLambertMaterial({color:0xd8d4ce,transparent:true,opacity:0.7,depthWrite:false})); m.scale.setScalar(0.3); m.position.copy(at); m.castShadow=false; scene.add(m); list.push({m,t:0}); }
function updateSmoke(list,dt){ for(let i=list.length-1;i>=0;i--){ const s=list[i]; s.t+=dt; s.m.position.y+=dt*1.4; s.m.position.x+=dt*0.4; s.m.scale.setScalar(0.3+s.t*0.45); s.m.material.opacity=0.7*(1-s.t/2.4); if(s.t>2.4){ scene.remove(s.m); s.m.material.dispose(); list.splice(i,1); } } }
function machLabel(pos,h){ const L=addLabel(pos,'',h); L.near=-1; L.el.classList.add('machLbl'); L.hide=true; return L; }
function pineAt(g,x,z,s,snowy){ const t=mesh(G.cyl,M.trunk,0.22*s,1.2*s,0.22*s); t.position.set(x,0.6*s,z); g.add(t); const cm=snowy?mat(0x7a9a8a):mat(0x2f6d45); for(let i=0;i<3;i++){ const c=mesh(G.cone,cm,(1.3-i*0.3)*s,(1.6)*s,(1.3-i*0.3)*s); c.position.set(x,(1.6+i*0.9)*s,z); g.add(c); if(snowy){ const sc=mesh(G.cone,M.snow,(1.0-i*0.25)*s,0.7*s,(1.0-i*0.25)*s); sc.position.set(x,(2.05+i*0.9)*s,z); g.add(sc); } } }

// =====================================================================
// ---------- Sisli Bataklık: fener (sis), mantar → otacı → iksir; iksir gece suru onarır ----------
// =====================================================================
const SW=regF('swamp'); const SHUT=SW.at(SW.R.r-3.4,5.4), SHUT_FRONT=SW.at(SW.R.r-0.4,4.6), CAUL=SW.at(SW.R.r-2.6,1.4);
const swamp=new THREE.Group(); scene.add(swamp); let caulLiquid=null, caulFire=null, caulGlow=null; const bubbles=[]; const potShelf=stackIM(POT_GEO,M.potion,12,i=>{ vp.set(-1.1+(i%6)*0.44,1.55+Math.floor(i/6)*0.55,-0.95); q.identity(); vs.set(1,1,1); });
(function(){ const F=SW;
  // bataklık gölcükleri, çürük ağaçlar, sazlar, nilüferler
  for(const [d,s,r] of [[-3,-5,3.6],[-6,3,2.8],[1,-7.5,2.4],[-8.5,-2,2.2]]){ const p=F.at(d,s); const w=new THREE.Mesh(new THREE.CircleGeometry(r,24),M.bog); w.rotation.x=-Math.PI/2; w.position.set(p.x,0.05,p.z); w.receiveShadow=true; swamp.add(w); for(let i=0;i<5;i++){ const a=rand(0,6.28), rr=rand(r*0.9,r*1.15); const rd=mesh(G.cyl,M.reed,0.05,rand(0.8,1.4),0.05); rd.position.set(p.x+Math.cos(a)*rr,0.5,p.z+Math.sin(a)*rr); swamp.add(rd); } for(let i=0;i<3;i++){ const a=rand(0,6.28), rr=rand(0,r*0.7); const l=mesh(G.cyl,M.lily,0.35,0.03,0.35,false); l.position.set(p.x+Math.cos(a)*rr,0.08,p.z+Math.sin(a)*rr); swamp.add(l); } }
  for(const [d,s] of [[-9,5],[4,-9],[-2,9],[-10,-6],[6,8.5]]){ const p=F.at(d,s); const g=new THREE.Group(); g.position.set(p.x,0,p.z); g.rotation.y=rand(0,6); const tr=mesh(G.cyl,M.deadWood,0.28,3.6,0.36); tr.position.y=1.8; tr.rotation.z=rand(-.12,.12); g.add(tr); for(let i=0;i<3;i++){ const b=mesh(G.cyl,M.deadWood,0.09,1.6,0.12); b.position.set(0,2.2+i*0.6,0); b.rotation.z=(i%2?1:-1)*rand(0.7,1.1); b.rotation.y=i*2; b.position.x=(i%2?0.5:-0.5); g.add(b); } const moss=mesh(G.box,M.moss,0.1,0.9,0.1,false); moss.position.set(0.5,2.4,0); g.add(moss); swamp.add(g); }
  // otacı kulübesi: kazıklar üstünde, yosunlu çatı, iksir rafı
  const h=new THREE.Group(); for(const [x,z] of [[-1.5,-1.2],[1.5,-1.2],[-1.5,1.2],[1.5,1.2]]){ const st=mesh(G.cyl,M.woodDark,0.14,1.2,0.14); st.position.set(x,0.6,z); h.add(st); }
  const fl=mesh(G.box,M.wood,3.6,0.2,3.0); fl.position.y=1.2; const bk=mesh(G.box,M.woodDark,3.4,2.2,0.16); bk.position.set(0,2.3,-1.35); const s1=mesh(G.box,M.woodDark,0.16,2.2,2.7); s1.position.set(-1.65,2.3,0); const s2=s1.clone(); s2.position.x=1.65;
  const r1=mesh(G.box,M.moss,4.0,0.16,1.9); r1.position.set(0,3.75,-0.7); r1.rotation.x=0.6; const r2=r1.clone(); r2.position.z=0.7; r2.rotation.x=-0.6; const win=mesh(G.cyl,M.brew,0.35,0.06,0.35,false); win.rotation.x=Math.PI/2; win.position.set(0.9,2.6,-1.25);
  const shelf=mesh(G.box,M.woodDark,2.9,0.08,0.4,false); shelf.position.set(0,1.45,-0.95); const shelf2=shelf.clone(); shelf2.position.y=2.0; const counter=mesh(G.box,M.woodDark,3.2,0.8,0.5); counter.position.set(0,1.7,1.2);
  const steps=mesh(G.box,M.wood,1.0,0.12,1.4); steps.position.set(0,0.6,2.0); steps.rotation.x=-0.45; const lantern=mesh(G.box,M.lampGlass,0.25,0.35,0.25,false); lantern.position.set(1.7,3.0,1.5); const lg=glow(0xffc060,2.2,0.7); lg.position.copy(lantern.position); const skull=mesh(G.sph,mat(0xeee6d6),0.25,0.25,0.25,false); skull.position.set(-1.2,2.2,1.5);
  h.add(fl,bk,s1,s2,r1,r2,win,shelf,shelf2,counter,steps,lantern,lg,skull,potShelf); h.position.copy(SHUT); h.rotation.y=F.ang; swamp.add(h);
  // büyük kazan: ateş, fokurdayan yeşil iksir, parıltı
  const c=new THREE.Group(); const pot=new THREE.Mesh(new THREE.SphereGeometry(1,16,10,0,6.2832,Math.PI*0.35,Math.PI*0.65),M.darkStone2); pot.scale.set(1.2,1.0,1.2); pot.position.y=1.15; pot.castShadow=true; const rim=new THREE.Mesh(new THREE.TorusGeometry(1.05,0.1,6,24),M.iron); rim.rotation.x=Math.PI/2; rim.position.y=1.95;
  caulLiquid=new THREE.Mesh(new THREE.CircleGeometry(1.0,20),M.brew); caulLiquid.rotation.x=-Math.PI/2; caulLiquid.position.y=1.85; for(let i=0;i<3;i++){ const a=i/3*6.283; const l=mesh(G.box,M.iron,0.12,1.0,0.12); l.position.set(Math.cos(a)*0.9,0.45,Math.sin(a)*0.9); c.add(l); }
  const logs=mesh(G.log,M.log,1.2,1.2,1.2); logs.rotation.z=Math.PI/2; logs.position.y=0.18; const logs2=logs.clone(); logs2.rotation.y=Math.PI/2; caulFire=mesh(G.cone,M.fire,0.5,0.8,0.5,false); caulFire.position.y=0.5; caulGlow=glow(0x6aff9a,3.6,0.55); caulGlow.position.y=2.4; const fg=glow(0xff8a2a,2.2,0.7); fg.position.y=0.5;
  c.add(pot,rim,caulLiquid,logs,logs2,caulFire,caulGlow,fg); c.position.copy(CAUL); swamp.add(c);
  for(let i=0;i<6;i++){ const b=mesh(G.sph,M.brew,0.12,0.12,0.12,false); b.visible=false; c.add(b); bubbles.push({m:b,t:rand(0,1.5)}); }
  swamp.visible=false; })();
const shutLbl=machLabel(SHUT,4.4);
const swampPile=makePile(SW.at(SW.R.r+6.6,7.2),()=>Math.round((260+180*rg('cauldron'))*(1+0.12*S.level))); swampPile.id='swampPile';
// parlayan mantar kümeleri
const mushNodes=spotsIn(SW,10,2.5,SW.R.r-1.5,[[SHUT,4.5],[CAUL,2.8],[SHUT_FRONT,2.5]]).map(p=>makeNode(p,g=>{ const n=3+Math.floor(Math.random()*3); for(let i=0;i<n;i++){ const m=itemMesh(MUSH_GEO,Math.random()<0.2?M.mushRed:M.mush); const a=i/n*6.283; m.position.set(Math.cos(a)*0.35,0,Math.sin(a)*0.35); m.scale.setScalar(rand(0.9,1.6)); g.add(m); } const gl=glow(0x7fffd0,1.8,0.45); gl.position.y=0.4; g.add(gl); }));
for(const n of mushNodes){ scene.remove(n.g); swamp.add(n.g); }
// mantar tarlası (makine)
const farmBeds=[]; (function(){ for(let i=0;i<3;i++){ const p=SW.at(SW.R.r-7.5,-3+i*2.6); const g=new THREE.Group(); const bed=mesh(G.box,M.woodDark,2.2,0.35,1.2); bed.position.y=0.18; const soil=mesh(G.box,mat(0x3a3024),2.0,0.1,1.0,false); soil.position.y=0.38; g.add(bed,soil); const im=stackIM(MUSH_GEO,M.mush,8,j=>{ vp.set(-0.8+(j%4)*0.52,0.42,-0.25+Math.floor(j/4)*0.5); q.identity(); vs.set(1.1,1.1,1.1); }); im.count=8; g.add(im); const gl=glow(0x7fffd0,2.8,0.35); gl.position.y=0.8; g.add(gl); g.position.copy(p); g.rotation.y=SW.ang; g.visible=false; swamp.add(g); farmBeds.push({g,im,t:rand(0,5)}); } })();
const farmLbl=machLabel(SW.at(SW.R.r-7.5,-0.4),2.8);
const herbCap=()=>30+15*rg('cauldron'); const potCap=()=>4+2*rg('cauldron'); const brewT=()=>Math.max(0.8,4.2-0.6*rg('cauldron'));
const potPrice=()=>(5+0.9*gw())*(1+0.12*rg('cauldron'));
const farmRate=()=>{ const l=rg('farm'); return l<=0?0:l*(l>=3?2:1)/10; };
const herbalists=[];
let brewCd=2, potCd=0, farmT=0, fogWarnWave=-1;
function brewOne(){ const inn=S.rg.herbIn||0; if(inn<2) return false; const full=(S.rg.potions||0)>=potCap(); if(full&&pileVal(swampPile)>=swampPile.capFn()-0.5) return false; S.rg.herbIn=inn-2; burst(CAUL.clone().setY(2.2),8,M.brew,1.2); tone(300,600,0.12,'sine',0.04);
  if(!full){ fly(CAUL.clone().setY(2.2),SHUT.clone().setY(2.4),()=>{ S.rg.potions=Math.min(potCap(),(S.rg.potions||0)+1); },itemMesh(POT_GEO,M.potion),2.4); }
  else { pileAdd(swampPile,potPrice()); fly(CAUL.clone().setY(2.2),swampPile.pos.clone().setY(0.8),null,false,3); } return true; }
function updateSwamp(dt){ const F=SW; const t=performance.now()/1000;
  // oyuncu mantar toplar
  playerHarvest(mushNodes,{key:'herb',hits:1,cd:0.35,soft:true,regrow:14,yield:()=>2,name:'mantar',dest:'otacıya götür',chip:M.mush,geo:MUSH_GEO,mat:M.mush});
  for(const n of mushNodes) nodeTick(n,dt);
  deliver(dt,'herb',SHUT_FRONT,CAUL,'herbIn',herbCap,MUSH_GEO,M.mush);
  updateGatherers(herbalists,mushNodes,dt,{work:2.2,regrow:14,chip:M.mush,full:()=>(S.rg.herbIn||0)>=herbCap(),yield:()=>2,send:(from,n)=>sendTo(from,CAUL,n,'herbIn',herbCap,MUSH_GEO,M.mush)});
  // kazan: 2 mantar → 1 iksir. Raf dolunca iksir satılır, para yığına
  brewCd-=dt*(0.6+0.4*Math.min(1,rg('cauldron'))); if(brewCd<=0){ brewCd=brewT(); brewOne(); }
  const working=(S.rg.herbIn||0)>=2; caulLiquid.material.color.setHSL(0.38,0.9,working?0.62:0.4); caulFire.scale.set(0.5+0.08*Math.sin(t*13),0.8+0.2*Math.sin(t*9),0.5); caulGlow.material.opacity=working?0.55+0.15*Math.sin(t*4):0.25;
  for(const b of bubbles){ b.t-=dt; if(b.t<=0){ b.t=working?rand(0.3,0.9):rand(1.5,3); b.m.visible=true; b.m.position.set(rand(-0.6,0.6),1.9,rand(-0.6,0.6)); b.m.scale.setScalar(0.08); } if(b.m.visible){ b.m.position.y+=dt*0.9; b.m.scale.multiplyScalar(1+dt*1.5); if(b.m.position.y>2.6) b.m.visible=false; } }
  potShelf.count=Math.min(12,S.rg.potions||0);
  // mantar tarlası: kendiliğinden mantar yetişir, kazana akar
  const fl=rg('farm'); const bT=fl>0?Math.min(3,fl)*(fl>=3?2:1)/farmRate():10; farmBeds.forEach((b,i)=>{ b.g.visible=fl>i; b.t-=dt; if(fl>0&&b.g.visible&&b.t<=0){ b.t=bT; if((S.rg.herbIn||0)<herbCap()){ sendTo(b.g.position.clone().setY(0.8),CAUL,fl>=3?2:1,'herbIn',herbCap,MUSH_GEO,M.mush); burst(b.g.position.clone().setY(0.7),6,M.mush,0.8); } } b.im.count=Math.max(2,Math.min(8,Math.round(8*(1-Math.max(0,b.t)/bT)))); });
  farmLbl.hide=fl<=0; if(fl>0){ const k='f'+fl; if(farmLbl._k!==k){ farmLbl._k=k; farmLbl.el.innerHTML=''; } }
  shutLbl.hide=false; const k=(S.rg.herbIn||0)+'|'+(S.rg.potions||0)+'|'+rg('cauldron'); if(shutLbl._k!==k){ shutLbl._k=k; const full=(S.rg.potions||0)>=potCap(); shutLbl.el.innerHTML=`🧪 ${S.rg.potions||0}/${potCap()}${(S.rg.herbIn||0)<2?' <b class="full">⚠ 🍄</b>':''}`; } }
// ----- gece sisi + fenerler: fenersiz kapıda kulelerin menzili kısalır -----
const lampLit=s=>SIDES.indexOf(s)>=0&&SIDES.indexOf(s)<rg('lamp');
const fogOn=()=>revealed('swamp')&&waveActive;
function fogK(t){ if(!fogOn()||t.isC) return 1; return lampLit(nearestSide(t.g.position.x,t.g.position.z))?1:0.72; }
const lampPosts=[]; const fogSides={};
(function(){ for(const s of SIDES){ for(const a of [-1,1]){ const g=new THREE.Group(); const post=mesh(G.cyl,M.iron,0.1,3.2,0.1); post.position.y=1.6; const arm=mesh(G.box,M.iron,0.7,0.08,0.08); arm.position.set(0.3,3.1,0); const glass=mesh(G.box,M.lampGlass,0.36,0.46,0.36,false); glass.position.set(0.6,2.8,0); const cap=mesh(G.cone4,M.iron,0.34,0.3,0.34,false); cap.position.set(0.6,3.15,0); const gl=glow(0xffc060,3.4,0.6); gl.position.set(0.6,2.8,0); const pool=glow(0xffb040,7,0.0); pool.position.set(0.6,0.3,0); g.add(post,arm,glass,cap,gl,pool); g.visible=false; scene.add(g); lampPosts.push({s,a,g,gl,pool,pop:1}); } }
  for(const s of SIDES){ const m=M.fogPuff.clone(); const g=new THREE.Group(); scene.add(g); const puffs=[]; for(let i=0;i<9;i++){ const p=new THREE.Mesh(G.sph,m); p.scale.set(rand(3,5),rand(0.7,1.2),rand(3,5)); p.castShadow=false; p.receiveShadow=false; g.add(p); puffs.push({p,a:rand(-1,1),b:rand(0.2,1),ph:rand(0,6)}); } g.visible=false; fogSides[s]={g,m,puffs,k:0}; } })();
function placeLamps(){ for(const L of lampPosts){ const [x,z]=sidePos(L.s,L.a*3.4,1.4); L.g.position.set(x,0,z); L.g.rotation.y=Math.atan2(-SD[L.s].o[0],-SD[L.s].o[1])+(L.a>0?Math.PI:0); } }
placeLamps();
function updateFog(dt){ const t=performance.now()/1000; const on=revealed('swamp');
  for(const L of lampPosts){ const vis=on&&lampLit(L.s); if(vis&&!L.g.visible){ L.g.visible=true; L.pop=0; } if(!vis) L.g.visible=false; if(L.pop<1){ L.pop=Math.min(1,L.pop+dt*2.5); L.g.scale.setScalar(Math.max(0.01,L.pop*(1+0.3*Math.sin(L.pop*Math.PI)))); } L.gl.material.opacity=0.35+0.45*night+0.08*Math.sin(t*7+L.a); L.pool.material.opacity=0.28*night; }
  for(const s of SIDES){ const F=fogSides[s]; const want=on&&night>0.3&&!lampLit(s)&&SIDES.indexOf(s)<sidesActive()?0.5*night:0; F.k=lerp(F.k,want,Math.min(1,dt*1.5)); F.m.opacity=F.k; F.g.visible=F.k>0.01; if(!F.g.visible) continue; for(const P of F.puffs){ const [x,z]=sidePos(s,P.a*(H+2)+Math.sin(t*0.3+P.ph)*1.5,4+P.b*12); P.p.position.set(x,0.5+Math.sin(t*0.7+P.ph)*0.2,z); } }
  if(fogOn()&&fogWarnWave!==S.level*10+S.wave){ fogWarnWave=S.level*10+S.wave; const dark=SIDES.slice(0,sidesActive()).filter(s=>!lampLit(s)); if(dark.length) setTimeout(()=>toast('🌫️ Sis çöktü — 🏮 fener kur','bad'),2400); }
  // iksir: sur %70'in altındaysa otacının iksiri uçar, suru onarır
  potCd-=dt; if(waveActive&&potCd<=0&&(S.rg.potions||0)>0&&S.gateHp<D.gateMax()*0.7&&!runOver){ potCd=3.2; S.rg.potions--; const cnt={N:0,E:0,S:0,W:0}; for(const e of enemies) if(!e.dead) cnt[e.side]++; const side=SIDES.slice().sort((a,b)=>cnt[b]-cnt[a])[0]; const [gx,gz]=sidePos(side,0,-1); const to=new THREE.Vector3(gx,1.5,gz);
    fly(SHUT.clone().setY(2.5),to,()=>{ const heal=D.gateMax()*0.06; S.gateHp=Math.min(D.gateMax(),S.gateHp+heal); burst(to,14,M.brew,1.4); floatText(to,'+%6 sur 🧪','green'); tone(500,900,0.18,'sine',0.06); },itemMesh(POT_GEO,M.potion),0.9); } }

// =====================================================================
// ---------- Demir Dağı: cevher → demirci ocağı → demir çubuk → araba depoya. Demir: delici ok, demir kapı ----------
// =====================================================================
const IR=regF('iron'); const FORGE=IR.at(IR.R.r-3.6,5.4), FORGE_FRONT=IR.at(IR.R.r-0.8,4.4), FORGE_OUT=IR.at(IR.R.r-1.6,0.6), MINE=IR.at(-8.5,0), DRILL=IR.at(-6.2,-3.4);
const ironArea=new THREE.Group(); scene.add(ironArea); let furnace=null, furnGlow=null, drillBit=null, drillHead=null, drillGrp=null, bellows=null; const forgeSmoke=[]; const barStack=stackIM(BAR_GEO,M.bar,30,i=>{ const row=Math.floor(i/6), col=i%6; vp.set(-0.7+(col%3)*0.6,0.1+row*0.17,(col<3?0:0.3)); e3.set(0,(row%2)*0.0,0); q.setFromEuler(e3); vs.set(1,1,1); });
const mountains=new THREE.Group(); scene.add(mountains);
(function(){ const F=IR;
  // arkada dağ sırası (her zaman görünür: uzaktan merak uyandırır)
  const peaks=[[-15,-14,9,13],[-19,-4,11,16],[-17,8,9,12],[-24,-12,12,18],[-25,5,13,20],[-22,17,10,14],[-13,19,7,9],[-12,-22,7,10]];
  for(const [d,s,r,h] of peaks){ const p=F.at(d,s); const c=new THREE.Mesh(new THREE.ConeGeometry(1,1,7),Math.random()<0.5?M.mount:M.mount2); c.scale.set(r,h,r); c.position.set(p.x,h/2-0.2,p.z); c.rotation.y=rand(0,6); c.castShadow=true; c.receiveShadow=true; mountains.add(c); const cap=new THREE.Mesh(new THREE.ConeGeometry(1,1,7),M.snow); cap.scale.set(r*0.34,h*0.34,r*0.34); cap.position.set(p.x,h-h*0.17-0.2,p.z); cap.rotation.y=c.rotation.y; mountains.add(cap); }
  // maden girişi: kereste çerçeve, ray, vagon
  const mg=new THREE.Group(); const hole=mesh(G.box,mat(0x1a1612),2.6,2.6,0.4,false); hole.position.set(0,1.3,-0.1); const p1=mesh(G.box,M.woodDark,0.3,3.0,0.3); p1.position.set(-1.5,1.5,0.2); const p2=p1.clone(); p2.position.x=1.5; const top=mesh(G.box,M.woodDark,3.6,0.35,0.4); top.position.set(0,3.1,0.2); const bank=mesh(G.dod,M.mount2,3.5,2.6,2.2); bank.position.set(0,1.6,-1.8);
  for(const x of [-0.45,0.45]){ const rail=mesh(G.box,M.iron,0.08,0.06,6,false); rail.position.set(x,0.06,2.8); mg.add(rail); } for(let i=0;i<6;i++){ const sl=mesh(G.box,M.woodDark,1.3,0.06,0.2,false); sl.position.set(0,0.03,0.6+i*1); mg.add(sl); }
  const wag=mesh(G.box,M.iron,1.1,0.6,1.3); wag.position.set(0,0.55,3.6); const wo=mesh(G.dod,M.ore,0.45,0.35,0.45); wo.position.set(0,0.95,3.6); const lamp=glow(0xffb050,2.2,0.7); lamp.position.set(1.5,2.8,0.5);
  mg.add(hole,p1,p2,top,bank,wag,wo,lamp); mg.position.copy(MINE); mg.rotation.y=F.ang; ironArea.add(mg);
  // demirci ocağı: taş ev, baca, kızgın fırın, örs, körük, su teknesi
  const f=new THREE.Group(); const base=mesh(G.box,M.stoneDark,3.8,0.3,3.2); base.position.y=0.15; const wall=mesh(G.box,M.stone,3.4,2.4,0.4); wall.position.set(0,1.5,-1.3); const w2=mesh(G.box,M.stone,0.4,2.4,2.6); w2.position.set(-1.5,1.5,-0.1);
  const roof=mesh(G.box,M.roofDark,4.0,0.16,3.4); roof.position.set(0,2.95,-0.1); roof.rotation.x=0.12; for(const [x,z] of [[1.6,1.3],[-1.6,1.3]]){ const pp=mesh(G.cyl,M.woodDark,0.12,2.8,0.12); pp.position.set(x,1.5,z); f.add(pp); }
  const chim=mesh(G.box,M.stoneDark,0.9,2.6,0.9); chim.position.set(-1.0,3.4,-1.1); furnace=mesh(G.box,M.fire,1.0,0.7,0.2,false); furnace.position.set(-0.6,0.95,-1.05); const fb=mesh(G.box,M.stoneDark,1.6,1.5,1.0); fb.position.set(-0.6,0.9,-0.8); furnGlow=glow(0xff7a20,3.2,0.7); furnGlow.position.set(-0.6,1.0,-0.2);
  const anvil=new THREE.Group(); const ab=mesh(G.box,M.iron,0.35,0.5,0.35); ab.position.y=0.4; const at=mesh(G.box,M.iron,0.9,0.22,0.4); at.position.y=0.75; const horn=mesh(G.cone,M.iron,0.14,0.4,0.14); horn.rotation.z=Math.PI/2; horn.position.set(0.62,0.75,0); anvil.add(ab,at,horn); anvil.position.set(0.9,0,0.3); const stump=mesh(G.cyl,M.trunk,0.4,0.3,0.4); stump.position.set(0.9,0.15,0.3);
  bellows=mesh(G.box,M.belt,0.8,0.3,0.6); bellows.position.set(-0.2,0.5,0.4); const trough=mesh(G.box,M.woodDark,1.2,0.4,0.5); trough.position.set(1.3,0.2,-0.7); const tw=mesh(G.box,M.water,1.0,0.05,0.35,false); tw.position.set(1.3,0.42,-0.7);
  barStack.position.set(1.2,0.3,1.5); f.add(base,wall,w2,roof,chim,fb,furnace,furnGlow,anvil,stump,bellows,trough,tw,barStack); f.position.copy(FORGE); f.rotation.y=F.ang; f.userData.chim=new THREE.Vector3(-1.0,4.8,-1.1); ironArea.add(f); ironArea.userData.forge=f;
  // maden matkabı (makine): kule, dönen matkap, dövme kafası
  drillGrp=new THREE.Group(); for(const [x,z] of [[-1,-1],[1,-1],[0,1.1]]){ const l=mesh(G.box,M.woodDark,0.2,4.2,0.2); l.position.set(x*0.8,2.0,z*0.8); l.rotation.z=-x*0.12; l.rotation.x=z*0.1; drillGrp.add(l); }
  const eng=mesh(G.box,M.iron,1.4,1.0,1.0); eng.position.set(1.6,0.5,0); const pipe=mesh(G.cyl,M.iron,0.14,1.4,0.14); pipe.position.set(1.9,1.6,0); drillHead=new THREE.Group(); drillHead.position.y=3.6; const hb=mesh(G.box,M.bar,0.9,0.6,0.9); drillHead.add(hb); drillBit=new THREE.Group(); const shaft=mesh(G.cyl,M.metal,0.12,2.6,0.12); shaft.position.y=-1.4; const tip=mesh(G.cone,M.metal,0.3,0.7,0.3); tip.rotation.x=Math.PI; tip.position.y=-2.9; drillBit.add(shaft,tip); for(let i=0;i<4;i++){ const fl=mesh(G.box,M.metal,0.5,0.06,0.12,false); fl.position.y=-0.8-i*0.5; fl.rotation.y=i*0.8; drillBit.add(fl); } drillHead.add(drillBit);
  const rockb=mesh(G.dod,M.ore,1.2,0.6,1.2); rockb.position.y=0.3; const v1=mesh(G.box,M.oreVein,0.5,0.15,0.2,false); v1.position.set(0.5,0.55,0.3); drillGrp.add(eng,pipe,drillHead,rockb,v1); drillGrp.position.copy(DRILL); drillGrp.rotation.y=F.ang; drillGrp.visible=false; ironArea.add(drillGrp);
  ironArea.visible=false; })();
const forgeLbl=machLabel(FORGE,4.4); const drillLbl=machLabel(DRILL,5.2);
const oreNodes=spotsIn(IR,9,2.2,IR.R.r-1.5,[[FORGE,4.6],[MINE,3.8],[DRILL,3.2],[FORGE_OUT,2.4],[FORGE_FRONT,2.2]]).map(p=>makeNode(p,g=>{ const r=mesh(G.dod,M.ore,rand(0.8,1.0),rand(0.6,0.8),rand(0.8,1.0)); r.position.y=0.4; g.add(r); for(let i=0;i<3;i++){ const v=mesh(G.box,M.oreVein,0.35,0.12,0.14,false); const a=i*2.1; v.position.set(Math.cos(a)*0.62,0.45+i*0.12,Math.sin(a)*0.62); v.rotation.y=-a; g.add(v); } const gl=glow(0xff8a3a,1.6,0.35); gl.position.y=0.8; g.add(gl); }));
for(const n of oreNodes){ scene.remove(n.g); ironArea.add(n.g); }
const oreCap=()=>36+18*rg('forge'); const smeltT=()=>Math.max(1.0,5-0.7*rg('forge')); const forgeOutCap=()=>30+15*rg('forge');
const drillRate=()=>{ const l=rg('drill'); return l<=0?0:l*(l>=3?1.5:1)/6; };
const miners=[]; let smeltCd=3, drillAcc=0, hammerT=0;
function updateIron(dt){ const t=performance.now()/1000;
  playerHarvest(oreNodes,{key:'ore',hits:3,cd:0.42,regrow:18,yield:()=>3,name:'cevher',dest:'demirciye götür',chip:M.ore,geo:ORE_GEO,mat:M.ore}); for(const n of oreNodes) nodeTick(n,dt);
  deliver(dt,'ore',FORGE_FRONT,FORGE,'oreIn',oreCap,ORE_GEO,M.ore);
  updateGatherers(miners,oreNodes,dt,{work:3.2,regrow:18,chip:M.ore,full:()=>(S.rg.oreIn||0)>=oreCap(),yield:()=>3,send:(from,n)=>sendTo(from,FORGE,n,'oreIn',oreCap,ORE_GEO,M.ore)});
  // matkap: dağdan kendiliğinden cevher çıkarır
  const dl=rg('drill'); drillGrp.visible=dl>0; drillLbl.hide=dl<=0; if(dl>0){ drillGrp.scale.setScalar(1+0.06*(dl-1)); const full=(S.rg.oreIn||0)>=oreCap(); if(!full){ drillBit.rotation.y+=dt*(10+3*dl); drillHead.position.y=3.6+Math.sin(t*(6+dl))*0.25; drillAcc+=drillRate()*dt; if(Math.random()<dt*6) burst(DRILL.clone().setY(0.6),2,M.oreVein,0.7); if(drillAcc>=3){ drillAcc-=3; sendTo(DRILL.clone().setY(1),FORGE,3,'oreIn',oreCap,ORE_GEO,M.ore); } }
    const k='d'+dl+'|'+full; if(drillLbl._k!==k){ drillLbl._k=k; drillLbl.el.innerHTML=''; } }
  // ocak: 3 cevher → 1 demir çubuk
  const inn=S.rg.oreIn||0; const working=inn>=3&&(S.rg.forgeOut||0)<forgeOutCap(); if(working){ smeltCd-=dt; if(smeltCd<=0){ smeltCd=smeltT(); S.rg.oreIn=inn-3; S.rg.forgeOut=(S.rg.forgeOut||0)+1; const f=ironArea.userData.forge; burst(f.localToWorld(new THREE.Vector3(0.9,1.1,0.3)),10,M.fire,1.2); tone(1200,700,0.08,'square',0.04); } }
  hammerT-=dt; if(working&&hammerT<=0){ hammerT=0.5; tone(1500,1400,0.04,'triangle',0.02); }
  furnGlow.material.opacity=working?0.6+0.2*Math.sin(t*11):0.3; furnace.material.emissive.setHex(working?0xff6a00:0x7a2a00); bellows.scale.y=working?1+0.4*Math.sin(t*6):1;
  if(working&&Math.random()<dt*3){ const f=ironArea.userData.forge; smokePuff(forgeSmoke,f.localToWorld(f.userData.chim.clone())); } updateSmoke(forgeSmoke,dt);
  barStack.count=Math.min(30,Math.floor(S.rg.forgeOut||0));
  forgeLbl.hide=false; const k=Math.floor(inn)+'|'+Math.floor(S.rg.forgeOut||0)+'|'+rg('forge'); if(forgeLbl._k!==k){ forgeLbl._k=k; forgeLbl.el.innerHTML=`<span class="ics">${inn<3?'<b class="full">⚠ ⛏️</b>':'⛏️ '+Math.floor(inn)} → <span class="iron-dot"></span>${Math.floor(S.rg.forgeOut||0)}</span>`; } }
// demir arabası: ocaktaki çubukları depoya taşır
function ironRoute(){ const outN=sidePos('N',0,5), inN=sidePos('N',0,-3); return [[FORGE_OUT.x,FORGE_OUT.z],...CART_PATHS[2],[outN[0],outN[1]],[inN[0],inN[1]],[4,-4],[DEPOT_FRONT.x,DEPOT_FRONT.z]]; }
function ironArrive(c,end){ const pos=c.C.g.position.clone();
  if(end==='A'){ const n=Math.min(Math.floor(S.rg.forgeOut||0),cartCap('iron')); if(n<=0) return false; S.rg.forgeOut-=n; c.load='iron'; c.n=n; cargoIron(c.C,n); return true; }
  if(c.n>0){ const n=c.n; for(let i=0;i<Math.min(10,n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),rotPt(DEPOT,0.6,1.0,-0.6),null,itemMesh(BAR_GEO,M.bar),4),i*60); S.iron=(S.iron||0)+n; floatText(pos,'+'+n+' demir','green'); SFX.sell(); c.n=0; cargoIron(c.C,0); } return true; }
function cargoIron(C,n){ while(C.cargo.children.length) C.cargo.remove(C.cargo.children[0]); for(let i=0;i<Math.min(18,n);i++){ const row=Math.floor(i/6), col=i%6; const m=itemMesh(BAR_GEO,M.bar); m.position.set(-0.3+(col%2)*0.6,0.1+row*0.17,-0.7+Math.floor(col/2)*0.6); C.cargo.add(m); } }

// =====================================================================
// ---------- Kıyı: deniz, adalar, sahile vuran sandıklar (sürpriz), deniz feneri, ticaret teknesi ----------
// =====================================================================
const CO=regF('coast'); const SC=new THREE.Vector3(SEA.x,0,SEA.z); const CU=CO.C.clone().sub(SC).normalize();
const rotU=(u,a)=>new THREE.Vector3(u.x*Math.cos(a)-u.z*Math.sin(a),0,u.x*Math.sin(a)+u.z*Math.cos(a));
const PIER_A=SC.clone().addScaledVector(CU,SEA.r+1.6), PIER_B=SC.clone().addScaledVector(CU,SEA.r-6.5), PIER_END=SC.clone().addScaledVector(CU,SEA.r-5.8); const WH=CO.at(-3,6.8), WH_FRONT=CO.at(-0.4,6.8), LIGHT=CO.at(-8.5,-6.5);
const ISLES=[SC.clone().addScaledVector(rotU(CU,0.6),SEA.r-15), SC.clone().addScaledVector(rotU(CU,-0.55),SEA.r-16), SC.clone().addScaledVector(rotU(CU,0.05),SEA.r-22)];
const coast=new THREE.Group(); scene.add(coast); const seaFx={rings:[],foam:null}; let lightBeam=null, lightTop=null, lighthouse=null;
function palm(g,x,z,s){ const pg=new THREE.Group(); pg.position.set(x,0,z); pg.rotation.y=rand(0,6.28); let y=0, lx=0; for(let i=0;i<6;i++){ const seg=mesh(G.cyl,M.palmTrunk,0.2*s,0.8*s,0.2*s); lx+=0.12*s*i*0.3; seg.position.set(lx,y+0.4*s,0); seg.rotation.z=-0.08*i; pg.add(seg); y+=0.72*s; } for(let i=0;i<7;i++){ const lf=mesh(G.box,M.palm,0.5*s,0.06*s,2.2*s); const a=i/7*6.283; lf.position.set(lx+Math.sin(a)*0.9*s,y+0.05*s,Math.cos(a)*0.9*s); lf.rotation.y=a; lf.rotation.x=0.35; pg.add(lf); } const nut=mesh(G.sph,M.woodDark,0.18*s,0.18*s,0.18*s); nut.position.set(lx,y-0.2*s,0.15*s); pg.add(nut); g.add(pg); }
(function(){ // deniz her zaman görünür (dünyanın köşesi)
  const sea=new THREE.Mesh(new THREE.CircleGeometry(SEA.r,72),M.sea); sea.rotation.x=-Math.PI/2; sea.position.set(SC.x,0.06,SC.z); sea.receiveShadow=true; scene.add(sea); const far=new THREE.Mesh(new THREE.CircleGeometry(SEA.r+70,96),M.sea); far.rotation.x=-Math.PI/2; far.position.set(SC.x,-0.15,SC.z); scene.add(far);
  const foam=new THREE.Mesh(new THREE.RingGeometry(SEA.r-0.5,SEA.r+0.25,96),M.foam); foam.rotation.x=-Math.PI/2; foam.position.set(SC.x,0.08,SC.z); scene.add(foam); seaFx.foam=foam;
  for(let i=0;i<8;i++){ const r=new THREE.Mesh(new THREE.RingGeometry(0.6,0.8,20),M.waterLight.clone()); r.rotation.x=-Math.PI/2; r.position.y=0.09; scene.add(r); seaFx.rings.push({m:r,t:rand(0,3)}); }
  for(const [k,I] of ISLES.entries()){ const isl=mesh(G.cyl,M.sand,k===2?4.2:3.2,0.5,k===2?4.2:3.2); isl.position.set(I.x,0.1,I.z); scene.add(isl); const grass=mesh(G.cyl,M.lily,k===2?2.6:1.9,0.1,k===2?2.6:1.9,false); grass.position.set(I.x,0.38,I.z); scene.add(grass); const g=new THREE.Group(); scene.add(g); palm(g,I.x+0.6,I.z-0.4,0.9); palm(g,I.x-1,I.z+0.6,0.75); if(k===2){ const hut2=mesh(G.box,M.wood,1.6,1.1,1.4); hut2.position.set(I.x+1.2,0.9,I.z+1.2); const rf=mesh(G.cone4,M.reed,1.4,1.0,1.4); rf.position.set(I.x+1.2,1.95,I.z+1.2); rf.rotation.y=Math.PI/4; scene.add(hut2,rf); } for(let j=0;j<3;j++){ const cr=mesh(G.box,M.chest,0.6,0.5,0.6); cr.position.set(I.x-0.8+j*0.7,0.6,I.z-1.4); scene.add(cr); } }
  // iskele
  const len=PIER_A.distanceTo(PIER_B); const mid=PIER_A.clone().add(PIER_B).multiplyScalar(0.5); const ang=Math.atan2(CU.x,CU.z); const deck=mesh(G.box,M.plank,2.2,0.2,len); deck.position.set(mid.x,0.55,mid.z); deck.rotation.y=ang; coast.add(deck); for(let i=0;i<=5;i++){ const p=PIER_A.clone().lerp(PIER_B,i/5); for(const s of [-1,1]){ const post=mesh(G.cyl,M.woodDark,0.14,1.4,0.14); post.position.set(p.x+Math.cos(ang)*s*1.0,0.2,p.z-Math.sin(ang)*s*1.0); coast.add(post); } }
  // liman ambarı
  const w=new THREE.Group(); const b=mesh(G.box,M.wood,3.8,2.2,3.0); b.position.y=1.1; const r1=mesh(G.box,M.roof,4.3,0.16,1.9); r1.position.set(0,2.75,-0.72); r1.rotation.x=0.6; const r2=r1.clone(); r2.position.z=0.72; r2.rotation.x=-0.6; const door=mesh(G.box,M.woodDark,1.3,1.6,0.1,false); door.position.set(0,0.8,1.52); w.add(b,r1,r2,door); for(let j=0;j<4;j++){ const cr=mesh(G.box,M.chest,0.7,0.6,0.7); cr.position.set(-1.4+j*0.9,0.3,2.2); w.add(cr); } const barrel=mesh(G.cyl,M.woodDark,0.4,0.8,0.4); barrel.position.set(2.3,0.4,1.4); w.add(barrel); const anchor=mesh(G.box,M.iron,0.12,1.2,0.12); anchor.position.set(2.3,0.6,-1); w.add(anchor); w.position.copy(WH); w.rotation.y=CO.ang; coast.add(w);
  // deniz feneri (makine seviyesiyle büyür)
  lighthouse=new THREE.Group(); for(let i=0;i<5;i++){ const sgm=mesh(G.cyl,i%2?M.banner:M.canvas,1.2-i*0.12,1.4,1.2-i*0.12); sgm.position.y=0.7+i*1.4; lighthouse.add(sgm); } const gal=mesh(G.cyl,M.iron,0.95,0.15,0.95); gal.position.y=7.1; lightTop=mesh(G.cyl,M.lampGlass,0.55,0.9,0.55,false); lightTop.position.y=7.65; const cap=mesh(G.cone,M.banner,0.75,0.8,0.75); cap.position.y=8.5; const lg=glow(0xfff0a0,5,0.8); lg.position.y=7.65; lighthouse.add(gal,lightTop,cap,lg);
  lightBeam=new THREE.Mesh(new THREE.ConeGeometry(1.6,20,16,1,true).rotateZ(Math.PI/2).translate(11,0,0),new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:0.0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); lightBeam.position.y=7.65; lighthouse.add(lightBeam); lighthouse.position.copy(LIGHT); lighthouse.visible=false; coast.add(lighthouse);
  for(const [d,s] of [[4,-9],[-2,-10],[7,8],[-6,11],[2,10.5]]){ const p=CO.at(d,s); if(Math.hypot(p.x-SC.x,p.z-SC.z)>SEA.r+1.5) palm(coast,p.x,p.z,rand(0.9,1.2)); }
  coast.visible=false; })();
const whLbl=machLabel(WH,4.0);
const coastPile=makePile(CO.at(CO.R.r+6.6,7.2),()=>Math.round((320+220*rg('harbor'))*(1+0.12*S.level))); coastPile.id='coastPile';
// ----- tekne (makine): adalarla ticaret seferi, dönüşte para yığına -----
const boats=[];
function makeBoat(){ const g=new THREE.Group(); const hull=mesh(G.box,M.woodDark,1.6,0.7,3.6); hull.position.y=0.35; const bow=mesh(G.cone4,M.woodDark,1.1,1.2,0.7); bow.rotation.x=Math.PI/2; bow.rotation.y=Math.PI/4; bow.position.set(0,0.35,2.3); bow.scale.set(1.1,1.2,0.7); const rim=mesh(G.box,M.wood,1.7,0.12,3.7,false); rim.position.y=0.72;
  const mast=mesh(G.cyl,M.woodDark,0.08,3.6,0.08); mast.position.set(0,2.4,0.2); const sail=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.4,4,4),M.sail); sail.position.set(0,2.6,0.28); sail.castShadow=true; const stripe=new THREE.Mesh(new THREE.PlaneGeometry(2.2,0.45),M.sailRed); stripe.position.set(0,2.6,0.3); const flag=mesh(G.box,M.flag,0.04,0.3,0.55,false); flag.position.set(0,4.3,-0.1);
  const cargo=new THREE.Group(); for(let j=0;j<4;j++){ const cr=mesh(G.box,M.chest,0.5,0.45,0.5); cr.position.set(j%2?0.35:-0.35,0.95,-0.6-Math.floor(j/2)*0.6); cargo.add(cr); } cargo.visible=false;
  g.add(hull,bow,rim,mast,sail,stripe,flag,cargo); g.position.copy(PIER_B); scene.add(g); const b={g,sail,cargo,state:'load',t:1.5,isle:boats.length%ISLES.length,k:0,from:PIER_B.clone(),to:PIER_B.clone()}; boats.push(b); return b; }
let whSellT=0; const seaFishPrice=()=>(4+0.8*gw())*(1+0.1*rg('harbor'));
const boatSpd=()=>3.2+0.7*rg('boat'); const tripValue=()=>(24+5*gw())*(1+0.2*rg('harbor'))*(1+0.15*Math.max(0,rg('boat')-1));
const boatWantN=()=>rg('boat')<=0?0:(rg('harbor')>=3?2:1);
function isleDock(i){ const I=ISLES[i]; return I.clone().add(PIER_B.clone().sub(I).normalize().multiplyScalar(i===2?5:4)); }
function updateBoats(dt){ const t=performance.now()/1000; while(boats.length<boatWantN()) makeBoat();
  for(const b of boats){ const g=b.g;
    if(b.state==='load'||b.state==='unload'){ b.t-=dt; if(b.t<=0){ if(b.state==='load'){ b.state='go'; b.from=g.position.clone(); b.to=isleDock(b.isle); b.k=0; b.cargo.visible=false; } else { b.state='back'; b.from=g.position.clone(); b.to=PIER_B.clone(); b.k=0; b.cargo.visible=true; burst(g.position.clone().setY(1),6,M.coin,1); } } }
    else { const len=b.from.distanceTo(b.to)||1; b.k=Math.min(1,b.k+dt*boatSpd()/len); g.position.lerpVectors(b.from,b.to,b.k); const ang=Math.atan2(b.to.x-b.from.x,b.to.z-b.from.z); let dr=ang-g.rotation.y; dr=Math.atan2(Math.sin(dr),Math.cos(dr)); g.rotation.y+=dr*Math.min(1,dt*3);
      if(Math.random()<dt*4) burst(g.position.clone().setY(0.2),1,M.foam,0.3);
      if(b.k>=1){ if(b.state==='go'){ b.state='unload'; b.t=2.2; } else { b.state='load'; b.t=2.5; b.cargo.visible=false; b.isle=(b.isle+1)%ISLES.length; const v=tripValue(); const before=pileVal(coastPile); pileAdd(coastPile,v); const got=pileVal(coastPile)-before; for(let i=0;i<6;i++) setTimeout(()=>fly(g.position.clone().setY(1.2),coastPile.pos.clone().setY(0.8),null,false,2.2),i*90); if(got>0) floatText(g.position.clone(),'+'+Math.round(got)+' ticaret',''); } } }
    g.position.y=0.12+Math.sin(t*1.6+b.isle)*0.08; g.rotation.z=Math.sin(t*1.2+b.isle)*0.05; b.sail.scale.set(1,1,1); b.sail.position.z=0.28+(b.state==='go'||b.state==='back'?0.15:0); } }
// ----- sandıklar: dalgalar sahile atar; aç, ne çıkacağı sürpriz -----
const RAR={common:{n:'Sıradan',c:0xc9a06a,w:60},rare:{n:'Nadir',c:0x4aa8ff,w:28},epic:{n:'Destansı',c:0xb46ae6,w:10},legend:{n:'Efsanevi',c:0xffc93a,w:2}};
const chests=[]; let chestT=10;
const chestMax=()=>2+Math.min(2,rg('lighthouse')); const chestEvery=()=>Math.max(12,30-3.5*rg('lighthouse'));
function rollRar(){ const lh=rg('lighthouse'); const w={common:60-4*lh,rare:28+1*lh,epic:10+2*lh,legend:2+1*lh}; let tot=0; for(const k in w) tot+=w[k]; let r=Math.random()*tot; for(const k in w){ r-=w[k]; if(r<=0) return k; } return 'common'; }
function spawnChest(instant){ const a=(Math.random()<0.5?-1:1)*rand(0.12,0.5); const u=rotU(CU,a); const land=SC.clone().addScaledVector(u,SEA.r+1.4), sea=SC.clone().addScaledVector(u,SEA.r-7); const rar=rollRar(); const R=RAR[rar];
  const g=new THREE.Group(); const trim=mat(R.c,rar==='common'?{}:{emissive:new THREE.Color(R.c).multiplyScalar(0.35)}); const body=mesh(G.box,M.chest,1.0,0.6,0.7); body.position.y=0.3; const lidG=new THREE.Group(); lidG.position.set(0,0.6,-0.35); const lid=mesh(G.box,M.chest,1.02,0.26,0.72); lid.position.set(0,0.13,0.35); lidG.add(lid); for(const x of [-0.35,0.35]){ const bd=mesh(G.box,trim,0.1,0.64,0.74,false); bd.position.set(x,0.31,0); g.add(bd); const bl=mesh(G.box,trim,0.1,0.28,0.76,false); bl.position.set(x,0.13,0.35); lidG.add(bl); } const lock=mesh(G.box,M.chestGold,0.18,0.22,0.08,false); lock.position.set(0,0.5,0.37); g.add(body,lidG,lock);
  let gl=null, beam=null; if(rar!=='common'){ gl=glow(R.c,rar==='legend'?4:2.8,0.7); gl.position.y=0.9; g.add(gl); beam=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.6,9,12,1,true),new THREE.MeshBasicMaterial({color:R.c,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); beam.position.y=4.5; g.add(beam); }
  g.rotation.y=Math.atan2(-u.x,-u.z)+rand(-.4,.4); g.position.copy(instant?land:sea); scene.add(g); chests.push({g,lidG,gl,beam,rar,land,sea,k:instant?1:0,open:0,gone:0}); }
function openChest(c){ c.open=0.001; questEvent('chest',1); const pos=c.g.position.clone(); const R=RAR[c.rar]; const w=gw(); const book=S.book.chest||(S.book.chest={}); book[c.rar]=(book[c.rar]||0)+1; let txt='';
  const gold=Math.round((20+6*w)*({common:1,rare:1.6,epic:2.6,legend:5}[c.rar])); const n=Math.min(24,8+Math.round(gold/25)); dropCoins(pos.clone().setY(1),n,gold/n,2.2,1.4); txt='💰 '+gold;
  if(c.rar==='rare'){ if(Math.random()<0.5&&revealed('river')){ const p=6+Math.floor(Math.random()*7); S.planks=(S.planks||0)+p; txt+=` · +${p} kereste`; } else { const s=10+Math.floor(Math.random()*11); S.stone+=s; setStonePile(Math.min(18,S.stone)); txt+=` · +${s} taş`; } }
  if(c.rar==='epic'){ const fe=4+Math.floor(Math.random()*5); S.iron=(S.iron||0)+fe; txt+=` · +${fe} demir`; }
  if(c.rar==='legend'){ S.meta.crowns+=1; txt+=' · 👑 +1 taç'; }
  const pw={common:0.5,rare:0.8,epic:1.2,legend:1.8}[c.rar]; celebrate(pos,pw); burst(pos.clone().setY(1),10+6*pw,M.chestGold,1.5); if(c.rar==='common') SFX.coin(); else SFX.fanfare();
  if(c.rar==='epic'||c.rar==='legend'){ banner(R.n+' sandık!',txt,'day'); camShake=0.5; if(c.rar==='legend') confetti(); } floatText(pos,R.n+': '+txt,c.rar==='common'?'':'green'); save(); }
function updateChests(dt){ const t=performance.now()/1000; if(!revealed('coast')) return; chestT-=dt; if(chestT<=0){ chestT=chestEvery(); if(chests.filter(c=>!c.open).length<chestMax()) spawnChest(false); }
  const p=player.g.position; for(let i=chests.length-1;i>=0;i--){ const c=chests[i]; const g=c.g;
    if(c.k<1){ c.k=Math.min(1,c.k+dt/4); g.position.lerpVectors(c.sea,c.land,c.k*c.k*(3-2*c.k)); g.position.y=0.1+Math.sin(t*3+i)*0.12*(1-c.k); g.rotation.z=Math.sin(t*2+i)*0.2*(1-c.k); if(c.k>=1) burst(c.land.clone().setY(0.3),8,M.foam,0.8); }
    else if(!c.open){ g.position.y=0; g.rotation.z=0; if(c.beam) c.beam.material.opacity=0.22+0.1*Math.sin(t*3); if(c.gl) c.gl.material.opacity=0.6+0.25*Math.sin(t*4); const s=1+0.04*Math.sin(t*5); g.scale.setScalar(s); if(Math.hypot(p.x-g.position.x,p.z-g.position.z)<2.2) openChest(c); }
    else { c.open+=dt; c.lidG.rotation.x=-Math.min(1.9,c.open*6); if(c.beam) c.beam.material.opacity=Math.max(0,0.5-c.open*0.2); if(c.open>2.2){ const s=Math.max(0.001,1-(c.open-2.2)*2); g.scale.setScalar(s); if(s<=0.01){ scene.remove(g); chests.splice(i,1); } } } } }
function updateCoast(dt){ const t=performance.now()/1000; updateBoats(dt); updateChests(dt);
  const lh=rg('lighthouse'); lighthouse.visible=lh>0; if(lh>0){ lighthouse.scale.setScalar(0.85+0.06*lh); lightBeam.rotation.y=t*0.9; lightBeam.material.opacity=0.03+0.25*night; lightTop.material.emissive.setHex(0xffb020); }
  // limanda balık satışı: sırttaki balık anında ticarete gider
  { const p=player.g.position; if((S.fish||0)>0&&Math.hypot(p.x-WH_FRONT.x,p.z-WH_FRONT.z)<3){ whSellT-=dt; if(whSellT<=0&&pileVal(coastPile)<coastPile.capFn()-0.5){ whSellT=0.07; S.fish--; setBack(player); pileAdd(coastPile,seaFishPrice()); fly(p.clone().setY(1.6),WH.clone().setY(1.2),null,'fish',5); SFX.sell(); } } }
  whLbl.hide=false; const k=boats.length+'|'+rg('boat')+'|'+rg('harbor')+'|'+lh; if(whLbl._k!==k){ whLbl._k=k; whLbl.el.innerHTML=boats.length?`⛵ ${boats.length}`:''; } }
function updateSea(dt){ const t=performance.now()/1000; seaFx.foam.scale.setScalar(1+0.006*Math.sin(t*1.3)); seaFx.foam.material.opacity=0.4+0.2*Math.sin(t*1.3);
  for(const r of seaFx.rings){ r.t-=dt; if(r.t<=0){ r.t=rand(1.5,3.5); const a=rand(0,6.28), rr=rand(4,SEA.r-3); r.m.position.set(SC.x+Math.cos(a)*rr,0.09,SC.z+Math.sin(a)*rr); r.age=0; } r.age=(r.age||0)+dt; const k=Math.min(1,r.age/1.6); r.m.scale.setScalar(0.6+2.4*k); r.m.material.opacity=0.45*(1-k); } }

// =====================================================================
// ---------- Karlı Geçit: kış, kristal → kuyumcu → para; kristal matkabı (makine) ----------
// =====================================================================
const SN=regF('snow'); const JEW=SN.at(SN.R.r-3.6,5.4), JEW_FRONT=SN.at(SN.R.r-0.8,4.4), CDRILL=SN.at(-5.5,-3.2);
const snowArea=new THREE.Group(); scene.add(snowArea); let cdBit=null, cdGrp=null, cdGlow=null; const jewSmoke=[]; const jewStock=stackIM(CRYS_GEO,M.crys,16,i=>{ vp.set(-1.1+(i%8)*0.3,1.05,0.95+Math.floor(i/8)*0.3); e3.set(0,rand(0,3),0); q.setFromEuler(e3); vs.set(0.9,0.9,0.9); });
(function(){ const F=SN;
  for(let i=0;i<14;i++){ const a=rand(0,6.28), r=rand(F.R.r*0.55,F.R.r+2); const p=F.C.clone().add(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)); if(p.distanceTo(JEW)<5||p.distanceTo(JEW_FRONT)<4||p.distanceTo(CDRILL)<4||p.distanceTo(F.at(F.R.r+2,0))<6) continue; pineAt(snowArea,p.x,p.z,rand(0.8,1.25),true); }
  for(let i=0;i<10;i++){ const a=rand(0,6.28), r=rand(2,F.R.r); const p=F.C.clone().add(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)); const d=mesh(G.sph,M.snow,rand(0.8,1.6),rand(0.3,0.5),rand(0.8,1.6)); d.position.set(p.x,0.05,p.z); snowArea.add(d); }
  // kuyumcu: kütük ev, karlı çatı, baca, vitrinde kristaller
  const h=new THREE.Group(); for(let i=0;i<5;i++){ for(const [x,z,ry,l] of [[0,-1.3,0,3.6],[0,1.3,0,3.6],[-1.7,0,Math.PI/2,2.8],[1.7,0,Math.PI/2,2.8]]){ if(z>0&&i<3&&Math.abs(x)<0.1) continue; const lg=mesh(G.cyl,M.log,0.22,l,0.22); lg.rotation.z=Math.PI/2; lg.rotation.y=ry; lg.position.set(x,0.25+i*0.42,z); h.add(lg); } }
  const door=mesh(G.box,M.woodDark,1.0,1.3,0.1,false); door.position.set(0,0.65,1.32); const r1=mesh(G.box,M.roofDark,4.2,0.16,2.0); r1.position.set(0,2.75,-0.75); r1.rotation.x=0.62; const r2=r1.clone(); r2.position.z=0.75; r2.rotation.x=-0.62; const s1=mesh(G.box,M.snow,4.25,0.12,2.0,false); s1.position.set(0,2.86,-0.75); s1.rotation.x=0.62; const s2=s1.clone(); s2.position.z=0.75; s2.rotation.x=-0.62;
  const chim=mesh(G.box,M.stoneDark,0.6,1.4,0.6); chim.position.set(1.1,3.3,-0.6); const table=mesh(G.box,M.woodDark,2.6,0.8,0.8); table.position.set(-0.4,0.5,1.9); const win=mesh(G.box,M.warm,0.6,0.5,0.08,false); win.position.set(1.72,1.3,0.3); win.rotation.y=Math.PI/2; const wg=glow(0xffb060,1.8,0.6); wg.position.set(1.9,1.3,0.3);
  jewStock.position.set(0.7,0,0.9); h.add(door,r1,r2,s1,s2,chim,table,win,wg,jewStock); h.position.copy(JEW); h.rotation.y=F.ang; h.userData.chim=new THREE.Vector3(1.1,4.1,-0.6); snowArea.add(h); snowArea.userData.jew=h;
  // kristal matkabı (makine): buz kayası üstünde döner matkap
  cdGrp=new THREE.Group(); const outc=new THREE.Group(); for(let i=0;i<7;i++){ const c=itemMesh(CRYS_GEO,i%2?M.crys:M.crysDeep); c.scale.setScalar(rand(2.5,4.2)); const a=i/7*6.283; c.position.set(Math.cos(a)*0.9,0.8,Math.sin(a)*0.9); c.rotation.set(rand(-.4,.4),rand(0,3),rand(-.4,.4)); outc.add(c); } cdGrp.add(outc);
  const fr=mesh(G.box,M.iron,3.0,0.25,0.25); fr.position.y=4.2; for(const x of [-1.4,1.4]){ const l=mesh(G.box,M.iron,0.22,4.2,0.22); l.position.set(x,2.1,0); cdGrp.add(l); } cdBit=new THREE.Group(); cdBit.position.y=3.9; const sh=mesh(G.cyl,M.metal,0.12,1.8,0.12); sh.position.y=-0.9; const tp=mesh(G.cone,M.crysDeep,0.3,0.6,0.3); tp.rotation.x=Math.PI; tp.position.y=-2.0; cdBit.add(sh,tp); const boiler=mesh(G.cyl,M.bar,0.6,1.4,0.6); boiler.position.set(2.2,0.7,0); cdGlow=glow(0x8fe6ff,4,0.5); cdGlow.position.y=1.4; cdGrp.add(fr,cdBit,boiler,cdGlow); cdGrp.position.copy(CDRILL); cdGrp.rotation.y=F.ang; cdGrp.visible=false; snowArea.add(cdGrp);
  snowArea.visible=false; })();
const jewLbl=machLabel(JEW,4.3); const cdLbl=machLabel(CDRILL,5.0);
const snowPile=makePile(SN.at(SN.R.r+6.6,7.2),()=>Math.round((340+240*rg('jeweler'))*(1+0.12*S.level))); snowPile.id='snowPile';
const crysNodes=spotsIn(SN,9,2.2,SN.R.r-1.5,[[JEW,4.6],[CDRILL,3.6],[JEW_FRONT,2.4]]).map(p=>makeNode(p,g=>{ for(let i=0;i<4;i++){ const c=itemMesh(CRYS_GEO,i%2?M.crys:M.crysDeep); c.scale.setScalar(rand(1.4,2.4)); const a=i/4*6.283; c.position.set(Math.cos(a)*0.3,0.4,Math.sin(a)*0.3); c.rotation.set(rand(-.5,.5),rand(0,3),rand(-.5,.5)); g.add(c); } const gl=glow(0x9fe8ff,2.2,0.5); gl.position.y=0.7; g.add(gl); }));
for(const n of crysNodes){ scene.remove(n.g); snowArea.add(n.g); }
const crysCap=()=>30+15*rg('jeweler'); const jewSellT=()=>Math.max(0.6,2.6-0.35*rg('jeweler')); const crysPrice=()=>(6+1.1*gw())*(1+0.12*rg('jeweler'));
const cdRate=()=>{ const l=rg('cdrill'); return l<=0?0:l*(l>=3?1.5:1)/8; };
const cminers=[]; let jewT=0, cdAcc=0;
// kar yağışı: bölgede her zaman, 9. seferde her yerde
const snowPts=(function(){ const n=700; const geo=new THREE.BufferGeometry(); const a=new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3]=rand(-35,35); a[i*3+1]=rand(0,22); a[i*3+2]=rand(-35,35); } geo.setAttribute('position',new THREE.BufferAttribute(a,3)); const m=new THREE.PointsMaterial({color:0xffffff,size:0.28,transparent:true,opacity:0.85,depthWrite:false}); const P=new THREE.Points(geo,m); P.frustumCulled=false; P.visible=false; scene.add(P); return P; })();
function updateSnowfall(dt){ const p=player.g.position; const nearSnow=revealed('snow')&&Math.hypot(p.x-SN.C.x,p.z-SN.C.z)<45; const on=nearSnow||(S.level===9); snowPts.visible=on; if(!on) return; const c=nearSnow?SN.C:p; snowPts.position.set(c.x,0,c.z); const a=snowPts.geometry.attributes.position; const t=performance.now()/1000; for(let i=0;i<a.count;i++){ let y=a.getY(i)-dt*(2.2+(i%5)*0.3); if(y<0) y+=22; a.setY(i,y); a.setX(i,a.getX(i)+Math.sin(t+i)*dt*0.3); } a.needsUpdate=true; }
function updateSnow(dt){ const t=performance.now()/1000;
  playerHarvest(crysNodes,{key:'crystal',hits:3,cd:0.42,regrow:20,yield:()=>2,name:'kristal',dest:'kuyumcuya götür',chip:M.crys,geo:CRYS_GEO,mat:M.crys}); for(const n of crysNodes) nodeTick(n,dt);
  deliver(dt,'crystal',JEW_FRONT,JEW,'crysIn',crysCap,CRYS_GEO,M.crys);
  updateGatherers(cminers,crysNodes,dt,{work:3.4,regrow:20,chip:M.crys,full:()=>(S.rg.crysIn||0)>=crysCap(),yield:()=>2,send:(from,n)=>sendTo(from,JEW,n,'crysIn',crysCap,CRYS_GEO,M.crys)});
  const cl=rg('cdrill'); cdGrp.visible=cl>0; cdLbl.hide=cl<=0; if(cl>0){ cdGrp.scale.setScalar(1+0.06*(cl-1)); const full=(S.rg.crysIn||0)>=crysCap(); if(!full){ cdBit.rotation.y+=dt*(12+3*cl); cdBit.position.y=3.9+Math.sin(t*(7+cl))*0.2; cdAcc+=cdRate()*dt; cdGlow.material.opacity=0.45+0.25*Math.sin(t*6); if(Math.random()<dt*7) burst(CDRILL.clone().setY(1.2),2,M.crys,0.8); if(cdAcc>=2){ cdAcc-=2; sendTo(CDRILL.clone().setY(1.4),JEW,2,'crysIn',crysCap,CRYS_GEO,M.crys); } }
    const k='c'+cl+'|'+full; if(cdLbl._k!==k){ cdLbl._k=k; cdLbl.el.innerHTML=''; } }
  const st=S.rg.crysIn||0; jewT-=dt; if(st>0&&jewT<=0&&pileVal(snowPile)<snowPile.capFn()-0.5){ jewT=jewSellT(); S.rg.crysIn=st-1; pileAdd(snowPile,crysPrice()); fly(JEW.clone().setY(1.4),snowPile.pos.clone().setY(0.8),null,false,4); }
  jewStock.count=Math.min(16,Math.floor(S.rg.crysIn||0)); if(Math.random()<dt*1.5){ const h=snowArea.userData.jew; smokePuff(jewSmoke,h.localToWorld(h.userData.chim.clone())); } updateSmoke(jewSmoke,dt);
  jewLbl.hide=false; const k=Math.floor(st)+'|'+rg('jeweler'); if(jewLbl._k!==k){ jewLbl._k=k; jewLbl.el.innerHTML=`💎 ${Math.floor(st)}/${crysCap()}${st<1?' <b class="full">⚠</b>':''}`; } }

// =====================================================================
// ---------- Kara Kale: düşmanın yuvası. Baştan beri uzakta görünür; 10. seferde son patron ----------
// =====================================================================
const CASTLE={x0:-13.5,x1:9.5,z0:-100,z1:-83}; const castle=new THREE.Group(); scene.add(castle); const evilWins=[], evilFlags=[];
(function(){ const S0=M.darkStone, S1=M.darkStone2; const wallAt=(x,z,w,d,h)=>{ const m=mesh(G.box,S0,w,h,d); m.position.set(x,h/2,z); castle.add(m); const n=Math.round(Math.max(w,d)/1.1); for(let i=0;i<n;i++){ const k=(i+0.5)/n-0.5; const c=mesh(G.box,S1,w>d?0.6:d>w?w+0.1:0.6,0.6,w>d?d+0.1:0.6,false); c.position.set(x+(w>d?k*w:0),h+0.3,z+(d>w?k*d:0)); if(i%2===0) castle.add(c); } };
  const towerAt=(x,z,r,h,roofH)=>{ const t=mesh(G.cyl,S1,r,h,r); t.position.set(x,h/2,z); const rf=mesh(G.cone,M.darkRoof,r*1.25,roofH,r*1.25); rf.position.set(x,h+roofH/2,z); castle.add(t,rf); for(let i=0;i<2;i++){ const w=mesh(G.box,M.evil,0.3,0.5,0.1,false); const a=Math.PI/2*0.8+i*0.6-0.3; w.position.set(x+Math.sin(a)*(r+0.02)*0,h*0.6+i*1.6,z+r+0.02); castle.add(w); evilWins.push(w); } const fp=mesh(G.cyl,M.iron,0.05,1.8,0.05); fp.position.set(x,h+roofH+0.8,z); const fl=mesh(G.box,M.enemy,0.04,0.6,1.0,false); fl.position.set(x,h+roofH+1.3,z+0.5); castle.add(fp,fl); evilFlags.push(fl); };
  wallAt(-9.9,-83.5,6.2,1.2,6); wallAt(3.9,-83.5,10.2,1.2,6); wallAt(-13,-91.5,1.2,16,6); wallAt(9,-91.5,1.2,16,6); wallAt(-2,-99.4,22,1.2,6);
  towerAt(-13,-83.5,1.9,9,4); towerAt(9,-83.5,1.9,9,4); towerAt(-13,-99.4,1.9,9,4); towerAt(9,-99.4,1.9,9,4); towerAt(-6.8,-83.5,1.4,8,3); towerAt(-1.2,-83.5,1.4,8,3);
  // kapı: kemer, kaldırılmış parmaklık
  const arch=mesh(G.box,S1,4.4,1.4,1.4); arch.position.set(-4,6.2,-83.5); const port=new THREE.Group(); for(let i=0;i<6;i++){ const b=mesh(G.box,M.iron,0.1,2.2,0.1,false); b.position.set(-5.9+i*0.75,6.3,-83.3); port.add(b); } castle.add(arch,port);
  // iç kale (burç): yüksek, kırmızı pencereler
  const keep=mesh(G.box,S0,7,12,6); keep.position.set(4.2,6,-93); const kroof=mesh(G.cone4,M.darkRoof,5.6,5,4.8); kroof.rotation.y=Math.PI/4; kroof.position.set(4.2,14.5,-93); castle.add(keep,kroof); for(let r=0;r<3;r++) for(let c=0;c<3;c++){ const w=mesh(G.box,M.evil,0.5,0.8,0.1,false); w.position.set(2.2+c*2,4+r*3,-89.95); castle.add(w); evilWins.push(w); }
  for(const [x,z] of [[0.9,-89.9],[7.5,-89.9]]){ towerAt(x,z,0.9,13,3); }
  const eg=glow(0xff3a2a,9,0.35); eg.position.set(4.2,9,-89); castle.add(eg); castle.userData.eg=eg;
  // kazıklar ve sancaklar yol boyunca
  for(let i=0;i<6;i++){ const z=-81+i*-0.0+i*2.2; const rx=-4+(z+84)/16*7; for(const s of [-1,1]){ const sp=mesh(G.cone,M.darkStone2,0.2,1.6,0.2); sp.position.set(rx+s*3.4+rand(-.3,.3),0.8,z+rand(-.3,.3)); sp.rotation.x=0.3; castle.add(sp); } }
  castle.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); })();
function castleCollide(p){ if(p.x>CASTLE.x0-0.8&&p.x<CASTLE.x1+0.8&&p.z<CASTLE.z1+0.8){ const dx0=p.x-(CASTLE.x0-0.8), dx1=(CASTLE.x1+0.8)-p.x, dz=(CASTLE.z1+0.8)-p.z; const m=Math.min(dx0,dx1,dz); if(m===dz) p.z=CASTLE.z1+0.8; else if(m===dx0) p.x=CASTLE.x0-0.8; else p.x=CASTLE.x1+0.8; } }
let castleFreed=null;
function updateCastle(dt){ const t=performance.now()/1000; const freed=!!(S.book&&S.book.boss&&S.book.boss[10])||S.level>10; if(freed!==castleFreed){ castleFreed=freed; for(const w of evilWins) w.material=freed?M.warm:M.evil; for(const f of evilFlags) f.material=freed?M.banner:M.enemy; castle.userData.eg.material.color.setHex(freed?0xffc060:0xff3a2a); }
  castle.userData.eg.material.opacity=(freed?0.3:0.25+0.2*night)+0.08*Math.sin(t*2); }
// ----- Kara Kral: canı yarıya inince öfkelenir, muhafız çağırır -----
function bossPhase(e){ if(!e.boss||e.ph2||e.dead||bossOf().hat!=='crown'||e.hp>e.maxHp*0.5) return; e.ph2=true; e.speed*=1.3; e.atk*=1.25; const pos=e.g.position.clone();
  banner('KARA KRAL ÖFKELENDİ!','Muhafızlar geliyor!','boss'); SFX.night(); SFX.boom(); camShake=0.7; burst(pos.clone().setY(1.5),24,M.darkRoof,1.6,1.6); const aura=glow(0xb040ff,6,0.6); aura.position.y=2; e.g.add(aura); e.aura=aura;
  const n=4+Math.min(4,Math.floor((S.level-10)/5)); for(let i=0;i<n;i++){ makeEnemy(i%2?'knight':'raider',e.side); const m=enemies[enemies.length-1]; const a=i/n*6.283; m.g.position.set(pos.x+Math.cos(a)*2.4,0,pos.z+Math.sin(a)*2.4); m.wp=e.wp; m.off=e.off; burst(m.g.position.clone().setY(1),8,M.darkRoof,1.2); } }

// ----- oyun sonu kartı: krallık kurtarıldı → sonsuz kuşatma -----
function showEndCard(st,gain,first){ const b=S.book; const fishN=Object.values(b.fish||{}).reduce((a,v)=>a+v,0), huntN=Object.values(b.hunt||{}).reduce((a,v)=>a+v,0), chestN=Object.values(b.chest||{}).reduce((a,v)=>a+v,0); const towersN=S.towers.filter(t=>t.lvl>0).length;
  const card=document.createElement('div'); card.className='intro'; card.id='winCard';
  card.innerHTML=`<div class="card result end"><div class="bigstars">${[1,2,3].map(i=>`<span class="st${i<=st?' on':''}" style="animation-delay:${0.25+i*0.35}s">★</span>`).join('')}</div><h1>Krallık kurtarıldı!</h1><p class="boss">Kara Kral yenildi · Kara Kale artık senin</p><div class="away"><div><span>Yenilen düşman</span><b>${S.kills}</b></div><div><span>Kule</span><b>${towersN}</b></div><div><span>Tutulan balık</span><b>${fishN}</b></div><div><span>Av</span><b>${huntN}</b></div><div><span>Açılan sandık</span><b>${chestN}</b></div><div><span>Yenilen patron</span><b>${Object.keys(b.boss||{}).length}</b></div></div><div class="crowns">👑 +${gain} taç${first?' · ilk zafer bonusu':''}</div><p class="sub">Ama kuşatma bitmedi: her sefer daha güçlü patronlar geliyor. Ne kadar dayanabilirsin?</p><button id="winNext">Sonsuz kuşatma →</button><button id="winMap" class="ghost">Krallık</button></div>`;
  document.body.appendChild(card); for(let i=0;i<5;i++) setTimeout(()=>{ celebrate(new THREE.Vector3(rand(-10,10),0,rand(-10,10)),1.4); confetti(); },400+i*700); SFX.win();
  $('winNext').addEventListener('click',()=>{ audio(); card.remove(); const go=()=>nextSefer(); cgAd('midgame',go,go); });
  $('winMap').addEventListener('click',()=>{ audio(); card.remove(); nextSefer(true); showMap(); }); }
function chestBook(){ const b=S.book.chest||{}; return `<div class="book" style="margin-top:6px">${Object.keys(RAR).map(k=>{ const n=b[k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${RAR[k].c.toString(16).padStart(6,'0')};border-radius:3px"></i><b>${n?RAR[k].n+' sandık':'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div>`; }

// ----- alanlar (satın alma noktaları) -----
const padAt=(F,s)=>()=>{ const v=F.at(F.R.r+7.2,s); return [v.x,v.z]; };
const P6=[
  {id:'lamp', grp:'swamp', ord:1, name:'Fener', desc:'Sisli kapıda kuleler tam görür', res:'gold', pos:padAt(SW,-8.2), kind:'up', key:'lamp', cost:l=>Math.round(140*Math.pow(1.5,l)), max:4, show:()=>revealed('swamp'), onBuy:()=>{ const L=lampPosts.filter(L=>lampLit(L.s)).slice(-2); for(const x of L) celebrate(x.g.position.clone(),0.7); toast('🏮 '+SIDE_TR[SIDES[rg('lamp')-1]]+' aydınlandı','good'); }},
  {id:'herbalist', grp:'swamp', ord:2, name:'Otacı Çırağı', desc:'Senin yerine mantar toplar', res:'gold', pos:padAt(SW,-5.4), kind:'up', key:'herbalist', cost:l=>Math.round(240*Math.pow(1.7,l)), max:3, show:()=>revealed('swamp'), onBuy:()=>{ const w=addGatherer(herbalists,SHUT_FRONT.clone(),M.moss); celebrate(w.guy.g.position.clone(),1); }},
  {id:'farm', grp:'swamp', ord:3, lock:'Bir otacı çırağı', name:'Mantar Tarlası', desc:'Makine: mantar kendiliğinden yetişir', res:'gold', pos:padAt(SW,-2.6), kind:'up', key:'farm', cost:l=>Math.round(420*Math.pow(1.75,l)), max:5, show:()=>revealed('swamp')&&rg('herbalist')>=1, onBuy:()=>{ const b=farmBeds[Math.min(2,rg('farm')-1)]; celebrate(b.g.position.clone(),1.4); camShake=0.4; }},
  {id:'cauldron', grp:'swamp', ord:4, name:'İksir Kazanı', desc:'İksir gece suru onarır', res:'gold', pos:padAt(SW,1.4), kind:'up', key:'cauldron', cost:l=>Math.round(200*Math.pow(1.6,l)), max:5, show:()=>revealed('swamp'), onBuy:()=>{ celebrate(CAUL.clone(),1.2); }},
  {id:'ironArrow', grp:'iron', ord:1, name:'Delici Ok', desc:'Oklar zırhı deler, +%10 hasar', res:'iron', pos:padAt(IR,-8.2), kind:'up', key:'ironArrow', cost:l=>Math.round(10*Math.pow(1.5,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ for(const t of towers) if(t) celebrate(t.g.position.clone(),0.4); SFX.fanfare(); toast('🏹 Oklar artık demir uçlu','good'); }},
  {id:'ironWall', grp:'iron', ord:2, name:'Demir Kapı', desc:'Sur canı +%12', res:'iron', pos:padAt(IR,-5.4), kind:'up', key:'ironWall', cost:l=>Math.round(14*Math.pow(1.5,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ S.gateHp=Math.min(D.gateMax(),S.gateHp+D.gateMax()*0.12); celebrate(new THREE.Vector3(0,0,0),0.8); }},
  {id:'miner', grp:'iron', ord:3, name:'Madenci', desc:'Senin yerine cevher kazar', res:'gold', pos:padAt(IR,-2.6), kind:'up', key:'miner', cost:l=>Math.round(320*Math.pow(1.7,l)), max:3, show:()=>revealed('iron'), onBuy:()=>{ const w=addGatherer(miners,FORGE_FRONT.clone(),M.iron); celebrate(w.guy.g.position.clone(),1); }},
  {id:'drill', grp:'iron', ord:4, lock:'Bir madenci', name:'Maden Matkabı', desc:'Makine: cevher kendiliğinden çıkar', res:'gold', pos:padAt(IR,0.2), kind:'up', key:'drill', cost:l=>Math.round(620*Math.pow(1.75,l)), max:5, show:()=>revealed('iron')&&rg('miner')>=1, onBuy:()=>{ celebrate(DRILL.clone(),1.6); camShake=0.5; }},
  {id:'forge', grp:'iron', ord:5, name:'Demirci Ocağı', desc:'Hızlı eritir, çok tutar', res:'gold', pos:padAt(IR,3.0), kind:'up', key:'forge', cost:l=>Math.round(260*Math.pow(1.6,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ celebrate(FORGE.clone(),1.2); }},
  {id:'lighthouse', grp:'coast', ord:1, name:'Deniz Feneri', desc:'Sahile daha çok sandık vurur', res:'gold', pos:padAt(CO,-6.2), kind:'up', key:'lighthouse', cost:l=>Math.round(420*Math.pow(1.6,l)), max:5, show:()=>revealed('coast'), onBuy:()=>{ celebrate(LIGHT.clone(),1.4); camShake=0.4; }},
  {id:'boat', grp:'coast', ord:2, name:'Ticaret Teknesi', desc:'Makine: adalardan para getirir', res:'gold', pos:padAt(CO,-3.4), kind:'up', key:'boat', cost:l=>Math.round(760*Math.pow(1.7,l)), max:5, show:()=>revealed('coast'), onBuy:()=>{ celebrate(PIER_B.clone(),1.4); camShake=0.4; }},
  {id:'harbor', grp:'coast', ord:3, lock:'Ticaret teknesi', name:'Liman', desc:'Seferler daha değerli; Sv3: 2. tekne', res:'gold', pos:padAt(CO,-0.6), kind:'up', key:'harbor', cost:l=>Math.round(560*Math.pow(1.6,l)), max:5, show:()=>revealed('coast')&&rg('boat')>=1, onBuy:()=>{ celebrate(WH.clone(),1.2); }},
  {id:'jeweler', grp:'snow', ord:1, name:'Kuyumcu', desc:'Kristali pahalı ve hızlı satar', res:'gold', pos:padAt(SN,-6.2), kind:'up', key:'jeweler', cost:l=>Math.round(460*Math.pow(1.6,l)), max:5, show:()=>revealed('snow'), onBuy:()=>{ celebrate(JEW.clone(),1.2); }},
  {id:'cminer', grp:'snow', ord:2, name:'Kristalci', desc:'Senin yerine kristal kazar', res:'gold', pos:padAt(SN,-3.4), kind:'up', key:'cminer', cost:l=>Math.round(560*Math.pow(1.7,l)), max:3, show:()=>revealed('snow'), onBuy:()=>{ const w=addGatherer(cminers,JEW_FRONT.clone(),mat(0x3d63c9)); celebrate(w.guy.g.position.clone(),1); }},
  {id:'cdrill', grp:'snow', ord:3, lock:'Bir kristalci', name:'Kristal Matkabı', desc:'Makine: kristal kendiliğinden çıkar', res:'gold', pos:padAt(SN,-0.6), kind:'up', key:'cdrill', cost:l=>Math.round(1100*Math.pow(1.75,l)), max:5, show:()=>revealed('snow')&&rg('cminer')>=1, onBuy:()=>{ celebrate(CDRILL.clone(),1.8); camShake=0.6; }},
];
for(const d of P6) makePad(d);

// ----- bölgelerin ağaç renkleri: bataklıkta koyu, geçitte karlı -----
(function(){ const swampC=new THREE.Color(0x4a6a3a), snowC=new THREE.Color(0xd8e8e4), snowC2=new THREE.Color(0xb8d0c8); let any=false; trees.forEach((t,i)=>{ const ds=Math.hypot(t.x-SN.C.x,t.z-SN.C.z), dw=Math.hypot(t.x-SW.C.x,t.z-SW.C.z); if(ds<40){ treeCrown.setColorAt(i,Math.random()<0.5?snowC:snowC2); any=true; } else if(dw<34){ treeCrown.setColorAt(i,swampC); any=true; } }); if(any&&treeCrown.instanceColor) treeCrown.instanceColor.needsUpdate=true; })();
// ateş böcekleri (bataklık)
const flies=(function(){ const n=40; const geo=new THREE.BufferGeometry(); const a=new Float32Array(n*3); geo.setAttribute('position',new THREE.BufferAttribute(a,3)); const m=new THREE.PointsMaterial({color:0xd8ff8a,size:0.35,transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending}); const P=new THREE.Points(geo,m); P.frustumCulled=false; P.visible=false; scene.add(P); const seeds=[]; for(let i=0;i<n;i++) seeds.push({a:rand(0,6.28),r:rand(1,SW.R.r),h:rand(0.5,2.5),s:rand(0.2,0.6),ph:rand(0,6)}); return {P,seeds}; })();
function updateFlies(){ const t=performance.now()/1000; const a=flies.P.geometry.attributes.position; flies.seeds.forEach((s,i)=>{ const an=s.a+t*s.s*0.3; a.setXYZ(i,SW.C.x+Math.cos(an)*s.r+Math.sin(t*1.3+s.ph)*0.6,s.h+Math.sin(t*2+s.ph)*0.4,SW.C.z+Math.sin(an)*s.r); }); a.needsUpdate=true; flies.P.material.opacity=0.5+0.5*Math.max(night,0.3)*(0.6+0.4*Math.sin(t*3)); }

// ----- sen yokken (yeni bölgeler) -----
function offline6(sec,out){
  if(revealed('swamp')){ const herb=sec*(herbalists.length*2/5.5+farmRate()); const pots=Math.min(herb/2,sec/brewT()); const room=Math.max(0,potCap()-(S.rg.potions||0)); const toShelf=Math.min(room,pots); S.rg.potions=(S.rg.potions||0)+Math.floor(toShelf); const before=pileVal(swampPile); pileAdd(swampPile,(pots-toShelf)*potPrice()); out.gold+=Math.round(pileVal(swampPile)-before); out.potions=Math.floor(toShelf); out.herb=Math.round(herb); }
  if(revealed('iron')){ const ore=sec*(miners.length*3/6+drillRate()); const iron=Math.floor(Math.min(ore/3,sec/smeltT())*0.8); if(iron>0){ S.iron=(S.iron||0)+iron; out.iron=iron; } }
  if(revealed('coast')){ if(boats.length||rg('boat')>0){ const n=boatWantN(); const trip=2*(isleDock(0).distanceTo(PIER_B))/boatSpd()+4.7; const before=pileVal(coastPile); pileAdd(coastPile,n*sec/trip*tripValue()); out.gold+=Math.round(pileVal(coastPile)-before); out.boat=Math.round(n*sec/trip); } const want=Math.min(chestMax()-chests.filter(c=>!c.open).length,Math.floor(sec/chestEvery())); for(let i=0;i<want;i++) spawnChest(true); if(want>0) out.chests=want; }
  if(revealed('snow')){ const cr=sec*(cminers.length*2/6.5+cdRate()); const sold=Math.min((S.rg.crysIn||0)+cr,sec/jewSellT()); S.rg.crysIn=Math.max(0,Math.min(crysCap(),(S.rg.crysIn||0)+cr-sold)); const before=pileVal(snowPile); pileAdd(snowPile,sold*crysPrice()); out.gold+=Math.round(pileVal(snowPile)-before); out.crystal=Math.round(cr); }
  return out; }
function offlineRows6(o){ return `${o.herb?`<div><span>Otacı ve mantar tarlası</span><b>+${o.herb} mantar${o.potions?` · 🧪 ${o.potions}`:''}</b></div>`:''}${o.iron?`<div><span>Madenci, matkap ve ocak</span><b>+${o.iron} demir</b></div>`:''}${o.boat?`<div><span>Ticaret teknesi</span><b>${o.boat} sefer</b></div>`:''}${o.crystal?`<div><span>Kristalci ve matkap</span><b>+${o.crystal} kristal</b></div>`:''}${o.chests?`<div><span>Sahilde seni bekleyen sandık</span><b>🎁 ${o.chests}</b></div>`:''}`; }
// ----- rehber (yeni bölgeler) -----
function regionGuide6(mode){ const p=player.g.position; const near=(list)=>{ let best=null,bd=1e9; for(const n of list){ if(!n.alive||n.claimed) continue; const d=Math.hypot(n.pos.x-p.x,n.pos.z-p.z); if(d<bd){ bd=d; best=n; } } return best; };
  if(mode==='carry'){ if((S.ore||0)>0&&revealed('iron')) return {t:FORGE_FRONT,text:'Cevheri demirciye götür'}; if((S.crystal||0)>0&&revealed('snow')) return {t:JEW_FRONT,text:'Kristali kuyumcuya götür'}; if((S.herb||0)>0&&revealed('swamp')) return {t:SHUT_FRONT,text:'Mantarı otacıya götür'}; return null; }
  if(mode==='idle'){ const ch=chests.find(c=>!c.open&&c.k>=1); if(ch) return {t:ch.g.position.clone(),text:RAR[ch.rar].n+' sandık! Sahilde aç'};
    const ironNeed=pads.some(pd=>padVisible(pd)&&padRes(pd)==='iron'&&!padAvail(pd)); if(revealed('iron')&&ironNeed&&(S.rg.oreIn||0)<oreCap()*0.8){ const n=near(oreNodes); if(n) return {t:n.pos.clone(),text:'Demir cevheri kaz'}; }
    if(revealed('swamp')&&(S.rg.potions||0)<potCap()&&(S.rg.herbIn||0)<4){ const n=near(mushNodes); if(n) return {t:n.pos.clone(),text:'Bataklıkta mantar topla'}; }
    if(revealed('snow')&&(S.rg.crysIn||0)<crysCap()*0.5){ const n=near(crysNodes); if(n) return {t:n.pos.clone(),text:'Kristal kaz'}; } return null; } return null; }
function collide6(p){ const ds=Math.hypot(p.x-SC.x,p.z-SC.z); if(ds<SEA.r-0.3){ const onPier=(()=>{ const ax=PIER_A.x, az=PIER_A.z, bx=PIER_B.x, bz=PIER_B.z; const dx=bx-ax, dz=bz-az; const t=clamp(((p.x-ax)*dx+(p.z-az)*dz)/(dx*dx+dz*dz),0,1); return Math.hypot(ax+dx*t-p.x,az+dz*t-p.z)<1.1&&t<0.98; })(); if(!onPier){ p.x=SC.x+(p.x-SC.x)/ds*(SEA.r-0.3); p.z=SC.z+(p.z-SC.z)/ds*(SEA.r-0.3); } } castleCollide(p); }
// ----- ana güncelleme / kurulum / sıfırlama -----
function vis6(){ swamp.visible=revealed('swamp'); ironArea.visible=revealed('iron'); coast.visible=revealed('coast'); snowArea.visible=revealed('snow'); flies.P.visible=revealed('swamp'); swampPile.g.visible=revealed('swamp'); coastPile.g.visible=revealed('coast'); snowPile.g.visible=revealed('snow');
  if(!revealed('swamp')){ shutLbl.hide=true; farmLbl.hide=true; } if(!revealed('iron')){ forgeLbl.hide=true; drillLbl.hide=true; } if(!revealed('coast')) whLbl.hide=true; if(!revealed('snow')){ jewLbl.hide=true; cdLbl.hide=true; } }
let vis6T=0;
function updateRegions6(dt){ mineCd-=dt; fullWarnT-=dt; vis6T-=dt; if(vis6T<=0){ vis6T=1; vis6(); placeLamps(); if(revealed('iron')&&!carts.some(c=>c.kind==='iron')) addCart('iron'); }
  updateFog(dt); updateSea(dt); updateCastle(dt); updateSnowfall(dt);
  updateP7(dt);
  if(revealed('swamp')){ updateSwamp(dt); updateFlies(); } if(revealed('iron')) updateIron(dt); if(revealed('coast')) updateCoast(dt); if(revealed('snow')) updateSnow(dt); }
function initRegions6(){ vis6(); placeLamps(); for(let i=herbalists.length;i<rg('herbalist');i++) addGatherer(herbalists,SHUT_FRONT.clone(),M.moss); for(let i=miners.length;i<rg('miner');i++) addGatherer(miners,FORGE_FRONT.clone(),M.iron); for(let i=cminers.length;i<rg('cminer');i++) addGatherer(cminers,JEW_FRONT.clone(),mat(0x3d63c9)); if(revealed('iron')&&!carts.some(c=>c.kind==='iron')) addCart('iron'); }
function resetRegions6(){ clearGatherers(herbalists); clearGatherers(miners); clearGatherers(cminers); for(const b of boats) scene.remove(b.g); boats.length=0; for(const c of chests) scene.remove(c.g); chests.length=0; for(const n of [...mushNodes,...oreNodes,...crysNodes]){ n.alive=true; n.pop=1; n.claimed=null; n.hp=0; } castleFreed=null; resetP7(); }
// =====================================================================
// ---------- p7: vuruş hissi, patron sandığı + çark, günlük görevler, sal/korsan gemisi, düşman okçu, kış ----------
// =====================================================================
Object.assign(M,{ flashW:new THREE.MeshBasicMaterial({color:0xffffff}), raft:mat(0x9a6a3a), pirateSail:mat(0x1d1d22,{side:THREE.DoubleSide}), skull:mat(0xf4efe4), eArrow:mat(0x3a2a1a) });

// ----- vuruş hissi: beyaz parlama, seri öldürme sesi, patron ölünce ağır çekim -----
function flashOn(e){ if(!e.fm){ e.fm=[]; e.g.traverse(o=>{ if(o.isMesh) e.fm.push([o,o.material]); }); } for(const f of e.fm) f[0].material=M.flashW; }
function flashOff(e){ if(e.fm) for(const f of e.fm) f[0].material=f[1]; }
let comboN=0, comboAt=-9;
function comboKill(e){ comboN=gameT-comboAt<1.4?comboN+1:1; comboAt=gameT; const k=Math.min(14,comboN-1); tone(400*(1+0.07*k),80+20*k,0.2,'sawtooth',0.05); if(k>=3) tone(900+80*k,1300+90*k,0.08,'triangle',0.035);
  if(comboN>=5&&comboN%5===0){ const bonus=Math.round((4+gw()*0.8)*comboN/5); dropCoins(e.g.position.clone().setY(1.2),Math.min(10,3+comboN/5),bonus/Math.min(10,3+comboN/5),2,1.2); floatText(e.g.position,`SERİ ×${comboN}! +${bonus}`,'green'); camShake=Math.max(camShake,0.2); } }

// ----- patron sandığı: patron ölünce yere büyük altın sandık düşer, sefer sonunda çark döner -----
const bossChests=[];
function spawnBossChest(pos){ const g=new THREE.Group(); const body=mesh(G.box,M.chestGold,1.8,1.0,1.2); body.position.y=0.5; const lidG=new THREE.Group(); lidG.position.set(0,1.0,-0.6); const lid=mesh(G.box,M.chestGold,1.84,0.42,1.24); lid.position.set(0,0.21,0.6); lidG.add(lid);
  for(const x of [-0.6,0,0.6]){ const b=mesh(G.box,M.chest,0.14,1.04,1.24,false); b.position.set(x,0.5,0); g.add(b); const b2=mesh(G.box,M.chest,0.14,0.44,1.26,false); b2.position.set(x,0.21,0.6); lidG.add(b2); }
  for(const [x,c] of [[-0.55,0xff4a6a],[0,0x4ab0ff],[0.55,0x6aff8a]]){ const gem=mesh(G.dod,mat(c,{emissive:new THREE.Color(c).multiplyScalar(0.5)}),0.13,0.13,0.13,false); gem.position.set(x,0.75,0.62); g.add(gem); }
  const gl=glow(0xffd23f,5,0.8); gl.position.y=1.4; const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.6,1.0,14,14,1,true),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:0.35,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); beam.position.y=7;
  g.add(body,lidG,gl,beam); g.position.set(pos.x,0,pos.z); g.scale.setScalar(0.01); scene.add(g); bossChests.push({g,lidG,gl,beam,t:0,burst:false}); }
function updateBossChests(dt){ for(const c of bossChests){ c.t+=dt; const k=Math.min(1,c.t/0.5); c.g.scale.setScalar(Math.max(0.01,k*(1+0.25*Math.sin(k*Math.PI)))); c.g.position.y=Math.max(0,3*(1-k)); c.beam.material.opacity=0.25+0.12*Math.sin(c.t*4); c.gl.material.opacity=0.6+0.3*Math.sin(c.t*5);
    if(c.t>0.9){ c.lidG.rotation.x=-Math.min(1.9,(c.t-0.9)*5); if(!c.burst){ c.burst=true; celebrate(c.g.position.clone(),1.6); burst(c.g.position.clone().setY(1.4),30,M.chestGold,1.8,1.6); SFX.fanfare(); } } } }
function clearBossChests(){ for(const c of bossChests){ scene.remove(c.g); } bossChests.length=0; }
// çark: 8 dilim; nadir büyük ödül; kıl payı kaçırma hissi
const WHEEL=[{i:'💰',n:'Altın',w:28,c:'#f2b43c'},{i:'🪵',n:'Kereste',w:14,c:'#c98d4e'},{i:'👑',n:'+2 taç',w:14,c:'#e8961a'},{i:'💰',n:'Altın yağmuru',w:10,c:'#ffd23f'},{i:'⛓️',n:'Demir',w:12,c:'#9aa3ad'},{i:'👑',n:'+6 taç',w:4,c:'#d9534f',jack:true},{i:'💰',n:'Altın',w:14,c:'#f2b43c'},{i:'🃏',n:'Hazır güç kartı',w:4,c:'#3d63c9'}];
function wheelReward(k){ const w=gw(); const W=WHEEL[k]; const at=player.g.position.clone(); let txt='';
  if(k===0||k===6){ const g=Math.round(120+25*w); S.coins+=g; txt=`+${g} altın`; }
  else if(k===3){ const g=Math.round((120+25*w)*3); S.coins+=g; txt=`+${g} altın`; }
  else if(k===1){ if(revealed('river')){ const n=12+2*S.level; S.planks=(S.planks||0)+n; txt=`+${n} kereste`; } else { const n=20+3*S.level; S.stone+=n; setStonePile(Math.min(18,S.stone)); txt=`+${n} taş`; } }
  else if(k===4){ if(revealed('iron')){ const n=6+S.level; S.iron=(S.iron||0)+n; txt=`+${n} demir`; } else { const g=Math.round(180+30*w); S.coins+=g; txt=`+${g} altın`; } }
  else if(k===2){ S.meta.crowns+=2; txt='+2 taç'; }
  else if(k===5){ S.meta.crowns+=6; txt='+6 taç — büyük ödül!'; }
  else if(k===7){ S.meta.nextCard=(S.meta.nextCard||0)+1; txt='Sonraki sefere bir güç kartıyla başlarsın'; }
  coinPop(); celebrate(at,W.jack?2:1.1); if(W.jack) confetti(); save(); return W.i+' '+txt; }
function showBossWheel(done){ if($('wheelCard')){ done&&done(); return; } const card=document.createElement('div'); card.className='intro'; card.id='wheelCard';
  const lbl=WHEEL.map((s,i)=>`<span style="transform:rotate(${i*45+22.5}deg)"><b>${s.i}</b></span>`).join(''); const grad=WHEEL.map((s,i)=>`${s.c} ${i*45}deg ${(i+1)*45}deg`).join(',');
  card.innerHTML=`<div class="card wheelCard"><h1>Patron sandığı!</h1><p>${bossName()} yenildi. Çarkı çevir, ödülünü al.</p><div class="wheel"><i class="wpin"></i><div class="wdisc" id="wdisc" style="background:conic-gradient(${grad})">${lbl}<em></em></div></div><p class="wres" id="wres">&nbsp;</p><button id="wheelSpin" class="gold">ÇEVİR!</button><button id="wheelOk" style="display:none">Devam →</button></div>`;
  document.body.appendChild(card); SFX.card();
  $('wheelSpin').addEventListener('click',()=>{ audio(); const b=$('wheelSpin'); if(b.disabled) return; b.disabled=true; b.textContent='Dönüyor…';
    let tot=0; for(const s of WHEEL) tot+=s.w; let r=Math.random()*tot, k=0; for(let i=0;i<WHEEL.length;i++){ r-=WHEEL[i].w; if(r<=0){ k=i; break; } }
    const J=5; let off=rand(8,37); if(k===J-1) off=rand(40,43.5); else if(k===J+1) off=rand(1.5,5); const rot=360*6-(k*45+off);
    const disc=$('wdisc'); disc.style.transition='transform 3.6s cubic-bezier(.12,.72,.18,1)'; disc.style.transform=`rotate(${rot}deg)`;
    let tt=0; for(let n=0;n<22;n++){ tt+=40+n*n*0.55; setTimeout(()=>tone(1200,900,0.03,'square',0.03),tt); }
    setTimeout(()=>{ const txt=wheelReward(k); const res=$('wres'); if(res) res.innerHTML=`<b>${txt}</b>${(k===J-1||k===J+1)?'<small>Büyük ödüle kıl payı!</small>':''}`; if(WHEEL[k].jack) SFX.win(); else SFX.fanfare(); b.style.display='none'; const ok=$('wheelOk'); if(ok) ok.style.display=''; },3800); });
  $('wheelOk').addEventListener('click',()=>{ audio(); card.remove(); clearBossChests(); done&&done(); }); }
function applyNextCard(){ const n=(S.meta&&S.meta.nextCard)||0; if(!n) return; S.meta.nextCard=0; const ks=['arrow','rate','range','powder','wall','drill']; for(let i=0;i<n;i++){ const k=ks[Math.floor(Math.random()*ks.length)]; S.cards[k]=(S.cards[k]||0)+1; if(k==='wall') S.gateHp=D.gateMax(); setTimeout(()=>toast('🃏 Hazır kart: '+CARDS[k].i+' '+CARDS[k].n,'good'),2600); } }

// ----- günlük görevler: her gün 3 görev, bitince taç + altın -----
const QPOOL=[
  {k:'chop',t:n=>`${n} ağaç kes`,b:25,s:10},{k:'kill',t:n=>`${n} düşman yen`,b:40,s:25},{k:'night',t:n=>`${n} gece atlat`,b:3,s:1},{k:'buy',t:n=>`${n} kez bir şey yükselt`,b:8,s:3},
  {k:'pile',t:n=>`Yığınlardan ${n} altın topla`,b:250,s:300,need:()=>revealed('lake')||revealed('meadow')},{k:'fish',t:n=>`${n} balık tut`,b:8,s:3,need:()=>revealed('lake')},{k:'hunt',t:n=>`${n} hayvan avla`,b:8,s:3,need:()=>revealed('meadow')},
  {k:'herb',t:n=>`${n} mantar topla`,b:12,s:4,need:()=>revealed('swamp')},{k:'mine',t:n=>`${n} cevher ya da kristal kaz`,b:12,s:4,need:()=>revealed('iron')||revealed('snow')},{k:'chest',t:n=>`Sahilde ${n} sandık aç`,b:2,s:1,need:()=>revealed('coast')},
];
function ensureQuests(){ if(!S.meta) return null; const day=dayKey(); const Q=S.meta.quests; if(Q&&Q.day===day&&Array.isArray(Q.list)) return Q; const pool=QPOOL.filter(q=>!q.need||q.need()); const pick=[]; while(pick.length<3&&pool.length){ pick.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]); }
  const tier=Math.min(6,Math.floor((S.level-1)/2)); S.meta.quests={day,list:pick.map((q,i)=>({k:q.k,n:q.b+q.s*tier,have:0,claimed:false,rw:2+(i===2?1:0)})),all:false}; return S.meta.quests; }
function questText(q){ const d=QPOOL.find(x=>x.k===q.k); return d?d.t(q.n):q.k; }
let questSaveT=0;
function questEvent(k,amt){ if(!S.started||!S.meta) return; const Q=ensureQuests(); if(!Q) return; for(const q of Q.list){ if(q.k!==k||q.have>=q.n) continue; q.have=Math.min(q.n,q.have+(amt||1)); if(q.have>=q.n){ toast('📜 Görev tamam!','good'); SFX.card(); const c=$('questChip'); if(c){ c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } save(); } } }
function renderQuestChip(){ const c=$('questChip'); if(!c) return; const Q=started&&S.started?ensureQuests():null; if(!Q){ c.style.display='none'; return; } c.style.display='flex'; const done=Q.list.filter(q=>q.have>=q.n).length, claim=Q.list.some(q=>q.have>=q.n&&!q.claimed); const t=`📜 ${done}/3`; if(c._t!==t){ c._t=t; $('questTxt').textContent=t; } c.classList.toggle('done',claim); }
function showQuests(){ if($('questCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='questCard'; document.body.appendChild(card);
  const render=()=>{ const Q=ensureQuests(); const gold=Math.round(60+20*gw()); const allDone=Q.list.every(q=>q.claimed);
    card.innerHTML=`<div class="card"><h1>Günün görevleri</h1><p>Her gün yenilenir. Bitirdiğin görevin ödülünü buradan al.</p>${Q.list.map((q,i)=>{ const ok=q.have>=q.n; return `<div class="q${ok?' ok':''}"><div class="qb"><b>${questText(q)}</b><div class="qbar"><i style="width:${Math.round(q.have/q.n*100)}%"></i></div><small>${Math.floor(q.have)}/${q.n}</small></div>${q.claimed?'<span class="rw">✓ Alındı</span>':ok?`<button data-i="${i}" class="qget">👑 ${q.rw} + 💰 ${gold}</button>`:`<span class="rw">👑 ${q.rw}</span>`}</div>`; }).join('')}${allDone?'<p class="sub">Hepsini bitirdin — yarın yeni görevler gelecek.</p>':''}<button id="qClose">Kapat</button></div>`;
    card.querySelectorAll('.qget').forEach(b=>b.addEventListener('click',()=>{ audio(); const q=Q.list[+b.dataset.i]; if(q.claimed||q.have<q.n) return; q.claimed=true; S.meta.crowns+=q.rw; S.coins+=gold; coinPop(); SFX.fanfare(); celebrate(player.g.position.clone(),0.9); if(Q.list.every(x=>x.claimed)&&!Q.all){ Q.all=true; S.meta.crowns+=3; setTimeout(()=>toast('🏆 Görevler bitti: +3 👑','good'),400); } save(); render(); }));
    $('qClose').addEventListener('click',()=>{ audio(); card.remove(); }); };
  render(); }
$('questChip').addEventListener('click',e=>{ e.stopPropagation(); audio(); showQuests(); });

// ----- kuleler hasar alır: düşman okçu kuleyi vurur; yıkılan kule susar, yanına gidersen onarırsın, gün doğunca kendiliğinden onarılır -----
const eArrows=[];
const towerMax=t=>(40+12*t.lvl)*atkK()*(t.isC?1.5:1);
function towerDownTick(t,dt){ const dmg=t.dmg||0; if(dmg<=0){ if(t.bar) t.bar.style.display='none'; return false; } const mx=towerMax(t); const p=player.g.position;
  if(Math.hypot(p.x-t.g.position.x,p.z-t.g.position.z)<3.4){ t.dmg=Math.max(0,dmg-mx*0.35*dt); t.repT=(t.repT||0)-dt; if(t.repT<=0){ t.repT=0.25; tone(1500,1300,0.04,'triangle',0.03); burst(t.top.clone(),3,M.plank,0.6); } if(t.dmg<=0&&t.down){ t.down=false; t.g.rotation.z=0; floatText(t.g.position,'Kule onarıldı!','green'); SFX.build(); } }
  if(!t.bar){ t.bar=document.createElement('div'); t.bar.className='hpbar tw'; t.bar.innerHTML='<i></i>'; document.body.appendChild(t.bar); }
  const k=clamp(1-t.dmg/mx,0,1); v3.copy(t.top); v3.y+=1.6; v3.project(camera); t.bar.style.display=''; t.bar.style.left=((v3.x+1)/2*innerWidth)+'px'; t.bar.style.top=((1-v3.y)/2*innerHeight)+'px'; t.bar.firstElementChild.style.width=(k*100)+'%';
  if(!t.down&&t.dmg>=mx){ t.down=true; floatText(t.g.position,'🔧 Onar!','red'); SFX.boom(); burst(t.top.clone(),16,M.stoneDark,1.2); camShake=Math.max(camShake,0.3); }
  if(t.down){ t.g.rotation.z=lerp(t.g.rotation.z,0.08,Math.min(1,dt*3)); if(Math.random()<dt*5) burst(t.top.clone(),1,M.smoke,0.5,1.4); for(const a of t.archers){ if(a.aim!==undefined) a.aim=false; } return true; } return false; }
function shooterTick(e,dt){ if(e.shootLeft<=0) return false; let best=null,bd=13; for(const t of towers){ if(!t||t.down) continue; const d=Math.hypot(t.g.position.x-e.g.position.x,t.g.position.z-e.g.position.z); if(d<bd){ bd=d; best=t; } } if(!best) return false;
  e.shootLeft-=dt; e.g.rotation.y=Math.atan2(best.g.position.x-e.g.position.x,best.g.position.z-e.g.position.z); e.shootCd-=dt; if(e.guy) e.guy.armL.rotation.x=-1.4;
  if(e.shootCd<=0){ e.shootCd=e.boss?1.1:2.0; const m=mesh(G.cyl,M.eArrow,0.04,0.9,0.04,false); const from=e.g.position.clone().setY(1.4*e.sc); m.position.copy(from); scene.add(m); eArrows.push({m,from,t:0,tw:best,dmg:(e.boss?14:5)*atkK()}); tone(500,300,0.06,'triangle',0.025); } return true; }
function updateEArrows(dt){ for(let i=eArrows.length-1;i>=0;i--){ const a=eArrows[i]; a.t+=dt*1.8; const to=a.tw.top; const k=Math.min(1,a.t); a.m.position.lerpVectors(a.from,to,k); a.m.position.y+=Math.sin(k*Math.PI)*2; a.m.lookAt(to); a.m.rotateX(Math.PI/2);
    if(k>=1){ scene.remove(a.m); eArrows.splice(i,1); if(towers.includes(a.tw)){ a.tw.dmg=(a.tw.dmg||0)+a.dmg; burst(to.clone(),4,M.woodDark,0.6); } } } }
function dawnRepair(){ let any=false; for(const t of towers){ if(!t) continue; if(t.dmg>0||t.down){ any=true; t.dmg=0; t.down=false; t.g.rotation.z=0; } if(t.bar) t.bar.style.display='none'; } for(const a of eArrows) scene.remove(a.m); eArrows.length=0; if(any) setTimeout(()=>toast('🔨 Kuleler onarıldı','good'),1200); }

// ----- sal: 2. seferden sonra akıncıların bir kısmı gölden sallarla gelir -----
function makeRaft(){ const g=new THREE.Group(); for(let i=0;i<5;i++){ const l=mesh(G.cyl,M.raft,0.18,2.2,0.18); l.rotation.x=Math.PI/2; l.position.set(-0.72+i*0.36,0.05,0); g.add(l); } const oar=mesh(G.box,M.woodDark,0.08,0.08,1.8); oar.position.set(0.9,0.5,0); oar.rotation.z=0.6; g.add(oar); return g; }
// korsan gemisi: 8. seferden sonra korsanların bir kısmı denizden gemiyle gelir, sahile çıkar
const ships=[];
function makeShip(){ const g=new THREE.Group(); const hull=mesh(G.box,mat(0x3a2418),2.8,1.2,6.4); hull.position.y=0.6; const bow=mesh(G.cone4,mat(0x3a2418),2.0,2.2,1.2); bow.rotation.x=Math.PI/2; bow.rotation.y=Math.PI/4; bow.position.set(0,0.6,4.0); bow.scale.set(1.4,1.6,0.85); const deck=mesh(G.box,M.plank,2.6,0.1,6.0,false); deck.position.y=1.22; const stern=mesh(G.box,mat(0x3a2418),2.8,1.2,1.4); stern.position.set(0,1.6,-2.6);
  g.add(hull,bow,deck,stern); for(const [z,h] of [[1.2,6],[-1.2,5]]){ const mast=mesh(G.cyl,M.woodDark,0.12,h,0.12); mast.position.set(0,1.2+h/2,z); const sail=new THREE.Mesh(new THREE.PlaneGeometry(2.6,h*0.55),M.pirateSail); sail.position.set(0,1.2+h*0.6,z+0.1); sail.castShadow=true; const sk=new THREE.Mesh(new THREE.CircleGeometry(0.45,16),M.skull); sk.position.set(0,1.2+h*0.62,z+0.12); const sk2=sk.clone(); sk2.rotation.y=Math.PI; sk2.position.z=z+0.08; g.add(mast,sail,sk,sk2); }
  const flag=mesh(G.box,M.enemy,0.05,0.5,0.9,false); flag.position.set(0,7.6,1.0); g.add(flag); g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); scene.add(g); return g; }
function rigSpawn(e){ if(!e) return; const L=S.level;
  if(e.kind==='raider'&&revealed('lake')&&(e.side==='N'||e.side==='E')&&Math.random()<0.5){ const s=(Math.random()<0.5?-1:1)*rand(3.5,6); const start=LC.clone().addScaledVector(LDIR,-(LK.r-2.5)).addScaledVector(LPERP,s*0.7), shore=LC.clone().addScaledVector(LDIR,LK.r-0.4).addScaledVector(LPERP,s);
    e.g.position.set(start.x,0.18,start.z); e.pre=[[shore.x,shore.z]]; e.raft=makeRaft(); e.raft.position.y=-0.12; e.g.add(e.raft); e.baseSpd=e.speed; e.speed*=0.75; e.wp=ROADS[e.side].length-1; e.preKind='raft'; }
  else if(e.kind==='pirate'&&revealed('coast')&&(e.side==='E'||e.side==='S')&&Math.random()<0.6){ let sh=ships.find(x=>!x.leaving); if(!sh){ const g=makeShip(); const a=0.32*(Math.random()<0.5?1:-1); const land=SC.clone().addScaledVector(rotU(CU,a),SEA.r-3.2), from=SC.clone().addScaledVector(rotU(CU,a*0.6),6); g.position.copy(from); g.rotation.y=Math.atan2(land.x-from.x,land.z-from.z); sh={g,from,land,k:0,a,crew:0,leaving:false,t:0}; ships.push(sh); banner('Korsan gemisi!','Kıyıya çıkıyorlar!','boss'); }
    sh.crew++; e.hold=sh; e.g.visible=false; e.bar.style.display='none'; e.wp=Math.min(3,ROADS[e.side].length-1); }
  if(e.preKind==='raft'&&!rigSpawn.seenRaft){ rigSpawn.seenRaft=true; setTimeout(()=>toast('⛵ Gölden akın!','bad'),600); } }
function holdTick(e,dt){ const sh=e.hold; if(sh.k<1) return false; sh.dropT=(sh.dropT||0)-dt; if(sh.dropT>0) return false; sh.dropT=0.35; const d=SC.clone().addScaledVector(rotU(CU,sh.a),SEA.r+2.2); e.g.position.set(d.x+rand(-1,1),0,d.z+rand(-1,1)); e.g.visible=true; e.bar.style.display=''; e.hold=null; sh.crew--; burst(e.g.position.clone().setY(0.4),8,M.foam,0.9); return true; }
function preArrive(e){ if(e.preKind==='raft'&&e.raft){ e.g.remove(e.raft); e.raft=null; e.g.position.y=0; e.speed=e.baseSpd||e.speed; burst(e.g.position.clone().setY(0.3),10,M.waterLight,1); } }
function updateShips(dt){ const t=performance.now()/1000; for(let i=ships.length-1;i>=0;i--){ const s=ships[i]; s.t+=dt;
    if(!s.leaving){ if(s.k<1){ s.k=Math.min(1,s.k+dt/5); const e=s.k*(2-s.k); s.g.position.lerpVectors(s.from,s.land,e); if(Math.random()<dt*6) burst(s.g.position.clone().setY(0.3),1,M.foam,0.4); } else if(s.crew<=0&&spawnQueue<=0){ s.leaving=true; s.k=0; } }
    else { s.k=Math.min(1,s.k+dt/6); s.g.position.lerpVectors(s.land,s.from,s.k*s.k); s.g.rotation.y+=dt*0.6*(1-s.k); if(s.k>0.6) s.g.position.y=-(s.k-0.6)*6; if(s.k>=1){ scene.remove(s.g); ships.splice(i,1); continue; } }
    if(!s.leaving||s.k<0.6) s.g.position.y=0.1+Math.sin(t*1.4)*0.12; s.g.rotation.z=Math.sin(t*1.1)*0.05; } }

// ----- kış: 9. sefer (ve sonsuzda her 10'un 9'u): ağaç yavaş kesilir, gündüz kısa, dünya karlı -----
function isWinter(){ return S.level%10===9; }
let winterOn=null, groundMesh=null;
function applyWinterLook(){ const w=isWinter(); if(w===winterOn) return; winterOn=w; M.leaf.color.setHex(w?0xe4eef4:0xffffff); M.leaf.emissive.setHex(w?0x5a6a74:0x000000); if(!groundMesh) scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map===groundTex) groundMesh=o; }); if(groundMesh){ groundMesh.material.color.setHex(w?0xeef4f8:0xffffff); groundMesh.material.emissive.setHex(w?0x6a7078:0x000000); } DAY.hemi.setHex(w?0xe8f0ff:0xfff4e0); DAY.bg.setHex(w?0xdfe6ee:0xe8dcc0); if(w&&S.started) setTimeout(()=>toast('❄️ Kış: gün kısa','bad'),3200); }

// ----- ana döngü ve sıfırlama -----
let p7T=0;
function updateP7(dt){ updateBossChests(dt); updateEArrows(dt); updateShips(dt); p7T-=dt; if(p7T<=0){ p7T=1; applyWinterLook(); } }
function clearP7Battle(){ for(const a of eArrows) scene.remove(a.m); eArrows.length=0; for(const s of ships) scene.remove(s.g); ships.length=0; if(!$("wheelCard")) clearBossChests(); }
function resetP7(){ clearP7Battle(); clearBossChests(); document.querySelectorAll('.hpbar.tw').forEach(b=>b.remove()); comboN=0; }

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
  fullT-=dt; if(fullT<=0){ const fullL=S.logs>=D.cap()&&nearestTree(p,3.6), fullS=S.stones>=capS&&nearestRock(p,4); if(fullL||fullS){ fullT=2.5; floatText(p,'MAX','red'); } }
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
  else if(pads.some(pd=>padVisible(pd)&&padRes(pd)==='gold'&&!padAvail(pd))&&(rgd=regionGuide('pile'))){ target=rgd.t; text=rgd.text; }
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
  else if(introT<7&&S.wave===1&&S.coins===0&&S.level===1) tip = isTouch? '👆 Sürükle, yürü' : '⌨️ WASD ile yürü';
  if(tip&&tipEl.textContent!==tip) tipEl.textContent=tip; tipEl.classList.toggle('hide',!tip);
  introT+=dt;
}
let moveStuck=0, trampleT=0, guideTarget=null;
function updateGuide(target,text,dt){
  const p=player.g.position;
  if(!target){ guide.arrow.visible=guide.ring.visible=guide.pin.visible=false; guide.el.style.display='none'; guide.lastText=''; return; }
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
  for(const el of document.querySelectorAll('.hud .left,.hud .right,#mini,#muteBtn,#kingBtn,#nightBtn,#placeBar,#recenter,.fishUI')){ const r=el.getBoundingClientRect(); if(r.width>1&&r.height>1) hudRects.push(r); }
  return hudRects; }

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
const coinsEl=$('coins'), waveTEl=$('waveT'), gateBar=$('gateBar'), enemyEl=$('enemyCount'), nightsEl=$('nights'), waveBoxEl=$('waveBox');
const setTxt=(el,t)=>{ t=String(t); if(el.textContent!==t) el.textContent=t; }, setShow=(el,on)=>{ const d=on?'flex':'none'; if(el.style.display!==d) el.style.display=d; };
let lastCoins=-1, shownCoins=S.coins;
function toast(msg,cls){ const t=$('toast'); t.textContent=msg; t.className='toast show '+(cls||''); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2400); }
const tutHold=()=>S.level===1&&S.wave===1&&!S.towers.some(t=>t.lvl>=1);
function renderHud(){ for(const L of quarryLabels) L.hide=!revealed('quarry'); const dq=revealed('quarry'); if(depotLbl._k!==dq){ depotLbl._k=dq; depotLbl.el.innerHTML='<span class="ics">⬇ <span class="log-dot"></span>'+(dq?'<span class="stone-dot"></span>':'')+'</span>'; }
  shownCoins=lerp(shownCoins,S.coins,0.25); if(Math.abs(shownCoins-S.coins)<0.6) shownCoins=S.coins; const c=Math.floor(shownCoins); if(lastCoins!==c){ coinsEl.textContent=c; lastCoins=c; }
  // sayaçlar: yalnız simge + sayı; sırttaki yük de kullanılabilir stoka dahil
  setTxt($('woodStock'),S.wood+S.logs); setShow($('stoneChip'),revealed('quarry')); setTxt($('stoneStock'),S.stone+(S.stones||0)); setShow($('plankChip'),revealed('river')); setTxt($('plankStock'),S.planks||0); setShow($('ironChip'),revealed('iron')); setTxt($('ironStock'),S.iron||0); setShow($('potionChip'),revealed('swamp')); setTxt($('potionStock'),(S.rg&&S.rg.potions)||0);
  setShow($('lootChip'),S.loot>0); setTxt($('lootCount'),S.loot);
  const en=enemies.filter(e=>!e.dead).length+spawnQueue; setTxt(enemyEl,en); setShow($('enemyChip'),waveActive||en>0);
  // gece noktaları: bitenler yeşil, bu gece parlak, 5. gece patron
  const nk=S.wave+'|'+WAVES; if(nightsEl._k!==nk){ nightsEl._k=nk; let h=''; for(let i=1;i<=WAVES;i++){ const boss=i===WAVES; h+=`<i class="${i<S.wave?'done':i===S.wave?'now':''}${boss?' boss':''}">${boss?'💀':''}</i>`; } nightsEl.innerHTML=h; }
  waveBoxEl.classList.toggle('night',waveActive&&!runOver);
  setTxt(waveTEl, waveActive? (S.wave===WAVES?'⚔️':'🌙') : tutHold()? '☀️' : '☀️ '+Math.ceil(Math.max(0,waveT)));
  const r=clamp(S.gateHp/D.gateMax(),0,1); gateBar.firstElementChild.style.width=(r*100)+'%'; gateBar.classList.toggle('danger',r<0.35); waveBoxEl.classList.toggle('danger',waveActive&&r<0.35);
  const nb=$('nightBtn'); const showNb=started&&!placing&&fishUI.style.display==='none'&&!waveActive&&!runOver&&!tutHold()&&!document.querySelector('.intro')&&waveT>3; nb.style.display=showNb?'flex':'none'; if(showNb){ const b=Math.round(waveT*(0.8+0.2*S.wave)); const t=`🌙 Geceyi başlat <span>+${b}</span>`; if(nb._t!==t){ nb._t=t; nb.innerHTML=t; } }
  renderQuestChip();
  const pc=$('perkChip'); const keys=Object.keys(S.cards||{}).filter(k=>S.cards[k]>0); pc.style.display=keys.length?'flex':'none'; if(keys.length){ const t=keys.map(k=>CARDS[k].i+(S.cards[k]>1?'×'+S.cards[k]:'')).join(' '); if(pc._t!==t){ pc._t=t; $('perkTxt').textContent=t; } }
}
$('placeCancel').addEventListener('click',e=>{ e.stopPropagation(); audio(); cancelPlacing(); });
addEventListener('keydown',e=>{ if(e.key==='Escape') cancelPlacing(); });
$('muteBtn').addEventListener('click',()=>{ audio(); S.muted=!S.muted; $('muteBtn').textContent=S.muted?'🔇':'🔊'; save(); });
$('muteBtn').textContent=S.muted?'🔇':'🔊';
$('kingBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); if(!waveActive&&!runOver) showMap(); else toast('🌙 Gece bitince'); });
$('nightBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); if(waveActive||runOver) return; const b=Math.round(waveT*(0.8+0.2*S.wave)); if(b>0){ dropCoins(player.g.position.clone().setY(3),Math.min(16,b),b/Math.min(16,b),2,1.1); } waveT=0; startWave(); });
let started=false;
cgCall(k=>k.game.loadingStop());
function banner(title,sub,cls){ const old=$('banner'); if(old) old.remove(); const b=document.createElement('div'); b.id='banner'; b.className='banner '+(cls||''); b.innerHTML=`<b>${title}</b>${sub?`<small>${sub}</small>`:''}`; document.body.appendChild(b); setTimeout(()=>b.classList.add('out'),2100); setTimeout(()=>b.remove(),2700); }
function nightBanner(){ const sides=SIDES.filter(s=>plan&&plan.cnt[s]>0).map(s=>SIDE_TR[s]).join(' · '); if(S.wave===WAVES) banner('PATRON: '+bossName().toLocaleUpperCase('tr'),`⚔️ ${plan.total} · ${sides}`,'boss'); else banner(`GECE ${S.wave}`,`⚔️ ${plan.total} · ${sides}`,'night'); }
let lastSides=sidesActive();
function nightCleared(){ const n=S.wave; if(n>=WAVES){ levelWon(); return; }
  const bonus=12+6*n+4*S.level; const cnt=Math.min(24,bonus); dropCoins(player.g.position.clone().setY(3),cnt,bonus/cnt,3,1.3); celebrate(player.g.position.clone(),0.7);
  S.wave++; plan=null; planWave(); waveT=isWinter()?20:30; dawnRepair(); questEvent('night',1); banner(`Gece ${n} atlatıldı!`,`+${bonus} 💰`,'day');
  const ns=sidesActive(); if(ns>lastSides){ const s=SIDES[ns-1]; setTimeout(()=>toast(`🚪 ${SIDE_TR[s]} kapısı açıldı`,'good'),2600); } lastSides=ns;
  save(); setTimeout(showCardPick,1500); }
// ---------- Gece arası güç kartı ----------
function showCardPick(){ if(runOver||$('cardPick')) return; if(!S.cardOffer){ const keys=Object.keys(CARDS).filter(k=>!(k==='trample'&&cc('trample'))&&!(k==='mend'&&cc('mend'))); const pick=[]; while(pick.length<3){ const k=keys[Math.floor(Math.random()*keys.length)]; if(!pick.includes(k)) pick.push(k); } S.cardOffer=pick; save(); }
  const goldAmt=40+25*S.wave+10*S.level;
  const card=document.createElement('div'); card.className='intro'; card.id='cardPick'; card.innerHTML=`<div class="card"><h1>Bir güç seç</h1><p>Bu sefer boyunca</p><div class="cards">${S.cardOffer.map((k,i)=>`<button data-k="${k}" style="animation-delay:${i*0.08}s"><i>${CARDS[k].i}</i><b>${CARDS[k].n}${cc(k)?` <em>×${cc(k)+1}</em>`:''}</b><small>${k==='gold'?`Hemen +${goldAmt} altın`:CARDS[k].d}</small></button>`).join('')}</div></div>`; document.body.appendChild(card); SFX.card();
  card.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ audio(); const k=b.dataset.k; S.cards[k]=(S.cards[k]||0)+1; S.cardOffer=null; card.remove(); SFX.build();
    if(k==='gold'){ const cnt=24; dropCoins(player.g.position.clone().setY(3.5),cnt,goldAmt/cnt,3,1.3); } if(k==='wall'){ S.gateHp=D.gateMax(); } if(k==='axe') rebuildOrbit();
    toast(CARDS[k].i+' '+CARDS[k].n,'good'); save(); })); }
// ---------- Bölüm sonu: kazanma ----------
function starsFor(minGate){ return minGate>=0.6?3:minGate>=0.25?2:1; }
function levelWon(){ runOver=true; const L=S.level; const st=starsFor(S.minGate); const prev=S.meta.stars[L]||0; const first=!prev; const gain=(first?3:0)+Math.max(0,st-prev)*2+1; S.meta.stars[L]=Math.max(prev,st); S.meta.unlocked=Math.max(S.meta.unlocked,L+1); S.book.boss[L]=bossName(); S.meta.crowns+=gain; S.meta.fails[L]=0; S.won=true; questEvent('night',1); dawnRepair(); save();
  cgCall(k=>k.game.happytime()); SFX.win(); celebrate(player.g.position.clone(),1.4); setTimeout(()=>celebrate(new THREE.Vector3(0,0,0),1.2),350); confetti();
  setTimeout(()=>showBossWheel(()=>showWinCard(st,gain,first)),1900); }
function showWinCard(st,gain,first){ const L=S.level; const last=L>=LEVELS; if(L===LEVELS){ showEndCard(st,gain,first); return; } const card=document.createElement('div'); card.className='intro'; card.id='winCard';
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
    card.innerHTML=`<div class="card map"><div class="maphead"><h1>Krallık</h1><div class="crowns big">👑 ${m.crowns}</div></div>${gift?`<div class="gift">Günlük hediye: +${gift} taç · ${m.streak}. gün</div>`:''}<button id="cont">Devam et · ${S.level}. sefer, Gece ${S.wave}</button><div class="sefers">${nodes.join('')}</div><h2>Koleksiyon defteri</h2><div class="book">${FISH.map(f=>{ const n=S.book.fish[f.k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${f.c.toString(16).padStart(6,'0')}"></i><b>${n?f.n:'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div><div class="book" style="margin-top:6px">${HUNT.map(f=>{ const n=S.book.hunt[f.k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${f.c.toString(16).padStart(6,'0')};border-radius:40%"></i><b>${n?f.n:'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div>${chestBook()}<p class="sub">${fishN}/${FISH.length} balık · ${Object.keys(S.book.hunt).length}/${HUNT.length} av · ${Object.keys(S.book.boss).length} patron yenildi</p><h2>Kalıcı güçlendirme</h2><div class="ups">${Object.keys(UPG).map(k=>{ const lv=m.up[k]||0; const max=lv>=5; const cost=UPC[lv]; return `<div class="upr"><i>${UPG[k].i}</i><div><b>${UPG[k].n} <span>${lv}/5</span></b><small>${UPG[k].d}</small></div><button data-u="${k}" ${max||m.crowns<cost?'disabled':''}>${max?'Tam':'👑 '+cost}</button></div>`; }).join('')}</div><p class="sub">Taç: her seferi kazanınca, yıldız toplayınca ve kaybettiğinde atlattığın her gece için kazanılır.</p></div>`;
    card.querySelectorAll('.upr button').forEach(b=>b.addEventListener('click',()=>{ audio(); const k=b.dataset.u; const lv=S.meta.up[k]||0; const cost=UPC[lv]; if(lv>=5||S.meta.crowns<cost) return; S.meta.crowns-=cost; S.meta.up[k]=lv+1; SFX.fanfare(); save(); render(); }));
    $('cont').addEventListener('click',()=>{ audio(); card.remove(); if(pendingReveal){ const id=pendingReveal; pendingReveal=null; revealRegion(id,()=>startBanner()); } else startBanner(); }); };
  render(); }
function nextRegText(L){ const k=Object.keys(REG).find(k=>REG[k].sefer===L); return k?`<div class="nextreg">Açılacak bölge: <b>${REG[k].name}</b> · ${REG[k].job}</div>`:''; }
let pendingReveal=null;
function clearBattle(){ clearP7Battle(); for(const e of enemies){ e.bar.remove(); scene.remove(e.g); } enemies.length=0; for(const pr of projectiles) scene.remove(pr.m); projectiles.length=0; for(const b of balls) scene.remove(b.m); balls.length=0; spawnQueue=0; waveActive=false; }
// Sefer bitti: kale yerinde, yeni bölge açılır, yeni sefer başlar
function nextSefer(silent){ clearBattle(); S.level++; S.coins+=40*mu('gold'); S.wave=1; S.cards={}; S.cardOffer=null; applyNextCard(); S.minGate=1; S.failed=false; S.won=false; S.revived=false; runOver=false; plan=null; planWave(); waveT=isWinter()?28:40; lastSides=sidesActive(); applyCaps(); S.gateHp=D.gateMax(); save();
  const rid=Object.keys(REG).find(k=>REG[k].sefer===S.level); if(rid&&!revealed(rid)){ if(silent){ pendingReveal=rid; } else revealRegion(rid,()=>startBanner()); } else if(!silent) startBanner(); }
// Kaybedildi: kale kalır; bu seferin geceleri baştan, elde tutulanların yarısı gider
function restartSefer(silent){ clearBattle(); S.wave=1; S.cards={}; S.cardOffer=null; S.minGate=1; S.failed=false; S.revived=false; runOver=false; S.loot=Math.floor(S.loot/2); S.fish=Math.floor((S.fish||0)/2); S.meat=Math.floor((S.meat||0)/2); S.herb=Math.floor((S.herb||0)/2); S.ore=Math.floor((S.ore||0)/2); S.crystal=Math.floor((S.crystal||0)/2); S.stall=Math.floor(S.stall/2); setBack(player); plan=null; planWave(); waveT=30; lastSides=sidesActive(); S.gateHp=D.gateMax(); save(); if(!silent) startBanner(); }
function startBanner(){ banner(`${S.level}. Sefer`, S.wave>1?`Gece ${S.wave}/${WAVES}`:(S.level===1?'🪓 Ağaç kes · 🏹 Kule kur':isWinter()?`❄️ Kış · 💀 ${bossName()}`:`${WAVES} gece · 💀 ${bossName()}`),'day'); }
// ---------- Bölümü sıfırla (her bölüm yeni bir kaleyle başlar) ----------
function restoreNature(){ let a=false; trees.forEach((t,i)=>{ t.claimed=null; if(t.culled&&!nearBase(t.x,t.z,5.5)){ t.culled=false; t.gone=false; t.alive=true; t.falling=0; t.regrow=0; t.hp=D.treeHits(); writeTree(i); a=true; } }); if(a){ treeTrunk.instanceMatrix.needsUpdate=true; treeCrown.instanceMatrix.needsUpdate=true; } rocks.forEach((r,i)=>{ r.claimed=null; if(r.culled&&!nearBase(r.x,r.z,5.5)){ r.culled=false; r.gone=false; r.alive=true; r.hp=3; r.regrow=0; writeRock(i); } }); rockMesh.instanceMatrix.needsUpdate=true; }
function resetRun(level){ const meta=S.meta, muted=S.muted;
  for(const e of enemies){ e.bar.remove(); scene.remove(e.g); } enemies.length=0; for(const pr of projectiles) scene.remove(pr.m); projectiles.length=0; for(const b of balls) scene.remove(b.m); balls.length=0; for(const f of fliers) scene.remove(f.m); fliers.length=0;
  coins.length=0; stackH.clear(); loot.length=0; for(const w of workers) scene.remove(w.guy.g); workers.length=0; for(const so of soldiers) scene.remove(so.guy.g); soldiers.length=0; for(const c of collectors) scene.remove(c.guy.g); collectors.length=0;
  for(const t of towers){ if(t) scene.remove(t.g); } towers.length=0; for(let i=pads.length-1;i>=0;i--){ const pd=pads[i]; if(pd.def.kind==='tower'&&pd.def.ti>8){ scene.remove(pd.g); delete padById[pd.def.id]; pads.splice(i,1); } } if(placing){ scene.remove(placing.ghost.g); placing=null; $('placeBar').style.display='none'; }
  for(const k of Object.keys(S)) delete S[k]; Object.assign(S,runState(level)); for(const f of fishers){ scene.remove(f.g.g); scene.remove(f.b); scene.remove(f.ln); } fishers.length=0; for(const h of hunters) scene.remove(h.guy.g); hunters.length=0; for(const c of carts) scene.remove(c.C.g); carts.length=0; for(const a of animals) scene.remove(a.m.g); animals.length=0; resetRegions6(); S.meta=meta; S.muted=muted; S.coins=20+25*mu('gold'); S.started=true;
  applyBase(); placeBuildings(); paintGround(); restoreNature(); cullTrees(); cullRocks(); cullDecor(); buildWalls(0); buildGates(0); placeGates(); placeTorches(); rebuildTowers(); layoutPads(); rebuildOrbit(); drawMiniBase();
  S.gateHp=D.gateMax(); setPile(0); setStonePile(0); stallPile.count=0; player.g.position.set(0,0,5.5); moveTarget=null; moveMark.visible=false; setBack(player); recenter();
  for(const pd of pads){ pd.last=''; pd.shown=0; pd.wasLocked=false; S.paid[pd.def.id]=0; }
  for(const id in REG) if(REG[id].sefer<=level) S.revealed[id]=true; waveActive=false; spawnQueue=0; runOver=false; plan=null; planWave(); waveT=S.level===1?30:25; buildNets(); buildTraps(); applyCaps(); syncClouds(); nightKills=0; lastSides=sidesActive(); introT=0; save(); }
function startPlay(){ if(started) return; const it=$('intro'); if(it) it.remove(); started=true; renderHud();
  if(!S.started){ resetRun(1); initRegions(); startBanner(); return; }
  initRegions(); if(S.failed) restartSefer(true); runOver=false; const off=offlineRun(S.lastSeen?(Date.now()-S.lastSeen)/1000:0); S.lastSeen=Date.now(); save(); showOffline(off); startBanner(); }
$('startBtn').addEventListener('click',()=>{ audio(); startPlay(); });
if(CG.sdk&&CG.env!=='disabled'){ setTimeout(startPlay,150); }
if(S.started){ $('startBtn').textContent='Devam et'; const ir=$('introRet'); ir.textContent=`👑 ${S.level}. sefer · 🌙 ${S.wave}/${WAVES}`; ir.style.display='block'; document.querySelector('#intro .steps').style.display='none'; }
if(!isTouch) $('ctlHint').textContent='WASD: yürü · Tekerlek: yakınlaştır';

function cgAd(type,onDone,onFail){ if(!CG.sdk){ onFail&&onFail(); return; } if(type==='midgame'&&Date.now()-CG.lastMid<180000){ onFail&&onFail(); return; } let ended=false; const end=(ok)=>{ if(ended) return; ended=true; adMute=false; if(ok){ if(type==='midgame') CG.lastMid=Date.now(); onDone&&onDone(); } else onFail&&onFail(); }; try{ CG.sdk.ad.requestAd(type,{adStarted:()=>{ adMute=true; },adFinished:()=>end(true),adError:()=>end(false)}); setTimeout(()=>{ if(!ended&&!adMute) end(false); },4000); }catch(e){ end(false); } }
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
  // bu gece hangi kapıdan kaç düşman: kırmızı rozet + sayı (eski yazılı satırın yerine)
  if(plan&&(!waveActive||spawnQueue>0)){ for(const s of SIDES){ const n=plan.cnt[s]; if(!n) continue; const [gx,gz]=sidePos(s,0,16); const X=px(gx), Y=px(gz); mctx.fillStyle='#d63a3a'; mctx.beginPath(); mctx.arc(X,Y,8,0,7); mctx.fill(); mctx.strokeStyle='#fff'; mctx.lineWidth=1.5; mctx.stroke(); mctx.fillStyle='#fff'; mctx.font='bold 10px sans-serif'; mctx.textAlign='center'; mctx.textBaseline='middle'; mctx.fillText(String(Math.min(99,n)),X,Y+0.5); } mctx.textBaseline='alphabetic'; }
  const p=player.g.position; dot(p.x,p.z,'#ffd23f',3); mctx.strokeStyle='#2b3a2e'; mctx.lineWidth=1; mctx.beginPath(); mctx.arc(px(p.x),px(p.z),3,0,7); mctx.stroke();
  const hw=viewHalfW()*zoom, hh=hw*innerHeight/innerWidth; mctx.strokeStyle='rgba(255,255,255,.85)'; mctx.lineWidth=1; mctx.strokeRect(px(camTarget.x-hw),px(camTarget.z-hh),px(camTarget.x+hw)-px(camTarget.x-hw),px(camTarget.z+hh)-px(camTarget.z-hh)); }
miniEl.addEventListener('pointerdown',e=>{ e.stopPropagation(); audio(); const r=miniEl.getBoundingClientRect(); const wx=((e.clientX-r.left)/r.width)*2*WORLD-WORLD, wz=((e.clientY-r.top)/r.height)*2*WORLD-WORLD; const p=player.g.position; camPan.set(wx-p.x,0,wz-p.z); follow=false; recenterEl.classList.add('show'); });
// ---------- Döngü ----------
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; const halfW=viewHalfW(); const dist=camOff.length(); const hf=2*Math.atan(halfW/dist); camera.fov=2*Math.atan(Math.tan(hf/2)/camera.aspect)*180/Math.PI; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();
// telefon döndürülünce: bazı telefonlar yeni ekran boyunu biraz geç bildirir, birkaç kez yeniden ölç
function resizeSoon(){ resize(); for(const t of [120,350,800]) setTimeout(resize,t); }
addEventListener('orientationchange',resizeSoon); if(window.visualViewport) visualViewport.addEventListener('resize',resize); if(screen.orientation&&screen.orientation.addEventListener) screen.orientation.addEventListener('change',resizeSoon);
let last=performance.now(); const camTarget=new THREE.Vector3(); const camPos=new THREE.Vector3();
function tick(dt){ gameT+=dt; updateGateMarks(dt); updatePlayer(dt); updateTrees(dt); updateRocks(dt); updateWorkers(dt); updateSoldiers(dt); updateTowers(dt); updatePads(dt); updateEnemies(dt); updateProjectiles(dt); updateBalls(dt); updateGates(dt); updateFliers(dt); updateChips(dt); updateCoins(dt); updateLoot(dt); updateCustomers(dt); updateCollectors(dt); updateTraderNpc(dt); updateFx(dt); updateRegions(dt); }
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(0.05,(now-last)/1000); last=now; if(slowT>0){ slowT=Math.max(0,slowT-dt); dt*=1-0.72*Math.min(1,slowT/0.9); }
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
window.__dbg={cards:{showWinCard,showFailCard,showEndCard},p7:{showBossWheel,showQuests,questEvent,ensureQuests,dawnRepair,ships,eArrows,bossChests,isWinter,get slowT(){ return slowT; }},get night(){ return night; },set night(v){ night=v; applyNight(v); },p6:{fogSides,chests,spawnChest,openChest,boats,mushNodes,oreNodes,crysNodes,herbalists,miners,cminers,SHUT_FRONT,FORGE_FRONT,JEW_FRONT,CAUL,FORGE,JEW,lampPosts,fogK,SC,CU,PIER_B:PIER_END,castle,bossPhase,SW,IR,CO,SN,swampPile,coastPile,snowPile},bubblePadId:()=>bubblePad&&bubblePad.def.id+":"+(bubblePad.needLeave?"NL":"")+(playerMoving?"MV":""),carts,QCUT,MILL,RC,QC,animals,hunters,HHUT_FRONT,MC,nextSefer,restartSefer,revealRegion,offlineRun,showOffline,regionGuide,get pileFish(){ return S.rg.fishPile||0; },FS,fishers,DOCK_END,HUT_FRONT,fishPile,rebuildT:rebuildTowers,placeSpotRaw:(x,z)=>{ const r=placeSpot(x,z); return r.ok&&Math.hypot(r.x-x,r.z-z)<0.01; },cancelPlacing,rocksArr:()=>rocks,S,D,damageEnemy,killEnemy,player,trees,enemies,workers,soldiers,towers,pads,coins,loot,customers,plan:()=>plan,get waveActive(){return waveActive;},get waveT(){return waveT;},set waveT(v){waveT=v;},get runOver(){return runOver;},set runOver(v){runOver=v;},get placing(){return placing;},get moveTarget(){return moveTarget;},set moveTarget(v){moveTarget=v;},get guideTarget(){return guideTarget;},get zoom(){return zoom;},set zoom(v){zoom=v;},get zoomTarget(){return zoomTarget;},set zoomTarget(v){zoomTarget=v;},camera,camOff,camTarget,camPan,tick,startWave,resetRun,showMap,showCardPick,levelWon,gateBroken,placeSpot,placeGhostAt,confirmPlace,instantBuy,sidePos,setBack,setPile,setStonePile,dropCoins,addWorker,addSoldier,makeEnemy,expandBase,nightHp,nightCount,celebrate,STALL,DEPOT,get H(){return H;},startPlay};
}
