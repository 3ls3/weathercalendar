// UsefulAddons icon family generator
// Shared glass "calendar page" base + one motif per add-on.
// Renders with headless Chromium so gradients, blur and shadows are faithful.
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');

const VARIANT = process.argv[2] || 'v1';
const OUT = path.join(__dirname, VARIANT === 'v1' ? 'out' : 'out-' + VARIANT);
// softer palettes: pastel per product (soft) and one airy tile for the whole family (uni)
const PALETTES = {
  soft: {
    usefuladdons:         { c1: '#B9C3D8', c2: '#7D8AA8', header: '#3E485F', accent: '#7C8FFF' },
    'weathercalendar-new':{ c1: '#C9E6FF', c2: '#86C3F2', header: '#3E82C4', accent: '#FFC16B' },
    weathercalendarpro:   { c1: '#FFE0B8', c2: '#F3AE74', header: '#C97A3F', accent: '#FFD88A' },
    weathercalendarultra: { c1: '#CDD3FF', c2: '#949EE8', header: '#4F58B4', accent: '#FFC96B' },
    pollencalendar:       { c1: '#D6F2C8', c2: '#9AD492', header: '#4E9A60', accent: '#F6D45A' },
    horoscopecalendar:    { c1: '#DED6FF', c2: '#AC9DEE', header: '#5E4FBD', accent: '#FFF1C2' },
    horoscopeprocalendar: { c1: '#C4B9F0', c2: '#8676D0', header: '#44358F', accent: '#F2C66A' },
    plannercalendar:      { c1: '#C6F0EA', c2: '#86D5CC', header: '#2F9A95', accent: '#FFFFFF' },
  },
  uni: null, // filled below: same airy tile for everyone
};
PALETTES.uni = Object.fromEntries(Object.keys(PALETTES.soft).map((k) => [k, { c1: '#DCEBFF', c2: '#9FBEEE', header: '#4C7BC2', accent: PALETTES.soft[k].accent }]));
const SOFT_MOTIF = VARIANT !== 'v1';
fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'svg'), { recursive: true });

// ---------- helpers (1024 x 1024 grid) ----------
const star4 = (cx, cy, r, fill, inner = 0.42, stroke = '') => {
  const ri = r * inner;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : ri;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${stroke} stroke-linejoin="round"/>`;
};

const cloud = (cx, cy, s, small) => {
  // s = scale, 1 => ~360 wide
  const k = s;
  const stroke = small ? 'stroke="#6A8FB5" stroke-opacity=".45" stroke-width="10"' : 'stroke="#7A9CC0" stroke-opacity=".35" stroke-width="5"';
  return `<g filter="url(#softShadow)">
    <path ${stroke} fill="url(#cloudFill)" d="
      M ${cx - 180 * k} ${cy + 60 * k}
      a ${80 * k} ${80 * k} 0 0 1 ${70 * k} ${-130 * k}
      a ${110 * k} ${110 * k} 0 0 1 ${205 * k} ${-20 * k}
      a ${85 * k} ${85 * k} 0 0 1 ${105 * k} ${150 * k}
      a ${60 * k} ${60 * k} 0 0 1 ${-60 * k} ${60 * k}
      H ${cx - 120 * k}
      a ${60 * k} ${60 * k} 0 0 1 ${-60 * k} ${-60 * k} Z"/>
  </g>`;
};

const sun = (cx, cy, r, rays, small) => {
  let g = '';
  if (rays) {
    const n = 8, len = r * 0.55, gap = r * 1.22, w = small ? r * 0.3 : r * 0.22;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      const x1 = cx + gap * Math.cos(a), y1 = cy + gap * Math.sin(a);
      const x2 = cx + (gap + len) * Math.cos(a), y2 = cy + (gap + len) * Math.sin(a);
      g += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="url(#sunFill)" stroke-width="${w}" stroke-linecap="round"/>`;
    }
  }
  return `<g filter="url(#sunGlow)">${g}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sunFill)"/>
    <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.45}" fill="#fff" opacity=".35"/></g>`;
};

const crescent = (cx, cy, r, small, strokeCol) => {
  const ox = cx + r * 0.55, oy = cy - r * 0.3, ri = r * 0.86;
  return `<mask id="moonMask"><rect width="1024" height="1024" fill="#fff"/><circle cx="${ox}" cy="${oy}" r="${ri}" fill="#000"/></mask>
  <g filter="url(#softShadow)"><g mask="url(#moonMask)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonFill)" stroke="${strokeCol}" stroke-opacity=".35" stroke-width="${small ? 8 : 4}"/></g></g>`;
};

// ---------- motifs ----------
const motifs = {
  weatherlight: (s) => `${sun(s ? 630 : 600, s ? 500 : 520, s ? 170 : 130, false, s)}${cloud(500, s ? 680 : 660, s ? 1.3 : 1.05, s)}`,
  weatherpro: (s) => `${sun(s ? 630 : 610, s ? 495 : 505, s ? 170 : 125, !s, s)}${cloud(500, s ? 680 : 665, s ? 1.3 : 1.05, s)}`,
  weatherultra: (s) => `${sun(s ? 630 : 610, s ? 480 : 500, s ? 160 : 120, !s, s)}${cloud(500, s ? 640 : 640, s ? 1.22 : 1.0, s)}
    <g filter="url(#softShadow)"><polygon points="${s ? '575,690 470,850 545,840 495,960 660,760 580,780 630,690' : '560,710 505,820 550,812 520,905 625,765 572,775 600,710'}" fill="url(#boltFill)" stroke="#B8600A" stroke-opacity=".5" stroke-width="${s ? 8 : 4}" stroke-linejoin="round"/></g>`,

  pollen: (s) => {
    const cx = 512, cy = s ? 650 : 630, L = s ? 200 : 160, W = s ? 108 : 82;
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const a = (-90 + i * 72);
      petals += `<ellipse cx="${cx}" cy="${cy - L * 0.62}" rx="${W}" ry="${L * 0.62}" fill="url(#petalFill)" stroke="#D9B400" stroke-opacity=".35" stroke-width="${s ? 8 : 4}" transform="rotate(${a} ${cx} ${cy})"/>`;
    }
    const particles = s
      ? `<circle cx="745" cy="450" r="26" fill="#FFD23F"/><circle cx="300" cy="470" r="20" fill="#FFD23F"/>`
      : `<g filter="url(#sunGlow)"><circle cx="760" cy="450" r="22" fill="#FFD23F"/><circle cx="700" cy="400" r="12" fill="#FFD23F"/><circle cx="290" cy="470" r="16" fill="#FFD23F"/><circle cx="330" cy="410" r="9" fill="#FFD23F"/><circle cx="800" cy="540" r="10" fill="#FFD23F"/></g>`;
    return `<g filter="url(#softShadow)">${petals}<circle cx="${cx}" cy="${cy}" r="${s ? 80 : 72}" fill="url(#pollenCore)"/><circle cx="${cx - 24}" cy="${cy - 24}" r="${s ? 30 : 26}" fill="#fff" opacity=".4"/></g>${particles}`;
  },

  horoscope: (s) => {
    const moon = crescent(s ? 465 : 480, s ? 650 : 635, s ? 225 : 185, s, '#5B4BC9');
    const stars = s
      ? `${star4(745, 495, 85, '#FFF3C4')}`
      : `<g filter="url(#sunGlow)">${star4(735, 500, 62, '#FFF3C4')}${star4(680, 410, 34, '#FFF3C4')}${star4(790, 640, 28, '#FFF3C4')}</g>`;
    return moon + stars;
  },

  horoscopepro: (s) => {
    const sunG = sun(s ? 615 : 600, s ? 550 : 560, s ? 140 : 110, true, s).replace(/url\(#sunFill\)/g, 'url(#goldFill)');
    const moon = crescent(s ? 430 : 450, s ? 660 : 645, s ? 205 : 170, s, '#2A1C7E');
    const star = s ? '' : `<g filter="url(#sunGlow)">${star4(270, 470, 30, '#FFD86B')}</g>`;
    return sunG + moon + star;
  },

  planner: (s) => {
    const x = s ? 310 : 350, h = s ? 112 : 86, g = s ? 30 : 30, r = s ? 40 : 28;
    const y0 = s ? 465 : 480;
    const blocks = [
      [SOFT_MOTIF ? '#FF8E85' : '#FF6F61', s ? 300 : 260],
      [SOFT_MOTIF ? '#FFCF6E' : '#FFC24B', s ? 390 : 330],
      [SOFT_MOTIF ? '#9A8DF4' : '#7C6CF5', s ? 250 : 210],
    ].map(([c, w], i) => `<rect x="${x}" y="${y0 + i * (h + g)}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>
      <rect x="${x}" y="${y0 + i * (h + g)}" width="${w}" height="${h / 2}" rx="${r}" fill="#fff" opacity=".22"/>`).join('');
    const sparkle = `<g filter="url(#sunGlow)">${star4(s ? 755 : 720, s ? 500 : 490, s ? 95 : 64, '#FFFFFF', 0.42, s ? 'stroke="#0F8C9A" stroke-opacity=".55" stroke-width="8"' : 'stroke="#0F8C9A" stroke-opacity=".35" stroke-width="3"')}${s ? '' : star4(770, 590, 26, '#FFFFFF')}</g>`;
    return `<g filter="url(#softShadow)">${blocks}</g>${sparkle}`;
  },

  usefuladdons: (s) => {
    const w = s ? 430 : 340, t = s ? 135 : 100, r = t / 2, cx = 512, cy = s ? 640 : 625;
    return `<g filter="url(#softShadow)">
      <rect x="${cx - w / 2}" y="${cy - t / 2}" width="${w}" height="${t}" rx="${r}" fill="url(#plusFill)"/>
      <rect x="${cx - t / 2}" y="${cy - w / 2}" width="${t}" height="${w}" rx="${r}" fill="url(#plusFill)"/>
      <rect x="${cx - w / 2}" y="${cy - t / 2}" width="${w}" height="${t / 2}" rx="${r}" fill="#fff" opacity=".25"/>
    </g>`;
  },
};

// ---------- products ----------
const products = [
  { id: 'usefuladdons', name: 'UsefulAddons', tagline: 'Small add-ons, more of your time back', c1: '#5B6B8C', c2: '#222B3F', header: '#161D2E', accent: '#6C8CFF', motif: 'usefuladdons' },
  { id: 'weathercalendar-new', name: 'Weather Calendar', tagline: 'Daily forecast, right in your agenda', c1: '#62C6FF', c2: '#1F7FE0', header: '#1565C0', accent: '#FFB300', motif: 'weatherlight' },
  { id: 'weathercalendarpro', name: 'Weather Calendar Pro', tagline: 'Hourly forecast, right in your agenda', c1: '#FFB65A', c2: '#F06A22', header: '#C9480F', accent: '#FFE082', motif: 'weatherpro' },
  { id: 'weathercalendarultra', name: 'Weather Calendar Ultra', tagline: 'Wind, air quality, sunrise and sunset', c1: '#5B7BFF', c2: '#2B3AB5', header: '#1E2A8A', accent: '#FFC107', motif: 'weatherultra' },
  { id: 'pollencalendar', name: 'Pollen Calendar', tagline: 'Daily pollen levels for your location', c1: '#8BE06A', c2: '#2E9E4F', header: '#1F7A3A', accent: '#FFD23F', motif: 'pollen' },
  { id: 'horoscopecalendar', name: 'Daily Horoscope Calendar', tagline: 'Your sign, every morning', c1: '#8C7CFF', c2: '#3E2BB0', header: '#2A1C7E', accent: '#FFF3C4', motif: 'horoscope' },
  { id: 'horoscopeprocalendar', name: 'Horoscope Calendar Pro', tagline: 'Personal AI horoscope, every morning', c1: '#5E44D8', c2: '#1A0F5E', header: '#110845', accent: '#F7C34B', motif: 'horoscopepro' },
  { id: 'plannercalendar', name: 'AI Day Planner', tagline: 'From to-do list to a planned day', c1: '#49DCC6', c2: '#0F8C9A', header: '#0A6A77', accent: '#FFFFFF', motif: 'planner' },
];
if (PALETTES[VARIANT]) for (const p of products) Object.assign(p, PALETTES[VARIANT][p.id]);

// ---------- base ----------
function iconSvg(p, size, small) {
  const grid = small ? '' : `
    <g stroke="${p.header}" stroke-opacity=".14" stroke-width="4" stroke-linecap="round">
      <line x1="196" y1="470" x2="828" y2="470"/><line x1="196" y1="600" x2="828" y2="600"/><line x1="196" y1="730" x2="828" y2="730"/>
      <line x1="354" y1="380" x2="354" y2="830"/><line x1="512" y1="380" x2="512" y2="830"/><line x1="670" y1="380" x2="670" y2="830"/>
    </g>`;
  const sheen = small ? '' : `<path d="M0 0 H1024 V300 C 700 420, 320 380, 0 560 Z" fill="url(#sheen)" clip-path="url(#tileClip)"/>`;
  const ringW = small ? 76 : 64, ringH = small ? 170 : 150, ringY = small ? 120 : 130;
  const cardY = small ? 180 : 190, cardH = small ? 690 : 680, headH = small ? 150 : 140;
  const motif = motifs[p.motif](small);
  const pre = `${p.id}-${small ? 's' : 'l'}-`;
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
    <radialGradient id="tileGlow" cx="0.25" cy="0.1" r="0.9"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".86"/><stop offset=".55" stop-color="#fff" stop-opacity=".66"/><stop offset="1" stop-color="#fff" stop-opacity=".58"/></linearGradient>
    <linearGradient id="edgeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="edgeBottom" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
    <radialGradient id="tileBottom" cx="0.5" cy="1.05" r="0.75"><stop offset="0" stop-color="${p.c1}" stop-opacity=".55"/><stop offset="1" stop-color="${p.c1}" stop-opacity="0"/></radialGradient>
    <filter id="specBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${small ? 30 : 22}"/></filter>
    <linearGradient id="head" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.header}" stop-opacity=".82"/><stop offset="1" stop-color="${p.header}" stop-opacity=".95"/></linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#E6ECF5"/></linearGradient>
    <linearGradient id="cloudFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3ECF7"/></linearGradient>
    <linearGradient id="sunFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SOFT_MOTIF ? "#FFDD7A" : "#FFD54A"}"/><stop offset="1" stop-color="${SOFT_MOTIF ? "#FFA648" : "#FF8F1F"}"/></linearGradient>
    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#E8A317"/></linearGradient>
    <linearGradient id="boltFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE48A"/><stop offset="1" stop-color="${SOFT_MOTIF ? "#FFB85C" : "#FFA726"}"/></linearGradient>
    <linearGradient id="petalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFF1B3"/></linearGradient>
    <radialGradient id="pollenCore" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#FFE15C"/><stop offset="1" stop-color="#F59E0B"/></radialGradient>
    <linearGradient id="moonFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFBEA"/><stop offset="1" stop-color="#FFE9A8"/></linearGradient>
    <linearGradient id="plusFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FA3FF"/><stop offset=".5" stop-color="#7C6CF5"/><stop offset="1" stop-color="#3DD6C1"/></linearGradient>
    <clipPath id="tileClip"><rect width="1024" height="1024" rx="228"/></clipPath>
    <clipPath id="cardClip"><rect x="140" y="${cardY}" width="744" height="${cardH}" rx="72"/></clipPath>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="${small ? 14 : 10}" stdDeviation="${small ? 14 : 12}" flood-color="${p.header}" flood-opacity=".35"/></filter>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="${p.header}" flood-opacity=".45"/></filter>
    <filter id="sunGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="${small ? 12 : 16}" flood-color="#FFB300" flood-opacity=".55"/></filter>
  </defs>
  <!-- tile -->
  <rect width="1024" height="1024" rx="228" fill="url(#tile)"/>
  <rect width="1024" height="1024" rx="228" fill="url(#tileGlow)"/>
  ${sheen}
  <rect width="1024" height="1024" rx="228" fill="url(#tileBottom)"/>
  <rect x="3" y="3" width="1018" height="1018" rx="226" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="6"/>
  <!-- calendar card -->
  <g filter="url(#cardShadow)"><rect x="140" y="${cardY}" width="744" height="${cardH}" rx="72" fill="url(#card)"/></g>
  <g clip-path="url(#cardClip)"><rect x="140" y="${cardY}" width="744" height="${headH + 72}" fill="url(#head)"/></g>
  <g clip-path="url(#cardClip)">
    <ellipse cx="330" cy="${cardY + headH + 175}" rx="${small ? 230 : 210}" ry="${small ? 55 : 48}" fill="#fff" opacity="${small ? .45 : .5}" filter="url(#specBlur)"/>
    <ellipse cx="760" cy="${cardY + cardH - 40}" rx="${small ? 200 : 170}" ry="${small ? 70 : 55}" fill="${p.c1}" opacity=".35" filter="url(#specBlur)"/>
  </g>
  <rect x="140" y="${cardY}" width="744" height="${cardH}" rx="72" fill="none" stroke="url(#edgeTop)" stroke-width="${small ? 10 : 7}"/>
  <rect x="140" y="${cardY}" width="744" height="${cardH}" rx="72" fill="none" stroke="url(#edgeBottom)" stroke-width="${small ? 8 : 5}"/>
  <rect x="140" y="${cardY}" width="744" height="${cardH}" rx="72" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>
  ${grid}
  <!-- rings -->
  <g filter="url(#softShadow)">
    <rect x="${300 - ringW / 2}" y="${ringY}" width="${ringW}" height="${ringH}" rx="${ringW / 2}" fill="url(#ring)"/>
    <rect x="${724 - ringW / 2}" y="${ringY}" width="${ringW}" height="${ringH}" rx="${ringW / 2}" fill="url(#ring)"/>
  </g>
  <!-- motif -->
  ${motif}
</svg>`;
  return raw.replace(/id="([A-Za-z]+)"/g, `id="${pre}$1"`).replace(/url\(#([A-Za-z]+)\)/g, `url(#${pre}$1)`);
}

// ---------- banner ----------
const cloudBlob = (cx, cy, r, op, blur) => {
  // soft cumulus made of circles, optional blur for depth
  const f = blur ? ` filter="url(#cloudBlur${blur})"` : '';
  return `<g fill="#fff" opacity="${op}"${f}>
    <circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx - r * 0.9}" cy="${cy + r * 0.25}" r="${r * 0.75}"/>
    <circle cx="${cx + r * 0.95}" cy="${cy + r * 0.2}" r="${r * 0.8}"/><circle cx="${cx + r * 0.3}" cy="${cy - r * 0.45}" r="${r * 0.7}"/>
    <rect x="${cx - r * 1.5}" y="${cy}" width="${r * 3.2}" height="${r * 0.8}" rx="${r * 0.4}"/></g>`;
};
function bannerSvg(p, w, h) {
  const k = w / 220;
  const lines = wrap(p.name, 21);
  const fs = 13.5 * k, lh = fs * 1.18;
  const iconSize = (lines.length > 1 ? 60 : 66) * k;
  const subFs = 8 * k;
  const total = iconSize + 7 * k + lines.length * lh + 3 * k + subFs;
  let y = (h - total) / 2;
  const icon = iconSvg(p, iconSize, false).replace('<svg ', `<svg x="${(w - iconSize) / 2}" y="${y}" `);
  y += iconSize + 7 * k + lh * 0.72;
  const text = lines.map((l, i) => `<text x="${w / 2}" y="${y + i * lh}" text-anchor="middle" font-family="Inter Display, Inter, sans-serif" font-weight="700" font-size="${fs}" fill="#fff">${l}</text>`).join('');
  y += (lines.length - 1) * lh + 3 * k + subFs * 1.05;
  const subText = p.id === 'usefuladdons' ? 'usefuladdons.com' : 'by UsefulAddons';
  const sub = `<text x="${w / 2}" y="${y}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="500" font-size="${subFs}" fill="#fff" fill-opacity=".85" letter-spacing="${0.3 * k}">${subText}</text>`;
  const clouds = SOFT_MOTIF ? `
    ${cloudBlob(28 * k, 118 * k, 16 * k, .55, 2)}${cloudBlob(190 * k, 20 * k, 13 * k, .5, 2)}
    ${cloudBlob(-6 * k, 34 * k, 18 * k, .9, 0)}${cloudBlob(222 * k, 110 * k, 22 * k, .92, 0)}
    ${cloudBlob(150 * k, 130 * k, 12 * k, .75, 1)}${cloudBlob(60 * k, 8 * k, 10 * k, .7, 1)}` : '';
  const textShadow = SOFT_MOTIF ? `<filter id="tshadow" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="${1 * k}" stdDeviation="${1.5 * k}" flood-color="${p.header}" flood-opacity=".45"/></filter>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
    <radialGradient id="bgGlow" cx="0.2" cy="0" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="cloudBlur1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${1.2 * k}"/></filter>
    <filter id="cloudBlur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${3 * k}"/></filter>
    ${textShadow}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#bgGlow)"/>
  ${clouds}
  ${icon}<g${SOFT_MOTIF ? ' filter="url(#tshadow)"' : ''}>${text}${sub}</g></svg>`;
}
function wrap(n, max) {
  if (n.length <= max) return [n];
  const words = n.split(' '); const lines = []; let cur = '';
  for (const wd of words) { if ((cur + ' ' + wd).trim().length > max) { lines.push(cur.trim()); cur = wd; } else cur = (cur + ' ' + wd); }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}
function splitName(n) {
  const parts = n.split(' ');
  if (parts.length <= 2) return [n];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
}

// ---------- render ----------
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  async function shoot(svg, w, h, file) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`);
    await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  }
  for (const p of products) {
    const dir = path.join(OUT, 'icons', p.id); fs.mkdirSync(dir, { recursive: true });
    const large = iconSvg(p, 1024, false), small = iconSvg(p, 32, true);
    fs.writeFileSync(path.join(OUT, 'svg', `${p.id}.svg`), large);
    fs.writeFileSync(path.join(OUT, 'svg', `${p.id}-32.svg`), small);
    for (const s of [1024, 512, 256, 128, 120, 96]) await shoot(iconSvg(p, s, false), s, s, path.join(dir, s === 128 ? `${p.id}.png` : s === 120 ? `${p.id}-oauth-120.png` : `${p.id}-${s}.png`));
    for (const s of [64, 48, 32]) await shoot(iconSvg(p, s, true), s, s, path.join(dir, `${p.id}-${s}.png`));
    await shoot(bannerSvg(p, 220, 140), 220, 140, path.join(dir, `${p.id}-banner.png`));
    await shoot(bannerSvg(p, 440, 280), 440, 280, path.join(dir, `${p.id}-banner@2x.png`));
    console.log('done', p.id);
  }
  // review sheet
  const cell = (p) => {
    const L = (s) => iconSvg(p, s, false), S = (s) => iconSvg(p, s, true);
    return `<div class="cell"><div class="row">${L(128)}${L(96)}${S(64)}${S(48)}${S(32)}</div><div class="lbl">${p.name}</div></div>`;
  };
  const sheet = (bg, fg) => `<div class="sheet" style="background:${bg};color:${fg}">${products.map(cell).join('')}</div>`;
  const html = `<html><head><style>body{margin:0;font-family:Inter,sans-serif}.sheet{padding:24px;display:grid;grid-template-columns:1fr 1fr;gap:18px 32px}.row{display:flex;align-items:flex-end;gap:14px}.lbl{font-size:13px;margin-top:6px;opacity:.8}svg{display:block}</style></head><body>${sheet('#ffffff', '#111')}${sheet('#1c1c1e', '#eee')}</body></html>`;
  await page.setViewportSize({ width: 1100, height: 100 });
  await page.setContent(html);
  await page.screenshot({ path: path.join(OUT, 'review-sheet.png'), fullPage: true });
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'products.json'), JSON.stringify(products, null, 2));
})();
