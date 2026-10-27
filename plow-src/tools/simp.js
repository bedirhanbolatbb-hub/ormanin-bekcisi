// Make a heavy low-poly model light: drop the normals (flat shading is computed by the material instead),
// weld the corners that were split for them, then simplify much further than the split mesh allows.
// NODE_PATH=<gltf-transform cli node_modules> node tools/simp.js in.glb out.glb [ratio] [error]
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { weld, simplify, prune, dedup } = require('@gltf-transform/functions');
const { MeshoptSimplifier } = require('meshoptimizer');
(async () => {
  const [inp, out, ratio = '0.15', error = '0.01'] = process.argv.slice(2);
  await MeshoptSimplifier.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(inp);
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
    const n = p.getAttribute('NORMAL'); if (n) { p.setAttribute('NORMAL', null); }
    for (const s of p.listSemantics()) if (s.startsWith('TEXCOORD') || s.startsWith('TANGENT')) p.setAttribute(s, null);
  }
  await doc.transform(weld({ tolerance: 0.0001 }), simplify({ simplifier: MeshoptSimplifier, ratio: +ratio, error: +error, lockBorder: false }), dedup(), prune());
  await io.write(out, doc);
})().catch(e => { console.error(e); process.exit(1); });
