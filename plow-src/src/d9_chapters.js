// ---------- chapters: every chapter is a new place with its own twist; machines, crew and coins carry over ----------
let CH = null, GOALS = [], HAND_AREAS = [];
const CHAPTERS = [CH_MAPLE, CH_SCHOOL, CH_MARKET, CH_LAKE, CH_RESORT];
function pickChapter(id) {
  CH = CHAPTERS.find(c => c.id === id) || CHAPTERS[0];
  GOALS = CH.goals; HAND_AREAS = CH.hand || [];
  return CH;
}
function chapterById(id) { return CHAPTERS.find(c => c.id === id) || null; }
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
