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
