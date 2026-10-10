# Grovehold Phase 2 — one short map per chapter + Home hub (design, 9 Oct 2026)

Key insight: resetRun(level) (p4) already builds an empty plot (runState() wipe, restoreNature, buildWalls(0), buildGates(0), layoutPads). Today only used for new game; nextSefer() keeps the castle → root of "maxed by ch3 / gold piles".
Phase 2 = replace nextSefer() with startMap(L) = resetRun(L) + applyMap(MAPS[L]); make castle-growing assumptions read per-map config. Keep WAVES=5 (night 1 is a short skirmish).

## 1. Map config (p1 near REG)
MAPS={1:{th:'forest',regs:[],gates:['S','E','W','N'],gp:[1,1,2,2,2],day0:70},
2:{th:'lake',regs:['lake'],gates:['E','N','S','W'],gp:[1,2,2,2,2],day0:60},
3:{th:'meadow',regs:['meadow'],gates:['W','S','N','E'],gp:[1,2,2,3,3]},
4:{th:'quarry',regs:['quarry','lake'],gates:['S','E','W','N'],gp:[2,2,3,3,3]},
5:{th:'river',regs:['river'],gates:['N','W','E','S'],gp:[2,2,3,3,3]},
6:{th:'swamp',regs:['swamp','meadow'],gates:['W','N','S','E'],gp:[2,3,3,3,3]},
7:{th:'iron',regs:['iron','quarry'],gates:['N','E','S','W'],gp:[2,3,3,4,4]},
8:{th:'coast',regs:['coast','lake'],gates:['E','S','N','W'],gp:[2,3,3,4,4]},
9:{th:'snow',regs:['snow'],gates:['S','W','N','E'],gp:[3,3,4,4,4],winter:1},
10:{th:'dark',regs:['dark','iron'],gates:['N','E','W','S'],gp:[3,4,4,4,4]}}  (map 10 gates must start with 'N' for Black King)
(verify region ids against REG keys; adapt names to the real ids.)
- Base stays at origin; world geometry static. Variety via:
  - GORD=MAPS[L].gates; actSides()=GORD.slice(0,sidesActive()); sidesActive() reads MAPS[L].gp instead of GATE_PLAN. Swap SIDES[...] / SIDES.indexOf(t.side)<sidesActive() usages (planWave, scheduleWave, balanceWave, comeStart, spawnOne, sideKinds, towerDef.show, failTip, fogGates; grep "sidesActive()" ~22 sites; gatesBefore()).
  - Theme: only map regions alive: applyMap sets S.revealed={forest:true}+cfg.regs; remove the "reveal all REG with sefer<=level" loops in resetRun/startPlay; syncClouds keeps others under cloud.
  - isWinter() → !!MAPS[S.level]?.winter || S.level%10===9 (endless).
  - paintGround roads only for GORD.slice(0,max(gp)).
  - start position just outside first gate: sidePos(GORD[0],0,2.8).
  - map intro via S.pendingReveal=cfg.regs[0] + runReveal().
- Minute 0: empty clearing, wall=0 palisade, towers lvl0, depot/stall/camp in place, 20+starting gold. Unopened gates render as closed fence (buildGates draws closed leaf for sides not in actSides()). Gate-build pads {id:'gate_'+side,kind:'gate',res:'wood',cost:15} appear when side becomes active; auto-built free at night start if unbuilt. Do NOT make fence segments buildable (routing assumes closed ring).
- Length 8–10 min: day0 60–70 s, later days dayLen() 30 s, night1 skirmish 8–12 enemies, nights 2–4 40–60 s, boss ~90 s.
- Difficulty: replace REF_DPS with REF_MAP[L][n]=REF_DPS[1][n]*(1+0.16*(L-1))*(1+0.05*metaPowerIndex), calibrate in M3; heroScale/nightHp/atkK keyed to map L (re-base atkK gw()).
- Economy reset per map via runState. capOf: towers min(8,4+ceil(L/2)); region pads E[0]+1 (R=L in RSEF); wall 3+(quarry?2:0)+floor(L/3). Royal Tribute show only in endless. Offline gold in map mode → Home chest instead of run payouts.
- Carry over: all S.meta (crowns, upgrades, star masks, unlocked, daily, quests, stats) + book (move book to meta.book). Power cards per map. meta.nextCard from chest carries one card (applyNextCard).

## 2. Win flow
- Stars: 3-bit mask meta.sm[L]: ★ boss defeated; ★ walls never below 50% (S.minGate); ★ no retries/revives (S.retries++ in retryNight & revive). starsFor() → starMask().
- Crowns: first clear +3, +2 per NEW star, +1 per replay win.
- Chest = showBossWheel with meta rewards: +2/+3 crowns, +6 jackpot, head-start card (meta.nextCard), trophy piece meta.troph[L]. Wheel result saved in S.post.k.
- Win card: 3 objective rows with ticks, crowns gained, next map teaser (MAPS[L+1]); buttons Next map → (midgame ad via cgAd stays OFF since ADS off, then startMap(L+1)), Replay, Kingdom. Final map L=10 keeps castleMoment/showEndCard → unlocks Endless (map 11, empty plot, EGR scaling).
- showMap(): tabs Campaign | Home. Campaign nodes = buttons for maps ≤ meta.unlocked; detail: theme, new enemy, boss, 3 objectives, best stars, Play → startMap(L). Continue resumes in-progress map.

## 3. Meta / Home
UPG (5 levels each, UPC=[3,6,10,16,25]):
gold Starting Purse +40 start gold; wall Stone Foundation +8% wall HP; arrow Master Archers +6% tower dmg; bow Royal Bow +12% hero dmg; quiver Quick Quiver +8% fire rate +0.5 range; magnet Lodestone +15% pickup; saddle Saddlebags +10 carry; outpost (3 lv): L1 first gate's 2 towers start Lv1, L2 +1 lumberjack, L3 +1 collector; scout (1 lv, 40 crowns) first day +20 s + route preview.
Home tab (DOM v1): upgrade tree, Royal Chest (fills offline, cap 8 h, ~1 crown/45 min + card token when full), collection book, trophies (3★ maps), streak pips.

## 4. Next-day hooks
Royal Chest timer ("full in 6 h 20 m"); Daily Challenge map (seed=hash(dayKey()), unlocked theme + modifier from [allGates, doubleRams, foggy, noSoldiers, goldRush, nightOnly], reward 5 crowns + daily trophy, shows tomorrow's modifier; S.mode='daily'); streak gift (tmrwHint on first map win of session); quests tiered by meta.unlocked, qRegion = any unlocked map has region, new kinds star/map; next-map teaser.

## 5. Save migration
SAVE_KEY 'ormanin-bekcisi-v9' (never write v8). If no v9 and v8 exists (cloud or local) → migrate8: meta.unlocked=max(meta.unlocked,j.level) cap 11; meta.sm[L]=(1<<stars[L])-1; keep crowns, streak, dailyDate, quests, st, best, calm, snd; meta.book=j.book; refund old gold/wall/arrow upgrades into crowns, up={}, toast "Kingdom rebuilt: +X 👑 refunded"; S.home={towers,lv}; in-progress chapter compensation +2*(wave-1) crowns; level>10 → Endless unlocked.
CRITICAL: saveRank/betterSave and CG.onLate must rank by [meta.unlocked, totalStars, lastSeen] not [level,wave]. Write the test first.

## 6. Milestones
M0 scaffolding (MAPS, S.mode, v9 key, empty migrate8). M1 startMap/applyMap pipeline + resetModuleState (stale module state: tribPos, fixedPadCache, bpCache, lastSides, newGate, winterOn, doomNight, castleFreed, curseSaid, castleHold, fogDayWarn, GS guide state, BN, hutT/hhutT, COME, piles, bossChests, customers, traderNpc) + leak test (startMap ×10 per L; towers/carts/fishers/pads/geometries/textures flat). M2 gate variety (GORD at 22 sites, roads, closed gates, gate pads + autobuild; enemies only from actSides(); occl.js per map). M3 economy/difficulty retune (targets: map 8–12 min; good bot minGate 0.5–0.8 0 fails; mid ≤1 fail; weak fails from map 2; unspent gold at boss < 2× most expensive visible pad; tower cap reached no earlier than night 4). M4 win flow. M5 meta tree/Home/chest. M6 daily challenge/quests/hooks. M7 migration + cloud hardening. (M8 optional 3D home.)
Risks: stale module state; far regions on short clock (free cart/worker, +pony speed); saveRank cloud overwrite; difficulty tables; final map/endless special cases; CrazyGames SDK flow; mobile perf; old players losing castle (refund + copy).
