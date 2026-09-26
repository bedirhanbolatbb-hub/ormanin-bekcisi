
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
