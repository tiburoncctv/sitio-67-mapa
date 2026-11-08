// 104 · Enfermería / 105 · Cuarentena — nivel −1. 24 × 16.
import { BODY } from '../engine.js';

const C = 40, X = (c) => (c - 1) * C, Y = (r) => (r - 1) * C, cx = (c) => X(c) + C / 2, cy = (r) => Y(r) + C / 2;
const rect = (x, y, w, h, cls, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" ${extra}/>`;

// ---------------------------------------------------------------- cuerpos propios de este escenario
BODY.anclado = (x, y) => {
  let s = `<path d="M${x - 6} ${y + 18} C${x - 10} ${y - 8} ${x + 26} ${y - 14} ${x + 40} ${y - 4} C${x + 58} ${y - 16} ${x + 92} ${y - 6} ${x + 86} ${y + 20} C${x + 100} ${y + 40} ${x + 92} ${y + 70} ${x + 78} ${y + 82} C${x + 60} ${y + 94} ${x + 30} ${y + 90} ${x + 14} ${y + 82} C${x - 6} ${y + 76} ${x - 12} ${y + 44} ${x - 6} ${y + 18} Z" class="tissue"/>`;
  s += `<g transform="rotate(-18 ${x + 40} ${y + 40})"><rect x="${x + 22}" y="${y + 2}" width="36" height="76" class="fz" style="stroke:rgba(233,236,234,.75)"/><rect x="${x + 27}" y="${y + 6}" width="26" height="12" rx="4" class="pillow" opacity=".45"/></g>`;
  s += `<path d="M${x + 10} ${y + 30} C${x + 16} ${y + 6} ${x + 50} ${y + 2} ${x + 66} ${y + 16} C${x + 82} ${y + 30} ${x + 80} ${y + 58} ${x + 64} ${y + 70} C${x + 46} ${y + 82} ${x + 18} ${y + 74} ${x + 12} ${y + 56} C${x + 8} ${y + 46} ${x + 8} ${y + 38} ${x + 10} ${y + 30} Z" class="tissue-core"/>`;
  [[30, 30, 9], [52, 24, 7], [58, 50, 10], [34, 58, 8], [70, 36, 5], [20, 44, 5]].forEach(([a, b, r]) => { s += `<circle cx="${x + a}" cy="${y + b}" r="${r}" fill="#5a1236" stroke="#ff3fa0" stroke-width=".9"/>`; });
  s += `<path d="M${x + 30} ${y + 30} C${x + 40} ${y + 38} ${x + 46} ${y + 30} ${x + 52} ${y + 24} M${x + 34} ${y + 58} C${x + 44} ${y + 50} ${x + 52} ${y + 56} ${x + 58} ${y + 50} M${x + 30} ${y + 30} C${x + 28} ${y + 44} ${x + 30} ${y + 52} ${x + 34} ${y + 58} M${x + 52} ${y + 24} C${x + 64} ${y + 30} ${x + 68} ${y + 40} ${x + 58} ${y + 50}" class="vein"/>`;
  s += `<path d="M${x + 74} ${y + 74} l8 8 M${x + 6} ${y + 10} l-7 -6" stroke="rgba(233,236,234,.7)" stroke-width="2"/>`;
  return s;
};
BODY.sentado = (x0, y0) => {
  const x = x0 + 20, y = y0 + 20;
  return `<rect x="${x - 2}" y="${y - 9}" width="18" height="18" class="fz"/><ellipse cx="${x + 6}" cy="${y}" rx="7" ry="12" class="gown"/>`
    + `<path d="M${x - 1} ${y - 6} L${x - 12} ${y - 6} M${x - 1} ${y + 6} L${x - 12} ${y + 6}" stroke="#cfd6d4" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M${x + 2} ${y - 10} C${x - 6} ${y - 16} ${x - 14} ${y - 18} ${x - 20} ${y - 16}" stroke="#b9aa8e" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    + `<circle cx="${x - 21}" cy="${y - 16}" r="3" class="skin"/><circle cx="${x + 1}" cy="${y}" r="5.5" class="skin"/>`
    + `<path d="M${x - 27} ${y - 22} l-4 -3 M${x - 28} ${y - 16} l-5 0 M${x - 27} ${y - 10} l-4 3" stroke="#e6dc4f" stroke-width="1.2" opacity=".8"/>`;
};
BODY.tumbado = (x0, y0) => {
  const x = x0 + 20, y = y0;
  return `<circle cx="${x}" cy="${y + 14}" r="7" class="skin"/><g class="breath"><ellipse cx="${x}" cy="${y + 44}" rx="11" ry="22" class="gown" style="fill:#a9b8b6"/></g>`
    + `<path d="M${x + 11} ${y + 30} C${x + 17} ${y + 42} ${x + 16} ${y + 52} ${x + 19} ${y + 58}" stroke="#b9aa8e" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
    + rect(x0 + 6, y0 + 50, 28, 24, 'sheet');
};

// ---------------------------------------------------------------- mobiliario (dibujo propio del primer prototipo)
function furniture() {
  const out = []; const add = (s) => out.push(s);
  function bed(c, r, head = 'n', occupied = false) {
    const x = X(c), y = Y(r), rot = head === 's' ? `rotate(180 ${x + 20} ${y + 40})` : '';
    add(`<g transform="${rot}">`); add(rect(x + 3, y + 2, 34, 76, 'fz'));
    add(`<rect x="${x + 7}" y="${y + 6}" width="26" height="13" rx="4" class="pillow"/>`);
    if (!occupied) { add(rect(x + 6, y + 26, 28, 48, 'sheet')); add(`<line x1="${x + 6}" y1="${y + 33}" x2="${x + 34}" y2="${y + 33}" class="fzd"/>`); } else add(rect(x + 6, y + 24, 28, 50, 'sheet'));
    add(`<line x1="${x + 1}" y1="${y + 28}" x2="${x + 1}" y2="${y + 58}" class="fzd"/><line x1="${x + 39}" y1="${y + 28}" x2="${x + 39}" y2="${y + 58}" class="fzd"/>`); add('</g>');
  }
  function monitor(c, r, state = 'off') {
    const x = X(c), y = Y(r);
    add(`<circle cx="${x + 20}" cy="${y + 24}" r="9" class="fzd"/>`); add(rect(x + 6, y + 5, 28, 18, 'screen'));
    if (state === 'irregular') add(`<polyline points="${x + 8},${y + 15} ${x + 13},${y + 15} ${x + 15},${y + 10} ${x + 17},${y + 18} ${x + 19},${y + 14} ${x + 25},${y + 14} ${x + 26},${y + 12} ${x + 28},${y + 16} ${x + 32},${y + 15}" class="wave"/>`);
    else if (state === 'on') add(`<polyline points="${x + 8},${y + 15} ${x + 14},${y + 15} ${x + 16},${y + 9} ${x + 18},${y + 19} ${x + 20},${y + 15} ${x + 32},${y + 15}" class="wave"/>`);
    else add(`<line x1="${x + 8}" y1="${y + 15}" x2="${x + 32}" y2="${y + 15}" class="wave-flat"/>`);
  }
  function iv(c, r, dx = 0, dy = 0) { const x = cx(c) + dx, y = cy(r) + dy; add(`<path d="M${x - 7} ${y + 7} L${x} ${y} L${x + 7} ${y + 7} M${x} ${y} L${x} ${y + 9}" class="fzd"/><circle cx="${x}" cy="${y}" r="3" class="fz2"/><rect x="${x - 4}" y="${y - 11}" width="8" height="7" class="sheet"/>`); }
  function cart(c, r) {
    const x = X(c), y = Y(r);
    add(rect(x + 6, y + 9, 28, 22, 'fz')); add(`<line x1="${x + 4}" y1="${y + 12}" x2="${x + 4}" y2="${y + 28}" class="fzd"/>`);
    add(rect(x + 10, y + 13, 8, 6, 'fz2') + rect(x + 21, y + 13, 9, 6, 'fz2') + rect(x + 10, y + 22, 20, 5, 'fz2'));
    [[x + 8, y + 33], [x + 32, y + 33], [x + 8, y + 7], [x + 32, y + 7]].forEach(([a, b]) => add(`<circle cx="${a}" cy="${b}" r="1.6" fill="rgba(233,236,234,.6)"/>`));
  }
  function cabinets(c, r, n) {
    const x = X(c), y = Y(r) + 14, w = n * C; add(rect(x + 2, y, w - 4, 24, 'fz'));
    for (let i = 1; i < n * 2; i++) add(`<line x1="${x + i * 20}" y1="${y + 2}" x2="${x + i * 20}" y2="${y + 22}" class="fzd"/>`);
    for (let i = 0; i < n * 2; i++) add(`<line x1="${x + i * 20 + (i % 2 ? 4 : 16)}" y1="${y + 6}" x2="${x + i * 20 + (i % 2 ? 4 : 16)}" y2="${y + 11}" stroke="rgba(233,236,234,.7)" stroke-width="1.4"/>`);
  }
  function shelf(c1, r1, c2, r2) {
    const x = X(c1), y = Y(r1), w = (c2 - c1 + 1) * C, h = (r2 - r1 + 1) * C, horiz = w >= h;
    const sx = horiz ? x + 2 : x + 6, sy = horiz ? y + 6 : y + 2, sw = horiz ? w - 4 : 28, sh = horiz ? 28 : h - 4;
    add(rect(sx, sy, sw, sh, 'fz'));
    if (horiz) { for (let i = sx + 10; i < sx + sw; i += 10) add(`<line x1="${i}" y1="${sy + 3}" x2="${i}" y2="${sy + sh - 3}" class="fzd"/>`); add(`<line x1="${sx}" y1="${sy + sh / 2}" x2="${sx + sw}" y2="${sy + sh / 2}" class="fzd"/>`); }
    else { for (let i = sy + 10; i < sy + sh; i += 10) add(`<line x1="${sx + 3}" y1="${i}" x2="${sx + sw - 3}" y2="${i}" class="fzd"/>`); add(`<line x1="${sx + sw / 2}" y1="${sy}" x2="${sx + sw / 2}" y2="${sy + sh}" class="fzd"/>`); }
    for (let k = 0; k < 3; k++) { const bx = horiz ? sx + 8 + k * ((sw - 24) / 2) : sx + 5, by = horiz ? sy + 5 : sy + 8 + k * ((sh - 24) / 2); add(rect(bx, by, horiz ? 10 : 9, horiz ? 9 : 10, 'fz2')); }
  }
  function lockers(c, r, n, side = 'n') { const x = X(c), y = side === 'n' ? Y(r) + 3 : Y(r) + C - 21, w = n * C; add(rect(x + 2, y, w - 4, 18, 'fz')); for (let i = 1; i < n * 3; i++) add(`<line x1="${x + 2 + i * (w - 4) / (n * 3)}" y1="${y}" x2="${x + 2 + i * (w - 4) / (n * 3)}" y2="${y + 18}" class="fzd"/>`); }
  function bench(x, y, w, h) { add(rect(x, y, w, h, 'fz')); add(`<line x1="${x + w / 2}" y1="${y + 3}" x2="${x + w / 2}" y2="${y + h - 3}" class="fzd"/>`); }
  function sink(c, r) { const x = X(c), y = Y(r); add(rect(x + 6, y + C - 22, 28, 18, 'fz')); add(`<ellipse cx="${x + 20}" cy="${y + C - 12}" rx="9" ry="5" class="fzd"/>`); }
  function bin(c, r) { const x = cx(c), y = cy(r); add(`<circle cx="${x}" cy="${y}" r="11" class="fz"/><circle cx="${x}" cy="${y}" r="6" class="fzd"/><path d="M${x - 3} ${y + 1} L${x} ${y - 4} L${x + 3} ${y + 1} Z" fill="#e6dc4f" opacity=".8"/>`); }

  bed(8, 1); monitor(9, 1); bed(10, 1); bed(12, 1); monitor(13, 1); bed(14, 1); iv(9, 2, 0, 6); iv(13, 2, 0, 6);
  bed(17, 15, 's'); monitor(16, 16);
  add('<path d="M42 126 H174 V42 H198 V152 H42 Z" class="fz"/>');
  add(rect(56, 130, 26, 16, 'screen') + '<polyline points="58,139 64,139 66,134 68,143 70,139 80,139" class="wave"/>');
  add(rect(98, 130, 26, 16, 'screen') + '<line x1="100" y1="138" x2="122" y2="138" class="wave-flat"/>');
  add(rect(178, 62, 16, 26, 'screen'));
  add('<circle cx="100" cy="98" r="11" class="fz2"/><rect x="92" y="108" width="16" height="5" class="fz2"/>');
  add(rect(46, 4, 72, 10, 'fz') + rect(52, 6, 26, 6, 'screen') + rect(84, 6, 26, 6, 'screen'));
  cart(6, 6); cart(13, 7); cart(16, 10); cart(8, 11);
  cabinets(10, 16, 4); sink(8, 16);
  const x0 = X(10), y0 = Y(11), cxm = x0 + 60, cym = y0 + 20;
  add(`<g transform="rotate(-5 ${cxm} ${cym})"><rect x="${x0 + 4}" y="${y0 + 9}" width="112" height="22" class="fz"/><path d="M${x0 + 14} ${y0 + 9} L${x0 + 20} ${y0 + 31} M${x0 + 106} ${y0 + 9} L${x0 + 100} ${y0 + 31} M${x0 + 30} ${y0 + 20} H${x0 + 90}" class="fzd"/>`);
  [[x0 + 10, y0 + 6], [x0 + 110, y0 + 6], [x0 + 10, y0 + 34], [x0 + 110, y0 + 34]].forEach(([a, b]) => add(`<circle cx="${a}" cy="${b}" r="4.2" class="fz2"/><circle cx="${a}" cy="${b}" r="1.3" fill="rgba(233,236,234,.8)"/>`));
  add(`</g><rect x="${x0 + 44}" y="${y0 + 14}" width="60" height="16" rx="3" transform="rotate(9 ${x0 + 74} ${y0 + 22})" class="sheet"/>`);
  shelf(1, 9, 5, 9); shelf(1, 10, 1, 12); shelf(3, 11, 4, 11);
  bench(6, 486, 26, 72); lockers(6, 13, 2, 'n'); bin(7, 16);
  bed(21, 1, 'n'); monitor(22, 1, 'on'); add(rect(X(21) + 6, Y(5) + 8, 28, 24, 'fz'));
  bed(20, 9, 'n', true); monitor(21, 9, 'irregular'); iv(19, 9, 8, 0);
  add(rect(X(23) + 2, Y(4) + 4, 6, 14, 'fz2') + rect(X(23) + 2, Y(10) + 4, 6, 14, 'fz2'));
  lockers(19, 16, 4, 's'); bench(X(24) + 18, Y(15) + 4, 18, 72);
  return out.join('');
}

export default {
  id: 'enfermeria', floor: 'N1', rooms: ['104', '105'], short: '104 / 105 · Enfermería y cuarentena',
  crumb: 'SITIO-67 / BETA-7 / NIVEL −1', title: '104 · ENFERMERÍA / 105 · CUARENTENA',
  objective: 'Localizar a los dos supervivientes y mantener el aislamiento',
  meta: 'NIVEL −1 · 104 / 105 · VISTA CENITAL', cols: 24, rows: 16, margin: { l: 66, t: 32, r: 12, b: 36 },
  legend: ['wall', 'low', 'glass', 'door', 'qdoor', 'ag', 'en', 'npc', 'tissue'],
  states: [],
  starts: [{ c: 5, r: 14 }],
  initialSel: 'e1',
  notes: [
    'Escenario de apariencia, no un encuentro balanceado. Sin técnico de contención ni demoliciones obligatorios.',
    'El cristal sellado (col. 18, filas 1–12) permite observar, pero no se atraviesa ni se dispara a través de él.',
    'Propuesta inicial del equipo: C (5,14) · M (3,13) · L (8,14) · T (2,15). Inserta los iconos a mano.',
    'No mostrar «infectado» ni la futura transformación de los supervivientes en la vista de jugadores.',
  ],
  items: [
    { t: 'raw', layer: 'base', svg: () => '<rect x="-58" y="-8" width="40" height="656" class="fl-out"/><rect x="-58" y="650" width="1010" height="26" class="fl-out"/><path d="M-18 -8 H-58 V676 H952" class="out-edge"/><text class="lb-ext" x="-38" y="440" transform="rotate(-90 -38 440)">PASILLO · NIVEL −1</text><text class="lb-ext" x="520" y="667">PASILLO · NIVEL −1</text><path d="M-30 260 H-10 M-17 254 L-10 260 L-17 266" stroke="#48d8d8" stroke-width="1.6" fill="none"/><path d="M120 672 V654 M114 661 L120 654 L126 661" stroke="#48d8d8" stroke-width="1.6" fill="none"/>' },
    { t: 'floor', c: 1, r: 1, w: 18, h: 16, s: 'room' },
    { t: 'floor', c: 1, r: 9, w: 6, h: 4, s: 'dark' },
    { t: 'floor', c: 1, r: 13, w: 7, h: 4, s: 'decon' },
    { t: 'floor', c: 19, r: 1, w: 4, h: 12, s: 'iso' },
    { t: 'floor', c: 23, r: 1, w: 2, h: 12, s: 'corr' },
    { t: 'floor', c: 19, r: 13, w: 6, h: 4, s: 'decon' },
    { t: 'mark', k: 'grate', c: 3, r: 15, w: 2, h: 2 },
    { t: 'mark', k: 'grate', c: 21, r: 13, w: 2, h: 2 },
    { t: 'raw', layer: 'base', svg: () => '<path d="M268 524 V596" class="tape"/><path d="M84 628 H156" class="tape"/><path d="M732 484 V516" class="tape"/><path d="M884 492 H956" class="tape"/>' },
    { t: 'raw', layer: 'mobiliario', svg: furniture },
    { t: 'tissue', fil: ['M622 132 C650 100 670 70 700 30', 'M630 140 C660 120 690 90 712 60', 'M612 124 C620 90 640 40 660 10', 'M640 176 C668 190 690 200 712 214', 'M600 200 C596 228 610 250 600 280', 'M566 190 C540 214 520 222 500 236', 'M570 130 C548 112 532 108 520 96', 'M626 196 C640 232 668 250 690 262', 'M584 120 C584 96 596 70 590 46'],
      blobs: [[17.2, 0.3, 9], [17.6, 0.55, 7], [16.8, 0.2, 6], [17.7, 1, 5], [16.4, 0.35, 4], [17.4, 1.3, 4]] },
    { t: 'walls', segs: [[0, 0, 24, 0], [0, 0, 0, 16], [0, 16, 24, 16], [24, 0, 24, 16], [18, 12, 18, 16], [22, 0, 22, 12], [18, 6, 22, 6], [18, 12, 24, 12], [0, 8, 6, 8], [6, 8, 6, 12], [0, 12, 7, 12], [7, 12, 7, 16]] },
    { t: 'glass', segs: [[18, 0, 18, 12]] },
    { t: 'door', x: 2, y: 16, o: 'h', n: 2, k: 'double', sw: -1 },
    { t: 'door', x: 0, y: 6, o: 'v', n: 1, k: 'swing', sw: 1 },
    { t: 'door', x: 6, y: 10, o: 'v', n: 1, k: 'swing', sw: -1 },
    { t: 'door', x: 7, y: 13, o: 'v', n: 2, k: 'double', sw: 1 },
    { t: 'door', x: 22, y: 3, o: 'v', n: 1, k: 'quar', label: 'PUERTA A', lx: 22.25, ly: 2.85, anchor: 'start' },
    { t: 'door', x: 22, y: 9, o: 'v', n: 1, k: 'quar', label: 'PUERTA B', lx: 22.25, ly: 8.85, anchor: 'start' },
    { t: 'door', x: 18, y: 12, o: 'v', n: 1, k: 'quar', label: 'ESC. EXT.', lx: 17.7, ly: 12.55, anchor: 'end' },
    { t: 'door', x: 22, y: 12, o: 'h', n: 2, k: 'quar', label: 'ESC. INT.', lx: 23.85, ly: 11.62, anchor: 'end' },
    { t: 'label', x: 9.5, y: 5.9, text: '104 · ENFERMERÍA', s: 'code' }, { t: 'label', x: 9.5, y: 6.35, text: 'SALA DE ATENCIÓN', s: 'room' },
    { t: 'label', x: 3, y: 11.5, text: 'ALMACÉN MÉDICO', s: 'room' },
    { t: 'label', x: 5.55, y: 14.85, text: 'DESCONTAMINACIÓN', s: 'room' },
    { t: 'label', x: 20, y: 5.7, text: 'AISLAMIENTO A', s: 'room' }, { t: 'label', x: 20, y: 11.7, text: 'AISLAMIENTO B', s: 'room' },
    { t: 'label', x: 23.6, y: 6.25, text: '105 · CUARENTENA · CORREDOR', s: 'room', rot: -90 },
    { t: 'label', x: 20, y: 15, text: '105 · ESCLUSA', s: 'room' },
    { t: 'label', x: 18.25, y: 7.5, text: 'CRISTAL SELLADO', s: 'small', rot: -90, cyan: true },
    { t: 'label', x: 2.6, y: 4.1, text: 'MOSTRADOR DE CONTROL', s: 'small' },
  ],
  contacts: [
    { id: 'e1', kind: 'en', code: 'E1', name: 'Errante', c: 11, r: 10, body: 'errante',
      desc: 'Silueta humana deformada, de pie entre las camas del norte y la camilla volcada. Brazos alargados y asimétricos; tejido expuesto en hombro y costado.',
      note: 'PV 10 · DEF 11 · MOV 4. Ocupa 1 casilla.' },
    { id: 'e2', kind: 'en', code: 'E2', name: 'Anclado', c: 15, r: 4, w: 2, h: 2, body: 'anclado',
      desc: 'Masa inmóvil que ha absorbido una cama. El crecimiento trepa hacia la pared noreste y deja filamentos sobre el suelo.',
      note: 'PV 22 · DEF 10 · MOV 0. Ocupa 2 × 2 (col. 15–16, filas 4–5). No se desplaza.' },
    { id: 'v1', kind: 'npc', code: 'V1', name: 'Superviviente', c: 20, r: 3, body: 'sentado', revealed: true,
      desc: 'Aislamiento A. Consciente, sentado e incorporado frente al cristal; levanta la mano e intenta comunicarse con quien esté en la sala.',
      note: 'Condición clínica real reservada a dirección.' },
    { id: 'v2', kind: 'npc', code: 'V2', name: 'Superviviente', c: 20, r: 9, body: 'tumbado', revealed: true,
      desc: 'Aislamiento B. Tumbado en la cama; respiración irregular y movimiento débil.',
      note: 'Condición clínica real reservada a dirección.' },
  ],
};
