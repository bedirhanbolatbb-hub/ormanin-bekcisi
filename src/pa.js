// ---------- v46: 3B KARAKTERLER (KayKit, CC0) ----------
/* Her karakter türü için bir kalıp: gövde parçaları + başlık/pelerin + silahlar TEK deri ağında birleşir (karakter başına 1-2 çizim), her örnek kalıbın kopyası.
   Animasyonlar iki kütüphaneden (insan: anim_h, iskelet: anim_s); bütün KayKit karakterleri aynı iskeleti kullanır. animGuy() bu karakterlerde klip oynatır. */
const ART_K=0.9; const SKEL_TINT=0xa88274; /* iskelet kemiği beyaz parlamasın: is/kül tonu */ /* KayKit boyu (~2.4) → oyunun karakter boyu */
const ART_ROLES={
  player:{c:'knight',hide:['1H_Sword','Badge_Shield'],w:[['w_crossbow_1handed','handslot.r']],s:1.35,lib:'h',crown:1},
  soldier:{c:'knight',hide:['Knight_Cape'],s:1.0,lib:'h'},
  worker:{c:'barbarian',hide:['2H_Axe'],s:0.95,lib:'h'},
  civ:[{c:'rogue',hide:['1H_Crossbow','Knife'],s:0.92,lib:'h'},{c:'mage',hide:['2H_Staff'],s:0.92,lib:'h'},{c:'rogue_h',hide:['1H_Crossbow','Knife'],s:0.92,lib:'h'}],
  hunter:{c:'rogue_h',hide:['Knife'],s:0.95,lib:'h'},
  grunt:{c:'sk_minion',w:[['w_blade','handslot.r']],s:0.95,lib:'s'},
  runner:{c:'sk_rogue',hide:['Skeleton_Rogue_Cape'],w:[['w_blade','handslot.r']],s:0.88,lib:'s'},
  raider:{c:'sk_rogue',w:[['w_axe','handslot.r']],s:0.95,lib:'s'},
  shield:{c:'sk_warrior',w:[['w_blade','handslot.r'],['w_shield_large_a','handslot.l']],s:1.05,lib:'s'},
  knight:{c:'sk_warrior',w:[['w_axe','handslot.r'],['w_shield_small_a','handslot.l']],s:1.1,lib:'s',tint:0xb8c0cc},
  wolf:{c:'sk_minion',w:[['w_blade','handslot.r']],s:0.82,lib:'s',tint:0xc8b8a8},
  archerT:{c:'rogue_h',hide:['Knife'],s:0.95,lib:'h'},
  archer:{c:'sk_rogue',w:[['w_crossbow','handslot.r']],s:0.95,lib:'s'},
  poison:{c:'sk_mage',w:[['w_staff','handslot.r']],s:1.0,lib:'s',tint:0xa8e08a},
  pirate:{c:'sk_rogue',w:[['w_blade','handslot.r']],s:1.0,lib:'s',tint:0xc8d8ff},
  ice:{c:'sk_warrior',w:[['w_axe','handslot.r']],s:1.05,lib:'s',tint:0xb8e8ff},
  boss:{c:'sk_warrior',w:[['w_axe','handslot.r'],['w_shield_small_a','handslot.l']],s:1.0,lib:'s'},
};
/* patronlar: haritanın patronuna göre model, renk ve silah */
const ART_BOSS={wolf:{c:'barbarian',hide:['1H_Axe'],w:[['w_axe_2handed','handslot.r']],lib:'h',tint:0xe0c8b0},horns:{c:'barbarian',hide:['1H_Axe'],w:[['w_axe_2handed','handslot.r']],lib:'h',tint:0xffd0b0},pirate:{c:'rogue',hide:['Knife'],w:[],lib:'h',tint:0xb8c4ff},helm:{c:'sk_warrior',w:[['w_axe','handslot.r'],['w_shield_large_a','handslot.l']],lib:'s'},
  hood:{c:'sk_rogue',w:[['w_crossbow','handslot.r']],lib:'s',tint:0xb0e0a0},witch:{c:'sk_mage',w:[['w_staff','handslot.r']],lib:'s',tint:0xd0a8ff},iron:{c:'sk_warrior',w:[['w_axe','handslot.r'],['w_shield_small_a','handslot.l']],lib:'s',tint:0x9aa4b4},
  pirateKing:{c:'barbarian',hide:['1H_Axe'],w:[['w_axe_2handed','handslot.r']],lib:'h',tint:0xffb8b8},frost:{c:'sk_warrior',w:[['w_axe','handslot.r']],lib:'s',tint:0x9fdcff},crown:{c:'knight',hide:['Badge_Shield','1H_Sword'],w:[['w_axe_2handed','handslot.r']],lib:'h',tint:0x5a5470,crown:1}};
const ART_TPL={}, ART_CLIPS={}, ART_EMATS=[], ART_FLASH=new WeakMap();
function artOk(){ return !!(ART&&ART.ok); }
function artClips(lib){ if(ART_CLIPS[lib]) return ART_CLIPS[lib]; const g=ART.glb[lib==='s'?'anim_s':'anim_h'], o={}; for(const a of g.animations) o[a.name]=a; return ART_CLIPS[lib]=o; }
function artTemplate(spec){ const key=spec.c+'|'+(spec.hide||[]).join(',')+'|'+(spec.w||[]).map(w=>w.join('@')).join(',')+'|'+(spec.tint||0)+'|'+(spec.crown||0)+'|'+(spec.enemy?1:0); if(ART_TPL[key]) return ART_TPL[key];
  const src=SkeletonUtils.clone(ART.glb[spec.c].scene); src.updateMatrixWorld(true); let skin=null; const parts=[];
  src.traverse(o=>{ if(o.isSkinnedMesh&&!skin) skin=o; });
  const bones=skin.skeleton.bones, boneIdx=b=>{ let p=b; while(p){ const i=bones.indexOf(p); if(i>=0) return i; p=p.parent; } return 0; };
  src.traverse(o=>{ if(!o.isMesh) return; if((spec.hide||[]).includes(o.name)||(spec.hide||[]).includes(o.parent&&o.parent.name)) return; parts.push(o); });
  /* silahlar: kendi dosyalarından, el yuvası kemiğine */
  const extra=[]; for(const [wf,bn] of (spec.w||[])){ const ws=ART.glb[wf]&&ART.glb[wf].scene; if(!ws) continue; const bone=bones.find(b=>b.name===bn); if(!bone) continue; ws.updateMatrixWorld(true); ws.traverse(o=>{ if(o.isMesh) extra.push({o,bone}); }); }
  const groups=new Map(); /* doku → parça listesi */
  const addPart=(geo,mw,bi,map,skinned,o)=>{ const k=map?map.uuid:'none'; if(!groups.has(k)) groups.set(k,{map,list:[]}); groups.get(k).list.push({geo,mw,bi,skinned,o}); };
  for(const o of parts){ const m=o.material; addPart(o.geometry,o.matrixWorld.clone(),o.isSkinnedMesh?-1:boneIdx(o.parent),m&&m.map,o.isSkinnedMesh,o); }
  for(const {o,bone} of extra){ const mw=bone.matrixWorld.clone().multiply(o.matrixWorld); addPart(o.geometry,mw,bones.indexOf(bone),o.material&&o.material.map,false); }
  const pos=[],nor=[],uv=[],si=[],sw=[],idx=[], grp=[]; let vbase=0; const v=new THREE.Vector3(), nm=new THREE.Matrix3();
  for(const G0 of groups.values()) for(const P of G0.list) if(P.skinned) P.o.skeleton.update(); const Mk=new THREE.Matrix4(), Mt=new THREE.Matrix4(), Mv=new THREE.Matrix4();
  for(const [k,G0] of groups){ const start=idx.length; for(const P of G0.list){ const g=P.geo, pa=g.attributes.position, na=g.attributes.normal, ua=g.attributes.uv, ja=g.attributes.skinIndex, wa=g.attributes.skinWeight; nm.getNormalMatrix(P.mw);
      for(let i=0;i<pa.count;i++){ let M0=P.mw; if(P.skinned&&ja){ /* deri parçası: dinlenme duruşundaki gerçek dünya konumu (three'nin deri hesabıyla aynı) */ Mk.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0); for(let c=0;c<4;c++){ const w=c===0?wa.getX(i):c===1?wa.getY(i):c===2?wa.getZ(i):wa.getW(i); if(!w) continue; Mt.fromArray(P.o.skeleton.boneMatrices,(c===0?ja.getX(i):c===1?ja.getY(i):c===2?ja.getZ(i):ja.getW(i))*16); for(let e=0;e<16;e++) Mk.elements[e]+=Mt.elements[e]*w; } Mv.copy(P.o.matrixWorld).multiply(P.o.bindMatrixInverse).multiply(Mk).multiply(P.o.bindMatrix); M0=Mv; nm.getNormalMatrix(Mv); }
        v.fromBufferAttribute(pa,i).applyMatrix4(M0); pos.push(v.x,v.y,v.z); if(na){ v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize(); nor.push(v.x,v.y,v.z); } else nor.push(0,1,0); if(ua) uv.push(ua.getX(i),ua.getY(i)); else uv.push(0,0);
        if(P.skinned&&ja){ si.push(ja.getX(i),ja.getY(i),ja.getZ(i),ja.getW(i)); sw.push(wa.getX(i),wa.getY(i),wa.getZ(i),wa.getW(i)); } else { si.push(P.bi,0,0,0); sw.push(1,0,0,0); } }
      if(g.index){ const ia=g.index; for(let i=0;i<ia.count;i++) idx.push(vbase+ia.getX(i)); } else for(let i=0;i<pa.count;i++) idx.push(vbase+i); vbase+=pa.count; }
    grp.push({start,count:idx.length-start,map:G0.map}); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4)); geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4)); geo.setIndex(vbase>65535?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1));
  const mats=grp.map((G1,i)=>{ geo.addGroup(G1.start,G1.count,i); if(G1.map){ G1.map.encoding=THREE.sRGBEncoding; G1.map.needsUpdate=true; } const m=new THREE.MeshLambertMaterial({map:G1.map||null,color:spec.tint||(spec.lib==='s'?SKEL_TINT:0xffffff)}); if(spec.enemy) ART_EMATS.push(m); return m; });
  /* eski parçaları at, birleşik ağı iskelete bağla */ const old=[]; src.traverse(o=>{ if(o.isMesh) old.push(o); }); for(const o of old) o.parent.remove(o);
  const sm=new THREE.SkinnedMesh(geo,mats.length===1?mats[0]:mats); sm.castShadow=false; sm.receiveShadow=false; /* gölge: ayak altındaki yuvarlak gölge yeter (karakter gölge geçişinde çizilmez) */ sm.frustumCulled=false; src.add(sm); src.updateMatrixWorld(true);
  const sk=new THREE.Skeleton(bones,bones.map(b=>b.matrixWorld.clone().invert())); /* dinlenme duruşu = bağlama duruşu */ sm.bind(sk,new THREE.Matrix4()); ART_FLASH.set(geo,mats.map(m=>{ const f=m.clone(); f.emissive=new THREE.Color(0x8a7a70); return f; }));
  if(spec.crown){ const hb=bones.find(b=>b.name==='head'); if(hb){ const c=new THREE.Group(); const band=mesh(G.cyl,M.crown,0.36,0.2,0.36); c.add(band); for(let i=0;i<5;i++){ const a=i/5*6.283; const sp=mesh(G.cone,M.crown,0.09,0.22,0.09); sp.position.set(Math.cos(a)*0.32,0.18,Math.sin(a)*0.32); c.add(sp); } c.position.set(0,1.18,0); c.name='artCrown'; hb.add(c); } }
  return ART_TPL[key]={root:src,lib:spec.lib||'h'}; }
/* makeGuy ile aynı arayüz: g, root, kollar/bacaklar (boş tutamak: eski kod dokunabilir), tool, back… + mixer */
function artGuy(kind,spec){ spec=spec||ART_ROLES[kind]; if(Array.isArray(spec)) spec=spec[Math.floor(Math.random()*spec.length)]; const T0=artTemplate(spec); const inst=SkeletonUtils.clone(T0.root); const g=new THREE.Group(), root=new THREE.Group(); g.add(root);
  const s=ART_K*(spec.s||1); inst.scale.setScalar(s); root.add(inst); let sm=null; inst.traverse(o=>{ if(o.isSkinnedMesh) sm=o; });
  const dummy=()=>{ const h=new THREE.Group(); h.visible=false; root.add(h); return h; }; const legL=dummy(), legR=dummy(), armL=dummy(), armR=dummy(), tool=dummy(), head=dummy(); tool.add(new THREE.Object3D(),new THREE.Object3D(),new THREE.Object3D());
  const back=new THREE.Group(); back.position.set(0,0.62,-0.42); root.add(back);
  const logMesh=new THREE.InstancedMesh(G.log,M.log,LOG_MAX); logSlots.forEach((m,i)=>logMesh.setMatrixAt(i,m)); logMesh.count=0; logMesh.castShadow=true; logMesh.frustumCulled=false; back.add(logMesh);
  const lootMesh=new THREE.InstancedMesh(helmGeo,M.enemy,LOG_MAX); lootMesh.count=0; lootMesh.castShadow=true; lootMesh.frustumCulled=false; back.add(lootMesh);
  const stoneMesh=new THREE.InstancedMesh(G.box,M.rock,LOG_MAX); stoneMesh.count=0; stoneMesh.castShadow=true; stoneMesh.frustumCulled=false; back.add(stoneMesh);
  let coinMesh=null; if(kind==='player'){ coinMesh=new THREE.InstancedMesh(G.coin,M.coin,COIN_STACK); coinSlots.forEach((m,i)=>coinMesh.setMatrixAt(i,m)); coinMesh.count=0; coinMesh.frustumCulled=false; coinMesh.position.y=2.6; root.add(coinMesh); }
  const mixer=new THREE.AnimationMixer(inst); const clips=artClips(T0.lib);
  const out={g,root,head,legL,legR,armL,armR,tool,back,logMesh,lootMesh,stoneMesh,coinMesh,pony:null,walkT:rand(0,6),swing:0,moving:false,aim:false,art:{inst,sm,mixer,clips,lib:T0.lib,acts:{},cur:null,sw:0,kind,one:null}};
  blobAdd(g,kind==='player'?0.8:0.6); artPlay(out,artIdle(out),0); out.art.mixer.update(Math.random()*2);
  root.add=function(...o){ for(const x of o) if(x&&x!==back) x.visible=false; return THREE.Group.prototype.add.apply(this,o); }; /* eski şapka/süs eklemeleri modelde görünmez */ return out; }
function artIdle(guy){ return guy.art.lib==='s'?'Idle_Combat':'Idle'; }
function artRun(guy,k){ return guy.art.lib==='s'?(guy.fast?'Running_C':'Walking_D_Skeletons'):(guy.art.kind==='civ'||guy.art.kind==='hunter'?'Walking_A':'Running_A'); }
function artPlay(guy,name,fade,once,ts){ const A=guy.art; const clip=A.clips[name]; if(!clip) return null; let act=A.acts[name]; if(!act){ act=A.acts[name]=A.mixer.clipAction(clip); } if(A.cur===name&&!once) { act.timeScale=ts||1; return act; }
  act.reset(); act.timeScale=ts||1; act.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat); act.clampWhenFinished=!!once; act.enabled=true; const prev=A.cur&&A.acts[A.cur]; if(prev&&prev!==act&&fade>0){ act.play(); prev.crossFadeTo(act,fade,false); } else { if(prev&&prev!==act) prev.stop(); act.play(); } A.cur=name; return act; }
/* animGuy'ın yerine: hareket → koşu, saldırı/kesme (swing) → tek vuruş, nişan → atış, yoksa bekleme */
function artAnim(guy,dt,moving,k){ const A=guy.art; k=k||1;
  if(guy.swing>0&&A.sw<=0){ const nm=A.kind==='player'?(guy.aim?'1H_Ranged_Shoot':'1H_Melee_Attack_Chop'):A.lib==='s'?(guy.big?'2H_Melee_Attack_Chop':'1H_Melee_Attack_Chop'):(A.kind==='soldier'?'1H_Melee_Attack_Slice_Diagonal':'1H_Melee_Attack_Chop'); A.one=nm; artPlay(guy,nm,0.08,true,1.6); }
  if(guy.shot){ guy.shot=0; if(!moving&&!(A.one&&A.acts[A.one]&&A.acts[A.one].isRunning())){ A.one='1H_Ranged_Shoot'; artPlay(guy,'1H_Ranged_Shoot',0.06,true,1.8); } }
  A.sw=guy.swing; if(guy.swing>0) guy.swing-=dt;
  const oneAct=A.one&&A.acts[A.one]; const busy=oneAct&&oneAct.isRunning();
  if(!busy){ A.one=null; if(moving) artPlay(guy,artRun(guy,k),0.15,false,(A.lib==='s'?1.0:0.95)*k); else if(guy.aim&&(A.kind==='player'||A.kind==='archerT')) artPlay(guy,'1H_Ranged_Shoot',0.1,false,1.4); else artPlay(guy,artIdle(guy),0.2); }
  A.mixer.update(dt); }
/* gece kırmızımsı ışıma (eski M_VCE ile aynı) */
function artNight(k){ for(const m of ART_EMATS) m.emissive.setRGB(0.1+0.25*k,0.02+0.04*k,0.02+0.03*k); } /* düşman gündüz de hafif kızıl: zeminden ayrılır */
/* ölen iskelet dağılır, sonra yere gömülür */
const artCorpses=[];
function artDie(e){ const guy=e.guy; if(!guy||!guy.art) return false; const nm=guy.art.lib==='s'?'Death_C_Skeletons':'Death_A'; guy.art.one=null; artPlay(guy,nm,0.05,true,1.3); if(e.bar) e.bar.remove(); artCorpses.push({g:e.g,guy,t:0}); return true; }
function updateArtCorpses(dt){ for(let i=artCorpses.length-1;i>=0;i--){ const c=artCorpses[i]; c.t+=dt; c.guy.art.mixer.update(dt); if(c.t>1.6) c.g.position.y-=dt*0.9; if(c.t>2.6){ scene.remove(c.g); artCorpses.splice(i,1); } } }
function clearArtCorpses(){ for(const c of artCorpses) scene.remove(c.g); artCorpses.length=0; }

/* v46: KayKit Ortaçağ yapıları (tek doku atlası, tek malzeme): kuleler, köşe kuleleri, kale, pazar, kereste avlusu, kışla, bayrak */
let ART_BM=null; const ART_PROPS={};
function artBldMat(){ if(ART_BM) return ART_BM; let map=null; ART.glb.bld.scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map&&!map) map=o.material.map; }); if(map){ map.encoding=THREE.sRGBEncoding; map.needsUpdate=true; } return ART_BM=new THREE.MeshLambertMaterial({map}); }
/* ad → birleşik geometri (düğüm dönüşümleri işlenmiş) */
function artPropGeo(name){ if(ART_PROPS[name]!==undefined) return ART_PROPS[name]; const node=ART.glb.bld.scene.getObjectByName(name); if(!node){ return ART_PROPS[name]=null; } node.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(node.matrixWorld).invert(); const gs=[];
  node.traverse(o=>{ if(o.isMesh) gs.push([o.geometry,new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)]); });
  const pos=[],nor=[],uv=[], v=new THREE.Vector3(), nm=new THREE.Matrix3(); for(const [g,M4] of gs){ nm.getNormalMatrix(M4); const P=g.attributes.position, N=g.attributes.normal, U=g.attributes.uv, I=g.index; const n=I?I.count:P.count; for(let k=0;k<n;k++){ const i=I?I.getX(k):k; v.set(P.getX(i),P.getY(i),P.getZ(i)).applyMatrix4(M4); pos.push(v.x,v.y,v.z); if(N){ v.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(nm).normalize(); nor.push(v.x,v.y,v.z); } else nor.push(0,1,0); if(U) uv.push(U.getX(i),U.getY(i)); else uv.push(0,0); } } /* nicelenmiş (int16) konumlar önce açılır, sonra dönüştürülür */
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.computeBoundingBox(); geo.computeBoundingSphere(); return ART_PROPS[name]=geo; }
function artProp(name,sx,sy,sz,gm){ const geo=artPropGeo(name); if(!geo) return null; const m=new THREE.Mesh(geo,gm||artBldMat()); m.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz); m.castShadow=true; m.receiveShadow=true; return m; }
function artKC(){ return (TH()&&TH().kc)||'red'; }
function artTowerMesh(kind,lvl0,isC,gm){ const lvl=Math.min(lvl0,14); const g=new THREE.Group(); const sc=isC?1.35:1; const archers=[]; let top; const kc=artKC(); const Hh=(2.4+lvl*0.3)*sc;
  if(isC&&kind==='a'){ /* merkez kule = haritanın kalesi */ const cs=1.55+0.04*Math.min(10,lvl); const body=artProp('building_castle_'+kc,cs,cs,cs,gm); g.add(body); const th=3.98*cs; for(let i=0;i<2;i++){ const ar=makeGuy('archerT'); ar.g.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); ar.g.position.set(i?0.75*cs:-0.75*cs,th*0.47,0.62*cs); ar.g.scale.setScalar(0.8); if(gm){ ar.g.traverse(o=>{ if(o.isMesh) o.material=gm; }); } g.add(ar.g); archers.push(ar); } return {g,archers,top:new THREE.Vector3(0,th*0.6,0)}; }
  const body=artProp('building_tower_base_'+kc,2.3*sc,Hh/1.5,2.3*sc,gm); g.add(body);
  if(lvl>=2&&!gm){ const n=Math.min(4,lvl-1); for(let i=0;i<n;i++){ const a=Math.PI/4+i*Math.PI/2; const f=artProp('flag_'+kc,2.4,2.4,2.4); if(f){ f.position.set(Math.cos(a)*1.0*sc,Hh-0.05,Math.sin(a)*1.0*sc); f.rotation.y=-a; g.add(f); } } }
  if(lvl>=7){ const ring=mesh(G.cyl,gm||M.gold,1.18*sc,0.16,1.18*sc,false); ring.position.y=Hh-0.35; g.add(ring); }
  if(kind==='a'){ const n=isC?2:1; for(let i=0;i<n;i++){ const ar=makeGuy('archerT'); ar.g.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); ar.g.position.set(isC?(i?0.6:-0.6):0,Hh,0); ar.g.scale.setScalar(0.85); if(gm){ ar.g.traverse(o=>{ if(o.isMesh) o.material=gm; }); } g.add(ar.g); archers.push(ar); } top=new THREE.Vector3(0,Hh+1.4,0); }
  else { const base=mesh(G.box,gm||M.iron,1.0,0.5,1.2); base.position.y=Hh+0.25; const barrel=new THREE.Group(); barrel.position.y=Hh+0.6; const tube=mesh(G.cyl,gm||M.iron,0.28+0.02*lvl,1.6+0.05*lvl,0.28+0.02*lvl); tube.rotation.x=Math.PI/2; tube.position.z=0.5; const rim=mesh(G.cyl,gm||(lvl>=7?M.gold:M.metal),0.34+0.02*lvl,0.2,0.34+0.02*lvl,false); rim.rotation.x=Math.PI/2; rim.position.z=1.25; barrel.add(tube,rim); for(const x of [-0.55,0.55]){ const w=mesh(G.cyl,gm||M.woodDark,0.4,0.14,0.4,false); w.rotation.z=Math.PI/2; w.position.set(x,Hh+0.3,0); g.add(w); } g.add(base,barrel); archers.push({barrel,g:barrel,aim:false}); top=new THREE.Vector3(0,Hh+0.9,0); }
  return {g,archers,top}; }
/* üs binaları KayKit modelleriyle giydirilir (eski çizim gizlenir; yığınlar, tezgâh dizisi gibi işlevli parçalar kalır); renk haritaya göre */
function artDressBase(){ if(!artOk()||!ART.glb.bld) return; const kc=artKC();
  const D0=[[depot,'building_lumbermill_'+kc,2.5,Math.PI,[0,0,-1.05]],[stall,'building_market_'+kc,2.45,Math.PI,[0,0,-0.2]],[camp,'building_barracks_'+kc,2.3,-Math.PI*0.75,[0,0,0]]];
  for(const [grp,name,s,ry,p] of D0){ if(!grp) continue; if(grp.userData.dress){ grp.remove(grp.userData.dress); } else { for(const c of grp.children) if(!c.isInstancedMesh&&!c.isSprite) c.visible=false; } const m=artProp(name,s); if(!m) continue; m.rotation.y=ry; m.position.set(p[0],p[1],p[2]); grp.add(m); grp.userData.dress=m; } }
