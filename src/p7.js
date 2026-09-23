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
function questEvent(k,amt){ if(!S.started||!S.meta) return; const Q=ensureQuests(); if(!Q) return; for(const q of Q.list){ if(q.k!==k||q.have>=q.n) continue; q.have=Math.min(q.n,q.have+(amt||1)); if(q.have>=q.n){ toast('📜 Görev tamam: '+questText(q)+' — ödülünü al','good'); SFX.card(); const c=$('questChip'); if(c){ c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } save(); } } }
function renderQuestChip(){ const c=$('questChip'); if(!c) return; const Q=started&&S.started?ensureQuests():null; if(!Q){ c.style.display='none'; return; } c.style.display='flex'; const done=Q.list.filter(q=>q.have>=q.n).length, claim=Q.list.some(q=>q.have>=q.n&&!q.claimed); const t=`📜 ${done}/3`; if(c._t!==t){ c._t=t; $('questTxt').textContent=t; } c.classList.toggle('done',claim); }
function showQuests(){ if($('questCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='questCard'; document.body.appendChild(card);
  const render=()=>{ const Q=ensureQuests(); const gold=Math.round(60+20*gw()); const allDone=Q.list.every(q=>q.claimed);
    card.innerHTML=`<div class="card"><h1>Günün görevleri</h1><p>Her gün yenilenir. Bitirdiğin görevin ödülünü buradan al.</p>${Q.list.map((q,i)=>{ const ok=q.have>=q.n; return `<div class="q${ok?' ok':''}"><div class="qb"><b>${questText(q)}</b><div class="qbar"><i style="width:${Math.round(q.have/q.n*100)}%"></i></div><small>${Math.floor(q.have)}/${q.n}</small></div>${q.claimed?'<span class="rw">✓ Alındı</span>':ok?`<button data-i="${i}" class="qget">👑 ${q.rw} + 💰 ${gold}</button>`:`<span class="rw">👑 ${q.rw}</span>`}</div>`; }).join('')}${allDone?'<p class="sub">Hepsini bitirdin — yarın yeni görevler gelecek.</p>':''}<button id="qClose">Kapat</button></div>`;
    card.querySelectorAll('.qget').forEach(b=>b.addEventListener('click',()=>{ audio(); const q=Q.list[+b.dataset.i]; if(q.claimed||q.have<q.n) return; q.claimed=true; S.meta.crowns+=q.rw; S.coins+=gold; coinPop(); SFX.fanfare(); celebrate(player.g.position.clone(),0.9); if(Q.list.every(x=>x.claimed)&&!Q.all){ Q.all=true; S.meta.crowns+=3; setTimeout(()=>toast('🏆 Günün tüm görevleri bitti: +3 taç','good'),400); } save(); render(); }));
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
  if(!t.down&&t.dmg>=mx){ t.down=true; floatText(t.g.position,'Kule sustu! Yanına git, onar','red'); SFX.boom(); burst(t.top.clone(),16,M.stoneDark,1.2); camShake=Math.max(camShake,0.3); }
  if(t.down){ t.g.rotation.z=lerp(t.g.rotation.z,0.08,Math.min(1,dt*3)); if(Math.random()<dt*5) burst(t.top.clone(),1,M.smoke,0.5,1.4); for(const a of t.archers){ if(a.aim!==undefined) a.aim=false; } return true; } return false; }
function shooterTick(e,dt){ if(e.shootLeft<=0) return false; let best=null,bd=13; for(const t of towers){ if(!t||t.down) continue; const d=Math.hypot(t.g.position.x-e.g.position.x,t.g.position.z-e.g.position.z); if(d<bd){ bd=d; best=t; } } if(!best) return false;
  e.shootLeft-=dt; e.g.rotation.y=Math.atan2(best.g.position.x-e.g.position.x,best.g.position.z-e.g.position.z); e.shootCd-=dt; if(e.guy) e.guy.armL.rotation.x=-1.4;
  if(e.shootCd<=0){ e.shootCd=e.boss?1.1:2.0; const m=mesh(G.cyl,M.eArrow,0.04,0.9,0.04,false); const from=e.g.position.clone().setY(1.4*e.sc); m.position.copy(from); scene.add(m); eArrows.push({m,from,t:0,tw:best,dmg:(e.boss?14:5)*atkK()}); tone(500,300,0.06,'triangle',0.025); } return true; }
function updateEArrows(dt){ for(let i=eArrows.length-1;i>=0;i--){ const a=eArrows[i]; a.t+=dt*1.8; const to=a.tw.top; const k=Math.min(1,a.t); a.m.position.lerpVectors(a.from,to,k); a.m.position.y+=Math.sin(k*Math.PI)*2; a.m.lookAt(to); a.m.rotateX(Math.PI/2);
    if(k>=1){ scene.remove(a.m); eArrows.splice(i,1); if(towers.includes(a.tw)){ a.tw.dmg=(a.tw.dmg||0)+a.dmg; burst(to.clone(),4,M.woodDark,0.6); } } } }
function dawnRepair(){ let any=false; for(const t of towers){ if(!t) continue; if(t.dmg>0||t.down){ any=true; t.dmg=0; t.down=false; t.g.rotation.z=0; } if(t.bar) t.bar.style.display='none'; } for(const a of eArrows) scene.remove(a.m); eArrows.length=0; if(any) setTimeout(()=>toast('🔨 Gün doğdu, kuleler onarıldı','good'),1200); }

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
  else if(e.kind==='pirate'&&revealed('coast')&&(e.side==='E'||e.side==='S')&&Math.random()<0.6){ let sh=ships.find(x=>!x.leaving); if(!sh){ const g=makeShip(); const a=0.32*(Math.random()<0.5?1:-1); const land=SC.clone().addScaledVector(rotU(CU,a),SEA.r-3.2), from=SC.clone().addScaledVector(rotU(CU,a*0.6),6); g.position.copy(from); g.rotation.y=Math.atan2(land.x-from.x,land.z-from.z); sh={g,from,land,k:0,a,crew:0,leaving:false,t:0}; ships.push(sh); banner('Korsan gemisi!','Kıyıdan asker çıkarıyor','boss'); }
    sh.crew++; e.hold=sh; e.g.visible=false; e.bar.style.display='none'; e.wp=Math.min(3,ROADS[e.side].length-1); }
  if(e.preKind==='raft'&&!rigSpawn.seenRaft){ rigSpawn.seenRaft=true; setTimeout(()=>toast('⛵ Akıncılar gölden sallarla geliyor!','bad'),600); } }
function holdTick(e,dt){ const sh=e.hold; if(sh.k<1) return false; sh.dropT=(sh.dropT||0)-dt; if(sh.dropT>0) return false; sh.dropT=0.35; const d=SC.clone().addScaledVector(rotU(CU,sh.a),SEA.r+2.2); e.g.position.set(d.x+rand(-1,1),0,d.z+rand(-1,1)); e.g.visible=true; e.bar.style.display=''; e.hold=null; sh.crew--; burst(e.g.position.clone().setY(0.4),8,M.foam,0.9); return true; }
function preArrive(e){ if(e.preKind==='raft'&&e.raft){ e.g.remove(e.raft); e.raft=null; e.g.position.y=0; e.speed=e.baseSpd||e.speed; burst(e.g.position.clone().setY(0.3),10,M.waterLight,1); } }
function updateShips(dt){ const t=performance.now()/1000; for(let i=ships.length-1;i>=0;i--){ const s=ships[i]; s.t+=dt;
    if(!s.leaving){ if(s.k<1){ s.k=Math.min(1,s.k+dt/5); const e=s.k*(2-s.k); s.g.position.lerpVectors(s.from,s.land,e); if(Math.random()<dt*6) burst(s.g.position.clone().setY(0.3),1,M.foam,0.4); } else if(s.crew<=0&&spawnQueue<=0){ s.leaving=true; s.k=0; } }
    else { s.k=Math.min(1,s.k+dt/6); s.g.position.lerpVectors(s.land,s.from,s.k*s.k); s.g.rotation.y+=dt*0.6*(1-s.k); if(s.k>0.6) s.g.position.y=-(s.k-0.6)*6; if(s.k>=1){ scene.remove(s.g); ships.splice(i,1); continue; } }
    if(!s.leaving||s.k<0.6) s.g.position.y=0.1+Math.sin(t*1.4)*0.12; s.g.rotation.z=Math.sin(t*1.1)*0.05; } }

// ----- kış: 9. sefer (ve sonsuzda her 10'un 9'u): ağaç yavaş kesilir, gündüz kısa, dünya karlı -----
function isWinter(){ return S.level%10===9; }
let winterOn=null, groundMesh=null;
function applyWinterLook(){ const w=isWinter(); if(w===winterOn) return; winterOn=w; M.leaf.color.setHex(w?0xe4eef4:0xffffff); M.leaf.emissive.setHex(w?0x5a6a74:0x000000); if(!groundMesh) scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map===groundTex) groundMesh=o; }); if(groundMesh){ groundMesh.material.color.setHex(w?0xeef4f8:0xffffff); groundMesh.material.emissive.setHex(w?0x6a7078:0x000000); } DAY.hemi.setHex(w?0xe8f0ff:0xfff4e0); DAY.bg.setHex(w?0xdfe6ee:0xe8dcc0); if(w&&S.started) setTimeout(()=>toast('❄️ Kış: ağaçlar yavaş kesilir, gündüzler kısa','bad'),3200); }

// ----- ana döngü ve sıfırlama -----
let p7T=0;
function updateP7(dt){ updateBossChests(dt); updateEArrows(dt); updateShips(dt); p7T-=dt; if(p7T<=0){ p7T=1; applyWinterLook(); } }
function clearP7Battle(){ for(const a of eArrows) scene.remove(a.m); eArrows.length=0; for(const s of ships) scene.remove(s.g); ships.length=0; if(!$("wheelCard")) clearBossChests(); }
function resetP7(){ clearP7Battle(); clearBossChests(); document.querySelectorAll('.hpbar.tw').forEach(b=>b.remove()); comboN=0; }
