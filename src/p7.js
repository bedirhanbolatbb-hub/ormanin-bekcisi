// =====================================================================
// ---------- p7: vuruş hissi, patron sandığı + çark, günlük görevler, sal/korsan gemisi, düşman okçu, kış ----------
// =====================================================================
Object.assign(M,{ flashW:new THREE.MeshBasicMaterial({color:0xffffff}), raft:mat(0x9a6a3a), pirateSail:mat(0x1d1d22,{side:THREE.DoubleSide}), skull:mat(0xf4efe4), eArrow:mat(0xd04a2a,{emissive:0x5a1408}) });

// ----- vuruş hissi: beyaz parlama, seri öldürme sesi, patron ölünce ağır çekim -----
const M_FLVC=new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x6a5a50}); /* v45: vuruş parlaması rengi silmez (eski: düz beyaz → sürekli ok yiyen düşman/patron beyaz çarşaf gibi görünüyordu) */
function flashOn(e){ const now=performance.now(); if(e.flT0&&now-e.flT0<300) return false; e.flT0=now; if(!e.fm){ e.fm=[]; e.g.traverse(o=>{ if(o.isMesh&&o.material!==M.flashW&&o.material!==M_FLVC) e.fm.push([o,o.material]); }); } for(const f of e.fm){ const fl=ART_FLASH.get(f[0].geometry); f[0].material=fl?(fl.length===1?fl[0]:fl):f[0].geometry.attributes.color?M_FLVC:M.flashW; } return true; }
function flashOff(e){ if(e.fm) for(const f of e.fm) f[0].material=f[1]; }
let comboN=0, comboAt=-9;
function comboKill(e){ comboN=gameT-comboAt<1.4?comboN+1:1; comboAt=gameT; const k=Math.min(14,comboN-1); tone(400*(1+0.07*k),80+20*k,0.2,'sawtooth',0.05); if(k>=3) tone(900+80*k,1300+90*k,0.08,'triangle',0.035);
  if(comboN>=5&&comboN%5===0){ const bonus=Math.round((4+ew()*0.8)*comboN/5); dropCoins(e.g.position.clone().setY(1.2),Math.min(10,3+comboN/5),bonus/Math.min(10,3+comboN/5),2,1.2); floatText(e.g.position,T(`SERİ ×${comboN}! +${bonus}`,`COMBO ×${comboN}! +${bonus}`),'green'); camShake=Math.max(camShake,0.2); } }

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
/* p2m4: kampanya haritasında patron sandığı yalnız KALICI ödül verir (harita bitti, altın işe yaramaz): taç, sonraki haritaya hazır kart (meta.nextCard), kupa parçası (meta.troph[L]; 3 parça = kupa + 5 taç). 5. dilim büyük ödül (J=5) */
function metaSlices(){ const L=S.level, m=S.meta, tp=Math.min(3,(m.troph&&m.troph[L])|0);
  const cr=n=>()=>{ m.crowns+=n; return n>=6?T(`+${n} taç — büyük ödül!`,`+${n} crowns — jackpot!`):T(`+${n} taç`,`+${n} crowns`); };
  const card={i:'🃏',n:T('Hazır güç kartı','Head-start card'),a:'',w:9,c:'#3d63c9',pay:()=>{ m.nextCard=(m.nextCard||0)+1; return T('Sonraki haritaya bir güç kartıyla başlarsın','Head start: a power card on your next map'); }};
  const troph=tp>=3?{i:'👑',n:'+4',a:'+4',w:9,c:'#8a5ad0',pay:cr(4)}:{i:'🏆',n:T('Kupa parçası','Trophy piece'),a:`${tp+1}/3`,w:9,c:'#8a5ad0',pay:()=>{ const t=m.troph||(m.troph={}); t[L]=Math.min(3,(t[L]|0)+1); if(t[L]>=3){ m.crowns+=5; return T(`${mapName(L)} kupası tamam! +5 👑`,`${mapName(L)} trophy complete! +5 👑`); } return T(`Kupa parçası ${t[L]}/3`,`Trophy piece ${t[L]}/3`); }};
  /* v44: ödül dağılımı: beklenen ~+4 taç (eski ~+2: çoğu dönüş +2'ydi); +2 dilimi yok; büyük ödül +8 */
  return [{i:'👑',n:'+3',a:'+3',w:16,c:'#f2b43c',pay:cr(3)},card,{i:'👑',n:'+4',a:'+4',w:20,c:'#e8961a',pay:cr(4)},troph,{i:'👑',n:'+5',a:'+5',w:16,c:'#c98d4e',pay:cr(5)},{i:'💎',n:T('+8 taç','+8 crowns'),a:'+8',w:6,c:'#d9534f',jack:true,pay:cr(8)},{i:'👑',n:'+3',a:'+3',w:12,c:'#7cc47f',pay:cr(3)},{i:'👑',n:'+5',a:'+5',w:12,c:'#3d9a55',pay:cr(5)}]; }
function wheelSlices(){ if(MAPS[S.level]) return metaSlices(); const w=ew(), L=S.level, g=Math.round(120+25*w), gb=Math.round(180+30*w), gr=g*3, ns=20+3*L, np=12+2*L, ni=6+L;
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
    {i:'🃏',n:T('Hazır güç kartı','Free power card'),a:'',w:4,c:'#3d63c9',pay:()=>{ S.meta.nextCard=(S.meta.nextCard||0)+1; return endless()?T('Sonraki geceye bir güç kartıyla başlarsın','Power card for the next night!'):T('Sonraki haritaya bir güç kartıyla başlarsın','Power card for your next map!'); }}]; }
function wheelReward(k,W){ W=W||wheelSlices()[k]||wheelSlices()[0]; const at=player.g.position.clone(); const txt=W.pay();
  coinPop(); celebrate(at,W.jack?2:1.1); if(W.jack) confetti(); if(S.post) S.post.wheel=1; save(); return W.i+' '+txt; }
function showBossWheel(done){ if($('wheelCard')){ done&&done(); return; } const card=document.createElement('div'); card.className='intro'; card.id='wheelCard';
  const WHEEL=wheelSlices(); const lbl=WHEEL.map((s,i)=>{ const a=i*45+22.5; return `<span style="transform:rotate(${a}deg)"><b style="transform:rotate(${-a}deg)">${s.i}</b><i style="transform:rotate(${-a}deg)">${s.a}</i></span>`; }).join(''); /* FX3: simge ve miktar dik durur */ const grad=WHEEL.map((s,i)=>`${s.c} ${i*45}deg ${(i+1)*45}deg`).join(',');
  card.innerHTML=`<div class="card wheelCard"><h1>${T('Patron sandığı!','Boss Chest!')}</h1><p>${(MAPS[S.level]?T(`${bossName()} yenildi. Çevir: taç, güç kartı ya da kupa parçası!`,`${bossName()} defeated. Spin for crowns, a power card or a trophy piece!`):T(`${bossName()} yenildi. Çarkı çevir, ödülünü al.`,`${bossName()} defeated. Spin for your prize!`))}</p><div class="wheel"><i class="wpin"></i><div class="wdisc" id="wdisc" style="background:conic-gradient(${grad})">${lbl}<em></em></div></div><p class="wres" id="wres">&nbsp;</p><button id="wheelSpin" class="gold">${T('ÇEVİR!','SPIN!')}</button><button id="wheelOk" style="display:none">${T('Devam →','Continue →')}</button></div>`;
  document.body.appendChild(card); SFX.card();
  $('wheelSpin').addEventListener('click',()=>{ audio(); const b=$('wheelSpin'); if(b.disabled) return; b.disabled=true; b.textContent=T('Dönüyor…','Spinning…');
    let k=S.post&&S.post.k>=0?S.post.k:-1; if(k<0){ let tot=0; for(const s of WHEEL) tot+=s.w; let r=Math.random()*tot; k=0; for(let i=0;i<WHEEL.length;i++){ r-=WHEEL[i].w; if(r<=0){ k=i; break; } } if(S.post){ S.post.k=k; save(); } } // sonuç kaydedilir: yeniden yüklemek çarkı yeniden çevirtmez
    let off=rand(8,37); const rot=360*6-(k*45+off); /* v44: kıl payı kaçırma hilesi kalktı */
    const disc=$('wdisc'); disc.style.transition='transform 3.6s cubic-bezier(.12,.72,.18,1)'; disc.style.transform=`rotate(${rot}deg)`;
    /* FX4: tıklar çarkın gerçek açısından: her dilim sınırı iğneden geçerken bir tık (hızlıyken sık, yavaşlarken seyrek; son yavaş geçişler de duyulur), iğne her tıkta seker; durunca kazanan dilim parlar */
    { const bz=(x1,y1,x2,y2,x)=>{ let lo=0,hi=1,t=x; for(let i=0;i<22;i++){ t=(lo+hi)/2; const xx=3*x1*t*(1-t)*(1-t)+3*x2*t*t*(1-t)+t*t*t; if(xx<x) lo=t; else hi=t; } return 3*y1*t*(1-t)*(1-t)+3*y2*t*t*(1-t)+t*t*t; }; const t0=performance.now(), pin=card.querySelector('.wpin'); let lastS=0, lastTick=0;
      const step=()=>{ if(!document.body.contains(card)) return; const x=Math.min(1,(performance.now()-t0)/3600), sl=Math.floor(bz(.12,.72,.18,1,x)*rot/45); if(sl!==lastS){ lastS=sl; const now=performance.now(); if(now-lastTick>28){ lastTick=now; tone(900+500*x,700+300*x,0.03,'square',0.035); if(pin&&pin.animate&&!document.body.classList.contains('calm')) try{ pin.animate([{transform:'translateX(-50%) rotate(-20deg)'},{transform:'translateX(-50%) rotate(0deg)'}],{duration:90}); }catch(e){} } }
        if(x<1){ setTimeout(step,16); return; } const sp=card.querySelectorAll('.wdisc span')[k], bb=sp&&sp.querySelector('b'); if(bb){ bb.style.transition='transform .25s cubic-bezier(.2,1.6,.4,1)'; bb.style.transform='scale(1.35)'; bb.style.filter='drop-shadow(0 0 5px #fff) drop-shadow(0 0 3px #ffd23f)'; } tone(520,390,0.09,'triangle',0.06); }; step(); }
    setTimeout(()=>{ const txt=wheelReward(k,WHEEL[k]); const res=$('wres'); if(res) res.innerHTML=`<b>${txt}</b>`; if(WHEEL[k].jack) SFX.win(); else SFX.fanfare(); b.style.display='none'; const ok=$('wheelOk'); if(ok) ok.style.display=''; },3800); });
  $('wheelOk').addEventListener('click',()=>{ audio(); card.remove(); clearBossChests(); done&&done(); }); }
function applyNextCard(){ S.wheelCards={}; const n=(S.meta&&S.meta.nextCard)||0; if(!n) return; S.meta.nextCard=0; const ks=['arrow','rate','range','powder','wall','drill'].filter(cardUseful); for(let i=0;i<n;i++){ const k=ks[Math.floor(Math.random()*ks.length)]; S.cards[k]=(S.cards[k]||0)+1; S.wheelCards[k]=(S.wheelCards[k]||0)+1; if(k==='wall') S.gateHp=D.gateMax(); setTimeout(()=>toast('🃏 '+CARDS[k].i+' '+CARDS[k].n,'good'),2600+i*2600); } }

// ----- günlük görevler: her gün 3 görev, bitince taç + altın -----
const QPOOL=[
  {k:'chop',t:n=>T(`${n} ağaç kes`,`Chop ${n} trees`),b:25,s:10},{k:'kill',t:n=>T(`${n} düşman yen`,`Defeat ${n} enemies`),b:40,s:25},{k:'night',t:n=>T(`${n} gece atlat`,`Survive ${n} nights`),b:3,s:1},{k:'buy',t:n=>T(`${n} geliştirme yap`,`Upgrade ${n} times`),b:8,s:3},
  {k:'pile',t:n=>T(`Yığınlardan ${n} altın topla`,`Collect ${n} gold from piles`),b:250,s:300,need:()=>qRegion('pile',['lake','meadow'])},{k:'fish',t:n=>T(`${n} balık tut`,`Catch ${n} fish`),b:8,s:3,g:1,need:()=>qRegion('fish',['lake','coast'])},{k:'hunt',t:n=>T(`${n} hayvan avla`,`Hunt ${n} animals`),b:8,s:3,g:1,need:()=>qRegion('hunt',['meadow'])},
  {k:'herb',t:n=>T(`${n} mantar topla`,`Gather ${n} mushrooms`),b:12,s:4,g:1,need:()=>qRegion('herb',['swamp'])},{k:'mine',t:n=>T(`${n} cevher ya da kristal kaz`,`Mine ${n} ore or crystals`),b:12,s:4,g:1,need:()=>qRegion('mine',['iron','snow'])},{k:'chest',t:n=>T(`Sahilde ${n} sandık aç`,`Open ${n} beach chests`),b:2,s:1,mx:4,need:()=>qRegion('chest',['coast'])},
  /* p2m6: kalıcı ilerleme görevleri: yıldız kazan (her zaferin yıldızları sayılır, tekrar dahil: hep yapılabilir) · harita kazan (tekrar ve günün meydan okuması dahil) */
  {k:'star',t:n=>T(`${n} yıldız kazan`,`Earn ${n} stars`),b:3,s:1,mx:5},{k:'map',t:n=>T(`${n} harita kazan`,`Win ${n} maps`),b:1,s:1,mx:2},
];
// F8: görevler bugün yapılabilecek olandan üretilir: elle toplama yalnız bu/önceki seferin bölgesinde ya da oyuncunun son seferlerde yaptığı işte; "yükselt" kalan seviye kadar; yapılamaz hale gelen görev değiştirilir; alınmamış biten görevin ödülü ertesi gün verilir
/* p2m6: görev bölgesi = açılmış (oynanabilir) haritalardan birinde o bölge var: görev her zaman yapılabilir (o haritayı tekrar oynarsın) */
function qRegion(k,ids){ const n=Math.min(LEVELS,(S.meta&&S.meta.unlocked)||1); for(let L=1;L<=n;L++) if(MAPS[L]&&MAPS[L].regs.some(r=>ids.includes(r))) return true; return false; }
function upgradesLeft(){ let n=0; for(const pd of pads){ const d=pd.def; if(d.id==='tribute'||pd.locked||(d.grp&&!revealed(d.grp))) continue; let sh=false; try{ sh=d.show(); }catch(e){} if(sh&&d.max>0) n+=Math.max(0,d.max-padLevel(d)); } return n; }
const qTier=()=>Math.min(6,Math.floor((Math.max(1,(S.meta&&S.meta.unlocked)||1)-1)/2)); /* p2m6: görev kademesi açılmış haritaya göre (S.level değil: tekrar oynanan 1. harita görevi kolaylaştırmaz) */
function questN(q){ const tier=qTier(); let n=q.b+q.s*(q.g?Math.min(2,tier):tier); if(q.mx) n=Math.min(q.mx,n); if(q.k==='buy') n=Math.min(n,Math.floor(upgradesLeft()*0.6)); return n; }
function questOk(q){ return (!q.need||q.need())&&questN(q)>=(q.k==='buy'?3:1); }
function ensureQuests(){ if(!S.meta) return null; const day=dayKey(); const Q=S.meta.quests;
  if(Q&&Q.day===day&&Array.isArray(Q.list)){ if(Date.now()-(ensureQuests.t||0)<4000) return Q; ensureQuests.t=Date.now(); for(let i=0;i<Q.list.length;i++){ const q=Q.list[i], d=QPOOL.find(x=>x.k===q.k); if(!d||q.claimed||q.have>=q.n) continue; const left=q.k==='buy'?upgradesLeft():1e9; if(questOk(d)&&left>=q.n-q.have) continue; const alt=QPOOL.filter(x=>questOk(x)&&!Q.list.some(y=>y.k===x.k)); if(alt.length){ const a=alt[Math.floor(Math.random()*alt.length)]; Q.list[i]={k:a.k,n:questN(a),have:0,claimed:false,rw:q.rw}; } else if(q.k==='buy') q.n=Math.max(q.have+1,Math.min(q.n,q.have+left)); } return Q; }
  if(Q&&Array.isArray(Q.list)){ let cr=0; for(const q of Q.list) if(q.have>=q.n&&!q.claimed){ q.claimed=true; cr+=q.rw; } /* p2m7: dünün görevi yalnız taç öder: koşu altını yeni haritanın başlangıç altınına eklenmesin (göçte 20 yerine ~620 altın) */ if(cr>0){ S.meta.crowns+=cr; setTimeout(()=>toast(T(`📜 Dünün görevleri: +${cr} 👑`,`📜 Yesterday's quests: +${cr} 👑`),'good',true),3000); } }
  const pool=QPOOL.filter(questOk); const pick=[]; while(pick.length<3&&pool.length){ pick.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]); }
  S.meta.quests={day,list:pick.map((q,i)=>({k:q.k,n:questN(q),have:0,claimed:false,rw:2+(i===2?1:0)})),all:false}; return S.meta.quests; }
/* p2m6: Günün Meydan Okuması — tohum = hash(dayKey()): açılmış (kazanılmış) haritalardan birinin teması + tek değiştirici. S.mode='daily', S.mod, S.dkey.
   Ödül günde bir kez: 5 taç + günün kupası (meta.dtro sayacı, meta.dWon = gün). 2. harita kazanılınca açılır (meta.unlocked>=3): ilk iki harita kuralları öğretir, sonra ikinci bir günlük hedef.
   Kara Kale (10. harita) havuzda yok: kale sonu/son kart akışı kampanyaya özel. Kampanyadaki yarım harita meydan okumaya geçince baştan başlar (meta.campL: dönülecek harita). */
const DMODS={allGates:{i:'🚪',n:T('Dört Kapı','All Gates'),d:T('Düşman her gece dört kapıdan gelir · +80 başlangıç altını','Enemies use all four gates every night · +80 starting gold'),gold:80},
  doubleRams:{i:'🐏',n:T('Koçbaşı Akını','Ram Rush'),d:T('İki kat koçbaşı surlarına yüklenir','Twice the battering rams hit your walls'),gold:0},
  foggy:{i:'🌫️',n:T('Sisli','Foggy'),d:T('Kuleler %20 daha kısa görür','Towers see 20% less far'),gold:0},
  noSoldiers:{i:'🚫',n:T('Askersiz','No Soldiers'),d:T('Asker tutulamaz: kuleler ve sen','No soldiers: only towers and you'),gold:0},
  goldRush:{i:'💰',n:T('Altına Hücum','Gold Rush'),d:T('Düşmanlar %60 fazla altın düşürür · +100 başlangıç altını','Enemies drop 60% more gold · +100 starting gold'),gold:100},
  nightOnly:{i:'🌙',n:T('Bitmeyen Gece','Endless Night'),d:T('Gündüzler kısa ve karanlık · +60 başlangıç altını','Short, dark days · +60 starting gold'),gold:60}};
const DMOD_K=['allGates','doubleRams','foggy','noSoldiers','goldRush','nightOnly'], DAILY_CR=5, DAILY_AT=2; /* v44: 1. harita kazanılınca açılır (eski: 2. harita) */
const dmod=k=>S.mode==='daily'&&S.mod===k;
function hash32(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h^=h>>>13; h=Math.imul(h,0x5bd1e995)>>>0; h^=h>>>15; return h>>>0; }
function dayKeyOf(off){ const d=new Date(); d.setDate(d.getDate()+(off||0)); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
/* v44: havuz GÜN BAŞINDA sabitlenir (meta.dpn): gün içinde harita açılınca bugünün ve yarının seçimi değişmez */
function dailyPoolN(){ const m=S.meta||{}, dk=dayKeyOf(0), cur=Math.min(LEVELS-1,(m.unlocked||1)-1); if(!m.dpn||m.dpn.k!==dk||!(m.dpn.n>=1)) m.dpn={k:dk,n:Math.max(1,cur)}; return m.dpn.n; }
function dailyPool(){ const n=dailyPoolN(), a=[]; for(let L=1;L<=n;L++) a.push(L); return a.length?a:[1]; }
/* p2m6: değiştirici sırası 6 günlük bloklar: her blok altı değiştiricinin tohumlu bir karışımı (hepsi 6 günde bir kez; blok sınırında dünküyle aynıysa ilk ikisi yer değişir) → art arda aynı kural hiç gelmez.
   Tema: hash(gün) ile kazanılmış haritalardan; dünküyle aynıysa bir sonrakine kayar */
function dayNum(dk){ const p=String(dk).split('-').map(Number); return Math.round(Date.UTC(p[0],(p[1]||1)-1,p[2]||1)/864e5); }
function modPerm(b){ const a=DMOD_K.slice(); let h=hash32('grovehold-mods|'+b); for(let i=a.length-1;i>0;i--){ h=Math.imul(h^(h>>>15),2246822519)>>>0; const j=h%(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function modOf(dn){ const b=Math.floor(dn/6), pos=dn-6*b, a=modPerm(b), pv=modPerm(b-1); if(a[0]===pv[5]) [a[0],a[1]]=[a[1],a[0]]; return a[pos]; }
function themeIdx(dk,n){ return Math.floor(((hash32('grovehold-daily|'+dk)>>>8)%10007)/10007*n); }
function dailyOf(dk){ const pool=dailyPool(), dn=dayNum(dk); let li=themeIdx(dk,pool.length); if(pool.length>1){ const d=new Date(Date.UTC(1970,0,1)+(dn-1)*864e5), yk=d.getUTCFullYear()+'-'+(d.getUTCMonth()+1)+'-'+d.getUTCDate(); if(li===themeIdx(yk,pool.length)) li=(li+1)%pool.length; } return {k:dk,L:pool[li],mod:modOf(dn)}; }
function dailyToday(){ const dk=dayKeyOf(0), m=S.meta; if(!m.dc||m.dc.k!==dk||!MAPS[m.dc.L]||!DMODS[m.dc.mod]){ m.dc=(m.dnx&&m.dnx.k===dk&&MAPS[m.dnx.L]&&DMODS[m.dnx.mod])?{k:dk,L:m.dnx.L,mod:m.dnx.mod}:dailyOf(dk); } return m.dc; }
/* v44: yarının önizlemesi bir kez hesaplanıp saklanır: yarın gerçekten o gelir */
function dailyTomorrow(){ const tk=dayKeyOf(1), m=S.meta; if(!m.dnx||m.dnx.k!==tk||!MAPS[m.dnx.L]||!DMODS[m.dnx.mod]) m.dnx=dailyOf(tk); return m.dnx; } /* bugünkü seçim sabit kalır (gün içinde harita açılsa da) */
const dailyOn=()=>((S.meta&&S.meta.unlocked)||1)>=DAILY_AT;
const dailyDone=()=>S.meta.dWon===dayKeyOf(0);
function dailyLbl(dc){ return `${mapIc(dc.L)} ${mapName(dc.L)} · ${DMODS[dc.mod].i} ${DMODS[dc.mod].n}`; }
function campNext(){ const u=Math.max(1,Math.min(LEVELS+1,(S.meta.unlocked|0)||1)); return Math.max(1,Math.min(u,(S.meta.campL|0)||u)); }
function startDaily(){ if(!dailyOn()||dailyDone()) return false; const dc=dailyToday(); if(S.mode!=='daily') S.meta.campL=S.won?Math.min(LEVELS+1,S.level+1):S.level; startMap(dc.L,false,{daily:dc}); return true; }
/* p2m6: Sisli gün görünümü: sis yakına iner (yalnız bu modda; diğer haritalarda eski değer) */
function applyDailyLook(){ if(!scene.fog) return; const f=dmod('foggy'), th=TH(); scene.fog.near=f?26:th.fog[0]; scene.fog.far=f?92:th.fog[1]; } /* v45: sis temaya göre */
/* p2m6: Kampanya sekmesindeki kutucuk: bugünün teması + değiştiricisi, ödül, yarının önizlemesi */
function dailyHtml(){ if(!dailyOn()){ const dc=dailyToday(), md=DMODS[dc.mod]; return `<div class="rchest dtile lock"><div class="rch"><i>🎯</i><div><b>${T('Günün Meydan Okuması','Daily Challenge')}</b><small>${T('Bugün','Today')}: ${md.i} ${md.n} · 👑 +${DAILY_CR} · 🏆</small></div><button disabled>🔒 ${T('1. harita','Map 1')}</button></div><p class="dmod">${md.i} ${md.d}</p><small class="dtm">🔒 ${T('1. haritayı kazanınca açılır · her gün yeni harita + kural','Unlocks after Map 1 · a new map + twist every day')}</small></div>`; } /* v44: kilitliyken de bugünün kuralı ve ödülü görünür */
  const dc=dailyToday(), md=DMODS[dc.mod], done=dailyDone(), on=S.mode==='daily'&&!S.won&&S.dkey===dc.k, nx=dailyTomorrow();
  const left=(()=>{ const d=new Date(); d.setHours(24,0,0,0); return hm(d-Date.now()); })();
  const busy=S.mode!=='daily'&&!S.won&&MAPS[S.level]&&S.wave>1;
  const btn=done?`<button id="dPlay" disabled>✓ ${T('Bugün tamam','Done today')}</button>`:`<button id="dPlay">▶ ${on?T('Devam','Continue'):`👑 +${DAILY_CR}`}</button>`;
  return `<div class="rchest dtile${done?' done':''}"><div class="rch"><i>🎯</i><div><b>${T('Günün Meydan Okuması','Daily Challenge')}</b><small>${mapIc(dc.L)} ${mapName(dc.L)} · ${md.i} ${md.n}</small></div>${btn}</div><p class="dmod">${md.i} ${md.d}${done?` · 🏆 ${T(`${S.meta.dtro|0} günlük kupa`,`${S.meta.dtro|0} daily ${(S.meta.dtro|0)===1?'trophy':'trophies'}`)}`:` · 🏆 ${T('günün kupası','daily trophy')}`}</p>${busy&&!done&&!on?`<p class="dwarn">⚠ ${T(`${S.level}. haritadaki ilerlemen baştan başlar`,`Your Map ${S.level} run restarts`)}</p>`:''}<small class="dtm">${T('Yarın','Tomorrow')}: ${dailyLbl(nx)} · ${T(`${left} sonra`,`in ${left}`)}</small></div>`; }
/* p2m6: yarına sebep: oturumun ilk harita zaferinde kazanma kartında yarının hediyesi + Kraliyet Sandığı süresi + yarının meydan okuması */
let sessWin=0;
function tmrwHint(force){ try{ if(!S.meta||(sessWin&&!force)) return ''; sessWin=1; const k=dayKeyOf(0); const nx=S.meta.dailyDate===k?(S.meta.streak||0)+1:1, g=giftOf(nx), r=rcState();
  const rows=[`🎁 ${T(`Yarın gel: +${g} 👑 hediye`,`Come back tomorrow: +${g} 👑 gift`)}`, r.full?`🧰 ${T('Kraliyet Sandığı dolu: Krallık\'ta aç','Royal Chest is full: open it in the Kingdom')}`:`🧰 ${T(`Kraliyet Sandığı ${hm(r.left)} sonra dolu`,`Royal Chest full in ${hm(r.left)}`)}`,
    dailyOn()?`🎯 ${T('Yarın','Tomorrow')}: ${dailyLbl(dailyTomorrow())}`:`🎯 ${T('Günün Meydan Okuması 1. haritadan sonra','Daily Challenge unlocks after Map 1')}`];
  return `<div class="tmrw">${rows.map(x=>`<div>${x}</div>`).join('')}</div>`; }catch(e){ return ''; } }
function questText(q){ const d=QPOOL.find(x=>x.k===q.k); return d?d.t(q.n):q.k; }
let questSaveT=0;
// günlük görevler ilk seferin ortasından sonra açılır (ilk dakikalarda ekran sade kalsın)
function questsOn(){ return ((S.meta&&S.meta.unlocked)||1)>=2||(S.wave||1)>=3; } /* p2m6 */
function questEvent(k,amt){ if(!S.started||!S.meta||!questsOn()) return; const Q=ensureQuests(); if(!Q) return; for(const q of Q.list){ if(q.k!==k||q.have>=q.n) continue; q.have=Math.min(q.n,q.have+(amt||1)); if(q.have>=q.n){ toast(T('📜 Görev tamam!','📜 Quest complete!'),'good'); SFX.card(); const c=$('questChip'); if(c){ c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } save(); } } }
function renderQuestChip(){ const c=$('questChip'); if(!c) return; const Q=started&&S.started&&questsOn()?ensureQuests():null; if(!Q){ if(c.style.display!=='none'){ c.style.display='none'; hudRectT=-1e9; } return; } if(c.style.display!=='flex'){ c.style.display='flex'; hudRectT=-1e9; } const done=Q.list.filter(q=>q.have>=q.n).length, claim=Q.list.some(q=>q.have>=q.n&&!q.claimed); const t=T(`📜 Görev ${done}/3`,`📜 Daily ${done}/3`); if(c._t!==t){ c._t=t; $('questTxt').textContent=t; } c.classList.toggle('done',claim); }
/* v44: biten görevler kaçmaz: harita zaferinde ve Krallık açılınca kendiliğinden alınır, taçlar HUD'a uçar (altın yalnız harita sürerken) */
function claimQuests(inMap,from,to,noFly){ const Q=S.meta&&S.meta.quests; if(!Q||!Array.isArray(Q.list)||Q.day!==dayKey()) return null; let cr=0, gold=0; const g=Math.round(60+20*ew()); for(const q of Q.list){ if(q.claimed||!(q.have>=q.n)) continue; q.claimed=true; cr+=q.rw; if(inMap) gold+=g; } if(!cr) return null; let all=0; if(Q.list.every(x=>x.claimed)&&!Q.all){ Q.all=true; all=3; cr+=3; } S.meta.crowns+=cr; if(gold) S.coins+=gold; save();
  const fr=from||$('questChip'); if(!noFly) flyIcons('👑',Math.min(8,cr),fr,to||$('kingBtn')); if(gold&&!noFly) flyIcons('💰',4,fr,$('coinChip')); setTimeout(()=>toast(T(`📜 Görev ödülü: +${cr} 👑${gold?` · +${gold} altın`:''}${all?' (hepsi bitti +3)':''}`,`📜 Quest rewards: +${cr} 👑${gold?` · +${gold} gold`:''}${all?' (all done +3)':''}`),'good',true),300); renderQuestChip(); return {cr,gold}; }
function showQuests(){ if($('questCard')) return; const card=document.createElement('div'); card.className='intro'; card.id='questCard'; document.body.appendChild(card);
  const render=()=>{ const Q=ensureQuests(); const gold=Math.round(60+20*ew()); const allDone=Q.list.every(q=>q.claimed);
    card.innerHTML=`<div class="card"><h1>${T('Günün görevleri','Daily Quests')}</h1><p>${T('Her gün yenilenir. Bitirdiğin görevin ödülünü buradan al.','Resets daily. Claim your rewards here.')}</p>${Q.list.map((q,i)=>{ const ok=q.have>=q.n; return `<div class="q${ok?' ok':''}"><div class="qb"><b>${questText(q)}</b><div class="qbar"><i style="width:${Math.round(q.have/q.n*100)}%"></i></div><small>${Math.floor(q.have)}/${q.n}</small></div>${q.claimed?'<span class="rw">'+T('✓ Alındı','✓ Claimed')+'</span>':ok?`<button data-i="${i}" class="qget"><b>${T('AL','CLAIM')}</b> 👑 ${q.rw} + 💰 ${gold}</button>`:`<span class="rw">👑 ${q.rw}</span>`}</div>`; }).join('')}${allDone?'<p class="sub">'+T('Hepsini bitirdin — yarın yeni görevler gelecek.','All done — new quests tomorrow.')+'</p>':''}<button id="qClose">${T('Kapat','Close')}</button></div>`;
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
function isWinter(){ return !!(MAPS[S.level]&&MAPS[S.level].winter)||S.level%10===9; } /* p2: kış haritası (MAPS.winter) ya da sonsuzda her 10'un 9'u */
let winterOn=null, groundMesh=null, crownBase=null, winterToast=0;
// F8: kış bütün haritada: ağaç tepeleri karlı, çatılar kırağılı, zemin karlı ama geceleri kararır; kış geceleri daha koyu ve mavi
const NIGHT0={bg:NIGHT.bg.getHex(),sun:NIGHT.sun.getHex(),hemi:NIGHT.hemi.getHex(),sunI:NIGHT.sunI,hemiI:NIGHT.hemiI,exp:NIGHT.exp}, WG=new THREE.Color(0x46505c), WL=new THREE.Color(0x4a5660);
function winterTrees(w){ const ic=treeCrown&&treeCrown.instanceColor; if(!ic) return; if(!crownBase){ if(!w) return; crownBase=ic.array.slice(); } const a=ic.array, sn=[0.86,0.92,0.96]; for(let i=0;i<a.length;i++) a[i]=w?crownBase[i]*0.4+sn[i%3]*0.6:crownBase[i]; ic.needsUpdate=true; }
function applyWinterLook(){ const k=themeKey(); if(k===winterOn) return; winterOn=k; if(!groundMesh) scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map===groundTex) groundMesh=o; }); applyTheme(); /* v45: kış dahil bütün görünüm haritanın temasından */
  winterToast=isWinter()&&S.started&&S.meta&&S.meta.winterSeen!==S.level?1:0; }
// kış uyarısı bölge açılışı/afiş/pencere bitince, seferde bir kez, nötr renkte
function winterTick(){ if(!isWinter()) return; const k=1-night; if(groundMesh) groundMesh.material.emissive.copy(WG).multiplyScalar(k); M.leaf.emissive.copy(WL).multiplyScalar(k);
  if(winterToast&&!S.pendingReveal&&!$('banner')&&!document.querySelector('.intro')&&!waveActive){ winterToast=0; S.meta.winterSeen=S.level; toast(T('❄️ Kış: günler kısa · ağaç kesmek yavaş','❄️ Winter: short days · slower chopping')); } }

// ----- ana döngü ve sıfırlama -----
let p7T=0;
function updateP7(dt){ updateBossChests(dt); updateEArrows(dt); updateShips(dt); p7T-=dt; if(p7T<=0){ p7T=1; applyWinterLook(); } winterTick(); updateTheme(dt); updateArtCorpses(dt); }
// F8: kışın ilk iki gün uzun (uzak Karlı Geçit'e gidip dönmeye vakit), sonra kısa
const DAY_LEN=window.__dayLen||55; function dayLen(){ if(S.mode==='daily'&&S.mod==='nightOnly') return 30; /* p2m6: Bitmeyen Gece: kısa gündüz */ return isWinter()?(S.wave<=2?DAY_LEN-4:DAY_LEN-8):DAY_LEN; } /* p2m3: haritalar 8-12 dk: gündüz 30→55 sn (kış biraz kısa) */
for(const s of SIDES) threatLbl[s].clampIn=true; /* F8: kapı tehdit etiketi (👑) ekran kenarında kesilmez */
function clearP7Battle(){ for(const a of eArrows) scene.remove(a.m); eArrows.length=0; for(const s of ships){ scene.remove(s.g); freeOwned(s.g); } ships.length=0; if(!$("wheelCard")) clearBossChests(); }
function resetP7(){ clearP7Battle(); clearBossChests(); document.querySelectorAll('.hpbar.tw').forEach(b=>b.remove()); comboN=0; }
