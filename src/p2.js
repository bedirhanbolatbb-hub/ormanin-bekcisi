
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
    const tier=level<=6?0:1; const Hh=[2.6,3.0,3.4,3.6,3.9,4.2,4.6][level-4]; const col=tier?0x8d94a4:0xa8a49c, col2=tier?0x6f7686:0x9c9890;
    const blocks=[], crens=[];
    for(const [x0,z0,x1,z1] of segs){ const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz); const ry=-Math.atan2(dz,dx); blocks.push({x:(x0+x1)/2,y:Hh/2,z:(z0+z1)/2,ry,sx:len+0.6,sy:Hh,sz:0.9+0.15*tier,c:col}); const n=Math.round(len/1.2); if(level>=5) for(let i=0;i<=n;i++){ crens.push({x:x0+dx*i/n,y:Hh+0.3,z:z0+dz*i/n,ry,sx:.6,sy:.6,sz:1.0+0.15*tier,c:col2}); }
      const m=Math.max(1,Math.round(len)); for(let i=0;i<m;i++){ blocks.push({x:x0+dx*(i+0.5)/m,y:rand(0.4,Hh-0.4),z:z0+dz*(i+0.5)/m,ry,sx:rand(.5,1.1),sy:.35,sz:0.94+0.15*tier,c:Math.random()<.5?col2:col}); }
      if(level>=9){ blocks.push({x:(x0+x1)/2,y:Hh-0.15,z:(z0+z1)/2,ry,sx:len+0.6,sy:0.14,sz:1.0+0.15*tier,c:0xf2b43c}); } }
    add(instanced(G.box,mat(0xffffff),blocks)); if(crens.length) add(instanced(G.box,mat(0xffffff),crens));
    if(level>=7){ for(const [x,z] of [[-H,-H],[H,-H],[-H,H],[H,H]]){ const t=mesh(G.cyl,tier?M.stoneBlue:M.stone,1.1,Hh+2,1.1); t.position.set(x,(Hh+2)/2,z); const cap=mesh(G.cone,level>=10?M.flag:M.banner,1.5,1.5,1.5); cap.position.set(x,Hh+2.7,z); const fl=mesh(G.box,M.flag,0.7,0.5,0.05); fl.position.set(x+0.35,Hh+3.6,z); const pole=mesh(G.cyl,M.handle,0.05,1.6,0.05); pole.position.set(x,Hh+3.7,z); wallGroup.add(t,cap,fl,pole); } }
  }
  for(const s of SIDES){ for(const a of [-3.6,3.6]){ const [x,z]=sidePos(s,a,0.4); const p=mesh(G.cyl,M.woodDark,0.08,1.6,0.08); p.position.set(x,0.8,z); const f=mesh(G.sph,M.gold,0.18,0.26,0.18,false); f.position.set(x,1.75,z); wallGroup.add(p,f); } }
  bakeStatic(wallGroup); /* F6 */
}
buildWalls(S.lv.wall);
const torches=[]; for(const s of SIDES){ for(const a of [-3.6,3.6]){ const l=new THREE.PointLight(0xffb15a,0.5,8); scene.add(l); torches.push({l,s,a}); } }
function placeTorches(){ for(const t of torches){ const [x,z]=sidePos(t.s,t.a,0.4); t.l.position.set(x,2,z); } } placeTorches();
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
function makePony(){ const g=new THREE.Group(); const body=mesh(G.box,M.pony,0.7,0.62,1.35); body.position.set(0,0.78,-0.05); const neck=mesh(G.box,M.pony,0.4,0.5,0.4); neck.position.set(0,1.1,0.6); neck.rotation.x=-0.5; const head=mesh(G.box,M.pony,0.42,0.42,0.62); head.position.set(0,1.32,0.95); const snout=mesh(G.box,M.ponyLight,0.3,0.24,0.24); snout.position.set(0,1.22,1.3); const e1=mesh(G.sph,M.pupil,0.05,0.06,0.04,false); e1.position.set(-0.19,1.4,1.1); const e2=e1.clone(); e2.position.x=0.19; const earL=mesh(G.cone,M.pony,0.09,0.25,0.09); earL.position.set(-0.15,1.62,0.85); const earR=earL.clone(); earR.position.x=0.15; const mane=mesh(G.box,M.mane,0.14,0.5,0.7); mane.position.set(0,1.28,0.5); mane.rotation.x=-0.5; const tail=mesh(G.box,M.mane,0.14,0.6,0.16); tail.position.set(0,0.85,-0.78); tail.rotation.x=0.4; const saddle=mesh(G.box,M.banner,0.76,0.12,0.6); saddle.position.set(0,1.12,-0.05); g.add(body,neck,head,snout,e1,e2,earL,earR,mane,tail,saddle); const legs=[]; for(const [x,z] of [[-0.24,0.42],[0.24,0.42],[-0.24,-0.5],[0.24,-0.5]]){ const l=new THREE.Group(); l.position.set(x,0.55,z); const lm=mesh(G.box,M.ponyDark,0.18,0.55,0.2); lm.position.y=-0.28; const hoof=mesh(G.box,M.mane,0.2,0.1,0.22); hoof.position.y=-0.56; l.add(lm,hoof); g.add(l); legs.push(l);} bakeVC(g); /* F6 */ return {g,legs,tail,t:rand(0,6)}; }
// müşteriler sivil: miğfer yok, düşman kırmızısı yok; yeşil/sarı/mavi/mor gömlek, bazısında hasır şapka
const CIV_SHIRT=[mat(0x6cbf5f),mat(0xf2c14e),mat(0x4fb3c8),mat(0xa98bdc),mat(0xf3a6c8)], CIV_STRAW=mat(0xe8cf8a);
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
  const out={g,root,head,legL,legR,armL,armR,tool,back,logMesh,lootMesh,stoneMesh,coinMesh,pony,walkT:rand(0,6),swing:0,moving:false,aim:false}; if(kind!=='enemy') bakeGuy(out); /* F6: düşman makeEnemy sonunda (boyandıktan sonra) */ return out;
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
function updateBubble(){ const pd=bubblePad; if(!pd){ bubbleEl.style.display='none'; bubbleKey=''; return; } if(pd.locked){ const key='L'+pd.def.id; if(key!==bubbleKey){ bubbleKey=key; bubbleEl.innerHTML=`<b>🔒 ${pd.def.name}</b><span>${pd.def.desc}</span><em>${T(pd.def.lock+' ile açılır','Needs: '+pd.def.lock)}</em>`; } bubbleEl.style.display='block'; const p=player.g.position; v3.set(p.x,4.6,p.z).project(camera); bubbleEl.style.left=((v3.x+1)/2*innerWidth)+'px'; bubbleEl.style.top=((1-v3.y)/2*innerHeight)+'px'; return; } if(pd.block){ const key='B'+pd.def.id+pd.block; if(key!==bubbleKey){ bubbleKey=key; bubbleEl.innerHTML=`<b>${pd.def.name} <i>${T('Sv','Lv')} ${padLevel(pd.def)}/${pd.def.max}</i></b><span>${pd.def.desc}</span><em>${blockHint(pd)}</em>`; } bubbleEl.style.display='block'; const p=player.g.position; v3.set(p.x,4.6,p.z).project(camera); bubbleEl.style.left=((v3.x+1)/2*innerWidth)+'px'; bubbleEl.style.top=((1-v3.y)/2*innerHeight)+'px'; return; } /* F4: darboğaz ipucu */ const lvl=padLevel(pd.def); const cost=padCost(pd); const cur=S.paid[pd.def.id]||0; const need=Math.max(0,Math.ceil(cost-cur)); const pr=padRes(pd); const wood=pr==='wood'; const res=pr==='iron'?T('demir','iron'):pr==='plank'?T('kereste','planks'):pr==='stone'?T('taş','stone'):wood?T('odun','wood'):T('altın','gold'); const have=pr==='iron'?(S.iron||0):pr==='plank'?(S.planks||0):pr==='stone'?S.stones+S.stone:wood?S.logs+S.wood:S.coins; const can=have>=need-0.01;
  const key=pd.def.id+'|'+lvl+'|'+need+'|'+can+'|'+(cur>0.5); if(key!==bubbleKey){ bubbleKey=key; const lv=pd.def.kind==='up'||pd.def.kind==='tower'||pd.def.kind==='wall'||pd.def.kind==='expand'? (pd.def.max>=999?`<i>×${lvl}</i>`:`<i>${T('Sv','Lv')} ${lvl}/${pd.def.max}</i>`) : `<i>${lvl}/${pd.def.max}</i>`; bubbleEl.innerHTML=`<b>${pd.def.name} ${lv}</b><span>${pd.def.desc}</span><div class="bb"><button data-act="buy" class="${can?'':'off'}">${can?(pd.def.id==='tribute'?T('Hemen öde','Pay now'):T('Hemen yükselt','Upgrade now')):T('Yetersiz '+res,'Not enough '+res)}</button>${cur>0.5?'<button data-act="no">'+T('Vazgeç','Cancel')+'</button>':''}</div>`; }
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
addEventListener('keydown',e=>{ keys[e.key.toLowerCase()]=true; if(e.code) keys[e.code]=true; moveTarget=null; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); });
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
function floatText(pos,txt,cls){ const el=document.createElement('div'); el.className='float '+(cls||''); el.textContent=txt; document.body.appendChild(el); floats.push({el,p:pos.clone(),t:0}); }
function updateFloats(dt){ for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.t+=dt; if(f.t>1.1){ f.el.remove(); floats.splice(i,1); continue;} v3.copy(f.p); v3.y+=2.4+f.t*1.6; v3.project(camera); f.el.style.left=((v3.x+1)/2*innerWidth)+'px'; f.el.style.top=((1-v3.y)/2*innerHeight)+'px'; f.el.style.opacity=String(1-Math.max(0,f.t-0.6)/0.5); } }
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
  if(S.bank>0.5&&p.distanceTo(TREASURY)<2.6){ withdrawT-=dt; if(withdrawT<=0){ withdrawT=0.05; const amt=Math.min(S.bank,Math.max(3,S.bank/12)); S.bank-=amt; fly(TREASURY.clone().setY(0.9),player.g,()=>{ S.coins+=amt; coinPop(); },false,5); if(coinSfxT<=0){ coinSfxT=0.08; SFX.coin(); } } } }
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
  if(first&&S.stall>0&&stallT<=0){ stallT=D.buyTime(); S.stall--; S.sold=(S.sold||0)+1; stallPile.count=Math.min(30,S.stall); const price=D.lootPrice(); first.state='leave'; first.t=0; SFX.coin(); const from=stallDrop(); const n=Math.max(2,Math.min(8,Math.round(price/5))); dropCoins(STALL_FRONT.clone().setY(1.4),n,price/n,1.8,0.8); floatText(from,`+${Math.round(price)}`,''); }
  stallPile.count=Math.min(30,S.stall);
}
stallPile.count=Math.min(30,S.stall);
