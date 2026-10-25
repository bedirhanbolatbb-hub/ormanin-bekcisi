// Build one merged GLB with short scene names (keys) for the game
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const fs=require('fs');
const MAP={21825:'cabin',25422:'cottage_red',19774:'cottage_ginger',19780:'chalet',19682:'chalet_blue',18688:'chalet_xmas',19781:'sauna',19684:'bakery',19785:'guesthouse',25997:'kiosk',25994:'hut',21829:'cocoa',
26009:'blower',37654:'pickup',27359:'blade',35645:'car_blue',35644:'car_white',35347:'camper',34281:'icecream',26004:'groomer',
21828:'fir_a',21832:'spruce_s',25416:'fir_b',19751:'fir_c',21831:'birch',21830:'boulder',21835:'rail_fence',19771:'picket',25423:'fence_red',21838:'lamp_a',19762:'lamp_b',21839:'bench_a',25427:'mailbox',21841:'postbox',21842:'sled',21844:'snowman_a',25419:'snowman_b',26022:'shovel',21846:'shovel_b',21849:'saltbin',35974:'cone',25414:'xmastree',21848:'birdfeeder',26034:'firepit_b',21845:'firepit',26019:'toboggan',26021:'tube',21843:'trailsign',25979:'slowsign',19772:'garland'};
(async()=>{
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
  fs.mkdirSync('/home/claude/plow/named',{recursive:true});
  for(const [id,key] of Object.entries(MAP)){
    const doc=await io.read('/home/claude/plow/raw/'+id+'.glb');
    const sc=doc.getRoot().listScenes();
    sc[0].setName(key);
    await io.write('/home/claude/plow/named/'+key+'.glb',doc);
  }
  console.log('named',Object.keys(MAP).length);
})();
