// ---------- chapter screens: intro card, chapter-complete results (stars + coin shower), chapter map, transitions ----------
const CH_ICONS = {
  maple: ICONS_LATE('house'),
  school: '<svg viewBox="0 0 40 40"><rect x="5" y="12" width="30" height="16" rx="4" fill="#ffc21a" stroke="#d69a00" stroke-width="1.5"/><rect x="9" y="15" width="6" height="5" rx="1" fill="#bfe1f5"/><rect x="17" y="15" width="6" height="5" rx="1" fill="#bfe1f5"/><rect x="25" y="15" width="6" height="5" rx="1" fill="#bfe1f5"/><rect x="5" y="22" width="30" height="2" fill="#2b3a55"/><circle cx="12" cy="29" r="3.4" fill="#2c3138"/><circle cx="28" cy="29" r="3.4" fill="#2c3138"/></svg>',
  market: '<svg viewBox="0 0 40 40"><path d="M5 16l4-8h22l4 8z" fill="#e5483c"/><path d="M5 16h30v3q-3.75 3-7.5 0-3.75 3-7.5 0-3.75 3-7.5 0-3.75 3-7.5 0z" fill="#fff"/><rect x="8" y="19" width="24" height="14" fill="#b07a46"/><rect x="12" y="22" width="16" height="7" fill="#ffd34d"/><circle cx="20" cy="6" r="2.4" fill="#ffc23d"/></svg>',
  lake: '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="26" rx="16" ry="8" fill="#9fd8ff" stroke="#5aa9f5" stroke-width="1.6"/><path d="M13 12h8v7h4l2 3H11v-3h2z" fill="#e5483c"/><path d="M10 24h18" stroke="#8a95a3" stroke-width="2" stroke-linecap="round"/><path d="M14 30q6 2 12 0" stroke="#fff" stroke-width="1.6" fill="none"/></svg>',
  resort: '<svg viewBox="0 0 40 40"><path d="M3 34L16 10l7 12 4-6 10 18z" fill="#eaf4ff" stroke="#9fb8d6" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 10l-4 8 4-2 3 3z" fill="#fff"/><path d="M8 34l8-14" stroke="#e5483c" stroke-width="1.6" stroke-dasharray="2 2"/><circle cx="29" cy="9" r="3.2" fill="#ffc23d"/></svg>',
};
function ICONS_LATE(k) { return '<svg viewBox="0 0 40 40"><path d="M6 19L20 7l14 12" fill="#fff" stroke="#c8323c" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="18" width="20" height="15" fill="#e7b27a"/><rect x="17" y="24" width="6" height="9" fill="#c8323c"/><rect x="12" y="21" width="4" height="4" fill="#ffd34d"/></svg>'; }
const STAR_SVG = (on) => `<svg viewBox="0 0 40 40"><path d="M20 3.5l5.1 10.4 11.4 1.6-8.3 8 2 11.3L20 29.4l-10.2 5.4 2-11.3-8.3-8 11.4-1.6z" fill="${on ? '#ffc23d' : '#d5dde8'}" stroke="${on ? '#e08a00' : '#b5c0cf'}" stroke-width="2.4" stroke-linejoin="round"/>${on ? '<path d="M14 14l3-1" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' : ''}</svg>`;
const CHUI = {
  open: null,
  init() {
    const b = $('btnMap'); if (b) { b.innerHTML = '<svg viewBox="0 0 40 40"><path d="M6 10l9-4 10 4 9-4v24l-9 4-10-4-9 4z" fill="#fff" stroke="#2b3a55" stroke-width="2.6" stroke-linejoin="round"/><path d="M15 6v24M25 10v24" stroke="#2b3a55" stroke-width="2.2"/><circle cx="20" cy="17" r="3" fill="#e5483c"/></svg>'; b.onpointerdown = (e) => { e.stopPropagation(); AUD.init(); AUD.click(); this.map(); }; }
  },
  _show(id, html) {
    const el = $(id); el.innerHTML = html; el.classList.add('on'); this.open = id; INPUT.block = true;
    return el;
  },
  close(id) { const el = $(id); if (el) el.classList.remove('on'); if (this.open === id) this.open = null; INPUT.block = !!this.open; if (id === 'chRes' && CAM.show) CAM.show.out = true; },
  // chapter start card (shown over the fly-in)
  intro() {
    const C = CH;
    const el = this._show('chIntro', `<div class="chwrap"><div class="chnum">CHAPTER ${C.id}</div><div class="chname">${C.name}</div><div class="chtag">${C.tag}</div>
      <div class="chcard"><div class="chico">${CH_ICONS[C.key] || ''}</div><p>${C.intro}</p>${C.twist ? `<div class="chtwist">${C.twist}</div>` : ''}</div>
      <button class="chgo" id="chGo">LET'S GO!</button></div>`);
    $('chGo').onpointerdown = (e) => { e.stopPropagation(); AUD.init(); AUD.click(); this.close('chIntro'); CAM.intro = Math.min(CAM.intro, 0.35); if (CH.firstHint) setTimeout(() => UI.hint(CH.firstHint, 5), 600); if (CH.onStart) CH.onStart(); };
    AUD.init && AUD.chapterIn && AUD.chapterIn();
  },
  // the big "chapter complete" moment
  results() {
    const C = CH, st = GAME.lastStars || 1, rec = GAME.chapters[C.id] || {}, next = chapterById(C.id + 1);
    const bonus = niceNum((C.reward || 2000) * st);
    const mm = Math.floor(GAME.time / 60), ss = String(Math.floor(GAME.time % 60)).padStart(2, '0');
    const nextHtml = next ? `<div class="chnext"><div class="chico sm">${CH_ICONS[next.key] || ''}</div><div><b>Next: ${next.name}</b><span>${next.tag}</span></div></div>`
      : `<div class="chnext"><div><b>More chapters are on the way!</b><span>Keep plowing the storms for coins</span></div></div>`;
    const el = this._show('chRes', `<div class="rays"></div><div class="chwrap"><div class="chnum">CHAPTER ${C.id}</div><div class="chname">COMPLETE!</div>
      <div class="stars">${[0, 1, 2].map(i => `<div class="st st${i}" id="st${i}">${STAR_SVG(false)}</div>`).join('')}</div>
      <div class="chcard res"><div class="rrow"><span>Time</span><b>${mm}:${ss}</b></div><div class="rrow"><span>Bonus</span><b class="gold" id="resBonus">+0</b></div>${GAME.lastNew && rec.stars > 1 ? '<div class="newbest">NEW BEST!</div>' : ''}${nextHtml}</div>
      ${next ? '<button class="chgo" id="chNext">NEXT CHAPTER</button>' : ''}<button class="chlink" id="chStay">${next ? 'Stay here and plow the storms' : 'Keep playing'}</button></div>`);
    // stars pop in one by one, then the bonus coins shower into your counter
    for (let i = 0; i < 3; i++) setTimeout(() => {
      const s = $('st' + i); if (!s) return;
      s.innerHTML = STAR_SVG(i < st); s.classList.add('pop'); if (i < st) { AUD.star && AUD.star(i); }
    }, 500 + i * 420);
    setTimeout(() => {
      GAME.earn(bonus); UI.pending += bonus;
      const n = 24; for (let i = 0; i < n; i++) setTimeout(() => UI.flyCoin(null, bonus / n), i * 40);
      let t = 0; const lab = $('resBonus'); const iv = setInterval(() => { t += 0.06; if (!lab) return clearInterval(iv); lab.textContent = '+' + fmt(Math.round(bonus * Math.min(1, t))); if (t >= 1) clearInterval(iv); }, 30);
      AUD.bigWin && AUD.bigWin(); GAME.save();
    }, 500 + 3 * 420 + 200);
    if (next) $('chNext').onpointerdown = (e) => { e.stopPropagation(); AUD.click(); this.go(next.id); };
    $('chStay').onpointerdown = (e) => { e.stopPropagation(); AUD.click(); this.close('chRes'); UI.toast(next ? 'Tap the map any time to start the next chapter' : 'Snowstorms keep coming: plow them for coins!'); };
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
    const el = this._show('chMap', `<div class="chwrap map"><div class="chname sm">CHAPTERS</div><div class="chlist">${rows}</div><button class="chlink" id="chMapX">Close</button></div>`);
    el.querySelectorAll('.chrow[data-id]').forEach(r => r.onpointerdown = (e) => {
      e.stopPropagation(); const id = +r.dataset.id; if (r.classList.contains('locked')) { AUD.deny(); return; }
      if (id === CH.id) { this.close('chMap'); return; }
      AUD.click(); this.go(id);
    });
    $('chMapX').onpointerdown = (e) => { e.stopPropagation(); this.close('chMap'); };
  },
  // snowy wipe to another chapter
  go(id) {
    const f = $('chFade'), C = chapterById(id);
    f.innerHTML = `<div class="chname sm">Chapter ${id}</div><div class="chname">${C ? C.name : ''}</div>`;
    f.classList.add('on');
    GAME.goChapter(id);
    setTimeout(() => { const q = new URLSearchParams(location.search); q.delete('ch'); q.delete('fresh'); const s = q.toString(); location.href = location.pathname + (s ? '?' + s : ''); }, 700);
  }
};
