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
// chapters 6-9: their own set, plus the bigger machines (a machine's model rides in its chapter and every later one)
const M6 = { 26063: 'tug' }, M7 = Object.assign({ 22391: 'tvtruck' }, M6), M8 = Object.assign({ 38210: 'firetruck' }, M7), M9 = Object.assign({ 18775: 'rsleigh', '18777s': 'reindeer' }, M8);
PACKS.ch6 = Object.assign({
  '32591f': 'plane_a', '32588f': 'plane_b', '32589f': 'bizjet', 26087: 'tower', 26088: 'hangar', 26073: 'jetbridge', 26062: 'bagtug', 26059: 'bagcart', 26069: 'bowser', 26066: 'catering',
  26074: 'apronbus', 26075: 'deicer', 26082: 'apronlight', 26081: 'blastfence', 26079: 'twysign', 26085: 'cones', 32827: 'windsock', 26090: 'crewbldg', 26089: 'gse', 32832: 'abeacon', 19694: 'snowbank',
}, M6);
PACKS.ch7 = Object.assign({
  19104: 'standbay', 19107: 'standroof', 22365: 'stairtower', 22348: 'pressbox', 22359: 'videocube', 19133: 'scoreboard2', 19134: 'stadlight', 22354: 'gateway2', 19137: 'turnstile',
  19135: 'ticketbooth', 19136: 'kiosk2', 19087: 'goal', 19077: 'cornerflag', 19091: 'ball', 19694: 'snowbank',
}, M7);
PACKS.ch8 = Object.assign({
  38181: 'stage1', 38182: 'interstage', 38183: 'stage2', 38184: 'fairing', 38185: 'engines', 38189: 'crawler', 38170: 'gantrybase', 38171: 'gantry', 38172: 'gantrytop', 38175: 'crewarm',
  38169: 'watertower', 38177: 'lmast', 38192: 'sphere', 38193: 'cyltank', 38194: 'vent', 38201: 'camtower', 38202: 'padlight', 38208: 'office', 38209: 'crewvan', 38212: 'warnsign',
  38166: 'blastpanel', 33552: 'bleacher', 19694: 'snowbank',
}, M8);
PACKS.ch9 = Object.assign({
  '18691s': 'workshop', 18693: 'postoffice', '18692s': 'bakery2', '18705s': 'bigfir', 18774: 'santa', '25420s': 'candycane', 25417: 'giftstack', 25426: 'polesign', 25429: 'nutcracker',
  25425: 'giftstall', '18719s': 'lightarch', '18731s': 'xlamp', 18764: 'gbhouse', 18779: 'giftsack', '18695s': 'elfhouse', 18773: 'letterbox', 19694: 'snowbank',
}, M9);
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
