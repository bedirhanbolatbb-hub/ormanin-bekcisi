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
  if((S[o.key]||0)>=carryCap()){ if(fullWarnT<=0){ fullWarnT=2.5; floatText(p,'Sırtın dolu — '+o.dest,'red'); } return true; }
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
  farmLbl.hide=fl<=0; if(fl>0){ const k='f'+fl; if(farmLbl._k!==k){ farmLbl._k=k; farmLbl.el.innerHTML=`${fl>=3?'Büyük Mantar Tarlası':'Mantar Tarlası'} <i>Sv ${fl}</i><small>dakikada ${Math.round(farmRate()*60)} mantar</small>`; } }
  shutLbl.hide=false; const k=(S.rg.herbIn||0)+'|'+(S.rg.potions||0)+'|'+rg('cauldron'); if(shutLbl._k!==k){ shutLbl._k=k; const full=(S.rg.potions||0)>=potCap(); shutLbl.el.innerHTML=`Otacı · İksir Kazanı <i>Sv ${rg('cauldron')+1}</i><small>🍄 ${S.rg.herbIn||0} · 🧪 ${S.rg.potions||0}/${potCap()}${full?' · raf dolu, iksir satılıyor':''}${(S.rg.herbIn||0)<2?' · <b class="full">mantar getir</b>':''}</small>`; } }
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
  if(fogOn()&&fogWarnWave!==S.level*10+S.wave){ fogWarnWave=S.level*10+S.wave; const dark=SIDES.slice(0,sidesActive()).filter(s=>!lampLit(s)); if(dark.length) setTimeout(()=>toast(`🌫️ Sis çöktü: ${dark.map(s=>SIDE_TR[s]).join(', ')} kapısında kuleler az görüyor — fener kur`,'bad'),2400); }
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
    const k='d'+dl+'|'+full; if(drillLbl._k!==k){ drillLbl._k=k; drillLbl.el.innerHTML=`${dl>=3?'Büyük Maden Matkabı':'Maden Matkabı'} <i>Sv ${dl}</i><small>dakikada ${Math.round(drillRate()*60)} cevher${full?' · <b class="full">ocak dolu</b>':''}</small>`; } }
  // ocak: 3 cevher → 1 demir çubuk
  const inn=S.rg.oreIn||0; const working=inn>=3&&(S.rg.forgeOut||0)<forgeOutCap(); if(working){ smeltCd-=dt; if(smeltCd<=0){ smeltCd=smeltT(); S.rg.oreIn=inn-3; S.rg.forgeOut=(S.rg.forgeOut||0)+1; const f=ironArea.userData.forge; burst(f.localToWorld(new THREE.Vector3(0.9,1.1,0.3)),10,M.fire,1.2); tone(1200,700,0.08,'square',0.04); } }
  hammerT-=dt; if(working&&hammerT<=0){ hammerT=0.5; tone(1500,1400,0.04,'triangle',0.02); }
  furnGlow.material.opacity=working?0.6+0.2*Math.sin(t*11):0.3; furnace.material.emissive.setHex(working?0xff6a00:0x7a2a00); bellows.scale.y=working?1+0.4*Math.sin(t*6):1;
  if(working&&Math.random()<dt*3){ const f=ironArea.userData.forge; smokePuff(forgeSmoke,f.localToWorld(f.userData.chim.clone())); } updateSmoke(forgeSmoke,dt);
  barStack.count=Math.min(30,Math.floor(S.rg.forgeOut||0));
  forgeLbl.hide=false; const k=Math.floor(inn)+'|'+Math.floor(S.rg.forgeOut||0)+'|'+rg('forge'); if(forgeLbl._k!==k){ forgeLbl._k=k; forgeLbl.el.innerHTML=`Demirci Ocağı <i>Sv ${rg('forge')+1}</i><small>⛏️ ${Math.floor(inn)} cevher · ${Math.floor(S.rg.forgeOut||0)} demir çubuk hazır${inn<3?' · <b class="full">cevher getir</b>':''}</small>`; } }
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
  whLbl.hide=false; const k=boats.length+'|'+rg('boat')+'|'+rg('harbor')+'|'+lh; if(whLbl._k!==k){ whLbl._k=k; whLbl.el.innerHTML=boats.length?`Liman <i>${boats.length} tekne</i><small>her seferde ~💰 ${Math.round(tripValue())} · sandık ${Math.round(60/chestEvery()*10)/10}/dk</small>`:`Liman<small>Tekne al: adalarla ticaret başlasın</small>`; } }
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
    const k='c'+cl+'|'+full; if(cdLbl._k!==k){ cdLbl._k=k; cdLbl.el.innerHTML=`${cl>=3?'Büyük Kristal Matkabı':'Kristal Matkabı'} <i>Sv ${cl}</i><small>dakikada ${Math.round(cdRate()*60)} kristal${full?' · <b class="full">kuyumcu dolu</b>':''}</small>`; } }
  const st=S.rg.crysIn||0; jewT-=dt; if(st>0&&jewT<=0&&pileVal(snowPile)<snowPile.capFn()-0.5){ jewT=jewSellT(); S.rg.crysIn=st-1; pileAdd(snowPile,crysPrice()); fly(JEW.clone().setY(1.4),snowPile.pos.clone().setY(0.8),null,false,4); }
  jewStock.count=Math.min(16,Math.floor(S.rg.crysIn||0)); if(Math.random()<dt*1.5){ const h=snowArea.userData.jew; smokePuff(jewSmoke,h.localToWorld(h.userData.chim.clone())); } updateSmoke(jewSmoke,dt);
  jewLbl.hide=false; const k=Math.floor(st)+'|'+rg('jeweler'); if(jewLbl._k!==k){ jewLbl._k=k; jewLbl.el.innerHTML=`Kuyumcu <i>Sv ${rg('jeweler')+1}</i><small>💎 ${Math.floor(st)}/${crysCap()} · dakikada ${Math.round(60/jewSellT())} satış${st<1?' · <b class="full">kristal getir</b>':''}</small>`; } }

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
  banner('KARA KRAL ÖFKELENDİ!','Muhafızlarını çağırdı — sonuna kadar dayan!','boss'); SFX.night(); SFX.boom(); camShake=0.7; burst(pos.clone().setY(1.5),24,M.darkRoof,1.6,1.6); const aura=glow(0xb040ff,6,0.6); aura.position.y=2; e.g.add(aura); e.aura=aura;
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
  {id:'lamp', grp:'swamp', ord:1, name:'Fener', desc:'Gece sisi kuleleri körleştirir; her seviye bir kapıya fener diker, oradaki kuleler tam görür', res:'gold', pos:padAt(SW,-8.2), kind:'up', key:'lamp', cost:l=>Math.round(140*Math.pow(1.5,l)), max:4, show:()=>revealed('swamp'), onBuy:()=>{ const L=lampPosts.filter(L=>lampLit(L.s)).slice(-2); for(const x of L) celebrate(x.g.position.clone(),0.7); toast('🏮 '+SIDE_TR[SIDES[rg('lamp')-1]]+' kapısı aydınlandı','good'); }},
  {id:'herbalist', grp:'swamp', ord:2, name:'Otacı Çırağı', desc:'Bataklıkta mantar toplar, kazana taşır', res:'gold', pos:padAt(SW,-5.4), kind:'up', key:'herbalist', cost:l=>Math.round(240*Math.pow(1.7,l)), max:3, show:()=>revealed('swamp'), onBuy:()=>{ const w=addGatherer(herbalists,SHUT_FRONT.clone(),M.moss); celebrate(w.guy.g.position.clone(),1); }},
  {id:'farm', grp:'swamp', ord:3, lock:'Bir otacı çırağı', name:'Mantar Tarlası', desc:'Makine: mantar kendiliğinden yetişir ve kazana akar. Sv3: büyük tarla', res:'gold', pos:padAt(SW,-2.6), kind:'up', key:'farm', cost:l=>Math.round(420*Math.pow(1.75,l)), max:5, show:()=>revealed('swamp')&&rg('herbalist')>=1, onBuy:()=>{ const b=farmBeds[Math.min(2,rg('farm')-1)]; celebrate(b.g.position.clone(),1.4); camShake=0.4; }},
  {id:'cauldron', grp:'swamp', ord:4, name:'İksir Kazanı', desc:'Daha hızlı iksir, daha büyük raf; iksir gece suru onarır, fazlası satılır', res:'gold', pos:padAt(SW,1.4), kind:'up', key:'cauldron', cost:l=>Math.round(200*Math.pow(1.6,l)), max:5, show:()=>revealed('swamp'), onBuy:()=>{ celebrate(CAUL.clone(),1.2); }},
  {id:'ironArrow', grp:'iron', ord:1, name:'Delici Ok', desc:'Demir uçlu oklar: kule hasarı +%10, zırhlı şövalyeyi deler', res:'iron', pos:padAt(IR,-8.2), kind:'up', key:'ironArrow', cost:l=>Math.round(10*Math.pow(1.5,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ for(const t of towers) if(t) celebrate(t.g.position.clone(),0.4); SFX.fanfare(); toast('🏹 Oklar artık demir uçlu','good'); }},
  {id:'ironWall', grp:'iron', ord:2, name:'Demir Kapı', desc:'Kapılar demirle kaplanır: sur canı +%12', res:'iron', pos:padAt(IR,-5.4), kind:'up', key:'ironWall', cost:l=>Math.round(14*Math.pow(1.5,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ S.gateHp=Math.min(D.gateMax(),S.gateHp+D.gateMax()*0.12); celebrate(new THREE.Vector3(0,0,0),0.8); }},
  {id:'miner', grp:'iron', ord:3, name:'Madenci', desc:'Cevher kazar, ocağa taşır', res:'gold', pos:padAt(IR,-2.6), kind:'up', key:'miner', cost:l=>Math.round(320*Math.pow(1.7,l)), max:3, show:()=>revealed('iron'), onBuy:()=>{ const w=addGatherer(miners,FORGE_FRONT.clone(),M.iron); celebrate(w.guy.g.position.clone(),1); }},
  {id:'drill', grp:'iron', ord:4, lock:'Bir madenci', name:'Maden Matkabı', desc:'Makine: dağdan kendiliğinden cevher çıkarır', res:'gold', pos:padAt(IR,0.2), kind:'up', key:'drill', cost:l=>Math.round(620*Math.pow(1.75,l)), max:5, show:()=>revealed('iron')&&rg('miner')>=1, onBuy:()=>{ celebrate(DRILL.clone(),1.6); camShake=0.5; }},
  {id:'forge', grp:'iron', ord:5, name:'Demirci Ocağı', desc:'Cevheri daha hızlı eritir, daha çok stok tutar; araba daha çok taşır', res:'gold', pos:padAt(IR,3.0), kind:'up', key:'forge', cost:l=>Math.round(260*Math.pow(1.6,l)), max:5, show:()=>revealed('iron'), onBuy:()=>{ celebrate(FORGE.clone(),1.2); }},
  {id:'lighthouse', grp:'coast', ord:1, name:'Deniz Feneri', desc:'Sahile daha sık ve daha değerli sandık vurur', res:'gold', pos:padAt(CO,-6.2), kind:'up', key:'lighthouse', cost:l=>Math.round(420*Math.pow(1.6,l)), max:5, show:()=>revealed('coast'), onBuy:()=>{ celebrate(LIGHT.clone(),1.4); camShake=0.4; }},
  {id:'boat', grp:'coast', ord:2, name:'Ticaret Teknesi', desc:'Makine: adalara sefer yapar, dönüşte para getirir', res:'gold', pos:padAt(CO,-3.4), kind:'up', key:'boat', cost:l=>Math.round(760*Math.pow(1.7,l)), max:5, show:()=>revealed('coast'), onBuy:()=>{ celebrate(PIER_B.clone(),1.4); camShake=0.4; }},
  {id:'harbor', grp:'coast', ord:3, lock:'Ticaret teknesi', name:'Liman', desc:'Her sefer daha değerli; Sv3: ikinci tekne', res:'gold', pos:padAt(CO,-0.6), kind:'up', key:'harbor', cost:l=>Math.round(560*Math.pow(1.6,l)), max:5, show:()=>revealed('coast')&&rg('boat')>=1, onBuy:()=>{ celebrate(WH.clone(),1.2); }},
  {id:'jeweler', grp:'snow', ord:1, name:'Kuyumcu', desc:'Kristali daha pahalı ve hızlı satar, daha çok stok ve para tutar', res:'gold', pos:padAt(SN,-6.2), kind:'up', key:'jeweler', cost:l=>Math.round(460*Math.pow(1.6,l)), max:5, show:()=>revealed('snow'), onBuy:()=>{ celebrate(JEW.clone(),1.2); }},
  {id:'cminer', grp:'snow', ord:2, name:'Kristalci', desc:'Kristal kazar, kuyumcuya taşır', res:'gold', pos:padAt(SN,-3.4), kind:'up', key:'cminer', cost:l=>Math.round(560*Math.pow(1.7,l)), max:3, show:()=>revealed('snow'), onBuy:()=>{ const w=addGatherer(cminers,JEW_FRONT.clone(),mat(0x3d63c9)); celebrate(w.guy.g.position.clone(),1); }},
  {id:'cdrill', grp:'snow', ord:3, lock:'Bir kristalci', name:'Kristal Matkabı', desc:'Makine: buz kayasından kendiliğinden kristal çıkarır', res:'gold', pos:padAt(SN,-0.6), kind:'up', key:'cdrill', cost:l=>Math.round(1100*Math.pow(1.75,l)), max:5, show:()=>revealed('snow')&&rg('cminer')>=1, onBuy:()=>{ celebrate(CDRILL.clone(),1.8); camShake=0.6; }},
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
