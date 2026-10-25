// Build the game's model packs: town.glb (always loaded: chapter 1 + every machine) and one pack per chapter.
// node tools/pack.js            -> writes named/<pack>/<key>.glb, then merges + meshopt + gzip into dist/assets/<pack>.glb(.gz)
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = '/home/claude/plow';
const PACKS = {
  town: {
    21825: 'cabin', 25422: 'cottage_red', 19774: 'cottage_ginger', 19780: 'chalet', 19682: 'chalet_blue', 18688: 'chalet_xmas', 19781: 'sauna', 19684: 'bakery', 19785: 'guesthouse', 25997: 'kiosk', 25994: 'hut', 21829: 'cocoa',
    26009: 'blower', 37654: 'pickup', 27359: 'blade', 35645: 'car_blue', 35644: 'car_white', 35347: 'camper', 34281: 'icecream', 26004: 'groomer',
    21828: 'fir_a', 21832: 'spruce_s', 25416: 'fir_b', 19751: 'fir_c', 21831: 'birch', 21830: 'boulder', 21835: 'rail_fence', 19771: 'picket', 25423: 'fence_red', 21838: 'lamp_a', 19762: 'lamp_b', 21839: 'bench_a', 25427: 'mailbox', 21841: 'postbox', 21842: 'sled', 21844: 'snowman_a', 25419: 'snowman_b', 26022: 'shovel', 21846: 'shovel_b', 21849: 'saltbin', 35974: 'cone', 25414: 'xmastree', 21848: 'birdfeeder', 26034: 'firepit_b', 21845: 'firepit', 26019: 'toboggan', 26021: 'tube', 21843: 'trailsign', 25979: 'slowsign', 19772: 'garland', 13965: 'tipper', 25415: 'gift',
    33705: 'resurfacer', '25435#000-santa-sleigh': 'sleigh',
  },
  ch2: { 24787: 'school', 34199: 'bus', 34221: 'shelter', 34220: 'stoppole', 34229: 'trafficlight', 35376: 'swings', 35377: 'slide', 26001: 'canopy', 25999: 'flagpost', 25988: 'lodge', 19694: 'snowbank' },
  ch3: { 19681: 'clocktower', 19683: 'gateway', 19685: 'toystall', 19687: 'cocoastall', 19686: 'bandstand', 19688: 'bigtree', 19696: 'lantern2', 19711: 'festoon', 19726: 'brazier', 19729: 'train', 19779: 'market', 25435: 'sleighstop', 19758: 'bell', 19694: 'snowbank' },
  ch4: { 22404: 'rowboat', 19552: 'boathouse', 33698: 'hockeygoal', 33552: 'bleacher', 33549: 'floodlight', 33696: 'board', 33699: 'boardcorner', 33704: 'scoreboard', 21029: 'snowarch', 19694: 'snowbank', 19711: 'festoon' },
  ch5: { 25946: 'lifttower', 25954: 'chair', 25956: 'liftbottom', 25958: 'lifttop', 25964: 'windfence', 25977: 'gatered', 25978: 'gateblue', 25981: 'pistepole', 25987: 'finisharch', 25988: 'lodge', 25989: 'snowgun', 25990: 'lodgewing', 25991: 'rental', 25992: 'ticket', 25993: 'restaurant', 25995: 'patrol', 26005: 'snowmobile', 26007: 'shuttle', 26013: 'skis', 26017: 'skirack', 26027: 'slopebench', 26029: 'deckchair', 33552: 'bleacher', 33704: 'scoreboard', 33549: 'floodlight', 26001: 'canopy' },
};
const only = process.argv[2] ? process.argv[2].split(',') : Object.keys(PACKS);
(async () => {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  for (const pack of only) {
    const dir = path.join(ROOT, 'named', pack); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const files = [];
    for (const [src, key] of Object.entries(PACKS[pack])) {
      const [id, sub] = String(src).split('#');
      const doc = await io.read(path.join(ROOT, 'raw', id + '.glb'));
      const sc = doc.getRoot().listScenes()[0];
      if (sub) {
        // keep just one named sub-tree of the scene (e.g. the sleigh out of a scene with a snowman and a tree)
        let keep = null;
        const walk = (n) => { if (n.getName() === sub) keep = n; n.listChildren().forEach(walk); };
        sc.listChildren().forEach(walk);
        if (!keep) throw new Error('no node ' + sub + ' in ' + id);
        for (const c of sc.listChildren()) sc.removeChild(c);
        const p = keep.getParentNode && keep.getParentNode(); if (p) p.removeChild(keep);
        keep.setRotation([0, 0, 0, 1]).setTranslation([0, 0, 0]);
        sc.addChild(keep);
      }
      sc.setName(key);
      const out = path.join(dir, key + '.glb'); await io.write(out, doc); files.push(out);
    }
    const raw = path.join(ROOT, 'opt', pack + '_raw.glb'), dst = path.join(ROOT, 'dist', 'assets', pack + '.glb');
    execSync(`gltf-transform merge ${files.join(' ')} ${raw}`, { stdio: 'pipe' });
    execSync(`gltf-transform prune ${raw} ${raw}`, { stdio: 'pipe' });
    execSync(`gltf-transform meshopt ${raw} ${dst}`, { stdio: 'pipe' });
    execSync(`gzip -9 -k -f ${dst}`);
    console.log(pack, files.length, 'models', (fs.statSync(dst).size / 1024).toFixed(0) + 'KB', (fs.statSync(dst + '.gz').size / 1024).toFixed(0) + 'KB gz');
  }
})().catch(e => { console.error(e); process.exit(1); });
