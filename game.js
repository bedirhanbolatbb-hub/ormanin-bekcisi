// CrazyGames köprüsü: site dışında sessizce çalışmaz, oyunu etkilemez
const CG={sdk:null,env:'none',playing:false,lastMid:0,mute:false};
// platform ilk yayında (Basic Launch) reklamı yasaklar: reklam yalnız OB_ADS açıkken istenir
const ADS=!!window.OB_ADS;
function cgCall(fn){ try{ if(CG.sdk) return fn(CG.sdk); }catch(e){} }
// FX1: SDK hazır olmadan (Data modülü okunmadan) oyun başlamaz ve buluta hiçbir şey yazılmaz: en çok 15 sn beklenir (Oyna düğmesi ⏳).
// Süre dolarsa oyun yalnız localStorage ile açılır; SDK geç hazır olursa bulut kaydı okunur, daha ilerideyse o yüklenir (CG.onLate), değilse yereldeki buluta yazılır.
function cgReady(s){ CG.sdk=s; CG.env=s.environment||'unknown'; cgCall(k=>{ CG.mute=!!(k.game.settings&&k.game.settings.muteAudio); k.game.addSettingsChangeListener(st=>{ CG.mute=!!(st&&st.muteAudio); }); }); }
(async function boot(){ const s=window.CrazyGames&&window.CrazyGames.SDK; if(s){ const b=document.getElementById('startBtn'), bh=b&&b.innerHTML; if(b){ b.disabled=true; b.innerHTML='⏳'; } let ok=false; const ip=Promise.resolve().then(()=>s.init()).then(()=>{ ok=true; },()=>{});
  await Promise.race([ip,new Promise(r=>setTimeout(r,15000))]); if(b){ b.disabled=false; b.innerHTML=bh; }
  if(ok){ try{ cgReady(s); cgCall(k=>k.game.loadingStart()); }catch(e){} } else ip.then(()=>{ if(ok&&CG.onLate) try{ CG.onLate(s); }catch(e){} }); } startGame(); })();
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
// ---------- Dil: cihaz Türkçe ise Türkçe, değilse İngilizce; oyuncu Krallık ekranından değiştirebilir ----------
const LANG=(()=>{ let v=null; try{ if(CG.sdk&&CG.sdk.data) v=CG.sdk.data.getItem('ob-lang'); }catch(e){} if(v==null){ try{ v=localStorage.getItem('ob-lang'); }catch(e){} } if(v==='tr'||v==='en') return v; let si=null; try{ si=CG.sdk&&CG.sdk.user&&CG.sdk.user.systemInfo; }catch(e){} const l=String((si&&si.locale)||(navigator.languages&&navigator.languages[0])||navigator.language||'en').toLowerCase(); return l.startsWith('tr')?'tr':'en'; })();
const T=(tr,en)=>(LANG==='tr'||en===undefined)?tr:en;
/* FX3: büyük sayılar binlik ayraçla (80.809 / 80,809); HUD çipinde 100 binden sonrası kısa (123B / 123K) */
const fmtN=n=>{ n=Math.floor(n||0); try{ return n.toLocaleString(LANG==='tr'?'tr-TR':'en-US'); }catch(e){ return String(n); } }, fmtC=n=>(n||0)>=1e5?fmtN((n||0)/1000)+T('B','K'):fmtN(n);
function setLang(l){ try{ localStorage.setItem('ob-lang',l); }catch(e){} try{ if(CG.sdk&&CG.sdk.data) CG.sdk.data.setItem('ob-lang',l); }catch(e){} }
document.documentElement.lang=LANG; if(LANG==='en'){ document.title='Grovehold: Forest Siege'; document.querySelectorAll('[data-en]').forEach(el=>{ el.innerHTML=el.dataset.en; }); document.querySelectorAll('[data-en-aria]').forEach(el=>{ el.setAttribute('aria-label',el.dataset.enAria); }); }

// ---------- Kalıcı durum ----------
const SAVE_KEY='ormanin-bekcisi-v8'; const OLD_KEY='ormanin-bekcisi-v7';
const WAVES=5; const MAXL=10; const LEVELS=10;
const LV0={axe:0,bag:0,feet:0,worker:0,stoneWorker:0,sword:0,wall:0,soldier:0,expand:0,trader:0,towerTrain:0,magnet:0,collector:0,gateLv:0,range:0,depotLv:0,workerSpd:0,price:0,soldierTrain:0,cannonTrain:0};
const SIDES=['N','E','S','W']; const SIDE_TR={N:T('Kuzey','North'),E:T('Doğu','East'),S:T('Güney','South'),W:T('Batı','West'),C:T('Merkez','Central')};
function defaultTowers(){ const t=[{k:'a',side:'C',a:0,lvl:0,fixed:true}]; for(const s of SIDES) for(const a of [-5.2,5.2]) t.push({k:'a',side:s,a,lvl:0,fixed:true}); return t; }
// Kalıcı (meta): açılan bölüm, yıldızlar, taç, kalıcı güçlendirmeler. Bölümlük (run): her bölüm başında sıfırlanır.
const META0={unlocked:1,stars:{},crowns:0,up:{gold:0,wall:0,arrow:0},dailyDate:'',streak:0,fails:{}};
function runState(level){ return { fish:0, meat:0, planks:0, iron:0, ore:0, herb:0, crystal:0, rg:{}, revealed:{forest:true}, book:{fish:{},hunt:{},boss:{},chest:{}}, lastSeen:0, coins:0, bank:0, logs:0, stones:0, stone:0, loot:0, wood:0, stall:0, wave:1, level:level||1, gateHp:150, treesCut:0, kills:0, lv:Object.assign({},LV0), towers:defaultTowers(), paid:{}, cards:{}, cardOffer:null, minGate:1, started:false }; }
const S = Object.assign(runState(1), { muted:false, meta:JSON.parse(JSON.stringify(META0)) });
const store={ get:k=>{ let v=null; try{ if(CG.sdk&&CG.sdk.data) v=CG.sdk.data.getItem(k); }catch(e){} if(v==null){ try{ v=localStorage.getItem(k); }catch(e){} } return v; }, set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} try{ if(CG.sdk&&CG.sdk.data) CG.sdk.data.setItem(k,v); }catch(e){} } };
// FX1: bulut (Data modülü) ve yerel yedek (localStorage) ayrı okunur, daha ilerideki kayıt seçilir (sefer › gece › son görülme); boş/yeni kayıt dolu kaydı ezemez
function saveRank(j){ return j&&typeof j==='object'&&j.started?[+j.level||0,+j.wave||0,+j.lastSeen||0]:null; }
function betterSave(a,b){ const ra=saveRank(a), rb=saveRank(b); if(!rb) return ra?a:(a||b); if(!ra) return b; for(let i=0;i<3;i++){ if(ra[i]!==rb[i]) return ra[i]>rb[i]?a:b; } return a; }
function readSave(){ let c=null, l=null; try{ if(CG.sdk&&CG.sdk.data) c=JSON.parse(CG.sdk.data.getItem(SAVE_KEY)); }catch(e){} try{ l=JSON.parse(localStorage.getItem(SAVE_KEY)); }catch(e){} return betterSave(c,l); }
function load(){ try{ let j=readSave(); if(j){
  // F9a: gece ortasında kapatıldıysa kayıp gibi: AYNI gece baştan (kısa hazırlık gündüzüyle), eldekiler korunur; yıldız için sur o gecenin başındaki değere döner (p4 retryNight)
  const sn=j.nightSnap; if(j.nightOn&&!j.failed&&!j.won){ if(sn&&typeof sn==='object'&&sn.level===j.level&&sn.wave===j.wave&&typeof sn.minGate==='number') j.minGate=sn.minGate; j.nightOn=false; j.nightRe=1; }
  Object.assign(S,j); S.lv=Object.assign({},LV0, j.lv||{}); S.towers=Array.isArray(j.towers)&&j.towers.length>=9? j.towers : defaultTowers(); S.paid=j.paid||{}; S.cards=j.cards||{}; S.meta=Object.assign(JSON.parse(JSON.stringify(META0)),j.meta||{}); S.meta.up=Object.assign({gold:0,wall:0,arrow:0},S.meta.up||{}); S.book=Object.assign({fish:{},hunt:{},boss:{},chest:{}},j.book||{}); for(const k of ['fish','hunt','boss','chest']) if(!S.book[k]||typeof S.book[k]!=='object') S.book[k]={}; S.rg=(j.rg&&typeof j.rg==='object')?j.rg:{}; S.revealed=Object.assign({forest:true},j.revealed||{}); if(typeof S.snd!=='number') S.snd=S.muted?2:0; if(S.level>LEVELS&&!S.meta.best) S.meta.best=Math.max(0,(S.level-LEVELS-1)*WAVES+(S.wave|0)-1); /* F9a: eski sonsuz kayıtlarda rekor */ return; } }catch(e){}
  // eski kayıttan geçiş: taç ve kalıcı güçlendirmeler korunur, krallık 1. seferden kurulur
  try{ const o=JSON.parse(store.get(OLD_KEY)); if(o&&o.meta){ S.meta.crowns=o.meta.crowns||0; S.meta.up=Object.assign({gold:0,wall:0,arrow:0},o.meta.up||{}); S.muted=!!o.muted; S.snd=S.muted?2:0; S.meta.dailyDate=o.meta.dailyDate||''; S.meta.streak=o.meta.streak||0; } }catch(e){} }
let saveHook=null; // p4: gün sayacı ve yerdeki altın her kayıtta güncel yazılır
let awayAt=0; // FX1: sekme gizliyken lastSeen ilerlemez (dönüşte çevrimdışı kazanç, p4)
function save(){ if(CG.noSave) return; if(saveHook) try{ saveHook(); }catch(e){} if(S.started&&!awayAt) S.lastSeen=Date.now(); store.set(SAVE_KEY, JSON.stringify(S)); }
load();
{ const bootR=saveRank(S); CG.onLate=s=>{ let c=null; try{ c=JSON.parse(s.data.getItem(SAVE_KEY)); }catch(e){} const cr=saveRank(c); const cmp=(a,b)=>{ for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return a[i]>b[i]?1:-1; } return 0; };
  if(cr&&(!bootR||cmp(cr,bootR)>0)&&(!S.started||cmp(cr.slice(0,2),[S.level,S.wave])>=0)){ CG.noSave=true; try{ localStorage.setItem(SAVE_KEY,JSON.stringify(c)); }catch(e){} location.reload(); return; }
  cgReady(s); CG.playing=false; if(S.started) save(); }; }
const gw=()=>(S.level-1)*WAVES+S.wave;
// F9a: 10. seferden sonra Sonsuz Kuşatma: geceler tek sayaçla (Gece N), 5 gecede bir patron; istatistik sayaçları (meta.st) kalıcı
const endless=L=>(L||S.level)>LEVELS; const eNight=(L,w)=>(L-LEVELS-1)*WAVES+w; const ENAME=()=>T('Sonsuz Kuşatma','Endless Siege');
function chapTitle(L,w){ L=L||S.level; w=w||S.wave; return endless(L)?T(`♾ ${ENAME()} · Gece ${eNight(L,w)}`,`♾ ${ENAME()} · Night ${eNight(L,w)}`):T(`${L}. Sefer`,`Chapter ${L}`); }
function stat(k,n){ const m=S.meta; if(!m) return; const st=m.st||(m.st={}); st[k]=(st[k]||0)+(n||1); }
// Gece arası güç kartları (bölüm boyunca geçerli, üst üste eklenir)
const CARDS={
  arrow:{n:T('Keskin Oklar','Sharp Arrows'),d:T('Okçu kulelerinin hasarı +%25','Archer Tower damage +25%'),i:'🏹'}, rate:{n:T('Hızlı Yay','Quick Bow'),d:T('Okçular %20 daha hızlı atar','Archers shoot 20% faster'),i:'💨'}, range:{n:T('Uzun Menzil','Long Range'),d:T('Tüm kulelerin menzili +3','All towers get +3 range'),i:'🎯'},
  powder:{n:T('Barut','Gunpowder'),d:T('Topçu hasarı +%40','Cannon damage +40%'),i:'💣'}, wall:{n:T('Sağlam Sur','Sturdy Walls'),d:T('Sur canı +%25 ve tamamen onarılır','Wall HP +25%, fully repaired'),i:'🧱'}, mend:{n:T('Duvarcı','Mason'),d:T('Saldırı sırasında sur kendini onarır','Walls self-repair under attack'),i:'🔧'},
  sword:{n:T('Keskin Kılıç','Sharp Sword'),d:T('Kılıç hasarı +%40, menzili biraz artar','Sword damage +40%, a bit more reach'),i:'⚔️'}, drill:{n:T('Talimli Asker','Trained Soldiers'),d:T('Askerler %40 daha sert vurur','Soldiers hit 40% harder'),i:'🛡️'}, trample:{n:T('Midilli Ezme','Pony Trample'),d:T('Koşarken çarptığın düşmanı ezersin','Trample enemies you run into'),i:'🐴'},
  pony:{n:T('Çevik Midilli','Nimble Pony'),d:T('Midilli %15 daha hızlı','Pony 15% faster'),i:'🥕'}, axe:{n:T('Güçlü Balta','Strong Axe'),d:T('Ağaçları %30 daha hızlı kesersin','Chop trees 30% faster'),i:'🪓'}, lumber:{n:T('Odun Bereketi','Wood Galore'),d:T('Her ağaç +2 odun verir','+2 wood per tree'),i:'🌲'},
  magnet:{n:T('Mıknatıs','Magnet'),d:T('Altın ve ganimet %60 daha uzaktan gelir','Gold and loot pickup range +60%'),i:'🧲'}, trade:{n:T('Pazarlık','Haggling'),d:T('Miğferler %30 daha pahalı satılır','Helmets sell for 30% more'),i:'🤝'}, gold:{n:T('Hazine Sandığı','Treasure Chest'),d:T('Hemen altın kazan','Instant gold'),i:'💰'},
};
// kart ancak etkileyeceği bir şey varsa sunulur (topçu yokken Barut, asker yokken Talimli Asker çıkmaz)
const CARD_NEED={arrow:()=>S.towers.some(t=>t.k!=='c'&&t.lvl>=1), rate:()=>CARD_NEED.arrow(), range:()=>S.towers.some(t=>t.lvl>=1), powder:()=>S.towers.some(t=>t.k==='c'&&t.lvl>=1), drill:()=>(S.lv.soldier||0)>0};
const cardUseful=k=>!!CARDS[k]&&(!CARD_NEED[k]||CARD_NEED[k]());
// ekonomi kartları da duruma bakar: odun bolken balta/odun kartı, altın yığılmışken hazine/pazarlık çıkmaz (etkisi yok denecek kadar az)
const woodWanted=()=>S.wood+S.logs<300||(revealed('river')&&S.wood<400)||pads.some(pd=>padVisible(pd)&&!pd.locked&&padRes(pd)==='wood'&&!padAvail(pd));
function goldRich(){ const ga=40+25*S.wave+10*S.level; let need=0; for(const pd of pads){ if(padVisible(pd)&&!pd.locked&&padRes(pd)==='gold') need=Math.max(need,padCost(pd)-(S.paid[pd.def.id]||0)); } return S.coins>=Math.max(15*ga,2*need); }
Object.assign(CARD_NEED,{axe:woodWanted, lumber:woodWanted, gold:()=>!goldRich(), trade:()=>!goldRich()});
const CARD_FIGHT=['arrow','rate','range','powder','wall','mend','sword','drill','trample'];
const cc=k=>(S.cards&&S.cards[k])||0; const mu=k=>(S.meta&&S.meta.up&&S.meta.up[k])||0;
// F7: kahramanın kılıcı seferle güçlenir (eskiden 1. seferdeki 9'da kalıyordu, geç seferlerde düşman canının %1'i): gece saldırılan kapıda durmak her seferde hissedilir
const heroK=()=>1+1.5*Math.max(0,(S.level|0)-1);
const hasPerk=k=>cc({arrows:'rate',mason:'mend',gold:'trade',lumber:'lumber',magnet:'magnet',cannon:'powder',trample:'trample'}[k]||k)>0;
const D = {
  chopRate:()=>4.0*(1+0.3*cc('axe'))*(isWinter()?0.72:1), treeHits:()=>1, logsPerTree:()=>4+2*cc('lumber'),
  cap:()=>40+15*S.lv.feet, speed:()=>(8.4+0.5*S.lv.feet)*(1+0.15*cc('pony')), magnet:()=>3.8*(1+0.6*cc('magnet')), lootPrice:()=>(8+gw()*1.0+3*S.lv.trader)*(1+0.3*cc('trade')), buyTime:()=>Math.max(0.25,0.7-0.08*S.lv.trader),
  swordDmg:()=>9*heroK()*(1+0.4*cc('sword')), swordRange:()=>2.9+0.3*cc('sword'),
  gateMax:()=>Math.round((150+120*S.lv.wall)*(1+0.25*cc('wall'))*(1+0.05*mu('wall'))*(1+0.12*(S.lv.ironWall||0))), towerDmg:l=>(5+3*(l-1))*(1+0.25*cc('arrow'))*(1+0.04*mu('arrow'))*(1+0.1*(S.lv.ironArrow||0)), towerRange:()=>17+3*cc('range'), towerRate:()=>1+0.2*cc('rate'), cannonDmg:l=>(14+7*(l-1))*(1+0.4*cc('powder')), soldierDmg:()=>8*(1+0.4*cc('drill')),
};
// Kapı sayısı: bölümün gecesine ve bölüm numarasına göre açılır
// F7: kapılar seferler arasında yeniden kapanmaz: 1. sefer 1-1-2-3-3 (patron gecesinde yeni kapı yok), 2. sefer 1. seferin 3 kapısıyla başlar (4. kapı 3. gecede), sonra hep 4
const GATE_PLAN={1:[1,1,2,3,3],2:[3,3,4,4,4]}; const sidesActive=()=>{ const g=GATE_PLAN[S.level]; return g?g[Math.max(0,Math.min(4,S.wave-1))]:4; };
const sidesShown=()=>Math.min(4,sidesActive()+1);

// ---------- Ses ----------
let AC=null;
function audio(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&(AC.state==='suspended'||AC.state==='interrupted')) try{ AC.resume(); }catch(e){} if(AC) musicInit(); }
let adMute=false;
// FX1: ilk dokunuş/tık/tuş sesi açar (CrazyGames'te Oyna düğmesi atlanır; WASD ile oynayan da ses duysun; iOS touchend)
{ const unlock=()=>{ if(adMute||document.hidden) return; audio(); }; for(const t of ['pointerdown','touchstart','touchend','mousedown','click','keydown']) addEventListener(t,unlock,{capture:true,passive:true}); }
function sfxOff(){ return (S.snd|0)>=2||adMute||CG.mute; } function musOff(){ return (S.snd|0)>=1||adMute||CG.mute; }
/* FX4: tüm efektler tek ana kanaldan (kompresör) çıkar: üst üste binen sesler patlamaz; aynı anda en çok VMAX efekt sesi; gürültü tamponu bir kez üretilir (her çağrıda yeni tampon yok); SFX_K: dünyadaki sesin oyuncuya uzaklık çarpanı (sfxAt) */
let MASTER=null, NOISE_BUF=null, SFX_K=1, SFX_DET=0; const VMAX=24, VEND=[];
function sfxBus(){ if(!MASTER&&AC){ try{ const c=AC.createDynamicsCompressor(); c.threshold.value=-12; c.knee.value=6; c.ratio.value=8; c.attack.value=0.003; c.release.value=0.15; MASTER=AC.createGain(); MASTER.gain.value=1; MASTER.connect(c).connect(AC.destination); }catch(e){ MASTER=AC.destination; } } return MASTER||AC.destination; }
function voiceOk(t,dur){ if(VEND.length>=VMAX){ for(let i=VEND.length-1;i>=0;i--) if(VEND[i]<=t) VEND.splice(i,1); if(VEND.length>=VMAX) return false; } VEND.push(t+dur); return true; }
function tone(f0,f1,dur,type,vol){ if(sfxOff()||!AC) return; const v=(vol||0.08)*SFX_K; if(v<0.003) return; const t=AC.currentTime; if(!voiceOk(t,dur)) return; const o=AC.createOscillator(), g=AC.createGain(); o.type=type||'sine'; if(SFX_DET) o.detune.value=(Math.random()*2-1)*SFX_DET; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g).connect(sfxBus()); o.start(t); o.stop(t+dur); }
function noise(dur,vol){ if(sfxOff()||!AC) return; const v=(vol||0.25)*SFX_K; if(v<0.01) return; const t=AC.currentTime; dur=Math.min(0.95,dur); if(!voiceOk(t,dur)) return; if(!NOISE_BUF){ const n=AC.sampleRate; NOISE_BUF=AC.createBuffer(1,n,AC.sampleRate); const d=NOISE_BUF.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; } const s=AC.createBufferSource(); s.buffer=NOISE_BUF; const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900; const g=AC.createGain(); g.gain.setValueAtTime(v,t); g.gain.linearRampToValueAtTime(0.0001,t+dur); s.connect(f).connect(g).connect(sfxBus()); s.start(t,Math.random()*(1-dur),dur); }
const SFX = {
  chop:()=>{ noise(0.08,0.2); tone(180,90,0.08,'square',0.035); }, fall:()=>{ noise(0.3,0.25); tone(120,50,0.3,'sawtooth',0.045); }, /* FX4: kesme/devrilme sesi kısıldı, para/ödeme sesi açıldı (oyuncunun kendi ödülü duyulsun) */
  coin:()=>{ if(typeof coinChime==='function') coinChime(); else tone(880,1320,0.12,'sine',0.06); }, sell:(()=>{ let n=0,t0=0; const PS=[0,2,4,7,9,12,14,16,19,21]; return ()=>{ const now=performance.now(); n=now-t0<420?n+1:0; t0=now; const f=660*Math.pow(2,PS[n%PS.length]/12); tone(f,f*1.5,0.08,'triangle',0.05); }; })(), /* FX4: art arda bırakmada aynı bip yerine yükselen beşli dizi */ pay:(k)=>{ k=Math.max(0,Math.min(1,k||0)); const f=420+k*900; tone(f,f*1.12,0.05,'triangle',0.045+0.04*k); },
  build:()=>{ tone(300,600,0.15,'triangle',0.08); setTimeout(()=>tone(600,900,0.2,'triangle',0.08),120); setTimeout(()=>tone(900,1200,0.25,'sine',0.07),260); },
  slash:()=>{ noise(0.07,0.25); tone(900,300,0.09,'sawtooth',0.04); }, hit:()=>{ tone(300,120,0.1,'square',0.05); }, die:()=>{ tone(400,80,0.2,'sawtooth',0.05); },
  gate:()=>{ noise(0.12,0.3); tone(90,40,0.15,'square',0.06); }, wave:()=>{ tone(220,330,0.25,'triangle',0.08); setTimeout(()=>tone(330,440,0.3,'triangle',0.08),200); },
  boom:()=>{ noise(0.35,0.3); tone(90,30,0.35,'sawtooth',0.07); },
  // büyük satın alma: gümbürtü + yükselen üç nota + parıltı
  doom:()=>{ noise(0.7,0.3); tone(98,46,1.8,'sawtooth',0.1); tone(104,49,1.8,'sawtooth',0.06); setTimeout(()=>tone(73,34,2.0,'square',0.07),380); setTimeout(()=>tone(155,146,1.2,'triangle',0.05),900); }, /* F9b: Kara Kale açılışı: uğursuz vuruş */
  fanfare:()=>{ noise(0.25,0.35); tone(110,55,0.3,'sine',0.12); [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,f*1.01,0.22+i*0.05,'triangle',0.09),80+i*95)); setTimeout(()=>tone(2093,2637,0.3,'sine',0.04),480); },
  win:()=>{ [523,659,784,1047,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,f,0.28,'triangle',0.1),i*140)); setTimeout(()=>noise(0.4,0.2),900); },
  lose:()=>{ [392,349,311,262].forEach((f,i)=>setTimeout(()=>tone(f,f*0.97,0.35,'sawtooth',0.09),i*220)); },
  night:()=>{ tone(110,98,0.9,'sawtooth',0.06); setTimeout(()=>tone(147,131,0.9,'sawtooth',0.05),250); noise(0.6,0.12); },
  card:()=>{ tone(880,1760,0.15,'sine',0.07); setTimeout(()=>tone(1320,1760,0.2,'sine',0.06),110); },
};
/* FX4: aynı ses çok sık çalmaz (GAP: en kısa aralık, sn; daha yakındaki/yüksek ses sırayı alır), sık seslerde hafif perde oynaması (DET, cent);
   dünya sesleri sfxAt(konum,taban) ile oyuncuya uzaklığa göre kısılır, uzaktakiler hiç çalmaz; büyük kutlama sesleri (build/fanfare/win/lose) aynı anda üst üste binmez: aynı karede en önemlisi çalar, 0.8 sn içinde eşit/düşük önemlisi atlanır */
{ const GAP={hit:0.07,sell:0.11,boom:0.12,gate:0.2,chop:0.08,fall:0.12,die:0.06,slash:0.07,pay:0.045,coin:0.035,wave:0.5,night:1,card:0.3}, DET={hit:60,sell:35,boom:50,gate:50,chop:60,fall:40,die:50,slash:50}, PRI={build:1,fanfare:2,win:3,lose:3,doom:3}, lastT={}, lastK={}; let stQ=null, stT=-9, stP=0;
  for(const k of Object.keys(SFX)){ const raw=SFX[k];
    if(PRI[k]) SFX[k]=(...a)=>{ SFX_K=1; if(!AC||sfxOff()) return; const p=PRI[k]; if(stQ){ if(p>stQ.p) stQ={p,raw,a}; return; } stQ={p,raw,a}; setTimeout(()=>{ const q=stQ; stQ=null; if(!q||!AC) return; const t=AC.currentTime; if(t-stT<0.8&&q.p<=stP) return; stT=t; stP=q.p; q.raw(...q.a); },0); };
    else SFX[k]=(...a)=>{ const K=SFX_K; SFX_K=1; if(!AC||sfxOff()||K<0.04) return; const t=AC.currentTime, g=GAP[k]||0; if(g&&t-(lastT[k]||-9)<g&&K<=(lastK[k]||0)*1.8) return; lastT[k]=t; lastK[k]=K; SFX_K=K; SFX_DET=DET[k]||0; try{ raw(...a); } finally { SFX_K=1; SFX_DET=0; } }; } }
function wvol(pos,floor){ if(!pos) return 1; const p=player.g.position; const d=Math.hypot(pos.x-p.x,pos.z-p.z); const k=d<10?1:Math.max(0,1-(d-10)/30); return Math.max(floor||0,k); }
function sfxAt(pos,floor){ SFX_K=wvol(pos,floor); return SFX; }
// ---------- Müzik: gündüz sakin, gece gergin (tamamen kod ile üretilir, dosya yok) ----------
const MUS={next:0,step:0,mel:4,vol:null,lp:null,mode:'day'};
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const SCALES={day:[60,62,64,67,69,72,74,76],night:[57,60,62,64,67,69,72,74]};
const ROOTS={day:[48,45,41,43],night:[45,41,43,40],doom:[40,41,40,38]}; SCALES.doom=[52,53,55,56,59,60,63,64];
function musicInit(){ if(MUS.vol||!AC) return; MUS.vol=AC.createGain(); MUS.vol.gain.value=0; MUS.lp=AC.createBiquadFilter(); MUS.lp.type='lowpass'; MUS.lp.frequency.value=1800; MUS.lp.connect(MUS.vol).connect(sfxBus()); MUS.next=AC.currentTime+0.1; }
function mnote(midi,t,dur,type,vol,det){ const o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.value=NOTE(midi); if(det) o.detune.value=det; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g).connect(MUS.lp); o.start(t); o.stop(t+dur+0.05); }
function musicTick(night){ if(!AC||!MUS.vol) return; const target=musOff()?0:(night>0.5?0.13:0.11); /* FX4: müzik efektlerin çok altındaydı */ MUS.vol.gain.setTargetAtTime(target,AC.currentTime,0.8); const mode=night>0.5?(DOOM>0.5?'doom':'night'):'day'; /* F9b: son seferde gece müziği karanlık (doom) */ if(mode!==MUS.mode){ MUS.mode=mode; MUS.lp.frequency.setTargetAtTime(mode==='doom'?850:mode!=='day'?1200:1800,AC.currentTime,0.5); }
  const bpm=mode==='doom'?116:mode!=='day'?132:96; const st=60/bpm/2; if(MUS.next<AC.currentTime) MUS.next=AC.currentTime+0.05; while(MUS.next<AC.currentTime+0.4){ const t=MUS.next; const i=MUS.step; const bar=Math.floor(i/16), beat=i%16; const root=ROOTS[mode][Math.floor(bar/2)%4]; const sc=SCALES[mode];
    if(beat===0){ mnote(root,t,st*16,'sine',0.5); mnote(root+7,t,st*16,'sine',0.25,6); mnote(root+12,t,st*16,'triangle',0.12,-5); }
    if(beat%4===0) mnote(root-12,t,st*3,mode!=='day'?'sawtooth':'triangle',mode!=='day'?0.28:0.2);
    if(mode!=='day'&&beat%4===2) mnote(root-12,t,st*1.2,'square',0.06);
    if(beat%2===0&&Math.random()<(mode!=='day'?0.75:0.55)){ MUS.mel=clamp(MUS.mel+(Math.random()<0.5?-1:1)*(Math.random()<0.25?2:1),0,sc.length-1); mnote(sc[MUS.mel],t,st*(Math.random()<0.3?4:2),mode!=='day'?'square':'triangle',mode!=='day'?0.12:0.16); }
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
// F9b: son seferde (Kara Kral yaşarken) ışık kırmızı-karanlığa kayar: gündüz hafif, gece tam; açılışta kısa bir kırmızı parlama (DOOM>1)
let DOOM=0; const DOOMC={bg:new THREE.Color(0x3a1418),sun:new THREE.Color(0xff5a40),hemi:new THREE.Color(0x8a3440)};
function applyDoom(k){ if(DOOM<0.002) return; const f=Math.min(1,Math.max(0,DOOM-1)), d=Math.max(f,Math.min(1,DOOM*(0.3+0.7*k))); scene.background.lerp(DOOMC.bg,d*0.6); scene.fog.color.copy(scene.background); sun.color.lerp(DOOMC.sun,d*0.5); hemi.color.lerp(DOOMC.hemi,d*0.35); sun.intensity*=1-0.3*d; renderer.toneMappingExposure*=1-0.12*d-0.25*f; }
function applyNight(k){ scene.background.copy(DAY.bg).lerp(NIGHT.bg,k); scene.fog.color.copy(scene.background); sun.color.copy(DAY.sun).lerp(NIGHT.sun,k); sun.intensity=lerp(DAY.sunI,NIGHT.sunI,k); hemi.color.copy(DAY.hemi).lerp(NIGHT.hemi,k); hemi.intensity=lerp(DAY.hemiI,NIGHT.hemiI,k); renderer.toneMappingExposure=lerp(DAY.exp,NIGHT.exp,k); applyDoom(k); }
sun.position.set(14,26,10); sun.castShadow=true;
sun.shadow.mapSize.set(isMobile?1024:2048,isMobile?1024:2048);
Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:120});
sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.02; sun.shadow.camera.updateProjectionMatrix();
scene.add(sun); scene.add(sun.target);

const mat=(c,extra)=>new THREE.MeshLambertMaterial(Object.assign({color:c},extra||{}));
/* F6: count=0 olan InstancedMesh hiç çizilmez (boş sırt yığını/raf her karede 2 boş çizim çağrısıydı): katman maskesi 0 olur */
Object.defineProperty(THREE.InstancedMesh.prototype,'count',{configurable:true,get(){ return this._cnt; },set(v){ this._cnt=v; if(this.layers) this.layers.mask=v>0?1:0; }});
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
/* F6: grubun doğrudan çocuğu olan durağan ağları malzemeye göre tek ağda birleştirir (çizim çağrısı ve gölge çağrısı azalır). Gruplar (canlı parçalar), sprite, instanced ve keep içindekiler dokunulmaz */
function bakeStatic(root,keep){ root.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(), B=new Map();
  for(const c of root.children){ if((keep&&keep.has(c))||!c.isMesh||c.isInstancedMesh||!c.visible||Array.isArray(c.material)||c.material.map||!c.geometry.attributes.normal||c.geometry.attributes.color) continue; const k=c.material.uuid+(c.castShadow?'s':'')+(c.receiveShadow?'r':''); let e=B.get(k); if(!e) B.set(k,e={m:c.material,cs:c.castShadow,rs:c.receiveShadow,l:[]}); e.l.push(c); }
  for(const e of B.values()){ if(e.l.length<2) continue; const gs=e.l.map(c=>{ const g=c.geometry.index?c.geometry.toNonIndexed():c.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,c.matrixWorld)); return g; }); const m=new THREE.Mesh(mergeGeos(gs),e.m); gs.forEach(g=>g.dispose()); m.castShadow=e.cs; m.receiveShadow=e.rs; m.userData.baked=true; for(const c of e.l) root.remove(c); root.add(m); } return root; }
/* F6: karakter parçaları: grubun doğrudan çocuğu olan düz renkli ağlar köşe renkli tek ağ olur (kişi başına ~20 yerine ~9 çizim). Işıltılı/saydam/dokulu malzemeler ayrı kalır */
const M_VC=new THREE.MeshLambertMaterial({vertexColors:true}); const VC_CACHE=new Map();
function bakeVC(root){ root.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(), B={};
  for(const c of root.children){ const m=c.material; if(!c.isMesh||c.isInstancedMesh||!c.visible||!m||Array.isArray(m)||!m.isMeshLambertMaterial||m.map||m.transparent||m.vertexColors||(m.emissive&&m.emissive.getHex()!==0)||!c.geometry.attributes.normal) continue; (B[c.castShadow?'s':'n']=B[c.castShadow?'s':'n']||[]).push(c); }
  for(const k in B){ const l=B[k]; if(l.length<2) continue; const mats=l.map(c=>new THREE.Matrix4().multiplyMatrices(inv,c.matrixWorld)); const key=k+l.map((c,i)=>c.geometry.uuid+c.material.color.getHexString()+mats[i].elements.map(v=>Math.round(v*1000)).join(',')).join('|'); let geo=VC_CACHE.get(key);
    if(!geo){ const pos=[],nor=[],col=[]; l.forEach((c,j)=>{ const g=c.geometry.index?c.geometry.toNonIndexed():c.geometry.clone(); g.applyMatrix4(mats[j]); const P=g.attributes.position.array, N=g.attributes.normal.array, C=c.material.color; for(let i=0;i<P.length;i+=3){ pos.push(P[i],P[i+1],P[i+2]); nor.push(N[i],N[i+1],N[i+2]); col.push(C.r,C.g,C.b); } g.dispose(); });
      geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); if(VC_CACHE.size<400) VC_CACHE.set(key,geo); else geo.userData.own=true; }
    for(const c of l) root.remove(c); const m=new THREE.Mesh(geo,M_VC); m.castShadow=k==='s'; m.receiveShadow=true; if(geo.userData.own) m.userData.baked=true; root.add(m); } return root; } /* aynı görünüşlü karakterler (düşman türleri, işçiler) aynı birleşik geometriyi paylaşır: her gece yeni düşman bellek sızdırmaz */
function bakeGuy(g){ for(const r of [g.root,g.legL,g.legR,g.armL,g.armR]) if(r) bakeVC(r); return g; }
function disposeBaked(root){ root.traverse(o=>{ if(o.userData&&o.userData.baked&&o.geometry) o.geometry.dispose(); }); }
const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e3=new THREE.Euler(), vs=new THREE.Vector3(), vp=new THREE.Vector3(), v3=new THREE.Vector3();
// F9b: haritaya yayılmış süs katmanları (çalı, kaya, çimen, tepeler) 50×50 parçalara bölünür: her parça kendi sınır küresiyle ekran/gölge dışındaysa çizilmez.
// Ana InstancedMesh veri tutar (sahnede değil); parçalar onun dizisinin dilimlerini paylaşır, needsUpdate parçalara iletilir (setMatrixAt/needsUpdate kullanan eski kod değişmez)
function chunkIM(im,items,geo,cast){ if(!geo.boundingSphere) geo.computeBoundingSphere(); const gr=geo.boundingSphere.radius+geo.boundingSphere.center.length(); const chOf=it=>Math.floor((it.x+160)/64)*16+Math.floor((it.z+160)/64); const parts=[];
  for(let s=0;s<items.length;){ let e=s; const c=chOf(items[s]); while(e<items.length&&chOf(items[e])===c) e++; let cx=0,cz=0; for(let i=s;i<e;i++){ cx+=items[i].x; cz+=items[i].z; } cx/=e-s; cz/=e-s; let r=0; for(let i=s;i<e;i++){ const it=items[i], k=Math.max(it.sx||it.s||1,it.sy||it.s||1,it.sz||it.s||1); r=Math.max(r,Math.hypot(it.x-cx,it.z-cz,(it.y||0))+k*gr); }
    const g=new THREE.BufferGeometry(); g.setIndex(geo.index); for(const k in geo.attributes) g.setAttribute(k,geo.attributes[k]); g.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,0,cz),r+1);
    const p=new THREE.InstancedMesh(g,im.material,e-s); p.instanceMatrix=new THREE.InstancedBufferAttribute(im.instanceMatrix.array.subarray(s*16,e*16),16); if(im.instanceColor) p.instanceColor=new THREE.InstancedBufferAttribute(im.instanceColor.array.subarray(s*3,e*3),3); p.castShadow=cast; p.receiveShadow=true; p.frustumCulled=true; scene.add(p); parts.push(p); s=e; }
  const relay=(a,get)=>{ if(a) Object.defineProperty(a,'needsUpdate',{configurable:true,set(v){ if(v){ this.version++; for(const p of parts){ const b=get(p); if(b) b.needsUpdate=true; } } }}); }; relay(im.instanceMatrix,p=>p.instanceMatrix); relay(im.instanceColor,p=>p.instanceColor); im.parts=parts; return im; }
function instanced(geo,material,items,shadow){ const wide=items.length>=40&&items.some(it=>Math.hypot(it.x,it.z)>60); if(wide) items.sort((a,b)=>(Math.floor((a.x+160)/64)*16+Math.floor((a.z+160)/64))-(Math.floor((b.x+160)/64)*16+Math.floor((b.z+160)/64)));
  const im=new THREE.InstancedMesh(geo,material,Math.max(1,items.length)); items.forEach((it,i)=>{ e3.set(it.rx||0,it.ry||0,it.rz||0); q.setFromEuler(e3); vp.set(it.x,it.y||0,it.z); vs.set(it.sx||it.s||1,it.sy||it.s||1,it.sz||it.s||1); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); if(it.c!==undefined) im.setColorAt(i,new THREE.Color(it.c)); }); im.count=items.length; im.castShadow=shadow!==false; im.receiveShadow=true; if(wide) return chunkIM(im,items,geo,shadow!==false); scene.add(im); return im; }

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
/* FX4: yol parçaları düz dizide önbellekte (H değişince yenilenir): ağaç yerleştirme yüz binlerce kez çağırır, her çağrıda dizi kurmaz */
let RSEG=null, RSEG_H=null;
function roadSegs(){ if(RSEG_H!==H){ RSEG_H=H; RSEG=[]; for(const s of SIDES){ const P=roadPath(s); for(let i=0;i<P.length-1;i++){ const ax=P[i][0],az=P[i][1],dx=P[i+1][0]-ax,dz=P[i+1][1]-az; RSEG.push(ax,az,dx,dz,1/(dx*dx+dz*dz)); } } } return RSEG; }
function roadDist(x,z){ const R=roadSegs(); let best=1e18; for(let i=0;i<R.length;i+=5){ let t=((x-R[i])*R[i+2]+(z-R[i+1])*R[i+3])*R[i+4]; t=t<0?0:t>1?1:t; const ex=R[i]+R[i+2]*t-x, ez=R[i+1]+R[i+3]*t-z, d=ex*ex+ez*ez; if(d<best) best=d; } return Math.sqrt(best); }
function nearBase(x,z,m){ return Math.abs(x)<H+m&&Math.abs(z)<H+m; }
// Bölgeler: her sefer kalenin çevresinde yeni bir bölge açar (merkez, yarıçap, ağaçsız alan)
const REG={
  lake:{sefer:2,name:T('Gümüş Göl','Silver Lake'),job:T('Balık tutma','Fishing'),c:[40,-40],r:11,clear:23},
  meadow:{sefer:3,name:T('Geyik Çayırı','Deer Meadow'),job:T('Av ve tütsühane','Hunting and smokehouse'),c:[-42,42],r:14,clear:25},
  quarry:{sefer:4,name:T('Taş Ocağı','Stone Quarry'),job:T('Taş kesme tezgâhı','Stone cutter'),c:[40,40],r:12,clear:22},
  river:{sefer:5,name:T('Nehir','River'),job:T('Su değirmeni ve kereste','Water mill and planks'),c:[-42,-42],r:12,clear:22},
  swamp:{sefer:6,name:T('Sisli Bataklık','Misty Swamp'),job:T('Fener, mantar ve iksir kazanı','Lantern, mushrooms and potions'),c:[-70,-22],r:12,clear:22},
  iron:{sefer:7,name:T('Demir Dağı','Iron Mountain'),job:T('Maden, demirci ocağı ve delici ok','Mine, forge and piercing arrows'),c:[24,-70],r:12,clear:22},
  coast:{sefer:8,name:T('Kıyı','Coast'),job:T('Sandıklar, deniz feneri ve ticaret teknesi','Chests, lighthouse and trade boat'),c:[72,70],r:14,clear:26},
  snow:{sefer:9,name:T('Karlı Geçit','Snowy Pass'),job:T('Kristal madeni ve kuyumcu','Crystal mine and jeweler'),c:[-72,72],r:12,clear:22},
  dark:{sefer:10,name:T('Kara Kale','Black Castle'),job:T('Son kuşatma','Final siege'),c:[0,-86],r:9,clear:20},
};
const QUARRIES=[[41,39],[49,47]];
/* F6: Demir Dağı zirveleri [x,z,yarıçap,yükseklik]: içlerinde ağaç çıkmaz, oyuncu içine giremez (p6 aynı listeyle çizer) */
const IRON_PEAKS=(()=>{ const c=REG.iron.c, L=Math.hypot(c[0],c[1]), dx=-c[0]/L, dz=-c[1]/L; return [[-15,-14,9,13],[-19,-4,11,16],[-17,8,9,12],[-24,-12,12,18],[-25,5,13,20],[-22,17,10,14],[-13,19,7,9],[-12,-22,7,10]].map(([d,s,r,h])=>[c[0]+dx*d-dz*s,c[1]+dz*d+dx*s,r,h]); })();
// Yük arabası yolları (ağaçsız, toprak) ve nehir
const CART_PATHS=[[[34,29],[32,14],[31,4]],[[-37,-35],[-33,-18],[-31,-4]],[[13.8,-57.6],[11.3,-54],[9,-38],[4,-28]]]; /* F6: demir arabası ped sırasının yanından geçer, üstünden değil */
const SEA={x:100,z:100,r:30};
const RIVER=[[-100,-30],[-70,-36],[-52,-40],[-42,-42],[-38,-52],[-34,-70],[-30,-100]];
function polyDist(P,x,z){ let best=1e9; for(let i=0;i<P.length-1;i++){ const [ax,az]=P[i],[bx,bz]=P[i+1]; const dx=bx-ax,dz=bz-az; const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1); const d=Math.hypot(ax+dx*t-x,az+dz*t-z); if(d<best) best=d; } return best; }
function nearQuarry(x,z,m){ return QUARRIES.some(qq=>Math.hypot(x-qq[0],z-qq[1])<m); }
function inRegClear(x,z){ for(const k in REG){ const R=REG[k]; if(Math.hypot(x-R.c[0],z-R.c[1])<R.clear) return true; } return false; }
function freeSpot(x,z,pad){ return !nearBase(x,z,5.5) && !IRON_PEAKS.some(k=>Math.hypot(x-k[0],z-k[1])<k[2]*0.92+pad) && roadDist(x,z)>4.2+pad && !nearQuarry(x,z,7.5) && !inRegClear(x,z) && polyDist(RIVER,x,z)>4.5+pad && Math.hypot(x-SEA.x,z-SEA.z)>SEA.r+3+pad && !CART_PATHS.some(P=>polyDist(P,x,z)<3+pad); }

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
  decor.push({im:instanced(G.dod,mat(0xffffff),rocks,false),items:rocks}); /* F9b: yere yassı taşlar gölge geçişinde çizilmez */
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
  if(wallGroup){ scene.remove(wallGroup); disposeBaked(wallGroup); } wallGroup=new THREE.Group(); scene.add(wallGroup); wallPop=0;
  const add=(im)=>{ scene.remove(im); wallGroup.add(im); return im; };
  const segs=wallSegs();
  if(level<=3){
    const h0=[1.6,2.2,2.6,3.0][level]; const logs=[]; for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),n=Math.round(len/0.5); for(let i=0;i<=n;i++){ const h=h0+rand(-0.15,0.2); logs.push({x:x0+dx*i/n,y:h/2,z:z0+dz*i/n,sx:.27,sy:h,sz:.27,c:level>=2?(Math.random()<.5?0x8a5a2c:0x76481f):(Math.random()<.5?0x9a6a3a:0x86582c)}); } }
    const tips=logs.map(l=>({x:l.x,y:l.sy+0.18,z:l.z,sx:.27,sy:.36,sz:.27,c:l.c}));
    add(instanced(G.cyl,mat(0xffffff),logs)); add(instanced(G.cone,mat(0xffffff),tips));
    if(level>=1){ const rails=[]; for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz); const ry=-Math.atan2(dz,dx); rails.push({x:(x0+x1)/2,y:h0*0.55,z:(z0+z1)/2,ry,sx:len,sy:.14,sz:.36,c:0x7d5124}); if(level>=3) rails.push({x:(x0+x1)/2,y:h0*0.85,z:(z0+z1)/2,ry,sx:len,sy:.14,sz:.36,c:0x5a3a1e}); } add(instanced(G.box,mat(0xffffff),rails)); }
  } else {
    const tier=level<=6?0:level<=10?1:2; /* F9a: her seviye (11+ sonsuz kuşatmada): boy 10'dan sonra yavaş artar, 11+ koyu taş + çift altın bant */ const Hh=level<=10?[2.6,3.0,3.4,3.6,3.9,4.2,4.6][level-4]:Math.min(5.6,4.6+0.2*(level-10)); const col=tier===2?0x6c7386:tier?0x8d94a4:0xa8a49c, col2=tier===2?0x545a6b:tier?0x6f7686:0x9c9890;
    const blocks=[], crens=[];
    for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz); const ry=-Math.atan2(dz,dx); blocks.push({x:(x0+x1)/2,y:Hh/2,z:(z0+z1)/2,ry,sx:len+0.6,sy:Hh,sz:0.9+0.15*tier,c:col}); const n=Math.round(len/1.2); if(level>=5) for(let i=0;i<=n;i++){ crens.push({x:x0+dx*i/n,y:Hh+0.3,z:z0+dz*i/n,ry,sx:.6,sy:.6,sz:1.0+0.15*tier,c:col2}); }
      const m=Math.max(1,Math.round(len)); for(let i=0;i<m;i++){ blocks.push({x:x0+dx*(i+0.5)/m,y:rand(0.4,Hh-0.4),z:z0+dz*(i+0.5)/m,ry,sx:rand(.5,1.1),sy:.35,sz:0.94+0.15*tier,c:Math.random()<.5?col2:col}); }
      if(level>=9){ blocks.push({x:(x0+x1)/2,y:Hh-0.15,z:(z0+z1)/2,ry,sx:len+0.6,sy:0.14,sz:1.0+0.15*tier,c:0xf2b43c}); } if(level>=11){ blocks.push({x:(x0+x1)/2,y:Hh*0.45,z:(z0+z1)/2,ry,sx:len+0.6,sy:0.12,sz:1.0+0.15*tier,c:0xf2b43c}); } }
    add(instanced(G.box,mat(0xffffff),blocks)); if(crens.length) add(instanced(G.box,mat(0xffffff),crens));
    if(level>=7){ for(const [x,z] of [[-H,-H],[H,-H],[-H,H],[H,H]]){ const t=mesh(G.cyl,tier?M.stoneBlue:M.stone,1.1+0.1*(tier===2),Hh+2,1.1+0.1*(tier===2)); t.position.set(x,(Hh+2)/2,z); const cap=mesh(G.cone,level>=10?M.flag:M.banner,1.5,1.5,1.5); cap.position.set(x,Hh+2.7,z); const fl=mesh(G.box,M.flag,0.7,0.5,0.05); fl.position.set(x+0.35,Hh+3.6,z); const pole=mesh(G.cyl,M.handle,0.05,1.6,0.05); pole.position.set(x,Hh+3.7,z); wallGroup.add(t,cap,fl,pole); } }
  }
  for(const s of SIDES){ for(const a of [-3.6,3.6]){ const [x,z]=sidePos(s,a,0.4); const p=mesh(G.cyl,M.woodDark,0.08,1.6,0.08); p.position.set(x,0.8,z); const f=mesh(G.sph,M.gold,0.18,0.26,0.18,false); f.position.set(x,1.75,z); wallGroup.add(p,f); } }
  bakeStatic(wallGroup); /* F6 */
}
buildWalls(S.lv.wall);
/* FX4: kapı meşaleleri gerçek ışık (PointLight) değil: alev parıltısı (tüm meşaleler tek Points çizimi) + yerde sıcak ışık halkası (tek InstancedMesh).
   8 nokta ışığı her pikselde hesaplanıyordu (GPU işinin ~%35'i, gündüz de) */
const torchTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.22,'rgba(255,255,255,0.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
const torches=[]; for(const s of SIDES){ for(const a of [-3.6,3.6]) torches.push({s,a}); }
const torchFx=(()=>{ const n=torches.length; const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(n*3),3)); const pm=new THREE.PointsMaterial({map:torchTex,color:0xffb15a,size:1.8,sizeAttenuation:true,transparent:true,opacity:0.4,depthWrite:false,blending:THREE.AdditiveBlending}); const pts=new THREE.Points(pg,pm); pts.frustumCulled=false; pts.renderOrder=3; scene.add(pts);
  const gm=new THREE.MeshBasicMaterial({map:torchTex,color:0xffa04a,transparent:true,opacity:0.08,depthWrite:false,blending:THREE.AdditiveBlending}); const gl=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),gm,n); gl.frustumCulled=false; gl.renderOrder=1; scene.add(gl); return {pts,pm,gl,gm}; })();
function placeTorches(){ const P=torchFx.pts.geometry.attributes.position; torches.forEach((t,i)=>{ const [x,z]=sidePos(t.s,t.a,0.4); P.setXYZ(i,x,1.8,z); vp.set(x,0.07,z); q.identity(); vs.set(15,1,15); m4.compose(vp,q,vs); torchFx.gl.setMatrixAt(i,m4); }); P.needsUpdate=true; torchFx.gl.instanceMatrix.needsUpdate=true; } placeTorches();
function torchNight(k){ torchFx.pm.opacity=0.35+0.65*k; torchFx.pm.size=1.6+1.8*k; torchFx.gm.opacity=0.04+0.6*k; }
// ---------- Dört kapı ----------
const gates={}; // side -> {g,L,R,open}
function buildGates(level){
  const tier=level<4?0:level<7?1:2; const postM=tier===0?M.woodDark:tier===1?M.stone:M.stoneBlue; const leafM=tier===2?M.iron:M.gate; const bandM=tier===0?M.woodDark:M.metal;
  for(const s of SIDES){ if(gates[s]){ scene.remove(gates[s].g); disposeBaked(gates[s].g); } const g=new THREE.Group();
    function post(x){ const t=new THREE.Group(); const b=mesh(tier?G.box:G.cyl,postM,tier?0.8:0.42,3.4+0.4*tier,tier?0.8:0.42); b.position.y=(3.4+0.4*tier)/2; const cap=mesh(tier?G.box:G.cone,tier===2?M.gold:postM,tier?0.95:0.42,0.5,tier?0.95:0.42); cap.position.y=3.6+0.4*tier; t.add(b,cap); t.position.x=x; return t; }
    const top=mesh(G.box,postM,5.4,0.35+0.2*tier,0.5+0.3*tier); top.position.y=3.2+0.3*tier;
    function leaf(sign){ const h=new THREE.Group(); h.position.set(sign*-2.3,0,0); for(let i=0;i<5;i++){ const d=mesh(G.cyl,leafM,0.2,2.4,0.2); d.position.set(sign*(0.25+i*0.45),1.2,0); const c=mesh(G.cone,leafM,0.2,0.3,0.2); c.position.set(sign*(0.25+i*0.45),2.55,0); h.add(d,c);} const b1=mesh(G.box,bandM,2.2,0.16,0.28); b1.position.set(sign*1.15,0.8,0.1); const b2=b1.clone(); b2.position.y=1.9; h.add(b1,b2); if(tier>=1){ for(let i=0;i<4;i++){ const r=mesh(G.sph,M.metal,0.07,0.07,0.07,false); r.position.set(sign*(0.4+i*0.5),0.8,0.26); h.add(r); const r2=r.clone(); r2.position.y=1.9; h.add(r2);} } return h; }
    const L=leaf(1), R=leaf(-1); g.add(post(-2.6),post(2.6),top,L,R);
    if(tier>=1){ const arch=mesh(G.box,postM,6.2,0.6,0.9+0.3*tier); arch.position.y=3.9+0.3*tier; g.add(arch); }
    if(tier===2){ for(const x of [-2.6,2.6]){ const fl=mesh(G.box,M.banner,0.06,1.2,0.7); fl.position.set(x,4.6,0.5); g.add(fl);} }
    const [x,z]=sidePos(s,0,0); g.position.set(x,0,z); g.rotation.y=(s==='E'||s==='W')?Math.PI/2:0; scene.add(g); for(const o of [g,L,R,...g.children.filter(c=>c.isGroup&&c!==L&&c!==R)]) bakeStatic(o); /* F6: kapı parçaları birleşir (kanatlar ayrı döner) */ gates[s]={g,L,R,open:gates[s]?gates[s].open:0,x,z}; }
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
  depot.rotation.y=ROT45; depot.position.copy(DEPOT); scene.add(depot); bakeStatic(depot); /* F6: sonradan eklenen yığın tomrukları ayrı kalır */
})();
/* F6: depo yığınları tek InstancedMesh (eskiden her tomruk/taş ayrı çizim) */
const pileStoneIM=new THREE.InstancedMesh(G.box,M.rock,18); pileStoneIM.castShadow=true; pileStoneIM.receiveShadow=true; for(let i=0;i<18;i++){ const row=Math.floor(i/6), col=i%6; vp.set(0.45+col*0.26+(row%2)*0.1,0.5+row*0.24,0.9+(col%2)*0.32); e3.set(0,rand(-.4,.4),0); q.setFromEuler(e3); vs.set(0.34,0.26,0.34); m4.compose(vp,q,vs); pileStoneIM.setMatrixAt(i,m4); } pileStoneIM.count=0; depot.add(pileStoneIM);
function setStonePile(n){ pileStoneIM.count=Math.max(0,Math.min(n,18)); }
const pileLogIM=new THREE.InstancedMesh(G.log,M.log,24); pileLogIM.castShadow=true; pileLogIM.receiveShadow=true; for(let i=0;i<24;i++){ const row=Math.floor(i/6), col=i%6; vp.set(-1.3+col*0.52+(row%2)*0.26,0.62+row*0.4,-0.6); e3.set(0,0,Math.PI/2); q.setFromEuler(e3); vs.set(1.2,1.2,1.2); m4.compose(vp,q,vs); pileLogIM.setMatrixAt(i,m4); } pileLogIM.count=0; depot.add(pileLogIM);
function setPile(n){ pileLogIM.count=Math.max(0,Math.min(n,24)); }

// ---------- Ağaçlar (geniş orman) ----------
const trees=[]; let treeTrunk, treeCrown; const TRUNK_H=1.7;
(function(){
  const cell=new Map(); const ck=(x,z)=>Math.floor(x/3)+','+Math.floor(z/3);
  const near=(x,z,r)=>{ const cx=Math.floor(x/3), cz=Math.floor(z/3); for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const arr=cell.get((cx+i)+','+(cz+j)); if(!arr) continue; const r2=r*r; for(const t of arr){ const dx=t.x-x, dz=t.z-z; if(dx*dx+dz*dz<r2) return true; } } return false; }; /* FX4: karekök yok */
  const groves=[]; for(let i=0;i<12;i++){ const a=i/12*6.283+rand(-.2,.2); const r=rand(34,78); groves.push([Math.cos(a)*r,Math.sin(a)*r,rand(13,20)]); }
  let tries=0;
  while(trees.length<2600&&tries<260000){ tries++;
    const x=rand(-WORLD+2,WORLD-2), z=rand(-WORLD+2,WORLD-2);
    const grove=groves.some(g=>{ const dx=x-g[0], dz=z-g[1]; return dx*dx+dz*dz<g[2]*g[2]; });
    if(!grove&&Math.random()<0.72) continue; /* FX4: ucuz elemeler önce, pahalı freeSpot en sonda (açılış ~%60 daha kısa) */
    if(near(x,z,grove?1.8:3.2)) continue;
    if(!freeSpot(x,z,1.5)) continue;
    const t={x,z,s:rand(0.85,1.3),ry:rand(0,6.28),ci:Math.floor(Math.random()*3),hp:D.treeHits(),alive:true,gone:false,shake:0,falling:0,regrow:0,claimed:null,dirty:true};
    trees.push(t); const k=ck(x,z); if(!cell.has(k)) cell.set(k,[]); cell.get(k).push(t);
  }
  const CH=50, chOf=t=>Math.floor((t.x+WORLD)/CH)*16+Math.floor((t.z+WORLD)/CH); trees.sort((a,b)=>chOf(a)-chOf(b)); /* F9b: ağaçlar parça parça (40×40) sıralı: her parça ayrı çizilir, ekran/gölge dışındaysa atlanır */
  const trunkGeo=new THREE.CylinderGeometry(0.24,0.34,TRUNK_H,9).translate(0,TRUNK_H/2,0);
  const crownGeo=mergeGeos([new THREE.ConeGeometry(1.35,2.4,8).translate(0,2.3,0),new THREE.ConeGeometry(1.05,2.1,8).translate(0,3.5,0),new THREE.ConeGeometry(0.7,1.8,8).translate(0,4.6,0)]);
  treeTrunk=new THREE.InstancedMesh(trunkGeo,M.trunk,trees.length); treeCrown=new THREE.InstancedMesh(crownGeo,M.leaf,trees.length);
  treeTrunk.castShadow=treeCrown.castShadow=true; treeTrunk.receiveShadow=treeCrown.receiveShadow=true;
  const leafCols=[new THREE.Color(0x2f7d47),new THREE.Color(0x3a8c4e),new THREE.Color(0x256b3c)];
  trees.forEach((t,i)=>{ treeCrown.setColorAt(i,leafCols[t.ci]); });
  treeTrunk.instanceMatrix.setUsage(THREE.DynamicDrawUsage); treeCrown.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  /* F9b: ana InstancedMesh'ler yalnız veri tutar (sahnede değil). Her 40×40 parça aynı dizinin bir dilimini (subarray) paylaşan kendi InstancedMesh'iyle çizilir;
     kendi sınır küresi olduğu için kamera ve gölge kamerası dışındaki parçalar iki geçişte de çizilmez. Ana dizideki needsUpdate tüm parçalara iletilir (eski kodlar değişmeden çalışır) */
  const chunks=[]; const shareGeo=g0=>{ const g=new THREE.BufferGeometry(); g.setIndex(g0.index); for(const k in g0.attributes) g.setAttribute(k,g0.attributes[k]); return g; };
  for(let s=0;s<trees.length;){ let e=s; const c=chOf(trees[s]); while(e<trees.length&&chOf(trees[e])===c) e++; const n=e-s; let cx=0,cz=0; for(let i=s;i<e;i++){ cx+=trees[i].x; cz+=trees[i].z; } cx/=n; cz/=n; let r=0; for(let i=s;i<e;i++) r=Math.max(r,Math.hypot(trees[i].x-cx,trees[i].z-cz)); const bs=new THREE.Sphere(new THREE.Vector3(cx,3,cz),r+5);
    const mk=(g0,M0,src,col)=>{ const g=shareGeo(g0); g.boundingSphere=bs; const im=new THREE.InstancedMesh(g,M0,n); im.instanceMatrix=new THREE.InstancedBufferAttribute(src.instanceMatrix.array.subarray(s*16,e*16),16); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); if(col) im.instanceColor=new THREE.InstancedBufferAttribute(src.instanceColor.array.subarray(s*3,e*3),3); im.castShadow=im.receiveShadow=true; im.frustumCulled=true; scene.add(im); return im; };
    const tk=mk(trunkGeo,M.trunk,treeTrunk,false); tk.castShadow=false; /* gövdenin gölgesi tacın gölgesinin altında kalır: gölge geçişinde çizilmez */ chunks.push({t:tk,c:mk(crownGeo,M.leaf,treeCrown,true)}); s=e; }
  const relay=(a,get)=>Object.defineProperty(a,'needsUpdate',{configurable:true,set(v){ if(v){ this.version++; for(const c of chunks) get(c).needsUpdate=true; } }});
  relay(treeTrunk.instanceMatrix,c=>c.t.instanceMatrix); relay(treeCrown.instanceMatrix,c=>c.c.instanceMatrix); relay(treeCrown.instanceColor,c=>c.c.instanceColor); treeTrunk.chunks=chunks;
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
function hitTree(t,byGuy,onLog){ t.hp-=1; t.shake=0.3; t.dirty=true; const tfell=t.hp<=0; if(!tfell) sfxAt(t).chop(); /* FX4: devrilen ağaçta yalnız devrilme sesi; uzaktaki işçi kısık */ burst(new THREE.Vector3(t.x,1.2*t.s,t.z),6,M.logEnd,1); burst(new THREE.Vector3(t.x,2.4*t.s,t.z),5,M.bush,0.5);
  if(t.hp<=0){ t.alive=false; t.falling=0.001; S.treesCut=(S.treesCut||0)+1; questEvent('chop'); sfxAt(t).fall(); const n=D.logsPerTree(); for(let i=0;i<n;i++){ setTimeout(()=>{ fly(new THREE.Vector3(t.x+rand(-.6,.6),1.0,t.z+rand(-.6,.6)),byGuy.g,onLog,true,4); }, 300+i*70); } } }
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
function hitRock(r,byGuy,onStone){ r.hp-=1; r.shake=0.3; r.dirty=true; sfxAt(r).hit(); burst(new THREE.Vector3(r.x,r.s*0.8,r.z),7,M.rockLight,0.9);
  if(r.hp<=0){ r.alive=false; r.regrow=0.001; r.claimed=null; r.dirty=true; sfxAt(r).boom(); burst(new THREE.Vector3(r.x,0.8,r.z),14,M.rock,1.1); questEvent('stone',3); for(let i=0;i<3;i++){ setTimeout(()=>{ fly(new THREE.Vector3(r.x+rand(-.6,.6),0.8,r.z+rand(-.6,.6)),byGuy.g,onStone,'stone',4); },200+i*80); } } }
// ---------- Karakterler (chibi) ----------
const helmGeo=mergeGeos([new THREE.SphereGeometry(0.45,10,8).scale(1,0.55,1).translate(0,0.2,0),new THREE.BoxGeometry(0.7,0.12,0.24).translate(0,0.12,0.35)]);
const LOG_MAX=160; const logSlots=[]; for(let i=0;i<LOG_MAX;i++){ const row=Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.1+row*0.3,-0.05-(row%2)*0.06); e3.set(0,rand(-.08,.08),Math.PI/2); q.setFromEuler(e3); vs.set(1,1,1); logSlots.push(new THREE.Matrix4().compose(vp,q,vs)); }
const COIN_STACK=40; const coinSlots=[]; for(let i=0;i<COIN_STACK;i++){ vp.set(rand(-.03,.03),0.08+i*0.15,rand(-.03,.03)); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.75,0.75,0.75); coinSlots.push(new THREE.Matrix4().compose(vp,q,vs)); }
function makePony(){ const g=new THREE.Group(); const body=mesh(G.box,M.pony,0.7,0.62,1.35); body.position.set(0,0.78,-0.05); const neck=mesh(G.box,M.pony,0.4,0.5,0.4); neck.position.set(0,1.1,0.6); neck.rotation.x=-0.5; const head=mesh(G.box,M.pony,0.42,0.42,0.62); head.position.set(0,1.32,0.95); const snout=mesh(G.box,M.ponyLight,0.3,0.24,0.24); snout.position.set(0,1.22,1.3); const e1=mesh(G.sph,M.pupil,0.05,0.06,0.04,false); e1.position.set(-0.19,1.4,1.1); const e2=e1.clone(); e2.position.x=0.19; const earL=mesh(G.cone,M.pony,0.09,0.25,0.09); earL.position.set(-0.15,1.62,0.85); const earR=earL.clone(); earR.position.x=0.15; const mane=mesh(G.box,M.mane,0.14,0.5,0.7); mane.position.set(0,1.28,0.5); mane.rotation.x=-0.5; const tail=mesh(G.box,M.mane,0.14,0.6,0.16); tail.position.set(0,0.85,-0.78); tail.rotation.x=0.4; const saddle=mesh(G.box,M.banner,0.76,0.12,0.6); saddle.position.set(0,1.12,-0.05); g.add(body,neck,head,snout,e1,e2,earL,earR,mane,tail,saddle); const legs=[]; for(const [x,z] of [[-0.24,0.42],[0.24,0.42],[-0.24,-0.5],[0.24,-0.5]]){ const l=new THREE.Group(); l.position.set(x,0.55,z); const lm=mesh(G.box,M.ponyDark,0.18,0.55,0.2); lm.position.y=-0.28; const hoof=mesh(G.box,M.mane,0.2,0.1,0.22); hoof.position.y=-0.56; l.add(lm,hoof); g.add(l); legs.push(l);} bakeVC(g); /* F6 */ return {g,legs,tail,t:rand(0,6)}; }
// müşteriler sivil: miğfer yok, düşman kırmızısı yok; yeşil/sarı/mavi/mor gömlek, bazısında hasır şapka
const CIV_SHIRT=[mat(0x6cbf5f),mat(0xf2c14e),mat(0x4fb3c8),mat(0xa98bdc),mat(0xf3a6c8)], CIV_STRAW=mat(0xe8cf8a);
/* FX4: karakterler (oyuncu, işçi, asker, müşteri, düşman, kurt, av hayvanı) gerçek gölge çizmez: gölge geçişinde karakter başına ~11 çizimdi (L10 gecesi ~260).
   Hepsinin altına tek InstancedMesh ile yumuşak yuvarlak gölge (1 çizim). Kuleler, yapılar, ağaçlar gerçek gölgede kalır. Sahneye doğrudan bağlı olmayanlar (kule okçusu) dokunulmaz */
const BLOBS=new Set(), BLOB_MAX=360; let blobTick=0;
const blobIM=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(0.5,'rgba(0,0,0,0.75)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,64,64);
  const m=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0.34,depthWrite:false}); const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2),m,BLOB_MAX); im.count=0; im.frustumCulled=false; im.castShadow=false; im.receiveShadow=false; im.renderOrder=1; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(im); return im; })();
function blobAdd(g,r){ g.userData.blobR=r; BLOBS.add(g); return g; }
function updateBlobs(){ let n=0; const re=(++blobTick%90)===0; for(const g of BLOBS){ const u=g.userData; if(g.parent!==scene){ if((u.bMiss=(u.bMiss||0)+1)>600) BLOBS.delete(g); continue; } u.bMiss=0;
    if(!u.noSh||re){ u.noSh=true; g.traverse(o=>{ if(o.castShadow&&(o.isMesh||o.isInstancedMesh)) o.castShadow=false; }); } /* sonradan eklenen parçalar da (miğfer, yük) arada bir yakalanır */
    if(!g.visible||n>=BLOB_MAX) continue; const r=u.blobR*g.scale.x; if(r<0.05) continue; vp.set(g.position.x,g.position.y+0.045,g.position.z); q.identity(); vs.set(r,1,r); m4.compose(vp,q,vs); blobIM.setMatrixAt(n++,m4); }
  blobIM.count=n; if(n) blobIM.instanceMatrix.needsUpdate=true; }
function makeGuy(kind){
  const g=new THREE.Group(); const root=new THREE.Group(); g.add(root);
  const shirt= kind==='player'?M.shirt: kind==='worker'?M.workerShirt: kind==='soldier'?M.soldierShirt: kind==='civ'?CIV_SHIRT[Math.floor(Math.random()*CIV_SHIRT.length)]: M.enemy;
  const torso=mesh(G.box,shirt,0.62,0.6,0.42); torso.position.y=0.72;
  const belt=mesh(G.box,M.belt,0.64,0.1,0.44); belt.position.y=0.44;
  const head=mesh(G.sph,M.skin,0.55,0.52,0.55); head.position.y=1.5;
  const e1=mesh(G.sph,M.pupil,0.07,0.1,0.05,false); e1.position.set(-0.18,1.52,0.5); const e2=e1.clone(); e2.position.x=0.18;
  const hair=mesh(G.sph,M.hair,0.57,0.36,0.57); hair.position.set(0,1.62,-0.06);
  root.add(torso,belt,head,e1,e2,hair);
  if(kind==='player'){ const c=mesh(G.cyl,M.crown,0.36,0.22,0.36); c.position.y=2.05; root.add(c); for(let i=0;i<5;i++){ const a=i/5*6.283; const sp=mesh(G.cone,M.crown,0.09,0.2,0.09); sp.position.set(Math.cos(a)*0.32,2.24,Math.sin(a)*0.32); root.add(sp);} const cape=mesh(G.box,M.banner,0.6,0.9,0.06); cape.position.set(0,0.75,-0.26); root.add(cape); }
  if(kind==='worker'){ const cap=mesh(G.sph,M.workerHat,0.5,0.32,0.5); cap.position.set(0,1.78,0); root.add(cap); }
  if(kind==='civ'&&Math.random()<0.6){ const brim=mesh(G.cyl,CIV_STRAW,0.95,0.05,0.95); brim.position.y=1.74; const top=mesh(G.cyl,CIV_STRAW,0.5,0.24,0.5); top.position.y=1.86; const band=mesh(G.cyl,CIV_SHIRT[Math.floor(Math.random()*CIV_SHIRT.length)],0.52,0.07,0.52,false); band.position.y=1.8; root.add(brim,top,band); }
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
  const out={g,root,head,legL,legR,armL,armR,tool,back,logMesh,lootMesh,stoneMesh,coinMesh,pony,walkT:rand(0,6),swing:0,moving:false,aim:false}; blobAdd(g,kind==='player'?0.95:0.6); /* FX4 */ if(kind!=='enemy') bakeGuy(out); /* F6: düşman makeEnemy sonunda (boyandıktan sonra) */ return out;
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
// sırt yığını en çok BACK_ROWS sıra yükselir: fazlası her türden orantılı azaltılarak gösterilir, gerçek sayılar üstteki rozette (p4)
const BACK_ROWS=14;
function backVis(){ let tot=S.logs+(S.stones||0)+(S.loot||0)+(S.fish||0)+(S.meat||0); if(player&&player.fishMesh) tot+=backExtraTotal(); const k=tot>BACK_ROWS*2?BACK_ROWS*2/tot:1; return {k,tot,v:n=>n>0?Math.max(1,Math.floor(n*k)):0}; }
function setBack(guy){ const bv=backVis(), vL=bv.v(S.logs), vS=bv.v(S.stones||0); if(guy===player) setExtraBack(); guy.logMesh.count=Math.min(LOG_MAX,vL); setStones(guy,vS,Math.ceil(vL/2)); const base=Math.ceil(vL/2)+Math.ceil(vS/2); const n=Math.min(LOG_MAX-base*2,bv.v(S.loot)); for(let i=0;i<n;i++){ const row=base+Math.floor(i/2), side=i%2; vp.set(side?0.24:-0.24,0.12+row*0.3,-0.05); e3.set(0,side?0.3:-0.3,0); q.setFromEuler(e3); vs.set(0.55,0.55,0.55); m4.compose(vp,q,vs); guy.lootMesh.setMatrixAt(i,m4); } guy.lootMesh.count=Math.max(0,n); guy.lootMesh.instanceMatrix.needsUpdate=true; }
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
function updateBubble(){ const pd=bubblePad; if(!pd){ bubbleEl.style.display='none'; bubbleKey=''; return; } if(pd.locked){ const key='L'+pd.def.id; if(key!==bubbleKey){ bubbleKey=key; bubbleEl.innerHTML=`<b>🔒 ${pd.def.name}</b><span>${pd.def.desc}</span><em>${pd.def.lockS||T(pd.def.lock+' ile açılır','Needs: '+pd.def.lock)}</em>`; } bubbleEl.style.display='block'; const p=player.g.position; v3.set(p.x,4.6,p.z).project(camera); bubbleEl.style.left=((v3.x+1)/2*innerWidth)+'px'; bubbleEl.style.top=((1-v3.y)/2*innerHeight)+'px'; return; } if(pd.block){ const key='B'+pd.def.id+pd.block; if(key!==bubbleKey){ bubbleKey=key; bubbleEl.innerHTML=`<b>${pd.def.name} <i>${T('Sv.','Lv')} ${padLevel(pd.def)}/${pd.def.max}</i></b><span>${pd.def.desc}</span><em>${blockHint(pd)}</em>`; } bubbleEl.style.display='block'; const p=player.g.position; v3.set(p.x,4.6,p.z).project(camera); bubbleEl.style.left=((v3.x+1)/2*innerWidth)+'px'; bubbleEl.style.top=((1-v3.y)/2*innerHeight)+'px'; return; } /* F4: darboğaz ipucu */ const lvl=padLevel(pd.def); const cost=padCost(pd); const cur=S.paid[pd.def.id]||0; const need=Math.max(0,Math.ceil(cost-cur)); const pr=padRes(pd); const wood=pr==='wood'; const res=pr==='iron'?T('demir','iron'):pr==='plank'?T('kereste','planks'):pr==='stone'?T('taş','stone'):wood?T('odun','wood'):T('altın','gold'); const have=pr==='iron'?(S.iron||0):pr==='plank'?(S.planks||0):pr==='stone'?S.stones+S.stone:wood?S.logs+S.wood:S.coins; const can=have>=need-0.01;
  const key=pd.def.id+'|'+lvl+'|'+need+'|'+can+'|'+(cur>0.5); if(key!==bubbleKey){ bubbleKey=key; const lv=pd.def.kind==='up'||pd.def.kind==='tower'||pd.def.kind==='wall'||pd.def.kind==='expand'? (pd.def.max>=999?`<i>×${lvl}</i>`:`<i>${T('Sv.','Lv')} ${lvl}/${pd.def.max}</i>`) : `<i>${lvl}/${pd.def.max}</i>`; bubbleEl.innerHTML=`<b>${pd.def.name} ${lv}</b><span>${pd.def.desc}</span><div class="bb"><button data-act="buy" class="${can?'':'off'}">${can?(pd.def.id==='tribute'?T('Hemen öde','Pay now'):((lvl===0||pd.def.kind==='newTower')?((pd.def.kind==='tower'||pd.def.kind==='newTower')?T('Hemen kur','Build now'):T('Hemen al','Get now')):T('Hemen geliştir','Upgrade now'))):T('Yetersiz '+res,'Not enough '+res)}</button>${cur>0.5?'<button data-act="no">'+T('Vazgeç','Cancel')+'</button>':''}</div>`; }
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
addEventListener('keydown',e=>{ const tg=e.target; if((e.key===' '||e.key==='Enter')&&tg&&tg.closest&&tg.closest('button,input,select,textarea')){ kbdLast=true; return; } /* FX3: odaktaki düğmeye Boşluk/Enter basar */ if(kbdUI(e)){ e.preventDefault(); return; } if(document.querySelector('.intro')) return; keys[e.key.toLowerCase()]=true; if(e.code) keys[e.code]=true; moveTarget=null; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); });
addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; if(e.code) keys[e.code]=false; });
function releaseKeys(){ for(const k in keys) keys[k]=false; } addEventListener('blur',releaseKeys); document.addEventListener('visibilitychange',()=>{ if(document.hidden) releaseKeys(); });
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
function inputVec(){ let sx=0,sy=0; if(keys['KeyW']||keys['arrowup']) sy-=1; if(keys['KeyS']||keys['arrowdown']) sy+=1; if(keys['KeyA']||keys['arrowleft']) sx-=1; if(keys['KeyD']||keys['arrowright']) sx+=1; if(joy.active&&joy.moved){ sx+=joy.dx; sy+=joy.dy; } let l=Math.hypot(sx,sy); if(l>1){sx/=l;sy/=l;l=1;} const cy=Math.cos(YAW), sn=Math.sin(YAW); const x=sx*cy+sy*sn, z=-sx*sn+sy*cy; return {x,z,l}; }

// ---------- Yazılar / etiketler ----------
const floats=[];
/* FX4: opt={key,v,fmt,follow}: aynı anahtarlı canlı yazı varsa yenisi açılmaz, değer ona eklenir (+70 +70 → +140 tek sayı, zıplar); follow: yazı bir nesneyi izler (oyuncunun altın sayacı). Yazılar büyüyerek belirir, yumuşak yükselir */
function fpop(el,s){ if(document.body.classList.contains('calm')) return; if(el.animate) try{ el.animate([{transform:`translate(-50%,-50%) scale(${s})`},{transform:'translate(-50%,-50%) scale(1)'}],{duration:s<1?260:180,easing:'cubic-bezier(.2,1.6,.4,1)'}); }catch(e){} }
function floatText(pos,txt,cls,opt){ if(opt&&opt.key){ for(const f of floats){ if(f.key===opt.key&&f.t<(opt.follow?1.0:0.7)&&(opt.follow||f.p.distanceToSquared(pos)<6.25)){ f.v+=opt.v||0; const t2=opt.fmt?opt.fmt(f.v):txt; if(t2!==f.txt){ f.txt=t2; f.el.textContent=t2; f.w=0; } f.t=Math.min(f.t,0.12); if(!opt.follow) f.p.copy(pos); const now=performance.now(); if(now-(f.popT||0)>120){ f.popT=now; fpop(f.el,1.3); } return; } } if(opt.fmt) txt=opt.fmt(opt.v||0); }
  for(const f of floats){ if(f.txt===txt&&f.t<0.6&&f.p.distanceToSquared(pos)<9){ f.t=0; f.p.copy(pos); return; } } /* FX3: aynı yazı üst üste binmez, yenilenir */ let dy=0; for(const f of floats){ if(f.t<0.5&&f.p.distanceToSquared(pos)<4) dy+=0.7; } const el=document.createElement('div'); el.className='float '+(cls||''); el.textContent=txt; document.body.appendChild(el); floats.push({el,p:pos.clone(),t:0,txt,dy:Math.min(2.1,dy),key:opt&&opt.key,v:(opt&&opt.v)||0,follow:opt&&opt.follow}); fpop(el,0.4); }
/* FX4: ekran uzayında çakışma çözümü: oyuncunun sayacı (follow) sabit, diğerleri oluşma sırasıyla, altındakiyle çakışırsa yumuşakça yukarı kayar; kenarlara kırpılır (FX3 sınırları) */
function updateFloats(dt){ for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.t+=dt; if(f.t>1.1){ f.el.remove(); floats.splice(i,1); } }
  const ord=floats.filter(f=>f.follow).concat(floats.filter(f=>!f.follow)), put=[];
  for(const f of ord){ v3.copy(f.follow?f.follow.position:f.p); v3.y+=2.4+(f.dy||0)+1.9*(1-Math.pow(1-f.t/1.1,3)); v3.project(camera); /* yavaşlayarak yükselir */ if(!f.w){ f.w=f.el.offsetWidth||60; f.h=f.el.offsetHeight||22; }
    const x=clamp((v3.x+1)/2*innerWidth,f.w/2+8,innerWidth-f.w/2-8), by=(1-v3.y)/2*innerHeight; let y=by-(f.off||0), need=0;
    for(let it=0;it<4;it++){ let hit=false; for(const o of put){ if(Math.abs(o.x-x)<(o.w+f.w)/2+4&&Math.abs(o.y-(by-need))<(o.h+f.h)/2+2){ need=Math.max(need,by-(o.y-(o.h+f.h)/2-2)); hit=true; } } if(!hit) break; }
    f.off=(f.off||0)+(need-(f.off||0))*(need>(f.off||0)?0.5:0.15); y=clamp(by-f.off,60,innerHeight-70); put.push({x,y:by-need,w:f.w,h:f.h});
    f.el.style.left=x+'px'; f.el.style.top=y+'px'; f.el.style.opacity=String(1-Math.max(0,f.t-0.8)/0.3); } } /* daha geç solar */
const labels=[];
function addLabel(pos,text,h){ const el=document.createElement('div'); el.className='wl'; el.innerHTML=text; document.body.appendChild(el); const L={el,pos:pos.clone(),src:pos,h:h||3.2,hide:false,near:6}; labels.push(L); return L; }
// yapı etiketleri yazı değil simge: depo = odun/taş bırakılır, tezgâh = miğfer altına döner
const quarryLabels=QUARRIES.map(([qx,qz])=>{ const L=addLabel(new THREE.Vector3(qx,0,qz),'<span class="ics">⛏️</span>',4.2); L.near=5; return L; }); const depotLbl=addLabel(DEPOT,'<span class="ics">⬇ <span class="log-dot"></span></span>',3.9); addLabel(STALL,'<span class="ics"><span class="helm"></span>→<span class="coin-dot"></span></span>',3.6);
let lblMeasT=0;
function updateLabels(){ const pp=player.g.position; const fresh=[]; /* yeni görünen etiket hemen ölçülür, diğerleri 20 karede bir */ if(--lblMeasT<=0){ lblMeasT=20; for(const L of labels) if(L.el.style.display==='block'&&L.el.offsetWidth){ L.hw=L.el.offsetWidth/2; L.hh=L.el.offsetHeight; } } for(const L of labels){ v3.set(L.pos.x,L.h,L.pos.z).project(camera); const on=!L.hide&&L.el.firstChild!==null&&L.pos.distanceTo(pp)>L.near&&v3.z<1&&Math.abs(v3.x)<(L.clampIn?1.5:1.2)&&Math.abs(v3.y)<(L.clampIn?1.4:1.2); let sx=(v3.x+1)/2*innerWidth, sy=(1-v3.y)/2*innerHeight; let vis=on; if(on){ const hw=L.hw||48, hh=L.hh||28; if(L.clampIn){ sx=clamp(sx,hw+6,innerWidth-hw-6); sy=clamp(sy,hh+6,innerHeight-6); } /* F8: kenarda kesilmez */ for(const r of hudObstacles()){ if(sx+hw>r.left-4&&sx-hw<r.right+4&&sy>r.top-4&&sy-hh<r.bottom+4){ vis=false; break; } } } L.el.style.display=vis?'block':'none'; if(vis){ L.el.style.left=sx+'px'; L.el.style.top=sy+'px'; if(!L.hw) fresh.push(L); } } for(const L of fresh){ L.hw=L.el.offsetWidth/2||48; L.hh=L.el.offsetHeight||28; } }

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
function updateLoot(dt){ const p=player.g.position; const R=D.magnet(); let got=0; let inAir=0; for(const l of loot) if(l.fly) inAir++;
  for(let i=loot.length-1;i>=0;i--){ const l=loot[i]; l.t+=dt;
    if(l.auto){ const tp=rotPt(STALL,0,1.5,-1.2); const dx=tp.x-l.x, dy=tp.y-l.y, dz=tp.z-l.z, d=Math.hypot(dx,dy,dz); const sp=(9+l.t*30)*dt; if(d<Math.max(0.5,sp)){ loot.splice(i,1); S.stall++; continue; } l.x+=dx/d*sp; l.y+=dy/d*sp+Math.sin(l.t*3)*0.02; l.z+=dz/d*sp; continue; }
    if(!l.fly){ if(l.y>0.02||l.vy>0){ l.vy-=20*dt; l.y=Math.max(0.02,l.y+l.vy*dt); if(l.y<=0.02) l.vy=0; } const d=Math.hypot(l.x-p.x,l.z-p.z); if(l.t>0.4&&d<R&&S.loot+inAir<D.cap()){ l.fly=true; l.t=0; inAir++; } else if(l.t>(l.taken?12:7)){ l.auto=true; l.t=0; } }
    else { l.t+=dt; const dx=p.x-l.x, dy=1.2-l.y, dz=p.z-l.z, d=Math.hypot(dx,dy,dz); const sp=(7+l.t*40)*dt; if(d<Math.max(0.5,sp)){ if(S.loot<D.cap()){ loot.splice(i,1); S.loot++; setBack(player); got++; } else { l.fly=false; l.auto=true; l.t=0; } continue; } l.x+=dx/d*sp; l.y+=dy/d*sp; l.z+=dz/d*sp; } }
  if(got>0) SFX.sell();
  loot.forEach((l,i)=>{ vp.set(l.x,l.y,l.z); e3.set(l.fly||l.auto?l.t*10:0,l.ry,0); q.setFromEuler(e3); vs.set(1,1,1); m4.compose(vp,q,vs); lootMesh.setMatrixAt(i,m4); }); lootMesh.count=loot.length; lootMesh.instanceMatrix.needsUpdate=true; }
// ---------- Yerdeki altınlar ----------
const COIN_MAX=900;
const coinMesh=new THREE.InstancedMesh(G.coin,M.coin,COIN_MAX); coinMesh.castShadow=false; coinMesh.count=0; coinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); coinMesh.frustumCulled=false; scene.add(coinMesh);
const coins=[]; const stackH=new Map(); let coinSfxT=0, celebT=0, celebSpawn=0;
const cellKey=(x,z)=>((Math.round(x/0.9))+','+(Math.round(z/0.9)));
function dropCoins(pos,n,value,spread,up){ for(let i=0;i<n;i++){ if(coins.length>=COIN_MAX){ const c=coins.shift(); S.coins+=c.value; if(c.key) stackH.set(c.key,Math.max(0,(stackH.get(c.key)||1)-1)); } const a=rand(0,6.28), sp=rand(0.3,1)*(spread||3); coins.push({x:pos.x,y:(pos.y||1),z:pos.z,vx:Math.cos(a)*sp,vy:rand(5,9)*(up||1),vz:Math.sin(a)*sp,fly:false,rest:false,t:0,rot:rand(0,6),value,key:null,ry:0.07}); } }
function updateCoins(dt){
  const p=player.g.position; if(celebT>0) celebT=Math.max(0,celebT-dt); /* FX4: patron zaferinde altın süpürgesi (celebT) artık gerçekten çalışır */ const R=celebT>0?9:D.magnet(); coinSfxT-=dt; let got=0;
  for(let i=coins.length-1;i>=0;i--){ const c=coins[i];
    if(!c.fly){ c.t+=dt;
      if(!c.rest){ c.vy-=22*dt; c.x+=c.vx*dt; c.y+=c.vy*dt; c.z+=c.vz*dt; if(c.y<0.07){ c.y=0.07; c.vy=-c.vy*0.4; c.vx*=0.6; c.vz*=0.6; if(Math.abs(c.vy)<0.8){ c.rest=true; c.key=cellKey(c.x,c.z); const h=(stackH.get(c.key)||0); stackH.set(c.key,h+1); c.ry=0.07+h*0.15; c.x=Math.round(c.x/0.9)*0.9+rand(-.12,.12); c.z=Math.round(c.z/0.9)*0.9+rand(-.12,.12); } } }
      else { c.y=lerp(c.y,c.ry,Math.min(1,dt*10)); }
      const d=Math.hypot(c.x-p.x,c.z-p.z); if(c.t>0.3&&d<R){ c.fly=true; c.t=0; if(c.key){ stackH.set(c.key,Math.max(0,(stackH.get(c.key)||1)-1)); } } }
    else { c.t+=dt; const dx=p.x-c.x, dy=1.0-c.y, dz=p.z-c.z, d=Math.hypot(dx,dy,dz); const sp=(7+c.t*40)*dt; if(d<Math.max(0.5,sp)){ coins.splice(i,1); S.coins+=c.value; sellGain+=c.value; got++; continue; } c.x+=dx/d*sp; c.y+=dy/d*sp; c.z+=dz/d*sp; }
  }
  if(got>0){ coinPop(); if(coinSfxT<=0){ coinSfxT=0.06; SFX.coin(); } }
  coins.forEach((c,i)=>{ vp.set(c.x,c.y,c.z); if(c.fly){ e3.set(c.t*12,c.rot+c.t*8,0); } else { e3.set(0,c.rot,c.rest?0:c.t*6); } q.setFromEuler(e3); vs.set(1,1,1); m4.compose(vp,q,vs); coinMesh.setMatrixAt(i,m4); });
  coinMesh.count=coins.length; coinMesh.instanceMatrix.needsUpdate=true;
}
let sellGain=0, sellFlushT=0;
/* FX4: zaferde yerdeki tüm altınlar oyuncuya uçar; kart açılırken hâlâ uçan/yerde kalan varsa hesaba eklenir */
function pullCoins(){ celebT=Math.max(celebT,3); for(const c of coins){ if(!c.fly){ c.fly=true; c.t=0; if(c.key){ stackH.set(c.key,Math.max(0,(stackH.get(c.key)||1)-1)); c.key=null; } } } }
function flushCoins(){ let v=0; for(const c of coins) v+=c.value; if(v>0){ S.coins+=v; coinPop(); } coins.length=0; stackH.clear(); coinMesh.count=0; }
function storeLog(fromPos){ S.wood++; questEvent('wood'); /* FX1: depoya uçan odun hemen sayılır */ fly(fromPos.clone().setY(1),rotPt(DEPOT,0,1.0,-0.6),()=>{ setPile(Math.min(24,S.wood)); sfxAt(DEPOT).sell(); },true,4); } /* FX4: işçi depoya uzaktayken kısık */
function storeStone(fromPos){ S.stone++; fly(fromPos.clone().setY(1),rotPt(DEPOT,1.1,0.9,1.1),()=>{ setStonePile(Math.min(18,S.stone)); sfxAt(DEPOT).sell(); },'stone',4); }
setPile(Math.min(24,S.wood)); setStonePile(Math.min(18,S.stone));
/* FX4: sayaç sıçraması baştan oynar ve 120 ms'de bir ile sınırlı (her 50 ms'de 1↔1.18 arası titriyordu) */
let coinPopT=0; function coinPop(){ const now=performance.now(); if(now-coinPopT<120) return; coinPopT=now; const el=$('coinChip'); if(!el||document.body.classList.contains('calm')) return; if(el.animate) try{ el.animate([{transform:'scale(1)'},{transform:'scale(1.2)',offset:0.4},{transform:'scale(1)'}],{duration:220,easing:'ease-out'}); }catch(e){} }

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
  stall.rotation.y=ROT45; stall.position.copy(STALL); scene.add(stall); bakeStatic(stall); /* F6 */
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
  for(let i=0;i<90;i++){ const col=i%9, row=Math.floor(i/9); const cx=(col%3)-1, cz=Math.floor(col/3)-1; vp.set(cx*0.5,1.0+row*0.13,cz*0.36); e3.set(0,rand(0,6),0); q.setFromEuler(e3); vs.set(0.8,0.8,0.8); m4.compose(vp,q,vs); bankPile.setMatrixAt(i,m4); } treasury.add(bankPile); treasury.position.copy(TREASURY); scene.add(treasury); bakeStatic(treasury); })();
// Asker çadırı (KD köşe) ve kuyu (GB köşe): süs
const camp=new THREE.Group(); (function(){ const tentL=mesh(G.box,M.canvasDark,3.4,0.14,2.2); tentL.position.set(-0.85,1.1,0); tentL.rotation.z=0.95; const tentR=tentL.clone(); tentR.position.x=0.85; tentR.rotation.z=-0.95; const ridge=mesh(G.box,M.woodDark,0.12,0.12,2.4,false); ridge.position.set(0,1.95,0); const back=mesh(G.box,M.canvas,2.6,1.9,0.1); back.position.set(0,0.95,-1.1); back.rotation.z=0; const pole=mesh(G.cyl,M.woodDark,0.06,2.6,0.06); pole.position.set(0,1.3,1.2); const flag=mesh(G.box,M.flag,0.7,0.45,0.05,false); flag.position.set(0.35,2.4,1.2); camp.add(tentL,tentR,ridge,back,pole,flag);
  const fire=new THREE.Group(); fire.position.set(1.9,0,1.3); for(let i=0;i<6;i++){ const a=i/6*6.283; const st=mesh(G.dod,M.rock,0.22,0.16,0.22); st.position.set(Math.cos(a)*0.55,0.1,Math.sin(a)*0.55); fire.add(st); } for(const a of [0.4,1.5,2.6]){ const lg=mesh(G.log,M.woodDark,0.9,0.9,0.9,false); lg.rotation.z=Math.PI/2; lg.rotation.y=a; lg.position.y=0.12; fire.add(lg); } const fl=mesh(G.cone,M.flag,0.28,0.6,0.28,false); fl.position.y=0.5; fire.add(fl); const fl2=mesh(G.cone,M.gold,0.16,0.4,0.16,false); fl2.position.y=0.65; fire.add(fl2); camp.add(fire); camp.fire=fl; camp.fire2=fl2;
  const rack=mesh(G.box,M.woodDark,0.1,1.2,1.4); rack.position.set(-1.9,0.6,0.9); camp.add(rack); for(let i=0;i<3;i++){ const sp=mesh(G.cyl,M.handle,0.04,1.6,0.04); sp.position.set(-1.85,0.9,0.4+i*0.4); sp.rotation.x=0.2; camp.add(sp); const tip=mesh(G.cone,M.metal,0.07,0.22,0.07,false); tip.position.set(-1.85,1.75,0.22+i*0.4); camp.add(tip); }
  const well=new THREE.Group(); well.position.set(-1.1,0,2.2); const ring=mesh(G.cyl,M.stone,0.7,0.7,0.7); ring.position.y=0.35; const inner=mesh(G.cyl,M.iron,0.52,0.72,0.52,false); inner.position.y=0.35; for(let i=0;i<8;i++){ const a=i/8*6.283; const b=mesh(G.box,M.stoneDark,0.3,0.24,0.2,false); b.position.set(Math.cos(a)*0.65,0.62,Math.sin(a)*0.65); b.rotation.y=-a; well.add(b); } for(const x of [-0.6,0.6]){ const pp=mesh(G.cyl,M.woodDark,0.07,1.6,0.07); pp.position.set(x,1.1,0); well.add(pp); } const beam=mesh(G.cyl,M.handle,0.06,1.4,0.06); beam.rotation.z=Math.PI/2; beam.position.y=1.75; const roofL=mesh(G.box,M.roof,1.7,0.08,0.7); roofL.position.set(0,2.1,-0.3); roofL.rotation.x=0.6; const roofR=roofL.clone(); roofR.position.z=0.3; roofR.rotation.x=-0.6; const bucket=mesh(G.cyl,M.woodDark,0.16,0.26,0.16); bucket.position.set(0,1.3,0); well.add(ring,inner,beam,roofL,roofR,bucket); camp.add(well);
  camp.position.copy(CAMP); scene.add(camp); bakeStatic(camp); })();
const bankLabel=addLabel(TREASURY,'',2.6); bankLabel.near=-1; bankLabel.hide=true; treasury.visible=false; let withdrawT=0;
function bankIn(amount){ S.bank+=amount; }
function updateTreasury(dt){ const p=player.g.position; bankPile.count=Math.min(90,Math.ceil(S.bank/4)); bankLabel.el.innerHTML=`${T('Hazine','Treasury')}<small><b>${Math.floor(S.bank)}</b> ${T('altın','gold')}</small>`;
  if(S.bank>0.5&&p.distanceTo(TREASURY)<2.6){ withdrawT-=dt; if(withdrawT<=0){ withdrawT=0.05; const amt=Math.min(S.bank,Math.max(3,S.bank/12)); S.bank-=amt; S.coins+=amt; fly(TREASURY.clone().setY(0.9),player.g,()=>{ sellGain+=amt; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.08; SFX.coin(); } } } }
const customers=[]; const CUST_N=4; let stallT=0, custSpawnT=0;
function custSlot(i){ const t=2.9+1.2*i; return [STALL.x+t*DIAG, STALL.z+t*DIAG]; }
const stallDrop=()=>rotPt(STALL,rand(-1.4,1.4),1.5,-1.2);
function makeCustomer(){ const g=makeGuy('civ'); g.tool.visible=false; g.g.position.set(-(H+30),0,-0.6+rand(-.2,.2)); scene.add(g.g); customers.push({guy:g,state:'walk',t:0}); }
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
  if(first&&S.stall>0&&stallT<=0){ stallT=D.buyTime(); S.stall--; S.sold=(S.sold||0)+1; stallPile.count=Math.min(30,S.stall); const price=D.lootPrice(); first.state='leave'; first.t=0; SFX.coin(); const from=stallDrop(); const n=Math.max(2,Math.min(8,Math.round(price/5))); dropCoins(STALL_FRONT.clone().setY(1.4),n,price/n,1.8,0.8); floatText(from,`+${Math.round(price)}`,'',{key:'stall',v:price,fmt:v=>'+'+Math.round(v)}); /* FX4: art arda satışlar tek sayıda toplanır */ }
  stallPile.count=Math.min(30,S.stall);
}
stallPile.count=Math.min(30,S.stall);

// ---------- İnşa alanları (her şeyin max seviyesi 10) ----------
const pads=[]; const padById={};
const P=(x,z)=>()=>[x,z];
const nFree=k=>S.towers.filter(t=>!t.fixed&&t.k===k).length;
// 8 alan: Sur, Okçu kuleleri (kapı yanlarında), Topçu, Asker, Oduncu, Midilli, Genişlet, Tezgâh (+ 3. bölümden sonra Taşçı)
const PADS=[
  {id:'wall', ord:2, lock:T('Bir okçu kulesi','An Archer Tower'), name:T('Sur','Walls'), desc:T('Sur ve kapılar güçlenir','Stronger walls and gates'), res:l=>l>=3?'stone':'wood', pos:P(-2.9,-2.9), kind:'wall', key:'wall', cost:l=>l>=3?Math.round(24*Math.pow(1.45,l-3)):Math.round(30*Math.pow(1.6,l)), max:5, show:()=>S.towers.some(t=>t.lvl>=1)},
  {id:'soldier', ord:3, lock:T('Bir okçu kulesi','An Archer Tower'), name:T('Asker','Soldier'), desc:T('Saldırılan kapıya koşar','Runs to attacked gates'), res:'gold', pos:P(2.9,-2.9), kind:'soldier', key:'soldier', cost:l=>Math.round(35*Math.pow(1.45,l)), max:5, show:()=>S.towers.some(t=>t.lvl>=1)},
  {id:'worker', ord:4, lock:T('Sur Sv. 1','Walls Lv 1'), name:T('Oduncu','Lumberjack'), desc:T('Senin yerine odun keser','Chops wood for you'), res:'gold', pos:P(-2.9,2.9), kind:'worker', key:'worker', cost:l=>Math.round(45*Math.pow(1.5,l)), max:4, show:()=>S.lv.wall>=1},
  {id:'feet', ord:5, lock:T('Bir asker','A Soldier'), name:T('Midilli','Pony'), desc:T('Daha hızlı koş, daha çok yük taşı','Run fast, carry more'), res:'gold', pos:P(-5.4,2.9), kind:'up', key:'feet', cost:l=>Math.round(30*Math.pow(1.4,l)), max:5, show:()=>S.lv.soldier>=1},
  {id:'trader', ord:6, lock:T('İlk ganimet satışı','First loot sale'), name:T('Tezgâh','Stall'), desc:T('Miğferler pahalı ve hızlı satılır','Helmets sell faster, for more'), res:'gold', pos:P(-5.4,-2.9), kind:'up', key:'trader', cost:l=>Math.round(40*Math.pow(1.4,l)), max:5, show:()=>(S.sold||0)>=1},
  {id:'newCannon', ord:7, lock:T('Gece 2','Night 2'), lockS:T('2. gecede açılır','Unlocks on Night 2'), name:T('Topçu Kulesi','Cannon Tower'), desc:T('Gülle atar; yerini sen seç','Fires cannonballs; you place it'), res:'gold', pos:P(5.4,-2.9), kind:'newTower', tk:'c', cost:l=>Math.round(90*Math.pow(1.6,l)), max:3, show:()=>S.level>1||S.wave>=2, lvl:()=>nFree('c')},
  {id:'expand', ord:8, lock:T('Sur Sv. 2','Walls Lv 2'), name:T('Sur Genişletme','Wall Expansion'), desc:T('Sur büyür, merkez kule açılır','Walls grow, Central Tower unlocks'), res:'wood', pos:P(-2.9,-5.4), kind:'expand', key:'expand', cost:l=>Math.round(60*Math.pow(1.7,l)), max:2, show:()=>S.lv.wall>=2},
  {id:'stoneWorker', ord:9, lock:T('Taş Ocağı açılınca','Stone Quarry'), name:T('Taşçı','Quarryman'), desc:T('Senin yerine taş çıkarır','Quarries stone for you'), res:'gold', pos:P(-2.9,5.4), kind:'stoneWorker', key:'stoneWorker', cost:l=>Math.round(60*Math.pow(1.5,l)), max:3, show:()=>revealed('quarry')},
];
function towerPos(i){ const t=S.towers[i]; if(t.side==='C') return [0,0]; if(t.x!==undefined) return [t.x,t.z]; return sidePos(t.side,t.a,-1.5); }
// Kule alanı: sabit kuleler için kapının yanında, yeni kuleler için kulenin önünde, merkez için kule kurulunca güneyinde
function towerPadPos(i){ const t=S.towers[i]; if(t.side==='C') return t.lvl<1?[0,0]:[0,-2.9]; if(t.fixed) return sidePos(t.side,Math.sign(t.a)*2.4,-2.4); if(t.px!==undefined) return [t.px,t.pz]; return sidePos(t.side,t.a,-3.9); }
const FLANK_BASE={N:12,E:20,S:28,W:36};
function towerDef(i){ const t=S.towers[i]; const isC=t.side==='C'; const name=t.k==='c'?T('Topçu Kulesi','Cannon Tower'):isC?T('Merkez Kule','Central Tower'):T('Okçu Kulesi','Archer Tower'); const desc=t.k==='c'?T('Gülle atar, kalabalığı dağıtır','Fires cannonballs, scatters crowds'):isC?T('Uzun menzil, iki okçu','Long range, two archers'):T('Ok atar','Shoots arrows');
  return {id:'t'+i, ti:i, ord:isC?8.5:1, name, desc, kind:'tower', max:5, sc:isC?1.5:1.0, r:isC?2.4:1.9, pos:()=>towerPadPos(i), res:l=>l===0?'wood':l>=6?'plank':'gold', cost:l=>l===0?(isC?60:FLANK_BASE[t.side]):l>=6?Math.round((t.k==='c'?40:26)*Math.pow(1.35,l-6)):Math.round((t.k==='c'?70:35)*Math.pow(1.45,l-1)),
    lock: isC? T('Sur Genişletme Sv. 1','Wall Expansion Lv 1') : '', show:()=> isC? S.lv.expand>=1 : t.fixed? SIDES.indexOf(t.side)<sidesActive() : true }; }
function padLevel(d){ return d.kind==='tower'? S.towers[d.ti].lvl : d.kind==='newTower'? d.lvl() : (S.lv[d.key]||0); }
function padTexture(){ const c=document.createElement('canvas'); c.width=320; c.height=320; const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=4; return {c,tex}; }
function rr(x,X,Y,W,Hh,r){ x.beginPath(); x.moveTo(X+r,Y); x.lineTo(X+W-r,Y); x.quadraticCurveTo(X+W,Y,X+W,Y+r); x.lineTo(X+W,Y+Hh-r); x.quadraticCurveTo(X+W,Y+Hh,X+W-r,Y+Hh); x.lineTo(X+r,Y+Hh); x.quadraticCurveTo(X,Y+Hh,X,Y+Hh-r); x.lineTo(X,Y+r); x.quadraticCurveTo(X,Y,X+r,Y); x.closePath(); }
const PF='"Baloo 2","Nunito",sans-serif';
// FX3: gömülü yazı tipleri yüklenince alan dokuları yeniden çizilir (tuvalde yedek yazı tipi kalmasın)
try{ if(document.fonts&&document.fonts.load) Promise.all([document.fonts.load('800 40px "Baloo 2"'),document.fonts.load('700 16px "Nunito"')]).then(()=>{ for(const pd of pads) pd.last=''; }).catch(()=>{}); }catch(e){}
function fitFont(x,txt,w,fs,min,weight){ x.font=`${weight||'bold'} ${fs}px ${PF}`; while(x.measureText(txt).width>w&&fs>min){ fs-=2; x.font=`${weight||'bold'} ${fs}px ${PF}`; } return fs; }
function outlined(x,txt,cx,cy,fill,stroke,lw){ x.lineJoin='round'; x.strokeStyle=stroke; x.lineWidth=lw; x.strokeText(txt,cx,cy); x.fillStyle=fill; x.fillText(txt,cx,cy); }
// Alan kareleri yazısız: ne olduğu simgeyle, seviyesi noktalarla, fiyatı sayı + malzeme simgesiyle. Ad ve açıklama üstüne gelince baloncukta
const PAD_IC={wall:'🧱',soldier:'⚔️',worker:'🪓',feet:'🐴',trader:'⛑️',newCannon:'💣',expand:'🏗️',stoneWorker:'⛏️',rod:'🎣',fisher:'🚣',net:'🕸️',fishhut:'🐟',bow:'🔪',hunter:'🦌',trap:'🕳️',smoke:'🍖',cutter:'🔨',qcart:'🛒',mill:'💧',mcart:'🛒',lamp:'🏮',herbalist:'🌿',farm:'🍄',cauldron:'🧪',ironArrow:'🎯',ironWall:'🚪',miner:'⚒️',drill:'🔩',forge:'🔥',lighthouse:'🔦',boat:'⛵',harbor:'⚓',jeweler:'💍',cminer:'💎',cdrill:'💠'};
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
  else if(res==='plank'){ if((S.planks||0)<need-0.01){ toast(T('{plank} Kereste yetmiyor','{plank} Not enough planks')); return; } S.planks-=Math.ceil(need); for(let i=0;i<Math.min(12,Math.ceil(need));i++) fly(DEPOT.clone().setY(1.2),pd.g.position.clone().setY(0.3),null,'plank',rand(3,5)); }
  else if(res==='stone'){ if(S.stones+S.stone<need-0.01){ toast(T('{stone} Taş yetmiyor','{stone} Not enough stone')); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.stones); S.stones-=fromBack; n-=fromBack; S.stone-=n; setBack(player); setStonePile(Math.min(18,S.stone)); for(let i=0;i<Math.min(12,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,'stone',rand(4,7)); }
  else if(wood){ if(S.logs+S.wood<need-0.01){ toast(T('{wood} Odun yetmiyor','{wood} Not enough wood')); return; } let n=Math.ceil(need); const fromBack=Math.min(n,S.logs); S.logs-=fromBack; n-=fromBack; S.wood-=n; setBack(player); setPile(Math.min(24,S.wood)); for(let i=0;i<Math.min(14,Math.ceil(need));i++) fly(player.g.position.clone().setY(1.6),pd.g.position.clone().setY(0.3),null,true,rand(4,7)); }
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
  { const lvN=padLevel(d); const mile=big||lvN<=1||lvN%5===0||lvN>=d.max; celebrate(at,big?1:0.6,!mile); } /* FX4: küçük seviyelerde ekran sarsılmaz; büyük yapılar, ilk alım, her 5. seviye ve son seviye sarsar */ if(d.kind!=='newTower'){ const lv=padLevel(d); floatText(at,(d.kind==='tower'?(S.towers[d.ti].k==='c'?T('Topçu','Cannon'):T('Okçu','Archer'))+T(' Sv. ',' Lv ')+lv:d.name+(d.max>1&&d.kind!=='worker'&&d.kind!=='soldier'?T(' Sv. ',' Lv ')+lv:''))+'!','green'); } save(); }
let bubblePad=null;
// Kilitli alanlardan yalnız sıradaki (en küçük sıra numaralı) görünür; kalabalık olmasın
function nextLockedPad(){ const best={}; for(const pd of pads){ if(!pd.def.lock||pd.def.show()||padLevel(pd.def)>=pd.def.max) continue; const g=pd.def.grp||'base'; if(g!=='base'&&!revealed(g)) continue; if(!best[g]||(pd.def.ord||9)<(best[g].def.ord||9)) best[g]=pd; } return new Set(Object.values(best)); }
// FX1: kısmi ödeme hangi kaynakla yapıldıysa o kaynakta kalır: pedin kaynağı değişirse (ör. Nehir açılınca altın → kereste) ödenen eski kaynakla geri verilir (bedava seviye / yanlış iade olmaz)
function paidGuard(){ const pr=S.paidRes&&typeof S.paidRes==='object'?S.paidRes:(S.paidRes={}); for(const pd of pads){ const id=pd.def.id, v=S.paid[id]||0; if(!(v>0)){ if(pr[id]) delete pr[id]; continue; } const r=padRes(pd); if(!pr[id]){ pr[id]=r; continue; } if(pr[id]===r) continue; const o=pr[id]; delete pr[id]; S.paid[id]=0;
  if(o==='iron') S.iron=(S.iron||0)+Math.round(v); else if(o==='plank') S.planks=(S.planks||0)+Math.round(v); else if(o==='wood'){ S.wood+=Math.round(v); setPile(Math.min(24,S.wood)); } else if(o==='stone'){ S.stone+=Math.round(v); setStonePile(Math.min(18,S.stone)); } else S.coins+=v; } }
function updatePads(dt){ paidGuard(); const p=player.g.position; bubblePad=null; const nextL=nextLockedPad(); let payPad=null, payD=1e9; for(const pd of pads){ if(!pd.g.visible) continue; const d=Math.hypot(p.x-pd.g.position.x,p.z-pd.g.position.z); if(d<(pd.locked?pd.r*0.8:pd.r)&&d<payD){ payD=d; payPad=pd; } }
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
      else if(padRes(pd)==='iron'){ pd.acc=(pd.acc||0)+Math.max(10,cost/0.8)*dt; let n=Math.floor(pd.acc); pd.acc-=n; let cur=paid, moved=0; while(n>0&&(S.iron||0)>0&&cur<cost){ n--; S.iron--; cur++; moved++; S.paid[pd.def.id]=cur; } pd.payT-=dt; if(moved&&pd.payT<=0){ pd.payT=0.06; fly(DEPOT.clone().setY(1.2),pd.g.position.clone().setY(0.3),null,itemMesh(BAR_GEO,M.bar),3.5); SFX.pay(cur/cost); } } /* FX4: eskiden her demir için ayrı ses: bir karede 110 ses (+15 dBFS patlama); artık 60 ms'de bir ses + uçan külçe */
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
  toast(isTouch?T('👆 Boş yere dokun','👆 Tap an empty spot'):T('🖱️ Boş yere tıkla · Enter: buraya kur','🖱️ Click an empty spot · Enter: place here'),'good'); placeGhostAt(sp.x,sp.z); return true; }
function cancelPlacing(){ if(!placing) return; scene.remove(placing.ghost.g); S.coins+=placing.refund; S.pendingRefund=0; if(placing.pd) placing.pd.needLeave=true; placing=null; $('placeBar').style.display='none'; toast(T('↩ Geri verildi','↩ Refunded'),'good'); }
function pushOutOfTowers(p,r){ for(let i=9;i<S.towers.length;i++){ const t=S.towers[i]; if(t.x===undefined||t.lvl<1) continue; const dx=p.x-t.x, dz=p.z-t.z, d=Math.hypot(dx,dz); if(d<r&&d>0.001){ p.x=t.x+dx/d*r; p.z=t.z+dz/d*r; } } }
function placeGhostAt(x,z){ if(!placing) return; const sp=placeSpot(x,z); placing.spot=sp; placing.ok=sp.ok; placing.ghost.g.position.set(sp.x,0,sp.z); const d=SD[sp.s]; placing.ghost.g.rotation.y=Math.atan2(d.o[0],d.o[1]); const m=sp.ok?M.ghostOk:M.ghostBad; placing.ghost.g.traverse(o=>{ if(o.isMesh) o.material=m; }); { const pb=document.querySelector('#placeBar span'); if(pb){ const t=sp.ok?(isTouch?T('👆 Boş yere dokun','👆 Tap an empty spot'):T('🖱️ Boş yere tıkla · Enter: kur','🖱️ Click a spot · Enter: place')):T('✕ Buraya olmaz','✕ Not here'); if(pb.textContent!==t) pb.textContent=t; } } /* FX3: geçersiz yer yalnız renkle değil yazıyla da */ }
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
  else if(c.state==='toStall'){ if(walkTo(c,STALL.x+0.4,STALL.z+2.4,1.2,dt)){ c.sellT=(c.sellT||0)-dt; if(c.sellT<=0&&c.logs>0){ c.sellT=0.08; c.logs--; setLootBack(c.guy,c.logs); S.stall++; fly(p.clone().setY(1.4),stallDrop(),null,false,5); } if(c.logs<=0) c.state='idle'; } }
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
const EGR={base:3800,tilt:[0,0.49,0.73,0.89,1.0,1.16],hp:1.21,atk:1.08,cnt:0.03}; /* FX2: S08'de denenen taban/eğim (eski 2000 ve .72-1.1: ilk 10 gece yürüyüş) */ window.__egr=EGR;
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
const REF_DPS=[0, [50, 71, 80, 96, 100], [196, 226, 258, 302, 327], [288, 320, 368, 354, 394], [430, 440, 460, 490, 530], [570, 620, 680, 720, 750], [720, 760, 830, 900, 950], [948, 1032, 1176, 1320, 1318], [1537, 1708, 1610, 1697, 1771], [1523, 1750, 1944, 2106, 2268], [2691, 2990, 3289, 3588, 2298]]; /* FX2: sefer 1 G3→G4→patron yumuşak (acemiler G4'te bırakıyordu); sefer 8 G3-5 ×0.88 (duvar); sefer 10 G1-4 ×1.15, Kara Kral ×0.85 (S08 denendi) */
window.__REF=REF_DPS; /* test kancası */
function refDps(L,N){ const R=REF_DPS, n=R.length-1, i=Math.max(1,Math.min(5,N))-1; if(L<=n) return R[Math.max(1,L)][i]; return R[n][i]*Math.pow(1.06,L-n); } /* sefer x gece: o gecede beklenen savunma (kule başına dps, kartsız) */
function mercyK(){ const f=(S.meta.fails&&S.meta.fails[S.level])||0; return 1-Math.min(0.3,0.08*f); }
const TILT=[0, 0.28, 0.45, 0.63, 0.7, 0.92]; /* patron gecesi: patron ordunun ortasında gelip okları üstüne çektiği için toplam can payı düşük (eskiden 2.07, patron sonda gelirken) */
function balanceWave(pl){ const k=sidesActive(); pl.mul={}; const N=Math.min(5,S.wave); let R=(endless()?EGR.base*EGR.tilt[N]*Math.pow(EGR.hp,(eNight(S.level,S.wave)-1)/WAVES):refDps(S.level,N)*TILT[N]*(S.level===10&&N===1?1.25:1))*(window.__tilt||1)*mercyK(); /* F9b: son seferin ilk gecesi belirgin ağır */
  if(window.__rho){ let a=0,c=0; for(const s of SIDES) if(pl.cnt[s]){ a+=defenseDps(s,1,1); c++; } R=window.__rho*a/Math.max(1,c); } /* yalnız test: baskı oranı ölçümü */
  for(const s of SIDES){ const cnt=pl.cnt[s]; if(!cnt) continue; let nom=0; for(let i=0;i<pl.kinds.length;i++){ if(SIDES[(Math.floor(i/4)+pl.seed)%k]!==s) continue; const K=EK[pl.kinds[i]]||EK.grunt; nom+=K.hp/(0.85*K.arrow+0.15*K.cannon); } /* şövalye/kalkanlı gibi oka dayanıklılar etkin canla sayılır: sıçrama yapmaz */
    pl.mul[s]=clamp(R*(0.36*cnt+10)/Math.max(1,nom*nightHp()),1e-4,1e4)*(SIDES.indexOf(s)>=gatesBefore()?(window.__ngk||NEW_GATE_K):1); } } /* FX2: o gece İLK kez açılan kapı daha hafif (kuleleri yeni): yeni kapı büyük bir sıçramayla aynı geceye binmez */
const NEW_GATE_K=0.6; function gatesBefore(){ const g=GATE_PLAN[S.level]; if(!g) return 4; if(S.wave>1) return g[Math.min(4,S.wave-2)]; const p=GATE_PLAN[S.level-1]; return p?p[4]:(S.level>1?4:1); }
function startWave(){ if(S.cardPending&&!runOver){ showCardPick(true); if($('cardPick')||modalOpen()) return; } /* seçilmemiş güç kartı önce sunulur, gece seçimden sonra başlar */ snapNight(); if(!plan) planWave(); balanceWave(plan); scheduleWave(plan); nightClock=0; gateWarned=0; nightDmg={}; alertQ.length=0; waveActive=true; S.nightOn=true; noRegen=false; nightKills=0; const w=gw(); nightBanner(); SFX.night(); spawnQueue=plan.total; spawnT=0; spawnIdx=0; waveSeed=plan.seed; }
function spawnOne(){ const k=sidesActive(); const i=(plan&&plan.order)?plan.order[spawnIdx]:spawnIdx; const side=SIDES[(Math.floor(i/4)+waveSeed)%k]; const kind=(plan&&plan.kinds[i])||'grunt'; spawnIdx++; if(plan&&plan.done) plan.done[i]=1; makeEnemy(kind,side); const e=enemies[enemies.length-1]; e.via=(plan&&plan.via)?(plan.via[i]||''):undefined; rigSpawn(e); if(plan&&plan.adv&&plan.adv[i]>0&&!e.pre&&!e.hold) advanceOnRoad(e,plan.adv[i]); }
const gateMarks={}; for(const s of SIDES){ const g=new THREE.Group(); const cone=mesh(G.cone,M.enemy,0.55,0.9,0.55,false); cone.rotation.x=Math.PI; const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.7,32),new THREE.MeshBasicMaterial({color:0xd63a3a,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=-5.4; g.add(cone,ring); g.visible=false; scene.add(g); gateMarks[s]={g,cone,ring}; }
// gündüz: saldırılacak kapının üstünde kaç düşman ve hangi özel türler geleceği (simgeyle)
const KIND_IC={runner:'💨',shield:'🛡️',ram:'🐏',knight:'⚔️',pirate:'🏴‍☠️',ice:'❄️',poison:'☠️',archer:'🏹',wolf:'🐺',raider:'🏇',boss:'👑'};
const threatLbl={}; for(const s of SIDES){ const L=addLabel(new THREE.Vector3(0,0,0),'',7.6); L.near=-1; L.hide=true; L.avoid=true; L.el.classList.add('threat'); threatLbl[s]=L; }
function sideKinds(pl){ if(pl.sk) return pl.sk; const k=sidesActive(); const sk={}; for(let i=0;i<pl.kinds.length;i++){ const sd=SIDES[(Math.floor(i/4)+pl.seed)%k]; const kd=pl.kinds[i]; (sk[sd]||(sk[sd]={}))[kd]=((sk[sd]||{})[kd]||0)+1; } pl.sk=sk; return sk; }
function threatHtml(s){ const n=plan.cnt[s]; const kc=sideKinds(plan)[s]||{}; const ex=Object.keys(kc).filter(k=>KIND_IC[k]).sort((a,b)=>(b==='boss')-(a==='boss')||kc[b]-kc[a]).slice(0,3); return `<span class="ics"><span class="shield"></span>${n}${ex.map(k=>`<span>${KIND_IC[k]}</span>`).join('')}${fogGates().includes(s)?'<span class="fogIc">🌫️</span>':''}</span>`; } /* F6: sisli kapı */
function updateGateMarks(dt){ const t=performance.now()/1000; for(const s of SIDES){ const m=gateMarks[s]; let on=false; if(celebT<=0&&!$('levelCard')){ if(!waveActive&&plan&&plan.cnt[s]>0) on=true; if(waveActive&&(enemies.some(e=>!e.dead&&e.side===s)||(spawnQueue>0&&plan&&plan.cnt[s]>0))) on=true; } m.g.visible=on; const TL=threatLbl[s]; TL.hide=!(on&&!waveActive&&plan&&plan.cnt[s]>0); if(!TL.hide){ const [lx,lz]=sidePos(s,0,2.2); TL.pos.set(lx,0,lz); const key=plan.id+fogGates().join(''); if(TL._k!==key){ TL._k=key; TL.el.innerHTML=threatHtml(s); } } if(!on) continue; const [x,z]=sidePos(s,0,2.2); m.g.position.set(x,5.6+Math.sin(t*4)*0.3,z); m.g.rotation.y=t*2; const k=1+0.15*Math.sin(t*6); m.ring.scale.set(k,k,1); } }
function damageEnemy(e,dmg,src){ if(e.dead||e.hold) return; if(!(e.flashT>0)) flashOn(e); e.flashT=0.07; let m=src&&e.K&&e.K[src]!==undefined? e.K[src] : 1; if(src==='sword'){ if(e.guard) m*=2; else if(e.boss&&bossOf().hat==='crown') m*=1.5; } if(e.ward>0){ if(src==='sword') wardHit(e); else m*=WARD_K; } else if(e.chanT>0) m*=0.5; /* F9b: Kara Kral'ın kara kalkanı: kule %20, kılıç kırar; öfke toplarken yarı hasar */ if(src==='arrow'&&e.kind==='knight'&&S.lv.ironArrow) m=Math.min(1,m+0.13*S.lv.ironArrow); e.hp-=dmg*m; if(e.boss&&!e.ph2&&e.hp>0) bossPhase(e); e.hitT=0.18; sfxAt(e.g.position).hit(); /* FX4: uzaktaki vuruşlar kısık/sessiz */ if(m<0.7&&src==='arrow'&&Math.random()<0.3) burst(e.g.position.clone().setY(1.2),3,M.metal,0.5); if(e.hp<=0) killEnemy(e); }
/* FX4: patron ölümü bölümün doruğu: başlık, beyaz parlama, sarsıntı, büyük altın/kırmızı patlama; başka düşman kalmadıysa altınlar oyuncuya süpürülür (celebT) */
function bossKillFx(e){ const pos=e.g.position.clone(), calm=(typeof calmOn==='function'&&calmOn())||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); camShake=Math.max(camShake,calm?0.3:0.75); burst(pos.clone().setY(1.2),40,M.gold,2,1.8); burst(pos.clone().setY(1),24,M.enemy,1.6,1.6); SFX.boom(); floatText(pos.clone().setY(1.2*(e.g.scale.x||1)),'💀 '+bossName()+T(' YENİLDİ!',' DEFEATED!'),'big red');
  if(!calm){ const f=document.createElement('div'); f.style.cssText='position:fixed;inset:0;background:#fff;opacity:.5;pointer-events:none;z-index:7;transition:opacity .4s ease-out'; document.body.appendChild(f); setTimeout(()=>{ f.style.opacity='0'; },40); setTimeout(()=>f.remove(),500); }
  if(!enemies.some(o=>!o.dead&&o!==e)) celebT=Math.max(celebT,4); }
function killEnemy(e){ e.dead=true; e.bar.remove(); S.kills++; nightKills++; questEvent('kill',1); if(e.boss){ cgCall(k=>k.game.happytime()); slowT=1.3; spawnBossChest(e.g.position.clone()); bossKillFx(e); } comboKill(e); burst(e.g.position.clone().setY(0.8),9,M.enemy,1); const reward=(8+gw()*2.5)*(e.boss?10:e.kind==='ram'?3:1); scene.remove(e.g); const nl=e.K?e.K.loot:1; for(let i=0;i<nl;i++) dropLoot(e.g.position.x,e.g.position.z); if(e.kind==='ram'){ burst(e.g.position.clone().setY(1),16,M.woodDark,1.2); burst(e.g.position.clone().setY(1),8,M.trunk,1); } if(e.boss){ dropCoins(e.g.position.clone().setY(0.8),60,reward/60,8,1.3); } else if(Math.random()<0.35){ dropCoins(e.g.position.clone().setY(0.8),2,Math.round(reward/6),2.5,1); } }
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
function hitGate(side,kind,amt,ranged){ if(runOver) return; /* F9a: yıkıldıktan sonra sur eksiye inmez */ if(shieldT>0){ if(Math.random()<0.3){ const [bx,bz]=sidePos(side,rand(-1.5,1.5),0.3); burst(new THREE.Vector3(bx,1.6,bz),3,M.flashW||M.gold,0.5); } return; } amt=burstCap(amt); S.gateHp=Math.max(0,S.gateHp-amt); nightDmg[kind]=(nightDmg[kind]||0)+amt; if(!ranged){ { const [gx,gz]=sidePos(side,0,0); sfxAt({x:gx,z:gz},0.35).gate(); } gateShake=0.25; } S.minGate=Math.min(S.minGate,Math.max(0,S.gateHp)/D.gateMax());
  { const r=S.gateHp/D.gateMax(), lv=r<0.35?2:r<0.6?1:0; if(lv>gateWarned){ gateWarned=lv; alertQ.length=0; gateAlert(lv===2?T(`⚠ Sur %${Math.max(0,Math.round(r*100))}! ${SIDE_TR[side]} kapısı!`,`⚠ Walls ${Math.max(0,Math.round(r*100))}%! ${SIDE_TR[side]} Gate!`):T(`⚠ ${SIDE_TR[side]} kapısı saldırı altında!`,`⚠ ${SIDE_TR[side]} Gate under attack!`),true); } }
  const [bx,bz]=sidePos(side,rand(-1.5,1.5),0); burst(new THREE.Vector3(bx,1.4,bz),ranged?2:4,M.wood,0.6); if(S.gateHp<=0) gateBroken(); }
let failLeft=0;
function gateBroken(){ if(runOver) return; S.gateHp=0; runOver=true; S.failed=true; S.nightOn=false; save(); failLeft=Math.max(1,enemies.filter(e=>!e.dead).length+spawnQueue); SFX.lose(); SFX.boom(); camShake=0.6; setTimeout(showFailCard,900); }
let lastWaveFail=0;
function shoot(from,target,dmg){ const m=mesh(G.cyl,M.handle,0.035,0.8,0.035,false); m.position.copy(from); scene.add(m); projectiles.push({m,target,dmg,spd:26}); }
function updateProjectiles(dt){ for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; const t=p.target; if(t.dead){ scene.remove(p.m); projectiles.splice(i,1); continue; } const to=t.g.position.clone(); to.y=0.9; const dir=to.sub(p.m.position); const dist=dir.length(); if(dist<0.7){ scene.remove(p.m); projectiles.splice(i,1); damageEnemy(t,p.dmg,'arrow'); continue; } dir.normalize(); p.m.position.addScaledVector(dir,p.spd*dt); p.m.lookAt(t.g.position.x,0.9,t.g.position.z); p.m.rotateX(Math.PI/2); } }
function fireCannon(t,e){ const m=mesh(G.sph,M.ball,0.28,0.28,0.28,false); m.position.copy(t.top); scene.add(m); const to=e.g.position.clone(); to.addScaledVector(new THREE.Vector3(Math.sin(e.g.rotation.y),0,Math.cos(e.g.rotation.y)),e.speed*0.5); balls.push({m,from:t.top.clone(),to,t:0,dur:0.55+t.top.distanceTo(to)*0.012,dmg:D.cannonDmg(t.lvl)}); sfxAt(t.top).boom(); burst(t.top.clone(),5,M.smoke,0.4,1.4); }
function updateBalls(dt){ for(let i=balls.length-1;i>=0;i--){ const b=balls[i]; b.t+=dt; const k=Math.min(1,b.t/b.dur); b.m.position.lerpVectors(b.from,b.to,k); b.m.position.y+=Math.sin(k*Math.PI)*6; if(k>=1){ scene.remove(b.m); balls.splice(i,1); burst(b.to.clone().setY(0.6),14,M.smoke,1,1.6); burst(b.to.clone().setY(0.6),8,M.gold,1); sfxAt(b.to).boom(); for(const e of enemies){ if(e.dead) continue; const d=e.g.position.distanceTo(b.to); if(d<2.8) damageEnemy(e,b.dmg*(d<1.2?1:0.6),'cannon'); } } } }
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
function backExtraTotal(){ let t=0; for(const b of BACK_EXTRA) t+=S[b.key]||0; return t; }
function setExtraBack(){ const g=player; if(!g||!g.fishMesh) return; const bv=backVis(); let row=Math.ceil(bv.v(S.logs)/2)+Math.ceil(bv.v(S.stones||0)/2)+Math.ceil(bv.v(S.loot||0)/2);
  const put=(im,n)=>{ n=Math.max(0,Math.min(60,bv.v(n))); for(let i=0;i<n;i++){ const r=row+Math.floor(i/2), s=i%2; vp.set(s?0.24:-0.24,0.14+r*0.3,-0.05); e3.set(0,Math.PI/2,0.15*(s?1:-1)); q.setFromEuler(e3); vs.set(0.85,0.85,0.85); m4.compose(vp,q,vs); im.setMatrixAt(i,m4); } im.count=n; im.instanceMatrix.needsUpdate=true; row+=Math.ceil(n/2); };
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
    P.full=v>=cap-0.5; const key=Math.floor(v)+'|'+P.full; if(key!==P.key){ P.key=key; P.L.el.innerHTML=v<1?'':'💰 '+fmtN(v)+(P.full?' <b class="full">'+T('DOLU','MAX')+'</b>':''); P.L.el.style.display=v<1?'none':''; } P.L.hide=v<1;
    if(v>=1&&Math.hypot(p.x-P.pos.x,p.z-P.pos.z)<2.6){ P.t-=dt; if(P.t<=0){ P.t=0.05; const take=Math.max(1,Math.min(v,Math.max(4,v/10))); S.rg[P.id]=v-take; S.coins+=take; /* FX1: alınır alınmaz sayılır (uçan altın sayfa kapanınca kaybolmaz) */ questEvent('pile',take); fly(P.pos.clone().setY(0.8+n*0.02),player.g,()=>{ sellGain+=take; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.06; SFX.coin(); } } } } }

// ----- kilitli bölgeler: bulut örtüsü + tabela; sefer kazanınca törenle açılır -----
const REG_IC={lake:'🎣',meadow:'🦌',quarry:'⛏️',river:'🌊',swamp:'🍄',iron:'⚒️',coast:'⚓',snow:'💎',dark:'🏰'};
const regionFx={};
function buildClouds(id){ const R=REG[id]; const g=new THREE.Group(); g.position.set(R.c[0],0,R.c[1]); const n=Math.round(10+R.r*1.1); const puffs=[];
  for(let i=0;i<n;i++){ const a=i/n*6.283+rand(-.2,.2), rr=rand(0.2,1)*R.r; const s=rand(3.2,5.6); const m=new THREE.Mesh(G.sph,M.cloud); m.scale.set(s,s*0.62,s); m.position.set(Math.cos(a)*rr,s*0.35+rand(0,1.2),Math.sin(a)*rr); m.castShadow=false; m.receiveShadow=true; g.add(m); puffs.push({m,y0:m.position.y,ph:rand(0,6)}); }
  const post=mesh(G.cyl,M.woodDark,0.14,3.0,0.14); const dir=new THREE.Vector3(-R.c[0],0,-R.c[1]).normalize(); const sp=dir.clone().multiplyScalar(R.r+2.5); post.position.set(sp.x,1.5,sp.z); const board=mesh(G.box,M.plank,2.2,1.0,0.14); board.position.set(sp.x,2.7,sp.z); board.rotation.y=Math.atan2(dir.x,dir.z); g.add(post,board);
  scene.add(g); const L=addLabel(new THREE.Vector3(R.c[0]+sp.x,0,R.c[1]+sp.z),`🔒 ${REG_IC[id]||''}<small>${T(`${R.sefer}. sefer`,`Chapter ${R.sefer}`)}</small>`,4.0); L.near=3; L.el.classList.add('lockLbl');
  regionFx[id]={g,puffs,L,rev:null}; }
for(const id in REG) buildClouds(id);
function syncClouds(){ for(const id in regionFx){ const F=regionFx[id]; const on=!revealed(id); if(!F.rev){ F.g.visible=on; F.L.hide=!on; } } }
function revealRegion(id,cb){ const F=regionFx[id]; if(!F){ cb&&cb(); return; } S.revealed[id]=true; save(); F.rev={t:0,cb,done:false}; follow=false; }
// F8: bölgeye göre açılış kamerası: Kara Kale'de kamera kalenin kendisine bakar, daha geniş açı ve daha uzun durur (dikey/yatay ekran)
const REV_CAM={dark:{c:[-2,-93],z:1.75,T:4.4}};
function updateRegionFx(dt){ const t=performance.now()/1000; for(const id in regionFx){ const F=regionFx[id]; if(!F.g.visible) continue; for(const pf of F.puffs){ pf.m.position.y=pf.y0+Math.sin(t*0.6+pf.ph)*0.25; }
    if(F.rev){ const r=F.rev; r.t+=dt; const R=REG[id], RC=REV_CAM[id]||{}, C=RC.c||R.c; const p=player.g.position; const tgt=new THREE.Vector3(C[0]-p.x,0,C[1]-p.z); if(r.z0===undefined) r.z0=zoomTarget; const zt=(RC.z||1.35)*(camera.aspect>1?1:1.1);
      if(r.t<1.0){ camPan.lerp(tgt,Math.min(1,dt*3.2)); zoomTarget=Math.max(zoomTarget,zt); }
      else if(r.t<(RC.T||3.2)){ camPan.copy(tgt); const k=clamp((r.t-1.2)/1.6,0,1); for(const pf of F.puffs){ const s0=pf.s0||(pf.s0=pf.m.scale.x); const s=s0*(1-k*k); pf.m.scale.set(Math.max(0.001,s),Math.max(0.001,s*0.62),Math.max(0.001,s)); pf.m.position.y+=dt*6*k; } M.cloud.opacity=0.96;
        if(!r.boom&&r.t>1.25){ r.boom=true; F.L.hide=true; /* F9b: kilit tabelası bulut dağılınca kalkar */ if(id==='dark'){ SFX.doom(); DOOM=1.8; camShake=0.8; for(let i=0;i<10;i++) burst(new THREE.Vector3(R.c[0]+rand(-R.r,R.r),2,R.c[1]+rand(-R.r,R.r)),10,i%2?M.darkRoof:M.cloud,1.4,2.2); burst(new THREE.Vector3(4.2,9,-89),30,M.enemy,2.2,1.8); } /* F9b: Kara Kale kutlanmaz: uğursuz vuruş, kırmızı ışık, altın sütun yok */
          else { SFX.fanfare(); camShake=0.5; for(let i=0;i<8;i++) burst(new THREE.Vector3(R.c[0]+rand(-R.r,R.r),2,R.c[1]+rand(-R.r,R.r)),10,M.cloud,1.4,2.2); celebrate(new THREE.Vector3(R.c[0],0,R.c[1]),1.6); } }
        if(!r.ban&&r.t>1.6){ r.ban=true; if(id==='dark') banner(T('KARA KALE','THE BLACK CASTLE'),T('🏰 Kara Kral bekliyor · son sefer','🏰 The Black King awaits · the final chapter'),'boss'); else banner(R.name,T('Yeni bölge','New region')+' · '+(REG_IC[id]||'')+' '+R.job,'day'); } }
      else { F.g.visible=false; F.L.hide=true; for(const pf of F.puffs){ if(pf.s0) pf.m.scale.set(pf.s0,pf.s0*0.62,pf.s0); } F.rev=null; if(RC.z) zoomTarget=r.z0; recenter(); if(r.cb) setTimeout(r.cb,300); } } } }
function regionCollide(p){ for(const id in REG){ if(revealed(id)) continue; const R=REG[id]; const dx=p.x-R.c[0], dz=p.z-R.c[1], d=Math.hypot(dx,dz), rr=R.r+2.2; if(d<rr&&d>0.001){ p.x=R.c[0]+dx/d*rr; p.z=R.c[1]+dz/d*rr; } }
  if(revealed('lake')) lakeCollide(p); collide6(p); propCollide(p); }
// bölgelerdeki katı nesneler (taş ocağı tezgâhı/kayaları, arabalar, av kulübesi/tuzaklar/çit/saman): oyuncu içinden geçmez, kenarından kayar (ışınlanma yok)
let propLast=null, pushN=null;
function circPush(p,x,z,r){ const dx=p.x-x, dz=p.z-z; if(Math.abs(dx)>=r||Math.abs(dz)>=r) return; const d=Math.hypot(dx,dz); if(d<r&&d>0.001){ p.x=x+dx/d*r; p.z=z+dz/d*r; pushN=[dx/d,dz/d]; } }
// rehber yolu: büyük engelleri (kaya kümeleri, tezgâh, av kulübesi) yandan dolaşır
function propObstacles(){ const o=[]; if(revealed('quarry')){ for(const [x,z] of QUARRIES) o.push([x,z,6.6]); if(rg('cutter')>0) o.push([QCUT.x,QCUT.z,2.4]); } if(revealed('meadow')) o.push([HHUT.x,HHUT.z,2.6]); if(revealed('lake')) o.push([HUT.x,HUT.z,2.4]); if(rg('mill')>0) o.push([MILL.x,MILL.z,3.0]); obstacles6(o); return o; }
// çayır çiti: içinden dışarı (ya da tersi) çitten geçen yol ortadaki geçide yönelir; dışarıdan çitli yarıyı kesen yol çayırı dolaşır
function fenceCross(ax,az,bx,bz){ const R=MD.r+1.6, A=Math.atan2(-MDIR.z,-MDIR.x), dx=bx-ax, dz=bz-az, L=Math.hypot(dx,dz); if(L<0.01) return false; const u0=clamp(((MC.x-ax)*dx+(MC.z-az)*dz)/(L*L),0,1); if(Math.hypot(ax+dx*u0-MC.x,az+dz*u0-MC.z)>R+0.8) return false;
  const n=Math.ceil(L/0.4); for(let i=0;i<=n;i++){ const x=ax+dx*i/n-MC.x, z=az+dz*i/n-MC.z; if(Math.abs(Math.hypot(x,z)-R)>0.75) continue; let da=Math.atan2(z,x)-A; da=Math.atan2(Math.sin(da),Math.cos(da)); if(Math.abs(da)<1.36&&Math.abs(da)>0.17) return true; } return false; } /* çit bandına (geçit dışında) değen yol */
function fenceRoute(p,tx,tz){ if(!revealed('meadow')||Math.hypot(p.x-MC.x,p.z-MC.z)>60||!fenceCross(p.x,p.z,tx,tz)) return null; const R=MD.r+1.6, A=Math.atan2(-MDIR.z,-MDIR.x), at=(a,r)=>[MC.x+Math.cos(a)*r,MC.z+Math.sin(a)*r], gi=at(A,R-1.4), go=at(A,R+1.4), dd=(q,x,z)=>Math.hypot(q[0]-x,q[1]-z);
  const pr=Math.hypot(p.x-MC.x,p.z-MC.z), pin=pr<R; let pa=Math.atan2(p.z-MC.z,p.x-MC.x)-A; pa=Math.atan2(Math.sin(pa),Math.cos(pa)); const inGap=Math.abs(pa)<0.2&&Math.abs(pr-R)<1.6; /* geçitteyken karşı tarafa */
  if(pin) return inGap?go:gi; if(inGap&&Math.hypot(tx-MC.x,tz-MC.z)<R) return gi;
  let best=null,bc=1e9; for(const q of [go,...[-5,-4,-3,-2,-1,1,2,3,4,5].map(k=>at(A+k*0.3,R+2.6))]){ if(dd(q,p.x,p.z)<1.2||fenceCross(p.x,p.z,q[0],q[1])) continue; const tin=Math.hypot(tx-MC.x,tz-MC.z)<R; const c=dd(q,p.x,p.z)+(!fenceCross(q[0],q[1],tx,tz)?dd(q,tx,tz):tin?dd(q,go[0],go[1])+dd(go,tx,tz):dd(q,tx,tz)+40); if(c<bc){ bc=c; best=q; } } return best; }
// av kulübesi (kutu): önündeki teslim noktasına arkadan gelirken köşelerden dolaşır
function lodgeRoute(p,tx,tz){ if(!revealed('meadow')||Math.hypot(p.x-HHUT.x,p.z-HHUT.z)>40) return null; const ry=hhut.rotation.y, cs=Math.cos(ry), sn=Math.sin(ry), L=(x,z)=>{ const wx=x-HHUT.x, wz=z-HHUT.z; return [wx*cs-wz*sn, wx*sn+wz*cs]; }, W=([lx,lz])=>[HHUT.x+lx*cs+lz*sn, HHUT.z-lx*sn+lz*cs];
  const hx=1.9+PR+0.1, z0=-1.6-PR-0.1, z1=1.0+PR+0.1, hit=(a,b)=>{ for(let k=0;k<=1.0001;k+=0.05){ const x=a[0]+(b[0]-a[0])*k, z=a[1]+(b[1]-a[1])*k; if(x>-hx&&x<hx&&z>z0&&z<z1) return true; } return false; };
  const P=L(p.x,p.z), Tt=L(tx,tz); if(!hit(P,Tt)) return null; const cs4=[[-hx-0.9,z0-0.9],[hx+0.9,z0-0.9],[-hx-0.9,z1+0.9],[hx+0.9,z1+0.9]], d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  let best=null,bc=1e9; for(const c of cs4){ if(d(c,P)<0.8||hit(P,c)) continue; let rest=hit(c,Tt)?1e9:d(c,Tt); if(rest>=1e9) for(const c2 of cs4){ if(c2!==c&&!hit(c,c2)&&!hit(c2,Tt)) rest=Math.min(rest,d(c,c2)+d(c2,Tt)); } const cost=d(P,c)+rest; if(cost<bc){ bc=cost; best=c; } } return best?W(best):null; }
function avoidProps(p,tx,tz){ const fr=pierRoute(p,tx,tz)||fenceRoute(p,tx,tz)||lodgeRoute(p,tx,tz); if(fr) return fr; const dx=tx-p.x, dz=tz-p.z, L=Math.hypot(dx,dz); if(L<0.5) return [tx,tz]; const ux=dx/L, uz=dz/L; let best=null,bu=1e9;
  const OB=propObstacles(); for(const [cx,cz,r] of OB){ if(Math.hypot(tx-cx,tz-cz)<r+0.3||Math.hypot(p.x-cx,p.z-cz)<r) continue; const u=(cx-p.x)*ux+(cz-p.z)*uz; if(u<0||u>L) continue; const px=p.x+ux*u-cx, pz=p.z+uz*u-cz, d=Math.hypot(px,pz); if(d<r+0.4&&u<bu){ bu=u; best=[cx,cz,r,px,pz,d]; } }
  if(!best) return [tx,tz]; let [cx,cz,r,nx,nz,d]=best; if(d<0.01){ nx=-uz; nz=ux; d=1; } const k=(r+1.4)/d, c1=[cx+nx*k,cz+nz*k], c2=[cx-nx*k,cz-nz*k];
  const blocked=q=>OB.some(o=>(o[0]!==cx||o[1]!==cz)&&Math.hypot(q[0]-o[0],q[1]-o[1])<o[2]+0.6); return blocked(c1)&&!blocked(c2)?c2:c1; } /* F6: sapma noktası başka engelin içindeyse öbür yandan */
function boxPush(p,c,ry,hx,z0,z1){ const cs=Math.cos(ry), sn=Math.sin(ry), wx=p.x-c.x, wz=p.z-c.z; let lx=wx*cs-wz*sn, lz=wx*sn+wz*cs; if(lx<=-hx||lx>=hx||lz<=z0||lz>=z1) return;
  const m=Math.min(lx+hx,hx-lx,lz-z0,z1-lz); let nl=[0,0]; if(m===lx+hx){ lx=-hx; nl=[-1,0]; } else if(m===hx-lx){ lx=hx; nl=[1,0]; } else if(m===lz-z0){ lz=z0; nl=[0,-1]; } else { lz=z1; nl=[0,1]; } p.x=c.x+lx*cs+lz*sn; p.z=c.z-lx*sn+lz*cs; pushN=[nl[0]*cs+nl[1]*sn,-nl[0]*sn+nl[1]*cs]; }
const PR=0.5; let HAY=null;
function propCollide(p){ const L=propLast, mx=L?p.x-L[0]:0, mz=L?p.z-L[1]:0, ml=Math.hypot(mx,mz); pushN=null; propCollide2(p);
  if(pushN&&ml>0.01&&ml<3){ const net=Math.hypot(p.x-L[0],p.z-L[1]); if(net<ml*0.3){ let tx=-pushN[1], tz=pushN[0]; if(tx*mx+tz*mz<0){ tx=-tx; tz=-tz; } const k=Math.min(0.3,ml*0.5); p.x+=tx*k; p.z+=tz*k; } } /* tam karşıdan çarpınca yana kayar, takılmaz */
  propLast=[p.x,p.z]; }
function propCollide2(p){ if(revealed('lake')&&Math.hypot(p.x-HUT.x,p.z-HUT.z)<6) boxPush(p,HUT,Math.atan2(LDIR.x,LDIR.z),1.8+PR,-1.5-PR,1.2+PR); /* F6: balıkhane ve değirmen katı */
  if(rg('mill')>0&&Math.hypot(p.x-MILL.x,p.z-MILL.z)<9){ const a=Math.atan2(RDIR.x,RDIR.z); boxPush(p,MILL,a,2.2+PR,-1.95-PR,1.95+PR); boxPush(p,SAW,a+Math.PI/2,0.6+PR,-2.2-PR,2.2+PR); }
  for(const c of carts){ const g=c.C.g.position; if(c.wait<=0&&g.distanceTo(DEPOT_FRONT)>4.5) circPush(p,g.x,g.z,1.1+PR); } /* depoda bekleyen araba odun/taş teslimini kapatmasın */
  if(revealed('quarry')&&Math.hypot(p.x-QC.x,p.z-QC.z)<QD.r+14){ if(rg('cutter')>0) circPush(p,QCUT.x,QCUT.z,1.9+PR); for(const r of rocks){ if(r.alive&&!r.gone) circPush(p,r.x,r.z,r.s*0.8+PR); } }
  if(revealed('meadow')&&Math.hypot(p.x-MC.x,p.z-MC.z)<MD.r+12){ if(!HAY) HAY=[[-6,-8],[-8,-5],[-3,-10]].map(([d,s])=>mat2(d,s)); const FENCE_A=Math.atan2(-MDIR.z,-MDIR.x); boxPush(p,HHUT,hhut.rotation.y,1.9+PR,-1.6-PR,1.0+PR); for(const t of traps) circPush(p,t.c.x,t.c.z,0.8+PR); for(const h of HAY) circPush(p,h.x,h.z,0.6+PR);
    const dx=p.x-MC.x, dz=p.z-MC.z, d=Math.hypot(dx,dz), R=MD.r+1.6; if(Math.abs(d-R)<0.18+PR&&d>0.001){ let da=Math.atan2(dz,dx)-FENCE_A; da=Math.atan2(Math.sin(da),Math.cos(da)); if(Math.abs(da)<1.3+0.03&&Math.abs(da)>0.2){ const k=(d<R?R-0.18-PR:R+0.18+PR)/d; p.x=MC.x+dx*k; p.z=MC.z+dz*k; pushN=d<R?[-dx/d,-dz/d]:[dx/d,dz/d]; } } } }

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
// su + iskele: su içindeki noktayı en yakın geçerli yere (iskele şeridi ya da kıyı) iter; iskele ucundan kıyıya ışınlama olmaz, kayarak durur
function waterCollide(p,C,rr,A,B,hw){ const dx=p.x-C.x, dz=p.z-C.z, d=Math.hypot(dx,dz); if(d>=rr) return; const ux=B.x-A.x, uz=B.z-A.z; const t=clamp(((p.x-A.x)*ux+(p.z-A.z)*uz)/(ux*ux+uz*uz||1),0,1);
  const cx=A.x+ux*t, cz=A.z+uz*t, ox=p.x-cx, oz=p.z-cz, od=Math.hypot(ox,oz), k=od>hw?hw/od:1, qx=cx+ox*k, qz=cz+oz*k;
  if(Math.hypot(p.x-qx,p.z-qz)<=rr-d){ p.x=qx; p.z=qz; return; } const s=rr/(d||1e-6); p.x=C.x+dx*s; p.z=C.z+dz*s; }
const DOCK_A=lat(LK.r+2,0), DOCK_B=lat(LK.r-5.3,0); // şerit yarıçapı 0.9: uç, eskisi gibi LK.r-6.2'de biter
function lakeCollide(p){ waterCollide(p,LC,LK.r-0.25,DOCK_A,DOCK_B,0.9); }
/* F6: iskeleden karaya (ya da karadan iskeleye) giden düz yol suyu kesiyorsa önce iskelenin kara ucuna gidilir (oyuncu iskelede su kenarına takılmasın) */
function pierRoute1(p,tx,tz,C,rr,A,B,hw){ const inW=(x,z)=>{ if(Math.hypot(x-C.x,z-C.z)>=rr) return false; const ux=B.x-A.x, uz=B.z-A.z, t=clamp(((x-A.x)*ux+(z-A.z)*uz)/(ux*ux+uz*uz||1),0,1); return Math.hypot(x-(A.x+ux*t),z-(A.z+uz*t))>hw; };
  const onP=Math.hypot(p.x-C.x,p.z-C.z)<rr, onT=Math.hypot(tx-C.x,tz-C.z)<rr; if(!onP&&!onT) return null; const L=Math.hypot(tx-p.x,tz-p.z), n=Math.ceil(L/0.5);
  for(let i=1;i<n;i++){ if(inW(p.x+(tx-p.x)*i/n,p.z+(tz-p.z)*i/n)) return Math.hypot(p.x-A.x,p.z-A.z)>0.8?[A.x,A.z]:null; } return null; }
function pierRoute(p,tx,tz){ return (revealed('lake')&&pierRoute1(p,tx,tz,LC,LK.r-0.25,DOCK_A,DOCK_B,0.9))||(revealed('coast')&&pierRoute1(p,tx,tz,SC,SEA.r-0.3,PIER_A,PIER_T,1.05))||null; }
// Balıkhane: iskele başında küçük kulübe, tezgâhta balıklar, önünde para yığını
const hut=new THREE.Group(); const hutFish=new THREE.InstancedMesh(FISH_GEO,M.fish,24); hutFish.count=0;
(function(){ const fl=mesh(G.box,M.plank,3.6,0.2,3.0); fl.position.y=0.1; const back=mesh(G.box,M.wood,3.6,2.2,0.18); back.position.set(0,1.2,-1.4); const s1=mesh(G.box,M.wood,0.18,2.2,2.8); s1.position.set(-1.7,1.2,0); const s2=s1.clone(); s2.position.x=1.7;
  const counter=mesh(G.box,M.woodDark,3.4,0.95,0.8); counter.position.set(0,0.55,1.05); const ice=mesh(G.box,mat(0xdff4ff),3.1,0.12,0.65,false); ice.position.set(0,1.08,1.05);
  const roofL=mesh(G.box,M.canvasDark,4.0,0.12,2.0); roofL.position.set(0,2.75,-0.55); roofL.rotation.x=0.45; const roofF=mesh(G.box,M.canvas,4.0,0.1,1.3); roofF.position.set(0,2.45,1.1); roofF.rotation.x=-0.25;
  const sign=mesh(G.box,M.plank,1.8,0.6,0.1); sign.position.set(0,3.35,-1.2); const sf=new THREE.Mesh(FISH_GEO,M.fish); sf.scale.setScalar(1.4); sf.position.set(0,3.35,-1.1); sf.castShadow=true;
  for(const x of [-1.35,1.35]){ const b=mesh(G.cyl,M.woodDark,0.36,0.8,0.36); b.position.set(x*1.55,0.4,1.9); hut.add(b); }
  hut.add(fl,back,s1,s2,counter,ice,roofL,roofF,sign,sf);
  for(let i=0;i<24;i++){ const col=i%8,row=Math.floor(i/8); vp.set(1.3-col*0.37,1.18+row*0.12,0.95+(row%2)*0.12); e3.set(0,rand(-.3,.3)+Math.PI/2,0); q.setFromEuler(e3); vs.set(0.9,0.9,0.9); m4.compose(vp,q,vs); hutFish.setMatrixAt(i,m4); } hut.add(hutFish);
  hut.position.copy(HUT); hut.rotation.y=Math.atan2(LDIR.x,LDIR.z); scene.add(hut); })(); /* F6: p8 lakeInit balıkhanenin duvar/fıçı parçalarını değiştirir: birleştirilmez */
const hutLbl=addLabel(HUT,'',4.1); hutLbl.near=-1; hutLbl.el.classList.add('machLbl');
const fishPile=makePile(lat(LK.r+6.6,7.2),()=>Math.round((220+160*rg('fishhut'))*(1+0.12*S.level))); fishPile.id='fishPile';
// Balık türleri (koleksiyon defteri)
const FISH=[{k:'sazan',n:T('Sazan','Carp'),v:1,w:52,c:0x9fb7a0},{k:'alabalik',n:T('Alabalık','Trout'),v:1.4,w:28,c:0xd79a9a},{k:'turna',n:T('Turna','Pike'),v:2,w:13,c:0x7fa37a},{k:'yayin',n:T('Yayın','Catfish'),v:3.4,w:6,c:0x5c6470},{k:'altin',n:T('Altın Balık','Golden Fish'),v:8,w:1.4,c:0xffc93a},{k:'levrek',n:T('Levrek','Sea Bass'),v:2.2,w:45,c:0x9ab0c8,sea:1},{k:'orkinos',n:T('Orkinos','Tuna'),v:4,w:25,c:0x3a5a8a,sea:1},{k:'kilic',n:T('Kılıç Balığı','Swordfish'),v:7,w:8,c:0x5a86b0,sea:1},{k:'ejder',n:T('Deniz Ejderi','Sea Dragon'),v:18,w:1.2,c:0x3affc8,sea:1}];
const fishValue=k=>{ const f=FISH.find(x=>x.k===k)||FISH[0]; return (6+1.3*gw())*f.v; };
const fishPrice=()=>(2.5+0.45*gw())*(1+0.1*rg('fishhut'));
const hutCap=()=>30+15*rg('fishhut'); const hutSellT=()=>2.6*Math.pow(0.8,rg('fishhut')); /* F4: her seviye satışı gerçekten hızlandırır (eski taban 0.55 sn Sv6+ için sınırdı) */
let hutT=0, fishDropT=0;
function updateHut(dt){ if(!revealed('lake')) return; lakeFx(dt); const st=S.rg.hutFish||0; setStack(hutFish,Math.min(24,st)); hutT-=dt;
  if(st>=1&&hutT<=0&&pileVal(fishPile)<fishPile.capFn()-0.5){ hutT=hutSellT(); const b=(S.rg.hutB||0)/st; S.rg.hutFish=st-1; stat('fish'); S.rg.hutB=st>1?Math.max(0,(S.rg.hutB||0)-b):0; const v=fishPrice()*(1+b); pileAdd(fishPile,v); if(b>=0.9) floatText(fishPile.pos.clone().setY(1.2),'+'+Math.round(v),'green'); pulse(hut,0.05); fly(HUT.clone().setY(1.4),fishPile.pos.clone().setY(0.8),null,false,4); }
  const p=player.g.position; if(S.fish>0&&Math.hypot(p.x-HUT_FRONT.x,p.z-HUT_FRONT.z)<3.0){ fishDropT-=dt; if(fishDropT<=0&&(S.rg.hutFish||0)<hutCap()){ fishDropT=0.06; const b=takeFishB(); S.fish--; setBack(player); S.rg.hutFish=(S.rg.hutFish||0)+1; S.rg.hutB=(S.rg.hutB||0)+b; fly(p.clone().setY(1.6),HUT.clone().setY(1.3),null,'fish',5); SFX.sell(); } }
  const k=(S.rg.hutFish||0)+'|'+hutCap()+'|'+rg('fishhut'); if(hutLbl._k!==k){ hutLbl._k=k; const full=(S.rg.hutFish||0)>=hutCap(); hutLbl.el.innerHTML=`🐟 ${Math.floor(S.rg.hutFish||0)}/${hutCap()}${full?' <b class="full">'+T('DOLU','MAX')+'</b>':''}`; } }
// nadir balık değeri: sırttaki ve dükkândaki balıkların 'sazan üstü' değer toplamı (fishB / rg.hutB). Satışta ortalama pay eklenir
function takeFishB(){ const n=S.fish||0, b=n>0?Math.max(0,S.fishB||0)/n:0; S.fishB=n>1?Math.max(0,(S.fishB||0)-b):0; return b; }
function toHut(from,n){ for(let i=0;i<n;i++) later(i*0.14,()=>lakeToBin(from.clone())); }

// ----- Balık tutma (elle): iskelenin ucunda dur, olta kendiliğinden atılır, ibre yeşildeyken ÇEK -----
const FS={state:'idle',t:0,needle:0,dir:1,spd:1,zc:0.5,zw:0.25,bob:null,line:null};
const bob=new THREE.Group(); (function(){ const b1=mesh(G.sph,M.buoy,0.16,0.16,0.16,false); const b2=mesh(G.sph,M.flower,0.12,0.1,0.12,false); b2.position.y=0.1; bob.add(b1,b2); bob.visible=false; scene.add(bob); })();
const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]); const fishLine=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.8})); fishLine.visible=false; fishLine.frustumCulled=false; scene.add(fishLine);
const rodMesh=mesh(G.cyl,M.handle,0.035,1.9,0.035,false); rodMesh.rotation.x=-0.9; rodMesh.position.set(0,0.1,0.75); rodMesh.visible=false; player.armR.add(rodMesh);
const fishUI=document.createElement('div'); fishUI.className='fishUI'; fishUI.innerHTML='<div class="fbar"><i class="zone"></i><i class="needle"></i></div><button id="reelBtn">'+T('ÇEK!','REEL!')+'</button><small id="fishTip">'+T('Balık bekleniyor…','Waiting for fish…')+'</small>'; fishUI.style.display='none'; document.body.appendChild(fishUI);
fishUI.addEventListener('pointerdown',e=>e.stopPropagation()); $('reelBtn').addEventListener('click',e=>{ e.stopPropagation(); audio(); reel(); });
addEventListener('keydown',e=>{ if(e.key===' '&&FS.state==='bite'){ e.preventDefault(); reel(); } });
function fishSpot(){ if(FS.loc==='sea') return SC.clone().addScaledVector(CU,SEA.r-13).addScaledVector(rotU(CU,Math.PI/2),rand(-2,2)).setY(0.1); return lat(LK.r-8.6,rand(-2,2)).setY(0.08); }
function endFishing(){ FS.state='idle'; bob.visible=false; fishLine.visible=false; rodMesh.visible=false; fishUI.style.display='none'; }
function rollFish(qual){ const sea=FS.loc==='sea'; const pool=FISH.filter(f=>!!f.sea===sea); const rare=1+0.15*rg('rod')+(sea?0.15*rg('harbor'):0)+(qual>0.75?1.5:0); const half=Math.ceil(pool.length/2); let tot=0; const ws=pool.map((f,i)=>{ const w=f.w*(i>=half?rare:1); tot+=w; return w; }); let r=Math.random()*tot; for(let i=0;i<pool.length;i++){ r-=ws[i]; if(r<=0) return pool[i]; } return pool[0]; }
function reel(){ if(FS.state!=='bite') return; const d=Math.abs(FS.needle-FS.zc); if(d<=FS.zw/2){ const qual=1-d/(FS.zw/2); const f=rollFish(qual); catchFish(f,qual); } else { floatText(player.g.position,T('Kaçtı!','Got away!'),'red'); SFX.hit(); FS.state='cool'; FS.t=0.6; fishUI.style.display='none'; bob.visible=false; fishLine.visible=false; } }
function catchFish(f,qual){ FS.state='cool'; FS.t=0.55; fishUI.style.display='none'; const from=bob.position.clone().setY(0.5); bob.visible=false; fishLine.visible=false; burst(from,10,M.waterLight,1.2); SFX.sell();
  fly(from,player.g,()=>{ S.fish=(S.fish||0)+1; S.fishB=(S.fishB||0)+Math.max(0,f.v-1); setBack(player); },'fish',3.2);
  questEvent('fish',1); S.book.fish[f.k]=(S.book.fish[f.k]||0)+1; const first=S.book.fish[f.k]===1; floatText(player.g.position,(qual>0.8?T('Mükemmel! ','Perfect! '):'')+f.n,first?'green':''); if(first&&f.k!=='sazan'&&f.k!=='levrek'){ banner(T('Yeni tür: '+f.n,'New species: '+f.n),T('📖 Deftere eklendi','📖 Added to book'),'day'); SFX.fanfare(); }
  if(f.v>=3){ camShake=0.25; celebrate(from.clone().setY(0),0.6); } }
function updateFishing(dt){ const p=player.g.position; const nearPier=revealed('coast')&&Math.hypot(p.x-PIER_END.x,p.z-PIER_END.z)<1.9, nearDock=revealed('lake')&&Math.hypot(p.x-DOCK_END.x,p.z-DOCK_END.z)<1.9; const loc=nearPier?'sea':nearDock?'lake':(FS.loc||'lake'); if(loc!==FS.loc){ if(FS.state!=='idle') endFishing(); FS.loc=loc; } const onDock=nearPier||nearDock; const can=onDock&&!playerMoving&&(S.fish||0)<fishCap()&&!nearestEnemy(p,6)&&!document.querySelector('.intro');
  if(!can){ if(FS.state!=='idle') endFishing(); if(onDock&&(S.fish||0)>=fishCap()&&!playerMoving){ FS.fullT=(FS.fullT||0)-dt; if(FS.fullT<=0){ FS.fullT=2.5; floatText(p,T('DOLU','MAX'),'red'); } } return; }
  rodMesh.visible=true; if(FS.loc==='sea') player.g.rotation.y=Math.atan2(SC.x-p.x,SC.z-p.z); else player.g.rotation.y=Math.atan2(-LDIR.x,-LDIR.z);
  if(FS.state==='idle'){ FS.state='cast'; FS.t=0; FS.spot=fishSpot(); bob.visible=true; fishLine.visible=true; SFX.slash(); }
  const tip=new THREE.Vector3(); rodMesh.getWorldPosition(tip); tip.y+=0.9;
  if(FS.state==='cast'){ FS.t+=dt*2.2; const k=Math.min(1,FS.t); bob.position.lerpVectors(p.clone().setY(2),FS.spot,k); bob.position.y+=Math.sin(k*Math.PI)*2; if(k>=1){ FS.state='wait'; FS.t=rand(0.8,2.0); burst(FS.spot.clone(),5,M.waterLight,0.6); } }
  else if(FS.state==='wait'){ FS.t-=dt; bob.position.y=0.08+Math.sin(performance.now()/300)*0.03; if(FS.t<=0){ FS.state='bite'; FS.t=2.8; FS.needle=0; FS.dir=1; FS.zw=Math.min(0.42,0.22+0.035*rg('rod')); FS.zc=rand(0.2+FS.zw/2,0.8-FS.zw/2); FS.spd=rand(0.95,1.35); fishUI.style.display='flex'; const z=fishUI.querySelector('.zone'); z.style.left=((FS.zc-FS.zw/2)*100)+'%'; z.style.width=(FS.zw*100)+'%'; $('fishTip').textContent=T('Vuruyor! İbre yeşildeyken ÇEK','Bite! REEL in the green'); tone(900,1300,0.1,'square',0.05); } }
  else if(FS.state==='bite'){ FS.t-=dt; FS.needle+=FS.dir*FS.spd*dt; if(FS.needle>1){ FS.needle=1; FS.dir=-1; } if(FS.needle<0){ FS.needle=0; FS.dir=1; } fishUI.querySelector('.needle').style.left=(FS.needle*100)+'%'; bob.position.y=0.02+Math.abs(Math.sin(performance.now()/60))*0.08; if(window.__autoReel&&Math.abs(FS.needle-FS.zc)<FS.zw*0.3) reel(); if(FS.state==='bite'&&FS.t<=0){ floatText(p,T('Kaçtı!','Got away!'),'red'); FS.state='cool'; FS.t=0.5; fishUI.style.display='none'; bob.visible=false; fishLine.visible=false; } }
  else if(FS.state==='cool'){ FS.t-=dt; if(FS.t<=0){ FS.state='idle'; } }
  if(fishLine.visible){ const a=lineGeo.attributes.position; a.setXYZ(0,tip.x,tip.y,tip.z); a.setXYZ(1,bob.position.x,bob.position.y,bob.position.z); a.needsUpdate=true; } }

// ----- Balıkçı (işçi): iskelenin kenarında oturur, düzenli balık tutar, balıkhaneye gönderir -----
const fishers=[];
function addFisher(){ const i=fishers.length; const g=makeGuy('worker'); g.tool.visible=false; const rod=mesh(G.cyl,M.handle,0.035,1.9,0.035,false); rod.rotation.x=-0.9; rod.position.set(0,0.1,0.75); g.armR.add(rod); g.armR.rotation.x=-0.9;
  const pp=lat(LK.r-1.2-i*1.9,i%2?1.25:-1.25); g.g.position.set(pp.x,0.35,pp.z); g.g.rotation.y=Math.atan2(LPERP.x*(i%2?1:-1),LPERP.z*(i%2?1:-1)); scene.add(g.g); const b=mesh(G.sph,M.buoy,0.12,0.12,0.12,false); const bp=lat(LK.r-1.2-i*1.9,(i%2?1:-1)*4.2); b.position.set(bp.x,0.1,bp.z); scene.add(b);
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),fishLine.material); ln.frustumCulled=false; scene.add(ln); fishers.push({g,b,ln,rod,t:rand(3,7),bp}); }
function updateFishers(dt){ const tip=new THREE.Vector3(); for(const f of fishers){ f.t-=dt; f.b.position.y=0.08+Math.sin(performance.now()/400+f.t)*0.03; animGuy(f.g,dt,false,1); f.g.armR.rotation.x=-0.9+(f.t<0.4?-0.6:0);
    f.rod.getWorldPosition(tip); tip.y+=0.9; const a=f.ln.geometry.attributes.position; a.setXYZ(0,tip.x,tip.y,tip.z); a.setXYZ(1,f.b.position.x,f.b.position.y,f.b.position.z); a.needsUpdate=true;
    if(f.t<=0){ f.t=7; if(lakeCanTake()){ burst(f.b.position.clone(),6,M.waterLight,0.8); toHut(f.b.position.clone().setY(0.4),1); } } } }

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
function updateNets(dt){ const l=rg('net'); netLbl.hide=l<=0||!revealed('lake'); const k=l+'|'+lakeCanTake(); if(netLbl._k!==k){ netLbl._k=k; netLbl.el.innerHTML=''; }
  const t=performance.now()/1000; for(const n of nets){ n.g.position.y=0.07+Math.sin(t*1.3+n.c.x)*0.03; n.t-=dt; if(n.t<=0){ n.t=12; const cnt=l>=3?2:1; if(lakeCanTake()){ burst(n.c.clone().setY(0.3),8,M.waterLight,1); tone(520,780,0.08,'sine',0.03); toHut(n.c.clone().setY(0.5),cnt); } } } }

// ----- Gölün alanları -----
const LPADS=[
  {id:'rod', grp:'lake', ord:1, name:T('Olta','Fishing Rod'), desc:T('Nadir, değerli balık şansı artar','More rare, pricier fish'), res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-7.4); return [v.x,v.z]; }, kind:'up', key:'rod', cost:l=>Math.round(55*Math.pow(1.55,l)), max:5, show:()=>revealed('lake')},
  {id:'fisher', grp:'lake', ord:2, name:T('Balıkçı','Fisher'), desc:T('İskelede senin yerine balık tutar','Fishes on the pier for you'), res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-4.7); return [v.x,v.z]; }, kind:'up', key:'fisher', cost:l=>Math.round(90*Math.pow(1.7,l)), max:3, show:()=>revealed('lake'), onBuy:()=>{ addFisher(); celebrate(lat(LK.r-1.2-(fishers.length-1)*1.9,0),1); }},
  {id:'net', grp:'lake', ord:3, lock:T('Bir balıkçı','1 Fisher'), name:T('Balık Ağı','Fishing Net'), desc:T('Makine: balık kendiliğinden gelir','Machine: auto-catches fish'), res:'gold', pos:()=>{ const v=lat(LK.r+7.2,-2.0); return [v.x,v.z]; }, kind:'up', key:'net', cost:l=>Math.round(180*Math.pow(1.75,l)), max:5, show:()=>revealed('lake')&&rg('fisher')>=1, onBuy:()=>{ buildNets(); const c=nets.length?nets[nets.length-1].c:LC; celebrate(c.clone().setY(0),1.4); camShake=0.4; if(LAKE.dockPost) powerOn(LAKE.dockPost,c.clone()); }},
  {id:'fishhut', grp:'lake', ord:4, name:T('Balıkhane','Fish Shop'), desc:T('Hızlı ve pahalı satar, çok tutar','Sells fast & high, holds more'), res:'gold', pos:()=>{ const v=lat(LK.r+7.6,2.4); return [v.x,v.z]; }, kind:'up', key:'fishhut', cost:l=>Math.round(70*Math.pow(1.55,l)), max:5, show:()=>revealed('lake'), onBuy:()=>{ celebrate(HUT.clone(),1); pulseEnd(hut); hut.scale.setScalar(1+0.05*rg('fishhut')); if(LAKE.post) powerOn(LAKE.post); }},
];
for(const d of LPADS) makePad(d);

// ----- düşman görünümleri: sefere göre patron -----
const BOSSES={1:{n:T('Kabile Reisi','Chieftain'),hat:'horns'},2:{n:T('Korsan Kaptan','Pirate Captain'),hat:'pirate',c:0x2b3a8a,sc:0.95},3:{n:T('Dev Kurt','Dire Wolf'),hat:'wolf'},4:{n:T('Koçbaşı Ustası','Ram Master'),hat:'helm',c:0x8a5a2a,sc:1.05},5:{n:T('Ok Ustası','Master Archer'),hat:'hood',c:0x4f6b2f,sc:0.92},6:{n:T('Bataklık Cadısı','Swamp Witch'),hat:'witch',c:0x5b3a78,sc:0.95},7:{n:T('Demir Dev','Iron Giant'),hat:'iron',c:0x4a4f57,sc:1.3},8:{n:T('Korsan Kralı','Pirate King'),hat:'pirateKing',c:0xa01830,sc:1.1},9:{n:T('Buz Devi','Frost Giant'),hat:'frost',c:0x8fc8e8,sc:1.22},10:{n:T('Kara Kral','Black King'),hat:'crown',c:0x2a2a36,sc:1.15}};
const bossOf=()=>S.level<=10?(BOSSES[S.level]||BOSSES[1]):BOSSES[((S.level-11)%10)+1];
const bossName=()=>(S.level>10?T('Öfkeli ','Furious '):'')+bossOf().n;
/* F6: her patronun kendi silueti, rengi ve boyu var (boy: bossOf().sc, makeEnemy) */
const BLM={}; const bm=(c,e)=>BLM[c+'_'+(e||0)]||(BLM[c+'_'+(e||0)]=mat(c,e?{emissive:e}:undefined));
function applyBossLook(guy){ const B=bossOf(), R=guy.root, h=B.hat; const put=(o,x,y,z,par)=>{ o.position.set(x,y,z); (par||R).add(o); return o; };
  if(B.c) guy.g.traverse(o=>{ if(o.material===M.enemy) o.material=bm(B.c); });
  const noHelm=()=>R.children.forEach(o=>{ if(o.material===M.enemyHelm||o.material===M.enemyDark) o.visible=false; });
  const weapon=(list)=>{ guy.tool.visible=false; const w=new THREE.Group(); w.position.set(0,-0.34,0.05); list.forEach(o=>w.add(o)); guy.armR.add(w); };
  if(h==='horns'){ for(const sx of [-1,1]){ const c=put(mesh(G.cone,M.gold,0.14,0.5,0.14),0.3*sx,2.0,0); c.rotation.z=-0.4*sx; } }
  else if(h==='pirate'||h==='pirateKing'){ const k=h==='pirateKing'; noHelm(); const hc=bm(0x1d1d22); put(mesh(G.cyl,hc,k?1.0:0.8,0.08,k?0.62:0.5),0,1.95,0); put(mesh(G.cone,hc,k?0.62:0.5,k?0.55:0.45,k?0.42:0.35),0,2.2,0); put(mesh(G.box,bm(0x111111),0.18,0.12,0.05,false),0.18,1.55,0.52);
    if(k){ put(mesh(G.cyl,M.gold,0.64,0.08,0.44,false),0,2.02,0); const f=put(mesh(G.box,bm(0xf4f4f4),0.08,0.55,0.22),0.28,2.45,-0.1); f.rotation.z=-0.5; for(const sx of [-1,1]) put(mesh(G.box,M.gold,0.3,0.08,0.4),0.36*sx,1.04,0); const hk=mesh(G.cone,M.metal,0.06,0.3,0.06); hk.rotation.x=Math.PI; put(hk,0,-0.46,0,guy.armL); }
    else put(mesh(G.sph,M.metal,0.1,0.1,0.05,false),0,2.2,0.3); }
  else if(h==='helm'){ guy.g.traverse(o=>{ if(o.material===M.enemyHelm) o.material=bm(0x9a7a4a); }); for(const sx of [-1,1]){ const c=put(mesh(G.cone,bm(0xe6dcc4),0.22,0.8,0.22),0.5*sx,1.8,0.05); c.rotation.set(0.4,0,-1.7*sx); }
    const hd=mesh(G.box,M.iron,0.34,0.3,0.5); hd.position.z=0.9; const hn=mesh(G.cyl,M.handle,0.06,1.0,0.06); hn.rotation.x=Math.PI/2; hn.position.z=0.4; weapon([hn,hd]); }
  else if(h==='hood'){ noHelm(); put(mesh(G.cone,bm(0x3a2a1a),0.64,0.95,0.64),0,2.0,0); const bow=mesh(G.box,M.woodDark,0.07,1.2,0.07,false); bow.position.set(0,-0.3,0.12); guy.armL.add(bow); guy.tool.visible=false; const qv=put(mesh(G.cyl,bm(0x6a4a2a),0.16,0.6,0.16),-0.2,1.0,-0.3); qv.rotation.x=-0.3; }
  else if(h==='witch'){ noHelm(); const hc=bm(0x2a1a3a); put(mesh(G.cyl,hc,1.15,0.06,1.15),0,1.82,0); const tp=put(mesh(G.cone,hc,0.5,1.25,0.5),0,2.45,-0.05); tp.rotation.x=-0.25; put(mesh(G.box,bm(0x7ac943),0.5,0.1,0.52,false),0,1.9,0);
    const st=mesh(G.cyl,M.handle,0.06,1.8,0.06); st.position.set(0,0.4,0.25); const orb=mesh(G.sph,bm(0x9aff6a,0x3a9a1a),0.22,0.22,0.22,false); orb.position.set(0,1.35,0.25); weapon([st,orb]); }
  else if(h==='iron'){ noHelm(); const st=bm(0x7d8590); put(mesh(G.cyl,st,0.66,0.72,0.66),0,1.72,0); put(mesh(G.box,bm(0xff8a2a,0xc04a00),0.5,0.08,0.1,false),0,1.62,0.6); put(mesh(G.cone,st,0.3,0.3,0.3),0,2.2,0);
    for(const sx of [-1,1]){ put(mesh(G.sph,st,0.42,0.3,0.42),0.52*sx,1.08,0); const sp=put(mesh(G.cone,bm(0xff8a2a,0xc04a00),0.08,0.35,0.08,false),0.6*sx,1.35,0); sp.rotation.z=-0.5*sx; }
    const hd=mesh(G.box,bm(0x3d4148),0.5,0.45,0.6); hd.position.z=1.0; const hn=mesh(G.cyl,M.handle,0.07,1.1,0.07); hn.rotation.x=Math.PI/2; hn.position.z=0.45; weapon([hn,hd]); }
  else if(h==='frost'){ noHelm(); guy.g.traverse(o=>{ if(o.material===M.hair) o.material=bm(0xf2f6fa); }); const ic=bm(0xdff4ff,0x3a6a8a); for(let i=0;i<5;i++){ const a=i/5*6.283; const c=put(mesh(G.cone,ic,0.12,0.55,0.12,false),Math.sin(a)*0.34,2.0,Math.cos(a)*0.34); c.rotation.set(Math.cos(a)*0.3,0,-Math.sin(a)*0.3); }
    put(mesh(G.box,bm(0xf2f6fa),0.5,0.45,0.2),0,1.2,0.42); const cl=mesh(G.cone,ic,0.2,1.2,0.2); cl.rotation.x=Math.PI/2; cl.position.z=0.8; weapon([cl]); }
  else if(h==='crown'){ noHelm(); put(mesh(G.cyl,M.gold,0.42,0.3,0.42),0,2.0,0); for(let i=0;i<5;i++){ const a=i/5*6.283; put(mesh(G.cone,M.gold,0.08,0.26,0.08),Math.sin(a)*0.36,2.26,Math.cos(a)*0.36); }
    const cp=put(mesh(G.box,bm(0x5a2a8a),0.72,1.0,0.06),0,0.8,-0.3); cp.rotation.x=0.12; } }

// ----- EKONOMİ (F4): kaplar sefere göre büyür, fiyat seviyeyle geometrik artar, her kaynağın sona dek bir kullanımı var -----
// Odun: bölge yapılarının kuruluşu (Sv0) ve genişletmesi (Sv3), Genişlet, değirmen · Taş: sur + kulelerin orta seviyeleri · Kereste: kulelerin üst seviyeleri + bölge yapılarının çift seviyeleri (Sv4+)
// Demir: Delici Ok, Demir Kapı (10 seviye) + kulelerin en üst seviyeleri · Altın: geri kalan her şey + Kraliyet Haracı (taç)
const RSEF={lake:2,meadow:3,quarry:4,river:5,swamp:6,iron:7,coast:8,snow:9,dark:10};
// bölge pedi: [açıldığı seferdeki kap, sefer başına +kap, üst sınır, altın tabanı, seviye başına büyüme]
const G1=1.3; // bölge pedlerinde seviye başına altın büyümesi (işçi pedleri 1.9)
const EREG={rod:[3,1,10,55,G1], fisher:[2,1,3,90,1.9], net:[2,1,10,180,G1], fishhut:[3,1,10,70,G1],
  bow:[3,1,10,70,G1], hunter:[2,1,3,110,1.9], trap:[2,1,10,220,G1], smoke:[3,1,10,120,G1],
  cutter:[3,1,10,260,G1], qcart:[3,1,10,150,G1], mill:[3,1,10,300,G1], mcart:[3,1,10,160,G1],
  herbalist:[2,1,3,240,1.9], farm:[2,1,10,420,G1], cauldron:[3,1,10,200,G1],
  ironArrow:[3,1,10,20,1.35], ironWall:[3,1,10,25,1.35], miner:[2,1,3,320,1.9], drill:[2,1,10,620,G1], forge:[3,1,10,260,G1],
  lighthouse:[3,1,10,420,G1], boat:[2,1,10,760,G1], harbor:[3,1,10,560,G1],
  jeweler:[3,1,10,460,G1], cminer:[2,1,3,560,1.9], cdrill:[2,1,10,1100,G1]};
// ayar katsayıları (tam sefer benzetimiyle ayarlandı: yeni açılan seviyeler ≈ seferin gelirinin %60-90'ı; kaynak seviyeleri ≈ o kaynağın sefer üretimi)
const ECK={gold:1.8, base:1.0, wood:1.2, plank:1, stone:1, iron:1};
const ERES=(r,ok)=>ok?r:'gold';
const WOOD_CAP=()=>250+60*S.level; /* FX2: bölge odun seviyeleri en çok 250+60×sefer (sefer 10: 850): geç oyunda altın seviyeleri odun kapısında birikmesin */
function econRegion(d){ const E=EREG[d.id]; const c0=E[3], g=E[4];
  if(d.id==='ironArrow'||d.id==='ironWall'){ d.res='iron'; d.cost=l=>Math.round(ECK.iron*c0*Math.pow(g,l)); return; }
  // Sv0 kuruluş ve Sv3 genişletme odunla (odunun sona dek kullanımı), Sv4+ çift seviyeler kereste, gerisi altın
  d.res=l=>(l===0||l===3)?'wood':(l>=4&&l%2===0)?ERES('plank',revealed('river')):'gold';
  d.cost=l=>{ const r=d.res(l); return r==='wood'?Math.round(Math.min(ECK.wood*c0*(l===0?1:Math.pow(g,l-1)),WOOD_CAP())):r==='plank'?Math.round(ECK.plank*(25+0.1*c0)*Math.pow(1.5,(l-4)/2)):Math.round(ECK.gold*c0*Math.pow(g,l-1)); }; }
// kule: Sv0 odun, 1-5 altın (eskisi gibi), 6 taş, 7 altın, 8 kereste, 9 altın, 10 demir, 11 taş (kaynağın bölgesi açık değilse altın)
const ETW=['gold','gold','gold','gold'], ETC={stone:110,plank:60,iron:16,gold:700}; /* F9a: 13+ kule seviyeleri altınla (×1.3/seviye): taş+kereste sura, demir Delici Ok/Demir Kapı'ya kalır; sabit gelirli kaynakta seviye duvarı olmaz */
function econTower(d){ const t=S.towers[d.ti]; const cK=()=>t.k==='c'?1.6:t.side==='C'?1.3:1;
  const rOf=l=>l>=13?(r=>ERES(r,r==='gold'||revealed(r==='stone'?'quarry':r==='plank'?'river':'iron')))(ETW[(l-13)%4]):l===0?'wood':l<=5?'gold':(l===6||l===11)?ERES('stone',revealed('quarry')):l===8?ERES('plank',revealed('river')):l===10?ERES('iron',revealed('iron')):'gold';
  d.res=rOf; const old=d.cost;
  d.cost=l=>{ if(l<=5) return old(l); if(l>=13){ const r=rOf(l), j=l-12, c=ETC[r]||ETC.gold; return Math.round(c*Math.pow(1.3,j)*cK()); } /* F9a: sonsuz kule seviyeleri: taş/kereste/demir/altın sırayla, geometrik */ const r=rOf(l); const k=cK(); return r==='stone'?Math.round(ECK.stone*(l>=11?90:45)*k):r==='plank'?Math.round(ECK.plank*45*k):r==='iron'?Math.round(ECK.iron*12*k):Math.round(ECK.base*155*Math.pow(1.22,l-5)*k); }; }
function econBase(d){ const old=d.cost;
  if(d.id==='wall'){ const r0=d.res; d.res=l=>l>=14&&l%2===1?ERES('plank',revealed('river')):r0(l); d.cost=l=>l<3?old(l):Math.round((l>=14&&l%2===1&&revealed('river')?0.6:1)*ECK.stone*50*Math.pow(1.45,Math.min(l,13)-3)*Math.pow(1.28,Math.max(0,l-13))); } /* F9a: 13+ (sonsuz) daha yumuşak artış; tek seviyeler kereste: taşı kulelerle paylaşmaz */
  else if(d.id==='soldier') d.cost=l=>l<6?old(l):Math.round(ECK.base*225*Math.pow(1.4,l-5));
  else if(d.id==='feet'||d.id==='trader') d.cost=l=>l<5?old(l):Math.round(ECK.base*(d.id==='feet'?160:215)*Math.pow(1.4,l-5));
  else if(d.id==='expand') d.cost=l=>l<1?old(l):Math.round(ECK.wood*150*Math.pow(2,l));
  else if(d.id==='stoneWorker') d.cost=l=>l<3?old(l):Math.round(ECK.base*200*Math.pow(1.6,l-3));
  else if(d.id==='lamp') d.cost=l=>Math.round((150+35*gw())*Math.pow(1.25,l)); /* fener: seferin ekonomisine göre, sisi kaldırmak gerçek bir karar */ }
function econPatch(d){ if(d._econ) return; d._econ=1; if(d.kind==='tower') econTower(d); else if(EREG[d.id]) econRegion(d); else econBase(d); }
function capOf(d,L){ const e=Math.max(0,L-LEVELS); /* F9a: Sonsuz Kuşatma: savunma pedlerinin kabı her sefer +1 (maliyet geometrik: hep alınacak bir şey var) */ if(d.kind==='tower') return L<=3?6:Math.min(12,3+L)+e;
  const E=EREG[d.id]; if(E){ const R=RSEF[d.grp]||1; return Math.max(0,Math.min(E[2],Math.floor(E[0]+E[1]*Math.max(0,L-R))))+(d.id==='ironArrow'||d.id==='ironWall'?e:0); }
  switch(d.id){ case 'wall': return revealed('quarry')?Math.min(13,3+L)+e:3; case 'soldier': return Math.min(12,3+L)+e+Math.floor(Math.min(4,rg('smoke'))/2); case 'worker': return Math.min(6,2+L);
    case 'feet': case 'trader': return Math.min(12,3+L); case 'newCannon': return Math.min(8,1+L); case 'expand': return Math.min(4,1+Math.floor(L/2)); case 'stoneWorker': return revealed('quarry')?4:0; /* taş kayaları sınırlı: 4'ten fazlası bir şey katmaz */ case 'lamp': return 4; case 'tribute': return 9999; }
  return d.max; }
// darboğaz: aşağı akıştaki adım (dükkân, kulübe, kazan, ocak, kuyumcu, araba) çıktıyı sınırlıyorsa üstteki yükseltme hiçbir şey katmaz → kilitli + ipucu; rehber darboğazı öne alır
const BN_DOWN={fisher:'fishhut',net:'fishhut',hunter:'smoke',trap:'smoke',herbalist:'cauldron',farm:'cauldron',miner:'forge',drill:'forge',cminer:'jeweler',cdrill:'jeweler',cutter:'qcart',qcart:'cutter',mill:'mcart',mcart:'mill'};
function supplyOf(id){ switch(id){ case 'fisher': case 'net': return fishers.length/7+netRate(); case 'hunter': case 'trap': return hunters.length*2/10+trapRate()*2;
  case 'herbalist': case 'farm': return herbalists.length*2/5.5+farmRate(); case 'miner': case 'drill': return (miners.length*3/6+drillRate())/3; case 'cminer': case 'cdrill': return cminers.length*2/6.5+cdRate();
  case 'cutter': return cutRate(); case 'qcart': return cartThru('quarry'); case 'mill': return millRate(); case 'mcart': return cartThru('mill')/2; } return 0; }
function demandOf(id){ switch(id){ case 'fishhut': return 1/hutSellT(); case 'smoke': return 1/hhutSellT(); case 'cauldron': return 2/brewT(); case 'forge': return Math.min(1/smeltT(),cartThru('iron')); case 'jeweler': return 1/jewSellT();
  case 'qcart': return cartThru('quarry'); case 'cutter': return cutRate(); case 'mcart': return cartThru('mill')/2; case 'mill': return millRate(); } return 1e9; }
function padBlockOf(pd){ const d=pd.def, dn=BN_DOWN[d.id]; if(!dn||!revealed(d.grp)||padLevel(d)<=0) return null; /* ilk kuruluş hep serbest */ const dp=padById[dn]; if(!dp||padLevel(dp.def)>=dp.def.max||!dp.def.show()) return null;
  const s=supplyOf(d.id), m=demandOf(dn); const k=(d.id==='qcart'||d.id==='mcart')?1.25:0.95; return s>=m*k?dn:null; }
// rehber: Haraç yalnız gerçek fazlalıkta (altın ≥ 2× fiyat) önerilir
// kulelerin taş seviyesi suru aç bırakmasın: sur taşla yükseltilebiliyorken rehber taşı önce sura yollar (sur canı kulelerden önce gelir)
function guideSkip(pd){ if(pd.def.id==='tribute') return waveActive||S.coins<padCost(pd)*2; /* gece hiç: kapıyı savun */ if(pd.def.kind==='tower'&&padRes(pd)==='stone'){ const w=padById.wall; if(w&&padVisible(w)&&padRes(w)==='stone'&&(!endless()||padCost(w)-(S.paid[w.def.id]||0)<=1.5*S.stone)) return true; } return false; } /* F9a: sonsuzda sur hep bir üst seviye ister: kule taşı yalnız sur alınabilirken bekler */
function blockHint(pd){ const dp=padById[pd.block]; const n=dp?dp.def.name:''; return T(`⬆ Önce şunu geliştir: ${n} (üretimi o yavaşlatıyor)`,`⬆ Upgrade the ${n} first: it's slowing production`); }
function blockShort(pd){ const dp=padById[pd.block]; const n=dp?dp.def.name:''; return T(`⬆ Önce geliştir: ${n}`,`⬆ First upgrade: ${n}`); } /* FX3: rehber hapı için kısa biçim */
let BN=new Set(); // şu an darboğaz olan (önce yükseltilmesi gereken) ped kimlikleri
function applyCaps(){ const L=S.level; const bn=new Set(); for(const pd of pads){ const d=pd.def; econPatch(d); d.max=capOf(d,L); pd.block=null; } for(const pd of pads){ const b=padBlockOf(pd); if(b){ pd.block=b; bn.add(b); } } BN=bn; }
// Kraliyet Haracı: bankada gerçekten işe yaramayan altın için tekrarlanabilir yutak; her ödeme 1 taç, fiyatı her seferinde yükselir
// haraç pedi: kalenin içinde boş bir köşe (eski kayıtlarda oyuncunun koyduğu topçu kulesinin üstüne düşmesin)
let tribPos=null; function tributePos(){ if(tribPos) return tribPos; const C=[[5.4,2.9],[2.9,2.9],[2.9,5.4],[5.4,5.4],[0,5.4],[-5.4,5.4]]; const used=[]; S.towers.forEach(t=>{ if(t.x!==undefined) used.push([t.x,t.z]); if(t.px!==undefined) used.push([t.px,t.pz]); });
  tribPos=C.find(c=>used.every(u=>Math.hypot(u[0]-c[0],u[1]-c[1])>3.0))||C[0]; return tribPos; }
makePad({id:'tribute', ord:10, name:T('Kraliyet Haracı','Royal Tribute'), desc:T('Altını taca çevir (fiyat her seferinde artar)','Turn gold into a crown (price rises each time)'), res:'gold', pos:()=>tributePos(), kind:'up', key:'tribute', cost:()=>Math.round((600+120*S.level)*Math.pow(1.12,S.meta.trib||0)), max:9999, show:()=>S.level>=3, onBuy:()=>{ if(padById.tribute) padById.tribute.needLeave=true; /* her haraç bilinçli: bir sonrakine basmak için pedden çık-gir */ S.meta.trib=(S.meta.trib||0)+1; S.meta.crowns=(S.meta.crowns||0)+1; floatText(player.g.position.clone(),'👑 +1','green'); toast(T('👑 +1 taç · Krallıkta harca','👑 +1 crown · spend it in the Kingdom'),'good'); }});
PAD_IC.tribute='👑';

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
  const posts=[], rails=[]; for(let i=0;i<=22;i++){ const a=Math.atan2(-MDIR.z,-MDIR.x)-1.3+i*(2.6/22); const x=MC.x+Math.cos(a)*(MD.r+1.6), z=MC.z+Math.sin(a)*(MD.r+1.6); if(i!==11) posts.push({x,y:0.5,z,sx:.16,sy:1,sz:.16,c:0x7d5124}); /* ortada geçit: kuzeydeki bölgelere yol */ if(i<22&&i!==10&&i!==11){ const a2=a+(2.6/22)/2; rails.push({x:MC.x+Math.cos(a2)*(MD.r+1.6),y:0.7,z:MC.z+Math.sin(a2)*(MD.r+1.6),ry:-a2,sx:.1,sy:.12,sz:(MD.r+1.6)*(2.6/22)+0.1,c:0xb5803f}); } }
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
  hhut.position.copy(HHUT); hhut.rotation.y=Math.atan2(MDIR.x,MDIR.z); scene.add(hhut); bakeStatic(hhut); /* F6 */ chimneyTop=HHUT.clone().add(new THREE.Vector3(0,3.9,0)); })();
const hhutLbl=addLabel(HHUT,'',4.3); hhutLbl.near=-1; hhutLbl.el.classList.add('machLbl');
const meatPile=makePile(mat2(MD.r+6.6,7.2),()=>Math.round((220+160*rg('smoke'))*(1+0.12*S.level))); meatPile.id='meatPile';
const HUNT=[{k:'tavsan',n:T('Tavşan','Rabbit'),hp:1,meat:1,spd:5.6,w:45,c:0xf2efe8},{k:'geyik',n:T('Geyik','Deer'),hp:2,meat:3,spd:6.4,w:38,c:0xc08a52},{k:'domuz',n:T('Yaban Domuzu','Wild Boar'),hp:4,meat:5,spd:3.8,w:14,c:0x5a4030},{k:'ak_geyik',n:T('Ak Geyik','White Stag'),hp:6,meat:10,spd:7,w:2,c:0xffffff}];
const meatCap=()=>12+4*S.lv.feet;
const meatPrice=()=>(2.5+0.45*gw())*(1+0.15*rg('smoke'))*(rg('smoke')>0?1.4:1);
const hhutCap=()=>30+15*rg('smoke'); const hhutSellT=()=>2.8*Math.pow(0.8,rg('smoke'));
let hhutT=0, meatDropT=0; const smoke=[];
function updateHHut(dt){ if(!revealed('meadow')) return; meadowFx(dt); const st=S.rg.huntMeat||0; setStack(hhutMeat,Math.min(20,st)); hhutT-=dt;
  if(st>0&&hhutT<=0&&pileVal(meatPile)<meatPile.capFn()-0.5){ hhutT=hhutSellT(); S.rg.huntMeat=st-1; stat('meat'); pileAdd(meatPile,meatPrice()); pulse(hhut,0.05); fly(HHUT.clone().setY(1.4),meatPile.pos.clone().setY(0.8),null,false,4); }
  if(rg('smoke')>0){ const sm=smoke.find(s=>s.t<=0); if(Math.random()<dt*6){ const s=sm||(()=>{ const m=new THREE.Mesh(G.sph,new THREE.MeshLambertMaterial({color:0xdddddd,transparent:true,opacity:0.7,depthWrite:false})); scene.add(m); const o={m,t:0}; smoke.push(o); return o; })(); s.t=2.2; s.m.position.copy(chimneyTop).add(new THREE.Vector3(rand(-.2,.2),0,rand(-.2,.2))); s.m.visible=true; } }
  for(const s of smoke){ if(s.t<=0){ s.m.visible=false; continue; } s.t-=dt; const k=1-s.t/2.2; s.m.position.y+=dt*1.4; s.m.position.x+=dt*0.4; s.m.scale.setScalar(0.25+k*0.9); s.m.material.opacity=0.6*(1-k); }
  const p=player.g.position; if((S.meat||0)>0&&Math.hypot(p.x-HHUT_FRONT.x,p.z-HHUT_FRONT.z)<3.0){ meatDropT-=dt; if(meatDropT<=0&&(S.rg.huntMeat||0)<hhutCap()){ meatDropT=0.06; S.meat--; setBack(player); S.rg.huntMeat=(S.rg.huntMeat||0)+1; fly(p.clone().setY(1.6),HHUT.clone().setY(1.3),null,'meat',5); SFX.sell(); } }
  const k=(S.rg.huntMeat||0)+'|'+hhutCap()+'|'+rg('smoke'); if(hhutLbl._k!==k){ hhutLbl._k=k; const full=(S.rg.huntMeat||0)>=hhutCap(); hhutLbl.el.innerHTML=`🍖 ${S.rg.huntMeat||0}/${hhutCap()}${full?' <b class="full">'+T('DOLU','MAX')+'</b>':''}`; } }
function toHHut(from,n){ for(let i=0;i<n;i++) later(i*0.11,()=>{ if((S.rg.huntMeat||0)>=hhutCap()) return; S.rg.huntMeat=(S.rg.huntMeat||0)+1; fly(from.clone(),HHUT.clone().setY(1.3),null,'meat',2.2); }); }
// ----- hayvanlar -----
function animalMesh(k){ const g=new THREE.Group(); const b=new THREE.Group(); g.add(b); const legs=[]; let head;
  if(k==='tavsan'){ const body=mesh(G.sph,mat(0xf2efe8),0.34,0.3,0.42); body.position.y=0.32; head=new THREE.Group(); head.position.set(0,0.52,0.3); const hd=mesh(G.sph,mat(0xf2efe8),0.22,0.22,0.22); const e1=mesh(G.box,mat(0xf2efe8),0.07,0.34,0.05); e1.position.set(-0.08,0.28,-0.02); const e2=e1.clone(); e2.position.x=0.08; const ey=mesh(G.sph,M.pupil,0.04,0.04,0.03,false); ey.position.set(0.1,0.04,0.15); const ey2=ey.clone(); ey2.position.x=-0.1; head.add(hd,e1,e2,ey,ey2); const tail=mesh(G.sph,mat(0xffffff),0.1,0.1,0.1,false); tail.position.set(0,0.4,-0.38); b.add(body,head,tail); }
  else { const deer=k==='geyik'||k==='ak_geyik'; const col=k==='ak_geyik'?0xfaf8f2:deer?0xc08a52:0x5a4030; const L=deer?0.62:0.42; const body=mesh(G.box,mat(col),deer?0.55:0.75,deer?0.55:0.65,deer?1.2:1.15); body.position.y=L+0.25; head=new THREE.Group(); head.position.set(0,L+(deer?0.75:0.3),deer?0.72:0.7);
    const hd=mesh(G.box,mat(col),deer?0.32:0.5,deer?0.34:0.45,deer?0.5:0.5); head.add(hd); const ey=mesh(G.sph,M.pupil,0.05,0.05,0.04,false); ey.position.set(0.14,0.06,0.15); const ey2=ey.clone(); ey2.position.x=-0.14; head.add(ey,ey2);
    if(deer){ const neck=mesh(G.box,mat(col),0.26,0.55,0.26); neck.position.set(0,L+0.5,0.5); neck.rotation.x=-0.4; b.add(neck); const tail=mesh(G.box,mat(0xffffff),0.14,0.2,0.1,false); tail.position.set(0,L+0.4,-0.62); b.add(tail); if(Math.random()<0.6||k==='ak_geyik'){ for(const s of [-1,1]){ const an=mesh(G.cyl,mat(k==='ak_geyik'?0xffd23f:0xe8d6b0),0.04,0.5,0.04,false); an.position.set(0.12*s,0.4,-0.05); an.rotation.z=-0.4*s; const tip=an.clone(); tip.position.set(0.25*s,0.55,0.05); tip.rotation.z=0.6*s; tip.scale.y=0.6; head.add(an,tip); } } }
    else { const sn=mesh(G.box,mat(0x7a5a48),0.28,0.22,0.2); sn.position.set(0,-0.08,0.32); const t1=mesh(G.cone,mat(0xfff4dc),0.05,0.2,0.05,false); t1.position.set(0.12,-0.02,0.38); t1.rotation.x=-0.6; const t2=t1.clone(); t2.position.x=-0.12; head.add(sn,t1,t2); const mane=mesh(G.box,mat(0x3a2a20),0.2,0.2,0.9,false); mane.position.set(0,L+0.62,0); b.add(mane); }
    for(const [x,z] of [[-0.18,0.4],[0.18,0.4],[-0.18,-0.4],[0.18,-0.4]]){ const lg=new THREE.Group(); lg.position.set(x*(deer?1:1.4),L,z*(deer?1.1:1)); const lm=mesh(G.box,mat(deer?0x8a5a30:0x3a2a20),0.12,L,0.12); lm.position.y=-L/2; lg.add(lm); b.add(lg); legs.push(lg); } b.add(body,head); }
  blobAdd(g,0.6); return {g,b,legs,head,ph:rand(0,6)}; } /* FX4: yuvarlak gölge */
const animals=[]; let spawnAT=0;
function spawnAnimal(){ let tot=0; for(const h of HUNT) tot+=h.w; let r=Math.random()*tot, H=HUNT[0]; for(const h of HUNT){ r-=h.w; if(r<=0){ H=h; break; } } const a=rand(0,6.28), rr=rand(3,MD.r-1); const m=animalMesh(H.k); m.g.position.set(MC.x+Math.cos(a)*rr,0,MC.z+Math.sin(a)*rr); m.g.rotation.y=rand(0,6); m.g.scale.setScalar(0.01); scene.add(m.g); animals.push({H,m,hp:H.hp,tx:null,tz:null,wait:rand(0,2),pop:0,hit:0,claimed:null}); }
function killAnimal(a,byHunter){ const i=animals.indexOf(a); if(i>=0) animals.splice(i,1); scene.remove(a.m.g); const pos=a.m.g.position.clone(); burst(pos.clone().setY(0.6),10,M.meat,1.1); sfxAt(pos).die();
  const n=Math.max(1,Math.round(a.H.meat*(1+0.25*rg('bow')))); S.book.hunt[a.H.k]=(S.book.hunt[a.H.k]||0)+1; const first=S.book.hunt[a.H.k]===1;
  if(byHunter){ toHHut(pos.clone().setY(0.6),n); }
  else { questEvent('hunt',1); const got=Math.max(0,Math.min(n,meatCap()-(S.meat||0)-meatFly)); meatFly+=got; for(let j=0;j<got;j++){ setTimeout(()=>fly(pos.clone().setY(0.6),player.g,()=>{ meatFly=Math.max(0,meatFly-1); if((S.meat||0)<meatCap()){ S.meat=(S.meat||0)+1; setBack(player); } },'meat',3.2),j*70); } floatText(pos,T(a.H.n+' +'+got+' et',a.H.n+' +'+got+' meat')+(got<n?' · MAX':''),first?'green':got<n?'red':''); if(first&&a.H.k!=='tavsan'){ banner(T('Yeni av: '+a.H.n,'New prey: '+a.H.n),T('📖 Deftere eklendi','📖 Added to book'),'day'); SFX.fanfare(); } if(a.H.k==='ak_geyik'){ celebrate(pos,1); camShake=0.3; } } }
function hurtAnimal(a,dmg,byHunter){ a.hp-=dmg; a.hit=0.2; sfxAt(a.m.g.position).hit(); if(a.hp<=0) killAnimal(a,byHunter); }
let huntCd=0, meatFly=0, meatFullT=0;
function updateAnimals(dt){ const p=player.g.position; const target=7+2*rg('trap'); spawnAT-=dt; if(animals.length<target&&spawnAT<=0){ spawnAT=3.5/(1+0.25*rg('trap')); spawnAnimal(); } /* F4: tuzak av sıklığını da artırır (sabit 3.5 sn avcıları sınırlıyordu) */
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
  // çanta doluyken av yok (et boşa gitmesin, hayvanlar avcılara kalır); yakında hayvan varsa 'Çanta dolu' yazar
  huntCd-=dt; meatFullT-=dt; const bagFull=(S.meat||0)+meatFly>=meatCap(); if(huntCd<=0&&!nearestEnemy(p,4)){ let best=null,bd=2.7+0.15*rg('bow'); for(const a of animals){ const d=Math.hypot(a.m.g.position.x-p.x,a.m.g.position.z-p.z); if(d<bd){ bd=d; best=a; } } if(best&&bagFull){ if(meatFullT<=0){ meatFullT=2.5; floatText(p,T('🍖 Çanta dolu','🍖 Bag full'),'red'); } best=null; } if(best){ huntCd=0.42; player.swing=0.3; SFX.slash(); const ang=Math.atan2(best.m.g.position.x-p.x,best.m.g.position.z-p.z); player.g.rotation.y=ang; slash.position.set(p.x,1.4,p.z); slash.rotation.z=-ang+Math.PI/2; slashT=0.22; hurtAnimal(best,1+0.5*rg('bow'),false); } } }
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
  {id:'bow', grp:'meadow', ord:1, name:T('Av Bıçağı','Hunting Knife'), desc:T('Daha sert vur, çok et al','Hit harder, get more meat'), res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-7.4); return [v.x,v.z]; }, kind:'up', key:'bow', cost:l=>Math.round(70*Math.pow(1.55,l)), max:5, show:()=>revealed('meadow')},
  {id:'hunter', grp:'meadow', ord:2, name:T('Avcı','Hunter'), desc:T('Senin yerine avlanır','Hunts for you'), res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-4.7); return [v.x,v.z]; }, kind:'up', key:'hunter', cost:l=>Math.round(110*Math.pow(1.7,l)), max:3, show:()=>revealed('meadow'), onBuy:()=>{ addHunter(); celebrate(hunters[hunters.length-1].guy.g.position.clone(),1); }},
  {id:'trap', grp:'meadow', ord:3, lock:T('Bir avcı','1 Hunter'), name:T('Tuzak','Trap'), desc:T('Makine: av kendiliğinden gelir','Machine: auto-catches prey'), res:'gold', pos:()=>{ const v=mat2(MD.r+7.2,-2.0); return [v.x,v.z]; }, kind:'up', key:'trap', cost:l=>Math.round(220*Math.pow(1.75,l)), max:5, show:()=>revealed('meadow')&&rg('hunter')>=1, onBuy:()=>{ buildTraps(); const t=traps[traps.length-1]; if(t) celebrate(t.c.clone(),1.4); camShake=0.4; if(MDW.post) powerOn(MDW.post,t?t.c.clone():null); }},
  {id:'smoke', grp:'meadow', ord:4, name:T('Tütsühane','Smokehouse'), desc:T('Et pahalı satılır, +asker hakkı','Meat sells high, +Soldier slots'), res:'gold', pos:()=>{ const v=mat2(MD.r+7.6,2.4); return [v.x,v.z]; }, kind:'up', key:'smoke', cost:l=>Math.round(120*Math.pow(1.6,l)), max:5, show:()=>revealed('meadow'), onBuy:()=>{ celebrate(HHUT.clone(),1.2); pulseEnd(hhut); hhut.scale.setScalar(1+0.05*rg('smoke')); if(MDW.post) powerOn(MDW.post); }},
];
for(const d of MPADS) makePad(d);
// ----- kurt (düşman) -----
function makeWolf(big){ const g=new THREE.Group(); const b=new THREE.Group(); g.add(b); const col=big?mat(0x4a4f5a):mat(0x7d828c), dark=mat(0x3a3e46);
  const body=mesh(G.box,col,0.55,0.5,1.25); body.position.y=0.72; const chest=mesh(G.box,mat(0xd8d4cc),0.45,0.35,0.3,false); chest.position.set(0,0.62,0.55); const head=new THREE.Group(); head.position.set(0,1.0,0.75);
  const hd=mesh(G.box,col,0.42,0.38,0.42); const sn=mesh(G.box,col,0.24,0.2,0.34); sn.position.set(0,-0.06,0.32); const nose=mesh(G.box,dark,0.1,0.08,0.06,false); nose.position.set(0,-0.02,0.5); const e1=mesh(G.sph,mat(0xffd23f,{emissive:0x886600}),0.05,0.05,0.04,false); e1.position.set(0.12,0.07,0.21); const e2=e1.clone(); e2.position.x=-0.12;
  const ear1=mesh(G.cone4,col,0.1,0.22,0.08); ear1.position.set(0.12,0.28,-0.02); const ear2=ear1.clone(); ear2.position.x=-0.12; head.add(hd,sn,nose,e1,e2,ear1,ear2); const tail=mesh(G.box,col,0.14,0.14,0.6); tail.position.set(0,0.85,-0.8); tail.rotation.x=0.6;
  b.add(body,chest,head,tail); const legs=[]; for(const [x,z] of [[-0.17,0.42],[0.17,0.42],[-0.17,-0.42],[0.17,-0.42]]){ const lg=new THREE.Group(); lg.position.set(x,0.55,z); const lm=mesh(G.box,dark,0.12,0.55,0.12); lm.position.y=-0.27; lg.add(lm); b.add(lg); legs.push(lg); }
  if(big){ const collar=mesh(G.cyl,M.enemy,0.32,0.12,0.32,false); collar.position.set(0,0.95,0.55); b.add(collar); for(let i=0;i<4;i++){ const sp=mesh(G.cone,M.metal,0.05,0.16,0.05,false); sp.position.set(-0.2+i*0.13,1.05,0.55); b.add(sp); } }
  blobAdd(g,0.7); return {g,b,legs,head,tail,ph:rand(0,6)}; } /* FX4: yuvarlak gölge */
function animWolf(w,dt,moving){ w.ph+=dt*(moving?15:3); const s=moving?Math.sin(w.ph)*0.8:0; w.legs.forEach((l,i)=>{ l.rotation.x=(i===0||i===3)?s:-s; }); w.b.position.y=moving?Math.abs(Math.sin(w.ph))*0.1:0; w.tail.rotation.y=Math.sin(w.ph*0.5)*0.4; }

// =====================================================================
// ---------- Yük arabaları: makinelerin ürününü kendiliğinden taşır ----------
// =====================================================================
const carts=[];
function makeCart(){ const g=new THREE.Group(); const bed=mesh(G.box,M.wood,1.5,0.35,2.2); bed.position.y=0.75; const rim=mesh(G.box,M.woodDark,1.6,0.35,0.12); rim.position.set(0,1.05,1.05); const rim2=rim.clone(); rim2.position.z=-1.05; const rim3=mesh(G.box,M.woodDark,0.12,0.35,2.2); rim3.position.set(0.75,1.05,0); const rim4=rim3.clone(); rim4.position.x=-0.75; g.add(bed,rim,rim2,rim3,rim4);
  const wheels=[]; for(const [x,z] of [[-0.85,0.6],[0.85,0.6],[-0.85,-0.6],[0.85,-0.6]]){ const w=new THREE.Group(); w.position.set(x,0.42,z); const wm=mesh(G.cyl,M.woodDark,0.42,0.14,0.42); wm.rotation.z=Math.PI/2; const hub=mesh(G.cyl,M.iron,0.12,0.18,0.12,false); hub.rotation.z=Math.PI/2; for(let k=0;k<4;k++){ const sp=mesh(G.box,M.wood,0.05,0.7,0.06,false); sp.rotation.x=k*Math.PI/4; w.add(sp); } w.add(wm,hub); g.add(w); wheels.push(w); }
  const shaft=mesh(G.box,M.woodDark,0.1,0.1,1.4); shaft.position.set(-0.35,0.8,1.8); const shaft2=shaft.clone(); shaft2.position.x=0.35; g.add(shaft,shaft2);
  const pony=makePony(); pony.g.position.set(0,0,2.9); g.add(pony.g);
  const cargo=new THREE.Group(); cargo.position.y=0.95; g.add(cargo); bakeStatic(g); for(const w of wheels) bakeStatic(w); scene.add(g); return {g,wheels,pony,cargo}; }
function cargoShow(C,type,n){ while(C.cargo.children.length) C.cargo.remove(C.cargo.children[0]); const k=Math.min(18,n); for(let i=0;i<k;i++){ const row=Math.floor(i/6), col=i%6; const m=type==='iron'?itemMesh(BAR_GEO,M.bar):type==='stone'?mesh(G.box,M.rock,0.42,0.32,0.42,false):type==='plank'?mesh(G.box,M.plank,1.1,0.12,0.3,false):mesh(G.log,M.log,1,1,1,false); if(type==='log') m.rotation.x=Math.PI/2; m.position.set(-0.45+(col%3)*0.45,0.12+row*0.3,col<3?-0.45:0.45); if(type==='plank'){ m.position.set(0,0.1+row*0.14+(col%3)*0.0,-0.8+col*0.32); } C.cargo.add(m); } }
// rota: noktalar dizisi; araba A ucunda yüklenir, B ucunda boşaltır, geri döner
function addCart(kind){ const C=makeCart(); const c={kind,C,seg:0,t:0,dir:1,wait:1,load:null,n:0,route:null}; c.route=cartRoute(kind); const p0=c.route[0]; C.g.position.set(p0[0],0,p0[1]); carts.push(c); return c; }
function cartRoute(kind,raw){ const inE=sidePos('E',0,-3), outE=sidePos('E',0,5), inW=sidePos('W',0,-3), outW=sidePos('W',0,5); let R;
  if(kind==='iron') R=ironRoute();
  else if(kind==='quarry') R=[[QOUT.x,QOUT.z],...CART_PATHS[0].slice(0,2),[CART_PATHS[0][2][0],CART_PATHS[0][2][1]],[outE[0],outE[1]],[inE[0],inE[1]],[DEPOT_FRONT.x,DEPOT_FRONT.z]];
  else R=[[DEPOT_FRONT.x,DEPOT_FRONT.z],[0,4],[inW[0],inW[1]],[outW[0],outW[1]],...CART_PATHS[1].slice().reverse(),[MILL_IN.x,MILL_IN.z]];
  return raw?R:avoidTowers(R); }
// araba yolları: bunların üstüne topçu kulesi kurulamaz; eski kayıtta yolda kalmış bir kulenin çevresinden dolaşılır
const cartRoutesRaw=()=>['quarry','mill','iron'].map(k=>cartRoute(k,true));
function avoidTowers(R){ const obs=[]; if(S.towers[0].lvl>=1) obs.push([0,0,2.8,3.4]); for(let j=9;j<S.towers.length;j++){ const t=S.towers[j]; if(t.x===undefined||t.lvl<1) continue; obs.push([t.x,t.z,2.4,2.9]); }
  for(const pd of pads){ if(!padVisible(pd)) continue; const q=pd.g.position; obs.push([q.x,q.z,2.0,2.6]); } /* F6: araba görünen pedlerin de üstünden geçmez, yanından dolaşır */
  const okPt=(x,z,sk)=>((Math.abs(x)<H-1&&Math.abs(z)<H-1)||!nearBase(x,z,1.5))&&!obs.some(o=>o!==sk&&Math.hypot(x-o[0],z-o[1])<o[2]);
  const dodge=(o,nx,nz)=>{ const d=Math.hypot(nx,nz)||1; for(const k of [1,1.4,1.9]) for(const sg of [1,-1]){ const x=o[0]+sg*nx/d*o[3]*k, z=o[1]+sg*nz/d*o[3]*k; if(okPt(x,z,o)) return [x,z]; } return null; };
  R=R.map((q,i)=>{ if(i===0||i===R.length-1) return q; for(const o of obs){ const dx=q[0]-o[0], dz=q[1]-o[1]; if(Math.hypot(dx,dz)<o[2]){ const r=dodge(o,dx||0.01,dz); if(r) return r; } } return q; }); /* ara nokta pedin/kulenin üstündeyse kenara */
  const out=[R[0]]; let guard=0; for(let i=1;i<R.length;i++){ let det=true; while(det&&guard++<40){ det=false; const [ax,az]=out[out.length-1], [bx,bz]=R[i], dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz||1;
      for(const o of obs){ const u=((o[0]-ax)*dx+(o[1]-az)*dz)/L2; if(u<0.01||u>0.99) continue; let nx=ax+dx*u-o[0], nz=az+dz*u-o[1]; if(Math.hypot(nx,nz)>=o[2]) continue; if(Math.hypot(nx,nz)<0.01){ nx=-dz; nz=dx; } const r=dodge(o,nx,nz); if(r){ out.push(r); det=true; break; } } }
    out.push(R[i]); } return out; }
const cartKey=kind=>kind==='quarry'?'qcart':kind==='iron'?'forge':'mcart'; const cartCap=kind=>10+6*rg(cartKey(kind)); const cartSpd=kind=>7+1.6*rg(cartKey(kind));
function cartArrive(c,end){ if(c.kind==='iron') return ironArrive(c,end); const pos=c.C.g.position.clone();
  if(c.kind==='quarry'){ if(end==='A'){ const n=Math.min(Math.floor(S.rg.cutOut||0),cartCap('quarry')); if(n<=0) return false; S.rg.cutOut-=n; c.load='stone'; c.n=n; cargoShow(c.C,'stone',n); return true; }
    if(c.n>0){ const n=c.n; for(let i=0;i<Math.min(10,n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),rotPt(DEPOT,1.1,0.9,1.1),null,'stone',4),i*60); S.stone+=n; setStonePile(Math.min(18,S.stone)); floatText(pos,T('+'+n+' taş','+'+n+' stone'),'',{key:'dstone',v:n,fmt:v=>T('+'+v+' taş','+'+v+' stone')}); sfxAt(DEPOT).sell(); c.n=0; cargoShow(c.C,'',0); } return true; }
  // değirmen arabası: depodan odun götürür, keresteyi getirir
  if(end==='A'){ if(c.n>0&&c.load==='plank'){ const n=c.n; for(let i=0;i<Math.min(10,n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),rotPt(DEPOT,-0.4,1.0,0.6),null,'plank',4),i*60); S.planks=(S.planks||0)+n; floatText(pos,T('+'+n+' kereste','+'+n+' planks'),'green',{key:'dplank',v:n,fmt:v=>T('+'+v+' kereste','+'+v+' planks')}); sfxAt(DEPOT).sell(); c.n=0; }
    const n=Math.min(Math.max(0,S.wood-15),cartCap('mill'),Math.max(0,millInCap()-(S.rg.millIn||0))); if(n<=0&&(S.rg.millOut||0)<1){ cargoShow(c.C,'',0); return false; } if(n>0){ S.wood-=n; setPile(Math.min(24,S.wood)); c.load='log'; c.n=n; cargoShow(c.C,'log',n); } else { c.load=null; c.n=0; cargoShow(c.C,'',0); } return true; }
  if(c.load==='log'&&c.n>0){ S.rg.millIn=(S.rg.millIn||0)+c.n; for(let i=0;i<Math.min(8,c.n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),MILL_IN.clone().setY(0.8),null,true,4),i*60); }
  const out=Math.min(Math.floor(S.rg.millOut||0),cartCap('mill')); S.rg.millOut=(S.rg.millOut||0)-out; c.load=out>0?'plank':null; c.n=out; cargoShow(c.C,out>0?'plank':'',out); return true; }
function cartSave(c){ if(!S.rg) return; S.rg['cart_'+c.kind]=c.n>0?{load:c.load,n:c.n}:null; }
function cartsRestore(){ if(!S.rg) return; for(const k of ['quarry','mill','iron']){ const sv=S.rg['cart_'+k]; S.rg['cart_'+k]=null; if(!sv||!(sv.n>0)) continue; if(sv.load==='stone') S.stone+=sv.n; else if(sv.load==='log') S.rg.millIn=(S.rg.millIn||0)+sv.n; else if(sv.load==='plank') S.planks=(S.planks||0)+sv.n; else if(sv.load==='iron') S.iron=(S.iron||0)+sv.n; } }
function updateCarts(dt){ for(const c of carts){ const g=c.C.g; if(c.wait>0){ c.wait-=dt; if(c.wait<=0){ const end=c.dir===1?'A':'B'; if(c.seg===0&&c.dir===1){ const go=cartArrive(c,'A'); cartSave(c); /* teslim edilen yük boş dönüşte de kayda geçer: yeniden yüklemede kopyalanmaz */ if(!go){ c.wait=2; continue; } c.route=cartRoute(c.kind); } } animCart(c,dt,false); continue; }
    const R=c.route; const i0=c.dir===1?c.seg:R.length-1-c.seg, i1=c.dir===1?c.seg+1:R.length-2-c.seg; const a=R[i0], b=R[i1]; const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1; c.t+=dt*cartSpd(c.kind)/len; const k=Math.min(1,c.t);
    g.position.set(a[0]+(b[0]-a[0])*k,0,a[1]+(b[1]-a[1])*k); const ang=Math.atan2(b[0]-a[0],b[1]-a[1]); let dr=ang-g.rotation.y; dr=Math.atan2(Math.sin(dr),Math.cos(dr)); g.rotation.y+=dr*Math.min(1,dt*6); animCart(c,dt,true);
    if(k>=1){ c.t=0; c.seg++; if(c.seg>=R.length-1){ c.seg=0; if(c.dir===1){ c.dir=-1; cartArrive(c,'B'); cartSave(c); c.wait=0.8; } else { c.dir=1; c.wait=0.8; } } } } }
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
function updateCutter(dt){ const l=rg('cutter'); cutter.visible=l>0; cutLbl.hide=l<=0; if(l<=0) return; const full=cutterFx(dt,l);
  setStack(cutStack,Math.min(24,Math.floor(S.rg.cutOut||0))); const k=Math.floor(S.rg.cutOut||0)+'|'+l+'|'+full; if(cutLbl._k!==k){ cutLbl._k=k; cutLbl.el.innerHTML=`<span class="stone-dot"></span> ${Math.floor(S.rg.cutOut||0)}/${cutCap()}${full?' <b class="full">'+T('DOLU','MAX')+'</b>':''}`; } }
const QPADS=[
  {id:'cutter', grp:'quarry', ord:1, name:T('Taş Kesme Tezgâhı','Stone Cutter'), desc:T('Makine: taş kendiliğinden kesilir','Machine: auto-cuts stone'), res:'gold', pos:()=>{ const v=qat(QD.r+5,-5.2); return [v.x,v.z]; }, kind:'up', key:'cutter', cost:l=>Math.round(260*Math.pow(1.7,l)), max:5, show:()=>revealed('quarry'), onBuy:()=>{ if(!carts.some(c=>c.kind==='quarry')) addCart('quarry'); cutter.scale.setScalar(1+0.06*(rg('cutter')-1)); celebrate(QCUT.clone(),1.4); camShake=0.4; if(CUT.post) powerOn(CUT.post); CUT.acc=99; }},
  {id:'qcart', grp:'quarry', ord:2, lock:T('Taş kesme tezgâhı','Stone Cutter'), name:T('Taş Arabası','Stone Cart'), desc:T('Araba çok taşır, hızlı gider','Bigger loads, faster cart'), res:'gold', pos:()=>{ const v=qat(QD.r+5,-2.6); return [v.x,v.z]; }, kind:'up', key:'qcart', cost:l=>Math.round(150*Math.pow(1.6,l)), max:5, show:()=>revealed('quarry')&&rg('cutter')>=1, onBuy:()=>{ const c=carts.find(c=>c.kind==='quarry'); if(c) celebrate(c.C.g.position.clone(),0.8); }},
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
function updateMill(dt){ const l=rg('mill'); mill.visible=l>0; millLbl.hide=l<=0; if(l<=0) return;
  wheel.rotation.z-=dt*(1.2+0.3*l); const working=millFx(dt,l);
  setStack(inStack,Math.min(20,Math.ceil((S.rg.millIn||0)/3))); setStack(plankStack,Math.min(24,Math.floor(S.rg.millOut||0)));
  const k=Math.floor(S.rg.millIn||0)+'|'+Math.floor(S.rg.millOut||0)+'|'+l; if(millLbl._k!==k){ millLbl._k=k; millLbl.el.innerHTML=working?`<span class="ics"><span class="log-dot"></span>${Math.floor(S.rg.millIn||0)}</span>`:`<span class="ics"><b class="full">⚠</b><span class="log-dot"></span></span>`; } }
const RPADS=[
  {id:'mill', grp:'river', ord:1, name:T('Su Değirmeni','Water Mill'), desc:T('Makine: odunu keresteye çevirir','Machine: turns wood into planks'), res:'gold', pos:()=>{ const v=rat(RV.r+2,-4.2); return [v.x,v.z]; }, kind:'up', key:'mill', cost:l=>Math.round(300*Math.pow(1.7,l)), max:5, show:()=>revealed('river'), onBuy:()=>{ if(!carts.some(c=>c.kind==='mill')) addCart('mill'); celebrate(MILL.clone(),1.6); camShake=0.5; if(MIL.post) powerOn(MIL.post); MIL.acc=99; }},
  {id:'mcart', grp:'river', ord:2, lock:T('Su değirmeni','Water Mill'), name:T('Kereste Arabası','Lumber Cart'), desc:T('Araba çok taşır, hızlı gider','Bigger loads, faster cart'), res:'gold', pos:()=>{ const v=rat(RV.r+2,-1.6); return [v.x,v.z]; }, kind:'up', key:'mcart', cost:l=>Math.round(160*Math.pow(1.6,l)), max:5, show:()=>revealed('river')&&rg('mill')>=1, onBuy:()=>{ const c=carts.find(c=>c.kind==='mill'); if(c) celebrate(c.C.g.position.clone(),0.8); }},
];
for(const d of RPADS) makePad(d);

// ----- sen yokken: işçi ve makineler üretir, balıkhane satar, para yığılır -----
// üret → depo (sınırlı) → satış → para yığını (sınırlı). Tam sayı; depo ya da yığın dolunca üretim durur (canlı oyundaki gibi)
function offChain(sec,rate,key,cap,sellT,price,P,bk){ const st0=Math.max(0,Math.floor(S.rg[key]||0)), v0=pileVal(P); const room=Math.max(0,Math.ceil((P.capFn()-0.5-v0)/price)), can=Math.floor(sec/sellT), have=Math.floor(st0+rate*sec);
  const sold=Math.max(0,Math.min(room,can,have)); if(sold>0&&(key==='hutFish'||key==='huntMeat')) stat(key==='hutFish'?'fish':'meat',sold); const st=Math.max(0,Math.min(cap,have-sold)); let val=sold*price;
  if(bk){ const b=S.rg[bk]||0, bb=st0?b*Math.min(sold,st0)/st0:0; val+=bb*price; S.rg[bk]=st>0?Math.max(0,b-bb):0; }
  pileAdd(P,val); S.rg[key]=st; return {made:Math.max(0,sold+st-st0),gold:Math.round(pileVal(P)-v0),full:(sold>=room&&room<Math.min(can,have))||st>=cap}; }
function cartThru(kind){ const R=cartRoute(kind); let len=0; for(let i=1;i<R.length;i++) len+=Math.hypot(R[i][0]-R[i-1][0],R[i][1]-R[i-1][1]); return cartCap(kind)/(2*len/cartSpd(kind)+2.6); } // araba: birim/sn
function offRow(o,l,v,g,full){ if(!v&&!g&&!full) return; (o.rows=o.rows||[]).push({l,v,g,full}); }
// F4: çevrimdışı en çok 2 saat; ham kaynak (odun/taş/kereste/demir) saat başına seferin kalan harcamasının en çok %25'i kadar, altın yığınları dolana dek
function sinkLeft(res){ let t=0; for(const pd of pads){ const d=pd.def; if(d.grp&&!revealed(d.grp)) continue; let sh=false; try{ sh=d.show(); }catch(e){} if(!sh||!(d.max>0)) continue; const l0=padLevel(d); for(let l=l0;l<d.max&&l<l0+12;l++){ const r=typeof d.res==='function'?d.res(l):d.res; if(r===res) t+=d.cost(l); } }
  const have=res==='wood'?S.wood+S.logs:res==='stone'?S.stone+(S.stones||0):res==='plank'?(S.planks||0):res==='iron'?(S.iron||0):0; return Math.max(0,t-have); }
function offCap(res,sec){ return Math.floor(0.25*sinkLeft(res)*sec/3600); }
// FX2: sen yokken altın GERÇEK üretim hızından ödenir (yalnız yığın kabından değil). Her zincir: canlı hız (üretim ile satış hızının küçüğü × fiyat),
// ama bir yığın saatte en çok OFF_TURN kez dolar (dikkatli bir oyuncunun toplama sıklığı) + köy vergisi. En çok OFF_H saat sayılır; yığına düşen altın bu toplamın içindedir, kalanı kesene girer.
const OFF_TURN=0.5, OFF_H=3;
function offParts(){ const P=[]; const add=(l,r,P0)=>{ r=Math.min(r,P0?P0.capFn()*OFF_TURN/3600:r); if(r>0.0001) P.push({l,r}); };
  add(T('Köy vergisi','Village taxes'),(60+30*gw())/3600);
  if(revealed('lake')) add(T('Balıkçılar ve ağlar','Fishers & nets'),Math.min(fishers.length/7+netRate(),1/hutSellT())*fishPrice(),fishPile);
  if(revealed('meadow')) add(T('Avcılar ve tuzaklar','Hunters & traps'),Math.min(hunters.length*2/10+trapRate()*2,1/hhutSellT())*meatPrice(),meatPile);
  if(typeof offParts6==='function') offParts6(add);
  return P; }
function offRate(){ return offParts().reduce((a,p)=>a+p.r,0); } /* altın/sn, çevrimdışı */
window.__offRate=()=>({rate:offRate(),parts:offParts()});
function offlineRun(sec){ const out={sec,fish:0,gold:0,wood:0,rows:[]}; const gift=typeof dailyGift==='function'&&S.started?dailyGift():0; if(gift){ out.gift=gift; out.streak=S.meta.streak||1; } /* FX2: günlük hediye dönüşte verilir (Krallık ekranına gizlenmez) */
  if(sec<60){ if(gift) out.rows.push({gift:1}); return out; } const sec0=sec, gsec=Math.min(sec,OFF_H*3600), orate=offRate(); if(sec>2*3600){ sec=2*3600; } out.sec=gsec; out.capped=sec0>OFF_H*3600;
  if(revealed('lake')){ const rate=fishers.length/7+netRate(); if(rate>0){ const r=offChain(sec,rate,'hutFish',hutCap(),hutSellT(),fishPrice(),fishPile,'hutB'); out.fish=r.made; out.gold+=r.gold; offRow(out,T('Balıkçılar ve ağlar','Fishers & nets'),r.made?T(`+${r.made} balık`,`+${r.made} fish`):'',r.gold,r.full); } }
  if(revealed('meadow')){ const rate=hunters.length*2/10+trapRate()*2; if(rate>0){ const r=offChain(sec,rate,'huntMeat',hhutCap(),hhutSellT(),meatPrice(),meatPile); out.meat=r.made; out.gold+=r.gold; offRow(out,T('Avcılar ve tuzaklar','Hunters & traps'),r.made?T(`+${r.made} et`,`+${r.made} meat`):'',r.gold,r.full); } }
  if(rg('cutter')>0&&carts.some(c=>c.kind==='quarry')){ const st0=Math.floor(sec*Math.min(cutRate(),cartThru('quarry'))*0.8), st=Math.min(st0,offCap('stone',sec)); if(st>0||st0>0){ S.stone+=st; out.stone=st; offRow(out,T('Taş kesme tezgâhı','Stone Cutter'),st>0?T(`+${st} taş`,`+${st} stone`):'',0,st<st0); } }
  const wood=Math.min(Math.round(sec/60*workers.filter(w=>w.kind!=='stone').length*9),offCap('wood',sec)+(rg('mill')>0?2*offCap('plank',sec):0)); if(wood>0){ S.wood+=wood; out.wood=wood; out.rows.unshift({l:T('Oduncular depoya','Lumberjacks to depot'),v:T(`+${wood} odun`,`+${wood} wood`)}); }
  if(rg('mill')>0&&carts.some(c=>c.kind==='mill')){ const pl=Math.max(0,Math.floor(Math.min(sec*Math.min(millRate(),cartThru('mill')/2)*0.8,(S.wood-15)/2,offCap('plank',sec)))); if(pl>0){ S.planks=(S.planks||0)+pl; S.wood-=pl*2; out.planks=pl; offRow(out,T('Su değirmeni','Water Mill'),T(`+${pl} kereste<small>−${2*pl} odun</small>`,`+${pl} planks<small>−${2*pl} wood</small>`)); } }
  setPile(Math.min(24,S.wood)); offline6(sec,out);
  const purse=Math.max(0,Math.round(orate*gsec)-out.gold); if(purse>0){ S.coins+=purse; out.purse=purse; out.rows.push({l:T('Vergi ve satış, kesene','Taxes & sales, to your purse'),v:'',g:purse}); } out.total=out.gold+(out.purse||0); out.rate=Math.round(orate*3600); /* FX2: yığın dolsa da üretim hızı kadar altın kesene akar (en çok OFF_H saat) */
  if(gift) out.rows.push({gift:1});
  return out; }
function showOffline(o){ const rows=(o.rows||[]).filter(r=>!r.gift); const gift=o.gift||0; if(!gift&&(o.sec<600||!rows.length)){ if(o.sec>=60&&o.purse>0) setTimeout(()=>toast(T(`💰 Sen yokken +${fmtN(o.purse)}`,`💰 While away +${fmtN(o.purse)}`)),1200); return false; } /* kısa yokluk (<10 dk) kart açmaz: oyun beklemeden sürer */ if(S.post||S.pendingReveal||F8busy()){ showOffline.pend=o; return false; } /* F8: patron sandığı/kazanma kartı/bölge açılışı bitene dek bekler */ const m=Math.round(o.sec/60); const card=document.createElement('div'); card.className='intro'; card.id='awayCard'; const full=rows.some(r=>r.full), none=rows.every(r=>r.full&&!r.v&&!r.g);
  /* FX2: dönüş kartı: başlıkta toplam altın, saatlik çevrimdışı hız, günlük hediye + 7 günlük seri */
  const tm=m>=60?T(Math.floor(m/60)+' saat'+(m%60?' '+(m%60)+' dakika':''),Math.floor(m/60)+' h'+(m%60?' '+(m%60)+' min':'')):T(m+' dakika',m+' min');
  const st=o.streak||S.meta.streak||1, nx=typeof giftOf==='function'?giftOf(st+1):0, pips=Array.from({length:7},(_,i)=>`<i class="${i<Math.min(7,st)?'on':''}${i===Math.min(7,st)-1?' now':''}">${i===6?'🎁':i+1}</i>`).join('');
  const giftH=gift?`<div class="gift dgift"><div>🎁 ${T(`Günlük hediye · ${st}. gün: <b>+${gift} 👑</b>`,`Daily gift · Day ${st}: <b>+${gift} 👑</b>`)}</div><div class="streak">${pips}</div><small>${T(`Yarın gel: +${nx} 👑 · her gün artar`,`Come back tomorrow: +${nx} 👑 · grows every day`)}</small></div>`:'';
  const awayH=rows.length&&o.sec>=60?`${o.total?`<div class="awayGold">💰 +${fmtN(o.total)}</div>`:''}<p>${T(`${tm} boyunca krallığın çalıştı.`,`Your kingdom worked for ${tm}.`)}${o.rate?T(` Sen yokken ≈${fmtN(o.rate)} altın/saat kazanır (en çok ${OFF_H} saat).`,` Away income ≈${fmtN(o.rate)} gold/h (up to ${OFF_H} h).`):''}</p><div class="away">${rows.map(r=>`<div><span>${r.l}</span><b>${[r.v,r.g?'💰 '+fmtN(r.g):''].filter(x=>x).join(' · ')}${r.full?` <em class="full">${T('dolu','full')}</em>`:''}</b></div>`).join('')}</div>${o.gold?`<p class="sub">${T(`💰 ${fmtN(o.gold)} altın yığınlarda seni bekliyor — yanına gidip topla.${o.purse?` 💰 ${fmtN(o.purse)} kesende.`:''}`,`💰 ${fmtN(o.gold)} gold is waiting in the piles — go grab it.${o.purse?` 💰 ${fmtN(o.purse)} is already in your purse.`:''}`)}</p>`:''}${none?`<p class="sub">${T('Her şey doluydu, bu yüzden üretim durdu. Yığınları topla, dükkânları geliştir.','Everything was full, so production stopped. Collect your piles and upgrade the shops.')}</p>`:full&&!o.total?`<p class="sub">⚠ ${T('Bir yığın ya da dükkân dolunca üretim durdu. Daha sık topla ya da dükkânı geliştir.','A pile or shop filled up and production stopped. Collect more often or upgrade the shop.')}</p>`:''}`:'';
  card.innerHTML=`<div class="card"><h1>${awayH?T('Sen yokken','While you were away'):T('Tekrar hoş geldin!','Welcome back!')}</h1>${giftH}${awayH}<button id="awayOk">${T('Devam et','Continue')}</button></div>`;
  document.body.appendChild(card); if(gift) setTimeout(()=>{ try{ SFX.fanfare(); }catch(e){} },200); $('awayOk').addEventListener('click',()=>{ audio(); card.remove(); }); return true; }

// ----- rehber: taşınan balığı götür, dolan yığını topla, boşken balık tut -----
// Her bölge için tek mantık. İş = elle topla → sırtta taşı → teslim et; satılan mal para yığınında birikir.
// Kararlar gecikmeli (histerezis): çanta ~%70 dolmadan ya da gün bitmeden teslime yollamaz, teslime başlayınca çanta boşalana dek sürer; seçilen yığın toplanana dek hedefte kalır
const GS={drop:{},pile:null,pileT:0};
function newRegion(){ for(const id in REG) if(REG[id].sefer===S.level&&revealed(id)) return id; return null; }
function fishDrop(){ const p=player.g.position; const whOk=revealed('coast')&&pileVal(coastPile)<coastPile.capFn()-0.5, hutOk=revealed('lake')&&(S.rg.hutFish||0)<hutCap();
  if(whOk&&(!hutOk||p.distanceTo(WH_FRONT)<p.distanceTo(HUT_FRONT))) return {t:WH_FRONT,text:T('Balıkları limanda sat','Sell fish at the Harbor')}; return hutOk?{t:HUT_FRONT,text:T('Balıkları balıkhaneye götür','Take fish to the Fish Shop')}:null; }
// kaya katı: rehber kayanın oyuncuya bakan kenarını gösterir (kazma menzili 3.4)
function rockSpot(r,p){ const dx=p.x-r.x, dz=p.z-r.z, d=Math.hypot(dx,dz)||1, k=r.s*0.8+PR+0.4; return new THREE.Vector3(r.x+dx/d*k,0,r.z+dz/d*k); }
const jobLoad=(P,st,cap)=>(P?pileVal(P)/P.capFn():0)+(cap?st/cap:0);
function rgJobs(){ const p=player.g.position, J=[];
  if(revealed('lake')) J.push({rg:'lake',key:'fish',n:S.fish||0,cap:fishCap(),g:()=>({t:DOCK_END,text:T('İskelede balık tut','Fish at the pier')}),d:fishDrop,P:fishPile,ok:()=>!!fishDrop(),load:jobLoad(fishPile,S.rg.hutFish||0,hutCap())});
  if(revealed('meadow')) J.push({rg:'meadow',key:'meat',n:S.meat||0,cap:meatCap(),g:()=>{ let best=null,bd=1e9; for(const a of animals){ const d=Math.hypot(a.m.g.position.x-p.x,a.m.g.position.z-p.z); if(d<bd){ bd=d; best=a; } } return best&&{t:best.m.g.position.clone(),text:T('Çayırda avlan','Hunt in the meadow')}; },
    d:()=>(S.rg.huntMeat||0)<hhutCap()?{t:HHUT_FRONT,text:T('Eti tütsühaneye götür','Take meat to the Smokehouse')}:null,P:meatPile,ok:()=>(S.rg.huntMeat||0)<hhutCap(),load:jobLoad(meatPile,S.rg.huntMeat||0,hhutCap())});
  if(revealed('quarry')) J.push({rg:'quarry',n:0,cap:1,intro:1,g:()=>{ const r=nearestRock(p,300); return r&&{t:rockSpot(r,p),text:T('Taş çıkar','Mine stone')}; }});
  jobs6(J); return J; }
// yeni bölgenin elle işi bir kez denendi mi (eski kayıtlarda defterden anlaşılır)
function rgTried(id){ const t=S.tried||(S.tried={}); if(t[id]) return true; const b=S.book||{}, has=o=>!!o&&Object.keys(o).length>0;
  const ok=id==='lake'?has(b.fish)&&Object.keys(b.fish).some(k=>!(FISH.find(f=>f.k===k)||{}).sea):id==='meadow'?has(b.hunt):id==='coast'?has(b.chest)||(FS.loc==='sea'&&(S.fish||0)>0):id==='quarry'?(S.stones||0)>0
    :id==='swamp'?(S.herb||0)>0:id==='iron'?(S.ore||0)>0:id==='snow'?(S.crystal||0)>0:true;
  if(ok) t[id]=1; return ok; }
function regionGuide(mode,arg){ const p=player.g.position, J=rgJobs(); for(const j of J) if(j.key&&!(j.n>0)) delete GS.drop[j.key];
  if(mode==='intro'){ if(waveActive||S.wave>1) return null; const id=newRegion(); if(!id||rgTried(id)) return null; const j=J.find(j=>j.rg===id), g=j&&j.g(); if(g&&waveT<2*Math.hypot(g.t.x-p.x,g.t.z-p.z)/Math.max(4,D.speed())+6) return null; /* F8: gün bitmeden dönülemeyecekse yollama */ return g?{t:g.t,text:'✨ '+g.text}:null; }
  if(mode==='carry'){ const ending=!waveActive&&waveT<9; let cb=null,cd=1e9; for(const j of J){ if(!(j.n>0)||!j.d) continue; const d=j.d();
      if(!d){ if(j.n>=j.cap&&j.P&&pileVal(j.P)>=1) return {t:j.P.pos,text:T('Yığın doldu — altınları topla','Pile full — collect gold')}; continue; }
      if(!GS.drop[j.key]&&(j.n>=Math.ceil(j.cap*0.7)||ending||(!waveActive&&!j.g()))&&!(j.key==='fish'&&FS.state==='bite')) GS.drop[j.key]=1;
      if(GS.drop[j.key]){ const P=j.P; if(P&&P.g.visible&&pileVal(P)>=P.capFn()*0.85&&P.pos.distanceTo(d.t)<14){ GS.pile=P; GS.pileT=gameT; return {t:P.pos,text:T('Yığın doldu — altınları topla','Pile full — collect gold'),v:()=>P.g.visible&&pileVal(P)>=3}; } const k=j.key, dd=Math.hypot(d.t.x-p.x,d.t.z-p.z); if(dd<cd){ cd=dd; cb=Object.assign({v:()=>(S[k]||0)>0},d); } } } return cb; } /* iki tür taşınıyorsa en yakın teslim yeri */
  if(mode==='pile'&&waveActive) return null;
  if(mode==='pile'){ // arg<0: yalnız dolmak üzere olan yığın (üretim durmasın) ya da zaten gidilen yığın; arg>0: alınamayan pedin eksik altını
    if(GS.pile&&(!GS.pile.g.visible||pileVal(GS.pile)<3||gameT-GS.pileT>25)) GS.pile=null;
    if(!GS.pile){ let best=null,bv=-1e9; for(const P of piles){ if(!P.g.visible) continue; const v=pileVal(P), c=P.capFn(); if(!(arg<0?v>=Math.max(20,c*0.85):v>=Math.min(c*0.5,150)||(v>=25&&v>=arg))) continue; const sc=v/c*100-Math.hypot(P.pos.x-p.x,P.pos.z-p.z)*0.3; if(sc>bv){ bv=sc; best=P; } } if(best){ GS.pile=best; GS.pileT=gameT; } }
    const P=GS.pile; return P?{t:P.pos,text:(pileVal(P)>=P.capFn()-0.5?T('Yığın doldu — altınları topla','Pile full — collect gold'):T('Altınları topla','Collect gold')),v:()=>P.g.visible&&pileVal(P)>=3}:null; }
  if(mode==='idle'){ if(waveActive||waveT<8) return null; /* gece ve gün biterken uzak bölgeye yollama */ const id=newRegion(); const dg=j=>{ const g=j.g(); return g?Math.hypot(g.t.x-p.x,g.t.z-p.z):1e3; }; const js=J.filter(j=>!j.intro&&(j.pri||j.n<j.cap)&&(!j.ok||j.ok())).map(j=>(j.dd=dg(j),j)).sort((a,b)=>(b.pri||0)-(a.pri||0)||((b.rg===id)-(a.rg===id))||((a.load||0)+a.dd/150)-((b.load||0)+b.dd/150)); /* F6: yük eşitse yakın bölge */
    for(const j of js){ const g=j.g(); if(g) return g; } return null; }
  return null; }

// ----- ana güncelleme -----
let capsT=0;
function updateRegions(dt){ updateRegionFx(dt); if(revealed('lake')){ updateFishing(dt); updateFishers(dt); updateNets(dt); updateHut(dt); const t=performance.now()/1000; for(const r of ripples){ r.t-=dt; if(r.t<=0){ r.t=rand(1.5,3.5); const a=rand(0,6.28), rr=rand(1,LK.r-1.5); r.m.position.set(LC.x+Math.cos(a)*rr,0.07,LC.z+Math.sin(a)*rr); r.age=0; } r.age=(r.age||0)+dt; const k=Math.min(1,r.age/1.4); r.m.scale.setScalar(0.6+2.2*k); r.m.material.opacity=0.55*(1-k); } if(lake.boat) lake.boat.position.y=0.08+Math.sin(t*1.1)*0.05; }
  if(revealed('meadow')){ updateAnimals(dt); updateHunters(dt); updateTraps(dt); updateHHut(dt); }
  if(revealed('quarry')) updateCutter(dt); if(revealed('river')) updateMill(dt); updateCarts(dt);
  hutLbl.hide=!revealed('lake'); hhutLbl.hide=!revealed('meadow'); updateRegions6(dt); updatePiles(dt); capsT-=dt; if(capsT<=0){ capsT=1; applyCaps(); syncClouds(); layoutPads(); fishPile.g.visible=revealed('lake'); meatPile.g.visible=revealed('meadow'); } }
function initRegions(){ if(S.rg) for(const k of ['hutFish','huntMeat','crysIn','herbIn','potions','oreIn']) if(S.rg[k]!==undefined) S.rg[k]=Math.max(0,Math.floor(+S.rg[k]||0)); applyCaps(); syncClouds(); hut.scale.setScalar(1+0.05*rg('fishhut')); hhut.scale.setScalar(1+0.05*rg('smoke')); if(rg('cutter')>0) cutter.scale.setScalar(1+0.06*(rg('cutter')-1)); for(let i=fishers.length;i<rg('fisher');i++) addFisher(); for(let i=hunters.length;i<rg('hunter');i++) addHunter(); buildNets(); buildTraps(); if(rg('cutter')>0&&!carts.some(c=>c.kind==='quarry')) addCart('quarry'); if(rg('mill')>0&&!carts.some(c=>c.kind==='mill')) addCart('mill'); fishPile.g.visible=revealed('lake'); meatPile.g.visible=revealed('meadow'); initRegions6(); setExtraBack(); }
// =====================================================================
// ---------- p6: son beş bölge — Sisli Bataklık, Demir Dağı, Kıyı, Karlı Geçit, Kara Kale ----------
// Her bölge aynı merdiveni izler: elle topla → işçi → makine → taşıma. Her biri yeni bir düşmana karşı da bir çözüm getirir.
// =====================================================================
function regF(id){ const R=REG[id]; const C=new THREE.Vector3(R.c[0],0,R.c[1]); const DIR=new THREE.Vector3(-R.c[0],0,-R.c[1]).normalize(); const PERP=new THREE.Vector3(-DIR.z,0,DIR.x); return {id,R,C,DIR,PERP,ang:Math.atan2(DIR.x,DIR.z),at:(d,s)=>C.clone().addScaledVector(DIR,d).addScaledVector(PERP,s||0)}; }
const glowTex=(function(){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3,'rgba(255,255,255,0.5)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
function freeOwned(root){ const SM=freeOwned.sm||(freeOwned.sm=new Set(Object.values(M))), SG=freeOwned.sg||(freeOwned.sg=new Set(Object.values(G))); root.traverse(o=>{ if(o.material&&!SM.has(o.material)&&o.material.dispose) o.material.dispose(); if(o.geometry&&!SG.has(o.geometry)&&o.geometry.userData&&o.geometry.userData.own) o.geometry.dispose(); }); }
function glow(color,size,op){ const m=new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity:op===undefined?0.8:op,depthWrite:false,blending:THREE.AdditiveBlending}); const s=new THREE.Sprite(m); s.scale.set(size,size,1); return s; }
const MUSH_GEO=mergeGeos([new THREE.SphereGeometry(0.3,10,6,0,6.2832,0,Math.PI/2).scale(1,0.8,1).translate(0,0.26,0), new THREE.CylinderGeometry(0.09,0.12,0.3,8).translate(0,0.13,0)]);
const ORE_GEO=new THREE.DodecahedronGeometry(0.27,0);
const BAR_GEO=new THREE.BoxGeometry(0.56,0.16,0.24);
const CRYS_GEO=new THREE.OctahedronGeometry(0.26,0).scale(0.75,1.5,0.75);
const POT_GEO=mergeGeos([new THREE.SphereGeometry(0.2,10,8).translate(0,0.18,0), new THREE.CylinderGeometry(0.07,0.08,0.2,8).translate(0,0.44,0)]);
Object.assign(M,{ mush:mat(0x7fe6c8,{emissive:0x1f7a64}), mushRed:mat(0xe0607a,{emissive:0x5a1a2a}), ore:mat(0x8a5e48), oreVein:mat(0xff8a3a,{emissive:0xc05010}), bar:mat(0xb4bdc7,{emissive:0x1e252c}), crys:mat(0x3f9dff,{emissive:0x10407a}), crysDeep:mat(0x8a5cff,{emissive:0x2a168a}), crysRing:mat(0x2e3f66), jewRoof:mat(0x9a3a2c), /* F8: karda seçilir: doygun mavi/mor kristal, koyu taban, kırmızı çatı */ potion:mat(0xb46ae6,{emissive:0x5a1a7a}),
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
  if((S[o.key]||0)>=carryCap()){ if(fullWarnT<=0){ fullWarnT=2.5; floatText(p,T('DOLU','MAX'),'red'); } return true; }
  if(mineCd>0) return true; mineCd=o.cd||0.42; player.swing=0.3; const ang=Math.atan2(best.pos.x-p.x,best.pos.z-p.z); player.g.rotation.y=ang; slash.position.set(p.x,1.4,p.z); slash.rotation.z=-ang+Math.PI/2; slashT=0.22; if(o.soft) tone(700,900,0.06,'sine',0.04); else SFX.chop();
  best.hp=(best.hp||o.hits)-1; best.hit=0.2; burst(best.pos.clone().setY(0.6),5,o.chip,0.8);
  if(best.hp<=0){ const at=best.pos.clone().setY(0.6); best.alive=false; best.regrow=o.regrow; const n=o.yield(); questEvent(o.key==='herb'?'herb':'mine',n); for(let j=0;j<n;j++) setTimeout(()=>fly(at.clone(),player.g,()=>{ if((S[o.key]||0)<carryCap()){ S[o.key]=(S[o.key]||0)+1; setBack(player); } },itemMesh(o.geo,o.mat),3.2),j*70); floatText(at,'+'+n+' '+o.name,''); if(o.onGet) o.onGet(best); }
  return true; }
// teslim noktası: sırttakini binaya boşalt
let dropT6=0;
function deliver(dt,key,front,to,inKey,capFn,geo,matl){ const p=player.g.position; if(!((S[key]||0)>0)) return; if(Math.hypot(p.x-front.x,p.z-front.z)>3) return; dropT6-=dt; if(dropT6>0) return; if((S.rg[inKey]||0)>=capFn()) return; dropT6=0.06; S[key]--; setBack(player); S.rg[inKey]=(S.rg[inKey]||0)+1; fly(p.clone().setY(1.6),to.clone().setY(1.3),null,itemMesh(geo,matl),5); SFX.sell(); }
function sendTo(from,to,n,inKey,capFn,geo,matl){ for(let i=0;i<n;i++) later(i*0.11,()=>{ if((S.rg[inKey]||0)>=capFn()) return; S.rg[inKey]=(S.rg[inKey]||0)+1; fly(from.clone(),to.clone().setY(1.3),null,itemMesh(geo,matl),1.6); }); }
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
/* F6: gölcükler ve çürük ağaçlar tek listede: çizim, mantar yeri ve çarpışma aynı yerleri kullanır */
const SW_POOLS=[[-3,-5,3.6],[-6,3,2.8],[1,-7.5,2.4],[-8.5,-2,2.2]], SW_DEAD=[[-9,5],[4,-9],[-2,9],[-10,-6],[6,8.5]].map(([d,s])=>SW.at(d,s));
const swamp=new THREE.Group(); scene.add(swamp); let caulLiquid=null, caulFire=null, caulGlow=null; const bubbles=[]; const potShelf=stackIM(POT_GEO,M.potion,12,i=>{ vp.set(-1.1+(i%6)*0.44,1.55+Math.floor(i/6)*0.55,-0.95); q.identity(); vs.set(1,1,1); });
(function(){ const F=SW;
  // bataklık gölcükleri, çürük ağaçlar, sazlar, nilüferler
  for(const [d,s,r] of SW_POOLS){ const p=F.at(d,s); const w=new THREE.Mesh(new THREE.CircleGeometry(r,24),M.bog); w.rotation.x=-Math.PI/2; w.position.set(p.x,0.05,p.z); w.receiveShadow=true; swamp.add(w); for(let i=0;i<5;i++){ const a=rand(0,6.28), rr=rand(r*0.9,r*1.15); const rd=mesh(G.cyl,M.reed,0.05,rand(0.8,1.4),0.05); rd.position.set(p.x+Math.cos(a)*rr,0.5,p.z+Math.sin(a)*rr); swamp.add(rd); } for(let i=0;i<3;i++){ const a=rand(0,6.28), rr=rand(0,r*0.7); const l=mesh(G.cyl,M.lily,0.35,0.03,0.35,false); l.position.set(p.x+Math.cos(a)*rr,0.08,p.z+Math.sin(a)*rr); swamp.add(l); } }
  for(const p of SW_DEAD){ const g=new THREE.Group(); g.position.set(p.x,0,p.z); g.rotation.y=rand(0,6); const tr=mesh(G.cyl,M.deadWood,0.28,3.6,0.36); tr.position.y=1.8; tr.rotation.z=rand(-.12,.12); g.add(tr); for(let i=0;i<3;i++){ const b=mesh(G.cyl,M.deadWood,0.09,1.6,0.12); b.position.set(0,2.2+i*0.6,0); b.rotation.z=(i%2?1:-1)*rand(0.7,1.1); b.rotation.y=i*2; b.position.x=(i%2?0.5:-0.5); g.add(b); } const moss=mesh(G.box,M.moss,0.1,0.9,0.1,false); moss.position.set(0.5,2.4,0); g.add(moss); swamp.add(g); }
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
  bakeStatic(swamp); bakeStatic(h); swamp.children.forEach(o=>{ if(o.isGroup&&o!==c&&o!==h) bakeStatic(o); }); /* F6: durağan süsler birleşir */
  swamp.visible=false; })();
const shutLbl=machLabel(SHUT,4.4);
const swampPile=makePile(SW.at(SW.R.r+6.6,7.2),()=>Math.round((260+180*rg('cauldron'))*(1+0.12*S.level))); swampPile.id='swampPile';
// parlayan mantar kümeleri
const mushNodes=spotsIn(SW,10,2.5,SW.R.r-1.5,[[SHUT,4.5],[CAUL,2.8],[SHUT_FRONT,2.5],...SW_POOLS.map(([d,s,r])=>[SW.at(d,s),r+0.8]),...SW_DEAD.map(p=>[p,1.4])]).map(p=>makeNode(p,g=>{ const n=3+Math.floor(Math.random()*3); for(let i=0;i<n;i++){ const m=itemMesh(MUSH_GEO,Math.random()<0.2?M.mushRed:M.mush); const a=i/n*6.283; m.position.set(Math.cos(a)*0.35,0,Math.sin(a)*0.35); m.scale.setScalar(rand(0.9,1.6)); g.add(m); } const gl=glow(0x7fffd0,1.8,0.45); gl.position.y=0.4; g.add(gl); }));
for(const n of mushNodes){ scene.remove(n.g); swamp.add(n.g); }
// mantar tarlası (makine)
const farmBeds=[]; (function(){ for(let i=0;i<3;i++){ const p=SW.at(SW.R.r-7.5,-3+i*2.6); const g=new THREE.Group(); const bed=mesh(G.box,M.woodDark,2.2,0.35,1.2); bed.position.y=0.18; const soil=mesh(G.box,mat(0x3a3024),2.0,0.1,1.0,false); soil.position.y=0.38; g.add(bed,soil); const im=stackIM(MUSH_GEO,M.mush,8,j=>{ vp.set(-0.8+(j%4)*0.52,0.42,-0.25+Math.floor(j/4)*0.5); q.identity(); vs.set(1.1,1.1,1.1); }); im.count=8; g.add(im); const gl=glow(0x7fffd0,2.8,0.35); gl.position.y=0.8; g.add(gl); g.position.copy(p); g.rotation.y=SW.ang; g.visible=false; swamp.add(g); farmBeds.push({g,im,t:rand(0,5)}); } })();
const farmLbl=machLabel(SW.at(SW.R.r-7.5,-0.4),2.8);
const herbCap=()=>30+15*rg('cauldron'); const potCap=()=>4+2*rg('cauldron'); const brewT=()=>4.2*Math.pow(0.78,rg('cauldron'));
const potPrice=()=>(5+0.9*gw())*(1+0.12*rg('cauldron'));
const farmRate=()=>{ const l=rg('farm'); return l<=0?0:l*(l>=3?2:1)/10; };
const herbalists=[];
let brewCd=2, potCd=0, farmT=0, fogWarnWave=-1;
function brewOne(){ const inn=S.rg.herbIn||0; if(inn<2) return false; const full=(S.rg.potions||0)>=potCap(); if(full) return false; /* F4: raf doluyken kazan bekler (iksir satılmaz; iksir surun ilacıdır) */ S.rg.herbIn=inn-2; burst(CAUL.clone().setY(2.2),8,M.brew,1.2); mTone(CAUL,300,600,0.12,'sine',0.04); pulse(caulLiquid.parent,0.1);
  if(!full){ S.rg.potions=Math.min(potCap(),(S.rg.potions||0)+1); /* FX1: hemen sayılır */ fly(CAUL.clone().setY(2.2),SHUT.clone().setY(2.4),null,itemMesh(POT_GEO,M.potion),2.4); }
  else { pileAdd(swampPile,potPrice()); fly(CAUL.clone().setY(2.2),swampPile.pos.clone().setY(0.8),null,false,3); } return true; }
function updateSwamp(dt){ const F=SW; const t=performance.now()/1000;
  // oyuncu mantar toplar
  playerHarvest(mushNodes,{key:'herb',hits:1,cd:0.35,soft:true,regrow:14,yield:()=>2,name:T('mantar','mushrooms'),dest:T('iksir kazanına götür','take to the Cauldron'),chip:M.mush,geo:MUSH_GEO,mat:M.mush});
  for(const n of mushNodes) nodeTick(n,dt);
  deliver(dt,'herb',SHUT_FRONT,CAUL,'herbIn',herbCap,MUSH_GEO,M.mush);
  updateGatherers(herbalists,mushNodes,dt,{work:2.2,regrow:14,chip:M.mush,full:()=>(S.rg.herbIn||0)>=herbCap(),yield:()=>2,send:(from,n)=>sendTo(from,CAUL,n,'herbIn',herbCap,MUSH_GEO,M.mush)});
  // kazan: 2 mantar → 1 iksir. Raf dolunca iksir satılır, para yığına
  brewCd-=dt*(0.6+0.4*Math.min(1,rg('cauldron'))); if(brewCd<=0){ brewCd=brewT(); brewOne(); }
  const working=(S.rg.herbIn||0)>=2; caulLiquid.material.color.setHSL(0.38,0.9,working?0.62:0.4); caulFire.scale.set(0.5+0.08*Math.sin(t*13),0.8+0.2*Math.sin(t*9),0.5); caulGlow.material.opacity=working?0.55+0.15*Math.sin(t*4):0.25;
  for(const b of bubbles){ b.t-=dt; if(b.t<=0){ b.t=working?rand(0.3,0.9):rand(1.5,3); b.m.visible=true; b.m.position.set(rand(-0.6,0.6),1.9,rand(-0.6,0.6)); b.m.scale.setScalar(0.08); } if(b.m.visible){ b.m.position.y+=dt*0.9; b.m.scale.multiplyScalar(1+dt*1.5); if(b.m.position.y>2.6) b.m.visible=false; } }
  setStack(potShelf,Math.min(12,S.rg.potions||0)); swampFx(dt,working);
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
  for(const s of SIDES){ const puffs=[]; for(let i=0;i<9;i++) puffs.push({sx:rand(3,5),sy:rand(0.7,1.2),sz:rand(3,5),a:rand(-1,1),b:rand(0.2,1),ph:rand(0,6)}); fogSides[s]={puffs,k:0}; } })();
/* F6: 36 sis bulutu tek InstancedMesh (tek çizim); kapı sisi azalınca bulutları küçülür */
const fogIM=new THREE.InstancedMesh(G.sph,M.fogPuff.clone(),36); fogIM.frustumCulled=false; fogIM.castShadow=false; fogIM.receiveShadow=false; fogIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); fogIM.visible=false; scene.add(fogIM);
function placeLamps(){ for(const L of lampPosts){ const [x,z]=sidePos(L.s,L.a*3.4,1.4); L.g.position.set(x,0,z); L.g.rotation.y=Math.atan2(-SD[L.s].o[0],-SD[L.s].o[1])+(L.a>0?Math.PI:0); } }
placeLamps();
/* F6: sisli kapılar okunur: kapının üstünde 🌫️ etiketi (gündüz tehdit etiketinde, gece ayrı), mini haritada bulut, gece başlamadan uyarı */
function fogGates(){ return revealed('swamp')?SIDES.slice(0,sidesActive()).filter(s=>!lampLit(s)):[]; }
const fogLbl={}; for(const s of SIDES){ const L=addLabel(new THREE.Vector3(),'',6.4); L.near=-1; L.hide=true; L.el.classList.add('fogLbl'); L.el.innerHTML=T('🌫️ Sis','🌫️ Fog')+'<small>🏹 −28%</small>'; fogLbl[s]=L; }
let fogDayWarn=-1;
function fogMarks(){ const fg=fogGates(); for(const s of SIDES){ const L=fogLbl[s]; L.hide=!(fg.includes(s)&&threatLbl[s].hide&&!runOver); if(!L.hide){ const [x,z]=sidePos(s,0,2.6); L.pos.set(x,0,z); } }
  if(fg.length&&!waveActive&&!runOver&&waveT<15&&!modalOpen()&&fogDayWarn!==S.level*10+S.wave){ fogDayWarn=S.level*10+S.wave; const nm=fg.map(s=>SIDE_TR[s]).join(', '); toast(T(`🌫️ Bu gece sis: ${nm} — kuleler az görür. 🏮 Fener kur`,`🌫️ Fog tonight: ${nm} — towers see less. 🏮 Build Lanterns`),'bad'); } }
function updateFog(dt){ const t=performance.now()/1000; const on=revealed('swamp'); fogMarks();
  for(const L of lampPosts){ const vis=on&&lampLit(L.s); if(vis&&!L.g.visible){ L.g.visible=true; L.pop=0; } if(!vis) L.g.visible=false; if(L.pop<1){ L.pop=Math.min(1,L.pop+dt*2.5); L.g.scale.setScalar(Math.max(0.01,L.pop*(1+0.3*Math.sin(L.pop*Math.PI)))); } L.gl.material.opacity=0.35+0.45*night+0.08*Math.sin(t*7+L.a); L.pool.material.opacity=0.28*night; }
  for(const s of SIDES){ const F=fogSides[s]; const want=on&&!lampLit(s)&&SIDES.indexOf(s)<sidesActive()?0.28+0.5*night:0; /* F4: fenersiz kapıda sis gündüz de görünür (gece koyulaşır): hangi kapının fener istediği belli */ F.k=lerp(F.k,want,Math.min(1,dt*1.5)); }
  { let mk=0; for(const s of SIDES) mk=Math.max(mk,fogSides[s].k); fogIM.visible=mk>0.01; if(fogIM.visible){ fogIM.material.opacity=mk; let i=0; for(const s of SIDES){ const F=fogSides[s], sc=F.k>0.01?F.k/mk:0.0001; for(const P of F.puffs){ const [x,z]=sidePos(s,P.a*(H+2)+Math.sin(t*0.3+P.ph)*1.5,4+P.b*12); vp.set(x,0.5+Math.sin(t*0.7+P.ph)*0.2,z); q.identity(); vs.set(P.sx*sc,P.sy*sc,P.sz*sc); m4.compose(vp,q,vs); fogIM.setMatrixAt(i++,m4); } } fogIM.instanceMatrix.needsUpdate=true; } }
  if(fogOn()&&fogWarnWave!==S.level*10+S.wave){ fogWarnWave=S.level*10+S.wave; const dark=SIDES.slice(0,sidesActive()).filter(s=>!lampLit(s)); if(dark.length) { const nm=dark.map(s=>SIDE_TR[s]).join(', '); setTimeout(()=>toast(T(`🌫️ Sis çöktü: ${nm} — 🏮 fener kur`,`🌫️ Fog rolled in: ${nm} — 🏮 build Lanterns`),'bad'),2400); } }
  // iksir: sur %70'in altındaysa otacının iksiri uçar, suru onarır
  potCd-=dt; if(waveActive&&potCd<=0&&S.gateHp<D.gateMax()*0.9&&drinkPotion()) potCd=3.2; }
// iksir: gece sur %90'ın altına inince kendiliğinden, ya da HUD'daki 🧪 düğmesine dokununca suru onarır (F4)
function drinkPotion(){ if((S.rg.potions||0)<1||runOver||S.gateHp>=D.gateMax()-0.5) return false; if(kingWardT()&&enemies.some(o=>o.boss&&!o.dead&&o.ward>0)){ if(!curseSaid){ curseSaid=true; toast(T('🧪 Kara kalkan iksiri engelliyor: önce kalkanı kır!','🧪 The dark ward blocks potions: break it first!')); } return false; } /* F9b: kalkan dururken sur onarılmaz (AFK iksirle sonsuza dek dayanamaz) */ S.rg.potions--; const cnt={N:0,E:0,S:0,W:0}; for(const e of enemies) if(!e.dead) cnt[e.side]++; const side=SIDES.slice().sort((a,b)=>cnt[b]-cnt[a])[0]; const [gx,gz]=sidePos(side,0,-1); const to=new THREE.Vector3(gx,1.5,gz);
    fly(SHUT.clone().setY(2.5),to,()=>{ const heal=D.gateMax()*0.06; S.gateHp=Math.min(D.gateMax(),S.gateHp+heal); burst(to,14,M.brew,1.4); floatText(to,T('+%6 sur 🧪','+6% wall 🧪'),'green'); tone(500,900,0.18,'sine',0.06); },itemMesh(POT_GEO,M.potion),0.9); return true; }
{ const pc=$('potionChip'); if(pc){ pc.style.cursor='pointer'; pc.addEventListener('pointerdown',e=>e.stopPropagation()); pc.addEventListener('click',e=>{ e.stopPropagation(); audio(); if(!drinkPotion()) toast((S.rg.potions||0)<1?T('🧪 İksir yok: kazan raf dolana dek üretir','🧪 No potions: the cauldron brews until the shelf is full'):T('🧱 Sur zaten tam','🧱 Walls are already full')); }); } }

// =====================================================================
// ---------- Demir Dağı: cevher → demirci ocağı → demir çubuk → araba depoya. Demir: delici ok, demir kapı ----------
// =====================================================================
const IR=regF('iron'); const FORGE=IR.at(IR.R.r-3.6,5.4), FORGE_FRONT=IR.at(IR.R.r-0.8,4.4), FORGE_OUT=IR.at(IR.R.r-1.6,0.6), MINE=IR.at(-8.5,0), DRILL=IR.at(-6.2,-3.4);
const ironArea=new THREE.Group(); scene.add(ironArea); let furnace=null, furnGlow=null, drillBit=null, drillHead=null, drillGrp=null, bellows=null; const forgeSmoke=[]; const barStack=stackIM(BAR_GEO,M.bar,30,i=>{ const row=Math.floor(i/6), col=i%6; vp.set(-0.7+(col%3)*0.6,0.1+row*0.17,(col<3?0:0.3)); e3.set(0,(row%2)*0.0,0); q.setFromEuler(e3); vs.set(1,1,1); });
const mountains=new THREE.Group(); scene.add(mountains);
(function(){ const F=IR;
  // arkada dağ sırası (her zaman görünür: uzaktan merak uyandırır)
  for(const [px,pz,r,h] of IRON_PEAKS){ const p=new THREE.Vector3(px,0,pz); const c=new THREE.Mesh(new THREE.ConeGeometry(1,1,7),Math.random()<0.5?M.mount:M.mount2); c.scale.set(r,h,r); c.position.set(p.x,h/2-0.2,p.z); c.rotation.y=rand(0,6); c.castShadow=true; c.receiveShadow=true; mountains.add(c); const cap=new THREE.Mesh(new THREE.ConeGeometry(1,1,7),M.snow); cap.scale.set(r*0.34,h*0.34,r*0.34); cap.position.set(p.x,h-h*0.17-0.2,p.z); cap.rotation.y=c.rotation.y; mountains.add(cap); }
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
  bakeStatic(mountains); bakeStatic(mg); bakeStatic(f,new Set([furnace,bellows,roof])); bakeStatic(drillGrp); /* F6 */
  ironArea.visible=false; })();
const forgeLbl=machLabel(FORGE,4.4); const drillLbl=machLabel(DRILL,5.2);
const oreNodes=spotsIn(IR,9,2.2,IR.R.r-1.5,[[FORGE,4.6],[MINE,5.4],[DRILL,3.2],[FORGE_OUT,2.4],[FORGE_FRONT,2.2],...IRON_PEAKS.map(k=>[new THREE.Vector3(k[0],0,k[1]),k[2]*0.88+1.6])]).map(p=>makeNode(p,g=>{ const r=mesh(G.dod,M.ore,rand(0.8,1.0),rand(0.6,0.8),rand(0.8,1.0)); r.position.y=0.4; g.add(r); for(let i=0;i<3;i++){ const v=mesh(G.box,M.oreVein,0.35,0.12,0.14,false); const a=i*2.1; v.position.set(Math.cos(a)*0.62,0.45+i*0.12,Math.sin(a)*0.62); v.rotation.y=-a; g.add(v); } const gl=glow(0xff8a3a,1.6,0.35); gl.position.y=0.8; g.add(gl); }));
for(const n of oreNodes){ scene.remove(n.g); ironArea.add(n.g); }
const oreCap=()=>36+18*rg('forge'); const smeltT=()=>5*Math.pow(0.78,rg('forge')); const forgeOutCap=()=>30+15*rg('forge');
const drillRate=()=>{ const l=rg('drill'); return l<=0?0:l*(l>=3?1.5:1)/6; };
const miners=[]; let smeltCd=3, drillAcc=0, hammerT=0;
function updateIron(dt){ const t=performance.now()/1000;
  playerHarvest(oreNodes,{key:'ore',hits:3,cd:0.42,regrow:18,yield:()=>3,name:T('cevher','ore'),dest:T('demirci ocağına götür','take to the Forge'),chip:M.ore,geo:ORE_GEO,mat:M.ore}); for(const n of oreNodes) nodeTick(n,dt);
  deliver(dt,'ore',FORGE_FRONT,FORGE,'oreIn',oreCap,ORE_GEO,M.ore);
  updateGatherers(miners,oreNodes,dt,{work:3.2,regrow:18,chip:M.ore,full:()=>(S.rg.oreIn||0)>=oreCap(),yield:()=>3,send:(from,n)=>sendTo(from,FORGE,n,'oreIn',oreCap,ORE_GEO,M.ore)});
  // matkap: dağdan kendiliğinden cevher çıkarır
  const dl=rg('drill'); drillGrp.visible=dl>0; drillLbl.hide=dl<=0; drillFx(dt,dl); if(dl>0){ drillGrp.scale.setScalar(1+0.06*(dl-1)); const full=DRL.bin>=12;
    const k='d'+dl+'|'+full; if(drillLbl._k!==k){ drillLbl._k=k; drillLbl.el.innerHTML=''; } }
  // ocak: 3 cevher → 1 demir çubuk
  const inn=S.rg.oreIn||0; const working=inn>=3&&(S.rg.forgeOut||0)+FRG.ingots.length<forgeOutCap(); if(working){ smeltCd-=dt; if(smeltCd<=0){ smeltCd=smeltT(); S.rg.oreIn=inn-3; forgeSmelt(); } }
  forgeFx(dt,rg('forge'),working);
  furnGlow.material.opacity=working?0.6+0.2*Math.sin(t*11):0.3; furnace.material.emissive.setHex(working?0xff6a00:0x7a2a00); bellows.scale.y=working?1+0.4*Math.sin(t*6):1;
  if(working&&Math.random()<dt*3){ const f=ironArea.userData.forge; smokePuff(forgeSmoke,f.localToWorld(f.userData.chim.clone())); } updateSmoke(forgeSmoke,dt);
  setStack(barStack,Math.min(30,Math.floor(S.rg.forgeOut||0)));
  forgeLbl.hide=false; const k=Math.floor(inn)+'|'+Math.floor(S.rg.forgeOut||0)+'|'+rg('forge'); if(forgeLbl._k!==k){ forgeLbl._k=k; forgeLbl.el.innerHTML=`<span class="ics">${inn<3?'<b class="full">⚠ ⛏️</b>':'⛏️ '+Math.floor(inn)} → <span class="iron-dot"></span>${Math.floor(S.rg.forgeOut||0)}</span>`; } }
// demir arabası: ocaktaki çubukları depoya taşır
function ironRoute(){ const outN=sidePos('N',0,5), inN=sidePos('N',0,-3); return [[FORGE_OUT.x,FORGE_OUT.z],...CART_PATHS[2],[outN[0],outN[1]],[inN[0],inN[1]],[4,-4],[DEPOT_FRONT.x,DEPOT_FRONT.z]]; }
function ironArrive(c,end){ const pos=c.C.g.position.clone();
  if(end==='A'){ const n=Math.min(Math.floor(S.rg.forgeOut||0),cartCap('iron')); if(n<=0) return false; S.rg.forgeOut-=n; c.load='iron'; c.n=n; cargoIron(c.C,n); return true; }
  if(c.n>0){ const n=c.n; for(let i=0;i<Math.min(10,n);i++) setTimeout(()=>fly(pos.clone().setY(1.2),rotPt(DEPOT,0.6,1.0,-0.6),null,itemMesh(BAR_GEO,M.bar),4),i*60); S.iron=(S.iron||0)+n; floatText(pos,T('+'+n+' demir','+'+n+' iron'),'green',{key:'diron',v:n,fmt:v=>T('+'+v+' demir','+'+v+' iron')}); sfxAt(DEPOT).sell(); c.n=0; cargoIron(c.C,0); } return true; }
function cargoIron(C,n){ while(C.cargo.children.length) C.cargo.remove(C.cargo.children[0]); for(let i=0;i<Math.min(18,n);i++){ const row=Math.floor(i/6), col=i%6; const m=itemMesh(BAR_GEO,M.bar); m.position.set(-0.3+(col%2)*0.6,0.1+row*0.17,-0.7+Math.floor(col/2)*0.6); C.cargo.add(m); } }

// =====================================================================
// ---------- Kıyı: deniz, adalar, sahile vuran sandıklar (sürpriz), deniz feneri, ticaret teknesi ----------
// =====================================================================
const CO=regF('coast'); const SC=new THREE.Vector3(SEA.x,0,SEA.z); const CU=CO.C.clone().sub(SC).normalize();
const rotU=(u,a)=>new THREE.Vector3(u.x*Math.cos(a)-u.z*Math.sin(a),0,u.x*Math.sin(a)+u.z*Math.cos(a));
const PIER_A=SC.clone().addScaledVector(CU,SEA.r+1.6), PIER_B=SC.clone().addScaledVector(CU,SEA.r-6.5), PIER_END=SC.clone().addScaledVector(CU,SEA.r-5.8); const WH=CO.at(-3,6.8), WH_FRONT=CO.at(-0.4,6.8), LIGHT=CO.at(-8.5,-6.5);
const ISLES=[SC.clone().addScaledVector(rotU(CU,0.6),SEA.r-15), SC.clone().addScaledVector(rotU(CU,-0.55),SEA.r-16), SC.clone().addScaledVector(rotU(CU,0.05),SEA.r-22)];
const coast=new THREE.Group(); scene.add(coast); const seaFx={rings:[],foam:null}; let lightBeam=null, lightTop=null, lighthouse=null;
function palm(g,x,z,s){ const pg=new THREE.Group(); pg.position.set(x,0,z); pg.rotation.y=rand(0,6.28); let y=0, lx=0; for(let i=0;i<6;i++){ const seg=mesh(G.cyl,M.palmTrunk,0.2*s,0.8*s,0.2*s); lx+=0.12*s*i*0.3; seg.position.set(lx,y+0.4*s,0); seg.rotation.z=-0.08*i; pg.add(seg); y+=0.72*s; } for(let i=0;i<7;i++){ const lf=mesh(G.box,M.palm,0.5*s,0.06*s,2.2*s); const a=i/7*6.283; lf.position.set(lx+Math.sin(a)*0.9*s,y+0.05*s,Math.cos(a)*0.9*s); lf.rotation.y=a; lf.rotation.x=0.35; pg.add(lf); } const nut=mesh(G.sph,M.woodDark,0.18*s,0.18*s,0.18*s); nut.position.set(lx,y-0.2*s,0.15*s); pg.add(nut); g.add(bakeStatic(pg)); } /* F6: palmiye tek parça */
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
  bakeStatic(coast); bakeStatic(w); /* F6 */
  coast.visible=false; })();
const whLbl=machLabel(WH,4.0);
const coastPile=makePile(CO.at(CO.R.r+6.6,7.2),()=>Math.round((320+220*rg('harbor'))*(1+0.12*S.level))); coastPile.id='coastPile';
// ----- tekne (makine): adalarla ticaret seferi, dönüşte para yığına -----
const boats=[];
function makeBoat(){ const g=new THREE.Group(); const hull=mesh(G.box,M.woodDark,1.6,0.7,3.6); hull.position.y=0.35; const bow=mesh(G.cone4,M.woodDark,1.1,1.2,0.7); bow.rotation.x=Math.PI/2; bow.rotation.y=Math.PI/4; bow.position.set(0,0.35,2.3); bow.scale.set(1.1,1.2,0.7); const rim=mesh(G.box,M.wood,1.7,0.12,3.7,false); rim.position.y=0.72;
  const mast=mesh(G.cyl,M.woodDark,0.08,3.6,0.08); mast.position.set(0,2.4,0.2); const sail=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.4,4,4),M.sail); sail.position.set(0,2.6,0.28); sail.castShadow=true; const stripe=new THREE.Mesh(new THREE.PlaneGeometry(2.2,0.45),M.sailRed); stripe.position.set(0,2.6,0.3); const flag=mesh(G.box,M.flag,0.04,0.3,0.55,false); flag.position.set(0,4.3,-0.1);
  const cargo=new THREE.Group(); for(let j=0;j<4;j++){ const cr=mesh(G.box,M.chest,0.5,0.45,0.5); cr.position.set(j%2?0.35:-0.35,0.95,-0.6-Math.floor(j/2)*0.6); cargo.add(cr); } cargo.visible=false;
  g.add(hull,bow,rim,mast,sail,stripe,flag,cargo); const i=boats.length, dock=berth(i); g.position.copy(dock); scene.add(g); const b={g,sail,cargo,i,state:'load',t:1.5+3.5*i,isle:i%ISLES.length,k:0,from:dock.clone(),to:dock.clone()}; boats.push(b); return b; }
// F8: her teknenin kendi iskele yanaşma yeri (iskelenin iki yanı), ikinci tekne 3.5 sn sonra kalkar: iki tekne üst üste görünmez
function berth(i){ const perp=new THREE.Vector3(CU.z,0,-CU.x); return PIER_B.clone().addScaledVector(CU,1.4).addScaledVector(perp,(i%2?1:-1)*2.1); }
let whSellT=0; const seaFishPrice=()=>(4+0.8*gw())*(1+0.1*rg('harbor'));
const boatSpd=()=>3.2+0.7*rg('boat'); const tripValue=()=>(24+5*gw())*(1+0.2*rg('harbor'))*(1+0.15*Math.max(0,rg('boat')-1));
const boatWantN=()=>rg('boat')<=0?0:(rg('harbor')>=3?2:1);
function isleDock(i){ const I=ISLES[i]; return I.clone().add(PIER_B.clone().sub(I).normalize().multiplyScalar(i===2?5:4)); }
function updateBoats(dt){ const t=performance.now()/1000; while(boats.length<boatWantN()) makeBoat();
  for(const b of boats){ const g=b.g;
    if(b.state==='load'||b.state==='unload'){ b.t-=dt; if(b.t<=0){ if(b.state==='load'){ b.state='go'; b.from=g.position.clone(); b.to=isleDock(b.isle); b.k=0; b.cargo.visible=false; } else { b.state='back'; b.from=g.position.clone(); b.to=berth(b.i||0); b.k=0; b.cargo.visible=true; burst(g.position.clone().setY(1),6,M.coin,1); } } }
    else { const len=b.from.distanceTo(b.to)||1; b.k=Math.min(1,b.k+dt*boatSpd()/len); g.position.lerpVectors(b.from,b.to,b.k); const ang=Math.atan2(b.to.x-b.from.x,b.to.z-b.from.z); let dr=ang-g.rotation.y; dr=Math.atan2(Math.sin(dr),Math.cos(dr)); g.rotation.y+=dr*Math.min(1,dt*3);
      if(Math.random()<dt*4) burst(g.position.clone().setY(0.2),1,M.foam,0.3);
      if(b.k>=1){ if(b.state==='go'){ b.state='unload'; b.t=2.2; } else { b.state='load'; b.t=2.5; b.cargo.visible=false; b.isle=(b.isle+1)%ISLES.length; boatHorn(g.position); const v=tripValue(); const before=pileVal(coastPile); pileAdd(coastPile,v); const got=pileVal(coastPile)-before; for(let i=0;i<6;i++) setTimeout(()=>fly(g.position.clone().setY(1.2),coastPile.pos.clone().setY(0.8),null,false,2.2),i*90); if(got>0) floatText(g.position.clone(),T('⛵ +'+Math.round(got)+' altın','⛵ +'+Math.round(got)+' gold'),''); } } }
    g.position.y=0.12+Math.sin(t*1.6+b.isle)*0.08; g.rotation.z=Math.sin(t*1.2+b.isle)*0.05; b.sail.scale.set(1,1,1); b.sail.position.z=0.28+(b.state==='go'||b.state==='back'?0.15:0); } }
// ----- sandıklar: dalgalar sahile atar; aç, ne çıkacağı sürpriz -----
const RAR={common:{n:T('Sıradan','Common'),c:0xc9a06a,w:60},rare:{n:T('Nadir','Rare'),c:0x4aa8ff,w:28},epic:{n:T('Destansı','Epic'),c:0xb46ae6,w:10},legend:{n:T('Efsanevi','Legendary'),c:0xffc93a,w:2}};
const chests=[]; let chestT=10; let chestCall=0; /* F8: çevrimdışı kartı sandık gösterdiyse rehber onlara götürür */
// F8 rehber: sahile vurmuş sandık — yakındaysa (40 birim), çevrimdışından sonra, sandık görevi açıkken ya da nadir+ sandık varken ve önemli bir alım yokken (priSc<8). Gündüz, gidip dönmeye vakit varsa
function chestGuide(p,priSc){ if(waveActive||runOver||!revealed('coast')) return null; let best=null,bd=1e9; for(const c of chests){ if(c.open||c.k<1) continue; const d=Math.hypot(c.g.position.x-p.x,c.g.position.z-p.z)-(c.rar==='common'?0:8); if(d<bd){ bd=d; best=c; } } if(!best) return null;
  const d=Math.hypot(best.g.position.x-p.x,best.g.position.z-p.z), near=d<40, idle=priSc<8, Q=S.meta&&S.meta.quests, qOpen=!!(Q&&Array.isArray(Q.list)&&questsOn()&&Q.list.some(x=>x.k==='chest'&&x.have<x.n));
  if(!(near||chestCall>0||(idle&&(qOpen||best.rar!=='common')))) return null; if(!near&&waveT<2*d/Math.max(4,D.speed())+5) return null;
  const c=best; return {t:c.g.position.clone(),text:T(RAR[c.rar].n+' sandık! Sahilde aç',RAR[c.rar].n+' chest! Open it on the beach'),v:()=>!c.open&&chests.includes(c)}; }
const chestMax=()=>2+Math.min(4,Math.ceil(rg('lighthouse')/2)); const chestEvery=()=>30*Math.pow(0.87,rg('lighthouse'));
function rollRar(){ const lh=rg('lighthouse'); const w={common:60-4*lh,rare:28+1*lh,epic:10+2*lh,legend:2+1*lh}; let tot=0; for(const k in w) tot+=w[k]; let r=Math.random()*tot; for(const k in w){ r-=w[k]; if(r<=0) return k; } return 'common'; }
// F8: sahildeki (açılmamış) sandıklar kayıtta durur: S.rg.beach=[{r:nadirlik,a:açı}]; yeniden yüklemede aynı yerde aynı nadirlikte geri gelir
function saveBeach(){ if(S.rg) S.rg.beach=chests.filter(c=>!c.open).map(c=>({r:c.rar,a:Math.round(c.a*1000)/1000})); }
function restoreBeach(){ const B=S.rg&&S.rg.beach; if(!Array.isArray(B)||!revealed('coast')||chests.length) return; for(const b of B.slice(0,6)) if(b&&RAR[b.r]&&typeof b.a==='number') spawnChest(true,b.r,b.a); }
function spawnChest(instant,rar0,a0){ const a=typeof a0==='number'?a0:(Math.random()<0.5?-1:1)*rand(0.12,0.5); const u=rotU(CU,a); const land=SC.clone().addScaledVector(u,SEA.r+1.4), sea=SC.clone().addScaledVector(u,SEA.r-7); const rar=RAR[rar0]?rar0:rollRar(); const R=RAR[rar];
  const g=new THREE.Group(); const trim=mat(R.c,rar==='common'?{}:{emissive:new THREE.Color(R.c).multiplyScalar(0.35)}); const body=mesh(G.box,M.chest,1.0,0.6,0.7); body.position.y=0.3; const lidG=new THREE.Group(); lidG.position.set(0,0.6,-0.35); const lid=mesh(G.box,M.chest,1.02,0.26,0.72); lid.position.set(0,0.13,0.35); lidG.add(lid); for(const x of [-0.35,0.35]){ const bd=mesh(G.box,trim,0.1,0.64,0.74,false); bd.position.set(x,0.31,0); g.add(bd); const bl=mesh(G.box,trim,0.1,0.28,0.76,false); bl.position.set(x,0.13,0.35); lidG.add(bl); } const lock=mesh(G.box,M.chestGold,0.18,0.22,0.08,false); lock.position.set(0,0.5,0.37); g.add(body,lidG,lock);
  let gl=null, beam=null; if(rar!=='common'){ gl=glow(R.c,rar==='legend'?4:2.8,0.7); gl.position.y=0.9; g.add(gl); beam=new THREE.Mesh((g=>{ g.userData.own=true; return g; })(new THREE.CylinderGeometry(0.35,0.6,9,12,1,true)),new THREE.MeshBasicMaterial({color:R.c,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); beam.position.y=4.5; g.add(beam); }
  g.rotation.y=Math.atan2(-u.x,-u.z)+rand(-.4,.4); g.position.copy(instant?land:sea); scene.add(g); chests.push({g,lidG,gl,beam,rar,a,land,sea,k:instant?1:0,open:0,gone:0}); saveBeach(); }
// F8: ödül sefere göre büyür (altın ×(1+0.12·sefer)); kıt kaynak (kereste/demir), bazen taç ve bu sefer için güç kartı
function chestCard(){ const dk=S.level*10+S.wave; if(S.rg.cCard===dk) return ''; const ks=['arrow','rate','range','powder','wall','sword','drill'].filter(cardUseful); if(!ks.length) return ''; S.rg.cCard=dk; const k=ks[Math.floor(Math.random()*ks.length)]; S.cards[k]=(S.cards[k]||0)+1; if(k==='wall') S.gateHp=D.gateMax(); return ' · 🃏 '+CARDS[k].i+' '+CARDS[k].n; }
function openChest(c){ c.open=0.001; questEvent('chest',1); if(chestCall>0) chestCall--; const pos=c.g.position.clone(); const R=RAR[c.rar]; const w=gw(), L=S.level; const book=S.book.chest||(S.book.chest={}); book[c.rar]=(book[c.rar]||0)+1; let txt='';
  const gold=Math.round((20+6*w)*(1+0.12*L)*({common:1,rare:1.6,epic:2.6,legend:5}[c.rar])); const n=Math.min(24,8+Math.round(gold/25)); dropCoins(pos.clone().setY(1),n,gold/n,2.2,1.4); txt='💰 '+gold;
  const plank=m=>{ const p=Math.round((6+2*L)*m); S.planks=(S.planks||0)+p; return T(` · +${p} kereste`,` · +${p} planks`); }, stone=m=>{ const s=Math.round((10+5*L)*m); S.stone+=s; setStonePile(Math.min(18,S.stone)); return T(` · +${s} taş`,` · +${s} stone`); }, iron=m=>{ const fe=Math.round((3+1.5*L)*m); S.iron=(S.iron||0)+fe; return T(` · +${fe} demir`,` · +${fe} iron`); }, crown=k=>{ const dk=S.level*10+S.wave; if(S.rg.cCrD!==dk){ S.rg.cCrD=dk; S.rg.cCr=0; } k=Math.min(k,2-(S.rg.cCr||0)); if(k<=0) return ''; S.rg.cCr=(S.rg.cCr||0)+k; S.meta.crowns+=k; return T(` · 👑 +${k} taç`,` · 👑 +${k} crown${k>1?'s':''}`); }; /* F8: sandıktan gün başına en çok 2 taç ve 1 kart (sahilde beklemek taç/kart çiftliği olmasın) */
  const res=m=>revealed('iron')&&Math.random()<0.5?iron(m):revealed('river')&&Math.random()<0.6?plank(m):stone(m);
  if(c.rar==='common'&&Math.random()<0.35) txt+=res(0.5);
  if(c.rar==='rare'){ txt+=res(1); if(Math.random()<0.12) txt+=crown(1); }
  if(c.rar==='epic'){ txt+=res(1.6); if(Math.random()<0.5) txt+=crown(1); if(Math.random()<0.4) txt+=chestCard(); }
  if(c.rar==='legend'){ txt+=res(2.5)+crown(2)+chestCard(); }
  saveBeach();
  const pw={common:0.5,rare:0.8,epic:1.2,legend:1.8}[c.rar]; celebrate(pos,pw); burst(pos.clone().setY(1),10+6*pw,M.chestGold,1.5); if(c.rar==='common') SFX.coin(); else SFX.fanfare();
  if(c.rar==='epic'||c.rar==='legend'){ banner(T(R.n+' sandık!',R.n+' chest!'),txt,'day'); camShake=0.5; if(c.rar==='legend') confetti(); } floatText(pos,R.n+': '+txt,c.rar==='common'?'':'green'); save(); }
function updateChests(dt){ const t=performance.now()/1000; if(!revealed('coast')) return; chestT-=dt; if(chestT<=0){ chestT=chestEvery(); if(chests.filter(c=>!c.open).length<chestMax()){ spawnChest(false); save(); } } if(chestCall>0&&!chests.some(c=>!c.open)) chestCall=0;
  const p=player.g.position; for(let i=chests.length-1;i>=0;i--){ const c=chests[i]; const g=c.g;
    if(c.k<1){ c.k=Math.min(1,c.k+dt/4); g.position.lerpVectors(c.sea,c.land,c.k*c.k*(3-2*c.k)); g.position.y=0.1+Math.sin(t*3+i)*0.12*(1-c.k); g.rotation.z=Math.sin(t*2+i)*0.2*(1-c.k); if(c.k>=1) burst(c.land.clone().setY(0.3),8,M.foam,0.8); }
    else if(!c.open){ g.position.y=0; g.rotation.z=0; if(c.beam) c.beam.material.opacity=0.22+0.1*Math.sin(t*3); if(c.gl) c.gl.material.opacity=0.6+0.25*Math.sin(t*4); const s=1+0.04*Math.sin(t*5); g.scale.setScalar(s); if(Math.hypot(p.x-g.position.x,p.z-g.position.z)<2.2) openChest(c); }
    else { c.open+=dt; c.lidG.rotation.x=-Math.min(1.9,c.open*6); if(c.beam) c.beam.material.opacity=Math.max(0,0.5-c.open*0.2); if(c.open>2.2){ const s=Math.max(0.001,1-(c.open-2.2)*2); g.scale.setScalar(s); if(s<=0.01){ scene.remove(g); freeOwned(g); chests.splice(i,1); } } } } }
function updateCoast(dt){ const t=performance.now()/1000; updateBoats(dt); updateChests(dt); coastFx(dt);
  const lh=rg('lighthouse'); lighthouse.visible=lh>0; if(lh>0){ lighthouse.scale.setScalar(0.85+0.06*lh); lightBeam.rotation.y=t*0.9; lightBeam.material.opacity=0.03+0.25*night; lightTop.material.emissive.setHex(0xffb020); }
  // limanda balık satışı: sırttaki balık anında ticarete gider
  { const p=player.g.position; if((S.fish||0)>0&&Math.hypot(p.x-WH_FRONT.x,p.z-WH_FRONT.z)<3){ whSellT-=dt; if(whSellT<=0&&pileVal(coastPile)<coastPile.capFn()-0.5){ whSellT=0.07; const b=takeFishB(); S.fish--; setBack(player); pileAdd(coastPile,seaFishPrice()*Math.max(1,(1+b)/2.2)); fly(p.clone().setY(1.6),WH.clone().setY(1.2),null,'fish',5); SFX.sell(); } } }
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
  const door=mesh(G.box,M.woodDark,1.0,1.3,0.1,false); door.position.set(0,0.65,1.32); const r1=mesh(G.box,M.jewRoof,4.2,0.16,2.0); r1.position.set(0,2.75,-0.75); r1.rotation.x=0.62; const r2=r1.clone(); r2.position.z=0.75; r2.rotation.x=-0.62; const s1=mesh(G.box,M.snow,4.25,0.12,0.7,false); s1.position.set(0,3.12,-0.42); s1.rotation.x=0.62; const s2=s1.clone(); s2.position.z=0.42; s2.rotation.x=-0.62; const path=mesh(G.cyl,M.crysRing,2.6,0.04,2.6,false); path.position.set(0,0.03,2.6); const sign=mesh(G.box,M.crysDeep,0.9,0.5,0.08,false); sign.position.set(-1.2,2.0,1.36);
  const chim=mesh(G.box,M.stoneDark,0.6,1.4,0.6); chim.position.set(1.1,3.3,-0.6); const table=mesh(G.box,M.woodDark,2.6,0.8,0.8); table.position.set(-0.4,0.5,1.9); const win=mesh(G.box,M.warm,0.6,0.5,0.08,false); win.position.set(1.72,1.3,0.3); win.rotation.y=Math.PI/2; const wg=glow(0xffb060,1.8,0.6); wg.position.set(1.9,1.3,0.3);
  jewStock.position.set(0.7,0,0.9); h.add(door,r1,r2,s1,s2,chim,table,win,wg,jewStock,path,sign); h.position.copy(JEW); h.rotation.y=F.ang; h.userData.chim=new THREE.Vector3(1.1,4.1,-0.6); snowArea.add(h); snowArea.userData.jew=h;
  // kristal matkabı (makine): buz kayası üstünde döner matkap
  cdGrp=new THREE.Group(); const outc=new THREE.Group(); for(let i=0;i<7;i++){ const c=itemMesh(CRYS_GEO,i%2?M.crys:M.crysDeep); c.scale.setScalar(rand(2.5,4.2)); const a=i/7*6.283; c.position.set(Math.cos(a)*0.9,0.8,Math.sin(a)*0.9); c.rotation.set(rand(-.4,.4),rand(0,3),rand(-.4,.4)); outc.add(c); } cdGrp.add(outc);
  const fr=mesh(G.box,M.iron,3.0,0.25,0.25); fr.position.y=4.2; for(const x of [-1.4,1.4]){ const l=mesh(G.box,M.iron,0.22,4.2,0.22); l.position.set(x,2.1,0); cdGrp.add(l); } cdBit=new THREE.Group(); cdBit.position.y=3.9; const sh=mesh(G.cyl,M.metal,0.12,1.8,0.12); sh.position.y=-0.9; const tp=mesh(G.cone,M.crysDeep,0.3,0.6,0.3); tp.rotation.x=Math.PI; tp.position.y=-2.0; cdBit.add(sh,tp); const boiler=mesh(G.cyl,M.bar,0.6,1.4,0.6); boiler.position.set(2.2,0.7,0); cdGlow=glow(0x8fe6ff,4,0.5); cdGlow.position.y=1.4; cdGrp.add(fr,cdBit,boiler,cdGlow); cdGrp.position.copy(CDRILL); cdGrp.rotation.y=F.ang; cdGrp.visible=false; snowArea.add(cdGrp);
  bakeStatic(snowArea); bakeStatic(h); /* F6 */
  snowArea.visible=false; })();
const jewLbl=machLabel(JEW,4.3); const cdLbl=machLabel(CDRILL,5.0);
const snowPile=makePile(SN.at(SN.R.r+6.6,7.2),()=>Math.round((340+240*rg('jeweler'))*(1+0.12*S.level))); snowPile.id='snowPile';
const crysNodes=spotsIn(SN,9,2.2,SN.R.r-1.5,[[JEW,4.6],[CDRILL,3.6],[JEW_FRONT,2.4]]).map(p=>makeNode(p,g=>{ for(let i=0;i<4;i++){ const c=itemMesh(CRYS_GEO,i%2?M.crys:M.crysDeep); c.scale.setScalar(rand(1.4,2.4)); const a=i/4*6.283; c.position.set(Math.cos(a)*0.3,0.4,Math.sin(a)*0.3); c.rotation.set(rand(-.5,.5),rand(0,3),rand(-.5,.5)); g.add(c); } const base=mesh(G.cyl,M.crysRing,0.85,0.06,0.85,false); base.position.y=0.03; g.add(base); const gl=glow(0x5aa8ff,2.2,0.5); gl.position.y=0.7; g.add(gl); }));
for(const n of crysNodes){ scene.remove(n.g); snowArea.add(n.g); }
const crysCap=()=>30+15*rg('jeweler'); const jewSellT=()=>2.6*Math.pow(0.8,rg('jeweler')); const crysPrice=()=>(6+1.1*gw())*(1+0.12*rg('jeweler'));
const cdRate=()=>{ const l=rg('cdrill'); return l<=0?0:l*(l>=3?1.5:1)/8; };
const cminers=[]; let jewT=0, cdAcc=0;
// kar yağışı: bölgede her zaman, 9. seferde her yerde
const snowPts=(function(){ const n=700; const geo=new THREE.BufferGeometry(); const a=new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3]=rand(-35,35); a[i*3+1]=rand(0,22); a[i*3+2]=rand(-35,35); } geo.setAttribute('position',new THREE.BufferAttribute(a,3)); const m=new THREE.PointsMaterial({color:0xffffff,size:0.28,transparent:true,opacity:0.85,depthWrite:false}); const P=new THREE.Points(geo,m); P.frustumCulled=false; P.visible=false; scene.add(P); return P; })();
function updateSnowfall(dt){ const p=player.g.position; const nearSnow=revealed('snow')&&Math.hypot(p.x-SN.C.x,p.z-SN.C.z)<45; const on=nearSnow||isWinter(); snowPts.visible=on; if(!on) return; const c=nearSnow?SN.C:p; snowPts.position.set(c.x,0,c.z); const a=snowPts.geometry.attributes.position; const t=performance.now()/1000; for(let i=0;i<a.count;i++){ let y=a.getY(i)-dt*(2.2+(i%5)*0.3); if(y<0) y+=22; a.setY(i,y); a.setX(i,a.getX(i)+Math.sin(t+i)*dt*0.3); } a.needsUpdate=true; }
function updateSnow(dt){ const t=performance.now()/1000;
  playerHarvest(crysNodes,{key:'crystal',hits:3,cd:0.42,regrow:20,yield:()=>2,name:T('kristal','crystals'),dest:T('kuyumcuya götür','take to Jeweler'),chip:M.crys,geo:CRYS_GEO,mat:M.crys}); for(const n of crysNodes) nodeTick(n,dt);
  deliver(dt,'crystal',JEW_FRONT,JEW,'crysIn',crysCap,CRYS_GEO,M.crys);
  updateGatherers(cminers,crysNodes,dt,{work:3.4,regrow:20,chip:M.crys,full:()=>(S.rg.crysIn||0)>=crysCap(),yield:()=>2,send:(from,n)=>sendTo(from,JEW,n,'crysIn',crysCap,CRYS_GEO,M.crys)});
  const cl=rg('cdrill'); cdGrp.visible=cl>0; cdLbl.hide=cl<=0; const cfull=(S.rg.crysIn||0)>=crysCap(); if(cl>0){ cdGrp.scale.setScalar(1+0.06*(cl-1)); const full=cfull; if(!full){ cdBit.rotation.y+=dt*(12+3*cl); cdBit.position.y=3.9+Math.sin(t*(7+cl))*0.2; cdAcc+=cdRate()*dt; cdGlow.material.opacity=0.45+0.25*Math.sin(t*6); if(Math.random()<dt*7) burst(CDRILL.clone().setY(1.2),2,M.crys,0.8); if(cdAcc>=2){ cdAcc-=2; snowSlam(); sendTo(CDRILL.clone().setY(1.4),JEW,2,'crysIn',crysCap,CRYS_GEO,M.crys); } }
    const k='c'+cl+'|'+full; if(cdLbl._k!==k){ cdLbl._k=k; cdLbl.el.innerHTML=''; } }
  const st=S.rg.crysIn||0; jewT-=dt; if(st>0&&jewT<=0&&pileVal(snowPile)<snowPile.capFn()-0.5){ jewT=jewSellT(); S.rg.crysIn=st-1; pileAdd(snowPile,crysPrice()); pulse(snowArea.userData.jew,0.05); fly(JEW.clone().setY(1.4),snowPile.pos.clone().setY(0.8),null,false,4); }
  setStack(jewStock,Math.min(16,Math.floor(S.rg.crysIn||0))); snowFx(dt,cl,cfull); if(Math.random()<dt*1.5){ const h=snowArea.userData.jew; smokePuff(jewSmoke,h.localToWorld(h.userData.chim.clone())); } updateSmoke(jewSmoke,dt);
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
  castle.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); bakeStatic(castle,new Set([...evilWins,...evilFlags])); bakeStatic(port); /* F6 */ })();
function castleCollide(p){ if(p.x>CASTLE.x0-0.8&&p.x<CASTLE.x1+0.8&&p.z<CASTLE.z1+0.8){ const dx0=p.x-(CASTLE.x0-0.8), dx1=(CASTLE.x1+0.8)-p.x, dz=(CASTLE.z1+0.8)-p.z; const m=Math.min(dx0,dx1,dz); if(m===dz) p.z=CASTLE.z1+0.8; else if(m===dx0) p.x=CASTLE.x0-0.8; else p.x=CASTLE.x1+0.8; } }
// F9b: Kale Balistası: kale yolunda (Kuzey) dev oklar; Kara Kral ve muhafızlarını kapıya varmadan yıpratır. 5 seviye, geç oyun kaynaklarıyla (taş, altın, kereste, odun)
const BAL=new THREE.Vector3(-9,0,-76), BAL_RES=['stone','gold','plank','wood','gold'], BAL_COST=[2000,8000,600,1200,20000]; /* FX2: Sv4 odun 3500→1200: 20 bin altınlık Sv5 ulaşılabilir (geç altın yığılması) */
const balG=new THREE.Group(); balG.position.copy(BAL); balG.visible=false; scene.add(balG); let balTop=null, balBolt=null; const bolts=[]; let balCd=1;
(function(){ const base=mesh(G.cyl,M.stone,2.1,0.9,2.1); base.position.y=0.45; const base2=mesh(G.cyl,M.stoneDark,1.7,0.3,1.7); base2.position.y=1.05; balG.add(base,base2);
  balTop=new THREE.Group(); balTop.position.y=1.3; const post=mesh(G.cyl,M.woodDark,0.35,1.2,0.35); post.position.y=0.5; const stock=mesh(G.box,M.wood,0.5,0.35,3.0); stock.position.set(0,1.2,0.2);
  const arm=mesh(G.box,M.woodDark,3.6,0.22,0.3); arm.position.set(0,1.35,1.3); const armL=mesh(G.box,M.woodDark,0.25,0.2,1.0); armL.position.set(-1.7,1.35,0.9); armL.rotation.y=0.5; const armR=armL.clone(); armR.position.x=1.7; armR.rotation.y=-0.5;
  balBolt=mesh(G.cyl,M.iron,0.09,2.4,0.09,false); balBolt.rotation.x=Math.PI/2; balBolt.position.set(0,1.5,0.6); const tip=mesh(G.cone,M.metal,0.18,0.45,0.18,false); tip.rotation.x=Math.PI/2; tip.position.set(0,1.5,1.9);
  const fl=mesh(G.box,M.banner,0.04,0.55,0.8,false); fl.position.set(0,2.9,-1.0); const fp=mesh(G.cyl,M.iron,0.05,1.6,0.05); fp.position.set(0,2.3,-1.4);
  balTop.add(post,stock,arm,armL,armR,balBolt,tip,fl,fp); balG.add(balTop); })();
const balRange=()=>24+(S.lv.ballista||0), balRate=()=>3.0-0.25*(S.lv.ballista||0), balDmg=()=>D.towerDmg(12)*(6+3*(S.lv.ballista||0));
let doomNight=false;
function updateBallista(dt){ const dT=(S.level===10&&!(S.book&&S.book.boss&&S.book.boss[10]))?1:0; DOOM+=(dT-DOOM)*Math.min(1,dt*(DOOM>1?0.6:0.8)); /* F9b: son sefer ışığı */
  if(waveActive&&!doomNight&&dT&&S.wave===1){ gateAlert(T('🏰 Kara Kral\'ın ordusu kaleden çıktı!','🏰 The Black King\'s army marches from the castle!'),true); } doomNight=waveActive;
  const l=S.lv.ballista||0; balG.visible=l>0; if(l>0){ balG.scale.setScalar(0.9+0.05*l); }
  for(let i=bolts.length-1;i>=0;i--){ const b=bolts[i], t=b.target; if(t.dead){ scene.remove(b.m); bolts.splice(i,1); continue; } const to=t.g.position.clone(); to.y=1.2; const d=to.clone().sub(b.m.position), dl=d.length(); if(dl<1.0){ scene.remove(b.m); bolts.splice(i,1); damageEnemy(t,b.dmg,'bolt'); burst(to,10,M.woodDark,1.1,1.3); sfxAt(to).hit(); continue; } b.m.position.addScaledVector(d.normalize(),Math.min(dl,40*dt)); b.m.lookAt(to); }
  if(l<=0||!waveActive) return; balCd-=dt; let best=null, bs=-1; const R=balRange(); for(const e of enemies){ if(e.dead||e.hold) continue; const dd=Math.hypot(e.g.position.x-BAL.x,e.g.position.z-BAL.z); if(dd>R) continue; const sc=(e.boss?1000:e.guard?500:0)+e.hp/100-dd; if(sc>bs){ bs=sc; best=e; } }
  if(!best){ if(balBolt) balBolt.visible=true; return; } const ang=Math.atan2(best.g.position.x-BAL.x,best.g.position.z-BAL.z); balTop.rotation.y=lerpAng(balTop.rotation.y,ang,Math.min(1,dt*6));
  if(balCd<=0){ balCd=balRate(); const m=mesh(G.cyl,M.iron,0.1,2.2,0.1,false); const w=new THREE.Group(); m.rotation.x=Math.PI/2; w.add(m); w.position.set(BAL.x,2.9,BAL.z); scene.add(w); bolts.push({m:w,target:best,dmg:balDmg()*(best.boss&&bossOf().hat==='crown'?2:1)}); tone(180,90,0.18,'sawtooth',0.05); balBolt.visible=false; setTimeout(()=>{ if(balBolt) balBolt.visible=true; },600); } }
function lerpAng(a,b,k){ let d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI; return a+d*k; }
makePad({id:'ballista', grp:'dark', ord:1, name:T('Kale Balistası','Siege Ballista'), desc:T('Kale yolundaki düşmanlara dev ok; Kara Kral\'a ×2','Giant bolts on the castle road; ×2 vs the Black King'), res:l=>BAL_RES[Math.min(4,l)], pos:()=>[-6.6,-71.4], kind:'up', key:'ballista', cost:l=>BAL_COST[Math.min(4,l)], max:5, show:()=>revealed('dark'),
  onBuy:()=>{ celebrate(BAL.clone(),1.2); camShake=0.4; toast(T('🎯 Kale Balistası: Kuzey yolunu dövüyor','🎯 Siege Ballista: pounding the North road'),'good'); }});
PAD_IC.ballista='🎯';
let castleFreed=null;
function updateCastle(dt){ const t=performance.now()/1000; const freed=(!!(S.book&&S.book.boss&&S.book.boss[10])||S.level>10)&&!castleHold; /* F9a: zafer anında kamera varınca döner */ if(freed!==castleFreed){ castleFreed=freed; for(const w of evilWins) w.material=freed?M.warm:M.evil; for(const f of evilFlags) f.material=freed?M.flag:M.enemy; /* F9a: kurtulunca altın sancak (eskiden kırmızıdan kırmızıya) */ castle.userData.eg.material.color.setHex(freed?0xffc060:0xff3a2a); }
  castle.userData.eg.material.opacity=(freed?0.3:0.25+0.2*night)+0.08*Math.sin(t*2); }
// ----- Kara Kral: canı yarıya inince öfkelenir, muhafız çağırır -----
/* F9b: öfke 3 sn önceden okunur (durur, yerde büyüyen kırmızı halka, afiş, geri sayım); sonra kara kalkan (kule %30, oyuncunun kılıcı kırar) ve
   muhafızlar kapıda değil, yolun başında (Kuzey'de kalenin kapısından) doğup yürüyerek gelir; sura anlık yük sınırı: burstCap (p3) */
const WARD_N=12;
function bossPhase(e){ if(!e.boss||e.ph2||e.dead||bossOf().hat!=='crown'||e.hp>e.maxHp*0.65) return; e.ph2=true; e.chanT=3; e.cdn=4;
  const rm=new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0.75,depthWrite:false,side:THREE.DoubleSide}); const ring=new THREE.Mesh(new THREE.RingGeometry(0.85,1,40),rm); ring.rotation.x=-Math.PI/2; ring.position.y=0.15/e.sc; e.g.add(ring); e.enrRing=ring;
  banner(T('⚠ KARA KRAL ÖFKELENİYOR','⚠ BLACK KING RAGING'),T('3 sn · Kılıcınla ona vurmaya hazırlan','3 s · get ready to strike him with your sword'),'boss'); tone(90,180,2.8,'sawtooth',0.05); camShake=Math.max(camShake,0.25); }
function kingTick(e,dt){
  if(e.chanT>0){ e.chanT-=dt; const k=1-e.chanT/3, r=e.enrRing; if(r){ const s=(1.2+6*k)/e.sc; r.scale.set(s,s,1); r.material.opacity=0.45+0.4*Math.abs(Math.sin(k*9)); } const c=Math.ceil(e.chanT); if(c<e.cdn&&c>0){ e.cdn=c; floatText(e.g.position.clone().setY(3.2*e.sc),String(c),'red'); tone(220-c*30,160-c*20,0.2,'square',0.05); }
    if(e.chanT<=0) kingEnrage(e); return; }
  if(e.ward>0&&e.aura) e.aura.material.opacity=0.45+0.25*Math.sin(gameT*8); }
let curseSaid=false;
function kingEnrage(e){ curseSaid=false; if(e.enrRing){ e.g.remove(e.enrRing); e.enrRing.geometry.dispose(); e.enrRing.material.dispose(); e.enrRing=null; } e.speed*=1.2; e.atk*=1.3; e.ward=WARD_N; const pos=e.g.position.clone();
  banner(T('KARA KRAL ÖFKELENDİ!','BLACK KING ENRAGED!'),T('Kalkan iksirleri engeller · Kılıçla kır!','Ward blocks potions · Break it with your sword!'),'boss'); SFX.night(); SFX.boom(); camShake=0.7; burst(pos.clone().setY(1.5),24,M.darkRoof,1.6,1.6); const aura=glow(0xb040ff,6,0.6); aura.position.y=2; e.g.add(aura); e.aura=aura;
  const n=4+Math.min(4,Math.floor((S.level-10)/5)); for(let i=0;i<n;i++){ makeEnemy(i%2?'knight':'raider',e.side); const m=enemies[enemies.length-1]; m.guard=true; advanceOnRoad(m,i*1.6); burst(m.g.position.clone().setY(1),8,M.darkRoof,1.2); }
  setTimeout(()=>{ if(waveActive&&!runOver) gateAlert(T(`⚔️ ${n} muhafız ${SIDE_TR[e.side]} yolundan geliyor`,`⚔️ ${n} guards coming down the ${SIDE_TR[e.side]} road`)); },2600); }
function wardHit(e){ e.ward--; burst(e.g.position.clone().setY(1.8),6,M.darkRoof,0.9); if(e.ward>0){ floatText(e.g.position.clone().setY(3*e.sc),'🛡 '+e.ward,'red'); tone(700,500,0.08,'triangle',0.05); return; }
  if(e.aura){ e.aura.material.color.setHex(0xff5a3a); e.aura.material.opacity=0.35; } floatText(e.g.position.clone().setY(3*e.sc),T('KALKAN KIRILDI!','WARD BROKEN!'),'green'); burst(e.g.position.clone().setY(1.8),22,M.gold,1.5,1.6); SFX.boom(); camShake=Math.max(camShake,0.35); toast(T('🛡 Kara kalkan kırıldı: kuleler yine tam vuruyor!','🛡 Ward broken: towers hit him fully again!'),'good'); }
function kingWardT(){ if(!waveActive||runOver) return null; const b=enemies.find(o=>o.boss&&!o.dead&&(o.chanT>0||o.ward>0)); return b?b.g.position:null; }

// F9a: son zafer anı: kamera Kara Kale'ye gider, kara sancaklar düşer, pencereler sıcak ışığa döner, sancaklar krallığın rengiyle yükselir, havai fişek; sonra çark ve kart
let castleHold=false, endM=null;
function castleMoment(cb){ if(endM) return; endM={t:0,cb,z0:zoomTarget}; castleHold=true; follow=false; }
function updateEnding(dt){ const m=endM; if(!m) return; m.t+=dt; const p=player.g.position; const C=[-2,-93]; const tgt=new THREE.Vector3(C[0]-p.x,0,C[1]-p.z); const KP=new THREE.Vector3(4.2,0,-93);
  if(m.t<1.3){ camPan.lerp(tgt,Math.min(1,dt*3.2)); zoomTarget=Math.max(zoomTarget,1.75*(camera.aspect>1?1:1.1)); return; }
  camPan.copy(tgt);
  const fall=clamp((m.t-1.3)/0.7,0,1), rise=clamp((m.t-2.3)/0.8,0,1);
  for(const f of evilFlags){ const u=f.userData; if(u.y0===undefined) u.y0=f.position.y; if(m.t<2.3){ f.scale.y=Math.max(0.02,1-fall); f.position.y=u.y0-1.2*fall; } else { f.scale.y=Math.max(0.02,rise); f.position.y=u.y0-1.2*(1-rise); } }
  if(!m.a&&m.t>1.3){ m.a=1; SFX.boom(); camShake=0.45; burst(KP.clone().setY(8),24,M.darkRoof,1.8,2); }
  if(!m.b&&m.t>2.3){ m.b=1; castleHold=false; SFX.fanfare(); celebrate(KP.clone(),1.8); burst(KP.clone().setY(10),30,M.gold,2,2.2); banner(T('Orman kurtuldu!','The forest is safe!'),T('Kara Kale artık senin','The Black Castle is yours'),'day'); }
  if(m.b&&m.t<5.2&&Math.floor(m.t/0.45)!==m.fw){ m.fw=Math.floor(m.t/0.45); const q=new THREE.Vector3(C[0]+rand(-11,11),rand(9,15),C[1]+rand(-7,7)); burst(q,18,Math.random()<0.5?M.gold:M.banner,2.2,1.4); tone(500+rand(0,500),900,0.12,'triangle',0.03); }
  if(m.t>=5.6){ for(const f of evilFlags){ f.scale.y=1; if(f.userData.y0!==undefined) f.position.y=f.userData.y0; } endM=null; castleHold=false; zoomTarget=m.z0; recenter(); const cb=m.cb; setTimeout(()=>cb&&cb(),300); } }
// ----- oyun sonu kartı: orman kurtarıldı (gerçek sayaçlar) → sonsuz kuşatma tanıtımı → Gece 1 -----
function showEndCard(st,gain,first){ const b=S.book, sm=o=>Object.values(o||{}).reduce((a,v)=>a+v,0), X=(S.meta&&S.meta.st)||{}; const towersN=S.towers.filter(t=>t.lvl>0).length;
  const rows=[[T('Atlatılan gece','Nights survived'),Math.max(X.nights||0,LEVELS*WAVES)],[T('Yenilen düşman','Enemies defeated'),S.kills||0],[T('Yenilen patron','Bosses defeated'),Object.keys(b.boss||{}).length],[T('Kurulan kule','Towers built'),towersN],[T('Tutulan balık','Fish caught'),Math.max(X.fish||0,sm(b.fish))],[T('Avlanan hayvan','Animals hunted'),Math.max(X.meat||0,sm(b.hunt))],[T('Açılan sandık','Chests opened'),sm(b.chest)],[T('Kesilen ağaç','Trees chopped'),S.treesCut||0]].filter(r=>r[1]>0);
  const card=document.createElement('div'); card.className='intro'; card.id='winCard';
  card.innerHTML=`<div class="card result end"><div class="bigstars">${[1,2,3].map(i=>`<span class="st${i<=st?' on':''}" style="animation-delay:${0.25+i*0.35}s">★</span>`).join('')}</div><h1>${T('Ormanı kurtardın!','You saved the forest!')}</h1><p class="boss">${T('Kara Kral yenildi · Kara Kale artık senin','The Black King is defeated · the Black Castle is yours')}</p><div class="away">${rows.map(r=>`<div><span>${r[0]}</span><b>${Math.round(r[1]).toLocaleString(LANG==='tr'?'tr':'en')}</b></div>`).join('')}</div><div class="crowns">${T(`👑 +${gain} taç`,`👑 +${gain} crown${gain===1?'':'s'}`)}${first?T(' · ilk zafer bonusu',' · first win bonus'):''}</div><button id="winNext">${T('Sonsuz Kuşatma →','Endless Siege →')}</button><button id="winMap" class="ghost">${T('Krallık','Kingdom')}</button></div>`;
  document.body.appendChild(card); for(let i=0;i<5;i++) setTimeout(()=>{ celebrate(new THREE.Vector3(rand(-10,10),0,rand(-10,10)),1.4); confetti(); },400+i*700); SFX.win();
  $('winNext').addEventListener('click',()=>{ audio(); endlessIntro(card); });
  $('winMap').addEventListener('click',()=>{ audio(); card.remove(); nextSefer(true); showMap(); }); }
function endlessIntro(card){ const n1=eNight(LEVELS+1,1);
  card.innerHTML=`<div class="card result endless"><h1>♾ ${ENAME()}</h1><p class="boss">${T('Orman güvende, ama Kara Kral\'ın orduları gelmeye devam ediyor.','The forest is safe, but the Black King\'s armies keep coming.')}</p><ul class="egoal"><li><i>🌙</i><span>${T('<b>Olabildiğince çok gece dayan.</b> Her gece biraz daha güçlüler.','<b>Survive as many nights as you can.</b> Each night is a little stronger.')}</span></li><li><i>💀</i><span>${T('Her 5. gece bir patron gelir.','A boss comes every 5th night.')}</span></li><li><i>🏅</i><span>${T('Her 5 gecede: 👑 taç + 🃏 güç kartı.','Every 5 nights: 👑 crowns + a 🃏 power card.')}</span></li><li><i>⬆</i><span>${T('Her patrondan sonra kuleler, sur ve askerler daha üst seviyelere geliştirilebilir.','After every boss, Towers, Walls and Soldiers can be upgraded further.')}</span></li><li><i>🏆</i><span>${T('Kaybedersen aynı gece baştan başlar. Rekorunu geç!','Lose and the same night starts over. Beat your record!')}</span></li></ul><button id="winNext">${T(`Başla · Gece ${n1} →`,`Begin · Night ${n1} →`)}</button></div>`;
  $('winNext').addEventListener('click',()=>{ audio(); card.remove(); const go=()=>nextSefer(); cgAd('midgame',go,go); }); }
function chestBook(){ const b=S.book.chest||{}; return `<h3 class="bkh">🎁 ${T('Sandıklar','Chests')}</h3><div class="book">${Object.keys(RAR).map(k=>{ const n=b[k]||0; return `<div class="bk${n?'':' no'}"><i style="background:#${RAR[k].c.toString(16).padStart(6,'0')};border-radius:3px"></i><b>${n?T(RAR[k].n+' sandık',RAR[k].n+' chest'):'???'}</b><small>${n?'×'+n:''}</small></div>`; }).join('')}</div>`; }

// ----- alanlar (satın alma noktaları) -----
const padAt=(F,s)=>()=>{ const v=F.at(F.R.r+7.2,s); return [v.x,v.z]; };
const P6=[
  {id:'lamp', grp:'swamp', ord:1, name:T('Fener','Lantern'), desc:T('Sisli kapıda kuleler tam görür','Towers see clearly in fog'), res:'gold', pos:padAt(SW,-8.2), kind:'up', key:'lamp', cost:l=>Math.round(140*Math.pow(1.5,l)), max:4, show:()=>revealed('swamp'), onBuy:()=>{ const L=lampPosts.filter(L=>lampLit(L.s)).slice(-2); for(const x of L) celebrate(x.g.position.clone(),0.7); toast(T('🏮 '+SIDE_TR[SIDES[rg('lamp')-1]]+' kapısı aydınlandı','🏮 '+({N:'North',E:'East',S:'South',W:'West'})[SIDES[rg('lamp')-1]]+' Gate lit up'),'good'); }},
  {id:'herbalist', grp:'swamp', ord:2, name:T('Otacı','Herbalist'), desc:T('Senin yerine mantar toplar','Picks mushrooms for you'), res:'gold', pos:padAt(SW,-5.4), kind:'up', key:'herbalist', cost:l=>Math.round(240*Math.pow(1.7,l)), max:3, show:()=>revealed('swamp'), onBuy:()=>{ const w=addGatherer(herbalists,SHUT_FRONT.clone(),M.moss); celebrate(w.guy.g.position.clone(),1); }},
  {id:'farm', grp:'swamp', ord:3, lock:T('Bir otacı','1 Herbalist'), name:T('Mantar Tarlası','Mushroom Farm'), desc:T('Makine: mantar kendiliğinden yetişir','Machine: auto-grows mushrooms'), res:'gold', pos:padAt(SW,-2.6), kind:'up', key:'farm', cost:l=>Math.round(420*Math.pow(1.75,l)), max:5, show:()=>revealed('swamp')&&rg('herbalist')>=1, onBuy:()=>{ const b=farmBeds[Math.min(2,rg('farm')-1)]; celebrate(b.g.position.clone(),1.4); camShake=0.4; if(SWP.post) powerOn(SWP.post,b.g.position.clone()); }},
  {id:'cauldron', grp:'swamp', ord:4, name:T('İksir Kazanı','Potion Cauldron'), desc:T('İksir gece suru onarır','Potions mend walls at night'), res:'gold', pos:padAt(SW,1.4), kind:'up', key:'cauldron', cost:l=>Math.round(200*Math.pow(1.6,l)), max:5, show:()=>revealed('swamp'), onBuy:()=>{ celebrate(CAUL.clone(),1.2); if(SWP.post) powerOn(SWP.post); }},
  {id:'ironArrow', grp:'iron', ord:1, name:T('Delici Ok','Piercing Arrows'), desc:T('Oklar zırhı deler, +%10 hasar','Arrows pierce armor, +10% dmg'), res:'iron', pos:padAt(IR,-8.2), kind:'up', key:'ironArrow', cost:l=>Math.round(10*Math.pow(1.5,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ for(const t of towers) if(t) celebrate(t.g.position.clone(),0.4); SFX.fanfare(); toast(T('🏹 Oklar artık demir uçlu','🏹 Arrows now iron-tipped'),'good'); }},
  {id:'ironWall', grp:'iron', ord:2, name:T('Demir Kapı','Iron Gate'), desc:T('Sur canı +%12','Wall HP +12%'), res:'iron', pos:padAt(IR,-5.4), kind:'up', key:'ironWall', cost:l=>Math.round(14*Math.pow(1.5,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ S.gateHp=Math.min(D.gateMax(),S.gateHp+D.gateMax()*0.12); celebrate(new THREE.Vector3(0,0,0),0.8); }},
  {id:'miner', grp:'iron', ord:3, name:T('Madenci','Miner'), desc:T('Senin yerine cevher kazar','Mines ore for you'), res:'gold', pos:padAt(IR,-2.6), kind:'up', key:'miner', cost:l=>Math.round(320*Math.pow(1.7,l)), max:3, show:()=>revealed('iron'), onBuy:()=>{ const w=addGatherer(miners,FORGE_FRONT.clone(),M.iron); celebrate(w.guy.g.position.clone(),1); }},
  {id:'drill', grp:'iron', ord:4, lock:T('Bir madenci','1 Miner'), name:T('Maden Matkabı','Mine Drill'), desc:T('Makine: cevher kendiliğinden çıkar','Machine: auto-mines ore'), res:'gold', pos:padAt(IR,0.2), kind:'up', key:'drill', cost:l=>Math.round(620*Math.pow(1.75,l)), max:5, show:()=>revealed('iron')&&rg('miner')>=1, onBuy:()=>{ celebrate(DRILL.clone(),1.6); camShake=0.5; if(DRL.post) powerOn(DRL.post); DRL.ph=0.9; }},
  {id:'forge', grp:'iron', ord:5, name:T('Demirci Ocağı','Forge'), desc:T('Hızlı eritir, çok tutar','Smelts fast, holds more'), res:'gold', pos:padAt(IR,3.0), kind:'up', key:'forge', cost:l=>Math.round(260*Math.pow(1.6,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ celebrate(FORGE.clone(),1.2); if(FRG.post) powerOn(FRG.post); }},
  {id:'lighthouse', grp:'coast', ord:1, name:T('Deniz Feneri','Lighthouse'), desc:T('Sahile daha çok sandık vurur','More chests wash ashore'), res:'gold', pos:padAt(CO,-6.2), kind:'up', key:'lighthouse', cost:l=>Math.round(420*Math.pow(1.6,l)), max:5, show:()=>revealed('coast'), onBuy:()=>{ celebrate(LIGHT.clone(),1.4); camShake=0.4; }},
  {id:'boat', grp:'coast', ord:2, name:T('Ticaret Teknesi','Trade Boat'), desc:T('Makine: adalardan para getirir','Machine: brings gold from isles'), res:'gold', pos:padAt(CO,-3.4), kind:'up', key:'boat', cost:l=>Math.round(760*Math.pow(1.7,l)), max:5, show:()=>revealed('coast'), onBuy:()=>{ celebrate(PIER_B.clone(),1.4); camShake=0.4; if(CST.post) powerOn(CST.post); }},
  {id:'harbor', grp:'coast', ord:3, lock:T('Ticaret teknesi','Trade Boat'), name:T('Liman','Harbor'), desc:T('Seferler daha değerli; Sv3: 2. tekne','Richer trips; Lv 3: 2nd boat'), res:'gold', pos:padAt(CO,-0.6), kind:'up', key:'harbor', cost:l=>Math.round(560*Math.pow(1.6,l)), max:5, show:()=>revealed('coast')&&rg('boat')>=1, onBuy:()=>{ celebrate(WH.clone(),1.2); }},
  {id:'jeweler', grp:'snow', ord:1, name:T('Kuyumcu','Jeweler'), desc:T('Kristali pahalı ve hızlı satar','Sells crystals fast & high'), res:'gold', pos:padAt(SN,-6.2), kind:'up', key:'jeweler', cost:l=>Math.round(460*Math.pow(1.6,l)), max:5, show:()=>revealed('snow'), onBuy:()=>{ celebrate(JEW.clone(),1.2); if(SNW.post) powerOn(SNW.post); }},
  {id:'cminer', grp:'snow', ord:2, name:T('Kristalci','Crystal Miner'), desc:T('Senin yerine kristal kazar','Mines crystals for you'), res:'gold', pos:padAt(SN,-3.4), kind:'up', key:'cminer', cost:l=>Math.round(560*Math.pow(1.7,l)), max:3, show:()=>revealed('snow'), onBuy:()=>{ const w=addGatherer(cminers,JEW_FRONT.clone(),mat(0x3d63c9)); celebrate(w.guy.g.position.clone(),1); }},
  {id:'cdrill', grp:'snow', ord:3, lock:T('Bir kristalci','1 Crystal Miner'), name:T('Kristal Matkabı','Crystal Drill'), desc:T('Makine: kristal kendiliğinden çıkar','Machine: auto-mines crystals'), res:'gold', pos:padAt(SN,-0.6), kind:'up', key:'cdrill', cost:l=>Math.round(1100*Math.pow(1.75,l)), max:5, show:()=>revealed('snow')&&rg('cminer')>=1, onBuy:()=>{ celebrate(CDRILL.clone(),1.8); camShake=0.6; if(SNW.dpost) powerOn(SNW.dpost); }},
];
for(const d of P6) makePad(d);

// ----- bölgelerin ağaç renkleri: bataklıkta koyu, geçitte karlı -----
(function(){ const swampC=new THREE.Color(0x4a6a3a), snowC=new THREE.Color(0xd8e8e4), snowC2=new THREE.Color(0xb8d0c8); let any=false; trees.forEach((t,i)=>{ const ds=Math.hypot(t.x-SN.C.x,t.z-SN.C.z), dw=Math.hypot(t.x-SW.C.x,t.z-SW.C.z); if(ds<40){ treeCrown.setColorAt(i,Math.random()<0.5?snowC:snowC2); any=true; } else if(dw<34){ treeCrown.setColorAt(i,swampC); any=true; } }); if(any&&treeCrown.instanceColor) treeCrown.instanceColor.needsUpdate=true; })();
// ateş böcekleri (bataklık)
const flies=(function(){ const n=40; const geo=new THREE.BufferGeometry(); const a=new Float32Array(n*3); geo.setAttribute('position',new THREE.BufferAttribute(a,3)); const m=new THREE.PointsMaterial({color:0xd8ff8a,size:0.35,transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending}); const P=new THREE.Points(geo,m); P.frustumCulled=false; P.visible=false; scene.add(P); const seeds=[]; for(let i=0;i<n;i++) seeds.push({a:rand(0,6.28),r:rand(1,SW.R.r),h:rand(0.5,2.5),s:rand(0.2,0.6),ph:rand(0,6)}); return {P,seeds}; })();
function updateFlies(){ const t=performance.now()/1000; const a=flies.P.geometry.attributes.position; flies.seeds.forEach((s,i)=>{ const an=s.a+t*s.s*0.3; a.setXYZ(i,SW.C.x+Math.cos(an)*s.r+Math.sin(t*1.3+s.ph)*0.6,s.h+Math.sin(t*2+s.ph)*0.4,SW.C.z+Math.sin(an)*s.r); }); a.needsUpdate=true; flies.P.material.opacity=0.5+0.5*Math.max(night,0.3)*(0.6+0.4*Math.sin(t*3)); }

// ----- sen yokken (yeni bölgeler) -----
// FX2: çevrimdışı altın hızına yeni bölgelerin katkısı (canlı satış hızı; iksir rafa gider, altına sayılmaz)
function offParts6(add){
  if(revealed('coast')&&rg('boat')>0){ const trip=2*(isleDock(0).distanceTo(PIER_B))/boatSpd()+4.7; add(T('Ticaret teknesi','Trade Boat'),boatWantN()*tripValue()/trip,coastPile); }
  if(revealed('snow')) add(T('Kristalci ve matkap','Crystal Miners & Drill'),Math.min(cminers.length*2/6.5+cdRate(),1/jewSellT())*crysPrice(),snowPile); }
function offline6(sec,out){
  if(revealed('swamp')){ const rate=herbalists.length*2/5.5+farmRate(); if(rate>0){ const inn0=Math.floor(S.rg.herbIn||0), have=Math.floor(inn0+rate*sec), shelf=Math.max(0,potCap()-Math.floor(S.rg.potions||0)), v0=pileVal(swampPile), room=Math.max(0,Math.ceil((swampPile.capFn()-0.5-v0)/potPrice()));
    const can=Math.floor(sec*(0.6+0.4*Math.min(1,rg('cauldron')))/brewT()), pots=Math.max(0,Math.min(Math.floor(have/2),can,shelf)) /* F4: raf dolunca kazan bekler, iksir satılmaz (canlı oyunla aynı) */, toShelf=Math.min(shelf,pots), inn=Math.max(0,Math.min(herbCap(),have-2*pots));
    S.rg.potions=Math.floor(S.rg.potions||0)+toShelf; S.rg.herbIn=inn; pileAdd(swampPile,(pots-toShelf)*potPrice()); const g=Math.round(pileVal(swampPile)-v0), made=Math.max(0,inn-inn0+2*pots); out.gold+=g; out.herb=made; out.potions=toShelf;
    offRow(out,T('Otacı ve mantar tarlası','Herbalists & Mushroom Farm'),[made?T(`+${made} mantar`,`+${made} mushrooms`):'',toShelf?'🧪 '+toShelf:''].filter(x=>x).join(' · '),g,(pots>=shelf&&pots<Math.min(Math.floor(have/2),can))||inn>=herbCap()); } }
  if(revealed('iron')&&carts.some(c=>c.kind==='iron')){ const ore=miners.length*3/6+drillRate(); const iron=Math.min(Math.floor(sec*Math.min(ore/3,1/smeltT(),cartThru('iron'))*0.8),offCap('iron',sec)); if(iron>0){ S.iron=(S.iron||0)+iron; out.iron=iron; offRow(out,T('Madenci, matkap ve ocak','Miners, Drill & Forge'),T(`+${iron} demir`,`+${iron} iron`)); } }
  if(revealed('coast')){ if(boats.length||rg('boat')>0){ const n=boatWantN(), trip=2*(isleDock(0).distanceTo(PIER_B))/boatSpd()+4.7, tv=tripValue(), v0=pileVal(coastPile), room=Math.max(0,Math.ceil((coastPile.capFn()-0.5-v0)/tv)), can=Math.floor(n*sec/trip), k=Math.min(can,room);
      pileAdd(coastPile,k*tv); const g=Math.round(pileVal(coastPile)-v0); out.gold+=g; out.boat=k; offRow(out,T('Ticaret teknesi','Trade Boat'),k?T(`${k} sefer`,`${k} trip${k===1?'':'s'}`):'',g,k<can); }
    const want=Math.max(0,Math.min(chestMax()-chests.filter(c=>!c.open).length,Math.floor(sec/chestEvery()))); for(let i=0;i<want;i++) spawnChest(true); const waiting=chests.filter(c=>!c.open).length; if(waiting>0){ out.chests=waiting; chestCall=waiting; offRow(out,T('Sahilde seni bekleyen sandık','Chests waiting on the beach'),'🎁 '+waiting); } }
  if(revealed('snow')){ const rate=cminers.length*2/6.5+cdRate(); if(rate>0){ const r=offChain(sec,rate,'crysIn',crysCap(),jewSellT(),crysPrice(),snowPile); out.crystal=r.made; out.gold+=r.gold; offRow(out,T('Kristalci ve matkap','Crystal Miners & Drill'),r.made?T(`+${r.made} kristal`,`+${r.made} crystals`):'',r.gold,r.full); } }
  return out; }
// ----- rehber (yeni bölgeler) -----
// bölge işleri (p5 rgJobs ile aynı biçim): elle toplama hedefi, teslim yeri, satışın para yığını
function jobs6(J){ const p=player.g.position; const near=(list)=>{ let best=null,bd=1e9; for(const n of list){ if(!n.alive||n.claimed) continue; const d=Math.hypot(n.pos.x-p.x,n.pos.z-p.z); if(d<bd){ bd=d; best=n; } } return best; }; const at=(n,text)=>n?{t:n.pos.clone(),text}:null;
  if(revealed('swamp')) J.push({rg:'swamp',key:'herb',n:S.herb||0,cap:carryCap(),g:()=>at(near(mushNodes),T('Bataklıkta mantar topla','Pick mushrooms in the swamp')),d:()=>(S.rg.herbIn||0)<herbCap()?{t:SHUT_FRONT,text:T('Mantarı iksir kazanına götür','Take mushrooms to the Cauldron')}:null,P:swampPile,
    ok:()=>(S.rg.herbIn||0)<Math.min(12,herbCap()*0.6)&&!(pileVal(swampPile)>=swampPile.capFn()-0.5&&(S.rg.potions||0)>=potCap()),load:jobLoad(swampPile,S.rg.herbIn||0,herbCap())});
  if(revealed('iron')) J.push({rg:'iron',key:'ore',n:S.ore||0,cap:carryCap(),g:()=>at(near(oreNodes),T('Demir cevheri kaz','Mine iron ore')),d:()=>(S.rg.oreIn||0)<oreCap()?{t:FORGE_FRONT,text:T('Cevheri demirci ocağına götür','Take ore to the Forge')}:null,
    ok:()=>(S.rg.oreIn||0)<oreCap()*0.8&&pads.some(pd=>padVisible(pd)&&padRes(pd)==='iron'&&!padAvail(pd)),load:jobLoad(null,S.rg.oreIn||0,oreCap())});
  if(revealed('coast')){ const ch=chests.find(c=>!c.open&&c.k>=1); J.push({rg:'coast',key:'fish',n:S.fish||0,cap:fishCap(),pri:ch?2:0,g:()=>ch?{t:ch.g.position.clone(),text:T(RAR[ch.rar].n+' sandık! Sahilde aç',RAR[ch.rar].n+' chest! Open it on the beach')}:{t:PIER_END,text:T('Deniz iskelesinde balık tut','Fish at the sea pier')},
    d:fishDrop,P:coastPile,ok:()=>!!ch||!!fishDrop(),load:jobLoad(coastPile,0,0)}); }
  if(revealed('snow')) J.push({rg:'snow',key:'crystal',n:S.crystal||0,cap:carryCap(),g:()=>at(near(crysNodes),T('Kristal kaz','Mine crystals')),d:()=>(S.rg.crysIn||0)<crysCap()?{t:JEW_FRONT,text:T('Kristali kuyumcuya götür','Take crystals to Jeweler')}:null,P:snowPile,
    ok:()=>(S.rg.crysIn||0)<crysCap()*0.5,load:jobLoad(snowPile,S.rg.crysIn||0,crysCap())});
}
const PIER_T=PIER_A.clone().lerp(PIER_B,0.98).addScaledVector(PIER_B.clone().sub(PIER_A).normalize(),-1.05);
function collide6(p){ waterCollide(p,SC,SEA.r-0.3,PIER_A,PIER_T,1.05); castleCollide(p); solids6(p); }
/* F6: bölge binaları katı (kutu/daire): oyuncu içinden geçmez, kenarından kayar; teslim noktaları dışarıda kalır */
let near6P=null; const near6=(F,m)=>{ const p=near6P; return Math.hypot(p.x-F.C.x,p.z-F.C.z)<F.R.r+m; };
function solids6(p){ near6P=p;
  if(revealed('swamp')&&near6(SW,8)){ boxPush(p,SHUT,SW.ang,1.8+PR,-1.5-PR,1.4+PR); circPush(p,CAUL.x,CAUL.z,1.3+PR); for(const t of SW_DEAD) circPush(p,t.x,t.z,0.35+PR); }
  if(near6(IR,34)){ for(const k of IRON_PEAKS) circPush(p,k[0],k[1],k[2]*0.88+PR); if(revealed('iron')){ boxPush(p,FORGE,IR.ang,1.9+PR,-1.6-PR,1.6+PR); boxPush(p,MINE,IR.ang,3.0+PR,-3.8-PR,0.3+PR); if(drillGrp.visible) circPush(p,DRILL.x,DRILL.z,1.3+PR); } }
  if(revealed('coast')&&near6(CO,10)){ boxPush(p,WH,CO.ang,1.9+PR,-1.5-PR,1.5+PR); if(lighthouse.visible) circPush(p,LIGHT.x,LIGHT.z,1.1+PR); }
  if(revealed('snow')&&near6(SN,8)){ boxPush(p,JEW,SN.ang,1.8+PR,-1.4-PR,1.4+PR); if(cdGrp.visible) circPush(p,CDRILL.x,CDRILL.z,1.4+PR); } }
/* rehber yolu için büyük engeller [x,z,r] */
function obstacles6(o){ if(revealed('swamp')) o.push([SHUT.x,SHUT.z,2.6],[CAUL.x,CAUL.z,1.9]); if(revealed('iron')) o.push([FORGE.x,FORGE.z,2.6],[MINE.x,MINE.z,3.6]); for(const k of IRON_PEAKS) o.push([k[0],k[1],k[2]*0.88+0.6]); if(revealed('coast')) o.push([WH.x,WH.z,2.5]); if(revealed('snow')) o.push([JEW.x,JEW.z,2.4]); }
// ----- ana güncelleme / kurulum / sıfırlama -----
function vis6(){ swamp.visible=revealed('swamp'); ironArea.visible=revealed('iron'); coast.visible=revealed('coast'); snowArea.visible=revealed('snow'); flies.P.visible=revealed('swamp'); swampPile.g.visible=revealed('swamp'); coastPile.g.visible=revealed('coast'); snowPile.g.visible=revealed('snow');
  if(!revealed('swamp')){ shutLbl.hide=true; farmLbl.hide=true; } if(!revealed('iron')){ forgeLbl.hide=true; drillLbl.hide=true; } if(!revealed('coast')) whLbl.hide=true; if(!revealed('snow')){ jewLbl.hide=true; cdLbl.hide=true; } }
let vis6T=0;
function updateRegions6(dt){ mineCd-=dt; fullWarnT-=dt; vis6T-=dt; if(vis6T<=0){ vis6T=1; vis6(); placeLamps(); if(revealed('iron')&&!carts.some(c=>c.kind==='iron')) addCart('iron'); }
  updateFog(dt); updateSea(dt); updateCastle(dt); updateBallista(dt); updateSnowfall(dt);
  updateP7(dt);
  if(revealed('swamp')){ updateSwamp(dt); updateFlies(); } if(revealed('iron')) updateIron(dt); if(revealed('coast')) updateCoast(dt); if(revealed('snow')) updateSnow(dt); }
function initRegions6(){ vis6(); restoreBeach(); placeLamps(); for(let i=herbalists.length;i<rg('herbalist');i++) addGatherer(herbalists,SHUT_FRONT.clone(),M.moss); for(let i=miners.length;i<rg('miner');i++) addGatherer(miners,FORGE_FRONT.clone(),M.iron); for(let i=cminers.length;i<rg('cminer');i++) addGatherer(cminers,JEW_FRONT.clone(),mat(0x3d63c9)); if(revealed('iron')&&!carts.some(c=>c.kind==='iron')) addCart('iron'); }
function resetRegions6(){ clearGatherers(herbalists); clearGatherers(miners); clearGatherers(cminers); for(const b of boats) scene.remove(b.g); boats.length=0; for(const c of chests) scene.remove(c.g); chests.length=0; for(const n of [...mushNodes,...oreNodes,...crysNodes]){ n.alive=true; n.pop=1; n.claimed=null; n.hp=0; } castleFreed=null; resetP7(); }
// =====================================================================
// ---------- p7: vuruş hissi, patron sandığı + çark, günlük görevler, sal/korsan gemisi, düşman okçu, kış ----------
// =====================================================================
Object.assign(M,{ flashW:new THREE.MeshBasicMaterial({color:0xffffff}), raft:mat(0x9a6a3a), pirateSail:mat(0x1d1d22,{side:THREE.DoubleSide}), skull:mat(0xf4efe4), eArrow:mat(0xd04a2a,{emissive:0x5a1408}) });

// ----- vuruş hissi: beyaz parlama, seri öldürme sesi, patron ölünce ağır çekim -----
function flashOn(e){ if(!e.fm){ e.fm=[]; e.g.traverse(o=>{ if(o.isMesh) e.fm.push([o,o.material]); }); } for(const f of e.fm) f[0].material=M.flashW; }
function flashOff(e){ if(e.fm) for(const f of e.fm) f[0].material=f[1]; }
let comboN=0, comboAt=-9;
function comboKill(e){ comboN=gameT-comboAt<1.4?comboN+1:1; comboAt=gameT; const k=Math.min(14,comboN-1); tone(400*(1+0.07*k),80+20*k,0.2,'sawtooth',0.05); if(k>=3) tone(900+80*k,1300+90*k,0.08,'triangle',0.035);
  if(comboN>=5&&comboN%5===0){ const bonus=Math.round((4+gw()*0.8)*comboN/5); dropCoins(e.g.position.clone().setY(1.2),Math.min(10,3+comboN/5),bonus/Math.min(10,3+comboN/5),2,1.2); floatText(e.g.position,T(`SERİ ×${comboN}! +${bonus}`,`COMBO ×${comboN}! +${bonus}`),'green'); camShake=Math.max(camShake,0.2); } }

// ----- patron sandığı: patron ölünce yere büyük altın sandık düşer, sefer sonunda çark döner -----
const bossChests=[];
function spawnBossChest(pos){ const g=new THREE.Group(); const body=mesh(G.box,M.chestGold,1.8,1.0,1.2); body.position.y=0.5; const lidG=new THREE.Group(); lidG.position.set(0,1.0,-0.6); const lid=mesh(G.box,M.chestGold,1.84,0.42,1.24); lid.position.set(0,0.21,0.6); lidG.add(lid);
  for(const x of [-0.6,0,0.6]){ const b=mesh(G.box,M.chest,0.14,1.04,1.24,false); b.position.set(x,0.5,0); g.add(b); const b2=mesh(G.box,M.chest,0.14,0.44,1.26,false); b2.position.set(x,0.21,0.6); lidG.add(b2); }
  for(const [x,c] of [[-0.55,0xff4a6a],[0,0x4ab0ff],[0.55,0x6aff8a]]){ const gem=mesh(G.dod,mat(c,{emissive:new THREE.Color(c).multiplyScalar(0.5)}),0.13,0.13,0.13,false); gem.position.set(x,0.75,0.62); g.add(gem); }
  const gl=glow(0xffd23f,5,0.8); gl.position.y=1.4; const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.6,1.0,14,14,1,true),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:0.35,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); beam.position.y=7;
  g.add(body,lidG,gl,beam); g.position.set(pos.x,0,pos.z); g.scale.setScalar(0.01); scene.add(g); bossChests.push({g,lidG,gl,beam,t:0,burst:false}); }
function updateBossChests(dt){ for(const c of bossChests){ c.t+=dt; const k=Math.min(1,c.t/0.5); c.g.scale.setScalar(Math.max(0.01,k*(1+0.25*Math.sin(k*Math.PI)))); c.g.position.y=Math.max(0,3*(1-k)); c.beam.material.opacity=0.25+0.12*Math.sin(c.t*4); c.gl.material.opacity=0.6+0.3*Math.sin(c.t*5);
    if(c.t>0.9){ c.lidG.rotation.x=-Math.min(1.9,(c.t-0.9)*5); if(!c.burst){ c.burst=true; celebrate(c.g.position.clone(),1.6); burst(c.g.position.clone().setY(1.4),30,M.chestGold,1.8,1.6); SFX.fanfare(); } } } }
function clearBossChests(){ for(const c of bossChests){ scene.remove(c.g); freeOwned(c.g); } bossChests.length=0; }
// çark: 8 dilim; nadir büyük ödül; kıl payı kaçırma hissi
// Dilimler seferin açık bölgelerine göre kurulur: dilimde görünen ödül (simge + miktar) ödenen ödülün aynısıdır
function wheelSlices(){ const w=gw(), L=S.level, g=Math.round(120+25*w), gb=Math.round(180+30*w), gr=g*3, ns=20+3*L, np=12+2*L, ni=6+L;
  const gold=n=>()=>{ S.coins+=n; return T(`+${n} altın`,`+${n} gold`); }, crowns=n=>()=>{ S.meta.crowns+=n; return n>=6?T(`+${n} taç — büyük ödül!`,`+${n} crowns — jackpot!`):T(`+${n} taç`,`+${n} crowns`); };
  return [{i:'<span class="coin-dot"></span>',n:T('Altın','Gold'),a:'+'+g,w:28,c:'#f2b43c',pay:gold(g)},
    revealed('river')?{i:'<span class="plank-dot"></span>',n:T('Kereste','Planks'),a:'+'+np,w:14,c:'#c98d4e',pay:()=>{ S.planks=(S.planks||0)+np; return T(`+${np} kereste`,`+${np} planks`); }}
      :{i:'<span class="stone-dot"></span>',n:T('Taş','Stone'),a:'+'+ns,w:14,c:'#a39e93',pay:()=>{ S.stone+=ns; setStonePile(Math.min(18,S.stone)); return T(`+${ns} taş`,`+${ns} stone`); }},
    {i:'👑',n:T('+2 taç','+2 crowns'),a:'+2',w:14,c:'#e8961a',pay:crowns(2)},
    {i:'💰',n:T('Altın yağmuru','Gold rain'),a:'+'+gr,w:10,c:'#ffd23f',pay:gold(gr)},
    revealed('iron')?{i:'⛓️',n:T('Demir','Iron'),a:'+'+ni,w:12,c:'#9aa3ad',pay:()=>{ S.iron=(S.iron||0)+ni; return T(`+${ni} demir`,`+${ni} iron`); }}
      :{i:'👛',n:T('Altın kesesi','Gold pouch'),a:'+'+gb,w:12,c:'#8fb8de',pay:gold(gb)},
    {i:'🏆',n:T('+6 taç','+6 crowns'),a:'+6👑',w:4,c:'#d9534f',jack:true,pay:crowns(6)},
    {i:'🎁',n:T('Hediye','Gift'),a:'?',w:14,c:'#7cc47f',pay:gold(g)},
    {i:'🃏',n:T('Hazır güç kartı','Free power card'),a:'',w:4,c:'#3d63c9',pay:()=>{ S.meta.nextCard=(S.meta.nextCard||0)+1; return endless()?T('Sonraki geceye bir güç kartıyla başlarsın','Power card for the next night!'):T('Sonraki sefere bir güç kartıyla başlarsın','Power card for next chapter!'); }}]; }
function wheelReward(k,W){ W=W||wheelSlices()[k]||wheelSlices()[0]; const at=player.g.position.clone(); const txt=W.pay();
  coinPop(); celebrate(at,W.jack?2:1.1); if(W.jack) confetti(); if(S.post) S.post.wheel=1; save(); return W.i+' '+txt; }
function showBossWheel(done){ if($('wheelCard')){ done&&done(); return; } const card=document.createElement('div'); card.className='intro'; card.id='wheelCard';
  const WHEEL=wheelSlices(); const lbl=WHEEL.map((s,i)=>{ const a=i*45+22.5; return `<span style="transform:rotate(${a}deg)"><b style="transform:rotate(${-a}deg)">${s.i}</b><i style="transform:rotate(${-a}deg)">${s.a}</i></span>`; }).join(''); /* FX3: simge ve miktar dik durur */ const grad=WHEEL.map((s,i)=>`${s.c} ${i*45}deg ${(i+1)*45}deg`).join(',');
  card.innerHTML=`<div class="card wheelCard"><h1>${T('Patron sandığı!','Boss Chest!')}</h1><p>${T(`${bossName()} yenildi. Çarkı çevir, ödülünü al.`,`${bossName()} defeated. Spin for your prize!`)}</p><div class="wheel"><i class="wpin"></i><div class="wdisc" id="wdisc" style="background:conic-gradient(${grad})">${lbl}<em></em></div></div><p class="wres" id="wres">&nbsp;</p><button id="wheelSpin" class="gold">${T('ÇEVİR!','SPIN!')}</button><button id="wheelOk" style="display:none">${T('Devam →','Continue →')}</button></div>`;
  document.body.appendChild(card); SFX.card();
  $('wheelSpin').addEventListener('click',()=>{ audio(); const b=$('wheelSpin'); if(b.disabled) return; b.disabled=true; b.textContent=T('Dönüyor…','Spinning…');
    let k=S.post&&S.post.k>=0?S.post.k:-1; if(k<0){ let tot=0; for(const s of WHEEL) tot+=s.w; let r=Math.random()*tot; k=0; for(let i=0;i<WHEEL.length;i++){ r-=WHEEL[i].w; if(r<=0){ k=i; break; } } if(S.post){ S.post.k=k; save(); } } // sonuç kaydedilir: yeniden yüklemek çarkı yeniden çevirtmez
    const J=5; let off=rand(8,37); if(k===J-1) off=rand(40,43.5); else if(k===J+1) off=rand(1.5,5); const rot=360*6-(k*45+off);
    const disc=$('wdisc'); disc.style.transition='transform 3.6s cubic-bezier(.12,.72,.18,1)'; disc.style.transform=`rotate(${rot}deg)`;
    /* FX4: tıklar çarkın gerçek açısından: her dilim sınırı iğneden geçerken bir tık (hızlıyken sık, yavaşlarken seyrek; son yavaş geçişler de duyulur), iğne her tıkta seker; durunca kazanan dilim parlar */
    { const bz=(x1,y1,x2,y2,x)=>{ let lo=0,hi=1,t=x; for(let i=0;i<22;i++){ t=(lo+hi)/2; const xx=3*x1*t*(1-t)*(1-t)+3*x2*t*t*(1-t)+t*t*t; if(xx<x) lo=t; else hi=t; } return 3*y1*t*(1-t)*(1-t)+3*y2*t*t*(1-t)+t*t*t; }; const t0=performance.now(), pin=card.querySelector('.wpin'); let lastS=0, lastTick=0;
      const step=()=>{ if(!document.body.contains(card)) return; const x=Math.min(1,(performance.now()-t0)/3600), sl=Math.floor(bz(.12,.72,.18,1,x)*rot/45); if(sl!==lastS){ lastS=sl; const now=performance.now(); if(now-lastTick>28){ lastTick=now; tone(900+500*x,700+300*x,0.03,'square',0.035); if(pin&&pin.animate&&!document.body.classList.contains('calm')) try{ pin.animate([{transform:'translateX(-50%) rotate(-20deg)'},{transform:'translateX(-50%) rotate(0deg)'}],{duration:90}); }catch(e){} } }
        if(x<1){ setTimeout(step,16); return; } const sp=card.querySelectorAll('.wdisc span')[k], bb=sp&&sp.querySelector('b'); if(bb){ bb.style.transition='transform .25s cubic-bezier(.2,1.6,.4,1)'; bb.style.transform='scale(1.35)'; bb.style.filter='drop-shadow(0 0 5px #fff) drop-shadow(0 0 3px #ffd23f)'; } tone(520,390,0.09,'triangle',0.06); }; step(); }
    setTimeout(()=>{ const txt=wheelReward(k,WHEEL[k]); const res=$('wres'); if(res) res.innerHTML=`<b>${txt}</b>${(k===J-1||k===J+1)?'<small>'+T('Büyük ödüle kıl payı!','So close to the jackpot!')+'</small>':''}`; if(WHEEL[k].jack) SFX.win(); else SFX.fanfare(); b.style.display='none'; const ok=$('wheelOk'); if(ok) ok.style.display=''; },3800); });
  $('wheelOk').addEventListener('click',()=>{ audio(); card.remove(); clearBossChests(); done&&done(); }); }
function applyNextCard(){ S.wheelCards={}; const n=(S.meta&&S.meta.nextCard)||0; if(!n) return; S.meta.nextCard=0; const ks=['arrow','rate','range','powder','wall','drill'].filter(cardUseful); for(let i=0;i<n;i++){ const k=ks[Math.floor(Math.random()*ks.length)]; S.cards[k]=(S.cards[k]||0)+1; S.wheelCards[k]=(S.wheelCards[k]||0)+1; if(k==='wall') S.gateHp=D.gateMax(); setTimeout(()=>toast('🃏 '+CARDS[k].i+' '+CARDS[k].n,'good'),2600+i*2600); } }

// ----- günlük görevler: her gün 3 görev, bitince taç + altın -----
const QPOOL=[
  {k:'chop',t:n=>T(`${n} ağaç kes`,`Chop ${n} trees`),b:25,s:10},{k:'kill',t:n=>T(`${n} düşman yen`,`Defeat ${n} enemies`),b:40,s:25},{k:'night',t:n=>T(`${n} gece atlat`,`Survive ${n} nights`),b:3,s:1},{k:'buy',t:n=>T(`${n} geliştirme yap`,`Upgrade ${n} times`),b:8,s:3},
  {k:'pile',t:n=>T(`Yığınlardan ${n} altın topla`,`Collect ${n} gold from piles`),b:250,s:300,need:()=>revealed('lake')||revealed('meadow')},{k:'fish',t:n=>T(`${n} balık tut`,`Catch ${n} fish`),b:8,s:3,g:1,need:()=>qRegion('fish',['lake','coast'])},{k:'hunt',t:n=>T(`${n} hayvan avla`,`Hunt ${n} animals`),b:8,s:3,g:1,need:()=>qRegion('hunt',['meadow'])},
  {k:'herb',t:n=>T(`${n} mantar topla`,`Gather ${n} mushrooms`),b:12,s:4,g:1,need:()=>qRegion('herb',['swamp'])},{k:'mine',t:n=>T(`${n} cevher ya da kristal kaz`,`Mine ${n} ore or crystals`),b:12,s:4,g:1,need:()=>qRegion('mine',['iron','snow'])},{k:'chest',t:n=>T(`Sahilde ${n} sandık aç`,`Open ${n} beach chests`),b:2,s:1,mx:4,need:()=>revealed('coast')},
];
// F8: görevler bugün yapılabilecek olandan üretilir: elle toplama yalnız bu/önceki seferin bölgesinde ya da oyuncunun son seferlerde yaptığı işte; "yükselt" kalan seviye kadar; yapılamaz hale gelen görev değiştirilir; alınmamış biten görevin ödülü ertesi gün verilir
function qRegion(k,ids){ const u=(S.meta&&S.meta.qUse)||{}; return ids.some(id=>revealed(id)&&(REG[id].sefer>=S.level-1||(u[k]||0)>=S.level-1)); }
function upgradesLeft(){ let n=0; for(const pd of pads){ const d=pd.def; if(d.id==='tribute'||pd.locked||(d.grp&&!revealed(d.grp))) continue; let sh=false; try{ sh=d.show(); }catch(e){} if(sh&&d.max>0) n+=Math.max(0,d.max-padLevel(d)); } return n; }
function questN(q){ const tier=Math.min(6,Math.floor((S.level-1)/2)); let n=q.b+q.s*(q.g?Math.min(2,tier):tier); if(q.mx) n=Math.min(q.mx,n); if(q.k==='buy') n=Math.min(n,Math.floor(upgradesLeft()*0.6)); return n; }
function questOk(q){ return (!q.need||q.need())&&questN(q)>=(q.k==='buy'?3:1); }
function ensureQuests(){ if(!S.meta) return null; const day=dayKey(); const Q=S.meta.quests;
  if(Q&&Q.day===day&&Array.isArray(Q.list)){ if(Date.now()-(ensureQuests.t||0)<4000) return Q; ensureQuests.t=Date.now(); for(let i=0;i<Q.list.length;i++){ const q=Q.list[i], d=QPOOL.find(x=>x.k===q.k); if(!d||q.claimed||q.have>=q.n) continue; const left=q.k==='buy'?upgradesLeft():1e9; if(questOk(d)&&left>=q.n-q.have) continue; const alt=QPOOL.filter(x=>questOk(x)&&!Q.list.some(y=>y.k===x.k)); if(alt.length){ const a=alt[Math.floor(Math.random()*alt.length)]; Q.list[i]={k:a.k,n:questN(a),have:0,claimed:false,rw:q.rw}; } else if(q.k==='buy') q.n=Math.max(q.have+1,Math.min(q.n,q.have+left)); } return Q; }
  if(Q&&Array.isArray(Q.list)){ let cr=0; for(const q of Q.list) if(q.have>=q.n&&!q.claimed){ q.claimed=true; cr+=q.rw; S.coins+=Math.round(60+20*gw()); } if(cr>0){ S.meta.crowns+=cr; setTimeout(()=>toast(T(`📜 Dünün görevleri: +${cr} 👑`,`📜 Yesterday's quests: +${cr} 👑`),'good',true),3000); } }
  const pool=QPOOL.filter(questOk); const pick=[]; while(pick.length<3&&pool.length){ pick.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]); }
  S.meta.quests={day,list:pick.map((q,i)=>({k:q.k,n:questN(q),have:0,claimed:false,rw:2+(i===2?1:0)})),all:false}; return S.meta.quests; }
function questText(q){ const d=QPOOL.find(x=>x.k===q.k); return d?d.t(q.n):q.k; }
let questSaveT=0;
// günlük görevler ilk seferin ortasından sonra açılır (ilk dakikalarda ekran sade kalsın)
function questsOn(){ return S.level>=2||(S.wave||1)>=3; }
function questEvent(k,amt){ if(S.meta&&S.started&&k!=='night'&&k!=='kill') (S.meta.qUse||(S.meta.qUse={}))[k]=S.level; if(!S.started||!S.meta||!questsOn()) return; const Q=ensureQuests(); if(!Q) return; for(const q of Q.list){ if(q.k!==k||q.have>=q.n) continue; q.have=Math.min(q.n,q.have+(amt||1)); if(q.have>=q.n){ toast(T('📜 Görev tamam!','📜 Quest complete!'),'good'); SFX.card(); const c=$('questChip'); if(c){ c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } save(); } } }
function renderQuestChip(){ const c=$('questChip'); if(!c) return; const Q=started&&S.started&&questsOn()?ensureQuests():null; if(!Q){ if(c.style.display!=='none'){ c.style.display='none'; hudRectT=-1e9; } return; } if(c.style.display!=='flex'){ c.style.display='flex'; hudRectT=-1e9; } const done=Q.list.filter(q=>q.have>=q.n).length, claim=Q.list.some(q=>q.have>=q.n&&!q.claimed); const t=`📜 ${done}/3`; if(c._t!==t){ c._t=t; $('questTxt').textContent=t; } c.classList.toggle('done',claim); }
function showQuests(){ if($('questCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='questCard'; document.body.appendChild(card);
  const render=()=>{ const Q=ensureQuests(); const gold=Math.round(60+20*gw()); const allDone=Q.list.every(q=>q.claimed);
    card.innerHTML=`<div class="card"><h1>${T('Günün görevleri','Daily Quests')}</h1><p>${T('Her gün yenilenir. Bitirdiğin görevin ödülünü buradan al.','Resets daily. Claim your rewards here.')}</p>${Q.list.map((q,i)=>{ const ok=q.have>=q.n; return `<div class="q${ok?' ok':''}"><div class="qb"><b>${questText(q)}</b><div class="qbar"><i style="width:${Math.round(q.have/q.n*100)}%"></i></div><small>${Math.floor(q.have)}/${q.n}</small></div>${q.claimed?'<span class="rw">'+T('✓ Alındı','✓ Claimed')+'</span>':ok?`<button data-i="${i}" class="qget">👑 ${q.rw} + 💰 ${gold}</button>`:`<span class="rw">👑 ${q.rw}</span>`}</div>`; }).join('')}${allDone?'<p class="sub">'+T('Hepsini bitirdin — yarın yeni görevler gelecek.','All done — new quests tomorrow.')+'</p>':''}<button id="qClose">${T('Kapat','Close')}</button></div>`;
    card.querySelectorAll('.qget').forEach(b=>b.addEventListener('click',()=>{ audio(); const q=Q.list[+b.dataset.i]; if(q.claimed||q.have<q.n) return; q.claimed=true; S.meta.crowns+=q.rw; S.coins+=gold; coinPop(); SFX.fanfare(); celebrate(player.g.position.clone(),0.9); if(Q.list.every(x=>x.claimed)&&!Q.all){ Q.all=true; S.meta.crowns+=3; setTimeout(()=>toast(T('🏆 Görevler bitti: +3 👑','🏆 All quests done: +3 👑'),'good'),400); } save(); render(); }));
    $('qClose').addEventListener('click',()=>{ audio(); card.remove(); }); };
  render(); }
$('questChip').addEventListener('click',e=>{ e.stopPropagation(); audio(); showQuests(); });

// ----- kuleler hasar alır: düşman okçu kuleyi vurur; yıkılan kule susar, yanına gidersen onarırsın, gün doğunca kendiliğinden onarılır -----
const eArrows=[];
const towerMax=t=>(40+12*t.lvl)*atkK()*(t.isC?1.5:1);
function towerDownTick(t,dt){ const dmg=t.dmg||0; if(dmg<=0){ if(t.bar) t.bar.style.display='none'; return false; } const mx=towerMax(t); const p=player.g.position;
  if(Math.hypot(p.x-t.g.position.x,p.z-t.g.position.z)<3.4){ t.dmg=Math.max(0,dmg-mx*0.35*dt); t.repT=(t.repT||0)-dt; if(t.repT<=0){ t.repT=0.25; tone(1500,1300,0.04,'triangle',0.03); burst(t.top.clone(),3,M.plank,0.6); } if(t.dmg<=0&&t.down){ t.down=false; t.g.rotation.z=0; floatText(t.g.position,T('Kule onarıldı!','Tower repaired!'),'green'); SFX.build(); } }
  if(!t.bar){ t.bar=document.createElement('div'); t.bar.className='hpbar tw'; t.bar.innerHTML='<i></i>'; document.body.appendChild(t.bar); }
  const k=clamp(1-t.dmg/mx,0,1); v3.copy(t.top); v3.y+=1.6; v3.project(camera); t.bar.style.display=''; t.bar.style.left=((v3.x+1)/2*innerWidth)+'px'; t.bar.style.top=((1-v3.y)/2*innerHeight)+'px'; t.bar.firstElementChild.style.width=(k*100)+'%';
  if(!t.down&&t.dmg>=mx){ t.down=true; floatText(t.g.position,T('🔧 Onar!','🔧 Repair!'),'red'); toast(T('🔧 Kule yıkıldı — gündüz onar!','🔧 Tower down — repair it by day!')); SFX.boom(); burst(t.top.clone(),16,M.stoneDark,1.2); camShake=Math.max(camShake,0.3); }
  if(t.down){ t.g.rotation.z=lerp(t.g.rotation.z,0.08,Math.min(1,dt*3)); if(Math.random()<dt*5) burst(t.top.clone(),1,M.smoke,0.5,1.4); for(const a of t.archers){ if(a.aim!==undefined) a.aim=false; } return true; } return false; }
// menzilli düşman (okçu, Usta Okçu): menzile girince durur, en yakın kuleye; kule yoksa kapıdaki oyuncuya ya da sura ok atar (en çok shootLeft sn), sonra yürür. Oklar görünür, hasar ölçülü
function shooterTick(e,dt){ if(e.shootLeft<=0) return false; const R=e.boss?15:13.5, x=e.g.position.x, z=e.g.position.z; let best=null,bd=R,to=null;
  for(const t of towers){ if(!t||t.down) continue; const d=Math.hypot(t.g.position.x-x,t.g.position.z-z); if(d<bd){ bd=d; best=t; } }
  if(best) to=best.top; else { const p=player.g.position, dp=Math.hypot(p.x-x,p.z-z); const [gx,gz]=sidePos(e.side,e.off*0.8,0.4), dg=Math.hypot(gx-x,gz-z);
    if(dp<R*0.8&&dp<dg){ best='player'; to=p.clone().setY(1.2); } else if(dg<R*0.8){ best='wall'; to=new THREE.Vector3(gx,1.6,gz); } } /* sur menzili kısa: kapıda kule varsa önce kuleye yaklaşır */
  if(!best) return false;
  e.shootLeft-=dt; e.g.rotation.y=Math.atan2(to.x-x,to.z-z); e.shootCd-=dt; if(e.guy) e.guy.armL.rotation.x=-1.4;
  if(e.shootCd<=0){ e.shootCd=e.boss?1.1:2.0; const m=mesh(G.cyl,M.eArrow,e.boss?0.08:0.06,e.boss?1.3:1.0,e.boss?0.08:0.06,false); const from=e.g.position.clone().setY(1.4*e.sc); m.position.copy(from); scene.add(m);
    const tw=best==='player'||best==='wall'?null:best; eArrows.push({m,from,to:to.clone(),t:0,tw,kind:tw?'tower':best,side:e.side,ek:e.kind,dmg:tw?(e.boss?11:5)*atkK():best==='wall'?e.atk*0.5:0}); tone(500,300,0.06,'triangle',0.025); } return true; }
let pHitT=0; // oyuncuya ok değince kısa süre yavaşlar (canı yok)
function updateEArrows(dt){ pHitT=Math.max(0,pHitT-dt); for(let i=eArrows.length-1;i>=0;i--){ const a=eArrows[i]; a.t+=dt*1.8; const to=a.tw?a.tw.top:a.to; const k=Math.min(1,a.t); a.m.position.lerpVectors(a.from,to,k); a.m.position.y+=Math.sin(k*Math.PI)*2; a.m.lookAt(to); a.m.rotateX(Math.PI/2);
    if(k>=1){ scene.remove(a.m); eArrows.splice(i,1);
      if(a.kind==='tower'){ if(towers.includes(a.tw)){ a.tw.dmg=(a.tw.dmg||0)+a.dmg; burst(to.clone(),4,M.woodDark,0.6); } }
      else if(a.kind==='wall'){ if(waveActive&&!runOver) hitGate(a.side,a.ek,a.dmg,true); }
      else { const p=player.g.position; if(Math.hypot(p.x-to.x,p.z-to.z)<1.6){ pHitT=0.7; burst(p.clone().setY(1.2),5,M.enemy,0.6); } else burst(to.clone().setY(0.2),3,M.woodDark,0.4); } } } }
function dawnRepair(){ let any=false; for(const t of towers){ if(!t) continue; if(t.dmg>0||t.down){ any=true; t.dmg=0; t.down=false; t.g.rotation.z=0; } if(t.bar) t.bar.style.display='none'; } for(const a of eArrows) scene.remove(a.m); eArrows.length=0; if(any) setTimeout(()=>toast(T('🔨 Kuleler onarıldı','🔨 Towers repaired'),'good'),1200); }

// ----- sal: 2. seferden sonra akıncıların bir kısmı gölden sallarla gelir -----
function makeRaft(){ const g=new THREE.Group(); for(let i=0;i<5;i++){ const l=mesh(G.cyl,M.raft,0.18,2.2,0.18); l.rotation.x=Math.PI/2; l.position.set(-0.72+i*0.36,0.05,0); g.add(l); } const oar=mesh(G.box,M.woodDark,0.08,0.08,1.8); oar.position.set(0.9,0.5,0); oar.rotation.z=0.6; g.add(oar); return g; }
// korsan gemisi: 8. seferden sonra korsanların bir kısmı denizden gemiyle gelir, sahile çıkar
const ships=[];
function makeShip(){ const g=new THREE.Group(); const hull=mesh(G.box,mat(0x3a2418),2.8,1.2,6.4); hull.position.y=0.6; const bow=mesh(G.cone4,mat(0x3a2418),2.0,2.2,1.2); bow.rotation.x=Math.PI/2; bow.rotation.y=Math.PI/4; bow.position.set(0,0.6,4.0); bow.scale.set(1.4,1.6,0.85); const deck=mesh(G.box,M.plank,2.6,0.1,6.0,false); deck.position.y=1.22; const stern=mesh(G.box,mat(0x3a2418),2.8,1.2,1.4); stern.position.set(0,1.6,-2.6);
  g.add(hull,bow,deck,stern); for(const [z,h] of [[1.2,6],[-1.2,5]]){ const mast=mesh(G.cyl,M.woodDark,0.12,h,0.12); mast.position.set(0,1.2+h/2,z); const sail=new THREE.Mesh(new THREE.PlaneGeometry(2.6,h*0.55),M.pirateSail); sail.position.set(0,1.2+h*0.6,z+0.1); sail.castShadow=true; const sk=new THREE.Mesh(new THREE.CircleGeometry(0.45,16),M.skull); sk.position.set(0,1.2+h*0.62,z+0.12); const sk2=sk.clone(); sk2.rotation.y=Math.PI; sk2.position.z=z+0.08; g.add(mast,sail,sk,sk2); }
  const flag=mesh(G.box,M.enemy,0.05,0.5,0.9,false); flag.position.set(0,7.6,1.0); g.add(flag); g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); scene.add(g); return g; }
function rigSpawn(e){ if(!e) return; const L=S.level;
  if(e.kind==='raider'&&revealed('lake')&&(e.side==='N'||e.side==='E')&&(e.via!==undefined?e.via==='raft':Math.random()<0.5)){ const s=(Math.random()<0.5?-1:1)*rand(3.5,6); const start=LC.clone().addScaledVector(LDIR,-(LK.r-2.5)).addScaledVector(LPERP,s*0.7), shore=LC.clone().addScaledVector(LDIR,LK.r-0.4).addScaledVector(LPERP,s);
    e.g.position.set(start.x,0.18,start.z); e.pre=[[shore.x,shore.z]]; e.raft=makeRaft(); e.raft.position.y=-0.12; e.g.add(e.raft); e.baseSpd=e.speed; e.speed*=0.75; e.wp=ROADS[e.side].length-1; e.preKind='raft'; }
  else if(e.kind==='pirate'&&revealed('coast')&&(e.side==='E'||e.side==='S')&&(e.via!==undefined?e.via==='ship':Math.random()<0.6)){ let sh=ships.find(x=>!x.leaving); if(!sh){ const g=makeShip(); const a=0.32*(Math.random()<0.5?1:-1); const land=SC.clone().addScaledVector(rotU(CU,a),SEA.r-3.2), from=SC.clone().addScaledVector(rotU(CU,a*0.6),6); g.position.copy(from); g.rotation.y=Math.atan2(land.x-from.x,land.z-from.z); sh={g,from,land,k:0,a,crew:0,leaving:false,t:0}; ships.push(sh); banner(T('🏴‍☠️ Korsan gemisi!','🏴‍☠️ Pirate ship!'),T('Kıyıya çıkıyorlar!',"They're coming ashore!"),'night',true); } /* F8: patron/gece afişinin yerine geçmez, sıraya girer */
    sh.crew++; e.hold=sh; e.g.visible=false; e.bar.style.display='none'; e.wp=Math.min(3,ROADS[e.side].length-1); }
  if(e.preKind==='raft'&&!rigSpawn.seenRaft){ rigSpawn.seenRaft=true; setTimeout(()=>toast(T('⛵ Gölden akın!','⛵ Lake raid!'),'bad'),600); } }
// F7: sal/gemi kararı gece planında verilir, böylece doğma anı varış zamanına göre hesaplanır (sal ve korsan tayfası darbesiyle birlikte varır, sona kalmaz)
function planVia(kd,side){ if(kd==='raider'&&revealed('lake')&&(side==='N'||side==='E')&&Math.random()<0.5) return 'raft'; if(kd==='pirate'&&revealed('coast')&&(side==='E'||side==='S')&&Math.random()<0.6) return 'ship'; return ''; }
// doğuştan kulelerin menziline kadar yol (birim) + sabit saniye; kule menzili suru ~14 birim önden tutar
function approachOf(side,via){ const path=ROADS[side], last=path[path.length-1], [wx,wz]=sidePos(side,0,1.7); const tail=Math.hypot(last[0]-wx,last[1]-wz)-14; const seg=(a)=>{ let d=0; for(let i=a+1;i<path.length;i++) d+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]); return d; };
  if(via==='raft'){ const st=LC.clone().addScaledVector(LDIR,-(LK.r-2.5)), sh=LC.clone().addScaledVector(LDIR,LK.r-0.4); return {d:st.distanceTo(sh)/0.75+Math.hypot(sh.x-last[0],sh.z-last[1])+tail,s:0}; }
  if(via==='ship'){ const w=Math.min(3,path.length-1), dp=SC.clone().addScaledVector(CU,SEA.r+2.2); return {d:Math.hypot(dp.x-path[w][0],dp.z-path[w][1])+seg(w)+tail,s:6}; }
  return {d:seg(0)+tail,s:0}; }
function holdTick(e,dt){ const sh=e.hold; if(sh.k<1) return false; sh.dropT=(sh.dropT||0)-dt; if(sh.dropT>0) return false; sh.dropT=0.35; const d=SC.clone().addScaledVector(rotU(CU,sh.a),SEA.r+2.2); e.g.position.set(d.x+rand(-1,1),0,d.z+rand(-1,1)); e.g.visible=true; e.bar.style.display=''; e.hold=null; sh.crew--; burst(e.g.position.clone().setY(0.4),8,M.foam,0.9); return true; }
function preArrive(e){ if(e.preKind==='raft'&&e.raft){ e.g.remove(e.raft); e.raft=null; e.g.position.y=0; e.speed=e.baseSpd||e.speed; burst(e.g.position.clone().setY(0.3),10,M.waterLight,1); } }
function updateShips(dt){ const t=performance.now()/1000; for(let i=ships.length-1;i>=0;i--){ const s=ships[i]; s.t+=dt;
    if(!s.leaving){ if(s.k<1){ s.k=Math.min(1,s.k+dt/5); const e=s.k*(2-s.k); s.g.position.lerpVectors(s.from,s.land,e); if(Math.random()<dt*6) burst(s.g.position.clone().setY(0.3),1,M.foam,0.4); } else if(s.crew<=0&&spawnQueue<=0){ s.leaving=true; s.k=0; } }
    else { s.k=Math.min(1,s.k+dt/6); s.g.position.lerpVectors(s.land,s.from,s.k*s.k); s.g.rotation.y+=dt*0.6*(1-s.k); if(s.k>0.6) s.g.position.y=-(s.k-0.6)*6; if(s.k>=1){ scene.remove(s.g); freeOwned(s.g); ships.splice(i,1); continue; } }
    if(!s.leaving||s.k<0.6) s.g.position.y=0.1+Math.sin(t*1.4)*0.12; s.g.rotation.z=Math.sin(t*1.1)*0.05; } }

// ----- kış: 9. sefer (ve sonsuzda her 10'un 9'u): ağaç yavaş kesilir, gündüz kısa, dünya karlı -----
function isWinter(){ return S.level%10===9; }
let winterOn=null, groundMesh=null, crownBase=null, winterToast=0;
// F8: kış bütün haritada: ağaç tepeleri karlı, çatılar kırağılı, zemin karlı ama geceleri kararır; kış geceleri daha koyu ve mavi
const NIGHT0={bg:NIGHT.bg.getHex(),sun:NIGHT.sun.getHex(),hemi:NIGHT.hemi.getHex(),sunI:NIGHT.sunI,hemiI:NIGHT.hemiI,exp:NIGHT.exp}, WG=new THREE.Color(0x46505c), WL=new THREE.Color(0x4a5660);
function winterTrees(w){ const ic=treeCrown&&treeCrown.instanceColor; if(!ic) return; if(!crownBase){ if(!w) return; crownBase=ic.array.slice(); } const a=ic.array, sn=[0.86,0.92,0.96]; for(let i=0;i<a.length;i++) a[i]=w?crownBase[i]*0.4+sn[i%3]*0.6:crownBase[i]; ic.needsUpdate=true; }
function applyWinterLook(){ const w=isWinter(); if(w===winterOn) return; winterOn=w; M.leaf.color.setHex(w?0xe4eef4:0xffffff); M.leaf.emissive.setHex(0); if(!groundMesh) scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map===groundTex) groundMesh=o; }); if(groundMesh){ groundMesh.material.color.setHex(w?0xe2eaf2:0xffffff); groundMesh.material.emissive.setHex(0); } DAY.hemi.setHex(w?0xe8f0ff:0xfff4e0); DAY.bg.setHex(w?0xdfe6ee:0xe8dcc0);
  M.roof.color.setHex(w?0xc9d3dc:0x6e4a3a); winterTrees(w); NIGHT.bg.setHex(w?0x1c2544:NIGHT0.bg); NIGHT.sun.setHex(w?0x7088d8:NIGHT0.sun); NIGHT.hemi.setHex(w?0x4a5ea0:NIGHT0.hemi); NIGHT.sunI=w?0.45:NIGHT0.sunI; NIGHT.hemiI=w?0.26:NIGHT0.hemiI; NIGHT.exp=w?0.88:NIGHT0.exp; applyNight(night);
  winterToast=w&&S.started&&S.meta&&S.meta.winterSeen!==S.level?1:0; }
// kış uyarısı bölge açılışı/afiş/pencere bitince, seferde bir kez, nötr renkte
function winterTick(){ if(!winterOn) return; const k=1-night; if(groundMesh) groundMesh.material.emissive.copy(WG).multiplyScalar(k); M.leaf.emissive.copy(WL).multiplyScalar(k);
  if(winterToast&&!S.pendingReveal&&!$('banner')&&!document.querySelector('.intro')&&!waveActive){ winterToast=0; S.meta.winterSeen=S.level; toast(T('❄️ Kış: günler kısa · ağaç kesmek yavaş','❄️ Winter: short days · slower chopping')); } }

// ----- ana döngü ve sıfırlama -----
let p7T=0;
function updateP7(dt){ updateBossChests(dt); updateEArrows(dt); updateShips(dt); p7T-=dt; if(p7T<=0){ p7T=1; applyWinterLook(); } winterTick(); }
// F8: kışın ilk iki gün uzun (uzak Karlı Geçit'e gidip dönmeye vakit), sonra kısa
function dayLen(){ return isWinter()?(S.wave<=2?30:20):30; }
for(const s of SIDES) threatLbl[s].clampIn=true; /* F8: kapı tehdit etiketi (👑) ekran kenarında kesilmez */
function clearP7Battle(){ for(const a of eArrows) scene.remove(a.m); eArrows.length=0; for(const s of ships){ scene.remove(s.g); freeOwned(s.g); } ships.length=0; if(!$("wheelCard")) clearBossChests(); }
function resetP7(){ clearP7Battle(); clearBossChests(); document.querySelectorAll('.hpbar.tw').forEach(b=>b.remove()); comboN=0; }
// =====================================================================
// ---------- Makine hissi (v32): ürün yolu baştan sona görünür ----------
// bantlar (ürün akar, dolunca tıkanır), durum lambası (yeşil çalışıyor / sarı malzeme bekliyor / kırmızı dolu),
// seviye flaması (bronz → gümüş → altın), üretim vuruşu, yığına düşen ürünün patlaması, satışta para sesi
// =====================================================================
const MFX={belts:[],posts:[],pops:[],pulses:[],arcs:[],pool:{}};
const _tp=new THREE.Vector3(), _tq=new THREE.Quaternion(), _ts=new THREE.Vector3(), _m4=new THREE.Matrix4(), _e3=new THREE.Euler(), _v3=new THREE.Vector3();
// yakındaysa duyulur (uzaktaki makineler ses kirliliği yapmasın)
function nearVol(worldPos,r){ const p=player.g.position; const d=Math.hypot(worldPos.x-p.x,worldPos.z-p.z); return d>(r||26)?0:1-d/(r||26); }
function mTone(pos,f0,f1,dur,type,vol){ const k=nearVol(pos); if(k>0.05) tone(f0,f1,dur,type,vol*k); }

// --- bant ---
const beltCanvas=(()=>{ const c=document.createElement('canvas'); c.width=32; c.height=64; const x=c.getContext('2d'); x.fillStyle='#2e3135'; x.fillRect(0,0,32,64); x.fillStyle='#4b4f55'; x.fillRect(0,4,32,9); x.fillRect(0,36,32,9); x.fillStyle='#1c1e21'; x.fillRect(0,0,3,64); x.fillRect(29,0,3,64); return c; })();
function makeBelt(o){ const par=o.parent||scene; const segs=[]; let L=0; const pts=o.pts;
  for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1]; const len=Math.hypot(b.x-a.x,b.z-a.z)||0.01; segs.push({a,b,len,L0:L,yaw:Math.atan2(b.x-a.x,b.z-a.z)}); L+=len; }
  const grp=new THREE.Group(); const texs=[]; const y=o.y===undefined?0.5:o.y, w=o.w||0.62;
  if(!o.noSurface) for(const s of segs){ const tex=new THREE.CanvasTexture(beltCanvas); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.encoding=THREE.sRGBEncoding; tex.repeat.set(1,s.len/0.7); texs.push(tex);
    const m=new THREE.Mesh(G.box,new THREE.MeshLambertMaterial({map:tex})); m.scale.set(w,0.08,s.len+0.04); m.position.set((s.a.x+s.b.x)/2,y,(s.a.z+s.b.z)/2); m.rotation.y=s.yaw; m.receiveShadow=true; grp.add(m);
    for(const sd of [-1,1]){ const r=mesh(G.box,M.iron,0.06,0.13,s.len+0.04,false); r.position.set(m.position.x+Math.cos(s.yaw)*sd*(w/2+0.03),y+0.05,m.position.z-Math.sin(s.yaw)*sd*(w/2+0.03)); r.rotation.y=s.yaw; grp.add(r); }
    if(!o.noLegs){ const n=Math.max(1,Math.round(s.len/1.1)); for(let k=0;k<=n;k++){ const f=k/n; const leg=mesh(G.box,M.woodDark,0.1,y,0.1,false); leg.position.set(s.a.x+(s.b.x-s.a.x)*f,y/2,s.a.z+(s.b.z-s.a.z)*f); grp.add(leg); } } }
  par.add(grp); const im=new THREE.InstancedMesh(o.geo,o.mat,o.cap||10); im.count=0; im.castShadow=true; im.frustumCulled=false; par.add(im);
  const b={o,segs,L,grp,im,texs,items:[],speed:o.speed||1.2,gap:o.gap||0.6,onEnd:o.onEnd||null,moving:false,y}; MFX.belts.push(b); return b; }
function beltCanAdd(b){ return b.items.length<b.im.instanceMatrix.count&&!(b.items.length&&b.items[b.items.length-1].t<b.gap); }
function beltAdd(b,data){ if(!beltCanAdd(b)) return false; b.items.push({t:0,pop:0,d:data}); return true; }
function beltAt(b,t,out){ for(const s of b.segs){ if(t<=s.L0+s.len){ const k=(t-s.L0)/s.len; out.set(s.a.x+(s.b.x-s.a.x)*k,b.y,s.a.z+(s.b.z-s.a.z)*k); return s.yaw; } } const s=b.segs[b.segs.length-1]; out.set(s.b.x,b.y,s.b.z); return s.yaw; }
function beltEndWorld(b){ beltAt(b,b.L,_v3); _v3.y+=b.o.lift||0.2; return (b.o.parent||scene).localToWorld(_v3.clone()); }
function updateBelts(dt){ for(const b of MFX.belts){ let moving=false, limit=b.L;
    for(const it of b.items){ const nt=Math.min(limit,it.t+b.speed*dt); if(nt>it.t+1e-5) moving=true; it.t=nt; limit=nt-b.gap; if(it.pop<1) it.pop=Math.min(1,it.pop+dt*6); }
    if(b.items.length&&b.items[0].t>=b.L-1e-3){ if(!b.onEnd||b.onEnd(b.items[0])!==false){ b.items.shift(); moving=true; } }
    b.moving=moving; if(moving) for(const tx of b.texs) tx.offset.y+=b.speed*dt/0.7;
    for(let i=0;i<b.items.length;i++){ const it=b.items[i]; const yaw=beltAt(b,it.t,_tp); _tp.y+=b.o.lift||0.2; _e3.set(b.o.rx||0,(b.o.ry||0)+yaw,b.o.rz||0); _tq.setFromEuler(_e3); const s=it.pop<1?it.pop*(1+0.35*Math.sin(it.pop*Math.PI)):1; _ts.set(s*(b.o.sx||1),s*(b.o.sy||1),s*(b.o.sz||1)); _m4.compose(_tp,_tq,_ts); b.im.setMatrixAt(i,_m4); }
    b.im.count=b.items.length; b.im.instanceMatrix.needsUpdate=true; } }

// --- durum direği: lamba + seviye flaması ---
const LAMP_C={on:0x5dff72,wait:0xffb52e,full:0xff4a3a,off:0x6a6a6a}; const TIER_C=[0xb8773a,0xd7dee6,0xffc93a];
function makePost(parent,x,y,z,h){ const g=new THREE.Group(); const H=h||2.3; const post=mesh(G.cyl,M.iron,0.07,H,0.07); post.position.y=H/2;
  const bm=new THREE.MeshLambertMaterial({color:0x5dff72,emissive:0x5dff72,emissiveIntensity:0.6}); const bulb=new THREE.Mesh(G.sph,bm); bulb.scale.setScalar(0.27); bulb.position.y=H+0.12; const cap=mesh(G.cone4,M.iron,0.24,0.16,0.24,false); cap.position.y=H+0.34; const gl=glow(0x5dff72,1.8,0.55); gl.position.y=H+0.12;
  const pole=new THREE.Group(); pole.position.y=H-0.3; const fm=new THREE.MeshLambertMaterial({color:TIER_C[0]}); const flag=new THREE.Mesh(G.box,fm); flag.scale.set(0.05,0.36,0.64); flag.position.z=0.34; pole.add(flag);
  g.add(post,bulb,cap,gl,pole); g.position.set(x,y||0,z); parent.add(g); const P={g,bulb,gl,pole,flag,state:'',tier:-1,t:rand(0,6),flashT:0}; MFX.posts.push(P); return P; }
function setPost(P,state,level){ if(!P) return; if(state!==P.state){ P.state=state; const c=LAMP_C[state]||LAMP_C.off; P.bulb.material.color.setHex(c); P.bulb.material.emissive.setHex(c); P.gl.material.color.setHex(c); P.flashT=0.3; }
  const tier=level>=5?2:level>=3?1:0; if(tier!==P.tier){ P.tier=tier; P.flag.material.color.setHex(TIER_C[tier]); P.flag.material.emissive=new THREE.Color(tier===2?0x5a3c00:tier===1?0x303030:0x000000); P.flag.scale.set(0.05,0.36+0.08*tier,0.64+0.12*tier); P.flag.position.z=0.34+0.06*tier; } }
function powerOn(P,pos){ if(!P) return; P.flashT=1.2; const at=pos||P.g.getWorldPosition(new THREE.Vector3()); tone(220,880,0.35,'sawtooth',0.035); setTimeout(()=>tone(660,1320,0.18,'triangle',0.05),260); burst(at.clone().setY(2.6),12,M.gold,1.2); }
function updatePosts(dt){ for(const P of MFX.posts){ P.t+=dt; let op=0.55, sc=0.27; const st=P.state;
    if(st==='on'){ op=0.45+0.2*Math.sin(P.t*3); } else if(st==='wait'){ op=Math.sin(P.t*6)>0?0.85:0.12; } else if(st==='full'){ op=0.75+0.2*Math.sin(P.t*9); sc=0.3; } else op=0.15;
    if(P.flashT>0){ P.flashT=Math.max(0,P.flashT-dt); op=Math.min(1,op+P.flashT*1.5); sc+=P.flashT*0.3; }
    P.gl.material.opacity=op; if(st==='full') P.bulb.scale.set(sc*0.72,sc*2.1,sc*0.72); else P.bulb.scale.setScalar(sc); /* FX3: dolu lamba uzun çubuk (renk körü: biçimle de ayrılır) */ P.pole.rotation.y=0.35*Math.sin(P.t*2.6); } }

// --- yığına eklenen ürün küçük bir sıçramayla belirir ---
function setStack(im,n){ n=Math.max(0,Math.min(im.instanceMatrix.count,Math.floor(n||0))); if(n===im.count) return;
  if(!im.userData.base){ im.userData.base=[]; for(let i=0;i<im.instanceMatrix.count;i++){ const m=new THREE.Matrix4(); im.getMatrixAt(i,m); im.userData.base.push(m); } }
  if(n>im.count){ for(let i=Math.max(im.count,n-3);i<n;i++) MFX.pops.push({im,i,t:0}); } im.count=n; }
function updatePops(dt){ for(let k=MFX.pops.length-1;k>=0;k--){ const P=MFX.pops[k]; P.t+=dt; const base=P.im.userData.base[P.i]; const f=Math.min(1,P.t/0.28); const s=f<0.55?0.15+1.1*(f/0.55):1.25-0.25*((f-0.55)/0.45);
    base.decompose(_tp,_tq,_ts); _ts.multiplyScalar(s); _m4.compose(_tp,_tq,_ts); P.im.setMatrixAt(P.i,f>=1?base:_m4); P.im.instanceMatrix.needsUpdate=true; if(f>=1) MFX.pops.splice(k,1); } }

// --- vuruş: makine parçası ezilip esner (çalıştığı her döngüde) ---
function pulse(obj,k){ if(!obj) return; const ex=MFX.pulses.find(p=>p.obj===obj); if(ex){ ex.t=0; return; } MFX.pulses.push({obj,t:0,k:k||0.12,base:obj.scale.clone()}); }
function pulseEnd(obj){ const i=MFX.pulses.findIndex(p=>p.obj===obj); if(i>=0){ obj.scale.copy(MFX.pulses[i].base); MFX.pulses.splice(i,1); } }
function updatePulses(dt){ for(let i=MFX.pulses.length-1;i>=0;i--){ const P=MFX.pulses[i]; P.t+=dt; const f=Math.min(1,P.t/0.24); const e=Math.sin(f*Math.PI)*P.k; P.obj.scale.set(P.base.x*(1+e*0.6),P.base.y*(1-e),P.base.z*(1+e*0.6)); if(f>=1){ P.obj.scale.copy(P.base); MFX.pulses.splice(i,1); } } }

// --- yay: ürün bir noktadan diğerine sekerek gider (ebeveynin kendi koordinatında) ---
function arc(parent,geo,matl,from,to,dur,sc,onDone,h,rot){ const key=geo.uuid+matl.uuid; const pool=MFX.pool[key]||(MFX.pool[key]=[]); const m=pool.pop()||new THREE.Mesh(geo,matl); m.castShadow=true; m.visible=true; m.scale.setScalar(sc||1); if(rot) m.rotation.set(rot[0],rot[1],rot[2]); else m.rotation.set(0,0,0); parent.add(m); m.position.copy(from);
  MFX.arcs.push({m,parent,from:from.clone(),to:to.clone(),t:0,dur:dur||0.45,onDone,h:h===undefined?1.0:h,key,spin:rot?0:rand(4,8)}); }
function updateArcs(dt){ for(let i=MFX.arcs.length-1;i>=0;i--){ const A=MFX.arcs[i]; A.t+=dt; const f=Math.min(1,A.t/A.dur); A.m.position.lerpVectors(A.from,A.to,f); A.m.position.y+=Math.sin(f*Math.PI)*A.h; if(A.spin) A.m.rotation.y+=dt*A.spin;
    if(f>=1){ A.parent.remove(A.m); (MFX.pool[A.key]||(MFX.pool[A.key]=[])).push(A.m); MFX.arcs.splice(i,1); if(A.onDone) A.onDone(); } } }

// --- para: art arda toplanan altınlar yarım ton yükselen sesle (zincir kısa bir boşlukta sıfırlanır) ---
let coinChainN=0, coinChainT=0;
function coinChime(){ const now=performance.now(); coinChainN=(now-coinChainT<380)?Math.min(14,coinChainN+1):0; coinChainT=now; const f=880*Math.pow(2,coinChainN/12); tone(f,f*1.45,0.11,'sine',0.1); tone(f*2,f*2.9,0.06,'sine',0.025); } /* FX4: para sesi kesme/savaş seslerinin altında kalıyordu */

// oyun zamanıyla ertelenen iş (duraklatınca / reklamda bekler; setTimeout gibi gerçek saatle kaçmaz)
const LATER=[]; function later(sec,fn){ LATER.push({t:sec,fn}); }
function updateLater(dt){ for(let i=LATER.length-1;i>=0;i--){ const L=LATER[i]; L.t-=dt; if(L.t<=0){ LATER.splice(i,1); try{ L.fn(); }catch(e){ console.error(e); } } } }
function updateMachineFx(dt){ updateLater(dt); updateBelts(dt); updatePosts(dt); updatePops(dt); updatePulses(dt); updateArcs(dt); }

// yığındaki i. yerin konumu (ebeveyn koordinatında)
function stackSlot(im,i){ if(!im.userData.base){ im.userData.base=[]; for(let k=0;k<im.instanceMatrix.count;k++){ const m=new THREE.Matrix4(); im.getMatrixAt(k,m); im.userData.base.push(m); } } const j=Math.max(0,Math.min(im.instanceMatrix.count-1,i)); im.userData.base[j].decompose(_tp,_tq,_ts); return _tp.clone().applyMatrix4(im.matrix); }

// ---------- Taş Ocağı: ham kaya bantla testereye girer, kesilen blok çıkış bandıyla yığına düşer ----------
const CUT={init:false,acc:0,inB:null,outB:null,post:null,bite:0,flying:0};
function cutterInit(){ CUT.init=true; for(const ch of cutter.children){ if(ch.isMesh&&ch.material===M.rock&&Math.abs(ch.position.x-0.9)<0.01) ch.visible=false; if(ch.isMesh&&ch.material===M.roof) ch.visible=false; }
  for(const z of [-1.2,1.2]){ const bm=mesh(G.box,M.woodDark,3.6,0.16,0.16); bm.position.set(0,3.1,z); cutter.add(bm); } const sign=mesh(G.box,M.plank,1.2,0.5,0.1); sign.position.set(0,3.35,-1.2); cutter.add(sign); const sgR=mesh(G.dod,M.rock,0.35,0.3,0.35,false); sgR.position.set(0,3.35,-1.12); cutter.add(sgR);
  for(let i=0;i<6;i++){ const r=mesh(G.dod,M.rock,rand(0.45,0.7),rand(0.35,0.55),rand(0.45,0.7)); r.position.set(2.15+rand(-0.25,0.35),0.3+(i>3?0.35:0),rand(-0.55,0.55)); r.rotation.set(rand(0,3),rand(0,3),0); cutter.add(r); }
  CUT.inB=makeBelt({parent:cutter,pts:[new THREE.Vector3(1.9,0,0),new THREE.Vector3(0.28,0,0)],y:1.15,w:0.66,noLegs:true,geo:G.dod,mat:M.rock,sx:0.34,sy:0.28,sz:0.34,lift:0.2,gap:0.42,cap:6,speed:1.2,onEnd:()=>false});
  CUT.outB=makeBelt({parent:cutter,pts:[new THREE.Vector3(-0.28,0,0),new THREE.Vector3(-1.5,0,0)],y:1.15,w:0.66,noLegs:true,geo:G.box,mat:M.rockLight,sx:0.36,sy:0.26,sz:0.36,lift:0.16,gap:0.42,cap:6,speed:1.2,
    onEnd:()=>{ const i=Math.floor(S.rg.cutOut||0)+CUT.flying; const to=stackSlot(cutStack,i); CUT.flying++; arc(cutter,G.box,M.rockLight,new THREE.Vector3(-1.55,1.35,0),to,0.35,0.36,()=>{ CUT.flying=Math.max(0,CUT.flying-1); S.rg.cutOut=Math.min(cutCap(),(S.rg.cutOut||0)+1); mTone(QCUT,300,220,0.05,'square',0.02); },0.5); return true; }});
  CUT.post=makePost(cutter,1.9,0,-1.3); S.rg.cutOut=Math.min(cutCap(),(S.rg.cutOut||0)+(S.rg.tCut||0)); S.rg.tCut=0; cutter.updateMatrixWorld(true); }
function cutterFx(dt,l){ if(!CUT.init) cutterInit(); const cap=cutCap(); const inT=CUT.outB.items.length+CUT.flying; const full=(S.rg.cutOut||0)+inT>=cap;
  const sp=0.9+0.28*l; CUT.inB.speed=CUT.outB.speed=sp; if(!full) beltAdd(CUT.inB);
  const T=1/Math.max(0.05,cutRate()); if(!full) CUT.acc+=dt;
  const ready=CUT.inB.items.length&&CUT.inB.items[0].t>=CUT.inB.L-0.02;
  if(!full&&CUT.acc>=T&&ready&&beltCanAdd(CUT.outB)){ CUT.acc=Math.min(CUT.acc-T,T); CUT.inB.items.shift(); beltAdd(CUT.outB); CUT.bite=1; burst(cutter.localToWorld(new THREE.Vector3(0,1.3,0)),4,M.rockLight,0.8); mTone(QCUT,520,260,0.09,'sawtooth',0.03); pulse(sawBlade,0.08); }
  sawBlade.rotation.z-=dt*(full?1.2:(10+4*l)); if(CUT.bite>0){ CUT.bite=Math.max(0,CUT.bite-dt*4); } sawBlade.position.y=1.45-0.2*Math.sin(CUT.bite*Math.PI);
  if(!full&&Math.random()<dt*5) burst(cutter.localToWorld(new THREE.Vector3(0,1.25,0)),1,M.rockLight,0.5);
  setPost(CUT.post,full?'full':'on',l); S.rg.tCut=CUT.outB.items.length+CUT.flying; return full; }

// ---------- Nehir: tomruk banttan testereye girer, kereste olarak çıkar, kereste yığınına düşer ----------
const MIL={init:false,acc:0,logB:null,plB:null,post:null,sb:null,flying:0};
function millInit(){ MIL.init=true; const sb=saw2.parent; MIL.sb=sb; for(const lg of beltLogs) lg.visible=false; for(const ch of sb.children){ if(ch.isMesh&&Math.abs(ch.position.y-0.84)<0.01&&ch.scale.z>4) ch.visible=false; }
  MIL.logB=makeBelt({parent:sb,pts:[new THREE.Vector3(0,0,-2.15),new THREE.Vector3(0,0,-0.2)],y:0.84,w:0.8,noLegs:true,geo:G.log,mat:M.log,rx:Math.PI/2,sx:1.05,sy:1.05,sz:1.05,lift:0.15,gap:1.05,cap:4,speed:1.2,
    onEnd:()=>{ if(!beltCanAdd(MIL.plB)) return false; beltAdd(MIL.plB); const w=sb.localToWorld(new THREE.Vector3(0,1.0,0)); burst(w,6,M.logEnd,1.0); burst(w,3,M.plank,0.8); mTone(w,700,380,0.12,'sawtooth',0.03); pulse(saw2,0.1); return true; }});
  MIL.plB=makeBelt({parent:sb,pts:[new THREE.Vector3(0,0,0.2),new THREE.Vector3(0,0,2.15)],y:0.84,w:0.8,noLegs:true,geo:G.box,mat:M.plank,sx:0.34,sy:0.1,sz:0.95,lift:0.1,gap:1.05,cap:4,speed:1.2,
    onEnd:()=>{ const from=beltEndWorld(MIL.plB); const i=Math.floor(S.rg.millOut||0)+MIL.flying; const to=stackSlot(plankStack,i); MIL.flying++; arc(mill,G.box,M.plank,from,to,0.45,1,()=>{ MIL.flying=Math.max(0,MIL.flying-1); S.rg.millOut=(S.rg.millOut||0)+1; mTone(to,420,300,0.05,'triangle',0.025); },0.8,[0,Math.random()*0.3,0]); const A=MFX.arcs[MFX.arcs.length-1]; if(A){ A.m.scale.set(1.4,0.12,0.36); } return true; }});
  mill.updateMatrixWorld(true); const pp=sb.localToWorld(new THREE.Vector3(1.1,0,-2.3)); MIL.post=makePost(mill,pp.x,0,pp.z); S.rg.millOut=(S.rg.millOut||0)+(S.rg.tMill||0); S.rg.tMill=0; }
function millFx(dt,l){ if(!MIL.init) millInit(); const inn=S.rg.millIn||0; const working=inn>=2||MIL.logB.items.length>0; const sp=1.0+0.3*l; MIL.logB.speed=MIL.plB.speed=sp;
  const T=1/Math.max(0.05,millRate()); MIL.acc+=dt; if(MIL.acc>=T&&inn>=2&&beltCanAdd(MIL.logB)){ MIL.acc=Math.min(MIL.acc-T,T); S.rg.millIn=inn-2; beltAdd(MIL.logB); }
  if(working) saw2.rotation.x+=dt*(14+4*l); setPost(MIL.post,working?'on':'wait',l); S.rg.tMill=MIL.logB.items.length+MIL.plB.items.length+MIL.flying; return working; }

// ---------- Demir Dağı: matkap vurur → cevher kasaya düşer → maden arabası raylarla ocağa taşır → kızgın külçe örse, çekiç iki kez vurur → çubuk yığına ----------
const FRG={init:false,ingots:[],hammer:null,hamA:-0.35,post:null,hot:null};
const DRL={init:false,ph:0,bin:0,binIM:null,cart:null,post:null,railA:null,railB:null,dump:0,dumpT:0};
function forgeInit(){ FRG.init=true; const f=ironArea.userData.forge; for(const ch of f.children){ if(ch.isMesh&&ch.material===M.roofDark) ch.visible=false; }
  const can=mesh(G.box,M.roofDark,2.2,0.14,1.5); can.position.set(-0.6,2.5,-0.75); can.rotation.x=0.25; f.add(can);
  const H=new THREE.Group(); H.position.set(1.8,1.45,0.3); const post=mesh(G.box,M.woodDark,0.22,1.5,0.22); post.position.set(1.8,0.75,0.3); const arm=mesh(G.box,M.woodDark,1.0,0.12,0.14); arm.position.set(-0.5,0,0); const head=mesh(G.box,M.iron,0.32,0.36,0.38); head.position.set(-0.86,-0.1,0); const cam=mesh(G.cyl,M.iron,0.16,0.3,0.16,false); cam.rotation.x=Math.PI/2; H.add(arm,head,cam); f.add(post,H); FRG.hammer=H;
  FRG.hot=new THREE.MeshLambertMaterial({color:0xffa040,emissive:0xff5a00,emissiveIntensity:0.9}); FRG.post=makePost(f,-1.95,0,1.45); S.rg.forgeOut=Math.min(forgeOutCap(),(S.rg.forgeOut||0)+(S.rg.tFrg||0)); S.rg.tFrg=0; f.updateMatrixWorld(true); }
function forgeSmelt(){ if(!FRG.init) forgeInit(); const f=ironArea.userData.forge; const m=new THREE.Mesh(BAR_GEO,FRG.hot); m.castShadow=true; f.add(m); m.position.set(-0.6,1.0,-0.72); FRG.ingots.push({m,t:0,hits:0,to:null}); burst(f.localToWorld(new THREE.Vector3(-0.6,1.1,-0.6)),8,M.fire,1.1); mTone(FORGE,300,520,0.12,'sawtooth',0.03); }
function forgeFx(dt,l,working){ if(!FRG.init) forgeInit(); const f=ironArea.userData.forge; let down=false;
  for(let i=FRG.ingots.length-1;i>=0;i--){ const I=FRG.ingots[i]; I.t+=dt; const t=I.t;
    if(t<0.35){ const k=t/0.35; I.m.position.set(-0.6+(0.9+0.6)*k,1.0+(0.95-1.0)*k+Math.sin(k*Math.PI)*0.5,-0.72+(0.3+0.72)*k); }
    else if(t<0.95){ I.m.position.set(0.9,0.95,0.3); const hitAt=I.hits===0?0.42:0.72; if(t>=hitAt-0.08&&t<hitAt+0.1) down=true; if(I.hits<2&&t>=hitAt){ I.hits++; const w=f.localToWorld(new THREE.Vector3(0.9,1.05,0.3)); burst(w,10,M.gold,1.6); burst(w,4,M.fire,1.0); mTone(w,1500,900,0.09,'triangle',0.05); I.m.scale.set(1.12,0.86,1.12); setTimeout(()=>I.m.scale.set(1,1,1),90); } }
    else { if(!I.to){ I.to=stackSlot(barStack,Math.floor(S.rg.forgeOut||0)+FRG.ingots.filter(o=>o.to).length); I.from=I.m.position.clone(); I.m.material=M.bar; } const k=Math.min(1,(t-0.95)/0.4); I.m.position.lerpVectors(I.from,I.to,k); I.m.position.y+=Math.sin(k*Math.PI)*0.45;
      if(k>=1){ f.remove(I.m); FRG.ingots.splice(i,1); S.rg.forgeOut=(S.rg.forgeOut||0)+1; mTone(FORGE,900,760,0.05,'triangle',0.02); } } }
  const target=down?0.33:-0.38; FRG.hamA+=(target-FRG.hamA)*Math.min(1,dt*(down?30:8)); FRG.hammer.rotation.z=FRG.hamA;
  const full=(S.rg.forgeOut||0)+FRG.ingots.length>=forgeOutCap(); setPost(FRG.post,full?'full':working?'on':'wait',rg('forge')+1); S.rg.tFrg=FRG.ingots.length; return FRG.ingots.length; }
// matkap + maden arabası
function drillInit(){ DRL.init=true; const B=IR.at(-3.7,-3.6), A=IR.at(-3.0,-2.3), Z=IR.at(IR.R.r-5.9,3.3); DRL.binPos=B; DRL.railA=A; DRL.railB=Z; DRL.dumpTo=FORGE.clone().setY(1.0);
  const bin=new THREE.Group(); bin.position.copy(B); bin.rotation.y=IR.ang; const bb=mesh(G.box,M.woodDark,1.3,0.12,1.1); bb.position.y=0.06; bin.add(bb); for(const [x,z,w,d] of [[0,-0.55,1.3,0.1],[0,0.55,1.3,0.1],[-0.65,0,0.1,1.1],[0.65,0,0.1,1.1]]){ const s=mesh(G.box,M.wood,w,0.55,d); s.position.set(x,0.33,z); bin.add(s); }
  DRL.binIM=stackIM(ORE_GEO,M.ore,12,i=>{ vp.set(-0.4+(i%3)*0.4,0.25+Math.floor(i/6)*0.28,-0.25+(Math.floor(i/3)%2)*0.5); e3.set(rand(0,3),rand(0,3),0); q.setFromEuler(e3); vs.set(1.25,1.25,1.25); }); bin.add(DRL.binIM); ironArea.add(bin); DRL.binG=bin;
  const dir=Z.clone().sub(A); const len=dir.length(); dir.normalize(); const yaw=Math.atan2(dir.x,dir.z); const rails=new THREE.Group(); for(const sd of [-0.42,0.42]){ const r=mesh(G.box,M.iron,0.08,0.07,len,false); r.position.set((A.x+Z.x)/2+Math.cos(yaw)*sd,0.06,(A.z+Z.z)/2-Math.sin(yaw)*sd); r.rotation.y=yaw; rails.add(r); }
  const nS=Math.floor(len/0.8)+1; const sIM=new THREE.InstancedMesh(G.box,M.woodDark,nS); _e3.set(0,yaw,0); _tq.setFromEuler(_e3); for(let k=0;k<nS;k++){ const p=A.clone().addScaledVector(dir,k*0.8); _m4.compose(_tp.set(p.x,0.03,p.z),_tq,_ts.set(1.2,0.05,0.22)); sIM.setMatrixAt(k,_m4); } sIM.receiveShadow=true; sIM.frustumCulled=false; rails.add(sIM); ironArea.add(rails); DRL.rails=rails; DRL.dir=dir; DRL.len=len; DRL.yaw=yaw;
  const cg=new THREE.Group(); const body=mesh(G.box,M.iron,0.9,0.5,1.15); body.position.y=0.5; const rim=mesh(G.box,M.bar,0.96,0.08,1.2,false); rim.position.y=0.76; cg.add(body,rim); const wheels=[]; for(const [x,z] of [[-0.45,0.38],[0.45,0.38],[-0.45,-0.38],[0.45,-0.38]]){ const w=mesh(G.cyl,M.darkStone2||M.iron,0.2,0.1,0.2,false); w.rotation.z=Math.PI/2; w.position.set(x,0.2,z); cg.add(w); wheels.push(w); }
  const cargo=stackIM(ORE_GEO,M.ore,8,i=>{ vp.set(-0.25+(i%2)*0.5,0.85+Math.floor(i/4)*0.22,-0.35+(Math.floor(i/2)%2)*0.7); e3.set(rand(0,3),rand(0,3),0); q.setFromEuler(e3); vs.set(1.2,1.2,1.2); }); cg.add(cargo); cg.position.copy(A); cg.rotation.y=yaw; ironArea.add(cg);
  DRL.cart={g:cg,wheels,cargo,n:0,k:0,state:'wait',t:0}; DRL.post=makePost(ironArea,IR.at(-6.2,-0.6).x,0,IR.at(-6.2,-0.6).z);
  const sv=S.rg.tDrl||0; DRL.bin=Math.min(12,sv); if(sv>12) S.rg.oreIn=Math.min(oreCap(),(S.rg.oreIn||0)+sv-12); S.rg.tDrl=0; setStack(DRL.binIM,DRL.bin); ironArea.updateMatrixWorld(true); }
function drillFx(dt,dl){ if(!DRL.init) drillInit(); const t=performance.now()/1000; const binCap=12; const C=DRL.cart;
  const vis=dl>0; DRL.binG.visible=vis; DRL.rails.visible=vis; C.g.visible=vis; if(!vis) return;
  const full=DRL.bin>=binCap; const rate=drillRate();
  if(!full){ DRL.ph+=dt*rate; drillBit.rotation.y+=dt*(10+3*dl); }
  const ph=DRL.ph%1; drillHead.position.y=ph<0.82? 2.9+1.0*(ph/0.82) : 3.9-1.25*((ph-0.82)/0.18);
  if(DRL.ph>=1){ DRL.ph-=1; const base=DRILL.clone().setY(0.4); burst(base,8,M.oreVein,1.1); burst(base,5,M.rock,0.8); camShake=Math.max(camShake,0.05*nearVol(DRILL,18)); mTone(DRILL,140,70,0.14,'square',0.05); pulse(drillHead,0.14);
    DRL.bin++; const to=DRL.binG.localToWorld(stackSlot(DRL.binIM,Math.min(11,DRL.bin-1)).clone()); arc(scene,ORE_GEO,M.ore,DRILL.clone().setY(0.9),to,0.4,1.25,()=>{ setStack(DRL.binIM,Math.min(12,DRL.bin)); },1.2); }
  // araba: kasa dolunca (ya da bir süre bekleyince) yüklenir, ocağa gider, boşaltır, döner
  C.t+=dt; const move=(dir)=>{ C.k=Math.max(0,Math.min(1,C.k+dir*dt*4.2/DRL.len)); C.g.position.copy(DRL.railA).addScaledVector(DRL.dir,C.k*DRL.len); for(const w of C.wheels) w.rotation.x+=dir*dt*12; };
  if(C.state==='wait'){ if(DRL.bin>=6||(DRL.bin>0&&C.t>5)){ C.state='load'; C.t=0; } }
  else if(C.state==='load'){ if(C.t>0.08){ C.t=0; if(DRL.bin>0&&C.n<8){ DRL.bin--; C.n++; setStack(DRL.binIM,DRL.bin); setStack(C.cargo,C.n); mTone(DRILL,260,200,0.04,'square',0.015); } else { C.state='go'; mTone(DRILL,500,600,0.12,'triangle',0.03); } } }
  else if(C.state==='go'){ move(1); if(C.k>=1){ C.state='dump'; C.t=0; } }
  else if(C.state==='dump'){ if(C.t>0.1){ C.t=0; if(C.n>0){ if((S.rg.oreIn||0)<oreCap()){ C.n--; setStack(C.cargo,C.n); S.rg.oreIn=(S.rg.oreIn||0)+1; fly(C.g.position.clone().setY(1.1),DRL.dumpTo,null,itemMesh(ORE_GEO,M.ore),5); } } else { C.state='back'; } } }
  else if(C.state==='back'){ move(-1); if(C.k<=0){ C.state='wait'; C.t=0; } }
  setPost(DRL.post,full?'full':'on',dl); S.rg.tDrl=DRL.bin+C.n; }

// ---------- Göl: ağlar ve balıkçılar balığı iskele kasasına atar → bant dükkânın yanından tezgâha taşır → tezgâh dolar → satılır ----------
const LAKE={init:false,bin:0,binIM:null,binG:null,belt:null,post:null,dockPost:null,flying:0};
function lakeInit(){ LAKE.init=true;
  // sağ duvarda bandın girdiği açıklık
  for(const ch of hut.children){ if(ch.isMesh&&ch.material===M.wood&&Math.abs(ch.position.x-1.7)<0.01&&Math.abs(ch.scale.x-0.18)<0.01){ ch.scale.z=2.0; ch.position.z=-0.4; } }
  for(const ch of hut.children){ if(ch.isMesh&&ch.material===M.woodDark&&Math.abs(ch.position.x-2.0925)<0.01) ch.visible=false; }
  const bin=new THREE.Group(); bin.position.set(4.05,0,-1.75); const bb=mesh(G.box,M.woodDark,1.1,0.12,1.0); bb.position.y=0.06; bin.add(bb); for(const [x,z,w,d] of [[0,-0.5,1.1,0.08],[0,0.5,1.1,0.08],[-0.55,0,0.08,1.0],[0.55,0,0.08,1.0]]){ const s=mesh(G.box,M.wood,w,0.45,d); s.position.set(x,0.27,z); bin.add(s); }
  const ice=mesh(G.box,mat(0xdff4ff),0.95,0.08,0.85,false); ice.position.y=0.18; bin.add(ice);
  LAKE.binIM=stackIM(FISH_GEO,M.fish,10,i=>{ vp.set(-0.3+(i%3)*0.3,0.28+Math.floor(i/6)*0.13,-0.25+(Math.floor(i/3)%2)*0.5); e3.set(0,rand(-.4,.4)+Math.PI/2,0); q.setFromEuler(e3); vs.set(0.85,0.85,0.85); }); bin.add(LAKE.binIM); hut.add(bin); LAKE.binG=bin;
  LAKE.belt=makeBelt({parent:hut,pts:[new THREE.Vector3(4.05,0,-1.1),new THREE.Vector3(4.05,0,1.05),new THREE.Vector3(1.75,0,1.05)],y:0.95,w:0.56,geo:FISH_GEO,mat:M.fish,ry:Math.PI/2,sx:0.9,sy:0.9,sz:0.9,lift:0.12,gap:0.42,cap:10,speed:1.3,
    onEnd:()=>{ if((S.rg.hutFish||0)+LAKE.flying>=hutCap()) return false; const i=Math.floor(S.rg.hutFish||0)+LAKE.flying; const to=stackSlot(hutFish,Math.min(23,i)); LAKE.flying++; arc(hut,FISH_GEO,M.fish,new THREE.Vector3(1.75,1.1,1.05),to,0.3,0.9,()=>{ LAKE.flying=Math.max(0,LAKE.flying-1); S.rg.hutFish=Math.min(hutCap(),(S.rg.hutFish||0)+1); mTone(HUT,880,700,0.04,'triangle',0.02); },0.35); return true; }});
  LAKE.post=makePost(hut,-2.25,0,1.2); const dp=lat(LK.r+0.6,-1.4); LAKE.dockPost=makePost(lake,dp.x,0,dp.z);
  const sv=S.rg.tLake||0; LAKE.bin=Math.min(10,sv); if(sv>10) S.rg.hutFish=Math.min(hutCap(),(S.rg.hutFish||0)+sv-10); S.rg.tLake=0; setStack(LAKE.binIM,LAKE.bin); hut.updateMatrixWorld(true); }
function lakeRoom(){ return hutCap()-((S.rg.hutFish||0)+LAKE.bin+(LAKE.belt?LAKE.belt.items.length:0)+LAKE.flying); }
function lakeCanTake(){ return lakeRoom()>0&&LAKE.bin<10; }
function lakeToBin(from){ if(!LAKE.init) lakeInit(); if(!lakeCanTake()) return false; LAKE.bin++; const to=LAKE.binG.localToWorld(stackSlot(LAKE.binIM,Math.min(9,LAKE.bin-1)).clone()); arc(scene,FISH_GEO,M.fish,from,to,0.55,0.9,()=>{ setStack(LAKE.binIM,Math.min(10,LAKE.bin)); mTone(to,660,520,0.04,'sine',0.02); },1.4); return true; }
function lakeFx(dt){ if(!LAKE.init) lakeInit(); if(LAKE.bin>0&&beltCanAdd(LAKE.belt)){ LAKE.bin--; setStack(LAKE.binIM,LAKE.bin); beltAdd(LAKE.belt); }
  const st=S.rg.hutFish||0; const pileFull=pileVal(fishPile)>=fishPile.capFn()-0.5; setPost(LAKE.post,pileFull?'full':st>0?'on':'wait',rg('fishhut')+1);
  const prod=fishers.length>0||rg('net')>0; LAKE.dockPost.g.visible=prod; if(prod) setPost(LAKE.dockPost,lakeCanTake()?'on':'full',Math.max(rg('net'),fishers.length));
  S.rg.tLake=LAKE.bin+LAKE.belt.items.length+LAKE.flying; }

// ---------- Çayır: kafes yakalayınca sarsılır, et paketi kulübeye uçar; kulübe satınca sallanır ----------
const MDW={init:false,post:null};
function meadowFx(dt){ if(!MDW.init){ MDW.init=true; MDW.post=makePost(hhut,1.95,0,1.55); } const st=S.rg.huntMeat||0; const pileFull=pileVal(meatPile)>=meatPile.capFn()-0.5; setPost(MDW.post,pileFull?'full':st>0?'on':'wait',rg('smoke')+1);
  for(const t of traps){ if(t.caught>0){ const k=t.caught; t.g.rotation.z=Math.sin(k*40)*0.06*k; t.g.position.y=Math.abs(Math.sin(k*30))*0.05; } else { t.g.rotation.z=0; t.g.position.y=0; } } }

// ---------- Bataklık: kaşık kazanı karıştırır, her iksirde kazan kabarır ----------
const SWP={init:false,ladle:null,post:null};
function swampFx(dt,working){ if(!SWP.init){ SWP.init=true; const c=caulLiquid.parent; const L=new THREE.Group(); const stick=mesh(G.cyl,M.woodDark,0.07,2.0,0.07); stick.position.set(0.55,0.6,0); stick.rotation.z=-0.35; L.add(stick); L.position.y=1.7; c.add(L); SWP.ladle=L; SWP.post=makePost(c,1.7,0,1.2); }
  if(working) SWP.ladle.rotation.y+=dt*(2.2+0.4*rg('cauldron')); const full=(S.rg.potions||0)>=potCap()&&pileVal(swampPile)>=swampPile.capFn()-0.5; setPost(SWP.post,full?'full':working?'on':'wait',rg('cauldron')+1); }

// ---------- Karlı Geçit: kristal matkabı her vuruşta kristali kuyumcuya fırlatır; kuyumcunun bileme taşı döner ----------
const SNW={init:false,wheel:null,post:null,dpost:null,ph:0};
function snowFx(dt,cl,full){ if(!SNW.init){ SNW.init=true; const h=snowArea.userData.jew; const W=new THREE.Group(); const disk=mesh(G.cyl,M.stone,0.42,0.12,0.42); disk.rotation.x=Math.PI/2; W.add(disk); W.position.set(-0.9,1.3,1.9); h.add(W); const st=mesh(G.box,M.woodDark,0.3,0.5,0.3); st.position.set(-0.9,0.95,1.9); h.add(st); SNW.wheel=W; SNW.post=makePost(h,1.95,0,1.6); const dp=SN.at(-5.5,-0.4); SNW.dpost=makePost(snowArea,dp.x,0,dp.z); }
  const stock=S.rg.crysIn||0; if(stock>0){ SNW.wheel.rotation.z-=dt*14; if(Math.random()<dt*6) burst(snowArea.userData.jew.localToWorld(new THREE.Vector3(-0.9,1.5,2.1)),1,M.crys,0.7); }
  const pileFull=pileVal(snowPile)>=snowPile.capFn()-0.5; setPost(SNW.post,pileFull?'full':stock>0?'on':'wait',rg('jeweler')+1);
  SNW.dpost.g.visible=cl>0; if(cl>0) setPost(SNW.dpost,full?'full':'on',cl); }
function snowSlam(){ const b=CDRILL.clone().setY(0.6); burst(b,6,M.crys,1.1); burst(b,3,M.snow,0.8); mTone(CDRILL,180,90,0.12,'square',0.04); pulse(cdBit,0.12); }

// ---------- Kıyı: tekne dönünce boru çalar, sandıklar iskeleye iner ----------
const CST={init:false,post:null};
function coastFx(dt){ if(!CST.init){ CST.init=true; const w=WH_FRONT; CST.post=makePost(coast,CO.at(-0.2,9.2).x,0,CO.at(-0.2,9.2).z); } CST.post.g.visible=rg('boat')>0; if(rg('boat')>0){ const pileFull=pileVal(coastPile)>=coastPile.capFn()-0.5; setPost(CST.post,pileFull?'full':'on',rg('boat')); } }
function boatHorn(pos){ mTone(pos,196,196,0.35,'sawtooth',0.04); setTimeout(()=>mTone(pos,262,262,0.45,'sawtooth',0.04),380); }

// ---------- Üs deposu: kereste ve demir de görünür yığınlarda (makineleşme üste de görünsün) ----------
const DEP={init:false,plank:null,iron:null};
function depotFx(){ if(!DEP.init){ DEP.init=true;
    DEP.plank=stackIM(G.box,M.plank,24,i=>{ const row=Math.floor(i/3), col=i%3; vp.set(-0.62+col*0.32,0.38+row*0.11,1.2); e3.set(0,0,0); q.setFromEuler(e3); vs.set(0.29,0.1,1.0); }); depot.add(DEP.plank);
    const pal=mesh(G.box,M.woodDark,1.0,0.08,1.15,false); pal.position.set(-0.3,0.32,1.2); depot.add(pal);
    DEP.iron=stackIM(BAR_GEO,M.bar,24,i=>{ const row=Math.floor(i/4), col=i%4; vp.set(-0.35+(col%2)*0.6,0.37+row*0.17,-1.72+Math.floor(col/2)*0.3); e3.set(0,0,0); q.setFromEuler(e3); vs.set(1,1,1); }); depot.add(DEP.iron); }
  setStack(DEP.plank,Math.min(24,Math.floor(S.planks||0))); setStack(DEP.iron,Math.min(24,Math.floor(S.iron||0))); }

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
