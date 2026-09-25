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
