// ---------- chapters: every chapter is a new place with its own twist; machines, crew and coins carry over ----------
let CH = null, GOALS = [], HAND_AREAS = [];
const CHAPTERS = [CH_MAPLE, CH_SCHOOL, CH_MARKET, CH_LAKE, CH_RESORT, CH_AIRPORT, CH_STADIUM, CH_ROCKET, CH_POLE];
function pickChapter(id) {
  CH = CHAPTERS.find(c => c.id === id) || CHAPTERS[0];
  GOALS = CH.goals; HAND_AREAS = CH.hand || [];
  return CH;
}
function chapterById(id) { return CHAPTERS.find(c => c.id === id) || null; }
// bot routing for towns with several open zones: the next point to drive to, toward the zone of the target
// (adj: { zone: { neighbour: () => [x, z] } }, a breadth-first hop through the zone graph)
function zoneHop(adj, zp, zt, px, pz, tz) {
  if (zp === zt) return null;
  const prev = { [zp]: null }, q = [zp];
  while (q.length) { const z = q.shift(); if (z === zt) break; for (const n in adj[z] || {}) if (!(n in prev)) { prev[n] = z; q.push(n); } }
  if (!(zt in prev)) return null;
  let n = zt; while (prev[n] !== zp) n = prev[n];
  return adj[zp][n](px, pz, tz);
}
// a vehicle parked for good inside a job (a service truck, a rig on its pad): the snow hugging it does not count
// toward the job, like the parked cars on Maple Lane (nobody has to scrape round its wheels)
function parkedVehicle(o) { o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); WORLD.cars.push({ obj: o, state: 'decor', fx0: bb.min.x, fz0: bb.min.z, fx1: bb.max.x, fz1: bb.max.z, x: (bb.min.x + bb.max.x) / 2, z: (bb.min.z + bb.max.z) / 2 }); }
// a group of many little meshes that always move together (a building made of boxes, the rocket on its crawler):
// bake them into one mesh per material, so it costs a few draw calls instead of dozens (untextured parts only)
function mergeGroup(grp) {
  grp.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(), by = new Map(), kill = [];
  grp.traverse(o => {
    if (!o.isMesh || !o.geometry.attributes.normal || (o.material && o.material.map)) return;
    // (parts of different models that look the same share one mesh)
    const M = o.material, m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), k = [M.type, M.color && M.color.getHex(), M.emissive && M.emissive.getHex(), (M.emissiveIntensity || 0).toFixed(2), (M.roughness || 0).toFixed(2), (M.metalness || 0).toFixed(2), M.opacity, M.transparent, M.flatShading, M.vertexColors, M.side].join('|');
    if (!by.has(k)) by.set(k, { mat: o.material, list: [] }); by.get(k).list.push(bakeGeom(o.geometry, m)); kill.push(o);
  });
  for (const o of kill) o.parent.remove(o);
  for (const { mat, list } of by.values()) { const me = new THREE.Mesh(mergeGeoms(list), mat); me.castShadow = true; me.receiveShadow = true; grp.add(me); }
  return grp;
}
// generic helpers shared by chapter builders
function litMats(obj) {
  // swap glowing window materials for dark ones that light up when the job is done
  const wins = [];
  obj.traverse(c => {
    if (!c.isMesh) return;
    const m = c.material;
    if (m && m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.1) {
      const nm = m.clone(); nm.userData = {}; xray(nm); nm.userData.lit = { color: m.color.clone(), emissive: m.emissive.clone() };
      nm.color.setRGB(0.16, 0.2, 0.27); nm.emissive.setRGB(0, 0, 0); nm.emissiveIntensity = 0; c.material = nm; wins.push(nm);
    }
  });
  return wins;
}
// a building that lights up (windows) when its job is done: { obj, wins, lit, litT, door }
// (paved: it stands on paved ground or ice, which must turn solid under it too, or machines drive through it)
function litBuilding(key, x, z, rot, s, door, solidPad, paved) {
  const o = place(key, x, z, rot, s, 0); WORLD.scene.add(o);
  if (solidPad !== false) solidUnder(o, solidPad === undefined ? 0.12 : solidPad, !!paved);
  const B = { obj: o, wins: litMats(o), lit: 0, litT: 0, door: door || new V3(x, 0, z), smoke: null, x, z };
  WORLD.houses.push(B);
  return B;
}

// make a model's glowing parts (lamps, bulbs) shine brighter (shared materials: affects every copy)
function glowUp(key, mult) { artScene(key).traverse(c => { if (c.isMesh && c.material.emissive && (c.material.emissive.r + c.material.emissive.g + c.material.emissive.b) > 0.1 && !c.material.userData.glowUp) { c.material.userData.glowUp = 1; c.material.emissiveIntensity = (c.material.emissiveIntensity || 1) * mult; } }); }
// a soft additive light halo (lamps at dusk); flickers a little
function addGlow(x, y, z, size, color, flick) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.dot, color: color || 0xffc070, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.55 }));
  m.position.set(x, y, z); m.scale.setScalar(size || 2); m.renderOrder = 4; WORLD.scene.add(m);
  WORLD.glows = WORLD.glows || []; WORLD.glows.push({ m, s: size || 2, f: flick || 0, ph: Math.random() * TAU });
  return m;
}
