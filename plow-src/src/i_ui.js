// ---------- HUD ----------
const ICONS = {
  coin: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#f5a623"/><circle cx="20" cy="20" r="15" fill="#ffd34d"/><circle cx="20" cy="20" r="11" fill="none" stroke="#f5a623" stroke-width="2.5"/><path d="M20 12v16M13 16l14 8M27 16l-14 8" stroke="#e08a00" stroke-width="2.6" stroke-linecap="round"/></svg>',
  w: '<svg viewBox="0 0 40 40"><rect x="7" y="20" width="26" height="9" rx="3" fill="#ff8a1e"/><path d="M4 14h32M4 14l5-4M4 14l5 4M36 14l-5-4M36 14l-5 4" stroke="#2b3a55" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
  cap: '<svg viewBox="0 0 40 40"><path d="M6 27h26q4 0 4-4" stroke="#7a4a2e" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="7" y="22" width="24" height="5" rx="2" fill="#c8323c"/><path d="M9 22q4-12 11-11t10 11z" fill="#fff" stroke="#b9cde6" stroke-width="2"/></svg>',
  spd: '<svg viewBox="0 0 40 40"><path d="M23 4L9 23h10l-3 13 15-20H21z" fill="#ffc23d" stroke="#e08a00" stroke-width="2" stroke-linejoin="round"/></svg>',
  shovel: '<svg viewBox="0 0 40 40"><path d="M27 6l-9 17" stroke="#b07a46" stroke-width="3.5" stroke-linecap="round"/><path d="M8 24l12 4 3-6-12-4z" fill="#ff8a1e" stroke="#c8650a" stroke-width="2" stroke-linejoin="round"/><circle cx="28" cy="5" r="3" fill="none" stroke="#2c3138" stroke-width="2.5"/></svg>',
  blower: '<svg viewBox="0 0 40 40"><rect x="6" y="18" width="20" height="13" rx="3" fill="#d6302a"/><path d="M21 18V8l6-3" stroke="#d6302a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="12" cy="32" r="4" fill="#2c3138"/><path d="M26 22l9-9" stroke="#8a95a3" stroke-width="3" stroke-linecap="round"/></svg>',
  truck: '<svg viewBox="0 0 40 40"><rect x="10" y="14" width="16" height="12" rx="2" fill="#f2f2ee" stroke="#9aa3ad" stroke-width="1.5"/><rect x="18" y="16" width="7" height="5" fill="#5a6b80"/><rect x="2" y="20" width="9" height="9" rx="1.5" fill="#ffcf3a" stroke="#d69a00" stroke-width="1.5"/><circle cx="15" cy="28" r="3.6" fill="#2c3138"/><circle cx="25" cy="28" r="3.6" fill="#2c3138"/><circle cx="20" cy="12" r="2" fill="#ff9a1a"/><rect x="26" y="20" width="10" height="6" fill="#f2f2ee" stroke="#9aa3ad" stroke-width="1.5"/></svg>',
  groomer: '<svg viewBox="0 0 40 40"><rect x="9" y="13" width="18" height="11" rx="2" fill="#d6302a"/><rect x="18" y="15" width="7" height="5" fill="#9fd0ff"/><rect x="7" y="24" width="24" height="8" rx="4" fill="#2c3138"/><circle cx="11" cy="28" r="2" fill="#8a95a3"/><circle cx="19" cy="28" r="2" fill="#8a95a3"/><circle cx="27" cy="28" r="2" fill="#8a95a3"/><path d="M31 16h6v16h-6z" fill="#ff8a1e"/><circle cx="14" cy="11" r="2" fill="#ffb020"/></svg>',
  house: '<svg viewBox="0 0 40 40"><path d="M6 19L20 7l14 12" fill="#fff" stroke="#c8323c" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="18" width="20" height="15" fill="#e7b27a"/><rect x="17" y="24" width="6" height="9" fill="#c8323c"/><rect x="12" y="21" width="4" height="4" fill="#ffd34d"/></svg>',
  car: '<svg viewBox="0 0 40 40"><path d="M6 25l3-8q1-3 4-3h14q3 0 4 3l3 8v5H6z" fill="#2f7fd6"/><rect x="12" y="16" width="16" height="6" rx="1.5" fill="#bfe1f5"/><circle cx="12" cy="30" r="3.5" fill="#2c3138"/><circle cx="28" cy="30" r="3.5" fill="#2c3138"/><path d="M9 14q11-7 22 0" stroke="#fff" stroke-width="3" fill="none"/></svg>',
  walk: '<svg viewBox="0 0 40 40"><rect x="8" y="5" width="12" height="30" fill="#b9bdc2"/><path d="M8 15h12M8 25h12" stroke="#8a8f95"/><rect x="21" y="5" width="11" height="30" fill="#4a5059"/><path d="M26.5 8v6M26.5 20v6" stroke="#ffd34d" stroke-width="2"/></svg>',
  road: '<svg viewBox="0 0 40 40"><path d="M13 5L5 35h30L27 5z" fill="#4a5059"/><path d="M20 8v5M20 17v6M20 27v6" stroke="#ffd34d" stroke-width="2.5"/></svg>',
  shop: '<svg viewBox="0 0 40 40"><rect x="7" y="16" width="26" height="18" fill="#c8323c"/><path d="M5 16h30l-3-8H8z" fill="#fff" stroke="#c8323c" stroke-width="2"/><rect x="13" y="21" width="14" height="8" fill="#ffd34d"/></svg>',
  tree: '<svg viewBox="0 0 40 40"><path d="M20 4l8 11h-4l7 9h-5l6 8H8l6-8H9l7-9h-4z" fill="#2fa06a"/><circle cx="16" cy="22" r="2" fill="#ffd34d"/><circle cx="24" cy="27" r="2" fill="#ff5a5a"/><circle cx="21" cy="15" r="1.8" fill="#5bc8f5"/><rect x="18" y="32" width="4" height="5" fill="#7a4a2e"/></svg>',
  star: '<svg viewBox="0 0 40 40"><path d="M20 4l4.7 10 10.8 1.2-8 7.3 2.2 10.6L20 27.7l-9.7 5.4 2.2-10.6-8-7.3L15.3 14z" fill="#ffc23d" stroke="#e08a00" stroke-width="2" stroke-linejoin="round"/></svg>',
  snd: '<svg viewBox="0 0 40 40"><path d="M8 16h6l8-7v22l-8-7H8z" fill="#2b3a55"/><path d="M27 14q4 6 0 12M31 10q7 10 0 20" stroke="#2b3a55" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 40 40"><path d="M8 16h6l8-7v22l-8-7H8z" fill="#2b3a55"/><path d="M27 15l9 10M36 15l-9 10" stroke="#c8323c" stroke-width="3" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 40 40"><path d="M20 4l12 14h-7v16h-10V18H8z" fill="#fff" stroke="#2b3a55" stroke-width="2.5" stroke-linejoin="round"/></svg>',
};
ICONS.bigshovel = ICONS.shovel.replace('#ff8a1e', '#2f8cff').replace('#c8650a', '#1f5fb3');
ICONS.megablower = ICONS.blower.replace(/#d6302a/g, '#2f6fe8');
ICONS.dumpplow = ICONS.truck.replace('#f2f2ee', '#f07a12');
ICONS.thrower = '<svg viewBox="0 0 40 40"><rect x="13" y="14" width="18" height="12" rx="2" fill="#c8302a"/><rect x="21" y="16" width="7" height="5" fill="#bfe1f5"/><rect x="3" y="18" width="11" height="11" rx="2" fill="#ff7a1a" stroke="#c8650a" stroke-width="1.5"/><path d="M8 18V9l6-3" stroke="#ff7a1a" stroke-width="3.6" fill="none" stroke-linecap="round"/><circle cx="17" cy="3.5" r="2" fill="#fff"/><circle cx="21" cy="6" r="1.6" fill="#fff"/><circle cx="18" cy="28" r="3.6" fill="#2c3138"/><circle cx="28" cy="28" r="3.6" fill="#2c3138"/></svg>';
ICONS.sleigh = '<svg viewBox="0 0 40 40"><path d="M9 14h20l3 10H12z" fill="#e5483c"/><path d="M12 24h20q2 0 2-3" stroke="#e08a00" stroke-width="2.5" fill="none"/><path d="M6 31h27q4 0 5-5" stroke="#ffc23d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14 24v7M28 24v7" stroke="#ffc23d" stroke-width="2.5"/><rect x="2" y="20" width="8" height="10" rx="1.5" fill="#ffc83a" stroke="#d69a00" stroke-width="1.5"/><path d="M30 6l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#ffd34d"/></svg>';
ICONS.zamboni = '<svg viewBox="0 0 40 40"><rect x="10" y="12" width="20" height="13" rx="3" fill="#3a7bd5"/><rect x="12" y="8" width="16" height="4" rx="1" fill="#ffe066"/><rect x="2" y="21" width="9" height="8" rx="3" fill="#ffc23d" stroke="#e08a00" stroke-width="1.5"/><circle cx="15" cy="28" r="3.6" fill="#2c3138"/><circle cx="26" cy="28" r="3.6" fill="#2c3138"/><path d="M4 34h32" stroke="#9fd8ff" stroke-width="3" stroke-linecap="round"/></svg>';
ICONS.sweeper = '<svg viewBox="0 0 40 40"><rect x="14" y="15" width="17" height="10" rx="2" fill="#ffcf3a" stroke="#d69a00" stroke-width="1.5"/><rect x="22" y="9" width="8" height="7" rx="1" fill="#f2f2ee" stroke="#9aa3ad" stroke-width="1.2"/><rect x="23.5" y="10.5" width="5" height="3.5" fill="#9fd0ff"/><circle cx="8" cy="25" r="6.5" fill="#ffd34d" stroke="#e08a00" stroke-width="1.5"/><path d="M8 18.5v13M1.5 25h13M3.4 20.4l9.2 9.2M12.6 20.4l-9.2 9.2" stroke="#e08a00" stroke-width="1.3"/><circle cx="18" cy="27" r="3.4" fill="#2c3138"/><circle cx="28" cy="27" r="3.4" fill="#2c3138"/><circle cx="26" cy="7" r="1.8" fill="#ff9a1a"/></svg>';
ICONS.melter = '<svg viewBox="0 0 40 40"><rect x="12" y="11" width="22" height="15" rx="2" fill="#f2f2ee" stroke="#9aa3ad" stroke-width="1.5"/><rect x="4" y="18" width="9" height="9" rx="2" fill="#ff7a1a" stroke="#c8650a" stroke-width="1.5"/><rect x="27" y="5" width="4" height="7" fill="#8a95a3"/><circle cx="29" cy="4" r="2.6" fill="#fff" opacity=".9"/><circle cx="33" cy="2.5" r="2" fill="#fff" opacity=".8"/><path d="M16 19h14" stroke="#ff7a1a" stroke-width="2.5"/><circle cx="17" cy="28" r="3.6" fill="#2c3138"/><circle cx="29" cy="28" r="3.6" fill="#2c3138"/></svg>';
ICONS.jet = '<svg viewBox="0 0 40 40"><rect x="16" y="17" width="20" height="10" rx="2" fill="#d8342c"/><rect x="28" y="12" width="7" height="6" rx="1" fill="#f2f2ee"/><rect x="29.5" y="13.5" width="4" height="3" fill="#9fd0ff"/><ellipse cx="13" cy="15" rx="7" ry="4.6" fill="#d9dee5" stroke="#8a95a3" stroke-width="1.4"/><ellipse cx="18.5" cy="15" rx="1.6" ry="4" fill="#2c3138"/><path d="M6 15H1" stroke="#ffa040" stroke-width="4" stroke-linecap="round"/><path d="M5 11l-3-2M5 19l-3 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="29" r="3.4" fill="#2c3138"/><circle cx="31" cy="29" r="3.4" fill="#2c3138"/></svg>';
ICONS.reindeer = '<svg viewBox="0 0 40 40"><path d="M17 22h17l2 7H20z" fill="#e5483c"/><path d="M19 30h18q2 0 2-3" stroke="#ffc23d" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="16" y="21" width="5" height="9" rx="1" fill="#ffc83a" stroke="#d69a00" stroke-width="1.2"/><ellipse cx="9" cy="20" rx="6" ry="3.4" fill="#c8894a"/><path d="M6 22l-1.5 6M12 22l1 6" stroke="#8a5a2e" stroke-width="2" stroke-linecap="round"/><circle cx="3.6" cy="16" r="2.6" fill="#c8894a"/><circle cx="1.6" cy="16.6" r="1.3" fill="#e5483c"/><path d="M4 13l-1-5M4 9l2-2M5 13l2-4" stroke="#8a5a2e" stroke-width="1.4" stroke-linecap="round"/><path d="M24 8l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#ffd34d"/></svg>';
ICONS.plane = '<svg viewBox="0 0 40 40"><path d="M20 3q2.4 0 2.4 4v9l12 7v3.4l-12-3.6v8l4 3v2.8L20 35l-6.4 1.6v-2.8l4-3v-8L5.6 26.4V23l12-7V7Q17.6 3 20 3z" fill="#fff" stroke="#2b3a55" stroke-width="2" stroke-linejoin="round"/><path d="M18.2 9h3.6" stroke="#5aa9f5" stroke-width="2"/></svg>';
ICONS.ball = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#fff" stroke="#2b3a55" stroke-width="2"/><path d="M20 12l6 4.4-2.3 7h-7.4L14 16.4z" fill="#2b3a55"/><path d="M20 12V5M26 16.4l7-2M23.7 23.4l4.3 6M16.3 23.4L12 29.4M14 16.4l-7-2" stroke="#2b3a55" stroke-width="2"/></svg>';
ICONS.rocket = '<svg viewBox="0 0 40 40"><path d="M20 2q7 7 7 19v8H13v-8Q13 9 20 2z" fill="#f2f2ee" stroke="#2b3a55" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="15" r="3.2" fill="#5aa9f5" stroke="#2b3a55" stroke-width="1.6"/><path d="M13 22l-5 7v3l5-2M27 22l5 7v3l-5-2" fill="#e5483c" stroke="#2b3a55" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 29l4 9 4-9z" fill="#ffb020"/></svg>';
ICONS.gift = '<svg viewBox="0 0 40 40"><rect x="6" y="15" width="28" height="20" rx="2" fill="#e5483c"/><rect x="4" y="11" width="32" height="6" rx="1.5" fill="#ff6a5a"/><path d="M20 11v24" stroke="#ffd34d" stroke-width="4"/><path d="M20 11q-8-9-11-3t11 3q8-9 11-3t-11 3z" fill="#ffd34d"/></svg>';
ICONS.ticket = '<svg viewBox="0 0 40 40"><path d="M5 11h30v6a3 3 0 000 6v6H5v-6a3 3 0 000-6z" fill="#ffc23d" stroke="#e08a00" stroke-width="2" stroke-linejoin="round"/><path d="M26 11v18" stroke="#e08a00" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M10 17h11M10 22h8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';
ICONS.fuel = '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="21" rx="13" ry="12" fill="#f2f2ee" stroke="#8a95a3" stroke-width="2"/><path d="M8 25h24" stroke="#e5483c" stroke-width="2.4"/><path d="M14 33l-3 4M26 33l3 4M20 9V4" stroke="#8a95a3" stroke-width="2.4" stroke-linecap="round"/><path d="M20 13q3 4 3 6a3 3 0 01-6 0q0-2 3-6z" fill="#5aa9f5"/></svg>';
ICONS.dish = '<svg viewBox="0 0 40 40"><path d="M7 11a17 17 0 0022 22z" fill="#f2f2ee" stroke="#2b3a55" stroke-width="2" stroke-linejoin="round"/><path d="M18 22l9-9" stroke="#2b3a55" stroke-width="2"/><circle cx="28" cy="12" r="2.6" fill="#e5483c"/><path d="M16 30l-3 7h12l-3-7" fill="#8a95a3"/><path d="M31 5q4 2 4 6M33 2q6 3 5 10" stroke="#5aa9f5" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
ICONS.letter = '<svg viewBox="0 0 40 40"><rect x="5" y="10" width="30" height="21" rx="2.5" fill="#fff" stroke="#2b3a55" stroke-width="2"/><path d="M6 12l14 11 14-11" stroke="#2b3a55" stroke-width="2" fill="none"/><circle cx="29" cy="26" r="4" fill="#e5483c"/><path d="M27.5 26h3" stroke="#fff" stroke-width="1.4"/></svg>';
ICONS.cookie = '<svg viewBox="0 0 40 40"><circle cx="20" cy="9" r="5.5" fill="#c8894a"/><path d="M12 16h16l5 6-4 2-3-3v7l3 9h-5l-4-7-4 7h-5l3-9v-7l-3 3-4-2z" fill="#c8894a"/><circle cx="18" cy="8" r="1" fill="#2b3a55"/><circle cx="22" cy="8" r="1" fill="#2b3a55"/><path d="M17 11q3 2 6 0" stroke="#fff" stroke-width="1.2" fill="none"/><circle cx="20" cy="20" r="1.5" fill="#e5483c"/><circle cx="20" cy="25" r="1.5" fill="#2fa06a"/></svg>';
ICONS.deer = '<svg viewBox="0 0 40 40"><ellipse cx="22" cy="23" rx="10" ry="5.5" fill="#c8894a"/><path d="M15 27l-1.5 9M19 28v8M26 28l1 8M30 26l2 9" stroke="#8a5a2e" stroke-width="2.4" stroke-linecap="round"/><circle cx="11" cy="15" r="4.2" fill="#c8894a"/><circle cx="7.6" cy="16.4" r="2" fill="#e5483c"/><path d="M11 11l-2-7M10 7l-3-2M12 11l3-6M14 7l3-1" stroke="#8a5a2e" stroke-width="1.8" stroke-linecap="round"/></svg>';
ICONS.bus = '<svg viewBox="0 0 40 40"><rect x="3" y="11" width="34" height="17" rx="4" fill="#ffc21a" stroke="#d69a00" stroke-width="1.5"/><rect x="7" y="14" width="6" height="6" rx="1" fill="#bfe1f5"/><rect x="15" y="14" width="6" height="6" rx="1" fill="#bfe1f5"/><rect x="23" y="14" width="6" height="6" rx="1" fill="#bfe1f5"/><rect x="31" y="14" width="4" height="9" rx="1" fill="#bfe1f5"/><rect x="3" y="22" width="34" height="2" fill="#2b3a55"/><circle cx="11" cy="29" r="3.6" fill="#2c3138"/><circle cx="29" cy="29" r="3.6" fill="#2c3138"/></svg>';
ICONS.school = '<svg viewBox="0 0 40 40"><rect x="5" y="15" width="30" height="19" fill="#d9775a"/><path d="M3 16l17-9 17 9z" fill="#8a4a3a"/><rect x="17" y="24" width="6" height="10" fill="#3a5b7a"/><rect x="8" y="19" width="5" height="5" fill="#bfe1f5"/><rect x="27" y="19" width="5" height="5" fill="#bfe1f5"/><path d="M20 7V2h5l-1.5 1.5L25 5h-5" fill="#e5483c" stroke="#2b3a55" stroke-width="1"/></svg>';
ICONS.kids = '<svg viewBox="0 0 40 40"><circle cx="13" cy="12" r="5" fill="#f6c7a2"/><path d="M8 11a5 5 0 0110 0z" fill="#ff5a5a"/><rect x="8" y="17" width="10" height="13" rx="4" fill="#3a7bd5"/><circle cx="27" cy="14" r="4.5" fill="#f6c7a2"/><path d="M22.5 13a4.5 4.5 0 019 0z" fill="#2fb36a"/><rect x="22" y="19" width="10" height="11" rx="4" fill="#ffc23d"/><path d="M6 35h28" stroke="#cfe0f1" stroke-width="3" stroke-linecap="round"/></svg>';
ICONS.stall = '<svg viewBox="0 0 40 40"><path d="M5 15l4-8h22l4 8z" fill="#e5483c"/><path d="M5 15h30v3q-3.75 3-7.5 0-3.75 3-7.5 0-3.75 3-7.5 0-3.75 3-7.5 0z" fill="#fff"/><rect x="8" y="18" width="24" height="15" fill="#b07a46"/><rect x="12" y="21" width="16" height="7" fill="#ffd34d"/></svg>';
ICONS.train = '<svg viewBox="0 0 40 40"><rect x="5" y="15" width="18" height="12" rx="2" fill="#2fa06a"/><rect x="23" y="10" width="12" height="17" rx="2" fill="#e5483c"/><rect x="26" y="13" width="6" height="5" fill="#ffd34d"/><rect x="8" y="9" width="5" height="6" fill="#2b3a55"/><circle cx="10" cy="29" r="3.4" fill="#2c3138"/><circle cx="19" cy="29" r="3.4" fill="#2c3138"/><circle cx="29" cy="29" r="3.4" fill="#2c3138"/><circle cx="10" cy="5" r="2.6" fill="#e3eaf3"/></svg>';
ICONS.skate = '<svg viewBox="0 0 40 40"><path d="M10 8h9v14h9q5 0 5 5v1H10z" fill="#fff" stroke="#2b3a55" stroke-width="2" stroke-linejoin="round"/><path d="M12 12h5M12 16h5" stroke="#e5483c" stroke-width="2"/><path d="M7 33h28" stroke="#8a95a3" stroke-width="3" stroke-linecap="round"/><path d="M12 28v5M30 28v5" stroke="#8a95a3" stroke-width="2"/></svg>';
ICONS.lift = '<svg viewBox="0 0 40 40"><path d="M2 8l36 10" stroke="#2b3a55" stroke-width="2"/><path d="M20 13v8" stroke="#2b3a55" stroke-width="2"/><rect x="12" y="21" width="16" height="4" rx="1" fill="#e5483c"/><path d="M12 25v6h16v-6" stroke="#e5483c" stroke-width="2.5" fill="none"/><path d="M5 36l7-12 5 7 4-5 9 10z" fill="#eaf4ff" stroke="#9fb8d6" stroke-width="1.5"/></svg>';
ICONS.flag = '<svg viewBox="0 0 40 40"><path d="M10 4v32" stroke="#2b3a55" stroke-width="3" stroke-linecap="round"/><path d="M11 6h20l-5 6 5 6H11z" fill="#e5483c"/><path d="M15 9h4v4h-4zM23 13h4v4h-4zM19 13h4v4h-4zM19 9h4" fill="#fff"/></svg>';
ICONS.lock = '<svg viewBox="0 0 40 40"><rect x="9" y="18" width="22" height="17" rx="4" fill="#fff"/><path d="M14 18v-4a6 6 0 0112 0v4" stroke="#fff" stroke-width="4" fill="none"/><circle cx="20" cy="26" r="2.6" fill="#8a95a8"/></svg>';
ICONS.flame = '<svg viewBox="0 0 40 40"><path d="M20 3c2 7 11 11 11 21a11 11 0 01-22 0c0-6 4-9 5-14 2 3 2 6 5 7-1-5-1-10 1-14z" fill="#fff6d2"/><path d="M20 19c1 4 6 6 6 10a6 6 0 01-12 0c0-3 4-5 6-10z" fill="#ffc21a"/></svg>';
const UI = {
  flyers: [], pending: 0, joy: null,
  init() {
    this.cv = $('fx2d'); this.g = this.cv.getContext('2d');
    $('coinIco').innerHTML = ICONS.coin; $('loadTag').querySelector('.ci').innerHTML = ICONS.coin;
    this.refreshMute();
    // your own sound switch (the CrazyGames mute setting is on top of it: while that is on, it stays quiet)
    $('btnMute').onclick = (e) => { e.stopPropagation(); AUD.init(); AUD.setMuted(!AUD._um); this.refreshMute(); STORE.set('plowtown_mute', AUD._um ? '1' : '0'); };
    const ups = $('ups');
    ups.innerHTML = '';
    this.upBtns = [];
    for (let i = 0; i < 3; i++) {
      const b = document.createElement('button'); b.className = 'up'; b.innerHTML = `<div class="ui-ico">${[ICONS.w, ICONS.spd, ICONS.coin][i]}</div><div class="ui-lbl"></div><div class="ui-dots"></div><div class="ui-cost"><span class="ci">${ICONS.coin}</span><b></b></div>`;
      b.addEventListener('pointerdown', e => { e.stopPropagation(); AUD.init(); GAME.buyUp(i); });
      ups.appendChild(b); this.upBtns.push(b);
    }
    const tb = document.createElement('button'); tb.className = 'up toolcard'; tb.innerHTML = `<div class="ui-ico"></div><div class="ui-lbl"></div><div class="tc-bar"><i></i></div><div class="ui-cost"><span class="ci">${ICONS.coin}</span><b></b></div>`;
    // (a quick double tap must not buy the machine after the new one too: the card shows the old one for a moment)
    tb.addEventListener('pointerdown', e => { e.stopPropagation(); AUD.init(); if (performance.now() < (this._tbLock || 0)) return; const t = GAME.nextTool(); if (t && GAME.buyTool(t)) { this._tbLock = performance.now() + 600; this._uiT = 0; } });
    ups.appendChild(tb); this.toolBtn = tb;
    this.refreshTools();
    window.addEventListener('resize', () => this.resize()); this.resize();
  },
  resize() { const d = Math.min(2, devicePixelRatio || 1); this.dpr = d; this.cv.width = innerWidth * d; this.cv.height = innerHeight * d; this._coinRect = null; },
  shownCoins() { return GAME.coins - this.pending; },
  refreshMute() { const b = $('btnMute'); if (b) b.innerHTML = AUD.muted ? ICONS.mute : ICONS.snd; },
  pulseTool(t) {
    const box = $('tools'); const b = [...box.children].find(x => x.dataset.t === t);
    if (b) { b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 6000); }
  },
  refreshTools() {
    // you always use your newest tool: no switching back to smaller ones
    const box = $('tools'); box.innerHTML = ''; box.style.display = 'none';
  },
  _lastGoal: -1, _lastCoinTxt: '', _hintT: 0, _uiT: 0,
  update(dt) {
    // coins
    const shown = Math.floor(this.shownCoins() + 1e-6);
    const txt = fmt(shown);
    if (txt !== this._lastCoinTxt) { $('coinTxt').textContent = txt; this._lastCoinTxt = txt; }
    this._uiT -= dt;
    if (this._uiT <= 0) { this._uiT = 0.1; this._updButtons(shown); this._updGoal(shown); }
    this._updLoadTag();
    this._updStreak();
    this._draw(dt);
    // (a hint that would sit under a toast on a small screen waits, its time paused, until the toast is gone)
    if (this._hintT > 0 && !this._under) { this._hintT -= dt; if (this._hintT <= 0) $('hint').classList.remove('on'); }
    if (this._toastT > 0) { this._toastT -= dt; if (this._toastT <= 0) { $('toast').classList.remove('on'); this._clash(); } }
  },
  _clash() {
    const h = $('hint'), t = $('toast');
    let under = false;
    if (this._hintT > 0 && this._toastT > 0) {
      // (where both end up, not where the hint is while it slides in: both are centred with translateX(-50%))
      const box = e => { const l = e.offsetLeft - e.offsetWidth / 2; return [l, e.offsetTop, l + e.offsetWidth, e.offsetTop + e.offsetHeight]; };
      const a = box(h), b = box(t);
      under = a[0] < b[2] && b[0] < a[2] && a[1] < b[3] + 4 && b[1] < a[3] + 4;
    }
    this._under = under; h.classList.toggle('under', under);
  },
  _updButtons(shown) {
    const t = PL.tool, T = TIER[t], LB = T.labels || UPLABELS[T.kind];
    for (let i = 0; i < 3; i++) {
      const b = this.upBtns[i], c = GAME.upCost(t, i), L = GAME.L(t)[i];
      const can = isFinite(c) && shown >= c;
      b.classList.toggle('can', can); b.classList.toggle('max', !isFinite(c));
      const lbl = LB[i]; if (b._lbl !== lbl) { b.querySelector('.ui-lbl').textContent = lbl; b._lbl = lbl; }
      const ct = isFinite(c) ? fmt(c) : 'MAX'; if (b._ct !== ct) { b.querySelector('.ui-cost b').textContent = ct; b._ct = ct; }
      const dots = '●'.repeat(L) + '○'.repeat(Math.max(0, upMax(t, i) - L)); if (b._d !== dots) { b.querySelector('.ui-dots').textContent = dots; b._d = dots; }
    }
    const nt = GAME.nextTool(), tb = this.toolBtn;
    if (!nt) { tb.style.display = 'none'; }
    else if (TIER[nt].gift) {
      // the plow truck is a gift from the town once every driveway is clear
      const n = GAME.handDone(), N = HAND_AREAS.length, f = n / N;
      tb.style.display = n >= 3 ? '' : 'none';
      if (tb._t !== nt) { tb.querySelector('.ui-ico').innerHTML = ICONS[nt] || ICONS.truck; tb.querySelector('.ui-lbl').textContent = TIER[nt].name; tb._t = nt; }
      tb.querySelector('.ui-cost b').textContent = 'FREE ' + n + '/' + N;
      tb.querySelector('.tc-bar i').style.width = (f * 100).toFixed(1) + '%';
      tb.classList.remove('can'); tb.classList.add('gift');
    }
    else if (GAME.toolLocked(nt)) {
      // the town's special machine: shows up after a few jobs
      const lk = GAME.toolLocked(nt);
      tb.style.display = lk.n >= 1 || GOALS[GAME.goalIdx()].tool === nt ? '' : 'none';
      if (tb._t !== nt) { tb.querySelector('.ui-ico').innerHTML = ICONS[nt] || ICONS.truck; tb.querySelector('.ui-lbl').textContent = TIER[nt].name; tb._t = nt; }
      tb.querySelector('.ui-cost b').textContent = lk.n + '/' + lk.N + ' jobs';
      tb.querySelector('.tc-bar i').style.width = (lk.n / lk.N * 100).toFixed(1) + '%';
      tb.classList.remove('can', 'gift'); tb.classList.add('lock');
    }
    else {
      tb.classList.remove('gift', 'lock');
      const own = !!GAME.owned[nt], c = own ? 0 : TIER[nt].cost, f = own ? 1 : clamp(shown / c, 0, 1);
      const vis = f >= 0.35 || GOALS[GAME.goalIdx()].tool === nt;
      tb.style.display = vis ? '' : 'none';
      if (tb._t !== nt) { tb.querySelector('.ui-ico').innerHTML = ICONS[nt] || ICONS.truck; tb.querySelector('.ui-lbl').textContent = TIER[nt].name; tb._t = nt; }
      tb.querySelector('.ui-cost b').textContent = own ? 'USE' : fmt(c);
      tb.querySelector('.tc-bar i').style.width = (f * 100).toFixed(1) + '%';
      tb.classList.toggle('can', f >= 1);
      if (f >= 1 && !this._toolHinted) { this._toolHinted = 1; this.hint('New tool ready! Tap ' + TIER[nt].name, 4); }
      if (f < 1) this._toolHinted = 0;
    }
    if (!GAME.firstUp && !GAME.ended && this.upBtns.some(b => b.classList.contains('can')) && !this._upHint) { this._upHint = 1; this.hint('Tap an upgrade below!', 4); $('ups').classList.add('nudge'); }
    if (GAME.firstUp) $('ups').classList.remove('nudge');
  },
  _updGoal(shown) {
    const gi = GAME.goalIdx(), g = GOALS[gi];
    if (gi !== this._lastGoal) {
      this._lastGoal = gi;
      $('goalIco').innerHTML = ICONS[g.ico] || ICONS.star; $('goalTxt').textContent = g.t;
      const el = $('goal'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
    let f = 1, lab = '';
    if (g.a) { const a = WORLD.areaByKey[g.a]; f = a.done ? 1 : Math.min(1, SNOW.prog(a) / doneAt(a)); lab = Math.floor(f * 100) + '%'; }
    else if (g.tool) { const c = TIER[g.tool].cost; f = clamp(shown / c, 0, 1); lab = fmt(Math.min(shown, c)) + '/' + fmt(c); }
    else if (STORM.phase === 'bonus') { f = STORM.multT / 90; lab = 'x2 ' + Math.ceil(STORM.multT) + 's'; }
    else if (STORM.phase === 'storm') { f = STORM.t / 12; lab = 'storm'; }
    else { lab = '★'; }
    $('goalBar').firstChild.style.width = (f * 100).toFixed(1) + '%';
    $('goalPct').textContent = lab;
    // chapter done and another one waits: the goal bar carries the button to it
    const nx = GAME.ended && GAME.finishT <= 0 && !CHUI.open && !!chapterById(CH.id + 1);
    if (nx !== this._nextOn) { this._nextOn = nx; $('goal').classList.toggle('next', nx); }
  },
  _v: new V3(),
  _updLoadTag() {
    const el = $('loadTag');
    const st = PL.stats(), f = PL.load / st.cap;
    if (f <= 0.02) { if (el._on) { el.classList.remove('on'); el._on = 0; } return; }
    if (!el._on) { el.classList.add('on'); el._on = 1; }
    const p = PL.kind === 'truck' ? this._v.set(PL.x, 2.6 + PL.geo.halfW * 0.9, PL.z) : this._v.set(PL.x, 1.75, PL.z);
    p.project(CAM.cam);
    el.style.transform = `translate(${((p.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - p.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
    el.querySelector('i').style.width = (clamp(f, 0, 1) * 100).toFixed(1) + '%';
    const v = '+' + fmt(Math.floor(PL.load * GAME.price() * STREAK.mul)); if (el._v !== v) { el.querySelector('b').textContent = v; el._v = v; }
  },
  // the streak badge floats just above the load tag
  _updStreak() {
    const el = $('streak'), S = STREAK;
    if (!S.lv) { if (el._on) { el.classList.remove('on'); el._on = 0; } return; }
    if (!el._on) { el.classList.add('on'); el._on = 1; if (!el._ini) { el._ini = 1; el.querySelector('.fl').innerHTML = ICONS.flame; } }
    const p = PL.kind === 'truck' ? this._v.set(PL.x, 2.6 + PL.geo.halfW * 0.9, PL.z) : this._v.set(PL.x, 1.75, PL.z);
    p.project(CAM.cam);
    const up = $('loadTag')._on ? 40 : 6;
    el.style.transform = `translate(${((p.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - p.y) / 2 * innerHeight - up).toFixed(1)}px) translate(-50%,-100%)`;
    const t = 'x' + S.mul; if (el._t !== t) { el.querySelector('b').textContent = t; el._t = t; el.classList.remove('l1', 'l2', 'l3'); el.classList.add('l' + S.lv); }
    el.querySelector('.hb i').style.width = (clamp(S.heat, 0, 1) * 100).toFixed(1) + '%';
    el.classList.toggle('cold', S.heat < 0.55);
  },
  toolArrived() { const tb = this.toolBtn; this._uiT = 0; tb.classList.remove('arrive'); void tb.offsetWidth; tb.classList.add('arrive'); setTimeout(() => tb.classList.remove('arrive'), 2400); this._toolHinted = 0; },
  streakPop() { const el = $('streak'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); },
  onPayout() {
    if (GAME.payouts === 1 && CH.id === 1) this.hint(PL.kind === 'truck' ? 'A full blade turns into coins!' : 'A full sled turns into coins!', 3);
    const el = $('loadTag'); if (el) { el.classList.remove('paid'); void el.offsetWidth; el.classList.add('paid'); }
  },
  onUpgrade(i) { const b = this.upBtns[i]; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); },
  // countdown pill (chapter twists like "beat the bus"): sec=null hides it. mode: '' | 'good' | 'late'
  timer(sec, ico, sub, mode) {
    const el = $('timer');
    if (sec === null) { if (el._on) { el.classList.remove('on', 'warn', 'good', 'late'); el._on = 0; el._t = null; } return; }
    if (!el._on) { el.classList.add('on'); el._on = 1; }
    if (el._ico !== ico) { el.querySelector('.ti-ico').innerHTML = ICONS[ico] || ICONS.star; el._ico = ico; }
    const t = Math.max(0, Math.ceil(sec)), txt = typeof sec === 'string' ? sec : Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    if (el._t !== txt) { $('timerTxt').textContent = txt; el._t = txt; if (!mode && typeof sec === 'number' && sec > 0 && sec <= 10) AUD.tick(sec <= 5); }
    if (el._sub !== sub) { $('timerSub').textContent = sub || ''; el._sub = sub; }
    el.classList.toggle('warn', !mode && typeof sec === 'number' && sec <= 10); el.classList.toggle('good', mode === 'good'); el.classList.toggle('late', mode === 'late');
  },
  // little route bar in the countdown pill: where the bus is, where you are (0..1 along the route)
  timerRoute(fb, fm) {
    const el = $('timer');
    if (fb === null) { el.classList.remove('route'); return; }
    el.classList.add('route');
    const r = el.querySelector('.ti-route');
    r.children[0].style.left = (clamp(fb, 0, 1) * 100).toFixed(1) + '%'; r.children[1].style.left = (clamp(fm, 0, 1) * 100).toFixed(1) + '%';
  },
  // passive income badge under the coins (market stalls, etc.)
  income(rate) {
    const el = $('income');
    if (!rate) { if (el._on) { el.classList.remove('on'); el._on = 0; } return; }
    if (!el._on) { el.classList.add('on'); el._on = 1; el.querySelector('.ci').innerHTML = ICONS.coin; }
    const t = '+' + fmt(rate) + '/s'; if (el._t !== t) { el.querySelector('b').textContent = t; el._t = t; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
  },
  hint(t, dur) {
    // on phones the hint sits where the big banners pop: wait for the banner to finish
    const wait = (this._bnUntil || 0) - performance.now();
    if (wait > 0 && (innerWidth <= 640 || innerHeight <= 500)) { clearTimeout(this._hq); this._hqT = t; this._hq = setTimeout(() => { this._hqT = null; this.hint(t, dur); }, wait + 60); return; }
    const el = $('hint'); el.textContent = t; el.classList.add('on'); this._hintT = dur || 3; this._clash();
  },
  unhint(pre) { const el = $('hint'); if (this._hintT > 0 && el.textContent.startsWith(pre)) this._hintT = 0.01; if (this._hqT && this._hqT.startsWith(pre)) { clearTimeout(this._hq); this._hqT = null; } },
  // (a toast that comes with a big banner waits for the banner to finish, so neither hides the other)
  toast(t) {
    const wait = (this._bnUntil || 0) - performance.now();
    if (wait > 0) { clearTimeout(this._tq); this._tq = setTimeout(() => this.toast(t), wait + 60); return; }
    const el = $('toast'); el.textContent = t; el.classList.add('on'); this._toastT = 4; this._clash();
  },
  banner(title, sub, ico, dur) {
    if (this._hintT > 0) { this._hintT = 0; $('hint').classList.remove('on'); }
    const el = $('banner'); el.innerHTML = `<div class="bn-ico">${ICONS[ico] || ICONS.star}</div><div class="bn-t">${title}</div><div class="bn-s">${sub || ''}</div>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(this._bnT); this._bnT = setTimeout(() => el.classList.remove('on'), (dur || 2.2) * 1000); this._bnUntil = performance.now() + (dur || 2.2) * 1000;
    // where the banner sits at full size (its box is centred on top:%), so floating texts can keep out of its way
    const w = el.offsetWidth, h = el.offsetHeight, cx = el.offsetLeft, cy = el.offsetTop;
    this._bnRect = { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 };
  },
  bubble(text) { const d = document.createElement('div'); d.className = 'bubble'; d.textContent = text; $('bubbles').appendChild(d); return d; },
  placeBubble(d, wp, vis) {
    const p = this._v.copy(wp).project(CAM.cam), hw = (d._w || (d._w = d.offsetWidth || 120)) / 2;
    const x = clamp((p.x + 1) / 2 * innerWidth, hw + 6, Math.max(hw + 6, innerWidth - hw - 6));
    d.style.transform = `translate(${x.toFixed(1)}px, ${((1 - p.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
    d.style.opacity = vis && p.z < 1 ? 1 : 0;
  },
  // ---- floating texts (+coins, WIDER!, ...) ----
  texts: [],
  floatText(wp, text, color, size, key) {
    // a keyed text replaces its fresh twin (tapping upgrades fast pops one word, not a tower of them)
    if (key) for (let i = this.texts.length - 1; i >= 0; i--) if (this.texts[i].key === key && this.texts[i].t < 0.9) this.texts.splice(i, 1);
    // keep the WORLD position and project it every frame, so the text stays glued to the spot while the camera moves
    let stack = 0;
    for (const T of this.texts) if (T.t < 0.45 && Math.hypot(T.wx - wp.x, T.wz - wp.z) < 2.5) stack++;
    this.texts.push({ wx: wp.x, wy: wp.y, wz: wp.z, oy: stack * 34, t: 0, d: 1.15, text, color: color || '#ffd34d', size: size || 28, key });
    if (this.texts.length > 24) this.texts.shift();
  },
  // ---- 2D coins flying to the counter ----
  flyCoin(wp, v) {
    let x, y;
    if (wp) { const p = this._v.copy(wp).project(CAM.cam); x = (p.x + 1) / 2 * innerWidth; y = (1 - p.y) / 2 * innerHeight; }
    else { x = innerWidth / 2; y = innerHeight / 2; }
    const r = this._coinRect || (this._coinRect = $('coinIco').getBoundingClientRect());
    this.flyers.push({ x0: x, y0: y, x1: r.left + r.width / 2, y1: r.top + r.height / 2, t: 0, d: rnd(0.45, 0.7), v, cx: x + rnd(-80, 80), cy: y - rnd(60, 160), s: rnd(0.8, 1.1) });
  },
  _draw(dt) {
    const g = this.g, d = this.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height);
    g.setTransform(d, 0, 0, d, 0, 0);
    // joystick
    const J = INPUT.joy;
    if (J.active && J.show) {
      g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(J.ox, J.oy, 52, 0, TAU); g.fill();
      g.globalAlpha = 0.6; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(J.ox, J.oy, 52, 0, TAU); g.stroke();
      g.globalAlpha = 0.9; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(J.ox + J.dx * 52, J.oy + J.dy * 52, 22, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }
    // floating texts: place them first...
    const L = this._tl || (this._tl = []); L.length = 0;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const T = this.texts[i]; const k = T.t / T.d; if (k >= 1) continue;
      const p = this._v.set(T.wx, T.wy, T.wz).project(CAM.cam); if (p.z > 1) continue;
      const sx = (p.x + 1) / 2 * innerWidth, sy = (1 - p.y) / 2 * innerHeight;
      g.font = `800 ${T.size}px "Baloo 2", sans-serif`;
      // keep texts fully on screen (near the edges they slide inward)
      const hw = (T.w || (T.w = g.measureText(T.text).width + T.size * 0.4)) / 2, cx = innerWidth > hw * 2 + 16 ? clamp(sx, hw + 8, innerWidth - hw - 8) : innerWidth / 2;
      L.push({ T, k, cx, hw, y: Math.max(T.size * 0.7, sy - T.oy - 60 * easeOutCubic(k)), push: 0 });
    }
    // ...the ones that would rise into the big banner line up just below it instead (no pile-up behind the title)
    const B = this._bnRect;
    if (B && performance.now() < (this._bnUntil || 0) && L.length) {
      const C = L.filter(o => o.cx + o.hw > B.x0 && o.cx - o.hw < B.x1 && o.y - o.T.size * 0.5 < B.y1).sort((a, b) => a.y - b.y);
      let next = B.y1 + 4;
      for (const o of C) { const y = next + o.T.size * 0.55; o.push = y - o.y; next = y + o.T.size * 0.55; }
    }
    // ...then draw (the push eases in and out, so nothing jumps)
    for (const o of L) {
      const T = o.T, k = o.k;
      T.py = T.py == null || T.t < 0.05 ? o.push : damp(T.py, o.push, 12, dt || 0.016);
      const sc = k < 0.15 ? easeOutBack(k / 0.15) : 1, a = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      g.font = `800 ${T.size}px "Baloo 2", sans-serif`;
      g.save(); g.globalAlpha = a; g.translate(o.cx, o.y + T.py); g.scale(sc, sc);
      g.lineWidth = Math.max(4, T.size * 0.2); g.strokeStyle = '#2b3a55'; g.lineJoin = 'round'; g.strokeText(T.text, 0, 0);
      g.fillStyle = T.color; g.fillText(T.text, 0, 0); g.restore();
    }
    // flyers
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i];
      const k = clamp(f.t / f.d, 0, 1), e = k * k * (3 - 2 * k);
      const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * f.cx + e * e * f.x1, y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * f.cy + e * e * f.y1;
      const s = 11 * f.s * (1 - 0.35 * e);
      g.fillStyle = '#f5a623'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
      g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x, y, s * 0.78, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(x - s * 0.3, y - s * 0.3, s * 0.25, 0, TAU); g.fill();
    }
  },
  tick(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) { const T = this.texts[i]; T.t += dt; if (T.t >= T.d) this.texts.splice(i, 1); }
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i]; f.t += dt;
      if (f.t >= f.d) {
        this.flyers.splice(i, 1); this.pending -= f.v; if (this.pending < 0.001) this.pending = 0;
        AUD.coin();
        const ci = $('coinBox'); if (!this._bumpT || performance.now() - this._bumpT > 90) { this._bumpT = performance.now(); ci.classList.remove('bump'); void ci.offsetWidth; ci.classList.add('bump'); }
      }
    }
  }
};
