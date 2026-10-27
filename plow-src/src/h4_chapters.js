// ---------- chapter screens: intro card, chapter-complete results (stars + coin shower), chapter map, transitions ----------
const CH_ICONS = {
  maple: ICONS_LATE('house'),
  school: '<svg viewBox="0 0 40 40"><rect x="5" y="12" width="30" height="16" rx="4" fill="#ffc21a" stroke="#d69a00" stroke-width="1.5"/><rect x="9" y="15" width="6" height="5" rx="1" fill="#bfe1f5"/><rect x="17" y="15" width="6" height="5" rx="1" fill="#bfe1f5"/><rect x="25" y="15" width="6" height="5" rx="1" fill="#bfe1f5"/><rect x="5" y="22" width="30" height="2" fill="#2b3a55"/><circle cx="12" cy="29" r="3.4" fill="#2c3138"/><circle cx="28" cy="29" r="3.4" fill="#2c3138"/></svg>',
  market: '<svg viewBox="0 0 40 40"><path d="M5 16l4-8h22l4 8z" fill="#e5483c"/><path d="M5 16h30v3q-3.75 3-7.5 0-3.75 3-7.5 0-3.75 3-7.5 0-3.75 3-7.5 0z" fill="#fff"/><rect x="8" y="19" width="24" height="14" fill="#b07a46"/><rect x="12" y="22" width="16" height="7" fill="#ffd34d"/><circle cx="20" cy="6" r="2.4" fill="#ffc23d"/></svg>',
  lake: '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="26" rx="16" ry="8" fill="#9fd8ff" stroke="#5aa9f5" stroke-width="1.6"/><path d="M13 12h8v7h4l2 3H11v-3h2z" fill="#e5483c"/><path d="M10 24h18" stroke="#8a95a3" stroke-width="2" stroke-linecap="round"/><path d="M14 30q6 2 12 0" stroke="#fff" stroke-width="1.6" fill="none"/></svg>',
  resort: '<svg viewBox="0 0 40 40"><path d="M3 34L16 10l7 12 4-6 10 18z" fill="#eaf4ff" stroke="#9fb8d6" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 10l-4 8 4-2 3 3z" fill="#fff"/><path d="M8 34l8-14" stroke="#e5483c" stroke-width="1.6" stroke-dasharray="2 2"/><circle cx="29" cy="9" r="3.2" fill="#ffc23d"/></svg>',
  airport: '<svg viewBox="0 0 40 40"><path d="M4 36L14 24h12l10 12z" fill="#4a5059"/><path d="M20 26v3M20 31v4" stroke="#fff" stroke-width="1.6"/><path d="M8 13l9 2 6-7q2-2 3.5-.5t-.5 3.5l-6 6 2 9-2 1.5-4.5-7-5 4v3l-1.5 1-1.5-4-4-1.5 1-1.5h3l4-5-7-4.5z" fill="#fff" stroke="#2b3a55" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  stadium: '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="24" rx="17" ry="10" fill="#9aa3ad"/><ellipse cx="20" cy="24" rx="12" ry="6.5" fill="#3fae5c"/><path d="M20 17.5v13M8 24h24" stroke="#fff" stroke-width="1.2"/><circle cx="20" cy="24" r="2.4" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M5 10v8M35 10v8" stroke="#2b3a55" stroke-width="1.8"/><rect x="2.5" y="7" width="5" height="3" rx="1" fill="#ffe27a"/><rect x="32.5" y="7" width="5" height="3" rx="1" fill="#ffe27a"/></svg>',
  rocket: '<svg viewBox="0 0 40 40"><path d="M20 3q6 6 6 17v10h-12V20Q14 9 20 3z" fill="#f2f2ee" stroke="#2b3a55" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 22l-5 6v4l5-2zM26 22l5 6v4l-5-2z" fill="#e5483c" stroke="#2b3a55" stroke-width="1.5" stroke-linejoin="round"/><circle cx="20" cy="15" r="2.6" fill="#5aa9f5"/><path d="M17 30l3 8 3-8z" fill="#ffb020"/><path d="M4 38h32" stroke="#9aa3ad" stroke-width="3" stroke-linecap="round"/></svg>',
  pole: '<svg viewBox="0 0 40 40"><path d="M18 8h4v28h-4z" fill="#fff"/><path d="M18 11l4-3M18 17l4-3M18 23l4-3M18 29l4-3M18 35l4-3" stroke="#e5483c" stroke-width="2.4"/><circle cx="20" cy="6" r="3.4" fill="#ffd34d"/><path d="M23 13h12l-3 3 3 3H23z" fill="#2fa06a"/><rect x="4" y="27" width="11" height="9" rx="1" fill="#e5483c"/><path d="M9.5 27v9M4 31h11" stroke="#ffd34d" stroke-width="1.8"/></svg>',
};
function ICONS_LATE(k) { return '<svg viewBox="0 0 40 40"><path d="M6 19L20 7l14 12" fill="#fff" stroke="#c8323c" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="18" width="20" height="15" fill="#e7b27a"/><rect x="17" y="24" width="6" height="9" fill="#c8323c"/><rect x="12" y="21" width="4" height="4" fill="#ffd34d"/></svg>'; }
const STAR_SVG = (on) => `<svg viewBox="0 0 40 40"><path d="M20 3.5l5.1 10.4 11.4 1.6-8.3 8 2 11.3L20 29.4l-10.2 5.4 2-11.3-8.3-8 11.4-1.6z" fill="${on ? '#ffc23d' : '#d5dde8'}" stroke="${on ? '#e08a00' : '#b5c0cf'}" stroke-width="2.4" stroke-linejoin="round"/>${on ? '<path d="M14 14l3-1" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' : ''}</svg>`;
const CHUI = {
  open: null,
  init() {
    addEventListener('resize', () => this.refit());
    const b = $('btnMap'); if (b) { b.innerHTML = '<svg viewBox="0 0 40 40"><path d="M6 10l9-4 10 4 9-4v24l-9 4-10-4-9 4z" fill="#fff" stroke="#2b3a55" stroke-width="2.6" stroke-linejoin="round"/><path d="M15 6v24M25 10v24" stroke="#2b3a55" stroke-width="2.2"/><circle cx="20" cy="17" r="3" fill="#e5483c"/></svg>'; b.onpointerdown = (e) => { e.stopPropagation(); AUD.init(); AUD.click(); this.map(); }; }
    // the NEXT CHAPTER button in the goal bar (shows once the chapter is done)
    const n = $('goalNext'); if (n) n.onpointerdown = (e) => { e.stopPropagation(); AUD.init(); const nx = chapterById(CH.id + 1); if (!nx || !GAME.ended || GAME.finishT > 0 || this.open) return; AUD.click(); this.go(nx.id); };
  },
  // the big cards always fit the screen (phones on their side, small game frames): shrink the whole card when needed
  fit(el, room) {
    const w = el && el.querySelector('.chwrap'); if (!w) return;
    w.style.maxHeight = 'none'; w.style.transform = '';
    const k = Math.min(1, innerHeight * (room || 0.96) / Math.max(1, w.offsetHeight));
    if (k < 1) w.style.transform = `scale(${k.toFixed(3)})`;
  },
  refit() { if (this.introUp) this.fit($('chIntro'), 0.9); if (this.open === 'chRes') this.fit($('chRes')); },
  _show(id, html) {
    const el = $(id); el.innerHTML = html; el.classList.add('on'); this.open = id; INPUT.block = true;
    return el;
  },
  close(id) { const el = $(id); if (el) el.classList.remove('on'); if (this.open === id) this.open = null; INPUT.block = !!this.open; if (id === 'chRes' && CAM.show) CAM.show.out = true; },
  // a screen is up that should hold the clocks (a full overlay, or the chapter card at the start)
  busy() { return !!this.open || this.introUp; },
  introUp: false,
  // chapter start card over the fly-in. It never stops you: start driving (or wait a moment) and it slides away.
  intro() {
    const C = CH, el = $('chIntro');
    el.innerHTML = `<div class="chwrap"><div class="chnum">CHAPTER ${C.id}</div><div class="chname">${C.name}</div><div class="chtag">${C.tag}</div>
      <div class="chcard"><div class="chico">${CH_ICONS[C.key] || ''}</div><p>${C.intro}</p>${C.twist ? `<div class="chtwist">${C.twist}</div>` : ''}</div>
      <button class="chgo" id="chGo">LET'S GO!</button></div>`;
    el.classList.remove('out'); el.classList.add('on', 'soft'); this.introUp = true; document.body.classList.add('chsoft'); this.fit(el, 0.9);
    // the button starts it, but so does any touch, click or key (see INPUT); a drag from the button drives right away
    $('chGo').onpointerdown = (e) => { e.stopPropagation(); INPUT.start(e); AUD.click(); };
    clearTimeout(this._introT); this._introT = setTimeout(() => this.introGo(false), 4700);
    AUD.init && AUD.chapterIn && AUD.chapterIn();
  },
  introGo(moved) {
    if (!this.introUp) return;
    this.introUp = false; clearTimeout(this._introT); document.body.classList.remove('chsoft');
    const el = $('chIntro'); el.classList.add('out'); setTimeout(() => { if (!this.introUp) el.classList.remove('on', 'soft', 'out'); }, 420);
    CAM.intro = Math.min(CAM.intro, 0.35);
    // only tell them how to move if they have not found out by themselves
    const x0 = PL.x, z0 = PL.z;
    if (CH.firstHint) setTimeout(() => { if (Math.hypot(PL.x - x0, PL.z - z0) < 0.3) UI.hint(CH.firstHint, 5); }, moved ? 1500 : 600);
    if (CH.onStart) CH.onStart();
    if (CH.dailyGift) { const d = CH.dailyGift; CH.dailyGift = 0; setTimeout(() => DAILY.give(d), 1500); }
  },
  // the big "chapter complete" moment
  results() {
    const C = CH, st = GAME.lastStars || 1, rec = GAME.chapters[C.id] || {}, next = chapterById(C.id + 1);
    const bonus = GAME.lastBonus || niceNum((C.reward || 2000) * st);
    const mm = Math.floor(GAME.time / 60), ss = String(Math.floor(GAME.time % 60)).padStart(2, '0');
    const nextHtml = next ? `<div class="chnext"><div class="chico sm">${CH_ICONS[next.key] || ''}</div><div><b>Next: ${next.name}</b><span>${next.tag}</span></div></div>`
      : `<div class="chnext"><div><b>You plowed every town!</b><span>More chapters are on the way. Keep plowing the storms for coins</span></div></div>`;
    const comeBack = '<div class="chback">Come back tomorrow for a daily gift!</div>';
    const el = this._show('chRes', `<div class="rays"></div><div class="chwrap"><div class="chnum">CHAPTER ${C.id}</div><div class="chname">COMPLETE!</div>
      <div class="stars">${[0, 1, 2].map(i => `<div class="st st${i}" id="st${i}">${STAR_SVG(false)}</div>`).join('')}</div>
      <div class="chcard res"><div class="rrow"><span>Time</span><b>${mm}:${ss}</b></div><div class="rrow"><span>Bonus</span><b class="gold" id="resBonus">+0</b></div>${GAME.lastNew && rec.stars > 1 ? '<div class="newbest">NEW BEST!</div>' : ''}${nextHtml}${comeBack}</div>
      ${next ? '<button class="chgo" id="chNext">NEXT CHAPTER</button>' : ''}<button class="chlink" id="chStay">${next ? 'Stay here and plow the storms' : 'Keep playing'}</button></div>`);
    this.fit(el);
    // stars pop in one by one, then the bonus coins shower into your counter
    for (let i = 0; i < 3; i++) setTimeout(() => {
      const s = $('st' + i); if (!s) return;
      s.innerHTML = STAR_SVG(i < st); s.classList.add('pop'); if (i < st) { AUD.star && AUD.star(i); }
    }, 500 + i * 420);
    setTimeout(() => {
      const n = 24; for (let i = 0; i < n; i++) setTimeout(() => UI.flyCoin(null, bonus / n), i * 40);
      let t = 0; const lab = $('resBonus'); const iv = setInterval(() => { t += 0.06; if (!lab) return clearInterval(iv); lab.textContent = '+' + fmt(Math.round(bonus * Math.min(1, t))); if (t >= 1) clearInterval(iv); }, 30);
      AUD.bigWin && AUD.bigWin(); GAME.save();
    }, 500 + 3 * 420 + 200);
    if (next) $('chNext').onpointerdown = (e) => { e.stopPropagation(); AUD.click(); this.go(next.id); };
    $('chStay').onpointerdown = (e) => { e.stopPropagation(); AUD.click(); this.close('chRes'); UI.toast(next ? 'Tap NEXT CHAPTER any time to go on' :'Snowstorms keep coming: plow them for coins!'); };
  },
  // chapter list
  map() {
    const rows = CHAPTERS.map(C => {
      const rec = GAME.chapters[C.id] || {}, prev = GAME.chapters[C.id - 1] || {}, open = C.id === 1 || prev.done || C.id === CH.id;
      const stars = [0, 1, 2].map(i => `<i class="${i < (rec.stars || 0) ? 'on' : ''}">${STAR_SVG(i < (rec.stars || 0))}</i>`).join('');
      return `<div class="chrow ${open ? '' : 'locked'} ${C.id === CH.id ? 'cur' : ''}" data-id="${C.id}"><div class="chico sm">${CH_ICONS[C.key] || ''}</div>
        <div class="chinfo"><b>${C.id}. ${C.name}</b><span>${C.tag}</span><div class="mstars">${stars}</div></div>
        <div class="chbtn">${!open ? '🔒' : C.id === CH.id ? 'HERE' : 'PLAY'}</div></div>`;
    }).join('') + '<div class="chrow soon"><div class="chinfo"><b>More chapters soon</b><span>New places, new machines</span></div></div>';
    const el = this._show('chMap', `<div class="chwrap map"><div class="chname sm">CHAPTERS</div><div class="chlist">${rows}</div><div class="chwarn"></div><button class="chlink" id="chMapX">Close</button></div>`);
    // (a long list: start with the chapter you are in shown in the middle)
    { const L = el.querySelector('.chlist'), cur = el.querySelector('.chrow.cur'); if (L && cur) L.scrollTop = Math.max(0, cur.offsetTop - L.offsetTop - (L.clientHeight - cur.offsetHeight) / 2); }
    // a tap (not a touch that starts scrolling the list) picks a chapter
    el.querySelectorAll('.chrow[data-id]').forEach(r => r.onclick = (e) => {
      e.stopPropagation(); AUD.init(); const id = +r.dataset.id; if (r.classList.contains('locked')) { AUD.deny(); return; }
      if (id === CH.id) { this.close('chMap'); return; }
      // leaving a chapter you are in the middle of means it starts over next time: ask once
      const busy = !GAME.ended && (GAME.time > 20 || Object.keys(GAME.done).length > 0);
      if (busy && !r.classList.contains('sure')) {
        el.querySelectorAll('.chrow.sure').forEach(o => { o.classList.remove('sure'); o.querySelector('.chbtn').textContent = 'PLAY'; });
        r.classList.add('sure'); r.querySelector('.chbtn').textContent = 'SURE?';
        el.querySelector('.chwarn').textContent = 'Chapter ' + CH.id + ' starts over if you leave it now. Tap again to go.';
        AUD.click(); return;
      }
      AUD.click(); this.go(id);
    });
    $('chMapX').onpointerdown = (e) => { e.stopPropagation(); this.close('chMap'); };
  },
  // snowy wipe to another chapter
  go(id) {
    if (this._going) return; this._going = true; CG.play(false);
    const f = $('chFade'), C = chapterById(id);
    f.innerHTML = `<div class="chname sm">Chapter ${id}</div><div class="chname">${C ? C.name : ''}</div>`;
    f.classList.add('on');
    GAME.goChapter(id);
    // a little longer on the snowy wipe, so the account copy is usually sent before the reload too
    // (no storage at all in this browser: the chapter rides along in the address instead)
    setTimeout(() => { const q = new URLSearchParams(location.search); q.delete('ch'); q.delete('fresh'); if (GAME.noStore) q.set('ch', id); const s = q.toString(); location.href = location.pathname + (s ? '?' + s : ''); }, 1400);
  }
};
